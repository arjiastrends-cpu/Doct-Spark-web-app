/**
 * Doct Spark Supabase Client Integration Configuration & Database Schema
 * 
 * To connect your live Supabase database and authentication:
 * 1. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
 * 2. Run the SQL schema script provided below in your Supabase SQL Editor.
 */

import { createClient } from '@supabase/supabase-js';
import { Appointment } from '../types';

// Graceful fallback for local development or during deployment before environment keys are populated
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder-doctspark.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveDoctorToSupabase(doctor: any) {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  if (!hasSupabase) {
    console.log('Supabase is not configured yet. Doctor saved to local state only.');
    return { success: true };
  }

  try {
    const experienceNum = typeof doctor.experience === 'number' 
      ? doctor.experience 
      : parseInt(doctor.experience) || 5;

    const doctorData = {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      experience: experienceNum,
      rating: doctor.rating || 5.0,
      consultation_fee: doctor.feeInClinic || 500,
      video_fee: doctor.feeVideo || 500,
      clinic_address: doctor.clinicAddress || doctor.clinicName || doctor.city || 'Clinic Address',
      photo: doctor.photo || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      mci_registration: doctor.registrationNumber || doctor.mci_registration || `MCI-${doctor.id}`,
      email: doctor.email || `${doctor.id}@doctspark.in`,
      phone: doctor.phone || doctor.contactPhone || '9876543210',
      approved: true
    };

    const { data, error } = await supabase
      .from('doctors')
      .upsert(doctorData, { onConflict: 'id' });

    if (error) {
      console.warn('Error upserting doctor in Supabase:', error.message, error.details);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Failed to save doctor to Supabase:', err);
    return { success: false, error: err };
  }
}

export async function saveAppointmentToSupabase(apt: Appointment, doctor: any) {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  if (!hasSupabase) {
    console.log('Supabase is not configured yet. Appointment saved to local storage/state only.');
    return { success: true };
  }

  try {
    // 1. Ensure the doctor exists in the doctors table first to satisfy foreign key constraints
    await saveDoctorToSupabase(doctor);

    // 2. Prepare the appointment data mapping to the exact snake_case postgres columns
    const appointmentData = {
      id: apt.id,
      doctor_id: apt.doctorId,
      doctor_name: apt.doctorName,
      doctor_specialty: apt.doctorSpecialty,
      doctor_photo: apt.doctorPhoto,
      patient_id: apt.patientId,
      patient_name: apt.patientName,
      patient_age: Number(apt.patientAge),
      patient_gender: apt.patientGender,
      date: apt.date,
      time: apt.time,
      type: apt.type,
      status: apt.status || 'Pending',
      reason: apt.reason || 'General Health Consultation',
      fee: Number(apt.fee),
      clinic_name: apt.clinicName || null,
      clinic_address: apt.clinicAddress || null,
      serial_no: apt.serialNo || null,
      room_id: apt.roomId || null,
      payment_method: apt.paymentMethod,
      payment_status: apt.paymentStatus,
      created_at: apt.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData);

    if (error) {
      console.error('Error inserting appointment into Supabase:', error.message, error.details);
      return { success: false, error };
    }
    console.log('Successfully saved appointment to Supabase:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to save appointment to Supabase:', err);
    return { success: false, error: err };
  }
}


/**
 * =========================================================================
 * POSTGRESQL TABLE SCHEMA SCRIPTS (For Supabase SQL Query Editor)
 * =========================================================================
 * 
 * -- 1. CLINICS TABLE
 * CREATE TABLE clinics (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   address TEXT NOT NULL,
 *   city TEXT NOT NULL,
 *   state TEXT NOT NULL,
 *   pincode TEXT NOT NULL,
 *   phone TEXT NOT NULL,
 *   partner_email TEXT NOT NULL,
 *   verified BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * -- 2. DOCTORS TABLE
 * CREATE TABLE doctors (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   specialty TEXT NOT NULL,
 *   experience INT NOT NULL,
 *   rating NUMERIC(3,2) DEFAULT 5.0,
 *   consultation_fee NUMERIC(10,2) NOT NULL,
 *   video_fee NUMERIC(10,2) NOT NULL,
 *   clinic_address TEXT,
 *   photo TEXT,
 *   mci_registration TEXT UNIQUE,
 *   email TEXT UNIQUE NOT NULL,
 *   phone TEXT,
 *   approved BOOLEAN DEFAULT FALSE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * -- 3. APPOINTMENTS TABLE
 * CREATE TABLE appointments (
 *   id TEXT PRIMARY KEY,
 *   doctor_id TEXT REFERENCES doctors(id),
 *   doctor_name TEXT NOT NULL,
 *   doctor_specialty TEXT NOT NULL,
 *   doctor_photo TEXT,
 *   patient_id TEXT NOT NULL, -- Email or Auth User ID
 *   patient_name TEXT NOT NULL,
 *   patient_age INT NOT NULL,
 *   patient_gender TEXT NOT NULL,
 *   date DATE NOT NULL,
 *   time TEXT NOT NULL,
 *   type TEXT CHECK (type IN ('In-Clinic', 'Video')),
 *   status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled', 'Expired')),
 *   reason TEXT NOT NULL,
 *   fee NUMERIC(10,2) NOT NULL,
 *   clinic_name TEXT,
 *   clinic_address TEXT,
 *   serial_no INT,
 *   room_id TEXT,
 *   payment_method TEXT NOT NULL,
 *   payment_status TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * -- 4. PATIENT WALLETS TABLE
 * CREATE TABLE patient_wallets (
 *   patient_email TEXT PRIMARY KEY,
 *   patient_name TEXT NOT NULL,
 *   balance NUMERIC(12,2) DEFAULT 0.00 CHECK (balance >= 0),
 *   referral_earnings NUMERIC(12,2) DEFAULT 0.00 CHECK (referral_earnings >= 0),
 *   refund_earnings NUMERIC(12,2) DEFAULT 0.00 CHECK (refund_earnings >= 0),
 *   referral_code TEXT UNIQUE NOT NULL,
 *   referred_by_code TEXT REFERENCES patient_wallets(referral_code) ON DELETE SET NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * -- 5. WALLET TRANSACTIONS TABLE
 * CREATE TABLE wallet_transactions (
 *   id TEXT PRIMARY KEY,
 *   patient_email TEXT REFERENCES patient_wallets(patient_email) ON DELETE CASCADE,
 *   timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
 *   type TEXT CHECK (type IN ('Credit', 'Debit')),
 *   amount NUMERIC(12,2) NOT NULL,
 *   source TEXT CHECK (source IN ('Referral', 'Platform Refund', 'Manual Admin Credit', 'Manual Admin Debit', 'Platform Fee Payment')),
 *   description TEXT NOT NULL,
 *   status TEXT DEFAULT 'Completed' CHECK (status IN ('Approved', 'Suspended', 'Cancelled', 'Completed'))
 * );
 * 
 * -- 6. ROW LEVEL SECURITY (RLS) POLICIES
 * ALTER TABLE patient_wallets ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
 * 
 * CREATE POLICY "Patients can view own wallet" ON patient_wallets
 *   FOR SELECT USING (auth.jwt()->>'email' = patient_email);
 * 
 * CREATE POLICY "Patients can view own transactions" ON wallet_transactions
 *   FOR SELECT USING (auth.jwt()->>'email' = patient_email);
 * 
 * CREATE POLICY "Patients can view own appointments" ON appointments
 *   FOR SELECT USING (auth.jwt()->>'email' = patient_id);
 * 
 * -- 7. PROFILES TABLE (For Single Universal Login & RBAC)
 * CREATE TABLE profiles (
 *   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   email TEXT UNIQUE NOT NULL,
 *   role TEXT NOT NULL DEFAULT 'patient', -- 'superadmin', 'state_partner', 'district_partner', 'city_partner', 'patient', 'doctor', 'clinic'
 *   partner_type TEXT, -- 'State', 'District', 'City' (if role is partner)
 *   name TEXT,
 *   full_name TEXT,
 *   terms_accepted BOOLEAN DEFAULT FALSE,
 *   accepted_terms_version TEXT,
 *   accepted_terms_at TIMESTAMP WITH TIME ZONE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * -- Enable Row Level Security (RLS) on Profiles:
 * ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 * 
 * -- RLS Policies for Profiles (Fixes updates and select checks):
 * CREATE POLICY "Users can view own profile" ON profiles
 *   FOR SELECT USING (auth.uid() = id);
 * 
 * CREATE POLICY "Users can update own profile" ON profiles
 *   FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
 * 
 * CREATE POLICY "Enable insert for authenticated users only" ON profiles
 *   FOR INSERT WITH CHECK (auth.uid() = id);
 * 
 * -- Trigger to automatically create a profile when a new user signs up in Supabase Auth:
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   INSERT INTO public.profiles (id, email, role)
 *   VALUES (
 *     new.id,
 *     new.email,
 *     CASE 
 *       WHEN new.email = 'maidulsrkr@gmail.com' THEN 'superadmin'
 *       ELSE 'patient'
 *     END
 *   );
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * CREATE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 */

export async function getUserRoleFromSupabase(email: string): Promise<{ role: string; partnerType?: string; name?: string } | null> {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Hardcoded superadmin email as fallback or override as requested:
  if (cleanEmail === 'maidulsrkr@gmail.com') {
    return { role: 'superadmin' };
  }

  // Check local storage accounts fallback first for offline/testing users
  try {
    const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
    if (savedAccountsRaw) {
      const localAccounts = JSON.parse(savedAccountsRaw);
      const localUser = localAccounts[cleanEmail];
      if (localUser) {
        return { 
          role: localUser.role || 'patient',
          name: localUser.name
        };
      }
    }
  } catch (e) {
    // Ignore localStorage failures
  }

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
  if (!hasSupabase) {
    return null;
  }

  try {
    // 2. Query profiles table
    // Try querying name and full_name dynamically
    let selectFields = 'role, partner_type, name, full_name';
    let { data, error } = await supabase
      .from('profiles')
      .select(selectFields)
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      // Fallback if name / full_name columns do not exist
      selectFields = 'role, partner_type';
      const fallbackResult = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('email', cleanEmail)
        .maybeSingle();
      data = fallbackResult.data;
    }

    if (data) {
      const row = data as any;
      const dbRole = String(row.role).toLowerCase();
      const ptName = row.name || row.full_name || undefined;
      let resolvedRole = dbRole;
      let partnerType: string | undefined = undefined;

      if (dbRole === 'super_admin' || dbRole === 'superadmin' || dbRole === 'admin') {
        resolvedRole = 'superadmin';
      } else if (dbRole === 'state_partner') {
        resolvedRole = 'partner';
        partnerType = 'State';
      } else if (dbRole === 'district_partner') {
        resolvedRole = 'partner';
        partnerType = 'District';
      } else if (dbRole === 'city_partner') {
        resolvedRole = 'partner';
        partnerType = 'City';
      } else if (dbRole === 'partner') {
        resolvedRole = 'partner';
        partnerType = row.partner_type || 'District';
      }

      return { 
        role: resolvedRole, 
        partnerType, 
        name: ptName 
      };
    }
  } catch (err) {
    console.warn('Error querying profiles table, trying other tables:', err);
  }

  // 3. Fallback table scans for already-registered demo users
  try {
    const { data: docData } = await supabase
      .from('doctors')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (docData) {
      return { role: 'doctor' };
    }

    const { data: clinicData } = await supabase
      .from('clinics')
      .select('id')
      .eq('partner_email', cleanEmail)
      .maybeSingle();
    if (clinicData) {
      return { role: 'clinic' };
    }

    const { data: patientData } = await supabase
      .from('patient_wallets')
      .select('patient_email')
      .eq('patient_email', cleanEmail)
      .maybeSingle();
    if (patientData) {
      return { role: 'patient' };
    }
  } catch (err) {
    console.warn('Error in fallback table scans:', err);
  }

  // 4. Fallback to local storage if needed
  try {
    const savedPharmacies = localStorage.getItem('ds_pharmacies');
    if (savedPharmacies) {
      const phList = JSON.parse(savedPharmacies);
      const matched = phList.find((p: any) => p.email.toLowerCase() === cleanEmail);
      if (matched) {
        return { role: 'pharmacy' };
      }
    }

    const savedLabs = localStorage.getItem('ds_laboratories');
    if (savedLabs) {
      const lList = JSON.parse(savedLabs);
      const matched = lList.find((l: any) => l.email.toLowerCase() === cleanEmail);
      if (matched) {
        return { role: 'laboratory' };
      }
    }

    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    if (savedPhysios) {
      const physioList = JSON.parse(savedPhysios);
      const matched = physioList.find((p: any) => p.email.toLowerCase() === cleanEmail);
      if (matched) {
        return { role: 'physiotherapy' };
      }
    }

    const savedPartners = localStorage.getItem('ds_partners');
    if (savedPartners) {
      const pList = JSON.parse(savedPartners);
      const matched = pList.find((p: any) => p.email.toLowerCase() === cleanEmail);
      if (matched) {
        return { role: 'partner', partnerType: matched.partnerType };
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  return null;
}
