import React, { useState } from 'react';
import { X, User, Stethoscope, Phone, Lock, Calendar, Heart, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const { registerPatient, registerDoctor, loading } = useAuth();
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');

  // Patient Fields
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    phoneNumber: '',
    gender: 'Male',
    password: '',
    bloodGroup: 'B+',
    weight: '',
    height: '',
  });

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
      if (role === 'patient') {
        if (!patientData.name || !patientData.age || !patientData.phoneNumber || !patientData.password) {
          setError('Please fill in all mandatory patient details.');
          return;
        }
        const res = await registerPatient(patientData);
        if (res?.success) {
          onRegisterSuccess('patient');
          onClose();
        }
      } else {
        if (!doctorData.doctorName || !doctorData.licenseNumber || !doctorData.phoneNumber || !doctorData.password) {
          setError('Please fill in all required doctor registration fields.');
          return;
        }
        const res = await registerDoctor(doctorData);
        if (res?.success) {
          onRegisterSuccess('doctor');
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033] my-8">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0EA5A8]">Join MediKiosk</span>
          <h2 className="text-2xl font-bold mt-1 text-[#172033]">Create your account</h2>
          <p className="text-xs text-[#64748B] mt-1">Register to start your smart digital hospital check-in experience.</p>
        </div>

        {/* I am: Patient / Doctor */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#172033] mb-2">I am registering as:</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3F8F8] rounded-2xl border border-[#D9E4E5]">
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
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#DC2626]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {role === 'patient' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={patientData.name}
                  onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Age *</label>
                  <input
                    type="number"
                    value={patientData.age}
                    onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                    placeholder="35"
                    min="1"
                    max="120"
                    className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Gender *</label>
                  <select
                    value={patientData.gender}
                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                    className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] focus:outline-none focus:border-[#0EA5A8] focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={patientData.phoneNumber}
                    onChange={(e) => setPatientData({ ...patientData, phoneNumber: e.target.value })}
                    placeholder="Enter 10-digit phone number"
                    className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Password *</label>
                  <input
                    type="password"
                    value={patientData.password}
                    onChange={(e) => setPatientData({ ...patientData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="pt-2 border-t border-[#D9E4E5]">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-2">
                  Optional Vitals & Clinical Context
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Blood Group</label>
                    <select
                      value={patientData.bloodGroup}
                      onChange={(e) => setPatientData({ ...patientData, bloodGroup: e.target.value })}
                      className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={patientData.weight}
                      onChange={(e) => setPatientData({ ...patientData, weight: e.target.value })}
                      placeholder="72"
                      className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={patientData.height}
                      onChange={(e) => setPatientData({ ...patientData, height: e.target.value })}
                      placeholder="175"
                      className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
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
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={doctorData.phoneNumber}
                    onChange={(e) => setDoctorData({ ...doctorData, phoneNumber: e.target.value })}
                    placeholder="Enter 10-digit phone number"
                    className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white"
                    required
                  />
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
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              role === 'doctor' ? 'bg-[#0284C7] hover:bg-[#0369A1]' : 'bg-[#0EA5A8] hover:bg-[#0C8F92]'
            }`}
          >
            <span>{loading ? 'Creating Account...' : `Register as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-[#64748B]">
          Already have an account?{' '}
          <button
            onClick={() => { onClose(); onSwitchToLogin(); }}
            className="text-[#0EA5A8] hover:underline font-bold"
          >
            Login here
          </button>
        </div>

      </div>
    </div>
  );
};

