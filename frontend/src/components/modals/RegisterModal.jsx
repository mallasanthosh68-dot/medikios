import React, { useState } from 'react';
import { X, Stethoscope, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateIndianPhoneNumber } from '../../utils/phoneValidation';

const SPECIALTIES = [
  'Cardiology',
  'General Medicine',
  'Neurology',
  'Dermatology',
  'Orthopedics',
  'Pulmonology',
  'Gastroenterology',
  'ENT',
  'Ophthalmology',
  'Pediatrics',
];

export const RegisterModal = ({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) => {
  const { registerDoctor, loading } = useAuth();
  const [error, setError] = useState('');

  // Doctor Fields
  const [doctorData, setDoctorData] = useState({
    doctorName: '',
    licenseNumber: '',
    specialization: 'General Medicine',
    phoneNumber: '',
    password: '',
    experienceYears: '5',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!doctorData.doctorName || !doctorData.licenseNumber || !doctorData.phoneNumber || !doctorData.password) {
        setError('Please fill in all mandatory doctor details (*).');
        return;
      }

      const phoneValidation = validateIndianPhoneNumber(doctorData.phoneNumber);
      if (!phoneValidation.isValid) {
        setError(phoneValidation.message);
        return;
      }

      const res = await registerDoctor({
        doctorName: doctorData.doctorName.trim(),
        name: doctorData.doctorName.trim(),
        licenseNumber: doctorData.licenseNumber.trim(),
        specialization: doctorData.specialization,
        phoneNumber: phoneValidation.normalizedPhone || doctorData.phoneNumber.trim(),
        password: doctorData.password,
        experienceYears: Number(doctorData.experienceYears) || 5,
      });

      if (res?.success) {
        onRegisterSuccess('doctor');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033] max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">Hospital Clinical Registry</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172033]">Register Doctor Account</h2>
          <p className="text-xs text-[#64748B] mt-1">Create your verified healthcare provider account to review clinical intake dossiers and prescribe medications.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#DC2626]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Doctor Name *</label>
            <input
              type="text"
              value={doctorData.doctorName}
              onChange={(e) => setDoctorData({ ...doctorData, doctorName: e.target.value })}
              placeholder="e.g. Dr. Your Name"
              className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">License / Reg Number *</label>
              <input
                type="text"
                value={doctorData.licenseNumber}
                onChange={(e) => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
                placeholder="e.g. MCI-12345"
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Specialization *</label>
              <select
                value={doctorData.specialization}
                onChange={(e) => setDoctorData({ ...doctorData, specialization: e.target.value })}
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] focus:outline-none focus:border-[#0284C7] focus:bg-white"
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Mobile Number *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-[#64748B] border-r border-[#CBD5E1] pr-2 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={doctorData.phoneNumber}
                  onChange={(e) => setDoctorData({ ...doctorData, phoneNumber: e.target.value.replace(/[^\d+]/g, '') })}
                  placeholder="98765 43210"
                  maxLength={14}
                  className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl pl-20 pr-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white font-mono tracking-wide"
                  required
                />
              </div>
              <span className="text-[10px] text-[#64748B] mt-1 block">
                10 digits starting with 6, 7, 8, or 9
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Password *</label>
              <input
                type="password"
                value={doctorData.password}
                onChange={(e) => setDoctorData({ ...doctorData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Prototype Verification Badge Notice */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#0284C7]">
              <span className="font-bold">Verification Status: Demo Verified.</span>
              <p className="text-[#64748B] mt-0.5">Prototype evaluation mode enabled. Live NMC / State Medical Council verification is simulated for SIH demonstration.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Registering...' : 'Register Doctor Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-[#64748B]">
          Already have a doctor account?{' '}
          <button
            onClick={() => { onClose(); onSwitchToLogin(); }}
            className="text-[#0284C7] hover:underline font-bold cursor-pointer"
          >
            Log in here
          </button>
        </div>

      </div>
    </div>
  );
};
