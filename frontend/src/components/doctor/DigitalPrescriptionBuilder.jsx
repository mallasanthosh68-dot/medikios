import React, { useState, useEffect, useMemo } from 'react';
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
  Printer,
  Search,
  Eye,
  RotateCcw,
  Stethoscope,
  Download,
  AlertTriangle,
  Bot,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { MedicineAutocompleteInput } from './MedicineAutocompleteInput';

export const DigitalPrescriptionBuilder = ({
  initialPatient,
  requestId,
  initialMedicine,
  onPrescriptionCreated,
}) => {
  const [patientId, setPatientId] = useState(initialPatient?.id || initialPatient?._id || '');
  const [patientName, setPatientName] = useState(initialPatient?.name || 'Walk-in Patient');
  const [patientAge, setPatientAge] = useState(initialPatient?.age || initialPatient?.patientAge || 35);
  const [patientGender, setPatientGender] = useState(initialPatient?.gender || initialPatient?.patientGender || 'Not specified');
  const [patientPhone, setPatientPhone] = useState(initialPatient?.phoneNumber || initialPatient?.patientPhone || '—');
  const [opNumberInput, setOpNumberInput] = useState(initialPatient?.opNumber || '');
  const [patientAbha, setPatientAbha] = useState(initialPatient?.abhaId || '');
  const [diagnosis, setDiagnosis] = useState(initialPatient?.diagnosis || initialPatient?.chiefComplaint || 'Provisional Clinical Assessment');
  const [instructions, setInstructions] = useState('Maintain adequate hydration and take complete rest as directed.');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('7');
  const [saving, setSaving] = useState(false);
  const [successRx, setSuccessRx] = useState(null);
  const [quickSearchText, setQuickSearchText] = useState('');
  const [showSlipPreview, setShowSlipPreview] = useState(false);

  // Multi-medicine list with sensible clinical defaults
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

  // Dynamic AI medication suggestions for attending doctor's quick review & adoption
  const dynamicSuggestions = useMemo(() => {
    if (initialPatient?.aiMedicationSuggestions && initialPatient.aiMedicationSuggestions.length > 0) {
      return initialPatient.aiMedicationSuggestions;
    }
    if (initialPatient?.summary?.aiMedicationSuggestions && initialPatient.summary.aiMedicationSuggestions.length > 0) {
      return initialPatient.summary.aiMedicationSuggestions;
    }
    const text = (diagnosis || initialPatient?.chiefComplaint || '').toLowerCase();
    if (/fever|temperature|chills|cold|cough|throat/i.test(text)) {
      return [
        {
          name: 'Dolo 650',
          genericName: 'Paracetamol',
          strength: '650 mg',
          form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Thrice daily',
          timing: { morning: true, afternoon: true, night: true, mealRelation: 'After food' },
          duration: '3 days',
          instructions: 'Take after meals for fever/body pain',
          clinicalRationale: 'Effective temperature regulation and malaise relief.',
        },
        {
          name: 'Pan 40',
          genericName: 'Pantoprazole',
          strength: '40 mg',
          form: 'Tablet',
          dosage: '1 tablet',
          frequency: 'Once daily',
          timing: { morning: true, afternoon: false, night: false, mealRelation: 'Before food' },
          duration: '5 days',
          instructions: 'Take 30 min before morning breakfast',
          clinicalRationale: 'Prophylactic gastric protection.',
        },
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
          clinicalRationale: 'Broad-spectrum antibacterial therapy for respiratory tract infection.',
        },
      ];
    }
    return [
      {
        name: 'Dolo 650',
        genericName: 'Paracetamol',
        strength: '650 mg',
        form: 'Tablet',
        dosage: '1 tablet',
        frequency: 'SOS',
        timing: { morning: true, afternoon: false, night: true, mealRelation: 'After food' },
        duration: '3 days',
        instructions: 'Take as needed for symptomatic discomfort',
        clinicalRationale: 'Analgesic / Antipyretic first-line support.',
      },
      {
        name: 'Pan 40',
        genericName: 'Pantoprazole',
        strength: '40 mg',
        form: 'Tablet',
        dosage: '1 tablet',
        frequency: 'Once daily',
        timing: { morning: true, afternoon: false, night: false, mealRelation: 'Before food' },
        duration: '5 days',
        instructions: 'Take 30 mins before breakfast',
        clinicalRationale: 'Gastric acid suppression for digestive comfort.',
      },
    ];
  }, [initialPatient, diagnosis]);

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
        dosage: '1 tablet',
        frequency: 'Twice daily',
        timing: { morning: true, afternoon: false, night: true, mealRelation: 'After food' },
        duration: '5 days',
        instructions: '',
      },
    ]);
  };

  useEffect(() => {
    if (initialMedicine && (initialMedicine.name || initialMedicine.medicineName)) {
      handleAddMedicine({
        ...initialMedicine,
        name: initialMedicine.medicineName || initialMedicine.name,
      });
    }
  }, [initialMedicine]);

  useEffect(() => {
    if (initialPatient) {
      if (initialPatient.id || initialPatient._id) setPatientId(initialPatient.id || initialPatient._id);
      if (initialPatient.name) setPatientName(initialPatient.name);
      if (initialPatient.age || initialPatient.patientAge) setPatientAge(initialPatient.age || initialPatient.patientAge);
      if (initialPatient.gender || initialPatient.patientGender) setPatientGender(initialPatient.gender || initialPatient.patientGender);
      if (initialPatient.phoneNumber || initialPatient.patientPhone) setPatientPhone(initialPatient.phoneNumber || initialPatient.patientPhone);
      if (initialPatient.opNumber) setOpNumberInput(initialPatient.opNumber);
      if (initialPatient.abhaId) setPatientAbha(initialPatient.abhaId);
      if (initialPatient.diagnosis || initialPatient.chiefComplaint) {
        setDiagnosis(initialPatient.diagnosis || initialPatient.chiefComplaint);
      }
    }
  }, [initialPatient]);

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

  const triggerSystemPrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const generatePrescriptionHtml = (rx) => {
    const pName = rx?.patientName || patientName || 'Patient';
    const pOp = rx?.opNumber || opNumberInput || 'OP-WALKIN';
    const pAbha = rx?.abhaId || patientAbha || '—';
    const pAge = rx?.patientAge || patientAge || '—';
    const pGender = rx?.patientGender || patientGender || '—';
    const pPhone = rx?.patientPhone || patientPhone || '—';
    const dName = rx?.doctorName || 'Dr. Attending Physician';
    const dSpec = rx?.doctorSpecialty || 'Consultant Physician';
    const dReg = rx?.doctorLicense || 'MCI-REG-89104';
    const hosp = rx?.hospitalName || 'MediKiosk Apex Hospital & Medical Centre';
    const diag = rx?.diagnosisOrImpression || diagnosis || 'Provisional Clinical Assessment';
    const meds = rx?.medicines || medicines.filter((m) => m.name && m.name.trim());
    const inst = rx?.generalInstructions || instructions || 'Maintain adequate rest and fluid intake.';
    const fDays = rx?.followUpDays || followUpDays || 7;
    const rxNo = rx?._id ? `Rx-${rx._id.slice(-6).toUpperCase()}` : `Rx-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date(rx?.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const medRows = meds.map((m, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 12px; color: #64748b; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 10px 8px;">
          <strong style="font-size: 13px; color: #0f172a; display: block;">${m.name}</strong>
          ${m.genericName ? `<span style="font-size: 11px; color: #64748b;">${m.genericName}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; font-size: 12px; color: #334155;">${m.strength || ''} ${m.form || ''}</td>
        <td style="padding: 10px 8px; font-size: 12px; text-align: center; font-weight: bold; color: #0284c7;">${m.timing?.morning ? '1' : '0'}</td>
        <td style="padding: 10px 8px; font-size: 12px; text-align: center; font-weight: bold; color: #0284c7;">${m.timing?.afternoon ? '1' : '0'}</td>
        <td style="padding: 10px 8px; font-size: 12px; text-align: center; font-weight: bold; color: #0284c7;">${m.timing?.night ? '1' : '0'}</td>
        <td style="padding: 10px 8px; font-size: 12px; color: #334155;">${m.timing?.mealRelation || 'After food'}</td>
        <td style="padding: 10px 8px; font-size: 12px; font-family: monospace; color: #334155;">${m.duration || '5 days'}</td>
        <td style="padding: 10px 8px; font-size: 11px; color: #475569;">${m.instructions || 'As directed'}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${pName} (${pOp})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
      color: #0f172a;
    }
    .prescription-card {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .hosp-title {
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .hosp-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .doctor-meta {
      text-align: right;
    }
    .doctor-name {
      font-size: 15px;
      font-weight: bold;
      color: #0f172a;
    }
    .doctor-spec {
      font-size: 12px;
      color: #0284c7;
      font-weight: 600;
    }
    .doctor-reg {
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f1f5f9;
      padding: 14px 18px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }
    .meta-item label {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .meta-item span {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
    .meta-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #e0f2fe;
      color: #0284c7;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
    }
    .diagnosis-box {
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0284c7;
      border-radius: 8px;
    }
    .diagnosis-box strong {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      display: block;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .diagnosis-text {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .rx-symbol {
      font-size: 26px;
      font-family: Georgia, serif;
      font-weight: bold;
      color: #0284c7;
      margin-right: 8px;
    }
    .table-container {
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      border-bottom: 2px solid #cbd5e1;
      padding: 8px;
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 800;
    }
    .instructions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    .inst-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .inst-card label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 6px;
    }
    .inst-card p {
      margin: 0;
      font-size: 12px;
      color: #1e293b;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-note {
      font-size: 10px;
      color: #94a3b8;
      max-width: 380px;
      line-height: 1.4;
    }
    .sig-block {
      text-align: right;
    }
    .sig-line {
      width: 200px;
      border-bottom: 1px solid #475569;
      margin-bottom: 6px;
      padding-bottom: 40px;
    }
    .sig-title {
      font-size: 12px;
      font-weight: bold;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 10px;
      color: #64748b;
    }
    .toolbar {
      max-width: 850px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
    }
    .btn-print {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print:hover {
      background: #0369a1;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .toolbar {
        display: none !important;
      }
      .prescription-card {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="font-size: 12px; color: #475569;">
      🏥 <strong>Official Patient Prescription Slip</strong> • Hand over to patient: <strong>${pName}</strong> (${pOp})
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Print Prescription / Save as PDF
    </button>
  </div>

  <div class="prescription-card">
    <div class="header">
      <div>
        <div class="hosp-title">🏥 ${hosp}</div>
        <div class="hosp-sub">Department of Outpatient Clinical Medicine • 24x7 Diagnostic &amp; Ambulatory Services</div>
      </div>
      <div class="doctor-meta">
        <div class="doctor-name">${dName}</div>
        <div class="doctor-spec">${dSpec}</div>
        <div class="doctor-reg">Reg: ${dReg}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Patient Name</label>
        <span>${pName}</span>
      </div>
      <div class="meta-item">
        <label>OP Number</label>
        <span class="meta-badge">${pOp}</span>
      </div>
      <div class="meta-item">
        <label>ABHA ID</label>
        <span style="font-family: monospace; font-size: 12px;">${pAbha}</span>
      </div>
      <div class="meta-item">
        <label>Age / Gender</label>
        <span>${pAge} Y • ${pGender}</span>
      </div>
      <div class="meta-item">
        <label>Phone Number</label>
        <span>${pPhone}</span>
      </div>
      <div class="meta-item">
        <label>Consultation Date</label>
        <span>${dateStr}</span>
      </div>
      <div class="meta-item">
        <label>Prescription Slip No</label>
        <span style="color: #0284c7;">${rxNo}</span>
      </div>
      <div class="meta-item">
        <label>Status</label>
        <span style="color: #16a34a; font-weight: bold;">✓ Clinically Verified</span>
      </div>
    </div>

    <div class="diagnosis-box">
      <strong>Clinical Impression / Provisional Diagnosis</strong>
      <div class="diagnosis-text">${diag}</div>
    </div>

    <div class="table-container">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span class="rx-symbol">℞</span>
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
          Prescribed Medications &amp; Dosage Schedule
        </span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 24px;">#</th>
            <th>Medicine / Generic</th>
            <th>Strength &amp; Form</th>
            <th style="text-align: center;">Morn</th>
            <th style="text-align: center;">Noon</th>
            <th style="text-align: center;">Night</th>
            <th>Meal Relation</th>
            <th>Duration</th>
            <th>Directions</th>
          </tr>
        </thead>
        <tbody>
          ${medRows}
        </tbody>
      </table>
    </div>

    <div class="instructions-grid">
      <div class="inst-card">
        <label>General Advice &amp; Care Instructions</label>
        <p>${inst}</p>
      </div>
      <div class="inst-card">
        <label>Next Clinical Review / Follow-Up</label>
        <p><strong>Follow-up in ${fDays} days</strong> for physical evaluation or sooner in case of acute symptoms or emergency.</p>
      </div>
    </div>

    <div class="footer">
      <div class="footer-note">
        Generated via MediKiosk Attending Physician Workstation.<br>
        This official prescription is provided directly to patient <strong>${pName}</strong>. Handed over at outpatient consultation counter.
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-title">${dName}</div>
        <div class="sig-sub">Attending Physician • Signature &amp; Seal</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadPrescription = (rx = null) => {
    const dataToDownload = rx || successRx || {
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      opNumber: opNumberInput,
      abhaId: patientAbha,
      diagnosisOrImpression: diagnosis,
      medicines: medicines.filter((m) => m.name && m.name.trim()),
      generalInstructions: instructions,
      followUpDays,
      createdAt: new Date().toISOString(),
    };

    const html = generatePrescriptionHtml(dataToDownload);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const cleanOp = (dataToDownload.opNumber || opNumberInput || 'Rx').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanName = (dataToDownload.patientName || patientName || 'Patient').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    a.href = url;
    a.download = `Prescription_${cleanOp}_${cleanName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitAndPrint = async (e, shouldDownload = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!patientName.trim()) {
      alert('Please provide the patient name.');
      return;
    }

    const validMeds = medicines.filter((m) => m.name && m.name.trim());
    if (validMeds.length === 0) {
      alert('Please enter at least one medicine to prescribe.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/prescriptions', {
        patientId: patientId && patientId !== 'patient-walkin' ? patientId : undefined,
        opNumber: (opNumberInput || '').trim().toUpperCase(),
        abhaId: (patientAbha || '').trim(),
        requestId,
        patientName: patientName.trim(),
        patientAge: parseInt(patientAge, 10) || 35,
        patientGender: patientGender || 'Not specified',
        patientPhone: patientPhone || '—',
        diagnosisOrImpression: diagnosis,
        medicines: validMeds,
        instructions,
        doctorNotes,
        followUpDays: parseInt(followUpDays, 10) || 7,
      });

      if (res.success && res.prescription) {
        setSuccessRx(res.prescription);
        if (onPrescriptionCreated) onPrescriptionCreated(res.prescription);
        if (shouldDownload) {
          handleDownloadPrescription(res.prescription);
        } else {
          triggerSystemPrint();
        }
      }
    } catch (err) {
      alert('Failed to generate prescription: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Embedded CSS for clean browser printing to doctor's system printer */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-prescription-slip, #printable-prescription-slip * {
            visibility: visible !important;
          }
          #printable-prescription-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Main Prescription Builder Card (Hidden in Print Mode) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-xs space-y-6 no-print">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9E4E5] gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs font-semibold text-[#0EA5A8] mb-2">
              <Printer className="w-3.5 h-3.5" />
              <span>Doctor Workstation Prescription Print</span>
            </div>
            <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Create &amp; Print Prescription</h2>
            <p className="text-xs text-[#64748B] mt-1">
              Prescribe medicines directly and print the official clinical Rx slip to your system. Prescriptions remain in your clinic records and are not sent to patient devices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSlipPreview(!showSlipPreview)}
              className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D9E4E5] text-[#172033] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#0EA5A8]" />
              <span>{showSlipPreview ? 'Hide Slip Preview' : 'Preview Rx Slip'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert & Actions if just prescribed */}
        {successRx && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Prescription Ready for Patient
                  </h4>
                  {successRx.opNumber && (
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-400">
                      {successRx.opNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-900 font-medium mt-1">
                  Prescription generated for <strong>{successRx.patientName}</strong>. Download or print this official clinical slip now to give directly to the patient.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleDownloadPrescription(successRx)}
                className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Download official HTML/PDF prescription slip"
              >
                <Download className="w-4 h-4 text-sky-200" />
                <span>Download Slip</span>
              </button>
              <button
                type="button"
                onClick={triggerSystemPrint}
                className="px-4 py-2.5 rounded-xl bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Print prescription directly on doctor workstation printer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Slip for Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setSuccessRx(null)}
                className="px-3 py-2.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                New Rx
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitAndPrint} className="space-y-6">

          {/* Patient Details & Clinical Impression */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#D9E4E5] pb-2">
              <span className="font-bold text-[#172033] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0EA5A8]" />
                Patient Information &amp; Assessment
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                Direct Workstation Entry &amp; OP Integration
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-[#172033] font-semibold focus:outline-none focus:border-[#0EA5A8]"
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="35"
                  className="w-full bg-white border border-[#D9E4E5] rounded-xl px-2 py-2 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full bg-white border border-[#D9E4E5] rounded-xl px-2.5 py-2 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Not specified">Not specified</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                  OP / Token Ref <span className="text-slate-400 font-normal">(Direct/Lookup)</span>
                </label>
                <input
                  type="text"
                  value={opNumberInput}
                  onChange={(e) => setOpNumberInput(e.target.value.toUpperCase())}
                  placeholder="e.g. OP-405818"
                  className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-[#172033] font-mono uppercase font-bold focus:outline-none focus:border-[#0EA5A8]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                  14-Digit ABHA ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={patientAbha}
                  onChange={(e) => setPatientAbha(e.target.value)}
                  placeholder="e.g. 91-4829-1049-2819"
                  className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-[#172033] font-mono focus:outline-none focus:border-[#0EA5A8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">Clinical Impression / Diagnosis *</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Pharyngitis with Mild Pyrexia"
                className="w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-[#172033] font-medium focus:outline-none focus:border-[#0EA5A8]"
                required
              />
            </div>
          </div>

          {/* Quick Formulary Search & Add (10,000+ Formulations) */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0C8F92]">
                <Sparkles className="w-4 h-4 text-[#0EA5A8]" />
                <span>Search &amp; Add Medication</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold border border-teal-200">
                  10,000+ Formulary Database
                </span>
              </div>
              <span className="text-[11px] text-[#64748B]">Type medicine name to auto-fill generic, form, &amp; dosage</span>
            </div>
            <MedicineAutocompleteInput
              value={quickSearchText}
              onChange={setQuickSearchText}
              onSelect={(selectedMed) => {
                handleAddMedicine(selectedMed);
                setQuickSearchText('');
              }}
              placeholder="🔍 Type medicine name (e.g. Dolo 650, Augmentin, Pan 40, Azithral, Telma, Metformin)..."
            />
          </div>

          {/* AI Clinical Medication Suggestions Drawer (Physician Review Advisory) */}
          {dynamicSuggestions && dynamicSuggestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E6F7F7]/60 via-[#F0FDFA]/40 to-white border border-[#0EA5A8]/40 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[#0EA5A8]/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0EA5A8] text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    AI Medication Suggestions for Attending Doctor
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-[#0EA5A8] bg-[#E6F7F7] px-2 py-0.5 rounded-full border border-[#0EA5A8]/25 self-start sm:self-auto">
                  Click "+ Add" to Adopt Suggestion
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>Doctor Advisory:</strong> The AI suggests these evidence-based remedies for your review. You have full clinical control to prescribe, adjust, or replace.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dynamicSuggestions.map((sug, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-[#D9E4E5] shadow-2xs space-y-1.5 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <strong className="text-[#172033] font-bold text-xs">{sug.name || sug.medicineName}</strong>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {sug.strength || 'Standard'}
                        </span>
                      </div>
                      {(sug.genericName) && (
                        <p className="text-[10px] text-[#64748B] line-clamp-1">{sug.genericName}</p>
                      )}
                      <div className="text-[10px] text-slate-700 mt-1">
                        <span className="font-semibold">{sug.dosage || '1 tablet'}</span> • {sug.frequency || 'Daily'} • {sug.duration || '5 days'}
                      </div>
                      {sug.clinicalRationale && (
                        <p className="text-[10px] text-teal-800 bg-teal-50/60 p-1 rounded mt-1 line-clamp-2">
                          {sug.clinicalRationale}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMedicine({
                        name: sug.name || sug.medicineName,
                        genericName: sug.genericName || '',
                        strength: sug.strength || '500 mg',
                        form: sug.form || 'Tablet',
                        dosage: sug.dosage || '1 tablet',
                        frequency: sug.frequency || 'Twice daily',
                        duration: sug.duration || '5 days',
                        instructions: sug.instructions || `${sug.timing || 'After food'} - ${sug.clinicalRationale || ''}`,
                      })}
                      className="w-full mt-1 py-1 px-2 rounded-lg bg-[#0EA5A8] hover:bg-[#0C8F92] text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add to Prescription</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                className="px-3 py-1.5 rounded-xl bg-[#F3F8F8] hover:bg-[#EAF3F3] border border-[#D9E4E5] text-[#172033] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#0EA5A8]" />
                <span>Add Blank Medicine</span>
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] space-y-3 text-xs shadow-2xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] text-[#64748B] font-medium mb-0.5">Medicine Name</label>
                      <MedicineAutocompleteInput
                        value={med.name}
                        onChange={(val) => handleMedFieldChange(idx, 'name', val)}
                        onSelect={(selectedMed) => handleSelectSuggestedMedicine(idx, selectedMed)}
                        placeholder="e.g. Augmentin 625 Duo"
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
                        placeholder="e.g. 625 mg Tablet"
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-[#64748B] mb-0.5 font-medium">Dosage / Frequency</label>
                      <input
                        type="text"
                        value={med.dosage + (med.frequency ? ` • ${med.frequency}` : '')}
                        onChange={(e) => handleMedFieldChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 1 tablet twice daily"
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1.5 text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end items-end pt-5">
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Timing Matrix (Morning, Afternoon, Night) & Meal Relation */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2.5 border-t border-[#D9E4E5] items-center">
                    <div className="sm:col-span-5 flex items-center gap-4">
                      <span className="text-[11px] text-[#64748B] font-medium">Schedule:</span>
                      {['morning', 'afternoon', 'night'].map((slot) => (
                        <label key={slot} className="flex items-center gap-1.5 cursor-pointer capitalize">
                          <input
                            type="checkbox"
                            checked={Boolean(med.timing?.[slot])}
                            onChange={() => handleTimingToggle(idx, slot)}
                            className="accent-[#0EA5A8] rounded w-3.5 h-3.5"
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
                        className="w-full bg-white border border-[#D9E4E5] rounded-lg px-2.5 py-1 text-[11px] text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
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
                        placeholder="Special notes"
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
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                General Clinical &amp; Lifestyle Instructions
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Diet advice, rest, fluid intake, precautions..."
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#64748B] font-medium mb-1">
                Attending Doctor Internal Notes <span className="text-slate-400 font-normal">(Clinic Records)</span>
              </label>
              <textarea
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Observations, vital signs noted, diagnostic plans..."
                className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl p-3 text-xs text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
              />
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#D9E4E5] gap-4">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span>Follow-up review in:</span>
              <input
                type="number"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                className="w-16 bg-[#F8FAFC] border border-[#D9E4E5] rounded-lg px-2 py-1 text-[#172033] text-center font-mono focus:outline-none focus:border-[#0EA5A8]"
              />
              <span>days</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => handleSubmitAndPrint(e, true)}
                disabled={saving}
                className="px-5 py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title="Save prescription and download official slip file to give to patient"
              >
                <Download className="w-4 h-4 text-sky-200" />
                <span>{saving ? 'Processing...' : 'Save & Download Prescription Slip'}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title="Print prescription directly to doctor workstation printer"
              >
                <Printer className="w-4 h-4" />
                <span>{saving ? 'Processing...' : 'Save & Print to System'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* 
        OFFICIAL PRINTABLE PRESCRIPTION SLIP
        Rendered on-screen when previewed or printed, and visible in browser print mode 
      */}
      <div
        id="printable-prescription-slip"
        className={`bg-white p-8 rounded-3xl border border-slate-300 shadow-sm space-y-6 text-[#172033] ${
          showSlipPreview || successRx ? 'block' : 'hidden print:block'
        }`}
      >
        {/* Hospital & Doctor Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-[#172033] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0EA5A8] text-white flex items-center justify-center font-bold text-sm">
                Rx
              </div>
              <h1 className="text-xl font-black tracking-tight text-[#172033] uppercase">
                MediKiosk Apex Hospital &amp; Medical Centre
              </h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Department of Outpatient Clinical Medicine • 24x7 Diagnostic &amp; Ambulatory Care
            </p>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-sm text-[#172033]">
              {successRx?.doctorName || 'Dr. Attending Physician'}
            </div>
            <div className="text-[#0EA5A8] font-medium">
              {successRx?.doctorSpecialty || 'Consultant Physician'}
            </div>
            <div className="text-[#64748B] font-mono text-[11px]">
              Reg: {successRx?.doctorLicense || 'MCI-REG-89104'}
            </div>
          </div>
        </div>

        {/* Patient & Date Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="sm:col-span-2">
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Patient Name</span>
            <strong className="text-sm text-[#172033]">{successRx?.patientName || patientName}</strong>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">OP Number</span>
            <span className="font-mono font-bold text-[#0284C7] text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
              {successRx?.opNumber || opNumberInput || 'OP-WALKIN'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">ABHA ID</span>
            <span className="font-mono text-xs text-slate-700">
              {successRx?.abhaId || patientAbha || '—'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Age / Gender</span>
            <span className="font-semibold text-slate-700">{successRx?.patientAge || patientAge} Y • {successRx?.patientGender || patientGender}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold">Date &amp; Slip Ref</span>
            <span className="font-mono text-xs text-slate-600 block">{new Date(successRx?.createdAt || Date.now()).toLocaleDateString()}</span>
            <span className="font-mono font-bold text-[#0EA5A8] text-[11px]">
              {successRx?._id ? `Rx-${successRx._id.slice(-6).toUpperCase()}` : 'Rx-SYSTEM'}
            </span>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="text-xs">
          <span className="text-[#64748B] font-bold uppercase tracking-wider text-[10px] block mb-1">
            Clinical Impression / Diagnosis:
          </span>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-semibold text-[#172033]">
            {successRx?.diagnosisOrImpression || diagnosis || 'Provisional Clinical Assessment'}
          </div>
        </div>

        {/* Prescribed Medicines Schedule Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
            <span className="text-2xl font-serif italic font-black text-[#0EA5A8]">℞</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Prescribed Medications &amp; Dosage Schedule
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#64748B] text-[10px] uppercase">
                <th className="py-2 px-1">#</th>
                <th className="py-2 px-2">Medicine / Generic</th>
                <th className="py-2 px-2">Strength &amp; Form</th>
                <th className="py-2 px-2 text-center">Morn</th>
                <th className="py-2 px-2 text-center">Noon</th>
                <th className="py-2 px-2 text-center">Night</th>
                <th className="py-2 px-2">Meal Relation</th>
                <th className="py-2 px-2">Duration</th>
                <th className="py-2 px-2">Directions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(successRx?.medicines || medicines).map((med, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-1 font-mono text-[#64748B]">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <strong className="text-[#172033] block">{med.name}</strong>
                    {med.genericName && (
                      <span className="text-[10px] text-slate-500">{med.genericName}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-slate-700">{med.strength || '—'} {med.form || ''}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-[#0EA5A8]">
                    {med.timing?.morning ? '1' : '0'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-[#0EA5A8]">
                    {med.timing?.afternoon ? '1' : '0'}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-[#0EA5A8]">
                    {med.timing?.night ? '1' : '0'}
                  </td>
                  <td className="py-2.5 px-2 text-slate-700">{med.timing?.mealRelation || 'After food'}</td>
                  <td className="py-2.5 px-2 font-mono text-slate-700">{med.duration || '—'}</td>
                  <td className="py-2.5 px-2 text-slate-600 text-[11px]">{med.instructions || 'As directed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* General Instructions & Follow-up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-[10px] uppercase text-[#64748B] block mb-1">
              General Advice &amp; Instructions
            </span>
            <p className="text-[#172033] text-[11px] leading-relaxed">
              {successRx?.generalInstructions || instructions || 'Maintain adequate rest and fluid intake.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-[10px] uppercase text-[#64748B] block mb-1">
              Next Clinical Review
            </span>
            <p className="text-[#172033] font-semibold text-[11px]">
              Follow up in {successRx?.followUpDays || followUpDays} days for physical evaluation or sooner in case of acute discomfort.
            </p>
          </div>
        </div>

        {/* Signature & Stamp Area */}
        <div className="pt-8 flex justify-between items-end border-t border-slate-200">
          <div className="text-[10px] text-slate-400">
            Generated via MediKiosk Attending Physician Workstation.<br />
            Prescription printed directly to local system. Not electronically sent to patient.
          </div>

          <div className="text-right">
            <div className="w-48 border-b border-slate-400 mb-1 pb-6"></div>
            <div className="text-xs font-bold text-[#172033]">Attending Physician Signature</div>
            <div className="text-[10px] text-[#64748B]">Clinic Seal &amp; Registration Stamp</div>
          </div>
        </div>

        {/* Quick Actions at bottom of on-screen slip */}
        <div className="pt-4 flex justify-end gap-3 no-print">
          <button
            type="button"
            onClick={() => handleDownloadPrescription(successRx)}
            className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-200" />
            <span>Download Prescription Slip</span>
          </button>
          <button
            type="button"
            onClick={triggerSystemPrint}
            className="px-5 py-2.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0C8F92] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Send to System Printer</span>
          </button>
        </div>

      </div>

    </div>
  );
};
