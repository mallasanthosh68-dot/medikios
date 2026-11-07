import React, { useState, useEffect } from 'react';
import { X, Phone, Lock, Stethoscope, Shield, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateLoginIdentifier } from '../../utils/phoneValidation';

export const LoginModal = ({ isOpen, onClose, onSwitchToRegister, onLoginSuccess, defaultRole = 'doctor' }) => {
  const { login, loading } = useAuth();
  const [role, setRole] = useState(defaultRole === 'admin' ? 'admin' : 'doctor');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole === 'admin' ? 'admin' : 'doctor');
      setError('');
    }
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setError('Please fill in both your login identifier and password.');
      return;
    }

    // Validate phone number, email, or license/name format
    const validation = validateLoginIdentifier(trimmedIdentifier, role);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    // Strict email requirement for Administrator
    if (role === 'admin' && validation.type !== 'email') {
      setError('Administrator login strictly requires your administrative email address (admin321@gmail.com). Phone numbers cannot be used for administrator login.');
      return;
    }

    try {
      const payload = {
        identifier: validation.normalizedValue,
        phoneNumber: validation.type === 'phone' ? validation.normalizedValue : (role === 'admin' ? '' : validation.normalizedValue),
        email: validation.type === 'email' ? validation.normalizedValue : '',
        password,
        role,
      };

      const res = await login(payload);
      if (res?.success) {
        onLoginSuccess(role);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const theme = role === 'admin'
    ? {
        accent: '#7C3AED',
        bgButton: 'bg-[#7C3AED] hover:bg-[#6D28D9]',
        label: 'Administrator',
      }
    : {
        accent: '#0284C7',
        bgButton: 'bg-[#0284C7] hover:bg-[#0369A1]',
        label: 'Doctor',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0284C7]">Hospital Staff & Clinical Auth</span>
          <h2 className="text-2xl font-bold mt-1 text-[#172033]">Healthcare Provider Login</h2>
          <p className="text-xs text-[#64748B] mt-1">Sign in to your doctor workstation or administrative governance station.</p>
        </div>

        {/* 2-Way Role Selector: Doctor | Admin */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3F8F8] rounded-2xl border border-[#D9E4E5] mb-5">
          <button
            type="button"
            onClick={() => { setRole('doctor'); setError(''); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === 'doctor'
                ? 'bg-[#0284C7] text-white shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-[#7C3AED] text-white shadow-sm font-bold'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#172033]">
                {role === 'admin' ? 'Admin Email Address' : 'Mobile Number, License No, Name, or Email'}
              </label>
              {role === 'admin' ? (
                <span className="text-[10px] text-purple-700 font-semibold px-2 py-0.5 bg-purple-100 rounded-md">
                  ✉️ Email Only
                </span>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-medium text-[#64748B]">
                  <span className={`px-1.5 py-0.5 rounded transition-colors ${/^[6-9]\d{9}$/.test(identifier.replace(/\D/g, '')) ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-slate-100'}`}>
                    📱 Mobile
                  </span>
                  <span className={`px-1.5 py-0.5 rounded transition-colors ${!identifier.includes('@') && !/^[6-9]\d{9}$/.test(identifier.replace(/\D/g, '')) && identifier.trim().length >= 2 ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-slate-100'}`}>
                    🪪 License / Name
                  </span>
                  <span className={`px-1.5 py-0.5 rounded transition-colors ${identifier.includes('@') ? 'bg-sky-100 text-sky-800 font-bold' : 'bg-slate-100'}`}>
                    ✉️ Email
                  </span>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5 flex items-center justify-center">
                {role === 'admin' || identifier.includes('@') ? (
                  <Mail className="w-4 h-4 text-[#64748B]" />
                ) : (
                  <Stethoscope className="w-4 h-4 text-[#64748B]" />
                )}
              </div>
              <input
                type={role === 'admin' || identifier.includes('@') ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'admin' ? 'admin321@gmail.com' : 'e.g. 9866355788, MCK-12345, Dr. Kumar, or email'}
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
                required
                autoFocus
              />
            </div>
            <div className="mt-1.5 text-[11px] min-h-[18px]">
              {role === 'admin' ? (
                <span className="text-purple-700 font-semibold flex items-center gap-1">
                  🔒 Administrative Console requires authorized superadmin email
                </span>
              ) : identifier.includes('@') ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  ✓ Logging in with registered Email Address
                </span>
              ) : /^[6-9]\d{9}$/.test(identifier.replace(/\D/g, '')) ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  ✓ Logging in with 10-digit Indian Mobile Number
                </span>
              ) : identifier.trim().length >= 2 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  ✓ Logging in with License Number or Doctor Name
                </span>
              ) : (
                <span className="text-[#64748B]">
                  Type your Mobile Number (e.g. 9866355788), License No (e.g. MCK-12345), Doctor Name, or Email.
                </span>
              )}
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
                className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl ${theme.bgButton} text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
          >
            <span>{loading ? 'Authenticating...' : `Log in as ${theme.label}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 pt-5 border-t border-[#D9E4E5] text-center text-xs text-[#64748B]">
          {role === 'admin' ? (
            <span>Admin privileges are managed by Central IT & Hospital Governance.</span>
          ) : (
            <>
              New healthcare provider?{' '}
              <button
                onClick={() => { onClose(); onSwitchToRegister(); }}
                className="text-[#0284C7] hover:underline font-bold cursor-pointer"
              >
                Register Doctor Account
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
