-- ============================================================================
-- MediKiosk - Supabase & PostgreSQL Production Database Setup
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Provisions all relational tables, JSONB clinical data stores, indexes, and RLS policies.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Core authentication & login for Patients, Doctors, and Staff)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash TEXT NOT NULL,
    op_number VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'patient', -- 'patient', 'doctor', 'staff', 'admin'
    age INT,
    gender VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patient Profiles Table
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    abha_id VARCHAR(50),
    age INT,
    gender VARCHAR(20),
    blood_group VARCHAR(20) DEFAULT 'Not specified',
    weight NUMERIC(5, 2),
    height NUMERIC(5, 2),
    preferred_language VARCHAR(10) DEFAULT 'en',
    op_number VARCHAR(50),
    allergies JSONB DEFAULT '[]'::jsonb,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctor Profiles Table
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    department VARCHAR(150) DEFAULT 'General Medicine',
    phone_number VARCHAR(50),
    hospital_affiliation VARCHAR(255) DEFAULT 'MediKiosk Apex Hospital',
    consultation_room VARCHAR(50) DEFAULT 'Room 101',
    experience_years INT DEFAULT 5,
    available_status BOOLEAN DEFAULT TRUE,
    qualifications JSONB DEFAULT '["MBBS", "MD"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Health Interviews Table (AI Kiosk Chat & Vocal Intake Sessions)
CREATE TABLE IF NOT EXISTS public.health_interviews (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    chief_complaint TEXT,
    responses JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'CONFIRMED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Health Summaries Table (Clinical Triage Dossiers, Vitals, Findings & Reports)
CREATE TABLE IF NOT EXISTS public.health_summaries (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    op_number VARCHAR(50),
    interview_id TEXT,
    chief_complaint TEXT,
    symptoms_narrative TEXT,
    suggested_specialty VARCHAR(150),
    urgency_level VARCHAR(50) DEFAULT 'ROUTINE', -- 'ROUTINE', 'PRIORITY', 'EMERGENCY'
    has_red_flag BOOLEAN DEFAULT FALSE,
    red_flags JSONB DEFAULT '[]'::jsonb,
    vitals JSONB DEFAULT '{}'::jsonb,
    provisional_diagnosis TEXT,
    differential_diagnoses JSONB DEFAULT '[]'::jsonb,
    lab_investigations JSONB DEFAULT '[]'::jsonb,
    pinned_reports JSONB DEFAULT '[]'::jsonb,
    clinical_report_text TEXT,
    doctor_reviewed BOOLEAN DEFAULT FALSE,
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Medical Documents Table (Uploaded Hospital Reports, Lab Slips, Prescriptions)
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    document_type VARCHAR(150) DEFAULT 'Hospital Diagnostic & Pathology Lab Report',
    title VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_name VARCHAR(255),
    file_path TEXT,
    file_type VARCHAR(100),
    file_size BIGINT,
    upload_method VARCHAR(50) DEFAULT 'device', -- 'device', 'camera'
    ocr_processed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Medical Extractions Table (OCR Extracted Clinical Text & Structured Parameters)
CREATE TABLE IF NOT EXISTS public.medical_extractions (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES public.medical_documents(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    raw_text TEXT,
    structured_data JSONB DEFAULT '{}'::jsonb,
    confidence_score INT DEFAULT 85,
    is_handwritten BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'verified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Digital Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    op_number VARCHAR(50) NOT NULL,
    triage_id TEXT,
    diagnosis TEXT NOT NULL,
    medications JSONB NOT NULL DEFAULT '[]'::jsonb,
    dietary_advice TEXT,
    doctor_signature_stamp VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Doctor Triage Requests Table (Patient & Doctor Tele-consultation queue)
CREATE TABLE IF NOT EXISTS public.doctor_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    op_number VARCHAR(50),
    summary_id TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'COMPLETED', 'DECLINED'
    urgency_level VARCHAR(50) DEFAULT 'ROUTINE',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Medical Timeline Table (Chronological Health Milestones)
CREATE TABLE IF NOT EXISTS public.medical_timeline (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    year INT DEFAULT 2026,
    event_type VARCHAR(100) NOT NULL, -- 'REGISTRATION', 'HEALTH_CHECKUP', 'LAB_TEST', 'PRESCRIPTION'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(100) DEFAULT 'SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Consents Table (ABDM Data Sharing Consent Artifacts)
CREATE TABLE IF NOT EXISTS public.consents (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    purpose VARCHAR(255) DEFAULT 'CLINICAL_TRIAGE_AND_CONSULTATION',
    status VARCHAR(50) DEFAULT 'GRANTED',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_health_summaries_patient ON public.health_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_extractions_doc ON public.medical_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_requests_patient ON public.doctor_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_requests_doc ON public.doctor_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_timeline_patient ON public.medical_timeline(patient_id);

-- Enable Supabase Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- Allow public access for backend API service operations
CREATE POLICY "Full access for API service on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on patient_profiles" ON public.patient_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on doctor_profiles" ON public.doctor_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on health_interviews" ON public.health_interviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on health_summaries" ON public.health_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on medical_documents" ON public.medical_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on medical_extractions" ON public.medical_extractions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on doctor_requests" ON public.doctor_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on medical_timeline" ON public.medical_timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full access for API service on consents" ON public.consents FOR ALL USING (true) WITH CHECK (true);

-- End of Supabase Setup Script
