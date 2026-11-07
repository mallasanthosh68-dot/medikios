const assert = require('assert');

async function testDoctorAuth() {
  console.log('===========================================================');
  console.log('🧪 Testing: Doctor Registration & Multi-Identifier Login');
  console.log('===========================================================\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Doctor Registration with User\'s Exact Screenshot Payload
  console.log('▶ Registering Doctor "kumar" (License: mck-12345, Mobile: 9866355788)...');
  const regPayload = {
    doctorName: 'kumar',
    name: 'kumar',
    licenseNumber: 'mck-12345',
    specialization: 'Neurology',
    phoneNumber: '9866355788',
    password: 'Password@123',
    experienceYears: 5,
  };

  const regRes = await fetch(`${BASE_URL}/auth/register/doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload),
  }).then(r => r.json());

  // If already registered from a previous test run, we can test login directly
  if (!regRes.success && regRes.message && regRes.message.includes('already registered')) {
    console.log('  ℹ Doctor phone number already registered from previous run. Continuing to test login variants...');
  } else {
    assert(regRes.success, `Doctor registration failed: ${regRes.message}`);
    console.log(`  ✓ Doctor Registered successfully: ${regRes.user?.name} (Role: ${regRes.user?.role})`);
    assert.strictEqual(regRes.user?.role, 'doctor', 'Registered role must be doctor');
  }

  // 2. Login Variant A: Login via 10-Digit Mobile Number
  console.log('\n▶ Login Variant A: Logging in with Mobile Number (9866355788)...');
  const loginA = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9866355788',
      password: 'Password@123',
      role: 'doctor',
    }),
  }).then(r => r.json());

  assert(loginA.success, `Login with Mobile failed: ${loginA.message}`);
  console.log(`  ✓ Successfully logged in with Mobile Number: ${loginA.user?.name}`);
  assert.strictEqual(loginA.user?.role, 'doctor');
  const doctorToken = loginA.token;

  // 3. Login Variant B: Login via License Number (mck-12345)
  console.log('\n▶ Login Variant B: Logging in with License Number (mck-12345)...');
  const loginB = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'mck-12345',
      password: 'Password@123',
      role: 'doctor',
    }),
  }).then(r => r.json());

  assert(loginB.success, `Login with License Number failed: ${loginB.message}`);
  console.log(`  ✓ Successfully logged in with License Number: ${loginB.user?.name}`);

  // 4. Login Variant C: Login via Doctor Name (kumar)
  console.log('\n▶ Login Variant C: Logging in with Doctor Name (kumar)...');
  const loginC = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'kumar',
      password: 'Password@123',
      role: 'doctor',
    }),
  }).then(r => r.json());

  assert(loginC.success, `Login with Doctor Name failed: ${loginC.message}`);
  console.log(`  ✓ Successfully logged in with Doctor Name: ${loginC.user?.name}`);

  // 5. Verify /auth/me Profile and Doctor Requests endpoint
  console.log('\n▶ Testing Authenticated Doctor Session (/api/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${doctorToken}` },
  }).then(r => r.json());

  assert(meRes.success, `Doctor /auth/me failed: ${meRes.message}`);
  console.log(`  ✓ Doctor Profile Verified: ${meRes.profile?.doctorName} (${meRes.profile?.specialization}, License: ${meRes.profile?.licenseNumber})`);

  console.log('\n===========================================================');
  console.log('🎉 ALL DOCTOR AUTH & LOGIN TESTS PASSED (100% OK)');
  console.log('===========================================================');
}

testDoctorAuth().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
