// Test decoupling OP from Doctor Prescription and verifying no medicines/notifications sent to patient
const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- TEST: Doctor Prescription Direct Workstation Print & No Dispatch to Patient ---');

  // 1. Authenticate Doctor
  const doctorPhone = `9848${Math.floor(100000 + Math.random() * 900000)}`;
  const doctorLicense = `MCI-${Math.floor(10000 + Math.random() * 90000)}`;
  const docReg = await fetch(`${BASE_URL}/auth/register/doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doctorName: 'Dr. Vikram Sharma',
      licenseNumber: doctorLicense,
      specialization: 'Internal Medicine',
      phoneNumber: doctorPhone,
      password: 'DoctorPassword123!',
      hospitalAffiliation: 'MediKiosk Apex Hospital',
    }),
  }).then(r => r.json());

  if (!docReg.success) {
    throw new Error(`Doctor registration failed: ${docReg.message}`);
  }
  const docToken = docReg.token;
  console.log('1. Doctor registered & authenticated:', docReg.user?.name);

  // 2. Authenticate Patient
  const patientPhone = `9872${Math.floor(100000 + Math.random() * 900000)}`;
  const patReg = await fetch(`${BASE_URL}/auth/register/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Anil Gupta',
      phoneNumber: patientPhone,
      age: 42,
      gender: 'Male',
      password: 'PatientPassword123!',
    }),
  }).then(r => r.json());

  if (!patReg.success) {
    throw new Error(`Patient registration failed: ${patReg.message}`);
  }
  const patToken = patReg.token;
  const patId = patReg.user?._id || patReg.user?.id;
  console.log('2. Patient registered & authenticated:', patReg.user?.name, 'ID:', patId);

  // 3. Doctor issues prescription WITHOUT ANY OP NUMBER
  console.log('\n3. Testing prescription generation with NO OP NUMBER (Direct Prescription)...');
  const rxRes = await fetch(`${BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${docToken}`,
    },
    body: JSON.stringify({
      patientId: patId,
      // NO opNumber provided!
      patientName: 'Anil Gupta',
      patientAge: 42,
      patientGender: 'Male',
      diagnosisOrImpression: 'Seasonal Bronchial Inflammation',
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
          instructions: 'Take after meals with water',
        },
        {
          name: 'Dolo 650',
          genericName: 'Paracetamol',
          strength: '650 mg',
          form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'As needed',
          timing: { morning: true, afternoon: true, night: true, mealRelation: 'After food' },
          duration: '3 days',
          instructions: 'For pain or fever',
        },
      ],
      instructions: 'Complete full course. Adequate hydration.',
      followUpDays: 5,
    }),
  });

  const rxJson = await rxRes.json();
  console.log('Prescription Response Status:', rxRes.status);
  console.log('Prescription Response Success:', rxJson.success);

  if (rxRes.status !== 201 || !rxJson.success) {
    throw new Error(`Prescription failed without OP: ${JSON.stringify(rxJson)}`);
  }
  console.log('✓ SUCCESS: Prescription generated without OP requirement! ID:', rxJson.prescription._id);
  console.log('  printedByDoctor:', rxJson.prescription.printedByDoctor);
  console.log('  sentToPatient:', rxJson.prescription.sentToPatient);

  // 4. Verify patient did NOT receive any notifications for prescribed medicines
  console.log('\n4. Verifying patient notifications (medicines must NOT be sent to patient)...');
  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${patToken}` },
  });
  const notifJson = await notifRes.json();
  const rxNotifs = (notifJson.notifications || []).filter((n) => n.type === 'prescription');
  console.log('Patient prescription notifications count:', rxNotifs.length);
  if (rxNotifs.length > 0) {
    throw new Error('Patient received prescription notification, but requirement says medicines will not send to any patient!');
  }
  console.log('✓ SUCCESS: 0 prescription notifications sent to patient. Medicines not dispatched to patient device.');

  // 5. Verify patient prescription query returns empty / not dispatched
  console.log('\n5. Verifying patient prescription listing...');
  const patRxRes = await fetch(`${BASE_URL}/prescriptions`, {
    headers: { Authorization: `Bearer ${patToken}` },
  });
  const patRxJson = await patRxRes.json();
  console.log('Patient prescriptions count:', patRxJson.prescriptions?.length);
  if (patRxJson.prescriptions?.length > 0) {
    throw new Error('Patient can see prescriptions, but medicines will not send to any patient!');
  }
  console.log('✓ SUCCESS: Patient cannot view prescriptions directly on their portal.');

  // 6. Verify Doctor can access their issued prescriptions for workstation printing
  console.log('\n6. Verifying doctor issued prescriptions records for printing...');
  const docRxRes = await fetch(`${BASE_URL}/prescriptions`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const docRxJson = await docRxRes.json();
  console.log('Doctor issued prescriptions count:', docRxJson.prescriptions?.length);
  if (!docRxJson.prescriptions || docRxJson.prescriptions.length === 0) {
    throw new Error('Doctor issued prescriptions not found in doctor records!');
  }
  console.log('✓ SUCCESS: Doctor has prescription stored locally for system printing. Rx ID:', docRxJson.prescriptions[0]._id);

  // 7. Verify doctor can also prescribe for a pure walk-in patient without even a patientId
  console.log('\n7. Testing doctor prescription for pure walk-in patient (no patientId)...');
  const walkinRes = await fetch(`${BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${docToken}`,
    },
    body: JSON.stringify({
      patientName: 'Kavitha Reddy',
      patientAge: 29,
      patientGender: 'Female',
      diagnosisOrImpression: 'Acute Migraine Headache',
      medicines: [
        {
          name: 'Naprosyn 500',
          genericName: 'Naproxen',
          strength: '500 mg',
          form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Once when headache starts',
          timing: { morning: true, afternoon: false, night: false, mealRelation: 'After food' },
          duration: '3 days',
          instructions: 'Take with food',
        },
      ],
      instructions: 'Rest in a quiet, dark room. Avoid bright lights.',
      followUpDays: 3,
    }),
  });
  const walkinJson = await walkinRes.json();
  console.log('Walk-in Prescription Status:', walkinRes.status);
  if (walkinRes.status !== 201 || !walkinJson.success) {
    throw new Error(`Walk-in prescription failed: ${JSON.stringify(walkinJson)}`);
  }
  console.log('✓ SUCCESS: Pure walk-in prescription created without patientId or OP! ID:', walkinJson.prescription._id);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Decoupled OP, disabled patient dispatch, enabled direct doctor printing.');
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
