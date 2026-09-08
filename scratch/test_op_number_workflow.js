/**
 * Automated Verification Script: Patient OP Number Generation & Doctor Verification Protocol
 */

const API_BASE = 'http://localhost:5000/api';

async function runOpNumberTests() {
  console.log('======================================================================');
  console.log('🧪 Starting Verification: Patient OP Number Generation & Doctor Verification');
  console.log('======================================================================\n');

  const timestamp = Date.now();
  const patientPhone = `91${timestamp.toString().slice(-8)}`;
  const doctorPhone = `92${timestamp.toString().slice(-8)}`;

  // 1. Register Patient
  console.log('[Test 1] Registering Patient & Verifying Random OP Number Generation...');
  const patRegRes = await fetch(`${API_BASE}/auth/register/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Sharma',
      age: 32,
      gender: 'Male',
      phoneNumber: patientPhone,
      password: 'PatientPassword123!',
      bloodGroup: 'B+',
    }),
  });

  const patRegData = await patRegRes.json();
  console.log('Patient Registration Status:', patRegRes.status);
  console.log('Patient OP Number:', patRegData.user?.opNumber);
  console.log('Patient Profile OP Number:', patRegData.profile?.opNumber);

  const patientOpNumber = patRegData.user?.opNumber;
  if (!patientOpNumber || !/^OP-\d{6}$/.test(patientOpNumber)) {
    throw new Error(`Invalid or missing OP Number generated: ${patientOpNumber}`);
  }
  console.log('✓ PASS: Random OP Number generated successfully in OP-XXXXXX format!\n');

  const patientToken = patRegData.token;
  const patientId = patRegData.user._id;

  // 2. Register Doctor
  console.log('[Test 2] Registering Consulting Doctor...');
  const docRegRes = await fetch(`${API_BASE}/auth/register/doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorName: 'Dr. Priya Varma',
      licenseNumber: `MCI-${timestamp.toString().slice(-5)}`,
      specialization: 'Internal Medicine',
      phoneNumber: doctorPhone,
      password: 'DoctorPassword123!',
      hospitalAffiliation: 'MediKiosk Apex Hospital',
    }),
  });
  const docRegData = await docRegRes.json();
  const doctorToken = docRegData.token;
  console.log('✓ PASS: Doctor registered successfully!\n');

  // 3. Doctor attempts to prescribe WITHOUT OP Number
  console.log('[Test 3] Doctor attempts to prescribe WITHOUT OP Number...');
  const noOpRes = await fetch(`${API_BASE}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      medicines: [
        {
          name: 'Paracetamol',
          strength: '650 mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
        },
      ],
    }),
  });
  const noOpData = await noOpRes.json();
  console.log('Status Code:', noOpRes.status);
  console.log('Rejection Message:', noOpData.message);
  if (noOpRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, but received ${noOpRes.status}`);
  }
  console.log('✓ PASS: Prescription strictly REJECTED (403) when OP Number is missing!\n');

  // 4. Doctor attempts to prescribe with WRONG OP Number
  console.log('[Test 4] Doctor attempts to prescribe with WRONG OP Number (OP-999999)...');
  const wrongOpRes = await fetch(`${API_BASE}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      opNumber: 'OP-999999',
      medicines: [
        {
          name: 'Paracetamol',
          strength: '650 mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
        },
      ],
    }),
  });
  const wrongOpData = await wrongOpRes.json();
  console.log('Status Code:', wrongOpRes.status);
  console.log('Rejection Message:', wrongOpData.message);
  if (wrongOpRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, but received ${wrongOpRes.status}`);
  }
  console.log('✓ PASS: Prescription strictly REJECTED (403) when OP Number does not match patient!\n');

  // 5. Doctor tests verify-op-number endpoint
  console.log('[Test 5] Doctor calls /api/doctor/verify-op-number...');
  // 5a. Wrong OP Number
  const verifyWrongRes = await fetch(`${API_BASE}/doctor/verify-op-number`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      opNumber: 'OP-123456',
    }),
  });
  const verifyWrongData = await verifyWrongRes.json();
  console.log('Verify Wrong Status:', verifyWrongRes.status, 'Verified:', verifyWrongData.verified);
  if (verifyWrongRes.status !== 400 || verifyWrongData.verified === true) {
    throw new Error('Expected 400 with verified: false');
  }

  // 5b. Correct OP Number
  const verifyRightRes = await fetch(`${API_BASE}/doctor/verify-op-number`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      opNumber: patientOpNumber,
    }),
  });
  const verifyRightData = await verifyRightRes.json();
  console.log('Verify Right Status:', verifyRightRes.status, 'Verified:', verifyRightData.verified, 'Message:', verifyRightData.message);
  if (verifyRightRes.status !== 200 || !verifyRightData.verified) {
    throw new Error('Expected 200 with verified: true');
  }
  console.log('✓ PASS: Doctor OP Number verification endpoint functions flawlessly!\n');

  // 6. Doctor prescribes with CORRECT OP Number
  console.log(`[Test 6] Doctor sends medicines report with CORRECT OP Number (${patientOpNumber})...`);
  const correctPrescRes = await fetch(`${API_BASE}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      patientId,
      opNumber: patientOpNumber,
      diagnosisOrImpression: 'Upper Respiratory Tract Infection',
      medicines: [
        {
          name: 'Augmentin 625 Duo',
          genericName: 'Amoxicillin + Clavulanic Acid',
          strength: '625 mg',
          form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          timing: { morning: true, afternoon: false, night: true, mealRelation: 'After food' },
          duration: '5 days',
          instructions: 'Take after meals',
        },
        {
          name: 'Pan 40',
          genericName: 'Pantoprazole',
          strength: '40 mg',
          form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Once daily',
          timing: { morning: true, afternoon: false, night: false, mealRelation: 'Before food' },
          duration: '5 days',
          instructions: 'Take 30 mins before breakfast',
        },
      ],
      instructions: 'Complete full course of antibiotics and drink warm water.',
      doctorNotes: 'Patient advised to review if fever persists after 48 hours.',
      followUpDays: 5,
    }),
  });

  const correctPrescData = await correctPrescRes.json();
  console.log('Prescription Creation Status:', correctPrescRes.status);
  console.log('Prescription Verified OP Number:', correctPrescData.prescription?.opNumber);
  console.log('Prescribed Medicines Count:', correctPrescData.prescription?.medicines?.length);
  if (correctPrescRes.status !== 201 || correctPrescData.prescription?.opNumber !== patientOpNumber) {
    throw new Error('Failed to create prescription with verified OP Number');
  }
  console.log('✓ PASS: Medicines report and digital prescription issued with verified OP Number!\n');

  // 7. Patient queries their prescriptions
  console.log('[Test 7] Patient retrieves their prescriptions...');
  const patPrescRes = await fetch(`${API_BASE}/prescriptions`, {
    headers: {
      Authorization: `Bearer ${patientToken}`,
    },
  });
  const patPrescData = await patPrescRes.json();
  console.log('Prescriptions retrieved for patient:', patPrescData.prescriptions?.length);
  const matchedRx = patPrescData.prescriptions?.find((r) => r.opNumber === patientOpNumber);
  console.log('Matched OP Prescription ID:', matchedRx?._id, 'OP Number:', matchedRx?.opNumber);
  if (!matchedRx) {
    throw new Error('Patient could not find the issued prescription matching their OP Number');
  }
  console.log('✓ PASS: Patient successfully received medicines report under OP Number!\n');

  console.log('======================================================================');
  console.log('🎉 ALL 7 OP NUMBER TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

runOpNumberTests().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
