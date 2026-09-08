const express = require('express');
const router = express.Router();
const {
  getAbdmStatus,
  connectAbdm,
  shareAbdmRecords,
  getFhirBundle,
  getHisStatus,
  getHisRecords,
  pushHisTriage,
} = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

// ABDM Sandbox Simulation Routes
router.get('/abdm/status', getAbdmStatus);
router.post('/abdm/connect', protect, connectAbdm);
router.post('/abdm/share', protect, shareAbdmRecords);

// HL7 FHIR Interoperability Routes
router.get('/fhir/bundle/:patientId?', protect, getFhirBundle);

// Hospital HIS Integration Routes
router.get('/his/status', getHisStatus);
router.get('/his/records', protect, getHisRecords);
router.post('/his/triage', protect, pushHisTriage);

module.exports = router;
