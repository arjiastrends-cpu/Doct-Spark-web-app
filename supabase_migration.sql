-- =========================================================================
-- DOCT SPARK - ENTERPRISE HEALTHCARE MARKETPLACE DATABASE SCHEMA
-- =========================================================================
-- Author: Senior PostgreSQL Database Architect & Supabase Expert
-- Description: Complete production-ready PostgreSQL database structure designed
--              for enterprise-grade scalability, concurrency control, data integrity,
--              auditing, and Supabase Row Level Security (RLS).
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing definitions if executing as a fresh migration
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- =========================================================================
-- SECTION 1: AUTHENTICATION & CORE PROFILES
-- =========================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY, -- References auth.users(id) in Supabase
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('superadmin', 'doctor', 'clinic', 'partner', 'patient', 'staff', 'lab', 'pharmacy', 'physio')),
  name TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'PendingVerification')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  sms_notifications BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- =========================================================================
-- SECTION 2: ROLE-BASED ACCESS CONTROL (RBAC)
-- =========================================================================

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'user:create', 'appointment:cancel'
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.user_role_assignments (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- =========================================================================
-- SECTION 3: PATIENT ENTITY & CLINICAL RECORDS
-- =========================================================================

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.patient_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  chronic_diseases TEXT[],
  past_surgeries TEXT,
  family_medical_history TEXT,
  allergies TEXT[],
  smoking_status TEXT,
  alcohol_consumption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.patient_vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  systolic_bp INT,
  diastolic_bp INT,
  pulse_rate INT,
  temperature NUMERIC(4,2),
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  spo2 INT,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- =========================================================================
-- SECTION 4: HEALTHCARE PROVIDERS
-- =========================================================================

CREATE TABLE public.doctors (
  id TEXT PRIMARY KEY, -- doc-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience_years INT NOT NULL,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  qualification TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  bio TEXT,
  approved BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.clinics (
  id TEXT PRIMARY KEY, -- c-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- Default 5% platform charge
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.hospitals (
  id TEXT PRIMARY KEY, -- hosp-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  beds_count INT,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.laboratories (
  id TEXT PRIMARY KEY, -- lab-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.pharmacies (
  id TEXT PRIMARY KEY, -- pharm-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  license_number TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.physiotherapy_centers (
  id TEXT PRIMARY KEY, -- physio-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- =========================================================================
-- SECTION 5: VERIFICATION & AUDITING
-- =========================================================================

CREATE TABLE public.doctor_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g., 'Medical License', 'Id Proof'
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  remarks TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.clinic_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id TEXT REFERENCES public.clinics(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  remarks TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.lab_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id TEXT REFERENCES public.laboratories(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  remarks TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.pharmacy_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id TEXT REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  remarks TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.physio_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  physio_id TEXT REFERENCES public.physiotherapy_centers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  remarks TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 6: BUSINESS PARTNERS & TERRITORIES
-- =========================================================================

CREATE TABLE public.partners (
  id TEXT PRIMARY KEY, -- partner-XXXX format
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('State', 'District', 'City')),
  assigned_state TEXT NOT NULL,
  assigned_district TEXT,
  assigned_city TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.partner_hierarchy (
  parent_partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  child_partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_partner_id, child_partner_id),
  CONSTRAINT self_hierarchy_check CHECK (parent_partner_id <> child_partner_id)
);

CREATE TABLE public.partner_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Stored as first of month e.g., '2026-07-01'
  target_onboard_doctors INT DEFAULT 0,
  target_onboard_clinics INT DEFAULT 0,
  target_revenue NUMERIC(12,2) DEFAULT 0.00,
  actual_onboard_doctors INT DEFAULT 0,
  actual_onboard_clinics INT DEFAULT 0,
  actual_revenue NUMERIC(12,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'In-Progress' CHECK (status IN ('In-Progress', 'Achieved', 'Missed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.partner_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  payout_cycle_start DATE NOT NULL,
  payout_cycle_end DATE NOT NULL,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  platform_charges NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  net_payable NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Cleared', 'Failed')),
  cleared_at TIMESTAMPTZ,
  transaction_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 7: STAFF MANAGEMENT
-- =========================================================================

CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('superadmin', 'clinic', 'hospital', 'lab', 'pharmacy', 'physio')),
  tenant_id TEXT NOT NULL, -- references the specific entity id dynamically
  designation TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.staff_permissions (
  staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  PRIMARY KEY (staff_id, permission_code)
);

-- =========================================================================
-- SECTION 8: APPOINTMENTS & SCHEDULING
-- =========================================================================

CREATE TABLE public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_appointments INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.appointments (
  id TEXT PRIMARY KEY, -- apt-XXXX format
  patient_id TEXT NOT NULL, -- client-side unique identifier (email or key)
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  clinic_id TEXT REFERENCES public.clinics(id) ON DELETE SET NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time_slot TEXT NOT NULL, -- e.g., "10:00 AM - 10:30 AM"
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INT NOT NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('Physical', 'Video', 'Chat')),
  fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Booked' CHECK (status IN ('Booked', 'Confirmed', 'Completed', 'Cancelled', 'NoShow')),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded', 'Failed')),
  serial_no INT,
  room_id TEXT, -- For physical or virtual workspace
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.video_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  meeting_link TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.consultation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  symptoms TEXT,
  diagnosis TEXT,
  clinical_remarks TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 9: MEDICAL RECORDS & PRESCRIPTIONS
-- =========================================================================

CREATE TABLE public.prescriptions (
  id TEXT PRIMARY KEY, -- prsc-XXXX format
  appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  diagnoses TEXT[],
  advice TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id TEXT NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- e.g. '1-0-1'
  frequency TEXT NOT NULL, -- e.g. 'After Meals'
  duration TEXT NOT NULL, -- e.g. '5 Days'
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.lab_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL,
  laboratory_id TEXT REFERENCES public.laboratories(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  report_file_url TEXT NOT NULL,
  findings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 10: WALLETS, REFERRALS & OFFERS
-- =========================================================================

CREATE TABLE public.patient_wallets (
  patient_email TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  referral_earnings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  refund_earnings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by_code TEXT REFERENCES public.patient_wallets(referral_code) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.wallet_transactions (
  id TEXT PRIMARY KEY, -- wt-XXXX format
  patient_email TEXT NOT NULL REFERENCES public.patient_wallets(patient_email) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Credit', 'Debit')),
  amount NUMERIC(12,2) NOT NULL,
  source TEXT NOT NULL, -- e.g. 'Referral', 'Platform Refund', 'Appointment Booking'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.patient_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_patient_email TEXT NOT NULL REFERENCES public.patient_wallets(patient_email) ON DELETE CASCADE,
  referred_patient_email TEXT NOT NULL REFERENCES public.patient_wallets(patient_email) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Rewarded', 'Expired')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_referral_connection UNIQUE (referrer_patient_email, referred_patient_email)
);

CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES public.patient_referrals(id) ON DELETE CASCADE,
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Credited' CHECK (status IN ('Pending', 'Credited', 'Void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.partner_commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_type TEXT NOT NULL UNIQUE CHECK (partner_type IN ('State', 'District', 'City')),
  default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.partner_commission_records (
  id TEXT PRIMARY KEY, -- comm-XXXX format
  partner_id TEXT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  platform_charge NUMERIC(10,2) NOT NULL,
  net_commission NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Subscription', 'Appointment', 'Other')),
  source_id TEXT NOT NULL, -- references the appt_id or transaction_id dynamically
  source_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Cleared', 'Reversed')),
  cleared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_partner_commission_source UNIQUE (type, source_id)
);

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('Doctor', 'Clinic', 'Partner', 'Lab', 'Pharmacy')),
  recipient_id TEXT NOT NULL, -- references doctors(id), clinics(id), partners(id), etc.
  amount NUMERIC(12,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Successful', 'Failed')),
  transaction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 11: SUBSCRIPTIONS & FINANCIAL BILLING
-- =========================================================================

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('Starter', 'Growth', 'Enterprise')),
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  features TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  tenant_type TEXT NOT NULL CHECK (tenant_type IN ('Doctor', 'Clinic', 'Hospital', 'Lab', 'Pharmacy')),
  tenant_id TEXT NOT NULL, -- References doc-XXX, c-XXX, hosp-XXX etc.
  billing_cycle TEXT NOT NULL DEFAULT 'Monthly' CHECK (billing_cycle IN ('Monthly', 'Yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'PastDue', 'Cancelled', 'Expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.payments (
  id TEXT PRIMARY KEY, -- txn-XXXX format
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_gateway TEXT NOT NULL CHECK (payment_gateway IN ('Razorpay', 'Stripe', 'Wallet', 'Cash')),
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_signature TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Authorized', 'Captured', 'Refunded', 'Failed')),
  payer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.appointment_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id TEXT UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  payment_id TEXT UNIQUE NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processed', 'Failed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 12: CUSTOMER SUPPORT & TICKETS
-- =========================================================================

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Technical', 'Billing', 'Verification', 'Dispute', 'General')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In-Progress', 'Resolved', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Replied', 'Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 13: WEB CONTENT & BLOGS
-- =========================================================================

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.cms_pages (
  id TEXT PRIMARY KEY, -- e.g. 'about-us', 'privacy-policy'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.cms_page_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id TEXT NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('General', 'Doctor', 'Patient', 'Partner', 'Clinic')),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'All' CHECK (target_audience IN ('All', 'Doctors', 'Patients', 'Partners', 'Clinics')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL DEFAULT 'Home_Hero' CHECK (placement IN ('Home_Hero', 'Patient_Dashboard', 'Doctor_Dashboard', 'Sidebar')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('Doctor', 'Clinic', 'Lab', 'Pharmacy')),
  target_id TEXT NOT NULL, -- References specific doctors(id), clinics(id), etc.
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.rating_summaries (
  target_id TEXT PRIMARY KEY, -- doc-XXX or c-XXX etc.
  target_type TEXT NOT NULL CHECK (target_type IN ('Doctor', 'Clinic', 'Lab', 'Pharmacy')),
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_reviews INT NOT NULL DEFAULT 0,
  five_star_count INT NOT NULL DEFAULT 0,
  four_star_count INT NOT NULL DEFAULT 0,
  three_star_count INT NOT NULL DEFAULT 0,
  two_star_count INT NOT NULL DEFAULT 0,
  one_star_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 14: TELEMETRY, LOGS & SYSTEM
-- =========================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Alert', 'Appointment', 'Message', 'Finance', 'System')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  gateway_response TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Delivered', 'Failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  gateway_response TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Opened', 'Failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.push_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  device_token TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMPTZ
);

CREATE TABLE public.system_configuration (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'Update Doctor Verification', 'Settle Partner'
  target_table TEXT NOT NULL,
  target_id TEXT,
  original_state JSONB,
  new_state JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.system_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level TEXT NOT NULL CHECK (log_level IN ('Debug', 'Info', 'Warn', 'Error', 'Fatal')),
  category TEXT NOT NULL, -- e.g. 'Scheduler', 'Auth', 'Payment'
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 15: STORAGE INDEXING & CHATS
-- =========================================================================

CREATE TABLE public.file_storage_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.chat_participants (
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, participant_id)
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- SECTION 16: PERFORMANCE OPTIMIZATION INDEXES
-- =========================================================================

-- Profiles & Identities
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Patients & History
CREATE INDEX idx_patients_email ON public.patients(email);
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patient_vitals_patient_id ON public.patient_vitals(patient_id);

-- Healthcare Providers
CREATE INDEX idx_doctors_email ON public.doctors(email);
CREATE INDEX idx_doctors_specialization ON public.doctors(specialization);
CREATE INDEX idx_clinics_email ON public.clinics(email);
CREATE INDEX idx_clinics_city_state ON public.clinics(city, state);

-- Appointments & Scheduling
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_date_time ON public.appointments(date, time_slot);

-- Medical Records
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_prescription_items_parent ON public.prescription_items(prescription_id);

-- Finances & Wallets
CREATE INDEX idx_patient_wallets_referral ON public.patient_wallets(referral_code);
CREATE INDEX idx_wallet_txs_email ON public.wallet_transactions(patient_email);
CREATE INDEX idx_referrals_referrer ON public.patient_referrals(referrer_patient_email);
CREATE INDEX idx_referrals_referred ON public.patient_referrals(referred_patient_email);
CREATE INDEX idx_commission_records_partner ON public.partner_commission_records(partner_id);

-- System telemetry & log indexing
CREATE INDEX idx_system_activity_logs_level ON public.system_activity_logs(log_level);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);

-- =========================================================================
-- SECTION 17: ADVANCED AUTOMATIONS, TRIGGER FUNCTIONS & LEDGER LOCKS
-- =========================================================================

-- A. Idempotent User Profile Handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'name', ''),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    name = COALESCE(EXCLUDED.name, profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Concurrency Overlap Protection for Appointment Serial Numbers
ALTER TABLE public.appointments ADD CONSTRAINT unique_doctor_date_serial_no UNIQUE (doctor_id, date, serial_no);

-- C. Transaction State Machine & Row Locking
CREATE OR REPLACE FUNCTION public.process_wallet_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance NUMERIC(12,2);
BEGIN
  -- Multi-user atomic Row lock to prevent race-condition dirty reads
  SELECT balance INTO current_balance
  FROM public.patient_wallets
  WHERE patient_email = NEW.patient_email
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet profile not found for email %', NEW.patient_email;
  END IF;

  IF NEW.status = 'Completed' THEN
    IF NEW.type = 'Credit' THEN
      UPDATE public.patient_wallets
      SET 
        balance = balance + NEW.amount,
        referral_earnings = CASE WHEN NEW.source = 'Referral' THEN referral_earnings + NEW.amount ELSE referral_earnings END,
        refund_earnings = CASE WHEN NEW.source = 'Platform Refund' THEN refund_earnings + NEW.amount ELSE refund_earnings END,
        updated_at = CURRENT_TIMESTAMP
      WHERE patient_email = NEW.patient_email;
    ELSIF NEW.type = 'Debit' THEN
      IF current_balance < NEW.amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance for % (Current: %, Requested: %)', NEW.patient_email, current_balance, NEW.amount;
      END IF;

      UPDATE public.patient_wallets
      SET 
        balance = balance - NEW.amount,
        updated_at = CURRENT_TIMESTAMP
      WHERE patient_email = NEW.patient_email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_wallet_transaction_inserted
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.process_wallet_transaction();

-- D. Automated Referral Conversion Tracking Engine
CREATE OR REPLACE FUNCTION public.process_appointment_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  referred_wallet_rec RECORD;
  referrer_wallet_rec RECORD;
  successful_apts_count INT;
  reward_amt NUMERIC(10,2);
  new_reward_id UUID;
  new_tx_id TEXT;
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
    SELECT * INTO referred_wallet_rec
    FROM public.patient_wallets
    WHERE patient_email = NEW.patient_id;

    IF referred_wallet_rec IS NOT NULL AND referred_wallet_rec.referred_by_code IS NOT NULL THEN
      SELECT COUNT(*) INTO successful_apts_count
      FROM public.appointments
      WHERE patient_id = NEW.patient_id
      AND status = 'Completed'
      AND id IS DISTINCT FROM NEW.id;

      IF successful_apts_count = 0 THEN
        SELECT * INTO referrer_wallet_rec
        FROM public.patient_wallets
        WHERE referral_code = referred_wallet_rec.referred_by_code;

        IF referrer_wallet_rec IS NOT NULL THEN
          reward_amt := GREATEST(1.00, ROUND(NEW.fee * 0.01, 2));

          UPDATE public.patient_referrals
          SET status = 'Rewarded', completed_at = CURRENT_TIMESTAMP
          WHERE referrer_patient_email = referrer_wallet_rec.patient_email
          AND referred_patient_email = referred_wallet_rec.patient_email
          AND status = 'Pending';

          IF NOT FOUND THEN
            INSERT INTO public.patient_referrals (referrer_patient_email, referred_patient_email, referral_code, status, completed_at)
            VALUES (referrer_wallet_rec.patient_email, referred_wallet_rec.patient_email, referred_wallet_rec.referral_code, 'Rewarded', CURRENT_TIMESTAMP)
            RETURNING id INTO new_reward_id;
          ELSE
            SELECT id INTO new_reward_id
            FROM public.patient_referrals
            WHERE referrer_patient_email = referrer_wallet_rec.patient_email
            AND referred_patient_email = referred_wallet_rec.patient_email;
          END IF;

          INSERT INTO public.referral_rewards (referral_id, reward_amount, status)
          VALUES (new_reward_id, reward_amt, 'Credited');

          new_tx_id := 'wt-ref-' || floor(random() * 1000000)::text;
          INSERT INTO public.wallet_transactions (id, patient_email, type, amount, source, description, status)
          VALUES (
            new_tx_id,
            referrer_wallet_rec.patient_email,
            'Credit',
            reward_amt,
            'Referral',
            'Referral conversion reward: Patient ' || referred_wallet_rec.patient_name || ' completed first successful appointment ' || NEW.id || '.',
            'Completed'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_appointment_completed_referral_reward
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.process_appointment_referral_reward();

-- E. Audit ledger safety immutability locks
CREATE OR REPLACE FUNCTION public.enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'This financial or historical audit log ledger record is completely immutable. Modifying or deleting is prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER lock_payments_immutability
  BEFORE UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_immutability();

CREATE OR REPLACE TRIGGER lock_appointment_payments_immutability
  BEFORE UPDATE OR DELETE ON public.appointment_payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_immutability();

-- =========================================================================
-- SECTION 18: ROW LEVEL SECURITY policies (SECURITY HARDENING)
-- =========================================================================

-- Activate RLS on core entities
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_consultations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are visible to all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Patient Policies
CREATE POLICY "Patients can view their own record" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can edit their own record" ON public.patients FOR UPDATE USING (auth.uid() = user_id);

-- Doctors Policies
CREATE POLICY "Doctors profiles are publicly visible" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own profiles" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);

-- Clinics Policies
CREATE POLICY "Clinics profiles are publicly visible" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "Clinics can update their own details" ON public.clinics FOR UPDATE USING (auth.uid() = user_id);

-- Hospital Policies
CREATE POLICY "Hospitals details are publicly visible" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Hospitals can update their own details" ON public.hospitals FOR UPDATE USING (auth.uid() = user_id);

-- Partners Policies
CREATE POLICY "Partners can select own details" ON public.partners FOR SELECT USING (auth.jwt()->>'email' = email);
CREATE POLICY "Partners can update own records" ON public.partners FOR UPDATE USING (auth.jwt()->>'email' = email);
CREATE POLICY "Enable insert for partners registration" ON public.partners FOR INSERT WITH CHECK (true);

-- Appointments Policies
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (
    auth.jwt()->>'email' = patient_id OR 
    EXISTS (
      SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.clinics c WHERE c.id = clinic_id AND c.user_id = auth.uid()
    )
  );

-- Video Consultations Policies
CREATE POLICY "Users can access their assigned virtual meetings" ON public.video_consultations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = video_consultations.appointment_id
      AND (
        auth.jwt()->>'email' = a.patient_id OR 
        EXISTS (
          SELECT 1 FROM public.doctors d WHERE d.id = a.doctor_id AND d.user_id = auth.uid()
        )
      )
    )
  );

-- Prescriptions Policies
CREATE POLICY "Authorized users can view prescriptions" ON public.prescriptions
  FOR SELECT USING (
    auth.jwt()->>'email' = patient_id OR 
    EXISTS (
      SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- =========================================================================
-- SECTION 19: DATABASE VIEWS FOR HEALTHCARE INTELLIGENCE & ANALYTICS
-- =========================================================================

-- A. Active & Verified Doctors View
CREATE OR REPLACE VIEW public.view_active_doctors AS
SELECT 
  d.id AS doctor_id,
  d.user_id,
  p.name AS doctor_name,
  d.email,
  d.specialization,
  d.experience_years,
  d.consultation_fee,
  d.rating,
  d.status,
  COALESCE(dv.is_verified, false) AS document_verified,
  dv.license_number
FROM public.doctors d
LEFT JOIN public.profiles p ON d.user_id = p.id
LEFT JOIN public.doctor_verifications dv ON d.id = dv.doctor_id
WHERE d.status = 'Active';

-- B. Unified Comprehensive Appointments & Financial Ledger View
CREATE OR REPLACE VIEW public.view_appointment_details AS
SELECT 
  a.id AS appointment_id,
  a.date AS appointment_date,
  a.time_slot,
  a.serial_no,
  a.status AS appointment_status,
  a.type AS consultation_type,
  a.fee AS consultation_fee,
  p.patient_name,
  p.email AS patient_email,
  p.phone AS patient_phone,
  p.gender AS patient_gender,
  doc_p.name AS doctor_name,
  d.specialization AS doctor_specialization,
  c.name AS clinic_name,
  pay.id AS payment_id,
  pay.amount AS payment_amount,
  pay.status AS payment_status,
  pay.payment_method
FROM public.appointments a
LEFT JOIN public.patients p ON a.patient_id = p.email
LEFT JOIN public.doctors d ON a.doctor_id = d.id
LEFT JOIN public.profiles doc_p ON d.user_id = doc_p.id
LEFT JOIN public.clinics c ON a.clinic_id = c.id
LEFT JOIN public.appointment_payments ap ON a.id = ap.appointment_id
LEFT JOIN public.payments pay ON ap.payment_id = pay.id;

-- C. Geographic Expansion Partner Commission Summary
CREATE OR REPLACE VIEW public.view_partner_commissions_summary AS
SELECT 
  p.id AS partner_id,
  p.partner_name,
  p.partner_type,
  p.email AS partner_email,
  COALESCE(SUM(cr.commission_amount), 0) AS total_commission_earned,
  COALESCE(SUM(CASE WHEN cr.status = 'Paid' THEN cr.commission_amount ELSE 0 END), 0) AS commission_paid,
  COALESCE(SUM(CASE WHEN cr.status = 'Pending' THEN cr.commission_amount ELSE 0 END), 0) AS commission_pending,
  COUNT(cr.id) AS total_referred_transactions
FROM public.partners p
LEFT JOIN public.partner_commission_records cr ON p.id = cr.partner_id
GROUP BY p.id, p.partner_name, p.partner_type, p.email;

-- D. Real-time Gross Platform Financial Analytics
CREATE OR REPLACE VIEW public.view_financial_analytics AS
SELECT 
  COALESCE(SUM(amount), 0) AS gross_revenue,
  COALESCE(SUM(CASE WHEN status = 'Success' THEN amount ELSE 0 END), 0) AS successful_revenue,
  COALESCE(SUM(CASE WHEN status = 'Refunded' THEN amount ELSE 0 END), 0) AS refunded_amount,
  COUNT(*) AS total_transactions,
  COUNT(CASE WHEN status = 'Success' THEN 1 END) AS successful_transactions
FROM public.payments;


-- =========================================================================
-- SECTION 20: MASTER CONFIGURATION & ACCESS CONTROL SEED DATA
-- =========================================================================

-- A. Seed Essential RBAC Roles
INSERT INTO public.roles (id, name, description) VALUES
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000001', 'superadmin', 'System Master Administrator with total read/write privileges'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000002', 'doctor', 'Licensed Healthcare Practitioner providing medical consultations'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000003', 'clinic', 'SaaS Healthcare Clinic or Outpatient Center'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000004', 'partner', 'Geographic Expansion Partner (State, District, City level)'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000005', 'patient', 'Registered Healthcare Consumer booking care services'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000006', 'staff', 'Medical or Administrative Staff with specialized permissions'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000007', 'lab', 'Diagnostics and Laboratory Testing Center'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000008', 'pharmacy', 'Licensed Pharmacy selling medication and supplements'),
  ('a0e0a9bc-8bc3-4bb4-bbbb-000000000009', 'physio', 'Licensed Physiotherapist and Rehabilitation Specialist')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- B. Seed Enterprise Granular Permissions
INSERT INTO public.permissions (id, code, name, module) VALUES
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000001', 'user:create', 'Create User Profiles', 'User Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000002', 'user:read', 'Read User Profiles', 'User Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000003', 'user:update', 'Update User Profiles', 'User Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000004', 'user:delete', 'Suspend or Soft-Delete User Profiles', 'User Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000005', 'doctor:verify', 'Approve Doctor Verifications', 'Healthcare Provider Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000006', 'clinic:verify', 'Approve Clinic Verifications', 'Healthcare Provider Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000007', 'lab:verify', 'Approve Laboratory Verifications', 'Diagnostics Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000008', 'pharmacy:verify', 'Approve Pharmacy Verifications', 'SaaS Pharmacy Management'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000009', 'appointment:book', 'Book Appointments', 'SaaS Scheduling Engine'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000010', 'appointment:cancel', 'Cancel Appointments', 'SaaS Scheduling Engine'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000011', 'appointment:view_all', 'View All Administrative Appointments', 'SaaS Scheduling Engine'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000012', 'wallet:credit', 'Add Credit Adjustments to Wallet', 'Ledgers & Wallet'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000013', 'wallet:debit', 'Debit Funds from Wallet', 'Ledgers & Wallet'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000014', 'system:configure', 'Update Platform Master Rules & Configs', 'Administrative Controls'),
  ('b0e0a9bc-8bc3-4bb4-bbbb-000000000015', 'system:view_logs', 'View Real-time Audit & Telemetry Logs', 'Administrative Controls')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, module = EXCLUDED.module;

-- C. Map Permissions directly to Super Administrator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'a0e0a9bc-8bc3-4bb4-bbbb-000000000001', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- D. Seed Master Super Admin User Profile
INSERT INTO public.profiles (id, email, role, name, full_name, phone, status)
VALUES (
  'a0e0a9bc-8bc3-4bb4-bbbb-d00d11111111', 
  'master.admin@doctspark.com', 
  'superadmin', 
  'Master Admin', 
  'Doct Spark Master Admin', 
  '+1555019900', 
  'Active'
)
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email, 
  role = EXCLUDED.role, 
  name = EXCLUDED.name, 
  full_name = EXCLUDED.full_name,
  status = EXCLUDED.status;

-- E. Link Super Admin Assignment
INSERT INTO public.user_role_assignments (user_id, role_id)
VALUES ('a0e0a9bc-8bc3-4bb4-bbbb-d00d11111111', 'a0e0a9bc-8bc3-4bb4-bbbb-000000000001')
ON CONFLICT DO NOTHING;

-- F. Seed Global System Configurations
INSERT INTO public.system_configuration (key, value, description) VALUES
  ('platform_commission_rate', '10.00', 'Percentage commission fee charged to doctors and clinics per consultation'),
  ('welcome_referral_bonus_amt', '15.00', 'Flat credit reward added to patient wallet upon successful referred-user registration'),
  ('base_consultation_tax_rate', '18.00', 'Percentage Goods and Services Tax (GST) applied to digital consultation services'),
  ('subscription_grace_period_days', '7', 'Number of days a tenant subscription remains active after failing renew processing'),
  ('abdm_sandbox_integration_active', 'false', 'Flag stating whether connections to ABDM Sandbox gateway are live')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;


-- =========================================================================
-- SECTION 21: SUPABASE STORAGE BUCKET DESIGN SCHEMA REGISTRATION
-- =========================================================================

-- Safe execution block for registering Supabase Storage Buckets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
      ('medical-prescriptions', 'medical-prescriptions', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
      ('medical-reports', 'medical-reports', false, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
      ('provider-verifications', 'provider-verifications', false, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
      ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
      ('blog-images', 'blog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

