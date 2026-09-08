import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Sparkles,
  ArrowRight,
  Printer,
  Search,
  Lock,
  ShieldCheck,
  Ticket,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { MedicineAutocompleteInput } from './MedicineAutocompleteInput';

export const DigitalPrescriptionBuilder = ({ initialPatient, requestId, initialMedicine, onPrescriptionCreated }) => {
  const [patientId, setPatientId] = useState(initialPatient?.id || initialPatient?._id || '');
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [opNumberInput, setOpNumberInput] = useState(initialPatient?.opNumber || '');
  const [isOpVerified, setIsOpVerified] = useState(false);
  const [verifyingOp, setVerifyingOp] = useState(false);
  const [opVerifyError, setOpVerifyError] = useState('');
  const [verifiedPatientName, setVerifiedPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('Acute Exacerbation / Provisional Assessment');
  const [instructions, setInstructions] = useState('Maintain adequate hydration and take complete rest.');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('7');
  const [saving, setSaving] = useState(false);
  const [successRx, setSuccessRx] = useState(null);
  const [quickSearchText, setQuickSearchText] = useState('');

  // Multi-medicine list
  const [medicines, setMedicines] = useState([
    {
      name: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      strength: '625 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      timing: { morning: true, afternoon: false, night: true, mealRelation: 'After food' },
      duration: '5 days',
      instructions: 'Complete full 5-day antibiotic course',
    },
    {
      name: 'Dolo 650',
      genericName: 'Paracetamol',
      strength: '650 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Every 8 hours as needed',
      timing: { morning: true, afternoon: true, night: true, mealRelation: 'After food' },
      duration: '3 days',
      instructions: 'Take only if temperature exceeds 99.5 F or severe pain',
    },
    {
      name: 'Pan 40',
      genericName: 'Pantoprazole',
      strength: '40 mg',
      form: 'Tablet',
      dosage: '1 tablet',
      frequency: 'Once daily',
      timing: { morning: true, afternoon: false, night: false, mealRelation: 'Before food' },
      duration: '7 days',
      instructions: 'Take 30 minutes before morning breakfast',
    },
  ]);

  const handleAddMedicine = (customMed = null) => {
    if (customMed && customMed.name) {
      setMedicines([
        ...medicines,
        {
          name: customMed.name,
          genericName: customMed.genericName || '',
          strength: customMed.strength || '500 mg',
          form: customMed.form || 'Tablet',
          dosage: customMed.dosage || '1 tablet',
          frequency: customMed.frequency || 'Twice daily',
          timing: customMed.timing || { morning: true, afternoon: false, night: true, mealRelation: 'After food' },
          duration: customMed.duration || '5 days',
          instructions: customMed.instructions || '',
        },
      ]);
      return;
    }

    setMedicines([
      ...medicines,
      {
        name: '',
        genericName: '',
        strength: '500 mg',
        form: 'Tablet',
        dosage: '1 unit',
        frequency: 'Twice daily',
        timing: { morning: true, afternoon: false, night: true, mealRelation: 'After food' },
        duration: '5 days',
        instructions: '',
      },
    ]);
  };

  React.useEffect(() => {
    if (initialMedicine && (initialMedicine.name || initialMedicine.medicineName)) {
      handleAddMedicine({
        ...initialMedicine,
        name: initialMedicine.medicineName || initialMedicine.name,
      });
    }
  }, [initialMedicine]);

  const handleSelectSuggestedMedicine = (index, selectedMed) => {
    const updated = [...medicines];
    updated[index] = {
      ...updated[index],
      name: selectedMed.name,
      genericName: selectedMed.genericName || '',
      strength: selectedMed.strength || updated[index].strength,
      form: selectedMed.form || updated[index].form,
      dosage: selectedMed.dosage || updated[index].dosage,
      frequency: selectedMed.frequency || updated[index].frequency,
      instructions: selectedMed.instructions || updated[index].instructions || '',
      duration: selectedMed.duration || updated[index].duration,
      timing: selectedMed.timing || updated[index].timing,
    };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedFieldChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleTimingToggle = (index, slot) => {
    const updated = [...medicines];
    updated[index].timing = {
      ...updated[index].timing,
      [slot]: !updated[index].timing[slot],
    };
    setMedicines(updated);
  };

  const handleVerifyOpNumber = async () => {
    const cleanOp = (opNumberInput || '').trim().toUpperCase();
    if (!cleanOp) {
      setOpVerifyError('Please enter the patient OP Number (e.g. OP-405818).');
      return;
    }
    if (!patientId) {
      setOpVerifyError('Patient ID is missing. Please select a patient request first.');
      return;
    }

    setVerifyingOp(true);
    setOpVerifyError('');
    try {
      const res = await api.post('/doctor/verify-op-number', {
        patientId,
        opNumber: cleanOp,
      });
      if (res.success && res.verified) {
        setIsOpVerified(true);
        setVerifiedPatientName(res.patientName || patientName);
        setOpVerifyError('');
      } else {
        setIsOpVerified(false);
        setOpVerifyError(res.message || 'Invalid OP Number. Please verify with the patient.');
      }
    } catch (err) {
      setIsOpVerified(false);
      setOpVerifyError(err.message || 'OP Number verification failed. Please ask the patient for their correct OP Number.');
    } finally {
      setVerifyingOp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOpVerified || !opNumberInput.trim()) {
      alert('Security Verification Required: You must enter and verify the patient\'s OP Number before sending prescribed medicines.');
      return;
    }

    if (medicines.length === 0) {
      alert('Please add at least one medicine.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/prescriptions', {
        patientId,
        opNumber: opNumberInput.trim().toUpperCase(),
        requestId,
        diagnosisOrImpression: diagnosis,
        medicines,
        instructions,
        doctorNotes,
        followUpDays: parseInt(followUpDays, 10) || 7,
      });

      if (res.success) {
        setSuccessRx(res.prescription);
        if (onPrescriptionCreated) onPrescriptionCreated(res.prescription);
      }
    } catch (err) {
      alert('Failed to generate prescription: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9E4E5] gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs font-semibold text-[#0EA5A8] mb-2">
            <Pill className="w-3.5 h-3.5" />
            <span>Digital Prescription Generation</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Create Digital Prescription</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Build a multi-medicine digital prescription with morning/noon/night schedule and print formatting.
          </p>
        </div>
      </div>

      {successRx ? (
        <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#172033]">Digital Prescription Sent Directly to Patient!</h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
            The prescription with {successRx.medicines?.length || 'prescribed'} medicine{successRx.medicines?.length > 1 ? 's' : ''} has been dispatched directly to <strong>{successRx.patientName}</strong>'s portal. The patient has been notified and can view their daily morning/noon/night dosage schedule immediately.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setSuccessRx(null)}
              className="px-5 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-semibold shadow-xs"
            >
              Write Another Prescription
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* MANDATORY OP NUMBER VERIFICATION CARD */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isOpVerified
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-amber-50/90 border-amber-300 shadow-xs'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isOpVerified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {isOpVerified ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                      {isOpVerified ? 'Patient OP Number Verified' : 'Mandatory Patient OP Number Verification'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOpVerified ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {isOpVerified ? 'Identity Confirmed' : 'Prescribing Locked'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                    {isOpVerified
                      ? `Identity verified for ${verifiedPatientName || patientName}. Digital prescription and medicines report sending is now UNLOCKED.`
                      : 'Ask the patient for their OP Number (shown on their Patient Portal / Kiosk Token). You must enter and verify it before you can prescribe medicines.'}
                  </p>
                </div>
              </div>

              {isOpVerified ? (
                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-mono font-bold text-sm shadow-2xs">
                    {opNumberInput.trim().toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpVerified(false)}
                    className="text-xs text-[#64748B] hover:text-[#172033] underline font-medium"
                  >
                    Change OP
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Ticket className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={opNumberInput}
                      onChange={(e) => {
                        setOpNumberInput(e.target.value.toUpperCase());
                        setOpVerifyError('');
                      }}
                      placeholder="e.g. OP-405818"
                      className="pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D9E4E5] text-xs font-mono font-bold text-[#172033] focus:outline-none focus:border-[#0EA5A8] uppercase w-full sm:w-44 shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOpNumber}
                    disabled={verifyingOp || !opNumberInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {verifyingOp ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify OP</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {opVerifyError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{opVerifyError}</span>
              </div>
            )}
          </div>
          
          {/* Patient Details & Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] text-xs">
            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient Full Name"
                className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-[#172033] font-semibold focus:outline-none focus:border-[#0EA5A8]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">Diagnosis / Clinical Impression</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bronchitis with Mild Pyrexia"
                className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                required
              />
            </div>
          </div>

          {/* Medicines Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#0EA5A8]" />
                <span>Prescribed Medications ({medicines.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => handleAddMedicine()}
                className="px-3 py-1.5 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#0EA5A8]" />
                <span>Add Blank Medicine</span>
              </button>
            </div>

            {/* Quick Formulary Search & Add (10,000+ Formulations) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 mb-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0C8F92]">
                  <Sparkles className="w-4 h-4 text-[#0EA5A8]" />
                  <span>Quick Formulary Search & Add</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold border border-teal-200">
                    10,000+ Formulations Available
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B]">Type medicine name to suggest before completion</span>
              </div>
              <MedicineAutocompleteInput
                value={quickSearchText}
                onChange={setQuickSearchText}
                onSelect={(selectedMed) => {
                  handleAddMedicine(selectedMed);
                  setQuickSearchText('');
                }}
                placeholder="🔍 Type medicine name to suggest (e.g. Dolo 650, Augmentin, Pan 40, Azithral, Telma)..."
              />
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] text-[#64748B] font-medium">Medicine Name</label>
                        <span className="text-[9px] text-[#0EA5A8] font-bold">10,000+ Formulations</span>
                      </div>
                      <MedicineAutocompleteInput
                        value={med.name}
                        onChange={(val) => handleMedFieldChange(idx, 'name', val)}
                        onSelect={(selectedMed) => handleSelectSuggestedMedicine(idx, selectedMed)}
                        placeholder="Type medicine name..."
                        required
                      />
                      {med.genericName && (
                        <div className="text-[10px] text-teal-800 font-medium truncate mt-1 flex items-center gap-1">
                          <span className="text-slate-400">Generic:</span> {med.genericName}
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-[#64748B] mb-0.5 font-medium">Strength / Form</label>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => handleMedFieldChange(idx, 'strength', e.target.value)}
                        placeholder="500 mg"
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-[#64748B] mb-0.5 font-medium">Dosage / Frequency</label>
                      <input
                        type="text"
                        value={med.dosage + ' • ' + med.frequency}
                        onChange={(e) => handleMedFieldChange(idx, 'dosage', e.target.value)}
                        placeholder="1 tab twice daily"
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end items-end pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1 text-[#64748B] hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Timing Checkboxes: Morning, Afternoon, Night */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-[#D9E4E5] items-center">
                    <div className="sm:col-span-5 flex items-center gap-4">
                      <span className="text-[11px] text-[#64748B] font-medium">Timing:</span>
                      {['morning', 'afternoon', 'night'].map((slot) => (
                        <label key={slot} className="flex items-center gap-1.5 cursor-pointer capitalize">
                          <input
                            type="checkbox"
                            checked={Boolean(med.timing?.[slot])}
                            onChange={() => handleTimingToggle(idx, slot)}
                            className="accent-[#0EA5A8]"
                          />
                          <span className="text-[11px] text-[#172033] font-medium">{slot}</span>
                        </label>
                      ))}
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={med.timing?.mealRelation || 'After food'}
                        onChange={(e) =>
                          handleMedFieldChange(idx, 'timing', {
                            ...med.timing,
                            mealRelation: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2 py-1 text-[11px] text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                      >
                        <option value="After food">After food</option>
                        <option value="Before food">Before food</option>
                        <option value="With food">With food</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedFieldChange(idx, 'duration', e.target.value)}
                        placeholder="5 days"
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2 py-1 text-[11px] text-[#172033] font-mono focus:outline-none focus:border-[#0EA5A8]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleMedFieldChange(idx, 'instructions', e.target.value)}
                        placeholder="Instructions"
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2 py-1 text-[11px] text-[#64748B] focus:outline-none focus:border-[#0EA5A8]"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">General Lifestyle & Clinical Instructions</label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Diet, fluids, follow-up advice..."
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">Doctor Confidential / Clinic Notes</label>
              <textarea
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Internal clinical observations..."
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#D9E4E5]">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span>Review in:</span>
              <input
                type="number"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                className="w-16 bg-[#F8FAFC] border border-[#D9E4E5] rounded-lg px-2 py-1 text-[#172033] text-center font-mono focus:outline-none focus:border-[#0EA5A8]"
              />
              <span>days</span>
            </div>

            <button
              type="submit"
              disabled={saving || !isOpVerified}
              className={`px-6 py-3 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all ${
                isOpVerified
                  ? 'bg-[#0EA5A8] hover:bg-[#0C8F92] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
              }`}
              title={isOpVerified ? 'Send prescribed medicines directly to patient' : 'Enter and verify patient OP Number first'}
            >
              {isOpVerified ? (
                <Pill className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {saving
                  ? 'Sending to Patient Portal...'
                  : isOpVerified
                  ? 'Send Prescribed Medicines to Patient Directly'
                  : '🔒 Enter & Verify Patient OP Number to Prescribe'}
              </span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
