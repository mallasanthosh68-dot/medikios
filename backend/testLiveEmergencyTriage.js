const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runLiveTest() {
  console.log('Testing live backend emergency red-flag response...');

  // 1. Patient Registration (instant fresh session)
  const phone = '99' + String(Date.now()).slice(-8);
  const registerRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register/patient',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    name: 'Triage Patient',
    phoneNumber: phone,
    password: 'password123',
    age: 35,
    gender: 'Male',
  });

  if (registerRes.status !== 201 || !registerRes.body.token) {
    console.error('Registration failed:', registerRes.body);
    process.exit(1);
  }

  const token = registerRes.body.token;
  console.log('✓ Patient registered successfully with phone:', phone);

  // 2. Start Interview
  const startRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/patients/interview/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  }, { language: 'en' });

  const interviewId = startRes.body.interviewId;
  console.log('✓ Started interview session:', interviewId);

  // 3. Submit Emergency Symptom
  const answerRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/patients/interview/${interviewId}/answer`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  }, {
    question: 'Health concern',
    answer: 'I have severe chest pain and pressure with cold sweating, nausea, and pain spreading to left arm',
    inputMode: 'text'
  });

  console.log('\n--- API RED FLAG RESPONSE ---');
  console.log('isRedFlag:', answerRes.body.redFlagCheck?.isRedFlag);
  console.log('priority:', answerRes.body.redFlagCheck?.priority);
  console.log('primaryCategory:', answerRes.body.redFlagCheck?.primaryCategory?.name);
  console.log('emoji:', answerRes.body.redFlagCheck?.primaryCategory?.emoji);
  console.log('category:', answerRes.body.redFlagCheck?.primaryCategory?.category);
  console.log('matchedCategories count:', answerRes.body.redFlagCheck?.matchedCategories?.length);
  console.log('alertMessage:', answerRes.body.redFlagCheck?.alertMessage);

  if (
    answerRes.body.redFlagCheck?.isRedFlag === true &&
    answerRes.body.redFlagCheck?.priority === 'HIGH_PRIORITY' &&
    answerRes.body.redFlagCheck?.primaryCategory?.id === 'chest_heart'
  ) {
    console.log('\n🎉 LIVE END-TO-END VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ Verification failed:', answerRes.body);
    process.exit(1);
  }
}

runLiveTest().catch(console.error);
