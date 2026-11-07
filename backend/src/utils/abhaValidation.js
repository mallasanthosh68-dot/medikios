/**
 * ABDM 14-Digit ABHA Number Validation and Normalization Utilities
 */

/**
 * Strips all non-digit characters from the input
 * @param {string} raw 
 * @returns {string} digits only
 */
function extractAbhaDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/**
 * Formats 14 numeric digits into standard ABDM format: XX-XXXX-XXXX-XXXX
 * @param {string} raw 
 * @returns {string} formatted ABHA number
 */
function formatAbhaNumber(raw) {
  const digits = extractAbhaDigits(raw).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
}

/**
 * Validates whether the given string is a valid 14-digit ABHA number
 * @param {string} raw 
 * @returns {{ isValid: boolean, digits: string, formatted: string, message: string }}
 */
function validateAbhaNumber(raw) {
  const rawStr = String(raw || '').trim();
  if (!rawStr) {
    return {
      isValid: false,
      digits: '',
      formatted: '',
      message: '14-digit ABHA number is required.',
    };
  }

  const digits = extractAbhaDigits(rawStr);

  if (digits.length !== 14) {
    return {
      isValid: false,
      digits,
      formatted: formatAbhaNumber(rawStr),
      message: `ABHA number must be exactly 14 numeric digits (currently ${digits.length} digits). Example: 91-8472-9102-4821`,
    };
  }

  // Reject all identical digits (e.g. 00000000000000, 11111111111111)
  if (/^(\d)\1{13}$/.test(digits)) {
    return {
      isValid: false,
      digits,
      formatted: formatAbhaNumber(digits),
      message: 'Invalid ABHA number. Repeated identical digits are not accepted.',
    };
  }

  const formatted = formatAbhaNumber(digits);

  return {
    isValid: true,
    digits,
    formatted,
    message: 'Valid 14-digit ABDM ABHA Number.',
  };
}

/**
 * Generates search query object to match a 14-digit ABHA number in DB regardless of hyphenation
 * @param {string} raw 
 * @returns {{ regex: RegExp, formatted: string, digits: string, is14Digits: boolean }}
 */
function buildAbhaSearchQuery(raw) {
  const clean = String(raw || '').trim();
  const digits = extractAbhaDigits(clean);

  if (digits.length === 14) {
    const d0 = digits.slice(0, 2);
    const d1 = digits.slice(2, 6);
    const d2 = digits.slice(6, 10);
    const d3 = digits.slice(10, 14);
    // Regex matches 14 continuous digits or XX-XXXX-XXXX-XXXX or XX XXXX XXXX XXXX
    const pattern = `^${d0}[- ]?${d1}[- ]?${d2}[- ]?${d3}$`;
    const formatted = `${d0}-${d1}-${d2}-${d3}`;
    return {
      regex: new RegExp(pattern, 'i'),
      formatted,
      digits,
      is14Digits: true,
    };
  }

  // Fallback for custom or legacy string
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    regex: new RegExp(`^${escaped}$`, 'i'),
    formatted: clean,
    digits,
    is14Digits: false,
  };
}

/**
 * Generates a random valid 14-digit ABHA number
 * @returns {string} formatted ABHA number (e.g. 91-8472-9102-4821)
 */
function generateRandom14DigitAbha() {
  const p1 = '91';
  const p2 = String(Math.floor(1000 + Math.random() * 9000));
  const p3 = String(Math.floor(1000 + Math.random() * 9000));
  const p4 = String(Math.floor(1000 + Math.random() * 9000));
  return `${p1}-${p2}-${p3}-${p4}`;
}

module.exports = {
  extractAbhaDigits,
  formatAbhaNumber,
  validateAbhaNumber,
  buildAbhaSearchQuery,
  generateRandom14DigitAbha,
};
