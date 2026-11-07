import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Inbox,
  FileCheck2,
  FileText,
  Search,
  Pill,
  Bell,
  User,
  LogOut,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  Ticket,
  Printer,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { PatientDossierModal } from './PatientDossierModal';
import { MedicineSearchBox } from './MedicineSearchBox';
import { DigitalPrescriptionBuilder } from './DigitalPrescriptionBuilder';
import { HealthSummaryView } from '../patient/HealthSummaryView';

export const DoctorDashboard = ({
  onLogout,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
  sidebarOpen = true,
  onToggleSidebar,
}) => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = controlledSetActiveTab || setInternalActiveTab;
  const [requests, setRequests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Direct OP Intake & Summary Lookup State
  const [opInput, setOpInput] = useState('');
  const [opLoading, setOpLoading] = useState(false);
  const [opError, setOpError] = useState('');
  const [opFoundSummary, setOpFoundSummary] = useState(null);
  const [opFoundPatient, setOpFoundPatient] = useState(null);

  const [selectedDossier, setSelectedDossier] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const [prescriptionTarget, setPrescriptionTarget] = useState(null);
  const [prescriptionRequestId, setPrescriptionRequestId] = useState(null);
  const [prescriptionPrefillMedicine, setPrescriptionPrefillMedicine] = useState(null);
  const [printingRx, setPrintingRx] = useState(null);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [reqRes, rxRes, notifRes] = await Promise.all([
        api.get('/doctor/requests').catch(() => ({ requests: [] })),
        api.get('/prescriptions').catch(() => ({ prescriptions: [] })),
        api.get('/notifications').catch(() => ({ notifications: [] })),
      ]);

      setRequests(reqRes.requests || []);
      setPrescriptions(rxRes.prescriptions || []);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Error loading doctor workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupOp = async (targetOp) => {
    let cleanOp = (targetOp || opInput || '').trim().toUpperCase();
    if (!cleanOp) {
      setOpError('Please enter an OP Number to look up (e.g. OP-447118 or 447118).');
      return;
    }
    if (/^\d{6}$/.test(cleanOp)) {
      cleanOp = `OP-${cleanOp}`;
      setOpInput(cleanOp);
    }
    setOpLoading(true);
    setOpError('');
    try {
      const res = await api.post('/doctor/lookup-op', { opNumber: cleanOp });
      if (res.success && res.summary) {
        setOpFoundSummary(res.summary);
        setOpFoundPatient(res.patient || {
          name: res.summary.patientName || 'Patient',
          opNumber: res.opNumber || cleanOp,
          id: res.summary.patientId || 'patient-op-direct',
          age: res.summary.patientAge,
          gender: res.summary.patientGender,
          phone: res.summary.patientPhone,
        });
        setOpError('');
        setActiveTab('op_lookup');
      } else {
        setOpFoundSummary(null);
        setOpFoundPatient(null);
        setOpError(res.message || `No clinical summary found for OP: ${cleanOp}`);
      }
    } catch (err) {
      setOpFoundSummary(null);
      setOpFoundPatient(null);
      setOpError(err.message || `Could not find an AI health summary for OP: ${cleanOp}. Please check the OP number.`);
    } finally {
      setOpLoading(false);
    }
  };

  const handleClearOp = () => {
    setOpInput('');
    setOpFoundSummary(null);
    setOpFoundPatient(null);
    setOpError('');
  };

  const handleStartPrescriptionFromOp = () => {
    if (!opFoundSummary) return;
    const target = {
      id: opFoundPatient?.id || opFoundPatient?._id || opFoundSummary.patientId || 'patient-op-direct',
      name: opFoundPatient?.name || opFoundSummary?.patientName || 'Patient',
      opNumber: opFoundSummary.opNumber || opFoundPatient?.opNumber,
      age: opFoundPatient?.age || opFoundSummary?.patientAge,
      gender: opFoundPatient?.gender || opFoundSummary?.patientGender,
      phoneNumber: opFoundPatient?.phoneNumber || opFoundPatient?.phone || opFoundSummary?.patientPhone,
      abhaId: opFoundPatient?.abhaId || opFoundSummary?.abhaId || '',
      isOpVerified: true,
      chiefComplaint: opFoundSummary?.chiefComplaint || '',
      diagnosis: opFoundSummary?.aiClinicalEvaluation?.provisionalDiagnosis || opFoundSummary?.chiefComplaint || 'Provisional Clinical Assessment',
    };
    handleStartPrescription(target, null);
  };

  const handleOpenDossierFromOp = () => {
    if (!opFoundSummary) return;
    setSelectedDossier({
      request: {
        _id: opFoundSummary._id,
        patientId: opFoundPatient?.id || opFoundPatient?._id || opFoundSummary.patientId,
        patientName: opFoundPatient?.name || opFoundSummary.patientName || 'Patient',
        patientAge: opFoundSummary.patientAge,
        patientGender: opFoundSummary.patientGender,
        chiefComplaint: opFoundSummary.chiefComplaint,
        status: opFoundSummary.caseStatus === 'PHYSICIAN_CONFIRMED' ? 'REVIEWED' : 'PENDING',
        clinicalNotes: opFoundSummary.doctorReview?.clinicalNotes || '',
        priority: opFoundSummary.redFlagStatus === 'HIGH_PRIORITY' ? 'HIGH_PRIORITY' : 'ROUTINE',
      },
      patient: opFoundPatient || {
        name: opFoundSummary.patientName || 'Patient',
        age: opFoundSummary.patientAge,
        gender: opFoundSummary.patientGender,
        phoneNumber: opFoundSummary.patientPhone || '—',
        bloodGroup: '—',
      },
      summary: opFoundSummary,
      interview: { responses: opFoundSummary.interviewResponses || [] },
      documents: opFoundSummary.pinnedReports || [],
      extractions: [],
      timeline: [],
    });
    setIsDossierOpen(true);
  };

  const handleOpenDossier = async (reqId) => {
    try {
      const res = await api.get(`/doctor/requests/${reqId}`);
      if (res.success) {
        setSelectedDossier(res);
        setIsDossierOpen(true);
      }
    } catch (err) {
      alert('Failed to load patient dossier: ' + err.message);
    }
  };

  const handleStartPrescription = (patient, reqId) => {
    setPrescriptionTarget(patient);
    setPrescriptionRequestId(reqId);
    setActiveTab('rx_builder');
  };

  const navItems = [
    { id: 'dashboard', label: t('Dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'op_lookup', label: t('OP Direct Intake', 'OP Direct Intake'), icon: Ticket, badge: opFoundSummary ? '1' : 0 },
    { id: 'requests', label: t('Patient Requests', 'Patient Requests'), icon: Inbox, badge: requests.filter((r) => r.status === 'PENDING').length },
    { id: 'patients', label: t('Patients', 'Patients'), icon: Users },
    { id: 'summaries', label: t('Health Summaries', 'Health Summaries'), icon: FileCheck2 },
    { id: 'documents', label: t('Medical Documents', 'Medical Documents'), icon: FileText },
    { id: 'medicines', label: t('Medicine Search', 'Medicine Search'), icon: Search },
    { id: 'prescriptions', label: t('Prescriptions', 'Prescriptions'), icon: Pill },
    { id: 'notifications', label: t('Notifications', 'Notifications'), icon: Bell, badge: notifications.filter((n) => !n.read).length },
    { id: 'profile', label: t('Profile', 'Profile'), icon: User },
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

      {/* DOCTOR SIDEBAR (Fixed to Screen, Logout at bottom) */}
      <aside
        className={`bg-white border-r border-[#D9E4E5] h-full flex flex-col justify-between shadow-xs transition-all duration-300 ease-in-out z-30 shrink-0 fixed md:static inset-y-0 left-0 top-16 md:top-0 ${
          sidebarOpen
            ? 'w-64 p-4 translate-x-0 opacity-100'
            : 'w-0 p-0 border-r-0 overflow-hidden opacity-0 pointer-events-none -translate-x-full md:translate-x-0 md:w-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col min-h-0">
          {/* Doctor Brief Card */}
          <div className="p-3.5 rounded-2xl bg-[#F3F8F8] border border-[#D9E4E5] mb-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7] font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-[#172033] truncate">{user?.name || 'Dr. Physician'}</h4>
              <span className="text-[11px] text-[#0284C7] block font-semibold truncate">
                {profile?.specialization || 'Clinical Specialist'}
              </span>
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
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#0284C7] font-bold shadow-xs'
                      : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="doctor-active-sidebar-pill"
                      className="absolute inset-0 bg-[#E0F2FE] border border-[#0284C7]/30 rounded-xl shadow-xs"
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

        {/* Fixed Doctor Status Badge & Logout at End of Sidebar */}
        <div className="shrink-0 pt-3 border-t border-[#D9E4E5] mt-2 space-y-2.5">
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-[10px] text-[#0284C7] flex items-center gap-2 break-words">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
            <span className="truncate font-medium">{t('NMC Demo Verified', 'NMC Demo Verified')}: {profile?.licenseNumber || 'MCI-REG-01'}</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t('Logout', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* DOCTOR MAIN CONTENT AREA - Strictly only this scrolls */}
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
          {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Stat Banner */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#0284C7]/20 text-xs font-semibold text-[#0284C7] mb-2">
                    <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('Clinical Physician Station', 'Clinical Physician Station')}</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-extrabold text-[#172033] break-words">
                    {t('Welcome', 'Welcome')}, {user?.name || t('Doctor', 'Doctor')}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 break-words">
                    {t('Department', 'Department')}: <strong className="text-[#172033]">{profile?.specialization || 'General Medicine'}</strong> • {profile?.hospitalAffiliation || 'MediKiosk Apex Hospital'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPrescriptionTarget({ name: 'Walk-In Patient', id: 'patient-walkin' });
                    setActiveTab('rx_builder');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-sm hover:shadow flex items-center gap-2 transition-all self-start sm:self-auto break-words whitespace-normal text-center min-w-0"
                >
                  <Pill className="w-4 h-4 shrink-0" />
                  <span>{t('Write Digital Prescription', 'Write Digital Prescription')}</span>
                </button>
              </div>
            </div>

            {/* DIRECT PATIENT OP INTAKE HERO CARD */}
            <div className="bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs shrink-0">
                    <Ticket className="w-6 h-6 text-sky-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200">
                        {t('Direct Outpatient Intake', 'Direct Outpatient Intake')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                        {t('Instant Summary Access', 'Instant Summary Access')}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black mt-0.5 text-white">
                      {t('Take Patient OP Number & View Summary Directly', 'Take Patient OP Number & View Summary Directly')}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-3xl">
                {t('Direct doctor-to-patient consultation active. When a patient arrives at your station with their generated OP token (e.g. OP-447118 or 447118), enter it below to immediately open their full AI Clinical Health Summary and issue prescriptions without administrative routing.',
                   'Direct doctor-to-patient consultation active. When a patient arrives at your station with their generated OP token (e.g. OP-447118 or 447118), enter it below to immediately open their full AI Clinical Health Summary and issue prescriptions without administrative routing.')}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupOp(opInput);
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
              >
                <div className="relative flex-1">
                  <Ticket className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" />
                  <input
                    type="text"
                    value={opInput}
                    onChange={(e) => setOpInput(e.target.value)}
                    placeholder={t('Enter Patient OP Number (e.g. OP-447118 or 447118)...', 'Enter Patient OP Number (e.g. OP-447118 or 447118)...')}
                    className="w-full pl-12 pr-16 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-sky-200/70 text-sm font-mono font-bold focus:outline-none focus:bg-white focus:text-[#172033] focus:border-white transition-all shadow-inner"
                  />
                  {opInput && (
                    <button
                      type="button"
                      onClick={() => setOpInput('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-300 hover:text-white text-xs font-bold"
                    >
                      {t('Clear', 'Clear')}
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={opLoading || !opInput.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-sky-50 text-[#0284C7] font-black text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {opLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{t('View Health Summary Directly', 'View Health Summary Directly')}</span>
                </button>
              </form>

              {opError && (
                <div className="p-3.5 rounded-xl bg-rose-500/25 border border-rose-400/40 text-rose-100 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300" />
                  <span>{opError}</span>
                </div>
              )}

              {opFoundSummary && (
                <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                    <div>
                      <span className="font-bold text-white">
                        Active OP Loaded: <span className="font-mono text-emerald-300">{opFoundSummary.opNumber}</span> ({opFoundSummary.patientName})
                      </span>
                      <p className="text-[11px] text-sky-200 line-clamp-1">{opFoundSummary.chiefComplaint}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('op_lookup')}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <span>Open Loaded Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Metrics Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <div
                onClick={() => setActiveTab('requests')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#64748B] font-semibold truncate">{t('Pending Triage Requests', 'Pending Triage Requests')}</span>
                  <Inbox className="w-4 h-4 text-[#D97706] shrink-0" />
                </div>
                <div className="text-2xl font-extrabold text-[#172033]">
                  {requests.filter((r) => r.status === 'PENDING').length}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 break-words">{t('Awaiting clinical dossier review', 'Awaiting clinical dossier review')}</p>
              </div>

              <div
                onClick={() => setActiveTab('requests')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#64748B] font-semibold truncate">{t('Tomorrow Checkups', 'Tomorrow Checkups')}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                </div>
                <div className="text-2xl font-extrabold text-[#16A34A]">
                  {requests.filter((r) => r.status === 'ACCEPTED').length}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 break-words">{t('Summaries accepted for tomorrow', 'Summaries accepted for tomorrow')}</p>
              </div>

              <div
                onClick={() => setActiveTab('prescriptions')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#64748B] font-semibold truncate">{t('Prescriptions Issued', 'Prescriptions Issued')}</span>
                  <Pill className="w-4 h-4 text-[#0284C7] shrink-0" />
                </div>
                <div className="text-2xl font-extrabold text-[#172033]">{prescriptions.length}</div>
                <p className="text-[11px] text-[#64748B] mt-1 break-words">{t('Dispatched to patient portals', 'Dispatched to patient portals')}</p>
              </div>

              <div
                onClick={() => setActiveTab('medicines')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D9E4E5] cursor-pointer hover:border-[#CBD5E1] transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#64748B] font-semibold truncate">{t('Hospital Formulary', 'Hospital Formulary')}</span>
                  <Search className="w-4 h-4 text-[#0EA5A8] shrink-0" />
                </div>
                <div className="text-2xl font-extrabold text-[#172033]">110+</div>
                <p className="text-[11px] text-[#64748B] mt-1 break-words">{t('Active searchable medicines', 'Active searchable medicines')}</p>
              </div>
            </div>

            {/* Recent Incoming Requests Queue */}
            <div className="bg-white p-6 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#172033] break-words">{t('Recent Incoming Patient Requests', 'Recent Incoming Patient Requests')}</h3>
                  <p className="text-[11px] text-[#64748B] break-words">{t('Review AI health summaries, accept checkups, and issue digital prescriptions', 'Review AI health summaries, accept checkups, and issue digital prescriptions')}</p>
                </div>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs text-[#0284C7] hover:text-[#0369A1] font-bold break-words shrink-0"
                >
                  {t('View All Requests', 'View All Requests')}
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B] border border-dashed border-[#D9E4E5] rounded-2xl break-words">
                  {t('No pending patient triage requests at this moment.', 'No pending patient triage requests at this moment.')}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.slice(0, 4).map((req) => (
                    <div
                      key={req._id}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E4E5] flex items-center justify-center font-bold text-[#172033] shrink-0 shadow-xs">
                          {req.patientName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-[#172033] text-sm truncate">{req.patientName}</strong>
                            <span className="text-[#64748B]">({req.patientAge} Yrs, {req.patientGender})</span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                req.priority === 'HIGH_PRIORITY'
                                  ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                                  : 'bg-slate-100 text-[#64748B]'
                              }`}
                            >
                              {req.priority === 'HIGH_PRIORITY' ? t('⚠ Urgent', '⚠ Urgent') : t('Routine', 'Routine')}
                            </span>
                          </div>
                          <p className="text-[#64748B] mt-0.5 line-clamp-1">{t('Concern', 'Concern')}: "{req.chiefComplaint}"</p>
                          {req.status === 'ACCEPTED' && (
                            <span className="text-[11px] text-[#16A34A] font-semibold block mt-0.5">
                              ✓ Scheduled: {req.appointmentDate || 'Tomorrow'} ({req.appointmentSlot || '10:00 AM - 01:00 PM'})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            req.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                              : req.status === 'PRESCRIPTION_ISSUED'
                              ? 'bg-purple-50 text-[#8B5CF6] border border-purple-200'
                              : req.status === 'REVIEWED'
                              ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                              : 'bg-amber-50 text-[#D97706] border border-amber-200'
                          }`}
                        >
                          {req.status === 'ACCEPTED'
                            ? '✓ Accepted (Tomorrow)'
                            : req.status === 'PRESCRIPTION_ISSUED'
                            ? '✓ Prescribed'
                            : req.status === 'REVIEWED'
                            ? '✓ Reviewed'
                            : 'Pending Review'}
                        </span>

                        {req.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleStartPrescription({ id: req.patientId, name: req.patientName }, req._id)}
                            className="px-3 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
                            title="Conduct clinical checkup and prescribe medicines"
                          >
                            <Pill className="w-3.5 h-3.5 shrink-0" />
                            <span>Prescribe</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDossier(req._id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>{req.status === 'PENDING' ? 'Review & Accept' : 'Open Dossier'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: OP DIRECT INTAKE & CLINICAL HEALTH SUMMARY VIEWER */}
        {activeTab === 'op_lookup' && (
          <div className="space-y-6">
            
            {/* Top Search & Action Bar */}
            <div className="bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E4E5]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0284C7] border border-sky-200">
                      Doctor Clinical Intake
                    </span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Direct Consultation Active
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#172033]">
                    {t('Direct OP Patient Intake & Summary Station', 'Direct OP Patient Intake & Summary Station')}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t('Enter any patient\'s OP Number (e.g. OP-447118 or 447118) to view their full AI Clinical Health Summary and write prescriptions.',
                       'Enter any patient\'s OP Number (e.g. OP-447118 or 447118) to view their full AI Clinical Health Summary and write prescriptions.')}
                  </p>
                </div>

                {opFoundSummary && (
                  <button
                    onClick={handleClearOp}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Clear & Look Up Another OP
                  </button>
                )}
              </div>

              {/* OP Search Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupOp(opInput);
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="relative flex-1">
                  <Ticket className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#0284C7]" />
                  <input
                    type="text"
                    value={opInput}
                    onChange={(e) => setOpInput(e.target.value)}
                    placeholder={t('Enter OP Number (e.g. OP-447118 or 447118)...', 'Enter OP Number (e.g. OP-447118 or 447118)...')}
                    className="w-full pl-12 pr-16 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#172033] placeholder-[#94A3B8] text-sm font-mono font-bold focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all shadow-xs"
                  />
                  {opInput && (
                    <button
                      type="button"
                      onClick={() => setOpInput('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={opLoading || !opInput.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {opLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{t('Retrieve Health Summary', 'Retrieve Health Summary')}</span>
                </button>
              </form>

              {opError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <strong className="block font-bold">Lookup Unsuccessful</strong>
                    <span>{opError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* If an OP Summary was found, show the Patient Ribbon and full HealthSummaryView */}
            {opFoundSummary ? (
              <div className="space-y-6">
                
                {/* Patient Quick Action & Verification Bar */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-lg border border-white/30 shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-black text-white">
                          {opFoundSummary.patientName || 'Patient'}
                        </h4>
                        <span className="font-mono text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                          {opFoundSummary.opNumber}
                        </span>
                        <span className="text-xs bg-emerald-800/60 px-2.5 py-0.5 rounded-full text-emerald-100 font-semibold border border-emerald-400/30">
                          Direct OP Dossier
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        {opFoundSummary.patientAge ? `${opFoundSummary.patientAge} Yrs • ` : ''}
                        {opFoundSummary.patientGender ? `${opFoundSummary.patientGender} • ` : ''}
                        {opFoundSummary.patientPhone ? `Phone: ${opFoundSummary.patientPhone} • ` : ''}
                        {opFoundSummary.createdAt ? `Generated: ${new Date(opFoundSummary.createdAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={handleOpenDossierFromOp}
                      className="px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/40 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <Eye className="w-4 h-4 text-white" />
                      <span>Review Clinical Dossier (16 Sections)</span>
                    </button>
                    <button
                      onClick={handleStartPrescriptionFromOp}
                      className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-emerald-800 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                    >
                      <Pill className="w-4 h-4 text-emerald-700" />
                      <span>Write Digital Prescription for this Patient</span>
                    </button>
                  </div>
                </div>

                {/* Direct Full Health Summary Render */}
                <HealthSummaryView
                  summary={opFoundSummary}
                  onChooseDoctor={() => {}}
                />

                {/* Bottom Action Bar for Immediate Prescription Writing & Slip Download */}
                <div className="p-6 rounded-3xl bg-white border border-[#D9E4E5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#172033]">
                        Ready to Prescribe for {opFoundSummary.patientName || 'Patient'} ({opFoundSummary.opNumber})?
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Open the digital prescription builder, enter medications, and download or print the official prescription slip to give to the patient.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartPrescriptionFromOp}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Pill className="w-4 h-4" />
                    <span>Write &amp; Download Prescription for Patient →</span>
                  </button>
                </div>

              </div>
            ) : (
              /* Empty state if no summary is active */
              !opLoading && (
                <div className="bg-white p-12 text-center rounded-3xl border border-[#D9E4E5] shadow-xs space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[#0284C7] flex items-center justify-center mx-auto border border-sky-100">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-bold text-[#172033]">Awaiting Patient Outpatient (OP) Number</h4>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      Ask the patient for the OP Number displayed on their check-up screen (e.g. OP-447118 or OP-821934). Enter it above to view their comprehensive AI-generated health dossier instantly and write prescriptions.
                    </p>
                  </div>
                </div>
              )
            )}

          </div>
        )}

        {/* TAB 2: PATIENT REQUESTS (Detailed Queue) */}
        {activeTab === 'requests' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5]">
              <div>
                <h3 className="text-xl font-bold text-[#172033]">Patient Intake Queue</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Triage requests dispatched by patients through MediKiosk</p>
              </div>
              <span className="text-xs font-mono text-[#64748B]">{requests.length} Requests Total</span>
            </div>

            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-[#172033]">{req.patientName}</strong>
                      <span className="text-[#64748B]">({req.patientAge} Yrs • {req.patientGender})</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          req.priority === 'HIGH_PRIORITY'
                            ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                            : 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        {req.priority === 'HIGH_PRIORITY' ? '⚠ Urgent Red Flag' : 'Standard Routine'}
                      </span>
                    </div>
                    <p className="text-[#172033] font-medium">"{req.chiefComplaint}"</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-mono flex-wrap">
                      <span>Dispatched: {new Date(req.createdAt).toLocaleString()}</span>
                      {req.status === 'ACCEPTED' && (
                        <span className="text-[#16A34A] font-bold">
                          ✓ Checkup Scheduled: {req.appointmentDate || 'Tomorrow'} ({req.appointmentSlot || '10:00 AM - 01:00 PM'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                          : req.status === 'PRESCRIPTION_ISSUED'
                          ? 'bg-purple-50 text-[#8B5CF6] border border-purple-200'
                          : req.status === 'REVIEWED'
                          ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                          : 'bg-amber-50 text-[#D97706] border border-amber-200'
                      }`}
                    >
                      {req.status === 'ACCEPTED'
                        ? '✓ Accepted (Tomorrow)'
                        : req.status === 'PRESCRIPTION_ISSUED'
                        ? '✓ Prescribed'
                        : req.status === 'REVIEWED'
                        ? '✓ Reviewed'
                        : 'Pending Review'}
                    </span>

                    {req.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStartPrescription({ id: req.patientId, name: req.patientName }, req._id)}
                        className="px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                        title="Conduct clinical checkup and issue prescription"
                      >
                        <Pill className="w-3.5 h-3.5" />
                        <span>Conduct Checkup &amp; Prescribe</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenDossier(req._id)}
                      className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{req.status === 'PENDING' ? 'Review & Accept Dossier' : 'Open Dossier'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PATIENTS LIST */}
        {activeTab === 'patients' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <h3 className="text-xl font-bold text-[#172033]">Under Care / Registered Patients</h3>
            <p className="text-xs text-[#64748B]">Patients who have selected you as attending physician</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              {requests.map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-2 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-[#172033] text-sm">{r.patientName}</h4>
                      <span className="text-[#64748B]">{r.patientAge} Yrs / {r.patientGender}</span>
                    </div>
                    <span className="text-[10px] text-[#0EA5A8] font-mono font-bold">ID: {r.patientId?.slice(-6)}</span>
                  </div>
                  <p className="text-[#64748B] text-[11px]">Recent: "{r.chiefComplaint}"</p>
                  <button
                    onClick={() => handleOpenDossier(r._id)}
                    className="text-xs text-[#0284C7] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>View Records</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HEALTH SUMMARIES */}
        {activeTab === 'summaries' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <h3 className="text-xl font-bold text-[#172033]">Triage Health Summaries</h3>
            <p className="text-xs text-[#64748B]">AI-generated structured clinical summaries awaiting or confirmed by you</p>
            <div className="space-y-3 pt-2">
              {requests.map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] flex justify-between items-center text-xs shadow-xs">
                  <div>
                    <h5 className="font-bold text-[#172033]">{r.patientName}: {r.chiefComplaint}</h5>
                    <span className="text-[11px] text-[#64748B] font-mono">Priority: {r.priority}</span>
                  </div>
                  <button
                    onClick={() => handleOpenDossier(r._id)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#D9E4E5] hover:bg-[#F3F8F8] text-[#172033] text-xs font-semibold shadow-xs"
                  >
                    Examine Summary
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MEDICAL DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <h3 className="text-xl font-bold text-[#172033]">Patient Medical Documents & Scans</h3>
            <p className="text-xs text-[#64748B]">Access previous lab reports, blood tests, and OCR extractions</p>
            <div className="p-8 text-center border border-dashed border-[#D9E4E5] rounded-2xl text-xs text-[#64748B] bg-[#F8FAFC]">
              Select any patient from your Requests queue to view their scanned reports, camera captures, and OCR extractions.
            </div>
          </div>
        )}

        {/* TAB 6: MEDICINE SEARCH */}
        {activeTab === 'medicines' && (
          <MedicineSearchBox
            onSelectMedicine={(med) => {
              setPrescriptionTarget({ name: 'Walk-in Patient' });
              setPrescriptionPrefillMedicine(med);
              setActiveTab('rx_builder');
            }}
          />
        )}

        {/* TAB 7: PRESCRIPTIONS (History & Workstation Printing) */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9E4E5] gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#172033]">Issued Prescriptions &amp; Print Slips</h3>
                <p className="text-xs text-[#64748B]">Clinical prescription records stored on your workstation for local printing (medicines are not dispatched to patient devices)</p>
              </div>
              <button
                onClick={() => {
                  setPrescriptionTarget({ name: 'Walk-in Patient' });
                  setPrescriptionPrefillMedicine(null);
                  setActiveTab('rx_builder');
                }}
                className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Pill className="w-4 h-4" />
                <span>+ New Prescription</span>
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No prescriptions issued yet.</p>
                <button
                  onClick={() => {
                    setPrescriptionTarget({ name: 'Walk-in Patient' });
                    setPrescriptionPrefillMedicine(null);
                    setActiveTab('rx_builder');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#0EA5A8] text-xs font-bold transition-colors cursor-pointer"
                >
                  Write &amp; Print Prescription Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx._id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          Rx
                        </div>
                        <div>
                          <strong className="text-[#172033] text-sm block">{rx.patientName}</strong>
                          <span className="text-[11px] text-[#64748B]">
                            {rx.patientAge ? `${rx.patientAge} Yrs • ${rx.patientGender}` : ''}
                            {rx.opNumber ? ` • OP: ${rx.opNumber}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#0EA5A8] text-[11px] font-bold bg-[#E6F7F7] px-2.5 py-1 rounded-lg border border-[#0EA5A8]/20">
                          #{rx._id.slice(-6).toUpperCase()}
                        </span>
                        <button
                          onClick={() => setPrintingRx(rx)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          title="Print prescription directly to doctor workstation printer"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Print Rx</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-[#64748B] text-[11px] pl-10">
                      <strong>Medicines ({rx.medicines?.length}):</strong> {rx.medicines?.map((m) => `${m.name} (${m.dosage || '1 tab'})`).join(', ')}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pl-10 pt-1 border-t border-slate-200">
                      <span>Diagnosis: <strong className="text-slate-700">{rx.diagnosisOrImpression || 'Clinical Assessment'}</strong></span>
                      <span className="font-mono">Issued: {new Date(rx.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PRESCRIPTION BUILDER */}
        {activeTab === 'rx_builder' && (
          <DigitalPrescriptionBuilder
            initialPatient={prescriptionTarget}
            requestId={prescriptionRequestId}
            initialMedicine={prescriptionPrefillMedicine}
            onPrescriptionCreated={() => {
              setPrescriptionPrefillMedicine(null);
              loadDoctorData();
              setActiveTab('prescriptions');
            }}
          />
        )}

        {/* TAB 8: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <h3 className="text-xl font-bold text-[#172033]">Doctor Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">No alerts at this time.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs flex justify-between items-center shadow-xs">
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

        {/* TAB 9: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] max-w-2xl mx-auto space-y-5 shadow-xs">
            <h3 className="text-xl font-bold text-[#172033]">Doctor Credentials Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                <span className="text-[#64748B] block">Doctor Name</span>
                <strong className="text-[#172033] text-sm">{profile?.doctorName || user?.name}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                <span className="text-[#64748B] block">Registration License</span>
                <strong className="text-[#172033] font-mono text-sm">{profile?.licenseNumber}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                <span className="text-[#64748B] block">Specialization</span>
                <strong className="text-[#0284C7] text-sm">{profile?.specialization}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                <span className="text-[#64748B] block">Phone</span>
                <strong className="text-[#172033] font-mono text-sm">{user?.phoneNumber}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                <span className="text-[#64748B] block">Clinical Experience</span>
                <strong className="text-[#172033] text-sm">{profile?.experienceYears || 5} Years</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F3F8F8] border border-[#D9E4E5]">
                <span className="text-[#64748B] block">Verification Status</span>
                <strong className="text-[#16A34A] text-sm">✓ Demo Verified (SIH Prototype)</strong>
              </div>
            </div>
          </div>
        )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Patient Dossier Modal Station */}
      <PatientDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        dossier={selectedDossier}
        onReviewConfirmed={(updatedSummary) => {
          loadDoctorData();
          if (opFoundSummary && updatedSummary) {
            setOpFoundSummary((prev) => ({ ...prev, ...updatedSummary }));
          }
        }}
        onOpenPrescriptionBuilder={(patient, reqId) => {
          handleStartPrescription(patient, reqId);
        }}
      />

      {/* Doctor Direct Prescription Workstation Print Slip Modal */}
      {printingRx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          {/* Isolation CSS for Browser System Printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #dashboard-print-slip, #dashboard-print-slip * {
                visibility: visible !important;
              }
              #dashboard-print-slip {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                background: white !important;
                color: #000 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print-modal-bar {
                display: none !important;
              }
            }
          `}} />

          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-300 shadow-2xl overflow-hidden my-6">
            {/* Modal Top Control Bar (Hidden on Print) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print-modal-bar">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Doctor Workstation Print Slip • Rx #{printingRx._id?.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to System Printer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingRx(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Slip Content */}
            <div id="dashboard-print-slip" className="p-8 space-y-6 text-[#172033] bg-white">
              {/* Hospital & Attending Physician Header */}
              <div className="flex justify-between items-start border-b-2 border-[#172033] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0EA5A8] text-white flex items-center justify-center font-bold text-sm">
                      Rx
                    </div>
                    <h2 className="text-xl font-black tracking-tight uppercase text-[#172033]">
                      {printingRx.hospitalName || 'MediKiosk Apex Hospital & Medical Centre'}
                    </h2>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Department of Outpatient Clinical Medicine • 24x7 Ambulatory Care
                  </p>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-sm text-[#172033]">{printingRx.doctorName}</div>
                  <div className="text-[#0EA5A8] font-medium">{printingRx.doctorSpecialty}</div>
                  <div className="text-[#64748B] font-mono text-[11px]">
                    Reg: {printingRx.doctorLicense}
                  </div>
                </div>
              </div>

              {/* Patient Meta & Date Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Patient Name</span>
                  <strong className="text-sm text-[#172033]">{printingRx.patientName}</strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Age / Gender</span>
                  <span className="font-semibold">{printingRx.patientAge || 35} Yrs • {printingRx.patientGender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Date &amp; Time</span>
                  <span className="font-mono">{new Date(printingRx.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-bold">Prescription Slip No</span>
                  <span className="font-mono font-bold text-[#0EA5A8]">
                    Rx-{printingRx._id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="text-xs">
                <span className="text-[#64748B] font-bold uppercase tracking-wider text-[10px] block mb-1">
                  Clinical Impression / Diagnosis:
                </span>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-semibold text-[#172033]">
                  {printingRx.diagnosisOrImpression || 'Provisional Clinical Assessment'}
                </div>
              </div>

              {/* Medicines Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="text-2xl font-serif italic font-black text-[#0EA5A8]">℞</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Prescribed Medications &amp; Dosage Schedule
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#64748B] text-[10px] uppercase">
                      <th className="py-2 px-1">#</th>
                      <th className="py-2 px-2">Medicine / Generic</th>
                      <th className="py-2 px-2">Strength &amp; Form</th>
                      <th className="py-2 px-2 text-center">Morn</th>
                      <th className="py-2 px-2 text-center">Noon</th>
                      <th className="py-2 px-2 text-center">Night</th>
                      <th className="py-2 px-2">Meal Timing</th>
                      <th className="py-2 px-2">Duration</th>
                      <th className="py-2 px-2">Directions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printingRx.medicines?.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-1 font-mono text-[#64748B]">{idx + 1}</td>
                        <td className="py-2.5 px-2">
                          <strong className="text-[#172033] block">{med.name}</strong>
                          {med.genericName && (
                            <span className="text-[10px] text-slate-500">{med.genericName}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-slate-700">{med.strength || '—'} {med.form || ''}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#0EA5A8]">
                          {med.timing?.morning ? '1' : '0'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#0EA5A8]">
                          {med.timing?.afternoon ? '1' : '0'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#0EA5A8]">
                          {med.timing?.night ? '1' : '0'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-700">{med.timing?.mealRelation || 'After food'}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-700">{med.duration || '—'}</td>
                        <td className="py-2.5 px-2 text-slate-600 text-[11px]">{med.instructions || 'As directed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions & Next Review */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-[10px] uppercase text-[#64748B] block mb-1">
                    General Advice &amp; Instructions
                  </span>
                  <p className="text-[#172033] text-[11px] leading-relaxed">
                    {printingRx.generalInstructions || 'Take medications on time and maintain proper rest.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-[10px] uppercase text-[#64748B] block mb-1">
                    Next Clinical Review
                  </span>
                  <p className="text-[#172033] font-semibold text-[11px]">
                    Follow up in {printingRx.followUpDays || 7} days for evaluation.
                  </p>
                </div>
              </div>

              {/* Doctor Signature Block */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                <div className="text-[10px] text-slate-400">
                  Printed directly from Doctor Workstation.<br />
                  Medicines are retained on physician system and not dispatched to patient devices.
                </div>

                <div className="text-right">
                  <div className="w-48 border-b border-slate-400 mb-1 pb-6"></div>
                  <div className="text-xs font-bold text-[#172033]">{printingRx.doctorName}</div>
                  <div className="text-[10px] text-[#64748B]">Attending Physician Signature &amp; Stamp</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar (Hidden on Print) */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 no-print-modal-bar">
              <button
                type="button"
                onClick={() => setPrintingRx(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Send to System Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

