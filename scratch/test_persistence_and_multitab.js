const path = require('path');
const fs = require('fs');

async function runTest() {
  console.log('--- Step 1: Testing Backend Models & Seeder ---');
  const { connectDB } = require('../backend/src/config/db');
  await connectDB();

  const { User, PatientProfile, DoctorProfile, Medicine, rawMemory, loadFromDisk } = require('../backend/src/models');
  const { seedDatabase } = require('../backend/src/utils/seedData');

  await seedDatabase();

  const userCount = await User.countDocuments();
  console.log(`Current User count: ${userCount}`);

  // Check demo phone numbers are NOT present
  const ramesh = await User.findOne({ phoneNumber: '9876543210' });
  const docIyer = await User.findOne({ phoneNumber: '9876543201' });

  if (ramesh || docIyer) {
    throw new Error(`Demo accounts still present! Ramesh: ${Boolean(ramesh)}, Iyer: ${Boolean(docIyer)}`);
  }
  console.log('✓ Verified: Demo accounts (Ramesh Kumar, Dr. Rajesh Iyer) are completely removed.');

  const medCount = await Medicine.countDocuments();
  console.log(`✓ Verified: Medicine catalog has ${medCount} medicines available.`);

  console.log('\n--- Step 2: Testing Creating a New User (Patient & Doctor) ---');
  const bcrypt = require('../backend/node_modules/bcryptjs');
  const testPassword = await bcrypt.hash('TestPass@123', 10);

  const newPatientUser = await User.create({
    phoneNumber: '9123456780',
    password: testPassword,
    role: 'patient',
    name: 'Aarav Sharma',
  });

  const newPatientProfile = await PatientProfile.create({
    userId: newPatientUser._id,
    name: 'Aarav Sharma',
    phoneNumber: '9123456780',
    age: 28,
    gender: 'Male',
    bloodGroup: 'O+',
  });
  console.log(`✓ Created new Patient: ${newPatientUser.name} (${newPatientUser.phoneNumber})`);

  const newDoctorUser = await User.create({
    phoneNumber: '9123456781',
    password: testPassword,
    role: 'doctor',
    name: 'Dr. Neha Verma',
  });

  const newDoctorProfile = await DoctorProfile.create({
    userId: newDoctorUser._id,
    doctorName: 'Dr. Neha Verma',
    licenseNumber: 'MCI-99881',
    specialization: 'General Medicine',
    phoneNumber: '9123456781',
    experienceYears: 8,
  });
  console.log(`✓ Created new Doctor: ${newDoctorUser.name} (${newDoctorUser.phoneNumber})`);

  console.log('\n--- Step 3: Verifying Disk File Persistence in local_db.json ---');
  const dbFilePath = path.join(__dirname, '../backend/src/data/local_db.json');
  if (!fs.existsSync(dbFilePath)) {
    throw new Error('local_db.json file was not created!');
  }

  const fileRaw = fs.readFileSync(dbFilePath, 'utf8');
  const fileParsed = JSON.parse(fileRaw);

  const foundPatientInFile = fileParsed.User.find(u => u.phoneNumber === '9123456780');
  const foundDoctorInFile = fileParsed.User.find(u => u.phoneNumber === '9123456781');

  if (!foundPatientInFile || !foundDoctorInFile) {
    throw new Error('New accounts were not saved to local_db.json!');
  }
  console.log('✓ Verified: Both new Patient and Doctor are permanently saved to disk in local_db.json!');

  console.log('\n--- Step 4: Simulating Server Restart ---');
  // Clear in-memory array and reload from disk
  rawMemory.User.data = [];
  rawMemory.PatientProfile.data = [];
  rawMemory.DoctorProfile.data = [];

  console.log(`RAM cleared. User count in RAM: ${rawMemory.User.data.length}`);
  loadFromDisk();
  console.log(`After reloadFromDisk(), User count: ${rawMemory.User.data.length}`);

  const reloadedPatient = await User.findOne({ phoneNumber: '9123456780' });
  const reloadedDoctor = await User.findOne({ phoneNumber: '9123456781' });

  if (!reloadedPatient || !reloadedDoctor) {
    throw new Error('Failed to reload accounts from disk after server restart simulation!');
  }
  console.log(`✓ Verified: Reloaded Patient: ${reloadedPatient.name} & Doctor: ${reloadedDoctor.name} from disk!`);

  console.log('\n========================================');
  console.log('ALL VERIFICATION TESTS PASSED PERFECTLY!');
  console.log('========================================');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
