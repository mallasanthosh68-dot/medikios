const assert = require('assert');
const { generateNextQuestion, generateHealthSummary, detectDiseaseProfile, DISEASE_PROFILES } = require('./src/services/aiService');
const { validateAndClassifyDocument, processDocumentOCR } = require('./src/services/ocrService');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 MediKiosk Automated Feature Verification Suite');
  console.log('====================================================\n');

  // TEST 1: Disease Domain Recognition & Questioning
  console.log('▶ Test 1: Testing Disease Detection & Adaptive Follow-Up Questioning...');

  const testCases = [
    { input: 'I have severe fever with chills for 3 days', expectedId: 'fever' },
    { input: 'Having chest pain and pressure in my heart radiating to arm', expectedId: 'cardiac' },
    { input: 'Severe cough with wheezing and shortness of breath at night', expectedId: 'respiratory' },
    { input: 'Extreme stomach pain and acidity with vomiting', expectedId: 'gastrointestinal' },
    { input: 'My blood sugar is very high and I have excessive thirst', expectedId: 'diabetes' },
    { input: 'Severe throbbing headache on left side with migraine', expectedId: 'neurology' },
    { input: 'Knee joint pain and severe lower back pain', expectedId: 'orthopedic' },
    { input: 'Itching and red skin rash all over my body', expectedId: 'dermatology' },
    { input: 'Burning urination and pain in kidney flank', expectedId: 'renal' },
    { input: 'Sore throat, earache and difficulty swallowing', expectedId: 'ent' },
  ];

  for (const tc of testCases) {
    const profile = detectDiseaseProfile(tc.input);
    assert(profile, `Profile should be detected for: "${tc.input}"`);
    assert.strictEqual(profile.id, tc.expectedId, `Expected ${tc.expectedId}, got ${profile?.id}`);
    
    // Test Turn 0 question
    const q0 = await generateNextQuestion({ history: [], currentAnswer: tc.input, language: 'en' });
    assert(q0.question.length > 10, 'Question should not be empty');
    assert.strictEqual(q0.detectedDisease, profile.name);
    console.log(`  ✓ Detected [${profile.name}] -> Q1: "${q0.question.slice(0, 50)}..."`);
  }

  // TEST 1B: Multilingual Questioning (Hindi & Telugu)
  console.log('\n▶ Test 1B: Testing Multilingual Disease Questions (Hindi & Telugu)...');
  const hiFever = await generateNextQuestion({ history: [], currentAnswer: 'मुझे 3 दिन से तेज बुखार है', language: 'hi' });
  assert(hiFever.question.includes('बुखार') || hiFever.question.includes('दिनों'), 'Should ask in Hindi');
  console.log(`  ✓ Hindi Fever Question: "${hiFever.question}"`);

  const teSugar = await generateNextQuestion({ history: [], currentAnswer: 'నాకు షుగర్ చాలా ఎక్కువగా ఉంది', language: 'te' });
  assert(teSugar.question.length > 5, 'Should ask in Telugu');
  console.log(`  ✓ Telugu Diabetes Question: "${teSugar.question}"`);

  // TEST 2: Strict Document Validation & Rejection of Non-Medical Files
  console.log('\n▶ Test 2: Testing Strict Rejection of Non-Medical Files...');
  const nonMedicalSamples = [
    'amazon_tax_invoice.pdf',
    'restaurant_food_bill.jpg',
    'shopping_receipt_2025.png',
    'family_beach_selfie.jpg',
    'cat_meme_funny.png',
    'office_resume_cv.pdf',
    'car_parking_ticket.jpg',
  ];

  for (const name of nonMedicalSamples) {
    const res = validateAndClassifyDocument({ originalName: name });
    assert.strictEqual(res.isValid, false, `File "${name}" MUST be rejected as non-medical`);
    assert(res.rejectionReason.includes('Rejected'), `Rejection reason must be present for "${name}"`);
    console.log(`  ✓ Successfully REJECTED non-medical file: "${name}" -> Reason: "${res.rejectionReason}"`);
  }

  // TEST 3: Acceptance & Deep Analysis of Legitimate Medical Reports
  console.log('\n▶ Test 3: Testing Acceptance & Clinical Extraction of Genuine Medical Reports...');
  const medicalSamples = [
    { name: 'complete_blood_count_cbc.pdf', type: 'Blood Test', checkProp: 'Hemoglobin (Hb)' },
    { name: 'fasting_blood_sugar_lipid_profile.jpg', type: 'Lab Report', checkProp: 'Fasting Blood Sugar (FBS)' },
    { name: 'dr_sharma_prescription_rx.jpg', type: 'Prescription', checkProp: 'Tab. Telmisartan' },
  ];

  for (const sample of medicalSamples) {
    const validation = validateAndClassifyDocument({ originalName: sample.name, documentType: sample.type });
    assert.strictEqual(validation.isValid, true, `File "${sample.name}" MUST be accepted as medical`);
    console.log(`  ✓ Accepted medical report: "${sample.name}" -> Category: [${validation.clinicalCategory}]`);

    // Perform OCR extraction
    const ocrResult = await processDocumentOCR({ originalName: sample.name, documentType: sample.type });
    assert.strictEqual(ocrResult.isValid, true);
    assert(ocrResult.confidenceScore >= 75, 'Confidence score should be >= 75');
    console.log(`    ↳ Extracted ${ocrResult.structuredData.labTests.length} lab tests, ${ocrResult.structuredData.medicines.length} medications. Confidence: ${ocrResult.confidenceScore}%`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL FEATURE TESTS PASSED SUCCESSFULLY! (100% OK)');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
