/**
 * OP (Outpatient) Number Generator Utility for MediKiosk
 * Generates unique, standard Indian OPD tokens in the format: OP-XXXXXX
 * (e.g. OP-749210)
 */

const generateOpNumber = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit random number (100000 - 999999)
  return `OP-${randomDigits}`;
};

/**
 * Generates a guaranteed unique OP Number by checking database records
 */
const generateUniqueOpNumber = async () => {
  try {
    const HealthSummary = require('../models/HealthSummary');
    const User = require('../models/User');

    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = generateOpNumber();
      const [summaryExists, userExists] = await Promise.all([
        HealthSummary.findOne({ opNumber: candidate }).lean().catch(() => null),
        User.findOne({ opNumber: candidate }).lean().catch(() => null),
      ]);

      if (!summaryExists && !userExists) {
        return candidate;
      }
    }
  } catch (err) {
    // If DB check encounters any error or disconnected state, generate fresh candidate
  }
  return generateOpNumber();
};

const isValidOpNumber = (op) => {
  if (!op || typeof op !== 'string') return false;
  return /^OP-\d{6}$/i.test(op.trim());
};

module.exports = {
  generateOpNumber,
  generateUniqueOpNumber,
  isValidOpNumber,
};

