const mongoose = require('mongoose');

const HealthSummarySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthInterview',
    default: null,
  },
  patientName: { type: String, required: true },
  opNumber: { type: String, default: '' },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, required: true },
  chiefComplaint: { type: String, required: true },
  symptoms: [{ type: String }],
  duration: { type: String, default: '' },
  severity: { type: String, default: 'Moderate' },
  medicalHistory: [{ type: String }],
  previousMedicines: [{ type: String }],
  previousLabResults: [
    {
      test: { type: String },
      value: { type: String },
      date: { type: String },
    },
  ],
  previousPrescriptions: [{ type: String }],
  pinnedReports: [
    {
      documentId: { type: String },
      title: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadMethod: { type: String },
      hasExtractedText: { type: Boolean, default: false },
      extractedText: { type: String, default: '' },
      confidenceScore: { type: Number, default: 0 },
      isDirectPinnedImage: { type: Boolean, default: false },
      pinReason: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  redFlagStatus: {
    type: String,
    enum: ['NONE', 'HIGH_PRIORITY'],
    default: 'NONE',
  },
  redFlagMessage: { type: String, default: '' },
  suggestedSpecialty: {
    type: String,
    required: true,
    default: 'General Medicine',
  },
  specialtyRationale: { type: String, default: '' },
  aiGeneratedText: { type: String, required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'SHARED_WITH_DOCTOR', 'ACCEPTED_BY_DOCTOR', 'DOCTOR_REVIEWED', 'COMPLETED'],
    default: 'DRAFT',
  },
  doctorReview: {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    doctorName: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    clinicalNotes: { type: String, default: '' },
    doctorEdits: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HealthSummary', HealthSummarySchema);
