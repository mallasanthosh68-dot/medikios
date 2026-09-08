import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export const AadhaarDemoModal = ({ isOpen, onClose, onVerified }) => {
  const [demoId, setDemoId] = useState('XXXX-XXXX-8924');
  const [demoOtp, setDemoOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/patients/aadhaar/demo-verify', {
        demoId,
        demoOtp,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Try using demo OTP: 123456.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033]">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8] mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-[#172033]">Aadhaar Identity Simulation</h3>
        <span className="text-xs font-semibold text-[#0EA5A8] uppercase tracking-wider block mt-0.5">
          Status: Prototype / Demo Mode
        </span>

        {/* Mandatory Transparency Notice */}
        <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
          <strong className="block font-semibold">Hackathon Transparency Notice:</strong>
          This workflow demonstrates the user interaction flow for Aadhaar e-KYC / ABHA authentication using a simulated Demo Verification ID and Demo OTP (123456). No real Aadhaar data is collected or sent to unofficial services.
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-[#172033]">Status: Demo Verified</h4>
            <p className="text-xs text-emerald-800">
              Demo ABHA ID linked: <strong className="font-mono text-[#0EA5A8]">DEMO-ABHA-8924</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Demo Verification ID</label>
              <input
                type="text"
                value={demoId}
                onChange={(e) => setDemoId(e.target.value)}
                placeholder="XXXX-XXXX-8924"
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-[#64748B]">Demo OTP</label>
                <span className="text-[10px] text-[#0EA5A8] font-mono font-semibold">Use OTP: 123456</span>
              </div>
              <input
                type="text"
                value={demoOtp}
                onChange={(e) => setDemoOtp(e.target.value)}
                placeholder="123456"
                maxLength="6"
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3.5 py-2.5 text-xs font-mono text-center tracking-widest text-[#0EA5A8] font-bold focus:outline-none focus:border-[#0EA5A8]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>{loading ? 'Verifying Demo OTP...' : 'Confirm Demo Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
