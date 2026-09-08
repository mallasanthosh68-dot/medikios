const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true, index: true },
  genericName: { type: String, required: true, trim: true, index: true },
  strength: { type: String, required: true },
  form: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Ointment', 'Inhaler', 'Injection', 'Drops', 'Gel', 'Suspension'],
    default: 'Tablet',
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Antibiotic',
      'Analgesic / Pain Relief',
      'Antipyretic',
      'Antihypertensive',
      'Antidiabetic',
      'Antihistamine',
      'Antacid / PPI',
      'Bronchodilator / Respiratory',
      'Cardiovascular / Statin',
      'Cough & Cold',
      'Antiemetic',
      'Vitamin / Supplement',
      'Dermatological',
      'Gastrointestinal',
      'Neurological',
    ],
    index: true,
  },
  standardDosage: { type: String, default: '1 unit after food' },
  commonUsage: { type: String, default: '' },
  sideEffects: [{ type: String }],
  isPrescriptionRequired: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Medicine', MedicineSchema);
