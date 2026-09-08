const fs = require('fs');
const path = require('path');
const {
  transformForSupabase,
  transformFromSupabase,
  TABLE_MAP,
} = require('../backend/src/services/supabaseService');

async function testSupabaseIntegration() {
  console.log('======================================================================');
  console.log('⚡ Starting Supabase Database Integration & Model Synchronization Test');
  console.log('======================================================================\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Test Supabase Status API
  console.log('[Test 1] Checking /api/system/supabase-status...');
  const statusRes = await fetch(`${BASE_URL}/system/supabase-status`);
  const statusData = await statusRes.json();
  console.log('Supabase Config Status:', JSON.stringify(statusData, null, 2));
  if (statusRes.status === 200) {
    console.log('✓ PASS: Supabase status endpoint is responsive!');
  } else {
    throw new Error('FAIL: Supabase status endpoint returned status ' + statusRes.status);
  }

  // 2. Test Transformation to/from Supabase Tables
  console.log('\n[Test 2] Testing Bidirectional Schema Transformation for Supabase PostgreSQL...');
  const sampleUser = {
    _id: '65e71029ab48102938472910',
    name: 'Ananya Deshmukh',
    phoneNumber: '9876543210',
    password: '$2a$10$encryptedpasswordhashhere',
    role: 'patient',
    age: 28,
    gender: 'female',
    createdAt: new Date(),
  };

  const supabaseRow = transformForSupabase('User', sampleUser);
  console.log('Transformed to Supabase Row (users table):', {
    id: supabaseRow.id,
    name: supabaseRow.name,
    phone_number: supabaseRow.phone_number,
    password_hash: supabaseRow.password_hash ? '[REDACTED_HASH]' : null,
    role: supabaseRow.role,
  });

  if (supabaseRow.id === sampleUser._id && supabaseRow.phone_number === sampleUser.phoneNumber && supabaseRow.password_hash) {
    console.log('✓ PASS: User model accurately transformed to Supabase PostgreSQL row!');
  } else {
    throw new Error('FAIL: User transformation to Supabase failed!');
  }

  const restoredUser = transformFromSupabase('User', supabaseRow);
  if (restoredUser._id === sampleUser._id && restoredUser.phoneNumber === sampleUser.phoneNumber && restoredUser.password) {
    console.log('✓ PASS: Supabase row successfully restored to Mongoose model doc!');
  } else {
    throw new Error('FAIL: Supabase row restoration failed!');
  }

  // Test HealthSummary transformation
  const sampleSummary = {
    _id: '65e71029ab48102938472999',
    patientId: '65e71029ab48102938472910',
    chiefComplaint: 'Acute chest pain and shortness of breath',
    urgencyLevel: 'EMERGENCY',
    hasRedFlag: true,
    redFlags: ['Cardiac pain radiating to left jaw', 'Dyspnea on mild exertion'],
    vitals: { heartRate: 112, bloodPressure: '150/95', spO2: 94 },
    suggestedSpecialty: 'Cardiology',
    provisionalDiagnosis: 'Possible Acute Coronary Syndrome',
    pinnedReports: [{ documentId: 'doc_123', title: 'Apex Hospital ECG' }],
  };

  const summaryRow = transformForSupabase('HealthSummary', sampleSummary);
  if (
    summaryRow.id === sampleSummary._id &&
    summaryRow.patient_id === sampleSummary.patientId &&
    summaryRow.chief_complaint === sampleSummary.chiefComplaint &&
    summaryRow.has_red_flag === true &&
    Array.isArray(summaryRow.red_flags)
  ) {
    console.log('✓ PASS: HealthSummary clinical dossier accurately mapped to Supabase PostgreSQL table!');
  } else {
    throw new Error('FAIL: HealthSummary transformation failed!');
  }

  // 3. Register a Patient Account
  console.log('\n[Test 3] Testing Account Creation & Registration...');
  const testEmail = `ananya_sb_${Date.now()}@medikiosk.test`;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  const regRes = await fetch(`${BASE_URL}/auth/register/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ananya Deshmukh',
      email: testEmail,
      phoneNumber: testPhone,
      password: 'SecurePassword123!',
      age: 28,
      gender: 'female',
      bloodGroup: 'O+',
    }),
  });

  const regData = await regRes.json();
  if (regRes.status !== 201 || !regData.token) {
    throw new Error('FAIL: Patient registration failed: ' + JSON.stringify(regData));
  }
  const token = regData.token;
  const userId = regData.user._id;
  console.log('✓ PASS: Patient account created successfully (ID:', userId, ')');

  // 4. Test Login with Created Credentials
  console.log('\n[Test 4] Testing User Login with Created Account...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: testPhone,
      password: 'SecurePassword123!',
    }),
  });

  const loginData = await loginRes.json();
  if (loginRes.status === 200 && loginData.token) {
    console.log('✓ PASS: Patient login succeeded! Authenticated via token.');
  } else {
    throw new Error('FAIL: Login failed: ' + JSON.stringify(loginData));
  }

  // 5. Test Generating and Storing a Health Summary
  console.log('\n[Test 5] Generating and Storing Clinical Health Summary...');
  const startRes = await fetch(`${BASE_URL}/patients/interview/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      chiefComplaint: 'Mild headache and persistent fever for 2 days',
    }),
  });
  const startData = await startRes.json();
  const interviewId = startData.interviewId || startData.interview?._id;
  if (!interviewId) {
    throw new Error('FAIL: Failed to start interview: ' + JSON.stringify(startData));
  }

  const summaryRes = await fetch(`${BASE_URL}/patients/interview/${interviewId}/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      chiefComplaint: 'Mild headache and persistent fever for 2 days',
      answers: [
        { question: 'When did the symptoms begin?', answer: '2 days ago' },
        { question: 'Any associated chills or body ache?', answer: 'Mild shivering at night' },
      ],
      vitals: { temperature: '100.4 F', heartRate: 88, spO2: 98 },
    }),
  });

  const summaryData = await summaryRes.json();
  if (summaryRes.status === 201 || summaryRes.status === 200) {
    console.log('✓ PASS: Health summary created and saved successfully!');
    console.log('Summary ID:', summaryData.summary?._id);
    console.log('Chief Complaint:', summaryData.summary?.chiefComplaint);
    console.log('Urgency Level:', summaryData.summary?.urgencyLevel);
  } else {
    throw new Error('FAIL: Summary creation failed: ' + JSON.stringify(summaryData));
  }

  // 6. Verify Table Mapping Coverage
  console.log('\n[Test 6] Verifying Table Mapping Coverage for all 12 MediKiosk Models...');
  const expectedTables = [
    'User',
    'PatientProfile',
    'DoctorProfile',
    'HealthInterview',
    'HealthSummary',
    'MedicalDocument',
    'MedicalExtraction',
    'Prescription',
    'DoctorRequest',
    'MedicalTimeline',
    'Notification',
    'Consent',
  ];

  const allMapped = expectedTables.every((m) => TABLE_MAP[m]);
  if (allMapped) {
    console.log('✓ PASS: All 12 healthcare models have verified Supabase table mappings:');
    expectedTables.forEach((m) => console.log(`  • Model: ${m.padEnd(20)} -> Supabase Table: ${TABLE_MAP[m]}`));
  } else {
    throw new Error('FAIL: Some models missing from TABLE_MAP');
  }

  console.log('\n======================================================================');
  console.log('🎉 ALL SUPABASE INTEGRATION TESTS PASSED: 100% OPERATIONAL!');
  console.log('======================================================================\n');
}

testSupabaseIntegration().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
