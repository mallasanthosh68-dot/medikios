import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { api } from '../../services/api';

export const ConsentModal = ({ isOpen, onClose, onConsentGranted }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleProceed = async () => {
    if (!agreed) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/patients/consent', {
        consentType: 'ai_interview',
        purpose: 'AI Health check-up symptom collection and structured triage summary generation.',
        scope: 'Automated interview and health summary compilation.',
      });
      onConsentGranted();
      onClose();
    } catch (err) {
      setError('Could not record consent. Proceeding with session.');
      onConsentGranted();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033]">
        
        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center mb-5 text-[#0EA5A8]">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-bold text-[#172033]">Patient Consent & Privacy Notice</h2>
        <span className="text-xs font-semibold text-[#0EA5A8] uppercase tracking-wider block mt-1">
          Mandatory Pre-Interview Step
        </span>

        {/* Explanatory Context */}
        <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#172033] space-y-2.5 leading-relaxed">
          <p>
            <strong className="text-[#172033]">MediKiosk will collect the information</strong> provided by the patient and organize it into a structured health summary.
          </p>
          <p className="text-[#64748B]">
            The patient can choose to share the summary with a licensed doctor of their choice for clinical verification.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-[#D9E4E5] text-[11px] text-[#64748B]">
            <Lock className="w-3.5 h-3.5 text-[#0EA5A8] shrink-0" />
            <span>Encrypted transmission. No data shared without explicit patient choice.</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Checkbox Gate: Continue disabled until checked */}
        <div className="mt-6 flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] cursor-pointer hover:border-[#0EA5A8]/40 transition-colors"
             onClick={() => setAgreed(!agreed)}>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            agreed ? 'bg-[#0EA5A8] border-[#0EA5A8] text-white' : 'border-[#D9E4E5] bg-white'
          }`}>
            {agreed && <Check className="w-3.5 h-3.5" />}
          </div>
          <label className="text-xs text-[#172033] font-medium cursor-pointer select-none">
            I understand and consent to continue.
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleProceed}
            disabled={!agreed || loading}
            className="px-6 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <span>{loading ? 'Recording Consent...' : 'Continue to Health Interview'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
