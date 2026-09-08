import React, { useState, useEffect } from 'react';
import {
  Search,
  Stethoscope,
  ShieldCheck,
  Building2,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
} from 'lucide-react';
import { api } from '../../services/api';

const SPECIALTIES = [
  'All',
  'Cardiology',
  'General Medicine',
  'Neurology',
  'Pulmonology',
  'Orthopedics',
  'Dermatology',
  'Gastroenterology',
  'Pediatrics',
];

export const DoctorDirectory = ({ summary, onDoctorRequestSent }) => {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [shareConsentAgreed, setShareConsentAgreed] = useState(true);

  // If summary suggested a specialty, auto-suggest filter
  useEffect(() => {
    if (summary?.suggestedSpecialty && SPECIALTIES.includes(summary.suggestedSpecialty)) {
      setSelectedSpecialty(summary.suggestedSpecialty);
    }
  }, [summary]);

  useEffect(() => {
    fetchDoctors();
  }, [search, selectedSpecialty]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (selectedSpecialty !== 'All') {
        query += `&specialization=${encodeURIComponent(selectedSpecialty)}`;
      }
      const res = await api.get(`/doctors${query}`);
      if (res.success) {
        setDoctors(res.doctors);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsShareModalOpen(true);
  };

  const handleSendRequest = async () => {
    if (!selectedDoctor || !summary) return;
    setSending(true);

    try {
      const res = await api.post('/doctor-requests', {
        doctorId: selectedDoctor.userId,
        summaryId: summary._id,
        consentId: null,
      });

      if (res.success) {
        setIsShareModalOpen(false);
        setSuccessNotice(`Health summary successfully sent to ${selectedDoctor.doctorName}! Once the doctor accepts, you will receive a notification to visit tomorrow for your checkup.`);
        if (onDoctorRequestSent) onDoctorRequestSent(selectedDoctor);
      }
    } catch (err) {
      alert('Failed to send request: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Notice */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E4E5]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs font-semibold text-[#0EA5A8] mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Patient Choice Principle</span>
            </div>
            <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Select Your Attending Doctor</h2>
            <p className="text-xs text-[#64748B] mt-1">
              MediKiosk AI recommends specialties, but <strong className="text-[#0EA5A8]">you always choose</strong> the doctor who reviews your records.
            </p>
          </div>

          {summary && (
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#172033] self-start sm:self-auto">
              <span className="text-[11px] text-[#64748B] block font-medium">AI Specialty Recommendation:</span>
              <strong className="text-[#0EA5A8] font-bold">{summary.suggestedSpecialty}</strong>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, specialty, or license number..."
              className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#172033] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5A8] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-[#F3F8F8] border border-[#D9E4E5] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8] focus:bg-white transition-colors"
            >
              {SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec === 'All' ? 'All Specialties' : spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Specialties Quick Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-4 scrollbar-none">
          <span className="text-[11px] font-semibold text-[#64748B] mr-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Department:
          </span>
          {SPECIALTIES.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                selectedSpecialty === spec
                  ? 'bg-[#0EA5A8] text-white'
                  : 'bg-[#F3F8F8] text-[#64748B] hover:text-[#172033] border border-[#D9E4E5]'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-[#64748B]">Loading verified doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-2 py-12 text-center px-4 bg-white rounded-3xl border border-[#D9E4E5]">
            <Stethoscope className="w-8 h-8 text-[#0EA5A8] mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-[#172033] mb-1">No Doctors Available in this Specialty</h4>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              No doctors have registered in this department yet. You can register a doctor account in another tab (or from the homepage) or select &quot;All&quot; to view registered doctors.
            </p>
          </div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-white p-6 rounded-3xl border border-[#D9E4E5] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7] font-bold text-base">
                      {doc.doctorName.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172033]">{doc.doctorName}</h3>
                      <span className="text-xs font-semibold text-[#0EA5A8] block">{doc.specialization}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Demo Verified</span>
                  </span>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2 mt-2">{doc.bio}</p>

                <div className="mt-4 pt-3 border-t border-[#D9E4E5] space-y-1.5 text-xs text-[#64748B]">
                  <div className="flex justify-between">
                    <span>Registration Number:</span>
                    <span className="font-mono text-[#172033] font-medium">{doc.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clinical Experience:</span>
                    <span className="text-[#172033] font-medium">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hospital Department:</span>
                    <span className="text-[#172033] truncate max-w-[200px]">{doc.hospitalAffiliation}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#D9E4E5]">
                <button
                  onClick={() => handleSelectDoctor(doc)}
                  className="w-full py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Choose {doc.doctorName.split(' ')[1] || 'Doctor'} & Share Summary</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share Confirmation Modal */}
      {isShareModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033]">
            <h3 className="text-xl font-bold text-[#172033] mb-1">Confirm Sharing with Doctor</h3>
            <p className="text-xs text-[#64748B] mb-4">
              You are about to send your structured health summary and uploaded records to:
            </p>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] mb-4 space-y-1 text-xs">
              <div className="text-sm font-bold text-[#172033]">{selectedDoctor.doctorName}</div>
              <div className="text-[#0EA5A8] font-semibold">{selectedDoctor.specialization}</div>
              <div className="text-[#64748B] font-mono text-[11px]">License: {selectedDoctor.licenseNumber}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs text-[#172033] space-y-2 mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer" onClick={() => setShareConsentAgreed(!shareConsentAgreed)}>
                <input
                  type="checkbox"
                  checked={shareConsentAgreed}
                  onChange={(e) => setShareConsentAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#0EA5A8]"
                />
                <span className="text-[#64748B] leading-relaxed">
                  I give explicit consent to transmit my health summary and symptoms to <strong>{selectedDoctor.doctorName}</strong>. Once the doctor reviews and accepts my summary, I will receive a notification to visit tomorrow for my clinical checkup.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033]"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={!shareConsentAgreed || sending}
                className="px-6 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending to Doctor...' : 'Send Summary to Doctor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
