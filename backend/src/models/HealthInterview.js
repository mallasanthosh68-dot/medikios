const mongoose = require('mongoose');

const HealthInterviewSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'te'],
    default: 'en',
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
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

module.exports = mongoose.model('HealthInterview', HealthInterviewSchema);
