import { api } from './api';

export const startInterview = async (language = 'en') => {
  return await api.post('/patients/interview/start', { language });
};

export const sendMessage = async (interviewId, message, question = 'Health concern') => {
  const groqApiKey = localStorage.getItem('medikiosk_groq_api_key') || undefined;
  return await api.post(`/patients/interview/${interviewId}/answer`, {
    question,
    answer: message,
    inputMode: 'text',
    groqApiKey,
  });
};

export const sendVoiceTranscript = async (interviewId, transcript, question = 'Health concern') => {
  const groqApiKey = localStorage.getItem('medikiosk_groq_api_key') || undefined;
  return await api.post(`/patients/interview/${interviewId}/answer`, {
    question,
    answer: transcript,
    inputMode: 'voice',
    groqApiKey,
  });
};

export const getInterview = async (interviewId) => {
  return await api.get(`/patients/interview/${interviewId}`);
};

export const completeInterview = async (interviewId) => {
  return await api.post(`/patients/interview/${interviewId}/complete`);
};

export const generateSummary = async (interviewId) => {
  const groqApiKey = localStorage.getItem('medikiosk_groq_api_key') || undefined;
  return await api.post(`/patients/interview/${interviewId}/summary`, { groqApiKey });
};

export const updateSummary = async (interviewId, data) => {
  return await api.put(`/patients/interview/${interviewId}/summary`, data);
};

export const confirmSummary = async (interviewId) => {
  return await api.post(`/patients/interview/${interviewId}/summary/confirm`);
};

export const attachReportToSummary = async (interviewIdOrSummaryId, formData) => {
  return await api.uploadFile(`/patients/summary/${interviewIdOrSummaryId}/attach-report`, formData);
};

export const removeReportFromSummary = async (interviewIdOrSummaryId, reportId) => {
  return await api.delete(`/patients/summary/${interviewIdOrSummaryId}/report/${reportId}`);
};

export const translatePatientSpeech = async (text, targetLanguage = 'en') => {
  if (!text || !targetLanguage || targetLanguage === 'en') return text;
  try {
    const groqApiKey = localStorage.getItem('medikiosk_groq_api_key') || undefined;
    const res = await api.post('/patients/translate', {
      text,
      targetLanguage,
      groqApiKey,
    });
    if (res?.success && res?.translatedText) {
      return res.translatedText;
    }
  } catch (err) {
    console.warn('[Translation] API translation fallback:', err?.message || err);
  }
  return text;
};

export const getGroqStatus = async () => {
  try {
    return await api.get('/patients/groq-status');
  } catch (err) {
    return { success: false, active: false };
  }
};

export const saveGroqApiKey = async (apiKey) => {
  return await api.post('/patients/groq-key', { apiKey });
};

export default {
  startInterview,
  sendMessage,
  sendVoiceTranscript,
  getInterview,
  completeInterview,
  generateSummary,
  updateSummary,
  confirmSummary,
  attachReportToSummary,
  removeReportFromSummary,
  translatePatientSpeech,
  getGroqStatus,
  saveGroqApiKey,
};
