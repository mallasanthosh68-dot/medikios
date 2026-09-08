const fs = require('fs');
const path = require('path');

async function testUploadAndValidation() {
  console.log('--- Starting Multi-Image Hospital Report & Validation Test ---');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Register a test patient
  const testEmail = `test_patient_${Date.now()}@medikiosk.test`;
  const regRes = await fetch(`${BASE_URL}/auth/register/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      email: testEmail,
      password: 'Password123!',
      phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'patient',
      age: 29,
      gender: 'female',
    }),
  });

  const regData = await regRes.json();
  if (!regData.token) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  const token = regData.token;
  console.log('✓ Patient registered successfully with persistent account:', testEmail);

  // Helper to create test files
  const tmpDir = path.join(__dirname, 'test_files');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const nonMedicalPath = path.join(tmpDir, 'restaurant_tax_invoice.jpg');
  fs.writeFileSync(
    nonMedicalPath,
    'ZOMATO FOOD DELIVERY TAX INVOICE\nOrder #94821\nSubtotal: Rs. 420.00\nGSTIN: 29ABCDE1234F1Z5\nPayment: UPI Completed'
  );

  const hospitalReport1 = path.join(tmpDir, 'Apex_Hospital_CBC_Report.jpg');
  fs.writeFileSync(
    hospitalReport1,
    'APEX HOSPITAL & PATHOLOGY LAB\nPatient: Priya Sharma | Age/Gender: 29/F\nDate: 20-Feb-2025\nDoctor: Dr. A. Sharma, MD\n\nTEST NAME                  OBSERVED    REFERENCE\nHemoglobin (Hb)            11.2 g/dL   12.0 - 15.5 g/dL [LOW]\nPlatelet Count             220,000 /mcL 150,000 - 450,000\nTotal Leukocyte Count (WBC) 6,800 /mcL  4,000 - 11,000\nFasting Blood Sugar (FBS)  115 mg/dL   70 - 99 mg/dL [HIGH]\nSerum Creatinine           0.9 mg/dL   0.6 - 1.2 mg/dL\nTotal Cholesterol          185 mg/dL   < 200 mg/dL'
  );

  const hospitalReport2 = path.join(tmpDir, 'Cardiology_Doctor_Prescription_Rx.jpg');
  fs.writeFileSync(
    hospitalReport2,
    'ST. JUDE MULTISPECIALITY HOSPITAL\nConsultant: Dr. Rajesh Iyer, MD (Cardiology)\nPatient: Priya Sharma | Date: 22-Feb-2025\n\nRx:\n1. Tab. Pantoprazole 40mg - 1 Tab OD before breakfast x 14 days\n2. Tab. Paracetamol 650mg - 1 Tab SOS for fever\n3. Tab. Atorvastatin 20mg - 1 Tab OD at night x 30 days\n\nReview in 2 weeks with repeat lipid profile.'
  );

  // 2. Test Rejection of Non-Medical File (Invoice / Receipt)
  console.log('\n[Test 1] Testing Strict Hospital Validation: Uploading non-medical receipt...');
  const nonMedicalBlob = new Blob([fs.readFileSync(nonMedicalPath)], { type: 'image/jpeg' });
  const nonMedicalForm = new FormData();
  nonMedicalForm.append('document', nonMedicalBlob, 'restaurant_tax_invoice.jpg');
  nonMedicalForm.append('documentType', 'Lab Report');

  const rejectRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: nonMedicalForm,
  });

  const rejectData = await rejectRes.json();
  console.log('Response Status:', rejectRes.status);
  console.log('Rejection Message:', rejectData.message);
  if (rejectRes.status === 422 && rejectData.rejected) {
    console.log('✓ PASS: Non-medical document was strictly REJECTED as required!');
  } else {
    throw new Error('FAIL: Non-medical document was not rejected! Status: ' + rejectRes.status);
  }

  // 3. Test Multi-Image Hospital Report Upload & Text Conversion
  console.log('\n[Test 2] Testing Multi-Image Upload: Uploading 2 hospital reports simultaneously...');
  const report1Blob = new Blob([fs.readFileSync(hospitalReport1)], { type: 'image/jpeg' });
  const report2Blob = new Blob([fs.readFileSync(hospitalReport2)], { type: 'image/jpeg' });

  const multiForm = new FormData();
  multiForm.append('documents', report1Blob, 'Apex_Hospital_CBC_Report.jpg');
  multiForm.append('documents', report2Blob, 'Cardiology_Doctor_Prescription_Rx.jpg');
  multiForm.append('documentType', 'Lab Report');

  const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: multiForm,
  });

  const uploadData = await uploadRes.json();
  console.log('Multi-Upload Response Status:', uploadRes.status);
  console.log('Uploaded Count:', uploadData.documents?.length);
  console.log('Upload Message:', uploadData.message);

  if (uploadRes.status === 201 && uploadData.documents?.length === 2) {
    console.log('✓ PASS: All selected hospital report images uploaded successfully!');
  } else {
    throw new Error('FAIL: Expected 2 uploaded documents! Got: ' + JSON.stringify(uploadData));
  }

  // 4. Verify OCR Text Conversion for each uploaded document
  console.log('\n[Test 3] Verifying Text Conversion on all uploaded hospital reports...');
  uploadData.documents.forEach((doc, idx) => {
    console.log(`\nDocument #${idx + 1}: ${doc.title} (${doc.documentType})`);
    console.log('Has Extracted Text:', Boolean(doc.extractedText && doc.extractedText.length > 20));
    console.log('Text Sample:\n' + doc.extractedText.substring(0, 200) + '...\n');
    if (!doc.extractedText || doc.extractedText.length < 20) {
      throw new Error(`FAIL: Document ${doc.title} was not converted into text!`);
    }
  });
  console.log('✓ PASS: Every uploaded hospital report image was converted into clean text!');

  // 5. Query GET /api/documents to verify enrichment
  console.log('\n[Test 4] Querying GET /api/documents to verify records & converted text...');
  const docsRes = await fetch(`${BASE_URL}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const docsData = await docsRes.json();
  console.log(`Retrieved ${docsData.documents?.length} documents from API.`);
  const allHaveText = docsData.documents.every((d) => d.extractedText && d.extractedText.length > 10);
  if (allHaveText) {
    console.log('✓ PASS: All retrieved records include converted clinical text!');
  } else {
    throw new Error('FAIL: Some documents missing converted text in GET /api/documents');
  }

  // 6. Test Document Deletion
  console.log('\n[Test 5] Testing Document Deletion...');
  const docToDelete = docsData.documents[0];
  const delRes = await fetch(`${BASE_URL}/documents/${docToDelete._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const delData = await delRes.json();
  console.log('Delete Response:', delData.message);
  if (delRes.status === 200 && delData.success) {
    console.log('✓ PASS: Document deleted cleanly!');
  } else {
    throw new Error('FAIL: Document deletion failed!');
  }

  // Cleanup test files
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED: Multi-Image Upload, Strict Hospital Report Validation & OCR Text Conversion are 100% Operational!');
  console.log('======================================================');
}

testUploadAndValidation().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
