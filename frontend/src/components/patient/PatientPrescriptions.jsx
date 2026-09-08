import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  Printer,
  Download,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  X,
  Stethoscope,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

export const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/prescriptions');
      if (res.success) {
        setPrescriptions(res.prescriptions);
      }
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPrescription = (rx) => {
    setSelectedPrescription(rx);
    setIsViewModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] border border-[#0EA5A8]/20 flex items-center justify-center text-[#0EA5A8]">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#172033] tracking-tight">My Digital Prescriptions</h2>
            <p className="text-xs text-[#64748B]">Official verified prescriptions issued by your attending physicians</p>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#64748B]">Loading your prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-[#D9E4E5] shadow-sm">
          <Pill className="w-12 h-12 text-[#64748B]/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172033]">No Prescriptions Issued Yet</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Once a doctor reviews your health summary and writes a prescription, it will appear here alongside your visual daily dosage schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm space-y-6">
              
              {/* Rx Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D9E4E5] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#172033]">{rx.doctorName}</span>
                    <span className="text-xs font-semibold text-[#0EA5A8]">({rx.doctorSpecialty})</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Registration No: <strong className="text-[#172033] font-mono">{rx.doctorLicense}</strong> • {rx.hospitalName}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>OP: {rx.opNumber || 'Verified'}</span>
                  </span>
                  <span className="text-xs text-[#64748B] font-mono">
                    {new Date(rx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => handleOpenPrescription(rx)}
                    className="px-4 py-2 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0EA5A8]" />
                    <span>Official Document</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis / Clinical Assessment */}
              {rx.diagnosisOrImpression && (
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs">
                  <span className="text-[#64748B] font-medium block mb-0.5">Provisional Assessment / Diagnosis:</span>
                  <p className="text-[#172033] font-semibold">{rx.diagnosisOrImpression}</p>
                </div>
              )}

              {/* MEDICINE SCHEDULE (Visual Grid: Morning, Afternoon, Night) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0EA5A8]" />
                  <span>Patient-Friendly Medicine Schedule</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#D9E4E5] text-[#64748B] text-[11px]">
                        <th className="py-2.5 px-3 font-semibold">Medicine & Strength</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Morning</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Afternoon</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Night</th>
                        <th className="py-2.5 px-3 font-semibold">Meal Relation</th>
                        <th className="py-2.5 px-3 font-semibold">Duration</th>
                        <th className="py-2.5 px-3 font-semibold">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E4E5] text-[#172033]">
                      {rx.medicines?.map((med, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#172033]">{med.name}</div>
                            <div className="text-[11px] text-[#64748B]">{med.strength} • {med.form}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              med.timing?.morning ? 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30' : 'text-[#64748B]/40'
                            }`}>
                              {med.timing?.morning ? '✓' : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              med.timing?.afternoon ? 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30' : 'text-[#64748B]/40'
                            }`}>
                              {med.timing?.afternoon ? '✓' : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              med.timing?.night ? 'bg-[#E6F7F7] text-[#0EA5A8] border border-[#0EA5A8]/30' : 'text-[#64748B]/40'
                            }`}>
                              {med.timing?.night ? '✓' : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-[#0EA5A8]">
                            {med.timing?.mealRelation || 'After food'}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-[#172033]">
                            {med.duration}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-[#64748B] max-w-xs truncate">
                            {med.instructions || 'As directed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Instructions & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {rx.generalInstructions && (
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#172033]">
                    <span className="text-[11px] text-[#64748B] font-medium block mb-0.5">Lifestyle & Diet Instructions:</span>
                    <p>{rx.generalInstructions}</p>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D9E4E5] text-[#172033] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#64748B] font-medium block mb-0.5">Next Recommended Review:</span>
                    <strong className="text-[#172033]">Review in {rx.followUpDays || 7} days</strong>
                  </div>
                  <Calendar className="w-5 h-5 text-[#0EA5A8]" />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* DIGITAL PRESCRIPTION DOCUMENT MODAL (Printable Layout) */}
      {isViewModalOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-[#D9E4E5] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#172033] my-8">
            
            {/* Modal Actions Bar (No-Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D9E4E5] mb-6 no-print">
              <span className="text-xs font-semibold text-[#0EA5A8] uppercase tracking-wider">
                Official Digital Prescription
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Prescription</span>
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F3F8F8]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Document Content */}
            <div className="printable-area bg-[#F8FAFC] p-8 rounded-2xl border border-[#D9E4E5] space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[#D9E4E5] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0EA5A8] flex items-center justify-center text-white font-black">
                      Rx
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#172033]">MediKiosk Digital Prescription</h2>
                      <span className="text-[11px] text-[#0EA5A8] font-medium">Apex Hospital & Health Network</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-[#64748B] space-y-0.5">
                  <div className="font-bold text-[#172033] text-sm">{selectedPrescription.doctorName}</div>
                  <div>{selectedPrescription.doctorSpecialty}</div>
                  <div className="font-mono text-[#0EA5A8]">Reg No: {selectedPrescription.doctorLicense}</div>
                  <div className="text-[#64748B]">{selectedPrescription.hospitalName}</div>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-white border border-[#D9E4E5] text-xs">
                <div>
                  <span className="text-[#64748B] text-[10px] block">Patient Name</span>
                  <span className="font-bold text-[#172033]">{selectedPrescription.patientName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">Verified OP Number</span>
                  <span className="font-bold font-mono text-[#0EA5A8] px-1.5 py-0.5 rounded bg-[#E6F7F7] border border-[#0EA5A8]/20 inline-block">
                    {selectedPrescription.opNumber || 'Verified'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">Age / Gender</span>
                  <span className="font-bold text-[#172033]">{selectedPrescription.patientAge} Yrs / {selectedPrescription.patientGender}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">Phone Number</span>
                  <span className="font-mono text-[#172033]">{selectedPrescription.patientPhone}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] block">Prescription Date</span>
                  <span className="font-mono text-[#172033]">
                    {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Medicines Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#D9E4E5] text-[#64748B] text-[11px]">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Medicine Formulation</th>
                      <th className="py-2 px-2">Dosage & Frequency</th>
                      <th className="py-2 px-2">Timing (M-A-N)</th>
                      <th className="py-2 px-2">Duration</th>
                      <th className="py-2 px-2">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E4E5] text-[#172033]">
                    {selectedPrescription.medicines?.map((m, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-2 text-[#64748B] font-mono">{i + 1}</td>
                        <td className="py-2.5 px-2">
                          <strong className="text-[#172033]">{m.name}</strong>
                          <span className="text-[11px] text-[#64748B] block">{m.strength} ({m.form})</span>
                        </td>
                        <td className="py-2.5 px-2">{m.dosage} • {m.frequency}</td>
                        <td className="py-2.5 px-2 font-mono text-[#0EA5A8] font-bold">
                          {m.timing?.morning ? '1' : '0'}-{m.timing?.afternoon ? '1' : '0'}-{m.timing?.night ? '1' : '0'}
                        </td>
                        <td className="py-2.5 px-2 font-mono">{m.duration}</td>
                        <td className="py-2.5 px-2 text-[#64748B]">{m.instructions || m.timing?.mealRelation || 'After meals'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions & Notes */}
              <div className="space-y-2 text-xs border-t border-[#D9E4E5] pt-4">
                <div>
                  <span className="text-[#64748B] font-semibold block mb-0.5">Clinical Instructions:</span>
                  <p className="text-[#172033]">{selectedPrescription.generalInstructions}</p>
                </div>
                {selectedPrescription.doctorNotes && (
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Doctor Notes:</span>
                    <p className="text-[#172033]">{selectedPrescription.doctorNotes}</p>
                  </div>
                )}
              </div>

              {/* Footer Stamp & QR */}
              <div className="flex justify-between items-end border-t border-[#D9E4E5] pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-[#D9E4E5]">
                    <QrCode className="w-12 h-12 text-[#172033]" />
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    <span className="font-mono block">QR ID: RX-{selectedPrescription._id}</span>
                    <span>Digitally verified via MediKiosk Hospital Protocol</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-[#0EA5A8] font-bold mb-1">✓ Digitally Signed & Issued</div>
                  <div className="text-[#172033] font-semibold">{selectedPrescription.doctorName}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">NMC / State License: {selectedPrescription.doctorLicense}</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
