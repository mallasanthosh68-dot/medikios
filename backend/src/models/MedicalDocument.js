const mongoose = require('mongoose');

const MedicalDocumentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentType: {
    type: String,
    enum: [
      'Lab Report',
      'Blood Test',
      'Prescription',
      'Medicine Report',
      'Discharge Summary',
      'Medical Certificate',
      'Handwritten Prescription',
      'Other',
    ],
    default: 'Lab Report',
  },
  title: { type: String, required: true },
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadMethod: {
    type: String,
    enum: ['device', 'camera'],
    default: 'device',
  },
  ocrProcessed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MedicalDocument', MedicalDocumentSchema);
