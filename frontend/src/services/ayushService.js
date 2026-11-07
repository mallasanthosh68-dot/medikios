import { api } from './api';

/**
 * Start an AYUSH Case-Taking Session
 */
export const startAyushCase = async ({
  language = 'en',
  communicationMode = 'voice',
  consentStatus = true,
}) => {
  return await api.post('/ayush/case/start', {
    language,
    communicationMode,
    consentStatus,
  });
};

/**
 * Submit an answer in the AYUSH adaptive interview
 */
export const sendAyushAnswer = async (caseId, {
  question,
  answer,
  inputMode = 'text',
  groqApiKey,
}) => {
  const effectiveKey = groqApiKey || localStorage.getItem('medikiosk_groq_api_key') || undefined;
  return await api.post(`/ayush/case/${caseId}/answer`, {
    question,
    answer,
    inputMode,
    groqApiKey: effectiveKey,
  });
};

/**
 * Run safety / red-flag check
 */
export const checkAyushRedFlag = async (caseId, text, language = 'en') => {
  return await api.post(`/ayush/case/${caseId}/red-flag`, {
    text,
    language,
  });
};

/**
 * Upload a medical document for validation and OCR
 */
export const uploadAyushDocument = async (caseId, formData) => {
  return await api.uploadFile(`/ayush/case/${caseId}/upload`, formData);
};

/**
 * Run/update OCR on uploaded document
 */
export const runAyushOcr = async (caseId, documentId, corrections) => {
  return await api.post(`/ayush/case/${caseId}/ocr`, {
    documentId,
    corrections,
  });
};

/**
 * Get full AYUSH case data
 */
export const getAyushCase = async (caseId) => {
  return await api.get(`/ayush/case/${caseId}`);
};

/**
 * Generate complete AYUSH health summary across 12 structured sections
 */
export const generateAyushSummary = async (caseId, attachedReports = [], patientCorrections = {}, patientDetails = {}) => {
  return await api.post(`/ayush/case/${caseId}/summary`, {
    attachedReports,
    patientCorrections,
    patientDetails,
  });
};

/**
 * Fast lookup for returning patient by phone number
 */
export const lookupPatientByPhone = async (phoneNumber) => {
  try {
    return await api.post('/ayush/lookup-patient', { phoneNumber });
  } catch (err) {
    return { success: false, exists: false, message: err.message };
  }
};

/**
 * Fast lookup for returning patient by ABHA ID
 */
export const lookupPatientByAbha = async (abhaId) => {
  try {
    return await api.post('/ayush/lookup-patient', { abhaId });
  } catch (err) {
    return { success: false, exists: false, message: err.message };
  }
};

/**
 * Patient confirms health summary before physician review
 */
export const patientConfirmAyushCase = async (caseId, data = {}) => {
  return await api.post(`/ayush/case/${caseId}/patient-confirm`, data);
};

/**
 * Doctor views complete AYUSH case across 16 sections
 */
export const getDoctorAyushCase = async (caseId) => {
  return await api.get(`/doctor/ayush/cases/${caseId}`);
};

/**
 * Doctor reviews, adds clinical notes, edits, and confirms case
 */
export const updateDoctorAyushCase = async (caseId, {
  clinicalNotes,
  doctorEdits,
  corrections,
  action,
}) => {
  return await api.put(`/doctor/ayush/cases/${caseId}`, {
    clinicalNotes,
    doctorEdits,
    corrections,
    action,
  });
};
