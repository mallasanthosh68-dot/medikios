const express = require('express');
const router = express.Router();
const {
  registerPatient,
  registerDoctor,
  login,
  getMe,
  logout,
} = require('../controllers/authController');
const {
  sendPatientOtp,
  verifyPatientOtp,
} = require('../controllers/otpController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register/patient', registerPatient);
router.post('/register/doctor', registerDoctor);
router.post('/login', login);
router.post('/logout', logout);
router.post('/send-otp', sendPatientOtp);
router.post('/verify-otp', verifyPatientOtp);
router.get('/me', protect, getMe);

module.exports = router;
