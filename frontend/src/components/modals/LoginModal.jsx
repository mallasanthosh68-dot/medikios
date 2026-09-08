import React, { useState, useEffect } from 'react';
import { X, Phone, Lock, User, Stethoscope, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginModal = ({ isOpen, onClose, onSwitchToRegister, onLoginSuccess, defaultRole = 'patient' }) => {
  const { login, loading } = useAuth();
  const [role, setRole] = useState(defaultRole);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole || 'patient');
      setError('');
    }
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber || !password) {
      setError('Please fill in both phone number and password.');
      return;
    }

    try {
      const res = await login({ phoneNumber, password, role });
      if (res?.success) {
        onLoginSuccess(role);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0EA5A8]">MediKiosk Auth</span>
          <h2 className="text-2xl font-bold mt-1 text-[#172033]">Log in to your account</h2>
          <p className="text-xs text-[#64748B] mt-1">Select your account type and enter your credentials.</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3F8F8] rounded-2xl border border-[#D9E4E5] mb-6">
          <button
            type="button"
            onClick={() => { setRole('patient'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === 'patient'
                ? 'bg-[#0EA5A8] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('doctor'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              role === 'doctor'
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#DC2626]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter 10-digit phone number"
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : `Log in as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 pt-5 border-t border-[#D9E4E5] text-center text-xs text-[#64748B]">
          Don't have an account yet?{' '}
          <button
            onClick={() => { onClose(); onSwitchToRegister(); }}
            className="text-[#0EA5A8] hover:underline font-bold"
          >
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
};

