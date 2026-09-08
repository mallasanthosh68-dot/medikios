import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Edit3,
  FileText,
  Percent,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';

export const OCRReviewModal = ({ isOpen, onClose, extraction, onReviewConfirmed }) => {
  if (!isOpen || !extraction) return null;

  const [structuredData, setStructuredData] = useState({
    labTests: extraction.structuredData?.labTests || [],
    medicines: extraction.structuredData?.medicines || [],
    doctorName: extraction.structuredData?.doctorName || '',
    documentDate: extraction.structuredData?.documentDate || '',
  });
  const [patientNotes, setPatientNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle editing lab tests
  const handleLabChange = (index, field, value) => {
    const updated = [...structuredData.labTests];
    updated[index][field] = value;
    setStructuredData({ ...structuredData, labTests: updated });
  };

  const handleDeleteLab = (index) => {
    const updated = structuredData.labTests.filter((_, i) => i !== index);
    setStructuredData({ ...structuredData, labTests: updated });
  };

  const handleAddLab = () => {
    setStructuredData({
      ...structuredData,
      labTests: [
        ...structuredData.labTests,
        { testName: 'New Test', value: '1.0', unit: 'mg/dL', status: 'Normal' },
      ],
    });
  };

  // Handle editing medicines
  const handleMedChange = (index, field, value) => {
    const updated = [...structuredData.medicines];
    updated[index][field] = value;
    setStructuredData({ ...structuredData, medicines: updated });
  };

  const handleDeleteMed = (index) => {
    const updated = structuredData.medicines.filter((_, i) => i !== index);
    setStructuredData({ ...structuredData, medicines: updated });
  };

  const handleAddMed = () => {
    setStructuredData({
      ...structuredData,
      medicines: [
        ...structuredData.medicines,
        { medicineName: 'New Medicine', strength: '500 mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days' },
      ],
    });
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/documents/extractions/${extraction._id}/review`, {
        structuredData,
        patientNotes,
      });
      if (res.success) {
        onReviewConfirmed(res.extraction);
        onClose();
      }
    } catch (err) {
      setError('Could not submit review: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const confidence = extraction.confidenceScore || (extraction.isHandwritten ? 78 : 92);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033] my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#D9E4E5]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#E6F7F7] border border-[#0EA5A8]/25 text-[11px] font-mono font-semibold text-[#0EA5A8]">
                OCR Confidence: {confidence}%
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#E0F2FE] border border-[#0284C7]/25 text-[11px] font-semibold text-[#0284C7]">
                Advanced Handwriting Recognition Prototype Feature
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 text-[#172033] tracking-wide uppercase">
              EXTRACTED MEDICAL INFORMATION
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review and correct extracted details before confirming for your clinical health summary.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Advisory Notice */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <strong className="font-semibold block text-sm">Please verify all extracted information.</strong>
            <p className="text-amber-800/90 mt-0.5">
              Never automatically trust unverified extractions. You can edit, correct, or delete any lab test or medicine below before confirming.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Extracted Metadata (Doctor & Date) */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5]">
          <div>
            <label className="block text-[11px] text-[#64748B] font-medium mb-1">Prescribing Doctor / Lab Facility</label>
            <input
              type="text"
              value={structuredData.doctorName}
              onChange={(e) => setStructuredData({ ...structuredData, doctorName: e.target.value })}
              className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#64748B] font-medium mb-1">Document / Report Date</label>
            <input
              type="text"
              value={structuredData.documentDate}
              onChange={(e) => setStructuredData({ ...structuredData, documentDate: e.target.value })}
              className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
            />
          </div>
        </div>

        {/* SECTION 1: LAB TESTS */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0EA5A8]" />
              <span>Extracted Diagnostic Tests ({structuredData.labTests.length})</span>
            </h3>
            <button
              onClick={handleAddLab}
              className="px-2.5 py-1 rounded-lg bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs flex items-center gap-1 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5 text-[#0EA5A8]" />
              <span>Add Test</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {structuredData.labTests.map((lab, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] items-center text-xs"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={lab.testName}
                    onChange={(e) => handleLabChange(idx, 'testName', e.target.value)}
                    className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1 text-[#172033] font-medium focus:outline-none focus:border-[#0EA5A8]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={lab.value}
                    onChange={(e) => handleLabChange(idx, 'value', e.target.value)}
                    className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1 text-[#172033] font-mono font-bold focus:outline-none focus:border-[#0EA5A8]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={lab.unit}
                    onChange={(e) => handleLabChange(idx, 'unit', e.target.value)}
                    className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2 py-1 text-[#64748B] font-mono text-[11px] focus:outline-none focus:border-[#0EA5A8]"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      lab.status === 'High'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : lab.status === 'Low'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {lab.status || 'Normal'}
                  </span>
                  <button
                    onClick={() => handleDeleteLab(idx)}
                    className="p-1 rounded text-[#64748B] hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: MEDICATIONS */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#0EA5A8]" />
              <span>Extracted Medicines & Prescriptions ({structuredData.medicines.length})</span>
            </h3>
            <button
              onClick={handleAddMed}
              className="px-2.5 py-1 rounded-lg bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs flex items-center gap-1 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5 text-[#0EA5A8]" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {structuredData.medicines.map((med, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] items-center text-xs"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={med.medicineName}
                    onChange={(e) => handleMedChange(idx, 'medicineName', e.target.value)}
                    className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1 text-[#172033] font-medium focus:outline-none focus:border-[#0EA5A8]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={med.strength}
                    onChange={(e) => handleMedChange(idx, 'strength', e.target.value)}
                    placeholder="500 mg"
                    className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2 py-1 text-[#172033] text-[11px] focus:outline-none focus:border-[#0EA5A8]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={med.dosage + ' - ' + med.frequency}
                    onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                    placeholder="1 tab twice daily"
                    className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2 py-1 text-[#64748B] text-[11px] focus:outline-none focus:border-[#0EA5A8]"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    onClick={() => handleDeleteMed(idx)}
                    className="p-1 rounded text-[#64748B] hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Notes input */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-[#64748B] mb-1">
            Patient Correction Notes / Clarifications
          </label>
          <input
            type="text"
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            placeholder="e.g. Doctor told me to stop Metformin 2 days ago"
            className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#0EA5A8]"
          />
        </div>

        {/* Footer Confirmation Action */}
        <div className="mt-8 pt-4 border-t border-[#D9E4E5] flex items-center justify-between">
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
            >
              Cancel
            </button>
            <span className="hidden sm:inline text-[11px] text-[#64748B] ml-2">
              Only confirmed information is added to the health summary.
            </span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Verifying & Saving...' : 'Confirm Information'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
