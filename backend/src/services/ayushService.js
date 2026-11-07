const { screenEmergencyRedFlags } = require('../utils/emergencyRedFlags');
const { callGroqLLM, generateAiMedicationSuggestions } = require('./aiService');

// Natural Multilingual Opening Questions (Adaptive Case-Taking Entrypoint)
const AYUSH_STARTING_QUESTIONS = {
  en: 'Please tell me about the main health problem or concern that brought you to the hospital today.',
  hi: 'कृपया मुझे उस मुख्य स्वास्थ्य समस्या या चिंता के बारे में बताएं जो आज आपको अस्पताल लाई है।',
  te: 'దయచేసి ఈ రోజు మీరు ఆసుపత్రికి రావడానికి గల ప్రధాన ఆరోగ్య సమస్య లేదా ఆందోళన గురించి నాకు చెప్పండి.',
  ta: 'இன்று நீங்கள் மருத்துவமனைக்கு வரக் காரணமான முதன்மையான உடல்நலப் பிரச்சினை அல்லது சிரமத்தைப் பற்றி கூறுங்கள்.',
  kn: 'ಇಂದು ನೀವು ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಲು ಕಾರಣವಾದ ಮುಖ್ಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ತೊಂದರೆಯ ಬಗ್ಗೆ ದಯವಿಟ್ಟು ತಿಳಿಸಿ.',
  ml: 'ഇന്ന് നിങ്ങൾ ആശുപത്രിയിൽ വരാൻ കാരണമായ പ്രധാന ആരോഗ്യ പ്രശ്നത്തെക്കുറിച്ച് ദയവായി പറയുക.',
  bn: 'আজ আপনার হাসপাতালে আসার প্রধান স্বাস্থ্য সমস্যা বা উদ্বেগের বিষয়ে দয়া করে আমাকে বলুন।',
  mr: 'कृपया मला आज तुम्हाला रुग्णालयात आणणाऱ्या मुख्य आरोग्य समस्येबद्दल किंवा त्रासाबद्दल सांगा.',
  gu: 'કૃપા કરીને મને આજે તમને હોસ્પિટલ લાવનારી મુખ્ય સ્વાસ્થ્ય સમસ્યા અથવા ચિંતા વિશે જણાવો.',
  pa: 'ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਉਸ ਮੁੱਖ ਸਿਹਤ ਸਮੱਸਿਆ ਬਾਰੇ ਦੱਸੋ ਜਿਸ ਕਾਰਨ ਤੁਸੀਂ ਅੱਜ ਹਸਪਤਾਲ ਆਏ ਹੋ।',
  od: 'ଆଜି ଆପଣଙ୍କୁ ଡାକ୍ତରଖାନା ଆଣିଥିବା ମୁଖ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ସମସ୍ୟା ବିଷୟରେ ଦୟାକରି ମୋତେ କୁହନ୍ତୁ।',
};

// Section Category Labels
const SECTION_CATEGORIES = {
  chief_concern: { label: 'Present Health Concern', en: 'Present Health Concern' },
  duration: { label: 'Symptom Duration & Onset', en: 'Symptom Duration' },
  progression: { label: 'Aggravating Factors & Timing', en: 'Timing & Triggers' },
  diet_ahara: { label: 'Diet & Food Patterns (Ahara)', en: 'Diet (Ahara)' },
  digestion_agni: { label: 'Digestion & Appetite (Agni)', en: 'Digestion (Agni)' },
  bowel_koshtha: { label: 'Bowel Habits (Koshtha)', en: 'Bowel Habits (Koshtha)' },
  sleep_nidra: { label: 'Sleep & Daily Routine (Nidra & Vihara)', en: 'Sleep & Routine' },
  medical_history: { label: 'Medical History & Current Medications', en: 'Medical History' },
  completed: { label: 'Case History Complete', en: 'Initial Intake Complete' },
};

// Completion messages per language
const COMPLETION_MESSAGES = {
  en: 'Thank you. I have collected the information needed for your initial case history.',
  hi: 'धन्यवाद। मैंने आपके प्रारंभिक केस इतिहास के लिए आवश्यक जानकारी एकत्र कर ली है।',
  te: 'ధన్యవాదాలు. మీ ప్రాథమిక కేస్ హిస్టరీ కోసం అవసరమైన సమాచారాన్ని నేను సేకరించాను.',
  ta: 'நன்றி. உங்கள் ஆரம்பநிலை மருத்துவ வரலாற்றுக்கு தேவையான தகவல்களை நான் சேகரித்துள்ளேன்.',
  kn: 'ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಕೇಸ್ ಹಿಸ್ಟರಿಗೆ ಅಗತ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ನಾನು ಸಂಗ್ರಹಿಸಿದ್ದೇನೆ.',
  ml: 'നന്ദി. നിങ്ങളുടെ പ്രാഥമിക കേസ് ഹിസ്റ്ററിക്ക് ആവശ്യമായ വിവരങ്ങൾ ഞാൻ ശേഖരിച്ചിട്ടുണ്ട്.',
  bn: 'ধন্যবাদ। আমি আপনার প্রাথমিক কেস হিস্ট্রির জন্য প্রয়োজনীয় তথ্য সংগ্রহ করেছি।',
  mr: 'धन्यवाद. मी तुमच्या प्राथमिक केस हिस्ट्रीसाठी आवश्यक असलेली माहिती गोळा केली आहे.',
};

/**
 * Get starting question in patient's selected language
 */
const getAyushStartingQuestion = (language = 'en') => {
  return AYUSH_STARTING_QUESTIONS[language] || AYUSH_STARTING_QUESTIONS.en;
};

/**
 * Extract structured information from accumulated responses
 */
const extractStructuredAYUSHData = (responses = []) => {
  const data = {
    chiefConcern: '',
    duration: '',
    progression: '',
    symptoms: [],
    dietAhara: '',
    digestionAgni: '',
    bowelKoshtha: '',
    lifestyleVihara: '',
    sleepNidra: '',
    medicalHistory: [],
    medications: [],
    allergies: [],
    ayushObservations: '',
  };

  if (!Array.isArray(responses) || responses.length === 0) {
    return data;
  }

  responses.forEach((r, idx) => {
    const ans = (r.answer || '').trim();
    const q = (r.question || '').toLowerCase();

    if (idx === 0 || !data.chiefConcern) {
      data.chiefConcern = ans;
      data.symptoms.push(ans);
    } else if (q.includes('when') || q.includes('how long') || q.includes('duration') || q.includes('notice')) {
      data.duration = ans;
    } else if (q.includes('before eating') || q.includes('after eating') || q.includes('timing') || q.includes('different times')) {
      data.progression = ans;
    } else if (q.includes('food') || q.includes('meal') || q.includes('diet') || q.includes('ahara')) {
      data.dietAhara = ans;
    } else if (q.includes('appetite') || q.includes('digestion') || q.includes('agni') || q.includes('gas') || q.includes('acidity')) {
      data.digestionAgni = ans;
    } else if (q.includes('bowel') || q.includes('motion') || q.includes('constipation') || q.includes('koshtha')) {
      data.bowelKoshtha = ans;
    } else if (q.includes('sleep') || q.includes('routine') || q.includes('nidra') || q.includes('vihara')) {
      data.sleepNidra = ans;
      data.lifestyleVihara = ans;
    } else if (q.includes('medicine') || q.includes('condition') || q.includes('history') || q.includes('allerg')) {
      data.medications.push(ans);
      data.medicalHistory.push(ans);
    } else {
      data.symptoms.push(ans);
    }
  });

  return data;
};

/**
 * Count how many clinical parameters have been collected
 */
const countCollectedParameters = (structuredData) => {
  let count = 0;
  if (structuredData.chiefConcern) count++;
  if (structuredData.duration) count++;
  if (structuredData.progression) count++;
  if (structuredData.dietAhara) count++;
  if (structuredData.digestionAgni) count++;
  if (structuredData.bowelKoshtha) count++;
  if (structuredData.sleepNidra || structuredData.lifestyleVihara) count++;
  if (structuredData.medications?.length > 0 || structuredData.medicalHistory?.length > 0) count++;
  return count;
};

/**
 * Determine the next adaptive question based on structured case state
 */
const determineNextAdaptiveQuestion = async ({
  history = [],
  currentAnswer = '',
  language = 'en',
  groqApiKey = null,
}) => {
  // 1. Red-flag screening on the latest answer
  const redFlag = screenEmergencyRedFlags(currentAnswer, language);
  if (redFlag && redFlag.isRedFlag) {
    return {
      message:
        '⚠️ POSSIBLE URGENT SYMPTOM: Some information you provided may require immediate attention. Please inform hospital staff or your physician immediately.',
      nextQuestionReason: 'Safety escalation triggered due to critical symptom keywords',
      category: 'emergency',
      categoryLabel: '⚠️ Urgent Warning Sign',
      riskLevel: 'urgent',
      isRedFlag: true,
      continueInterview: false,
      readyForSummary: false,
      redFlagData: redFlag,
      collectedParametersCount: countCollectedParameters(extractStructuredAYUSHData(history)),
    };
  }

  // 2. Extract current structured case memory
  const structuredData = extractStructuredAYUSHData(history);
  const collectedCount = countCollectedParameters(structuredData);

  // 3. Check stopping criteria:
  // If we have chief concern, duration, food relation/diet, digestion/agni, bowel/koshtha, and routine/meds (or >= 5 meaningful turns)
  const isSufficientInfo =
    (structuredData.chiefConcern &&
      structuredData.duration &&
      (structuredData.dietAhara || structuredData.progression) &&
      structuredData.digestionAgni &&
      (structuredData.bowelKoshtha || structuredData.sleepNidra)) ||
    history.length >= 6;

  if (isSufficientInfo) {
    const completionMsg = COMPLETION_MESSAGES[language] || COMPLETION_MESSAGES.en;
    return {
      message: completionMsg,
      nextQuestionReason: 'All high-value AYUSH clinical domains gathered',
      category: 'completed',
      categoryLabel: SECTION_CATEGORIES.completed.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: false,
      readyForSummary: true,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  // 4. Try LLM for dynamic, context-specific follow-up if Groq key is available
  const effectiveKey = groqApiKey || process.env.GROQ_API_KEY;
  if (effectiveKey) {
    try {
      const historyContext = history
        .map((h, i) => `Turn ${i + 1} - AI: "${h.question}" | Patient: "${h.answer}"`)
        .join('\n');

      const systemPrompt = `You are the MediKiosk AI Case-Taking Assistant for AYUSH consultation in India.
CRITICAL CLINICAL RULES:
1. YOU ARE NOT A DOCTOR. DO NOT DIAGNOSE OR SUGGEST DISEASES. DO NOT PRESCRIBE MEDICINES OR DOSAGES.
2. Ask exactly ONE single, compassionate, targeted question at a time.
3. Your role is "AI-assisted case-taking" to prepare a structured case history for the physician.
4. DO NOT repeat any questions already answered in the conversation history.
5. Focus adaptively on the missing information:
   - Onset and Duration (When did it start?)
   - Timing & triggers (Before/after meals, specific times?)
   - Food habits & Diet (Ahara)
   - Digestion, appetite, acidity/gas (Agni)
   - Bowel habits & regularity (Koshtha)
   - Sleep quality & routine (Nidra & Vihara)
   - Current medicines or home remedies
6. Language: You MUST formulate your question in language code "${language}".
7. Output JSON format only:
{
  "question": "your question in ${language}",
  "nextQuestionReason": "brief clinical rationale",
  "category": "duration | progression | diet_ahara | digestion_agni | bowel_koshtha | sleep_nidra | medical_history"
}`;

      const userPrompt = `Conversation History so far:\n${historyContext}\n\nPatient just said: "${currentAnswer}"\n\nGenerate the next single adaptive question in language "${language}".`;

      const llmResponse = await callGroqLLM({
        groqApiKey: effectiveKey,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      });

      if (llmResponse) {
        let parsed = null;
        try {
          const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {}

        if (parsed && parsed.question) {
          const cat = parsed.category || 'progression';
          return {
            message: parsed.question,
            nextQuestionReason: parsed.nextQuestionReason || 'Adaptive follow-up',
            category: cat,
            categoryLabel: SECTION_CATEGORIES[cat]?.label || 'Present Health Concern',
            riskLevel: 'normal',
            isRedFlag: false,
            continueInterview: true,
            readyForSummary: false,
            collectedParametersCount: collectedCount,
            structuredData,
          };
        }
      }
    } catch (llmErr) {
      console.warn('AYUSH LLM adaptive generation fallback:', llmErr.message);
    }
  }

  // 5. Deterministic Adaptive Fallback Engine (Clinically Sequenced & Multi-Lingual)
  if (!structuredData.duration) {
    const questions = {
      en: 'When did you first notice this problem?',
      hi: 'आपने पहली बार इस समस्या को कब देखा या यह कब शुरू हुई?',
      te: 'మీరు ఈ సమస్యను మొదట ఎప్పుడు గమనించారు లేదా ఇది ఎప్పుడు ప్రారంభమైంది?',
      ta: 'இந்த பிரச்சினையை நீங்கள் முதலில் எப்போது கவனித்தீர்கள்?',
      kn: 'ನೀವು ಈ ಸಮಸ್ಯೆಯನ್ನು ಮೊದಲು ಯಾವಾಗ ಗಮನಿಸಿದಿರಿ?',
      ml: 'ഈ പ്രശ്നം നിങ്ങൾ ആദ്യമായി എപ്പോഴാണ് ശ്രദ്ധിച്ചത്?',
    };
    return {
      message: questions[language] || questions.en,
      nextQuestionReason: 'Need symptom onset and duration',
      category: 'duration',
      categoryLabel: SECTION_CATEGORIES.duration.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: true,
      readyForSummary: false,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  if (!structuredData.progression) {
    const questions = {
      en: 'Does the discomfort usually happen before eating, after eating, or at different times of the day?',
      hi: 'क्या यह परेशानी आमतौर पर खाने से पहले, खाने के बाद या दिन के अलग-अलग समय पर होती है?',
      te: 'ఈ అసౌకర్యం సాధారణంగా తినడానికి ముందు, తిన్న తర్వాత లేదా రోజులో వేర్వేరు సమయాల్లో వస్తుందా?',
      ta: 'இந்த சிரமம் பொதுவாக சாப்பிடுவதற்கு முன்பா, சாப்பிட்ட பின்பா, அல்லது நாளின் வேறு நேரங்களிலா?',
      kn: 'ಈ ಅಸ್ವಸ್ಥತೆ ಸಾಮಾನ್ಯವಾಗಿ ಊಟಕ್ಕೆ ಮುಂಚೆ, ಊಟದ ನಂತರ ಅಥವಾ ದಿನದ ಬೇರೆ ಸಮಯದಲ್ಲಿ ಉಂಟಾಗುತ್ತದೆಯೇ?',
      ml: 'ഈ അസ്വസ്ഥത സാധാരണയായി ഭക്ഷണം കഴിക്കുന്നതിന് മുമ്പാണോ, ശേഷമാണോ അതോ ദിവസത്തിലെ മറ്റ് സമയങ്ങളിലാണോ ഉണ്ടാകുന്നത്?',
    };
    return {
      message: questions[language] || questions.en,
      nextQuestionReason: 'Need aggravating timing and relationship with food',
      category: 'progression',
      categoryLabel: SECTION_CATEGORIES.progression.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: true,
      readyForSummary: false,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  if (!structuredData.dietAhara) {
    const questions = {
      en: 'Are there particular foods, meals, or dietary habits after which you notice this discomfort more?',
      hi: 'क्या कोई विशेष भोजन, भारी आहार या खानपान की आदतें हैं जिनके बाद आपको यह परेशानी अधिक महसूस होती है?',
      te: 'ఏవైనా నిర్దిష్ట ఆహారాలు, భారీ భోజనం లేదా ఆహారపు అలవాట్ల తర్వాత మీరు ఈ అసౌకర్యాన్ని ఎక్కువగా గమనిస్తున్నారా?',
      ta: 'எந்தவொரு குறிப்பிட்ட உணவு அல்லது பழக்கங்களுக்குப் பிறகு இந்த அசௌகரியம் அதிகமாகிறதா?',
      kn: 'ಯಾವುದಾದರೂ ನಿರ್ದಿಷ್ಟ ಆಹಾರ ಅಥವಾ ಊಟದ ನಂತರ ಈ ಅಸ್ವಸ್ಥತೆ ಹೆಚ್ಚಾಗುತ್ತದೆಯೇ?',
      ml: 'പ്രത്യേക ഭക്ഷണങ്ങൾക്കോ ശീലങ്ങൾക്കോ ശേഷമാണോ ഈ അസ്വസ്ഥത കൂടുതൽ ശ്രദ്ധിക്കുന്നത്?',
    };
    return {
      message: questions[language] || questions.en,
      nextQuestionReason: 'Need dietary factors (Ahara)',
      category: 'diet_ahara',
      categoryLabel: SECTION_CATEGORIES.diet_ahara.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: true,
      readyForSummary: false,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  if (!structuredData.digestionAgni) {
    const questions = {
      en: 'In AYUSH, digestion (Agni) is essential. How is your normal appetite, and do you feel heaviness, gas, or acidity?',
      hi: 'आयुष में पाचन (अग्नि) बहुत महत्वपूर्ण है। आपकी सामान्य भूख कैसी है, और क्या आपको भारीपन, गैस या अम्लता (एसिडिटी) महसूस होती है?',
      te: 'ఆయుష్‌లో జీర్ణక్రియ (అగ్ని) చాలా ముఖ్యం. మీ సాధారణ ఆకలి ఎలా ఉంది, మరియు మీకు కడుపులో బరువుగా ఉండటం, గ్యాస్ లేదా ఎసిడిటీ అనిపిస్తుందా?',
      ta: 'ஆயுஷில் செரிமானம் (அக்னி) மிக முக்கியமானது. உங்கள் பசி எப்படி இருக்கிறது, வயிறு கனமாகவோ வாய்வாகவோ உணர்கிறீர்களா?',
      kn: 'ಆಯುಷ್‌ನಲ್ಲಿ ಜೀರ್ಣಕ್ರಿಯೆ (ಅಗ್ನಿ) ಬಹಳ ಮುಖ್ಯ. ನಿಮ್ಮ ಸಾಮಾನ್ಯ ಹಸಿವು ಹೇಗಿದೆ ಮತ್ತು ಗ್ಯಾಸ್ ಅಥವಾ ಆಸಿಡಿಟಿ ಆಗುತ್ತದೆಯೇ?',
      ml: 'ആയുഷിൽ ദഹനം (അഗ്നി) പ്രധാനമാണ്. വിശപ്പ് എങ്ങനെയുണ്ട്, അസിഡിറ്റിയോ ഗ്യാസോ അനുഭവപ്പെടുന്നുണ്ടോ?',
    };
    return {
      message: questions[language] || questions.en,
      nextQuestionReason: 'Need digestion and metabolic parameters (Agni)',
      category: 'digestion_agni',
      categoryLabel: SECTION_CATEGORIES.digestion_agni.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: true,
      readyForSummary: false,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  if (!structuredData.bowelKoshtha) {
    const questions = {
      en: 'How are your bowel habits (regular, constipation tendency, or loose)?',
      hi: 'आपकी शौच की आदतें (कोष्ठ) कैसी हैं - नियमित, कब्ज की प्रवृत्ति, या ढीली?',
      te: 'మీ ప్రేగు అలవాట్లు (కోష్ఠ) ఎలా ఉన్నాయి - క్రమబద్ధంగా, మలబద్ధకం ఉందా లేదా వదులుగా ఉన్నాయా?',
      ta: 'உங்கள் குடல் பழக்கம் (மலச்சிக்கல் அல்லது இயல்பு) எவ்வாறு உள்ளது?',
      kn: 'ನಿಮ್ಮ ಮಲವಿಸರ್ಜನೆಯ ಅಭ್ಯಾಸಗಳು (ಕೋಷ್ಠ) ಹೇಗಿವೆ - ನಿಯಮಿತವೇ ಅಥವಾ ಮಲಬದ್ಧತೆಯೇ?',
      ml: 'മലവിസർജ്ജന ശീലങ്ങൾ എങ്ങനെയുണ്ട് - ക്രമമാണോ അതോ മലബന്ധം ഉണ്ടോ?',
    };
    return {
      message: questions[language] || questions.en,
      nextQuestionReason: 'Need bowel pattern (Koshtha)',
      category: 'bowel_koshtha',
      categoryLabel: SECTION_CATEGORIES.bowel_koshtha.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: true,
      readyForSummary: false,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  if (!structuredData.sleepNidra) {
    const questions = {
      en: 'How is your sleep (Nidra), and are you currently taking any medicines or home remedies?',
      hi: 'आपकी नींद (निद्रा) कैसी है, और क्या आप वर्तमान में कोई दवाइयां या पारंपरिक उपचार ले रहे हैं?',
      te: 'మీ నిద్ర (నిద్ర) ఎలా ఉంది, మరియు మీరు ప్రస్తుతం ఏవైనా మందులు లేదా సాంప్రదాయ నివారణలు తీసుకుంటున్నారా?',
      ta: 'உங்கள் தூக்கம் (நித்ரா) எவ்வாறு உள்ளது, மற்றும் ஏதேனும் மருந்துகள் எடுத்துக் கொள்கிறீர்களா?',
      kn: 'ನಿಮ್ಮ ನಿದ್ರೆ ಹೇಗಿದೆ ಮತ್ತು ಪ್ರಸ್ತುತ ನೀವು ಯಾವುದೇ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?',
      ml: 'ഉറക്കം എങ്ങനെയുണ്ട്, നിലവിൽ എന്തെങ്കിലും മരുന്നുകൾ കഴിക്കുന്നുണ്ടോ?',
    };
    return {
      message: questions[language] || questions.en,
      nextQuestionReason: 'Need sleep, routine, and current medications',
      category: 'sleep_nidra',
      categoryLabel: SECTION_CATEGORIES.sleep_nidra.label,
      riskLevel: 'normal',
      isRedFlag: false,
      continueInterview: true,
      readyForSummary: false,
      collectedParametersCount: collectedCount,
      structuredData,
    };
  }

  // Fallback completion
  const completionMsg = COMPLETION_MESSAGES[language] || COMPLETION_MESSAGES.en;
  return {
    message: completionMsg,
    nextQuestionReason: 'Sufficient intake data collected for physician review',
    category: 'completed',
    categoryLabel: SECTION_CATEGORIES.completed.label,
    riskLevel: 'normal',
    isRedFlag: false,
    continueInterview: false,
    readyForSummary: true,
    collectedParametersCount: collectedCount,
    structuredData,
  };
};

/**
 * Generate Structured AYUSH Health Case Summary
 * Exactly following the 12 specified sections.
 */
const buildAyushStructuredSummary = ({
  patientProfile = {},
  interview = {},
  attachedReports = [],
  patientCorrections = {},
}) => {
  const structuredData = {
    ...extractStructuredAYUSHData(interview.responses || []),
    ...patientCorrections,
  };

  const name = patientProfile.name || 'Patient';
  const age = patientProfile.age || 35;
  const gender = patientProfile.gender || 'Not specified';
  const language = interview.language || 'en';

  const chiefConcern = structuredData.chiefConcern || 'Stomach discomfort and digestive irregularity';
  const duration = structuredData.duration || 'Reported during intake';
  const progression = structuredData.progression || 'Symptoms related to meal timing';
  const dietAhara = structuredData.dietAhara || 'General Indian diet; symptoms noted after heavy meals';
  const lifestyleVihara = structuredData.lifestyleVihara || 'Daily routine recorded; moderate daily activity';
  const sleepNidra = structuredData.sleepNidra || 'Normal sleep duration';
  const digestionAgni = structuredData.digestionAgni || 'Moderate Agni; intermittent heaviness';
  const bowelKoshtha = structuredData.bowelKoshtha || 'Regular bowel movement pattern';
  const medicalHistory = structuredData.medicalHistory?.length
    ? structuredData.medicalHistory
    : ['No prior chronic conditions declared during intake'];
  const medications = structuredData.medications?.length
    ? structuredData.medications
    : ['No active prescription medications recorded'];
  const allergies = structuredData.allergies?.length ? structuredData.allergies : ['No known drug/food allergies reported'];

  // AYUSH Assessment Observations (Carefully framed as "Information collected for physician assessment")
  const prakritiObservations = `Patient-reported constitutional tendencies: Moderate build, sensitivity to irregular meal timing. *Information collected for physician assessment; definitive Prakriti Pariksha to be confirmed by Vaidya.`;
  const vikritiObservations = `Observed tendency: Digestive discomfort (Agni Mandya/Ajeerna traits) associated with dietary intake. *Information collected for physician assessment.`;
  const nidana = `Ahara-related factors: Discomfort triggered or aggravated following heavy or irregular meals.`;
  const samprapti = `Onset noted over duration (${duration}); progression correlated with food intake.`;
  const dashavidhaPariksha = {
    prakriti: 'Information collected for physician assessment',
    vikriti: 'Agni-related imbalance traits reported',
    sara: 'Average',
    samhanana: 'Moderate',
    pramana: 'Normal',
    satmya: 'Mixed diet',
    satva: 'Stable',
    aharaShakti: 'Moderate appetite',
    vyayamaShakti: 'Moderate',
    vaya: `${age} years`,
  };

  // OCR Document Information
  const ocrReports = attachedReports.map((r) => ({
    title: r.title,
    date: r.date || 'Recent Report',
    hasExtractedText: r.hasExtractedText || false,
    extractedText: r.extractedText || '',
    confidenceScore: r.confidenceScore || 85,
  }));

  // Patient Responses
  const patientStatements = (interview.responses || []).map((r) => `Q: ${r.question} → A: ${r.answer}`);

  // Safety / Red Flags
  const redFlagStatus = interview.priority === 'HIGH_PRIORITY' ? 'HIGH_PRIORITY' : 'NONE';
  const redFlagMessage =
    redFlagStatus === 'HIGH_PRIORITY'
      ? 'Potential red flag noted during intake. Immediate clinical triage review advised.'
      : 'No acute emergency red flags identified during initial case taking.';

  // AI-Assisted Clinical Narrative
  const aiGeneratedText = `PATIENT CASE SUMMARY (AYUSH CASE-TAKING ASSISTANCE)
------------------------------------------------------------
NOTICE: AI-ASSISTED CASE SUMMARY • PHYSICIAN REVIEW REQUIRED
This report structures patient-reported intake data for review by a registered AYUSH practitioner (Vaidya). This system does not diagnose or prescribe.

Patient ${name} (${age}y / ${gender}) reports a primary concern of "${chiefConcern}" with a duration of ${duration}.
Key Presenting Features: ${progression}.
Diet (Ahara): ${dietAhara}.
Digestion (Agni): ${digestionAgni}.
Bowel Habits (Koshtha): ${bowelKoshtha}.
Lifestyle & Sleep (Vihara & Nidra): ${lifestyleVihara}; Sleep: ${sleepNidra}.
Relevant Medical History: ${medicalHistory.join(', ')}.
Current Medications / Remedies: ${medications.join(', ')}.
Allergies: ${allergies.join(', ')}.

AYUSH OBSERVATIONS (COLLECTED FOR PHYSICIAN ASSESSMENT):
- Prakriti Inquiry: ${prakritiObservations}
- Vikriti Traits: ${vikritiObservations}
- Nidana (Aetiological Triggers): ${nidana}
- Samprapti Notes: ${samprapti}

Triage Priority: ${redFlagStatus === 'HIGH_PRIORITY' ? 'URGENT' : 'ROUTINE OPD'}.
Physician confirmation and clinical examination (Nadi Pariksha / Dashavidha Pariksha) required before treatment.`;

  return {
    patientInfo: { name, age, gender, language },
    chiefConcern,
    duration,
    progression,
    symptoms: structuredData.symptoms || [chiefConcern],
    dietAhara,
    lifestyleVihara,
    sleepNidra,
    digestionAgni,
    bowelKoshtha,
    medicalHistory,
    medications,
    allergies,
    ayushAssessment: {
      prakriti: 'Information collected for physician assessment',
      vikriti: 'Information collected for physician assessment',
      prakritiObservations,
      vikritiObservations,
      agni: digestionAgni,
      koshtha: bowelKoshtha,
      ahara: dietAhara,
      vihara: lifestyleVihara,
      nidra: sleepNidra,
      nidana,
      samprapti,
      dashavidhaPariksha,
      traditionalPractices: medications,
      verificationNotice: 'Information collected for physician assessment. Qualified practitioner review and confirmation required.',
    },
    ocrReports,
    patientStatements,
    // Full Q&A Transcript: AI Questions Asked & Patient Answers Given
    interviewResponses: Array.isArray(interview.responses) && interview.responses.length > 0
      ? interview.responses.map((r) => ({
          question: r.question || '',
          answer: r.answer || '',
          inputMode: r.inputMode || 'voice',
          timestamp: r.timestamp || new Date(),
        }))
      : [],
    // AI Medication Suggestions for Vaidya / Attending Doctor Review
    aiMedicationSuggestions: typeof generateAiMedicationSuggestions === 'function'
      ? generateAiMedicationSuggestions({
          fullText: `${chiefConcern} ${structuredData.symptoms?.join(' ') || ''} ${patientStatements.join(' ')}`,
          chiefComplaint: chiefConcern,
          symptoms: structuredData.symptoms || [chiefConcern],
          healthcareMode: 'ayush',
          patientProfile,
        })
      : [],
    redFlagStatus,
    redFlagMessage,
    aiGeneratedText,
  };
};

module.exports = {
  AYUSH_STARTING_QUESTIONS,
  SECTION_CATEGORIES,
  COMPLETION_MESSAGES,
  getAyushStartingQuestion,
  extractStructuredAYUSHData,
  countCollectedParameters,
  determineNextAdaptiveQuestion,
  buildAyushStructuredSummary,
};
