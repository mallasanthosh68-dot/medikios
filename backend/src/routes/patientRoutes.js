const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const {
  getProfile,
  updateProfile,
  recordConsent,
  startInterview,
  submitAnswer,
  createOrGetSummary,
  getLatestSummary,
  uploadDocument,
  getDocuments,
  runOcrOnDocument,
  reviewExtraction,
  getTimeline,
  getPatientPrescriptions,
  getPatientDoctorRequests,
  verifyAadhaarDemo,
  saveGroqApiKey,
  getGroqStatus,
  getInterview,
  completeInterview,
  updateSummary,
  confirmSummary,
  attachReportToSummary,
  removeReportFromSummary,
  deleteDocument,
  translatePatientText,
} = require('../controllers/patientController');

// All patient routes require authentication and patient role
router.use(protect);
router.use(requireRole('patient'));

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.post('/consent', recordConsent);
router.post('/translate', translatePatientText);
router.post('/interview/start', startInterview);
router.get('/interview/:id', getInterview);
router.post('/interview/:id/answer', submitAnswer);
router.post('/interview/:id/complete', completeInterview);
router.get('/summary/latest', getLatestSummary);
router.post('/interview/:id/summary', createOrGetSummary);
router.put('/interview/:id/summary', updateSummary);
router.post('/interview/:id/summary/confirm', confirmSummary);
router.post('/summary/:id/attach-report', upload.any(), attachReportToSummary);
router.delete('/summary/:id/report/:reportId', removeReportFromSummary);
router.delete('/summary/:id/report', removeReportFromSummary);

router.post('/documents/upload', upload.any(), uploadDocument);
router.get('/documents', getDocuments);
router.delete('/documents/:id', deleteDocument);
router.post('/documents/:id/ocr', runOcrOnDocument);
router.put('/documents/extractions/:id/review', reviewExtraction);

router.get('/timeline', getTimeline);
router.get('/prescriptions', getPatientPrescriptions);
router.get('/doctor-requests', getPatientDoctorRequests);
router.get('/appointments', getPatientDoctorRequests);
router.post('/aadhaar/demo-verify', verifyAadhaarDemo);
router.post('/groq-key', saveGroqApiKey);
router.get('/groq-status', getGroqStatus);

module.exports = router;
