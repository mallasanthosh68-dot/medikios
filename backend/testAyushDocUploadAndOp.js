const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function postJson(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  return await res.json();
}

async function runDocUploadAndOpTest() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PATIENT DETAILS INTAKE BEFORE SUMMARY & OP GENERATION');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // PART 1: TEST RETURNING PATIENT FLOW (NAME + PHONE NUMBER)
    // -------------------------------------------------------------
    console.log('--- PART 1: RETURNING PATIENT WORKFLOW ---');
    console.log('Step 1: Ensure initial patient exists in system...');
    const returningPhone = '9848022338';
    const returningPassword = 'TestPassword123!';
    let patientToken = '';

    const loginRes = await postJson(`${BASE_URL}/auth/login`, {
      phoneNumber: returningPhone,
      password: returningPassword,
    });
    if (loginRes.token) {
      patientToken = loginRes.token;
    } else {
      const regRes = await postJson(`${BASE_URL}/auth/register/patient`, {
        name: 'Aarav Sharma',
        phoneNumber: returningPhone,
        password: returningPassword,
        age: 38,
        gender: 'male',
      });
      patientToken = regRes.token;
    }

    // Test phone lookup endpoint
    console.log(`Step 2: Testing Phone Lookup for Returning Patient (${returningPhone})...`);
    const lookupRes = await postJson(`${BASE_URL}/ayush/lookup-patient`, {
      phoneNumber: returningPhone,
    });
    console.log(`✓ Phone Lookup Result: found=${lookupRes.found}, name="${lookupRes.patient?.name}", age=${lookupRes.patient?.age}`);
    if (!lookupRes.found) {
      throw new Error(`Expected returning patient with phone ${returningPhone} to be found!`);
    }

    // Start AYUSH Session
    console.log('Step 3: Starting AYUSH AI Case-Taking Session...');
    const startRes = await postJson(
      `${BASE_URL}/ayush/case/start`,
      { language: 'en', communicationMode: 'text', consentStatus: true },
      patientToken
    );
    const caseId = startRes.caseId || startRes.interviewId || startRes.interview?._id;
    console.log(`✓ AYUSH Case Session started! Case ID: ${caseId}`);

    // AI Chat response
    await postJson(
      `${BASE_URL}/ayush/case/${caseId}/answer`,
      {
        question: startRes.question,
        answer: 'I have severe acid reflux, sour belching and burning chest pain for 3 weeks after meals.',
        inputMode: 'text',
      },
      patientToken
    );

    // Upload Document
    console.log('Step 4: Uploading Document for Returning Patient...');
    const sampleDocPath = path.join(__dirname, 'test_prescription_sample.pdf');
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 135 >> stream
BT
/F1 12 Tf
100 700 Td
(Dr. Sharma Clinic - Rx: Tab Avipattikar Churna 1 tsp BD. Blood report CBC normal, mild acidity.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
399
%%EOF`;
    fs.writeFileSync(sampleDocPath, minimalPdf);

    const fileBuffer = fs.readFileSync(sampleDocPath);
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    const form = new FormData();
    form.append('reports', fileBlob, 'Returning_Patient_Prescription.pdf');
    form.append('uploadMethod', 'device');

    const uploadRes = await fetch(`${BASE_URL}/ayush/case/${caseId}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${patientToken}` },
      body: form,
    });
    const uploadData = await uploadRes.json();
    console.log(`✓ Document Attached: ${uploadData.pinnedReport?.title || 'OK'}`);

    // Step 5: Before starting summary, capture patient details (Returning patient)
    console.log('Step 5: Submitting Patient Details & Compiling Summary (Returning Patient)...');
    const returningDetails = {
      isReturning: true,
      name: 'Aarav Sharma (Verified)',
      phoneNumber: returningPhone,
    };

    const summaryRes = await postJson(
      `${BASE_URL}/ayush/case/${caseId}/summary`,
      {
        attachedReports: uploadData.pinnedReport ? [uploadData.pinnedReport] : [],
        patientCorrections: {},
        patientDetails: returningDetails,
      },
      patientToken
    );

    if (!summaryRes.success) throw new Error('Summary failed: ' + JSON.stringify(summaryRes));
    const returningOp = summaryRes.opNumber || summaryRes.summary?.opNumber;
    console.log(`✓ RETURNING PATIENT SUMMARY GENERATED!`);
    console.log(`  Random OP Number: ${returningOp}`);
    console.log(`  Saved Patient Name: "${summaryRes.summary?.patientName}"`);
    console.log(`  Saved Patient Phone: "${summaryRes.summary?.patientPhone}"`);
    console.log(`  Saved Patient Age: "${summaryRes.summary?.patientAge}"\n`);

    if (summaryRes.summary?.patientPhone !== returningPhone) {
      throw new Error(`Expected patientPhone to be "${returningPhone}", got "${summaryRes.summary?.patientPhone}"`);
    }

    // -------------------------------------------------------------
    // PART 2: TEST NEW PATIENT FLOW (NAME, PHONE NUMBER, AGE, GENDER)
    // -------------------------------------------------------------
    console.log('--- PART 2: NEW PATIENT WORKFLOW ---');
    const newPatientPhone = '9765432109';
    const newPatientName = 'Priya Mehra';
    const newPatientAge = '29';
    const newPatientGender = 'Female';

    // Verify phone is not in system
    console.log(`Step 1: Check new phone (${newPatientPhone}) in database...`);
    const newLookupRes = await postJson(`${BASE_URL}/ayush/lookup-patient`, {
      phoneNumber: newPatientPhone,
    });
    console.log(`✓ Lookup for new phone: found=${newLookupRes.found}`);

    // Start fresh anonymous kiosk case
    console.log('Step 2: Starting new kiosk AYUSH Case without prior login...');
    const newCaseStart = await postJson(`${BASE_URL}/ayush/case/start`, {
      language: 'en',
      communicationMode: 'text',
      consentStatus: true,
    });
    const newCaseId = newCaseStart.caseId || newCaseStart.interviewId;
    console.log(`✓ Kiosk Case started! Case ID: ${newCaseId}`);

    // Answer question
    await postJson(`${BASE_URL}/ayush/case/${newCaseId}/answer`, {
      question: newCaseStart.question,
      answer: 'Severe joint pains and morning stiffness in both knees for 2 months.',
      inputMode: 'text',
    });

    // Generate summary with new patient details
    console.log('Step 3: Pre-Summary Step: Providing New Patient Details (Name, Phone, Age, Gender)...');
    const newPatientDetails = {
      isReturning: false,
      name: newPatientName,
      phoneNumber: newPatientPhone,
      age: newPatientAge,
      gender: newPatientGender,
    };

    const newSummaryRes = await postJson(`${BASE_URL}/ayush/case/${newCaseId}/summary`, {
      attachedReports: [],
      patientCorrections: {},
      patientDetails: newPatientDetails,
    });

    if (!newSummaryRes.success) throw new Error('New patient summary failed: ' + JSON.stringify(newSummaryRes));
    const newOp = newSummaryRes.opNumber || newSummaryRes.summary?.opNumber;
    console.log(`✓ NEW PATIENT SUMMARY GENERATED!`);
    console.log(`  Random OP Number: ${newOp}`);
    console.log(`  Saved Patient Name: "${newSummaryRes.summary?.patientName}"`);
    console.log(`  Saved Patient Phone: "${newSummaryRes.summary?.patientPhone}"`);
    console.log(`  Saved Patient Age: "${newSummaryRes.summary?.patientAge}"`);
    console.log(`  Saved Patient Gender: "${newSummaryRes.summary?.patientGender}"\n`);

    if (newSummaryRes.summary?.patientName !== newPatientName ||
        newSummaryRes.summary?.patientPhone !== newPatientPhone ||
        String(newSummaryRes.summary?.patientAge) !== newPatientAge) {
      throw new Error('New patient summary details mismatch!');
    }

    // -------------------------------------------------------------
    // PART 3: DOCTOR STATION OP LOOKUP VERIFICATION
    // -------------------------------------------------------------
    console.log('--- PART 3: DOCTOR STATION OP LOOKUP VERIFICATION ---');
    console.log('Authenticating Doctor...');
    const docPhone = '9848011223';
    const docPassword = 'DocPassword123!';
    let docToken = '';

    const docLogRes = await postJson(`${BASE_URL}/auth/login`, {
      phoneNumber: docPhone,
      password: docPassword,
    });
    if (docLogRes.token) {
      docToken = docLogRes.token;
    } else {
      const docRegRes = await postJson(`${BASE_URL}/auth/register/doctor`, {
        doctorName: 'Dr. Rajesh Vaidya',
        licenseNumber: 'AYUSH-REG-55219',
        specialization: 'Ayurveda General Medicine',
        phoneNumber: docPhone,
        password: docPassword,
      });
      docToken = docRegRes.token;
    }

    // Doctor checks Returning Patient OP
    console.log(`Step 1: Doctor looks up Returning Patient OP "${returningOp}"...`);
    const docReturningLookup = await postJson(
      `${BASE_URL}/doctor/lookup-op`,
      { opNumber: returningOp },
      docToken
    );
    console.log(`✓ Matched Patient: "${docReturningLookup.summary?.patientName}"`);
    console.log(`  Phone: "${docReturningLookup.summary?.patientPhone}"`);
    console.log(`  Age: "${docReturningLookup.summary?.patientAge}"`);
    console.log(`  OP: "${docReturningLookup.summary?.opNumber}"\n`);

    // Doctor checks New Patient OP
    console.log(`Step 2: Doctor looks up New Patient OP "${newOp}"...`);
    const docNewLookup = await postJson(
      `${BASE_URL}/doctor/lookup-op`,
      { opNumber: newOp },
      docToken
    );
    console.log(`✓ Matched Patient: "${docNewLookup.summary?.patientName}"`);
    console.log(`  Phone: "${docNewLookup.summary?.patientPhone}"`);
    console.log(`  Age: "${docNewLookup.summary?.patientAge}"`);
    console.log(`  Gender: "${docNewLookup.summary?.patientGender}"`);
    console.log(`  OP: "${docNewLookup.summary?.opNumber}"\n`);

    // Cleanup sample file
    try { fs.unlinkSync(sampleDocPath); } catch (e) {}

    console.log('================================================================');
    console.log('🎉 ALL TESTS PASSED: RETURNING & NEW PATIENT DETAILS SAVED IN SUMMARY!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runDocUploadAndOpTest();
