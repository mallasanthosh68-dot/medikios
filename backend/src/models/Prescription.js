const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorRequest',
    default: null,
  },
  doctorName: { type: String, required: true },
  doctorLicense: { type: String, required: true },
  doctorSpecialty: { type: String, required: true },
  hospitalName: { type: String, default: 'MediKiosk Apex Hospital' },
  patientName: { type: String, required: true },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, required: true },
  patientPhone: { type: String, required: true },
  opNumber: { type: String, required: true },
  diagnosisOrImpression: { type: String, default: 'Provisional Clinical Assessment' },
  medicines: [
    {
      name: { type: String, required: true },
      genericName: { type: String, default: '' },
      strength: { type: String, default: '' },
      form: { type: String, default: 'Tablet' },
      dosage: { type: String, required: true }, // e.g., '1 tablet'
      frequency: { type: String, default: 'Twice daily' },
      timing: {
        morning: { type: Boolean, default: false },
        afternoon: { type: Boolean, default: false },
        night: { type: Boolean, default: false },
        mealRelation: { type: String, enum: ['Before food', 'After food', 'With food', 'As needed'], default: 'After food' },
      },
      duration: { type: String, default: '5 days' },
      instructions: { type: String, default: '' },
    },
  ],
  generalInstructions: { type: String, default: 'Maintain adequate hydration and take rest.' },
  doctorNotes: { type: String, default: '' },
  followUpDays: { type: Number, default: 7 },
  status: {
    type: String,
    enum: ['ISSUED', 'DISPENSED', 'CANCELLED'],
    default: 'ISSUED',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
