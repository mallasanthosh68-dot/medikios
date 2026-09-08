const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const {
  uploadDocument,
  getDocuments,
  runOcrOnDocument,
  reviewExtraction,
  deleteDocument,
} = require('../controllers/patientController');

// Document management endpoints for patients
router.use(protect);
router.use(requireRole('patient'));

router.post('/upload', upload.any(), uploadDocument);
router.get('/', getDocuments);
router.delete('/:id', deleteDocument);
router.post('/:id/ocr', runOcrOnDocument);
router.put('/extractions/:id/review', reviewExtraction);

module.exports = router;
