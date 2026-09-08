import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  AlertTriangle,
  Bot,
  User,
  Sparkles,
  FileCheck2,
  RotateCcw,
  CheckCircle2,
  Zap,
  Key,
  Settings2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TRANSLATIONS } from '../../data/translations';
import {
  screenEmergencyRedFlags,
  playEmergencyAlertChime,
  getSpokenEmergencyWarning,
} from '../../utils/emergencyRedFlags';
import { EmergencyRedFlagAlert } from '../common/EmergencyRedFlagAlert';
import ThreeDAnatomyViewer from './ThreeDAnatomyViewer';

export const AIHealthCheckup = ({ onSummaryReady }) => {
  const { user } = useAuth();
  const { currentLanguage: language, currentLanguageInfo, t } = useLanguage();

  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [redFlag, setRedFlag] = useState(null);
  const [redFlagAcknowledged, setRedFlagAcknowledged] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [show3DAnatomy, setShow3DAnatomy] = useState(false);

  const handleSelect3DZone = (zone) => {
    setInputText(`I am feeling discomfort/symptoms in my ${zone.name} (${zone.subtext}).`);
  };

  // Groq API Key state
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem('medikiosk_groq_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(() => localStorage.getItem('medikiosk_groq_api_key') || '');
  const [keySaveStatus, setKeySaveStatus] = useState(null);
  const [activeEngine, setActiveEngine] = useState('MediKiosk Clinical AI');

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Set language code dynamically from registry
      recognition.lang = currentLanguageInfo?.speechLang || (language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN');

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };
      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    // Start session with backend
    startNewSession();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, [language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const startNewSession = async () => {
    try {
      setLoading(true);
      const res = await api.post('/patients/interview/start', { language });
      if (res.success) {
        setInterviewId(res.interviewId);
        setMessages([
          {
            sender: 'ai',
            text: res.greeting,
            timestamp: new Date(),
          },
        ]);
        speakText(res.greeting);
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
      // Fallback greeting
      const fallback = t.aiGreeting;
      setMessages([{ sender: 'ai', text: fallback, timestamp: new Date() }]);
      speakText(fallback);
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Recognition already started');
      }
    }
  };

  const handleSaveGroqKey = async (e) => {
    e?.preventDefault();
    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      localStorage.removeItem('medikiosk_groq_api_key');
      setGroqApiKey('');
      setKeySaveStatus('Key cleared. MediKiosk using offline clinical knowledge base.');
      setActiveEngine('MediKiosk Clinical AI');
      return;
    }

    try {
      localStorage.setItem('medikiosk_groq_api_key', cleanKey);
      setGroqApiKey(cleanKey);
      setActiveEngine('Groq Ultra-Fast AI (Llama 3.3 70B)');
      await api.post('/patients/groq-key', { apiKey: cleanKey });
      setKeySaveStatus('✓ Groq API Key activated! Llama 3.3 70B enabled for real-time triage.');
      setTimeout(() => {
        setShowKeyModal(false);
        setKeySaveStatus(null);
      }, 1400);
    } catch (err) {
      setKeySaveStatus('✓ Key saved locally in browser. Will be used for triage questions.');
      setTimeout(() => {
        setShowKeyModal(false);
        setKeySaveStatus(null);
      }, 1400);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText('');
    if (isListening) recognitionRef.current?.stop();

    // Find the last question asked by AI
    const lastAiMsg = [...messages].reverse().find((m) => m.sender === 'ai');
    const question = lastAiMsg ? lastAiMsg.text : 'Health concern';

    // Client-side instant emergency screening
    const instantRedFlag = screenEmergencyRedFlags(userText);
    const userMsg = {
      sender: 'user',
      text: userText,
      timestamp: new Date(),
      redFlag: instantRedFlag.isRedFlag ? instantRedFlag.primaryCategory : null,
    };
    const newMsgs = [userMsg];

    if (instantRedFlag.isRedFlag) {
      setRedFlag(instantRedFlag);
      setRedFlagAcknowledged(false);
      setShowEmergencyModal(true);
      playEmergencyAlertChime();

      newMsgs.push({
        sender: 'ai',
        isEmergencyAlert: true,
        text: `🚨 EMERGENCY RED FLAG: Signs of ${instantRedFlag.primaryCategory.emoji} ${instantRedFlag.primaryCategory.category} detected. Please seek emergency medical care or call 112 / 108 immediately.`,
        timestamp: new Date(),
      });

      if (ttsEnabled) {
        const spokenWarning = getSpokenEmergencyWarning(language, instantRedFlag.primaryCategory);
        speakText(spokenWarning);
      }
    }

    setMessages((prev) => [...prev, ...newMsgs]);
    setLoading(true);

    try {
      if (interviewId) {
        const res = await api.post(`/patients/interview/${interviewId}/answer`, {
          question,
          answer: userText,
          inputMode: isListening ? 'voice' : 'text',
          groqApiKey: groqApiKey || undefined,
        });

        if (res.success) {
          if (res.aiSource) {
            setActiveEngine(res.aiSource);
          }

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

          setMessages((prev) => [
            ...prev,
            { sender: 'ai', text: res.nextQuestion, timestamp: new Date(), source: res.aiSource },
          ]);

          speakText(res.nextQuestion);

          if (res.isComplete) {
            setIsCompleted(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
      const fallbackReply = "I understand. Could you also share if you are currently taking any daily medicines?";
      setMessages((prev) => [...prev, { sender: 'ai', text: fallbackReply, timestamp: new Date() }]);
      speakText(fallbackReply);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!interviewId) return;
    setLoading(true);
    try {
      const res = await api.post(`/patients/interview/${interviewId}/summary`, {
        groqApiKey: groqApiKey || undefined,
      });
      if (res.success) {
        onSummaryReady(res.summary);
      }
    } catch (err) {
      console.error('Summary compilation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[78vh] bg-white border border-[#D9E4E5] rounded-3xl overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#D9E4E5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <span>AI Health Check-Up</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-[#0EA5A8] font-mono font-semibold">
                {language === 'hi' ? 'हिन्दी' : language === 'te' ? 'తెలుగు' : 'English'}
              </span>
            </h3>
            <p className="text-[11px] text-[#64748B]">Natural voice & text clinical intake assistant</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {groqApiKey ? (
            <button
              onClick={() => {
                setKeyInput(groqApiKey);
                setShowKeyModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-xs"
              title="Groq Llama 3.3 70B Active"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Groq AI Active</span>
              <span className="sm:hidden">Groq</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setKeyInput('');
                setShowKeyModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F3F8F8] border border-[#D9E4E5] text-[#172033] text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Add Groq API Key"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Groq API Key</span>
              <span className="sm:hidden">Key</span>
            </button>
          )}

          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            title={ttsEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            className="p-2 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors text-xs flex items-center gap-1.5"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#0EA5A8]" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline text-[11px] font-medium">{ttsEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>

          <button
            onClick={startNewSession}
            title="Restart Interview"
            className="p-2 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

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
        <div className="px-6 py-2.5 bg-rose-100 border-b border-rose-300 text-rose-900 text-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-base">{redFlag.primaryCategory?.emoji || '🚨'}</span>
            <span className="font-bold">
              Emergency Red Flag: {redFlag.primaryCategory?.category || 'High Priority'}
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

      {/* Standalone Modal when user clicks to open */}
      {redFlag && redFlagAcknowledged && showEmergencyModal && (
        <EmergencyRedFlagAlert
          redFlag={redFlag}
          onAcknowledge={() => setRedFlagAcknowledged(true)}
          isModalOpen={showEmergencyModal}
          onCloseModal={() => setShowEmergencyModal(false)}
          onOpenModal={() => setShowEmergencyModal(true)}
        />
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F3F8F8]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-[#0EA5A8] text-white shadow-xs'
                  : 'bg-white text-[#0EA5A8] border border-[#D9E4E5] shadow-xs'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[78%] sm:max-w-[65%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#0EA5A8] text-white shadow-xs'
                  : 'bg-white text-[#172033] border border-[#D9E4E5] shadow-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className={`block text-[10px] mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-white/80' : 'text-[#64748B]'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#D9E4E5] flex items-center justify-center text-[#0EA5A8] shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#D9E4E5] rounded-2xl px-4 py-3 text-xs text-[#64748B] flex items-center gap-2 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] animate-ping" />
              <span>Analyzing responses & adapting clinical follow-up...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Hesitation Prompts */}
      <div className="px-6 py-2 bg-[#EAF3F3] border-t border-[#D9E4E5] flex items-center gap-2 overflow-x-auto text-[11px] text-[#64748B]">
        <span className="shrink-0 text-[#64748B] font-medium">Quick responses:</span>
        {["I don't know", "I'm not sure", "I don't remember", "Mild discomfort", "Severe pain"].map((quick, i) => (
          <button
            key={i}
            onClick={() => setInputText(quick)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#D9E4E5] hover:border-[#0EA5A8]/50 text-[#172033] hover:text-[#0EA5A8] shrink-0 transition-colors shadow-2xs"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* Input / Voice Bar */}
      <div className="p-4 sm:p-6 bg-white border-t border-[#D9E4E5]">
        
        {/* If listening: Show Voice Waveform */}
        {isListening && (
          <div className="mb-3 p-3 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/30 flex items-center justify-between text-xs text-[#0EA5A8] animate-pulse">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-3 bg-[#0EA5A8] rounded-full animate-wave" />
                <span className="w-1 h-5 bg-[#0EA5A8] rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-2 bg-[#0EA5A8] rounded-full animate-wave" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="font-semibold">🎤 Listening... Speak your health concern</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-[11px] text-[#0EA5A8] underline font-medium"
            >
              Stop listening
            </button>
          </div>
        )}

        {!speechSupported && (
          <p className="text-[11px] text-amber-800 mb-2">
            Voice input is unavailable in this browser. You can type your response instead.
          </p>
        )}

        {/* Engine status indicator */}
        <div className="mb-2.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-[#64748B]">
            {groqApiKey ? (
              <span className="flex items-center gap-1 text-amber-700 font-medium font-mono text-[10px]">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Active: Groq Llama 3.3 70B</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#64748B] text-[10px]">
                <Sparkles className="w-3 h-3 text-[#0EA5A8]" />
                <span>Engine: MediKiosk Clinical Intelligence</span>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setKeyInput(groqApiKey || '');
              setShowKeyModal(true);
            }}
            className="text-[10px] text-amber-700 hover:text-amber-800 underline flex items-center gap-1 transition-colors font-medium"
          >
            <Key className="w-3 h-3" />
            <span>{groqApiKey ? 'Edit Groq Key' : 'Enter Groq API Key'}</span>
          </button>
        </div>

        {/* Three.js 3D Visualizer Toggle Button */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShow3DAnatomy(!show3DAnatomy)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs border ${
              show3DAnatomy
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-cyan-600/20'
                : 'bg-white text-slate-700 hover:text-cyan-700 border-slate-200 hover:border-cyan-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>{show3DAnatomy ? 'Hide 3D Anatomy Map' : 'Open 3D Anatomy Symptom Map (Three.js)'}</span>
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Tap 3D organ node to auto-fill symptoms</span>
        </div>

        {/* 3D Anatomy Viewer Component */}
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
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={`p-3 rounded-2xl border transition-all ${
              isListening
                ? 'bg-rose-50 border-rose-400 text-rose-600 animate-pulse'
                : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#172033] hover:text-[#0EA5A8] hover:border-[#0EA5A8]/40'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Editable Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? 'Transcribing your voice...' : t.typeHere}
            className="flex-1 bg-[#F8FAFC] border border-[#D9E4E5] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#0EA5A8] transition-colors"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            className="p-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Session Button */}
        {(isCompleted || messages.length >= 5) && (
          <div className="mt-4 pt-3 border-t border-[#D9E4E5] flex items-center justify-between">
            <span className="text-xs text-[#0EA5A8] flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Clinical triage questions answered.
            </span>
            <button
              onClick={handleGenerateSummary}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Compile AI Health Summary</span>
            </button>
          </div>
        )}

      </div>

      {/* Groq API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white border border-[#D9E4E5] rounded-3xl p-6 shadow-2xl text-[#172033] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E4E5] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172033]">Groq API Key Setup</h4>
                  <p className="text-[11px] text-[#64748B]">Ultra-fast Llama 3.3 70B AI inference</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setKeySaveStatus(null);
                }}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGroqKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Enter Groq API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-[#F8FAFC] border border-[#D9E4E5] focus:border-[#0EA5A8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] placeholder:text-[#64748B] font-mono focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5 leading-relaxed">
                  Your Groq API key (starts with <code className="text-[#0EA5A8] font-bold">gsk_</code>) is saved to power real-time conversational intake questions with near-instant (&lt;500ms) latency.
                </p>
              </div>

              {keySaveStatus && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-amber-800 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{keySaveStatus}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {groqApiKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyInput('');
                      handleSaveGroqKey();
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 underline font-medium transition-colors"
                  >
                    Remove Key
                  </button>
                ) : (
                  <span className="text-[11px] text-[#64748B]">Free keys at console.groq.com</span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowKeyModal(false);
                      setKeySaveStatus(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#172033] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Save & Activate</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
