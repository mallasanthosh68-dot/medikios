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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { PatientDossierModal } from './PatientDossierModal';
import { MedicineSearchBox } from './MedicineSearchBox';
import { DigitalPrescriptionBuilder } from './DigitalPrescriptionBuilder';

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

  const [selectedDossier, setSelectedDossier] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const [prescriptionTarget, setPrescriptionTarget] = useState(null);
  const [prescriptionRequestId, setPrescriptionRequestId] = useState(null);
  const [prescriptionPrefillMedicine, setPrescriptionPrefillMedicine] = useState(null);

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

        {/* TAB 7: PRESCRIPTIONS (History & Management) */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5]">
              <div>
                <h3 className="text-xl font-bold text-[#172033]">Issued Prescriptions</h3>
                <p className="text-xs text-[#64748B]">Digital prescription orders signed and dispatched by your clinic</p>
              </div>
              <button
                onClick={() => {
                  setPrescriptionPrefillMedicine(null);
                  setActiveTab('rx_builder');
                }}
                className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-xs"
              >
                + New Prescription
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">No prescriptions issued yet.</div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx._id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-2 shadow-xs">
                    <div className="flex justify-between items-center">
                      <strong className="text-[#172033] text-sm">{rx.patientName}</strong>
                      <span className="font-mono text-[#0EA5A8] text-[11px] font-bold">Rx #{rx._id.slice(-6)}</span>
                    </div>
                    <div className="text-[#64748B]">
                      Medicines ({rx.medicines?.length}): {rx.medicines?.map((m) => m.name).join(', ')}
                    </div>
                    <div className="text-[11px] text-[#64748B] font-mono">
                      Issued: {new Date(rx.createdAt).toLocaleDateString()}
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
        onReviewConfirmed={() => {
          loadDoctorData();
        }}
        onOpenPrescriptionBuilder={(patient, reqId) => {
          handleStartPrescription(patient, reqId);
        }}
      />

    </div>
  );
};

