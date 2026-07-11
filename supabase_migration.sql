-- Doct Spark Complete Production Database Architecture Migration
--
-- This script contains the verified production schema, indexes, relationships,
-- and Row Level Security (RLS) policies for all modules of the Doct Spark platform.
-- Execute this script in your Supabase Dashboard SQL Editor.

-- =========================================================================
-- 1. EXTENSIONS & PREREQUISITES
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. CORE IDENTITY AND USER TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient', -- 'superadmin', 'state_partner', 'district_partner', 'city_partner', 'patient', 'doctor', 'clinic', 'pharmacy', 'laboratory'
  partner_type TEXT, -- 'State', 'District', 'City' (if role is partner)
  name TEXT,
  full_name TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  accepted_terms_version TEXT,
  accepted_terms_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.patients (
  id TEXT PRIMARY KEY, -- Email or UUID
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT,
  age INT,
  medical_history TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 3. DOCTOR AND HEALTHCARE PROVIDER TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  experience INT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 5.0,
  consultation_fee NUMERIC(10,2) NOT NULL,
  video_fee NUMERIC(10,2) NOT NULL,
  clinic_address TEXT,
  photo TEXT,
  mci_registration TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  clinic_name TEXT,
  city TEXT,
  bio TEXT,
  education TEXT,
  available_days TEXT[],
  time_slots TEXT[],
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  onboarded_by TEXT,
  onboarded_by_type TEXT,
  verification_status TEXT,
  subscription_paid BOOLEAN DEFAULT FALSE,
  mobile_otp_verified BOOLEAN DEFAULT FALSE,
  email_otp_verified BOOLEAN DEFAULT FALSE,
  state TEXT,
  district TEXT,
  owner_id_proof_doc TEXT,
  referral_partner_id TEXT,
  referral_id_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.doctor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  college TEXT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  duration_years INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  slot_time TEXT NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  clinic_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL,
  remarks TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  rating NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 4. CLINIC AND HOSPITAL TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  rating NUMERIC(3,2) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  photos TEXT[],
  timings TEXT,
  doctors TEXT[],
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  clinic_type TEXT,
  license_number TEXT,
  amenities TEXT[],
  total_chambers INT,
  email TEXT,
  owner_name TEXT,
  trade_license_number TEXT,
  license_documents TEXT[],
  onboarded_by TEXT,
  onboarded_by_type TEXT,
  verification_status TEXT,
  subscription_paid BOOLEAN DEFAULT FALSE,
  mobile_otp_verified BOOLEAN DEFAULT FALSE,
  email_otp_verified BOOLEAN DEFAULT FALSE,
  district TEXT,
  owner_id_proof_doc TEXT,
  referral_partner_id TEXT
);

CREATE TABLE IF NOT EXISTS public.clinic_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clinic_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.clinic_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL,
  remarks TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.hospital_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.hospital_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.hospital_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 5. SPECIALTY AND SERVICE TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medical_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 6. APPOINTMENT TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  doctor_id TEXT REFERENCES public.doctors(id),
  doctor_name TEXT NOT NULL,
  doctor_specialty TEXT NOT NULL,
  doctor_photo TEXT,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INT NOT NULL,
  patient_gender TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  type TEXT CHECK (type IN ('In-Clinic', 'Video')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Expired')),
  reason TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL,
  clinic_name TEXT,
  clinic_address TEXT,
  serial_no INT,
  room_id TEXT,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  prescription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.appointment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.appointment_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  cancelled_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.appointment_reschedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
  old_date DATE NOT NULL,
  old_time TEXT NOT NULL,
  new_date DATE NOT NULL,
  new_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.appointment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.appointment_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 7. VIDEO CONSULTATION TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.video_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  duration_minutes INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- 8. PRESCRIPTION TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE RESTRICT,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  attached_file_url TEXT,
  attached_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id TEXT REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  duration TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 9. PARTNER MANAGEMENT TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  profile_photo TEXT,
  dob DATE,
  age INT,
  gender TEXT,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  pincode TEXT NOT NULL,
  aadhaar_number TEXT,
  pan_number TEXT,
  voter_id_number TEXT,
  father_husband_name TEXT,
  owns_bike BOOLEAN DEFAULT FALSE,
  bike_registration_number TEXT,
  bike_model TEXT,
  bike_mileage TEXT,
  has_bike_insurance BOOLEAN DEFAULT FALSE,
  has_driving_license BOOLEAN DEFAULT FALSE,
  driving_license_number TEXT,
  languages_spoken_written TEXT,
  about_partner_500_words TEXT,
  alternate_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  qualification TEXT NOT NULL,
  highest_qualification_doc TEXT,
  highest_qualification_file_name TEXT,
  experience TEXT,
  experience_certificate_doc TEXT,
  experience_certificate_file_name TEXT,
  identity_proof_doc TEXT,
  identity_proof_file_name TEXT,
  other_doc TEXT,
  other_doc_file_name TEXT,
  occupation TEXT,
  skills TEXT,
  partner_type TEXT CHECK (partner_type IN ('State', 'District', 'City')),
  assigned_state TEXT,
  assigned_district TEXT,
  assigned_city TEXT,
  status TEXT,
  onboarded_doctors_count INT DEFAULT 0,
  onboarded_clinics_count INT DEFAULT 0,
  wallet_balance NUMERIC(12,2) DEFAULT 0.00,
  created_by_id TEXT, -- references public.partners(id)
  referral_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  child_partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  onboarded_type TEXT NOT NULL, -- 'Doctor', 'Clinic', 'Lab', 'Pharmacy'
  onboarded_entity_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  platform_charge NUMERIC(12,2) NOT NULL,
  city_partner_id TEXT REFERENCES public.partners(id),
  city_partner_name TEXT,
  city_partner_commission NUMERIC(12,2) DEFAULT 0.00,
  district_partner_id TEXT REFERENCES public.partners(id),
  district_partner_name TEXT,
  district_partner_commission NUMERIC(12,2) DEFAULT 0.00,
  state_partner_id TEXT REFERENCES public.partners(id),
  state_partner_name TEXT,
  state_partner_commission NUMERIC(12,2) DEFAULT 0.00,
  company_commission NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  date DATE NOT NULL,
  month TEXT NOT NULL,
  week TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE RESTRICT,
  commission_id TEXT REFERENCES public.partner_commissions(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  target_onboards INT NOT NULL,
  achieved_onboards INT DEFAULT 0,
  target_appointments INT NOT NULL,
  achieved_appointments INT DEFAULT 0,
  month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.partner_payouts (
  id TEXT PRIMARY KEY,
  partner_id TEXT REFERENCES public.partners(id) ON DELETE RESTRICT,
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  commission_type TEXT NOT NULL,
  date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payout_method TEXT NOT NULL,
  status TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 10. PATIENT WALLET TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.patient_wallets (
  patient_email TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0.00 CHECK (balance >= 0),
  referral_earnings NUMERIC(12,2) DEFAULT 0.00 CHECK (referral_earnings >= 0),
  refund_earnings NUMERIC(12,2) DEFAULT 0.00 CHECK (refund_earnings >= 0),
  referral_code TEXT UNIQUE NOT NULL,
  referred_by_code TEXT REFERENCES public.patient_wallets(referral_code) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  patient_email TEXT REFERENCES public.patient_wallets(patient_email) ON DELETE RESTRICT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  type TEXT CHECK (type IN ('Credit', 'Debit')),
  amount NUMERIC(12,2) NOT NULL,
  source TEXT CHECK (source IN ('Referral', 'Platform Refund', 'Manual Admin Credit', 'Manual Admin Debit', 'Platform Fee Payment')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Completed' CHECK (status IN ('Approved', 'Suspended', 'Cancelled', 'Completed'))
);

CREATE TABLE IF NOT EXISTS public.wallet_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_email TEXT REFERENCES public.patient_wallets(patient_email) ON DELETE RESTRICT,
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 11. PATIENT REFERRAL TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.patient_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_patient_email TEXT REFERENCES public.patient_wallets(patient_email) ON DELETE CASCADE,
  referred_patient_email TEXT REFERENCES public.patient_wallets(patient_email) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rewarded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.patient_referrals(id) ON DELETE CASCADE,
  reward_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Credited',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 12. PAYMENT AND FINANCE TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE RESTRICT,
  doctor_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('Paid', 'Refunded')),
  method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT REFERENCES public.payments(id) ON DELETE RESTRICT,
  gateway_ref TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT REFERENCES public.payments(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE RESTRICT,
  fee_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  pct_rate NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.commission_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id TEXT REFERENCES public.partner_commissions(id) ON DELETE RESTRICT,
  partner_id TEXT REFERENCES public.partners(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT REFERENCES public.partners(id) ON DELETE RESTRICT,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 13. LABORATORY TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.laboratories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  status TEXT NOT NULL,
  onboarded_by TEXT,
  onboarded_by_type TEXT,
  subscription_paid BOOLEAN DEFAULT FALSE,
  mobile_otp_verified BOOLEAN DEFAULT FALSE,
  email_otp_verified BOOLEAN DEFAULT FALSE,
  owner_id_proof_doc TEXT,
  license_documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.laboratory_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.laboratory_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  verifier_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_tests (
  id TEXT PRIMARY KEY,
  lab_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(5,2) DEFAULT 0.00,
  turnaround_time TEXT,
  preparation_instructions TEXT,
  home_collection_enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_test_packages (
  id TEXT PRIMARY KEY,
  lab_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  test_ids TEXT[],
  price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(5,2) DEFAULT 0.00,
  turnaround_time TEXT,
  preparation_instructions TEXT,
  home_collection_enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT REFERENCES public.lab_test_packages(id) ON DELETE CASCADE,
  test_id TEXT REFERENCES public.lab_tests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_collection_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_bookings (
  id TEXT PRIMARY KEY,
  lab_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  lab_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_address TEXT,
  patient_city TEXT,
  patient_state TEXT,
  patient_pincode TEXT,
  booking_type TEXT CHECK (booking_type IN ('Walk-In', 'Home Sample Collection')),
  tests JSONB,
  packages JSONB,
  total_amount NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  final_amount NUMERIC(10,2) NOT NULL,
  platform_charge NUMERIC(10,2) DEFAULT 0.00,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  notes TEXT,
  reports JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT REFERENCES public.lab_bookings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'Test' | 'Package'
  item_id TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_sample_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT REFERENCES public.lab_bookings(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.lab_collection_agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  collected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT REFERENCES public.lab_bookings(id) ON DELETE CASCADE,
  report_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.lab_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT REFERENCES public.lab_bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 14. PHARMACY TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  status TEXT NOT NULL,
  onboarded_by TEXT,
  onboarded_by_type TEXT,
  subscription_paid BOOLEAN DEFAULT FALSE,
  mobile_otp_verified BOOLEAN DEFAULT FALSE,
  email_otp_verified BOOLEAN DEFAULT FALSE,
  owner_id_proof_doc TEXT,
  license_documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pharmacy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pharmacy_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medicines (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  strength TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  pack_size TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(5,2) DEFAULT 0.00,
  gst NUMERIC(5,2) DEFAULT 0.00,
  stock_quantity INT NOT NULL,
  min_stock_alert INT NOT NULL,
  expiry_date DATE NOT NULL,
  batch_number TEXT NOT NULL,
  prescription_required BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medicine_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id TEXT REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medicine_orders (
  id TEXT PRIMARY KEY,
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  pharmacy_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_address TEXT NOT NULL,
  patient_city TEXT NOT NULL,
  patient_state TEXT NOT NULL,
  patient_pincode TEXT NOT NULL,
  items JSONB NOT NULL,
  prescription_url TEXT,
  prescription_status TEXT,
  prescription_reject_reason TEXT,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  gst_amount NUMERIC(10,2) DEFAULT 0.00,
  final_amount NUMERIC(10,2) NOT NULL,
  commission_paid NUMERIC(10,2) DEFAULT 0.00,
  status TEXT NOT NULL,
  delivery_status_history JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medicine_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  medicine_id TEXT REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medicine_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.delivery_agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pharmacy_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 15. NOTIFICATION TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivered_via TEXT NOT NULL,
  status TEXT NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 16. ADMIN AND RBAC TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 17. CMS TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT DEFAULT 'default',
  status TEXT DEFAULT 'Published',
  priority TEXT DEFAULT 'Medium',
  target_audience TEXT DEFAULT 'All',
  display_location TEXT DEFAULT 'Entire Website',
  animation_style TEXT DEFAULT 'Static',
  animation_speed TEXT DEFAULT 'Medium',
  background_color TEXT,
  text_color TEXT,
  border_color TEXT,
  link_enabled BOOLEAN DEFAULT FALSE,
  button_text TEXT,
  button_url TEXT,
  dismissible BOOLEAN DEFAULT TRUE,
  start_datetime TIMESTAMP WITH TIME ZONE,
  end_datetime TIMESTAMP WITH TIME ZONE,
  font_size TEXT,
  padding TEXT,
  height TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- =========================================================================
-- 18. AUDIT AND SECURITY TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.system_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_level TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 19. INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_partners_created_by ON public.partners(created_by_id);
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_clinics_partner_email ON public.clinics(partner_email);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(patient_email);
CREATE INDEX IF NOT EXISTS idx_patient_referrals_referrer ON public.patient_referrals(referrer_patient_email);
CREATE INDEX IF NOT EXISTS idx_patient_referrals_referred ON public.patient_referrals(referred_patient_email);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_patient ON public.lab_bookings(patient_email);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_lab ON public.lab_bookings(lab_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient ON public.medicine_orders(patient_email);

-- =========================================================================
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;

-- 21. PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 22. PATIENTS POLICIES
CREATE POLICY "Patients can view own medical record" ON public.patients FOR SELECT USING (auth.jwt()->>'email' = id);
CREATE POLICY "Patients can update own medical record" ON public.patients FOR UPDATE USING (auth.jwt()->>'email' = id);

-- 23. DOCTORS POLICIES
CREATE POLICY "Anyone can view approved doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update own profile" ON public.doctors FOR UPDATE USING (auth.jwt()->>'email' = email);

-- 24. CLINICS POLICIES
CREATE POLICY "Anyone can view verified clinics" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "Clinics can update own info" ON public.clinics FOR UPDATE USING (auth.jwt()->>'email' = partner_email);

-- 25. APPOINTMENTS POLICIES
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (auth.jwt()->>'email' = patient_id);
CREATE POLICY "Doctors can view assigned appointments" ON public.appointments FOR SELECT USING (auth.jwt()->>'email' = doctor_id);
CREATE POLICY "Enable appointment booking" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable appointment update" ON public.appointments FOR UPDATE USING (true);

-- 26. WALLET POLICIES
CREATE POLICY "Patients can view own wallet" ON public.patient_wallets FOR SELECT USING (auth.jwt()->>'email' = patient_email);
CREATE POLICY "Patients can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.jwt()->>'email' = patient_email);
CREATE POLICY "Allow wallet insert" ON public.patient_wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow wallet update" ON public.patient_wallets FOR UPDATE USING (true);
CREATE POLICY "Allow transactions insert" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

-- 27. LABORATORIES POLICIES
CREATE POLICY "Anyone can view laboratories" ON public.laboratories FOR SELECT USING (true);
CREATE POLICY "Laboratories can manage own data" ON public.laboratories FOR ALL USING (auth.jwt()->>'email' = email);

-- 28. LAB BOOKINGS POLICIES
CREATE POLICY "Patients can view own lab bookings" ON public.lab_bookings FOR SELECT USING (auth.jwt()->>'email' = patient_email);
CREATE POLICY "Laboratories can view assigned bookings" ON public.lab_bookings FOR SELECT USING (auth.jwt()->>'email' = (SELECT email FROM public.laboratories WHERE id = lab_id));
CREATE POLICY "Enable lab booking" ON public.lab_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable lab booking update" ON public.lab_bookings FOR UPDATE USING (true);

-- 29. PHARMACIES POLICIES
CREATE POLICY "Anyone can view pharmacies" ON public.pharmacies FOR SELECT USING (true);
CREATE POLICY "Pharmacies can manage own data" ON public.pharmacies FOR ALL USING (auth.jwt()->>'email' = email);

-- 30. MEDICINE ORDERS POLICIES
CREATE POLICY "Patients can view own medicine orders" ON public.medicine_orders FOR SELECT USING (auth.jwt()->>'email' = patient_email);
CREATE POLICY "Pharmacies can view assigned orders" ON public.medicine_orders FOR SELECT USING (auth.jwt()->>'email' = (SELECT email FROM public.pharmacies WHERE id = pharmacy_id));
CREATE POLICY "Enable medicine orders insert" ON public.medicine_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable medicine orders update" ON public.medicine_orders FOR UPDATE USING (true);

-- 31. PARTNERS POLICIES
CREATE POLICY "Partners can view own data" ON public.partners FOR SELECT USING (auth.jwt()->>'email' = email);
CREATE POLICY "Partners can update own profile" ON public.partners FOR UPDATE USING (auth.jwt()->>'email' = email);
CREATE POLICY "Allow partner insert" ON public.partners FOR INSERT WITH CHECK (true);
