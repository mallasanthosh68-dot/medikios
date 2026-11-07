const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data && { 'Content-Length': Buffer.byteLength(data) }),
          ...headers,
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, text: resData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: First Checkup Session ===');
  // 1. Start Interview 1
  const start1 = await request('POST', '/api/patients/interview/start', {
    language: 'en',
    healthcareMode: 'general_medical',
    communicationMode: 'text',
  });
  console.log('Checkup 1 Start:', start1.status, 'Interview ID:', start1.data?.interviewId);
  const interviewId1 = start1.data.interviewId;

  // Submit answer
  await request('POST', `/api/patients/interview/${interviewId1}/answer`, {
    question: 'What health concerns do you have?',
    answer: 'I have severe fever and chills for two days',
  });

  // Generate Summary 1
  const sum1 = await request('POST', `/api/patients/interview/${interviewId1}/summary`);
  console.log('Checkup 1 Summary Status:', sum1.status);
  const op1 = sum1.data?.summary?.opNumber;
  console.log('-> Generated OP Number 1:', op1);

  if (!op1 || !/^OP-\d{6}$/.test(op1)) {
    throw new Error(`Invalid OP Number 1: ${op1}`);
  }

  // Confirm Summary 1
  const conf1 = await request('POST', `/api/patients/interview/${interviewId1}/summary/confirm`);
  console.log('Checkup 1 Confirm Status:', conf1.status, 'Confirmed OP Number:', conf1.data?.opNumber);

  console.log('\n=== TEST 2: Second Checkup Session (New Summary) ===');
  // 2. Start Interview 2
  const start2 = await request('POST', '/api/patients/interview/start', {
    language: 'en',
    healthcareMode: 'general_medical',
    communicationMode: 'text',
  });
  console.log('Checkup 2 Start:', start2.status, 'Interview ID:', start2.data?.interviewId);
  const interviewId2 = start2.data.interviewId;

  // Submit answer
  await request('POST', `/api/patients/interview/${interviewId2}/answer`, {
    question: 'What health concerns do you have?',
    answer: 'I have lower back pain after lifting boxes',
  });

  // Generate Summary 2
  const sum2 = await request('POST', `/api/patients/interview/${interviewId2}/summary`);
  console.log('Checkup 2 Summary Status:', sum2.status);
  const op2 = sum2.data?.summary?.opNumber;
  console.log('-> Generated OP Number 2:', op2);

  if (!op2 || !/^OP-\d{6}$/.test(op2)) {
    throw new Error(`Invalid OP Number 2: ${op2}`);
  }

  // Confirm Summary 2
  const conf2 = await request('POST', `/api/patients/interview/${interviewId2}/summary/confirm`);
  console.log('Checkup 2 Confirm Status:', conf2.status, 'Confirmed OP Number:', conf2.data?.opNumber);

  console.log('\n=== OP NUMBER DIVERSITY CHECK ===');
  console.log('OP 1:', op1);
  console.log('OP 2:', op2);

  if (op1 === op2) {
    throw new Error(`FAILURE: OP Number 1 and OP Number 2 are identical (${op1})! A new OP number must be generated every time.`);
  }

  console.log('SUCCESS: Every new summary generated a distinct, fresh OP number!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
