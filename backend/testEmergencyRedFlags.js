const assert = require('assert');
const { screenEmergencyRedFlags, EMERGENCY_RED_FLAG_CATEGORIES } = require('./src/utils/emergencyRedFlags');
const { screenRedFlags } = require('./src/services/aiService');

console.log('===========================================================');
console.log('🚨 Automated Test Suite: 14-Category Emergency Red Flags');
console.log('===========================================================\n');

const testCases = [
  {
    id: 'chest_heart',
    expectedEmoji: '❤️',
    input: 'I have severe chest pain and pressure with cold sweating, nausea, and pain spreading to left arm',
  },
  {
    id: 'breathing',
    expectedEmoji: '🫁',
    input: 'Severe difficulty breathing, cannot breathe, gasping for air and blue lips',
  },
  {
    id: 'stroke_neuro',
    expectedEmoji: '🧠',
    input: 'Sudden weakness on one side, slurred speech, and cannot move arm',
  },
  {
    id: 'severe_headache',
    expectedEmoji: '🧠',
    input: 'Sudden extremely severe headache, worst headache of my life with confusion',
  },
  {
    id: 'severe_bleeding',
    expectedEmoji: '🩸',
    input: 'Heavy bleeding that does not stop and coughing significant amounts of blood',
  },
  {
    id: 'loss_of_consciousness',
    expectedEmoji: '🧍',
    input: 'Patient fainted with unresponsiveness and sudden collapse',
  },
  {
    id: 'seizure',
    expectedEmoji: '⚡',
    input: 'A seizure lasting several minutes and repeated seizures with violent convulsions',
  },
  {
    id: 'major_injury',
    expectedEmoji: '🤕',
    input: 'Serious head injury and suspected spinal injury with major burns',
  },
  {
    id: 'severe_abdominal_pain',
    expectedEmoji: '🩸',
    input: 'Sudden severe abdominal pain with persistent vomiting and fainting',
  },
  {
    id: 'severe_infection',
    expectedEmoji: '🌡️',
    input: 'Severe infection with high fever, confusion, and rapidly worsening condition',
  },
  {
    id: 'poisoning_overdose',
    expectedEmoji: '💊',
    input: 'Suspected poisoning and drug overdose from taking too many pills',
  },
  {
    id: 'pregnancy_emergency',
    expectedEmoji: '🤰',
    input: 'Pregnant with heavy bleeding and severe abdominal pain',
  },
  {
    id: 'sudden_vision_problems',
    expectedEmoji: '👁️',
    input: 'Sudden loss of vision and major sudden change in vision in right eye',
  },
  {
    id: 'severe_allergic_reaction',
    expectedEmoji: '🦵',
    input: 'Severe allergic reaction with swelling of face and throat closing',
  },
];

console.log('▶ Verifying all 14 categories from English clinical inputs...');
let passCount = 0;
for (const tc of testCases) {
  const result = screenEmergencyRedFlags(tc.input);
  assert.strictEqual(result.isRedFlag, true, `Should detect red flag for category [${tc.id}]`);
  assert.strictEqual(result.priority, 'HIGH_PRIORITY');
  const matched = result.matchedCategories.find((c) => c.id === tc.id);
  assert(matched, `Expected category [${tc.id}] in matched categories, got: ${JSON.stringify(result.matchedCategories.map((m) => m.id))}`);
  assert.strictEqual(matched.emoji, tc.expectedEmoji);
  console.log(`  ✓ Detected ${matched.emoji} [${matched.category}] - ${matched.name}`);
  passCount++;
}

console.log(`\n▶ Testing multilingual red flag screening (Hindi, Telugu, etc.)...`);
const multiLingualTests = [
  { input: 'सीने में बहुत तेज दर्द है और दिल का दौरा लग रहा है', expectedId: 'chest_heart' },
  { input: 'सांस लेने में बहुत तकलीफ हो रही है और सांस फूल रही है', expectedId: 'breathing' },
  { input: 'मरीज अचानक बेहोश हो गया और उठ नहीं रहा', expectedId: 'loss_of_consciousness' },
  { input: 'खून की उल्टी हो रही है और खून बहना बंद नहीं हो रहा', expectedId: 'severe_bleeding' },
  { input: 'గుండె నొప్పి చాలా తీవ్రంగా ఉంది', expectedId: 'chest_heart' },
  { input: 'శ్వాస తీసుకోవడంలో తీవ్రమైన ఇబ్బంది', expectedId: 'breathing' },
  { input: 'గర్భధారణ సమయంలో తీవ్రమైన రక్తస్రావం', expectedId: 'pregnancy_emergency' },
  { input: 'गले में सूजन और एलर्जी से सांस बंद हो रही है', expectedId: 'severe_allergic_reaction' },
];

for (const m of multiLingualTests) {
  const res = screenRedFlags(m.input);
  assert.strictEqual(res.isRedFlag, true, `Should detect multilingual red flag for: "${m.input}"`);
  const matched = res.matchedCategories.find((c) => c.id === m.expectedId);
  assert(matched, `Expected [${m.expectedId}] in matched categories for: "${m.input}"`);
  console.log(`  ✓ Multilingual Match: "${m.input}" -> ${matched.emoji} [${matched.category}]`);
  passCount++;
}

console.log('\n▶ Testing negative controls (routine/mild complaints should NOT trigger red flag)...');
const negativeControls = [
  'I have a mild runny nose and sneezing for 2 days',
  'I have slight back ache after sitting for too long',
  'Mild itching on my left palm',
  'Feeling slightly tired after a long walk',
  'Just need a regular checkup for my routine blood sugar',
];

for (const neg of negativeControls) {
  const res = screenEmergencyRedFlags(neg);
  assert.strictEqual(res.isRedFlag, false, `Routine symptom "${neg}" must NOT trigger a red flag!`);
  assert.strictEqual(res.priority, 'NORMAL');
  console.log(`  ✓ Negative Control Clean: "${neg}" -> isRedFlag: false`);
  passCount++;
}

console.log('\n===========================================================');
console.log(`🎉 ALL ${passCount} EMERGENCY RED FLAG TESTS PASSED (100% OK)`);
console.log('===========================================================');
