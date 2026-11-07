const assert = require('assert');

async function testDoctorOpLookup() {
  console.log('===========================================================');
  console.log('🧪 Testing: Direct Doctor OP Intake & Health Summary Viewer');
  console.log('===========================================================\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Register or login as a doctor via HTTP
  const doctorPhone = `9848${Math.floor(100000 + Math.random() * 900000)}`;
  const doctorLicense = `MCI-${Math.floor(10000 + Math.random() * 90000)}`;
  console.log(`▶ Registering doctor with phone +91 ${doctorPhone}...`);

  const regRes = await fetch(`${BASE_URL}/auth/register/doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorName: 'Dr. Suresh Verma',
      licenseNumber: doctorLicense,
      specialization: 'Internal Medicine',
      phoneNumber: doctorPhone,
      password: 'DoctorPassword123!',
      hospitalAffiliation: 'MediKiosk Apex Hospital'
    })
  }).then(r => r.json());

  assert(regRes.success, `Doctor registration failed: ${regRes.message}`);
  const doctorToken = regRes.token;
  console.log(`  ✓ Doctor successfully registered & authenticated! Name: ${regRes.user.name}`);

  // 2. Patient creates an interview & completes checkup to generate an OP number
  console.log('\n▶ Patient starts AI checkup and completes interview to generate OP number...');
  const startRes = await fetch(`${BASE_URL}/patients/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communicationMode: 'text', language: 'en', healthcareMode: 'general_medical' })
  }).then(r => r.json());

  assert(startRes.success, 'Interview start failed');
  const interviewId = startRes.interviewId;

  await fetch(`${BASE_URL}/patients/interview/${interviewId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What brings you in?', answer: 'Severe chest discomfort and breathing difficulty' })
  }).then(r => r.json());

  const summaryRes = await fetch(`${BASE_URL}/patients/interview/${interviewId}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(r => r.json());

  assert(summaryRes.success, 'Summary creation failed');
  const generatedOp = summaryRes.opNumber || summaryRes.summary?.opNumber;
  console.log(`  ✓ Generated Patient OP Number on screen: ${generatedOp}`);
  assert(/^OP-\d{6}$/.test(generatedOp), `Invalid OP format: ${generatedOp}`);

  // 3. Test Doctor Lookup with 'OP-' prefix via POST /api/doctor/lookup-op
  console.log(`\n▶ Doctor looks up OP token "${generatedOp}" via POST /api/doctor/lookup-op...`);
  const lookup1 = await fetch(`${BASE_URL}/doctor/lookup-op`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify({ opNumber: generatedOp })
  }).then(r => r.json());

  assert(lookup1.success, `Doctor OP lookup failed: ${lookup1.message}`);
  assert.strictEqual(lookup1.opNumber, generatedOp);
  assert(lookup1.summary, 'Summary object missing from lookup response');
  console.log(`  ✓ Doctor retrieved health summary! Chief complaint: "${lookup1.summary.chiefComplaint}"`);
  console.log(`  ✓ Suggested Specialty: ${lookup1.summary.suggestedSpecialty}`);
  console.log(`  ✓ Red Flag Status: ${lookup1.summary.redFlagStatus}`);

  // 4. Test Doctor Lookup with raw 6 digits (without OP- prefix, auto-normalized)
  const rawDigits = generatedOp.replace('OP-', '');
  console.log(`\n▶ Doctor looks up raw 6 digits "${rawDigits}" via POST /api/doctor/lookup-op...`);
  const lookup2 = await fetch(`${BASE_URL}/doctor/lookup-op`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify({ opNumber: rawDigits })
  }).then(r => r.json());

  assert(lookup2.success, `Raw digits lookup failed: ${lookup2.message}`);
  assert.strictEqual(lookup2.opNumber, generatedOp);
  console.log(`  ✓ Auto-normalized raw 6 digits and retrieved health summary directly!`);

  // 5. Test Doctor Lookup via GET /api/doctor/op-summary/:opNumber
  console.log(`\n▶ Doctor retrieves summary via GET /api/doctor/op-summary/${generatedOp}...`);
  const lookup3 = await fetch(`${BASE_URL}/doctor/op-summary/${generatedOp}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${doctorToken}`
    }
  }).then(r => r.json());

  assert(lookup3.success, `GET endpoint failed: ${lookup3.message}`);
  assert.strictEqual(lookup3.opNumber, generatedOp);
  console.log(`  ✓ GET endpoint retrieved complete summary!`);

  // 6. Test Doctor OP verification for prescription via POST /api/doctor/verify-op-number
  console.log(`\n▶ Doctor verifies OP directly for prescription (without patientId)...`);
  const verifyRes = await fetch(`${BASE_URL}/doctor/verify-op-number`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify({ opNumber: generatedOp })
  }).then(r => r.json());

  assert(verifyRes.success && verifyRes.verified, `OP verification failed: ${verifyRes.message}`);
  console.log(`  ✓ Direct OP Verification succeeded for prescribing! Verified Patient: ${verifyRes.patientName}`);

  console.log('\n===========================================================');
  console.log('🎉 ALL TESTS PASSED: Doctor direct OP intake & summary view verified!');
  console.log('===========================================================');
}

testDoctorOpLookup().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
