import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
  Edit3,
  Sparkles,
  Pill,
  Send,
  Leaf,
  Award,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Activity,
  HeartPulse,
  History,
  Check,
  Flame,
  Moon,
  Coffee,
  CheckCheck,
  Eye,
  Bot,
  MessageSquare,
  Plus,
  Mic,
} from 'lucide-react';
import { api } from '../../services/api';
import { updateDoctorAyushCase } from '../../services/ayushService';
import { PinnedReportsGallery } from '../common/PinnedReportsGallery';

export const PatientDossierModal = ({
  isOpen,
  onClose,
  dossier,
  onReviewConfirmed,
  onOpenPrescriptionBuilder,
}) => {
  if (!isOpen || !dossier) return null;

  const { request = {}, patient = {}, summary = {}, interview = {}, documents = [], extractions = [], timeline = [] } = dossier;

  const isAyush = summary?.healthcareMode === 'ayush' || !!summary?.ayushAssessment;
  const caseId = summary?.interviewId || summary?._id || request?._id;

  const [clinicalNotes, setClinicalNotes] = useState(
    request.clinicalNotes || summary?.doctorReview?.clinicalNotes || ''
  );
  const [doctorEdits, setDoctorEdits] = useState(
    summary?.doctorReview?.doctorEdits || ''
  );
  const [caseStatus, setCaseStatus] = useState(
    summary?.caseStatus || (request.status === 'REVIEWED' ? 'PHYSICIAN_CONFIRMED' : 'PATIENT_CONFIRMED')
  );
  const [isReviewed, setIsReviewed] = useState(
    request.status === 'REVIEWED' ||
    summary?.status === 'DOCTOR_REVIEWED' ||
    summary?.caseStatus === 'PHYSICIAN_CONFIRMED'
  );
  const [isAccepted, setIsAccepted] = useState(
    request.status === 'ACCEPTED' || request.status === 'REVIEWED' || request.status === 'PRESCRIPTION_ISSUED'
  );
  const [appointmentDate, setAppointmentDate] = useState(request.appointmentDate || 'Tomorrow');
  const [appointmentSlot, setAppointmentSlot] = useState(request.appointmentSlot || '10:00 AM - 01:00 PM');
  const [doctorMessage, setDoctorMessage] = useState(
    request.doctorMessage ||
      'Your health summary has been accepted. Please visit tomorrow for in-person clinical examination at Cabin 204. Bring previous physical reports.'
  );
  const [saving, setSaving] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [stampData, setStampData] = useState(
    summary?.physicianConfirmation || summary?.doctorReview || null
  );

  useEffect(() => {
    if (summary?.caseStatus) {
      setCaseStatus(summary.caseStatus);
      if (summary.caseStatus === 'PHYSICIAN_CONFIRMED') {
        setIsReviewed(true);
      }
    }
  }, [summary]);

  const handleAcceptSummary = async () => {
    setAccepting(true);
    try {
      const res = await api.post(`/doctor/requests/${request._id}/accept`, {
        appointmentDate,
        appointmentSlot,
        doctorMessage,
      });

      if (res.success) {
        setIsAccepted(true);
        if (onReviewConfirmed) onReviewConfirmed(res.request);
        alert(`✓ Summary Accepted! Notification sent to ${patient.name}: "Dr. ${res.request?.doctorProfile?.doctorName || 'Doctor'} accepted your summary. You can go tomorrow for your checkup."`);
      }
    } catch (err) {
      alert('Error accepting summary: ' + err.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleConfirmCase = async () => {
    setSaving(true);
    try {
      if (isAyush && caseId) {
        const res = await updateDoctorAyushCase(caseId, {
          action: 'confirm',
          clinicalNotes,
          doctorEdits,
        });

        if (res.success) {
          setIsReviewed(true);
          setCaseStatus('PHYSICIAN_CONFIRMED');
          const stamp = {
            doctorName: res.summary?.physicianConfirmation?.physicianName || res.summary?.doctorReview?.doctorName || 'Dr. AYUSH Physician',
            licenseNumber: res.summary?.physicianConfirmation?.licenseNumber || res.summary?.doctorReview?.licenseNumber || 'MCI-AYUSH-REG-10023',
            reviewedAt: res.summary?.physicianConfirmation?.confirmedAt || new Date(),
            clinicalNotes,
            caseStatus: 'PHYSICIAN_CONFIRMED',
          };
          setStampData(stamp);
          if (onReviewConfirmed) onReviewConfirmed(res.summary);
          return;
        }
      }

      // General Medical confirmation fallback
      const res = await api.post(`/doctors/portal/confirm-review/${request._id || caseId}`, {
        clinicalNotes,
        doctorEdits,
      });

      if (res.success) {
        setIsReviewed(true);
        setCaseStatus('PHYSICIAN_CONFIRMED');
        const stamp = {
          doctorName: res.reviewedBy?.doctorName || 'Dr. Clinical Physician',
          licenseNumber: res.reviewedBy?.licenseNumber || 'MCI-REG-77891',
          reviewedAt: res.reviewedBy?.reviewedAt || new Date(),
          clinicalNotes,
          caseStatus: 'PHYSICIAN_CONFIRMED',
        };
        setStampData(stamp);
        if (onReviewConfirmed) onReviewConfirmed(res.summary);
      }
    } catch (err) {
      alert('Error confirming review: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isRedFlag = summary?.redFlagStatus === 'HIGH_PRIORITY' || request?.priority === 'HIGH_PRIORITY';
  const isPhysicianConfirmed = caseStatus === 'PHYSICIAN_CONFIRMED' || isReviewed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033] my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#D9E4E5]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">Clinical Review Station</span>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                isRedFlag ? 'bg-rose-50 text-[#DC2626] border border-rose-200' : 'bg-slate-100 text-[#64748B]'
              }`}>
                {isRedFlag ? '⚠ URGENT PRIORITY' : 'ROUTINE OPD'}
              </span>

              {/* Healthcare Pathway Badge */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isAyush
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-[#E6F7F7] text-[#0EA5A8] border-[#0EA5A8]/30'
                }`}>
                {isAyush ? '🌿 AYUSH Pathway' : '🏥 General Medical'}
              </span>

              {/* Case Status Badge */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isPhysicianConfirmed
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-sky-50 text-sky-800 border-sky-300'
              }`}>
                {isPhysicianConfirmed
                  ? '✓ PHYSICIAN CONFIRMED'
                  : caseStatus === 'PATIENT_CONFIRMED'
                  ? 'PATIENT CONFIRMED • WAITING FOR PHYSICIAN REVIEW'
                  : 'CASE READY FOR REVIEW'}
              </span>

              {/* Case Data Quality Score */}
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                <span>Quality Score: {summary?.caseDataQualityScore?.overallScore || 85}%</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] mt-1">
              Patient Dossier: {patient.name || summary?.patientName || 'Patient'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Action Banner */}
        {isPhysicianConfirmed ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-xs uppercase tracking-wider block font-black">
                  🌿 STATUS: PHYSICIAN CONFIRMED • READY FOR CONSULTATION
                </strong>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  This health summary has been reviewed and officially confirmed by the attending physician. The patient is ready for in-person consultation.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenPrescriptionBuilder(patient, request?._id);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Begin In-Person Consultation</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-900">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#0284C7] shrink-0" />
              <div>
                <strong className="text-xs uppercase tracking-wider block font-bold">
                  STATUS: PATIENT CONFIRMED • WAITING FOR PHYSICIAN REVIEW
                </strong>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Patient has completed and confirmed their case-taking. Review the clinical sections below and click Confirm Case.
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirmCase}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saving ? 'Confirming...' : 'Confirm Case'}</span>
            </button>
          </div>
        )}

        {/* Patient Profile Bar with Outpatient OP Token */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 rounded-2xl bg-[#F3F8F8] border border-[#D9E4E5] text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Age & Gender</span>
            <strong className="text-[#172033]">{patient.age || summary?.patientAge} Yrs / {patient.gender || summary?.patientGender}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">OP Number (OPD)</span>
            <strong className="text-[#0EA5A8] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded inline-block">
              {summary?.opNumber || patient?.opNumber || 'OP-Pending'}
            </strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Contact Phone</span>
            <strong className="text-[#172033] font-mono">{patient.phoneNumber || summary?.patientPhone || '—'}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Blood Group</span>
            <strong className="text-[#172033]">{patient.bloodGroup || 'Not specified'}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Language</span>
            <strong className="text-[#172033] uppercase">{summary?.language || 'en'}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">ABHA ID / ABDM</span>
            <strong className="text-emerald-700 font-mono text-xs block truncate" title={summary?.abhaId || patient.abhaId || 'ABHA Linked'}>
              {summary?.abhaId || patient.abhaId || (patient.aadhaarDemoVerified ? '✓ Demo Verified' : 'Verified (Kiosk)')}
            </strong>
          </div>
        </div>

        {/* ============================================================ */}
        {/* AYUSH MODE: 16 STRUCTURED CLINICAL REVIEW SECTIONS             */}
        {/* ============================================================ */}
        {isAyush ? (
          <div className="space-y-4">
            
            {/* Disclaimer for Attending Vaidya */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-xs text-emerald-950 flex items-start gap-3">
              <Leaf className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block uppercase tracking-wider text-emerald-900">
                  🌿 AYUSH CLINICAL CASE DOSSIER — 16 REVIEW SECTIONS
                </strong>
                <p className="mt-0.5 text-emerald-800 leading-relaxed text-[11px]">
                  Information collected during kiosk intake is for physician assessment only. This system does not diagnose or prescribe. Pulse examination (Nadi Pariksha) and clinical confirmation by the attending Vaidya are required.
                </p>
              </div>
            </div>

            {/* Sections 1 to 4: Chief Concern, Duration, Progression & Symptoms */}
            <div className="p-5 rounded-2xl bg-white border border-[#D9E4E5] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9E4E5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Sections 1 – 4: Chief Concern, Progression &amp; Symptoms</span>
                </h4>
                <span className="text-[10px] text-[#64748B] font-mono font-semibold">
                  Triage Category: {summary?.suggestedSpecialty || 'AYUSH / Integrative Medicine'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Chief Concern */}
                <div className="sm:col-span-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#0284C7] block text-[11px] uppercase tracking-wider mb-1">
                    1. Chief Health Concern
                  </strong>
                  <p className="text-sm font-semibold text-[#172033]">"{summary?.chiefComplaint}"</p>
                </div>

                {/* 2. Duration / Timeline */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#64748B] block text-[11px] uppercase tracking-wider mb-1">
                    2. Duration / Timeline
                  </strong>
                  <p className="text-xs font-bold text-[#172033]">{summary?.duration || 'Not stated'}</p>
                </div>

                {/* 3. Progression */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#64748B] block text-[11px] uppercase tracking-wider mb-1">
                    3. Progression
                  </strong>
                  <p className="text-xs font-bold text-[#172033]">
                    {summary?.ayushAssessment?.progression || summary?.ayushAssessment?.durationProgression || 'Symptoms stable / ongoing'}
                  </p>
                </div>

                {/* Severity */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#64748B] block text-[11px] uppercase tracking-wider mb-1">
                    Reported Severity
                  </strong>
                  <p className="text-xs font-bold text-amber-700">{summary?.severity || 'Moderate'}</p>
                </div>
              </div>

              {/* 4. Extracted Clinical Symptoms */}
              <div>
                <strong className="text-[#64748B] block text-[11px] uppercase tracking-wider mb-2">
                  4. Extracted Clinical Symptoms
                </strong>
                <div className="flex flex-wrap gap-2">
                  {summary?.symptoms && summary.symptoms.length > 0 ? (
                    summary.symptoms.map((sym, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-semibold shadow-2xs"
                      >
                        {sym}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#64748B]">No specific symptoms extracted.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sections 5 to 9: Ahara, Agni, Koshtha, Nidra, Vihara */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border border-emerald-300 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-emerald-700" />
                  <span>Sections 5 – 9: Holistic Lifestyle &amp; Digestive Health (Pancha Kosha / Agni)</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Self-Reported Baseline
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* 5. Ahara (Diet) */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1">
                    <Coffee className="w-3.5 h-3.5 text-emerald-700" />
                    <span>5. Ahara (Dietary Habits)</span>
                  </div>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.ahara || 'Standard balanced diet reported.'}
                  </p>
                </div>

                {/* 6. Agni (Digestion) */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs mb-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>6. Agni (Digestive Fire)</span>
                  </div>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.agni || 'Moderate digestion reported.'}
                  </p>
                </div>

                {/* 7. Koshtha (Bowel Pattern) */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs mb-1">
                    <Activity className="w-3.5 h-3.5 text-teal-700" />
                    <span>7. Koshtha (Bowel Pattern)</span>
                  </div>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.koshtha || 'Regular bowel movement pattern reported.'}
                  </p>
                </div>

                {/* 8. Nidra (Sleep) */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs mb-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>8. Nidra (Sleep Quality)</span>
                  </div>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.nidra || 'Normal restful sleep reported.'}
                  </p>
                </div>

                {/* 9. Vihara (Routine) */}
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>9. Vihara (Daily Routine &amp; Physical Activity)</span>
                  </div>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.vihara || 'Standard daily physical routine recorded.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sections 10 to 12: Medical History, Medications, Allergies */}
            <div className="p-5 rounded-2xl bg-white border border-[#D9E4E5] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 pb-2 border-b border-[#D9E4E5]">
                <History className="w-4 h-4 text-[#0EA5A8]" />
                <span>Sections 10 – 12: Clinical Background, Medications &amp; Allergies</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 10. Medical History */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#172033] block text-[11px] uppercase tracking-wider mb-1.5">
                    10. Medical History
                  </strong>
                  {summary?.medicalHistory && summary.medicalHistory.length > 0 ? (
                    <ul className="space-y-1">
                      {summary.medicalHistory.map((h, i) => (
                        <li key={i} className="text-[#172033] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#64748B]">No chronic medical history reported.</p>
                  )}
                </div>

                {/* 11. Previous Medications */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#172033] block text-[11px] uppercase tracking-wider mb-1.5">
                    11. Previous Medications
                  </strong>
                  {summary?.previousMedicines && summary.previousMedicines.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {summary.previousMedicines.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#D9E4E5] text-[11px] text-[#172033]">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#64748B]">None actively taken.</p>
                  )}
                </div>

                {/* 12. Allergies */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-[#172033] block text-[11px] uppercase tracking-wider mb-1.5">
                    12. Allergies
                  </strong>
                  {patient?.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-emerald-700 font-medium">No known drug allergies reported.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 13: Prakriti & Vikriti Observations (Explicitly marked) */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-300 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                    13. Prakriti / Vikriti Observations
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
                  Information collected for physician assessment
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200">
                  <strong className="text-emerald-950 block mb-1">🌿 Prakriti (Constitutional Tendencies):</strong>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.prakriti || 'Inquiry into constitutional traits (Vata/Pitta/Kapha tendencies) logged.'}
                  </p>
                  <span className="text-[10px] text-emerald-700 italic block mt-1">
                    *Patient-reported indicative traits only; definitive Prakriti Pariksha performed by Vaidya.
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-200">
                  <strong className="text-emerald-950 block mb-1">⚖ Vikriti (Current Aggravated State):</strong>
                  <p className="text-[#172033] leading-relaxed">
                    {summary?.ayushAssessment?.vikriti || 'Aggravation or constitutional imbalance reported with present illness.'}
                  </p>
                  <span className="text-[10px] text-emerald-700 italic block mt-1">
                    *Temporary imbalance associated with chief concern.
                  </span>
                </div>
              </div>

              {summary?.ayushAssessment?.traditionalPractices && (
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs">
                  <strong className="text-emerald-950 block mb-0.5">Ayurveda / Traditional Therapies Consulted:</strong>
                  <p className="text-[#172033]">{summary.ayushAssessment.traditionalPractices}</p>
                </div>
              )}
            </div>

            {/* Sections 14 & 15: Attached Diagnostic Reports & OCR Clinical Data */}
            <div className="p-5 rounded-2xl bg-white border border-[#D9E4E5] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5 pb-2 border-b border-[#D9E4E5]">
                <FileText className="w-4 h-4 text-[#0EA5A8]" />
                <span>Sections 14 &amp; 15: Diagnostic Reports &amp; Extracted OCR Data</span>
              </h4>

              {/* 14. Attached Reports */}
              {summary?.pinnedReports && summary.pinnedReports.length > 0 ? (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5]">
                  <strong className="text-xs text-[#172033] block mb-2">14. Attached Medical Documents ({summary.pinnedReports.length})</strong>
                  <PinnedReportsGallery
                    reports={summary.pinnedReports}
                    readOnly={true}
                    title="Diagnostic Reports & Document Scans"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#64748B]">
                  <strong>14. Attached Diagnostic Reports:</strong> No external lab documents uploaded.
                </div>
              )}

              {/* 15. OCR Data */}
              {(extractions.length > 0 || (summary?.pinnedReports && summary.pinnedReports.some(r => r.extractedText))) && (
                <div className="space-y-2">
                  <strong className="text-xs text-[#172033] block">15. Extracted OCR Data</strong>
                  {summary.pinnedReports?.filter(r => r.extractedText).map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-1">
                      <span className="font-semibold text-[#0284C7] block">{r.title || 'Document Report'}:</span>
                      <p className="text-[#172033] whitespace-pre-wrap font-mono text-[11px] max-h-32 overflow-y-auto custom-scrollbar">
                        {r.extractedText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 16: AI-Assisted Clinical Narrative */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#D9E4E5]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0284C7]" />
                  <span>16. AI-Assisted Clinical Narrative</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Triage only — Non-diagnostic
                </span>
              </div>
              <p className="text-xs text-[#172033] leading-relaxed">
                {summary?.aiGeneratedText || 'AI health summary synthesising patient-reported symptoms, Ahara, Agni, Koshtha, and timeline for physician review.'}
              </p>
            </div>

            {/* Section 17: AI Case-Taking Dialogue History */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>17. AI Case-Taking Dialogue History (Questions Asked &amp; Answers Given)</span>
                </h4>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {(summary?.interviewResponses?.length || interview?.responses?.length || 0)} Exchanges
                </span>
              </div>

              {((summary?.interviewResponses && summary.interviewResponses.length > 0) || (interview?.responses && interview.responses.length > 0)) ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {(summary?.interviewResponses || interview?.responses).map((r, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-emerald-600" />
                          Turn {idx + 1} • AI Question Asked:
                        </span>
                        {r.inputMode === 'voice' && (
                          <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[9px] flex items-center gap-1 font-semibold">
                            <Mic className="w-2.5 h-2.5" /> Voice Intake
                          </span>
                        )}
                      </div>
                      <p className="text-[#172033] font-medium leading-relaxed pl-1 text-xs sm:text-sm">{r.question}</p>
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">Patient Answer Given:</span>
                        <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-[#0F172A] font-semibold text-xs sm:text-sm">
                          "{r.answer}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B] italic">No direct dialogue records logged.</p>
              )}
            </div>

            {/* Section 18: AI Medication Suggestions for Attending Vaidya */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-400 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      18. AI Medication Suggestions for Attending Vaidya
                    </h4>
                    <span className="text-[10px] text-emerald-800">Vaidya Review Advisory • Non-Dispensing</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Doctor Will Formulate Final Rx
                </span>
              </div>

              {summary?.aiMedicationSuggestions && summary.aiMedicationSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.aiMedicationSuggestions.map((med, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <strong className="text-[#172033] text-sm block">🌿 {med.medicineName} {med.strength ? `(${med.strength})` : ''}</strong>
                          {med.genericName && <span className="text-[10px] text-[#64748B] block">{med.genericName}</span>}
                        </div>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          {med.category || 'Classical'}
                        </span>
                      </div>
                      <div className="text-[11px] bg-[#F8FAFC] p-2 rounded-lg border border-[#D9E4E5] space-y-0.5">
                        <div><strong>Dosage:</strong> {med.dosage || '1 tablet'} • {med.frequency || 'Twice daily'}</div>
                        <div><strong>Timing:</strong> {med.timing || 'After food'} ({med.duration || '5 days'})</div>
                      </div>
                      {med.clinicalRationale && (
                        <p className="text-[10px] text-emerald-900 bg-emerald-50/70 p-1.5 rounded border border-emerald-100">
                          <strong>Rationale:</strong> {med.clinicalRationale}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenPrescriptionBuilder) {
                            onOpenPrescriptionBuilder(patient, request?._id, {
                              name: med.medicineName,
                              genericName: med.genericName,
                              strength: med.strength || '500 mg',
                              form: med.form || 'Tablet',
                              dosage: med.dosage || '1 tablet',
                              frequency: med.frequency || 'Twice daily',
                              duration: med.duration || '5 days',
                              instructions: `${med.timing || 'After food'} - ${med.clinicalRationale || ''}`,
                            });
                          }
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add to Official Prescription</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No specific classical remedies suggested. Prescribe in Workstation.</p>
              )}
            </div>

          </div>
        ) : (
          /* ============================================================ */
          /* GENERAL MEDICAL MODE (PRESERVED)                              */
          /* ============================================================ */
          <div className="space-y-4">
            {/* 1. AI Health Summary & Chief Complaint */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Health Summary &amp; Chief Complaint</span>
                </h4>
                <span className="text-[10px] text-[#64748B] font-mono font-semibold">Suggested: {summary?.suggestedSpecialty}</span>
              </div>

              <p className="text-sm font-semibold text-[#172033]">
                "{summary?.chiefComplaint}"
              </p>

              <p className="text-xs text-[#64748B] leading-relaxed">
                {summary?.aiGeneratedText}
              </p>
            </div>

            {/* 2. AI Interview Transcript Q&A */}
            {((summary?.interviewResponses && summary.interviewResponses.length > 0) || (interview?.responses && interview.responses.length > 0)) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#0EA5A8]/30 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#D9E4E5]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#0EA5A8]" />
                    <span>Natural Language AI Check-Up Q&amp;A (Questions Asked &amp; Patient Answers Given)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20">
                    {(summary?.interviewResponses?.length || interview?.responses?.length || 0)} Turns
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {(summary?.interviewResponses || interview?.responses).map((r, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#0EA5A8]">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-[#0EA5A8]" />
                          Turn {idx + 1} • AI Question Asked:
                        </span>
                        {r.inputMode === 'voice' && (
                          <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[9px] flex items-center gap-1 font-semibold">
                            <Mic className="w-2.5 h-2.5" /> Voice Intake
                          </span>
                        )}
                      </div>
                      <p className="text-[#172033] font-medium leading-relaxed pl-1 text-xs sm:text-sm">{r.question}</p>
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Patient Answer Given:</span>
                        <div className="p-2.5 rounded-xl bg-white border border-[#D9E4E5] text-[#0F172A] font-semibold text-xs sm:text-sm">
                          "{r.answer}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Medication Suggestions for Attending Doctor */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E6F7F7]/60 via-[#F0FDFA]/40 to-white border-2 border-[#0EA5A8] shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#0EA5A8]/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0EA5A8] text-white flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                      AI Medication Suggestions for Attending Doctor
                    </h4>
                    <span className="text-[10px] text-[#64748B]">Physician Clinical Review &amp; Prescribing Advisory</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30">
                  Doctor Will Prescribe
                </span>
              </div>

              {summary?.aiMedicationSuggestions && summary.aiMedicationSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.aiMedicationSuggestions.map((med, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#D9E4E5] text-xs space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <strong className="text-[#172033] text-sm block">💊 {med.medicineName} {med.strength ? `(${med.strength})` : ''}</strong>
                          {med.genericName && <span className="text-[10px] text-[#64748B] block">{med.genericName}</span>}
                        </div>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20 shrink-0">
                          {med.category || 'Medication'}
                        </span>
                      </div>
                      <div className="text-[11px] bg-[#F8FAFC] p-2 rounded-lg border border-[#D9E4E5] space-y-0.5">
                        <div><strong>Dosage:</strong> {med.dosage || '1 tablet'} • {med.frequency || 'Twice daily'}</div>
                        <div><strong>Timing:</strong> {med.timing || 'After food'} ({med.duration || '5 days'})</div>
                      </div>
                      {med.clinicalRationale && (
                        <p className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200">
                          <strong>Rationale:</strong> {med.clinicalRationale}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenPrescriptionBuilder) {
                            onOpenPrescriptionBuilder(patient, request?._id, {
                              name: med.medicineName,
                              genericName: med.genericName,
                              strength: med.strength || '500 mg',
                              form: med.form || 'Tablet',
                              dosage: med.dosage || '1 tablet',
                              frequency: med.frequency || 'Twice daily',
                              duration: med.duration || '5 days',
                              instructions: `${med.timing || 'After food'} - ${med.clinicalRationale || ''}`,
                            });
                          }
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-[#0EA5A8] hover:bg-[#0C8F92] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add to Official Prescription</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No specific medications suggested. Use Prescription Builder below.</p>
              )}
            </div>

            {/* 3. OCR Extracted Reports */}
            {extractions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  OCR Extracted Clinical Lab & Prescription Data
                </h4>
                <div className="space-y-2">
                  {extractions.map((ext, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs space-y-2 shadow-xs">
                      <div className="flex justify-between items-center text-[11px] text-[#64748B]">
                        <span>Source: {ext.structuredData?.doctorName || 'Lab Extraction'}</span>
                        <span className="font-mono text-[#0EA5A8] font-semibold">Confidence: {ext.confidenceScore}%</span>
                      </div>

                      {ext.structuredData?.labTests && (
                        <div className="flex flex-wrap gap-2">
                          {ext.structuredData.labTests.map((t, ti) => (
                            <span key={ti} className="px-2.5 py-1 rounded-lg bg-white border border-[#D9E4E5] text-[11px] text-[#172033] shadow-xs">
                              <strong>{t.testName}:</strong> {t.value} {t.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned Patient Medical Reports */}
            {summary?.pinnedReports && summary.pinnedReports.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
                <PinnedReportsGallery
                  reports={summary.pinnedReports}
                  readOnly={true}
                  title="Pinned Diagnostic Reports & Document Images"
                />
              </div>
            )}

            {/* 4. Longitudinal Timeline */}
            {timeline.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  Patient Medical Timeline ({timeline.length} records)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {timeline.slice(0, 4).map((t, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs shadow-xs">
                      <div className="flex justify-between text-[10px] text-[#64748B] font-mono mb-1">
                        <span>{t.year} • {t.eventType}</span>
                        <span>{t.doctorOrFacility}</span>
                      </div>
                      <strong className="text-[#172033] block">{t.title}</strong>
                      <p className="text-[#64748B] text-[11px] mt-0.5 line-clamp-1">{t.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* DOCTOR CLINICAL ASSESSMENT & NOTES EDITOR                     */}
        {/* ============================================================ */}
        <div className="p-5 rounded-2xl bg-[#F3F8F8] border border-[#0284C7]/20 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" />
            <span>Physician Clinical Notes &amp; Case Adjustments</span>
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-[#172033] mb-1">
              Clinical Impressions &amp; Notes (Add Notes)
            </label>
            <textarea
              id="doctor-clinical-notes-input"
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter your clinical findings, diagnosis impressions, or follow-up notes..."
              className="w-full bg-white border border-[#D9E4E5] rounded-xl p-3 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#172033] mb-1">
              Physician Edits / Corrections to Summary (Edit Summary)
            </label>
            <input
              id="doctor-summary-edits-input"
              type="text"
              value={doctorEdits}
              onChange={(e) => setDoctorEdits(e.target.value)}
              placeholder="e.g. Corrected symptom duration, verified digestion pattern..."
              className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Verification Stamp Display */}
          {isPhysicianConfirmed && stampData && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2 text-[#16A34A] font-extrabold text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                <span>✓ Case Confirmed by Physician — Ready for Consultation</span>
              </div>
              <div className="text-left sm:text-right text-[11px] text-[#64748B] space-y-0.5">
                <div>Physician: <strong className="text-[#172033]">{stampData.doctorName}</strong></div>
                <div>Registration Number: <strong className="text-[#0EA5A8] font-mono">{stampData.licenseNumber}</strong></div>
                <div>Date / Time: <strong className="text-[#172033]">{new Date(stampData.reviewedAt || Date.now()).toLocaleString()}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Accept Patient Summary & Schedule Checkup */}
        <div className="p-5 rounded-2xl bg-white border border-[#D9E4E5] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9E4E5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Accept Patient Summary &amp; Schedule Consultation
                </h4>
                <p className="text-[11px] text-[#64748B]">
                  Accepting confirms the case and alerts the patient to visit the clinic.
                </p>
              </div>
            </div>

            {isAccepted ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>✓ Summary Accepted — Checkup Tomorrow</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-[#D97706] border border-amber-200 self-start sm:self-auto">
                Awaiting Doctor Acceptance
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#172033] mb-1">Checkup Schedule Date</label>
              <input
                type="text"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                placeholder="e.g. Tomorrow"
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-[#0EA5A8]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#172033] mb-1">Consultation Time Slot</label>
              <input
                type="text"
                value={appointmentSlot}
                onChange={(e) => setAppointmentSlot(e.target.value)}
                placeholder="e.g. 10:00 AM - 01:00 PM"
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3 py-2 text-xs text-[#172033] font-semibold focus:outline-none focus:border-[#0EA5A8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#172033] mb-1">
              Instructions for Patient (Included in Notification)
            </label>
            <input
              type="text"
              value={doctorMessage}
              onChange={(e) => setDoctorMessage(e.target.value)}
              placeholder="e.g. Your summary has been accepted. Please come tomorrow for in-person clinical checkup..."
              className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
            />
          </div>

          {!isAccepted ? (
            <button
              onClick={handleAcceptSummary}
              disabled={accepting}
              className="w-full py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0C8F92] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{accepting ? 'Accepting & Sending Notification...' : 'Accept Summary & Notify Patient'}</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#16A34A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Patient notified: <strong>"You can go tomorrow for your checkup."</strong></span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenPrescriptionBuilder(patient, request._id);
                }}
                className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803D] flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Conduct Checkup &amp; Prescribe Medicines</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-4 border-t border-[#D9E4E5] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033] cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isAccepted && (
              <button
                onClick={handleAcceptSummary}
                disabled={accepting}
                className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{accepting ? 'Accepting...' : 'Accept Summary'}</span>
              </button>
            )}

            {!isPhysicianConfirmed ? (
              <button
                onClick={handleConfirmCase}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Confirming Case...' : 'Confirm Case'}</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 border border-emerald-300">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>✓ Case Confirmed • Ready for Consultation</span>
              </div>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenPrescriptionBuilder(patient, request?._id);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pill className="w-4 h-4 text-[#0EA5A8]" />
              <span>Conduct Checkup &amp; Prescribe</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


