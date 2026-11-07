const {
  generateNextQuestion,
  generateHealthSummary,
  calculateCaseDataQualityScore,
  screenRedFlags,
  AYUSH_GREETINGS,
  GREETINGS,
} = require('../backend/src/services/aiService');

async function runTests() {
  console.log('=== TEST 1: AYUSH GREETINGS & RED FLAGS ===');
  console.log('AYUSH En greeting:', AYUSH_GREETINGS.en);
  console.log('AYUSH Hi greeting:', AYUSH_GREETINGS.hi);
  console.log('AYUSH Te greeting:', AYUSH_GREETINGS.te);

  const rfTest = screenRedFlags('Patient has sudden chest pain radiating to left arm and cold sweats');
  console.log('Red Flag Detection Result:', rfTest.isRedFlag, rfTest.primaryCategory?.category);
  if (!rfTest.isRedFlag) {
    throw new Error('Red flag should be detected');
  }

  console.log('\n=== TEST 2: AYUSH ADAPTIVE QUESTION GENERATION ===');
  const q1 = await generateNextQuestion({
    history: [],
    currentAnswer: 'I have indigestion, gas, and feeling very tired with joint stiffness for 2 weeks',
    language: 'en',
    healthcareMode: 'ayush',
    communicationMode: 'voice',
  });
  console.log('Next Question:', q1.question);
  console.log('Is complete:', q1.isComplete);
  console.log('Turn count:', q1.turnCount);

  console.log('\n=== TEST 3: CASE DATA QUALITY SCORE CALCULATION ===');
  const responses = [
    { question: 'What brings you here?', answer: 'I have severe burning indigestion and pain after meals' },
    { question: 'How long?', answer: 'It has been going on for 3 weeks' },
    { question: 'Any other symptoms?', answer: 'Headache and nausea in the morning' },
    { question: 'Any medications?', answer: 'I take antacid gel and warm water' },
  ];
  const qScore = calculateCaseDataQualityScore({
    responses,
    chiefComplaint: 'Burning indigestion after meals',
    symptoms: ['Indigestion', 'Burning pain', 'Headache'],
    duration: '3 weeks',
    severity: 'Moderate',
    medicalHistory: ['Gastritis'],
  });
  console.log('Calculated Quality Score:', qScore);
  if (qScore.overallScore < 70) {
    throw new Error('Quality score should be >= 70 for comprehensive responses');
  }

  console.log('\n=== TEST 4: AYUSH HEALTH SUMMARY GENERATION ===');
  const summaryResult = await generateHealthSummary({
    patientProfile: { name: 'Santhosh M', age: 28, gender: 'Male' },
    interviewResponses: responses,
    language: 'en',
    healthcareMode: 'ayush',
    communicationMode: 'voice',
  });
  console.log('Summary Chief Complaint:', summaryResult.chiefComplaint);
  console.log('Summary Specialty:', summaryResult.suggestedSpecialty);
  console.log('AYUSH Assessment:', summaryResult.ayushAssessment);
  console.log('Case Data Quality Score in Summary:', summaryResult.caseDataQualityScore);

  if (!summaryResult.ayushAssessment || !summaryResult.caseDataQualityScore) {
    throw new Error('Summary must contain ayushAssessment and caseDataQualityScore');
  }

  console.log('\n>>> ALL UNIT TESTS PASSED SUCCESSFULLY! <<<');
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
