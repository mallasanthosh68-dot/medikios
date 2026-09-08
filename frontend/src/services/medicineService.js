import { api } from './api';

let cachedLocalCatalog = null;

/**
 * Lazy loads the 10,000+ medicine formulations in background on demand.
 */
export const getLocalMedicineCatalog = async () => {
  if (cachedLocalCatalog) return cachedLocalCatalog;
  try {
    const data = await import('../data/medicines10000.json');
    cachedLocalCatalog = data.default || data;
    return cachedLocalCatalog;
  } catch (err) {
    console.warn('Could not load local medicine json fallback:', err);
    return [];
  }
};

/**
 * Fast in-memory search over 10,000+ medicines
 */
export const filterLocalMedicines = (catalog, query, limit = 15) => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  const scored = [];
  for (let i = 0; i < catalog.length; i++) {
    const med = catalog[i];
    const brand = med.name || med.medicineName || '';
    const nameLower = brand.toLowerCase();
    const genLower = (med.genericName || '').toLowerCase();

    let score = 0;
    if (nameLower.startsWith(q)) {
      score += 150;
    } else if (nameLower.includes(q)) {
      score += 80;
    } else if (genLower.startsWith(q)) {
      score += 60;
    } else if (genLower.includes(q)) {
      score += 40;
    }

    if (score > 0) {
      scored.push({
        med: {
          ...med,
          name: brand,
          medicineName: brand,
          dosage: med.dosage || med.standardDosage || '1 unit',
          standardDosage: med.standardDosage || med.dosage || '1 unit',
          frequency: med.frequency || 'Twice daily',
          instructions: med.instructions || med.commonUsage || '',
          commonUsage: med.commonUsage || med.instructions || '',
        },
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || (a.med.name || '').localeCompare(b.med.name || ''));
  return scored.slice(0, limit).map((s) => s.med);
};

/**
 * Suggest medicines with backend query and instantaneous local fallback.
 */
export const suggestMedicines = async (query, limit = 15) => {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 1) {
    return [];
  }

  try {
    const res = await api.get(`/medicines/suggest?q=${encodeURIComponent(trimmed)}&limit=${limit}`);
    if (res && res.success && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
      return res.suggestions;
    }
  } catch (err) {
    // Fall back to local catalog seamlessly if network or backend times out
    console.debug('Falling back to local medicine catalog:', err.message);
  }

  // Fallback to local in-memory catalog
  const catalog = await getLocalMedicineCatalog();
  return filterLocalMedicines(catalog, trimmed, limit);
};

/**
 * Search full catalog with category, form, and pagination
 */
export const searchMedicinesCatalog = async ({ search = '', category = 'All', form = 'All', page = 1, limit = 50 }) => {
  try {
    let query = `?page=${page}&limit=${limit}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (category !== 'All') query += `&category=${encodeURIComponent(category)}`;
    if (form !== 'All') query += `&form=${encodeURIComponent(form)}`;

    const res = await api.get(`/medicines${query}`);
    if (res && res.success) {
      return res;
    }
  } catch (err) {
    console.warn('Failed to fetch from backend catalog API:', err);
  }

  // Local fallback filter
  const catalog = await getLocalMedicineCatalog();
  let results = catalog;

  if (category !== 'All') {
    results = results.filter((m) => m.category === category);
  }
  if (form !== 'All') {
    results = results.filter((m) => m.form === form);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.genericName && m.genericName.toLowerCase().includes(q))
    );
  }

  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return {
    success: true,
    count: results.length,
    page,
    totalPages: Math.ceil(results.length / limit),
    medicines: paginated,
  };
};
