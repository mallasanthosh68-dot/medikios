const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAdminOverview,
  assignDoctorToSummary,
} = require('../controllers/adminController');

// All admin routes require authentication
router.get('/overview', protect, getAdminOverview);
router.post('/assign-doctor', protect, assignDoctorToSummary);

module.exports = router;
