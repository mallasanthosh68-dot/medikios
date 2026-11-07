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
  patientPhone: { type: String, default: '', trim: true },
  abhaId: { type: String, default: '', trim: true },
  abhaAddress: { type: String, default: '', trim: true },
  opNumber: { type: String, default: '' },
  patientAge: { type: Number, required: true },
  patientGender: { type: String, required: true },
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
  language: {
    type: String,
    default: 'en',
  },
  chiefComplaint: { type: String, required: true },
  symptoms: [{ type: String }],
  duration: { type: String, default: '' },
  severity: { type: String, default: 'Moderate' },
  medicalHistory: [{ type: String }],
  previousMedicines: [{ type: String }],
  // Full Q&A Transcript: AI Questions Asked & Patient Answers Given
  interviewResponses: [
    {
      question: { type: String, default: '' },
      answer: { type: String, default: '' },
      inputMode: { type: String, default: 'text' },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  // AI Medication Suggestions for Doctor's Clinical Review & Prescription
  aiMedicationSuggestions: [
    {
      medicineName: { type: String, default: '' },
      genericName: { type: String, default: '' },
      category: { type: String, default: 'General Pharmacotherapy' },
      form: { type: String, default: 'Tablet' },
      strength: { type: String, default: '' },
      dosage: { type: String, default: '1 tablet' },
      frequency: { type: String, default: 'Twice daily' },
      duration: { type: String, default: '5 days' },
      timing: { type: String, default: 'After food' },
      clinicalRationale: { type: String, default: '' },
      advisoryNote: {
        type: String,
        default: 'AI Clinical Suggestion — Attending doctor review & prescription approval required.',
      },
    },
  ],
  previousLabResults: [
    {
      test: { type: String },
      value: { type: String },
      date: { type: String },
      referenceRange: { type: String, default: '' },
      status: { type: String, default: 'Needs Review' },
    },
  ],
  previousPrescriptions: [{ type: String }],
  ayushAssessment: {
    prakriti: { type: String, default: '' },
    vikriti: { type: String, default: '' },
    prakritiObservations: { type: String, default: '' },
    vikritiObservations: { type: String, default: '' },
    agni: { type: String, default: '' }, // Digestion & metabolism
    koshtha: { type: String, default: '' }, // Bowel tendency
    ahara: { type: String, default: '' }, // Diet and food habits
    vihara: { type: String, default: '' }, // Daily routine and physical activity
    nidra: { type: String, default: '' }, // Sleep pattern
    nidana: { type: String, default: '' }, // Reported causes or triggering factors
    samprapti: { type: String, default: '' }, // Progression details
    dashavidhaPariksha: { type: mongoose.Schema.Types.Mixed, default: {} },
    traditionalPractices: [{ type: String }],
    verificationNotice: {
      type: String,
      default: 'Information collected for physician assessment. Qualified practitioner review and confirmation required.',
    },
  },
  caseDataQualityScore: {
    overallScore: { type: Number, default: 85 },
    completenessScore: { type: Number, default: 80 },
    consistencyScore: { type: Number, default: 90 },
    clarityScore: { type: Number, default: 85 },
    verificationStatus: {
      type: String,
      enum: ['NEEDS_VERIFICATION', 'PARTIALLY_VERIFIED', 'VERIFIED'],
      default: 'NEEDS_VERIFICATION',
    },
  },
  pinnedReports: [
    {
      documentId: { type: String },
      title: { type: String },
      documentType: { type: String, default: 'Lab Report' },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadMethod: { type: String },
      hasExtractedText: { type: Boolean, default: false },
      extractedText: { type: String, default: '' },
      structuredData: { type: mongoose.Schema.Types.Mixed, default: {} },
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
    enum: ['DRAFT', 'SHARED_WITH_DOCTOR', 'ACCEPTED_BY_DOCTOR', 'DOCTOR_REVIEWED', 'COMPLETED'],
    default: 'DRAFT',
  },
  patientConfirmation: {
    isConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },
  },
  physicianConfirmation: {
    isConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },
    physicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    physicianName: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    clinicalNotes: { type: String, default: '' },
    doctorEdits: { type: String, default: '' },
    corrections: { type: mongoose.Schema.Types.Mixed, default: {} },
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
