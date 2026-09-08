import React, { useState } from 'react';
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
} from 'lucide-react';
import { api } from '../../services/api';
import { PinnedReportsGallery } from '../common/PinnedReportsGallery';

export const PatientDossierModal = ({
  isOpen,
  onClose,
  dossier,
  onReviewConfirmed,
  onOpenPrescriptionBuilder,
}) => {
  if (!isOpen || !dossier) return null;

  const { request, patient, summary, interview, documents = [], extractions = [], timeline = [] } = dossier;

  const [clinicalNotes, setClinicalNotes] = useState(request.clinicalNotes || summary?.doctorReview?.clinicalNotes || '');
  const [doctorEdits, setDoctorEdits] = useState(summary?.doctorReview?.doctorEdits || '');
  const [isReviewed, setIsReviewed] = useState(request.status === 'REVIEWED' || summary?.status === 'DOCTOR_REVIEWED');
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
  const [stampData, setStampData] = useState(summary?.doctorReview || null);

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

  const handleConfirmReview = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/doctors/portal/confirm-review/${request._id}`, {
        clinicalNotes,
        doctorEdits,
      });

      if (res.success) {
        setIsReviewed(true);
        setStampData({
          doctorName: res.reviewedBy.doctorName,
          licenseNumber: res.reviewedBy.licenseNumber,
          reviewedAt: res.reviewedBy.reviewedAt,
          clinicalNotes,
        });
        if (onReviewConfirmed) onReviewConfirmed(res.summary);
      }
    } catch (err) {
      alert('Error confirming review: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isRedFlag = summary?.redFlagStatus === 'HIGH_PRIORITY' || request.priority === 'HIGH_PRIORITY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033] my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#D9E4E5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">Clinical Review Station</span>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                isRedFlag ? 'bg-rose-50 text-[#DC2626] border border-rose-200' : 'bg-slate-100 text-[#64748B]'
              }`}>
                {isRedFlag ? '⚠ URGENT PRIORITY' : 'ROUTINE OPD'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] mt-1">
              Patient Dossier: {patient.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Profile Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#F3F8F8] border border-[#D9E4E5] text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px]">Age & Gender</span>
            <strong className="text-[#172033]">{patient.age} Yrs / {patient.gender}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Contact Phone</span>
            <strong className="text-[#172033] font-mono">{patient.phoneNumber}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Blood Group</span>
            <strong className="text-[#172033]">{patient.bloodGroup || 'Not specified'}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">Weight / Height</span>
            <strong className="text-[#172033]">{patient.weight || '—'} kg / {patient.height || '—'} cm</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[11px]">ABHA Identity</span>
            <strong className="text-[#16A34A]">{patient.aadhaarDemoVerified ? '✓ Demo Verified' : 'Pending'}</strong>
          </div>
        </div>

        {/* 1. AI Health Summary & Chief Complaint */}
        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>AI Health Summary & Chief Complaint</span>
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
        {interview?.responses && interview.responses.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Natural Language AI Check-Up Q&A ({interview.responses.length} turns)
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {interview.responses.map((r, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs">
                  <div className="text-[#64748B] font-medium mb-0.5">AI: {r.question}</div>
                  <div className="text-[#0EA5A8] font-semibold pl-2 border-l-2 border-[#0EA5A8]">
                    Patient: "{r.answer}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Pinned Patient Medical Reports & Lab Scans */}
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

        {/* 5. Doctor Review & Clinical Notes Editor */}
        <div className="p-5 rounded-2xl bg-[#F3F8F8] border border-[#0284C7]/20 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" />
            <span>Doctor Clinical Assessment & Review</span>
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-[#172033] mb-1">Clinical Impressions & Notes (Add Notes)</label>
            <textarea
              id="doctor-clinical-notes-input"
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter your clinical findings, adjustments, or follow-up orders..."
              className="w-full bg-white border border-[#D9E4E5] rounded-xl p-3 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#172033] mb-1">Doctor Edits to Patient Summary (Edit Summary)</label>
            <input
              id="doctor-summary-edits-input"
              type="text"
              value={doctorEdits}
              onChange={(e) => setDoctorEdits(e.target.value)}
              placeholder="e.g. Corrected duration to 3 days instead of 5"
              className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Verification Stamp Display */}
          {isReviewed && stampData && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2 text-[#16A34A] font-extrabold text-sm uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                <span>✓ Doctor Reviewed</span>
              </div>
              <div className="text-left sm:text-right text-[11px] text-[#64748B] space-y-0.5">
                <div>Doctor Name: <strong className="text-[#172033]">{stampData.doctorName}</strong></div>
                <div>Registration Number: <strong className="text-[#0EA5A8] font-mono">{stampData.licenseNumber}</strong></div>
                <div>Date / Time: <strong className="text-[#172033]">{new Date(stampData.reviewedAt || Date.now()).toLocaleString()}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Accept Patient Summary & Schedule Checkup */}
        <div className="p-5 rounded-2xl bg-white border border-[#D9E4E5] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9E4E5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Accept Patient Summary &amp; Schedule Checkup
                </h4>
                <p className="text-[11px] text-[#64748B]">
                  Accepting alerts the patient to visit the clinic tomorrow for their in-person checkup.
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
              Instructions for Patient (Included in Patient's Notification &amp; Dashboard)
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
              className="w-full py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0C8F92] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{accepting ? 'Accepting & Sending Notification...' : 'Accept Summary & Notify Patient to Visit Tomorrow'}</span>
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
                className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803D] flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto shrink-0"
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
            className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172033]"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isAccepted && (
              <button
                onClick={handleAcceptSummary}
                disabled={accepting}
                className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{accepting ? 'Accepting...' : 'Accept Summary'}</span>
              </button>
            )}

            {!isReviewed ? (
              <button
                onClick={handleConfirmReview}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Confirming...' : 'Confirm Review Stamp'}</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-[#16A34A] flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Doctor Reviewed</span>
              </div>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenPrescriptionBuilder(patient, request._id);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Pill className="w-4 h-4 text-[#0EA5A8]" />
              <span>Conduct Checkup &amp; Prescribe Medicines</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

