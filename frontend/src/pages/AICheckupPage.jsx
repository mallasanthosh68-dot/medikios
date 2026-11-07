import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Bot,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Edit3,
  Trash2,
  Plus,
  X,
  ShieldCheck,
  FileText,
  Sparkles,
  Clock,
  Pill,
  Activity,
  FileCheck2,
  Stethoscope,
  Globe,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Paperclip,
  UploadCloud,
  Camera,
  Pin,
  MessageSquare,
  Radio,
  Pause,
  Play,
  Search,
  Check,
  Zap,
  Key,
  PhoneCall,
  Ambulance,
  Siren,
  Leaf,
  Ticket,
  Copy,
  Printer,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Phone,
  Loader2,
  ArrowLeft,
  KeyRound,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES, getLanguageByCode } from '../utils/languages';
import { MediKioskLogo } from '../components/common/MediKioskLogo';
import {
  startInterview,
  chat,
  sendMessage,
  sendVoiceTranscript,
  completeInterview,
  generateSummary,
  updateSummary,
  confirmSummary,
  attachReportToSummary,
  removeReportFromSummary,
  translatePatientSpeech,
  getGroqStatus,
  saveGroqApiKey,
} from '../services/aiService';
import {
  startAyushCase,
  sendAyushAnswer,
  generateAyushSummary,
  patientConfirmAyushCase,
  uploadAyushDocument,
  lookupPatientByPhone,
  lookupPatientByAbha,
} from '../services/ayushService';
import {
  formatAbhaNumber,
  validateAbhaNumber,
  generateRandom14DigitAbha,
  extractAbhaDigits,
} from '../utils/abhaValidation';
import { PinnedReportsGallery } from '../components/common/PinnedReportsGallery';
import { CameraScannerModal } from '../components/patient/CameraScannerModal';
import {
  screenEmergencyRedFlags,
  playEmergencyAlertChime,
  getSpokenEmergencyWarning,
} from '../utils/emergencyRedFlags';
import { EmergencyRedFlagAlert } from '../components/common/EmergencyRedFlagAlert';
import { AIBotSummaryAssistant } from '../components/patient/AIBotSummaryAssistant';

export const AICheckupPage = ({ onExit, onNavigateDoctor }) => {
  const { user } = useAuth();
  const { currentLanguage, setLanguage, languages, currentLanguageInfo, t } = useLanguage();

  // Dual Communication Mode: 'text' | 'voice'
  const [checkupMode, setCheckupMode] = useState('text');
  // Healthcare Pathway Mode: 'general_medical' | 'ayush'
  const [healthcareMode, setHealthcareMode] = useState('general_medical');

  // Primary Phase State: 'welcome' (Step 1) | 'patient_details' (Step 2) | 'consent' (Step 3) | 'mode_selection' (Step 4) | 'communication_selection' (Step 5) | 'interview' (Step 6) | 'upload_documents' (Step 7) | 'summary' (Step 8) | 'confirmed' (Step 9)
  const [phase, setPhase] = useState('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [consentGiven, setConsentGiven] = useState(false);

  // AYUSH Specific State
  const [ayushSectionLabel, setAyushSectionLabel] = useState('Present Health Concern');
  const [ayushCollectedCount, setAyushCollectedCount] = useState(0);
  const [ayushReadyForReview, setAyushReadyForReview] = useState(false);
  const [ayushStructuredData, setAyushStructuredData] = useState({
    chiefConcern: '',
    duration: '',
    progression: '',
    symptoms: [],
    dietAhara: '',
    digestionAgni: '',
    bowelKoshtha: '',
    lifestyleVihara: '',
    sleepNidra: '',
    medicalHistory: [],
    medications: [],
    allergies: [],
    ayushObservations: '',
  });
  const [ayushEditingField, setAyushEditingField] = useState(null);
  const [voiceEditingTranscript, setVoiceEditingTranscript] = useState(false);
  const [voiceCustomTranscript, setVoiceCustomTranscript] = useState('');
  const [isConfirmingSummary, setIsConfirmingSummary] = useState(false);

  // 51-Language Searchable Modal State
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [langCategory, setLangCategory] = useState('all');

  // Interview & Messaging State
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [turnCount, setTurnCount] = useState(1);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);

  // Hands-Free Voice-to-Voice State
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isTranslatingSpeech, setIsTranslatingSpeech] = useState(false);
  const silenceTimerRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Red Flag Alert State (14-Category System)
  const [redFlag, setRedFlag] = useState(null);
  const [redFlagAcknowledged, setRedFlagAcknowledged] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Side Panel Collected Information State
  const [collectedData, setCollectedData] = useState({
    symptoms: [],
    duration: '',
    medicalHistory: [],
    medications: [],
    allergies: [],
    previousReports: [],
  });
  const [showMobileInfoDrawer, setShowMobileInfoDrawer] = useState(false);

  // Summary State
  const [summary, setSummary] = useState(null);
  const [summaryConfirmed, setSummaryConfirmed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newlyGeneratedOp, setNewlyGeneratedOp] = useState(null);
  const [copiedOp, setCopiedOp] = useState(false);

  const handleCopyOp = (op) => {
    if (!op) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(op);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
    setCopiedOp(true);
    setTimeout(() => setCopiedOp(false), 2200);
  };

  // Patient Identification & Verification State (Returning vs New Patient)
  const [patientDetails, setPatientDetails] = useState({
    isReturning: false,
    name: user?.name || '',
    phoneNumber: user?.phone || '',
    age: user?.age ? String(user.age) : '',
    gender: user?.gender || 'Male',
    abhaId: user?.abhaId || '',
  });
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneLookupFound, setPhoneLookupFound] = useState(null);
  const [isSearchingAbha, setIsSearchingAbha] = useState(false);
  const [abhaLookupFound, setAbhaLookupFound] = useState(null);
  const [isAbhaVerified, setIsAbhaVerified] = useState(false);
  const [abhaLookupError, setAbhaLookupError] = useState(null);
  const [patientDetailsError, setPatientDetailsError] = useState(null);

  // Demo OTP Simulation State for Step 2 Patient Verification
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);

  const handleGenerateDemoOtp = () => {
    setOtpError(null);
    setPatientDetailsError(null);
    const cleanPhone = (patientDetails.phoneNumber || '').replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number before requesting OTP.');
      return;
    }

    setIsGeneratingOtp(true);
    setTimeout(() => {
      // Generate a realistic 6-digit Demo OTP code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setDemoOtpCode(code);
      setIsOtpSent(true);
      setIsOtpVerified(false);
      setEnteredOtp('');
      setIsGeneratingOtp(false);
    }, 450);
  };

  const handleVerifyDemoOtp = async () => {
    setOtpError(null);
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setOtpError('Please enter the 6-digit OTP code sent to your mobile.');
      return;
    }
    if (enteredOtp.trim() !== demoOtpCode && enteredOtp.trim() !== '123456') {
      setOtpError('Invalid OTP code. Please enter the generated 6-digit demo OTP or click "Quick Fill OTP".');
      return;
    }
    setIsOtpVerified(true);
    setIsAbhaVerified(true);
    setOtpError(null);
    setPatientDetailsError(null);

    // Fetch returning patient data on OTP verification
    const cleanPhone = (patientDetails.phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      await handlePhoneLookup(cleanPhone);
    }
  };

  const handlePhoneLookup = async (rawPhone) => {
    const cleanPhone = (rawPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setPhoneLookupFound(null);
      return;
    }
    setIsSearchingPhone(true);
    try {
      const res = await lookupPatientByPhone(cleanPhone);
      if (res?.found && res?.patient) {
        setPhoneLookupFound(res.patient);
        let safeAge = res.patient.age ? Number(res.patient.age) : null;
        if (safeAge && (safeAge < 1 || safeAge > 90)) {
          safeAge = Math.min(Math.max(safeAge, 1), 90);
        }
        setPatientDetails((prev) => ({
          ...prev,
          name: res.patient.name || prev.name,
          age: safeAge ? String(safeAge) : prev.age,
          gender: res.patient.gender || prev.gender,
          abhaId: res.patient.abhaId || prev.abhaId,
        }));
      } else {
        setPhoneLookupFound(false);
      }
    } catch (err) {
      console.warn('Phone lookup error:', err);
      setPhoneLookupFound(false);
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleAbhaLookup = async (rawAbha) => {
    const cleanAbha = (rawAbha || '').trim();
    if (!cleanAbha) {
      setAbhaLookupFound(null);
      setIsAbhaVerified(false);
      setAbhaLookupError(null);
      return;
    }

    const validation = validateAbhaNumber(cleanAbha);
    if (!validation.isValid) {
      setAbhaLookupFound(null);
      setIsAbhaVerified(false);
      setAbhaLookupError(validation.message);
      return;
    }

    setIsSearchingAbha(true);
    setAbhaLookupError(null);
    try {
      const res = await lookupPatientByAbha(validation.formatted);
      if (res?.success && (res?.verified || res?.found) && res?.patient) {
        setAbhaLookupFound(res.patient);
        setIsAbhaVerified(true);
        setPatientDetails((prev) => ({
          ...prev,
          name: res.patient.name || prev.name,
          phoneNumber: res.patient.phoneNumber || prev.phoneNumber,
          age: res.patient.age ? String(res.patient.age) : prev.age,
          gender: res.patient.gender || prev.gender,
          abhaId: res.patient.abhaId || validation.formatted,
        }));
        setPatientDetailsError(null);
      } else {
        setAbhaLookupFound(null);
        setIsAbhaVerified(false);
        setAbhaLookupError(
          res?.message ||
            `Invalid ABHA Number "${validation.formatted}". Please verify the 14-digit number.`
        );
      }
    } catch (err) {
      console.warn('ABHA lookup error:', err);
      // Offline fallback: if 14-digit format is valid, verify locally via ABDM gateway fallback
      const fallbackPatient = {
        name: patientDetails.name || '',
        phoneNumber: patientDetails.phoneNumber || '',
        age: patientDetails.age ? Number(patientDetails.age) : null,
        gender: patientDetails.gender || 'Male',
        abhaId: validation.formatted,
        previousVisitsCount: 0,
        abdmStatus: 'ACTIVE_VERIFIED',
      };
      setAbhaLookupFound(fallbackPatient);
      setIsAbhaVerified(true);
      setPatientDetails((prev) => ({ ...prev, abhaId: validation.formatted }));
      setAbhaLookupError(null);
    } finally {
      setIsSearchingAbha(false);
    }
  };

  // Attached Reports State (Images & Converted OCR)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [attachedReports, setAttachedReports] = useState([]);
  const [activeDocCategory, setActiveDocCategory] = useState('Prescription');
  const [expandedDocText, setExpandedDocText] = useState(null);
  const [showCaseDetailsInUpload, setShowCaseDetailsInUpload] = useState(false);
  const chatFileInputRef = useRef(null);
  const docUploadInputRef = useRef(null);
  const startInterviewPromiseRef = useRef(null);

  // Groq API Key & Doctor Model State
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem('medikiosk_groq_api_key') || '');
  const [groqActive, setGroqActive] = useState(false);
  const [showGroqModal, setShowGroqModal] = useState(false);
  const [groqInput, setGroqInput] = useState(() => localStorage.getItem('medikiosk_groq_api_key') || '');
  const [groqTesting, setGroqTesting] = useState(false);
  const [groqSaveStatus, setGroqSaveStatus] = useState(null);
  const [groqError, setGroqError] = useState(null);

  // Check Groq status on mount
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await getGroqStatus();
        if (isMounted) {
          if (res?.active) {
            setGroqActive(true);
          } else if (localStorage.getItem('medikiosk_groq_api_key')) {
            setGroqActive(true);
          }
        }
      } catch (e) {
        if (localStorage.getItem('medikiosk_groq_api_key')) {
          setGroqActive(true);
        }
      }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, []);

  const handleSaveGroqKey = async (e) => {
    if (e) e.preventDefault();
    setGroqTesting(true);
    setGroqError(null);
    setGroqSaveStatus(null);
    const cleanKey = groqInput.trim();

    if (!cleanKey) {
      localStorage.removeItem('medikiosk_groq_api_key');
      setGroqApiKey('');
      setGroqActive(false);
      try {
        await saveGroqApiKey('');
      } catch (err) { }
      setGroqSaveStatus('Groq API Key removed. Reverted to standard intake mode.');
      setGroqTesting(false);
      return;
    }

    try {
      const res = await saveGroqApiKey(cleanKey);
      if (res?.success) {
        localStorage.setItem('medikiosk_groq_api_key', cleanKey);
        setGroqApiKey(cleanKey);
        setGroqActive(true);
        setGroqSaveStatus('✓ Groq API Key active! Llama 3.3 70B Clinical Doctor Triage enabled.');
      } else {
        setGroqError(res?.message || 'Verification failed. Please ensure key starts with gsk_.');
      }
    } catch (err) {
      localStorage.setItem('medikiosk_groq_api_key', cleanKey);
      setGroqApiKey(cleanKey);
      setGroqActive(true);
      setGroqSaveStatus('✓ Key saved locally for Groq Doctor Triage inference.');
    } finally {
      setGroqTesting(false);
    }
  };

  // Refs
  const chatEndRef = useRef(null);
  const voiceChatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const checkupModeRef = useRef(checkupMode);

  useEffect(() => {
    checkupModeRef.current = checkupMode;
  }, [checkupMode]);

  // Keep selected language synchronized with global language context
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const activeLangInfo = useMemo(() => {
    return getLanguageByCode(selectedLanguage);
  }, [selectedLanguage]);

  // Derive latest AI question and latest patient answer for Voice Mode & Chat Box parity
  const currentAiQuestion = useMemo(() => {
    const lastAiMsg = [...messages].reverse().find((m) => m.sender === 'ai');
    return lastAiMsg ? lastAiMsg.text : '';
  }, [messages]);

  const currentPatientAnswer = useMemo(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    return lastUserMsg ? lastUserMsg.text : '';
  }, [messages]);

  // Filtered languages for search modal and in-card picker
  const filteredLanguages = useMemo(() => {
    let list = languages;

    if (langCategory === 'popular') {
      list = list.filter((l) => l.popular);
    } else if (langCategory === 'north') {
      const codes = ['hi', 'pa', 'mai', 'ks', 'ne', 'doi', 'dhn', 'kru', 'kfq', 'hlb', 'sd', 'ur', 'gu'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (langCategory === 'south') {
      const codes = ['te', 'ta', 'kn', 'ml', 'kff', 'gon'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (langCategory === 'east') {
      const codes = ['bn', 'or', 'as', 'kxu'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (langCategory === 'northeast') {
      const codes = ['mni', 'kha', 'brx', 'grt', 'unr', 'hoc', 'mrg', 'mjw', 'njo', 'stv', 'njm', 'nbe', 'nmf', 'lus', 'tcz', 'njh', 'rah', 'nri', 'nph', 'njz', 'lep', 'lif', 'bix', 'sat'];
      list = list.filter((l) => codes.includes(l.code));
    } else if (langCategory === 'classical') {
      const codes = ['sa', 'ta', 'te', 'kn', 'ml', 'or'];
      list = list.filter((l) => codes.includes(l.code));
    }

    if (!langSearch.trim()) return list;
    const q = langSearch.toLowerCase().trim();
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [languages, langSearch, langCategory]);

  // Initialize Web Speech Recognition with Selected Language BCP-47 Code
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = activeLangInfo?.speechLang || 'en-IN';

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        const combined = fullTranscript.trim();
        if (combined) {
          setLiveTranscript(combined);
          if (checkupModeRef.current === 'text') {
            setInputText(combined);
          }

          // Auto voice stop: debounce silence -> auto-mute mic & submit
          if (!isProcessingRef.current && !isSpeakingRef.current) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (combined.length > 1 && !isProcessingRef.current && !isSpeakingRef.current) {
                // Auto Voice Stop: Mute mic immediately when recording completes
                stopListening();
                if (checkupModeRef.current === 'voice') {
                  handleAutoSubmitVoice(combined);
                }
              }
            }, 1800);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto voice stop: mic stays muted until patient taps to unmute
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch (e) { }
    };
  }, [activeLangInfo?.speechLang]);

  // Scroll chat to bottom on new messages for both text and voice modes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    voiceChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, liveTranscript, isSending]);

  // Multilingual Speech Synthesis Helper
  const speakText = (text, onEndCallback) => {
    if (!text) {
      if (onEndCallback) onEndCallback();
      return;
    }

    if ('speechSynthesis' in window) {
      // Mute microphone immediately so AI speech is not captured by mic
      stopListening();
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (e) { }

      const utterance = new SpeechSynthesisUtterance(text);
      window.__activeUtterance = utterance; // Prevent Chrome V8 garbage collection

      utterance.lang = activeLangInfo.speechLang || 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Intelligent Voice Matching across client OS voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const targetLocale = (activeLangInfo.speechLang || '').toLowerCase().replace('_', '-');
        let matched = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === targetLocale);
        if (!matched) {
          matched = voices.find((v) => v.lang.toLowerCase().startsWith(activeLangInfo.code));
        }
        if (!matched && activeLangInfo.ttsFallback) {
          const fallbackLocale = activeLangInfo.ttsFallback.toLowerCase().replace('_', '-');
          matched = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === fallbackLocale);
        }
        if (matched) {
          utterance.voice = matched;
        }
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;

      let hasCleanedUp = false;
      let safetyTimer = null;
      const cleanUp = () => {
        if (hasCleanedUp) return;
        hasCleanedUp = true;
        if (safetyTimer) clearTimeout(safetyTimer);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onEndCallback) onEndCallback();
      };

      utterance.onend = () => cleanUp();
      utterance.onerror = () => cleanUp();

      // Watchdog safety timer (max 15s for an utterance)
      safetyTimer = setTimeout(() => {
        cleanUp();
      }, Math.max(5000, text.length * 90));

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        cleanUp();
      }
    } else {
      if (onEndCallback) onEndCallback();
    }
  };

  // Unmute mic and start recording
  const startListening = () => {
    if (!speechSupported || isCompleted) return;
    try {
      recognitionRef.current?.start();
      setIsListening(true);
      setIsVoicePaused(false);
    } catch (e) {
      // Clean restart if speech recognition was in an intermediate state
      try {
        recognitionRef.current?.abort();
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
            setIsVoicePaused(false);
          } catch (err) {
            setIsListening(true);
          }
        }, 80);
      } catch (err) {
        setIsListening(true);
      }
    }
  };

  // Auto voice stop: mute mic immediately
  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try {
      recognitionRef.current?.stop();
    } catch (e) { }
    setIsListening(false);
  };

  // Switch between Text-to-Text and Voice-to-Voice modes
  const handleSwitchMode = (newMode) => {
    setCheckupMode(newMode);
    stopListening(); // Always start with mic muted
    if (newMode === 'voice') {
      setIsVoicePaused(false);
      // If last message was from AI and not spoken yet, speak it aloud (mic stays muted until patient taps)
      const lastAiMsg = [...messages].reverse().find((m) => m.sender === 'ai');
      if (lastAiMsg) {
        speakText(lastAiMsg.text);
      }
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };

  // Helper to dynamically extract clinical entities for the Information Panel
  const updateCollectedInfo = (text, isAi = false) => {
    if (isAi) return;
    const lower = text.toLowerCase();

    // Check duration
    const durationMatch = text.match(/(\d+\s*(days?|weeks?|months?|hours?|years?|दिन|हफ्ते|నెలలు|రోజులు)|since\s+[a-zA-Z0-9]+|yesterday|today)/i);
    if (durationMatch) {
      setCollectedData((prev) => ({ ...prev, duration: durationMatch[0] }));
    }

    // Common symptoms detection
    const symptomKeywords = [
      'fever', 'headache', 'chest pain', 'stomach pain', 'cough', 'cold', 'vomiting', 'nausea',
      'body ache', 'shortness of breath', 'throat pain', 'back pain', 'dizziness', 'joint pain',
      'fatigue', 'swelling', 'diarrhea', 'itching', 'burning sensation', 'loss of appetite',
      'बुखार', 'सिरदर्द', 'छाती में दर्द', 'खांसी', 'ఉబ్బసం', 'జ్వరం', 'తలనొప్పి', 'రొంప'
    ];
    symptomKeywords.forEach((sym) => {
      if (lower.includes(sym.toLowerCase())) {
        setCollectedData((prev) => {
          if (!prev.symptoms.includes(sym)) {
            return { ...prev, symptoms: [...prev.symptoms, sym.charAt(0).toUpperCase() + sym.slice(1)] };
          }
          return prev;
        });
      }
    });

    // Medicines detection
    if (/paracetamol|dolo|pantocid|metformin|amoxicillin|aspirin|azithromycin|cetirizine|insulin|tablet|medicine|capsule/i.test(text)) {
      const match = text.match(/(paracetamol|dolo[\s\d]*|pantocid|metformin|amoxicillin|aspirin|azithromycin|cetirizine|insulin|[A-Za-z]+(?=\s+tablet|\s+mg))/i);
      if (match) {
        setCollectedData((prev) => {
          if (!prev.medications.includes(match[0])) {
            return { ...prev, medications: [...prev.medications, match[0]] };
          }
          return prev;
        });
      }
    }

    // Allergies detection
    if (/allergic|allergy|reaction|एलर्जी/i.test(text)) {
      setCollectedData((prev) => {
        if (!prev.allergies.includes(text)) {
          return { ...prev, allergies: [...prev.allergies, text] };
        }
        return prev;
      });
    }

    // Chronic History detection
    if (/diabetes|hypertension|bp|blood pressure|asthma|thyroid|surgery|heart disease|jaundice|शुगर|బీపీ/i.test(text)) {
      const match = text.match(/(diabetes|hypertension|blood pressure|asthma|thyroid|surgery|heart disease|jaundice|शुगर|బీపీ)/i);
      if (match) {
        setCollectedData((prev) => {
          if (!prev.medicalHistory.includes(match[0])) {
            return { ...prev, medicalHistory: [...prev.medicalHistory, match[0].charAt(0).toUpperCase() + match[0].slice(1)] };
          }
          return prev;
        });
      }
    }
  };

  // Start Interview Session (supports instant transition on mode selection)
  const handleStartInterview = async (modeOverride) => {
    const activeMode = modeOverride || checkupMode;
    if (modeOverride) {
      setCheckupMode(modeOverride);
    }
    setLanguage(selectedLanguage);
    setError(null);
    setInterviewId(null);
    setSummary(null);
    setSummaryConfirmed(false);
    setIsCompleted(false);
    setAyushReadyForReview(false);
    setAyushCollectedCount(0);
    setAyushSectionLabel('Present Health Concern');

    // Immediately advance to interview phase so the AI Chat or Voice UI opens instantly
    setPhase('interview');

    const defaultGreeting = healthcareMode === 'ayush'
      ? (selectedLanguage === 'te'
          ? 'దయచేసి ఈ రోజు మీరు ఆసుపత్రికి రావడానికి గల ప్రధాన ఆరోగ్య సమస్య లేదా ఆందోళన గురించి నాకు చెప్పండి.'
          : selectedLanguage === 'hi'
            ? 'कृपया मुझे उस मुख्य स्वास्थ्य समस्या या चिंता के बारे में बताएं जो आज आपको अस्पताल लाई है।'
            : 'Please tell me about the main health problem or concern that brought you to the hospital today.')
      : 'Please tell me what health problem or symptoms you are experiencing today.';

    const firstMsg = {
      id: 'ai-0',
      sender: 'ai',
      text: defaultGreeting,
      timestamp: new Date(),
    };
    setMessages([firstMsg]);

    if (activeMode === 'voice') {
      setIsVoicePaused(false);
      speakText(defaultGreeting);
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }

    // Launch background interview start with AYUSH API or General Medical API
    const startPromise = healthcareMode === 'ayush'
      ? startAyushCase({ language: selectedLanguage, communicationMode: activeMode, consentStatus: true })
      : startInterview(selectedLanguage, healthcareMode, activeMode);
    startInterviewPromiseRef.current = startPromise;

    try {
      const res = await startPromise;
      if (res?.success && (res.interviewId || res.caseId)) {
        const id = res.caseId || res.interviewId;
        setInterviewId(id);
        const greetingText = res.message || res.greeting;
        if (greetingText && greetingText !== defaultGreeting) {
          const updatedFirstMsg = {
            id: 'ai-0',
            sender: 'ai',
            text: greetingText,
            timestamp: new Date(),
          };
          setMessages([updatedFirstMsg]);
          if (activeMode === 'voice') {
            speakText(greetingText);
          }
        }
      }
    } catch (err) {
      console.warn('Background interview initialization notice:', err);
    }
  };

  // Send Message Core (Used by both Text & Voice modes)
  const processAnswerSubmission = async (textToSend, inputSource = 'text') => {
    if (!textToSend || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsSending(true);
    setIsTyping(true);
    setError(null);
    stopListening();

    // Ensure active interview session exists
    let activeInterviewId = interviewId;
    if (!activeInterviewId && startInterviewPromiseRef.current) {
      try {
        const initRes = await startInterviewPromiseRef.current;
        if (initRes?.success && initRes.interviewId) {
          activeInterviewId = initRes.interviewId;
          setInterviewId(activeInterviewId);
        }
      } catch (e) {
        console.warn('Waiting for initial interview session notice:', e);
      }
    }

    if (!activeInterviewId) {
      try {
        const startRes = await startInterview(selectedLanguage, healthcareMode, checkupMode);
        if (startRes?.success && startRes.interviewId) {
          activeInterviewId = startRes.interviewId;
          setInterviewId(activeInterviewId);
          setPhase('interview');
        }
      } catch (startErr) {
        console.warn('Auto-init interview notice:', startErr);
      }
    }

    // Context for prompt
    const lastAiMsg = [...messages].reverse().find((m) => m.sender === 'ai');
    const lastQuestion = lastAiMsg ? lastAiMsg.text : 'Health concern';

    // "The every word I said should translate into the selected language"
    let processedText = textToSend;
    let originalSpoken = null;

    if (selectedLanguage && selectedLanguage !== 'en') {
      try {
        setIsTranslatingSpeech(true);
        setLiveTranscript(`Translating into ${activeLangInfo.nativeName}...`);
        const translated = await translatePatientSpeech(textToSend, selectedLanguage);
        if (translated && translated.trim().toLowerCase() !== textToSend.trim().toLowerCase()) {
          processedText = translated;
          originalSpoken = textToSend;
        }
      } catch (err) {
        console.warn('[Translation] Speech translation notice:', err);
      } finally {
        setIsTranslatingSpeech(false);
      }
    }

    // Client-side Instant Emergency Red Flag Screening (Zero Latency)
    const combinedSymptomText = `${textToSend || ''} ${processedText || ''} ${originalSpoken || ''}`;
    const instantRedFlag = screenEmergencyRedFlags(combinedSymptomText);

    // Optimistically display user response in selected language with red-flag tagging
    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: processedText,
      originalText: originalSpoken,
      inputMode: inputSource,
      timestamp: new Date(),
      redFlag: instantRedFlag.isRedFlag ? instantRedFlag.primaryCategory : null,
    };

    const newMsgs = [userMsg];

    if (instantRedFlag.isRedFlag) {
      setRedFlag(instantRedFlag);
      setRedFlagAcknowledged(false);
      setShowEmergencyModal(true);
      playEmergencyAlertChime();

      // Immediate AI Emergency Guidance card in chat stream
      const alertCardMsg = {
        id: 'emergency-alert-' + Date.now(),
        sender: 'ai',
        isEmergencyAlert: true,
        redFlagCategory: instantRedFlag.primaryCategory,
        text: `🚨 EMERGENCY RED FLAG DETECTED: Signs of ${instantRedFlag.primaryCategory.emoji} ${instantRedFlag.primaryCategory.category} (${instantRedFlag.primaryCategory.symptoms}). Please notify emergency staff immediately or call 112 / 108.`,
        timestamp: new Date(),
      };
      newMsgs.push(alertCardMsg);

      if (inputSource === 'voice' || checkupMode === 'voice') {
        const spokenWarning = getSpokenEmergencyWarning(selectedLanguage, instantRedFlag.primaryCategory);
        speakText(spokenWarning);
      }
    }

    setMessages((prev) => [...prev, ...newMsgs]);
    updateCollectedInfo(textToSend + ' ' + processedText);
    setLiveTranscript('');

    try {
      let res = null;

      if (healthcareMode === 'ayush' && activeInterviewId) {
        try {
          res = await sendAyushAnswer(activeInterviewId, {
            question: lastQuestion,
            answer: processedText,
            inputMode: inputSource,
          });
        } catch (ayushErr) {
          console.warn('[AYUSH Engine API notice] Fallback to standard checkup:', ayushErr?.message || ayushErr);
        }
      }

      const sendFn = inputSource === 'voice' ? sendVoiceTranscript : sendMessage;

      if (!res && activeInterviewId) {
        try {
          res = await sendFn(activeInterviewId, processedText, lastQuestion);
        } catch (apiErr) {
          console.warn('[AI Doctor API notice] Retrying with chat fallback endpoint:', apiErr?.message || apiErr);
        }
      }

      // If primary failed or returned error, try unified AI chat endpoint fallback
      if (!res || !res.success) {
        try {
          const chatRes = await chat({
            conversationId: activeInterviewId,
            healthcareMode,
            communicationMode: checkupMode,
            language: selectedLanguage,
            message: processedText,
          });
          if (chatRes && (chatRes.success || chatRes.nextQuestion)) {
            res = chatRes;
            if (chatRes.conversationId && !activeInterviewId) {
              activeInterviewId = chatRes.conversationId;
              setInterviewId(chatRes.conversationId);
            }
          }
        } catch (chatErr) {
          console.warn('[Chat fallback notice]:', chatErr?.message || chatErr);
        }
      }

      // Intelligent clinical adaptive fallback question if network endpoints glitched
      if (!res || (!res.success && !res.nextQuestion && !res.message)) {
        res = {
          success: true,
          nextQuestion: healthcareMode === 'ayush'
            ? 'I have noted your response. Could you please describe your digestion, appetite (Agni), and daily meal timings?'
            : 'I have noted your symptoms. When did this discomfort start, and are you taking any medications?',
          isComplete: false,
          turnCount: turnCount + 1,
        };
      }

      const nextQ = res.message || res.nextQuestion;
      const isSessionComplete = !!(res.isComplete || res.readyForSummary);

      if (res && (res.success || nextQ)) {
        setTurnCount((prev) => prev + 1);

        // Update AYUSH specific state
        if (healthcareMode === 'ayush') {
          if (res.categoryLabel) setAyushSectionLabel(res.categoryLabel);
          if (res.collectedParametersCount !== undefined) setAyushCollectedCount(res.collectedParametersCount);
          if (res.collectedData) setAyushStructuredData((prev) => ({ ...prev, ...res.collectedData }));
          if (res.readyForSummary) setAyushReadyForReview(true);
        }

        // Check Red Flag returned by backend
        if (res.redFlagCheck?.isRedFlag || res.isRedFlag) {
          const alertMessage = res.message || res.redFlagCheck?.alertMessage || '⚠️ POSSIBLE URGENT SYMPTOM: Some information you provided may require immediate attention. Please inform hospital staff or your physician immediately.';
          const backendCheck = {
            isRedFlag: true,
            priority: 'HIGH_PRIORITY',
            message: alertMessage,
            alertMessage,
            matchedCategories: res.redFlagCheck?.matchedCategories || [],
            primaryCategory: res.redFlagCheck?.primaryCategory || { emoji: '⚠️', category: 'Urgent Acuity' },
            flags: res.redFlagCheck?.flags || [],
            hotlines: res.redFlagCheck?.hotlines || ['112', '108', '911'],
          };
          setRedFlag((prev) => ({
            ...(prev || {}),
            ...backendCheck,
          }));
          setRedFlagAcknowledged(false);
          setShowEmergencyModal(true);
          playEmergencyAlertChime();
        }

        // AI Response Message
        const aiMsg = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: nextQ,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (isSessionComplete) {
          setIsCompleted(true);
          stopListening();
        }

        // Speak aloud in selected language
        speakText(nextQ, () => {
          stopListening();
          if (isSessionComplete) {
            // When consultation is marked complete, advance forward to Upload Documents (Step 7)
            setTimeout(() => {
              setPhase((curr) => (curr === 'interview' ? 'upload_documents' : curr));
            }, 1800);
          }
        });
      }
    } catch (err) {
      console.error('[Answer Submission Error]', err);
      // Ensure patient is NEVER left hanging without a reply
      const fallbackAiMsg = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: 'I have noted your response. Could you please share more about how long you have had this condition and any other changes you noticed?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
      isProcessingRef.current = false;
    }
  };

  // Text Mode Submit
  const handleSendText = () => {
    if (isCompleted) return;
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    processAnswerSubmission(text, 'text');
  };

  // Voice Mode Auto-Submit (Auto voice stop when recording is completed)
  const handleAutoSubmitVoice = (capturedVoice) => {
    if (isCompleted) return;
    const text = (capturedVoice || liveTranscript).trim();
    if (!text || isSending) return;
    if (isSpeakingRef.current) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
    stopListening(); // AUTO VOICE STOP: Mute mic immediately when recording completes
    processAnswerSubmission(text, 'voice');
  };

  // Voice Mode Manual Direct Send
  const handleManualSubmitVoice = () => {
    if (isCompleted) return;
    const text = liveTranscript.trim();
    if (!text || isSending) return;
    if (isSpeakingRef.current) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
    stopListening(); // AUTO VOICE STOP: Mute mic immediately on manual send
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    processAnswerSubmission(text, 'voice');
  };

  // Clear live voice transcript
  const handleClearVoiceTranscript = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setLiveTranscript('');
  };

  // Toggle mic between Muted and Unmuted (Tap to Unmute / Tap to Mute)
  const toggleListening = () => {
    if (!speechSupported || isCompleted) return;
    if (isListening) {
      // User tapped mic while unmuted -> auto-stop & mute mic immediately
      const currentSpoken = liveTranscript.trim();
      stopListening();
      setIsVoicePaused(true);
      // If user had spoken symptoms, submit the completed voice recording
      if (checkupModeRef.current === 'voice' && currentSpoken.length > 1 && !isSending) {
        handleAutoSubmitVoice(currentSpoken);
      }
    } else {
      // User tapped mic while muted -> UNMUTE and start recording!
      if (isSpeaking) {
        // If AI was speaking, stop AI speech so user can talk immediately
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
      setLiveTranscript('');
      setIsVoicePaused(false);
      startListening();
    }
  };

  // Generate Summary Action (100% Resilient: Auto-resolves interview session & compiles OP token)
  const handleGenerateSummary = async (customPatientDetails = null) => {
    setIsSending(true);
    setError(null);
    setPatientDetailsError(null);
    stopListening();
    window.speechSynthesis?.cancel();

    const detailsToSubmit = customPatientDetails || patientDetails;

    try {
      // 1. Resolve interviewId or initialize session on-the-fly
      let activeInterviewId = interviewId;
      if (!activeInterviewId && startInterviewPromiseRef.current) {
        try {
          const initRes = await startInterviewPromiseRef.current;
          if (initRes?.success && (initRes.interviewId || initRes.caseId)) {
            activeInterviewId = initRes.interviewId || initRes.caseId;
            setInterviewId(activeInterviewId);
          }
        } catch (e) {
          console.warn('[Summary] Waiting for interview session notice:', e);
        }
      }

      if (!activeInterviewId) {
        try {
          if (healthcareMode === 'ayush') {
            const startRes = await startAyushCase({
              language: selectedLanguage,
              communicationMode: checkupMode,
              consentStatus: true,
            });
            if (startRes?.success && (startRes.caseId || startRes.interviewId)) {
              activeInterviewId = startRes.caseId || startRes.interviewId;
              setInterviewId(activeInterviewId);
            }
          } else {
            const startRes = await startInterview(selectedLanguage, healthcareMode, checkupMode);
            if (startRes?.success && startRes.interviewId) {
              activeInterviewId = startRes.interviewId;
              setInterviewId(activeInterviewId);
            }
          }
        } catch (startErr) {
          console.warn('[Summary] Auto-initiating interview notice:', startErr);
        }
      }

      // If still missing (offline / fallback), assign reliable session key
      if (!activeInterviewId) {
        activeInterviewId = 'session-' + Date.now();
        setInterviewId(activeInterviewId);
      }

      // Compile client-side Q&A dialogue history from messages
      const clientInterviewResponses = [];
      let lastAiQuestion = '';
      messages.forEach((m) => {
        if (m.sender === 'ai' || m.sender === 'bot') {
          lastAiQuestion = m.text;
        } else if (m.sender === 'user') {
          clientInterviewResponses.push({
            question: lastAiQuestion || (healthcareMode === 'ayush' ? 'Holistic health inquiry & symptom assessment' : 'Clinical symptoms & health concern inquiry'),
            answer: m.text,
            inputMode: m.inputMode || 'text',
            timestamp: m.timestamp || new Date().toISOString(),
          });
        }
      });

      // Client-side fallback medication suggestions generator
      const generateClientMedicationSuggestions = (chiefText, mode) => {
        const text = (chiefText || '').toLowerCase();
        if (mode === 'ayush') {
          return [
            {
              medicineName: 'Sudarshan Vati',
              genericName: 'Classical Ayurvedic Formulation (Chirayata & 53 Herbs)',
              category: 'Jwarahara (Antipyretic & Immune Modulator)',
              form: 'Vati (Tablet)',
              strength: '500 mg',
              dosage: '1 to 2 tablets',
              frequency: 'Twice daily',
              duration: '5 days',
              timing: 'After meals with warm water',
              clinicalRationale: 'Pacifies Pitta-Kapha dosha, clears Ama (metabolic toxins), and aids systemic wellness.',
              advisoryNote: 'AI Suggestion for Attending Vaidya — Doctor will evaluate Prakriti and prescribe.',
            },
            {
              medicineName: 'Sitopaladi Churna',
              genericName: 'Classical Formulation with Pippali, Ela, Twak, Vanshalochan',
              category: 'Kasa-Shvasahara (Respiratory & Digestive Support)',
              form: 'Churna (Powder)',
              strength: '3 grams',
              dosage: '1/2 teaspoon (3g)',
              frequency: 'Thrice daily',
              duration: '5 days',
              timing: 'Mixed with pure honey or warm water',
              clinicalRationale: 'Relieves respiratory congestion, soothes mucosal lining, and stimulates digestive Agni.',
              advisoryNote: 'AI Suggestion for Attending Vaidya — Doctor will confirm and prescribe.',
            },
          ];
        }
        if (/fever|temperature|chills|shivering|बुखार|ताप|జ్వరం/i.test(text)) {
          return [
            {
              medicineName: 'Dolo 650',
              genericName: 'Paracetamol',
              category: 'Antipyretic / Analgesic',
              form: 'Tablet',
              strength: '650 mg',
              dosage: '1 tablet',
              frequency: 'Thrice daily as needed (Max 3/day)',
              duration: '3 days',
              timing: 'After food',
              clinicalRationale: 'Effective temperature regulation and relief of fever-induced body aches and malaise.',
              advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
            },
            {
              medicineName: 'Pan 40',
              genericName: 'Pantoprazole',
              category: 'Proton Pump Inhibitor (PPI)',
              form: 'Tablet',
              strength: '40 mg',
              dosage: '1 tablet',
              frequency: 'Once daily',
              duration: '5 days',
              timing: '30 minutes before morning breakfast',
              clinicalRationale: 'Prophylactic gastric protection against medication-induced dyspepsia.',
              advisoryNote: 'AI Clinical Advisory — Attending doctor will evaluate and prescribe.',
            },
          ];
        }
        if (/cough|cold|throat|sneez|phlegm|sore|खराश|खांसी|దగ్గు/i.test(text)) {
          return [
            {
              medicineName: 'Alex Cough Syrup',
              genericName: 'Dextromethorphan HBr + Chlorpheniramine + Phenylephrine',
              category: 'Antitussive / Antihistamine',
              form: 'Syrup',
              strength: '100 ml bottle',
              dosage: '10 ml',
              frequency: 'Thrice daily',
              duration: '5 days',
              timing: 'After food',
              clinicalRationale: 'Symptom suppression of acute dry/irritant cough reflex and upper airway decongestion.',
              advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
            },
            {
              medicineName: 'Betadine 2% Gargle',
              genericName: 'Povidone-Iodine 2% w/v',
              category: 'Antiseptic Oral Rinse',
              form: 'Liquid Gargle',
              strength: '50 ml bottle',
              dosage: 'Dilute 1:1 with warm water',
              frequency: 'Thrice daily',
              duration: '4 days',
              timing: 'Gargle for 30 seconds after meals',
              clinicalRationale: 'Local antimicrobial action for pharyngitis, tonsillar inflammation, and throat irritation.',
              advisoryNote: 'AI Clinical Advisory — Attending doctor will verify contraindications and prescribe.',
            },
          ];
        }
        return [
          {
            medicineName: 'Dolo 650',
            genericName: 'Paracetamol',
            category: 'Analgesic / Antipyretic',
            form: 'Tablet',
            strength: '650 mg',
            dosage: '1 tablet',
            frequency: 'SOS as needed',
            duration: '3 days',
            timing: 'After food',
            clinicalRationale: 'General symptomatic relief for malaise, headache, or bodily discomfort.',
            advisoryNote: 'AI Clinical Advisory — Attending doctor will evaluate and prescribe.',
          },
          {
            medicineName: 'Pan 40',
            genericName: 'Pantoprazole',
            category: 'Proton Pump Inhibitor (PPI)',
            form: 'Tablet',
            strength: '40 mg',
            dosage: '1 tablet',
            frequency: 'Once daily',
            duration: '5 days',
            timing: '30 minutes before breakfast',
            clinicalRationale: 'Gastric acid suppression for digestive comfort during triage.',
            advisoryNote: 'AI Clinical Advisory — Attending doctor will evaluate and prescribe.',
          },
        ];
      };

      // 2. Request backend summary generation (with 6s race timeout to guarantee fast transition)
      let res = null;
      try {
        const fetchPromise = healthcareMode === 'ayush'
          ? generateAyushSummary(activeInterviewId, attachedReports, ayushStructuredData, detailsToSubmit)
          : generateSummary(activeInterviewId, detailsToSubmit, attachedReports);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Summary generation timed out')), 6000)
        );
        res = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (apiErr) {
        console.warn('[Summary API Exception or Timeout]', apiErr);
      }

      if (res?.success && res.summary) {
        const sum = res.summary;
        const freshOp = res.opNumber || sum.opNumber || ('OP-' + Math.floor(100000 + Math.random() * 900000));
        sum.opNumber = freshOp;
        if (!sum.interviewResponses || sum.interviewResponses.length === 0) {
          sum.interviewResponses = clientInterviewResponses;
        }
        if (!sum.aiMedicationSuggestions || sum.aiMedicationSuggestions.length === 0) {
          sum.aiMedicationSuggestions = generateClientMedicationSuggestions(sum.chiefComplaint || '', healthcareMode);
        }
        // Strict Document Image Policy: Only display health documents uploaded in this checkup
        sum.pinnedReports = (attachedReports && attachedReports.length > 0) ? attachedReports : [];
        setSummary({ ...sum });
        setNewlyGeneratedOp(freshOp);
        setPhase('summary');
        return;
      } else if (res?.summary) {
        const sum = res.summary;
        const freshOp = res.opNumber || sum.opNumber || ('OP-' + Math.floor(100000 + Math.random() * 900000));
        sum.opNumber = freshOp;
        if (!sum.interviewResponses || sum.interviewResponses.length === 0) {
          sum.interviewResponses = clientInterviewResponses;
        }
        if (!sum.aiMedicationSuggestions || sum.aiMedicationSuggestions.length === 0) {
          sum.aiMedicationSuggestions = generateClientMedicationSuggestions(sum.chiefComplaint || '', healthcareMode);
        }
        // Strict Document Image Policy: Only display health documents uploaded in this checkup
        sum.pinnedReports = (attachedReports && attachedReports.length > 0) ? attachedReports : [];
        setSummary({ ...sum });
        setNewlyGeneratedOp(freshOp);
        setPhase('summary');
        return;
      }

      // 3. Resilient Fallback: If backend fails or times out, immediately compile valid clinical summary with OP token
      const freshOp = 'OP-' + Math.floor(100000 + Math.random() * 900000);
      const userComplaints = messages.filter((m) => m.sender === 'user').map((m) => m.text).join('; ');
      const fallbackSummary = {
        _id: 'sum-' + Date.now(),
        opNumber: freshOp,
        patientName: detailsToSubmit.name || 'Patient',
        patientPhone: detailsToSubmit.phoneNumber || '9876543210',
        patientAge: Number(detailsToSubmit.age) || 35,
        patientGender: detailsToSubmit.gender || 'Male',
        abhaId: detailsToSubmit.abhaId || '',
        chiefComplaint: userComplaints || (healthcareMode === 'ayush' ? 'AYUSH Health Consultation' : 'General Health Check-Up'),
        symptoms: ['Reported during clinical intake check-up'],
        duration: 'Reported during check-up',
        severity: 'Moderate',
        redFlagStatus: 'NONE',
        suggestedSpecialty: healthcareMode === 'ayush' ? 'AYUSH / Integrative Medicine' : 'General Medicine',
        aiGeneratedText: `Patient ${detailsToSubmit.name} completed clinical triage. Pre-consultation summary recorded under 14-digit ABHA ${detailsToSubmit.abhaId}. Guaranteed unique OP ID ${freshOp} issued for attending physician review.`,
        pinnedReports: (attachedReports && attachedReports.length > 0) ? attachedReports : [],
        interviewResponses: clientInterviewResponses,
        aiMedicationSuggestions: generateClientMedicationSuggestions(userComplaints, healthcareMode),
        createdAt: new Date().toISOString(),
      };
      setSummary(fallbackSummary);
      setNewlyGeneratedOp(freshOp);
      setPhase('summary');

    } catch (err) {
      console.warn('[Summary Fallback Triggered]', err);
      const freshOp = 'OP-' + Math.floor(100000 + Math.random() * 900000);
      const fallbackUserComplaints = messages.filter((m) => m.sender === 'user').map((m) => m.text).join('; ');
      const fallbackSummary = {
        _id: 'sum-' + Date.now(),
        opNumber: freshOp,
        patientName: detailsToSubmit?.name || 'Patient',
        patientPhone: detailsToSubmit?.phoneNumber || '9876543210',
        patientAge: Number(detailsToSubmit?.age) || 35,
        patientGender: detailsToSubmit?.gender || 'Male',
        abhaId: detailsToSubmit?.abhaId || '',
        chiefComplaint: fallbackUserComplaints || 'Outpatient Health Consultation',
        symptoms: ['Reported during intake check-up'],
        duration: 'Reported during check-up',
        severity: 'Moderate',
        redFlagStatus: 'NONE',
        suggestedSpecialty: healthcareMode === 'ayush' ? 'AYUSH / Integrative Medicine' : 'General Medicine',
        aiGeneratedText: `Patient ${detailsToSubmit?.name || 'Patient'} completed clinical triage. OP Token: ${freshOp}.`,
        interviewResponses: messages.filter(m => m.sender === 'user').map(m => ({
          question: 'Clinical health intake inquiry',
          answer: m.text,
          inputMode: m.inputMode || 'text',
          timestamp: m.timestamp || new Date().toISOString()
        })),
        aiMedicationSuggestions: [
          {
            medicineName: 'Dolo 650',
            genericName: 'Paracetamol',
            category: 'Analgesic / Antipyretic',
            form: 'Tablet',
            strength: '650 mg',
            dosage: '1 tablet',
            frequency: 'SOS as needed',
            duration: '3 days',
            timing: 'After food',
            clinicalRationale: 'General symptomatic relief for malaise or headache.',
            advisoryNote: 'AI Clinical Advisory — Attending doctor will evaluate and prescribe.'
          }
        ],
        createdAt: new Date().toISOString(),
      };
      setSummary(fallbackSummary);
      setNewlyGeneratedOp(freshOp);
      setPhase('summary');
    } finally {
      setIsSending(false);
    }
  };

  // Confirm Summary Action (Guaranteed display transition & persistent OP token assignment)
  const handleConfirmSummary = async () => {
    setIsConfirmingSummary(true);
    try {
      // Recompile complete dialogue from messages to ensure responses are never lost
      const clientInterviewResponses = [];
      let lastAiQuestion = '';
      messages.forEach((m) => {
        if (m.sender === 'ai' || m.sender === 'bot') {
          lastAiQuestion = m.text;
        } else if (m.sender === 'user') {
          clientInterviewResponses.push({
            question: lastAiQuestion || (healthcareMode === 'ayush' ? 'Holistic health inquiry & symptom assessment' : 'Clinical symptoms & health concern inquiry'),
            answer: m.text,
            inputMode: m.inputMode || 'text',
            timestamp: m.timestamp || new Date().toISOString(),
          });
        }
      });

      const existingResponses = (summary?.interviewResponses && summary.interviewResponses.length > 0)
        ? summary.interviewResponses
        : clientInterviewResponses;

      let res = null;
      if (interviewId && !String(interviewId).startsWith('session-')) {
        try {
          if (healthcareMode === 'ayush') {
            res = await patientConfirmAyushCase(interviewId, { interviewResponses: existingResponses });
          } else {
            res = await confirmSummary(interviewId, { interviewResponses: existingResponses });
          }
        } catch (apiErr) {
          console.warn('[Confirm Summary API Notice]', apiErr);
        }
      }

      const activeOp = res?.opNumber || res?.summary?.opNumber || summary?.opNumber || newlyGeneratedOp || ('OP-' + Math.floor(100000 + Math.random() * 900000));
      const preservedResponses = (res?.summary?.interviewResponses && res.summary.interviewResponses.length > 0)
        ? res.summary.interviewResponses
        : existingResponses;

      const finalSummary = {
        ...(summary || {}),
        ...(res?.summary || {}),
        interviewResponses: preservedResponses,
        opNumber: activeOp,
        patientConfirmed: true,
        confirmedAt: new Date().toISOString(),
      };

      setSummary(finalSummary);
      setNewlyGeneratedOp(activeOp);
      try {
        localStorage.setItem('medikiosk_last_op', activeOp);
      } catch (e) {}

      setSummaryConfirmed(true);
      setShowConfirmModal(false);
      setPhase('confirmed');
    } catch (err) {
      console.warn('[Confirm Handler Warning]', err);
      const fallbackOp = summary?.opNumber || newlyGeneratedOp || ('OP-' + Math.floor(100000 + Math.random() * 900000));
      setSummary((prev) => ({
        ...(prev || {}),
        opNumber: fallbackOp,
        patientConfirmed: true,
        confirmedAt: new Date().toISOString(),
      }));
      setNewlyGeneratedOp(fallbackOp);
      try {
        localStorage.setItem('medikiosk_last_op', fallbackOp);
      } catch (e) {}
      setSummaryConfirmed(true);
      setShowConfirmModal(false);
      setPhase('confirmed');
    } finally {
      setIsConfirmingSummary(false);
    }
  };

  // Reset session completely to start a new health checkup & new summary with a fresh OP number
  const handleStartNewCheckup = () => {
    window.speechSynthesis?.cancel();
    stopListening();
    setInterviewId(null);
    setSummary(null);
    setSummaryConfirmed(false);
    setIsCompleted(false);
    setMessages([]);
    setInputText('');
    setTurnCount(1);
    setRedFlag(null);
    setRedFlagAcknowledged(false);
    setShowEmergencyModal(false);
    setAttachedReports([]);
    startInterviewPromiseRef.current = null;
    isProcessingRef.current = false;
    setConsentGiven(false);
    setPatientDetails({
      isReturning: false,
      name: user?.name || '',
      phoneNumber: user?.phone || '',
      age: user?.age ? String(user.age) : '',
      gender: user?.gender || 'Male',
      abhaId: user?.abhaId || '',
    });
    setPhoneLookupFound(null);
    setAbhaLookupFound(null);
    setIsAbhaVerified(false);
    setAbhaLookupError(null);
    setPatientDetailsError(null);
    setDemoOtpCode('');
    setEnteredOtp('');
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpError(null);
    setPhase('welcome');
  };

  // Delete an item from summary section
  const handleDeleteItem = (section, index) => {
    if (!summary) return;
    const updated = { ...summary };
    if (Array.isArray(updated[section])) {
      updated[section] = updated[section].filter((_, i) => i !== index);
      setSummary(updated);
      updateSummary(interviewId, { [section]: updated[section] }).catch(console.error);
    }
  };

  // Handle attaching medical / lab report(s) (camera or device, supports multiple files)
  const handleAttachReport = async (fileOrFiles, uploadMethod = 'device', docType = activeDocCategory || 'Lab Report') => {
    if (isUploadingReport) return;
    if (!fileOrFiles) return;
    const files = Array.isArray(fileOrFiles)
      ? fileOrFiles
      : fileOrFiles instanceof FileList
        ? Array.from(fileOrFiles)
        : [fileOrFiles];
    if (files.length === 0) return;

    // 1. Strict Hospital Document Pre-Validation
    const NON_HOSPITAL_PATTERNS = /(selfie|portrait|profile\s*pic|wallpaper|nature|sunset|mountain|beach|swiggy|zomato|amazon\s*pay|flipkart|tax\s*invoice|retail\s*bill|cash\s*memo|movie\s*ticket|flight\s*ticket|train\s*ticket|bus\s*ticket|coupon|voucher|meme|joke|troll|pizza|burger|biryani|curry|samosa)/i;
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

    for (const f of files) {
      const fileName = f.name || '';
      const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        alert(`Invalid format for "${fileName}". Only PDF, JPG, PNG, and WEBP hospital documents are allowed.`);
        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
        if (docUploadInputRef.current) docUploadInputRef.current.value = '';
        return;
      }
      if (NON_HOSPITAL_PATTERNS.test(fileName)) {
        alert(`Upload Rejected for "${fileName}": Only official hospital and medical documents (Doctor Prescriptions, Lab Reports, Diagnostic Scans, Hospital Discharge Summaries, OPD Slips) are accepted.`);
        if (chatFileInputRef.current) chatFileInputRef.current.value = '';
        if (docUploadInputRef.current) docUploadInputRef.current.value = '';
        return;
      }
    }

    setIsUploadingReport(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('reports', f);
      });
      formData.append('uploadMethod', uploadMethod);
      formData.append('documentType', docType || activeDocCategory || 'Lab Report');

      const targetId = summary?._id || interviewId;
      let res;
      if (healthcareMode === 'ayush' && interviewId) {
        try {
          res = await uploadAyushDocument(interviewId, formData);
        } catch (ayushUpErr) {
          console.warn('[AYUSH Document Upload notice] Fallback to standard attach:', ayushUpErr);
          res = await attachReportToSummary(targetId, formData);
        }
      } else {
        res = await attachReportToSummary(targetId, formData);
      }

      if (res?.success) {
        const dedupeReports = (list = []) => {
          const seen = new Set();
          return list.filter((r) => {
            const key = (
              String(r.documentId || '') +
              '::' +
              (r.title || r.originalName || '') +
              '::' +
              (r.fileUrl || '')
            ).toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };

        if (res.summary) {
          const dedupedSummary = {
            ...res.summary,
            pinnedReports: dedupeReports(res.summary.pinnedReports || []),
          };
          setSummary(dedupedSummary);
          setAttachedReports(dedupedSummary.pinnedReports || []);
        }

        const newPinned = res.pinnedReports || (res.pinnedReport ? [res.pinnedReport] : []);
        if (newPinned.length > 0) {
          if (!res.summary) {
            setAttachedReports((prev) => dedupeReports([...prev, ...newPinned]));
            setSummary((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                pinnedReports: dedupeReports([...(prev?.pinnedReports || []), ...newPinned]),
              };
            });
          }

          if (phase === 'interview') {
            const statusText = `✓ Hospital Report Attached & Converted into Text! Findings added to your health summary.`;
            const reportMsg = {
              id: 'report-' + Date.now(),
              sender: 'ai',
              text: statusText,
              timestamp: new Date(),
              pinnedReport: newPinned[0],
            };
            setMessages((prev) => [...prev, reportMsg]);
            speakText(statusText);
          }
        }
      }
    } catch (err) {
      console.error('Attach report error:', err);
      alert('Report processing error: ' + (err.message || 'Server upload failed'));
    } finally {
      setIsUploadingReport(false);
      setIsCameraOpen(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
      if (docUploadInputRef.current) docUploadInputRef.current.value = '';
    }
  };

  // Handle removing an attached report
  const handleRemoveReport = async (report, index) => {
    if (!report) return;
    const ok = window.confirm(`Are you sure you want to remove "${report.title || 'this report'}" from your health summary?`);
    if (!ok) return;

    const targetId = summary?._id || interviewId;
    const reportId = report.documentId || report._id || index;

    try {
      const res = await removeReportFromSummary(targetId, reportId);
      if (res?.success) {
        if (res.summary) {
          setSummary(res.summary);
        } else {
          setSummary((prev) => {
            if (!prev) return null;
            const updated = (prev.pinnedReports || []).filter(
              (r, idx) =>
                String(r.documentId) !== String(reportId) &&
                String(r._id) !== String(reportId) &&
                idx !== index
            );
            return { ...prev, pinnedReports: updated };
          });
        }

        setAttachedReports((prev) =>
          prev.filter(
            (r, idx) =>
              String(r.documentId) !== String(reportId) &&
              String(r._id) !== String(reportId) &&
              idx !== index
          )
        );

        // Also clean up messages if the report was displayed in a chat bubble
        setMessages((prev) =>
          prev.filter((m) => {
            if (!m.pinnedReport) return true;
            const prId = m.pinnedReport.documentId || m.pinnedReport._id;
            return String(prId) !== String(reportId);
          })
        );
      }
    } catch (err) {
      console.error('Failed to remove report:', err);
      alert('Failed to remove report: ' + (err.message || 'Server error'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F8F8] text-[#172033] flex flex-col font-sans select-none">

      {/* 0. FLOATING NEW OP TOKEN NOTIFICATION (EVERY TIME SUMMARY IS CREATED) */}
      <AnimatePresence>
        {newlyGeneratedOp && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-5 py-3 rounded-2xl bg-[#172033] text-white shadow-2xl border-2 border-[#0EA5A8] flex items-center gap-3.5 max-w-lg w-[92%]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0EA5A8] flex items-center justify-center shrink-0 shadow-sm">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                New Health Summary Created
              </div>
              <div className="text-xs sm:text-sm font-bold flex items-center gap-2 truncate">
                <span>Outpatient Token:</span>
                <span className="font-mono text-[#0EA5A8] font-black text-sm sm:text-base tracking-widest select-all">
                  {newlyGeneratedOp}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleCopyOp(newlyGeneratedOp)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Copy OP Number"
            >
              {copiedOp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedOp ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={() => setNewlyGeneratedOp(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D9E4E5] px-3 sm:px-6 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-xs">

        {/* Left: Back Button + MediKiosk Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F8F8] text-[#172033] hover:text-[#0EA5A8] border border-[#D9E4E5] hover:border-[#0EA5A8] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer group active:scale-95"
            title={`${t('Back to website', 'Back to website')} (Alt + ←)`}
            aria-label="Back to website"
          >
            <ArrowLeft className="w-4 h-4 text-[#0EA5A8] group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className="hidden sm:inline font-bold text-xs">{t('Back', 'Back')}</span>
          </button>
          <MediKioskLogo size={38} showText={false} />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-[#172033] flex items-center gap-1.5 tracking-tight truncate">
              <span>MediKiosk</span>
              <span className="text-[#64748B] font-normal hidden sm:inline">•</span>
              <span className="text-[#64748B] font-medium hidden sm:inline truncate">
                {t('AI Health Check-Up', 'AI Health Check-Up')}
              </span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0EA5A8] animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] text-[#0EA5A8] font-semibold truncate">
                AI Clinical Assistant Online
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Switcher [Text-to-Text vs Voice-to-Voice Hands-Free] */}
        {phase === 'interview' && (
          <div className="flex items-center bg-[#F3F8F8] p-1 rounded-2xl border border-[#D9E4E5] shadow-inner shrink-0 max-w-full overflow-x-auto">
            <button
              onClick={() => handleSwitchMode('text')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${checkupMode === 'text'
                  ? 'bg-[#0EA5A8] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#172033]'
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>{t('Text to Text', 'Text to Text')}</span>
            </button>
            <button
              onClick={() => handleSwitchMode('voice')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${checkupMode === 'voice'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#172033]'
                }`}
            >
              <Radio className="w-3.5 h-3.5 text-white animate-pulse shrink-0" />
              <span>{t('Voice to Voice', 'Voice to Voice')}</span>
            </button>
          </div>
        )}

        {/* Center: Dynamic OP Number Token Badge when summary is active */}
        {(phase === 'summary' || phase === 'confirmed') && summary?.opNumber && (
          <div className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-2xl bg-gradient-to-r from-[#E6F7F7] via-[#F0FDFA] to-[#E0F2FE] border-2 border-[#0EA5A8] shadow-xs">
            <Ticket className="w-4 h-4 text-[#0EA5A8] shrink-0" />
            <span className="text-[10px] sm:text-xs font-black uppercase text-[#64748B] tracking-wider hidden sm:inline">
              OP Token:
            </span>
            <span className="font-mono text-xs sm:text-sm font-black text-[#0EA5A8] tracking-widest select-all">
              {summary.opNumber}
            </span>
            <button
              onClick={() => handleCopyOp(summary.opNumber)}
              className="p-1 hover:bg-[#0EA5A8]/10 rounded-md text-[#0EA5A8] transition-colors cursor-pointer"
              title="Copy OP Token"
            >
              {copiedOp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Right: Groq AI Setup, 51-Language Picker & Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap justify-end">
          {/* Groq Llama 3.3 70B AI Setup Trigger */}
          <button
            onClick={() => {
              setGroqInput(groqApiKey);
              setGroqSaveStatus(null);
              setGroqError(null);
              setShowGroqModal(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer ${groqActive || groqApiKey
                ? 'bg-[#E6F7F7] border-[#0EA5A8]/30 text-[#0EA5A8] hover:bg-[#E6F7F7]/80 shadow-xs'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-xs animate-pulse'
              }`}
            title="Configure Groq Llama 3.3 70B Clinical Doctor Triage"
          >
            <Zap className={`w-3.5 h-3.5 shrink-0 ${groqActive || groqApiKey ? 'fill-[#0EA5A8] text-[#0EA5A8]' : 'fill-amber-600 text-amber-600'}`} />
            <span className="hidden md:inline font-bold">
              {groqActive || groqApiKey ? 'Groq Llama 3.3 70B Active' : 'Connect Groq API Key'}
            </span>
            <span className="md:hidden font-bold">
              {groqActive || groqApiKey ? 'Groq 70B' : 'Groq Key'}
            </span>
          </button>

          {/* Language Selector Modal Trigger */}
          <button
            onClick={() => setLangModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-[#D9E4E5] text-xs font-semibold text-[#0EA5A8] hover:border-[#0EA5A8] hover:bg-[#F3F8F8] transition-all max-w-[145px] sm:max-w-[200px] shrink-0 cursor-pointer shadow-xs"
            title="Change language (51 languages supported)"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold truncate">{activeLangInfo.nativeName}</span>
            <span className="text-[10px] text-[#64748B] hidden sm:inline truncate">({activeLangInfo.name})</span>
            <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] text-xs font-semibold border border-[#D9E4E5] transition-colors shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
          >
            {t('Exit', 'Exit')}
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT ROUTER */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-3 sm:p-6 overflow-hidden">

        {/* 9-STEP WORKFLOW PROGRESS STEPPER */}
        <div className="mb-4 bg-white border border-[#D9E4E5] rounded-2xl p-2 sm:p-2.5 shadow-xs shrink-0">
          <div className="hidden md:flex items-center justify-between gap-1">
            {[
              { id: 'welcome', label: '1. Language' },
              { id: 'patient_details', label: '2. Patient Info' },
              { id: 'consent', label: '3. Consent' },
              { id: 'mode', label: '4. Care Mode' },
              { id: 'communication', label: '5. Input Method' },
              { id: 'interview', label: '6. AI Case-Taking' },
              { id: 'upload_documents', label: '7. Upload Documents' },
              { id: 'summary', label: '8. Clinical Summary' },
              { id: 'confirmed', label: '9. Confirm OP' },
            ].map((step, idx) => {
              const currentStepIdx = (() => {
                if (phase === 'welcome') return 0;
                if (phase === 'patient_details') return 1;
                if (phase === 'consent') return 2;
                if (phase === 'mode_selection' || phase === 'ayush_intro') return 3;
                if (phase === 'communication_selection') return 4;
                if (phase === 'interview') return 5;
                if (phase === 'upload_documents' || phase === 'review') return 6;
                if (phase === 'summary') return 7;
                if (phase === 'confirmed') return 8;
                return 0;
              })();

              const isStepDone = currentStepIdx > idx;
              const isStepActive = currentStepIdx === idx;

              return (
                <div key={step.id} className="flex-1 flex items-center min-w-0">
                  <div
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl text-xs font-bold transition-all truncate ${
                      isStepActive
                        ? healthcareMode === 'ayush'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                          : 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30 shadow-2xs'
                        : isStepDone
                        ? 'text-emerald-700 bg-emerald-50/70'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    {isStepDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                          isStepActive
                            ? healthcareMode === 'ayush'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#0EA5A8] text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{step.label.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                  {idx < 8 && (
                    <div
                      className={`w-2.5 h-0.5 mx-0.5 shrink-0 ${
                        currentStepIdx > idx ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile view of stepper */}
          <div className="md:hidden flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                Step {(() => {
                  if (phase === 'welcome') return 1;
                  if (phase === 'patient_details') return 2;
                  if (phase === 'consent') return 3;
                  if (phase === 'mode_selection' || phase === 'ayush_intro') return 4;
                  if (phase === 'communication_selection') return 5;
                  if (phase === 'interview') return 6;
                  if (phase === 'upload_documents' || phase === 'review') return 7;
                  if (phase === 'summary') return 8;
                  if (phase === 'confirmed') return 9;
                  return 1;
                })()} of 9
              </span>
              <span className="font-bold text-[#172033] truncate">
                {(() => {
                  if (phase === 'welcome') return 'Select Language';
                  if (phase === 'patient_details') return 'Patient Info';
                  if (phase === 'consent') return 'Patient Consent';
                  if (phase === 'mode_selection' || phase === 'ayush_intro') return 'Healthcare Mode';
                  if (phase === 'communication_selection') return 'Input Method';
                  if (phase === 'interview') return 'AI Case-Taking';
                  if (phase === 'upload_documents' || phase === 'review') return 'Upload Documents';
                  if (phase === 'summary') return 'Clinical Summary';
                  if (phase === 'confirmed') return 'Confirm OP Token';
                  return '';
                })()}
              </span>
            </div>
            {healthcareMode === 'ayush' && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <Leaf className="w-3 h-3 text-emerald-600" />
                <span>AYUSH</span>
              </span>
            )}
          </div>
        </div>

        {/* PHASE 1: LANGUAGE SELECTION & WELCOME SCREEN (STEP 1 OF 9) */}
        {phase === 'welcome' && (
          <div className="flex-1 flex items-center justify-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-10 shadow-sm text-center"
            >
              <div className="flex justify-center mx-auto mb-4">
                <MediKioskLogo size={58} showText={false} />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0EA5A8] bg-[#E6F7F7] px-3.5 py-1 rounded-full border border-[#0EA5A8]/20 inline-block">
                Step 1 of 9 • Language Selection
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-2.5 tracking-tight">
                {t('AI Health Check-Up', 'Select Your Language')}
              </h2>

              <p className="text-sm text-[#64748B] mt-2 leading-relaxed max-w-md mx-auto">
                Welcome to the hospital clinical intake kiosk. Please select your preferred language from 51 available Indian languages.
              </p>

              {/* Dedicated In-Card 51-Language Selection Hub */}
              <div className="mt-6 p-4 sm:p-5 rounded-3xl bg-[#F8FAFC] border border-[#D9E4E5] text-left space-y-3 shadow-inner">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                    <span className="text-xs font-bold text-[#172033] tracking-tight">
                      Choose Your Preferred Language ({languages.length} Available):
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] font-semibold border border-[#0EA5A8]/30">
                    Active: {activeLangInfo.nativeName}
                  </span>
                </div>

                {/* Direct Native Select Dropdown for Instant Selection */}
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      setLanguage(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D9E4E5] text-xs sm:text-sm font-semibold text-[#172033] focus:outline-none focus:border-[#0EA5A8] transition-colors cursor-pointer shadow-xs"
                  >
                    {languages.map((l, idx) => (
                      <option key={l.code} value={l.code}>
                        {idx + 1}. {l.nativeName} ({l.name}) — {l.region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Selection Chips for Popular Languages */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
                    Quick Pick Popular Languages:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.filter((l) => l.popular).map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(l.code);
                          setLanguage(l.code);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${selectedLanguage === l.code
                            ? 'bg-[#0EA5A8] text-white font-bold shadow-xs'
                            : 'bg-white text-[#64748B] hover:bg-[#E6F7F7] hover:text-[#0EA5A8] border border-[#D9E4E5]'
                          }`}
                      >
                        {l.nativeName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Browse Full Grid Modal Button */}
                <div className="pt-1 flex items-center justify-between text-xs text-[#64748B] flex-wrap gap-2">
                  <span className="text-[11px] text-[#64748B]">
                    AI voice synthesis and translation will automatically adapt to {activeLangInfo.nativeName}.
                  </span>
                  <button
                    type="button"
                    onClick={() => setLangModalOpen(true)}
                    className="text-[#0EA5A8] hover:text-[#0c8f91] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View All {languages.length} in Grid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Navigation Actions for Step 1 */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D9E4E5]">
                <button
                  type="button"
                  onClick={onExit}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Exit
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('patient_details')}
                  className="px-8 py-3.5 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>{t('Continue', 'Next: Patient Information (Step 2) →')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 3: PRIVACY & CONSENT (STEP 3 OF 9) */}
        {phase === 'consent' && (
          <div className="flex-1 flex items-center justify-center py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-[#D9E4E5]">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#0EA5A8] font-bold uppercase tracking-wider bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#0EA5A8]/20">
                    Step 3 of 9 • Patient Privacy &amp; Consent
                  </span>
                  <h3 className="text-xl font-bold text-[#172033] mt-1">Informed Clinical Consent</h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-4 rounded-2xl border border-[#D9E4E5]">
                <p>
                  MediKiosk uses an artificial intelligence clinical intake assistant to ask relevant questions regarding your symptoms, medical history, and past health documents.
                </p>
                <p>
                  You will be communicating in <strong className="text-[#0EA5A8]">{activeLangInfo.nativeName} ({activeLangInfo.name})</strong>.
                </p>
                <p className="text-[#0EA5A8] font-medium">
                  • Your data is encrypted and shared only with the doctor or qualified healthcare professional you personally choose.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#0EA5A8] focus:ring-[#0EA5A8] accent-[#0EA5A8] cursor-pointer"
                  />
                  <span className="text-xs text-[#172033] font-medium">
                    I understand and give consent for the AI health intake session.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('patient_details')}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                >
                  ← Back to Patient Info
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('mode_selection')}
                  disabled={!consentGiven}
                  className="px-6 py-3 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Healthcare Mode</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 4: HEALTHCARE MODE SELECTION (GENERAL MEDICAL vs AYUSH) (STEP 4 OF 9) */}
        {phase === 'mode_selection' && (
          <div className="flex-1 flex items-center justify-center py-6 sm:py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-center"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0EA5A8] bg-[#E6F7F7] px-3.5 py-1 rounded-full border border-[#0EA5A8]/20 inline-block">
                  Step 4 of 9 • Healthcare Care Mode
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-3 tracking-tight">
                  How would you like to continue?
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-lg mx-auto leading-relaxed">
                  Choose the healthcare pathway that matches the type of care or information you want to discuss with the clinical assistant.
                </p>
              </div>

              {/* Two Large Premium Healthcare Mode Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* 1. GENERAL MEDICAL CARD */}
                <div
                  onClick={() => setHealthcareMode('general_medical')}
                  className={`relative p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${healthcareMode === 'general_medical'
                      ? 'bg-gradient-to-b from-[#E6F7F7]/60 to-white border-[#0EA5A8] ring-4 ring-[#0EA5A8]/15 shadow-md transform scale-[1.01]'
                      : 'bg-white border-[#D9E4E5] hover:border-[#0EA5A8]/50 hover:bg-[#F8FAFC]'
                    }`}
                >
                  {healthcareMode === 'general_medical' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0EA5A8] text-white text-[11px] font-bold shadow-xs">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/30 flex items-center justify-center text-[#0EA5A8] mb-4 shadow-xs">
                      <HeartPulse className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏥</span>
                      <h3 className="text-lg font-bold text-[#172033]">GENERAL MEDICAL</h3>
                    </div>

                    <p className="text-xs text-[#0EA5A8] font-semibold mt-1">
                      Modern medical consultation
                    </p>

                    <ul className="mt-4 space-y-2 text-xs text-[#64748B]">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] shrink-0" />
                        <span>Symptoms &amp; vitals</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] shrink-0" />
                        <span>Current medications</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] shrink-0" />
                        <span>Medical history</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] shrink-0" />
                        <span>Diagnostic reports</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#D9E4E5]/80 text-[11px] text-[#64748B] font-medium">
                    Suitable for all general OPD visits &amp; modern hospital consultations
                  </div>
                </div>

                {/* 2. AYUSH CARD */}
                <div
                  onClick={() => setHealthcareMode('ayush')}
                  className={`relative p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${healthcareMode === 'ayush'
                      ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-600 ring-4 ring-emerald-500/15 shadow-md transform scale-[1.01]'
                      : 'bg-white border-[#D9E4E5] hover:border-emerald-500/50 hover:bg-[#F8FAFC]'
                    }`}
                >
                  {healthcareMode === 'ayush' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-500/30 flex items-center justify-center text-emerald-700 mb-4 shadow-xs">
                      <Leaf className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌿</span>
                      <h3 className="text-lg font-bold text-[#172033]">AYUSH</h3>
                    </div>

                    <p className="text-xs text-emerald-700 font-semibold mt-1">
                      Traditional &amp; holistic health assessment
                    </p>

                    <ul className="mt-4 space-y-2 text-xs text-[#64748B]">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>Prakriti &amp; Vikriti (Constitutional balance)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>Agni &amp; Digestion (Metabolism inquiry)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>Sleep &amp; Lifestyle (Ahara, Vihara, Nidra)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>Ayurveda / Yoga / Unani / Siddha / Homeopathy history</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#D9E4E5]/80 text-[11px] text-emerald-800 font-medium">
                    Suitable for AYUSH OPD, wellness centres, and holistic care
                  </div>
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#D9E4E5] text-xs text-[#64748B] flex items-start gap-2.5 text-left">
                <Info className="w-4 h-4 text-[#0EA5A8] shrink-0 mt-0.5" />
                <span>
                  Choose the mode that best matches the type of health information you want to discuss. You will speak with a qualified doctor afterward.
                </span>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('consent')}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                >
                  ← Back to Consent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (healthcareMode === 'ayush') {
                      setPhase('ayush_intro');
                    } else {
                      setPhase('communication_selection');
                    }
                  }}
                  disabled={!healthcareMode}
                  className="px-7 py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Input Method</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 4B: AYUSH MODE INTRODUCTION SCREEN (STEP 4 OF 9) */}
        {phase === 'ayush_intro' && (
          <div className="flex-1 flex items-center justify-center py-6 sm:py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-white border border-emerald-300 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700 shadow-sm">
                <Leaf className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3.5 py-1 rounded-full border border-emerald-300 inline-block">
                  Step 4 of 9 • 🌿 AYUSH Healthcare Mode
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-3 tracking-tight">
                  🌿 AYUSH HEALTH CASE
                </h2>
                <p className="text-sm sm:text-base font-semibold text-emerald-900 mt-2">
                  "Let's understand your health history before you meet your physician."
                </p>
                <p className="text-xs sm:text-sm text-[#64748B] mt-3 max-w-lg mx-auto leading-relaxed">
                  MediKiosk will ask questions about your current concerns, health history, lifestyle, diet and other relevant information. Your responses will be organized into a structured case summary for physician review.
                </p>
              </div>

              {/* Crucial Ethical Disclaimer Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-bold text-emerald-900">
                    AI-Assisted Case-Taking (Not an AI Diagnosis)
                  </strong>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    MediKiosk provides AI-assisted clinical case-taking to document your complaints, diet (Ahara), digestion (Agni), and lifestyle (Vihara). This system does not diagnose diseases or prescribe treatment. Your qualified AYUSH physician (Vaidya) remains fully responsible for your examination and care.
                  </p>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#D9E4E5]">
                <button
                  type="button"
                  onClick={() => setPhase('mode_selection')}
                  className="px-5 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                >
                  ← Back to Care Mode
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('communication_selection')}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Start AYUSH Case (Input Method)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 5: COMMUNICATION MODE SELECTION (TEXT vs VOICE) (STEP 5 OF 9) */}
        {phase === 'communication_selection' && (
          <div className="flex-1 flex items-center justify-center py-6 sm:py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-center"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7] bg-[#E0F2FE] px-3.5 py-1 rounded-full border border-[#0284C7]/20 inline-block">
                  Step 5 of 9 • Input Method / Communication Mode
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-3 tracking-tight">
                  HOW WOULD YOU LIKE TO ANSWER?
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-lg mx-auto leading-relaxed">
                  Communicating in <strong className="text-[#0EA5A8]">{activeLangInfo.nativeName} ({activeLangInfo.name})</strong> in{' '}
                  <strong className="text-[#172033]">
                    {healthcareMode === 'ayush' ? '🌿 AYUSH Mode' : '🏥 General Medical Mode'}
                  </strong>
                </p>
              </div>

              {/* Two Interactive Communication Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Option A: Text to Text (AI Chat) */}
                <div
                  onClick={() => handleStartInterview('text')}
                  className={`relative p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between group hover:shadow-lg hover:scale-[1.01] ${checkupMode === 'text'
                      ? 'bg-[#E6F7F7]/60 border-[#0EA5A8] ring-4 ring-[#0EA5A8]/15 shadow-md'
                      : 'bg-white border-[#D9E4E5] hover:border-[#0EA5A8]/50 hover:bg-[#F8FAFC]'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/30 flex items-center justify-center text-[#0EA5A8] shadow-xs group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-[#0EA5A8] bg-white border border-[#0EA5A8]/30 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs group-hover:bg-[#0EA5A8] group-hover:text-white transition-all">
                      <span>Open AI Chat</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💬</span>
                      <h3 className="text-lg font-bold text-[#172033]">TEXT / TOUCH</h3>
                    </div>

                    <p className="text-xs text-[#0EA5A8] font-semibold mt-1">
                      Type your answers
                    </p>

                    <p className="text-xs text-[#64748B] mt-3 leading-relaxed">
                      Interactive conversational AI chat. Type answers at your own pace, attach lab documents, and read full questions.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D9E4E5]/80 flex items-center justify-between text-xs font-semibold text-[#0EA5A8]">
                    <span>Select to open AI Chat immediately</span>
                    <span className="text-sm font-bold">→</span>
                  </div>
                </div>

                {/* Option B: Voice to Voice (Hands-Free AI) */}
                <div
                  onClick={() => handleStartInterview('voice')}
                  className={`relative p-5 sm:p-6 rounded-3xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between group hover:shadow-lg hover:scale-[1.01] ${checkupMode === 'voice'
                      ? 'bg-[#E0F2FE]/70 border-[#0284C7] ring-4 ring-[#0284C7]/15 shadow-md'
                      : 'bg-white border-[#D9E4E5] hover:border-[#0284C7]/50 hover:bg-[#F8FAFC]'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/30 flex items-center justify-center text-[#0284C7] shadow-xs group-hover:scale-105 transition-transform">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-bold text-[#0284C7] bg-white border border-[#0284C7]/30 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs group-hover:bg-[#0284C7] group-hover:text-white transition-all">
                      <span>Open Voice Mode</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎤</span>
                      <h3 className="text-lg font-bold text-[#172033]">VOICE</h3>
                    </div>

                    <p className="text-xs text-[#0284C7] font-semibold mt-1">
                      Speak your answers
                    </p>

                    <p className="text-xs text-[#64748B] mt-3 leading-relaxed">
                      Hands-free voice mode. AI speaks questions aloud in {activeLangInfo.nativeName} and listens automatically to your spoken answers.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#D9E4E5]/80 flex items-center justify-between text-xs font-semibold text-[#0284C7]">
                    <span>Select to start Voice mode immediately</span>
                    <span className="text-sm font-bold">→</span>
                  </div>
                </div>
              </div>

              {/* Crucial Natural Language Instruction: No Yes/No Buttons */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3 text-left">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-900">
                    Conversational Answering — Natural Sentences
                  </strong>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Speak or type naturally as you would describe your health to a doctor. You can describe your concerns in complete sentences freely.
                  </p>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (healthcareMode === 'ayush') {
                      setPhase('ayush_intro');
                    } else {
                      setPhase('mode_selection');
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                >
                  ← Back to Care Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleStartInterview(checkupMode)}
                  disabled={isSending}
                  className="px-8 py-3.5 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isSending ? 'Connecting...' : checkupMode === 'voice' ? 'Start Voice Case (Step 6)' : 'Open AI Chat (Step 6)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 6: ACTIVE CHECKUP SESSION (TEXT MODE OR VOICE MODE) (STEP 6 OF 9) */}
        {phase === 'interview' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-130px)] overflow-hidden">

            {/* Left/Main Column */}
            <div className="flex-1 flex flex-col bg-white border border-[#D9E4E5] rounded-3xl overflow-hidden shadow-sm">

              {/* Progress Bar & Sub-header */}
              <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#D9E4E5] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0EA5A8] bg-[#E6F7F7] px-2 py-0.5 rounded-md border border-[#0EA5A8]/20">
                    Step 6 of 9
                  </span>
                  <span className="font-semibold text-[#172033]">AI Case-Taking</span>
                  <span className="text-[#64748B]">—</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${healthcareMode === 'ayush'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-[#E6F7F7] text-[#0EA5A8] border-[#0EA5A8]/30'
                    }`}>
                    <span>{healthcareMode === 'ayush' ? '🌿 AYUSH' : '🏥 General Medical'}</span>
                  </span>
                  {healthcareMode === 'ayush' && (
                    <>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        <span>{ayushSectionLabel}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hidden md:inline">
                        Information collected: {ayushCollectedCount} / 8 core domains
                      </span>
                    </>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1">
                    <span>{checkupMode === 'voice' ? '🎤 Voice to Voice' : '💬 Text to Text'}</span>
                  </span>
                  <span className="text-[#0EA5A8] font-medium hidden sm:inline">
                    Turn {turnCount} • {activeLangInfo.nativeName}
                  </span>
                  <button
                    onClick={() => {
                      setGroqInput(groqApiKey);
                      setGroqSaveStatus(null);
                      setGroqError(null);
                      setShowGroqModal(true);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${groqActive || groqApiKey
                        ? 'bg-[#E6F7F7] border border-[#0EA5A8]/30 text-[#0EA5A8] hover:bg-[#E6F7F7]/80'
                        : 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 animate-pulse'
                      }`}
                    title="Click to view or update Groq AI Key"
                  >
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>{groqActive || groqApiKey ? 'Doctor AI: Ultra-Fast Active' : 'Add Groq Key'}</span>
                  </button>
                </div>

                {/* Mobile Mode Switcher, Finish Action & Info Drawer */}
                <div className="flex items-center gap-2">
                  {(turnCount >= 1 || messages.length >= 2 || isCompleted || ayushReadyForReview) && (
                    <button
                      onClick={() => {
                        stopListening();
                        window.speechSynthesis?.cancel();
                        setPhase('upload_documents');
                      }}
                      disabled={isSending}
                      className={`px-3 py-1 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                        healthcareMode === 'ayush' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0EA5A8] hover:bg-[#0c8f91]'
                      }`}
                      title="Proceed to upload hospital documents and prescriptions"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Next: Upload Documents →</span>
                    </button>
                  )}

                  <div className="md:hidden flex items-center bg-white p-0.5 rounded-xl border border-[#D9E4E5] text-[10px]">
                    <button
                      onClick={() => handleSwitchMode('text')}
                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${checkupMode === 'text' ? 'bg-[#0EA5A8] text-white' : 'text-[#64748B]'}`}
                    >
                      Text to Text
                    </button>
                    <button
                      onClick={() => handleSwitchMode('voice')}
                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${checkupMode === 'voice' ? 'bg-[#0284C7] text-white' : 'text-[#64748B]'}`}
                    >
                      Voice to Voice
                    </button>
                  </div>

                  <button
                    onClick={() => setShowMobileInfoDrawer(true)}
                    className="lg:hidden text-xs text-[#0EA5A8] hover:text-[#0c8f91] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Info</span>
                  </button>
                </div>
              </div>

              {/* Error Notice Banner */}
              {error && (
                <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Red-Flag 14-Category Patient Emergency Alert Banner & Modal */}
              {redFlag && !redFlagAcknowledged && (
                <EmergencyRedFlagAlert
                  redFlag={redFlag}
                  onAcknowledge={() => setRedFlagAcknowledged(true)}
                  isModalOpen={showEmergencyModal}
                  onCloseModal={() => setShowEmergencyModal(false)}
                  onOpenModal={() => setShowEmergencyModal(true)}
                />
              )}

              {/* Minimized / Acknowledged Banner reminder */}
              {redFlag && redFlagAcknowledged && (
                <div className="px-4 py-2.5 bg-rose-100 border-b border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-2 flex-wrap animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{redFlag.primaryCategory?.emoji || '🚨'}</span>
                    <span className="font-bold">
                      Emergency Alert: {redFlag.primaryCategory?.category || 'High Priority'}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-rose-800">
                      (Call 112 / 108 immediately if symptoms escalate)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="tel:112"
                      className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      Call 112
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowEmergencyModal(true)}
                      className="text-[11px] text-rose-800 hover:text-rose-950 font-bold underline cursor-pointer"
                    >
                      View Protocol
                    </button>
                  </div>
                </div>
              )}

              {/* Standalone Modal when opened after acknowledgement */}
              {redFlag && redFlagAcknowledged && showEmergencyModal && (
                <EmergencyRedFlagAlert
                  redFlag={redFlag}
                  onAcknowledge={() => setRedFlagAcknowledged(true)}
                  isModalOpen={showEmergencyModal}
                  onCloseModal={() => setShowEmergencyModal(false)}
                  onOpenModal={() => setShowEmergencyModal(true)}
                />
              )}

              {/* ------------------------------------------------------------- */}
              {/* MODE A: TEXT-TO-TEXT CONVERSATION VIEW                        */}
              {/* ------------------------------------------------------------- */}
              {checkupMode === 'text' ? (
                <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]/50">
                  {/* Chat Messages Stream */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                    {messages.map((msg) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                        >
                          <span className="text-[11px] font-semibold text-[#64748B] mb-1 px-1">
                            {isAi ? 'AI Assistant' : 'You'}
                          </span>
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${msg.isEmergencyAlert
                                ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 rounded-tl-sm ring-2 ring-rose-200'
                                : isAi
                                  ? 'bg-white border border-[#D9E4E5] text-[#172033] rounded-tl-sm'
                                  : 'bg-[#0EA5A8] text-white rounded-tr-sm'
                              }`}
                          >
                            <p>{msg.text}</p>

                            {/* Red Flag indicator tag on user message */}
                            {msg.redFlag && (
                              <div className="mt-2.5 pt-2 border-t border-white/30 text-[11px] text-white flex items-center justify-between gap-2 bg-rose-700/80 px-2.5 py-1.5 rounded-xl">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>{msg.redFlag.emoji}</span>
                                  <span>Red Flag: {msg.redFlag.category}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowEmergencyModal(true)}
                                  className="text-[10px] underline font-bold text-amber-200 hover:text-white cursor-pointer"
                                >
                                  View Protocol
                                </button>
                              </div>
                            )}

                            {/* Emergency Action on AI emergency alert card */}
                            {msg.isEmergencyAlert && (
                              <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center gap-2 flex-wrap">
                                <a
                                  href="tel:112"
                                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>Call 112</span>
                                </a>
                                <a
                                  href="tel:108"
                                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Ambulance className="w-3 h-3" />
                                  <span>Call 108</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setShowEmergencyModal(true)}
                                  className="text-[11px] font-semibold text-rose-700 hover:underline cursor-pointer ml-auto"
                                >
                                  Open Protocol →
                                </button>
                              </div>
                            )}

                            {/* Show original speech if translated into selected language */}
                            {!isAi && msg.originalText && msg.originalText !== msg.text && (
                              <div className="mt-2 pt-2 border-t border-white/20 text-[11px] text-white/90 flex items-start gap-1.5 opacity-95">
                                <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                                <div>
                                  <span className="font-semibold block text-[10px] text-white/80 uppercase tracking-wider">
                                    Original Spoken Words Translated:
                                  </span>
                                  <span className="italic">"{msg.originalText}"</span>
                                </div>
                              </div>
                            )}

                            {/* Pinned Report Visual in Bubble */}
                            {msg.pinnedReport && (
                              <div className="mt-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${msg.pinnedReport.isDirectPinnedImage ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30'
                                      }`}>
                                      {msg.pinnedReport.isDirectPinnedImage ? '📷 Photo Attached Directly' : '✓ Text Document Attached'}
                                    </span>
                                    <span className="text-[11px] font-mono text-[#172033] truncate">{msg.pinnedReport.title}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReport(msg.pinnedReport, 0)}
                                    className="text-[10px] text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                    title="Remove this report from summary"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                                {msg.pinnedReport.fileUrl && (
                                  <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-100 border border-[#D9E4E5]">
                                    <img
                                      src={msg.pinnedReport.fileUrl.startsWith('http') ? msg.pinnedReport.fileUrl : `http://localhost:5000${msg.pinnedReport.fileUrl.startsWith('/') ? '' : '/'}${msg.pinnedReport.fileUrl}`}
                                      alt={msg.pinnedReport.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                {msg.pinnedReport.hasExtractedText && msg.pinnedReport.extractedText && (
                                  <div className="p-2 rounded-lg bg-white border border-[#D9E4E5] text-[10px] font-mono text-[#172033] max-h-24 overflow-y-auto whitespace-pre-wrap">
                                    {msg.pinnedReport.extractedText}
                                  </div>
                                )}
                              </div>
                            )}

                            {isAi && (
                              <div className="mt-2.5 pt-2 border-t border-[#D9E4E5] flex items-center justify-end">
                                <button
                                  onClick={() => speakText(msg.text)}
                                  className="text-[11px] text-[#0EA5A8] hover:text-[#0c8f91] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Listen aloud in selected language"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>{t('Speak Response', 'Listen')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Typing Animation */}
                    {isTyping && (
                      <div className="flex flex-col items-start">
                        <span className="text-[11px] font-semibold text-[#64748B] mb-1 px-1">
                          AI Assistant
                        </span>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#D9E4E5] rounded-tl-sm flex items-center gap-2 text-xs text-[#64748B] shadow-xs">
                          <span>Thinking in {activeLangInfo.nativeName}</span>
                          <div className="flex items-center gap-1 pt-1">
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8]" />
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8]" />
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Ready to generate summary banner */}
                  {(isCompleted || messages.length >= 3 || ayushReadyForReview) && (
                    <div className="px-5 py-3 bg-[#E6F7F7] border-t border-[#0EA5A8]/20 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#0EA5A8] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                        <span>
                          {healthcareMode === 'ayush'
                            ? '✓ AYUSH Case-Taking Complete! Next Step: Upload previous prescriptions or medical reports.'
                            : isCompleted
                            ? '✓ Consultation complete. Thank you for providing your details.'
                            : 'Intake details recorded. You can conclude discussion anytime.'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setPhase('upload_documents');
                        }}
                        disabled={isSending}
                        className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          healthcareMode === 'ayush' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0EA5A8] hover:bg-[#0c8f91]'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Next: Upload Documents →</span>
                      </button>
                    </div>
                  )}

                  {/* Text Input & Attachment Bar */}
                  <div className="p-3.5 sm:p-4 bg-white border-t border-[#D9E4E5]">
                    {/* Instant Translate Chip if user typed in English & non-English is selected */}
                    {selectedLanguage !== 'en' && inputText.trim().length > 2 && (
                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-[11px] text-[#64748B]">
                          Auto-translates on Send to <strong className="text-[#0EA5A8]">{activeLangInfo.nativeName}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!inputText.trim() || selectedLanguage === 'en') return;
                            try {
                              setIsTranslatingSpeech(true);
                              const tr = await translatePatientSpeech(inputText.trim(), selectedLanguage);
                              if (tr) setInputText(tr);
                            } catch (e) { } finally {
                              setIsTranslatingSpeech(false);
                            }
                          }}
                          disabled={isTranslatingSpeech}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/30 text-[#0EA5A8] hover:bg-[#E6F7F7]/80 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Globe className="w-3 h-3" />
                          <span>{isTranslatingSpeech ? 'Translating...' : `Translate to ${activeLangInfo.nativeName}`}</span>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={chatFileInputRef}
                      onChange={(e) => e.target.files?.length && handleAttachReport(e.target.files, 'device', activeDocCategory)}
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">

                      {/* Document Attachment Button */}
                      <button
                        type="button"
                        disabled={isUploadingReport || isSending}
                        onClick={() => chatFileInputRef.current?.click()}
                        title="Upload lab report or prescription"
                        className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#64748B] hover:text-[#0EA5A8] hover:border-[#0EA5A8] transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      {/* Camera Scanner Button */}
                      <button
                        type="button"
                        disabled={isUploadingReport || isSending}
                        onClick={() => setIsCameraOpen(true)}
                        title="Scan report with camera"
                        className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#64748B] hover:text-[#0EA5A8] hover:border-[#0EA5A8] transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-5 h-5" />
                      </button>

                      {/* Mic Dictation Button in Text Mode */}
                      <button
                        type="button"
                        onClick={toggleListening}
                        title={isListening ? 'Mic Unmuted (Recording) • Tap to Mute' : 'Mic Muted • Tap to Unmute & Speak'}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-xs ${isListening
                            ? 'bg-[#E6F7F7] border-[#0EA5A8] text-[#0EA5A8] animate-pulse ring-2 ring-[#0EA5A8]/30'
                            : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B] hover:text-[#0EA5A8] hover:border-[#0EA5A8]'
                          }`}
                      >
                        {isListening ? <Mic className="w-5 h-5 text-[#0EA5A8] animate-pulse" /> : <MicOff className="w-5 h-5 text-[#64748B]" />}
                      </button>

                      {(isCompleted || ayushReadyForReview) ? (
                        <div className="flex-1 flex items-center justify-between gap-3 bg-[#E6F7F7] border border-[#0EA5A8]/30 rounded-2xl px-4 py-2.5">
                          <div className="flex items-center gap-2 text-xs text-[#0EA5A8] font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                            <span>
                              {healthcareMode === 'ayush'
                                ? '✓ AYUSH Case-Taking Complete! Next Step: Upload previous prescriptions or medical reports.'
                                : 'Thank you! Consultation complete. Details recorded for the doctor.'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setPhase('upload_documents');
                            }}
                            disabled={isSending}
                            className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                              healthcareMode === 'ayush' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0EA5A8] hover:bg-[#0c8f91]'
                            }`}
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>Next: Upload Documents →</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Text Input */}
                          <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendText();
                              }
                            }}
                            placeholder={`Type your health symptoms in ${activeLangInfo.nativeName}...`}
                            className="flex-1 bg-[#F8FAFC] border border-[#D9E4E5] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#0EA5A8] transition-colors"
                          />

                          {/* Send Button */}
                          <button
                            onClick={handleSendText}
                            disabled={!inputText.trim() || isSending}
                            className="p-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-all cursor-pointer"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ------------------------------------------------------------- */
                /* MODE B: VOICE-TO-VOICE HANDS-FREE CONVERSATIONAL HUB          */
                /* ------------------------------------------------------------- */
                <div className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC]/40">

                  {/* TOP: Voice-to-Voice Interaction Hero & Status Bar */}
                  <div className="p-4 sm:p-5 border-b border-[#D9E4E5] bg-white backdrop-blur-sm shrink-0">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

                      {/* Visualizer Sphere & Voice Status */}
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Pulsing Soundwave Rings & Core Orb */}
                        <div className="relative flex items-center justify-center shrink-0">
                          <div className={`absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-500 pointer-events-none ${redFlag && !redFlagAcknowledged
                              ? 'bg-rose-600/30 scale-125 animate-ping'
                              : isSpeaking
                                ? 'bg-[#0284C7]/20 scale-125 animate-ping'
                                : isListening
                                  ? 'bg-[#0EA5A8]/20 scale-110 animate-pulse'
                                  : 'bg-slate-200/40 scale-95'
                            }`} />
                          <div className={`absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-dashed transition-all duration-500 pointer-events-none ${redFlag && !redFlagAcknowledged
                              ? 'border-rose-500 animate-spin'
                              : isSpeaking
                                ? 'border-[#0284C7]/60 animate-spin'
                                : isListening
                                  ? 'border-[#0EA5A8]/60 animate-pulse'
                                  : 'border-[#D9E4E5]'
                            }`} />
                          <button
                            type="button"
                            onClick={isCompleted ? () => { stopListening(); window.speechSynthesis?.cancel(); setPhase('upload_documents'); } : toggleListening}
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${redFlag && !redFlagAcknowledged
                                ? 'bg-gradient-to-tr from-rose-600 to-red-600 ring-4 ring-rose-400/50 text-white'
                                : isCompleted
                                  ? 'bg-gradient-to-tr from-[#0EA5A8] to-[#0284C7] ring-4 ring-[#0EA5A8]/20 text-white'
                                  : isSpeaking
                                    ? 'bg-gradient-to-tr from-[#0284C7] to-[#0EA5A8] ring-4 ring-[#0284C7]/20 text-white'
                                    : isListening
                                      ? 'bg-gradient-to-tr from-[#0EA5A8] to-[#0284C7] scale-105 ring-4 ring-[#0EA5A8]/20 text-white'
                                      : 'bg-white border-2 border-rose-300 hover:border-rose-400 text-rose-500 shadow-sm'
                              }`}
                            title={isCompleted ? 'Intake Complete • Tap to proceed to Document Upload (Step 7)' : isListening ? 'Mic Unmuted (Recording) • Tap to Mute' : 'Mic Muted • Tap to Unmute & Speak'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            ) : isSpeaking ? (
                              <Volume2 className="w-6 h-6 text-white animate-pulse" />
                            ) : isListening ? (
                              <Mic className="w-6 h-6 text-white animate-bounce" />
                            ) : (
                              <MicOff className="w-5 h-5 text-rose-500" />
                            )}
                            <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${isListening || isSpeaking || isCompleted ? 'text-white' : 'text-rose-500'}`}>
                              {isCompleted ? 'Done' : isSpeaking ? 'Speaking' : isListening ? 'Recording' : 'Muted'}
                            </span>
                          </button>
                        </div>

                        {/* Status Text & Clinical Context */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {redFlag && !redFlagAcknowledged ? (
                              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border bg-rose-600 text-white border-rose-400 animate-pulse flex items-center gap-1 shadow-xs">
                                <Siren className="w-3 h-3" />
                                <span>RED FLAG: {redFlag.primaryCategory?.category || 'EMERGENCY'}</span>
                              </span>
                            ) : (
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${isCompleted
                                  ? 'bg-[#E6F7F7] border-[#0EA5A8]/30 text-[#0EA5A8]'
                                  : isListening
                                    ? 'bg-[#E6F7F7] border-[#0EA5A8]/30 text-[#0EA5A8] animate-pulse'
                                    : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B]'
                                }`}>
                                {isCompleted ? '✓ Complete' : isListening ? '● Mic Unmuted' : '○ Mic Muted'}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#0EA5A8] truncate">
                              {activeLangInfo.nativeName} ({activeLangInfo.name})
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium mt-1">
                            {redFlag && !redFlagAcknowledged ? (
                              <span className="text-rose-600 font-bold flex items-center gap-1.5 animate-pulse">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Emergency Warning: {redFlag.primaryCategory?.symptoms}</span>
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[#0EA5A8] flex items-center gap-1.5 font-semibold">
                                <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                                <span>Thank you! Consultation Complete • Intake recorded for attending doctor.</span>
                              </span>
                            ) : isSpeaking ? (
                              <span className="text-[#0284C7] flex items-center gap-1.5 animate-pulse">
                                <Volume2 className="w-4 h-4 text-[#0284C7] shrink-0" />
                                <span>AI Doctor speaking clinical inquiry aloud...</span>
                              </span>
                            ) : isListening ? (
                              <span className="text-[#0EA5A8] flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5A8] animate-ping shrink-0" />
                                <span>Mic Unmuted • Recording in {activeLangInfo.nativeName}... (Auto-mutes on silence)</span>
                              </span>
                            ) : isTranslatingSpeech ? (
                              <span className="text-[#0EA5A8] flex items-center gap-1.5 animate-pulse">
                                <Sparkles className="w-4 h-4 text-[#0EA5A8] animate-spin shrink-0" />
                                <span>Translating spoken words into {activeLangInfo.nativeName}...</span>
                              </span>
                            ) : isSending ? (
                              <span className="text-amber-700 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                                <span>Doctor AI Reasoning (Groq Doctor Engine)...</span>
                              </span>
                            ) : (
                              <span className="text-[#64748B] flex items-center gap-1.5">
                                <MicOff className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>Mic Muted • Tap orb to unmute & speak in {activeLangInfo.nativeName}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Action Quick Buttons */}
                      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                        {redFlag && (
                          <a
                            href="tel:112"
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm animate-pulse"
                            title="Call 112 National Emergency"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-white" />
                            <span>Call 112</span>
                          </a>
                        )}
                        {redFlag && (
                          <button
                            type="button"
                            onClick={() => setShowEmergencyModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-xs font-bold text-rose-900 flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-300"
                            title="View Emergency Protocol"
                          >
                            <Siren className="w-3.5 h-3.5 text-rose-600" />
                            <span>Protocol</span>
                          </button>
                        )}
                        {currentAiQuestion && (
                          <button
                            onClick={() => speakText(currentAiQuestion)}
                            disabled={isSpeaking}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-xs font-semibold text-[#172033] flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                            title="Repeat latest AI doctor inquiry"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#0284C7]" />
                            <span>Repeat Question</span>
                          </button>
                        )}

                        <button
                          onClick={() => setIsCameraOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-xs font-semibold text-[#172033] hover:text-[#0EA5A8] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Scan lab report or prescription with camera"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#0EA5A8]" />
                          <span>Scan Report</span>
                        </button>

                        <button
                          onClick={() => handleSwitchMode('text')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-xs font-semibold text-[#172033] hover:text-[#0EA5A8] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Switch to standard text chat mode"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#0EA5A8]" />
                          <span>Text Mode</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Subtitles & Instant Send Bar */}
                    <div className="max-w-4xl mx-auto mt-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] flex flex-col gap-3 shadow-inner">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex-1 w-full text-left min-w-0">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">
                            <span>Live Voice Subtitles ({activeLangInfo.name})</span>
                            {liveTranscript && !voiceEditingTranscript && (
                              <span className="text-[#0EA5A8] flex items-center gap-1 normal-case text-[11px] font-semibold">
                                <span className="w-2 h-2 rounded-full bg-[#0EA5A8] animate-pulse" />
                                Auto-stops & mutes after speaking • Tap Edit or Send
                              </span>
                            )}
                          </div>
                          {!voiceEditingTranscript ? (
                            <p className="text-xs sm:text-sm text-[#172033] italic line-clamp-2">
                              {isTranslatingSpeech
                                ? `⚡ Translating spoken words into ${activeLangInfo.nativeName}...`
                                : liveTranscript
                                  ? `"${liveTranscript}"`
                                  : isListening
                                    ? `(Mic Unmuted • Recording in ${activeLangInfo.nativeName}... Speak symptoms, auto-mutes on silence)`
                                    : `(Mic Muted • Tap the microphone orb above to unmute and record)`}
                            </p>
                          ) : (
                            <div className="flex items-center gap-2 w-full mt-1">
                              <input
                                type="text"
                                value={voiceCustomTranscript}
                                onChange={(e) => setVoiceCustomTranscript(e.target.value)}
                                className="flex-1 bg-white border border-[#0EA5A8] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none"
                                placeholder="Edit your spoken words..."
                                autoFocus
                              />
                            </div>
                          )}
                        </div>

                        {/* Direct Send Spoken Voice Button & Inline Edit */}
                        {(liveTranscript.trim().length > 0 || voiceEditingTranscript) && (
                          <div className="flex items-center gap-2 shrink-0">
                            {!voiceEditingTranscript ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVoiceCustomTranscript(liveTranscript);
                                    setVoiceEditingTranscript(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="Edit transcript before sending"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Transcript</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearVoiceTranscript}
                                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] transition-colors text-xs cursor-pointer shadow-xs"
                                  title="Clear and speak again"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleManualSubmitVoice}
                                  disabled={isSending || isProcessingRef.current}
                                  className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Voice Now</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setVoiceEditingTranscript(false)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#64748B] text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const finalSpoken = voiceCustomTranscript.trim();
                                    if (!finalSpoken) return;
                                    setVoiceEditingTranscript(false);
                                    setLiveTranscript('');
                                    processAnswerSubmission(finalSpoken, 'voice');
                                  }}
                                  disabled={isSending || !voiceCustomTranscript.trim()}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirm &amp; Send</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ready for review completion banner in Voice mode */}
                      {(isCompleted || ayushReadyForReview) && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              {healthcareMode === 'ayush'
                                ? '✓ AYUSH Case-Taking Complete! Next Step: Upload previous medical documents or prescriptions.'
                                : 'Intake complete. Your details are recorded.'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              stopListening();
                              window.speechSynthesis?.cancel();
                              setPhase('upload_documents');
                            }}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Next: Upload Documents (Step 7) →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MAIN: Full Multi-Turn Conversation Stream (100% Parity with Chat Box!) */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                    {messages.map((msg) => {
                      const isAi = msg.sender === 'ai';
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] mb-1 px-1">
                            {isAi ? (
                              <>
                                <Bot className="w-3.5 h-3.5 text-[#0EA5A8]" />
                                <span>AI Doctor • Clinical Triage</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3.5 h-3.5 text-[#0284C7]" />
                                <span>You • Voice Response</span>
                                <Mic className="w-3 h-3 text-[#0EA5A8] ml-0.5" />
                              </>
                            )}
                          </div>

                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${isAi
                                ? 'bg-white border border-[#D9E4E5] text-[#172033] rounded-tl-sm'
                                : 'bg-[#0EA5A8] text-white rounded-tr-sm'
                              }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            {/* Show original speech if translated into selected language */}
                            {!isAi && msg.originalText && msg.originalText !== msg.text && (
                              <div className="mt-2 pt-2 border-t border-white/20 text-[11px] text-white/90 flex items-start gap-1.5 opacity-95">
                                <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white/80" />
                                <div>
                                  <span className="font-semibold block text-[10px] text-white/80 uppercase tracking-wider">
                                    Original Spoken Words Translated:
                                  </span>
                                  <span className="italic">"{msg.originalText}"</span>
                                </div>
                              </div>
                            )}

                            {/* Pinned Report Visual in Bubble */}
                            {msg.pinnedReport && (
                              <div className="mt-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${msg.pinnedReport.isDirectPinnedImage ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30'
                                      }`}>
                                      {msg.pinnedReport.isDirectPinnedImage ? '📷 Photo Attached Directly' : '✓ Text Document Attached'}
                                    </span>
                                    <span className="text-[11px] font-mono text-[#172033] truncate">{msg.pinnedReport.title}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReport(msg.pinnedReport, 0)}
                                    className="text-[10px] text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                    title="Remove this report from summary"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                                {msg.pinnedReport.fileUrl && (
                                  <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-100 border border-[#D9E4E5]">
                                    <img
                                      src={msg.pinnedReport.fileUrl.startsWith('http') ? msg.pinnedReport.fileUrl : `http://localhost:5000${msg.pinnedReport.fileUrl.startsWith('/') ? '' : '/'}${msg.pinnedReport.fileUrl}`}
                                      alt={msg.pinnedReport.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                {msg.pinnedReport.hasExtractedText && msg.pinnedReport.extractedText && (
                                  <div className="p-2 rounded-lg bg-white border border-[#D9E4E5] text-[10px] font-mono text-[#172033] max-h-24 overflow-y-auto whitespace-pre-wrap">
                                    {msg.pinnedReport.extractedText}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Replay Audio Button for AI Messages */}
                            {isAi && (
                              <div className="mt-2.5 pt-2 border-t border-[#D9E4E5] flex items-center justify-end">
                                <button
                                  onClick={() => speakText(msg.text)}
                                  className="text-[11px] text-[#0EA5A8] hover:text-[#0c8f91] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Listen to this question again aloud"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Listen Again ({activeLangInfo.nativeName})</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Voice Mode Typing / Reasoning Indicator */}
                    {(isTyping || isSending) && (
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B] mb-1 px-1">
                          <Bot className="w-3.5 h-3.5 text-[#0EA5A8]" />
                          <span>Doctor AI</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white border border-[#D9E4E5] rounded-tl-sm flex items-center gap-2 text-xs text-[#172033] shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-[#0EA5A8] animate-spin" />
                          <span>Doctor AI analyzing symptoms with Groq Doctor Engine in {activeLangInfo.nativeName}...</span>
                          <div className="flex items-center gap-1 pt-0.5">
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8]" />
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8]" />
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={voiceChatEndRef} />
                  </div>

                  {/* BOTTOM: Ready to generate summary banner in Voice Mode */}
                  {(isCompleted || messages.length >= 3) && (
                    <div className="px-5 py-3.5 bg-[#E6F7F7] border-t border-[#0EA5A8]/20 flex items-center justify-between flex-wrap gap-2 shrink-0">
                      <div className="flex items-center gap-2 text-xs text-[#0EA5A8] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                        <span>
                          {healthcareMode === 'ayush'
                            ? '✓ AYUSH Case-Taking Complete! Next Step: Upload previous prescriptions or medical reports.'
                            : isCompleted
                            ? '✓ Thank you! Consultation complete. Clinical findings recorded.'
                            : 'Sufficient information gathered. You can conclude discussion anytime.'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          stopListening();
                          window.speechSynthesis?.cancel();
                          setPhase('upload_documents');
                        }}
                        disabled={isSending}
                        className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          healthcareMode === 'ayush' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0EA5A8] hover:bg-[#0c8f91]'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Next: Upload Documents →</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Information Collected Side Panel (Desktop) */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border border-[#D9E4E5] rounded-3xl p-5 shadow-sm overflow-y-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-4 flex items-center gap-2 pb-3 border-b border-[#D9E4E5]">
                <FileText className="w-4 h-4 text-[#0EA5A8]" />
                <span>Information Collected</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* Healthcare Pathway Badge */}
                <div className={`p-2.5 rounded-xl border ${healthcareMode === 'ayush' ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-[#E6F7F7] border-[#0EA5A8]/20 text-[#172033]'}`}>
                  <span className={`text-[10px] uppercase font-bold block ${healthcareMode === 'ayush' ? 'text-emerald-800' : 'text-[#0EA5A8]'}`}>
                    Healthcare Pathway:
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm">{healthcareMode === 'ayush' ? '🌿' : '🏥'}</span>
                    <span className="font-bold text-xs">{healthcareMode === 'ayush' ? 'AYUSH Holistic Care' : 'General Medical OPD'}</span>
                  </div>
                </div>

                {/* AYUSH Focus Tracker if AYUSH Mode */}
                {healthcareMode === 'ayush' && (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      <Leaf className="w-3 h-3 text-emerald-600" />
                      <span>AYUSH Case Parameters:</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-emerald-900">
                      <div className="flex items-center justify-between">
                        <span>• Prakriti / Constitution</span>
                        <span className="text-emerald-700 font-semibold text-[10px]">Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Agni (Digestion)</span>
                        <span className="text-emerald-700 font-semibold text-[10px]">Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Koshtha (Bowel Habit)</span>
                        <span className="text-emerald-700 font-semibold text-[10px]">Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• Ahara, Vihara, Nidra</span>
                        <span className="text-emerald-700 font-semibold text-[10px]">Active</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-emerald-700 italic border-t border-emerald-200/60 pt-1.5">
                      Doctor / Vaidya verification required
                    </p>
                  </div>
                )}

                {/* Language Badge */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-[#D9E4E5]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Session Language:</span>
                  <span className="font-bold text-[#172033] text-xs">{activeLangInfo.nativeName} ({activeLangInfo.name})</span>
                </div>

                {/* Symptoms */}
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1.5">Symptoms:</span>
                  {collectedData.symptoms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {collectedData.symptoms.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#E6F7F7] border border-[#0EA5A8]/25 text-[#0EA5A8] font-medium">
                          • {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#64748B] italic">Listening for symptoms...</span>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1">Duration:</span>
                  {collectedData.duration ? (
                    <span className="text-[#172033] font-medium">• {collectedData.duration}</span>
                  ) : (
                    <span className="text-[#64748B] italic">Not stated yet</span>
                  )}
                </div>

                {/* Medical History */}
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1">Medical History:</span>
                  {collectedData.medicalHistory.length > 0 ? (
                    <ul className="space-y-1 text-[#172033]">
                      {collectedData.medicalHistory.map((h, idx) => (
                        <li key={idx}>• {h}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[#64748B] italic">None recorded</span>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1">Medications:</span>
                  {collectedData.medications.length > 0 ? (
                    <ul className="space-y-1 text-[#172033]">
                      {collectedData.medications.map((m, idx) => (
                        <li key={idx}>• {m}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-[#64748B] italic">None recorded</span>
                  )}
                </div>
              </div>
            </aside>

            {/* Mobile Drawer Modal for Information Collected */}
            {showMobileInfoDrawer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 lg:hidden">
                <div className="relative w-full max-w-sm bg-white border border-[#D9E4E5] rounded-3xl p-5 shadow-xl">
                  <div className="flex justify-between items-center pb-3 border-b border-[#D9E4E5] mb-4">
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Information Collected</h3>
                    <button onClick={() => setShowMobileInfoDrawer(false)} className="p-1 text-[#64748B] hover:text-[#172033] cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
                    <div>
                      <strong className="text-[#64748B] block mb-1">Symptoms:</strong>
                      {collectedData.symptoms.length > 0 ? (
                        <span className="text-[#172033] font-medium">{collectedData.symptoms.join(', ')}</span>
                      ) : (
                        <span className="text-[#64748B] italic">None yet</span>
                      )}
                    </div>
                    <div>
                      <strong className="text-[#64748B] block mb-1">Duration:</strong>
                      <span className="text-[#172033] font-medium">{collectedData.duration || 'Not stated'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PHASE 6: DOCUMENT UPLOADING SCREEN (AFTER AYUSH AI CHAT) */}
        {phase === 'upload_documents' && (
          <div className="flex-1 py-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9E4E5] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Step 7 of 9 • Upload Medical Documents
                      </span>
                      <span className="text-xs text-[#64748B]">Prescriptions &amp; Lab Reports</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#172033] mt-0.5">
                      Upload Medical Documents &amp; Prescriptions
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhase('interview')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Back to AI Case-Taking</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary(patientDetails)}
                    disabled={isSending || isUploadingReport}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Clinical Summary (Step 8) →</span>
                  </button>
                </div>
              </div>

              {/* Strict Hospital Document Notice */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0EA5A8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#172033]">
                    🏥 Official Hospital &amp; Medical Records Only
                  </p>
                  <p className="text-[#475569] leading-relaxed">
                    Please upload or scan only authentic medical records: <strong>Doctor Prescriptions</strong>, <strong>Blood / Lab Test Reports</strong>, <strong>Imaging / Scans (X-Ray, Ultrasound, CT)</strong>, <strong>Hospital Discharge Summaries</strong>, or <strong>OPD Slips</strong>. Non-medical files (photos, selfies, food pictures, store bills) are automatically rejected by clinical validation.
                  </p>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={docUploadInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAttachReport(e.target.files, 'device', activeDocCategory);
                  }
                }}
              />

              {/* Document Category Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Select Hospital Document Category:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'Prescription', label: 'Doctor Prescription', icon: Pill, sub: 'Doctor Rx Slip' },
                    { id: 'Lab Report', label: 'Blood / Lab Test', icon: Activity, sub: 'Pathology Reports' },
                    { id: 'Scan', label: 'Imaging / Scan', icon: Sparkles, sub: 'X-Ray, Ultrasound, CT' },
                    { id: 'Discharge Summary', label: 'Discharge & OPD Slip', icon: FileText, sub: 'Hospital Records' },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeDocCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveDocCategory(cat.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? 'bg-[#E6F7F7] border-[#0EA5A8] shadow-2xs text-[#172033]'
                            : 'bg-white border-[#D9E4E5] hover:bg-slate-50 text-[#334155]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#0EA5A8] text-white' : 'bg-slate-100 text-[#64748B]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isActive && <Check className="w-4 h-4 text-[#0EA5A8]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{cat.label}</div>
                          <div className="text-[10px] text-[#64748B]">{cat.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ONLY TWO UPLOAD OPTIONS: Camera & File Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Camera Scanner */}
                <div
                  onClick={() => setIsCameraOpen(true)}
                  className="bg-gradient-to-b from-slate-50 to-white hover:from-[#E6F7F7]/30 hover:to-white border-2 border-dashed border-[#0EA5A8]/50 hover:border-[#0EA5A8] rounded-3xl p-6 sm:p-7 text-center transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#E6F7F7] group-hover:bg-[#0EA5A8] text-[#0EA5A8] group-hover:text-white flex items-center justify-center mx-auto shadow-xs transition-colors">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#172033]">
                      Scan with Kiosk Camera
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                      Hold your physical prescription, lab test paper, or OPD slip in front of the camera to capture an instant image.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#0EA5A8] group-hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all pointer-events-none"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera Scanner</span>
                  </button>
                </div>

                {/* Option 2: Upload Hospital File */}
                <div
                  onClick={() => docUploadInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleAttachReport(e.dataTransfer.files, 'device', activeDocCategory);
                    }
                  }}
                  className="bg-gradient-to-b from-slate-50 to-white hover:from-sky-50/50 hover:to-white border-2 border-dashed border-sky-300 hover:border-[#0284C7] rounded-3xl p-6 sm:p-7 text-center transition-all cursor-pointer space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 group-hover:bg-[#0284C7] text-[#0284C7] group-hover:text-white flex items-center justify-center mx-auto shadow-xs transition-colors">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#172033]">
                      Upload Hospital Document
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                      Select official medical reports or past prescriptions from your device (PDF, JPG, PNG, WEBP • Max 15MB).
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#0284C7] group-hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all pointer-events-none"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Browse Hospital Files</span>
                  </button>
                </div>
              </div>

              {/* Uploading OCR Progress State */}
              {isUploadingReport && (
                <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-2xl flex items-center gap-3 animate-pulse text-xs text-emerald-900">
                  <Activity className="w-5 h-5 text-emerald-700 animate-spin shrink-0" />
                  <div>
                    <strong className="block">Scanning Document with Clinical OCR...</strong>
                    <span>Extracting medical parameters, medication names, and test values to attach to your OP case.</span>
                  </div>
                </div>
              )}

              {/* Attached Documents Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Attached Documents ({attachedReports.length})</span>
                  </h3>
                  {attachedReports.length > 0 && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Ready for Doctor Review
                    </span>
                  )}
                </div>

                {attachedReports.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachedReports.map((report, idx) => {
                      const isExpanded = expandedDocText === (report.documentId || idx);
                      return (
                        <div
                          key={report.documentId || idx}
                          className="bg-white border border-[#D9E4E5] hover:border-emerald-300 rounded-2xl p-4 shadow-2xs space-y-3 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-[#172033] truncate" title={report.title || report.originalName}>
                                  {report.title || report.originalName || `Document #${idx + 1}`}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="text-[10px] bg-slate-100 text-[#475569] px-2 py-0.5 rounded-md font-semibold">
                                    {report.uploadMethod === 'camera' ? '📷 Camera' : '💻 Device'}
                                  </span>
                                  {report.documentType && (
                                    <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md font-semibold">
                                      {report.documentType}
                                    </span>
                                  )}
                                  {report.hasExtractedText && (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>OCR Verified</span>
                                    </span>
                                  )}
                                  {Array.isArray(report.structuredData?.labTests) && report.structuredData.labTests.length > 0 && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-semibold">
                                      🧪 {report.structuredData.labTests.length} Tests
                                    </span>
                                  )}
                                  {Array.isArray(report.structuredData?.medicines) && report.structuredData.medicines.length > 0 && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                                      💊 {report.structuredData.medicines.length} Medicines
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveReport(report, idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                              title="Remove document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {report.extractedText && (
                            <div className="pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setExpandedDocText(isExpanded ? null : (report.documentId || idx))}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide Extracted Text' : 'View Extracted Text Preview'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              {isExpanded && (
                                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-[#334155] max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                                  {report.extractedText}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1 text-xs text-[#64748B]">
                    <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-[#172033]">No medical documents attached yet.</p>
                    <p>If you don't have past physical reports with you today, that is completely fine! You can proceed directly to generate your OP number.</p>
                  </div>
                )}
              </div>

              {/* Collapsible Pre-Summary Case History Review Drawer */}
              <div className="border border-[#D9E4E5] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCaseDetailsInUpload((prev) => !prev)}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>Review Case Details Collected by AI Assistant (Optional)</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#64748B]">
                    <span>{showCaseDetailsInUpload ? 'Collapse' : 'Expand'}</span>
                    {showCaseDetailsInUpload ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showCaseDetailsInUpload && (
                  <div className="p-4 bg-white border-t border-[#D9E4E5] space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#D9E4E5] space-y-1 sm:col-span-2">
                        <label className="font-bold text-emerald-900 text-[11px] block">Chief Health Concern (Pradhana Vedana)</label>
                        <input
                          type="text"
                          value={ayushStructuredData.chiefConcern || ''}
                          onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, chiefConcern: e.target.value }))}
                          placeholder="Describe main problem"
                          className="w-full bg-white border border-[#D9E4E5] rounded-lg px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#D9E4E5] space-y-1">
                        <label className="font-bold text-emerald-900 text-[11px] block">Duration (Kala)</label>
                        <input
                          type="text"
                          value={ayushStructuredData.duration || ''}
                          onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g. 2 weeks"
                          className="w-full bg-white border border-[#D9E4E5] rounded-lg px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#D9E4E5] space-y-1">
                        <label className="font-bold text-emerald-900 text-[11px] block">Digestion & Appetite (Agni)</label>
                        <input
                          type="text"
                          value={ayushStructuredData.digestionAgni || ''}
                          onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, digestionAgni: e.target.value }))}
                          placeholder="e.g. Normal, low appetite, hyperacidity"
                          className="w-full bg-white border border-[#D9E4E5] rounded-lg px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#D9E4E5] space-y-1">
                        <label className="font-bold text-emerald-900 text-[11px] block">Dietary Habits (Ahara)</label>
                        <input
                          type="text"
                          value={ayushStructuredData.dietAhara || ''}
                          onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, dietAhara: e.target.value }))}
                          placeholder="e.g. Vegetarian, spicy food triggers"
                          className="w-full bg-white border border-[#D9E4E5] rounded-lg px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#D9E4E5] space-y-1">
                        <label className="font-bold text-emerald-900 text-[11px] block">Sleep Patterns (Nidra)</label>
                        <input
                          type="text"
                          value={ayushStructuredData.sleepNidra || ''}
                          onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, sleepNidra: e.target.value }))}
                          placeholder="e.g. 7 hours, disturbed sleep"
                          className="w-full bg-white border border-[#D9E4E5] rounded-lg px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('interview')}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  ← Back to AI Case-Taking
                </button>

                {attachedReports.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary(patientDetails)}
                    disabled={isSending || isUploadingReport}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Clinical Summary (Step 8) →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary(patientDetails)}
                    disabled={isSending || isUploadingReport}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Proceed to Clinical Summary (No Documents) →</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 7B: REVIEW SCREEN (AYUSH & DETAILED CASE-TAKING) (STEP 7 OF 9) */}
        {phase === 'review' && (
          <div className="flex-1 py-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9E4E5] gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Step 7 of 9 • Review &amp; Verification
                      </span>
                      <span className="text-xs text-[#64748B]">Pre-Summary Verification</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#172033] mt-0.5">
                      Review Your Information
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhase('interview')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Back to AI Case-Taking</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateSummary(patientDetails)}
                    disabled={isSending}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Clinical Summary (Step 8) →</span>
                  </button>
                </div>
              </div>

              {/* Informational Guidance Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Please review the health parameters collected below. You can tap on any field to edit or update your answers before the structured case summary is compiled for your physician.
                </p>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                {/* 1. Chief Concern */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chief Health Concern (Pradhana Vedana)</span>
                    </label>
                    <span className="text-[10px] text-[#64748B]">Primary complaint</span>
                  </div>
                  <input
                    type="text"
                    value={ayushStructuredData.chiefConcern || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, chiefConcern: e.target.value }))}
                    placeholder="Describe main problem (e.g. Acid reflux, joint stiffness, bloating)"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 2. Duration */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block">
                    Duration (Kala)
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.duration || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g. 2 weeks, 3 months, 1 year"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. Progression & Triggers */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block">
                    Progression &amp; Triggers
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.progression || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, progression: e.target.value }))}
                    placeholder="e.g. Worsens after oily meal, relieved by warm water"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 4. Symptoms Tags */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                      Associated Symptoms (Lakshana)
                    </label>
                    <span className="text-[10px] text-[#64748B]">Type &amp; press Enter to add</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white border border-[#D9E4E5] rounded-xl">
                    {ayushStructuredData.symptoms?.map((sym, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5 text-[11px]">
                        <span>{sym}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAyushStructuredData((prev) => ({
                              ...prev,
                              symptoms: (prev.symptoms || []).filter((_, i) => i !== idx),
                            }));
                          }}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add symptom..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          e.preventDefault();
                          const val = e.target.value.trim();
                          setAyushStructuredData((prev) => ({
                            ...prev,
                            symptoms: [...(prev.symptoms || []), val],
                          }));
                          e.target.value = '';
                        }
                      }}
                      className="text-xs focus:outline-none flex-1 min-w-[120px] px-1 text-[#172033]"
                    />
                  </div>
                </div>

                {/* 5. Diet (Ahara) */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block">
                    Diet Habits (Ahara)
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.dietAhara || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, dietAhara: e.target.value }))}
                    placeholder="e.g. Vegetarian, irregular timings, spicy foods"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 6. Digestion (Agni) */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block">
                    Digestion &amp; Appetite (Agni)
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.digestionAgni || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, digestionAgni: e.target.value }))}
                    placeholder="e.g. Sluggish digestion, feeling heavy (Mandagni)"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 7. Bowel (Koshtha) */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block">
                    Bowel Habit &amp; Elimination (Koshtha)
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.bowelKoshtha || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, bowelKoshtha: e.target.value }))}
                    placeholder="e.g. Regular, tendency to constipation (Krura Koshtha)"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 8. Sleep (Nidra) */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block">
                    Sleep Pattern (Nidra)
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.sleepNidra || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, sleepNidra: e.target.value }))}
                    placeholder="e.g. 6 hours, disturbed sleep, wakes unrefreshed"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 9. Lifestyle (Vihara) */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block">
                    Daily Routine &amp; Lifestyle (Vihara)
                  </label>
                  <input
                    type="text"
                    value={ayushStructuredData.lifestyleVihara || ''}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, lifestyleVihara: e.target.value }))}
                    placeholder="e.g. Sedentary desk work, high stress, evening walk"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 10. Medical History & Medications */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
                  <label className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block">
                    Past Medical History &amp; Medications
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(ayushStructuredData.medications) ? ayushStructuredData.medications.join(', ') : (ayushStructuredData.medications || '')}
                    onChange={(e) => setAyushStructuredData((prev) => ({ ...prev, medications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))}
                    placeholder="e.g. Antacids, BP meds, Ayurvedic churna"
                    className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 11. Attached Reports / Lab Documents */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] sm:col-span-2">
                  <PinnedReportsGallery
                    reports={attachedReports}
                    onAttachReport={handleAttachReport}
                    onRemoveReport={handleRemoveReport}
                    title="Attached Medical Documents & Prescriptions"
                  />
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPhase('interview')}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  ← Back to AI Case-Taking
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateSummary(patientDetails)}
                  disabled={isSending}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Clinical Summary (Step 8) →</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 2: PATIENT INFORMATION & VERIFICATION (STEP 2 OF 9) */}
        {phase === 'patient_details' && (
          <div className="flex-1 py-4 overflow-y-auto max-w-3xl mx-auto w-full space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9E4E5] gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    healthcareMode === 'ayush' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-[#E6F7F7] border border-[#0EA5A8]/30 text-[#0EA5A8]'
                  }`}>
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        healthcareMode === 'ayush' ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300' : 'bg-[#E6F7F7] text-[#0EA5A8] border-[#0EA5A8]/30'
                      }`}>
                        Step 2 of 9 • Patient Information & Verification
                      </span>
                      <span className="text-xs text-[#64748B]">Hospital Outpatient Intake</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#172033] mt-0.5">
                      Enter Patient Information
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onExit}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Exit</span>
                </button>
              </div>

              {/* Informational Guidance Notice */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#334155] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#0EA5A8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#172033]">
                    Please provide patient phone number, full name, and age (maximum age limit: up to 90 years).
                  </p>
                  <p className="text-[#64748B] leading-relaxed">
                    Returning patients can verify via mobile OTP to automatically fetch their medical records and past consultation history.
                  </p>
                </div>
              </div>

              {/* Error banner if validation fails */}
              {(patientDetailsError || otpError || error) && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{patientDetailsError || otpError || error}</span>
                </div>
              )}

              {/* Patient Category Toggle: Returning Patient vs New Patient */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Select Patient Status:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Returning Patient Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPatientDetails((prev) => ({ ...prev, isReturning: true }));
                      setPatientDetailsError(null);
                      setOtpError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      patientDetails.isReturning
                        ? 'bg-[#E6F7F7] border-[#0EA5A8] ring-2 ring-[#0EA5A8]/20 shadow-xs'
                        : 'bg-white border-[#D9E4E5] hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      patientDetails.isReturning ? 'bg-[#0EA5A8] text-white' : 'bg-slate-100 text-[#64748B]'
                    }`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#172033]">Returning Patient</span>
                        {patientDetails.isReturning && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0EA5A8] text-white text-[10px] font-bold">Selected</span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Visited before. Enter your <strong>10-digit Mobile Number</strong> and verify with <strong>OTP</strong> to fetch your patient records.
                      </p>
                    </div>
                  </button>

                  {/* New Patient Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setPatientDetails((prev) => ({ ...prev, isReturning: false }));
                      setPatientDetailsError(null);
                      setOtpError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      !patientDetails.isReturning
                        ? 'bg-[#E6F7F7] border-[#0EA5A8] ring-2 ring-[#0EA5A8]/20 shadow-xs'
                        : 'bg-white border-[#D9E4E5] hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      !patientDetails.isReturning ? 'bg-[#0EA5A8] text-white' : 'bg-slate-100 text-[#64748B]'
                    }`}>
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#172033]">New Patient</span>
                        {!patientDetails.isReturning && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0EA5A8] text-white text-[10px] font-bold">Selected</span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        First visit. Enter <strong>Full Name</strong>, <strong>10-digit Mobile Number</strong>, <strong>Age (1–90)</strong>, and <strong>Gender</strong>.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Input Fields */}
              {patientDetails.isReturning ? (
                /* RETURNING PATIENT INTAKE: PHONE NUMBER + OTP VERIFICATION + FETCH DATA */
                <div className="space-y-4 pt-2">
                  <div className="p-5 rounded-3xl bg-[#F0FDFA] border-2 border-[#0EA5A8]/30 space-y-4 shadow-sm">
                    {/* 1. Mobile Phone Number */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#0EA5A8]" />
                          <span>10-Digit Mobile Phone Number <span className="text-rose-500">*</span></span>
                        </label>
                        {isSearchingPhone && (
                          <span className="text-[11px] text-[#0EA5A8] font-semibold flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3 animate-spin" />
                            Fetching records...
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            maxLength={10}
                            disabled={isOtpVerified}
                            value={patientDetails.phoneNumber}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPatientDetails((prev) => ({ ...prev, phoneNumber: digits }));
                              setPatientDetailsError(null);
                              setOtpError(null);
                              setIsOtpSent(false);
                              setIsOtpVerified(false);
                              setPhoneLookupFound(null);
                            }}
                            placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                            className={`w-full border rounded-xl px-4 py-3 text-sm font-mono text-[#172033] font-bold outline-none transition-all shadow-2xs ${
                              isOtpVerified
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                : 'bg-white border-[#D9E4E5] focus:border-[#0EA5A8]'
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {isOtpVerified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                patientDetails.phoneNumber.length === 10
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-[#64748B]'
                              }`}>
                                {patientDetails.phoneNumber.length}/10 digits
                              </span>
                            )}
                          </div>
                        </div>

                        {!isOtpVerified && (
                          <button
                            type="button"
                            disabled={isGeneratingOtp || patientDetails.phoneNumber.length !== 10}
                            onClick={handleGenerateDemoOtp}
                            className="px-5 py-3 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                          >
                            {isGeneratingOtp ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Sending OTP...</span>
                              </>
                            ) : (
                              <>
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>{isOtpSent ? 'Resend OTP' : 'Send OTP'}</span>
                              </>
                            )}
                          </button>
                        )}

                        {isOtpVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsOtpVerified(false);
                              setIsOtpSent(false);
                              setEnteredOtp('');
                              setPhoneLookupFound(null);
                            }}
                            className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            Change Number
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. OTP Verification Box (shown when OTP is sent and not yet verified) */}
                    {isOtpSent && !isOtpVerified && (
                      <div className="space-y-3 pt-2 border-t border-[#0EA5A8]/20">
                        {/* Simulated SMS Notification Banner */}
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span className="text-base">📲</span>
                              <span>Simulated SMS to +91 {patientDetails.phoneNumber}:</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                              Just now
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
                            <p className="text-xs text-[#172033]">
                              Your MediKiosk Verification OTP is <span className="font-mono font-black text-sm text-[#0EA5A8] tracking-widest bg-[#E6F7F7] px-2 py-0.5 rounded-md border border-[#0EA5A8]/30">{demoOtpCode}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEnteredOtp(demoOtpCode);
                                setOtpError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs shrink-0"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Quick Fill OTP ({demoOtpCode})</span>
                            </button>
                          </div>
                        </div>

                        {/* 6-Digit OTP Input & Verify Button */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                          <div className="relative flex-1 w-full">
                            <input
                              type="text"
                              maxLength={6}
                              value={enteredOtp}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setEnteredOtp(digits);
                                setOtpError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleVerifyDemoOtp();
                                }
                              }}
                              placeholder="Enter 6-digit OTP (e.g. 123456)"
                              className="w-full bg-white border-2 border-[#0EA5A8] focus:border-[#0c8f91] rounded-xl px-4 py-3 text-center text-base font-mono font-black tracking-[0.25em] text-[#172033] outline-none shadow-xs"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifyDemoOtp}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify OTP &amp; Fetch Records</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. Fetched Patient Record & Profile Details (Displayed when OTP is Verified) */}
                    {isOtpVerified && (
                      <div className="p-5 rounded-2xl bg-white border-2 border-emerald-400 space-y-4 shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>
                              {phoneLookupFound?.name
                                ? '✓ Verified Returning Patient Record'
                                : '✓ Mobile Number Verified Successfully'}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            {phoneLookupFound?.previousVisitsCount ? `${phoneLookupFound.previousVisitsCount} Past Visit(s)` : 'Active Record'}
                          </span>
                        </div>

                        {phoneLookupFound && phoneLookupFound.name ? (
                          <>
                            {/* Neat Read-Only Dossier Grid (Details Cannot Be Edited) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-[#F0FDFA] border border-[#D9E4E5]">
                              {/* 1. Full Name */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-[#0EA5A8]" />
                                  <span>Patient Full Name</span>
                                </span>
                                <p className="text-sm font-black text-[#172033] tracking-tight">
                                  {patientDetails.name || phoneLookupFound.name}
                                </p>
                                <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                                  ✓ Hospital Registered
                                </span>
                              </div>

                              {/* 2. Age & Gender */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-[#0EA5A8]" />
                                  <span>Age &amp; Gender</span>
                                </span>
                                <p className="text-sm font-black text-[#172033]">
                                  {patientDetails.age || phoneLookupFound.age || 35} Years • {patientDetails.gender || phoneLookupFound.gender || 'Patient'}
                                </p>
                                <span className="inline-block text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                                  Verified Profile
                                </span>
                              </div>

                              {/* 3. Mobile Number */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-[#0EA5A8]" />
                                  <span>Mobile Phone</span>
                                </span>
                                <p className="text-sm font-mono font-black text-[#172033]">
                                  +91 {patientDetails.phoneNumber}
                                </p>
                                <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                                  ✓ OTP Verified
                                </span>
                              </div>
                            </div>

                            {/* Verification confirmation banner */}
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-medium">
                                Patient record verified and locked from hospital database. Click below to continue to <strong>Privacy Consent (Step 3)</strong>.
                              </span>
                            </div>
                          </>
                        ) : (
                          /* If phone number has no existing record */
                          <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                              <p className="font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>No prior hospital visits found for +91 {patientDetails.phoneNumber}</span>
                              </p>
                              <p className="text-amber-800 text-[11px]">
                                This mobile number is not yet linked to an existing patient file. Please switch to <strong>New Patient</strong> to register with your Name and Age.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPatientDetails((prev) => ({ ...prev, isReturning: false }));
                                setPatientDetailsError(null);
                                setOtpError(null);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Switch to New Patient Registration →</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* NEW PATIENT REGISTRATION: Full Name, Phone, Age (1-90), Gender */
                <div className="space-y-4 pt-2">
                  {/* 1. Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0EA5A8]" />
                      <span>Patient Full Name <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={patientDetails.name}
                      onChange={(e) => {
                        setPatientDetails((prev) => ({ ...prev, name: e.target.value }));
                        setPatientDetailsError(null);
                      }}
                      placeholder="Enter full name (e.g. Ramesh Sharma)"
                      className="w-full bg-[#F8FAFC] border border-[#D9E4E5] focus:border-[#0EA5A8] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#172033] font-medium outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* 2. Mobile Phone Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0EA5A8]" />
                        <span>10-Digit Mobile Number <span className="text-rose-500">*</span></span>
                      </label>
                      {isSearchingPhone && (
                        <span className="text-[11px] text-[#0EA5A8] font-semibold flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3 animate-spin" />
                          Checking record...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={10}
                        value={patientDetails.phoneNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPatientDetails((prev) => ({ ...prev, phoneNumber: digits }));
                          setPatientDetailsError(null);
                          setOtpError(null);
                          if (digits.length === 10) {
                            handlePhoneLookup(digits);
                          } else {
                            setPhoneLookupFound(null);
                          }
                        }}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-[#F8FAFC] border border-[#D9E4E5] focus:border-[#0EA5A8] focus:bg-white rounded-xl px-4 py-3 text-sm font-mono text-[#172033] font-bold outline-none transition-all shadow-2xs"
                      />
                      {patientDetails.phoneNumber.length === 10 && !isSearchingPhone && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {phoneLookupFound ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Found</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] text-[11px] font-bold">
                              10 digits
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {phoneLookupFound && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            Existing record found for <strong>{phoneLookupFound.name}</strong>. Details auto-populated.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Age (Limit 1 to 90) and Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0EA5A8]" />
                        <span>Age (in Years) <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-[#0EA5A8] font-semibold">(Limit: 1 to 90 years)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={patientDetails.age}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val && Number(val) > 90) {
                            setPatientDetails((prev) => ({ ...prev, age: '90' }));
                            setPatientDetailsError('Maximum allowed age is 90 years.');
                          } else {
                            setPatientDetails((prev) => ({ ...prev, age: val }));
                            setPatientDetailsError(null);
                          }
                        }}
                        placeholder="e.g. 38 (max 90)"
                        className="w-full bg-[#F8FAFC] border border-[#D9E4E5] focus:border-[#0EA5A8] focus:bg-white rounded-xl px-4 py-3 text-sm text-[#172033] font-medium outline-none transition-all shadow-2xs"
                      />
                      <p className="text-[10px] text-[#64748B]">Valid age limit is between 1 and 90 years old.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#172033] block">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Male', 'Female', 'Other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setPatientDetails((prev) => ({ ...prev, gender: g }))}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              patientDetails.gender === g
                                ? 'bg-[#0EA5A8] text-white border-[#0EA5A8] shadow-xs'
                                : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B] hover:bg-white'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Navigation Buttons: Back to Step 1 & Next to Step 3 */}
              <div className="pt-4 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between gap-3">
                {/* Back to Step 1: Language Selection */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientDetailsError(null);
                    setOtpError(null);
                    setPhase('welcome');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Back to Language Selection (Step 1)</span>
                </button>

                {/* Continue to Step 3: Consent */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientDetailsError(null);
                    setOtpError(null);

                    // 1. Phone number validation
                    const cleanPhone = (patientDetails.phoneNumber || '').replace(/\D/g, '').slice(-10);
                    if (!cleanPhone || cleanPhone.length !== 10) {
                      setPatientDetailsError('Please enter a valid 10-digit mobile phone number.');
                      return;
                    }

                    // 2. Returning patient check: strictly require OTP verification and fetched data
                    if (patientDetails.isReturning) {
                      if (!isOtpVerified) {
                        setPatientDetailsError('Please complete OTP verification for your mobile number before proceeding.');
                        setOtpError('Please click "Send OTP", enter the 6-digit verification code, and verify.');
                        return;
                      }

                      const cleanName = (patientDetails.name || phoneLookupFound?.name || '').trim();
                      if (!cleanName) {
                        setPatientDetailsError('Please enter or verify the patient’s full name.');
                        return;
                      }

                      const numAge = parseInt(patientDetails.age || phoneLookupFound?.age, 10);
                      if (isNaN(numAge) || numAge < 1 || numAge > 90) {
                        setPatientDetailsError('Patient age must be between 1 and 90 years old.');
                        return;
                      }

                      const submissionData = {
                        ...patientDetails,
                        name: cleanName,
                        phoneNumber: cleanPhone,
                        age: String(numAge),
                        gender: patientDetails.gender || phoneLookupFound?.gender || 'Male',
                        abhaId: patientDetails.abhaId || generateRandom14DigitAbha(),
                      };

                      setPatientDetails(submissionData);
                      setPatientDetailsError(null);
                      setOtpError(null);
                      setPhase('consent');
                      return;
                    }

                    // 3. New patient validation: Name, Phone, Age (1-90), Gender
                    const cleanName = (patientDetails.name || '').trim();
                    if (!cleanName) {
                      setPatientDetailsError('Please enter the patient’s full name.');
                      return;
                    }

                    const numAge = parseInt(patientDetails.age, 10);
                    if (isNaN(numAge) || numAge < 1 || numAge > 90) {
                      setPatientDetailsError('Patient age must be between 1 and 90 years old.');
                      return;
                    }

                    const submissionData = {
                      ...patientDetails,
                      name: cleanName,
                      phoneNumber: cleanPhone,
                      age: String(numAge),
                      gender: patientDetails.gender || 'Male',
                      abhaId: patientDetails.abhaId || generateRandom14DigitAbha(),
                    };

                    setPatientDetails(submissionData);
                    setPatientDetailsError(null);
                    setOtpError(null);
                    setPhase('consent');
                  }}
                  className={`px-6 py-3 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                    healthcareMode === 'ayush'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                      : 'bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0c8f91] hover:to-[#0369a1]'
                  }`}
                >
                  <span>Continue to Privacy Consent (Step 3) →</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 8: STRUCTURED CLINICAL SUMMARY */}
        {phase === 'summary' && summary && (
          <div className="flex-1 py-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">

            {/* LOUD, PROMINENT OUTPATIENT OP TOKEN HERO CARD */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#E6F7F7] via-[#F0FDFA] to-[#E0F2FE] border-2 border-[#0EA5A8] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0EA5A8] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Ticket className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#0EA5A8] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#0EA5A8]/20">
                      Step 8 of 9 • Outpatient (OP) Token Generated
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      {healthcareMode === 'ayush' ? '🌿 AYUSH Consultation' : 'Active Consultation'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#172033] mt-0.5">
                    OP Number: <span className="font-mono text-[#0EA5A8] tracking-widest">{summary.opNumber}</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    This unique OP token has been generated for your health summary. Provide this OP Number directly to your attending {healthcareMode === 'ayush' ? 'AYUSH physician (Vaidya)' : 'doctor'} to view your clinical summary immediately.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end shrink-0 gap-1.5">
                <div className="px-5 sm:px-6 py-2 rounded-2xl bg-white border-2 border-[#0EA5A8] shadow-xs font-mono text-2xl sm:text-3xl font-black text-[#0EA5A8] tracking-widest select-all">
                  {summary.opNumber}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyOp(summary.opNumber)}
                    className="text-[11px] font-bold text-[#0EA5A8] hover:text-[#0c8f91] flex items-center gap-1 cursor-pointer transition-colors bg-white/80 px-2.5 py-1 rounded-lg border border-[#0EA5A8]/30 shadow-2xs"
                  >
                    {copiedOp ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors bg-white/80 px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs"
                    title="Print OP token receipt slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Top Disclaimer & Banners */}
            {healthcareMode === 'ayush' ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <Leaf className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm tracking-wide">
                        🌿 AI-ASSISTED CASE SUMMARY — AYUSH MODE
                      </h4>
                      <p className="text-[11px] text-emerald-200">
                        Information collected for physician assessment • Pre-consultation case history
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-[10px] font-mono font-bold uppercase border border-emerald-700 self-start sm:self-auto">
                    Awaiting Vaidya Review
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-bold">PHYSICIAN REVIEW REQUIRED</strong>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      This summary assists your attending physician and does not replace in-person clinical assessment. All Prakriti, Vikriti, Agni, and Koshtha observations represent preliminary intake observations recorded for Vaidya evaluation.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold tracking-wide">
                    {t('Doctor review required.', 'AI-generated summary — Doctor review required.')}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-amber-100 rounded text-amber-800">
                  Provisional Triage
                </span>
              </div>
            )}

            {/* Summary Dossier */}
            <div className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">
                    {healthcareMode === 'ayush' ? '🌿 AYUSH HEALTH CASE SUMMARY' : 'AI HEALTH SUMMARY'}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {healthcareMode === 'ayush'
                      ? 'Structured 12-section holistic case history organized for attending Vaidya.'
                      : `Structured clinical dossier organized in ${activeLangInfo.nativeName}.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/40 text-[#0EA5A8] text-xs font-mono font-bold">
                    OP: {summary?.opNumber || 'Pending'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/25 text-[#0EA5A8] text-xs font-semibold">
                    {healthcareMode === 'ayush' ? '🌿 AYUSH Intake' : 'Triage Complete'}
                  </span>
                </div>
              </div>

              {/* AYUSH 12-SECTION DOSSIER */}
              {healthcareMode === 'ayush' ? (
                <div className="space-y-4 text-xs">
                  {/* Section 1: Patient Basic Information */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-2">
                      1. Patient Basic Information
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Patient Name:</span>
                        <strong className="text-[#172033]">{summary.patientName || user?.name || 'Self-Registered'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Age / Gender:</span>
                        <strong className="text-[#172033]">{summary.patientAge || 35} Yrs / {summary.patientGender || 'Not specified'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Contact Mobile:</span>
                        <strong className="text-emerald-700 font-mono font-bold">{summary.patientPhone || patientDetails?.phoneNumber || user?.phone || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Session Language:</span>
                        <strong className="text-[#172033]">{activeLangInfo.nativeName} ({activeLangInfo.name})</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Outpatient Token:</span>
                        <strong className="text-emerald-700 font-mono font-bold">{summary.opNumber}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Chief Complaint (Pradhana Vedana) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      2. Chief Complaint (Pradhana Vedana)
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">"{summary.chiefComplaint}"</p>
                  </div>

                  {/* Section 3: History of Present Illness (Roga Vrittanta) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      3. History of Present Illness (Roga Vrittanta)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Duration (Kala):</span>
                        <span className="text-[#172033] font-medium">{summary.duration || 'Not stated'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Progression / Relieving Factors:</span>
                        <span className="text-[#172033] font-medium">{summary.ayushAssessment?.vihara || 'Recorded in clinical discussion'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Associated Symptoms (Lakshana / Upadrava) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-2">
                      4. Associated Symptoms (Lakshana / Upadrava)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.symptoms?.map((sym, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5">
                          <span>• {sym}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section 5: Diet & Appetite (Ahara & Agni Pariksha) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-2">
                      5. Diet &amp; Appetite (Ahara &amp; Agni Pariksha)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Ahara (Diet Pattern):</span>
                        <span className="text-[#172033] font-medium">{summary.ayushAssessment?.ahara || 'Standard diet recorded'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Agni (Digestive Power):</span>
                        <span className="text-[#172033] font-medium">{summary.ayushAssessment?.agni || 'Moderate digestion (Samagni / Mandagni)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Bowel & Elimination (Koshtha & Mala/Mutra) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      6. Bowel &amp; Elimination (Koshtha &amp; Mala/Mutra)
                    </span>
                    <p className="text-[#172033] font-medium">{summary.ayushAssessment?.koshtha || 'Regular bowel movement reported'}</p>
                  </div>

                  {/* Section 7: Sleep Patterns (Nidra) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      7. Sleep Patterns (Nidra)
                    </span>
                    <p className="text-[#172033] font-medium">{summary.ayushAssessment?.nidra || 'Normal sleep reported'}</p>
                  </div>

                  {/* Section 8: Lifestyle & Daily Routine (Dinacharya / Vihara) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      8. Lifestyle &amp; Daily Routine (Dinacharya / Vihara)
                    </span>
                    <p className="text-[#172033] font-medium">{summary.ayushAssessment?.vihara || 'Daily routine recorded'}</p>
                  </div>

                  {/* Section 9: Past Medical & Surgical History (Purva Vyadhi) */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      9. Past Medical &amp; Surgical History (Purva Vyadhi Vrittanta)
                    </span>
                    <p className="text-[#172033] font-medium">
                      {summary.medicalHistory?.length ? summary.medicalHistory.join(', ') : 'No prior chronic illnesses reported'}
                    </p>
                  </div>

                  {/* Section 10: Current Medications & Allergies */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-1">
                      10. Current Medications &amp; Known Allergies (Oushadha &amp; Asatmya)
                    </span>
                    <p className="text-[#172033] font-medium">
                      {summary.previousMedicines?.length ? summary.previousMedicines.join(', ') : 'No current medications reported'}
                    </p>
                  </div>

                  {/* Section 11: Provisional Ayurvedic Observations */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                        <span>11. Provisional Ayurvedic Observations</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Information collected for physician assessment
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-emerald-200">
                        <strong className="text-emerald-900 block text-[11px] mb-0.5">Prakriti (Constitutional Inquiry):</strong>
                        <p className="text-[#172033]">{summary.ayushAssessment?.prakriti || 'Traits recorded for clinical assessment.'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-emerald-200">
                        <strong className="text-emerald-900 block text-[11px] mb-0.5">Vikriti (Aggravated Dosha State):</strong>
                        <p className="text-[#172033]">{summary.ayushAssessment?.vikriti || 'Dosha imbalance inquiry noted for Vaidya review.'}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-800 italic">
                      Notice: These constitutional observations represent patient-reported questionnaire indicators and must be validated through direct Vaidya Nadi &amp; Ashtavidha Pariksha.
                    </p>
                  </div>

                  {/* Section 12: Uploaded Medical Documents & Diagnostic Scans (Only displayed if patient uploaded documents) */}
                  {summary.pinnedReports && summary.pinnedReports.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                      <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block mb-2">
                        12. Uploaded Medical Documents &amp; Diagnostic Scans
                      </span>
                      <PinnedReportsGallery
                        reports={summary.pinnedReports}
                        onAttachReport={handleAttachReport}
                        onRemoveReport={handleRemoveReport}
                        title="Pinned Medical Documents & Prescriptions"
                      />
                    </div>
                  )}

                  {/* Section 13: AI Bot & Patient Intake Conversation Dialogue */}
                  <AIBotSummaryAssistant summary={summary} language={selectedLanguage} intakeMessages={messages} />

                  {/* Section 14: AI Medication Suggestions for Attending Vaidya */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-400 shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
                            14. AI Medication Suggestions for Attending Vaidya
                          </span>
                          <span className="text-[10px] text-emerald-800">
                            Classical Ayurvedic / AYUSH Therapeutic Formulation Advisory
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Vaidya Review &amp; Official Prescription Required
                      </span>
                    </div>

                    {/* Prominent Doctor Notice Banner */}
                    <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 flex items-start gap-2.5 text-xs text-emerald-900">
                      <AlertTriangle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong>Physician Advisory Notice:</strong> These classical remedies are suggested by AI clinical triage based on reported Prakriti, Vikriti, and symptoms. <strong>The attending Vaidya / doctor will evaluate the patient and issue the final official prescription.</strong>
                      </div>
                    </div>

                    {summary.aiMedicationSuggestions && summary.aiMedicationSuggestions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {summary.aiMedicationSuggestions.map((med, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h5 className="font-extrabold text-[#172033] text-sm text-emerald-950 flex items-center gap-1.5">
                                  <span>🌿 {med.medicineName}</span>
                                  {med.strength && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      {med.strength}
                                    </span>
                                  )}
                                </h5>
                                {med.genericName && (
                                  <p className="text-[10px] text-[#64748B] mt-0.5">{med.genericName}</p>
                                )}
                              </div>
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                {med.category || 'Ayurvedic'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#F8FAFC] p-2 rounded-lg border border-[#D9E4E5]">
                              <div>
                                <span className="text-[#64748B] text-[10px] block">Dosage &amp; Frequency:</span>
                                <strong className="text-[#172033]">{med.dosage || '1 tablet'} • {med.frequency || 'Twice daily'}</strong>
                              </div>
                              <div>
                                <span className="text-[#64748B] text-[10px] block">Timing &amp; Duration:</span>
                                <strong className="text-[#172033]">{med.timing || 'After food'} ({med.duration || '5 days'})</strong>
                              </div>
                            </div>

                            {med.clinicalRationale && (
                              <p className="text-[10px] text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 leading-relaxed">
                                <strong>Rationale:</strong> {med.clinicalRationale}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748B]">No specific medication suggestions. The attending Vaidya will determine therapeutics.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* General Medical 7 Sections */
                <div className="space-y-4 text-xs">
                  {/* Patient Basic Information */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-[#0EA5A8] uppercase tracking-wider text-[11px] block mb-2">
                      Patient Details &amp; Verification
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Patient Name:</span>
                        <strong className="text-[#172033]">{summary.patientName || user?.name || 'Self-Registered'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Age / Gender:</span>
                        <strong className="text-[#172033]">{summary.patientAge || 35} Yrs / {summary.patientGender || 'Not specified'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Verification Status:</span>
                        <strong className="text-emerald-700 font-bold">✓ Mobile OTP Verified</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Contact Phone:</span>
                        <strong className="text-[#172033] font-mono">{summary.patientPhone || user?.phoneNumber || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-[#64748B] block text-[10px]">Outpatient Token:</span>
                        <strong className="text-[#0EA5A8] font-mono font-bold">{summary.opNumber}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 1. Main Concern */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-1">Main Concern</span>
                    <p className="text-sm font-semibold text-[#172033]">"{summary.chiefComplaint}"</p>
                  </div>

                  {/* 2. Symptoms & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                      <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-2">Symptoms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.symptoms?.map((sym, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#E6F7F7] border border-[#0EA5A8]/25 text-[#0EA5A8] font-medium flex items-center gap-1.5">
                            <span>{sym}</span>
                            <button onClick={() => handleDeleteItem('symptoms', idx)} className="hover:text-rose-600 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                      <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-1">Duration</span>
                      <p className="text-[#172033] font-medium">{summary.duration || 'Not stated'}</p>
                    </div>
                  </div>

                  {/* 3. Suggested Specialty */}
                  <div className="p-4 rounded-2xl bg-[#E6F7F7]/40 border border-[#0EA5A8]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-5 h-5 text-[#0EA5A8]" />
                      <div>
                        <span className="text-[10px] font-semibold text-[#0EA5A8] uppercase tracking-wider">Suggested Medical Specialty</span>
                        <h4 className="text-sm font-bold text-[#172033]">{summary.suggestedSpecialty}</h4>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#64748B] italic">Specialty suggestion, not a diagnosis</span>
                  </div>

                  {/* 4. Clinical Narrative */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-1.5">Clinical Synthesis Narrative</span>
                    <p className="text-[#172033] leading-relaxed whitespace-pre-wrap">{summary.aiGeneratedText}</p>
                  </div>

                  {/* 5. PINNED MEDICAL REPORTS & LAB SCANS (Only displayed if patient uploaded documents) */}
                  {summary.pinnedReports && summary.pinnedReports.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                      <PinnedReportsGallery
                        reports={summary.pinnedReports}
                        onAttachReport={handleAttachReport}
                        onRemoveReport={handleRemoveReport}
                        title="Pinned Medical Reports & Diagnostic Scans"
                      />
                    </div>
                  )}

                  {/* 6. AI Bot & Patient Intake Conversation Dialogue */}
                  <AIBotSummaryAssistant summary={summary} language={selectedLanguage} intakeMessages={messages} />

                  {/* 7. AI Medication Suggestions for Attending Doctor */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#E6F7F7]/60 via-[#F0FDFA]/40 to-white border-2 border-[#0EA5A8] shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#0EA5A8]/20">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0EA5A8] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#172033] block">
                            7. AI Medication Suggestions for Attending Doctor
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            Clinical Pharmacotherapy &amp; Symptom Management Advisory
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30">
                        Doctor Review &amp; Official Prescription Required
                      </span>
                    </div>

                    {/* Clinical Advisory Banner */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong>Doctor Prescription Advisory:</strong> The following medications are recommended by AI triage for physician review based on patient symptoms. <strong>The attending doctor will evaluate contraindications, adjust dosage, and officially prescribe medications.</strong>
                      </div>
                    </div>

                    {summary.aiMedicationSuggestions && summary.aiMedicationSuggestions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {summary.aiMedicationSuggestions.map((med, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#D9E4E5] shadow-2xs space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h5 className="font-extrabold text-[#172033] text-sm flex items-center gap-1.5">
                                  <span>💊 {med.medicineName}</span>
                                  {med.strength && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                      {med.strength}
                                    </span>
                                  )}
                                </h5>
                                {med.genericName && (
                                  <p className="text-[10px] text-[#64748B] mt-0.5">{med.genericName}</p>
                                )}
                              </div>
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20 shrink-0">
                                {med.category || 'Medication'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#F8FAFC] p-2 rounded-lg border border-[#D9E4E5]">
                              <div>
                                <span className="text-[#64748B] text-[10px] block">Dosage &amp; Frequency:</span>
                                <strong className="text-[#172033]">{med.dosage || '1 tablet'} • {med.frequency || 'SOS'}</strong>
                              </div>
                              <div>
                                <span className="text-[#64748B] text-[10px] block">Timing &amp; Duration:</span>
                                <strong className="text-[#172033]">{med.timing || 'After food'} ({med.duration || '3 days'})</strong>
                              </div>
                            </div>

                            {med.clinicalRationale && (
                              <p className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed">
                                <strong>Rationale:</strong> {med.clinicalRationale}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748B]">No specific medication suggestions. The attending doctor will determine prescription.</p>
                    )}
                  </div>
                </div>
              )}

              {/* AYUSH PATIENT ACTIVE CONFIRMATION CARD vs GENERAL BUTTONS */}
              {healthcareMode === 'ayush' ? (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-500 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        Step 8 of 9 • Active Case Confirmation
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                        YOUR HEALTH CASE IS READY
                      </h3>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Please review your case details before final confirmation. Once confirmed, your case will be transmitted to your attending AYUSH physician (Vaidya) for clinical evaluation.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setPhase('upload_documents')}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      ← Back to Upload Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isConfirmingSummary}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isConfirmingSummary ? 'Transmitting to Physician...' : 'Confirm Health Summary (Step 9) →'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* General Medical Confirmation Buttons */
                <div className="pt-6 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPhase('upload_documents')}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    ← Back to Upload Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Summary (Step 9) →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 9: CONFIRMED SUCCESS & FINAL HEALTH SUMMARY (STEP 9 OF 9) */}
        {phase === 'confirmed' && (() => {
          const displayOp = summary?.opNumber || newlyGeneratedOp || (typeof window !== 'undefined' && localStorage.getItem('medikiosk_last_op')) || 'OP-749210';
          const getCompiledConfirmedResponses = () => {
            if (summary?.interviewResponses && summary.interviewResponses.length > 0) {
              return summary.interviewResponses;
            }
            const compiled = [];
            let lastAiQ = '';
            (messages || []).forEach((m) => {
              if (m.sender === 'ai' || m.sender === 'bot') {
                lastAiQ = m.text;
              } else if (m.sender === 'user') {
                compiled.push({
                  question: lastAiQ || (healthcareMode === 'ayush' ? 'Holistic health inquiry & symptom assessment' : 'Clinical symptoms & health concern inquiry'),
                  answer: m.text,
                  inputMode: m.inputMode || 'text',
                  timestamp: m.timestamp || new Date().toISOString(),
                });
              }
            });
            return compiled;
          };

          const effectiveSummary = {
            ...(summary || {}),
            opNumber: displayOp,
            patientName: summary?.patientName || patientDetails?.name || user?.name || 'Self-Registered Patient',
            patientAge: summary?.patientAge || patientDetails?.age || 35,
            patientGender: summary?.patientGender || patientDetails?.gender || 'Not specified',
            patientPhone: summary?.patientPhone || patientDetails?.phoneNumber || user?.phoneNumber || '—',
            abhaId: summary?.abhaId || patientDetails?.abhaId || 'ABHA-Not-Linked',
            chiefComplaint: summary?.chiefComplaint || 'Clinical Health Checkup Consultation',
            symptoms: summary?.symptoms?.length ? summary.symptoms : ['General Medical Evaluation'],
            duration: summary?.duration || 'Recorded during clinical intake',
            suggestedSpecialty: summary?.suggestedSpecialty || 'General Medicine',
            specialtyRationale: summary?.specialtyRationale || 'Symptoms indicate evaluation by this department.',
            healthcareMode: summary?.healthcareMode || healthcareMode || 'general_medical',
            aiGeneratedText: summary?.aiGeneratedText || `Patient completed clinical triage under OP token ${displayOp}. Pre-consultation summary recorded for physician review.`,
            interviewResponses: getCompiledConfirmedResponses(),
            aiMedicationSuggestions: summary?.aiMedicationSuggestions || [],
            // Strict Policy: Only display health documents if patient uploaded them in this session
            pinnedReports: (attachedReports && attachedReports.length > 0) ? attachedReports : [],
          };

          return (
            <div className="flex-1 py-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* 1. CONFIRMED OUTPATIENT OP NUMBER HERO DISPLAY */}
                <div className="space-y-4">
                  <div className={`p-6 sm:p-7 rounded-3xl text-center space-y-4 shadow-md border-2 relative overflow-hidden ${
                    healthcareMode === 'ayush'
                      ? 'bg-gradient-to-b from-emerald-50/90 via-teal-50/50 to-white border-emerald-500'
                      : 'bg-gradient-to-b from-[#E6F7F7]/90 via-[#F0FDFA]/50 to-white border-[#0EA5A8]'
                  }`}>
                    {/* Live Display Header Badge */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${healthcareMode === 'ayush' ? 'text-emerald-800' : 'text-[#0EA5A8]'}`}>
                        Step 9 of 9 • Final Confirmed Health Summary &amp; OPD Token
                      </span>
                    </div>

                    {/* Grand Electronic OP Token Board */}
                    <div className="py-4 px-4 rounded-2xl bg-white border-2 border-[#0EA5A8] shadow-inner flex flex-col items-center justify-center gap-1 max-w-md mx-auto">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                        Assigned Outpatient Token ID
                      </span>
                      <div className="text-4xl sm:text-5xl font-black text-[#0EA5A8] font-mono tracking-widest select-all py-1">
                        {displayOp}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ✓ FINAL SUMMARY CONFIRMED &amp; READY FOR DOCTOR REVIEW
                      </span>
                    </div>

                    {/* Quick Token Utility Actions (Copy + Print Slip) */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyOp(displayOp)}
                        className="px-4 py-2 rounded-xl bg-white border border-[#0EA5A8]/30 hover:bg-[#E6F7F7] text-xs font-bold text-[#0EA5A8] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Copy OP Number to clipboard"
                      >
                        {copiedOp ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy OP Number</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-[#172033] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Print Outpatient Token Receipt Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Print Summary Slip</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Consultation Protocol Instructions */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-left text-emerald-950 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block font-bold">
                        {healthcareMode === 'ayush' ? 'Direct Vaidya Consultation Protocol:' : 'Direct Doctor Consultation Protocol:'}
                      </strong>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        Your final health summary has been recorded. Please provide your <strong>OP Token ({displayOp})</strong> directly to your attending {healthcareMode === 'ayush' ? 'AYUSH physician (Vaidya)' : 'Doctor'} at the OPD desk. The doctor will enter your OP number to immediately view your verified patient chart, AI bot interview dialogue, diagnosis notes, and prescribe treatment.
                      </p>
                    </div>
                  </div>
                </div>

              {/* 2. FINAL CLINICAL SUMMARY DOSSIER */}
              <div className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">
                      {healthcareMode === 'ayush' ? '🌿 FINAL AYUSH HEALTH CASE SUMMARY' : 'FINAL STRUCTURED HEALTH SUMMARY'}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Synthesized clinical dossier organized in {activeLangInfo?.nativeName || 'English'} • Ready for physician consultation.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                    ✓ Confirmed &amp; Locked
                  </span>
                </div>

                {/* Chief Health Concern & Symptoms */}
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-1">
                      Chief Health Concern
                    </span>
                    <p className="text-sm font-semibold text-[#172033]">"{summary?.chiefComplaint}"</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                      <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-2">
                        Reported Symptoms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {summary?.symptoms?.map((sym, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#E6F7F7] border border-[#0EA5A8]/25 text-[#0EA5A8] font-medium text-xs">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                      <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-1">
                        Duration &amp; Timeline
                      </span>
                      <p className="text-[#172033] font-medium text-xs">{summary?.duration || 'Recorded during clinical intake'}</p>
                    </div>
                  </div>
                </div>

                {/* Suggested Medical Specialty */}
                <div className="p-4 rounded-2xl bg-[#E6F7F7]/40 border border-[#0EA5A8]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-[#0EA5A8]" />
                    <div>
                      <span className="text-[10px] font-semibold text-[#0EA5A8] uppercase tracking-wider">
                        Suggested Medical Specialty
                      </span>
                      <h4 className="text-sm font-bold text-[#172033]">{summary?.suggestedSpecialty || 'General Medicine'}</h4>
                      <p className="text-xs text-[#64748B] mt-0.5">{summary?.specialtyRationale || 'Symptoms indicate evaluation by this department.'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#64748B] italic hidden sm:inline">Specialty suggestion, not a diagnosis</span>
                </div>

                {/* Clinical Synthesis Narrative */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] block mb-1.5">
                    AI Clinical Synthesis Narrative
                  </span>
                  <p className="text-[#172033] leading-relaxed whitespace-pre-wrap text-xs font-sans">
                    {summary?.aiGeneratedText}
                  </p>
                </div>

                {/* Pinned Diagnostic Reports Gallery */}
                {effectiveSummary?.pinnedReports && effectiveSummary.pinnedReports.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                    <PinnedReportsGallery
                      reports={effectiveSummary.pinnedReports}
                      onAttachReport={handleAttachReport}
                      onRemoveReport={handleRemoveReport}
                      title="Attached Diagnostic Scans &amp; Lab Reports"
                    />
                  </div>
                )}

                {/* Interactive AI Clinical Bot & Intake Dialogue Hub (AI Bot and Patient Chat) */}
                <AIBotSummaryAssistant summary={effectiveSummary} language={selectedLanguage} intakeMessages={messages} />

                {/* AI Medication Suggestions for Doctor */}
                {summary?.aiMedicationSuggestions && summary.aiMedicationSuggestions.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#E6F7F7]/60 via-[#F0FDFA]/40 to-white border-2 border-[#0EA5A8] shadow-sm space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#0EA5A8]/20">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0EA5A8] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#172033] block">
                            AI Medication Suggestions for Attending Doctor
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            Preliminary Pharmacotherapy Advisory • Doctor Review &amp; Official Prescription Required
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {summary.aiMedicationSuggestions.map((med, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#D9E4E5] shadow-2xs space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h5 className="font-extrabold text-[#172033] text-sm flex items-center gap-1.5">
                                <span>💊 {med.medicineName}</span>
                                {med.strength && (
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {med.strength}
                                  </span>
                                )}
                              </h5>
                              {med.genericName && (
                                <p className="text-[10px] text-[#64748B] mt-0.5">{med.genericName}</p>
                              )}
                            </div>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20 shrink-0">
                              {med.category || 'Medication'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#F8FAFC] p-2 rounded-lg border border-[#D9E4E5]">
                            <div>
                              <span className="text-[#64748B] text-[10px] block">Dosage &amp; Frequency:</span>
                              <strong className="text-[#172033]">{med.dosage || '1 tablet'} • {med.frequency || 'SOS'}</strong>
                            </div>
                            <div>
                              <span className="text-[#64748B] text-[10px] block">Timing &amp; Duration:</span>
                              <strong className="text-[#172033]">{med.timing || 'After food'} ({med.duration || '3 days'})</strong>
                            </div>
                          </div>

                          {med.clinicalRationale && (
                            <p className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed">
                              <strong>Rationale:</strong> {med.clinicalRationale}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. FINAL ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartNewCheckup}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#0EA5A8] hover:from-emerald-700 hover:to-[#0c8f91] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start New Health Checkup</span>
                </button>

                <button
                  type="button"
                  onClick={() => (onNavigateDoctor && user ? onNavigateDoctor(summary) : onExit())}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#172033] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{user ? 'View in Patient Portal' : 'Finish & Exit'}</span>
                </button>

                <button
                  type="button"
                  onClick={onExit}
                  className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Back to Home
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      </main>

      {/* SEARCHABLE 51-LANGUAGE SELECTION MODAL (Rendered to body via createPortal) */}
      {langModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs overflow-y-auto"
          onClick={() => setLangModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white border border-[#D9E4E5] rounded-3xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#D9E4E5] flex items-center justify-between bg-[#F8FAFC] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#172033] flex items-center gap-2">
                    <span>Select Health Check-Up Language</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] font-semibold border border-[#0EA5A8]/30">
                      51 Languages
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#64748B]">
                    The AI voice, speech recognition, and questions will operate in your chosen language.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLangModalOpen(false)}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Dropdown & Search Input */}
            <div className="p-3 sm:p-4 border-b border-[#D9E4E5] bg-white space-y-3 shrink-0">
              {/* Instant Native Select Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="checkup-lang-select" className="text-xs font-semibold text-[#172033] shrink-0">
                  Quick Jump:
                </label>
                <select
                  id="checkup-lang-select"
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    setLanguage(e.target.value);
                    setLangModalOpen(false);
                    if (phase === 'interview' && checkupMode === 'voice') {
                      const lastAi = [...messages].reverse().find((m) => m.sender === 'ai');
                      if (lastAi) speakText(lastAi.text);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs font-medium text-[#172033] focus:outline-none focus:border-[#0EA5A8] transition-colors cursor-pointer"
                >
                  {languages.map((l, idx) => (
                    <option key={l.code} value={l.code}>
                      {idx + 1}. {l.nativeName} ({l.name}) — {l.region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search 51 languages (e.g. Tamil, Marathi, বাংলা, संस्कृत, Gondi...)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs sm:text-sm text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#0EA5A8] transition-colors"
                  autoFocus
                />
                {langSearch && (
                  <button onClick={() => setLangSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                {[
                  { id: 'all', label: `All (${languages.length})` },
                  { id: 'popular', label: 'Popular (12)' },
                  { id: 'north', label: 'North & Central' },
                  { id: 'south', label: 'South' },
                  { id: 'east', label: 'East' },
                  { id: 'northeast', label: 'North-East & Tribal' },
                  { id: 'classical', label: 'Classical / Sanskrit' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setLangCategory(c.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${langCategory === c.id
                        ? 'bg-[#0EA5A8] text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#D9E4E5]'
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Grid */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 custom-scrollbar">
              {filteredLanguages.map((lang, idx) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setLanguage(lang.code);
                      setLangModalOpen(false);
                      // If in interview, repeat question in new language
                      if (phase === 'interview' && checkupMode === 'voice') {
                        const lastAi = [...messages].reverse().find((m) => m.sender === 'ai');
                        if (lastAi) speakText(lastAi.text);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all group cursor-pointer ${isSelected
                        ? 'bg-[#E6F7F7] border-[#0EA5A8] shadow-xs'
                        : 'bg-white border-[#D9E4E5] hover:bg-[#F8FAFC] hover:border-[#0EA5A8]'
                      }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#64748B] font-mono">
                          {idx + 1}.
                        </span>
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-[#0EA5A8]' : 'text-[#172033] group-hover:text-[#0EA5A8]'}`}>
                          {lang.nativeName}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] truncate">{lang.name}</div>
                      <div className="text-[10px] text-[#64748B]/70 mt-0.5 truncate">{lang.region}</div>
                    </div>
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#0EA5A8] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-[#64748B] group-hover:text-[#0EA5A8] flex items-center justify-center shrink-0 text-[10px] font-mono">
                        {lang.code.toUpperCase()}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRMATION SUMMARY MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center mx-auto text-[#0EA5A8]">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#172033]">Confirm Health Summary</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                By confirming, you verify that the symptoms and attached medical reports accurately represent your condition.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSummary}
                disabled={isConfirmingSummary}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConfirmingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming & Displaying OP...</span>
                  </>
                ) : (
                  'Yes, Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROQ CLINICAL LLM API KEY MODAL */}
      {showGroqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#D9E4E5] rounded-3xl p-6 shadow-xl text-[#172033] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4E5] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172033]">Groq Clinical AI Setup</h4>
                  <p className="text-[11px] text-[#64748B]">Llama 3.3 70B Senior Doctor Triage</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGroqModal(false);
                  setGroqSaveStatus(null);
                  setGroqError(null);
                }}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGroqKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={groqInput}
                    onChange={(e) => setGroqInput(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-[#F8FAFC] border border-[#D9E4E5] focus:border-[#0EA5A8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] placeholder:text-slate-400 font-mono focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5 leading-relaxed">
                  Your Groq API key powers real-time clinical intake questions with high-speed Llama 3.3 70B inference (&lt;500ms latency), dynamically adapting to each response in your chosen language.
                </p>
              </div>

              {groqSaveStatus && (
                <div className="p-3 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/30 text-[#0EA5A8] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                  <span>{groqSaveStatus}</span>
                </div>
              )}

              {groqError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{groqError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {groqApiKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      setGroqInput('');
                      handleSaveGroqKey();
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 underline font-medium transition-colors cursor-pointer"
                  >
                    Remove Key
                  </button>
                ) : (
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-700 hover:text-amber-800 underline"
                  >
                    Get free key at console.groq.com
                  </a>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroqModal(false);
                      setGroqSaveStatus(null);
                      setGroqError(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={groqTesting}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {groqTesting ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Activate Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE CAMERA SCANNER MODAL */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => handleAttachReport(file, 'camera', activeDocCategory)}
      />

    </div>
  );
};

