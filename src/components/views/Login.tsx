/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, KeyRound, ShieldAlert, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Role } from '../../types';
import { supabase, getUserRoleFromSupabase } from '../../lib/supabase';
import { getOrCreatePatientWallet } from '../../data/walletUtils';
import { logTermsAcceptance, getTermsAcceptanceLogs } from '../../data/termsUtils';

interface LoginProps {
  setView: (view: string) => void;
  setUserRole: (role: Role | null) => void;
  setUserEmail: (email: string | null) => void;
}

export default function Login({ setView, setUserRole, setUserEmail }: LoginProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successInfo, setSuccessInfo] = React.useState<{ role: string; email: string } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [isResetSuccess, setIsResetSuccess] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = React.useState('');
  const [isResetSending, setIsResetSending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    // Seed testing accounts requested by user
    try {
      const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
      const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
      let changed = false;

      if (!localAccounts['skyopen247@gmail.com']) {
        localAccounts['skyopen247@gmail.com'] = {
          email: 'skyopen247@gmail.com',
          password: '123456789',
          name: 'SkyOpen Test Patient',
          role: 'patient'
        };
        changed = true;
      }

      if (!localAccounts['maidulsrkr@gmail.com']) {
        localAccounts['maidulsrkr@gmail.com'] = {
          email: 'maidulsrkr@gmail.com',
          password: '123456789',
          name: 'Super Admin',
          role: 'superadmin'
        };
        changed = true;
      }

      if (changed) {
        localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));
      }
    } catch (e) {
      console.warn('Failed to seed local test accounts:', e);
    }
  }, []);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResetSuccessMsg('');
    setIsResetSending(true);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      setIsResetSending(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        throw new Error(error.message);
      }

      setResetSuccessMsg(`A password reset link has been sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(err.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setIsResetSending(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMsg('Please specify both your Email and Password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

      if (!hasSupabase) {
        throw new Error('Supabase is not configured yet. Checking local offline database...');
      }

      // 1. Authenticate using Supabase Authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        throw new Error('Authentication failed. No user object returned.');
      }

      // 2. Fetch the user's role and details from database / fallback
      let roleResult = await getUserRoleFromSupabase(cleanEmail);
      let role: Role = 'patient';
      let partnerType: string | undefined = undefined;
      let resolvedName: string | undefined = undefined;

      if (roleResult) {
        role = roleResult.role as Role;
        partnerType = roleResult.partnerType;
        resolvedName = roleResult.name;
      }

      const metaRole = authData?.user?.user_metadata?.role;
      const metaPartnerType = authData?.user?.user_metadata?.partner_type || authData?.user?.user_metadata?.partnerType;
      const metaName = authData?.user?.user_metadata?.name || authData?.user?.user_metadata?.full_name;

      if (!roleResult) {
        // Fallback to Supabase user metadata or local account
        let localRole: string | undefined = undefined;
        let localName: string = 'Registered Patient';
        try {
          const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
          if (savedAccountsRaw) {
            const localAccounts = JSON.parse(savedAccountsRaw);
            const localUser = localAccounts[cleanEmail];
            if (localUser) {
              localRole = localUser.role;
              localName = localUser.name;
            }
          }
        } catch (e) {
          console.warn('Local accounts read error:', e);
        }

        const resolvedRole = (metaRole || localRole || 'patient').toLowerCase();
        role = resolvedRole as Role;
        partnerType = metaPartnerType;
        resolvedName = localName || metaName || 'Registered Patient';
      }

      // Sync the patient name to local storage and database
      if (role === 'patient') {
        const finalName = (resolvedName || metaName || '').trim();
        if (finalName) {
          const currentStoredName = localStorage.getItem(`ds_patient_name_${cleanEmail}`);
          // Requirement 6: Never overwrite an existing valid name with null or an empty string
          if (!currentStoredName || currentStoredName.trim() === '') {
            localStorage.setItem(`ds_patient_name_${cleanEmail}`, finalName);
          }
        }

        const activeStoredName = localStorage.getItem(`ds_patient_name_${cleanEmail}`) || finalName || 'Registered Patient';
        getOrCreatePatientWallet(cleanEmail, activeStoredName);

        // Requirement 5: If name is missing in profiles table but exists in Auth metadata or local storage, sync it back
        if (authData?.user?.id && activeStoredName) {
          try {
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              email: cleanEmail,
              role: 'patient',
              name: activeStoredName,
              full_name: activeStoredName,
              created_at: new Date().toISOString()
            });
          } catch (e) {
            try {
              await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: cleanEmail,
                role: 'patient',
                name: activeStoredName
              });
            } catch (e2) {
              try {
                await supabase.from('profiles').upsert({
                  id: authData.user.id,
                  email: cleanEmail,
                  role: 'patient',
                  full_name: activeStoredName
                });
              } catch (e3) {
                // Ignore final schema incompatibilities
              }
            }
          }
        }

        // Sync terms acceptance from Supabase profile to local storage so future logins on new devices work without re-acceptance
        try {
          console.log('Checking terms acceptance from Supabase profile for:', cleanEmail);
          const { data: profileTermsData, error: profileTermsError } = await supabase
            .from('profiles')
            .select('terms_accepted, accepted_terms_version, accepted_terms_at')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (!profileTermsError && profileTermsData) {
            console.log('Fetched terms data from Supabase:', profileTermsData);
            if (profileTermsData.terms_accepted && profileTermsData.accepted_terms_version) {
              const logs = getTermsAcceptanceLogs();
              const alreadyLogged = logs.some(
                l => l.userEmail.toLowerCase() === cleanEmail.toLowerCase() && 
                     l.registrationType === 'patient' && 
                     l.acceptedVersion === profileTermsData.accepted_terms_version
              );
              if (!alreadyLogged) {
                logTermsAcceptance(
                  cleanEmail,
                  activeStoredName,
                  'patient',
                  profileTermsData.accepted_terms_version
                );
                console.log('Synced Supabase terms acceptance to local storage!');
              }
            }
          }
        } catch (termsSyncErr) {
          console.warn('Failed to sync terms from Supabase:', termsSyncErr);
        }
      }

      // 3. Synchronize local storage mock lists so that the dashboard pages don't crash
      if (role === 'patient') {
        const activeStoredName = localStorage.getItem(`ds_patient_name_${cleanEmail}`) || 'Registered Patient';
        getOrCreatePatientWallet(cleanEmail, activeStoredName);
      } else if (role === 'partner') {
        const savedPartners = localStorage.getItem('ds_partners');
        const pList = savedPartners ? JSON.parse(savedPartners) : [];
        let matched = pList.find((p: any) => p.email.toLowerCase() === cleanEmail);

        if (matched) {
          const isPending = matched.status.toLowerCase().includes('pending') || matched.status === 'Pending Verification';
          const isRejected = matched.status === 'Rejected';
          
          if (isPending) {
            throw new Error('Your partner account is currently Pending Verification. Login is disabled until final approval.');
          }
          if (isRejected) {
            throw new Error('Your partner registration request has been Rejected. Login is disabled.');
          }
        }

        if (!matched) {
          matched = {
            id: `part-${Date.now()}`,
            name: cleanEmail.split('@')[0],
            profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
            dob: '1990-01-01',
            age: 36,
            gender: 'Male',
            phone: '9876543210',
            email: cleanEmail,
            address: 'Partner Address',
            state: 'Maharashtra',
            pincode: '400001',
            aadhaarNumber: '000000000000',
            panNumber: 'ABCDE1234F',
            qualification: 'Graduate',
            experience: '5 Years',
            occupation: 'Partner',
            skills: 'Marketing',
            partnerType: partnerType || 'District',
            assignedState: 'Maharashtra',
            status: 'Approved (Active)',
            onboardedDoctorsCount: 0,
            onboardedClinicsCount: 0,
            walletBalance: 0,
            referralId: `REF-${partnerType === 'State' ? 'ST' : 'DT'}-${Math.floor(1000 + Math.random() * 9000)}`
          };
          pList.push(matched);
          localStorage.setItem('ds_partners', JSON.stringify(pList));
        }
      } else if (role === 'doctor') {
        const savedDocs = localStorage.getItem('ds_doctors');
        const dList = savedDocs ? JSON.parse(savedDocs) : [];
        let matchedDoc = dList.find((d: any) => d.email?.toLowerCase() === cleanEmail);
        if (!matchedDoc) {
          matchedDoc = {
            id: `doc-${Date.now()}`,
            name: `Dr. ${cleanEmail.split('@')[0]}`,
            email: cleanEmail,
            specialty: 'General Physician',
            experience: 10,
            clinicName: 'DoctSpark Clinic',
            city: 'Mumbai',
            rating: 4.8,
            reviewsCount: 12,
            feeInClinic: 500,
            feeVideo: 400,
            nextAvailable: 'Today 5:00 PM',
            photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
            bio: 'Onboarded doctspark practitioner.',
          };
          dList.push(matchedDoc);
          localStorage.setItem('ds_doctors', JSON.stringify(dList));
        }
      } else if (role === 'clinic') {
        const savedClinics = localStorage.getItem('ds_clinics');
        const cList = savedClinics ? JSON.parse(savedClinics) : [];
        let matchedClinic = cList.find((c: any) => c.partner_email?.toLowerCase() === cleanEmail);
        if (!matchedClinic) {
          matchedClinic = {
            id: `clinic-${Date.now()}`,
            name: `${cleanEmail.split('@')[0]} Medical Center`,
            partner_email: cleanEmail,
            practiceType: 'Clinic',
            state: 'Maharashtra',
            district: 'Mumbai',
            city: 'Mumbai',
            pincode: '400001',
            address: 'Central Plaza, Mumbai',
            consultType: 'Both',
            feeInClinic: 500,
            feeVideo: 400,
            availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
          };
          cList.push(matchedClinic);
          localStorage.setItem('ds_clinics', JSON.stringify(cList));
        }
      } else if (role === 'pharmacy') {
        const savedPharmacies = localStorage.getItem('ds_pharmacies');
        const phList = savedPharmacies ? JSON.parse(savedPharmacies) : [];
        let matchedPharm = phList.find((p: any) => p.email?.toLowerCase() === cleanEmail);
        if (!matchedPharm) {
          matchedPharm = {
            id: `pharm-${Date.now()}`,
            name: `${cleanEmail.split('@')[0].toUpperCase()} Pharmacy`,
            ownerName: 'Amit Patel',
            email: cleanEmail,
            phone: '9876543210',
            licenseNumber: 'DL-9810-PHARM',
            address: 'Central Plaza, Sector 4',
            city: 'Mumbai',
            district: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            status: 'Approved (Active)',
            subscriptionPaid: true,
            createdAt: new Date().toISOString()
          };
          phList.push(matchedPharm);
          localStorage.setItem('ds_pharmacies', JSON.stringify(phList));
        }
      } else if (role === 'laboratory') {
        const savedLabs = localStorage.getItem('ds_laboratories');
        const lList = savedLabs ? JSON.parse(savedLabs) : [];
        let matchedLab = lList.find((l: any) => l.email?.toLowerCase() === cleanEmail);
        if (!matchedLab) {
          matchedLab = {
            id: `lab-${Date.now()}`,
            name: `${cleanEmail.split('@')[0].toUpperCase()} Diagnostics & Labs`,
            ownerName: 'Dr. Ramesh Chawla',
            email: cleanEmail,
            phone: '9876543210',
            licenseNumber: 'MC-9810-NABL',
            address: 'Central Plaza, Sector 4',
            city: 'Mumbai',
            district: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            status: 'Approved (Active)',
            subscriptionPaid: true,
            createdAt: new Date().toISOString()
          };
          lList.push(matchedLab);
          localStorage.setItem('ds_laboratories', JSON.stringify(lList));
        }
      } else if (role === 'physiotherapy') {
        const savedPhysios = localStorage.getItem('ds_physiotherapists');
        const pList = savedPhysios ? JSON.parse(savedPhysios) : [];
        let matchedPhysio = pList.find((p: any) => p.email?.toLowerCase() === cleanEmail);
        if (!matchedPhysio) {
          matchedPhysio = {
            id: `physio-${Date.now()}`,
            name: `${cleanEmail.split('@')[0].toUpperCase()} Physiotherapy Center`,
            therapistName: `Dr. ${cleanEmail.split('@')[0]} (PT)`,
            email: cleanEmail,
            phone: '9876543210',
            registrationNumber: 'IAP-98124-PHYS',
            specialty: 'Orthopedic Physiotherapy',
            experience: 8,
            address: 'Apex Rehabilitation Clinic, Sector 15',
            city: 'Mumbai',
            district: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400050',
            status: 'Approved (Active)',
            subscriptionPaid: true,
            mobileOtpVerified: true,
            emailOtpVerified: true,
            createdAt: new Date().toISOString()
          };
          pList.push(matchedPhysio);
          localStorage.setItem('ds_physiotherapists', JSON.stringify(pList));
        }
      }

      // 4. Update parent state
      setUserRole(role as Role);
      setUserEmail(cleanEmail);
      setSuccessInfo({ role, email: cleanEmail });

      // 5. Trigger role-based redirection
      setTimeout(() => {
        if (role === 'superadmin') {
          setView('superadmin-dashboard');
        } else if (role === 'partner') {
          setView('partner-dashboard');
        } else if (role === 'doctor') {
          setView('doctor-dashboard');
        } else if (role === 'clinic') {
          setView('clinic-dashboard');
        } else if (role === 'pharmacy') {
          setView('pharmacy-dashboard');
        } else if (role === 'laboratory') {
          setView('laboratory-dashboard');
        } else if (role === 'physiotherapy') {
          setView('physiotherapy-dashboard');
        } else {
          setView('patient-dashboard');
        }
      }, 1000);

    } catch (err: any) {
      console.warn('Sign in via Supabase failed, attempting local fallback:', err);
      
      // Attempt local storage fallback authentication for testing & local-first accounts
      try {
        const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
        const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
        let localUser = localAccounts[cleanEmail];

        // Ensure the hardcoded admin email has an automatic fallback profile locally
        if (cleanEmail === 'maidulsrkr@gmail.com' && !localUser) {
          localUser = {
            email: 'maidulsrkr@gmail.com',
            password: '123456789',
            name: 'Super Admin',
            role: 'superadmin'
          };
        }

        if (localUser) {
          const isMatchedPassword = localUser.password === password;
          // Support multiple default passwords for the superadmin to prevent onboarding friction
          const isValidAdminAuth = cleanEmail === 'maidulsrkr@gmail.com' && 
            ['123456789', 'admin123', 'admin', 'password', 'maidulsrkr'].includes(password);

          if (isMatchedPassword || isValidAdminAuth) {
            const role = localUser.role || 'patient';
            
            if (role === 'partner') {
              const savedPartners = localStorage.getItem('ds_partners');
              const pList = savedPartners ? JSON.parse(savedPartners) : [];
              const matched = pList.find((p: any) => p.email.toLowerCase() === cleanEmail);
              if (matched) {
                const isPending = matched.status.toLowerCase().includes('pending') || matched.status === 'Pending Verification';
                const isRejected = matched.status === 'Rejected';
                if (isPending) {
                  setErrorMsg('Your partner account is currently Pending Verification. Login is disabled until final approval.');
                  setIsSubmitting(false);
                  return;
                }
                if (isRejected) {
                  setErrorMsg('Your partner registration request has been Rejected. Login is disabled.');
                  setIsSubmitting(false);
                  return;
                }
              }
            }

            // Synchronize local storage mock lists so that the dashboard pages don't crash
            if (role === 'patient') {
              getOrCreatePatientWallet(cleanEmail, localUser.name);
            } else if (role === 'doctor') {
              const savedDocs = localStorage.getItem('ds_doctors');
              const dList = savedDocs ? JSON.parse(savedDocs) : [];
              let matchedDoc = dList.find((d: any) => d.email?.toLowerCase() === cleanEmail);
              if (!matchedDoc) {
                matchedDoc = {
                  id: `doc-${Date.now()}`,
                  name: `Dr. ${localUser.name || cleanEmail.split('@')[0]}`,
                  email: cleanEmail,
                  specialty: 'General Physician',
                  experience: 10,
                  clinicName: 'DoctSpark Clinic',
                  city: 'Mumbai',
                  rating: 4.8,
                  reviewsCount: 12,
                  feeInClinic: 500,
                  feeVideo: 400,
                  nextAvailable: 'Today 5:00 PM',
                  photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
                  bio: 'Onboarded doctspark practitioner.',
                };
                dList.push(matchedDoc);
                localStorage.setItem('ds_doctors', JSON.stringify(dList));
              }
            } else if (role === 'clinic') {
              const savedClinics = localStorage.getItem('ds_clinics');
              const cList = savedClinics ? JSON.parse(savedClinics) : [];
              let matchedClinic = cList.find((c: any) => c.partner_email?.toLowerCase() === cleanEmail);
              if (!matchedClinic) {
                matchedClinic = {
                  id: `clinic-${Date.now()}`,
                  name: `${localUser.name || cleanEmail.split('@')[0]} Medical Center`,
                  partner_email: cleanEmail,
                  practiceType: 'Clinic',
                  state: 'Maharashtra',
                  district: 'Mumbai',
                  city: 'Mumbai',
                  pincode: '400001',
                  address: 'Central Plaza, Mumbai',
                  consultType: 'Both',
                  feeInClinic: 500,
                  feeVideo: 400,
                  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                  availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
                };
                cList.push(matchedClinic);
                localStorage.setItem('ds_clinics', JSON.stringify(cList));
              }
            } else if (role === 'pharmacy') {
              const savedPharmacies = localStorage.getItem('ds_pharmacies');
              const phList = savedPharmacies ? JSON.parse(savedPharmacies) : [];
              let matchedPharm = phList.find((p: any) => p.email?.toLowerCase() === cleanEmail);
              if (!matchedPharm) {
                matchedPharm = {
                  id: `pharm-${Date.now()}`,
                  name: `${localUser.name || cleanEmail.split('@')[0].toUpperCase()} Pharmacy`,
                  ownerName: 'Amit Patel',
                  email: cleanEmail,
                  phone: '9876543210',
                  licenseNumber: 'DL-9810-PHARM',
                  address: 'Central Plaza, Sector 4',
                  city: 'Mumbai',
                  district: 'Mumbai',
                  state: 'Maharashtra',
                  pincode: '400001',
                  status: 'Approved (Active)',
                  subscriptionPaid: true,
                  createdAt: new Date().toISOString()
                };
                phList.push(matchedPharm);
                localStorage.setItem('ds_pharmacies', JSON.stringify(phList));
              }
            } else if (role === 'laboratory') {
              const savedLabs = localStorage.getItem('ds_laboratories');
              const lList = savedLabs ? JSON.parse(savedLabs) : [];
              let matchedLab = lList.find((l: any) => l.email?.toLowerCase() === cleanEmail);
              if (!matchedLab) {
                matchedLab = {
                  id: `lab-${Date.now()}`,
                  name: `${localUser.name || cleanEmail.split('@')[0].toUpperCase()} Diagnostics & Labs`,
                  ownerName: 'Dr. Ramesh Chawla',
                  email: cleanEmail,
                  phone: '9876543210',
                  licenseNumber: 'MC-9810-NABL',
                  address: 'Central Plaza, Sector 4',
                  city: 'Mumbai',
                  district: 'Mumbai',
                  state: 'Maharashtra',
                  pincode: '400001',
                  status: 'Approved (Active)',
                  subscriptionPaid: true,
                  createdAt: new Date().toISOString()
                };
                lList.push(matchedLab);
                localStorage.setItem('ds_laboratories', JSON.stringify(lList));
              }
            } else if (role === 'physiotherapy') {
              const savedPhysios = localStorage.getItem('ds_physiotherapists');
              const pList = savedPhysios ? JSON.parse(savedPhysios) : [];
              let matchedPhysio = pList.find((p: any) => p.email?.toLowerCase() === cleanEmail);
              if (!matchedPhysio) {
                matchedPhysio = {
                  id: `physio-${Date.now()}`,
                  name: `${localUser.name || cleanEmail.split('@')[0].toUpperCase()} Physiotherapy Center`,
                  therapistName: `Dr. ${localUser.name || cleanEmail.split('@')[0]} (PT)`,
                  email: cleanEmail,
                  phone: '9876543210',
                  registrationNumber: 'IAP-98124-PHYS',
                  specialty: 'Orthopedic Physiotherapy',
                  experience: 8,
                  address: 'Apex Rehabilitation Clinic, Sector 15',
                  city: 'Mumbai',
                  district: 'Mumbai',
                  state: 'Maharashtra',
                  pincode: '400050',
                  status: 'Approved (Active)',
                  subscriptionPaid: true,
                  mobileOtpVerified: true,
                  emailOtpVerified: true,
                  createdAt: new Date().toISOString()
                };
                pList.push(matchedPhysio);
                localStorage.setItem('ds_physiotherapists', JSON.stringify(pList));
              }
            }

            setUserRole(role as Role);
            setUserEmail(cleanEmail);
            setSuccessInfo({ role, email: cleanEmail });

            setTimeout(() => {
              if (role === 'superadmin') {
                setView('superadmin-dashboard');
              } else if (role === 'partner') {
                setView('partner-dashboard');
              } else if (role === 'doctor') {
                setView('doctor-dashboard');
              } else if (role === 'clinic') {
                setView('clinic-dashboard');
              } else if (role === 'pharmacy') {
                setView('pharmacy-dashboard');
              } else if (role === 'laboratory') {
                setView('laboratory-dashboard');
              } else if (role === 'physiotherapy') {
                setView('physiotherapy-dashboard');
              } else {
                setView('patient-dashboard');
              }
            }, 1000);
            return;
          } else {
            setErrorMsg('Invalid password. Please check your credentials.');
            setIsSubmitting(false);
            return;
          }
        } else {
          setErrorMsg('No account found with this email in the local database. Please register first.');
          setIsSubmitting(false);
          return;
        }
      } catch (localErr) {
        console.error('Local fallback authentication failed:', localErr);
      }

      setErrorMsg(err.message || 'Authentication failed. Please check your network or credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-md w-full mx-auto px-4 py-16" id="login-root">
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 md:p-8 shadow-md">
        
        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Universal Access Portal</span>
          <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Sign In to DoctSpark</h2>
          <p className="text-xs text-gray-400 mt-1">One secure account. Unified dashboard routing.</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg p-3 text-xs font-bold mb-4 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold">Login Failed</p>
              <p className="font-normal mt-0.5 text-rose-600">{errorMsg}</p>
            </div>
          </div>
        )}

        {successInfo ? (
          <div className="text-center py-8 animate-fadeIn">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3 border border-emerald-100 animate-bounce">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-[#1A2B3C]">Welcome Back!</p>
            <p className="text-xs text-gray-400 mt-1">Role detected: <span className="font-bold text-[#0A6E6E] capitalize">{successInfo.role}</span></p>
            <p className="text-[10px] text-gray-400 mt-3 font-medium italic animate-pulse">Launching your secure dashboard...</p>
          </div>
        ) : isForgotPassword ? (
          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4 animate-fadeIn">
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
              Enter your registered email address below, and we will send you a secure link to reset your password.
            </p>
            
            {resetSuccessMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg p-3 text-xs font-bold mb-2">
                {resetSuccessMsg}
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Email Address</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetSending}
                  required
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] focus:border-[#0A6E6E] focus:ring-1 focus:ring-[#0A6E6E]/20"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isResetSending}
              className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 disabled:bg-gray-400 text-white font-extrabold text-xs py-3 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer mt-2 flex items-center justify-center gap-1.5"
            >
              {isResetSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setResetSuccessMsg('');
                }}
                className="text-xs text-[#0A6E6E] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Email Address</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] focus:border-[#0A6E6E] focus:ring-1 focus:ring-[#0A6E6E]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#1A2B3C]">Password</label>
                <a 
                  href="#forgot-password" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgotPassword(true);
                    setResetEmail(email);
                    setErrorMsg('');
                    setResetSuccessMsg('');
                  }}
                  className="text-[10px] text-[#0A6E6E] font-bold hover:underline cursor-pointer"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 pr-10 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] focus:border-[#0A6E6E] focus:ring-1 focus:ring-[#0A6E6E]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-[#0A6E6E] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex justify-between items-center text-xs">
              <label className="flex items-center gap-1.5 font-semibold text-gray-500 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="accent-[#0A6E6E]"
                />
                Remember my session
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 disabled:bg-gray-400 text-white font-extrabold text-xs py-3 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer mt-2 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  Secure Sign In <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

          </form>
        )}

        {/* Bottom sign up & Dedicated Registration CTAs */}
        <div className="text-center text-xs mt-6 pt-5 border-t border-gray-100 space-y-4">
          <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Create an Account</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => setView('register-doctor')}
              className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold rounded-lg text-[11px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>🥼 Doctor Portal</span>
              <span className="text-[8px] font-medium text-amber-700">Practice Registration</span>
            </button>
            <button 
              type="button"
              onClick={() => setView('partner-register')}
              className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-extrabold rounded-lg text-[11px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>🤝 Onboarding Partner</span>
              <span className="text-[8px] font-medium text-indigo-700">Commission Partnership</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
              type="button"
              onClick={() => setView('register-clinic')}
              className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 font-extrabold rounded-lg text-[11px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>🏥 Clinic / Hospital</span>
              <span className="text-[8px] font-medium text-teal-700">Facility Onboarding</span>
            </button>
            <button 
              type="button"
              onClick={() => setView('register')}
              className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 font-extrabold rounded-lg text-[11px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>👤 Patient Account</span>
              <span className="text-[8px] font-medium text-sky-700">Join Free Patient Portal</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2">
            <button 
              type="button"
              onClick={() => setView('register-pharmacy')}
              className="py-2 px-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-extrabold rounded-lg text-[10px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>💊 Pharmacy</span>
              <span className="text-[7px] font-medium text-emerald-700">Drug Store</span>
            </button>
            <button 
              type="button"
              onClick={() => setView('register-laboratory')}
              className="py-2 px-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-950 font-extrabold rounded-lg text-[10px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>🔬 Laboratory</span>
              <span className="text-[7px] font-medium text-violet-700">Diagnostics</span>
            </button>
            <button 
              type="button"
              onClick={() => setView('register-physiotherapy')}
              className="py-2 px-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-950 font-extrabold rounded-lg text-[10px] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs"
            >
              <span>🩺 Physiotherapy</span>
              <span className="text-[7px] font-medium text-pink-700">Rehabilitation</span>
            </button>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            {isResetSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg text-center text-[10px] font-bold animate-fadeIn">
                ✨ Local database cleared! Reloading page...
              </div>
            ) : showResetConfirm ? (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-left animate-fadeIn">
                <p className="text-[10px] text-rose-800 font-extrabold mb-1">⚠️ Are you absolutely sure?</p>
                <p className="text-[9px] text-rose-600 font-medium mb-2.5 leading-tight">
                  This will permanently delete all local demo profiles, doctors, clinics, partners, pharmacies, laboratories, physiotherapists, and cached appointments.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      setIsResetSuccess(true);
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }}
                    className="flex-1 py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] rounded transition-all cursor-pointer text-center"
                  >
                    Yes, Clear Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[9px] rounded transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center"
              >
                🗑️ Clear Website Local Profiles & Cache
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
