/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/layout/Header';
import DashboardHeader from './components/layout/DashboardHeader';
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
import { supabase, getUserRoleFromSupabase } from './lib/supabase';
import ForceTermsReacceptanceModal from './components/common/ForceTermsReacceptanceModal';

import { MOCK_DOCTORS, INITIAL_APPOINTMENTS, MOCK_CLINICS } from './data/mockData';
import { Role, Appointment, Doctor, QuickFilterState, Clinic } from './types';
import { Smartphone, Download, X } from 'lucide-react';

export default function App() {
  // Views Routing State
  const [currentView, setView] = React.useState<string>('home');
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);
  
  // Search state across pages
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [searchCity, setSearchCity] = React.useState<string>('');
  const [initialFilters, setInitialFilters] = React.useState<QuickFilterState | null>(null);

  // Booking details prefilled transfer
  const [selectedBookingDate, setSelectedBookingDate] = React.useState<string>('');
  const [selectedBookingSlot, setSelectedBookingSlot] = React.useState<string>('');

  // Authentication State (For demonstration)
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

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

  // Restore active Supabase session and sync terms on initial mount
  React.useEffect(() => {
    async function restoreSession() {
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
          console.log('App mounting: Restoring Supabase session...');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const email = session.user.email;
            if (email) {
              const roleResult = await getUserRoleFromSupabase(email);
              if (roleResult) {
                const resolvedRole = roleResult.role as Role;
                setUserRole(resolvedRole);
                setUserEmail(email);
                console.log('Restored session for:', email, 'Role:', resolvedRole);
                
                // Fetch and sync terms logs if they exist on the Supabase profile
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('terms_accepted, accepted_terms_version, accepted_terms_at, name')
                  .eq('email', email.trim().toLowerCase())
                  .maybeSingle();
                
                if (profileData && profileData.terms_accepted && profileData.accepted_terms_version) {
                  const logs = getTermsAcceptanceLogs();
                  const alreadyLogged = logs.some(
                    l => l.userEmail.toLowerCase() === email.toLowerCase() && 
                         l.registrationType === 'patient' && 
                         l.acceptedVersion === profileData.accepted_terms_version
                  );
                  if (!alreadyLogged) {
                    logTermsAcceptance(
                      email,
                      profileData.name || email.split('@')[0],
                      'patient',
                      profileData.accepted_terms_version
                    );
                    console.log('Synced restored terms acceptance from profiles table.');
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore Supabase session on mount:', err);
      }
    }
    restoreSession();
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

  const handleAddDoctor = (newDoc: Doctor) => {
    setDoctors(prev => [newDoc, ...prev]);
    // Generate subscription commission if paid
    if (newDoc.subscriptionPaid) {
      generateCommission('Subscription', newDoc.id, `Dr. ${newDoc.name}`, 5000, newDoc.onboardedBy);
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
    if (view === 'superadmin-dashboard' && userRole !== 'superadmin') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'partner-dashboard' && userRole !== 'partner') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'doctor-dashboard' && userRole !== 'doctor') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'clinic-dashboard' && userRole !== 'clinic') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'patient-dashboard' && userRole !== 'patient') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'pharmacy-dashboard' && userRole !== 'pharmacy') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'laboratory-dashboard' && userRole !== 'laboratory') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    if (view === 'physiotherapy-dashboard' && userRole !== 'physiotherapy') {
      return userRole ? `${userRole}-dashboard` : 'login';
    }
    return view;
  };

  // Enforce authorized view state
  React.useEffect(() => {
    const authView = getAuthorizedView(currentView);
    if (authView !== currentView) {
      setView(authView);
    }
  }, [currentView, userRole]);

  // Push real URL path to browser for role-based dashboard navigation
  React.useEffect(() => {
    const authorizedView = getAuthorizedView(currentView);
    if (authorizedView === 'superadmin-dashboard') {
      window.history.pushState(null, '', '/admin/dashboard');
    } else if (authorizedView === 'partner-dashboard') {
      const savedPartners = localStorage.getItem('ds_partners');
      const pList = savedPartners ? JSON.parse(savedPartners) : [];
      const emailToFind = userEmail || '';
      const currentPartner = pList.find((p: any) => p.email.toLowerCase() === emailToFind.toLowerCase());
      const partnerType = currentPartner?.partnerType || 'District';
      
      if (partnerType === 'State') {
        window.history.pushState(null, '', '/partner/state/dashboard');
      } else if (partnerType === 'City') {
        window.history.pushState(null, '', '/partner/city/dashboard');
      } else {
        window.history.pushState(null, '', '/partner/district/dashboard');
      }
    } else if (authorizedView === 'doctor-dashboard') {
      window.history.pushState(null, '', '/doctor/dashboard');
    } else if (authorizedView === 'clinic-dashboard') {
      window.history.pushState(null, '', '/clinic/dashboard');
    } else if (authorizedView === 'patient-dashboard') {
      window.history.pushState(null, '', '/patient/dashboard');
    } else if (authorizedView === 'home') {
      window.history.pushState(null, '', '/');
    } else if (authorizedView === 'login') {
      window.history.pushState(null, '', '/login');
    } else {
      window.history.pushState(null, '', `/${authorizedView}`);
    }
  }, [currentView, userRole, userEmail]);

  // Support for browser Back and Forward button navigation
  React.useEffect(() => {
    const handlePopState = () => {
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
                // Refresh routing state
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
          />
        );
      case 'superadmin-dashboard':
        return (
          <SuperAdminDashboard 
            setView={setView}
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
          />
        );
      case 'pharmacy-dashboard':
        return (
          <PharmacyDashboard 
            setView={setView} 
            userEmail={userEmail || ''}
          />
        );
      case 'laboratory-dashboard':
        return (
          <LaboratoryDashboard 
            setView={setView} 
            userEmail={userEmail || ''}
          />
        );
      case 'physiotherapy-dashboard':
        return (
          <PhysiotherapyDashboard 
            setView={setView} 
            userEmail={userEmail || ''}
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

  return (
    <div className="min-h-screen bg-[#F0F7F7] text-[#1A2B3C] font-sans flex flex-col relative" id="app-root">
      
      {/* Conditional Sticky Header (isolated components for public vs dashboard) */}
      {['superadmin-dashboard', 'partner-dashboard', 'doctor-dashboard', 'clinic-dashboard', 'patient-dashboard'].includes(currentView) ? (
        <DashboardHeader
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
        />
      ) : (
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
