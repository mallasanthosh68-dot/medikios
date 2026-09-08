const mongoose = require('mongoose');

const DoctorRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  summaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthSummary',
    required: true,
  },
  documentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalDocument',
    },
  ],
  consentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consent',
    required: true,
  },
  patientName: { type: String, required: true },
  opNumber: { type: String, default: '' },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, required: true },
  patientPhone: { type: String, required: true },
  chiefComplaint: { type: String, required: true },
  priority: {
    type: String,
    enum: ['NORMAL', 'HIGH_PRIORITY'],
    default: 'NORMAL',
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'IN_REVIEW', 'REVIEWED', 'PRESCRIPTION_ISSUED', 'COMPLETED'],
    default: 'PENDING',
  },
  appointmentDate: { type: String, default: 'Tomorrow' },
  appointmentSlot: { type: String, default: '10:00 AM - 01:00 PM' },
  doctorMessage: { type: String, default: '' },
  clinicalNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
});

module.exports = mongoose.model('DoctorRequest', DoctorRequestSchema);
