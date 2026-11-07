const assert = require('assert');
const { screenEmergencyRedFlags, EMERGENCY_RED_FLAG_CATEGORIES } = require('./src/utils/emergencyRedFlags');
const { screenRedFlags } = require('./src/services/aiService');

console.log('===========================================================');
console.log('🚨 Automated Test Suite: Dangerous Disease Emergency Triage');
console.log('===========================================================\n');

// 1. DANGEROUS LIFE-THREATENING EMERGENCIES (MUST TRIGGER RED FLAG)
const dangerousEmergencyTestCases = [
  {
    id: 'chest_heart',
    expectedEmoji: '❤️',
    input: 'Patient has acute heart attack with crushing chest pain radiating to left arm, cold sweats and collapse',
  },
  {
    id: 'breathing',
    expectedEmoji: '🫁',
    input: 'Severe acute respiratory failure, patient cannot breathe at all, choking and blue lips cyanosis',
  },
  {
    id: 'stroke_neuro',
    expectedEmoji: '🧠',
    input: 'Acute stroke with sudden paralysis on one side, facial droop, and inability to speak',
  },
  {
    id: 'severe_headache',
    expectedEmoji: '🧠',
    input: 'Thunderclap headache, worst headache of my life peaking in seconds with stiff neck and confusion',
  },
  {
    id: 'severe_bleeding',
    expectedEmoji: '🩸',
    input: 'Massive uncontrolled arterial bleeding, vomiting blood hematemesis and spurting blood',
  },
  {
    id: 'loss_of_consciousness',
    expectedEmoji: '🧍',
    input: 'Patient is comatose, completely unresponsive, cannot wake up after sudden collapse',
  },
  {
    id: 'seizure',
    expectedEmoji: '⚡',
    input: 'Status epilepticus with continuous active violent seizures lasting more than 5 minutes',
  },
  {
    id: 'major_injury',
    expectedEmoji: '🤕',
    input: 'Major polytrauma with gunshot wound and compound fracture with bone poking through skin',
  },
  {
    id: 'severe_abdominal_pain',
    expectedEmoji: '🩸',
    input: 'Acute surgical abdomen with rigid board-like abdomen and ruptured appendix with collapse',
  },
  {
    id: 'severe_infection',
    expectedEmoji: '🌡️',
    input: 'Septic shock with high fever, neck rigidity, purpuric non-blanching rash and delirium',
  },
  {
    id: 'poisoning_overdose',
    expectedEmoji: '💊',
    input: 'Acute toxic ingestion, patient drank pesticide and took sleeping pills overdose',
  },
  {
    id: 'pregnancy_emergency',
    expectedEmoji: '🤰',
    input: 'Pregnant woman with massive heavy bleeding, eclampsia seizures and collapsed',
  },
  {
    id: 'sudden_vision_problems',
    expectedEmoji: '👁️',
    input: 'Sudden total blindness and black curtain fell over eye with sudden complete loss of vision',
  },
  {
    id: 'severe_allergic_reaction',
    expectedEmoji: '🦵',
    input: 'Anaphylactic shock with airway closing, throat closing up allergic reaction and cannot breathe',
  },
];

console.log('▶ Verifying all 14 Dangerous Life-Threatening Emergencies...');
let passCount = 0;
for (const tc of dangerousEmergencyTestCases) {
  const result = screenEmergencyRedFlags(tc.input);
  assert.strictEqual(result.isRedFlag, true, `Should detect red flag for category [${tc.id}]`);
  assert.strictEqual(result.priority, 'HIGH_PRIORITY');
  const matched = result.matchedCategories.find((c) => c.id === tc.id);
  assert(matched, `Expected category [${tc.id}] in matched categories, got: ${JSON.stringify(result.matchedCategories.map((m) => m.id))}`);
  assert.strictEqual(matched.emoji, tc.expectedEmoji);
  console.log(`  ✓ Detected ${matched.emoji} [${matched.category}] - ${matched.name}`);
  passCount++;
}

// 2. MULTILINGUAL DANGEROUS EMERGENCIES (MUST TRIGGER RED FLAG)
console.log(`\n▶ Testing Multilingual Dangerous Emergencies (Hindi, Telugu, etc.)...`);
const multiLingualDangerousTests = [
  { input: 'सीने में असहनीय दर्द है और दिल का दौरा पड़ा है', expectedId: 'chest_heart' },
  { input: 'सांस बिल्कुल नहीं आ रही और दम घुट रहा है, होठ नीले पड़ गए', expectedId: 'breathing' },
  { input: 'अचानक लकवा मार गया और मुंह टेढ़ा हो गया, आवाज लड़खड़ा रही है', expectedId: 'stroke_neuro' },
  { input: 'खून की उल्टी हो रही है और फव्वारे की तरह खून बह रहा है', expectedId: 'severe_bleeding' },
  { input: 'మరియు గుండెపోటు వచ్చింది, గుండెలో తీవ్రమైన నొప్పి', expectedId: 'chest_heart' },
  { input: 'ఊపిరి ఆడటం లేదు మరియు ఊపిరి ఆడక ఉక్కిరిబిక్కిరి అవుతున్నారు', expectedId: 'breathing' },
  { input: 'గర్భధారణలో విపరీతమైన రక్తస్రావం మరియు మూర్ఛ వచ్చింది', expectedId: 'pregnancy_emergency' },
  { input: 'పురుగుల మందు తాగడం వలన అపస్మారక స్థితిలో పడిపోయారు', expectedId: 'poisoning_overdose' },
  { input: 'एलर्जी से गला बंद हो रहा है और सांस नहीं आ रही, एनाफिलेक्सिस', expectedId: 'severe_allergic_reaction' },
];

for (const m of multiLingualDangerousTests) {
  const res = screenRedFlags(m.input);
  assert.strictEqual(res.isRedFlag, true, `Should detect multilingual red flag for: "${m.input}"`);
  const matched = res.matchedCategories.find((c) => c.id === m.expectedId);
  assert(matched, `Expected [${m.expectedId}] in matched categories for: "${m.input}"`);
  console.log(`  ✓ Multilingual Match: "${m.input}" -> ${matched.emoji} [${matched.category}]`);
  passCount++;
}

// 3. ROUTINE / COMMON DISEASES (MUST STRICTLY NOT TRIGGER EMERGENCY RED FLAGS)
console.log('\n▶ Testing Routine / Common Diseases (MUST NOT trigger emergency red flags)...');
const routineNonEmergencyControls = [
  // Acidity & GERD
  'I have severe acidity and heartburn after eating spicy food',
  'Chest burning sensation after dinner due to acidity and gas problem',
  'सीने में जलन हो रही है और खट्टी डकार आ रही है',
  'छाती में जलन और गैस की समस्या है',

  // Common Headaches & Migraines
  'I have a bad migraine headache and feeling nausea today',
  'I have a tension headache from staring at my computer screen for work',
  'Mild headache and tiredness after not sleeping well',
  'साधारण सिरदर्द और आंखों में थकान है',

  // Common Cold, Viral Fever, Flu
  'I have viral fever, chills, body ache and runny nose for 2 days',
  'Common cold, sneezing and mild sore throat',
  'हल्का बुखार और सर्दी जुकाम है',
  'Fever with cold and seasonal flu symptoms',

  // Gastroenteritis, Food Poisoning, Diarrhea
  'I have food poisoning from restaurant dinner yesterday with stomach pain and loose motions',
  'I vomited once after street food and have mild stomach ache',
  'Stomach upset and indigestion after oily food',
  'पेट खराब है और उल्टी दस्त की शिकायत है',

  // Mild Shortness of Breath on Exertion
  'Mild shortness of breath when climbing stairs or walking fast',
  'Shortness of breath while walking up the hill',

  // Routine Checkups & Minor Ailments
  'Just visiting for a routine checkup and blood sugar check',
  'Routine BP checkup and regular medication renewal',
  'Minor cut on my index finger from a kitchen knife',
  'Slight back ache after sitting on the chair for 8 hours',
  'Feeling tired and exhausted after a long day of travel',
  'My new running shoes do not fits properly and my heels hurt',
];

for (const neg of routineNonEmergencyControls) {
  const res = screenEmergencyRedFlags(neg);
  assert.strictEqual(res.isRedFlag, false, `Routine symptom "${neg}" must NOT trigger a red flag! Matched: ${JSON.stringify(res.matchedCategories)}`);
  assert.strictEqual(res.priority, 'NORMAL');
  console.log(`  ✓ Suppressed False Alarm: "${neg}" -> isRedFlag: false (Normal OPD)`);
  passCount++;
}

console.log('\n===========================================================');
console.log(`🎉 ALL ${passCount} EMERGENCY RED FLAG TESTS PASSED (100% OK)`);
console.log('   - 14/14 Life-Threatening Emergencies Detected');
console.log('   - 9/9 Multilingual Critical Emergencies Detected');
console.log('   - 22/22 Routine OPD Diseases Successfully Filtered Out');
console.log('===========================================================');
