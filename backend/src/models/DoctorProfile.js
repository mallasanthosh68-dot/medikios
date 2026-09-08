const mongoose = require('mongoose');

const DoctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorName: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  specialization: {
    type: String,
    required: true,
    enum: [
      'Cardiology',
      'General Medicine',
      'Neurology',
      'Dermatology',
      'Orthopedics',
      'Pulmonology',
      'Gastroenterology',
      'ENT',
      'Ophthalmology',
      'Pediatrics',
    ],
  },
  phoneNumber: { type: String, required: true },
  experienceYears: { type: Number, default: 5 },
  hospitalAffiliation: { type: String, default: 'MediKiosk Apex Hospital' },
  demoVerified: { type: Boolean, default: true },
  bio: { type: String, default: '' },
  availableToday: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DoctorProfile', DoctorProfileSchema);
