const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  consentType: {
    type: String,
    enum: ['ai_interview', 'doctor_share', 'abdm_link'],
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  scope: {
    type: String,
    default: 'Health interview data collection and structured clinical summarization.',
  },
  granted: {
    type: Boolean,
    default: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  clientMetadata: {
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
  },
});

module.exports = mongoose.model('Consent', ConsentSchema);
