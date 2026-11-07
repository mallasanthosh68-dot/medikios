const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const {
  getDoctors,
  getDoctorById,
  createDoctorRequest,
  getDoctorRequests,
  getSingleDoctorRequest,
  updateDoctorSummary,
  confirmDoctorReview,
  acceptDoctorRequest,
  verifyPatientOpNumber,
  lookupOpSummary,
} = require('../controllers/doctorController');

// Public / Patient directory of available doctors
router.get('/', getDoctors);

// Patient endpoint to send request
router.post('/requests', protect, requireRole('patient'), createDoctorRequest);

// Doctor-only endpoints (must be defined before /:id)
router.get('/portal/requests', protect, requireRole('doctor'), getDoctorRequests);
router.get('/requests', protect, requireRole('doctor'), getDoctorRequests);

router.get('/portal/requests/:id', protect, requireRole('doctor'), getSingleDoctorRequest);
router.get('/requests/:id', protect, requireRole('doctor'), getSingleDoctorRequest);

router.post('/portal/accept-request/:requestId', protect, requireRole('doctor'), acceptDoctorRequest);
router.post('/portal/requests/:requestId/accept', protect, requireRole('doctor'), acceptDoctorRequest);
router.post('/requests/:requestId/accept', protect, requireRole('doctor'), acceptDoctorRequest);

router.put('/portal/summaries/:id', protect, requireRole('doctor'), updateDoctorSummary);
router.post('/portal/confirm-review/:requestId', protect, requireRole('doctor'), confirmDoctorReview);
router.post('/confirm-review/:requestId', protect, requireRole('doctor'), confirmDoctorReview);

// Doctor verify patient OP Number & Direct OP Summary Lookup
router.post('/verify-op-number', protect, requireRole('doctor'), verifyPatientOpNumber);
router.get('/op-summary/:opNumber', protect, requireRole('doctor'), lookupOpSummary);
router.post('/lookup-op', protect, requireRole('doctor'), lookupOpSummary);

// Parameterized doctor profile route (defined after specific routes)
router.get('/:id', getDoctorById);

module.exports = router;
