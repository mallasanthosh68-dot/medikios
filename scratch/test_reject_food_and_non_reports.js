const fs = require('fs');
const path = require('path');

async function testRejectFoodAndNonReports() {
  console.log('======================================================================');
  console.log('🧪 Starting Verification: Reject Food Images, Non-Reports & Photos');
  console.log('======================================================================\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. Register a test patient
  const testEmail = `food_reject_test_${Date.now()}@medikiosk.test`;
  const regRes = await fetch(`${BASE_URL}/auth/register/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Verma',
      email: testEmail,
      password: 'Password123!',
      phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'patient',
      age: 34,
      gender: 'male',
    }),
  });

  const regData = await regRes.json();
  if (!regData.token) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  const token = regData.token;
  console.log('✓ Test patient authenticated:', testEmail);

  const tmpDir = path.join(__dirname, 'food_test_files');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // -------------------------------------------------------------
  // Test Case 1: Direct food filename (e.g. pizza_lunch_meal.jpg)
  // -------------------------------------------------------------
  console.log('\n[Test 1] Uploading Food Image (pizza_lunch_meal.jpg)...');
  const food1Path = path.join(tmpDir, 'pizza_lunch_meal.jpg');
  fs.writeFileSync(food1Path, 'Cheesy Pizza Slice with Pepperoni and Garlic Dip');

  const food1Form = new FormData();
  food1Form.append('document', new Blob([fs.readFileSync(food1Path)], { type: 'image/jpeg' }), 'pizza_lunch_meal.jpg');
  food1Form.append('documentType', 'Lab Report');

  const res1 = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: food1Form,
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Reason:', data1.message);
  if (res1.status === 422 && data1.rejected && /food/i.test(data1.message)) {
    console.log('✓ PASS: Food image (pizza_lunch_meal.jpg) strictly REJECTED!');
  } else {
    throw new Error('FAIL: Food image was not rejected properly! ' + JSON.stringify(data1));
  }

  // -------------------------------------------------------------
  // Test Case 2: Chicken Biryani Dish (chicken_biryani_dish.png)
  // -------------------------------------------------------------
  console.log('\n[Test 2] Uploading Culinary Dish Image (chicken_biryani_dish.png)...');
  const food2Path = path.join(tmpDir, 'chicken_biryani_dish.png');
  fs.writeFileSync(food2Path, 'Hyderabadi Chicken Dum Biryani with Mirchi ka Salan and Raita');

  const food2Form = new FormData();
  food2Form.append('document', new Blob([fs.readFileSync(food2Path)], { type: 'image/png' }), 'chicken_biryani_dish.png');
  food2Form.append('documentType', 'Lab Report');

  const res2 = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: food2Form,
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Reason:', data2.message);
  if (res2.status === 422 && data2.rejected && /food|culinary/i.test(data2.message)) {
    console.log('✓ PASS: Culinary dish image (chicken_biryani_dish.png) strictly REJECTED!');
  } else {
    throw new Error('FAIL: Biryani dish image was not rejected! ' + JSON.stringify(data2));
  }

  // -------------------------------------------------------------
  // Test Case 3: Food packaging/menu with generic camera filename (IMG_20260906.jpg)
  // -------------------------------------------------------------
  console.log('\n[Test 3] Uploading Food Menu / Nutrition Image disguised as IMG_20260906.jpg...');
  const food3Path = path.join(tmpDir, 'IMG_20260906.jpg');
  fs.writeFileSync(
    food3Path,
    'DELUXE RESTAURANT MENU\nDish: Paneer Butter Masala & Butter Naan\nServing Size: 250g | 480 Calories\nIngredients: Cottage Cheese, Butter, Spices\nSwiggy Fast Food Order #59302'
  );

  const food3Form = new FormData();
  food3Form.append('document', new Blob([fs.readFileSync(food3Path)], { type: 'image/jpeg' }), 'IMG_20260906.jpg');
  food3Form.append('documentType', 'Lab Report');

  const res3 = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: food3Form,
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('Reason:', data3.message);
  if (res3.status === 422 && data3.rejected && /food|culinary/i.test(data3.message)) {
    console.log('✓ PASS: Disguised food menu image (IMG_20260906.jpg) content-analyzed & strictly REJECTED!');
  } else {
    throw new Error('FAIL: Disguised food menu was not rejected! ' + JSON.stringify(data3));
  }

  // -------------------------------------------------------------
  // Test Case 4: Non-Report Personal Photo (my_pet_dog.jpg)
  // -------------------------------------------------------------
  console.log('\n[Test 4] Uploading Non-Report Photo (my_pet_dog.jpg)...');
  const petPath = path.join(tmpDir, 'my_pet_dog.jpg');
  fs.writeFileSync(petPath, 'Golden Retriever puppy playing in the park');

  const petForm = new FormData();
  petForm.append('document', new Blob([fs.readFileSync(petPath)], { type: 'image/jpeg' }), 'my_pet_dog.jpg');
  petForm.append('documentType', 'Lab Report');

  const res4 = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: petForm,
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status);
  console.log('Reason:', data4.message);
  if (res4.status === 422 && data4.rejected) {
    console.log('✓ PASS: Non-report photo (my_pet_dog.jpg) strictly REJECTED!');
  } else {
    throw new Error('FAIL: Pet photo was not rejected! ' + JSON.stringify(data4));
  }

  // -------------------------------------------------------------
  // Test Case 5: Genuine Hospital Report (Apex_Hospital_CBC_Report.jpg)
  // -------------------------------------------------------------
  console.log('\n[Test 5] Uploading Genuine Hospital Lab Report (Apex_Hospital_CBC_Report.jpg)...');
  const reportPath = path.join(tmpDir, 'Apex_Hospital_CBC_Report.jpg');
  fs.writeFileSync(
    reportPath,
    'APEX HOSPITAL & DIAGNOSTIC PATHOLOGY LAB\nPatient: Rohan Verma | Age/Gender: 34/M\nDate: 06-Sep-2026\nDoctor: Dr. S. K. Mehta, MD (Pathology)\n\nTEST NAME                  OBSERVED    REFERENCE\nHemoglobin (Hb)            14.5 g/dL   13.5 - 17.5 g/dL [NORMAL]\nTotal Leukocyte Count (WBC) 7,200 /mcL  4,000 - 11,000 [NORMAL]\nPlatelet Count             260,000 /mcL 150,000 - 450,000 [NORMAL]\nFasting Blood Sugar (FBS)  92 mg/dL    70 - 99 mg/dL [NORMAL]'
  );

  const reportForm = new FormData();
  reportForm.append('document', new Blob([fs.readFileSync(reportPath)], { type: 'image/jpeg' }), 'Apex_Hospital_CBC_Report.jpg');
  reportForm.append('documentType', 'Lab Report');

  const res5 = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: reportForm,
  });
  const data5 = await res5.json();
  console.log('Status:', res5.status);
  console.log('Message:', data5.message);
  if (res5.status === 201 && data5.success && data5.document) {
    console.log('✓ PASS: Genuine hospital report accepted and converted to text!');
  } else {
    throw new Error('FAIL: Hospital report was rejected! ' + JSON.stringify(data5));
  }

  // -------------------------------------------------------------
  // Test Case 6: Photo with no readable text (photo_without_text.jpg)
  // -------------------------------------------------------------
  console.log('\n[Test 6] Uploading Photo with No Clinical Text (photo_without_text.jpg)...');
  const noTextPath = path.join(tmpDir, 'photo_without_text.jpg');
  fs.writeFileSync(noTextPath, '   \n   \n   ');

  const noTextForm = new FormData();
  noTextForm.append('document', new Blob([fs.readFileSync(noTextPath)], { type: 'image/jpeg' }), 'photo_without_text.jpg');
  noTextForm.append('documentType', 'Lab Report');

  const res6 = await fetch(`${BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: noTextForm,
  });
  const data6 = await res6.json();
  console.log('Status:', res6.status);
  console.log('Reason:', data6.message);
  if (res6.status === 422 && data6.rejected) {
    console.log('✓ PASS: Photo with no clinical text (photo_without_text.jpg) strictly REJECTED!');
  } else {
    throw new Error('FAIL: Photo without text was not rejected! ' + JSON.stringify(data6));
  }

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  console.log('\n======================================================================');
  console.log('🎉 ALL 6 TESTS PASSED: Food images & non-reports are 100% REJECTED!');
  console.log('======================================================================\n');
}

testRejectFoodAndNonReports().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
