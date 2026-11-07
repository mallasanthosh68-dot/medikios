import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Stethoscope,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Share2,
  Sparkles,
  ArrowRight,
  User,
  HeartPulse,
  Pill,
  Activity,
  Calendar,
  History,
  Ticket,
  Leaf,
  Award,
  Check,
  Copy,
  Bot,
  MessageSquare,
  Mic,
} from 'lucide-react';
import { MediKioskLogo } from '../common/MediKioskLogo';
import { PinnedReportsGallery } from '../common/PinnedReportsGallery';
import { AIBotSummaryAssistant } from './AIBotSummaryAssistant';

export const HealthSummaryView = ({ summary, onChooseDoctor, onAttachReport, onRemoveReport }) => {
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

  if (!summary) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-[#D9E4E5] shadow-sm">
        <FileText className="w-12 h-12 text-[#64748B]/60 mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#172033]">No Active Health Summary</h3>
        <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
          Complete an AI Health Check-Up to compile your symptoms, previous reports, and timeline into a structured clinical summary.
        </p>
      </div>
    );
  }

  const isRedFlag = summary.redFlagStatus === 'HIGH_PRIORITY';

  return (
    <div className="space-y-6">

      {/* Top Clinical Caution Alert: Mandatory per specification */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-800">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold tracking-wide">
            AI-generated summary — Doctor review required.
          </span>
        </div>
        <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded font-mono uppercase font-bold text-amber-900">
          Provisional Triage
        </span>
      </div>

      {/* Red-Flag Urgent Banner if triggered */}
      {isRedFlag && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-rose-900 font-bold uppercase tracking-wider block">
              ⚠ HIGH PRIORITY RED-FLAG DETECTED
            </strong>
            <p className="mt-0.5 text-rose-700">
              {summary.redFlagMessage ||
                'Some symptoms described indicate potential high acuity. Please inform triage or emergency nursing staff immediately.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Clinical Summary Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm space-y-6">

        {/* Header Title + Status + Pathway Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9E4E5] gap-3">
          <div className="flex items-center gap-3">
            <MediKioskLogo size={42} showText={false} />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">Patient Structured Health Summary</h2>
              </div>
              <p className="text-xs text-[#64748B]">Synthesized by MediKiosk AI Clinical Triage Core • Doctor Review Required</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Healthcare Pathway Badge */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${summary.healthcareMode === 'ayush'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-[#E6F7F7] border-[#0EA5A8]/30 text-[#0EA5A8]'
              }`}>
              <span>{summary.healthcareMode === 'ayush' ? '🌿 AYUSH Pathway' : '🏥 General Medical'}</span>
            </span>

            {/* Communication Mode Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span>{summary.communicationMode === 'voice' ? '🎤 Voice-Assisted' : '💬 Text Intake'}</span>
            </span>

            {/* Doctor Review Status */}
            {summary.caseStatus === 'PHYSICIAN_CONFIRMED' || summary.status === 'DOCTOR_REVIEWED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ PHYSICIAN CONFIRMED • READY FOR CONSULTATION</span>
              </span>
            ) : summary.caseStatus === 'PATIENT_CONFIRMED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800">
                <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>PATIENT CONFIRMED • WAITING FOR PHYSICIAN REVIEW</span>
              </span>
            ) : summary.status === 'SHARED_WITH_DOCTOR' ? (
              <span className="px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#0284C7]/30 text-xs font-semibold text-[#0284C7] font-mono">
                Shared with Physician
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#D9E4E5] text-xs font-semibold text-[#64748B] font-mono">
                Draft / Ready to Share
              </span>
            )}
          </div>
        </div>

        {/* PROMINENT OUTPATIENT OP NUMBER HERO CARD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#E6F7F7] via-[#F0FDFA] to-[#E0F2FE] border-2 border-[#0EA5A8] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0EA5A8] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Ticket className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#0EA5A8]">
                  Outpatient (OP) Token
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                  Active Consultation
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#172033] mt-0.5">
                OP Number: <span className="font-mono text-[#0EA5A8] tracking-widest">{summary.opNumber || 'OP-Pending'}</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Every newly created summary carries this assigned outpatient token for doctor review and hospital administrative routing.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end shrink-0 gap-1.5">
            <div className="px-5 sm:px-6 py-2 rounded-2xl bg-white border-2 border-[#0EA5A8] shadow-xs font-mono text-2xl sm:text-3xl font-black text-[#0EA5A8] tracking-widest select-all">
              {summary.opNumber || 'OP-Pending'}
            </div>
            {summary.opNumber && (
              <button
                onClick={() => handleCopyOp(summary.opNumber)}
                className="text-[11px] font-bold text-[#0EA5A8] hover:text-[#0c8f91] flex items-center gap-1 cursor-pointer transition-colors bg-white/80 px-3 py-1 rounded-lg border border-[#0EA5A8]/30 shadow-2xs"
              >
                {copiedOp ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy OP Token</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Patient Profile Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Patient Name</span>
            <span className="font-bold text-[#172033]">{summary.patientName || 'Demo Patient'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Contact Number</span>
            <span className="font-bold text-[#172033] font-mono">{summary.patientPhone || '—'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">ABHA ID / ABDM</span>
            <span className="font-bold font-mono text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 inline-block truncate max-w-full">
              {summary.abhaId || 'ABHA-Not-Linked'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">OP Number (OPD)</span>
            <span className="font-bold font-mono text-[#0EA5A8] px-1.5 py-0.5 rounded bg-[#E6F7F7] border border-[#0EA5A8]/20 inline-block">
              {summary.opNumber || 'OP-Pending'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Age &amp; Gender</span>
            <span className="font-bold text-[#172033]">{summary.patientAge} Yrs / {summary.patientGender}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Reported Severity</span>
            <span className="font-bold text-[#0EA5A8]">{summary.severity || 'Moderate'}</span>
          </div>
        </div>

        {/* Case Data Quality Score Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D9E4E5]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0EA5A8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Case Data Quality Score
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30">
                {summary.caseDataQualityScore?.overallScore || 85}% Score
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] italic">
              Verification: {summary.caseDataQualityScore?.verificationStatus || 'Pending Qualified Doctor Verification'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-[#D9E4E5]">
              <span className="text-[10px] text-[#64748B] block">Completeness</span>
              <span className="text-base font-bold text-[#172033]">
                {summary.caseDataQualityScore?.completenessScore || 85}%
              </span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#0EA5A8] h-full rounded-full"
                  style={{ width: `${summary.caseDataQualityScore?.completenessScore || 85}%` }}
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#D9E4E5]">
              <span className="text-[10px] text-[#64748B] block">Consistency</span>
              <span className="text-base font-bold text-emerald-600">
                {summary.caseDataQualityScore?.consistencyScore || 90}%
              </span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${summary.caseDataQualityScore?.consistencyScore || 90}%` }}
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#D9E4E5]">
              <span className="text-[10px] text-[#64748B] block">Clarity</span>
              <span className="text-base font-bold text-[#0284C7]">
                {summary.caseDataQualityScore?.clarityScore || 80}%
              </span>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#0284C7] h-full rounded-full"
                  style={{ width: `${summary.caseDataQualityScore?.clarityScore || 80}%` }}
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#D9E4E5]">
              <span className="text-[10px] text-[#64748B] block">Verification</span>
              <span className="text-xs font-bold text-amber-700 block mt-1">
                Doctor Review Req.
              </span>
              <span className="text-[9px] text-[#64748B] block mt-0.5">Non-diagnostic AI</span>
            </div>
          </div>
        </div>

        {/* Section 1: Chief Concern & Symptoms */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Chief Health Concern</h4>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-sm text-[#172033] font-medium">
            "{summary.chiefComplaint}"
          </div>

          <div className="mt-3">
            <span className="text-xs text-[#64748B] block mb-2 font-medium">Extracted Clinical Symptoms:</span>
            <div className="flex flex-wrap gap-2">
              {summary.symptoms?.map((sym, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs text-[#0EA5A8] font-medium"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: SUGGESTED MEDICAL SPECIALTY */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#E6F7F7] via-[#EAF3F3] to-[#F3F8F8] border border-[#0EA5A8]/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#0EA5A8]/30 flex items-center justify-center text-[#0EA5A8] shrink-0 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#0EA5A8] uppercase tracking-wider block">
                  Automated Clinical Routing
                </span>
                <h4 className="text-lg font-extrabold text-[#172033] mt-0.5">
                  Suggested Medical Specialty: {summary.suggestedSpecialty}
                </h4>
                <p className="text-xs text-[#64748B] mt-1">
                  {summary.specialtyRationale || 'Symptoms indicate evaluation by this department.'}
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory Disclaimer */}
          <div className="mt-3 pt-3 border-t border-[#0EA5A8]/20 flex items-center gap-2 text-[11px] text-[#0EA5A8]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="italic">
              Suggested medical specialty — This is a specialty suggestion, NOT a medical diagnosis.
            </span>
          </div>
        </div>

        {/* Dedicated AYUSH Assessment Section */}
        {(summary.healthcareMode === 'ayush' || summary.ayushAssessment) && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-[#F0FDF4] to-white border-2 border-emerald-500/40 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-emerald-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 shadow-xs">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                    Traditional &amp; Complementary Health
                  </span>
                  <h4 className="text-base font-extrabold text-emerald-950">
                    AYUSH Clinical Assessment Parameters
                  </h4>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Vaidya / Qualified Practitioner Review Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                  🌿 Prakriti (Indicative Traits):
                </span>
                <p className="text-[#172033] leading-relaxed">
                  {summary.ayushAssessment?.prakriti || 'Inquiry into constitutional traits (Vata/Pitta/Kapha tendencies) logged.'}
                </p>
                <span className="text-[10px] text-emerald-700 italic block mt-1">
                  *Patient-reported indicative traits only; definitive Prakriti Pariksha performed by Vaidya.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                  ⚖ Vikriti (Current Imbalance):
                </span>
                <p className="text-[#172033] leading-relaxed">
                  {summary.ayushAssessment?.vikriti || 'Aggravation or constitutional imbalance reported with present illness.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                  🔥 Agni &amp; Koshtha:
                </span>
                <p className="text-[#172033]">
                  <strong>Agni (Digestive Fire):</strong> {summary.ayushAssessment?.agni || 'Moderate digestion reported'}
                </p>
                <p className="text-[#172033] mt-1">
                  <strong>Koshtha (Bowel Pattern):</strong> {summary.ayushAssessment?.koshtha || 'Regular bowel movement pattern'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                  🌙 Ahara, Vihara &amp; Nidra (Lifestyle Factors):
                </span>
                <p className="text-[#172033]">
                  <strong>Diet (Ahara):</strong> {summary.ayushAssessment?.ahara || 'Balanced meals reported'}
                </p>
                <p className="text-[#172033] mt-1">
                  <strong>Sleep (Nidra):</strong> {summary.ayushAssessment?.nidra || 'Normal sleep patterns'}
                </p>
                <p className="text-[#172033] mt-1">
                  <strong>Daily Routine (Vihara):</strong> {summary.ayushAssessment?.vihara || 'Standard daily physical routine'}
                </p>
              </div>
            </div>

            {summary.ayushAssessment?.traditionalPractices && (
              <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 block mb-0.5">
                  Ayurveda / Yoga / Unani / Siddha / Homeopathy History:
                </span>
                <p className="text-[#172033]">{summary.ayushAssessment.traditionalPractices}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-100/60 border border-emerald-300/50 text-[11px] text-emerald-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Clinical Notice:</span>
              {summary.ayushAssessment?.verificationNotice ||
                'This case intake is structured to assist registered AYUSH practitioners and Vaidyas. It does not replace physical pulse diagnosis (Nadi Pariksha) or physician clinical judgment.'}
            </div>
          </div>
        )}

        {/* Section 3: Patient's Own Description & Clinical History */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0EA5A8]" />
              <span>Patient's Own Description</span>
            </h4>
            <p className="text-xs text-[#172033] leading-relaxed italic">
              "{summary.chiefComplaint}"
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#0EA5A8]" />
              <span>Relevant Medical History</span>
            </h4>
            {summary.medicalHistory && summary.medicalHistory.length > 0 ? (
              <ul className="space-y-1">
                {summary.medicalHistory.map((h, idx) => (
                  <li key={idx} className="text-xs text-[#172033] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5A8] shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#64748B]">No chronic medical conditions reported.</p>
            )}
          </div>
        </div>

        {/* Section 4: Previous Medicines & Previous Lab Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-amber-500" />
              <span>Previous Medicines & Prescriptions</span>
            </h4>
            {summary.previousMedicines && summary.previousMedicines.length > 0 ? (
              <ul className="space-y-1.5">
                {summary.previousMedicines.map((m, idx) => (
                  <li key={idx} className="text-xs text-[#172033] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            ) : summary.previousPrescriptions && summary.previousPrescriptions.length > 0 ? (
              <ul className="space-y-1.5">
                {summary.previousPrescriptions.map((p, idx) => (
                  <li key={idx} className="text-xs text-[#172033]">
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#64748B]">No active daily medications recorded.</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Previous Lab Results (OCR Extracted)</span>
            </h4>
            {summary.previousLabResults && summary.previousLabResults.length > 0 ? (
              <div className="space-y-1.5">
                {summary.previousLabResults.slice(0, 4).map((l, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white border border-[#D9E4E5]">
                    <span className="text-[#172033] font-medium">{l.test}</span>
                    <span className="font-mono text-[#0EA5A8] font-bold">{l.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">No previous lab metrics attached.</p>
            )}
          </div>
        </div>

        {/* Pinned Diagnostic Reports & Lab Scans - Only displayed if patient uploaded documents */}
        {summary.pinnedReports && summary.pinnedReports.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
            <PinnedReportsGallery
              reports={summary.pinnedReports}
              onAttachReport={onAttachReport}
              onRemoveReport={onRemoveReport}
              title="Pinned Lab Reports & Diagnostic Scans"
            />
          </div>
        )}

        {/* Section 5: AI Clinical Synthesis Narrative */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            AI Clinical Synthesis Narrative (Doctor Review Required)
          </h4>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#172033] leading-relaxed whitespace-pre-wrap font-sans">
            {summary.aiGeneratedText}
          </div>
        </div>

        {/* Section 6: AI Bot & Patient Intake Conversation Dialogue */}
        <AIBotSummaryAssistant summary={summary} language={summary?.language || 'en'} />

        {/* Section 7: AI Medication Suggestions for Attending Doctor / Vaidya */}
        <div className={`p-5 sm:p-6 rounded-3xl border-2 shadow-xs space-y-4 ${summary.healthcareMode === 'ayush'
            ? 'bg-gradient-to-br from-emerald-50/90 via-[#F0FDF4] to-white border-emerald-400'
            : 'bg-gradient-to-br from-[#E6F7F7]/70 via-[#F0FDFA]/50 to-white border-[#0EA5A8]'
          }`}>
          <div className={`flex items-center justify-between flex-wrap gap-2 pb-3 border-b ${summary.healthcareMode === 'ayush' ? 'border-emerald-200' : 'border-[#0EA5A8]/20'
            }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${summary.healthcareMode === 'ayush' ? 'bg-emerald-600' : 'bg-[#0EA5A8]'
                }`}>
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider block ${summary.healthcareMode === 'ayush' ? 'text-emerald-800' : 'text-[#0EA5A8]'
                  }`}>
                  Prescription Support Advisory
                </span>
                <h4 className="text-base font-extrabold text-[#172033]">
                  AI Medication Suggestions for Attending Doctor
                </h4>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${summary.healthcareMode === 'ayush'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-[#E6F7F7] text-[#0EA5A8] border-[#0EA5A8]/30'
              }`}>
              Doctor Review &amp; Official Prescription Required
            </span>
          </div>

          {/* Clinical Disclaimer Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Physician Advisory Notice:</strong> The following medications and dosages are suggested by AI clinical triage based on patient-reported symptoms. <strong>The attending doctor / Vaidya will evaluate the patient, check for contraindications/allergies, and write the official prescription.</strong>
            </div>
          </div>

          {summary.aiMedicationSuggestions && summary.aiMedicationSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {summary.aiMedicationSuggestions.map((med, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[#D9E4E5] shadow-2xs space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-extrabold text-[#172033] text-sm flex items-center gap-1.5">
                        <span>{summary.healthcareMode === 'ayush' ? '🌿' : '💊'} {med.medicineName}</span>
                        {med.strength && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {med.strength}
                          </span>
                        )}
                      </h5>
                      {med.genericName && (
                        <p className="text-[11px] text-[#64748B] mt-0.5">{med.genericName}</p>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${summary.healthcareMode === 'ayush'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-[#E6F7F7] text-[#0EA5A8] border-[#0EA5A8]/20'
                      }`}>
                      {med.category || 'Therapeutic'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#D9E4E5]">
                    <div>
                      <span className="text-[#64748B] text-[10px] block font-medium">Dosage &amp; Frequency:</span>
                      <strong className="text-[#172033]">{med.dosage || '1 unit'} • {med.frequency || 'Daily'}</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] block font-medium">Timing &amp; Duration:</span>
                      <strong className="text-[#172033]">{med.timing || 'After food'} ({med.duration || '5 days'})</strong>
                    </div>
                  </div>

                  {med.clinicalRationale && (
                    <p className="text-[10px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                      <strong>Clinical Rationale:</strong> {med.clinicalRationale}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#64748B]">
              No specific preliminary medication suggestions recorded. The attending physician will evaluate and prescribe during consultation.
            </div>
          )}
        </div>

        {/* If Doctor has reviewed: Show clinical stamp & doctor notes */}
        {summary.doctorReview?.reviewedAt && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✓ Doctor Reviewed Stamp</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-900 mb-3">
              <div>Doctor: <strong className="text-[#172033]">{summary.doctorReview.doctorName}</strong></div>
              <div>Registration No: <strong className="text-[#172033]">{summary.doctorReview.licenseNumber}</strong></div>
              <div>Date: <strong className="text-[#172033]">{new Date(summary.doctorReview.reviewedAt).toLocaleString()}</strong></div>
            </div>
            {summary.doctorReview.clinicalNotes && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-[#172033]">
                <span className="text-[11px] text-[#64748B] font-medium block mb-1">Doctor's Clinical Notes:</span>
                <p>{summary.doctorReview.clinicalNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Outpatient (OP) Token Routing Status */}
        <div className="pt-4 border-t border-[#D9E4E5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] shrink-0 font-mono font-black text-xs">
              OP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  Outpatient Token: <span className="font-mono text-[#0EA5A8] font-black">{summary.opNumber || 'OP-Pending'}</span>
                </span>
                {summary.doctorReview?.doctorName ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Assigned: {summary.doctorReview.doctorName}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0284C7]">
                    Direct Doctor Consultation Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {summary.doctorReview?.doctorName
                  ? `Your summary has been dispatched to Dr. ${summary.doctorReview.doctorName}.`
                  : 'Please provide your OP ID directly to your attending doctor to open your clinical health summary immediately.'}
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs font-mono font-bold text-[#172033] shrink-0">
            Status: {summary.doctorReview?.doctorName ? 'Physician Review Queue' : 'Direct OP Active'}
          </div>
        </div>

      </div>
    </div>
  );
};
