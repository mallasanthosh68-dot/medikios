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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES, getLanguageByCode } from '../utils/languages';
import {
  startInterview,
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
import { PinnedReportsGallery } from '../components/common/PinnedReportsGallery';
import { CameraScannerModal } from '../components/patient/CameraScannerModal';
import {
  screenEmergencyRedFlags,
  playEmergencyAlertChime,
  getSpokenEmergencyWarning,
} from '../utils/emergencyRedFlags';
import { EmergencyRedFlagAlert } from '../components/common/EmergencyRedFlagAlert';
import ThreeDAnatomyViewer from '../components/patient/ThreeDAnatomyViewer';

export const AICheckupPage = ({ onExit, onNavigateDoctor }) => {
  const { user } = useAuth();
  const { currentLanguage, setLanguage, languages, currentLanguageInfo, t } = useLanguage();

  // Dual Checkup Mode: 'text' | 'voice'
  const [checkupMode, setCheckupMode] = useState('text');

  // Primary Phase State: 'welcome' | 'consent' | 'interview' | 'summary' | 'confirmed'
  const [phase, setPhase] = useState('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [show3DAnatomy, setShow3DAnatomy] = useState(false);

  const handleSelect3DZone = (zone) => {
    const text = `I am feeling symptoms in my ${zone.name} (${zone.subtext}).`;
    setInputText((prev) => (prev ? `${prev}. ${text}` : text));
  };
  const [consentGiven, setConsentGiven] = useState(false);

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

  // Attached Reports State (Images & Converted OCR)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [attachedReports, setAttachedReports] = useState([]);
  const chatFileInputRef = useRef(null);

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
      } catch (err) {}
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
      } catch (e) {}
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
      } catch (e) {}

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
    } catch (e) {}
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

  // Start Interview Session
  const handleStartInterview = async () => {
    setIsSending(true);
    setError(null);
    try {
      setLanguage(selectedLanguage);
      const res = await startInterview(selectedLanguage);
      if (res.success) {
        setInterviewId(res.interviewId);
        setPhase('interview');
        const firstMsg = {
          id: 'ai-0',
          sender: 'ai',
          text: res.greeting || 'Please tell me what health problem or symptoms you are experiencing today.',
          timestamp: new Date(),
        };
        setMessages([firstMsg]);

        // If in voice mode, speak greeting (mic stays muted until patient taps to unmute)
        if (checkupMode === 'voice') {
          speakText(firstMsg.text);
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to hospital clinical engine. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  // Send Message Core (Used by both Text & Voice modes)
  const processAnswerSubmission = async (textToSend, inputSource = 'text') => {
    if (!textToSend || isSending) return;
    isProcessingRef.current = true;
    setIsSending(true);
    setIsTyping(true);
    setError(null);
    stopListening();

    // Ensure active interview session exists
    let activeInterviewId = interviewId;
    if (!activeInterviewId) {
      try {
        const startRes = await startInterview(selectedLanguage);
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
      const sendFn = inputSource === 'voice' ? sendVoiceTranscript : sendMessage;
      const res = await sendFn(activeInterviewId, processedText, lastQuestion);

      if (res && res.success) {
        setTurnCount((prev) => prev + 1);

        // Check Red Flag returned by backend
        if (res.redFlagCheck?.isRedFlag) {
          const backendCheck = {
            isRedFlag: true,
            priority: res.redFlagCheck.priority || 'HIGH_PRIORITY',
            message: res.redFlagCheck.alertMessage,
            alertMessage: res.redFlagCheck.alertMessage,
            matchedCategories: res.redFlagCheck.matchedCategories || [],
            primaryCategory: res.redFlagCheck.primaryCategory || null,
            flags: res.redFlagCheck.flags || [],
            hotlines: res.redFlagCheck.hotlines || ['112', '108', '911'],
          };
          setRedFlag((prev) => {
            const mergedCategories = [
              ...(prev?.matchedCategories || []),
              ...(backendCheck.matchedCategories || []),
            ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
            return {
              ...(prev || {}),
              ...backendCheck,
              matchedCategories: mergedCategories.length > 0 ? mergedCategories : (prev?.matchedCategories || []),
              primaryCategory: backendCheck.primaryCategory || prev?.primaryCategory,
            };
          });
          setRedFlagAcknowledged(false);
          setShowEmergencyModal(true);
          playEmergencyAlertChime();
        }

        // AI Response Message
        const aiMsg = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: res.nextQuestion,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (res.isComplete) {
          setIsCompleted(true);
          stopListening();
        }

        // Speak aloud in selected language
        speakText(res.nextQuestion, () => {
          // Auto voice stop: mic stays MUTED
          stopListening();
          // Clean exit: if consultation is complete, smoothly transition to Health Summary after doctor concludes speaking
          if (res.isComplete) {
            setTimeout(() => {
              handleGenerateSummary();
            }, 2500);
          }
        });

        // Safety auto-transition if TTS ends or speech synthesis is muted/unavailable
        if (res.isComplete) {
          setTimeout(() => {
            setPhase((curr) => {
              if (curr === 'interview') {
                handleGenerateSummary();
              }
              return curr;
            });
          }, 15000);
        }
      } else {
        setError(res?.message || 'Unable to receive response from AI Doctor.');
      }
    } catch (err) {
      console.error('[Answer Submission Error]', err);
      setError(err.message || 'Something went wrong while processing your response.');
      stopListening();
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

  // Generate Summary Action
  const handleGenerateSummary = async () => {
    if (!interviewId) return;
    setIsSending(true);
    setError(null);
    stopListening();
    window.speechSynthesis?.cancel();
    try {
      const res = await generateSummary(interviewId);
      if (res.success) {
        setSummary(res.summary);
        setPhase('summary');
      }
    } catch (err) {
      setError(err.message || 'Could not compile health summary. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  // Confirm Summary Action
  const handleConfirmSummary = async () => {
    if (!interviewId) return;
    setIsSending(true);
    try {
      const res = await confirmSummary(interviewId);
      if (res.success) {
        const finalSummary = res.summary || summary;
        setSummaryConfirmed(true);
        setShowConfirmModal(false);
        setPhase('confirmed');
        if (onNavigateDoctor) {
          onNavigateDoctor(finalSummary);
        }
      }
    } catch (err) {
      alert('Confirmation failed: ' + err.message);
    } finally {
      setIsSending(false);
    }
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
  const handleAttachReport = async (fileOrFiles, uploadMethod = 'device') => {
    if (isUploadingReport) return;
    if (!fileOrFiles) return;
    const files = Array.isArray(fileOrFiles)
      ? fileOrFiles
      : fileOrFiles instanceof FileList
      ? Array.from(fileOrFiles)
      : [fileOrFiles];
    if (files.length === 0) return;

    setIsUploadingReport(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append('reports', f);
      });
      formData.append('uploadMethod', uploadMethod);

      const targetId = summary?._id || interviewId;
      const res = await attachReportToSummary(targetId, formData);

      if (res.success) {
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
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D9E4E5] px-3 sm:px-6 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-xs">
        
        {/* Left: MediKiosk Brand & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center p-0.5 shadow-xs shrink-0">
            <HeartPulse className="w-5 h-5 text-[#0EA5A8]" />
          </div>
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                checkupMode === 'text'
                  ? 'bg-[#0EA5A8] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>{t('Text Mode', 'Text Mode')}</span>
            </button>
            <button
              onClick={() => handleSwitchMode('voice')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                checkupMode === 'voice'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-white animate-pulse shrink-0" />
              <span>{t('Voice Mode', 'Voice Mode')}</span>
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
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
              groqActive || groqApiKey
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

        {/* PHASE 1: WELCOME SCREEN */}
        {phase === 'welcome' && (
          <div className="flex-1 flex items-center justify-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-10 shadow-sm text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center mx-auto mb-6 text-[#0EA5A8] shadow-xs">
                <Bot className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5A8]">
                AI Smart Hospital Assistant
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-1.5 tracking-tight">
                {t('AI Health Check-Up', 'AI Health Check-Up')}
              </h2>

              <p className="text-sm text-[#64748B] mt-3 leading-relaxed max-w-md mx-auto">
                Communicate your health symptoms with ease. Choose either standard typed conversation or completely hands-free voice conversation in any of 51 Indian languages.
              </p>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left">
                <button
                  type="button"
                  onClick={() => setCheckupMode('text')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    checkupMode === 'text'
                      ? 'bg-[#E6F7F7] border-[#0EA5A8] text-[#172033] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B] hover:border-[#0EA5A8] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="w-4 h-4 text-[#0EA5A8]" />
                    <span className="font-bold text-sm text-[#172033]">Text-to-Text Mode</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Type messages, attach lab reports, scan documents with camera, and read structured answers.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckupMode('voice')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    checkupMode === 'voice'
                      ? 'bg-[#E0F2FE] border-[#0284C7] text-[#172033] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B] hover:border-[#0284C7] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Radio className="w-4 h-4 text-[#0284C7] animate-pulse" />
                    <span className="font-bold text-sm text-[#172033]">Voice-to-Voice Mode</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Completely hands-free conversation. AI speaks aloud in your language and listens automatically.
                  </p>
                </button>
              </div>

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
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedLanguage === l.code
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
                    AI voice synthesis and translation will automatically adapt.
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

              <div className="mt-8">
                <button
                  onClick={() => setPhase('consent')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-sm font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2 mx-auto transition-all transform hover:-translate-y-0.5 break-words whitespace-normal text-center cursor-pointer"
                >
                  <span>{t('Get Started', 'Continue to Privacy Consent')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 2: PRIVACY & CONSENT */}
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
                  <span className="text-xs text-[#0EA5A8] font-bold uppercase tracking-wider">Patient Privacy</span>
                  <h3 className="text-xl font-bold text-[#172033]">Before We Begin</h3>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-4 rounded-2xl border border-[#D9E4E5]">
                <p>
                  MediKiosk uses an artificial intelligence clinical intake assistant to ask relevant questions regarding your symptoms, medical history, and past health documents.
                </p>
                <p>
                  You will be communicating in <strong className="text-[#0EA5A8]">{activeLangInfo.nativeName} ({activeLangInfo.name})</strong> in <strong className="text-[#0284C7]">{checkupMode === 'voice' ? 'Hands-Free Voice-to-Voice' : 'Text-to-Text'}</strong> mode.
                </p>
                <p className="text-[#0EA5A8] font-medium">
                  • Your data is encrypted and shared only with the doctor you personally choose.
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
                  onClick={() => setPhase('welcome')}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleStartInterview}
                  disabled={!consentGiven || isSending}
                  className="px-6 py-3 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isSending ? 'Connecting...' : `Start in ${activeLangInfo.nativeName}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PHASE 3: ACTIVE CHECKUP SESSION (TEXT MODE OR VOICE MODE) */}
        {phase === 'interview' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-130px)] overflow-hidden">
            
            {/* Left/Main Column */}
            <div className="flex-1 flex flex-col bg-white border border-[#D9E4E5] rounded-3xl overflow-hidden shadow-sm">
              
              {/* Progress Bar & Sub-header */}
              <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#D9E4E5] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-semibold text-[#172033]">Health Interview</span>
                  <span className="text-[#64748B]">—</span>
                  <span className="text-[#0EA5A8] font-medium">
                    Turn {turnCount} • Clinical Intake • {activeLangInfo.nativeName}
                  </span>
                  <button
                    onClick={() => {
                      setGroqInput(groqApiKey);
                      setGroqSaveStatus(null);
                      setGroqError(null);
                      setShowGroqModal(true);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      groqActive || groqApiKey
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
                  {(turnCount >= 1 || messages.length >= 2 || isCompleted) && (
                    <button
                      onClick={handleGenerateSummary}
                      disabled={isSending}
                      className="px-3 py-1 bg-[#0EA5A8] hover:bg-[#0c8f91] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Conclude discussion now and generate doctor summary"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'View Health Summary' : 'Finish & View Summary'}</span>
                    </button>
                  )}

                  <div className="md:hidden flex items-center bg-white p-0.5 rounded-xl border border-[#D9E4E5] text-[10px]">
                    <button
                      onClick={() => handleSwitchMode('text')}
                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${checkupMode === 'text' ? 'bg-[#0EA5A8] text-white' : 'text-[#64748B]'}`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => handleSwitchMode('voice')}
                      className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${checkupMode === 'voice' ? 'bg-[#0284C7] text-white' : 'text-[#64748B]'}`}
                    >
                      Voice
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
                            className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                              msg.isEmergencyAlert
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
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                      msg.pinnedReport.isDirectPinnedImage ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30'
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
                  {(isCompleted || messages.length >= 3) && (
                    <div className="px-5 py-3 bg-[#E6F7F7] border-t border-[#0EA5A8]/20 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#0EA5A8] font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                        <span>{isCompleted ? '✓ Consultation complete. Thank you for providing your details.' : 'Intake details recorded. You can conclude discussion anytime.'}</span>
                      </div>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isSending}
                        className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>{isCompleted ? 'View Health Summary' : 'Finish & View Summary'}</span>
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
                            } catch (e) {} finally {
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
                      onChange={(e) => e.target.files?.length && handleAttachReport(e.target.files, 'device')}
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                    />

                    {/* Collapsible 3D Anatomy Viewer */}
                    {show3DAnatomy && (
                      <div className="mb-4">
                        <ThreeDAnatomyViewer
                          onSelectZone={(zone) => {
                            handleSelect3DZone(zone);
                          }}
                          onConfirmSymptoms={(data) => {
                            if (data?.summaryText) {
                              setInputText((prev) => (prev ? `${prev}. ${data.summaryText}` : data.summaryText));
                            }
                            setShow3DAnatomy(false);
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {/* 3D Anatomy Visualizer Button */}
                      <button
                        type="button"
                        onClick={() => setShow3DAnatomy(!show3DAnatomy)}
                        title={show3DAnatomy ? "Close 3D Anatomy Map" : "Open 3D Anatomy Symptom Visualizer (Three.js)"}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                          show3DAnatomy
                            ? 'bg-cyan-600 text-white border-cyan-500 shadow-cyan-600/30 ring-2 ring-cyan-400'
                            : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B] hover:text-cyan-600 hover:border-cyan-400'
                        }`}
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>

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
                        className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                          isListening
                            ? 'bg-[#E6F7F7] border-[#0EA5A8] text-[#0EA5A8] animate-pulse ring-2 ring-[#0EA5A8]/30'
                            : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B] hover:text-[#0EA5A8] hover:border-[#0EA5A8]'
                        }`}
                      >
                        {isListening ? <Mic className="w-5 h-5 text-[#0EA5A8] animate-pulse" /> : <MicOff className="w-5 h-5 text-[#64748B]" />}
                      </button>

                      {isCompleted ? (
                        <div className="flex-1 flex items-center justify-between gap-3 bg-[#E6F7F7] border border-[#0EA5A8]/30 rounded-2xl px-4 py-2.5">
                          <div className="flex items-center gap-2 text-xs text-[#0EA5A8] font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                            <span>Thank you! Consultation complete. Details recorded for the doctor.</span>
                          </div>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={isSending}
                            className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span>View Health Summary</span>
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
                          <div className={`absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-500 pointer-events-none ${
                            redFlag && !redFlagAcknowledged
                              ? 'bg-rose-600/30 scale-125 animate-ping'
                              : isSpeaking
                              ? 'bg-[#0284C7]/20 scale-125 animate-ping'
                              : isListening
                              ? 'bg-[#0EA5A8]/20 scale-110 animate-pulse'
                              : 'bg-slate-200/40 scale-95'
                          }`} />
                          <div className={`absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-dashed transition-all duration-500 pointer-events-none ${
                            redFlag && !redFlagAcknowledged
                              ? 'border-rose-500 animate-spin'
                              : isSpeaking
                              ? 'border-[#0284C7]/60 animate-spin'
                              : isListening
                              ? 'border-[#0EA5A8]/60 animate-pulse'
                              : 'border-[#D9E4E5]'
                          }`} />
                          <button
                            type="button"
                            onClick={isCompleted ? handleGenerateSummary : toggleListening}
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                              redFlag && !redFlagAcknowledged
                                ? 'bg-gradient-to-tr from-rose-600 to-red-600 ring-4 ring-rose-400/50 text-white'
                                : isCompleted
                                ? 'bg-gradient-to-tr from-[#0EA5A8] to-[#0284C7] ring-4 ring-[#0EA5A8]/20 text-white'
                                : isSpeaking
                                ? 'bg-gradient-to-tr from-[#0284C7] to-[#0EA5A8] ring-4 ring-[#0284C7]/20 text-white'
                                : isListening
                                ? 'bg-gradient-to-tr from-[#0EA5A8] to-[#0284C7] scale-105 ring-4 ring-[#0EA5A8]/20 text-white'
                                : 'bg-white border-2 border-rose-300 hover:border-rose-400 text-rose-500 shadow-sm'
                            }`}
                            title={isCompleted ? 'Intake Complete • Tap to view health summary' : isListening ? 'Mic Unmuted (Recording) • Tap to Mute' : 'Mic Muted • Tap to Unmute & Speak'}
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
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                isCompleted
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
                    <div className="max-w-4xl mx-auto mt-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                      <div className="flex-1 w-full text-left min-w-0">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">
                          <span>Live Voice Subtitles ({activeLangInfo.name})</span>
                          {liveTranscript && (
                            <span className="text-[#0EA5A8] flex items-center gap-1 normal-case text-[11px] font-semibold">
                              <span className="w-2 h-2 rounded-full bg-[#0EA5A8] animate-pulse" />
                              Auto-stops & mutes after speaking • Or tap Send Voice Now
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-[#172033] italic line-clamp-2">
                          {isTranslatingSpeech
                            ? `⚡ Translating spoken words into ${activeLangInfo.nativeName}...`
                            : liveTranscript
                            ? `"${liveTranscript}"`
                            : isListening
                            ? `(Mic Unmuted • Recording in ${activeLangInfo.nativeName}... Speak symptoms, auto-mutes on silence)`
                            : `(Mic Muted • Tap the microphone orb above to unmute and record)`}
                        </p>
                      </div>

                      {/* Direct Send Spoken Voice Button */}
                      {liveTranscript.trim().length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
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
                            className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isAi
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
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                      msg.pinnedReport.isDirectPinnedImage ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30'
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
                        <span>{isCompleted ? '✓ Thank you! Consultation complete. Clinical findings recorded.' : 'Sufficient information gathered. You can conclude discussion anytime.'}</span>
                      </div>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isSending}
                        className="px-5 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>{isCompleted ? 'View Health Summary' : 'Finish & View Summary'}</span>
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
                {/* Language Badge */}
                <div className="p-2.5 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20">
                  <span className="text-[10px] uppercase font-bold text-[#0EA5A8] block">Session Language:</span>
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

        {/* PHASE 4: STRUCTURED CLINICAL SUMMARY */}
        {phase === 'summary' && summary && (
          <div className="flex-1 py-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
            
            {/* Top Disclaimer */}
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

            {/* Summary Dossier */}
            <div className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">AI HEALTH SUMMARY</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Structured clinical dossier organized in {activeLangInfo.nativeName}.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/25 text-[#0EA5A8] text-xs font-semibold">
                  Triage Complete
                </span>
              </div>

              {/* Sections */}
              <div className="space-y-4 text-xs">
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

                {/* 5. PINNED MEDICAL REPORTS & LAB SCANS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <PinnedReportsGallery
                    reports={summary.pinnedReports || []}
                    onAttachReport={handleAttachReport}
                    onRemoveReport={handleRemoveReport}
                    title="Pinned Medical Reports & Diagnostic Scans"
                  />
                </div>
              </div>

              {/* Confirmation Buttons */}
              <div className="pt-6 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setPhase('interview')}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Edit Information
                </button>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Summary</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: CONFIRMED SUCCESS STATE */}
        {phase === 'confirmed' && (
          <div className="flex-1 flex items-center justify-center py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-white border border-[#D9E4E5] rounded-3xl p-8 shadow-sm text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center mx-auto text-[#0EA5A8] shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold text-[#0EA5A8] uppercase tracking-wider">Verification Complete</span>
                <h3 className="text-2xl font-bold text-[#172033] mt-1">Health Summary Confirmed</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Your structured health intake dossier and all attached lab reports have been locked and formatted for clinical handoff.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Chief Complaint:</span>
                  <span className="font-semibold text-[#172033]">{summary?.chiefComplaint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Suggested Specialty:</span>
                  <span className="font-semibold text-[#0EA5A8]">{summary?.suggestedSpecialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Language:</span>
                  <span className="font-semibold text-[#172033]">{activeLangInfo.nativeName} ({activeLangInfo.name})</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => onNavigateDoctor ? onNavigateDoctor(summary) : onExit()}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Choose Attending Doctor</span>
                </button>

                <button
                  onClick={onExit}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      langCategory === c.id
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
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all group cursor-pointer ${
                      isSelected
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
                disabled={isSending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isSending ? 'Locking...' : 'Yes, Confirm'}
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
        onCapture={(file) => handleAttachReport(file, 'camera')}
      />

    </div>
  );
};

