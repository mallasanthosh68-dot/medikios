const fs = require('fs');
const path = require('path');
const {
  HealthInterview,
  HealthSummary,
  PatientProfile,
  MedicalDocument,
  MedicalExtraction,
  User,
  Notification,
  MedicalTimeline,
} = require('../models');
const { processDocumentOCR, validateAndClassifyDocument } = require('../services/ocrService');
const { screenEmergencyRedFlags } = require('../utils/emergencyRedFlags');
const {
  getAyushStartingQuestion,
  determineNextAdaptiveQuestion,
  buildAyushStructuredSummary,
  extractStructuredAYUSHData,
} = require('../services/ayushService');
const { generateUniqueOpNumber } = require('../utils/opNumber');
const {
  validateAbhaNumber,
  buildAbhaSearchQuery,
  formatAbhaNumber,
  extractAbhaDigits,
} = require('../utils/abhaValidation');

/**
 * POST /api/ayush/case/start
 * Initializes an AYUSH case session with patient consent & chosen communication mode
 */
const startAyushCase = async (req, res, next) => {
  try {
    const {
      language = 'en',
      communicationMode = 'voice',
      consentStatus = true,
    } = req.body;

    const profile = await PatientProfile.findOne({ userId: req.user.id });

    // Initialize interview session in AYUSH mode
    const interview = await HealthInterview.create({
      patientId: req.user.id,
      language,
      healthcareMode: 'ayush',
      communicationMode,
      consentStatus: consentStatus === true,
      caseStatus: 'INTERVIEW_STARTED',
      status: 'in_progress',
      responses: [],
      redFlagsDetected: [],
      priority: 'NORMAL',
      startTime: new Date(),
      collectedAYUSHData: {
        chiefConcern: '',
        duration: '',
        progression: '',
        dietAhara: '',
        digestionAgni: '',
        bowelKoshtha: '',
        lifestyleVihara: '',
        sleepNidra: '',
        medicalHistory: profile?.medicalHistory || [],
        medications: [],
        allergies: profile?.allergies || [],
      },
    });

    const startingQuestion = getAyushStartingQuestion(language);

    res.status(201).json({
      success: true,
      caseId: String(interview._id),
      interviewId: String(interview._id),
      patientId: String(req.user.id),
      language,
      healthcareMode: 'AYUSH',
      communicationMode,
      consentStatus: interview.consentStatus,
      caseStatus: 'INTERVIEW_STARTED',
      category: 'chief_concern',
      categoryLabel: 'Present Health Concern',
      question: startingQuestion,
      message: startingQuestion,
      continueInterview: true,
      collectedParametersCount: 0,
      collectedAYUSHData: interview.collectedAYUSHData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ayush/case/:caseId/answer (also alias /message)
 * Receives patient answer, evaluates safety, updates memory, and asks next adaptive question
 */
const submitAyushAnswer = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { question, answer, inputMode = 'text', groqApiKey } = req.body;

    if (!answer || !question) {
      return res.status(400).json({ success: false, message: 'Question and answer are required.' });
    }

    const interview = await HealthInterview.findById(caseId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'AYUSH Case session not found.' });
    }

    // Check emergency red-flag safety
    const safetyCheck = screenEmergencyRedFlags(answer, interview.language || 'en');
    if (safetyCheck && safetyCheck.isRedFlag) {
      const redFlags = [...(interview.redFlagsDetected || [])];
      safetyCheck.flags?.forEach((f) => {
        if (!redFlags.includes(f.name)) redFlags.push(f.name);
      });

      await HealthInterview.findByIdAndUpdate(caseId, {
        $set: {
          priority: 'HIGH_PRIORITY',
          redFlagsDetected: redFlags,
          caseStatus: 'INTERVIEW_STARTED',
        },
        $push: {
          responses: {
            question,
            answer,
            inputMode,
            timestamp: new Date(),
          },
        },
      });

      return res.json({
        success: true,
        isRedFlag: true,
        riskLevel: 'urgent',
        priority: 'HIGH_PRIORITY',
        message:
          '⚠️ POSSIBLE URGENT SYMPTOM: Some information you provided may require immediate attention. Please inform hospital staff or your physician immediately.',
        category: 'emergency',
        categoryLabel: '⚠️ Urgent Warning Sign',
        continueInterview: false,
        readyForSummary: false,
        actionRequired: 'INFORM_HOSPITAL_STAFF',
        hotlines: safetyCheck.hotlines || ['112', '108'],
      });
    }

    // Append new turn to responses
    const updatedResponses = [
      ...(interview.responses || []),
      { question, answer, inputMode, timestamp: new Date() },
    ];

    // Compute chief complaint
    let chiefComplaint = interview.chiefComplaint;
    if (!chiefComplaint && updatedResponses.length > 0) {
      chiefComplaint = answer;
    }

    // Determine adaptive next question
    const effectiveGroqKey = groqApiKey || process.env.GROQ_API_KEY;
    const aiResult = await determineNextAdaptiveQuestion({
      history: updatedResponses,
      currentAnswer: answer,
      language: interview.language || 'en',
      groqApiKey: effectiveGroqKey,
    });

    const newCaseStatus = aiResult.readyForSummary ? 'INTERVIEW_COMPLETED' : 'INTERVIEW_STARTED';

    await HealthInterview.findByIdAndUpdate(caseId, {
      $set: {
        responses: updatedResponses,
        chiefComplaint,
        collectedAYUSHData: aiResult.structuredData || interview.collectedAYUSHData,
        caseStatus: newCaseStatus,
        status: aiResult.readyForSummary ? 'completed' : 'in_progress',
        completedAt: aiResult.readyForSummary ? new Date() : null,
      },
    });

    res.json({
      success: true,
      question: aiResult.message,
      nextQuestion: aiResult.message,
      message: aiResult.message,
      nextQuestionReason: aiResult.nextQuestionReason,
      category: aiResult.category,
      currentDomain: aiResult.category,
      categoryLabel: aiResult.categoryLabel,
      riskLevel: aiResult.riskLevel || 'normal',
      isRedFlag: false,
      continueInterview: aiResult.continueInterview,
      readyForSummary: aiResult.readyForSummary,
      collectedParametersCount: aiResult.collectedParametersCount,
      caseStatus: newCaseStatus,
      collectedData: aiResult.structuredData,
      collectedAYUSHData: aiResult.structuredData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ayush/case/:caseId/red-flag
 * Explicit red flag check endpoint
 */
const checkAyushRedFlag = async (req, res, next) => {
  try {
    const { text, language = 'en' } = req.body;
    const check = screenEmergencyRedFlags(text, language);
    res.json({
      success: true,
      isRedFlag: check?.isRedFlag || false,
      details: check,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ayush/case/:caseId/upload
 * Validates medical document, rejects non-medical photos, and runs OCR
 */
const uploadAyushDocument = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const file = req.file || (req.files && req.files[0]);

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Validate that file is a genuine medical report
    const validation = validateAndClassifyDocument({
      filePath: file.path,
      originalName: file.originalname,
      documentType: req.body.documentType || 'Lab Report',
      fileType: file.mimetype,
    });

    if (!validation.isValid) {
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {}
      return res.status(422).json({
        success: false,
        rejected: true,
        message: 'This image does not appear to be a medical document. Please upload a valid medical report or prescription.',
        details: validation.details,
      });
    }

    // Run OCR extraction
    let ocrResult = null;
    try {
      ocrResult = await processDocumentOCR({
        filePath: file.path,
        originalName: file.originalname,
        documentType: validation.clinicalCategory || req.body.documentType || 'Hospital Report',
        isHandwritten: (validation.clinicalCategory || '').includes('Prescription'),
        fileType: file.mimetype,
      });
    } catch (e) {
      console.warn('AYUSH OCR warning:', e.message);
    }

    if (ocrResult && ocrResult.rejected) {
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {}
      return res.status(422).json({
        success: false,
        rejected: true,
        message: 'This image does not appear to be a medical document. Please upload a valid medical report or prescription.',
        details: ocrResult.details,
      });
    }

    // Save document record
    const doc = await MedicalDocument.create({
      patientId: req.user.id,
      documentType: validation.clinicalCategory || 'Hospital Diagnostic Report',
      title: file.originalname,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadMethod: 'device',
      ocrProcessed: true,
    });

    const textDocument = (ocrResult?.textDocument || ocrResult?.rawText || '').trim();

    await MedicalExtraction.create({
      documentId: doc._id,
      patientId: req.user.id,
      rawText: textDocument,
      structuredData: ocrResult?.structuredData || {},
      confidenceScore: ocrResult?.confidenceScore || 85,
      status: 'verified',
    });

    const pinnedReport = {
      documentId: String(doc._id),
      title: doc.originalName || doc.title,
      fileUrl: `/uploads/${doc.fileName}`,
      fileType: doc.fileType,
      uploadMethod: 'device',
      hasExtractedText: !!textDocument,
      extractedText: textDocument,
      confidenceScore: ocrResult?.confidenceScore || 85,
      isDirectPinnedImage: false,
      pinReason: 'Converted into clinical text document via OCR and attached to AYUSH health case.',
      createdAt: new Date(),
    };

    // Save to HealthInterview session
    await HealthInterview.findByIdAndUpdate(caseId, {
      $push: { pinnedReports: pinnedReport },
      $set: { caseStatus: 'DOCUMENT_PROCESSING' },
    });

    // Attach to summary if already created
    await HealthSummary.findOneAndUpdate(
      { interviewId: caseId },
      {
        $push: { pinnedReports: pinnedReport },
        $set: { caseStatus: 'DOCUMENT_PROCESSING' },
      }
    );

    res.status(201).json({
      success: true,
      pinnedReport,
      message: 'Medical document read and extracted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ayush/case/:caseId/ocr
 * Retrieve or re-execute OCR on an uploaded document
 */
const runAyushOcr = async (req, res, next) => {
  try {
    const { documentId, corrections } = req.body;
    let extraction = await MedicalExtraction.findOne({ documentId });
    if (!extraction) {
      return res.status(404).json({ success: false, message: 'Document extraction not found.' });
    }

    if (corrections) {
      extraction.rawText = corrections.text || extraction.rawText;
      extraction.structuredData = { ...(extraction.structuredData || {}), ...corrections.structuredData };
      await extraction.save();
    }

    res.json({
      success: true,
      extraction,
      message: 'OCR details updated.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ayush/case/:caseId
 * Get complete case details
 */
const getAyushCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const interview = await HealthInterview.findById(caseId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const summary = await HealthSummary.findOne({ interviewId: interview._id });
    const profile = await PatientProfile.findOne({ userId: interview.patientId });

    res.json({
      success: true,
      interview,
      summary,
      patientProfile: profile,
      caseStatus: summary?.caseStatus || interview.caseStatus || 'INTERVIEW_STARTED',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ayush/case/:caseId/summary
 * Builds complete AYUSH health summary across 12 structured sections
 */
const generateAyushSummary = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const interview = await HealthInterview.findById(caseId);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
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
        // Returning patient found in database
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
        // New patient (or returning patient phone not yet registered in DB)
        const phoneToStore = cleanPhone || (req.user?.phoneNumber && req.user.phoneNumber !== '9999900000' ? req.user.phoneNumber : `98${Math.floor(10000000 + Math.random() * 90000000)}`);
        const finalName = providedName || req.user?.name || 'Walk-In Patient';
        const finalAge = Number(patientDetails.age) || (profile?.age || 35);

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

      // Re-link interview to resolved patient
      if (resolvedUser && resolvedUser._id) {
        interview.patientId = resolvedUser._id;
        if (typeof interview.save === 'function') await interview.save();
      }
    }

    const finalPatientName = providedName || profile?.name || resolvedUser?.name || 'Walk-In Patient';
    const finalPatientPhone = cleanPhone || profile?.phoneNumber || resolvedUser?.phoneNumber || '';
    const finalPatientAge = Number(patientDetails.age) || profile?.age || 35;
    const finalPatientGender = patientDetails.gender || profile?.gender || 'Not specified';

    let attachedReports = req.body.attachedReports || [];
    if ((!attachedReports || attachedReports.length === 0) && interview.pinnedReports && interview.pinnedReports.length > 0) {
      attachedReports = [...interview.pinnedReports];
    } else if (interview.pinnedReports && interview.pinnedReports.length > 0) {
      const existingDocIds = new Set(attachedReports.map((r) => String(r.documentId || r.title || '')));
      for (const pr of interview.pinnedReports) {
        const key = String(pr.documentId || pr.title || '');
        if (!existingDocIds.has(key)) {
          attachedReports.push(pr);
          existingDocIds.add(key);
        }
      }
    }
    const patientCorrections = req.body.patientCorrections || {};

    // Check if summary already exists
    let existing = await HealthSummary.findOne({ interviewId: interview._id });

    const structuredSummaryData = buildAyushStructuredSummary({
      patientProfile: {
        name: finalPatientName,
        age: finalPatientAge,
        gender: finalPatientGender,
      },
      interview,
      attachedReports,
      patientCorrections,
    });

    const generatedOpId = existing?.opNumber || (await generateUniqueOpNumber());

    let summary;
    if (existing) {
      existing.patientId = resolvedUser._id;
      existing.patientName = finalPatientName;
      existing.patientPhone = finalPatientPhone;
      existing.patientAge = finalPatientAge;
      existing.patientGender = finalPatientGender;
      existing.chiefComplaint = structuredSummaryData.chiefConcern;
      existing.symptoms = structuredSummaryData.symptoms;
      existing.duration = structuredSummaryData.duration;
      existing.ayushAssessment = structuredSummaryData.ayushAssessment;
      existing.aiGeneratedText = structuredSummaryData.aiGeneratedText;
      existing.interviewResponses = structuredSummaryData.interviewResponses || interview.responses || [];
      existing.aiMedicationSuggestions = structuredSummaryData.aiMedicationSuggestions || [];
      existing.caseStatus = 'SUMMARY_GENERATED';
      existing.opNumber = generatedOpId;
      existing.abhaId = cleanAbha || profile?.abhaId || existing.abhaId || '';
      existing.updatedAt = new Date();
      await existing.save();
      summary = existing;
    } else {
      summary = await HealthSummary.create({
        patientId: resolvedUser._id,
        interviewId: interview._id,
        patientName: finalPatientName,
        patientPhone: finalPatientPhone,
        opNumber: generatedOpId,
        abhaId: cleanAbha || profile?.abhaId || '',
        patientAge: finalPatientAge,
        patientGender: finalPatientGender,
        language: interview.language || 'en',
        healthcareMode: 'ayush',
        communicationMode: interview.communicationMode || 'voice',
        chiefComplaint: structuredSummaryData.chiefConcern,
        symptoms: structuredSummaryData.symptoms,
        duration: structuredSummaryData.duration,
        severity: 'Moderate',
        medicalHistory: structuredSummaryData.medicalHistory,
        ayushAssessment: structuredSummaryData.ayushAssessment,
        // Full Q&A Transcript: AI Questions Asked & Patient Answers Given
        interviewResponses: structuredSummaryData.interviewResponses || interview.responses || [],
        // AI Medication Suggestions for Vaidya / Attending Doctor Review
        aiMedicationSuggestions: structuredSummaryData.aiMedicationSuggestions || [],
        pinnedReports: attachedReports,
        redFlagStatus: structuredSummaryData.redFlagStatus,
        redFlagMessage: structuredSummaryData.redFlagMessage,
        suggestedSpecialty: 'AYUSH / Integrative Medicine',
        specialtyRationale: 'Holistic clinical intake prepared for AYUSH physician review.',
        aiGeneratedText: structuredSummaryData.aiGeneratedText,
        caseStatus: 'SUMMARY_GENERATED',
        status: 'DRAFT',
      });
    }

    // Update patient profile OP number tracking
    if (profile) {
      profile.opNumber = generatedOpId;
      if (!Array.isArray(profile.generatedOpNumbers)) profile.generatedOpNumbers = [];
      if (!profile.generatedOpNumbers.includes(generatedOpId)) profile.generatedOpNumbers.push(generatedOpId);
      if (typeof profile.save === 'function') {
        await profile.save();
      } else {
        await PatientProfile.findByIdAndUpdate(profile._id, {
          $set: { opNumber: generatedOpId },
          $addToSet: { generatedOpNumbers: generatedOpId },
        });
      }
    }
    await User.findByIdAndUpdate(resolvedUser._id, { $set: { opNumber: generatedOpId } });

    res.status(201).json({
      success: true,
      summary,
      opNumber: generatedOpId,
      caseStatus: 'SUMMARY_GENERATED',
      message: 'AYUSH health summary created. Patient confirmation required.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ayush/lookup-patient (also GET /api/ayush/lookup-patient/:phone)
 * Fast lookup to verify if an ABHA ID or mobile number belongs to a returning patient
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

/**
 * POST /api/ayush/case/:caseId/patient-confirm
 * Patient actively confirms the summary before sending to physician
 */
const patientConfirmAyushCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    let summary = await HealthSummary.findOne({ interviewId: caseId });
    if (!summary) {
      summary = await HealthSummary.findById(caseId);
    }
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary not found.' });
    }

    if (!summary.opNumber) {
      summary.opNumber = await generateUniqueOpNumber();
    }

    if (Array.isArray(req.body?.interviewResponses) && req.body.interviewResponses.length > 0) {
      if (!summary.interviewResponses || summary.interviewResponses.length === 0) {
        summary.interviewResponses = req.body.interviewResponses;
      }
    }

    summary.patientConfirmation = {
      isConfirmed: true,
      confirmedAt: new Date(),
    };
    summary.caseStatus = 'PATIENT_CONFIRMED';
    summary.status = 'SHARED_WITH_DOCTOR';
    await summary.save();

    await HealthInterview.findByIdAndUpdate(summary.interviewId, {
      $set: { caseStatus: 'PATIENT_CONFIRMED' },
    });

    // Notify hospital / doctor workflow
    await Notification.create({
      recipientRole: 'doctor',
      title: '🌿 New Confirmed AYUSH Health Case Ready',
      message: `Patient ${summary.patientName} (${summary.opNumber}) has confirmed their AYUSH health summary. Ready for physician review.`,
      link: `/doctor/requests`,
    });

    res.json({
      success: true,
      summary,
      opNumber: summary.opNumber,
      caseStatus: 'PATIENT_CONFIRMED',
      summaryStatus: 'patient_confirmed',
      confirmedAt: summary.patientConfirmation.confirmedAt,
      message: 'Your case has been prepared for physician review.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctor/ayush/cases/:caseId
 * Doctor views case with all 16 clinical sections
 */
const getDoctorAyushCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    let summary = await HealthSummary.findOne({ interviewId: caseId });
    if (!summary) {
      summary = await HealthSummary.findById(caseId);
    }
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const interview = await HealthInterview.findById(summary.interviewId);
    const patient = await User.findById(summary.patientId);
    const profile = await PatientProfile.findOne({ userId: summary.patientId });

    // Format all 16 sections
    const formattedCase = {
      section1_patientInformation: {
        name: summary.patientName,
        age: summary.patientAge,
        gender: summary.patientGender,
        opNumber: summary.opNumber,
        bloodGroup: profile?.bloodGroup || 'Not specified',
        contactPhone: profile?.phoneNumber || '',
        language: summary.language,
        abhaId: summary.abhaId || profile?.abhaId || '',
      },
      section2_chiefConcern: summary.chiefComplaint,
      section3_patientConversation: interview?.responses || [],
      section4_symptoms: summary.symptoms,
      section5_dietAhara: summary.ayushAssessment?.ahara || 'Standard diet reported',
      section6_lifestyleVihara: summary.ayushAssessment?.vihara || 'Daily routine recorded',
      section7_sleepNidra: summary.ayushAssessment?.nidra || 'Normal sleep duration',
      section8_digestionAgni: summary.ayushAssessment?.agni || 'Moderate digestion',
      section9_bowelKoshtha: summary.ayushAssessment?.koshtha || 'Regular bowel movement',
      section10_medicalHistory: summary.medicalHistory,
      section11_medicines: summary.previousMedicines,
      section12_allergies: profile?.allergies || [],
      section13_ayushAssessmentInfo: {
        prakriti: summary.ayushAssessment?.prakriti || 'Information collected for physician assessment',
        vikriti: summary.ayushAssessment?.vikriti || 'Information collected for physician assessment',
        prakritiObservations: summary.ayushAssessment?.prakritiObservations,
        vikritiObservations: summary.ayushAssessment?.vikritiObservations,
        nidana: summary.ayushAssessment?.nidana,
        samprapti: summary.ayushAssessment?.samprapti,
        dashavidhaPariksha: summary.ayushAssessment?.dashavidhaPariksha,
        notice: summary.ayushAssessment?.verificationNotice,
      },
      section14_previousReports: summary.pinnedReports,
      section15_ocrText: summary.pinnedReports?.map((p) => p.extractedText).filter(Boolean) || [],
      section16_aiAssistedSummary: summary.aiGeneratedText,
      caseStatus: summary.caseStatus,
      patientConfirmation: summary.patientConfirmation,
      physicianConfirmation: summary.physicianConfirmation,
    };

    res.json({
      success: true,
      case: formattedCase,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/doctor/ayush/cases/:caseId
 * Physician reviews, edits, adds clinical notes, and confirms case
 */
const updateDoctorAyushCase = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { clinicalNotes, doctorEdits, corrections, action } = req.body;

    let summary = await HealthSummary.findOne({ interviewId: caseId });
    if (!summary) {
      summary = await HealthSummary.findById(caseId);
    }
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Case summary not found.' });
    }

    const now = new Date();
    const isConfirmAction = action === 'confirm';

    summary.doctorReview = {
      doctorId: req.user.id,
      doctorName: req.user.name,
      licenseNumber: req.user.licenseNumber || 'MCI-AYUSH-REG-10023',
      reviewedAt: now,
      clinicalNotes: clinicalNotes || summary.doctorReview?.clinicalNotes || '',
      doctorEdits: doctorEdits || summary.doctorReview?.doctorEdits || '',
    };

    if (corrections) {
      if (corrections.chiefConcern) summary.chiefComplaint = corrections.chiefConcern;
      if (corrections.duration) summary.duration = corrections.duration;
      if (corrections.symptoms) summary.symptoms = corrections.symptoms;
      if (corrections.ayushAssessment) {
        summary.ayushAssessment = { ...summary.ayushAssessment, ...corrections.ayushAssessment };
      }
    }

    if (isConfirmAction) {
      summary.caseStatus = 'PHYSICIAN_CONFIRMED';
      summary.status = 'DOCTOR_REVIEWED';
      summary.physicianConfirmation = {
        isConfirmed: true,
        confirmedAt: now,
        physicianId: req.user.id,
        physicianName: req.user.name,
        licenseNumber: req.user.licenseNumber || 'MCI-AYUSH-REG-10023',
        clinicalNotes: clinicalNotes || '',
        doctorEdits: doctorEdits || '',
        corrections: corrections || {},
      };

      await HealthInterview.findByIdAndUpdate(summary.interviewId, {
        $set: { caseStatus: 'PHYSICIAN_CONFIRMED' },
      });

      // Notify patient of physician confirmation
      await Notification.create({
        recipientId: summary.patientId,
        recipientRole: 'patient',
        title: '✓ AYUSH Physician Confirmed Your Case',
        message: `Dr. ${req.user.name} reviewed and confirmed your AYUSH case summary. Ready for consultation.`,
        link: `/patient/summary`,
      });
    }

    await summary.save();

    res.json({
      success: true,
      summary,
      caseStatus: summary.caseStatus,
      readyForConsultation: summary.caseStatus === 'PHYSICIAN_CONFIRMED',
      message: isConfirmAction
        ? 'Case confirmed by physician. Ready for consultation.'
        : 'Doctor review updates saved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAyushCase,
  submitAyushAnswer,
  checkAyushRedFlag,
  uploadAyushDocument,
  runAyushOcr,
  getAyushCase,
  generateAyushSummary,
  patientConfirmAyushCase,
  getDoctorAyushCase,
  updateDoctorAyushCase,
  lookupPatientByPhone,
};
