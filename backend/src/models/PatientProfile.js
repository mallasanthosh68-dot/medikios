const mongoose = require('mongoose');

const PatientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, default: 'Not specified' },
  weight: { type: Number, default: null }, // in kg
  height: { type: Number, default: null }, // in cm
  emergencyContact: { type: String, default: '' },
  aadhaarDemoVerified: { type: Boolean, default: false },
  aadhaarDemoId: { type: String, default: '' },
  abhaId: { type: String, trim: true, default: '' },
  abhaAddress: { type: String, trim: true, default: '' },
  preferredLanguage: { type: String, default: 'en' },
  opNumber: { type: String, trim: true, default: null },
  generatedOpNumbers: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PatientProfile', PatientProfileSchema);
