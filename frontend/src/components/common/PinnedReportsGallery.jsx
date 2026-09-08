import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Pin,
  CheckCircle2,
  AlertCircle,
  Eye,
  ZoomIn,
  UploadCloud,
  Camera,
  X,
  Sparkles,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react';
import { CameraScannerModal } from '../patient/CameraScannerModal';

export const PinnedReportsGallery = ({
  reports = [],
  onAttachReport,
  onRemoveReport,
  readOnly = false,
  title = 'Pinned Medical Reports & Diagnostic Images',
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [expandedTextIds, setExpandedTextIds] = useState({});
  const fileInputRef = useRef(null);

  const toggleExpand = (id) => {
    setExpandedTextIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const uniqueReports = React.useMemo(() => {
    if (!Array.isArray(reports)) return [];
    const seenDocIds = new Set();
    const seenFileUrls = new Set();
    const seenTitles = new Set();

    return reports.filter((r) => {
      if (!r) return false;
      const docId = r.documentId ? String(r.documentId).trim() : null;
      const id = r._id ? String(r._id).trim() : null;
      const fileUrl = r.fileUrl ? String(r.fileUrl).toLowerCase().trim() : null;
      const title = (r.title || r.originalName || '').toLowerCase().trim();

      // Check if already seen by any definitive identity
      if (docId && seenDocIds.has(docId)) return false;
      if (id && seenDocIds.has(id)) return false;
      if (fileUrl && seenFileUrls.has(fileUrl)) return false;
      if (title && title !== 'diagnostic report' && title !== 'lab report' && seenTitles.has(title)) return false;

      // Register seen
      if (docId) seenDocIds.add(docId);
      if (id) seenDocIds.add(id);
      if (fileUrl) seenFileUrls.add(fileUrl);
      if (title) seenTitles.add(title);
      return true;
    });
  }, [reports]);

  const handleFileChange = async (e) => {
    if (uploading) return;
    const files = e.target.files?.length ? Array.from(e.target.files) : null;
    if (!files || files.length === 0) return;
    if (onAttachReport) {
      setUploading(true);
      try {
        await onAttachReport(files, 'device');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraCapture = async (file, previewUrl) => {
    setIsCameraOpen(false);
    if (onAttachReport && file) {
      setUploading(true);
      try {
        await onAttachReport(file, 'camera');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemove = async (report, idx) => {
    if (!onRemoveReport) return;
    const ok = window.confirm(`Are you sure you want to remove "${report.title || 'this report'}" from your health summary?`);
    if (!ok) return;
    const id = report.documentId || report._id || idx;
    setRemovingId(id);
    try {
      await onRemoveReport(report, idx);
      if (selectedImage && (selectedImage.id === id || selectedImage.title === report.title)) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Failed to remove report:', err);
      alert('Failed to remove report: ' + (err.message || 'Server error'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleDownloadText = (report) => {
    const text = report.extractedText || report.textDocument || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(report.title || 'medical_report').replace(/[^a-zA-Z0-9_-]/g, '_')}_document.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendHost = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Pin className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              {uniqueReports.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {uniqueReports.length} Attached
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Lab reports converted into clean text documents, or pinned directly as photos for doctor review.
            </p>
          </div>
        </div>

        {/* Upload actions if not read-only */}
        {!readOnly && onAttachReport && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
              <span>{uploading ? 'Processing OCR...' : 'Upload Report'}</span>
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setIsCameraOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Uploading Status Banner */}
      {uploading && (
        <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center gap-3 text-xs text-teal-300 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
          <span>Scanning report with OCR: Converting into text document and updating health summary...</span>
        </div>
      )}

      {/* Reports Grid */}
      {uniqueReports.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
          <ImageIcon className="w-9 h-9 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No lab reports or diagnostic scans attached yet.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Upload blood tests, imaging reports, or doctor prescriptions. Readable reports are converted directly into structured text documents; unreadable scans or handwritten notes are attached directly as photos for the doctor.
          </p>
          {!readOnly && onAttachReport && (
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
                <span>Choose Document</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan with Camera</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueReports.map((report, idx) => {
            const isDirectImage = report.isDirectPinnedImage || !report.hasExtractedText;
            const fullImageUrl = getFullUrl(report.fileUrl);
            const reportKey = report.documentId || report._id || idx;
            const isExpanded = !!expandedTextIds[reportKey];
            const isRemoving = removingId === reportKey;

            return (
              <div
                key={reportKey}
                className="rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-md relative"
              >
                {/* Image Preview / Thumbnail Box */}
                <div className="relative bg-slate-900 h-44 flex items-center justify-center overflow-hidden group border-b border-slate-800/60">
                  {fullImageUrl ? (
                    <img
                      src={fullImageUrl}
                      alt={report.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.querySelector('.fallback-placeholder')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}

                  <div className={`fallback-placeholder ${fullImageUrl ? 'hidden' : ''} flex flex-col items-center justify-center text-slate-500 p-4 text-center`}>
                    <FileText className="w-10 h-10 mb-1 text-slate-600" />
                    <span className="text-[11px] font-mono">Document Record</span>
                  </div>

                  {/* Badges Over Image */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                    {isDirectImage ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
                        <Camera className="w-3 h-3" />
                        <span>Photo Attached Directly</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Text Document Attached</span>
                      </span>
                    )}

                    {report.confidenceScore > 0 && !isDirectImage && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 backdrop-blur-sm text-emerald-300 border border-emerald-500/30">
                        {report.confidenceScore}% OCR
                      </span>
                    )}
                  </div>

                  {/* Top Right: Delete/Remove Button */}
                  {!readOnly && onRemoveReport && (
                    <button
                      type="button"
                      disabled={isRemoving}
                      onClick={() => handleRemove(report, idx)}
                      className="absolute top-2.5 right-2.5 z-20 p-2 rounded-xl bg-slate-900/85 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700/80 hover:border-rose-500 transition-all shadow-md backdrop-blur-sm cursor-pointer"
                      title="Remove this uploaded report"
                    >
                      {isRemoving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Click to Enlarge Button */}
                  {fullImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: fullImageUrl, title: report.title, report, id: reportKey })}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px] cursor-pointer"
                    >
                      <ZoomIn className="w-5 h-5 text-teal-300" />
                      <span>Click to Enlarge</span>
                    </button>
                  )}
                </div>

                {/* Content Box */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-white line-clamp-1">{report.title}</h5>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Report'}
                      </span>
                    </div>

                    {/* Status Explanation */}
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {report.pinReason ||
                        (isDirectImage
                          ? 'Text could not be extracted automatically from this scan. The report photo is attached directly to your clinical summary for doctor inspection.'
                          : 'Report successfully converted into a structured text document and attached to your clinical summary.')}
                    </p>
                  </div>

                  {/* Extracted Text Box if converted */}
                  {report.hasExtractedText && report.extractedText && (
                    <div className="mt-2 pt-2 border-t border-slate-900">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Converted Text Document</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadText(report)}
                            className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                            title="Download document as .txt file"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download .txt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpand(reportKey)}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap ${
                          isExpanded ? 'max-h-56 overflow-y-auto' : 'line-clamp-4'
                        }`}
                      >
                        {report.extractedText}
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 flex-wrap">
                    {fullImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedImage({ url: fullImageUrl, title: report.title, report, id: reportKey })}
                        className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Original Photo</span>
                      </button>
                    ) : <span />}

                    {!readOnly && onRemoveReport && (
                      <button
                        type="button"
                        disabled={isRemoving}
                        onClick={() => handleRemove(report, idx)}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isRemoving ? 'Removing...' : 'Remove Report'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">{selectedImage.title || 'Pinned Diagnostic Report'}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/60 rounded-2xl p-2 min-h-[300px]">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 flex-wrap gap-2">
              <span>Full resolution scan provided for clinical inspection</span>
              <div className="flex items-center gap-3">
                {!readOnly && onRemoveReport && selectedImage.report && (
                  <button
                    type="button"
                    onClick={() => handleRemove(selectedImage.report, 0)}
                    className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Summary</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.open(selectedImage.url, '_blank')}
                  className="text-teal-400 hover:underline font-semibold cursor-pointer"
                >
                  Open in new tab ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE CAMERA SCANNER MODAL */}
      {isCameraOpen && (
        <CameraScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanCaptured={handleCameraCapture}
        />
      )}
    </div>
  );
};

export default PinnedReportsGallery;
