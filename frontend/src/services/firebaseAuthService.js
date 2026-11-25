import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Standard Firebase Configuration loaded from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured with active keys
export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && (firebaseConfig.projectId || firebaseConfig.authDomain));
};

// Internal singletons
let app = null;
let auth = null;
let recaptchaVerifier = null;
let activeConfirmationResult = null;

/**
 * Get or initialize Firebase Auth safely
 */
export const getFirebaseAuth = () => {
  if (!auth && isFirebaseConfigured()) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
    } catch (err) {
      console.warn('[Firebase Init Warning]', err.message);
    }
  }
  return auth;
};

// Eager initialization if config is available
if (isFirebaseConfigured()) {
  getFirebaseAuth();
}

/**
 * Initialize or get invisible reCAPTCHA verifier for Phone Auth
 */
export const initRecaptchaVerifier = (containerId = 'recaptcha-container') => {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) return null;

  if (typeof document === 'undefined') return null;

  const containerElem = document.getElementById(containerId);
  if (!containerElem) {
    console.warn(`[reCAPTCHA Warning] DOM element #${containerId} not found.`);
    return null;
  }

  try {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(currentAuth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved silently by Google
        },
        'expired-callback': () => {
          console.warn('[reCAPTCHA Notice] Token expired, resetting verifier.');
          if (recaptchaVerifier) {
            try {
              recaptchaVerifier.clear();
            } catch (_) {}
            recaptchaVerifier = null;
          }
        },
      });
    }
    return recaptchaVerifier;
  } catch (err) {
    console.warn('[reCAPTCHA Init Error]', err.message);
    return null;
  }
};

/**
 * Send real Cellular SMS OTP via Google Firebase Phone Auth
 * (10,000 Free verifications/month, no Indian DLT block, offline GSM signal delivery)
 */
export const sendFirebaseOtp = async (clean10DigitPhone) => {
  const currentAuth = getFirebaseAuth();
  if (!isFirebaseConfigured() || !currentAuth) {
    throw new Error('Firebase credentials not yet configured in environment.');
  }

  const formattedPhone = `+91${clean10DigitPhone.replace(/\D/g, '').slice(-10)}`;
  const verifier = initRecaptchaVerifier('recaptcha-container');

  if (!verifier) {
    throw new Error('Unable to initialize Firebase reCAPTCHA verification container.');
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(currentAuth, formattedPhone, verifier);
    activeConfirmationResult = confirmationResult;

    return {
      success: true,
      message: `Cellular SMS OTP sent via Firebase directly to ${formattedPhone}`,
      phoneNumber: clean10DigitPhone,
      isFirebase: true,
    };
  } catch (err) {
    console.warn('[Firebase sendOtp Error]', err);
    // Reset verifier on error so subsequent attempt creates a fresh session
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_) {}
      recaptchaVerifier = null;
    }
    throw err;
  }
};

/**
 * Check if there is an active Firebase confirmation session
 */
export const hasActiveFirebaseOtpSession = () => {
  return !!activeConfirmationResult;
};

/**
 * Reset active confirmation session
 */
export const resetFirebaseOtpSession = () => {
  activeConfirmationResult = null;
};

/**
 * Verify OTP entered by patient using Firebase Confirmation Result
 */
export const verifyFirebaseOtp = async (sixDigitOtp) => {
  if (!activeConfirmationResult) {
    throw new Error('No active OTP session found. Please request a new OTP code.');
  }

  const credential = await activeConfirmationResult.confirm(String(sixDigitOtp).trim());
  activeConfirmationResult = null; // Reset once verified
  return {
    success: true,
    verified: true,
    user: credential.user,
  };
};

export { auth, app };
