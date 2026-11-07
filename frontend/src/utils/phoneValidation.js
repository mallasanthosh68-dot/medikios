/**
 * Strict Indian Mobile Number and Email Validation Utilities
 */

/**
 * Validates genuine 10-digit Indian mobile numbers starting with 6, 7, 8, or 9
 * and rejects repetitive fake numbers (like all zeros or all nines) and common dummy test sequences.
 *
 * @param {string} phone - Raw input string
 * @returns {{ isValid: boolean, message: string, normalizedPhone: string }}
 */
export const validateIndianPhoneNumber = (phone) => {
  if (!phone || !String(phone).trim()) {
    return {
      isValid: false,
      message: 'Mobile number is required.',
      normalizedPhone: '',
    };
  }

  // Strip spaces, dashes, parentheses, leading '+91' or '0'
  let cleaned = String(phone).trim().replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // 1. Must be exactly 10 digits
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      message: `Mobile number must be exactly 10 digits (currently ${cleaned.length} digits).`,
      normalizedPhone: cleaned,
    };
  }

  // 2. Must start strictly with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      message: 'Invalid mobile number. Indian mobile numbers must start with 6, 7, 8, or 9.',
      normalizedPhone: cleaned,
    };
  }

  // 3. Reject obviously fake repetitive entries (e.g. all 0s, all 9s, all 8s, etc.)
  const repetitiveRegex = /^(\d)\1{9}$/;
  if (repetitiveRegex.test(cleaned)) {
    return {
      isValid: false,
      message: 'Fake or repetitive mobile numbers (e.g., all identical digits) are not accepted.',
      normalizedPhone: cleaned,
    };
  }

  // 4. Reject common dummy or test sequences
  const dummySequences = [
    '9876543210',
    '9876543211',
    '9123456789',
    '9000000000',
    '8000000000',
    '7000000000',
    '6000000000',
    '9898989898',
    '9191919191',
    '9090909090',
  ];
  if (dummySequences.includes(cleaned)) {
    return {
      isValid: false,
      message: 'This mobile number is a known test/dummy sequence. Please enter your genuine mobile number.',
      normalizedPhone: cleaned,
    };
  }

  return {
    isValid: true,
    message: 'Valid Indian mobile number.',
    normalizedPhone: cleaned,
  };
};

/**
 * Validates email address format
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email || !String(email).trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
};

/**
 * Validates a login identifier (Phone Number, Email, or for doctors: License Number / Doctor Name)
 * @param {string} input
 * @param {'doctor' | 'admin' | 'patient'} role
 * @returns {{ isValid: boolean, type: 'email' | 'phone' | 'license_or_name', message: string, normalizedValue: string }}
 */
export const validateLoginIdentifier = (input, role = 'doctor') => {
  const trimmed = String(input || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      type: 'phone',
      message: role === 'doctor'
        ? 'Please enter your Mobile Number, License Number, Doctor Name, or Email.'
        : 'Please enter your email address.',
      normalizedValue: '',
    };
  }

  // 1. Email format check
  if (trimmed.includes('@')) {
    const isOk = validateEmail(trimmed);
    return {
      isValid: isOk,
      type: 'email',
      message: isOk ? 'Valid email format.' : 'Please enter a valid email address (e.g. user@example.com).',
      normalizedValue: trimmed.toLowerCase(),
    };
  }

  // 2. Phone number format check (supports +91 or leading 0)
  let cleaned = trimmed.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return {
      isValid: true,
      type: 'phone',
      message: 'Valid 10-digit Indian mobile number.',
      normalizedValue: cleaned,
    };
  }

  // 3. For doctor role, allow license numbers (e.g. MCK-12345, MCI-12345) or Doctor Names (>= 2 characters)
  if (role === 'doctor' && trimmed.length >= 2) {
    // If purely digits but not 10 digits, alert patient/doctor
    if (/^\d+$/.test(trimmed) && trimmed.length !== 10) {
      return {
        isValid: false,
        type: 'phone',
        message: `Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9 (currently ${trimmed.length} digits).`,
        normalizedValue: trimmed,
      };
    }
    return {
      isValid: true,
      type: 'license_or_name',
      message: 'Valid doctor identifier (License Number / Doctor Name).',
      normalizedValue: trimmed,
    };
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      type: 'phone',
      message: `Mobile number must be exactly 10 digits (currently ${cleaned.length} digits).`,
      normalizedValue: cleaned,
    };
  }

  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      type: 'phone',
      message: 'Invalid mobile number. Indian mobile numbers must start with 6, 7, 8, or 9.',
      normalizedValue: cleaned,
    };
  }

  return {
    isValid: true,
    type: 'phone',
    message: 'Valid 10-digit Indian mobile number.',
    normalizedValue: cleaned,
  };
};
