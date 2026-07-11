/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AnnouncementBar from './components/layout/AnnouncementBar';
import Homepage from './components/views/Homepage';
import DoctorListing from './components/views/DoctorListing';
import DoctorProfile from './components/views/DoctorProfile';
import ClinicListing from './components/views/ClinicListing';
import Specialties from './components/views/Specialties';
import NearbyMap from './components/views/NearbyMap';
import Login from './components/views/Login';
import DoctorRegister from './components/views/DoctorRegister';
import PatientRegister from './components/views/PatientRegister';
import PatientDashboard from './components/views/PatientDashboard';
import DoctorDashboard from './components/views/DoctorDashboard';
import ClinicDashboard from './components/views/ClinicDashboard';
import BookingFlow from './components/views/BookingFlow';
import VideoCall from './components/views/VideoCall';
import DynamicPageView from './components/views/DynamicPageView';

import ClinicRegister from './components/views/ClinicRegister';
import PharmacyRegister from './components/views/PharmacyRegister';
import PharmacyDashboard from './components/views/PharmacyDashboard';
import LaboratoryRegister from './components/views/LaboratoryRegister';
import LaboratoryDashboard from './components/views/LaboratoryDashboard';
import PhysiotherapyRegister from './components/views/PhysiotherapyRegister';
import PhysiotherapyDashboard from './components/views/PhysiotherapyDashboard';
import { generateCommission, reverseCommission } from './data/commissionUtils';
import PartnerRegister from './components/views/PartnerRegister';
import PartnerDashboard from './components/views/PartnerDashboard';
import SuperAdminDashboard from './components/views/SuperAdminDashboard';
import { processFirstAppointmentReferralReward, processPendingAppointmentsExpiry } from './data/walletUtils';
import { checkUserTermsStatus, getTermsAcceptanceLogs, logTermsAcceptance } from './data/termsUtils';
import { supabase, getUserRoleFromSupabase, saveDoctorToSupabase } from './lib/supabase';
import ForceTermsReacceptanceModal from './components/common/ForceTermsReacceptanceModal';

import { MOCK_DOCTORS, INITIAL_APPOINTMENTS, MOCK_CLINICS } from './data/mockData';
import { Role, Appointment, Doctor, QuickFilterState, Clinic } from './types';
import { Smartphone, Download, X } from 'lucide-react';

export default function App() {
  // Views Routing State
  const getInitialViewFromPath = (): string => {
    const path = window.location.pathname;
    if (path === '/' || path === '') {
      return 'home';
    } else if (path === '/admin/dashboard') {
      return 'superadmin-dashboard';
    } else if (path === '/partner/state/dashboard' || path === '/partner/district/dashboard' || path === '/partner/city/dashboard') {
      return 'partner-dashboard';
    } else if (path === '/doctor/dashboard') {
      return 'doctor-dashboard';
    } else if (path === '/clinic/dashboard') {
      return 'clinic-dashboard';
    } else if (path === '/patient/dashboard') {
      return 'patient-dashboard';
    } else {
      const viewName = path.substring(1);
      return viewName || 'home';
    }
  };

  const [currentView, _setView] = React.useState<string>(getInitialViewFromPath);
  const nextTransitionReplace = React.useRef(false);
  const prevViewRef = React.useRef<string>(currentView);
  const isPopStateRef = React.useRef(false);

  const setView = (view: string | { name: string; replace?: boolean }, replaceOption?: boolean) => {
    if (typeof view === 'object') {
      if (view.replace) {
        nextTransitionReplace.current = true;
      }
      _setView(view.name);
    } else {
      if (replaceOption) {
        nextTransitionReplace.current = true;
      }
      _setView(view);
    }
  };

  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);
  
  // Search state across pages
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [searchCity, setSearchCity] = React.useState<string>('');
  const [initialFilters, setInitialFilters] = React.useState<QuickFilterState | null>(null);

  // Booking details prefilled transfer
  const [selectedBookingDate, setSelectedBookingDate] = React.useState<string>('');
  const [selectedBookingSlot, setSelectedBookingSlot] = React.useState<string>('');

  // Authentication State
  const [userRole, _setUserRole] = React.useState<Role | null>(null);
  const [userEmail, _setUserEmail] = React.useState<string | null>(null);

  const setUserRole = (role: Role | null) => {
    _setUserRole(role);
    if (role) {
      localStorage.setItem('ds_cached_role', role);
    } else {
      localStorage.removeItem('ds_cached_role');
    }
  };

  const setUserEmail = (email: string | null) => {
    _setUserEmail(email);
    if (email) {
      localStorage.setItem('ds_cached_email', email);
    } else {
      localStorage.removeItem('ds_cached_email');
    }
  };

  const [loadingSession, setLoadingSession] = React.useState(true);
  const [termsUpdateTrigger, setTermsUpdateTrigger] = React.useState(0);

  // Core Data State (allows adding, deleting, updating doctors and appointments interactively!)
  const [appointments, setAppointments] = React.useState<Appointment[]>(() => {
    const saved = localStorage.getItem('ds_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [doctors, setDoctors] = React.useState<Doctor[]>(() => {
    const saved = localStorage.getItem('ds_doctors');
    const list: Doctor[] = saved ? JSON.parse(saved) : MOCK_DOCTORS;
    return list.filter(d => !d.name.includes('Simulated') && !d.name.includes('Sandbox'));
  });

  const [clinics, setClinics] = React.useState<Clinic[]>(() => {
    const saved = localStorage.getItem('ds_clinics');
    return saved ? JSON.parse(saved) : MOCK_CLINICS;
  });

  // Save to localStorage to avoid data loss on refreshes
  React.useEffect(() => {
    localStorage.setItem('ds_appointments', JSON.stringify(appointments));
  }, [appointments]);

  React.useEffect(() => {
    localStorage.setItem('ds_doctors', JSON.stringify(doctors));
  }, [doctors]);

  React.useEffect(() => {
    localStorage.setItem('ds_clinics', JSON.stringify(clinics));
  }, [clinics]);

  // Centralized Authentication and Session Restoration on Initial Mount
  React.useEffect(() => {
    let active = true;
    async function initAuth() {
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

        if (hasSupabase) {
          console.log('App mounting: Restoring Supabase session...');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && active) {
            const email = session.user.email;
            if (email) {
              const roleResult = await getUserRoleFromSupabase(email);
              if (roleResult && active) {
                const resolvedRole = roleResult.role as Role;
                setUserRole(resolvedRole);
                setUserEmail(email);
                console.log('Restored session for:', email, 'Role:', resolvedRole);
                
                // Fetch and sync terms logs if they exist on the Supabase profile
                try {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('terms_accepted, accepted_terms_version, accepted_terms_at, name')
                    .eq('email', email.trim().toLowerCase())
                    .maybeSingle();
                  
                  if (profileData && profileData.terms_accepted && profileData.accepted_terms_version && active) {
                    const roleToDocIdMap: Record<string, string> = {
                      'patient': 'patient',
                      'doctor': 'doctor',
                      'clinic': 'clinic',
                      'physiotherapy': 'physiotherapy',
                      'pharmacy': 'pharmacy',
                      'partner': 'partner',
                      'state_partner': 'partner',
                      'district_partner': 'partner',
                      'city_partner': 'partner',
                      'state': 'partner',
                      'district': 'partner',
                      'city': 'partner',
                      'laboratory': 'laboratory'
                    };
                    const docId = roleToDocIdMap[resolvedRole.toLowerCase()] || 'patient';
                    const logs = getTermsAcceptanceLogs();
                    const alreadyLogged = logs.some(
                      l => l.userEmail.toLowerCase() === email.toLowerCase() && 
                           (l.registrationType === docId || 
                            (docId === 'partner' && ['partner', 'state_partner', 'district_partner', 'city_partner', 'state', 'district', 'city'].includes(l.registrationType))) && 
                           l.acceptedVersion === profileData.accepted_terms_version
                    );
                    if (!alreadyLogged) {
                      logTermsAcceptance(
                        email,
                        profileData.name || email.split('@')[0],
                        docId,
                        profileData.accepted_terms_version
                      );
                      console.log(`Synced restored ${docId} terms acceptance from profiles table.`);
                    }
                  }
                } catch (termsSyncErr) {
                  console.warn('Failed to sync terms from Supabase:', termsSyncErr);
                }
                
                setLoadingSession(false);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore Supabase session on mount:', err);
      }

      // Fallback to local storage cached session (useful for offline, local test, or fast loading)
      if (active) {
        const cachedRole = localStorage.getItem('ds_cached_role');
        const cachedEmail = localStorage.getItem('ds_cached_email');
        if (cachedRole && cachedEmail) {
          setUserRole(cachedRole as Role);
          setUserEmail(cachedEmail);
          console.log('Session restored from cache:', cachedEmail, cachedRole);
        }
        setLoadingSession(false);
      }
    }

    initAuth();

    // Listen for authentication state changes to avoid redirect loops and race conditions
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const hasSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');
    let subscription: any = null;

    if (hasSupabase) {
      const subRes = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Supabase Auth State Changed:', event, session?.user?.email);
        if (!active) return;
        if (session?.user) {
          const email = session.user.email;
          if (email) {
            const roleResult = await getUserRoleFromSupabase(email);
            if (roleResult && active) {
              const resolvedRole = roleResult.role as Role;
              setUserRole(resolvedRole);
              setUserEmail(email);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (active) {
            setUserRole(null);
            setUserEmail(null);
          }
        }
      });
      subscription = subRes.data?.subscription;
    }

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Synchronize state from localStorage whenever view changes, ensuring partner/superadmin updates are immediately seen!
  React.useEffect(() => {
    // Check and process automatic expiration of pending appointments older than 24 hours
    const result = processPendingAppointmentsExpiry();
    
    const savedApts = localStorage.getItem('ds_appointments');
    if (savedApts) setAppointments(JSON.parse(savedApts));
    
    const savedDocs = localStorage.getItem('ds_doctors');
    if (savedDocs) {
      const parsed: Doctor[] = JSON.parse(savedDocs);
      setDoctors(parsed.filter(d => !d.name.includes('Simulated') && !d.name.includes('Sandbox')));
    }
    const savedClinics = localStorage.getItem('ds_clinics');
    if (savedClinics) setClinics(JSON.parse(savedClinics));
  }, [currentView]);

  // Notifications State
  const [notifications, setNotifications] = React.useState<{ id: string; text: string; time: string; read: boolean }[]>([
    { id: 'n-1', text: 'MCI verification complete. Your Doct Spark profile is 100% active!', time: 'Yesterday', read: false },
    { id: 'n-2', text: 'Upcoming post-op consultation with Dr. Rajesh Khanna tomorrow at 10:00 AM.', time: '2 hours ago', read: false }
  ]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Helper actions
  const handleAddAppointment = (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
    // Create new notification for patient
    setNotifications(prev => [
      {
        id: `n-${Date.now()}`,
        text: `Appointment confirmed with ${apt.doctorName} for ${apt.date} at ${apt.time}.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);
    // Generate commission
    generateCommission('Appointment', apt.id, `${apt.patientName} with ${apt.doctorName}`, apt.fee);
  };

  const handleUpdateAppointment = (updated: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
    
    // Check and trigger referral rewards if completed
    if (updated.status === 'Completed') {
      const patientEmail = updated.patientId && updated.patientId.includes('@') ? updated.patientId : 'aarav.mehta@doctspark.in';
      processFirstAppointmentReferralReward(patientEmail, updated.fee, updated.id);
    }

    // Notification for patient about prescription
    if (updated.prescription) {
      setNotifications(prev => [
        {
          id: `n-${Date.now()}`,
          text: `New Digital Prescription uploaded by ${updated.doctorName}. View it on your dashboard!`,
          time: 'Just now',
          read: false
        },
        ...prev
      ]);
    }
    // Reverse commission if cancelled
    if (updated.status === 'Cancelled') {
      reverseCommission(updated.id, 'Appointment cancelled');
    }
  };

  const handleAddDoctor = async (newDoc: Doctor) => {
    setDoctors(prev => [newDoc, ...prev]);
    // Generate subscription commission if paid
    if (newDoc.subscriptionPaid) {
      generateCommission('Subscription', newDoc.id, `Dr. ${newDoc.name}`, 5000, newDoc.onboardedBy);
    }
    // Save to Supabase database
    try {
      await saveDoctorToSupabase(newDoc);
    } catch (err) {
      console.error('Failed to save doctor to Supabase in handleAddDoctor:', err);
    }
  };

  const handleRemoveDoctor = (id: string) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const handleAddClinic = (newClinic: Clinic) => {
    setClinics(prev => [newClinic, ...prev]);
    // Generate subscription commission if paid
    if (newClinic.subscriptionPaid) {
      generateCommission('Subscription', newClinic.id, newClinic.name, 5000, newClinic.onboardedBy);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Role-Based Access Control (RBAC) Protection
  const getAuthorizedView = (view: string): string => {
    if (loadingSession) {
      return view;
    }

    const roleDashboards: Record<string, string> = {
      'superadmin-dashboard': 'superadmin',
      'partner-dashboard': 'partner',
      'doctor-dashboard': 'doctor',
      'clinic-dashboard': 'clinic',
      'patient-dashboard': 'patient',
      'pharmacy-dashboard': 'pharmacy',
      'laboratory-dashboard': 'laboratory',
      'physiotherapy-dashboard': 'physiotherapy'
    };

    const requiredRole = roleDashboards[view];
    if (requiredRole) {
      if (userRole !== requiredRole) {
        return userRole ? `${userRole}-dashboard` : (requiredRole === 'partner' ? 'partner-login' : 'login');
      }
    }

    if (isLoginView(view) && userRole) {
      return `${userRole}-dashboard`;
    }

    return view;
  };

  const isDashboardView = (v: string): boolean => {
    return [
      'superadmin-dashboard',
      'partner-dashboard',
      'doctor-dashboard',
      'clinic-dashboard',
      'patient-dashboard',
      'pharmacy-dashboard',
      'laboratory-dashboard',
      'physiotherapy-dashboard'
    ].includes(v);
  };

  const isLoginView = (v: string): boolean => {
    return ['login', 'partner-login'].includes(v);
  };

  // Enforce authorized view state
  React.useEffect(() => {
    const authView = getAuthorizedView(currentView);
    if (authView !== currentView) {
      setView(authView);
    }
  }, [currentView, userRole, loadingSession]);

  // Push real URL path to browser for role-based dashboard navigation
  React.useEffect(() => {
    const authorizedView = getAuthorizedView(currentView);
    const prevView = prevViewRef.current;
    
    const isPopState = isPopStateRef.current;
    isPopStateRef.current = false;
    
    let useReplace = nextTransitionReplace.current;
    nextTransitionReplace.current = false;
    
    if (
      (isLoginView(prevView) && isDashboardView(authorizedView)) ||
      (isDashboardView(prevView) && isLoginView(authorizedView))
    ) {
      useReplace = true;
    }
    
    prevViewRef.current = authorizedView;

    let targetUrl = '/';
    if (authorizedView === 'superadmin-dashboard') {
      targetUrl = '/admin/dashboard';
    } else if (authorizedView === 'partner-dashboard') {
      const savedPartners = localStorage.getItem('ds_partners');
      const pList = savedPartners ? JSON.parse(savedPartners) : [];
      const emailToFind = userEmail || '';
      const currentPartner = pList.find((p: any) => p.email.toLowerCase() === emailToFind.toLowerCase());
      const partnerType = currentPartner?.partnerType || 'District';
      
      if (partnerType === 'State') {
        targetUrl = '/partner/state/dashboard';
      } else if (partnerType === 'City') {
        targetUrl = '/partner/city/dashboard';
      } else {
        targetUrl = '/partner/district/dashboard';
      }
    } else if (authorizedView === 'doctor-dashboard') {
      targetUrl = '/doctor/dashboard';
    } else if (authorizedView === 'clinic-dashboard') {
      targetUrl = '/clinic/dashboard';
    } else if (authorizedView === 'patient-dashboard') {
      targetUrl = '/patient/dashboard';
    } else if (authorizedView === 'home') {
      targetUrl = '/';
    } else if (authorizedView === 'login') {
      targetUrl = '/login';
    } else {
      targetUrl = `/${authorizedView}`;
    }

    if (!isPopState) {
      if (window.location.pathname !== targetUrl) {
        if (useReplace) {
          window.history.replaceState(null, '', targetUrl);
        } else {
          window.history.pushState(null, '', targetUrl);
        }
      }
    } else {
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState(null, '', targetUrl);
      }
    }
  }, [currentView, userRole, userEmail, loadingSession]);

  // Support for browser Back and Forward button navigation
  React.useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setView('home');
      } else if (path === '/admin/dashboard') {
        setView('superadmin-dashboard');
      } else if (path === '/partner/state/dashboard' || path === '/partner/district/dashboard' || path === '/partner/city/dashboard') {
        setView('partner-dashboard');
      } else if (path === '/doctor/dashboard') {
        setView('doctor-dashboard');
      } else if (path === '/clinic/dashboard') {
        setView('clinic-dashboard');
      } else if (path === '/patient/dashboard') {
        setView('patient-dashboard');
      } else {
        const viewName = path.substring(1);
        setView(viewName || 'home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Switch router views
  const renderActiveView = () => {
    const authorizedView = getAuthorizedView(currentView);

    // Terms & Conditions Force Re-Acceptance Logic
    if (userEmail && userRole) {
      const termsStatus = checkUserTermsStatus(userEmail, userRole);
      if (termsStatus.needsAcceptance && termsStatus.document) {
        const isDashboard = ['superadmin-dashboard', 'partner-dashboard', 'doctor-dashboard', 'clinic-dashboard', 'patient-dashboard', 'pharmacy-dashboard', 'laboratory-dashboard', 'physiotherapy-dashboard'].includes(authorizedView);
        if (isDashboard) {
          return (
            <ForceTermsReacceptanceModal 
              document={termsStatus.document} 
              userEmail={userEmail} 
              userRole={userRole}
              onAccept={() => {
                // Force a reactive state update to re-evaluate checkUserTermsStatus and dismiss the modal immediately
                setTermsUpdateTrigger(prev => prev + 1);
                setView(currentView);
              }} 
            />
          );
        }
      }
    }
    
    if (authorizedView.startsWith('page-')) {
      return (
        <DynamicPageView 
          slug={authorizedView.substring(5)} 
          setView={setView} 
        />
      );
    }

    switch (authorizedView) {
      case 'home':
        return (
          <Homepage 
            setView={setView} 
            setSelectedDoctorId={setSelectedDoctorId}
            setSearchQuery={setSearchQuery}
            setSearchCity={setSearchCity}
            setInitialFilters={setInitialFilters}
          />
        );
      case 'doctors':
        return (
          <DoctorListing 
            setView={setView} 
            setSelectedDoctorId={setSelectedDoctorId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchCity={searchCity}
            setSearchCity={setSearchCity}
            initialFilters={initialFilters}
            setInitialFilters={setInitialFilters}
          />
        );
      case 'doctor-profile':
        return (
          <DoctorProfile 
            setView={setView} 
            selectedDoctorId={selectedDoctorId}
            setSelectedDoctorId={setSelectedDoctorId}
            setSelectedBookingDate={setSelectedBookingDate}
            setSelectedBookingSlot={setSelectedBookingSlot}
          />
        );
      case 'clinics':
        return (
          <ClinicListing 
            setView={setView} 
            setSelectedDoctorId={setSelectedDoctorId}
            clinicsList={clinics}
            doctorsList={doctors}
          />
        );
      case 'specialties':
        return (
          <Specialties 
            setView={setView} 
            setSearchQuery={setSearchQuery}
          />
        );
      case 'nearby':
        return (
          <NearbyMap 
            setView={setView} 
            setSelectedDoctorId={setSelectedDoctorId}
            searchCity={searchCity}
            setSearchCity={setSearchCity}
            clinicsList={clinics}
            doctorsList={doctors}
          />
        );
      case 'login':
        return (
          <Login 
            setView={setView} 
            setUserRole={setUserRole} 
            setUserEmail={setUserEmail}
          />
        );
      case 'register':
        return (
          <PatientRegister 
            setView={setView} 
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
          />
        );
      case 'register-doctor':
        return (
          <DoctorRegister 
            setView={setView} 
            onSubmitDoctor={handleAddDoctor}
          />
        );
      case 'register-clinic':
        return (
          <ClinicRegister 
            setView={setView} 
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            onAddClinic={handleAddClinic}
          />
        );
      case 'register-pharmacy':
        return (
          <PharmacyRegister 
            setView={setView} 
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
          />
        );
      case 'register-laboratory':
        return (
          <LaboratoryRegister 
            setView={setView} 
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
          />
        );
      case 'register-physiotherapy':
        return (
          <PhysiotherapyRegister 
            setView={setView} 
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
          />
        );
      case 'partner-login':
        return (
          <Login 
            setView={setView}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
          />
        );
      case 'partner-register':
        return (
          <PartnerRegister 
            setView={setView}
          />
        );
      case 'partner-dashboard':
        return (
          <PartnerDashboard 
            setView={setView}
            userEmail={userEmail}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'superadmin-dashboard':
        return (
          <SuperAdminDashboard 
            setView={setView}
            userEmail={userEmail}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'patient-dashboard':
        return (
          <PatientDashboard 
            setView={setView} 
            appointments={appointments}
            setSelectedDoctorId={setSelectedDoctorId}
            setSelectedRoomId={setSelectedRoomId}
            userEmail={userEmail}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'doctor-dashboard':
        return (
          <DoctorDashboard 
            setView={setView} 
            appointments={appointments}
            onUpdateAppointment={handleUpdateAppointment}
            onAddAppointment={handleAddAppointment}
            setSelectedRoomId={setSelectedRoomId}
            userEmail={userEmail}
            doctorsList={doctors}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'clinic-dashboard':
        return (
          <ClinicDashboard 
            setView={setView} 
            doctorsList={doctors}
            clinicsList={clinics}
            appointments={appointments}
            userEmail={userEmail}
            onAddDoctor={handleAddDoctor}
            onRemoveDoctor={handleRemoveDoctor}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'pharmacy-dashboard':
        return (
          <PharmacyDashboard 
            setView={setView} 
            userEmail={userEmail || ''}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'laboratory-dashboard':
        return (
          <LaboratoryDashboard 
            setView={setView} 
            userEmail={userEmail || ''}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'physiotherapy-dashboard':
        return (
          <PhysiotherapyDashboard 
            setView={setView} 
            userEmail={userEmail || ''}
            currentView={currentView}
            userRole={userRole}
            setUserRole={setUserRole}
            setUserEmail={setUserEmail}
            notificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => {
              setShowNotifications(!showNotifications);
              handleMarkNotificationsRead();
            }}
          />
        );
      case 'booking':
        return (
          <BookingFlow 
            setView={setView} 
            selectedDoctorId={selectedDoctorId}
            selectedBookingDate={selectedBookingDate}
            selectedBookingSlot={selectedBookingSlot}
            setSelectedBookingDate={setSelectedBookingDate}
            setSelectedBookingSlot={setSelectedBookingSlot}
            onAddAppointment={handleAddAppointment}
            userEmail={userEmail}
          />
        );
      case 'video-call':
        return (
          <VideoCall 
            setView={setView} 
            roomId={selectedRoomId}
            userRole={userRole}
          />
        );
      default:
        return (
          <Homepage 
            setView={setView} 
            setSelectedDoctorId={setSelectedDoctorId}
            setSearchQuery={setSearchQuery}
            setSearchCity={setSearchCity}
            setInitialFilters={setInitialFilters}
          />
        );
    }
  };

  const getAnnouncementBarProps = (): { location: 'Website Home' | 'Website Inner' | 'Admin' | 'Patient' | 'Doctor' | 'Clinic' | 'Partner' | 'Staff'; audience: 'All' | 'Visitors' | 'Patients' | 'Doctors' | 'Clinics' | 'Partners' | 'Staff' | 'Admin' } | null => {
    const authorizedView = getAuthorizedView(currentView);
    switch (authorizedView) {
      case 'home':
        return { location: 'Website Home', audience: 'Visitors' };
      case 'superadmin-dashboard':
        return { location: 'Admin', audience: 'Admin' };
      case 'patient-dashboard':
        return { location: 'Patient', audience: 'Patients' };
      case 'doctor-dashboard':
        return { location: 'Doctor', audience: 'Doctors' };
      case 'clinic-dashboard':
        return { location: 'Clinic', audience: 'Clinics' };
      case 'partner-dashboard':
        return { location: 'Partner', audience: 'Partners' };
      case 'login':
      case 'register':
      case 'register-doctor':
      case 'register-clinic':
      case 'register-pharmacy':
      case 'register-laboratory':
      case 'register-physiotherapy':
      case 'partner-login':
      case 'partner-register':
      case 'booking':
      case 'specialties':
      case 'clinics':
      case 'doctors':
      case 'nearby':
        return { 
          location: 'Website Inner', 
          audience: userRole === 'superadmin' ? 'Admin' : 
                    userRole === 'patient' ? 'Patients' : 
                    userRole === 'doctor' ? 'Doctors' : 
                    userRole === 'clinic' ? 'Clinics' : 
                    userRole === 'partner' ? 'Partners' : 'Visitors' 
        };
      default:
        if (authorizedView.startsWith('page-')) {
          return { location: 'Website Inner', audience: 'Visitors' };
        }
        return { location: 'Website Home', audience: 'Visitors' };
    }
  };

  const annProps = getAnnouncementBarProps();

  const DASHBOARD_VIEWS = [
    'superadmin-dashboard',
    'partner-dashboard',
    'doctor-dashboard',
    'clinic-dashboard',
    'patient-dashboard',
    'pharmacy-dashboard',
    'laboratory-dashboard',
    'physiotherapy-dashboard'
  ];

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#F0F7F7] flex items-center justify-center font-sans" id="app-loading">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0A6E6E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 animate-pulse">Restoring secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7F7] text-[#1A2B3C] font-sans flex flex-col relative" id="app-root">
      
      {/* Conditional Sticky Header (isolated components for public vs dashboard) */}
      {DASHBOARD_VIEWS.includes(currentView) ? null : (
        <Header 
          currentView={currentView}
          setView={setView}
          userRole={userRole}
          setUserRole={setUserRole}
          userEmail={userEmail}
          setUserEmail={setUserEmail}
          notificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => {
            setShowNotifications(!showNotifications);
            handleMarkNotificationsRead();
          }}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* Full-width, single-line, animated Announcement Bar */}
      {annProps && (
        <AnnouncementBar 
          location={annProps.location} 
          audience={annProps.audience} 
        />
      )}

      {/* Main content body */}
      <main className="flex-grow flex flex-col">
        {renderActiveView()}
      </main>

      {/* Universal Clean Minimalism Footer */}
      {currentView !== 'video-call' && <Footer setView={setView} setSearchQuery={setSearchQuery} />}

      {/* NOTIFICATIONS SLIDE OVER DRAWER */}
      {showNotifications && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-[#D1E5E5] shadow-xl z-50 p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <span className="font-extrabold text-xs uppercase tracking-widest text-[#1A2B3C]">Notifications Hub</span>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-900 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="p-3.5 bg-[#F0F7F7] rounded-lg border border-[#D1E5E5] text-xs font-semibold text-gray-700 relative">
                  {!n.read && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500"></span>}
                  <p className="pr-4 leading-relaxed">{n.text}</p>
                  <span className="text-[9px] text-gray-400 font-bold block mt-1.5">{n.time}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowNotifications(false)}
            className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-bold text-xs rounded-lg transition-colors mt-6"
          >
            Close Drawer
          </button>
        </div>
      )}

    </div>
  );
}
