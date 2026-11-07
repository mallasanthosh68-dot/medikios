/**
 * ABDM 14-Digit ABHA Number Formatting & Validation Utilities
 */

/**
 * Strips all non-digit characters from the input
 * @param {string} raw 
 * @returns {string} digits only
 */
export const extractAbhaDigits = (raw) => {
  return String(raw || '').replace(/\D/g, '');
};

/**
 * Formats up to 14 numeric digits into standard ABDM format: XX-XXXX-XXXX-XXXX
 * @param {string} raw 
 * @returns {string} formatted ABHA number
 */
export const formatAbhaNumber = (raw) => {
  const digits = extractAbhaDigits(raw).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
};

/**
 * Validates whether the given string is a valid 14-digit ABHA number
 * @param {string} raw 
 * @returns {{ isValid: boolean, digits: string, formatted: string, message: string }}
 */
export const validateAbhaNumber = (raw) => {
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
      message: `ABHA number must be exactly 14 digits (${digits.length}/14 entered). Format: XX-XXXX-XXXX-XXXX`,
    };
  }

  // Reject repeated identical digits
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
};

/**
 * Generates a random valid 14-digit ABHA number (e.g. 91-8472-9102-4821)
 * @returns {string} formatted ABHA number
 */
export const generateRandom14DigitAbha = () => {
  const p1 = '91';
  const p2 = String(Math.floor(1000 + Math.random() * 9000));
  const p3 = String(Math.floor(1000 + Math.random() * 9000));
  const p4 = String(Math.floor(1000 + Math.random() * 9000));
  return `${p1}-${p2}-${p3}-${p4}`;
};
