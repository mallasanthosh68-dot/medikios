const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
} = require('../controllers/prescriptionController');

router.use(protect);

router.post('/', requireRole('doctor'), createPrescription);
router.get('/', getPrescriptions);
router.get('/:id', getPrescriptionById);

module.exports = router;
