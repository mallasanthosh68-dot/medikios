const { Medicine } = require('../models');

// @route   GET /api/medicines/suggest
// Ultra-fast autocomplete endpoint for live typing in prescription forms
const suggestMedicines = async (req, res, next) => {
  try {
    const { q, search, limit = 15 } = req.query;
    const term = (q || search || '').trim();
    if (!term) {
      return res.json({ success: true, count: 0, suggestions: [] });
    }

    const regex = new RegExp(term, 'i');
    const prefixRegex = new RegExp(`^${term}`, 'i');

    const allMatches = await Medicine.find({
      $or: [
        { medicineName: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } },
        { genericName: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
      ],
    });

    // Intelligent Clinical Ranking:
    // 1. Medicine name starts with search term (Highest priority: +120)
    // 2. Generic name starts with search term (+80)
    // 3. Medicine name contains search term (+50)
    // 4. Generic name contains search term (+25)
    const scored = allMatches.map((med) => {
      let score = 0;
      const medName = med.name || med.medicineName || '';
      const genName = med.genericName || '';
      if (prefixRegex.test(medName)) score += 120;
      else if (regex.test(medName)) score += 50;

      if (prefixRegex.test(genName)) score += 80;
      else if (regex.test(genName)) score += 25;

      return { med, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, parseInt(limit, 10)).map((s) => {
      const doc = s.med.toObject ? s.med.toObject() : { ...s.med };
      const brand = doc.name || doc.medicineName || '';
      return {
        ...doc,
        name: brand,
        medicineName: brand,
        dosage: doc.dosage || doc.standardDosage || '1 unit',
        standardDosage: doc.standardDosage || doc.dosage || '1 unit',
        frequency: doc.frequency || 'Twice daily',
        instructions: doc.instructions || doc.commonUsage || 'Take as directed',
        commonUsage: doc.commonUsage || doc.instructions || 'Take as directed',
      };
    });

    res.json({
      success: true,
      count: topResults.length,
      totalMatches: allMatches.length,
      suggestions: topResults,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/medicines
const searchMedicines = async (req, res, next) => {
  try {
    const { search, category, form, limit = 50, page = 1 } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (form && form !== 'All') {
      query.form = form;
    }

    if (search) {
      query.$or = [
        { medicineName: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const medicines = await Medicine.find(query);
    const count = await Medicine.countDocuments(query);

    const lim = parseInt(limit, 10) || 50;
    const pg = parseInt(page, 10) || 1;
    const startIndex = (pg - 1) * lim;
    const paged = medicines.slice(startIndex, startIndex + lim);

    res.json({
      success: true,
      count,
      page: pg,
      totalPages: Math.ceil(count / lim),
      medicines: paged,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/medicines/:id
const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }
    res.json({ success: true, medicine });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  suggestMedicines,
  searchMedicines,
  getMedicineById,
};
