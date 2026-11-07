const mongoose = require('mongoose');

const HealthInterviewSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  healthcareMode: {
    type: String,
    enum: ['general_medical', 'ayush'],
    default: 'general_medical',
  },
  communicationMode: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text',
  },
  consentStatus: {
    type: Boolean,
    default: false,
  },
  caseStatus: {
    type: String,
    enum: [
      'DRAFT',
      'CONSENTED',
      'INTERVIEW_STARTED',
      'INTERVIEW_COMPLETED',
      'DOCUMENT_PROCESSING',
      'SUMMARY_GENERATED',
      'PATIENT_REVIEW',
      'PATIENT_CONFIRMED',
      'PHYSICIAN_REVIEW',
      'PHYSICIAN_CONFIRMED',
      'CONSULTATION',
    ],
    default: 'DRAFT',
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
  },
  chiefComplaint: { type: String, default: '' },
  symptoms: [{ type: String }],
  duration: { type: String, default: '' },
  severity: { type: String, default: 'Moderate' },
  collectedAYUSHData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  responses: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
      inputMode: { type: String, enum: ['text', 'voice'], default: 'text' },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  redFlagsDetected: [{ type: String }],
  priority: {
    type: String,
    enum: ['NORMAL', 'HIGH_PRIORITY'],
    default: 'NORMAL',
  },
  startTime: { type: Date, default: Date.now },
  pinnedReports: [{ type: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

module.exports = mongoose.model('HealthInterview', HealthInterviewSchema);
