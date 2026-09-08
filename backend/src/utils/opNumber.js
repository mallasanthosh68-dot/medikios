/**
 * OP (Outpatient) Number Generator Utility for MediKiosk
 * Generates unique, standard Indian OPD tokens in the format: OP-XXXXXX
 * (e.g. OP-749210)
 */

const generateOpNumber = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit random number (100000 - 999999)
  return `OP-${randomDigits}`;
};

const isValidOpNumber = (op) => {
  if (!op || typeof op !== 'string') return false;
  return /^OP-\d{6}$/i.test(op.trim());
};

module.exports = {
  generateOpNumber,
  isValidOpNumber,
};
