/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  PlusCircle, 
  User, 
  Award, 
  BellRing, 
  Video, 
  ExternalLink, 
  Share2, 
  ClipboardList, 
  Check, 
  Gift,
  Activity,
  Search,
  FileText,
  Wallet,
  UserCheck,
  ShieldCheck,
  Heart,
  AlertCircle,
  ArrowRight,
  ArrowDownToLine,
  Phone,
  MapPin,
  Copy,
  Star,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Appointment, Prescription } from '../../types';
import { validateReferralId } from '../../data/referralUtils';
import { getOrCreatePatientWallet, applyReferralCode, getWalletAdminConfig, debitPatientWallet, creditPatientWallet } from '../../data/walletUtils';
import PatientLaboratory from './patient/PatientLaboratory';
import PatientPharmacy from './patient/PatientPharmacy';
import PatientPhysiotherapy from './patient/PatientPhysiotherapy';
import { supabase } from '../../lib/supabase';

interface PatientDashboardProps {
  setView: (view: string) => void;
  appointments: Appointment[];
  setSelectedDoctorId: (id: string | null) => void;
  setSelectedRoomId: (id: string | null) => void;
  userEmail?: string | null;
}

export default function PatientDashboard({
  setView,
  appointments: allAppointments,
  setSelectedDoctorId,
  setSelectedRoomId,
  userEmail
 }: PatientDashboardProps) {
  const patientEmail = userEmail || 'aarav.mehta@doctspark.in';

  // Find logged in patient name dynamically using reactive state
  const [patientName, setPatientName] = React.useState<string>(() => {
    const emailToUse = patientEmail;
    if (emailToUse === 'aarav.mehta@doctspark.in') {
      const stored = localStorage.getItem(`ds_patient_name_${emailToUse}`);
      if (stored) return stored;
      return "Aarav Mehta";
    }
    const stored = localStorage.getItem(`ds_patient_name_${emailToUse}`);
    if (stored) return stored;
    // Extract human friendly name from email e.g. aarav.mehta@doctspark.in -> Aarav Mehta
    const username = emailToUse.split('@')[0];
    if (username.includes('.')) {
      return username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  });

  // Keep state in sync with userEmail changes
  React.useEffect(() => {
    const emailToUse = patientEmail;
    if (emailToUse === 'aarav.mehta@doctspark.in') {
      const stored = localStorage.getItem(`ds_patient_name_${emailToUse}`);
      setPatientName(stored || "Aarav Mehta");
      return;
    }
    const stored = localStorage.getItem(`ds_patient_name_${emailToUse}`);
    if (stored) {
      setPatientName(stored);
    } else {
      const username = emailToUse.split('@')[0];
      let calculatedName = '';
      if (username.includes('.')) {
        calculatedName = username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      } else {
        calculatedName = username.charAt(0).toUpperCase() + username.slice(1);
      }
      setPatientName(calculatedName);
    }
  }, [patientEmail]);

  // Load & Sync patient name from Supabase / Auth Metadata on Mount
  React.useEffect(() => {
    async function syncPatientProfile() {
      const emailToUse = patientEmail;
      if (emailToUse === 'aarav.mehta@doctspark.in') return;
      
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
          // 1. Fetch current profile from Profiles table
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('name, full_name')
            .eq('email', emailToUse)
            .maybeSingle();

          let dbName = '';
          if (!profileErr && profileData) {
            dbName = profileData.name || profileData.full_name || '';
          }

          // 2. Fetch from Auth Metadata as well
          const { data: { user } } = await supabase.auth.getUser();
          const metaName = user?.user_metadata?.name || user?.user_metadata?.full_name || '';

          // Determine the best name to use
          const resolvedName = (dbName || metaName || '').trim();
          
          if (resolvedName) {
            const currentStored = localStorage.getItem(`ds_patient_name_${emailToUse}`);
            // Requirement 6: Never overwrite an existing valid name with null or an empty string
            if (!currentStored || currentStored.trim() === '') {
              localStorage.setItem(`ds_patient_name_${emailToUse}`, resolvedName);
              setPatientName(resolvedName);
              window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: resolvedName } }));
            }
            
            // Sync metadata name to profiles table if profiles table is missing it (Requirement 5)
            if (metaName && (!dbName || !dbName.trim()) && user) {
              await supabase.from('profiles').upsert({
                id: user.id,
                email: emailToUse,
                role: 'patient',
                name: resolvedName,
                full_name: resolvedName
              });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to sync profile from Supabase:', err);
      }
    }

    syncPatientProfile();
  }, [patientEmail]);

  // Editable Profile Settings states
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [editNameInput, setEditNameInput] = React.useState(patientName);
  const [editBloodGroup, setEditBloodGroup] = React.useState(() => localStorage.getItem(`ds_blood_group_${patientEmail}`) || "O-Positive (O+)");
  const [editAgeGender, setEditAgeGender] = React.useState(() => localStorage.getItem(`ds_age_gender_${patientEmail}`) || "28 Years / Male");
  const [editMobile, setEditMobile] = React.useState(() => localStorage.getItem(`ds_mobile_${patientEmail}`) || "+91 98765 43210");
  const [editLanguage, setEditLanguage] = React.useState(() => localStorage.getItem(`ds_language_${patientEmail}`) || "English & Hindi");

  // Keep name input field synchronized
  React.useEffect(() => {
    setEditNameInput(patientName);
  }, [patientName]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim()) {
      alert("Registered Full Name cannot be empty.");
      return;
    }

    const newName = editNameInput.trim();
    setPatientName(newName);

    // Save to localStorage immediately (Requirement 7)
    localStorage.setItem(`ds_patient_name_${patientEmail}`, newName);
    localStorage.setItem(`ds_blood_group_${patientEmail}`, editBloodGroup);
    localStorage.setItem(`ds_age_gender_${patientEmail}`, editAgeGender);
    localStorage.setItem(`ds_mobile_${patientEmail}`, editMobile);
    localStorage.setItem(`ds_language_${patientEmail}`, editLanguage);

    // Update local accounts list for persistent logins fallback
    try {
      const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
      if (savedAccountsRaw) {
        const localAccounts = JSON.parse(savedAccountsRaw);
        if (localAccounts[patientEmail]) {
          localAccounts[patientEmail].name = newName;
          localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));
        }
      }
    } catch (e) {
      console.warn("Failed to update ds_local_accounts:", e);
    }

    // Dispatch custom event to notify Header and DashboardHeader immediately
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: newName } }));

    // Attempt live Supabase update
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update profile table
          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              email: patientEmail,
              role: 'patient',
              name: newName,
              full_name: newName,
              blood_group: editBloodGroup,
              age_gender: editAgeGender,
              phone: editMobile,
              language: editLanguage
            });
          } catch (upsertErr) {
            // Fallback for column schema mismatches
            await supabase.from('profiles').upsert({
              id: user.id,
              email: patientEmail,
              role: 'patient',
              name: newName
            });
          }

          // Update Auth user_metadata
          await supabase.auth.updateUser({
            data: {
              name: newName,
              full_name: newName
            }
          });
        }
      }
    } catch (err) {
      console.warn("Background Supabase profile update failed:", err);
    }

    setIsEditingProfile(false);
    addNotification("Profile Updated", "Your full medical profile details and registered credentials have been updated successfully.");
  };

  // Filter appointments for this logged-in patient to ensure data isolation
  const appointments = React.useMemo(() => {
    if (!userEmail || userEmail === 'aarav.mehta@doctspark.in' || userEmail === 'patient@doctspark.in') {
      return allAppointments; // return all or default patient's appointments
    }
    return allAppointments.filter(a => a.patientId === userEmail || a.patientName.toLowerCase() === patientName.toLowerCase());
  }, [allAppointments, userEmail, patientName]);

  // Calculate statistics from appointment state
  const totalAppointments = appointments.length;
  const upcomingCount = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const prescriptionCount = appointments.filter(a => a.prescription).length;

  const upcomingAppointments = appointments
    .filter(a => a.status === 'Confirmed' || a.status === 'Pending')
    .slice(0, 2);

  const [activePrescription, setActivePrescription] = React.useState<Prescription | null>(null);

  // Real Wallet and Referral Program state
  const [wallet, setWallet] = React.useState(() => getOrCreatePatientWallet(patientEmail));
  const walletConfig = getWalletAdminConfig();

  const refreshWallet = () => {
    setWallet(getOrCreatePatientWallet(patientEmail));
  };

  const [localNotifications, setLocalNotifications] = React.useState<any[]>(() => {
    const saved = localStorage.getItem(`ds_pat_notifications_${patientEmail}`);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'n-1', title: 'MCI Verification Complete', text: 'Your Doct Spark patient profile is 100% active and secure.', date: '2026-07-06', time: '10:00 AM', read: false },
      { id: 'n-2', title: 'Welcome Bonus Credited', text: '₹200 welcome bonus credited to your Spark Wallet!', date: '2026-07-06', time: '10:01 AM', read: true }
    ];
  });

  const addNotification = (title: string, text: string) => {
    const newNotif = {
      id: `NOTIF-${Math.floor(100 + Math.random() * 900)}`,
      title,
      text,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    const updated = [newNotif, ...localNotifications];
    setLocalNotifications(updated);
    localStorage.setItem(`ds_pat_notifications_${patientEmail}`, JSON.stringify(updated));
  };

  const deductFromWallet = (amount: number, reason: string): boolean => {
    const result = debitPatientWallet(patientEmail, amount, 'Platform Fee Payment', reason);
    if (result) {
      refreshWallet();
      addNotification('Wallet Debited', `₹${amount} debited for: ${reason}`);
      return true;
    }
    return false;
  };

  const [copied, setCopied] = React.useState(false);
  const [referralCodeInput, setReferralCodeInput] = React.useState('');
  const [referralApplied, setReferralApplied] = React.useState(() => {
    const w = getOrCreatePatientWallet(patientEmail);
    return !!w.referredByCode;
  });
  const [appliedCode, setAppliedCode] = React.useState(() => {
    const w = getOrCreatePatientWallet(patientEmail);
    return w.referredByCode || '';
  });
  const [referralError, setReferralError] = React.useState('');
  const [referralSuccessMsg, setReferralSuccessMsg] = React.useState('');

  // Active Tab State
  const [activeTab, setActiveTab] = React.useState<'overview' | 'book' | 'appointments' | 'prescriptions' | 'wallet' | 'profile' | 'laboratory' | 'pharmacy' | 'physiotherapy'>('overview');

  // Local Mobile Sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Collapsible parent categories in Sidebar
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'workspace': true,
    'directory': true,
    'records': true,
    'finances': true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Search and Filter states for Appointments & Prescriptions
  const [aptSearch, setAptSearch] = React.useState('');
  const [aptFilter, setAptFilter] = React.useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [rxSearch, setRxSearch] = React.useState('');

  // Sync with standard header navigation dispatch events
  React.useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        const tab = customEvent.detail;
        if (tab === 'overview' || tab === 'dashboard') {
          setActiveTab('overview');
        } else if (tab === 'doctors' || tab === 'book') {
          setActiveTab('book');
        } else if (tab === 'appointments') {
          setActiveTab('appointments');
        } else if (tab === 'prescriptions') {
          setActiveTab('prescriptions');
        } else if (tab === 'wallet' || tab === 'earnings') {
          setActiveTab('wallet');
        } else if (tab === 'profile' || tab === 'settings') {
          setActiveTab('profile');
        }
      }
    };
    window.addEventListener('patient-tab-change', handleTabChange);
    return () => {
      window.removeEventListener('patient-tab-change', handleTabChange);
    };
  }, []);

  const handleJoinCall = (roomId: string) => {
    setSelectedRoomId(roomId);
    setView('video-call');
  };

  const handleShareReferral = () => {
    navigator.clipboard.writeText(wallet.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert(`Referral code ${wallet.referralCode} copied to clipboard! Share it with friends to earn wallet rewards on successful consultations.`);
    });
  };

  const handleApplyReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setReferralError('');
    setReferralSuccessMsg('');

    const trimmedInput = referralCodeInput.trim().toUpperCase();
    if (!trimmedInput) {
      setReferralError('Please enter a referral code.');
      return;
    }

    if (trimmedInput === wallet.referralCode) {
      setReferralError("You cannot refer yourself! Please enter a friend's referral code.");
      return;
    }

    const verifiedPartner = validateReferralId(trimmedInput);
    if (verifiedPartner) {
      setReferralApplied(true);
      setAppliedCode(trimmedInput);
      setReferralSuccessMsg(`Linked with DOCT SPARK Partner: ${verifiedPartner.name} (${verifiedPartner.partnerType})!`);
      setReferralCodeInput('');
      return;
    }

    try {
      const success = applyReferralCode(patientEmail, trimmedInput);
      if (success) {
        setReferralApplied(true);
        setAppliedCode(trimmedInput);
        setReferralSuccessMsg(`Referral code "${trimmedInput}" successfully applied! You will receive a 1% wallet reward when you complete your first consultation.`);
        setReferralCodeInput('');
        refreshWallet();
      } else {
        setReferralError('This referral code has already been applied or is invalid.');
      }
    } catch (err: any) {
      setReferralError(err.message || 'Invalid referral code.');
    }
  };

  const specialties = [
    { id: 'cardiology', name: 'Cardiology', icon: '❤️', desc: 'Heart health, blood pressure, and cardiovascular evaluations.' },
    { id: 'pediatrics', name: 'Pediatrics', icon: '👶', desc: 'Child wellness, growth trackers, and newborn immunizations.' },
    { id: 'dermatology', name: 'Dermatology', icon: '🧴', desc: 'Skin care, acne treatment, rashes, and hair consulting.' },
    { id: 'orthopedics', name: 'Orthopedics', icon: '🦴', desc: 'Bone health, muscle injuries, arthritis, and physical rehabilitation.' },
    { id: 'gynecology', name: 'Gynecology', icon: '🤰', desc: 'Womens health, family planning, and prenatal support.' },
    { id: 'dental', name: 'Dental Care', icon: '🦷', desc: 'Teeth cleaning, scaling, orthodontic consultations, and pain relief.' },
    { id: 'neurology', name: 'Neurology', icon: '🧠', desc: 'Nervous system care, chronic migraine, and brain wellness.' },
    { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️', desc: 'Eye tests, vision power adjustments, and specialized eye care.' }
  ];

  // List of medical reminders (MCI Standards)
  const medicalReminders = [
    {
      id: 'rem-1',
      category: 'Clinical Follow-Up',
      detail: 'Consult Dr. Rajesh Khanna for cardiac post-op checkup evaluation.',
      due: 'Within 2 days',
      type: 'warning'
    },
    {
      id: 'rem-2',
      category: 'Medication Tracker',
      detail: 'Apply Desonide Skin Cream twice daily on dry rashes as prescribed by Dr. Preeti Verma.',
      due: 'Daily (Morning & Evening)',
      type: 'info'
    },
    {
      id: 'rem-3',
      category: 'Vaccination Alert',
      detail: 'Standard preventative seasonal booster evaluation due at nearby verified clinics.',
      due: 'Next week',
      type: 'neutral'
    }
  ];

  // Filtered lists for dedicated tab content
  const filteredAppointments = React.useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = apt.doctorName.toLowerCase().includes(aptSearch.toLowerCase()) || 
                            apt.doctorSpecialty.toLowerCase().includes(aptSearch.toLowerCase()) ||
                            (apt.clinicName && apt.clinicName.toLowerCase().includes(aptSearch.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      if (aptFilter === 'upcoming') {
        return apt.status === 'Confirmed' || apt.status === 'Pending';
      }
      if (aptFilter === 'completed') {
        return apt.status === 'Completed';
      }
      if (aptFilter === 'cancelled') {
        return apt.status === 'Cancelled' || apt.status === 'Expired';
      }
      return true;
    });
  }, [appointments, aptSearch, aptFilter]);

  const filteredPrescriptions = React.useMemo(() => {
    return appointments
      .filter(apt => apt.prescription)
      .map(apt => apt.prescription!)
      .filter(rx => {
        return rx.doctorName.toLowerCase().includes(rxSearch.toLowerCase()) || 
               rx.diagnosis.toLowerCase().includes(rxSearch.toLowerCase()) ||
               rx.medicines.some(m => m.name.toLowerCase().includes(rxSearch.toLowerCase()));
      });
  }, [appointments, rxSearch]);

  const alliedStatsAndBookings = React.useMemo(() => {
    const savedLab = localStorage.getItem('ds_lab_bookings');
    const labList = savedLab ? JSON.parse(savedLab) : [];
    const myLabs = labList.filter((b: any) => b.patientEmail === patientEmail);

    const savedPharm = localStorage.getItem('ds_medicine_orders');
    const pharmList = savedPharm ? JSON.parse(savedPharm) : [];
    const myOrders = pharmList.filter((o: any) => o.patientEmail === patientEmail);

    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    const physiosList = savedPhysios ? JSON.parse(savedPhysios) : [];
    const myPhysios: any[] = [];
    physiosList.forEach((phy: any) => {
      const emailKey = phy.email.replace(/\./g, '_');
      const savedApts = localStorage.getItem(`ds_physio_appointments_${emailKey}`);
      if (savedApts) {
        const list = JSON.parse(savedApts);
        list.filter((a: any) => a.patientEmail === patientEmail).forEach((a: any) => {
          myPhysios.push({ ...a, physioName: phy.name, physioSpecialty: phy.specialty });
        });
      }
    });

    return {
      labCount: myLabs.length,
      pharmCount: myOrders.length,
      physioCount: myPhysios.length,
      myLabs: myLabs,
      myOrders: myOrders,
      myPhysios: myPhysios
    };
  }, [patientEmail]);

  const patientSidebarCategories = [
    {
      id: 'workspace',
      label: 'Health Workspace',
      icon: Activity,
      items: [
        { id: 'overview', type: 'tab', label: 'Health Overview', icon: Activity },
        { id: 'profile', type: 'tab', label: 'My Profile & Alerts', icon: UserCheck }
      ]
    },
    {
      id: 'directory',
      label: 'Medical Directory',
      icon: Search,
      items: [
        { id: 'book', type: 'tab', label: 'Book Specialist', icon: Search },
        { id: 'clinics', type: 'view', label: 'Verified Clinics', icon: MapPin },
        { id: 'specialties', type: 'view', label: 'Doctor Specialties', icon: ClipboardList },
        { id: 'nearby', type: 'view', label: 'Live Location Map', icon: MapPin }
      ]
    },
    {
      id: 'records',
      label: 'Care Records',
      icon: ClipboardList,
      items: [
        { id: 'appointments', type: 'tab', label: 'Consultations & Bookings', icon: Calendar, count: upcomingCount },
        { id: 'prescriptions', type: 'tab', label: 'Prescriptions & Reports', icon: FileSpreadsheet, count: prescriptionCount }
      ]
    },
    {
      id: 'finances',
      label: 'Wallet & Rewards',
      icon: Wallet,
      items: [
        { id: 'wallet', type: 'tab', label: 'Spark Wallet', icon: Wallet },
        { id: 'wallet', type: 'tab', label: 'Referrals & Earnings', icon: Gift }
      ]
    },
    {
      id: 'allied',
      label: 'Allied Services',
      icon: ClipboardList,
      items: [
        { id: 'laboratory', type: 'tab', label: 'Laboratories & Tests', icon: FileSpreadsheet },
        { id: 'pharmacy', type: 'tab', label: 'Pharmacy & Medicines', icon: FileText },
        { id: 'physiotherapy', type: 'tab', label: 'Physiotherapy rehab', icon: Calendar }
      ]
    }
  ];

  const renderSidebarContent = () => {
    return (
      <div className="flex flex-col gap-6">
        {/* Patient Profile Header inside Sidebar */}
        <div className="pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A6E6E]/10 flex items-center justify-center text-[#0A6E6E] font-black text-sm border border-[#0A6E6E]/20 relative">
            {patientName.split(' ').map(n => n[0]).join('')}
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{patientName}</h4>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block font-mono">ID: DS-PAT-384</span>
          </div>
        </div>

        {patientSidebarCategories.map((category) => {
          const isExpanded = expandedGroups[category.id] !== false;
          const CategoryIcon = category.icon;
          return (
            <div key={category.id} className="flex flex-col border-b border-[#D1E5E5]/30 pb-4 last:border-b-0 last:pb-0">
              {/* Category Header */}
              <button
                onClick={() => toggleGroup(category.id)}
                className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-[#0A6E6E] hover:text-[#0A6E6E] px-2 py-1.5 rounded-lg hover:bg-teal-50/50 transition-colors w-full cursor-pointer mb-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-3.5 h-3.5" />
                  <span>{category.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Sub-items list */}
              <div className={`flex flex-col gap-1 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                {category.items.map((item, subIdx) => {
                  const ItemIcon = item.icon;
                  const isActive = item.type === 'tab' ? activeTab === item.id : false;
                  return (
                    <button
                      key={`${item.id}-${subIdx}`}
                      onClick={() => {
                        if (item.type === 'tab') {
                          setActiveTab(item.id as any);
                        } else if (item.type === 'view') {
                          setView(item.id);
                        }
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-left w-full ${
                        isActive
                          ? 'bg-[#0A6E6E] text-white shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-[#0A6E6E] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${isActive ? 'bg-white text-[#0A6E6E]' : 'bg-red-500 text-white'}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Sidebar quick program promotion card */}
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col gap-2 mt-auto">
          <div className="flex items-center gap-2 text-amber-800">
            <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-wider">Earn ₹100 Rewards</span>
          </div>
          <p className="text-[9px] text-amber-900/85 leading-normal font-semibold">
            Share code <strong className="font-mono">{wallet.referralCode}</strong>. Your friend gets discounts and you receive cashback!
          </p>
          <button 
            onClick={handleShareReferral}
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold rounded-lg transition-colors cursor-pointer text-center"
          >
            {copied ? 'Copied' : 'Share Now'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="patient-dashboard-container">

      {/* Mobile Header Bar */}
      <div className="lg:hidden flex justify-between items-center bg-white border border-[#D1E5E5] rounded-2xl px-4 py-3 mb-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 bg-teal-50 text-[#0A6E6E] rounded-xl border border-teal-100"
          >
            <Menu className="w-5 h-5 cursor-pointer" />
          </button>
          <div>
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Health Portal</span>
            <span className="text-xs font-black text-slate-800">
              {activeTab === 'overview' && '📊 Health Overview'}
              {activeTab === 'book' && '🔍 Book Specialist'}
              {activeTab === 'appointments' && '📅 Consultations & Bookings'}
              {activeTab === 'prescriptions' && '📋 Prescriptions & Reports'}
              {activeTab === 'wallet' && '💳 Spark Wallet'}
              {activeTab === 'profile' && '👤 My Profile & Alerts'}
              {activeTab === 'laboratory' && '🔬 Diagnostic Pathology Lab'}
              {activeTab === 'pharmacy' && '💊 Digital Pharmacy & Meds'}
              {activeTab === 'physiotherapy' && '♿ Physical Physiotherapy'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="text-xs font-extrabold bg-[#0A6E6E]/10 text-[#0A6E6E] px-3 py-1.5 rounded-xl border border-[#0A6E6E]/15 hover:bg-[#0A6E6E]/15 transition-all cursor-pointer"
        >
          Menu
        </button>
      </div>

      {/* Local Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="relative w-80 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-extrabold text-[#0A6E6E]">Health Control Panel</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderSidebarContent()}
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <div className="px-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Logged in patient</span>
                <span className="block text-xs font-bold text-slate-800 truncate">{patientName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMN 1: REDESIGNED PATIENT SIDEBAR */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white border border-[#D1E5E5] rounded-3xl p-6 shadow-3xs flex flex-col gap-6">
            {renderSidebarContent()}
          </div>
        </div>

        {/* COLUMN 2: DYNAMIC ACTIVE TAB VIEWS */}
        <div className="lg:col-span-3">

          {/* =========================================
              VIEW 1: OVERVIEW / DASHBOARD HOME
              ========================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200" id="tab-overview">
              
              {/* Premium Welcome Banner */}
              <div className="bg-gradient-to-r from-[#0A6E6E] to-[#128a8a] text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -mr-12 -mt-12"></div>
                <div>
                  <span className="text-xs font-black text-[#F5A623] uppercase tracking-widest block mb-1">DOCT SPARK PATIENT PORTAL</span>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Good morning, {patientName}!</h1>
                  <p className="text-xs text-[#D1E5E5] mt-1.5 leading-relaxed max-w-xl">
                    Welcome back to your personalized healthcare center. Keep track of your medical reports, verified prescriptions, and scheduled clinic visits below.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div className="text-left">
                    <span className="block text-[9px] font-bold text-[#D1E5E5] uppercase">MCI Certified</span>
                    <span className="block text-xs font-extrabold text-white">Full Privacy Protection</span>
                  </div>
                </div>
              </div>

              {/* Patient Spark Wallet & Referral Program overview widget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Real Wallet Balance Card */}
                <div className="bg-white p-5 rounded-3xl border border-[#D1E5E5] shadow-3xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider flex items-center gap-1.5">
                        💳 Spark Wallet Balance
                      </h2>
                      <span className="text-xs font-extrabold text-[#0A6E6E] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                        ₹{wallet.balance.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Referral Cashbacks</span>
                        <span className="text-xs font-black text-[#1A2B3C]">₹{wallet.referralEarnings.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Platform Refunds</span>
                        <span className="text-xs font-black text-[#1A2B3C]">₹{wallet.refundEarnings.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Latest wallet transaction quick preview */}
                    <div className="mt-1">
                      <span className="text-[9px] uppercase font-black text-gray-500 block mb-2">Latest Ledger</span>
                      {wallet.transactions.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">No transactions recorded yet.</p>
                      ) : (
                        <div className="space-y-1 text-[10px]">
                          {wallet.transactions.slice(0, 1).map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <div>
                                <span className="font-extrabold text-[#1A2B3C] block">{tx.type}</span>
                                <span className="text-[8px] text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</span>
                              </div>
                              <span className={`font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('wallet')}
                    className="w-full text-center text-[#0A6E6E] hover:text-[#0A6E6E]/90 text-xs font-black mt-4 flex items-center justify-center gap-1.5"
                  >
                    <span>Manage Wallet Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Referral Sharing Card */}
                <div className="bg-white p-5 rounded-3xl border border-[#D1E5E5] shadow-3xs flex flex-col justify-between">
                  <div>
                    <h2 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      🎁 Cashback Referrals
                    </h2>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                      Share your digital code. When friends join and finish their initial clinic or video consultation, enjoy a **1% cash reward** directly in your wallet!
                    </p>

                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[8px] uppercase font-black text-amber-800 tracking-wider block">Code to Share</span>
                        <span className="text-sm font-black text-amber-900 font-mono">{wallet.referralCode}</span>
                      </div>
                      <button
                        onClick={handleShareReferral}
                        className="px-3.5 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Share'}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('wallet')}
                    className="w-full text-center text-[#0A6E6E] hover:text-[#0A6E6E]/90 text-xs font-black mt-4 flex items-center justify-center gap-1.5"
                  >
                    <span>Apply Friend's Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Consultations', value: totalAppointments, icon: <ClipboardList className="w-5 h-5 text-[#0A6E6E]" />, bg: 'bg-[#F0F7F7]' },
                  { label: 'Lab Bookings', value: alliedStatsAndBookings.labCount, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
                  { label: 'Medicine Orders', value: alliedStatsAndBookings.pharmCount, icon: <FileSpreadsheet className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
                  { label: 'Physiotherapy', value: alliedStatsAndBookings.physioCount, icon: <Activity className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-4.5 rounded-2xl border border-[#D1E5E5] flex items-center gap-3.5">
                    <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      {stat.icon}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block leading-tight">{stat.label}</span>
                      <span className="text-xl font-extrabold text-[#1A2B3C]">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Split Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Columns (Upcoming Consultations) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  <div>
                    <h2 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0A6E6E]" />
                      <span>Next Pending consultations ({upcomingAppointments.length})</span>
                    </h2>

                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.map((apt) => (
                          <div key={apt.id} className="bg-white border-2 border-[#0A6E6E]/30 hover:border-[#0A6E6E]/60 rounded-2xl p-5 shadow-3xs flex flex-col sm:flex-row justify-between gap-4 transition-all">
                            <div className="flex items-start gap-4">
                              <img src={apt.doctorPhoto || undefined} alt={apt.doctorName} className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0" referrerPolicy="no-referrer" />
                              <div>
                                <h3 className="text-sm font-extrabold text-[#1A2B3C]">{apt.doctorName}</h3>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">
                                  {apt.doctorSpecialty} {apt.clinicName ? `• ${apt.clinicName}` : ''}
                                </p>
                                
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 font-bold mt-2.5 items-center">
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#0A6E6E]" /> {apt.date}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#F5A623]" /> {apt.time}</span>
                                  <span className="bg-[#F0F7F7] text-[#0A6E6E] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-[#0A6E6E]/10">
                                    {apt.type} Visit
                                  </span>
                                  {apt.serialNo && (
                                    <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                                      Queue Serial: #{apt.serialNo}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col justify-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              {apt.type === 'Video' && apt.roomId ? (
                                <button
                                  onClick={() => handleJoinCall(apt.roomId!)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-sm shrink-0 transition-colors cursor-pointer"
                                >
                                  <Video className="w-3.5 h-3.5" /> Join Live Room
                                </button>
                              ) : (
                                <div className="text-[10px] text-gray-400 font-black uppercase p-2 border border-dashed border-gray-200 rounded-xl text-center">
                                  🏥 Walk-in Clinic Desk
                                </div>
                              )}
                              <button 
                                onClick={() => alert(`Consultation ID: ${apt.id}\nReason: ${apt.reason}\nStatus: ${apt.status}\nFee: ₹${apt.fee}`)}
                                className="px-4 py-2 hover:bg-[#F0F7F7] text-[#0A6E6E] font-extrabold text-xs border border-[#D1E5E5] rounded-xl shrink-0 transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-[#D1E5E5] rounded-3xl p-8 text-center shadow-3xs">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-semibold">No upcoming appointments scheduled today.</p>
                        <button onClick={() => setActiveTab('book')} className="text-xs font-black text-[#0A6E6E] hover:underline mt-2 inline-block">
                          Find a specialist & book now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Allied Services Bookings Overview */}
                  <div className="bg-white rounded-3xl border border-[#D1E5E5] p-5 shadow-3xs space-y-4">
                    <h2 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest flex items-center gap-2 border-b border-gray-50 pb-2">
                      <span>🔬 Recent Pathology & Pharmacy Logs</span>
                    </h2>
                    
                    <div className="space-y-3 text-xs">
                      {/* Labs */}
                      {alliedStatsAndBookings.myLabs.slice(0, 1).map((b) => (
                        <div key={b.id} className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-extrabold text-indigo-800">🔬 {b.itemName}</span>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Lab: {b.labName} • Slot: {b.date}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase bg-white px-2 py-0.5 border rounded-full text-indigo-700">{b.status}</span>
                        </div>
                      ))}

                      {/* Pharmacy */}
                      {alliedStatsAndBookings.myOrders.slice(0, 1).map((o) => (
                        <div key={o.id} className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-extrabold text-blue-800">💊 Medicine Order: {o.id}</span>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Items Total: ₹{o.total} • Order Date: {o.date}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase bg-white px-2 py-0.5 border rounded-full text-blue-700">{o.status}</span>
                        </div>
                      ))}

                      {/* Physio */}
                      {alliedStatsAndBookings.myPhysios.slice(0, 1).map((p) => (
                        <div key={p.id} className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="font-extrabold text-emerald-800">♿ Physio with {p.physioName}</span>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Specialty: {p.physioSpecialty} • Slot: {p.date}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase bg-white px-2 py-0.5 border rounded-full text-emerald-700">{p.status}</span>
                        </div>
                      ))}

                      {alliedStatsAndBookings.labCount === 0 && alliedStatsAndBookings.pharmCount === 0 && alliedStatsAndBookings.physioCount === 0 && (
                        <p className="text-gray-400 italic text-center py-4 font-semibold">No allied diagnostic or pharmacy logs recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent activities log */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest">
                        Recent Activity Log
                      </h2>
                      <button onClick={() => setActiveTab('appointments')} className="text-xs font-bold text-[#0A6E6E] hover:underline">
                        View All History
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#D1E5E5] overflow-hidden shadow-3xs">
                      <div className="divide-y divide-gray-100">
                        {appointments.slice(0, 3).map((apt) => (
                          <div key={apt.id} className="p-4.5 hover:bg-[#F0F7F7]/40 transition-colors flex justify-between items-center text-xs">
                            <div>
                              <div className="font-extrabold text-[#1A2B3C] flex items-center gap-1.5">
                                <span>{apt.doctorName}</span>
                                {apt.serialNo && (
                                  <span className="bg-amber-50 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                                    Serial: #{apt.serialNo}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                                {apt.doctorSpecialty} {apt.clinicName ? `(${apt.clinicName})` : ''} • {apt.date} at {apt.time}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {apt.prescription && (
                                <button
                                  onClick={() => setActivePrescription(apt.prescription!)}
                                  className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  View Rx
                                </button>
                              )}
                              <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                apt.status === 'Completed' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : apt.status === 'Cancelled' 
                                  ? 'bg-red-50 text-red-700 border-red-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {appointments.length === 0 && (
                          <div className="p-8 text-center text-gray-400 italic font-semibold text-xs">
                            No consultation history recorded.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Columns (Reminders & Quick Actions) */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Quick Actions Panel */}
                  <div className="bg-white rounded-3xl border border-[#D1E5E5] p-5 shadow-3xs">
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">
                      Direct Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setActiveTab('book')}
                        className="p-4 bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] rounded-2xl text-center font-extrabold text-xs text-[#0A6E6E] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-3xs"
                      >
                        <span className="text-lg">🔍</span>
                        <span>Find Specialist</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('book')}
                        className="p-4 bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] rounded-2xl text-center font-extrabold text-xs text-[#0A6E6E] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-3xs"
                      >
                        <PlusCircle className="w-5 h-5 text-[#F5A623]" />
                        <span>Book Slots</span>
                      </button>
                      <button 
                        onClick={() => {
                          const hasPres = appointments.find(a => a.prescription);
                          if (hasPres?.prescription) {
                            setActivePrescription(hasPres.prescription);
                          } else {
                            alert("No prescriptions active on this account yet. Standard prescriptions are created upon completing Video appointments!");
                          }
                        }}
                        className="p-4 bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] rounded-2xl text-center font-extrabold text-xs text-[#0A6E6E] flex flex-col items-center justify-center gap-2 transition-all col-span-2 cursor-pointer hover:shadow-3xs"
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>Browse Prescriptions</span>
                      </button>
                    </div>
                  </div>

                  {/* Medical Council Care Reminders */}
                  <div className="bg-white rounded-3xl border border-[#D1E5E5] p-5 shadow-3xs">
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <BellRing className="w-4 h-4 text-[#F5A623]" /> 
                      <span>Clinical Reminders</span>
                    </h3>
                    <div className="space-y-3.5">
                      {medicalReminders.slice(0, 2).map((rem) => (
                        <div key={rem.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-semibold text-gray-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[#0A6E6E] font-black uppercase text-[8px] tracking-wider">{rem.category}</span>
                            <span className="text-[8px] bg-white text-gray-400 font-bold px-1.5 py-0.5 rounded border border-gray-100">{rem.due}</span>
                          </div>
                          <p className="text-gray-600 leading-normal">{rem.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =========================================
              VIEW 2: BOOK SPECIALIST / APPOINTMENTS
              ========================================= */}
          {activeTab === 'book' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-book">
              
              <div className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#0A6E6E]/5 -mr-10 -mt-10"></div>
                <h2 className="text-base font-black text-[#0A6E6E] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#F5A623] fill-current" />
                  <span>Book Consultations Instantly</span>
                </h2>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-2xl">
                  Connect with India's top-tier, MCI-certified specialist doctors. Choose virtual live high-definition Video consultations, or reserve physical Walk-In queue slips at nearby clinics instantly.
                </p>

                {/* Mock Search Bar Redirecting */}
                <div className="mt-5 max-w-lg flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </span>
                    <input 
                      type="text" 
                      onClick={() => setView('doctors')}
                      placeholder="Search doctor names, clinics, or specialized symptoms..."
                      className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1E5E5] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A6E6E] cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={() => setView('doctors')}
                    className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Specialties Grid */}
              <div>
                <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest mb-4">
                  Browse Clinical Specialties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {specialties.map((spec) => (
                    <div 
                      key={spec.id} 
                      onClick={() => {
                        // Normally this would filter. We redirect to doctors search view
                        setView('doctors');
                      }}
                      className="bg-white border border-[#D1E5E5] rounded-2xl p-4.5 hover:border-[#0A6E6E] transition-all cursor-pointer hover:shadow-3xs flex flex-col justify-between h-40 group"
                    >
                      <div>
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200 origin-left">{spec.icon}</div>
                        <h4 className="text-xs font-black text-[#1A2B3C] group-hover:text-[#0A6E6E]">{spec.name}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-1">{spec.desc}</p>
                      </div>
                      <div className="text-[9px] font-black text-[#0A6E6E] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                        <span>Book Slots</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Hospital & Clinic redirection card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-lg">🏥</div>
                  <div>
                    <h4 className="text-xs font-black text-[#1A2B3C]">Prefer physical walk-in clinics?</h4>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Explore nearest multi-specialty healthcare clinics or major certified diagnostic hospitals.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setView('clinics')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shrink-0 transition-colors cursor-pointer"
                >
                  Locate Clinics
                </button>
              </div>

            </div>
          )}

          {/* =========================================
              VIEW 3: MY CONSULTATIONS LIST
              ========================================= */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-appointments">
              
              {/* Header with quick search & filter */}
              <div className="bg-white p-5 rounded-3xl border border-[#D1E5E5] shadow-3xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-black text-[#1A2B3C]">My Consultations History</h2>
                    <p className="text-[10px] text-gray-400 font-semibold">Monitor live queue progress, download prescription papers, and join remote video call rooms.</p>
                  </div>
                  
                  {/* Status Filters */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'upcoming', label: 'Pending / Confirmed' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'cancelled', label: 'Cancelled' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setAptFilter(f.id as any)}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                          aptFilter === f.id 
                            ? 'bg-[#0A6E6E] text-white' 
                            : 'bg-slate-50 text-gray-500 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    value={aptSearch}
                    onChange={(e) => setAptSearch(e.target.value)}
                    placeholder="Search consultations by doctor name, clinical specialty, or center..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0A6E6E] focus:bg-white"
                  />
                </div>
              </div>

              {/* Consultation list results */}
              <div className="space-y-4">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img src={apt.doctorPhoto || undefined} alt={apt.doctorName} className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0" referrerPolicy="no-referrer" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-[#1A2B3C]">{apt.doctorName}</h3>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            apt.status === 'Completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : apt.status === 'Cancelled' || apt.status === 'Expired'
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">{apt.doctorSpecialty} {apt.clinicName ? `• ${apt.clinicName}` : ''}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 font-bold mt-3 items-center">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#0A6E6E]" /> {apt.date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#F5A623]" /> {apt.time}</span>
                          <span className="bg-[#F0F7F7] text-[#0A6E6E] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            {apt.type} Visit
                          </span>
                          {apt.serialNo && (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                              Queue Serial: #{apt.serialNo}
                            </span>
                          )}
                        </div>

                        {apt.reason && (
                          <p className="text-[11px] text-gray-500 mt-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
                            <span className="text-gray-400 font-bold block text-[8px] uppercase">Reason for booking</span>
                            {apt.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {apt.type === 'Video' && (apt.status === 'Confirmed' || apt.status === 'Pending') && apt.roomId ? (
                        <button
                          onClick={() => handleJoinCall(apt.roomId!)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-sm shrink-0 transition-colors cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Video
                        </button>
                      ) : null}

                      {apt.prescription && (
                        <button
                          onClick={() => setActivePrescription(apt.prescription!)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-extrabold text-xs rounded-xl shrink-0 transition-colors cursor-pointer"
                        >
                          View Prescription
                        </button>
                      )}

                      <button
                        onClick={() => alert(`Full Log Details:\nConsult ID: ${apt.id}\nPatient: ${apt.patientName}\nDoctor: ${apt.doctorName}\nDate: ${apt.date}\nTime: ${apt.time}\nType: ${apt.type}\nFee Amount: ₹${apt.fee}\nPayment Status: ${apt.paymentStatus || 'Paid'}`)}
                        className="px-4 py-2 hover:bg-[#F0F7F7] text-[#0A6E6E] font-extrabold text-xs border border-[#D1E5E5] rounded-xl shrink-0 transition-colors cursor-pointer"
                      >
                        Receipt Info
                      </button>
                    </div>
                  </div>
                ))}

                {filteredAppointments.length === 0 && (
                  <div className="bg-white border border-[#D1E5E5] rounded-3xl p-12 text-center shadow-3xs">
                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">No matching consultations</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-normal">
                      Try resetting your search query or switching your status filter categories.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =========================================
              VIEW 4: PRESCRIPTIONS & MEDICAL DOCUMENTS
              ========================================= */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-prescriptions">
              
              {/* Prescription Header Search */}
              <div className="bg-white p-5 rounded-3xl border border-[#D1E5E5] shadow-3xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-black text-[#1A2B3C]">My Verified Digital Prescriptions ({filteredPrescriptions.length})</h2>
                    <p className="text-[10px] text-gray-400 font-semibold">MCI-compliant cloud prescription registry. View dosage instructions and download authorized scan papers.</p>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    value={rxSearch}
                    onChange={(e) => setRxSearch(e.target.value)}
                    placeholder="Search prescriptions by doctor name, diagnosis report, or medicine name..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0A6E6E] focus:bg-white"
                  />
                </div>
              </div>

              {/* Grid of Prescriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPrescriptions.map((rx) => (
                  <div key={rx.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between h-fit">
                    <div>
                      <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2.5">
                        <div>
                          <span className="text-[9px] bg-teal-50 text-[#0A6E6E] font-black uppercase px-2 py-0.5 rounded border border-teal-100 block w-fit">℞ Active</span>
                          <h3 className="text-sm font-extrabold text-[#1A2B3C] mt-1">{rx.doctorName}</h3>
                        </div>
                        <div className="text-right text-[10px]">
                          <span className="font-bold text-gray-400 block">{rx.date}</span>
                          <span className="font-mono text-gray-400 font-bold">RX-ID: {rx.id}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">Primary Diagnosis</span>
                          <p className="text-xs font-extrabold text-slate-800">{rx.diagnosis}</p>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">Medicines ({rx.medicines.length})</span>
                          <div className="space-y-1">
                            {rx.medicines.slice(0, 2).map((med, idx) => (
                              <div key={idx} className="bg-slate-50 p-1.5 rounded-lg text-[10px] font-semibold text-gray-700 flex justify-between">
                                <span className="font-bold text-slate-800">{med.name}</span>
                                <span className="text-[#0A6E6E]">{med.dosage} • {med.duration}</span>
                              </div>
                            ))}
                            {rx.medicines.length > 2 && (
                              <p className="text-[9px] text-gray-400 italic font-semibold">+ {rx.medicines.length - 2} more medications recommended</p>
                            )}
                          </div>
                        </div>

                        {rx.notes && (
                          <div className="bg-[#F0F7F7] p-2 rounded-xl text-[10px] text-gray-600 italic">
                            {rx.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-gray-50 pt-3 flex justify-end gap-2">
                      <button
                        onClick={() => setActivePrescription(rx)}
                        className="px-3.5 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer w-full text-center"
                      >
                        Open Full Medical RX
                      </button>
                    </div>
                  </div>
                ))}

                {filteredPrescriptions.length === 0 && (
                  <div className="col-span-1 md:col-span-2 bg-white border border-[#D1E5E5] rounded-3xl p-12 text-center shadow-3xs">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">No verified prescriptions found</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-normal">
                      Standard prescriptions are automatically published by doctors here once consultation appointments are marked as Completed.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =========================================
              VIEW 5: SPARK WALLET & REFERRAL PROGRAM
              ========================================= */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-wallet">
              
              {/* Grand Wallet Balance Header Card */}
              <div className="bg-white border border-[#D1E5E5] rounded-3xl p-6 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0A6E6E]">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Spark Wallet Balance</span>
                    <h2 className="text-2xl font-black text-[#1A2B3C]">₹{wallet.balance.toFixed(2)}</h2>
                  </div>
                </div>
                
                {/* Secondary Stats */}
                <div className="flex gap-4">
                  <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <span className="text-[8px] uppercase font-black text-gray-400 block tracking-wider">Referral cash</span>
                    <span className="text-xs font-black text-slate-800">₹{wallet.referralEarnings.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <span className="text-[8px] uppercase font-black text-gray-400 block tracking-wider">Refund ledger</span>
                    <span className="text-xs font-black text-slate-800">₹{wallet.refundEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Referral Center Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sharing Campaign Box */}
                <div className="bg-white border border-[#D1E5E5] p-5 rounded-3xl shadow-3xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-500" />
                      <span>Cashback Program Instructions</span>
                    </h3>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
                      Invite friends to sign up! When they enter your unique sharing code during checkouts and successfully finish their first clinic visit or high-definition Video consultation, we instantly transfer **1% wallet cashback** of their total consult cost straight to your account ledger!
                    </p>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[8px] uppercase font-black text-amber-800 tracking-wider block">Your Sharing Referral Code</span>
                        <span className="text-base font-black text-amber-900 font-mono leading-tight">{wallet.referralCode}</span>
                      </div>
                      <button
                        onClick={handleShareReferral}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Apply Friend Referral Code Box */}
                <div className="bg-white border border-[#D1E5E5] p-5 rounded-3xl shadow-3xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-500" />
                      <span>Link Referral Code</span>
                    </h3>
                    <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
                      Were you introduced to DOCT SPARK by an authorized partner or a friend? Enter their referral code below to instantly activate bonus structures on your first completed consultation.
                    </p>

                    {!referralApplied ? (
                      <form onSubmit={handleApplyReferral} className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={referralCodeInput}
                            onChange={(e) => setReferralCodeInput(e.target.value)}
                            placeholder="Enter friend or partner code"
                            className="flex-1 px-3 py-2 border border-[#D1E5E5] rounded-xl text-xs font-bold uppercase font-mono tracking-wider focus:outline-none focus:border-[#0A6E6E]"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {referralError && <p className="text-[10px] text-red-500 font-bold">{referralError}</p>}
                        {referralSuccessMsg && <p className="text-[10px] text-emerald-600 font-bold">{referralSuccessMsg}</p>}
                      </form>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800 font-semibold flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="block font-black text-[11px]">Referral Linked successfully!</span>
                          <span>Code Applied: <strong className="font-mono text-emerald-900">{appliedCode}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Detailed Wallet Ledger Transactions */}
              <div className="bg-white border border-[#D1E5E5] rounded-3xl shadow-3xs overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest">
                    Wallet Transactions Ledger
                  </h3>
                </div>

                <div className="divide-y divide-gray-100">
                  {wallet.transactions.map((tx) => (
                    <div key={tx.id} className="p-4 hover:bg-slate-50/50 transition-colors flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#1A2B3C]">{tx.type}</span>
                          <span className="text-[8px] bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded">ID: #{tx.id.substring(0, 8)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold block">{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                      <span className={`text-sm font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}

                  {wallet.transactions.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic font-semibold text-xs bg-slate-50/50">
                      No prior wallet transactions detected. Add reference bookings or apply invite rewards to begin!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =========================================
              VIEW 6: HEALTH REMINDERS & PATIENT PROFILE
              ========================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-profile">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* General Personal Information */}
                <div className="bg-white border border-[#D1E5E5] rounded-3xl p-5 shadow-3xs md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2.5 mb-1">
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest">
                      Patient Profile Details
                    </h3>
                    {!isEditingProfile ? (
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="text-[10px] font-black text-[#0A6E6E] hover:text-[#0A6E6E]/80 uppercase tracking-widest bg-[#0A6E6E]/5 hover:bg-[#0A6E6E]/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        Edit Profile Details
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="text-[10px] font-black text-gray-500 hover:text-gray-700 uppercase tracking-widest bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Full Registered Name</span>
                        <strong className="text-xs text-slate-800 font-extrabold">{patientName}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Active Email ID</span>
                        <strong className="text-xs text-slate-800 font-extrabold font-mono truncate block">{userEmail || 'aarav.mehta@doctspark.in'}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Blood Group</span>
                        <strong className="text-xs text-slate-800 font-extrabold">{editBloodGroup}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Age / Gender</span>
                        <strong className="text-xs text-slate-800 font-extrabold">{editAgeGender}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Emergency Mobile contact</span>
                        <strong className="text-xs text-slate-800 font-extrabold font-mono">{editMobile}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Primary Communication Language</span>
                        <strong className="text-xs text-slate-800 font-extrabold">{editLanguage}</strong>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400 block">Full Registered Name <span className="text-red-500">*</span></label>
                          <input 
                            type="text"
                            required
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 border border-[#D1E5E5] focus:outline-none focus:border-[#0A6E6E] focus:bg-white text-slate-800"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-1.5 opacity-60">
                          <label className="text-[9px] uppercase font-bold text-gray-400 block">Active Email ID (Immutable)</label>
                          <input 
                            type="email"
                            disabled
                            value={userEmail || 'aarav.mehta@doctspark.in'}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 cursor-not-allowed text-slate-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400 block">Blood Group</label>
                          <input 
                            type="text"
                            value={editBloodGroup}
                            onChange={(e) => setEditBloodGroup(e.target.value)}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 border border-[#D1E5E5] focus:outline-none focus:border-[#0A6E6E] focus:bg-white text-slate-800"
                            placeholder="e.g. O-Positive (O+)"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400 block">Age / Gender</label>
                          <input 
                            type="text"
                            value={editAgeGender}
                            onChange={(e) => setEditAgeGender(e.target.value)}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 border border-[#D1E5E5] focus:outline-none focus:border-[#0A6E6E] focus:bg-white text-slate-800"
                            placeholder="e.g. 28 Years / Male"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400 block">Emergency Mobile contact</label>
                          <input 
                            type="text"
                            value={editMobile}
                            onChange={(e) => setEditMobile(e.target.value)}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 border border-[#D1E5E5] focus:outline-none focus:border-[#0A6E6E] focus:bg-white text-slate-800"
                            placeholder="e.g. +91 98765 43210"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-gray-400 block">Primary Communication Language</label>
                          <input 
                            type="text"
                            value={editLanguage}
                            onChange={(e) => setEditLanguage(e.target.value)}
                            className="w-full text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-50 border border-[#D1E5E5] focus:outline-none focus:border-[#0A6E6E] focus:bg-white text-slate-800"
                            placeholder="e.g. English & Hindi"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-black text-white bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          Save Profile Settings
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 mt-4">
                    <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                    <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                      Your medical profile information is encrypted in transit and at rest adhering to standard Indian Health Data Management regulations. Only verified assigned clinical practitioners can read your files.
                    </p>
                  </div>
                </div>

                {/* Reminders List & Perks summary */}
                <div className="space-y-6">
                  
                  {/* Comprehensive Timing Alerts */}
                  <div className="bg-white border border-[#D1E5E5] rounded-3xl p-5 shadow-3xs space-y-4">
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-widest">
                      Medication Timing Alerts
                    </h3>
                    <div className="space-y-3">
                      {medicalReminders.map((rem) => (
                        <div key={rem.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-semibold text-gray-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[#0A6E6E] font-black uppercase text-[8px] tracking-wider">{rem.category}</span>
                            <span className="text-[8px] bg-white text-gray-400 font-bold px-1.5 py-0.5 rounded border border-gray-100">{rem.due}</span>
                          </div>
                          <p className="text-gray-600 leading-normal">{rem.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Spark privileges details */}
                  <div className="bg-[#0A6E6E] text-white rounded-3xl p-5 shadow-3xs space-y-3">
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-400">Exemptions Info</span>
                    <h4 className="text-xs font-black">Your Spark Wallet Privileges</h4>
                    <p className="text-[10px] text-teal-100 leading-relaxed font-semibold">
                      Maintain ₹{walletConfig.minimumWalletUsageAmount} wallet balance to instantly waive checkout platform transaction fees, cancellation surcharges, or partner portal taxes!
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {activeTab === 'laboratory' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-laboratory">
              <PatientLaboratory 
                userEmail={patientEmail} 
                addNotification={addNotification} 
                walletBalance={wallet.balance}
                deductFromWallet={deductFromWallet}
              />
            </div>
          )}

          {activeTab === 'pharmacy' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-pharmacy">
              <PatientPharmacy 
                userEmail={patientEmail} 
                addNotification={addNotification} 
                walletBalance={wallet.balance}
                deductFromWallet={deductFromWallet}
              />
            </div>
          )}

          {activeTab === 'physiotherapy' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="tab-physiotherapy">
              <PatientPhysiotherapy 
                userEmail={patientEmail} 
                addNotification={addNotification} 
                walletBalance={wallet.balance}
                deductFromWallet={deductFromWallet}
              />
            </div>
          )}

        </div>

      </div>

      {/* PRESCRIPTION DETAIL MODAL */}
      {activePrescription && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#D1E5E5] p-6 relative shadow-2xl">
            <button
              onClick={() => setActivePrescription(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 font-extrabold text-sm w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            
            {/* Modal Header */}
            <div className="border-b-2 border-dashed border-[#D1E5E5] pb-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 bg-[#0A6E6E] rounded-xl flex items-center justify-center text-white text-lg font-black">℞</div>
                <div className="text-right">
                  <div className="text-xs font-black text-gray-900 uppercase tracking-widest">Digital Prescription</div>
                  <div className="text-[9px] text-gray-400 font-black font-mono">ID: RX-{activePrescription.id}</div>
                </div>
              </div>
              <h3 className="text-sm font-extrabold text-[#1A2B3C]">{activePrescription.doctorName}</h3>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">MCI-Certified General Specialist</p>
            </div>

            {/* Modal Content */}
            <div className="text-xs font-medium text-slate-700 flex flex-col gap-4">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Diagnosed Diagnosis</span>
                <strong className="text-gray-900 text-xs font-black">{activePrescription.diagnosis}</strong>
              </div>

              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1.5">Recommended Medications</span>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {activePrescription.medicines.map((m, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between bg-slate-50/50">
                      <div>
                        <div className="font-extrabold text-gray-900">{m.name}</div>
                        <div className="text-[10px] text-gray-400">Duration: {m.duration}</div>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-800 border border-blue-100 font-black px-2 py-0.5 rounded-lg h-fit">{m.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>

              {activePrescription.notes && (
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold">Special Doctor Notes</span>
                  <p className="text-gray-600 italic mt-0.5 bg-yellow-50/50 border border-yellow-100/50 p-2.5 rounded-xl">{activePrescription.notes}</p>
                </div>
              )}

              {activePrescription.attachedFileUrl && (
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Attached Scan File</span>
                  {activePrescription.attachedFileUrl.startsWith('data:image/') ? (
                    <div className="border border-teal-100 rounded-xl overflow-hidden bg-slate-50 relative group">
                      <img 
                        src={activePrescription.attachedFileUrl} 
                        alt="Prescription Scan Attachment" 
                        className="w-full max-h-40 object-contain mx-auto"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={activePrescription.attachedFileUrl} 
                          download={activePrescription.attachedFileName || 'prescription-scan.png'}
                          className="bg-white text-gray-800 text-[9px] font-black px-3 py-1.5 rounded-lg shadow hover:bg-gray-100 transition-all cursor-pointer"
                        >
                          📥 Download Scan Image
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-teal-50/50 border border-[#D1E5E5] rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl">📄</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold text-[#1A2B3C] truncate">{activePrescription.attachedFileName || 'prescription-scan.pdf'}</p>
                          <p className="text-[8px] text-gray-400 uppercase tracking-wider font-bold">PDF Document</p>
                        </div>
                      </div>
                      <a 
                        href={activePrescription.attachedFileUrl} 
                        download={activePrescription.attachedFileName || 'prescription-scan.pdf'}
                        className="bg-[#0A6E6E] text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow hover:bg-[#0A6E6E]/90 transition-all cursor-pointer shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 pt-4 mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (activePrescription.attachedFileUrl) {
                    const link = document.createElement('a');
                    link.href = activePrescription.attachedFileUrl;
                    link.download = activePrescription.attachedFileName || 'prescription-scan';
                    link.click();
                  } else {
                    alert('Prescription PDF download initiated successfully!');
                  }
                }}
                className="px-4 py-2 bg-[#0A6E6E] text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => setActivePrescription(null)}
                className="px-4 py-2 border border-[#D1E5E5] rounded-xl text-xs font-extrabold text-gray-500 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
