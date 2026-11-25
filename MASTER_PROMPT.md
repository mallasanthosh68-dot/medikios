# MediKiosk - Full-Stack Hospital AI Outpatient Kiosk System
## Complete Architecture Blueprint & Master Specification Prompt

---

### Table of Contents
1. **Executive Overview & Problem Solved**
2. **System Architecture & Technology Stack**
3. **Core Kiosk 9-Step Intake Pipeline**
4. **Doctor Clinical Cockpit & 10,000+ Medicine Prescription Engine**
5. **Backend REST API Catalog & Data Schemas**
6. **The Complete Master Prompt (Copy & Paste to Rebuild from Scratch)**

---

## 1. Executive Overview
**MediKiosk** is a multi-lingual, multi-modal hospital outpatient intake kiosk and clinical decision-support ecosystem designed for high-traffic hospital outpatient departments (OPDs). It eliminates registration counter queues by guiding patients through a 3-minute intake process via touch or voice in 51 languages, screening for clinical red flags, digitizing physical reports with OCR, and preparing a structured clinical dossier with an assigned OP token before the patient enters the consultation room.

---

## 2. Technology Stack & Key Modules

| Layer | Technologies & Libraries | Key Responsibilities |
|---|---|---|
| **Frontend** | React 18/19, Vite 6, Tailwind CSS 3.4, Framer Motion, Lucide React | 9-step intake kiosk UI, animated transitions, accessible controls |
| **3D Anatomy** | Three.js (`three`, `@types/three`) | Interactive 3D human body model for pinning anatomical pain locations |
| **Voice & Audio** | Web Speech API (`webkitSpeechRecognition`), Web Audio API | Hands-free continuous voice-to-voice intake with 2.2s silence threshold |
| **SMS & Identity** | Google Firebase Modular SDK v13 (`firebase/auth`), ABHA Validator | Real cellular GSM SMS OTP delivery (10k free/month) + `123456` fallback |
| **Backend API** | Node.js 18+, Express 4.21, Multer, JWT, Bcrypt | REST API endpoints, role-based access control, file storage |
| **Database** | Dual Engine: MongoDB (Mongoose 8) + Supabase PostgreSQL + Local JSON | Cloud persistence with automatic offline hospital fallback (`local_db.json`) |
| **Clinical AI** | Groq SDK (`llama-3.3-70b-versatile`), Google Gemini 1.5 Flash | Multi-turn clinical interview, symptom parser, differential diagnosis |
| **Document OCR** | Tesseract.js | In-browser/server optical character recognition of lab reports & prescriptions |
| **Drug Database** | Custom Indexed JSON dataset (`medicines10000.json`) | Instant autocomplete across 10,000+ Indian pharmaceutical drugs |

---

## 3. The 9-Step Patient Intake Workflow (`AICheckupPage.jsx`)

1. **Step 1: Language Selection**:
   - Visual tiles for major Indian languages (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Gujarati, Malayalam, English).
   - Searchable modal covering 51 Indian and International languages with native script rendering.
2. **Step 2: Patient Identification & Verification**:
   - Tab toggle: 'Returning Patient' (phone lookup) vs 'New Patient Registration'.
   - Collects 10-digit mobile number, name, age (1–90), gender, and optional 14-digit ABHA ID (`XX-XXXX-XXXX-XXXX`).
   - Dispatches cellular SMS OTP via Google Firebase Phone Auth with invisible reCAPTCHA. Supports demo verification with code `123456`.
3. **Step 3: Informed Patient Consent**:
   - Statutory bilingual consent declaration complying with DPDP Act and Indian Medical Council guidelines.
4. **Step 4: Healthcare Pathway Selection**:
   - Pathway A: **General Allopathic Medicine** (organ systems, acute symptom triage).
   - Pathway B: **AYUSH** (Ayurveda, Yoga, Unani, Siddha, Homeopathy) capturing Prakriti, Agni, Koshtha, Nidra, Ahara, and Vihara.
5. **Step 5: Communication Mode**:
   - Mode 1: On-screen Touch & Keyboard with quick-reply symptom chips.
   - Mode 2: Hands-Free Voice-to-Voice using real-time speech recognition, animated visualizer, and speech synthesis.
6. **Step 6: AI Clinical Interview & 14-Category Emergency Screener**:
   - Multi-turn clinical inquiry (Chief Complaint, Onset, Severity, Radiation, Past Medical History, Allergies).
   - Background screening across 14 emergency categories (Cardiovascular, Respiratory, Stroke, Sepsis, Hemorrhage, Trauma). Plays audio chime and triggers immediate ER triage modal if an emergency is detected.
7. **Step 7: Physical Document & Lab Report Scanner**:
   - Camera scanner modal capturing physical OPD slips, blood test reports, and radiology scans.
   - Runs Tesseract OCR extracting key biomarkers (HbA1c, Platelets, Creatinine, etc.) into the dossier.
8. **Step 8: AI Clinical Summary & 3D Anatomy Pain Map**:
   - Generates structured summary: Chief Complaint, HPI, Differential Diagnoses with ICD-10 codes, suggested diagnostic investigations, and suggested OTC relief medications.
   - Interactive 3D body viewer allowing patients to touch/pin pain zones.
9. **Step 9: Confirmed OPD Ticket & Token**:
   - Issues unique token (e.g., `OP-2026-4821`).
   - Assigns doctor, department, consultation room number, estimated wait time, and provides a 1-click printable hospital slip.

---

## 4. Doctor Clinical Cockpit & Prescription Builder

- **Live OPD Queue**: Triage-prioritized queue displaying waiting patients, emergency flags, and AYUSH tags.
- **Patient Dossier**: One-click modal reviewing the AI interview transcript, extracted symptoms, scanned lab reports with OCR text, and 3D pain locations.
- **10,000+ Indian Medicine Rx Builder**:
  - Instant client-side search indexed across 10,000 brand and generic medicines.
  - Fields: Drug name, Form (Tab/Syr/Inj), Strength, Frequency (1-0-1, 1-1-1), Duration, Food instruction, and Special Precautions.
  - Generates standardized printable hospital prescription slips.

---

## 5. Master Prompt Specification (Copy & Paste to Rebuild)

```markdown
### MASTER PROMPT: BUILD "MEDIKIOSK" FULL-STACK HOSPITAL AI OUTPATIENT INTAKE SYSTEM

You are an expert full-stack healthcare systems architect and principal software engineer. Build "MediKiosk" — a production-grade, multi-lingual, multi-modal hospital outpatient intake kiosk and clinical decision-support ecosystem.

#### 1. ARCHITECTURE & TECH STACK
- **Frontend**: React 18/19 SPA with Vite, Tailwind CSS 3.4, Framer Motion, Lucide React, Three.js (for 3D body pain visualizer), and Firebase Auth Modular SDK v13 (for cellular SMS OTP).
- **Backend**: Node.js, Express, MongoDB (Mongoose) + Supabase PostgreSQL dual-engine support with local JSON file fallback (`local_db.json`) for zero-downtime offline hospital resilience.
- **AI Inference**: Groq SDK (`llama-3.3-70b-versatile`) for multi-turn clinical interviewing, symptom parsing, and differential diagnosis; Google Gemini 1.5 Flash for vision document parsing; Tesseract.js for OCR.
- **Telephony & Identity**: Google Firebase Phone Authentication for real cellular GSM SMS verification codes (with fallback test code `123456`), and Indian ABHA 14-digit card validation.

#### 2. KIOSK PATIENT INTAKE WORKFLOW (9 PROGRESSIVE PHASES)
Create `frontend/src/pages/AICheckupPage.jsx` containing this 9-step state machine:
1. **Step 1: Language Selection**:
   - Provide visual buttons for top Indian languages (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Gujarati, Malayalam, English).
   - Implement a searchable modal covering 51 Indian and International languages with native script display.
2. **Step 2: Patient Identification & Verification**:
   - Tab toggle: 'Returning Patient' (lookup by phone) vs 'New Patient'.
   - Collect 10-digit phone, name, age (1–90), gender, and optional ABHA ID.
   - Dispatch cellular SMS OTP via Firebase Phone Auth with invisible reCAPTCHA container `<div id="recaptcha-container"></div>`.
   - Support instant verification with code `123456` or live Firebase confirmation. Auto-populate past health records upon verification.
3. **Step 3: Informed Patient Consent**:
   - Bilingual statutory consent declaration explaining AI triage, DPDP Act compliance, data safety, and final physician verification.
4. **Step 4: Healthcare Pathway Selection**:
   - Pathway A: General Allopathic Medicine.
   - Pathway B: AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) collecting Prakriti, Agni, Koshtha, Nidra, Ahara, and Vihara.
5. **Step 5: Communication Mode**:
   - Mode 1: On-screen Touch & Keyboard with quick-select symptom chips.
   - Mode 2: Hands-Free Voice-to-Voice using Web Speech API (`webkitSpeechRecognition`), 2.2s silence detector, animated voice visualizer, and speech synthesis.
6. **Step 6: AI Clinical Interview & Emergency Red Flag Screener**:
   - Multi-turn clinical interview guided by a strict triage prompt (asking chief complaint, onset, severity, radiation, past history).
   - Implement background 14-Category Emergency Red Flag Screener (Cardiovascular, Respiratory, Sepsis, Severe Trauma, Hemorrhage, Anaphylaxis).
   - If an emergency is detected: play an audio alert chime, show a prominent red pulsing warning, display emergency hospital contacts, and flag for immediate ER routing.
7. **Step 7: Physical Document & Lab Report Scanner**:
   - Live camera capture modal and file uploader supporting images/PDFs.
   - Document categorizer: Blood Test, Prescription, Imaging Scan, Discharge Summary.
   - Tesseract.js OCR extracts clinical text and biomarkers into the consultation record.
8. **Step 8: AI Clinical Summary & 3D Anatomy Pain Map**:
   - Generate structured dossier: Chief Complaint, HPI, Differential Diagnoses with ICD-10 codes, suggested diagnostic investigations, and suggested OTC relief medications.
   - Render an interactive Three.js 3D human body model allowing patients to click and mark exact anatomical pain zones (Head, Chest, Abdomen, Left Arm, Knee, etc.).
9. **Step 9: Confirmed OPD Ticket & Token**:
   - Generate unique token format `OP-YYYY-XXXX`.
   - Provide assigned doctor name, room number, estimated wait time, and a 1-click printable hospital outpatient slip.

#### 3. DOCTOR CLINICAL COCKPIT & DIGITAL PRESCRIPTION BUILDER
Create `frontend/src/components/doctor/DoctorDashboard.jsx` and `DigitalPrescriptionBuilder.jsx`:
- **Live OPD Queue**: View triage-prioritized patient list with emergency badges and AYUSH tags.
- **Patient Dossier Modal**: View full interview transcript, extracted symptoms, scanned lab reports with OCR text, and 3D pain locations.
- **10,000+ Indian Medicine Rx Builder**:
  - Integrate a searchable dataset of 10,000+ Indian medicines with auto-complete.
  - Fields: Drug name, Form (Tab/Syr/Inj), Strength, Frequency (1-0-1, 1-1-1), Duration, Food instruction, and Special Precautions.
  - Print/Export official branded hospital prescription slip.

#### 4. BACKEND REST API SPECIFICATION
Implement in `backend/server.js` and modular routes:
- `POST /api/auth/login`, `POST /api/auth/register` (JWT auth for doctors and staff).
- `POST /api/otp/send-patient-otp`, `POST /api/otp/verify-patient-otp` (SMS dispatch & validation).
- `GET /api/ayush/lookup-phone/:phone` (Fetch patient profile and past medical dossier).
- `POST /api/ai/chat` (Multi-turn conversational clinical interview).
- `POST /api/ai/generate-summary` (Differential diagnoses, ICD-10, structured summary).
- `POST /api/ayush/upload-document` (Multer upload + OCR text extraction).
- `POST /api/ayush/confirm-case` (Finalize case and generate unique OP ticket number).
- `GET /api/medicines/search?q=:term` (Query 10,000+ drug database with regex search).
- `POST /api/prescriptions` (Save digital prescription and link to OP token).

#### 5. RESILIENCE & DESIGN POLISH
- In `frontend/src/services/firebaseAuthService.js`, initialize Firebase safely. If SMS region policy or network is restricted, gracefully surface the fallback code `123456` without displaying raw technical error strings to patients.
- Use a clean, modern medical design system with Tailwind CSS: `#0EA5A8` (teal), `#10B981` (emerald success), `#EF4444` (emergency red), smooth rounded corners (`rounded-2xl`), and high legibility typography for hospital environments.
```
