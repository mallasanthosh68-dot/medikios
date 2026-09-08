import React, { useState } from 'react';
import {
  Globe,
  Box,
  User,
  LayoutDashboard,
  Stethoscope,
  Folder,
  Calendar,
  MessageSquare,
  Bot,
  Sparkles,
  Brain,
  ClipboardCheck,
  UploadCloud,
  FileSearch,
  Database,
  Cpu,
  Layers,
  Search,
  AlertTriangle,
  Siren,
  CheckCircle2,
  Edit3,
  Star,
  Video,
  Pill,
  Heart,
  ShieldCheck,
  Activity,
  Lock,
  Volume2,
  Bell,
  Network,
  ArrowRight,
  ArrowDown,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Workflow,
  ExternalLink,
  Eye,
  Download,
  Zap,
  Info,
  ChevronRight,
  Check,
  FileText,
  FileCheck,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export const WorkingFlowchart = ({ onNavigateTab, onOpenCheckup, isCompact = false }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'graphic'
  const [selectedPhase, setSelectedPhase] = useState('all'); // 'all' | 'intake' | 'engine' | 'consult' | 'backend'
  const [activeStepModal, setActiveStepModal] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 10 Steps Detailed Data
  const stepsData = [
    {
      step: 1,
      title: 'USER ACCESS',
      accentColor: 'blue',
      badgeBg: 'bg-blue-600',
      headerBg: 'from-blue-600 to-indigo-600',
      borderColor: 'border-blue-500/40',
      textColor: 'text-blue-400',
      phase: 'intake',
      items: [
        { icon: Globe, label: 'User opens MediKiosk Website' },
        { icon: Box, label: 'Register / Login' },
        { icon: User, label: 'Select Role (Patient / Doctor)' },
      ],
      description: 'The entry gateway where patients and doctors authenticate securely via phone OTP, password, or Aadhaar demo verification.',
      actionLabel: 'Switch Role / Profile',
      actionTab: 'profile',
    },
    {
      step: 2,
      title: 'DASHBOARD',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-600',
      headerBg: 'from-emerald-600 to-teal-600',
      borderColor: 'border-emerald-500/40',
      textColor: 'text-emerald-400',
      phase: 'intake',
      items: [
        { icon: User, label: 'Personalized Dashboard' },
        { icon: Stethoscope, label: 'AI Check-up (For Patients)' },
        { icon: Folder, label: 'My Reports (Upload & View)' },
        { icon: UserCheck, label: 'Find Doctors' },
        { icon: Calendar, label: 'Appointments' },
        { icon: MessageSquare, label: 'Chat with Doctor' },
      ],
      description: 'Central command portal organizing appointments, health metrics, quick checkups, and longitudinal diagnostic history.',
      actionLabel: 'View Main Dashboard',
      actionTab: 'dashboard',
    },
    {
      step: 3,
      title: 'AI HEALTH CHECK-UP',
      accentColor: 'amber',
      badgeBg: 'bg-amber-600',
      headerBg: 'from-amber-600 to-yellow-600',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-400',
      phase: 'intake',
      isHero: true,
      items: [
        { icon: Bot, label: 'Start AI Health Interview' },
        { icon: MessageSquare, label: 'AI asks questions based on symptoms' },
        { icon: Volume2, label: 'Patient answers (by text or voice)' },
        { icon: Brain, label: 'AI understands & asks next relevant question' },
        { icon: ClipboardCheck, label: 'Conversation continues until sufficient information collected' },
      ],
      description: 'Dynamic conversational triage conducted via real-time speech and text in English, Hindi, and Telugu.',
      actionLabel: 'Start Health Check Now',
      actionHandler: onOpenCheckup,
      actionTab: 'interview',
    },
    {
      step: 4,
      title: 'REPORT UPLOAD (OPTIONAL)',
      accentColor: 'purple',
      badgeBg: 'bg-purple-600',
      headerBg: 'from-purple-600 to-violet-600',
      borderColor: 'border-purple-500/40',
      textColor: 'text-purple-400',
      phase: 'intake',
      items: [
        { icon: UploadCloud, label: 'Upload Medical Reports' },
        { icon: FileText, label: 'OCR Extracts Text from Reports' },
        { icon: FileSearch, label: 'AI Analyzes & Extracts Relevant Information' },
        { icon: Database, label: 'Information Added to Interview Context' },
      ],
      description: 'Upload lab scans or prescriptions. OCR extracts numerical lab results and formats them into structured text documents, or pins original photos if unreadable.',
      actionLabel: 'Upload & View Reports',
      actionTab: 'records',
    },
    {
      step: 6,
      title: 'GENERATE SUMMARY',
      accentColor: 'blue',
      badgeBg: 'bg-blue-600',
      headerBg: 'from-blue-600 to-sky-600',
      borderColor: 'border-blue-500/40',
      textColor: 'text-blue-400',
      phase: 'consult',
      items: [
        { icon: ClipboardCheck, label: 'AI Generates Health Summary' },
        { icon: Activity, label: 'Main Concern, Symptoms, Duration & Onset' },
        { icon: AlertTriangle, label: 'Severity, Associated Symptoms, Red Flags' },
        { icon: Pill, label: 'Medical History, Medications & Allergies' },
        { icon: FileCheck, label: 'Reports & OCR Extractions Attached' },
        { icon: ShieldCheck, label: 'AI-generated summary – Doctor review required.' },
      ],
      description: 'Clinical-grade standardized summary formatted automatically for physician evaluation, requiring explicit doctor sign-off.',
      actionLabel: 'View Health Summary',
      actionTab: 'summary',
    },
    {
      step: 7,
      title: 'PATIENT REVIEW',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-600',
      headerBg: 'from-emerald-600 to-teal-600',
      borderColor: 'border-emerald-500/40',
      textColor: 'text-emerald-400',
      phase: 'consult',
      items: [
        { icon: User, label: 'Patient Reviews Summary' },
        { icon: Edit3, label: 'Edit / Add / Correct Information' },
        { icon: CheckCircle2, label: 'Confirm Summary' },
      ],
      description: 'Transparent patient empowerment allowing full review, corrections, and explicit consent before sharing with any healthcare specialist.',
      actionLabel: 'Review Summary Details',
      actionTab: 'summary',
    },
    {
      step: 8,
      title: 'SELECT DOCTOR',
      accentColor: 'amber',
      badgeBg: 'bg-amber-600',
      headerBg: 'from-amber-600 to-orange-600',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-400',
      phase: 'consult',
      items: [
        { icon: Search, label: 'Search / Filter Doctors' },
        { icon: Star, label: 'View Doctor Profile, Experience, Rating' },
        { icon: Calendar, label: 'Select Doctor & Send Summary' },
      ],
      description: 'Specialist discovery across Cardiology, Neurology, Pulmonology, Orthopedics, and General Medicine.',
      actionLabel: 'Browse Doctor Directory',
      actionTab: 'doctors',
    },
    {
      step: 9,
      title: 'DOCTOR CONSULTATION',
      accentColor: 'purple',
      badgeBg: 'bg-purple-600',
      headerBg: 'from-purple-600 to-violet-600',
      borderColor: 'border-purple-500/40',
      textColor: 'text-purple-400',
      phase: 'consult',
      items: [
        { icon: MessageSquare, label: 'Doctor Receives Summary' },
        { icon: Video, label: 'Chat / Audio / Video Consultation' },
        { icon: Pill, label: 'Doctor Sends Advice / Prescription (if any)' },
      ],
      description: 'The doctor reviews the AI-triaged dossier, conducts the consultation, and issues digitally verifiable e-prescriptions.',
      actionLabel: 'Consultations & Prescriptions',
      actionTab: 'prescriptions',
    },
    {
      step: 10,
      title: 'FOLLOW-UP',
      accentColor: 'rose',
      badgeBg: 'bg-rose-600',
      headerBg: 'from-rose-600 to-pink-600',
      borderColor: 'border-rose-500/40',
      textColor: 'text-rose-400',
      phase: 'consult',
      items: [
        { icon: Calendar, label: 'Book Follow-up Appointment' },
        { icon: Folder, label: 'View History & Previous Records' },
        { icon: Heart, label: 'Continuous Health Monitoring' },
      ],
      description: 'Longitudinal follow-ups, timeline tracking, and scheduled check-ins for chronic disease management.',
      actionLabel: 'Explore Health Timeline',
      actionTab: 'timeline',
    },
  ];

  // Step 5 AI Engine Deep Dive Data
  const knowledgeSpecialties = [
    'Respiratory Cases',
    'Digestive Cases',
    'Neurological Cases',
    'Cardiovascular Cases',
    'Dermatological Cases',
    'Musculoskeletal Cases',
    'ENT / Eye / Dental',
    'Fever / Pain / Fatigue',
    'Chronic Conditions',
    'Medication / Allergy',
    'Surgical History',
    'Emergency / Red Flag',
    '...and more',
  ];

  const interviewStateFields = [
    'Chief Complaint',
    'Symptoms',
    'Duration',
    'Location',
    'Severity',
    'Associated Symptoms',
    'Medical History',
    'Medications',
    'Allergies',
    'Previous Reports',
    '...and more',
  ];

  const backendComponents = [
    { title: 'Authentication & Authorization', icon: Lock, desc: 'JWT & ABHA Demo Gate', color: 'text-sky-400' },
    { title: 'Database (MongoDB)', icon: Database, desc: 'Patient history & In-Memory cache', color: 'text-emerald-400' },
    { title: 'AI Service (LLM / RAG)', icon: Brain, desc: 'Adaptive interview & summary model', color: 'text-indigo-400' },
    { title: 'OCR Service', icon: FileText, desc: 'Tesseract & text doc converter', color: 'text-purple-400' },
    { title: 'Speech STT & TTS', icon: Volume2, desc: 'Web Speech & audio synthesis', color: 'text-amber-400' },
    { title: 'Notification Service', icon: Bell, desc: 'Doctor alerts & dossier updates', color: 'text-teal-400' },
    { title: 'Red Flag Rule Engine', icon: AlertTriangle, desc: 'Critical symptom triage & warning', color: 'text-rose-400' },
    { title: 'File Storage (Reports)', icon: Folder, desc: 'Secure medical report storage', color: 'text-blue-400' },
  ];

  const keyFeatures = [
    '10,000+ Synthetic Conversation Knowledge',
    'Adaptive Questioning',
    'Multi-language (English / हिंदी / తెలుగు)',
    'Voice & Text Support',
    'Report Upload & OCR',
    'Red Flag Detection',
    'Secure & Private Healthcare',
  ];

  const handleStepAction = (step) => {
    if (step.actionHandler) {
      step.actionHandler();
    } else if (step.actionTab && onNavigateTab) {
      onNavigateTab(step.actionTab);
    }
  };

  return (
    <div className={`space-y-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-4 sm:p-10' : ''}`}>
      
      {/* 1. FLOWCHART BANNER & CONTROLS HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
        
        {/* Animated Background EKG / Pulse Line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 opacity-80" />
        <div className="absolute top-2 right-4 sm:right-8 opacity-20 pointer-events-none hidden md:block">
          <svg width="220" height="40" viewBox="0 0 220 40" fill="none">
            <path
              d="M0 20 H60 L70 5 L80 35 L90 10 L100 28 L110 20 H220"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5" />
                <span>System Architecture</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">v2.4 Live Flow</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>MediKiosk – Website Working Flowchart</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Powered Patient Check-up to Doctor Consultation Pipeline</span>
            </p>
          </div>

          {/* Controls: Mode Toggle, Fullscreen, Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-1">
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'interactive'
                    ? 'bg-emerald-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Theme Flow</span>
              </button>
              <button
                onClick={() => setViewMode('graphic')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'graphic'
                    ? 'bg-purple-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Original Diagram</span>
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Phase Filter Tabs (Interactive Mode) */}
        {viewMode === 'interactive' && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 mr-2 hidden sm:inline">Filter View:</span>
            {[
              { id: 'all', label: 'All 10 Steps + Architecture', icon: Layers },
              { id: 'intake', label: '1. Intake & Check-up (Steps 1-4)', icon: User },
              { id: 'engine', label: '2. AI Adaptive Engine (Step 5)', icon: Brain },
              { id: 'consult', label: '3. Summary & Doctor (Steps 6-10)', icon: UserCheck },
              { id: 'backend', label: '4. Backend & Tech Specs', icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = selectedPhase === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPhase(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* 2. MODE: ORIGINAL GRAPHIC VIEW */}
      {viewMode === 'graphic' && (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <h3 className="text-sm font-bold text-white">Full Resolution Architecture Blueprint</h3>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/flowchart/medikiosk-flowchart.svg"
                download="medikiosk-flowchart.svg"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Download Image</span>
              </a>
              <a
                href="/flowchart/medikiosk-flowchart.svg"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Fullscreen</span>
              </a>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 flex justify-center items-center p-2 sm:p-4">
            <img
              src="/flowchart/medikiosk-flowchart.svg"
              alt="MediKiosk Website Working Flowchart"
              className="max-w-full h-auto rounded-xl shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            />
          </div>
        </div>
      )}

      {/* 3. MODE: THEME-SUNK INTERACTIVE FLOWCHART */}
      {viewMode === 'interactive' && (
        <div className="space-y-8">
          
          {/* ========================================================================= */}
          {/* SECTION 1: INTAKE & CHECK-UP PIPELINE (STEPS 1 - 4) */}
          {/* ========================================================================= */}
          {(selectedPhase === 'all' || selectedPhase === 'intake') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-mono">
                  A
                </span>
                <span>Phase 1: Patient Intake & Check-up Onboarding</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {stepsData.slice(0, 4).map((step, idx) => (
                  <div
                    key={step.step}
                    className={`glass-panel-card p-5 rounded-2xl border ${step.borderColor} flex flex-col justify-between relative group hover:border-emerald-500/50`}
                  >
                    {/* Step Number Top Banner */}
                    <div>
                      <div className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${step.headerBg} text-white text-xs font-extrabold flex items-center justify-between mb-4 shadow-sm`}>
                        <span className="tracking-wider">{step.step}. {step.title}</span>
                        {idx < 3 && (
                          <span className="hidden lg:flex items-center text-white/70">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="space-y-2.5 mb-4">
                        {step.items.map((item, itemIdx) => {
                          const Icon = item.icon;
                          return (
                            <div key={itemIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                              <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="leading-snug">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Action Button */}
                    <div className="pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleStepAction(step)}
                        className={`w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold ${step.textColor} flex items-center justify-center gap-1.5 transition-all group-hover:border-slate-700`}
                      >
                        <span>{step.actionLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: AI INTERVIEW ENGINE (ADAPTIVE QUESTIONING) - STEP 5 DEEP DIVE */}
          {/* ========================================================================= */}
          {(selectedPhase === 'all' || selectedPhase === 'engine') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-mono">
                    B
                  </span>
                  <span>Phase 2: Core AI Adaptive Questioning Engine (Step 5)</span>
                </div>
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  Real-time Multi-turn Adaptive Loop
                </span>
              </div>

              {/* Main Step 5 Enclosure Container */}
              <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-indigo-500/40 relative overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90">
                
                {/* Header of Step 5 */}
                <div className="flex items-center justify-between border-b border-slate-800/90 pb-4 mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-xl font-extrabold text-white">
                        5. AI INTERVIEW ENGINE (ADAPTIVE QUESTIONING)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Synthesizes 10,000+ clinical conversations with real-time patient state tracking and red-flag escalation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid of 3 Columns: Left Knowledge, Center Brain, Right State & Red Flag */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left: Knowledge Base & Retrieval Engine (Cols 1-4) */}
                  <div className="lg:col-span-4 space-y-4">
                    
                    {/* Knowledge Base Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-sky-400 uppercase tracking-wider">
                        <Database className="w-4 h-4" />
                        <span>KNOWLEDGE BASE</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3 font-medium">
                        (10,000+ Synthetic Patient Conversations)
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                        {knowledgeSpecialties.map((spec, i) => (
                          <div key={i} className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                            <span className="truncate">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Down/Right Arrow to Retrieval Engine */}
                    <div className="flex justify-center text-indigo-400">
                      <ArrowDown className="w-5 h-5 animate-bounce" />
                    </div>

                    {/* Retrieval Engine Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        <Search className="w-4 h-4" />
                        <span>RETRIEVAL ENGINE</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Finds most relevant cases based on:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
                        <li>Symptoms & Onset Duration</li>
                        <li>Keywords & Medical Synonyms</li>
                        <li>Context & Prior Lab Trends</li>
                        <li>Patient Verbal Answers</li>
                      </ul>
                      <div className="mt-3 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-300 text-center">
                        ➔ Returns Top Relevant Examples
                      </div>
                    </div>

                  </div>

                  {/* Center: AI Interview Engine & Action Bubble (Cols 5-8) */}
                  <div className="lg:col-span-4 space-y-4">
                    
                    <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900/90 border-2 border-indigo-500/50 shadow-glow relative">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 mx-auto flex items-center justify-center text-indigo-300 mb-3">
                        <Bot className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-extrabold text-white text-center tracking-wider uppercase mb-3">
                        AI INTERVIEW ENGINE
                      </h3>

                      <div className="space-y-2 text-xs text-slate-300">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Understands Patient Answer</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Updates Interview State</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Checks Red Flags</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Finds Missing Information</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Selects Best Next Question</span>
                        </div>
                      </div>

                      {/* Asks Next Relevant Question Highlight Box */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-center text-xs shadow-lg animate-pulse-slow flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Asks Next Relevant Question</span>
                      </div>
                    </div>

                    {/* Patient Answers Loop Box */}
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>PATIENT ANSWERS (Text or Voice)</span>
                      </div>
                      <p className="text-[11px] text-emerald-400/90 font-mono">
                        ↻ Loop continues until no important information remains
                      </p>
                    </div>

                  </div>

                  {/* Right: Interview State & Red Flag Detector (Cols 9-12) */}
                  <div className="lg:col-span-4 space-y-4">
                    
                    {/* Interview State Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                        <ClipboardCheck className="w-4 h-4" />
                        <span>INTERVIEW STATE (Current Patient)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mt-3">
                        {interviewStateFields.map((field, i) => (
                          <div key={i} className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 truncate flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                            <span className="truncate">{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Red Flag Detector Card */}
                    <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        <span>RED FLAG DETECTOR</span>
                      </div>
                      <p className="text-xs text-rose-200">
                        Checks for High-Risk Symptoms (chest pain, shortness of breath, sudden numbness, high fever).
                      </p>
                      
                      <div className="p-3 rounded-xl bg-rose-900/40 border border-rose-500/50 space-y-1 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-300">
                          <Siren className="w-4 h-4 text-rose-400" />
                          <span>EMERGENCY RECOMMENDATION</span>
                        </div>
                        <p className="text-[11px] text-rose-200 font-semibold">
                          Advise Urgent Medical Attention (108 / 112 Helpline)
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: CONSULTATION & FOLLOW-UP PIPELINE (STEPS 6 - 10) */}
          {/* ========================================================================= */}
          {(selectedPhase === 'all' || selectedPhase === 'consult') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono">
                  C
                </span>
                <span>Phase 3: Clinical Summary, Doctor Consultation & Follow-up</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stepsData.slice(4, 9).map((step, idx) => (
                  <div
                    key={step.step}
                    className={`glass-panel-card p-4 sm:p-5 rounded-2xl border ${step.borderColor} flex flex-col justify-between relative group hover:border-emerald-500/50`}
                  >
                    {/* Header */}
                    <div>
                      <div className={`px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${step.headerBg} text-white text-xs font-extrabold flex items-center justify-between mb-3 shadow-sm`}>
                        <span className="truncate tracking-wider">{step.step}. {step.title}</span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {step.items.map((item, itemIdx) => {
                          const Icon = item.icon;
                          return (
                            <div key={itemIdx} className="flex items-start gap-2 text-[11px] text-slate-300">
                              <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 shrink-0 mt-0.5">
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="leading-tight">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleStepAction(step)}
                        className={`w-full py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold ${step.textColor} flex items-center justify-center gap-1 transition-all`}
                      >
                        <span>{step.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: BACKEND SYSTEM COMPONENTS & KEY FEATURES */}
          {/* ========================================================================= */}
          {(selectedPhase === 'all' || selectedPhase === 'backend') && (
            <div className="space-y-6">
              
              {/* Backend Components Section */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wider uppercase">
                    BACKEND SYSTEM COMPONENTS
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {backendComponents.map((comp, idx) => {
                    const Icon = comp.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-3"
                      >
                        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${comp.color} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">{comp.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{comp.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Features Section */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                    KEY PLATFORM FEATURES
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {keyFeatures.map((feat, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
