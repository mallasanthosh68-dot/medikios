const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const {
  startAyushCase,
  submitAyushAnswer,
  checkAyushRedFlag,
  uploadAyushDocument,
  runAyushOcr,
  getAyushCase,
  generateAyushSummary,
  patientConfirmAyushCase,
  getDoctorAyushCase,
  updateDoctorAyushCase,
  lookupPatientByPhone,
} = require('../controllers/ayushController');
const {
  sendPatientOtp,
  verifyPatientOtp,
} = require('../controllers/otpController');

// Patient AYUSH Case Intake Endpoints
router.post('/send-otp', sendPatientOtp);
router.post('/verify-otp', verifyPatientOtp);
router.post('/lookup-patient', lookupPatientByPhone);
router.get('/lookup-patient/:phone', lookupPatientByPhone);
router.post('/case/lookup-patient', lookupPatientByPhone);
router.get('/case/lookup-patient/:phone', lookupPatientByPhone);
router.post('/case/start', protect, requireRole('patient'), startAyushCase);
router.post('/case/:caseId/message', protect, requireRole('patient'), submitAyushAnswer);
router.post('/case/:caseId/answer', protect, requireRole('patient'), submitAyushAnswer);
router.post('/case/:caseId/red-flag', protect, requireRole('patient'), checkAyushRedFlag);
router.post('/case/:caseId/upload', protect, requireRole('patient'), upload.any(), uploadAyushDocument);
router.post('/case/:caseId/ocr', protect, requireRole('patient'), runAyushOcr);
router.get('/case/:caseId', protect, getAyushCase);
router.post('/case/:caseId/summary', protect, requireRole('patient'), generateAyushSummary);
router.post('/case/:caseId/patient-confirm', protect, requireRole('patient'), patientConfirmAyushCase);

// Doctor AYUSH Review Endpoints
router.get('/doctor/cases/:caseId', protect, requireRole('doctor'), getDoctorAyushCase);
router.put('/doctor/cases/:caseId', protect, requireRole('doctor'), updateDoctorAyushCase);
router.get('/cases/:caseId', protect, requireRole('doctor'), getDoctorAyushCase);
router.put('/cases/:caseId', protect, requireRole('doctor'), updateDoctorAyushCase);

module.exports = router;
