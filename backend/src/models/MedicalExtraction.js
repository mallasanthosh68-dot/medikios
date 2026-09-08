const mongoose = require('mongoose');

const MedicalExtractionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalDocument',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rawText: { type: String, default: '' },
  structuredData: {
    labTests: [
      {
        testName: { type: String, required: true },
        value: { type: String, required: true },
        unit: { type: String, default: '' },
        referenceRange: { type: String, default: '' },
        status: { type: String, enum: ['Normal', 'High', 'Low', 'Borderline'], default: 'Normal' },
      },
    ],
    medicines: [
      {
        medicineName: { type: String, required: true },
        strength: { type: String, default: '' },
        dosage: { type: String, default: '' },
        frequency: { type: String, default: '' },
        duration: { type: String, default: '' },
      },
    ],
    medicalConditions: [{ type: String }],
    doctorName: { type: String, default: '' },
    documentDate: { type: String, default: '' },
    patientInfo: { type: String, default: '' },
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 85,
  },
  isHandwritten: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending_review', 'patient_verified', 'doctor_confirmed'],
    default: 'pending_review',
  },
  patientNotes: { type: String, default: '' },
  verifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MedicalExtraction', MedicalExtractionSchema);
