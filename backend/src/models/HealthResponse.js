const mongoose = require('mongoose');

const HealthResponseSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthInterview',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  inputMode: { type: String, enum: ['text', 'voice'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HealthResponse', HealthResponseSchema);
