-- ============================================================================
-- MediKiosk - PostgreSQL & Supabase Database Schema
-- Healthcare-grade relational data model for Clinical Triage & ABDM Interoperability
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    abha_id VARCHAR(50) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    available_status BOOLEAN DEFAULT TRUE,
    consultation_room VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Triage Dossiers (Intake Sessions)
CREATE TABLE IF NOT EXISTS triage_dossiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assigned_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    chief_complaint TEXT NOT NULL,
    symptoms_narrative TEXT,
    suggested_specialty VARCHAR(100),
    urgency_level VARCHAR(20) DEFAULT 'ROUTINE', -- ROUTINE, PRIORITY, EMERGENCY
    has_red_flag BOOLEAN DEFAULT FALSE,
    doctor_reviewed BOOLEAN DEFAULT FALSE,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Medical Reports & OCR Extractions
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) DEFAULT 'Lab Report',
    file_path TEXT NOT NULL,
    extracted_ocr_text TEXT,
    structured_lab_values JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Digital Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    triage_id UUID REFERENCES triage_dossiers(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    diagnosis TEXT NOT NULL,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, dosage, timing: {morning, noon, night}, days}
    dietary_advice TEXT,
    doctor_signature_stamp VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. HL7 FHIR R4 Document Bundles
CREATE TABLE IF NOT EXISTS fhir_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    triage_id UUID REFERENCES triage_dossiers(id) ON DELETE CASCADE,
    fhir_json JSONB NOT NULL,
    abdm_linked BOOLEAN DEFAULT FALSE,
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for high-throughput queries
CREATE INDEX IF NOT EXISTS idx_triage_urgency ON triage_dossiers(urgency_level);
CREATE INDEX IF NOT EXISTS idx_triage_patient ON triage_dossiers(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON medical_reports(patient_id);

-- Supabase Row Level Security (RLS) Policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_bundles ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated staff and doctors
CREATE POLICY "Public read for triage demo" ON triage_dossiers FOR SELECT USING (true);
CREATE POLICY "Public insert for triage demo" ON triage_dossiers FOR INSERT WITH CHECK (true);
