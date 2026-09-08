const mongoose = require('mongoose');

const MedicalTimelineSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['LAB_TEST', 'PRESCRIPTION', 'CONSULTATION', 'AI_CHECKUP', 'SURGERY', 'VACCINATION'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  doctorOrFacility: {
    type: String,
    default: 'MediKiosk Apex Hospital',
  },
  keyMetrics: [
    {
      label: { type: String },
      value: { type: String },
    },
  ],
  associatedDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalDocument',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalTimeline', MedicalTimelineSchema);
