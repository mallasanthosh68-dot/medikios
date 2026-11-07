const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { HealthInterview, HealthResponse, PatientProfile, User } = require('../models');
const {
  generateNextQuestion,
  generateHealthSummary,
  GREETINGS,
  AYUSH_GREETINGS,
  screenRedFlags,
  translateText,
} = require('../services/aiService');

/**
 * @route   POST /api/ai/chat
 * @desc    Dedicated AI Chat API for conversational case-taking (General Medical or AYUSH)
 * @body    { conversationId, patientId, healthcareMode, communicationMode, language, message, groqApiKey }
 */
router.post('/chat', async (req, res, next) => {
  try {
    const {
      conversationId,
      patientId,
      healthcareMode = 'general_medical',
      communicationMode = 'text',
      language = 'en',
      message = '',
      groqApiKey,
    } = req.body;

    let resolvedPatientId = req.user?.id || patientId;
    if (!resolvedPatientId || !mongoose.Types.ObjectId.isValid(String(resolvedPatientId))) {
      const existingPatient = await User.findOne({ role: 'patient' }).catch(() => null);
      resolvedPatientId = existingPatient ? existingPatient._id : new mongoose.Types.ObjectId();
    }

    let interview = null;

    if (conversationId && mongoose.Types.ObjectId.isValid(String(conversationId))) {
      interview = await HealthInterview.findById(conversationId);
    }

    // Initialize interview if not found or no conversationId
    if (!interview) {
      const initialGreeting = healthcareMode === 'ayush'
        ? (AYUSH_GREETINGS[language] || AYUSH_GREETINGS.en)
        : (GREETINGS[language] || GREETINGS.en);

      interview = await HealthInterview.create({
        patientId: resolvedPatientId,
        language,
        healthcareMode,
        communicationMode,
        status: 'in_progress',
        responses: [],
        redFlagsDetected: [],
        priority: 'NORMAL',
      });

      // If user hasn't typed an answer yet, return the welcome/greeting question
      if (!message || message.trim() === '') {
        return res.json({
          success: true,
          conversationId: interview._id,
          healthcareMode: interview.healthcareMode,
          communicationMode: interview.communicationMode,
          language: interview.language,
          nextQuestion: initialGreeting,
          isComplete: false,
          turnCount: 0,
          aiSource: 'knowledge_base_adaptive',
          redFlagCheck: {
            isRedFlag: false,
            priority: 'NORMAL',
            alertMessage: null,
            flags: [],
            hotlines: ['112', '108', '911'],
          },
        });
      }
    }

    const effectiveGroqKey = groqApiKey || req.headers['x-groq-api-key'] || process.env.GROQ_API_KEY;
    const profile = await PatientProfile.findOne({ userId: patientId }).catch(() => null);

    // If session is already completed, exit cleanly
    if (interview.status === 'completed') {
      return res.json({
        success: true,
        conversationId: interview._id,
        healthcareMode: interview.healthcareMode || healthcareMode,
        communicationMode: interview.communicationMode || communicationMode,
        language: interview.language || language,
        nextQuestion: (interview.language || language) === 'hi'
          ? 'यह परामर्श पूरा हो गया है। आपका स्वास्थ्य सारांश तैयार है।'
          : 'This consultation is complete. Your health summary is ready for physician review.',
        isComplete: true,
        turnCount: interview.responses ? interview.responses.length : 3,
        aiSource: 'session_completed',
        redFlagCheck: {
          isRedFlag: interview.priority === 'HIGH_PRIORITY',
          priority: interview.priority || 'NORMAL',
          alertMessage: null,
          flags: [],
          hotlines: ['112', '108', '911'],
        },
      });
    }

    const currentMode = interview.healthcareMode || healthcareMode || 'general_medical';
    const currentComm = interview.communicationMode || communicationMode || 'text';
    const currentLang = interview.language || language || 'en';

    // Last asked question or initial greeting
    let lastQuestion = (interview.responses && interview.responses.length > 0)
      ? interview.responses[interview.responses.length - 1].question
      : (currentMode === 'ayush' ? (AYUSH_GREETINGS[currentLang] || AYUSH_GREETINGS.en) : (GREETINGS[currentLang] || GREETINGS.en));

    // Translate answer into interview language if needed
    let processedAnswer = message;
    if (currentLang !== 'en') {
      const translated = await translateText(message, currentLang, effectiveGroqKey);
      if (translated && translated !== message) {
        processedAnswer = translated;
      }
    }

    // Save response
    await HealthResponse.create({
      interviewId: interview._id,
      patientId: interview.patientId || resolvedPatientId,
      question: lastQuestion,
      answer: processedAnswer,
      inputMode: currentComm,
    });

    const updatedResponses = [
      ...(interview.responses || []),
      { question: lastQuestion, answer: processedAnswer, inputMode: currentComm, timestamp: new Date() },
    ];

    let chiefComplaint = interview.chiefComplaint;
    if (!chiefComplaint && updatedResponses.length > 0) {
      chiefComplaint = processedAnswer;
    }

    // Generate next adaptive question
    const aiResult = await generateNextQuestion({
      history: updatedResponses,
      currentAnswer: processedAnswer,
      language: currentLang,
      patientProfile: profile || {},
      groqApiKey: effectiveGroqKey,
      healthcareMode: currentMode,
      communicationMode: currentComm,
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
      conversationId: interview._id,
      healthcareMode: currentMode,
      communicationMode: currentComm,
      language: currentLang,
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
});

module.exports = router;
