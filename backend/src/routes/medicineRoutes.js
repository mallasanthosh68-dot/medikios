const express = require('express');
const router = express.Router();
const {
  suggestMedicines,
  searchMedicines,
  getMedicineById,
} = require('../controllers/medicineController');

// Autocomplete suggestions route for live typing
router.get('/suggest', suggestMedicines);

// General search and catalog routes
router.get('/', searchMedicines);
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

module.exports = router;
