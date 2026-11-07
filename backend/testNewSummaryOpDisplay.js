const assert = require('assert');

async function testOpDisplay() {
  console.log('===========================================================');
  console.log('🧪 Testing: OP Number Generated & Returned for Every Summary');
  console.log('===========================================================\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Session 1: Create interview, send answer, compile summary
  console.log('▶ Creating Session 1...');
  const start1 = await fetch(`${BASE_URL}/patients/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communicationMode: 'text', language: 'en', healthcareMode: 'general_medical' })
  }).then(r => r.json());

  assert(start1.success, 'Session 1 start failed');
  const interviewId1 = start1.interviewId;

  await fetch(`${BASE_URL}/patients/interview/${interviewId1}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What brings you in?', answer: 'I have fever and body pain since yesterday' })
  }).then(r => r.json());

  const sumRes1 = await fetch(`${BASE_URL}/patients/interview/${interviewId1}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => r.json());

  assert(sumRes1.success, 'Summary 1 creation failed');
  const opNumber1 = sumRes1.opNumber || sumRes1.summary?.opNumber;
  console.log(`  ✓ Summary 1 Created -> OP Number on Screen: ${opNumber1}`);
  assert(/^OP-\d{6}$/.test(opNumber1), `OP 1 invalid format: ${opNumber1}`);

  // 2. Session 2: Create a fresh interview, send answer, compile summary
  console.log('\n▶ Creating Session 2 (New Summary Checkup)...');
  const start2 = await fetch(`${BASE_URL}/patients/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communicationMode: 'text', language: 'hi', healthcareMode: 'general_medical' })
  }).then(r => r.json());

  assert(start2.success, 'Session 2 start failed');
  const interviewId2 = start2.interviewId;

  await fetch(`${BASE_URL}/patients/interview/${interviewId2}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What brings you in?', answer: 'सिरदर्द और थकान' })
  }).then(r => r.json());

  const sumRes2 = await fetch(`${BASE_URL}/patients/interview/${interviewId2}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => r.json());

  assert(sumRes2.success, 'Summary 2 creation failed');
  const opNumber2 = sumRes2.opNumber || sumRes2.summary?.opNumber;
  console.log(`  ✓ Summary 2 Created -> OP Number on Screen: ${opNumber2}`);
  assert(/^OP-\d{6}$/.test(opNumber2), `OP 2 invalid format: ${opNumber2}`);

  // Verify uniqueness across new summaries
  assert.notStrictEqual(opNumber1, opNumber2, `Every new summary MUST have a unique OP number! Got identical: ${opNumber1}`);
  console.log(`  ✓ Unique OP Number verified between Session 1 (${opNumber1}) and Session 2 (${opNumber2})`);

  console.log('\n===========================================================');
  console.log('🎉 OP NUMBER DISPLAY VERIFICATION PASSED (100% OK)');
  console.log('===========================================================');
}

testOpDisplay().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
