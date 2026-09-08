import React from 'react';
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
} from 'lucide-react';
import { PinnedReportsGallery } from '../common/PinnedReportsGallery';

export const HealthSummaryView = ({ summary, onChooseDoctor, onAttachReport, onRemoveReport }) => {
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
        
        {/* Header Title + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9E4E5] gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172033]">Patient Structured Health Summary</h2>
            </div>
            <p className="text-xs text-[#64748B]">Synthesized by MediKiosk AI Clinical Triage Core</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {summary.status === 'DOCTOR_REVIEWED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ Doctor Reviewed</span>
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

        {/* Patient Profile Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Patient Name</span>
            <span className="font-bold text-[#172033]">{summary.patientName || 'Demo Patient'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">OP Number (OPD)</span>
            <span className="font-bold font-mono text-[#0EA5A8] px-1.5 py-0.5 rounded bg-[#E6F7F7] border border-[#0EA5A8]/20 inline-block">
              {summary.opNumber || 'OP-Token'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Age &amp; Gender</span>
            <span className="font-bold text-[#172033]">{summary.patientAge} Yrs / {summary.patientGender}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Symptom Duration</span>
            <span className="font-bold text-[#172033]">{summary.duration || 'Not stated'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Reported Severity</span>
            <span className="font-bold text-[#0EA5A8]">{summary.severity || 'Moderate'}</span>
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

        {/* Pinned Diagnostic Reports & Lab Scans */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
          <PinnedReportsGallery
            reports={summary.pinnedReports || []}
            onAttachReport={onAttachReport}
            onRemoveReport={onRemoveReport}
            title="Pinned Lab Reports & Diagnostic Scans"
          />
        </div>

        {/* Section 5: AI Clinical Synthesis Narrative */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
            AI Clinical Synthesis Narrative (Doctor Review Required)
          </h4>
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#172033] leading-relaxed whitespace-pre-wrap font-sans">
            {summary.aiGeneratedText}
          </div>
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

        {/* Bottom Call-to-Action: Select Doctor & Share */}
        {summary.status !== 'DOCTOR_REVIEWED' && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#64748B]">
              Ready to send this summary to an attending hospital specialist?
            </span>
            <button
              onClick={onChooseDoctor}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Select Doctor & Share Summary</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
