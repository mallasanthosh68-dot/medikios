import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Scan,
  Sparkles,
  Clock,
  Eye,
  Trash2,
  Copy,
  Download,
  X,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../services/api';
import { CameraScannerModal } from './CameraScannerModal';
import { OCRReviewModal } from './OCRReviewModal';

const DOC_TYPES = [
  'Lab Report',
  'Blood Test',
  'Prescription',
  'Medicine Report',
  'Discharge Summary',
  'Medical Certificate',
  'Handwritten Prescription',
  'Other',
];

export const MedicalRecords = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Lab Report');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeExtraction, setActiveExtraction] = useState(null);
  const [isOcrReviewOpen, setIsOcrReviewOpen] = useState(false);
  const [processingDocId, setProcessingDocId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [viewingTextDoc, setViewingTextDoc] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef(null);

  const uniqueDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    const seen = new Set();
    return documents.filter((doc) => {
      if (!doc) return false;
      const key = (
        doc._id ? String(doc._id) : `${doc.originalName || doc.fileName || doc.title}-${doc.fileSize || ''}`
      ).toLowerCase().trim();
      const secondaryKey = `${(doc.originalName || doc.title || '').toLowerCase().trim()}-${doc.fileSize || ''}`;
      if (seen.has(key) || (secondaryKey !== '-' && seen.has(secondaryKey))) return false;
      seen.add(key);
      if (secondaryKey !== '-') seen.add(secondaryKey);
      return true;
    });
  }, [documents]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      if (res.success) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUpload = async (filesList, uploadMethod = 'device') => {
    if (uploadProgress) return;
    if (!filesList || filesList.length === 0) return;
    const filesArray = Array.from(filesList);
    setUploadProgress(true);
    setStatusMessage({
      type: 'info',
      text: `Uploading and converting ${filesArray.length} hospital report image(s) into text...`,
    });

    const formData = new FormData();
    filesArray.forEach((f) => {
      formData.append('documents', f);
    });
    formData.append('documentType', selectedDocType);
    formData.append('uploadMethod', uploadMethod);

    try {
      const res = await api.uploadFile('/documents/upload', formData);
      if (res.success) {
        const count = res.documents?.length || filesArray.length;
        setStatusMessage({
          type: 'success',
          text: `✓ ${count} Hospital Report(s) Verified & Converted into Text! Attached to your medical records.`,
        });
        if (res.rejectedFiles && res.rejectedFiles.length > 0) {
          setTimeout(() => {
            alert(
              `Notice: ${res.rejectedFiles.length} file(s) were rejected because only authentic hospital reports are accepted.\n\nRejected Files:\n${res.rejectedFiles.map((r) => `• ${r.fileName}: ${r.reason}`).join('\n')}`
            );
          }, 300);
        }
        if (res.extraction) {
          setActiveExtraction(res.extraction);
        }
        fetchDocuments();
      }
    } catch (err) {
      setStatusMessage({
        type: 'rejection',
        title: err.message || 'File Rejected: Only hospital reports are allowed',
        text:
          err.details ||
          'MediKiosk strictly validates uploaded documents. Only authentic hospital and laboratory reports (blood tests, pathology/biochemistry lab reports, doctor prescriptions, discharge summaries) are accepted. Non-medical files (receipts, bills, selfies) are rejected.',
      });
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunOcr = async (docId) => {
    setProcessingDocId(docId);
    setStatusMessage({ type: 'info', text: 'Running clinical OCR extraction & entity parsing...' });

    try {
      const res = await api.post(`/documents/${docId}/ocr`);
      if (res.success) {
        setActiveExtraction(res.extraction);
        setIsOcrReviewOpen(true);
        setStatusMessage(null);
        fetchDocuments();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'OCR processing failed: ' + err.message });
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleDeleteDocument = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this medical report'}"?`)) return;
    try {
      const res = await api.delete(`/documents/${docId}`);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Medical document deleted successfully.' });
        if (viewingTextDoc && viewingTextDoc._id === docId) {
          setViewingTextDoc(null);
        }
        fetchDocuments();
      }
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Server error'));
    }
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadText = (doc) => {
    const text = doc.extractedText || doc.extraction?.rawText || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(doc.title || 'hospital_report').replace(/[^a-zA-Z0-9_-]/g, '_')}_text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Upload Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Method 1: Upload From Device (Supports Multi-File) */}
        <div className="bg-white p-6 rounded-3xl border border-[#D9E4E5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] mb-4">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Upload Hospital Reports</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Select multiple hospital report images, PDF lab reports, blood tests (CBC, glucose), or doctor prescriptions. All images are converted into clinical text.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">Document Classification</label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
              >
                {DOC_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && handleFilesUpload(e.target.files, 'device')}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress}
              className="w-full py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploadProgress ? 'Processing & Converting...' : 'Select Hospital Reports (Multiple Images Allowed)'}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              🔒 Only authentic hospital & lab reports accepted. Non-medical files (receipts/bills) are rejected.
            </p>
          </div>
        </div>

        {/* Method 2: Scan With Camera */}
        <div className="bg-white p-6 rounded-3xl border border-[#D9E4E5] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Scan With Hospital Camera</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Live hospital camera scanner with automatic alignment for physical paper lab slips, blood tests, and doctor prescriptions.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-[11px] text-[#64748B] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0EA5A8] shrink-0" />
              <span>Includes OCR conversion into structured text & test parameters</span>
            </div>

            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-2.5 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4 text-[#0EA5A8]" />
              <span>Open Camera Scanner</span>
            </button>
          </div>
        </div>

      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-start gap-3 border transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'rejection'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : statusMessage.type === 'error'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-teal-50 border-teal-200 text-teal-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMessage.type === 'rejection' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 animate-spin" />
          )}

          <div className="flex-1">
            {statusMessage.title && <h4 className="font-bold mb-0.5">{statusMessage.title}</h4>}
            <p>{statusMessage.text}</p>
          </div>

          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Uploaded Documents List */}
      <div className="bg-white p-6 rounded-3xl border border-[#D9E4E5] shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5] mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033]">Your Uploaded Hospital Reports & Converted Text</h3>
            <p className="text-[11px] text-[#64748B]">All hospital reports are verified, converted into clinical text, and stored securely.</p>
          </div>
          <span className="text-xs text-[#64748B] font-mono">{uniqueDocuments.length} records</span>
        </div>

        {uniqueDocuments.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-[#D9E4E5] rounded-2xl bg-[#F8FAFC]">
            <FileText className="w-10 h-10 text-[#64748B]/60 mx-auto mb-2" />
            <p className="text-xs text-[#172033] font-medium">No hospital reports uploaded yet.</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Use the upload card above to select multiple report images or camera scans.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uniqueDocuments.map((doc) => {
              const hasConvertedText = Boolean(doc.extractedText || doc.extraction?.rawText);
              const textContent = doc.extractedText || doc.extraction?.rawText || '';

              return (
                <div
                  key={doc._id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] hover:border-[#0EA5A8]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#D9E4E5] flex items-center justify-center shrink-0 text-[#0EA5A8]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-[#172033]">{doc.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/20 font-medium">
                          {doc.documentType}
                        </span>
                        {hasConvertedText && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Converted to Text</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#64748B] mt-1 flex-wrap">
                        <span>Method: {doc.uploadMethod === 'camera' ? '📷 Camera Scan' : '💻 Device Upload'}</span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {/* View Converted Text Button */}
                    <button
                      onClick={() => setViewingTextDoc(doc)}
                      className="px-3 py-1.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                      title="View full converted text and diagnostic test values"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>View Converted Text</span>
                    </button>

                    {/* Re-Run OCR Button */}
                    <button
                      onClick={() => handleRunOcr(doc._id)}
                      disabled={processingDocId === doc._id}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-[#D9E4E5] text-[#172033] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Scan className="w-3.5 h-3.5 text-[#0EA5A8]" />
                      <span>{processingDocId === doc._id ? 'Extracting...' : 'Re-Run OCR'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteDocument(doc._id, doc.title)}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-[#D9E4E5] hover:border-rose-300 text-[#64748B] hover:text-rose-600 transition-colors"
                      title="Delete medical document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONVERTED CLINICAL TEXT VIEWER MODAL */}
      {viewingTextDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-[#D9E4E5] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#D9E4E5] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#172033]">{viewingTextDoc.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold">
                      Converted into Text
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Category: {viewingTextDoc.documentType} • Converted via Optical Character Recognition
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(viewingTextDoc.extractedText || viewingTextDoc.extraction?.rawText || '')}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#D9E4E5] hover:border-[#0EA5A8] text-xs font-semibold text-[#172033] flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#0EA5A8]" />
                  <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={() => handleDownloadText(viewingTextDoc)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#D9E4E5] hover:border-[#0EA5A8] text-xs font-semibold text-[#172033] flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#0EA5A8]" />
                  <span>Download .txt</span>
                </button>

                <button
                  onClick={() => setViewingTextDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Structured Lab Parameters + Full Converted Text */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Structured Lab Tests if available */}
              {viewingTextDoc.structuredData?.labTests?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0EA5A8]" />
                    <span>Extracted Lab Test Parameters</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingTextDoc.structuredData.labTests.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[#172033] block">{t.testName}</span>
                          <span className="text-[10px] text-[#64748B]">Ref: {t.referenceRange}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#172033]">{t.value} {t.unit}</span>
                          <span className={`block text-[10px] font-bold ${
                            t.status === 'High' || t.status === 'Low' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            [{t.status}]
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Converted Text Archive */}
              <div>
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0EA5A8]" />
                  <span>Full Converted Clinical Text</span>
                </h4>
                <div className="relative">
                  <pre className="p-4 rounded-2xl bg-[#0B132B] text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto select-text border border-slate-800 shadow-inner">
                    {viewingTextDoc.extractedText || viewingTextDoc.extraction?.rawText || 'Text converted and attached to record.'}
                  </pre>
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">
                  ✓ Converted from the uploaded hospital report image into text. Can be copied or shared with consulting physicians.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#D9E4E5] bg-[#F8FAFC] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                MediKiosk Certified Clinical Document • Stored Permanently
              </span>
              <button
                onClick={() => setViewingTextDoc(null)}
                className="px-5 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanCaptured={(file) => handleFilesUpload([file], 'camera')}
      />

      {/* OCR Review Modal */}
      <OCRReviewModal
        isOpen={isOcrReviewOpen}
        onClose={() => setIsOcrReviewOpen(false)}
        extraction={activeExtraction}
        onReviewConfirmed={() => {
          setStatusMessage({ type: 'success', text: 'Extraction confirmed & verified! Added to Health Summary.' });
          fetchDocuments();
        }}
      />

    </div>
  );
};
