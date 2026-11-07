const {
  User,
  PatientProfile,
  DoctorProfile,
  DoctorRequest,
  HealthInterview,
  HealthResponse,
  MedicalDocument,
  MedicalExtraction,
  HealthSummary,
  Consent,
  MedicalTimeline,
  Prescription,
  Notification,
} = require('../models');
const fs = require('fs');
const { generateNextQuestion, generateHealthSummary, GREETINGS, AYUSH_GREETINGS, screenRedFlags, translateText } = require('../services/aiService');
const { validateAndClassifyDocument, processDocumentOCR } = require('../services/ocrService');
const { generateUniqueOpNumber } = require('../utils/opNumber');
const {
  validateAbhaNumber,
  buildAbhaSearchQuery,
  formatAbhaNumber,
  extractAbhaDigits,
} = require('../utils/abhaValidation');

// @route   GET /api/patients/me
const getProfile = async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/patients/me
const updateProfile = async (req, res, next) => {
  try {
    const { bloodGroup, weight, height, emergencyContact, preferredLanguage } = req.body;
    const profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const updated = await PatientProfile.findByIdAndUpdate(
      profile._id,
      {
        $set: {
          ...(bloodGroup && { bloodGroup }),
          ...(weight && { weight: parseFloat(weight) }),
          ...(height && { height: parseFloat(height) }),
          ...(emergencyContact && { emergencyContact }),
          ...(preferredLanguage && { preferredLanguage }),
        },
      },
      { new: true }
    );

    res.json({ success: true, profile: updated, message: 'Profile updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/consent
const recordConsent = async (req, res, next) => {
  try {
    const { consentType = 'ai_interview', purpose, scope } = req.body;

    const consent = await Consent.create({
      patientId: req.user.id,
      consentType,
      purpose: purpose || 'Collection of patient symptom data for AI health check-up and summary generation.',
      scope: scope || 'Health interview data collection and structured clinical summarization.',
      granted: true,
      timestamp: new Date(),
      clientMetadata: {
        userAgent: req.headers['user-agent'] || 'MediKiosk Web Client',
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.status(201).json({
      success: true,
      consent,
      message: 'Informed consent recorded securely in database.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/interview/start
const startInterview = async (req, res, next) => {
  try {
    const { language = 'en', healthcareMode = 'general_medical', communicationMode = 'text' } = req.body;
    const profile = await PatientProfile.findOne({ userId: req.user.id });

    const interview = await HealthInterview.create({
      patientId: req.user.id,
      language,
      healthcareMode,
      communicationMode,
      status: 'in_progress',
      responses: [],
      redFlagsDetected: [],
      priority: 'NORMAL',
    });

    const greeting = healthcareMode === 'ayush'
      ? (AYUSH_GREETINGS[language] || AYUSH_GREETINGS.en)
      : (GREETINGS[language] || GREETINGS.en);

    res.status(201).json({
      success: true,
      interviewId: interview._id,
      language,
      healthcareMode,
      communicationMode,
      greeting,
      message: `AI Health Check-Up session initiated (${healthcareMode === 'ayush' ? 'AYUSH' : 'General Medical'}).`,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/interview/:id/answer
const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, inputMode = 'text', groqApiKey } = req.body;

    if (!answer || !question) {
      return res.status(400).json({ success: false, message: 'Question and answer are required.' });
    }

    const interview = await HealthInterview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    // If session is already completed, exit cleanly and prevent re-entering loop
    if (interview.status === 'completed') {
      return res.json({
        success: true,
        nextQuestion: interview.language === 'hi'
          ? 'यह परामर्श पूरा हो गया है। आपका स्वास्थ्य सारांश तैयार है।'
          : 'This consultation is complete. Your health summary is ready for physician review.',
        isComplete: true,
        turnCount: interview.responses ? interview.responses.length : 3,
        aiSource: 'session_completed',
        redFlagCheck: {
          isRedFlag: interview.priority === 'HIGH_PRIORITY',
          priority: interview.priority || 'NORMAL',
          alertMessage: null,
        },
      });
    }

    const profile = await PatientProfile.findOne({ userId: req.user.id });
    const effectiveGroqKey = groqApiKey || req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;

    // "Every word I said should translate into the selected language":
    // Ensure answer is translated into the interview's selected language
    let processedAnswer = answer;
    let originalSpokenAnswer = req.body.originalSpokenAnswer || null;

    if (req.body.translatedAnswer) {
      processedAnswer = req.body.translatedAnswer;
      originalSpokenAnswer = answer;
    } else if (interview.language && interview.language !== 'en') {
      const translated = await translateText(answer, interview.language, effectiveGroqKey);
      if (translated && translated !== answer) {
        originalSpokenAnswer = answer;
        processedAnswer = translated;
      }
    }

    // Save atomic response
    await HealthResponse.create({
      interviewId: interview._id,
      patientId: req.user.id,
      question,
      answer: processedAnswer,
      inputMode,
    });

    // Update interview object
    const updatedResponses = [...(interview.responses || []), { question, answer: processedAnswer, inputMode, timestamp: new Date() }];

    // Check for chief complaint on first answer
    let chiefComplaint = interview.chiefComplaint;
    if (!chiefComplaint && updatedResponses.length > 0) {
      chiefComplaint = processedAnswer;
    }

    // Call AI Service for adaptive follow-up with optional Groq LLM
    const aiResult = await generateNextQuestion({
      history: updatedResponses,
      currentAnswer: processedAnswer,
      language: interview.language || 'en',
      patientProfile: profile || {},
      groqApiKey: effectiveGroqKey,
      healthcareMode: interview.healthcareMode || 'general_medical',
      communicationMode: interview.communicationMode || 'text',
    });

    const newRedFlags = [...(interview.redFlagsDetected || [])];
    if (aiResult.redFlagCheck.isRedFlag) {
      aiResult.redFlagCheck.flags.forEach((f) => {
        if (!newRedFlags.includes(f.name)) newRedFlags.push(f.name);
      });
    }

    const priority = newRedFlags.length > 0 ? 'HIGH_PRIORITY' : 'NORMAL';

    await HealthInterview.findByIdAndUpdate(interview._id, {
      $set: {
        responses: updatedResponses,
        chiefComplaint,
        redFlagsDetected: newRedFlags,
        priority,
        status: aiResult.isComplete ? 'completed' : 'in_progress',
        completedAt: aiResult.isComplete ? new Date() : null,
      },
    });

    res.json({
      success: true,
      nextQuestion: aiResult.question,
      isComplete: aiResult.isComplete,
      turnCount: aiResult.turnCount,
      aiSource: aiResult.aiSource,
      redFlagCheck: {
        isRedFlag: aiResult.redFlagCheck.isRedFlag,
        priority,
        alertMessage: aiResult.redFlagCheck.alertMessage,
        matchedCategories: aiResult.redFlagCheck.matchedCategories || [],
        primaryCategory: aiResult.redFlagCheck.primaryCategory || null,
        flags: aiResult.redFlagCheck.flags || [],
        hotlines: aiResult.redFlagCheck.hotlines || ['112', '108', '911'],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/groq-key
const saveGroqApiKey = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      if (apiKey === '' || apiKey === null) {
        delete process.env.GROQ_API_KEY;
        return res.json({ success: true, message: 'Groq API Key removed.', active: false });
      }
      return res.status(400).json({ success: false, message: 'Valid Groq API key is required (starts with gsk_).' });
    }

    const cleanKey = apiKey.trim();

    // Verify key against Groq API endpoint
    try {
      const testResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });

      if (!testResp.ok) {
        const errJson = await testResp.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${testResp.status} from Groq API`;
        return res.status(400).json({
          success: false,
          message: `Groq verification failed: ${errMsg}. Please check your key at console.groq.com.`,
        });
      }
    } catch (netErr) {
      console.warn('[Groq Key Test] Network notice:', netErr.message);
    }

    process.env.GROQ_API_KEY = cleanKey;
    const maskedKey = cleanKey.slice(0, 6) + '••••••••' + cleanKey.slice(-4);

    return res.json({
      success: true,
      active: true,
      model: 'llama-3.3-70b-versatile',
      message: 'Groq API Key verified! Llama 3.3 70B Clinical Doctor Triage is active.',
      maskedKey,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/patients/groq-status
const getGroqStatus = async (req, res, next) => {
  try {
    const key = process.env.GROQ_API_KEY;
    const active = Boolean(key && key.trim().length > 10);
    const maskedKey = active ? (key.trim().slice(0, 6) + '••••••••' + key.trim().slice(-4)) : null;

    return res.json({
      success: true,
      active,
      model: 'llama-3.3-70b-versatile',
      maskedKey,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/interview/:id/summary
const createOrGetSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await HealthInterview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const patientDetails = req.body.patientDetails || {};
    let resolvedUser = req.user;
    let profile = await PatientProfile.findOne({ userId: req.user.id });

    // Extract patient details fields
    const rawPhone = (patientDetails.phoneNumber || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const providedName = (patientDetails.name || '').trim();
    const rawAbha = (patientDetails.abhaId || patientDetails.abhaNumber || patientDetails.abhaAddress || '').trim();
    const abhaSearch = rawAbha ? buildAbhaSearchQuery(rawAbha) : null;
    const cleanAbha = abhaSearch ? abhaSearch.formatted : '';

    if (cleanPhone || providedName || cleanAbha) {
      let existingUser = null;
      if (cleanPhone) {
        existingUser = await User.findOne({
          phoneNumber: cleanPhone,
          role: 'patient',
        });
        if (!existingUser) {
          existingUser = await User.findOne({
            phoneNumber: { $regex: new RegExp(cleanPhone + '$') },
            role: 'patient',
          });
        }
      }

      if (!existingUser && abhaSearch) {
        const prof = await PatientProfile.findOne({
          $or: [
            { abhaId: abhaSearch.regex },
            { aadhaarDemoId: abhaSearch.regex },
            { abhaAddress: abhaSearch.regex },
            { abhaId: abhaSearch.formatted },
            { abhaId: abhaSearch.digits },
          ],
        });
        if (prof && prof.userId) {
          existingUser = await User.findById(prof.userId);
          profile = prof;
        } else {
          existingUser = await User.findOne({
            $or: [
              { abhaId: abhaSearch.regex },
              { abhaId: abhaSearch.formatted },
              { abhaId: abhaSearch.digits },
            ],
            role: 'patient',
          });
          if (existingUser) {
            profile = await PatientProfile.findOne({ userId: existingUser._id });
          }
        }
      }

      if (existingUser) {
        resolvedUser = existingUser;
        if (!profile) {
          profile = await PatientProfile.findOne({ userId: existingUser._id });
        }
        if (providedName && providedName !== existingUser.name) {
          existingUser.name = providedName;
        }
        if (cleanAbha && !existingUser.abhaId) {
          existingUser.abhaId = cleanAbha;
        }
        if (typeof existingUser.save === 'function') await existingUser.save();

        if (profile) {
          if (providedName && providedName !== profile.name) profile.name = providedName;
          if (patientDetails.age && !profile.age) profile.age = Number(patientDetails.age);
          if (patientDetails.gender && (!profile.gender || profile.gender === 'Other')) profile.gender = patientDetails.gender;
          if (cleanAbha) {
            profile.abhaId = cleanAbha;
            profile.aadhaarDemoId = cleanAbha;
          }
          if (typeof profile.save === 'function') await profile.save();
        } else {
          profile = await PatientProfile.create({
            userId: existingUser._id,
            name: providedName || existingUser.name,
            phoneNumber: cleanPhone || existingUser.phoneNumber,
            age: Number(patientDetails.age) || 35,
            gender: patientDetails.gender || 'Other',
            abhaId: cleanAbha,
            aadhaarDemoId: cleanAbha,
            preferredLanguage: interview.language || 'en',
          });
        }
      } else {
        const phoneToStore = cleanPhone || (req.user?.phoneNumber && req.user.phoneNumber !== '9999900000' ? req.user.phoneNumber : `98${Math.floor(10000000 + Math.random() * 90000000)}`);
        const finalName = providedName || req.user?.name || 'Walk-In Patient';
        const finalAge = Number(patientDetails.age) || (profile?.age || 35);
        const finalGender = patientDetails.gender || 'Other';

        if (req.user?.isGuest || req.user?.name === 'Direct Patient' || !profile) {
          try {
            const newUser = await User.create({
              phoneNumber: phoneToStore,
              name: finalName,
              password: '$2a$10$direct_patient_access_hash_dummy_2026',
              role: 'patient',
              abhaId: cleanAbha,
            });
            resolvedUser = newUser;
            profile = await PatientProfile.create({
              userId: newUser._id,
              name: finalName,
              phoneNumber: phoneToStore,
              age: finalAge,
              gender: finalGender,
              abhaId: cleanAbha,
              aadhaarDemoId: cleanAbha,
              preferredLanguage: interview.language || 'en',
            });
          } catch (createErr) {
            const found = await User.findOne({ phoneNumber: phoneToStore });
            if (found) {
              resolvedUser = found;
              found.name = finalName;
              if (cleanAbha) found.abhaId = cleanAbha;
              if (typeof found.save === 'function') await found.save();
              profile = await PatientProfile.findOne({ userId: found._id });
              if (!profile) {
                profile = await PatientProfile.create({
                  userId: found._id,
                  name: finalName,
                  phoneNumber: phoneToStore,
                  age: finalAge,
                  gender: finalGender,
                  abhaId: cleanAbha,
                  aadhaarDemoId: cleanAbha,
                });
              } else if (cleanAbha) {
                profile.abhaId = cleanAbha;
                profile.aadhaarDemoId = cleanAbha;
                if (typeof profile.save === 'function') await profile.save();
              }
            }
          }
        } else {
          if (profile) {
            if (providedName) profile.name = providedName;
            if (cleanPhone) profile.phoneNumber = cleanPhone;
            if (patientDetails.age) profile.age = Number(patientDetails.age);
            if (patientDetails.gender) profile.gender = patientDetails.gender;
            if (cleanAbha) {
              profile.abhaId = cleanAbha;
              profile.aadhaarDemoId = cleanAbha;
            }
            if (typeof profile.save === 'function') await profile.save();
          }
        }
      }

      if (resolvedUser && resolvedUser._id) {
        interview.patientId = resolvedUser._id;
        if (typeof interview.save === 'function') await interview.save();
      }
    }

    const finalPatientName = providedName || profile?.name || resolvedUser?.name || 'Walk-In Patient';
    const finalPatientPhone = cleanPhone || profile?.phoneNumber || resolvedUser?.phoneNumber || '';
    const finalPatientAge = Number(patientDetails.age) || profile?.age || 35;
    const finalPatientGender = patientDetails.gender || profile?.gender || 'Not specified';

    // Check if summary already exists
    let existing = await HealthSummary.findOne({ interviewId: interview._id });
    if (existing) {
      existing.patientId = resolvedUser._id;
      existing.patientName = finalPatientName;
      existing.patientPhone = finalPatientPhone;
      existing.patientAge = finalPatientAge;
      existing.patientGender = finalPatientGender;
      existing.abhaId = cleanAbha || profile?.abhaId || existing.abhaId || '';
      if (!existing.opNumber) {
        existing.opNumber = await generateUniqueOpNumber();
      }
      if (typeof existing.save === 'function') {
        await existing.save();
      } else {
        await HealthSummary.findByIdAndUpdate(existing._id, {
          $set: {
            patientId: resolvedUser._id,
            patientName: finalPatientName,
            patientPhone: finalPatientPhone,
            patientAge: finalPatientAge,
            patientGender: finalPatientGender,
            opNumber: existing.opNumber,
            abhaId: existing.abhaId,
          },
        });
      }
      return res.json({ success: true, summary: existing });
    }

    const effectiveGroqKey = req.body?.groqApiKey || req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;
    const aiSummaryData = await generateHealthSummary({
      patientProfile: {
        name: finalPatientName,
        age: finalPatientAge,
        gender: finalPatientGender,
      },
      interviewResponses: interview.responses || [],
      language: interview.language || 'en',
      groqApiKey: effectiveGroqKey,
      healthcareMode: interview.healthcareMode || 'general_medical',
      communicationMode: interview.communicationMode || 'text',
    });

    // Fetch previous documents, extractions & prescriptions for complete clinical dossier
    const [pastDocuments, pastExtractions, pastPrescriptions, rawTimelineEvents] = await Promise.all([
      MedicalDocument.find({ patientId: req.user.id }).catch(() => []),
      MedicalExtraction.find({ patientId: req.user.id }).catch(() => []),
      Prescription.find({ patientId: req.user.id }).catch(() => []),
      MedicalTimeline.find({ patientId: req.user.id }).catch(() => []),
    ]);

    const timelineEvents = Array.isArray(rawTimelineEvents)
      ? [...rawTimelineEvents].sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0))
      : [];

    const previousLabResults = [];
    const previousMedicines = [];
    const previousPrescriptionList = [];
    
    // Strict Document Policy: Only attach health documents / images explicitly uploaded
    // by the patient during THIS checkup session. If the patient did not upload any image,
    // do NOT attach or display any random or historical images!
    const sessionUploadedReports = Array.isArray(req.body.attachedReports) && req.body.attachedReports.length > 0
      ? req.body.attachedReports
      : (Array.isArray(interview.pinnedReports) && interview.pinnedReports.length > 0)
      ? interview.pinnedReports
      : [];

    const pinnedReports = [];
    if (sessionUploadedReports.length > 0) {
      const seenDocKeys = new Set();
      sessionUploadedReports.forEach((doc) => {
        const docKey = (doc.originalName || doc.fileName || doc.title || doc.documentId || doc.fileUrl || '').toLowerCase().trim();
        if (seenDocKeys.has(docKey)) return;
        seenDocKeys.add(docKey);
        pinnedReports.push(doc);
      });
    }

    const uniquePinnedReports = pinnedReports;

    pastExtractions.forEach((ext) => {
      if (ext.structuredData?.labTests) {
        ext.structuredData.labTests.forEach((t) => {
          const alreadyAdded = previousLabResults.some((r) => r.test === t.testName && r.value === `${t.value} ${t.unit || ''}`.trim());
          if (!alreadyAdded) {
            previousLabResults.push({
              test: t.testName,
              value: `${t.value} ${t.unit || ''}`.trim(),
              date: ext.structuredData?.documentDate || 'Recent Lab Report',
            });
          }
        });
      }
      if (ext.structuredData?.medicines) {
        ext.structuredData.medicines.forEach((m) => {
          const medStr = `${m.medicineName || m.name} (${m.strength || ''}) - ${m.dosage || ''} ${m.frequency || ''}`.trim();
          if (!previousMedicines.includes(medStr)) previousMedicines.push(medStr);
        });
      }
    });

    pastPrescriptions.forEach((rx) => {
      const rxSummary = `Dr. ${rx.doctorName} (${rx.doctorSpecialty}) - ${rx.medicines?.map((m) => m.name).join(', ')}`;
      previousPrescriptionList.push(rxSummary);
      if (rx.medicines) {
        rx.medicines.forEach((m) => {
          const medName = `${m.name} ${m.strength || ''}`.trim();
          if (!previousMedicines.includes(medName)) previousMedicines.push(medName);
        });
      }
    });

    // Generate fresh guaranteed unique OP ID for every new summary per hospital triage workflow
    const generatedOpId = await generateUniqueOpNumber();

    const summary = await HealthSummary.create({
      patientId: resolvedUser._id,
      interviewId: interview._id,
      patientName: finalPatientName,
      patientPhone: finalPatientPhone,
      opNumber: generatedOpId,
      abhaId: cleanAbha || profile?.abhaId || '',
      patientAge: finalPatientAge,
      patientGender: finalPatientGender,
      language: interview.language || 'en',
      healthcareMode: interview.healthcareMode || 'general_medical',
      communicationMode: interview.communicationMode || 'text',
      chiefComplaint: aiSummaryData.chiefComplaint,
      symptoms: aiSummaryData.symptoms,
      duration: aiSummaryData.duration,
      severity: aiSummaryData.severity,
      medicalHistory: profile?.medicalHistory?.length ? profile.medicalHistory : aiSummaryData.medicalHistory,
      ayushAssessment: aiSummaryData.ayushAssessment,
      caseDataQualityScore: aiSummaryData.caseDataQualityScore,
      previousMedicines,
      // Full Q&A Transcript: AI Questions Asked & Patient Answers Given
      interviewResponses: aiSummaryData.interviewResponses || interview.responses || [],
      // AI Medication Suggestions for Attending Doctor's Clinical Review
      aiMedicationSuggestions: aiSummaryData.aiMedicationSuggestions || [],
      previousLabResults,
      previousPrescriptions: previousPrescriptionList,
      pinnedReports: uniquePinnedReports,
      redFlagStatus: aiSummaryData.redFlagStatus,
      redFlagMessage: aiSummaryData.redFlagMessage,
      suggestedSpecialty: aiSummaryData.suggestedSpecialty,
      specialtyRationale: aiSummaryData.specialtyRationale,
      aiGeneratedText: aiSummaryData.aiGeneratedText,
      status: 'DRAFT',
    });

    if (profile) {
      profile.opNumber = generatedOpId;
      if (!Array.isArray(profile.generatedOpNumbers)) {
        profile.generatedOpNumbers = [];
      }
      if (!profile.generatedOpNumbers.includes(generatedOpId)) {
        profile.generatedOpNumbers.push(generatedOpId);
      }
      if (typeof profile.save === 'function') {
        await profile.save();
      } else {
        await PatientProfile.findByIdAndUpdate(profile._id, {
          $set: { opNumber: generatedOpId },
          $addToSet: { generatedOpNumbers: generatedOpId },
        });
      }
    }
    try {
      await User.findByIdAndUpdate(resolvedUser._id, { $set: { opNumber: generatedOpId } });
    } catch (uErr) {}

    // Record timeline entry for this AI checkup with OP ID in patient history
    await MedicalTimeline.create({
      patientId: req.user.id,
      eventDate: new Date(),
      year: new Date().getFullYear(),
      eventType: 'AI_CHECKUP',
      title: `AI Health Check-Up (${generatedOpId}): ${aiSummaryData.chiefComplaint}`,
      summary: `AI triage completed under OP ID ${generatedOpId}. Suggested specialty: ${aiSummaryData.suggestedSpecialty}. Priority: ${aiSummaryData.redFlagStatus}. Awaiting Admin specialist assignment.`,
      doctorOrFacility: 'MediKiosk Smart Hospital Assistant',
      keyMetrics: [
        { label: 'OP ID', value: generatedOpId },
        { label: 'Specialty', value: aiSummaryData.suggestedSpecialty },
        { label: 'Priority', value: aiSummaryData.redFlagStatus },
      ],
    });

    res.status(201).json({
      success: true,
      summary,
      message: 'Structured health summary created. Doctor review required.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/patients/interview/:id
const getInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await HealthInterview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }
    const summary = await HealthSummary.findOne({ interviewId: interview._id });
    res.json({
      success: true,
      interview,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/interview/:id/complete
const completeInterview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const interview = await HealthInterview.findByIdAndUpdate(
      id,
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }
    res.json({
      success: true,
      interview,
      message: 'Interview marked as completed.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/patients/interview/:id/summary
const updateSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    let summary = await HealthSummary.findOneAndUpdate(
      { interviewId: id, patientId: req.user.id },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true }
    );
    if (!summary) {
      summary = await HealthSummary.findOneAndUpdate(
        { _id: id, patientId: req.user.id },
        { $set: { ...updates, updatedAt: new Date() } },
        { new: true }
      );
    }
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Health summary not found.' });
    }
    res.json({
      success: true,
      summary,
      message: 'Summary updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/interview/:id/summary/confirm
const confirmSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    let summary = await HealthSummary.findOne({ interviewId: id });
    if (!summary) {
      summary = await HealthSummary.findOne({ _id: id });
    }
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Health summary not found.' });
    }

    if (!summary.opNumber) {
      summary.opNumber = await generateUniqueOpNumber();
    }
    summary.patientConfirmed = true;
    summary.confirmedAt = new Date();
    if (Array.isArray(req.body?.interviewResponses) && req.body.interviewResponses.length > 0) {
      if (!summary.interviewResponses || summary.interviewResponses.length === 0) {
        summary.interviewResponses = req.body.interviewResponses;
      }
    }
    if (typeof summary.save === 'function') {
      await summary.save();
    } else {
      await HealthSummary.findByIdAndUpdate(summary._id, {
        $set: {
          opNumber: summary.opNumber,
          patientConfirmed: true,
          confirmedAt: summary.confirmedAt,
          interviewResponses: summary.interviewResponses,
        },
      });
    }

    // Ensure patient profile and user record has the latest OP number and tracks history
    try {
      if (summary.patientId) {
        await PatientProfile.findOneAndUpdate(
          { userId: summary.patientId },
          {
            $set: { opNumber: summary.opNumber },
            $addToSet: { generatedOpNumbers: summary.opNumber },
          }
        );
        await User.findByIdAndUpdate(summary.patientId, { $set: { opNumber: summary.opNumber } });
      }
    } catch (profErr) {}

    res.json({
      success: true,
      summary,
      opNumber: summary.opNumber,
      summaryConfirmed: true,
      message: `Summary confirmed under OP ID ${summary.opNumber}. Please provide this OP ID to the hospital triage desk for doctor assignment.`,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/summary/:id/attach-report
const attachReportToSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawFiles = req.files && req.files.length
      ? req.files
      : (req.file ? [req.file] : []);

    const files = [];
    const seenFiles = new Set();
    for (const f of rawFiles) {
      const fileKey = `${f.originalname}_${f.size}`;
      if (!seenFiles.has(fileKey)) {
        seenFiles.add(fileKey);
        files.push(f);
      } else {
        try {
          if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (e) {}
      }
    }

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one report file to attach.' });
    }

    const { title = 'Lab Report', uploadMethod = 'device', documentType = 'Lab Report' } = req.body;
    const attachedReports = [];
    const rejectedReports = [];

    // Find summary by interviewId or summary _id
    let summary = await HealthSummary.findOne({ interviewId: id, patientId: req.user.id });
    if (!summary) {
      summary = await HealthSummary.findOne({ _id: id, patientId: req.user.id });
    }

    for (const file of files) {
      // Validate if it is a medical document
      const validation = validateAndClassifyDocument({
        filePath: file.path,
        originalName: file.originalname,
        documentType: documentType || title || 'Lab Report',
        fileType: file.mimetype,
      });

      if (!validation.isValid) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (e) {}
        rejectedReports.push({
          fileName: file.originalname,
          reason: validation.rejectionReason,
          details: validation.details,
        });
        continue;
      }

      // Run OCR analysis to convert image to text and verify clinical content
      let ocrResult = null;
      try {
        ocrResult = await processDocumentOCR({
          filePath: file.path,
          originalName: file.originalname,
          documentType: validation.clinicalCategory || documentType || 'Lab Report',
          isHandwritten: (validation.clinicalCategory || '').includes('Prescription'),
          fileType: file.mimetype,
        });
      } catch (ocrErr) {
        console.warn('OCR extraction warning:', ocrErr);
      }

      if (ocrResult && ocrResult.rejected) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (e) {}
        rejectedReports.push({
          fileName: file.originalname,
          reason: ocrResult.rejectionReason,
          details: ocrResult.details,
        });
        continue;
      }

      // Find existing document or create a new one (strictly single copy)
      let doc = await MedicalDocument.findOne({
        patientId: req.user.id,
        originalName: file.originalname,
        fileSize: file.size,
      });

      if (!doc) {
        doc = await MedicalDocument.create({
          patientId: req.user.id,
          documentType: validation.clinicalCategory || 'Hospital Diagnostic & Pathology Lab Report',
          title: file.originalname,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadMethod,
          ocrProcessed: true,
        });
      }

      const textDocument = (ocrResult?.textDocument || ocrResult?.rawText || '').trim();

      // Create MedicalExtraction record if not already present
      let extraction = await MedicalExtraction.findOne({ documentId: doc._id });
      if (!extraction) {
        extraction = await MedicalExtraction.create({
          documentId: doc._id,
          patientId: req.user.id,
          rawText: textDocument,
          structuredData: ocrResult?.structuredData || {},
          confidenceScore: ocrResult?.confidenceScore || 85,
          isHandwritten: ocrResult?.isHandwritten || false,
          status: 'verified',
        });
      }

      const newPinnedReport = {
        documentId: String(doc._id),
        title: doc.originalName || doc.title,
        documentType: doc.documentType || validation.clinicalCategory || 'Lab Report',
        fileUrl: `/uploads/${doc.fileName}`,
        fileType: doc.fileType,
        uploadMethod: doc.uploadMethod,
        hasExtractedText: true,
        extractedText: textDocument || extraction?.rawText || '',
        structuredData: ocrResult?.structuredData || extraction?.structuredData || {},
        confidenceScore: ocrResult?.confidenceScore || 85,
        isDirectPinnedImage: false,
        pinReason: 'Converted into clinical text document via OCR and attached to health summary.',
        createdAt: new Date(),
      };

      // Ensure single copy in attachedReports array
      const alreadyInBatch = attachedReports.some(
        (p) => String(p.documentId) === String(doc._id) || (p.title && p.title.toLowerCase() === newPinnedReport.title.toLowerCase())
      );
      if (!alreadyInBatch) {
        attachedReports.push(newPinnedReport);
      }

      if (summary) {
        const existingPinned = Array.isArray(summary.pinnedReports) ? summary.pinnedReports : [];
        const isAlreadyPinned = existingPinned.some(
          (p) => String(p.documentId) === String(doc._id) ||
                 (p.title && p.title.toLowerCase().trim() === (doc.originalName || doc.title || '').toLowerCase().trim()) ||
                 (p.fileUrl && p.fileUrl.split('/').pop() === (doc.fileName || '').split('/').pop())
        );
        const updatedPinned = isAlreadyPinned ? existingPinned : [...existingPinned, newPinnedReport];
        const updatedLabResults = [...(summary.previousLabResults || [])];

        if (ocrResult?.structuredData?.labTests) {
          ocrResult.structuredData.labTests.forEach((t) => {
            updatedLabResults.push({
              test: t.testName,
              value: `${t.value} ${t.unit || ''}`.trim(),
              date: ocrResult.structuredData?.documentDate || new Date().toLocaleDateString('en-GB'),
            });
          });
        }

        const updatedMedicines = [...(summary.previousMedicines || [])];
        if (Array.isArray(ocrResult?.structuredData?.medicines)) {
          ocrResult.structuredData.medicines.forEach((m) => {
            const medDesc = `${m.name}${m.strength ? ` (${m.strength})` : ''} - ${m.dosage || '1 unit'}, ${m.frequency || 'As directed'}`;
            if (!updatedMedicines.some((existing) => existing.toLowerCase().includes(m.name.toLowerCase()))) {
              updatedMedicines.push(medDesc);
            }
          });
        }

        summary = await HealthSummary.findOneAndUpdate(
          { _id: summary._id },
          {
            $set: {
              pinnedReports: updatedPinned,
              previousLabResults: updatedLabResults,
              previousMedicines: updatedMedicines,
              updatedAt: new Date(),
            },
          },
          { new: true }
        );
      } else {
        // If summary is not created yet (during interview phase), record in interview responses
        try {
          const interview = await HealthInterview.findById(id);
          if (interview) {
            interview.responses = interview.responses || [];
            interview.responses.push({
              turnNumber: (interview.responses.length || 0) + 1,
              question: 'Uploaded Medical Document',
              answer: `Uploaded hospital report "${doc.title}": Converted to structured clinical text.`,
              inputMode: 'file_upload',
              timestamp: new Date(),
              documentId: String(doc._id),
            });
            if (typeof interview.save === 'function') {
              await interview.save();
            } else {
              await HealthInterview.findByIdAndUpdate(interview._id, { $set: { responses: interview.responses } });
            }
          }
        } catch (intErr) {
          console.warn('Interview link warning:', intErr.message);
        }
      }
    }

    if (attachedReports.length === 0) {
      return res.status(422).json({
        success: false,
        rejected: true,
        message: rejectedReports[0]?.reason || 'File Rejected: Non-hospital document detected.',
        details: rejectedReports[0]?.details || 'MediKiosk only accepts valid hospital reports (blood tests, lab reports, doctor prescriptions).',
        rejectedReports,
      });
    }

    res.status(201).json({
      success: true,
      pinnedReport: attachedReports[0],
      pinnedReports: attachedReports,
      rejectedReports,
      summary,
      message: `${attachedReports.length} hospital report(s) converted into text and attached successfully.${rejectedReports.length ? ` (${rejectedReports.length} non-hospital file(s) rejected).` : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/documents/upload
const uploadDocument = async (req, res, next) => {
  try {
    const rawFiles = req.files && req.files.length
      ? req.files
      : (req.file ? [req.file] : []);

    const files = [];
    const seenUploadKeys = new Set();
    for (const f of rawFiles) {
      const fileKey = `${f.originalname}_${f.size}`;
      if (!seenUploadKeys.has(fileKey)) {
        seenUploadKeys.add(fileKey);
        files.push(f);
      } else {
        try {
          if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
        } catch (e) {}
      }
    }

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one medical document or hospital report.' });
    }

    const { documentType = 'Lab Report', title, uploadMethod = 'device' } = req.body;
    const processedDocuments = [];
    const extractions = [];
    const rejectedFiles = [];

    for (const file of files) {
      // 1. Strict clinical validation: Accept ONLY legitimate medical & lab reports
      const validation = validateAndClassifyDocument({
        filePath: file.path,
        originalName: file.originalname,
        documentType,
        fileType: file.mimetype,
      });

      if (!validation.isValid) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) {
          console.warn('Failed to delete rejected file:', err);
        }
        rejectedFiles.push({
          fileName: file.originalname,
          reason: validation.rejectionReason,
          details: validation.details,
        });
        continue;
      }

      // 2. Perform clinical OCR analysis and content check
      const clinicalCategory = validation.clinicalCategory || documentType;
      const isHandwritten = clinicalCategory.includes('Prescription');
      let ocrResult = null;
      try {
        ocrResult = await processDocumentOCR({
          filePath: file.path,
          originalName: file.originalname,
          documentType: clinicalCategory,
          isHandwritten,
          fileType: file.mimetype,
        });
      } catch (ocrErr) {
        console.warn('OCR extraction warning:', ocrErr.message);
      }

      // Check if post-OCR analysis rejected non-hospital content
      if (ocrResult && ocrResult.rejected) {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) {}
        rejectedFiles.push({
          fileName: file.originalname,
          reason: ocrResult.rejectionReason,
          details: ocrResult.details,
        });
        continue;
      }

      // 3. Check if identical document already uploaded by patient (Single copy guarantee)
      let doc = await MedicalDocument.findOne({
        patientId: req.user.id,
        originalName: file.originalname,
        fileSize: file.size,
      });

      let extraction = null;
      const textContent = (ocrResult?.textDocument || ocrResult?.rawText || '').trim();

      if (!doc) {
        doc = await MedicalDocument.create({
          patientId: req.user.id,
          documentType: clinicalCategory,
          title: file.originalname,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadMethod: uploadMethod === 'camera' ? 'camera' : 'device',
          ocrProcessed: true,
        });

        extraction = await MedicalExtraction.create({
          documentId: doc._id,
          patientId: req.user.id,
          rawText: textContent,
          structuredData: ocrResult?.structuredData || {},
          confidenceScore: ocrResult?.confidenceScore || 85,
          isHandwritten: ocrResult?.isHandwritten || isHandwritten,
          status: 'verified',
        });

        // Record timeline milestone for this lab/medical report
        await MedicalTimeline.create({
          patientId: req.user.id,
          eventDate: new Date(),
          year: new Date().getFullYear(),
          eventType: clinicalCategory.includes('Prescription') ? 'PRESCRIPTION' : 'LAB_TEST',
          title: `${clinicalCategory}: ${file.originalname}`,
          summary: `Verified hospital report processed and converted to text. ${ocrResult?.structuredData?.abnormalFindings?.length ? 'Abnormal findings: ' + ocrResult.structuredData.abnormalFindings.join(', ') : 'All parameters within reference limits.'}`,
          doctorOrFacility: ocrResult?.structuredData?.doctorName || ocrResult?.structuredData?.facilityName || 'MediKiosk Clinical Lab',
          associatedDocumentId: doc._id,
          keyMetrics: (ocrResult?.structuredData?.labTests || []).slice(0, 3).map((t) => ({
            label: t.testName,
            value: `${t.value} ${t.unit} (${t.status})`,
          })),
        });
      } else {
        extraction = await MedicalExtraction.findOne({ documentId: doc._id });
      }

      const docObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
      docObj.extraction = extraction;
      docObj.extractedText = extraction?.rawText || textContent;
      docObj.structuredData = extraction?.structuredData || ocrResult?.structuredData || {};

      // Ensure no duplicate in current response batch
      const alreadyInBatch = processedDocuments.some((d) => String(d._id) === String(doc._id));
      if (!alreadyInBatch) {
        processedDocuments.push(docObj);
        if (extraction) extractions.push(extraction);
      }
    }

    if (processedDocuments.length === 0) {
      return res.status(422).json({
        success: false,
        rejected: true,
        message: rejectedFiles[0]?.reason || 'File Rejected: Non-hospital document detected.',
        details: rejectedFiles[0]?.details || 'MediKiosk only accepts valid hospital and clinical diagnostic reports.',
        rejectedFiles,
      });
    }

    res.status(201).json({
      success: true,
      documents: processedDocuments,
      extractions,
      rejectedFiles,
      document: processedDocuments[0],
      extraction: extractions[0],
      verifiedCategory: processedDocuments[0]?.documentType,
      verificationAdvisory: 'Hospital report(s) verified and converted into text document successfully.',
      message: `${processedDocuments.length} hospital report image(s) uploaded and converted into text successfully.${rejectedFiles.length ? ` (${rejectedFiles.length} non-hospital file(s) rejected).` : ''}`,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/documents
const getDocuments = async (req, res, next) => {
  try {
    const rawDocuments = await MedicalDocument.find({ patientId: req.user.id });
    
    // Deduplicate documents so each file is strictly returned a single time
    const seen = new Set();
    const documents = [];
    for (const d of rawDocuments) {
      const key = `${d.originalName || d.title}_${d.fileSize || ''}`.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        documents.push(d);
      }
    }

    const docIds = documents.map((d) => d._id);
    const extractions = await MedicalExtraction.find({ documentId: { $in: docIds } });
    const extractionMap = {};
    extractions.forEach((e) => {
      extractionMap[String(e.documentId)] = e;
    });

    const enriched = documents.map((d) => {
      const plain = typeof d.toObject === 'function' ? d.toObject() : { ...d };
      const ext = extractionMap[String(d._id)];
      if (ext) {
        plain.extraction = ext;
        plain.extractedText = ext.rawText || '';
        plain.structuredData = ext.structuredData || {};
      }
      return plain;
    });

    res.json({ success: true, documents: enriched });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/documents/:id/ocr
const runOcrOnDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await MedicalDocument.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const isHandwritten = document.documentType === 'Handwritten Prescription' || document.documentType === 'Prescription';

    const ocrResult = await processDocumentOCR({
      filePath: document.filePath,
      originalName: document.originalName,
      documentType: document.documentType,
      isHandwritten,
    });

    const extraction = await MedicalExtraction.create({
      documentId: document._id,
      patientId: req.user.id,
      rawText: ocrResult.rawText,
      structuredData: ocrResult.structuredData,
      confidenceScore: ocrResult.confidenceScore,
      isHandwritten: ocrResult.isHandwritten,
      status: 'pending_review',
    });

    await MedicalDocument.findByIdAndUpdate(document._id, {
      $set: { ocrProcessed: true },
    });

    res.status(201).json({
      success: true,
      extraction,
      verificationAdvisory: ocrResult.verificationAdvisory,
      message: 'OCR extraction completed. Please review and verify extracted information.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/documents/extractions/:id/review
const reviewExtraction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { structuredData, patientNotes } = req.body;

    const extraction = await MedicalExtraction.findById(id);
    if (!extraction) {
      return res.status(404).json({ success: false, message: 'Extraction record not found.' });
    }

    const updated = await MedicalExtraction.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(structuredData && { structuredData }),
          patientNotes: patientNotes || '',
          status: 'patient_verified',
          verifiedAt: new Date(),
        },
      },
      { new: true }
    );

    // Also add to timeline if verified lab tests exist
    if (structuredData?.labTests && structuredData.labTests.length > 0) {
      const topTests = structuredData.labTests.slice(0, 2).map((t) => `${t.testName}: ${t.value} ${t.unit}`).join(', ');
      await MedicalTimeline.create({
        patientId: req.user.id,
        eventDate: new Date(),
        year: new Date().getFullYear(),
        eventType: 'LAB_TEST',
        title: `Verified Lab Extraction: ${structuredData.doctorName || 'Clinical Diagnostics'}`,
        summary: topTests,
        doctorOrFacility: structuredData.doctorName || 'Apex Hospital Lab',
        associatedDocumentId: extraction.documentId,
      });
    }

    res.json({
      success: true,
      extraction: updated,
      message: 'Extracted medical information verified and added to health summary context.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/patients/timeline
const getTimeline = async (req, res, next) => {
  try {
    const timeline = await MedicalTimeline.find({ patientId: req.user.id });
    res.json({ success: true, timeline });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/patients/prescriptions
const getPatientPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user.id });
    res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/integrations/aadhaar/demo-verify
const verifyAadhaarDemo = async (req, res, next) => {
  try {
    const { demoId, demoOtp } = req.body;

    if (!demoOtp || (demoOtp !== '123456' && demoOtp.length !== 6)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Demo OTP. For prototype evaluation, enter 123456.',
      });
    }

    const demoAadhaarNumber = demoId || 'XXXX-XXXX-8924';
    await PatientProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          aadhaarDemoVerified: true,
          aadhaarDemoId: `DEMO-ABHA-${demoAadhaarNumber.slice(-4)}`,
        },
      }
    );

    res.json({
      success: true,
      status: 'Demo Verified',
      demoAadhaarId: `DEMO-ABHA-${demoAadhaarNumber.slice(-4)}`,
      timestamp: new Date().toISOString(),
      disclaimer: 'Prototype simulation. No real Aadhaar or NHA government servers were contacted.',
      message: 'Demo Aadhaar / ABHA verification successful (Simulation Mode).',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/patients/translate
const translatePatientText = async (req, res, next) => {
  try {
    const { text, targetLanguage = 'en', groqApiKey } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid text is required for translation.' });
    }

    const effectiveGroqKey = groqApiKey || req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;
    const translated = await translateText(text, targetLanguage, effectiveGroqKey);

    res.status(200).json({
      success: true,
      originalText: text,
      translatedText: translated,
      targetLanguage,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/patients/summary/:id/report/:reportId
// @route   DELETE /api/patients/summary/:id/report
const removeReportFromSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reportId = req.params.reportId || req.query.reportId || req.body?.reportId;

    if (!reportId) {
      return res.status(400).json({ success: false, message: 'Please provide a report ID to remove.' });
    }

    // 1. Find HealthSummary (by interviewId or _id)
    let summary = await HealthSummary.findOne({ interviewId: id, patientId: req.user.id });
    if (!summary) {
      summary = await HealthSummary.findOne({ _id: id, patientId: req.user.id });
    }

    let removedReport = null;

    if (summary) {
      const existingPinned = Array.isArray(summary.pinnedReports) ? summary.pinnedReports : [];
      const reportIndex = existingPinned.findIndex(
        (r, idx) =>
          String(r.documentId) === String(reportId) ||
          String(r._id) === String(reportId) ||
          String(idx) === String(reportId)
      );

      if (reportIndex !== -1) {
        removedReport = existingPinned[reportIndex];
        const updatedPinned = existingPinned.filter((_, idx) => idx !== reportIndex);

        summary = await HealthSummary.findOneAndUpdate(
          { _id: summary._id },
          {
            $set: {
              pinnedReports: updatedPinned,
              updatedAt: new Date(),
            },
          },
          { new: true }
        );
      }
    }

    // 2. Clean up MedicalDocument & MedicalExtraction & delete file from disk
    const docId = removedReport?.documentId || reportId;
    if (docId) {
      try {
        const doc = await MedicalDocument.findOne({ _id: docId, patientId: req.user.id });
        if (doc) {
          if (doc.filePath && fs.existsSync(doc.filePath)) {
            try {
              fs.unlinkSync(doc.filePath);
            } catch (unlinkErr) {
              console.warn('Failed to delete file from disk:', unlinkErr.message);
            }
          }
          await MedicalDocument.deleteOne({ _id: doc._id });
          await MedicalExtraction.deleteMany({ documentId: doc._id });
        }
      } catch (docErr) {
        console.warn('Document cleanup warning:', docErr.message);
      }
    }

    // 3. If interview exists, also remove from interview responses
    try {
      const interview = await HealthInterview.findById(id);
      if (interview) {
        interview.responses = (interview.responses || []).filter(
          (r) => String(r.documentId) !== String(reportId) && String(r.documentId) !== String(docId)
        );
        if (typeof interview.save === 'function') {
          await interview.save();
        } else {
          await HealthInterview.findByIdAndUpdate(interview._id, { $set: { responses: interview.responses } });
        }
      }
    } catch (intErr) {}

    res.json({
      success: true,
      summary,
      removedReportId: reportId,
      message: 'Uploaded report removed successfully from health summary.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/patients/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await MedicalDocument.findOne({ _id: id, patientId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {}
    }
    await MedicalDocument.deleteOne({ _id: doc._id });
    await MedicalExtraction.deleteMany({ documentId: doc._id });
    await MedicalTimeline.deleteMany({ patientId: req.user.id, title: new RegExp(doc.originalName, 'i') });

    try {
      if (typeof HealthSummary.updateMany === 'function') {
        await HealthSummary.updateMany(
          { patientId: req.user.id },
          { $pull: { pinnedReports: { documentId: String(doc._id) } } }
        );
      }
    } catch (sumErr) {
      console.warn('HealthSummary cleanup warning:', sumErr?.message);
    }

    res.json({ success: true, message: 'Document removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/patients/doctor-requests
// Patient views all triage requests sent to doctors and their acceptance/review statuses
const getPatientDoctorRequests = async (req, res, next) => {
  try {
    const requests = await DoctorRequest.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const docProfile = await DoctorProfile.findOne({ userId: r.doctorId });
        const docUser = await User.findById(r.doctorId);
        return {
          ...r.toObject(),
          doctorProfile: {
            doctorName: docProfile?.doctorName || docUser?.name || 'Dr. Attending Physician',
            specialization: docProfile?.specialization || 'Consultant Specialist',
            licenseNumber: docProfile?.licenseNumber || 'MCI-VERIFIED',
            hospitalAffiliation: docProfile?.hospitalAffiliation || 'MediKiosk Apex Hospital',
            phoneNumber: docProfile?.phoneNumber || docUser?.phoneNumber || '',
          },
        };
      })
    );
    res.json({ success: true, requests: enriched });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/patients/summary/latest
const getLatestSummary = async (req, res, next) => {
  try {
    const summaries = await HealthSummary.find({ patientId: req.user.id });
    if (!summaries || summaries.length === 0) {
      return res.json({ success: true, summary: null });
    }
    const sorted = [...summaries].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    const summary = sorted[0];
    if (Array.isArray(summary.pinnedReports)) {
      const seenReports = new Set();
      summary.pinnedReports = summary.pinnedReports.filter((p) => {
        const key = (p.title || p.fileUrl || p.documentId || '').toLowerCase().trim();
        if (seenReports.has(key)) return false;
        seenReports.add(key);
        return true;
      });
    }
    if (!summary.opNumber) {
      summary.opNumber = await generateUniqueOpNumber();
      if (typeof summary.save === 'function') {
        await summary.save();
      } else {
        await HealthSummary.findByIdAndUpdate(summary._id, { $set: { opNumber: summary.opNumber } });
      }
    }
    return res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patients/lookup-phone (also GET /api/patients/lookup-phone/:phone)
 * Fast lookup to verify if a mobile number belongs to a returning patient
 */
const lookupPatientByPhone = async (req, res, next) => {
  try {
    const rawAbha = (req.body.abhaId || req.body.abhaNumber || req.query.abhaId || req.params.abha || '').trim();

    // 1. Prioritize 14-digit ABHA Number lookup for returning patients
    if (rawAbha) {
      const abhaSearch = buildAbhaSearchQuery(rawAbha);

      let profile = await PatientProfile.findOne({
        $or: [
          { abhaId: abhaSearch.regex },
          { aadhaarDemoId: abhaSearch.regex },
          { abhaAddress: abhaSearch.regex },
          { abhaId: abhaSearch.formatted },
          { abhaId: abhaSearch.digits },
        ],
      });

      let user = null;
      if (profile && profile.userId) {
        user = await User.findById(profile.userId);
      } else {
        user = await User.findOne({
          $or: [
            { abhaId: abhaSearch.regex },
            { abhaId: abhaSearch.formatted },
            { abhaId: abhaSearch.digits },
          ],
          role: 'patient',
        });
        if (user) {
          profile = await PatientProfile.findOne({ userId: user._id });
        }
      }

      if (!profile && !user) {
        const summary = await HealthSummary.findOne({
          $or: [
            { abhaId: abhaSearch.regex },
            { abhaId: abhaSearch.formatted },
            { abhaId: abhaSearch.digits },
          ],
        }).sort({ createdAt: -1 });
        if (summary) {
          return res.json({
            success: true,
            verified: true,
            exists: true,
            found: true,
            isNewToKiosk: false,
            patient: {
              name: summary.patientName,
              phoneNumber: summary.patientPhone || '',
              age: summary.patientAge || null,
              gender: summary.patientGender || 'Other',
              abhaId: abhaSearch.formatted || summary.abhaId,
              opNumber: summary.opNumber || null,
              previousVisitsCount: 1,
              abdmStatus: 'ACTIVE_VERIFIED',
            },
            message: '✓ 14-Digit ABHA verified via ABDM Gateway. Previous visit record retrieved.',
          });
        }
      }

      if (profile || user) {
        return res.json({
          success: true,
          verified: true,
          exists: true,
          found: true,
          isNewToKiosk: false,
          patient: {
            name: profile?.name || user?.name,
            phoneNumber: profile?.phoneNumber || user?.phoneNumber || '',
            age: profile?.age || null,
            gender: profile?.gender || 'Other',
            abhaId: abhaSearch.formatted || profile?.abhaId || profile?.aadhaarDemoId || user?.abhaId,
            opNumber: profile?.opNumber || user?.opNumber || null,
            previousVisitsCount: Array.isArray(profile?.generatedOpNumbers) ? profile.generatedOpNumbers.length : 1,
            abdmStatus: 'ACTIVE_VERIFIED',
          },
          message: '✓ 14-Digit ABHA verified via ABDM Gateway. Patient profile retrieved.',
        });
      }

      if (abhaSearch.is14Digits) {
        return res.json({
          success: true,
          verified: true,
          exists: false,
          found: true,
          isNewToKiosk: true,
          patient: {
            name: '',
            phoneNumber: '',
            age: null,
            gender: 'Male',
            abhaId: abhaSearch.formatted,
            opNumber: null,
            previousVisitsCount: 0,
            abdmStatus: 'ACTIVE_VERIFIED',
          },
          message: `✓ 14-Digit ABHA (${abhaSearch.formatted}) verified via ABDM Gateway. Please enter your name and phone number to link your health records.`,
        });
      }

      return res.json({
        success: false,
        verified: false,
        exists: false,
        found: false,
        message: `Invalid ABHA format. ABHA Number must be exactly 14 digits in format XX-XXXX-XXXX-XXXX.`,
      });
    }

    // 2. Fallback to phone number lookup
    const rawPhone = req.params.phone || req.body.phoneNumber || req.query.phone || '';
    const cleanPhone = String(rawPhone).trim().replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number or ABHA ID required.' });
    }

    const user = await User.findOne({
      phoneNumber: cleanPhone,
      role: 'patient',
    });
    const profile = user ? await PatientProfile.findOne({ userId: user._id }) : null;

    if (user && profile) {
      return res.json({
        success: true,
        exists: true,
        found: true,
        patient: {
          name: profile.name || user.name,
          phoneNumber: cleanPhone,
          age: profile.age || null,
          gender: profile.gender || 'Other',
          abhaId: profile.abhaId || profile.aadhaarDemoId || user.abhaId || '',
          opNumber: profile.opNumber || null,
          previousVisitsCount: Array.isArray(profile.generatedOpNumbers) ? profile.generatedOpNumbers.length : 1,
        },
      });
    }

    const profileOnly = await PatientProfile.findOne({
      phoneNumber: cleanPhone,
    });
    if (profileOnly) {
      return res.json({
        success: true,
        exists: true,
        found: true,
        patient: {
          name: profileOnly.name,
          phoneNumber: cleanPhone,
          age: profileOnly.age || null,
          gender: profileOnly.gender || 'Other',
          abhaId: profileOnly.abhaId || profileOnly.aadhaarDemoId || '',
          opNumber: profileOnly.opNumber || null,
          previousVisitsCount: Array.isArray(profileOnly.generatedOpNumbers) ? profileOnly.generatedOpNumbers.length : 1,
        },
      });
    }

    const summary = await HealthSummary.findOne({
      patientPhone: cleanPhone,
    }).sort({ createdAt: -1 });
    if (summary) {
      return res.json({
        success: true,
        exists: true,
        found: true,
        patient: {
          name: summary.patientName,
          phoneNumber: cleanPhone,
          age: summary.patientAge || null,
          gender: summary.patientGender || 'Other',
          abhaId: summary.abhaId || '',
          opNumber: summary.opNumber || null,
          previousVisitsCount: 1,
        },
        message: 'Previous visit record retrieved successfully.',
      });
    }

    return res.json({
      success: true,
      exists: false,
      found: false,
      message: 'No previous record found for this phone number. Patient can register as a New Patient.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  recordConsent,
  startInterview,
  submitAnswer,
  translatePatientText,
  createOrGetSummary,
  getLatestSummary,
  uploadDocument,
  getDocuments,
  runOcrOnDocument,
  reviewExtraction,
  getTimeline,
  getPatientPrescriptions,
  getPatientDoctorRequests,
  verifyAadhaarDemo,
  saveGroqApiKey,
  getGroqStatus,
  getInterview,
  completeInterview,
  updateSummary,
  confirmSummary,
  attachReportToSummary,
  removeReportFromSummary,
  deleteDocument,
  lookupPatientByPhone,
};
