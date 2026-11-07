import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { chat } from '../../services/aiService';

export const AIBotSummaryAssistant = ({ summary, language = 'en', intakeMessages = [] }) => {
  if (!summary) return null;

  const patientName = summary.patientName || 'Patient';
  const opNumber = summary.opNumber || 'OP-Pending';
  const chiefComplaint = summary.chiefComplaint || 'Clinical Consultation';
  const symptoms = summary.symptoms || [];
  const suggestedSpecialty = summary.suggestedSpecialty || 'General Medicine';
  const medications = summary.aiMedicationSuggestions || [];

  // Compile interview turns from messages if not directly on summary
  const compileFromMessages = (msgs) => {
    if (!Array.isArray(msgs) || msgs.length === 0) return [];
    const compiled = [];
    let lastAiQ = '';
    msgs.forEach((m) => {
      if (m.sender === 'ai' || m.sender === 'bot') {
        lastAiQ = m.text;
      } else if (m.sender === 'user') {
        compiled.push({
          question: lastAiQ || 'Clinical symptoms & health concern inquiry',
          answer: m.text,
          inputMode: m.inputMode || 'text',
          timestamp: m.timestamp || new Date().toISOString(),
        });
      }
    });
    return compiled;
  };

  // Robust multi-tier resolution: summary.interviewResponses -> summary.responses -> intakeMessages -> fallback
  let interviewResponses = (Array.isArray(summary.interviewResponses) && summary.interviewResponses.length > 0)
    ? summary.interviewResponses
    : (Array.isArray(summary.responses) && summary.responses.length > 0)
    ? summary.responses
    : (Array.isArray(intakeMessages) && intakeMessages.length > 0)
    ? compileFromMessages(intakeMessages)
    : [];

  // Fallback if still empty but summary has clinical data
  if (interviewResponses.length === 0 && (summary.chiefComplaint || summary.aiGeneratedText)) {
    interviewResponses = [
      {
        question: 'What is your primary health concern today?',
        answer: summary.chiefComplaint || 'Consultation requested',
        inputMode: 'text',
        timestamp: summary.createdAt || new Date().toISOString(),
      },
      ...(symptoms.length > 0
        ? [
            {
              question: 'What specific symptoms have you been experiencing?',
              answer: symptoms.join(', '),
              inputMode: 'text',
              timestamp: summary.createdAt || new Date().toISOString(),
            },
          ]
        : []),
      ...(summary.duration
        ? [
            {
              question: 'Approximately how long have you been experiencing these symptoms?',
              answer: summary.duration,
              inputMode: 'text',
              timestamp: summary.createdAt || new Date().toISOString(),
            },
          ]
        : []),
    ];
  }

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${patientName}! I am your MediKiosk AI Clinical Bot. I have analyzed your health checkup (OP: ${opNumber}). You can ask me any question about your symptoms, suggested medications, diet precautions, or what to ask the attending ${suggestedSpecialty} doctor.`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // Default open to match Image 1
  const [showInterviewTranscript, setShowInterviewTranscript] = useState(true);

  // Sync initial bot greeting when patient details or OP number resolves
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            sender: 'ai',
            text: `Hello ${patientName}! I am your MediKiosk AI Clinical Bot. I have analyzed your health checkup (OP: ${opNumber}). You can ask me any question about your symptoms, suggested medications, diet precautions, or what to ask the attending ${suggestedSpecialty} doctor.`,
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
  }, [patientName, opNumber, suggestedSpecialty]);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
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

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start error', e);
      }
    }
  };

  // Intelligent Contextual Clinical Responder
  const generateBotReply = async (userQuery) => {
    const q = userQuery.toLowerCase();

    // 1. Simple explanation intent
    if (/simple|explain|what does this mean|diagnosis|problem|summary/i.test(q)) {
      return `Here is a plain-language explanation of your summary: You reported experiencing "${chiefComplaint}" with symptoms including ${symptoms.slice(0, 3).join(', ') || 'discomfort'}. Based on these symptoms, MediKiosk suggests consulting the ${suggestedSpecialty} department. This is a triage guide to help your attending doctor review your case quickly.`;
    }

    // 2. Medications intent
    if (/medicine|medication|drug|pill|tablet|prescription|dose/i.test(q)) {
      if (medications.length > 0) {
        const medList = medications
          .map(
            (m) =>
              `• ${m.medicineName} (${m.dosage || '1 unit'} ${m.frequency || 'Daily'}) - ${
                m.clinicalRationale || 'For symptom relief'
              }`
          )
          .join('\n');
        return `Here are the preliminary medications suggested by AI for your doctor's review:\n\n${medList}\n\n*Important Notice:* These are suggestions for your attending doctor. The doctor will evaluate you in person, verify allergies, and issue your official prescription.`;
      }
      return `No specific preliminary medications are suggested yet. Your attending physician will evaluate your symptoms and prescribe appropriate medicines during consultation.`;
    }

    // 3. Diet & Precautions intent
    if (/diet|food|eat|precaution|home care|lifestyle|water|rest/i.test(q)) {
      return `General precautions for your symptoms (${chiefComplaint}):\n• Stay well hydrated with plenty of clean lukewarm water.\n• Eat light, freshly cooked, easily digestible meals.\n• Avoid spicy, oily, or excessively fried food.\n• Ensure adequate physical rest and avoid strenuous exertion until evaluated by your doctor.\n• If symptoms worsen or severe headache/chest pain occurs, alert hospital staff immediately.`;
    }

    // 4. Questions for Doctor intent
    if (/question|ask doctor|what to ask|doctor visit|consultation/i.test(q)) {
      return `Recommended questions to ask your attending ${suggestedSpecialty} doctor:\n1. "What do you think is causing my ${symptoms[0] || 'symptoms'}?"\n2. "Do I need any blood tests, X-rays, or further diagnostic scans?"\n3. "Are there any side effects or food restrictions with the medicines you are prescribing?"\n4. "When should I expect to feel better, and when should I come back for a follow-up?"`;
    }

    // 5. Emergency Warning Signs intent
    if (/emergency|danger|red flag|warning|serious|when to go/i.test(q)) {
      return `⚠️ Urgent Red-Flag Signs to Watch Out For:\n• Sudden severe chest tightness or radiation to the left arm/jaw.\n• Sudden difficulty breathing or gasping for air.\n• Sudden fainting, loss of consciousness, or confusion.\n• High fever with severe stiff neck or persistent vomiting.\nIf any of these occur, please go to the Emergency / Casualty ward immediately or call 112 / 108.`;
    }

    // 6. Generic conversational fallback
    try {
      const res = await chat({
        message: userQuery,
        healthcareMode: summary.healthcareMode || 'general_medical',
        language,
      });
      if (res?.success && res.nextQuestion) {
        return res.nextQuestion;
      }
    } catch (e) {
      // Fallback
    }

    return `I have noted what you shared regarding "${userQuery}". Approximately how long have you been experiencing this, and is the sensation constant or does it come and go?`;
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    setInputText('');
    if (isListening) recognitionRef.current?.stop();

    const userMsg = { sender: 'user', text: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await generateBotReply(query);
      const botMsg = { sender: 'ai', text: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
      speakText(reply);
    } catch (err) {
      const fallbackMsg = {
        sender: 'ai',
        text: `Your question regarding "${query}" has been noted. Please share this directly with your attending ${suggestedSpecialty} doctor during consultation.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    { label: '💡 Explain in Simple Words', query: 'Can you explain my health summary and diagnosis suggestion in simple plain words?' },
    { label: '💊 Suggested Medications', query: 'What medicines are suggested and how should they be taken?' },
    { label: '🥗 Diet & Precautions', query: 'What food, diet, and home care precautions should I take?' },
    { label: '📋 Questions for My Doctor', query: 'What questions should I ask my doctor during the consultation?' },
    { label: '⚠️ Warning Signs', query: 'What warning signs or emergency red flags should I watch out for?' },
  ];

  return (
    <div className="bg-white border-2 border-[#0EA5A8] rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
      {/* 1. AI BOT HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9E4E5] gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#0EA5A8] to-teal-700 text-white flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0EA5A8] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full border border-[#0EA5A8]/20">
                Interactive AI Clinical Bot
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                • Live in Summary
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#172033] mt-0.5">
              MediKiosk AI Summary Bot
            </h3>
            <p className="text-xs text-[#64748B]">
              Ask questions about your symptoms, medications, diet, or doctor preparation in real-time.
            </p>
          </div>
        </div>

        {/* Audio Toggle & Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              ttsEnabled ? 'bg-[#E6F7F7] border-[#0EA5A8] text-[#0EA5A8]' : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#64748B]'
            }`}
            title={ttsEnabled ? 'Mute AI voice output' : 'Read AI responses aloud'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#0EA5A8]" /> : <VolumeX className="w-4 h-4" />}
            <span>{ttsEnabled ? 'Voice Aloud: ON' : 'Voice Aloud: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  sender: 'ai',
                  text: `Hello ${patientName}! I am your MediKiosk AI Clinical Bot. I have analyzed your health checkup (OP: ${opNumber}). You can ask me any question about your symptoms, suggested medications, diet precautions, or what to ask the attending ${suggestedSpecialty} doctor.`,
                  timestamp: new Date(),
                },
              ])
            }
            className="p-2 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. QUICK INQUIRY CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[11px] font-bold text-[#64748B] shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-[#0EA5A8]" />
          <span>Ask AI Bot:</span>
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip.query)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E6F7F7] border border-[#D9E4E5] hover:border-[#0EA5A8]/40 text-[#172033] text-xs font-semibold shrink-0 transition-all cursor-pointer shadow-2xs hover:text-[#0EA5A8]"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 3. SCROLLABLE AI BOT CHAT AREA */}
      <div className="h-64 sm:h-72 overflow-y-auto p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-3 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                msg.sender === 'user' ? 'bg-[#0EA5A8] text-white' : 'bg-white text-[#0EA5A8] border border-[#D9E4E5]'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-2xs ${
                msg.sender === 'user'
                  ? 'bg-[#0EA5A8] text-white rounded-tr-none'
                  : 'bg-white text-[#172033] border border-[#D9E4E5] rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/5 text-[9px] opacity-75">
                <span className="font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender === 'ai' && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.text)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                    title="Read this aloud"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-white border border-[#D9E4E5] flex items-center justify-center text-[#0EA5A8] shadow-2xs">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#D9E4E5] text-xs text-[#64748B] flex items-center gap-2 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] animate-ping" />
              <span>MediKiosk AI Bot analyzing summary data...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 4. CHAT INPUT BAR (Voice & Text) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-50 border-rose-400 text-rose-600 animate-pulse'
              : 'bg-[#F8FAFC] border-[#D9E4E5] text-[#172033] hover:text-[#0EA5A8] hover:border-[#0EA5A8]/40'
          }`}
          title={isListening ? 'Stop listening' : 'Ask question by voice'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? 'Listening to your voice...' : 'Ask the AI Bot anything about your summary...'}
          className="flex-1 bg-[#F8FAFC] border border-[#D9E4E5] focus:border-[#0EA5A8] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#172033] placeholder:text-[#64748B] focus:outline-none transition-colors"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || loading}
          className="px-4 py-2.5 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask Bot</span>
        </button>
      </div>

      {/* 5. VIEW ORIGINAL AI BOT INTAKE DIALOGUE (EXACT ACCORDION MATCH TO IMAGE 1) */}
      <div className="pt-2 border-t border-[#D9E4E5] space-y-3">
        <button
          type="button"
          onClick={() => setShowInterviewTranscript(!showInterviewTranscript)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#E6F7F7] border border-[#D9E4E5] hover:border-[#0EA5A8]/40 transition-all text-left cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#172033] group-hover:text-[#0EA5A8] transition-colors">
            <MessageSquare className="w-4 h-4 text-[#0EA5A8]" />
            <span>
              View Original AI Bot Intake Dialogue ({interviewResponses.length} Q&amp;A Turns Recorded)
            </span>
          </div>
          {showInterviewTranscript ? (
            <ChevronUp className="w-4 h-4 text-[#64748B] group-hover:text-[#0EA5A8]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0EA5A8]" />
          )}
        </button>

        {showInterviewTranscript && (
          <div className="space-y-3 pt-1">
            {interviewResponses.length > 0 ? (
              interviewResponses.map((qa, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#D9E4E5] space-y-2 shadow-2xs hover:border-[#0EA5A8]/40 transition-all text-left"
                >
                  {/* Turn Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0EA5A8]">
                      <Bot className="w-3.5 h-3.5 text-[#0EA5A8] shrink-0" />
                      <span>Turn {idx + 1} • AI Question:</span>
                    </div>
                    {qa.inputMode && (
                      <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                        {qa.inputMode === 'voice' && <Mic className="w-3 h-3 text-sky-600" />}
                        {qa.inputMode === 'document' && <FileText className="w-3 h-3 text-teal-600" />}
                        <span className="capitalize">{qa.inputMode}</span>
                      </span>
                    )}
                  </div>

                  {/* AI Question Text */}
                  <p className="text-xs text-[#172033] leading-relaxed font-medium">
                    {qa.question}
                  </p>

                  {/* Patient Answer Box */}
                  <div className="pt-2 border-t border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-[#64748B] font-medium block">
                      Patient Answer:
                    </span>
                    <p className="text-xs font-semibold text-[#172033] italic">
                      "{qa.answer}"
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-[#64748B]">
                Intake responses recorded in clinical summary narrative above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
