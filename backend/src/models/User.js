const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  opNumber: {
    type: String,
    trim: true,
    default: null,
  },
  abhaId: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
