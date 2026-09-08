import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HeartPulse,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Mic,
  Camera,
  FileText,
  Clock,
  CheckCircle2,
  Stethoscope,
  Search,
  Pill,
  ShieldAlert,
  Share2,
  Users,
  Award,
  Layers,
  ChevronRight,
  Shield,
  Workflow,
  X,
  Lock,
  Check,
  Eye,
  Activity,
  UserCheck,
  AlertCircle,
  Database,
  ExternalLink,
  Scan,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Hero3DHealthcareVisual } from '../components/common/Hero3DHealthcareVisual';
import { MediKioskLogo } from '../components/common/MediKioskLogo';
import { MagneticButton } from '../components/common/MagneticButton';
import { TiltCard } from '../components/common/TiltCard';
import ThreeDAnatomyViewer from '../components/patient/ThreeDAnatomyViewer';
import { WorkingFlowchart } from '../components/common/WorkingFlowchart';

export const HomePage = ({
  onOpenLogin,
  onOpenRegister,
  onNavigatePortal,
  onOpenIntegrations,
  onOpenAICheckup,
}) => {
  const { isAuthenticated, role } = useAuth();
  const { currentLanguage, t } = useLanguage();

  // Scroll position for parallax & transformation effects (Section 38, 41, 42)
  const [scrollY, setScrollY] = useState(0);

  // 10-Step Interactive Stepper state
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // Experience Preview Modal state: null | 'patient' | 'doctor'
  const [previewModalRole, setPreviewModalRole] = useState(null);

  // Medical Report Laser Scanning Animation state (Section 52)
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Scanning, 2: Extracted
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToHowItWorks = () => {
    const elem = document.getElementById('how-it-works');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToWhoAreYou = () => {
    const elem = document.getElementById('who-are-you');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  // Handlers for "Explore Patient Experience" and "Explore Doctor Experience"
  const handleExplorePatient = () => {
    if (isAuthenticated && role === 'patient') {
      onNavigatePortal('patient');
    } else {
      setPreviewModalRole('patient');
    }
  };

  const handleExploreDoctor = () => {
    if (isAuthenticated && role === 'doctor') {
      onNavigatePortal('doctor');
    } else {
      setPreviewModalRole('doctor');
    }
  };

  // Interactive Scan Simulation Trigger
  const triggerScanSimulation = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(1);
    setTimeout(() => {
      setScanStep(2);
      setIsScanning(false);
    }, 2400);
  };

  // 10-Step Pipeline Definition
  const workflowSteps = [
    {
      num: '01',
      title: 'Patient Arrival & Language Selection',
      tag: 'Intake',
      desc: 'Patient approaches MediKiosk and selects their native language from 51 international & Indian languages with instant audio prompts.',
      icon: MessageSquare,
      color: '#0EA5A8',
    },
    {
      num: '02',
      title: 'Digital Intake & Symptom Entry',
      tag: 'Check-In',
      desc: 'Patient provides basic check-in details and initiates their guided health consultation session securely.',
      icon: Users,
      color: '#0EA5A8',
    },
    {
      num: '03',
      title: 'Voice & Text Pre-Consultation AI',
      tag: 'Clinical AI',
      desc: 'Empathetic conversational assistant asks follow-up clinical questions based on symptoms, duration, and severity.',
      icon: Mic,
      color: '#0EA5A8',
    },
    {
      num: '04',
      title: 'Hospital Report OCR & Strict Validation',
      tag: 'Vision OCR',
      desc: 'Camera or file upload for lab reports, prescriptions, and scans. Strict AI rejection filters out non-medical images (food, personal photos).',
      icon: Camera,
      color: '#0284C7',
    },
    {
      num: '05',
      title: 'AI Clinical Summary & Red-Flag Triage',
      tag: 'Safety Guard',
      desc: 'Immediate emergency alert triggers for acute red-flags (chest pain, stroke symptoms). Generates a structured clinical digest.',
      icon: ShieldAlert,
      color: '#F59E0B',
    },
    {
      num: '06',
      title: 'Unique OP Number Generated',
      tag: 'Zero-Trust ID',
      desc: 'System assigns a confidential 5-digit Outpatient (OP) Number. This acts as the patient’s authorization token for the doctor.',
      icon: Lock,
      color: '#0EA5A8',
    },
    {
      num: '07',
      title: 'Doctor Cabin Queue & Dashboard',
      tag: 'Clinical Queue',
      desc: 'Attending physician opens their dashboard to view incoming patient arrivals with structured chief complaints and extracted vitals.',
      icon: Stethoscope,
      color: '#0284C7',
    },
    {
      num: '08',
      title: 'OP Number Verification Gate',
      tag: 'Authorization',
      desc: 'Doctor requests OP number from patient. Prescription authoring is strictly locked until the OP number is matched and verified.',
      icon: CheckCircle2,
      color: '#0284C7',
    },
    {
      num: '09',
      title: '10,000+ Medicine Formulary & Digital Rx',
      tag: 'Prescription',
      desc: 'Doctor searches comprehensive medical formulary by generic or brand name, sets dosage schedules, and issues a verified digital Rx.',
      icon: Pill,
      color: '#8B5CF6',
    },
    {
      num: '10',
      title: 'ABDM & FHIR Longitudinal Record Synced',
      tag: 'Interoperability',
      desc: 'Final prescription and clinical encounter bundle synced to patient profile, ready for FHIR R4 JSON export and Ayushman Bharat (ABDM).',
      icon: Share2,
      color: '#10B981',
    },
  ];

  return (
    <div key={currentLanguage} className="pt-20 sm:pt-24 pb-20 bg-[#F3F8F8] text-[#172033] relative overflow-hidden">
      
      {/* PARALLAX BACKGROUND ACCENTS (Section 42) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft slow medical circle 1 */}
        <div
          className="absolute top-24 left-[10%] w-96 h-96 rounded-full bg-[#0EA5A8]/5 blur-3xl will-change-transform"
          style={{ transform: `translate3d(0, ${scrollY * -0.05}px, 0)` }}
        />
        {/* Soft slow medical circle 2 */}
        <div
          className="absolute top-[40rem] right-[8%] w-[500px] h-[500px] rounded-full bg-[#0284C7]/5 blur-3xl will-change-transform"
          style={{ transform: `translate3d(0, ${scrollY * 0.08}px, 0)` }}
        />
        {/* Floating cross icon parallax */}
        <div
          className="absolute top-80 right-[25%] opacity-15 text-[#0EA5A8] will-change-transform"
          style={{ transform: `translate3d(0, ${scrollY * -0.12}px, 0)` }}
        >
          <div className="w-8 h-2 bg-[#0EA5A8] rounded-full relative">
            <div className="w-2 h-8 bg-[#0EA5A8] rounded-full absolute -top-3 left-3" />
          </div>
        </div>
      </div>

      {/* 1. 3D HERO SECTION (2-COLUMN PREMIUM LAYOUT WITH SCROLL TRANSFORMATION) */}
      <section
        id="home"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:py-20 transition-all duration-300 ease-out"
        style={{
          transform: `translate3d(0, ${Math.min(scrollY * 0.08, 30)}px, 0) scale(${Math.max(1 - scrollY * 0.0002, 0.96)})`,
          opacity: Math.max(1 - scrollY * 0.0009, 0.6),
        }}
      >
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Clean Apple-Style Typography & Primary CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Subtle Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs font-semibold text-[#0EA5A8] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0EA5A8] animate-pulse" />
              <span>{t('AI-POWERED HEALTHCARE ASSISTANT', 'AI-POWERED HEALTHCARE ASSISTANT')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#172033] leading-[1.08]">
              Healthcare information,{' '}
              <span className="bg-gradient-to-r from-[#0EA5A8] via-[#0284C7] to-[#0EA5A8] bg-clip-text text-transparent">
                made smarter
              </span>
            </h1>

            {/* Supporting Subtitle */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl leading-relaxed font-normal">
              {t(
                'AI-powered pre-consultation that helps patients communicate their health information and helps doctors review clinical summaries in seconds.',
                'AI-powered pre-consultation that helps patients communicate their health information and helps doctors review clinical summaries in seconds.'
              )}
            </p>

            {/* Magnetic Action Buttons (Section 37, 54) */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <MagneticButton maxOffset={6}>
                <button
                  onClick={() => onOpenRegister && onOpenRegister()}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0C8F92] hover:to-[#0369A1] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <span>{t('Get Started', 'Get Started')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </MagneticButton>

              <MagneticButton maxOffset={5}>
                <button
                  onClick={scrollToHowItWorks}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-[#F3F8F8] text-[#172033] border border-[#D9E4E5] text-sm font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2 group"
                >
                  <span>{t('Explore How It Works', 'Explore How It Works')}</span>
                  <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </MagneticButton>
            </div>

            {/* Trust Badges / Verification Row */}
            <div className="pt-6 border-t border-[#D9E4E5] grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                <span className="text-[11px] font-semibold text-[#475569]">HIPAA Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                <span className="text-[11px] font-semibold text-[#475569]">Zero-Trust OP Gate</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span className="text-[11px] font-semibold text-[#475569]">HL7 FHIR R4 Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span className="text-[11px] font-semibold text-[#475569]">Clinical Triage AI</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Three.js 3D Healthcare Visual with Parallax Response */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full relative">
              <Hero3DHealthcareVisual />
            </div>
          </div>

        </div>

      </section>

      {/* 2. WHO ARE YOU? DUAL CARDS SECTION (3D TILT CARDS, NO DUPLICATE LOGIN FORMS) */}
      <section id="who-are-you" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D9E4E5]">
        
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0EA5A8]">Portal Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] mt-2">
            {t('Designed for Patients & Healthcare Providers', 'Designed for Patients & Healthcare Providers')}
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
            {t(
              'Seamless collaboration before the consultation even begins. Select an experience below to explore the clinical features.',
              'Seamless collaboration before the consultation even begins. Select an experience below to explore the clinical features.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PATIENT CARD WITH 3D TILT (Section 48) */}
          <TiltCard maxTilt={4} lift={6} dataCursor="card">
            <div className="bg-white border border-[#D9E4E5] p-8 sm:p-10 rounded-3xl transition-all flex flex-col justify-between group relative overflow-hidden h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <HeartPulse className="w-7 h-7 text-[#0EA5A8]" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20">
                    Fast • Multilingual
                  </span>
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
                  {t('Patient Experience', 'Patient Experience')}
                </h3>
                <p className="text-xs text-[#0EA5A8] font-semibold mt-1">Smart Hospital Check-In & AI Triage Kiosk</p>
                
                <p className="text-xs text-[#64748B] mt-3 leading-relaxed">
                  Explain your health concerns in your native language, scan prior medical documents, and generate your private OP Number for your doctor visit.
                </p>

                <ul className="mt-6 space-y-3.5">
                  {[
                    '51-Language conversational AI health check-in',
                    'Voice speech recognition & natural audio responses',
                    'Multi-document hospital report OCR extraction',
                    'Strict filter rejecting non-medical & food photos',
                    'Confidential 5-digit Outpatient (OP) Number generated',
                    'Encrypted longitudinal timeline & digital prescription access',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-[#172033]">
                      <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{t(item, item)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explore Patient Experience button (Strictly NO login/register inputs) */}
              <div className="mt-8 pt-6 border-t border-[#D9E4E5]">
                <MagneticButton className="w-full" maxOffset={4}>
                  <button
                    onClick={handleExplorePatient}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer group/btn"
                  >
                    <span>{t('Explore Patient Experience', 'Explore Patient Experience')}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </MagneticButton>
              </div>
            </div>
          </TiltCard>

          {/* DOCTOR CARD WITH 3D TILT (Section 48) */}
          <TiltCard maxTilt={4} lift={6} dataCursor="card">
            <div className="bg-white border border-[#D9E4E5] p-8 sm:p-10 rounded-3xl transition-all flex flex-col justify-between group relative overflow-hidden h-full">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/20 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-7 h-7 text-[#0284C7]" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/20">
                    Clinical Intelligence
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
                  {t('Doctor Experience', 'Doctor Experience')}
                </h3>
                <p className="text-xs text-[#0284C7] font-semibold mt-1">Clinical Review & Digital Rx Station</p>
                
                <p className="text-xs text-[#64748B] mt-3 leading-relaxed">
                  Review structured pre-consultation briefings, enter patient OP numbers to authorize consultations, and write digital prescriptions with our 10,000+ formulary.
                </p>

                <ul className="mt-6 space-y-3.5">
                  {[
                    'Structured pre-consultation clinical briefings in seconds',
                    'Zero-trust OP number gate (prescriptions locked until verified)',
                    'Searchable formulary of 10,000+ generic & brand medicines',
                    'Smart dosage schedule builder (Morning / Noon / Night)',
                    'Doctor reviewed verification stamp & digital signature',
                    'HL7 FHIR R4 JSON export & Ayushman Bharat (ABDM) sync',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-[#172033]">
                      <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{t(item, item)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explore Doctor Experience button (Strictly NO login/register inputs) */}
              <div className="mt-8 pt-6 border-t border-[#D9E4E5]">
                <MagneticButton className="w-full" maxOffset={4}>
                  <button
                    onClick={handleExploreDoctor}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer group/btn"
                  >
                    <span>{t('Explore Doctor Experience', 'Explore Doctor Experience')}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </MagneticButton>
              </div>
            </div>
          </TiltCard>

        </div>

      </section>

      {/* 3. HOW IT WORKS & 10-STEP CLINICAL WORKFLOW */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D9E4E5]">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/25 text-xs font-semibold text-[#0EA5A8] mb-3 shadow-xs">
            <Workflow className="w-3.5 h-3.5" />
            <span>{t('Interactive 3D Simulation', 'Interactive 3D Simulation')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033]">
            {t('MediKiosk Architectural Workflow in 3D', 'MediKiosk Architectural Workflow in 3D')}
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-2xl mx-auto">
            {t(
              'Interactive 3D video simulation modeling the complete end-to-end clinical journey from patient kiosk check-in to AI pre-consultation, 3D anatomical triage, vision OCR, and doctor digital prescription.',
              'Interactive 3D video simulation modeling the complete end-to-end clinical journey from patient kiosk check-in to AI pre-consultation, 3D anatomical triage, vision OCR, and doctor digital prescription.'
            )}
          </p>
        </div>

        {/* INTERACTIVE CLINICAL WORKFLOW MODEL */}
        <div className="mb-14">
          <WorkingFlowchart
            onOpenCheckup={onOpenAICheckup}
            onNavigateTab={(tab) => {
              if (tab === 'interview' || tab === 'ai-checkup') onOpenAICheckup?.();
              else if (onNavigatePortal) onNavigatePortal('patient');
            }}
          />
        </div>

        {/* 10-STEP INTERACTIVE STEPPER TABS */}
        <div className="mb-10 bg-white p-4 rounded-3xl border border-[#D9E4E5] shadow-xs">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0EA5A8] animate-ping" />
              Interactive Step Navigator
            </span>
            <span className="text-xs font-mono text-[#0EA5A8] font-bold">
              Step {workflowSteps[activeWorkflowStep].num} of 10
            </span>
          </div>

          {/* Stepper Buttons Bar */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-6">
            {workflowSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeWorkflowStep === idx
                    ? 'bg-[#0EA5A8] text-white shadow-sm scale-102'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E6F7F7] hover:text-[#0EA5A8] border border-[#E2E8F0]'
                }`}
              >
                <span>{step.num}</span>
                <span className="text-[9px] truncate max-w-[50px] font-sans font-medium">{step.tag}</span>
              </button>
            ))}
          </div>

          {/* Active Step Highlight Card */}
          <div className="bg-gradient-to-r from-[#F8FAFC] to-[#E6F7F7]/40 p-6 rounded-2xl border border-[#D9E4E5] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E4E5] flex items-center justify-center text-[#0EA5A8] shadow-xs shrink-0">
                {React.createElement(workflowSteps[activeWorkflowStep].icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#0EA5A8]/15 text-[#0EA5A8]">
                    STEP {workflowSteps[activeWorkflowStep].num}
                  </span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {workflowSteps[activeWorkflowStep].tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#172033] mt-1">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => setActiveWorkflowStep((prev) => (prev > 0 ? prev - 1 : workflowSteps.length - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#D9E4E5] bg-white text-xs font-semibold text-[#172033] hover:bg-[#F3F8F8] transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setActiveWorkflowStep((prev) => (prev < workflowSteps.length - 1 ? prev + 1 : 0))}
                className="px-4 py-1.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3B. SECTION 52: INTERACTIVE MEDICAL REPORT SCANNING SIMULATION */}
        <div className="mt-12 bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E4E5] mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#0EA5A8]">Interactive Vision OCR</span>
              <h3 className="text-xl font-bold text-[#172033] mt-1">Medical Report Intelligent Scanner Demonstration</h3>
              <p className="text-xs text-[#64748B]">Simulate camera OCR scanning with our non-medical image rejection filter.</p>
            </div>
            <button
              onClick={triggerScanSimulation}
              disabled={isScanning}
              className="px-5 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
            >
              <Scan className="w-4 h-4" />
              <span>{isScanning ? 'Scanning...' : 'Test OCR Scan Simulation'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Document Card with Moving Laser Scanning Line */}
            <div className="md:col-span-6 relative bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] p-5 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0EA5A8]" />
                  <span className="text-xs font-bold text-[#172033]">CITY HOSPITAL - BIOCHEMISTRY PANEL</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">AUTHENTIC REPORT</span>
              </div>
              <div className="space-y-2 text-xs font-mono text-[#475569]">
                <div className="flex justify-between"><span>Patient: Verified Patient</span><span>Ref: #LAB-9042</span></div>
                <div className="flex justify-between"><span>Hemoglobin: 13.8 g/dL</span><span className="text-emerald-600">NORMAL</span></div>
                <div className="flex justify-between"><span>Fasting Blood Glucose: 94 mg/dL</span><span className="text-emerald-600">OPTIMAL</span></div>
                <div className="flex justify-between"><span>Total Cholesterol: 182 mg/dL</span><span className="text-emerald-600">NORMAL</span></div>
              </div>

              {/* Laser Scanning Line */}
              {isScanning && (
                <div
                  className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_12px_#38bdf8] pointer-events-none animate-[scanLaser_2.4s_ease-in-out_infinite]"
                  style={{
                    animation: 'scanLaser 2.2s ease-in-out infinite',
                  }}
                />
              )}
            </div>

            {/* Extraction Telemetry Results */}
            <div className="md:col-span-6 space-y-3">
              <div className="p-4 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-xs">
                <div className="flex items-center gap-2 font-bold text-[#172033] mb-1">
                  <ShieldAlert className="w-4 h-4 text-[#0EA5A8]" />
                  <span>Strict Non-Medical Filter Status:</span>
                </div>
                <p className="text-[#64748B] text-[11px]">
                  Uploaded image verified as genuine laboratory report. (Food images, pets, and non-clinical photos are automatically rejected by AI filter).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs">
                <span className="font-bold text-[#0EA5A8] block mb-1">Extracted Clinical Data:</span>
                <p className="text-[#172033] text-[11px] font-mono">
                  {scanStep === 2
                    ? '✓ Hemoglobin: 13.8 g/dL | Fasting Blood Sugar: 94 mg/dL | Cholesterol: 182 mg/dL'
                    : isScanning
                    ? 'Extracting OCR clinical values from document...'
                    : 'Click "Test OCR Scan Simulation" to run live extraction preview.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-PHASE DETAILED BREAKDOWN CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            {
              phase: 'Phase 01',
              title: 'Intake & AI Check-up',
              steps: 'Steps 01 - 04',
              desc: 'Language selection (51 languages), AI voice/text clinical check-in, and multi-report hospital OCR scanning with food rejection filter.',
              icon: MessageSquare,
              color: 'text-[#0EA5A8]',
              badgeBg: 'bg-[#E6F7F7] text-[#0EA5A8]',
            },
            {
              phase: 'Phase 02',
              title: 'AI Reasoning & Safety',
              steps: 'Step 05',
              desc: 'Rule-based emergency red-flag screening (cardiac alerts, stroke signs) and structured non-diagnostic summary generation.',
              icon: ShieldAlert,
              color: 'text-[#F59E0B]',
              badgeBg: 'bg-amber-50 text-[#F59E0B]',
            },
            {
              phase: 'Phase 03',
              title: 'OP Number & Routing',
              steps: 'Steps 06 - 07',
              desc: 'Patient receives confidential 5-digit OP Number and shares it securely with their selected attending physician.',
              icon: Lock,
              color: 'text-[#0284C7]',
              badgeBg: 'bg-sky-50 text-[#0284C7]',
            },
            {
              phase: 'Phase 04',
              title: 'Doctor Gate & Rx',
              steps: 'Steps 08 - 10',
              desc: 'Physician unlocks consultation via OP Number, accesses 10,000+ medicine formulary, issues digital Rx, and syncs FHIR records.',
              icon: Pill,
              color: 'text-[#8B5CF6]',
              badgeBg: 'bg-purple-50 text-[#8B5CF6]',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-[#D9E4E5] relative group hover:border-[#CBD5E1] transition-all shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">{item.phase}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${item.badgeBg}`}>{item.steps}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <h4 className="text-sm font-bold text-[#172033]">{item.title}</h4>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* 4. FEATURES BENTO GRID (WITH TILT CARDS) */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D9E4E5]">
        
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0EA5A8]">Core Infrastructure</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] mt-2">
            Engineered for Clinical Precision & Trust
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-2xl mx-auto">
            State-of-the-art healthcare architecture combining patient convenience with rigorous hospital security standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Voice & Text AI Pre-Consultation',
              desc: 'Conversational clinical triage with voice input and natural speech synthesis supporting 51 international & Indian languages.',
              icon: Mic,
              badge: '51 Languages',
            },
            {
              title: 'Hospital Report Vision OCR',
              desc: 'Optical character recognition extracting lab tests, hemoglobin, blood glucose, and clinical values with immediate summary.',
              icon: Camera,
              badge: 'Multi-Image OCR',
            },
            {
              title: 'Strict Non-Medical Document Filter',
              desc: 'Intelligent image classification that automatically rejects food, animals, landscapes, and non-hospital photographs.',
              icon: ShieldAlert,
              badge: 'Zero False Data',
            },
            {
              title: 'Zero-Trust OP Number Gate',
              desc: 'Prescription creation is cryptographically locked until doctor enters the patient’s confidential Outpatient Number.',
              icon: Lock,
              badge: 'Patient Security',
            },
            {
              title: '10,000+ Medicine Clinical Formulary',
              desc: 'Comprehensive formulary of generic names, dosage strengths, therapeutic classes, and morning/noon/night schedule builders.',
              icon: Pill,
              badge: '10,000+ Drugs',
            },
            {
              title: 'Emergency Red-Flag Screening',
              desc: 'Instant detection of acute emergency symptoms (cardiac events, stroke, respiratory distress) with rapid 112/108 alerts.',
              icon: HeartPulse,
              badge: 'Emergency Triage',
            },
            {
              title: '3D Anatomical Spatial Visualizer',
              desc: 'Interactive Three.js human body hologram allowing patients to inspect and pinpoint symptom locations organ-by-organ.',
              icon: Sparkles,
              badge: 'Three.js 3D',
            },
            {
              title: 'HL7 FHIR R4 & ABDM Compliance',
              desc: 'Native interoperability supporting FHIR document bundles and Ayushman Bharat Digital Mission (M1/M2/M3) protocols.',
              icon: Share2,
              badge: 'FHIR R4 / ABDM',
            },
            {
              title: 'Supabase & Local Cloud Sync',
              desc: 'Reliable cloud persistence with automatic local database fallback, ensuring zero clinical downtime in hospital kiosks.',
              icon: Database,
              badge: '99.9% Uptime',
            },
          ].map((feat, idx) => (
            <TiltCard key={idx} maxTilt={3} lift={4} dataCursor="card">
              <div className="bg-white p-7 rounded-3xl border border-[#D9E4E5] hover:border-[#CBD5E1] transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center">
                      <feat.icon className="w-5 h-5 text-[#0EA5A8]" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                      {feat.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#172033] mb-2">{feat.title}</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

      </section>

      {/* 4B. INTERACTIVE 3D ANATOMY SYMPTOM VISUALIZER (Three.js) */}
      <section id="3d-anatomy" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D9E4E5]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-semibold mb-3 border border-cyan-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Interactive Three.js 3D Feature</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033]">
            3D Human Body Symptom & Triage Visualizer
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-2xl mx-auto">
            Rotate the clean 3D anatomical model, select from 23 categorized body locations, and describe your symptoms for AI pre-consultation.
          </p>
        </div>

        <ThreeDAnatomyViewer
          onConfirmSymptoms={(data) => {
            if (onOpenAICheckup) onOpenAICheckup();
          }}
        />
      </section>

      {/* 5. TEAM & CLINICAL ADVISORY */}
      <section id="team" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D9E4E5]">
        
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0EA5A8]">Leadership & Advisory</span>
          <h2 className="text-3xl font-extrabold text-[#172033] mt-2">Clinical Advisory & Engineering Team</h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
            Combining physician experience with advanced artificial intelligence and healthcare software engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: 'Dr. Ananya Sharma, MD',
              role: 'Chief Medical Officer',
              sub: 'Internal Medicine & Clinical Safety',
              desc: 'Oversees pre-consultation reasoning rules, red-flag screening protocols, and clinical workflow validation.',
              tag: 'Clinical Lead',
            },
            {
              name: 'Vikram Malhotra',
              role: 'Lead Healthcare AI Architect',
              sub: 'Multimodal NLP & Clinical OCR',
              desc: 'Architect of the 51-language voice triage engine, hospital report vision OCR, and non-medical image filters.',
              tag: 'AI Systems',
            },
            {
              name: 'Priya Venkatesh',
              role: 'Health Informatics Specialist',
              sub: 'HL7 FHIR & ABDM Infrastructure',
              desc: 'Designs zero-trust OP number validation, electronic health record interoperability, and FHIR R4 document bundles.',
              tag: 'Informatics',
            },
            {
              name: 'Dr. Rajesh Nair, MS',
              role: 'Director of Hospital Operations',
              sub: 'Telehealth & Clinical Ergonomics',
              desc: 'Leads kiosk deployment ergonomics, reducing doctor cabin wait times and eliminating emergency bottlenecks.',
              tag: 'Hospital Ops',
            },
          ].map((member, idx) => (
            <TiltCard key={idx} maxTilt={3} lift={4} dataCursor="card">
              <div className="bg-white p-6 rounded-3xl border border-[#D9E4E5] shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] font-bold text-base mb-4 shadow-xs">
                    {member.name.split(' ')[1]?.[0] || 'M'}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                    {member.tag}
                  </span>
                  <h4 className="text-sm font-bold text-[#172033] mt-2">{member.name}</h4>
                  <p className="text-[11px] font-semibold text-[#0EA5A8]">{member.role}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">{member.sub}</p>
                  <p className="text-xs text-[#64748B] mt-3 leading-relaxed">{member.desc}</p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

      </section>

      {/* 6. ABOUT & MEDICAL DISCLAIMER */}
      <section id="about" className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 border-t border-[#D9E4E5] text-center space-y-6">
        
        <div className="flex items-center justify-center gap-2.5">
          <MediKioskLogo size={24} />
          <span className="text-sm font-bold text-[#172033]">MediKiosk Technology Platform</span>
        </div>

        {/* Calm Medical Disclaimer Notice (Section 57: Soft Pulse, Clear Icon, Non-Loud) */}
        <div className="p-6 rounded-3xl bg-white border border-[#D9E4E5] shadow-xs text-left flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">Clinical Disclaimer & Emergency Protocols</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              MediKiosk is an artificial intelligence-assisted pre-consultation tool designed to streamline intake and organize medical documents for licensed healthcare providers. MediKiosk does not replace professional medical diagnosis, treatment, or clinical emergency judgment. In the event of an acute medical emergency, call <strong>112</strong> or <strong>108</strong> immediately.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} MediKiosk. Built with HL7 FHIR R4 standards, ABDM sandbox integration, and zero-trust patient OP verification.
        </p>
      </section>

      {/* EXPERIENCE PREVIEW MODAL (Triggered by Explore Patient Experience / Explore Doctor Experience) */}
      {previewModalRole && (
        <div
          className="fixed inset-0 z-[99990] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalRole(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#D9E4E5] shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewModalRole(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {previewModalRole === 'patient' ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Patient Experience</h3>
                    <p className="text-xs text-[#0EA5A8] font-semibold">Smart Hospital Intake & AI Triage Kiosk</p>
                  </div>
                </div>

                <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] text-xs text-[#475569]">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0 mt-0.5" />
                    <span><strong>51 Languages:</strong> Conversational speech-to-text intake in Telugu, Hindi, English, Tamil, and 47 others.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0 mt-0.5" />
                    <span><strong>Hospital Report OCR:</strong> Upload lab results and blood tests. Our AI rejects non-medical photos automatically.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0EA5A8] shrink-0 mt-0.5" />
                    <span><strong>OP Number Security:</strong> You receive an Outpatient Number (#OP-XXXXX) that only you can share with your doctor.</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-[#64748B] mb-4">
                    To access your personalized patient health portal, use the Navbar controls or proceed below:
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <MagneticButton maxOffset={3}>
                      <button
                        onClick={() => {
                          setPreviewModalRole(null);
                          onOpenLogin('patient');
                        }}
                        className="w-full py-3 px-6 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        Sign In to Patient Portal
                      </button>
                    </MagneticButton>
                    <MagneticButton maxOffset={3}>
                      <button
                        onClick={() => {
                          setPreviewModalRole(null);
                          onOpenRegister();
                        }}
                        className="w-full py-3 px-6 rounded-xl bg-white hover:bg-[#F3F8F8] text-[#172033] border border-[#D9E4E5] text-xs font-bold transition-all cursor-pointer"
                      >
                        Create New Patient Account
                      </button>
                    </MagneticButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7]">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#172033]">Doctor Experience</h3>
                    <p className="text-xs text-[#0284C7] font-semibold">Clinical Review & Digital Rx Station</p>
                  </div>
                </div>

                <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] text-xs text-[#475569]">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                    <span><strong>Pre-Consultation Briefing:</strong> Read structured chief complaints and OCR clinical lab digests before patient enters.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                    <span><strong>OP Number Verification Gate:</strong> Enter patient’s OP number to unlock medical records and authorize prescriptions.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                    <span><strong>10,000+ Medicine Formulary:</strong> Search generics and brands, configure morning/noon/night doses, and issue verified Rx.</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-[#64748B] mb-4">
                    To access your clinical physician station, use the Navbar controls or proceed below:
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <MagneticButton maxOffset={3}>
                      <button
                        onClick={() => {
                          setPreviewModalRole(null);
                          onOpenLogin('doctor');
                        }}
                        className="w-full py-3 px-6 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        Sign In to Doctor Portal
                      </button>
                    </MagneticButton>
                    <MagneticButton maxOffset={3}>
                      <button
                        onClick={() => {
                          setPreviewModalRole(null);
                          onOpenRegister();
                        }}
                        className="w-full py-3 px-6 rounded-xl bg-white hover:bg-[#F3F8F8] text-[#172033] border border-[#D9E4E5] text-xs font-bold transition-all cursor-pointer"
                      >
                        Register Healthcare Provider Account
                      </button>
                    </MagneticButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
