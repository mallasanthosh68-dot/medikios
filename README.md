# MediKiosk — Your Smart Hospital Assistant
### Smart India Hackathon (SIH) Full-Stack Autonomous Triage Prototype

> **Tagline**: *"A smart digital healthcare assistant that helps patients explain their health concerns, organize previous medical information, and share structured health information with the doctor they choose."*

---

## 🌟 Executive Summary

**MediKiosk** is a full-stack, AI-powered hospital intake kiosk and clinical triage assistant built for high-volume government and private hospitals. It bridges the critical bottleneck between patient arrival and clinical consultation by:

1. **Natural Language Voice & Text Interviews**: Patients communicate their health concerns in natural speech or text in English, Hindi (हिन्दी), or Telugu (తెలుగు) powered by **Google Gemini 1.5 Flash** with an offline clinical reasoning fallback across 20+ disease domains and rule-based red-flag screening.
2. **Medical Report Digitization & Live OCR**: Live **Tesseract.js** optical character recognition and in-kiosk camera scanning with strict validation that rejects commercial receipts, extracting lab tests, observed values, and trilingual plain-language explanations (EN, HI, TE).
3. **Longitudinal Health Timeline**: Visual chronological mapping of previous blood tests, consultations, and prescriptions.
4. **Structured Clinical Summary**: Synthesized clinical dossiers with automated medical specialty suggestions (explicitly non-diagnostic).
5. **Guided 5-Step Patient Intake**: Step-by-step triage workflow walking the patient through complaint categorization, interactive questioning, report scanning, summary review, and doctor selection.
6. **Patient-Choice Doctor Routing**: Patient selects their attending specialist and grants explicit sharing consent.
7. **Physician Review & Digital Prescription Station**: Doctors verify patient dossiers, edit summaries, apply a **"✓ Doctor Reviewed"** clinical stamp, search a 110+ medicine catalog, and issue digital prescriptions with patient-friendly visual morning/noon/night schedules.
8. **Standards-Ready Architecture**: Honest sandbox implementations of **ABDM (M1/M2/M3)**, **HL7 FHIR Release 4 Document Bundles**, and **Hospital Information System (HIS)** queue integration.

---

## 🏗️ Clean Modular Architecture

```
MediKiosk/
│
├── frontend/                     # React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + Three.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Footer, EmergencyRedFlagAlert, Splash5Sec
│   │   │   ├── modals/           # LoginModal, RegisterModal (Patient & Doctor)
│   │   │   ├── patient/          # AIHealthCheckup, ThreeDAnatomyViewer (Three.js 3D Visualizer),
│   │   │   │                     # ConsentModal, CameraScannerModal, OCRReviewModal, MedicalRecords,
│   │   │   │                     # HealthTimeline, HealthSummaryView, DoctorDirectory, PatientPrescriptions
│   │   │   ├── doctor/           # DoctorDashboard, PatientDossierModal, DigitalPrescriptionBuilder
│   │   │   └── integrations/     # IntegrationsHub (ABDM M1/M2/M3, FHIR R4 JSON, HIS EMR)
│   │   ├── context/              # AuthContext, LanguageContext (51 regional languages)
│   │   ├── data/                 # translations.js (Trilingual core: EN, HI, TE)
│   │   ├── services/             # api.js (REST & multipart client)
│   │   ├── App.jsx               # View router & modal coordination
│   │   └── index.css             # Tailwind base & glassmorphic tokens
│   ├── tsconfig.json             # TypeScript compiler options
│   └── package.json
│
├── backend/                      # Node.js + TypeScript + Express.js + REST API
│   ├── src/
│   │   ├── config/               # db.js (Dual-Mode Mongo), supabase.js (PostgreSQL), schema.sql
│   │   ├── models/               # 14 Clinical Models (Patient, Doctor, Triage, Prescription, etc.)
│   │   ├── middleware/           # authMiddleware.js, rbacMiddleware.js, uploadMiddleware.js
│   │   ├── services/             # aiService.js, ocrService.js, fhirService.js, abdmService.js
│   │   ├── controllers/          # authController, patientController, doctorController
│   │   └── routes/               # authRoutes, patientRoutes, doctorRoutes
│   ├── tsconfig.json             # Backend TypeScript configuration
│   ├── server.js                 # Express server bootstrap (Port 5000)
│   └── package.json
│
├── ai-service/                   # Python FastAPI Microservice
│   ├── main.py                   # FastAPI app (PyTesseract OCR + LLM clinical summarization)
│   ├── requirements.txt          # Python dependencies (FastAPI, PyTesseract, Pillow, Gemini)
│   └── README.md
│
├── e2e/                          # End-to-End Automated Testing (Playwright)
│   └── kiosk-triage.spec.ts      # Clinical triage, language selection, and 3D visualizer specs
│
├── playwright.config.ts          # Playwright test configuration
├── PROJECT_LANGUAGES.txt         # Comprehensive 17-technology matrix & 51-language registry
└── README.md
```

---

## 🚀 Quick Start Guide (Zero-Configuration Setup)

The backend features an **intelligent dual-mode datastore**: it connects to MongoDB if available, or automatically falls back to an embedded in-memory datastore pre-seeded with 112 medicines, 8 verified doctors, and sample patient records. It **never fails** even if MongoDB is not installed on the evaluator's machine!

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 2. Start the Backend API
```bash
cd backend
npm install
npm start
```
*The backend starts on `http://localhost:5000` and seeds 112 medicines, 8 doctors, and patient profiles.*

### 3. Start the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 🔑 Demo Accounts for Evaluators

Quick-fill shortcut buttons are provided directly inside the Login modal for instantaneous evaluation without typing:

| Role | Name | Phone Number | Password | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | Ramesh Kumar | `9876543210` | `Password@123` | AI Voice/Text Check-Up, Report OCR, Timeline, Prescriptions |
| **Patient** | Sunita Devi | `9876543211` | `Password@123` | Hindi Language Flow, Historical Lab Timeline |
| **Patient** | Arjun Reddy | `9876543212` | `Password@123` | Telugu Language Flow, Unlinked ABHA Flow |
| **Doctor** | Dr. Rajesh Iyer | `9876543201` | `Password@123` | Senior Cardiologist, Clinical Dossier Review, Rx Builder |
| **Doctor** | Dr. Anita Sharma | `9876543202` | `Password@123` | General Medicine, Triage Queue, Medicine Search |
| **Doctor** | Dr. Vikramaditya Rao | `9876543203` | `Password@123` | Neurology Specialist, Patient Review Station |

---

## 📋 Comprehensive Feature Walkthrough

### 1. 5-Second Splash Screen Sequence
On initial application launch, an exact 5-second choreographed sequence displays:
- `0.0s – 1.0s`: MediKiosk heartbeat pulse logo reveal with gentle glow.
- `1.0s – 2.0s`: Brand title **"MediKiosk"** fades in.
- `2.0s – 3.0s`: Tagline: *"Your Smart Hospital Assistant — AI-Powered Healthcare"*.
- `3.0s – 4.5s`: Modern progress bar: *"Preparing your experience..."* (0% to 100%).
- `4.5s – 5.0s`: Smooth fade-out transition directly to the Homepage.

### 2. Public Navbar & Homepage Separation
- **Strict UI Rule Enforced**: The **Login** and **Create Account** actions appear **only in the top-right navbar**.
- The homepage **"WHO ARE YOU?"** section displays two cards:
  - **Patient Card**: Features breakdown + *"Explore Patient Portal"* button (strictly no login forms inside cards).
  - **Doctor Card**: Features breakdown + *"Explore Doctor Portal"* button.

### 3. Multilingual Support
Language selector supports:
- **English**
- **हिन्दी (Hindi)**
- **తెలుగు (Telugu)**
Controls UI labels, AI interview questions, and speech recognition accents.

### 4. Mandatory Pre-Interview Patient Consent
Before the AI Health Check-Up begins, a legal consent gate appears:
- Informs the patient that data is collected solely to build a structured health summary.
- The continue button remains **disabled** until the checkbox *"I understand and consent to continue"* is checked.
- Consent timestamp and client IP are stored in the backend database.

### 5. AI Health Check-Up (Text + Voice)
- **Natural Language Input**: Patient describes symptoms freely (e.g. *"I have chest pain since yesterday and feel short of breath"*).
- **Voice Mode**: Integrates browser **Web Speech API** for speech-to-text with live sound-wave visualizer and **SpeechSynthesis** text-to-speech feedback.
- **Adaptive Questions**: Formulates follow-up queries based on previous answers (onset, severity, radiation, daily medications).
- **Handles Hesitation Gracefully**: Recognizes *"I don't know"*, *"I'm not sure"*, or *"I don't remember"* without repeating or forcing answers.
- **Rule-Based Red-Flag Screening**: Immediate alert triggers for acute chest pain, severe dyspnea, loss of consciousness, or anaphylaxis:
  > **⚠ HIGH PRIORITY**: *Some symptoms you described may require urgent medical attention. Please contact hospital/emergency staff immediately.*
- **Non-Diagnostic Disclaimer**: Explicitly states specialty suggestion, never claiming an autonomous medical diagnosis.

### 6. Medical Document Upload & Camera Scanner
- **Device Upload**: Supports PDF reports, PNG, JPG, and WEBP files.
- **Live Camera Scanner**: Uses browser `navigator.mediaDevices.getUserMedia` with real-time video feed, document frame guide, capture, retake, and use scan.
- **OCR Pipeline & Entity Extraction**:
  - Extracts lab tests, values, units, reference ranges, and medications.
  - Generates confidence score (e.g., **78% for handwritten prescriptions**, 92% for printed lab reports).
- **Human-in-the-Loop OCR Review**:
  - Displays advisory: *"Please verify extracted information."*
  - Patient can **Edit**, **Delete**, **Correct**, or **Add** test rows before confirming and adding to the health summary.

### 7. Longitudinal Health Timeline
- Chronological timeline tracking:
  - `2024`: Blood Test (Comprehensive Metabolic Panel & CBC)
  - `2025`: Outpatient Cardiology Review & Prescription
  - `2026`: AI Health Check-Up Triage Session

### 8. Patient-Choice Doctor Selection
- AI suggests an appropriate department (e.g. **Cardiology**), but the **patient explicitly chooses** their doctor from a searchable directory.
- Patient reviews the doctor's name, specialization, and demo registration number, grants sharing consent, and dispatches the health summary.

### 9. Doctor Clinical Station & Digital Prescription
- **Doctor Dossier Review**: View patient vitals, AI interview transcript, extracted lab reports, timeline, and red flags.
- **Doctor Edits & Clinical Notes**: Doctor can edit the summary and enter clinical impressions.
- **Review Confirmation Stamp**: Applies **"✓ Doctor Reviewed"** badge with doctor name, license number, and timestamp.
- **110+ Medicine Catalog**: Instant live search by brand name, generic substance, form, or therapeutic class.
- **Digital Prescription Builder**: Multi-medicine builder with dosage, frequency, duration, instructions, and timing checkboxes (**Morning / Afternoon / Night**).
- **Visual Medicine Schedule**: Generates a clear schedule for the patient (e.g., *Medicine A: Morning ✓, Afternoon —, Night ✓*).
- **Printable Official Prescription**: Formatted digital prescription document with hospital header, Rx symbol, license number, patient details, QR verification code, and print/download actions.

---

## 🌐 Standards & Interoperability (No Fake Claims)

| Standard / System | Implementation Status | Prototype Transparency Notice |
| :--- | :--- | :--- |
| **ABDM (M1)** | Prototype / Demo Mode | Simulates ABHA ID creation and OTP verification using Demo OTP (`123456`). No real Aadhaar servers contacted. |
| **ABDM (M2)** | Prototype / Demo Mode | Simulates Health Information Provider (HIP) FHIR bundle staging for national gateway dispatch. |
| **ABDM (M3)** | Prototype / Demo Mode | Generates electronic consent request artifacts for Health Information User (HIU) record exchange. |
| **HL7 FHIR R4** | Complete Architecture | Generates compliant FHIR R4 Bundles mapping `Patient`, `Practitioner`, `Condition`, `Observation`, and `MedicationRequest`. |
| **Hospital HIS / EMR** | Demo Mode | Simulates dispatching admission tickets to hospital OPD queues and pulling historical hospital encounters. |

---

## 🔌 Complete REST API Structure

### Authentication
- `POST /api/auth/register/patient` - Register new patient with password hashing
- `POST /api/auth/register/doctor` - Register new doctor with license and specialty
- `POST /api/auth/login` - Phone + password authentication (JWT issue)
- `GET /api/auth/me` - Retrieve current session user & profile
- `POST /api/auth/logout` - Invalidate session

### Patient Endpoints (Requires Patient Role)
- `GET /api/patients/me` - Get patient profile
- `PUT /api/patients/me` - Update vitals (blood group, weight, height)
- `POST /api/patients/consent` - Store informed consent record
- `POST /api/patients/interview/start` - Initiate AI check-up session
- `POST /api/patients/interview/:id/answer` - Submit natural language response (text/voice)
- `POST /api/patients/interview/:id/summary` - Compile structured health summary
- `POST /api/patients/documents/upload` - Upload document (Multer)
- `GET /api/patients/documents` - List uploaded medical documents
- `POST /api/patients/documents/:id/ocr` - Run OCR extraction on document
- `PUT /api/patients/documents/extractions/:id/review` - Confirm & verify extracted entities
- `GET /api/patients/timeline` - Retrieve longitudinal care history
- `GET /api/patients/prescriptions` - List patient prescriptions
- `POST /api/patients/aadhaar/demo-verify` - Simulate Aadhaar/ABHA verification

### Doctor Endpoints (Requires Doctor Role)
- `GET /api/doctors` - Searchable doctor directory (Public/Patient)
- `GET /api/doctors/:id` - Doctor profile details
- `POST /api/doctors/requests` - Patient dispatches request to doctor
- `GET /api/doctors/portal/requests` - Doctor view of incoming patient queue
- `GET /api/doctors/portal/requests/:id` - Complete patient clinical dossier
- `PUT /api/doctors/portal/summaries/:id` - Edit summary & add notes
- `POST /api/doctors/portal/confirm-review/:requestId` - Apply **✓ Doctor Reviewed** stamp

### Medicines & Prescriptions
- `GET /api/medicines` - Search 110+ medicine catalog (`?search=&category=&form=`)
- `GET /api/medicines/:id` - Medicine details
- `POST /api/prescriptions` - Doctor generates digital prescription
- `GET /api/prescriptions` - List prescriptions for authenticated user
- `GET /api/prescriptions/:id` - Single prescription detail with visual schedule

### Integrations
- `GET /api/integrations/abdm/status` - ABDM sandbox system status
- `POST /api/integrations/abdm/connect` - Simulate ABHA address linking
- `POST /api/integrations/abdm/share` - Simulate FHIR record share
- `GET /api/integrations/fhir/bundle/:patientId?` - Generate exportable HL7 FHIR R4 Bundle
- `GET /api/integrations/his/status` - Hospital Information System gateway status
- `GET /api/integrations/his/records` - Simulate fetching hospital EMR records
- `POST /api/integrations/his/triage` - Push OPD triage queue ticket

---

## 🔒 Security & Healthcare Privacy
- **Bcrypt Password Hashing**: Passwords are never stored as plain text.
- **Stateless JWT Authentication**: Tokens passed via `Authorization: Bearer <token>` headers.
- **Strict Role-Based Access Control (RBAC)**: Enforced in backend middleware (`requireRole('patient')`, `requireRole('doctor')`). Patients cannot access doctor queues; doctors cannot access unassigned patients.
- **Input & File Validation**: Multer file filter restricts uploads to legitimate document mimetypes (PDF, JPG, PNG, WEBP) with a 10MB size limit.
- **Privacy-By-Design**: Health summaries are drafted locally and only transmitted to a doctor after explicit patient consent.

---

## 👥 Hackathon Team & Acknowledgements
Developed with pride for the **Smart India Hackathon (SIH)**. MediKiosk empowers healthcare facilities to optimize patient throughput, eliminate paper record loss, and improve clinical diagnostic accuracy while maintaining complete patient agency and privacy.
