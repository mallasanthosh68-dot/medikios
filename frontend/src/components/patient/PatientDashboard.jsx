import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquareHeart,
  FileText,
  FileCheck,
  Clock,
  UserCheck,
  Pill,
  User,
  Bell,
  LogOut,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertTriangle,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  CheckCircle2,
  Calendar,
  Ticket,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { AIHealthCheckup } from './AIHealthCheckup';
import { ConsentModal } from './ConsentModal';
import { MedicalRecords } from './MedicalRecords';
import { HealthSummaryView } from './HealthSummaryView';
import { HealthTimeline } from './HealthTimeline';
import { DoctorDirectory } from './DoctorDirectory';
import { PatientPrescriptions } from './PatientPrescriptions';
import { AadhaarDemoModal } from './AadhaarDemoModal';
import { AICheckupPage } from '../../pages/AICheckupPage';

export const PatientDashboard = ({
  onLogout,
  onOpenAICheckup,
  initialSummary,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
  sidebarOpen = true,
  onToggleSidebar,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const { t, currentLanguageInfo } = useTranslation();
  const [internalActiveTab, setInternalActiveTab] = useState(() => initialSummary ? 'doctors' : 'dashboard');

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = controlledSetActiveTab || setInternalActiveTab;
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [activeSummary, setActiveSummary] = useState(initialSummary || null);
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [stats, setStats] = useState({
    documentsCount: 0,
    prescriptionsCount: 0,
    hasActiveSummary: false,
  });
  const [copiedOp, setCopiedOp] = useState(false);

  const handleCopyOp = () => {
    const op = user?.opNumber || profile?.opNumber;
    if (op) {
      navigator.clipboard.writeText(op);
      setCopiedOp(true);
      setTimeout(() => setCopiedOp(false), 2000);
    }
  };

  useEffect(() => {
    if (initialSummary) {
      setActiveSummary(initialSummary);
      setActiveTab('doctors');
    }
  }, [initialSummary]);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const [docsRes, rxRes, notifRes, reqRes, summaryRes] = await Promise.all([
        api.get('/documents').catch(() => ({ documents: [] })),
        api.get('/prescriptions').catch(() => ({ prescriptions: [] })),
        api.get('/notifications').catch(() => ({ notifications: [] })),
        api.get('/patients/doctor-requests').catch(() => ({ requests: [] })),
        api.get('/patients/summary/latest').catch(() => ({ summary: null })),
      ]);

      setNotifications(notifRes.notifications || []);
      setPrescriptions(rxRes.prescriptions || []);
      setDoctorRequests(reqRes.requests || []);
      if (summaryRes?.summary) {
        setActiveSummary((prev) => prev || summaryRes.summary);
      }
      setStats({
        documentsCount: docsRes.documents?.length || 0,
        prescriptionsCount: rxRes.prescriptions?.length || 0,
        hasActiveSummary: !!(summaryRes?.summary || initialSummary),
      });
    } catch (err) {
      console.error('Error loading patient workspace data:', err);
    }
  };

  const handleStartInterviewClick = () => {
    if (onOpenAICheckup) {
      onOpenAICheckup();
    } else {
      setIsConsentOpen(true);
    }
  };

  const handleConsentGranted = () => {
    setActiveTab('interview');
    setIsInterviewActive(true);
  };

  const handleSummaryReady = (summary) => {
    setActiveSummary(summary);
    setActiveTab('doctors');
  };

  const acceptedRequest = doctorRequests.find((r) => r.status === 'ACCEPTED');
  const latestPrescription = prescriptions.length > 0 ? prescriptions[0] : null;

  const navItems = [
    { id: 'dashboard', label: t('Dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'interview', label: t('AI Health Check-Up', 'AI Health Check-Up'), icon: MessageSquareHeart },
    { id: 'records', label: t('Medical Records', 'Medical Records'), icon: FileText },
    { id: 'summary', label: t('Health Summary', 'Health Summary'), icon: FileCheck },
    { id: 'timeline', label: t('Health Timeline', 'Health Timeline'), icon: Clock },
    { id: 'doctors', label: t('Doctors', 'Doctors'), icon: UserCheck },
    { id: 'prescriptions', label: t('Prescriptions', 'Prescriptions'), icon: Pill },
    { id: 'profile', label: t('Profile', 'Profile'), icon: User },
    { id: 'notifications', label: t('Notifications', 'Notifications'), icon: Bell, badge: notifications.filter((n) => !n.read).length },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] mt-16 flex overflow-hidden bg-[#F3F8F8] relative w-full">

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* PATIENT PORTAL SIDEBAR (Fixed to Screen, Logout at bottom) */}
      <aside
        className={`bg-white border-r border-[#D9E4E5] h-full flex flex-col justify-between shadow-xs transition-all duration-300 ease-in-out z-30 shrink-0 fixed md:static inset-y-0 left-0 top-16 md:top-0 ${sidebarOpen
            ? 'w-64 p-4 translate-x-0 opacity-100'
            : 'w-0 p-0 border-r-0 overflow-hidden opacity-0 pointer-events-none -translate-x-full md:translate-x-0 md:w-0'
          }`}
      >
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col min-h-0">
          {/* User Brief */}
          <div className="p-3.5 rounded-2xl bg-[#F3F8F8] border border-[#D9E4E5] mb-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] font-bold shadow-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-[#172033] truncate">{user?.name || 'Demo Patient'}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#0EA5A8] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E6F7F7] border border-[#0EA5A8]/20">
                  {user?.opNumber || profile?.opNumber || 'Patient Portal'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Scrollable in sidebar) */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'interview') {
                      handleStartInterviewClick();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#0EA5A8] font-bold shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="patient-active-sidebar-pill"
                      className="absolute inset-0 bg-[#E6F7F7] border border-[#0EA5A8]/30 rounded-xl shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="relative z-10 px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Fixed Logout Button at the Very End of Sidebar */}
        <div className="shrink-0 pt-3 border-t border-[#D9E4E5] mt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('Logout', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* PATIENT MAIN CONTENT AREA - Strictly only this scrolls */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F3F8F8] custom-scrollbar min-w-0">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
          {activeTab === 'dashboard' && (
            <div className="space-y-6">

              {/* Official Patient OPD Token Card */}
              <div className="bg-gradient-to-r from-[#E6F7F7] via-white to-[#F0FDF4] border-2 border-[#0EA5A8]/30 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0EA5A8] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0EA5A8]">
                        Hospital Outpatient Token (OPD)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Active OP Number
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-[#172033] font-mono tracking-wide">
                        {user?.opNumber || profile?.opNumber || 'OP-749210'}
                      </h3>
                      <button
                        onClick={handleCopyOp}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D9E4E5] hover:bg-[#F3F8F8] text-xs font-semibold text-[#172033] shadow-2xs transition-all"
                      >
                        {copiedOp ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#0EA5A8]" />
                            <span>Copy OP Number</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed max-w-2xl">
                      <strong className="text-[#172033]">Required for Doctor Consultation:</strong> Give this OP Number to your doctor. The doctor must enter your OP Number into their portal before they can prescribe and send medicines reports to you.
                    </p>
                  </div>
                </div>
              </div>

              {/* Welcome Banner */}
              <div className="bg-white p-5 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-xs relative overflow-hidden">
                <div className="max-w-2xl relative z-10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0EA5A8] block truncate">
                    {t('Welcome to Your Hospital Workspace', 'Welcome to Your Hospital Workspace')}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-extrabold text-[#172033] mt-1 break-words">
                    {t('Hello', 'Hello')}, {user?.name || t('Patient', 'Patient')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed break-words">
                    {t('Start an AI voice/text health check-up, upload medical documents, or share your structured health summary with your chosen specialist.', 'Start an AI voice/text health check-up, upload medical documents, or share your structured health summary with your chosen specialist.')}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button
                      onClick={handleStartInterviewClick}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 break-words whitespace-normal text-center min-w-0"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>{t('Start Health Check', 'Start Health Check')}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveTab('records')}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white border border-[#D9E4E5] hover:bg-[#F3F8F8] text-[#172033] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors break-words whitespace-normal text-center min-w-0 shadow-xs"
                    >
                      <UploadCloud className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                      <span>{t('Upload Reports', 'Upload Reports')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Doctor Accepted Checkup Alert Banner */}
              {acceptedRequest && (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('Doctor Accepted Your Health Summary', 'Doctor Accepted Your Health Summary')}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-[#172033]">
                          {t('You can go tomorrow for your checkup!', 'You can go tomorrow for your checkup!')}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#334155] mt-1.5">
                          <span className="font-semibold text-[#0F172A]">{acceptedRequest.doctorName || 'Dr. Specialist'}</span>
                          <span>•</span>
                          <span className="text-[#0EA5A8] font-medium">{acceptedRequest.specialty || 'General Physician'}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Calendar className="w-3 h-3" />
                            {acceptedRequest.appointmentDate || 'Tomorrow'} ({acceptedRequest.appointmentSlot || '10:00 AM - 01:00 PM'})
                          </span>
                        </div>
                        {acceptedRequest.doctorMessage && (
                          <p className="mt-2.5 text-xs text-[#475569] italic bg-white/60 p-2.5 rounded-xl border border-emerald-100">
                            "{acceptedRequest.doctorMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0 justify-end">
                      <button
                        onClick={() => setActiveTab('doctors')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t('Doctor Details', 'Doctor Details')}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t('View Timeline', 'View Timeline')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Prescribed Medicines Banner */}
              {latestPrescription && latestPrescription.medicines?.length > 0 && (
                <div className="bg-white border-2 border-[#0EA5A8]/30 rounded-3xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/30 text-[#0EA5A8] flex items-center justify-center">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-[#172033]">
                            {t('Medicines Prescribed by Doctor', 'Medicines Prescribed by Doctor')}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] text-[10px] font-bold">
                            {latestPrescription.doctorName || 'Doctor Visit'}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          {latestPrescription.diagnosis ? `Diagnosis: ${latestPrescription.diagnosis}` : 'Follow the dosage schedule below directly sent by your doctor.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 self-start md:self-auto"
                    >
                      <span>{t('Full Prescription & Schedule', 'Full Prescription & Schedule')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {latestPrescription.medicines.slice(0, 3).map((med, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-[#172033]">{med.medicineName}</span>
                            <span className="text-[11px] font-medium text-[#64748B]">{med.dosage}</span>
                          </div>
                          {med.instructions && (
                            <p className="text-[11px] text-[#64748B] mt-1 line-clamp-1">{med.instructions}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#E2E8F0]">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${med.frequency?.morning ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'}`}>
                            Morn
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${med.frequency?.noon ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400'}`}>
                            Noon
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${med.frequency?.night ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-400'}`}>
                            Night
                          </span>
                          {med.duration && (
                            <span className="text-[10px] text-[#64748B] ml-auto font-medium">
                              {med.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

                <div
                  onClick={() => setActiveTab('records')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B] font-semibold truncate">{t('Medical Documents', 'Medical Documents')}</span>
                    <FileText className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#172033]">{stats.documentsCount}</div>
                  <p className="text-[11px] text-[#64748B] mt-1 break-words">{t('Lab reports & scanned prescriptions', 'Lab reports & scanned prescriptions')}</p>
                </div>

                <div
                  onClick={() => setActiveTab('prescriptions')}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B] font-semibold truncate">{t('Digital Prescriptions', 'Digital Prescriptions')}</span>
                    <Pill className="w-4 h-4 text-[#0284C7] shrink-0" />
                  </div>
                  <div className="text-2xl font-extrabold text-[#172033]">{stats.prescriptionsCount}</div>
                  <p className="text-[11px] text-[#64748B] mt-1 break-words">{t('Active verified medication orders', 'Active verified medication orders')}</p>
                </div>

                <div
                  onClick={() => setIsAadhaarModalOpen(true)}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B] font-semibold truncate">{t('ABHA / Aadhaar ID', 'ABHA / Aadhaar ID')}</span>
                    <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                  </div>
                  <div className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
                    <span>{profile?.aadhaarDemoVerified ? '✓ Demo Verified' : 'Click to Verify (Demo)'}</span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 break-words">
                    {profile?.aadhaarDemoId || 'Simulate secure ABHA linkage'}
                  </p>
                </div>

              </div>

              {/* Quick Action: Timeline and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D9E4E5] flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0EA5A8] uppercase tracking-wider mb-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{t('Longitudinal Care', 'Longitudinal Care')}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#172033] break-words">{t('My Health Timeline', 'My Health Timeline')}</h3>
                    <p className="text-xs text-[#64748B] mt-1 break-words">
                      {t('Track your multi-year diagnostic reports, previous specialist reviews, and medication courses.', 'Track your multi-year diagnostic reports, previous specialist reviews, and medication courses.')}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="mt-4 sm:mt-6 text-xs text-[#0EA5A8] hover:text-[#0C8F92] font-bold flex items-center gap-1 transition-colors self-start break-words"
                  >
                    <span>{t('Explore Timeline', 'Explore Timeline')}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D9E4E5] flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase tracking-wider mb-2">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>{t('Hospital Specialist Network', 'Hospital Specialist Network')}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#172033] break-words">{t('Choose Your Doctor', 'Choose Your Doctor')}</h3>
                    <p className="text-xs text-[#64748B] mt-1 break-words">
                      {t('Search licensed doctors across Cardiology, Neurology, Pulmonology, Orthopedics, and more.', 'Search licensed doctors across Cardiology, Neurology, Pulmonology, Orthopedics, and more.')}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="mt-4 sm:mt-6 text-xs text-[#0284C7] hover:text-[#0369A1] font-bold flex items-center gap-1 transition-colors self-start break-words"
                  >
                    <span>{t('Browse Doctor Directory', 'Browse Doctor Directory')}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: AI HEALTH CHECK-UP */}
          {activeTab === 'interview' && (
            <AICheckupPage
              onExit={() => setActiveTab('dashboard')}
              onNavigateDoctor={(summary) => {
                setActiveSummary(summary);
                setActiveTab('doctors');
              }}
            />
          )}

          {/* TAB 3: MEDICAL RECORDS */}
          {activeTab === 'records' && (
            <MedicalRecords />
          )}

          {/* TAB 4: HEALTH SUMMARY */}
          {activeTab === 'summary' && (
            <HealthSummaryView
              summary={activeSummary}
              onChooseDoctor={() => setActiveTab('doctors')}
            />
          )}

          {/* TAB 5: HEALTH TIMELINE */}
          {activeTab === 'timeline' && (
            <HealthTimeline />
          )}

          {/* TAB 6: DOCTORS */}
          {activeTab === 'doctors' && (
            <DoctorDirectory
              summary={activeSummary}
              onDoctorRequestSent={() => setActiveTab('summary')}
            />
          )}

          {/* TAB 7: PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <PatientPrescriptions />
          )}

          {/* TAB 8: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] max-w-2xl mx-auto space-y-5 shadow-xs">
              <h3 className="text-xl font-bold text-[#172033]">Patient Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                  <span className="text-[#64748B] block">Name</span>
                  <strong className="text-[#172033] text-sm">{user?.name}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                  <span className="text-[#64748B] block">Phone</span>
                  <strong className="text-[#172033] font-mono text-sm">{user?.phoneNumber}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                  <span className="text-[#64748B] block">Age / Gender</span>
                  <strong className="text-[#172033] text-sm">{profile?.age} Yrs / {profile?.gender}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                  <span className="text-[#64748B] block">Blood Group</span>
                  <strong className="text-[#172033] text-sm">{profile?.bloodGroup || 'Not specified'}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                  <span className="text-[#64748B] block">Weight / Height</span>
                  <strong className="text-[#172033] text-sm">{profile?.weight || '—'} kg / {profile?.height || '—'} cm</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                  <span className="text-[#64748B] block">ABHA Simulation ID</span>
                  <strong className="text-[#0EA5A8] font-mono">{profile?.aadhaarDemoId || 'Not linked'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
              <h3 className="text-xl font-bold text-[#172033]">Notifications</h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-[#64748B] py-6 text-center">No notifications at this time.</p>
              ) : (
                notifications.map((n, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5] text-xs flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-[#172033]">{n.title}</h5>
                      <p className="text-[#64748B] mt-0.5">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Patient Consent Gate Modal */}
      <ConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        onConsentGranted={handleConsentGranted}
      />

      {/* Aadhaar Demo Verification Modal */}
      <AadhaarDemoModal
        isOpen={isAadhaarModalOpen}
        onClose={() => setIsAadhaarModalOpen(false)}
        onVerified={refreshProfile}
      />

    </div>
  );
};

