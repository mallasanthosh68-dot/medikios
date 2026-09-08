import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareHeart,
  FileText,
  Clock,
  FileCheck,
  UserCheck,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  XCircle,
  Activity,
  HeartPulse,
  Pill,
  ShieldCheck,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AIHealthCheckup } from './AIHealthCheckup';
import { CameraScannerModal } from './CameraScannerModal';
import { HealthTimeline } from './HealthTimeline';
import { HealthSummaryView } from './HealthSummaryView';
import { DoctorDirectory } from './DoctorDirectory';

export const GuidedHealthCheck = ({ onFinishCheckup, onSwitchTab }) => {
  const { user, language } = useAuth();

  // Active step in the guided journey (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([1]);

  // Session state across the wizard
  const [interviewSummary, setInterviewSummary] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [analyzedExtraction, setAnalyzedExtraction] = useState(null);
  const [rejectionNotice, setRejectionNotice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Steps configuration
  const steps = [
    { num: 1, title: 'AI Health Check', subtitle: 'Disease & symptoms interview', icon: MessageSquareHeart },
    { num: 2, title: 'Past Lab Reports', subtitle: 'Camera scan or upload', icon: FileText },
    { num: 3, title: 'Health Timeline', subtitle: 'Longitudinal record view', icon: Clock },
    { num: 4, title: 'Clinical Summary', subtitle: 'AI dossier & specialist match', icon: FileCheck },
    { num: 5, title: 'Doctor & Consent', subtitle: 'Choose doctor & get token', icon: UserCheck },
  ];

  const markStepComplete = (stepNum) => {
    if (!completedSteps.includes(stepNum)) {
      setCompletedSteps((prev) => [...prev, stepNum]);
    }
  };

  const goToStep = (stepNum) => {
    // Only allow navigating to visited or current steps
    if (stepNum <= Math.max(...completedSteps) + 1) {
      setCurrentStep(stepNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 1: Callback when AI Health Checkup produces a structured summary
  const handleSummaryReady = (summary) => {
    setInterviewSummary(summary);
    markStepComplete(1);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Handle lab report or prescription file upload / camera capture (Supports multiple images)
  const handleProcessDocument = async (fileOrFiles, uploadMethod = 'device') => {
    if (!fileOrFiles) return;
    const files = Array.isArray(fileOrFiles)
      ? fileOrFiles
      : fileOrFiles instanceof FileList
      ? Array.from(fileOrFiles)
      : [fileOrFiles];

    if (files.length === 0) return;

    setIsUploading(true);
    setRejectionNotice(null);

    const formData = new FormData();
    files.forEach((f) => {
      formData.append('documents', f);
    });
    formData.append('documentType', 'Lab Report');
    formData.append('uploadMethod', uploadMethod);

    try {
      let res;
      try {
        res = await api.uploadFile('/documents/upload', formData);
      } catch (uploadErr) {
        // Fallback for route prefix if needed
        if (uploadErr.status === 404) {
          res = await api.uploadFile('/patients/documents/upload', formData);
        } else {
          throw uploadErr;
        }
      }

      if (res && res.success) {
        const newDocs = res.documents || (res.document ? [res.document] : []);
        setUploadedReports((prev) => [...newDocs, ...prev]);

        if (res.extraction) {
          setAnalyzedExtraction(res.extraction);
        } else if (res.extractions && res.extractions.length) {
          setAnalyzedExtraction(res.extractions[0]);
        }

        if (res.rejectedFiles && res.rejectedFiles.length > 0) {
          alert(
            `Notice: ${res.rejectedFiles.length} file(s) were rejected because only authentic hospital reports are allowed.\n\n${res.rejectedFiles.map((r) => `• ${r.fileName}: ${r.reason}`).join('\n')}`
          );
        }

        markStepComplete(2);
      }
    } catch (err) {
      console.warn('Document upload/validation error:', err);
      // Display rejection alert with clear message matching user requirement
      setRejectionNotice({
        title: 'Please upload authentic hospital reports',
        details:
          err.details ||
          err.message ||
          'MediKiosk only accepts valid hospital reports, pathology/biochemistry lab tests (CBC, Blood Sugar, Lipid Profile, etc.), or doctor prescriptions. Detected non-medical document.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Callback from CameraScannerModal
  const handleCameraScanCaptured = (capturedFile) => {
    handleProcessDocument(capturedFile, 'camera');
  };

  // Step 5: Doctor request & consent confirmed
  const handleDoctorAppointmentConfirmed = (doctor, tokenNumber = 'OPD-A-18') => {
    setAppointmentConfirmed({
      doctor,
      tokenNumber,
      roomNumber: doctor.roomNumber || 'Room 104',
      estimatedWait: '12 - 15 minutes',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    markStepComplete(5);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* GUIDED JOURNEY HEADER & STEPPER */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        
        {/* Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step-by-Step Patient Intake Flow</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Guided Hospital Health Check-Up
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow the 5 structured steps to explain your symptoms, verify lab reports, and share with your chosen specialist.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
              Step {currentStep} of 5
            </span>
          </div>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="pt-6">
          <div className="grid grid-cols-5 gap-2 relative">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = currentStep === s.num;
              const isDone = completedSteps.includes(s.num) && currentStep > s.num;
              const isClickable = completedSteps.includes(s.num) || s.num <= Math.max(...completedSteps) + 1;

              return (
                <button
                  key={s.num}
                  onClick={() => isClickable && goToStep(s.num)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center text-center group transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20 shadow-glow'
                        : isDone
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>

                  <span
                    className={`mt-2 text-[11px] font-bold hidden sm:block ${
                      isCurrent ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>

                  <span className="text-[10px] text-slate-500 hidden md:block mt-0.5">
                    {s.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* STEP 1: AI HEALTH CHECK-UP (Disease Questioning) */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquareHeart className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Step 1:</strong> Tell the AI Assistant about your disease or symptoms. It will ask targeted diagnostic questions to organize your triage record.
              </span>
            </div>
            {interviewSummary && (
              <button
                onClick={() => goToStep(2)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 ml-2"
              >
                <span>Proceed to Step 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AIHealthCheckup onSummaryReady={handleSummaryReady} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PAST LAB REPORTS & MEDICAL RECORDS (Camera Scan / Upload / Validation) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          
          {/* Step Guide Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Step 2: Upload Lab Report or Scan Document</h3>
                <p className="text-xs text-slate-400">
                  Select from device or scan with camera. MediKiosk automatically validates genuine hospital & lab reports and structures diagnostic findings.
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Alert Box: When a non-medical file is uploaded */}
          {rejectionNotice && (
            <div className="p-6 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-slate-100 flex flex-col sm:flex-row items-start gap-4 shadow-2xl animate-shake">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/30 text-rose-200">
                    Validation: Rejected
                  </span>
                  <strong className="text-sm font-bold text-rose-200">Please upload a medical report</strong>
                </div>
                <p className="text-xs text-rose-300/90 leading-relaxed pt-1">
                  {rejectionNotice.details}
                </p>
                <div className="pt-3 flex items-center gap-3">
                  <button
                    onClick={() => setRejectionNotice(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-white transition-colors"
                  >
                    Dismiss Notice
                  </button>
                  <button
                    onClick={() => setIsCameraModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-glow flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan with Camera</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Choice: Select from Device OR Scan with Camera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Method 1: Select from Device */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Select from Device</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload PDF reports, phone photos of blood tests, lab slips, or digital hospital prescriptions.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => e.target.files?.length && handleProcessDocument(e.target.files, 'device')}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Uploading & Converting Images to Text...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Select Hospital Reports (Multiple Images Allowed)</span>
                  </>
                )}
              </button>
            </div>

            {/* Method 2: Scan with Camera */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Scan with Camera</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Position your physical lab report, blood test, or handwritten prescription directly in front of the camera.
                </p>
              </div>

              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleProcessDocument(e.target.files[0], 'camera')}
              />

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setIsCameraModalOpen(true)}
                  disabled={isUploading}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Live Camera Scanner</span>
                </button>

                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
                  <span>Use Device Camera (Phone / Tablet)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Uploaded Hospital Reports Summary */}
          {uploadedReports.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Uploaded Hospital Reports ({uploadedReports.length})</span>
                </h4>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                  ✓ Converted to Clinical Text
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {uploadedReports.map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">{doc.title || doc.originalName}</span>
                        <span className="text-[10px] text-slate-400">{doc.documentType || 'Hospital Report'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 ml-2">✓ Text Ready</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Verification Card: Structured Medical Data & OCR Analysis */}
          {analyzedExtraction && (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 text-slate-100 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>PATIENT VERIFICATION: {analyzedExtraction.structuredData?.category || 'Hospital Diagnostic Report'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                        {analyzedExtraction.confidenceScore}% Verified
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Doctor: {analyzedExtraction.structuredData?.doctorName || 'Dr. A. Sharma'} | Date: {analyzedExtraction.structuredData?.documentDate || 'Recent'} | Status: OCR Processing Complete
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Structured Medical Data Ready</span>
                </span>
              </div>

              {/* Collapsible Original Extracted Text from Document (OCR Translation) */}
              {(analyzedExtraction.originalExtractedText || analyzedExtraction.rawText) && (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>Original Document Text Extracted via OCR</span>
                    </span>
                    <button
                      onClick={() => setShowRawText(!showRawText)}
                      className="text-[11px] font-bold text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      {showRawText ? 'Hide Extracted Text ▲' : 'View Extracted Text ▼'}
                    </button>
                  </div>
                  {showRawText && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                      <pre className="p-3.5 rounded-xl bg-black/80 border border-slate-800 text-[11px] font-mono text-emerald-300 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed shadow-inner">
                        {analyzedExtraction.originalExtractedText || analyzedExtraction.rawText}
                      </pre>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        ✓ Exact text recognized and translated from the document file using OCR.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Extracted Lab Tests Table */}
              {analyzedExtraction.structuredData?.labTests?.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Extracted Diagnostic Lab Parameters & Meaning
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {analyzedExtraction.structuredData.labTests.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-white block">{t.testName}</span>
                            <span className="text-[10px] text-slate-400">Ref: {t.referenceRange}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-white">
                              {t.value} {t.unit}
                            </span>
                            <span
                              className={`block text-[10px] font-bold ${
                                t.status === 'High' || t.status === 'Low'
                                  ? 'text-rose-400'
                                  : t.status === 'Borderline'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              [{t.status}]
                            </span>
                          </div>
                        </div>
                        {(t.meaning || t.meaningHi || t.meaningTe) && (
                          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-teal-300/90 leading-tight">
                            <span className="font-semibold">💡 Translation: </span>
                            <span>{language === 'hi' ? (t.meaningHi || t.meaning) : language === 'te' ? (t.meaningTe || t.meaning) : t.meaning}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Medicines */}
              {analyzedExtraction.structuredData?.medicines?.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Extracted Medications
                  </h5>
                  <div className="space-y-1.5">
                    {analyzedExtraction.structuredData.medicines.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Pill className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-semibold text-white">{m.medicineName} ({m.strength})</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{m.frequency} x {m.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls: Skip vs Proceed to NEXT STEP */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => goToStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to AI Check-Up</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  markStepComplete(2);
                  goToStep(3);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Skip (No Reports Today)
              </button>

              <button
                onClick={() => {
                  markStepComplete(2);
                  goToStep(3);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all"
              >
                <span>NEXT STEP: Health Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: LONGITUDINAL HEALTH TIMELINE */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Step 3:</strong> Review your chronological health timeline. Notice how today's AI triage and newly verified lab reports are unified with your multi-year record.
              </span>
            </div>
            <button
              onClick={() => {
                markStepComplete(3);
                goToStep(4);
              }}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ml-3"
            >
              <span>Next: Structured Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <HealthTimeline />

          {/* Stepper Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => goToStep(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lab Reports</span>
            </button>

            <button
              onClick={() => {
                markStepComplete(3);
                goToStep(4);
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all"
            >
              <span>Continue to Clinical Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: STRUCTURED HEALTH SUMMARY & RECOMMENDED SPECIALTY */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Step 4:</strong> Review your synthesized clinical summary. MediKiosk has screened for red-flags and matched your symptoms to an attending medical department.
              </span>
            </div>
            <button
              onClick={() => {
                markStepComplete(4);
                goToStep(5);
              }}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ml-3"
            >
              <span>Next: Choose Doctor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <HealthSummaryView
            summary={interviewSummary}
            onChooseDoctor={() => {
              markStepComplete(4);
              goToStep(5);
            }}
          />

          {/* Stepper Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => goToStep(3)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Timeline</span>
            </button>

            <button
              onClick={() => {
                markStepComplete(4);
                goToStep(5);
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all"
            >
              <span>Select Specialist & Grant Consent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: CHOOSE DOCTOR & GRANT CONSENT */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-6">
          
          {appointmentConfirmed ? (
            /* Celebration / Queue Ticket Confirmation Screen */
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/30 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce-slow">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 block mb-1">
                  Consent Granted & Transmitted Securely
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Triage Intake Completed!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
                  Your structured clinical summary and verified medical records have been shared directly with your chosen physician.
                </p>
              </div>

              {/* OPD Queue Token Slip */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-4 max-w-md mx-auto shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Queue Token Number:</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                    {appointmentConfirmed.tokenNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Attending Doctor</span>
                    <strong className="text-white font-semibold">{appointmentConfirmed.doctor.doctorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Department</span>
                    <strong className="text-white font-semibold">{appointmentConfirmed.doctor.specialization}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">OPD Room</span>
                    <strong className="text-emerald-400 font-bold">{appointmentConfirmed.roomNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Estimated Wait</span>
                    <strong className="text-slate-200 font-semibold">{appointmentConfirmed.estimatedWait}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print OPD Token Slip</span>
                </button>

                <button
                  onClick={onFinishCheckup}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all"
                >
                  <span>Return to Patient Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>
                  <strong>Step 5:</strong> Select your preferred attending specialist from the hospital directory and grant consent to transmit your structured dossier.
                </span>
              </div>

              <DoctorDirectory
                summary={interviewSummary}
                onDoctorRequestSent={(doc) => {
                  handleDoctorAppointmentConfirmed({
                    doctorName: doc?.doctorName || 'Selected Attending Doctor',
                    specialization: doc?.specialization || interviewSummary?.suggestedSpecialty || 'Specialist',
                    roomNumber: 'OPD Room 204',
                  });
                }}
              />

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  onClick={() => goToStep(4)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Summary</span>
                </button>
              </div>
            </>
          )}

        </div>
      )}

      {/* CAMERA SCANNER MODAL (Reused across steps) */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScanCaptured={handleCameraScanCaptured}
      />

    </div>
  );
};
