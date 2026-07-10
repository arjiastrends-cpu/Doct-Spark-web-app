/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  Activity, 
  Calendar, 
  Wallet, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  AlertTriangle, 
  Bell, 
  ArrowUpRight, 
  ArrowDownLeft,
  MapPin,
  ClipboardList,
  ChevronRight,
  DollarSign,
  Briefcase,
  Sliders,
  Settings
} from 'lucide-react';
import { Physiotherapy, Role } from '../../types';
import { generateCommission } from '../../data/commissionUtils';
import DashboardLayout from '../layout/DashboardLayout';

interface PhysiotherapyDashboardProps {
  setView: (view: string) => void;
  userEmail: string | null;
  currentView: string;
  userRole: Role | null;
  setUserRole: (role: Role | null) => void;
  setUserEmail: (email: string | null) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface PhysioAppointment {
  id: string;
  patientName: string;
  phone: string;
  date: string;
  time: string;
  type: 'Home Visit' | 'Clinic Visit';
  serviceName: string;
  address: string;
  pincode: string;
  fee: number;
  status: 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled';
  sessionNotes?: string;
}

export default function PhysiotherapyDashboard({
  setView,
  userEmail,
  currentView,
  userRole,
  setUserRole,
  setUserEmail,
  notificationsCount,
  onOpenNotifications
}: PhysiotherapyDashboardProps) {
  const emailKey = userEmail ? userEmail.trim().toLowerCase() : '';

  // 1. Profile state
  const [profile, setProfile] = React.useState<Physiotherapy | null>(null);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState({
    name: '',
    therapistName: '',
    phone: '',
    specialty: '',
    experience: 0,
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    clinicFee: 800,
    homeFee: 1500
  });

  // 2. Active view tab
  const [activeTab, setActiveTab] = React.useState<'overview' | 'appointments' | 'services' | 'wallet' | 'profile'>('overview');

  // 3. Services list
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [newServiceName, setNewServiceName] = React.useState('');
  const [newServicePrice, setNewServicePrice] = React.useState<number>(800);
  const [newServiceDesc, setNewServiceDesc] = React.useState('');

  // 4. Appointments list
  const [appointments, setAppointments] = React.useState<PhysioAppointment[]>([]);
  const [appFilter, setAppFilter] = React.useState<'all' | 'Pending' | 'Scheduled' | 'Completed' | 'Cancelled'>('all');
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = React.useState<PhysioAppointment | null>(null);
  const [tempNotes, setTempNotes] = React.useState('');

  // 5. Wallet & Payout State
  const [walletBalance, setWalletBalance] = React.useState<number>(0);
  const [settlementRequests, setSettlementRequests] = React.useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = React.useState<number>(1000);
  const [bankAccount, setBankAccount] = React.useState({
    holder: 'Dr. Neha Sharma (PT)',
    number: '50100448102941',
    ifsc: 'HDFC0000102',
    bankName: 'HDFC Bank Ltd'
  });

  // 6. Notifications
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Load Initial Data
  React.useEffect(() => {
    // A. Profile Load
    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    const physList: Physiotherapy[] = savedPhysios ? JSON.parse(savedPhysios) : [];
    let matched = physList.find(p => p.email.toLowerCase() === emailKey);
    
    if (!matched && physList.length > 0) {
      matched = physList[0];
    }

    if (matched) {
      setProfile(matched);
      setProfileForm({
        name: matched.name,
        therapistName: matched.therapistName,
        phone: matched.phone,
        specialty: matched.specialty,
        experience: matched.experience,
        address: matched.address,
        city: matched.city,
        district: matched.district,
        state: matched.state,
        pincode: matched.pincode,
        clinicFee: (matched as any).clinicFee || 800,
        homeFee: (matched as any).homeFee || 1500
      });
    }

    // B. Services Load
    const savedServices = localStorage.getItem(`ds_physio_services_${emailKey}`);
    const defaultServices: ServiceItem[] = [
      { id: 'srv-1', name: 'Dry Needling & Myofascial Release', price: 900, description: 'Targeted muscular trigger points therapy to alleviate chronic muscle stiffness.' },
      { id: 'srv-2', name: 'Post-Stroke Neuro Rehabilitation', price: 1500, description: 'Motor control recovery, posture adjustment, and gait retraining sessions.' },
      { id: 'srv-3', name: 'Sports Injury Shoulder Mobilization', price: 1200, description: 'Specialized physical exercises targeting rotator cuff and ligament strains.' }
    ];
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    } else {
      localStorage.setItem(`ds_physio_services_${emailKey}`, JSON.stringify(defaultServices));
      setServices(defaultServices);
    }

    // C. Appointments Load
    const savedApts = localStorage.getItem(`ds_physio_appointments_${emailKey}`);
    const defaultApts: PhysioAppointment[] = [
      {
        id: 'physio-apt-101',
        patientName: 'Rohan Sharma',
        phone: '9876543210',
        date: new Date().toISOString().split('T')[0],
        time: '11:00 AM',
        type: 'Home Visit',
        serviceName: 'Post-Stroke Neuro Rehabilitation',
        address: 'A-402 Bandra Reclamation, Near Sports Club',
        pincode: '400050',
        fee: 1500,
        status: 'Scheduled',
        sessionNotes: ''
      },
      {
        id: 'physio-apt-102',
        patientName: 'Mrs. Meera Deshmukh',
        phone: '9812233445',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '04:30 PM',
        type: 'Clinic Visit',
        serviceName: 'Dry Needling & Myofascial Release',
        address: 'Apex Rehabilitation Center Clinic',
        pincode: '400050',
        fee: 900,
        status: 'Completed',
        sessionNotes: 'Dry needling successfully performed on rhomboids. Stiff knot resolved. Prescribed stretch routine.'
      },
      {
        id: 'physio-apt-103',
        patientName: 'Arjun Verma',
        phone: '9833445566',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '09:00 AM',
        type: 'Home Visit',
        serviceName: 'Sports Injury Shoulder Mobilization',
        address: 'Villa 15, Hiranandani Estate',
        pincode: '400607',
        fee: 1200,
        status: 'Pending',
        sessionNotes: ''
      }
    ];

    if (savedApts) {
      setAppointments(JSON.parse(savedApts));
    } else {
      localStorage.setItem(`ds_physio_appointments_${emailKey}`, JSON.stringify(defaultApts));
      setAppointments(defaultApts);
    }

    // D. Wallet & Settlement Load
    const savedBalance = localStorage.getItem(`ds_physio_balance_${emailKey}`);
    if (savedBalance) {
      setWalletBalance(parseFloat(savedBalance));
    } else {
      // Seed ₹4,500 initial completed earnings balance
      localStorage.setItem(`ds_physio_balance_${emailKey}`, '4500');
      setWalletBalance(4500);
    }

    const savedSettlements = localStorage.getItem(`ds_physio_settlements_${emailKey}`);
    const defaultSettlements = [
      { id: 'SET-99120', amount: 3000, status: 'Settled', date: '2026-07-02', account: '...2941' },
      { id: 'SET-99121', amount: 2000, status: 'Settled', date: '2026-07-04', account: '...2941' }
    ];
    if (savedSettlements) {
      setSettlementRequests(JSON.parse(savedSettlements));
    } else {
      localStorage.setItem(`ds_physio_settlements_${emailKey}`, JSON.stringify(defaultSettlements));
      setSettlementRequests(defaultSettlements);
    }

    // E. Notifications Load
    const defaultNotifs = [
      { id: 'not-1', title: 'New Booking Request', message: 'Arjun Verma requested a Home Visit on ' + new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '1 hour ago', read: false },
      { id: 'not-2', title: 'Account Verified', message: 'Congratulations! Your professional profile is verified and active on the DOCT SPARK network.', time: '2 days ago', read: true }
    ];
    setNotifications(defaultNotifs);

  }, [emailKey]);

  // Profile Save Helper
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    const physList: Physiotherapy[] = savedPhysios ? JSON.parse(savedPhysios) : [];
    
    const updatedList = physList.map(p => {
      if (p.email.toLowerCase() === emailKey) {
        return {
          ...p,
          name: profileForm.name,
          therapistName: profileForm.therapistName,
          phone: profileForm.phone,
          specialty: profileForm.specialty,
          experience: Number(profileForm.experience),
          address: profileForm.address,
          city: profileForm.city,
          district: profileForm.district,
          state: profileForm.state,
          pincode: profileForm.pincode,
          clinicFee: profileForm.clinicFee,
          homeFee: profileForm.homeFee
        };
      }
      return p;
    });

    localStorage.setItem('ds_physiotherapists', JSON.stringify(updatedList));
    const matched = updatedList.find(p => p.email.toLowerCase() === emailKey);
    if (matched) {
      setProfile(matched);
    }
    setIsEditingProfile(false);
    
    // Add Notification
    addNotification('Profile Updated', 'Your clinic and therapist practice details have been updated successfully.');
    alert('✓ Profile updated successfully!');
  };

  // Add Service Handler
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newItem: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      price: Number(newServicePrice),
      description: newServiceDesc.trim() || 'Professional therapeutic services.'
    };

    const updated = [...services, newItem];
    setServices(updated);
    localStorage.setItem(`ds_physio_services_${emailKey}`, JSON.stringify(updated));

    setNewServiceName('');
    setNewServicePrice(800);
    setNewServiceDesc('');

    addNotification('Service Added', `New service offering "${newItem.name}" is now listed.`);
    alert('✓ Service added successfully!');
  };

  // Delete Service Handler
  const handleDeleteService = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    localStorage.setItem(`ds_physio_services_${emailKey}`, JSON.stringify(updated));
    alert('✓ Service deleted successfully.');
  };

  // Appointment Status Flow (Accept, Reject/Cancel, Complete)
  const handleUpdateAptStatus = (id: string, newStatus: 'Scheduled' | 'Completed' | 'Cancelled') => {
    const updated = appointments.map(apt => {
      if (apt.id === id) {
        // If completed, add cash to wallet balance
        if (newStatus === 'Completed') {
          const serviceCharge = apt.fee;
          const platformFeePct = 0.05; // 5% platform charge
          const platformFee = serviceCharge * platformFeePct;
          const netEarning = serviceCharge - platformFee;

          const oldBal = walletBalance;
          const newBal = oldBal + netEarning;
          setWalletBalance(newBal);
          localStorage.setItem(`ds_physio_balance_${emailKey}`, newBal.toString());

          // Trigger commission sharing for the 5% platform fee
          if (profile?.onboardedBy) {
            generateCommission('Appointment', apt.id, `Physiotherapy: ${apt.patientName} with ${profile.therapistName}`, serviceCharge, profile.onboardedBy);
          } else {
            generateCommission('Appointment', apt.id, `Physiotherapy: ${apt.patientName} with ${profile?.therapistName || 'Therapist'}`, serviceCharge, 'part-demo-district');
          }

          addNotification('Earnings Credited', `Session completed. ₹${netEarning} credited to wallet (5% platform fee deducted).`);
        }
        return { ...apt, status: newStatus };
      }
      return apt;
    });

    setAppointments(updated);
    localStorage.setItem(`ds_physio_appointments_${emailKey}`, JSON.stringify(updated));
    alert(`✓ Booking status updated to ${newStatus}.`);
  };

  // Save Session Notes
  const handleSaveNotes = () => {
    if (!selectedAppointmentForNotes) return;
    
    const updated = appointments.map(apt => {
      if (apt.id === selectedAppointmentForNotes.id) {
        return { ...apt, sessionNotes: tempNotes };
      }
      return apt;
    });

    setAppointments(updated);
    localStorage.setItem(`ds_physio_appointments_${emailKey}`, JSON.stringify(updated));
    setSelectedAppointmentForNotes(null);
    setTempNotes('');
    alert('✓ Clinical session notes saved successfully!');
  };

  // Request Bank Settlement
  const handleRequestSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (withdrawAmount > walletBalance) {
      alert('Insufficient wallet balance.');
      return;
    }

    const updatedBal = walletBalance - withdrawAmount;
    setWalletBalance(updatedBal);
    localStorage.setItem(`ds_physio_balance_${emailKey}`, updatedBal.toString());

    const newSettlement = {
      id: `SET-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: withdrawAmount,
      status: 'Settled', // instant payout standard
      date: new Date().toISOString().split('T')[0],
      account: `...${bankAccount.number.slice(-4)}`
    };

    const updatedRequests = [newSettlement, ...settlementRequests];
    setSettlementRequests(updatedRequests);
    localStorage.setItem(`ds_physio_settlements_${emailKey}`, JSON.stringify(updatedRequests));

    addNotification('Settlement Settled', `Payout request for ₹${withdrawAmount} processed instantly to your registered bank account.`);
    alert(`✓ Payout of ₹${withdrawAmount} successfully settled instantly to your bank account!`);
  };

  // Notification addition helper
  const addNotification = (title: string, message: string) => {
    const newNotif = {
      id: `not-${Date.now()}`,
      title,
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Totals calculations
  const totalCompletedEarnings = appointments
    .filter(apt => apt.status === 'Completed')
    .reduce((sum, apt) => sum + apt.fee, 0);

  const totalHomeVisits = appointments.filter(apt => apt.type === 'Home Visit').length;
  const totalClinicVisits = appointments.filter(apt => apt.type === 'Clinic Visit').length;

  const homeEarnings = appointments
    .filter(apt => apt.status === 'Completed' && apt.type === 'Home Visit')
    .reduce((sum, apt) => sum + apt.fee, 0);

  const clinicEarnings = appointments
    .filter(apt => apt.status === 'Completed' && apt.type === 'Clinic Visit')
    .reduce((sum, apt) => sum + apt.fee, 0);

  const renderSidebarContent = () => {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
          <div className="w-10 h-10 bg-[#0A6E6E]/10 text-[#0A6E6E] rounded-full flex items-center justify-center text-lg font-black border border-[#0A6E6E]/20">
            ♿
          </div>
          <div className="overflow-hidden">
            <h3 className="font-extrabold text-sm text-[#1A2B3C] truncate leading-tight">{profile?.name || 'Rehab Physiotherapy'}</h3>
            <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">Lic: IAP Registered</p>
            <span className="inline-block mt-1 text-[8px] bg-emerald-50 text-emerald-700 font-black px-1.5 py-0.5 rounded border border-emerald-200">
              Approved / Verified
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'overview' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'appointments' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4" />
              <span>Appointments & Visits</span>
            </div>
            {appointments.filter(a => a.status === 'Pending').length > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                {appointments.filter(a => a.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'services' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Service List Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'wallet' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet & Settlements</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'profile' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Practice Profile</span>
          </button>
        </div>

        <div className="bg-[#FAFBFD] border border-gray-100 rounded-2xl p-4 text-[11px] font-sans">
          <h4 className="font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1 text-[9px]">Territorial Alignment</h4>
          <p className="text-gray-400 font-medium leading-relaxed">
            Onboarded under <strong>{profile?.onboardedByType || 'District'} Partner</strong>. Platform fees of 5% on bookings automatically help grow territory-specific digital networks.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 font-sans">
          <button
            onClick={() => {
              setUserRole(null);
              setUserEmail(null);
              setView('login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer text-left"
          >
            <Settings className="w-4 h-4 text-rose-500" /> Disconnect Session
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      currentView={currentView}
      setView={setView}
      userRole={userRole}
      setUserRole={setUserRole}
      userEmail={userEmail}
      setUserEmail={setUserEmail}
      notificationsCount={notificationsCount}
      onOpenNotifications={onOpenNotifications}
      sidebar={renderSidebarContent()}
      activeTabTitle={
        activeTab === 'overview' ? '📊 Overview Analytics' :
        activeTab === 'appointments' ? '📋 Appointments & Visits' :
        activeTab === 'services' ? '💪 Service List Catalog' :
        activeTab === 'wallet' ? '💰 Wallet & Settlements' : '⚙️ Practice Profile'
      }
    >
      <div className="space-y-6">
        {/* Simulated Push Message gateway */}
        {notifications.some(n => !n.read) && (
          <div className="bg-slate-950 text-teal-400 font-mono rounded-2xl p-4 text-[10px] space-y-1 shadow-md border border-slate-800">
            <div className="font-extrabold uppercase text-gray-400 border-b border-gray-800 pb-1.5 mb-2 flex justify-between items-center font-sans">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Live Physiotherapist Alert Notifications Gateway
              </span>
              <button 
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))} 
                className="text-teal-400 hover:underline text-[9px] font-bold"
              >
                Mark all read
              </button>
            </div>
            {notifications.filter(n => !n.read).map(n => (
              <div key={n.id} className="leading-relaxed opacity-95">
                <span className="text-amber-400">[{n.title}]</span> {n.message} <span className="text-gray-500">({n.time})</span>
              </div>
            ))}
          </div>
        )}

        {/* Content Panel */}
        <div className="space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Completed Sessions</span>
                  <span className="text-2xl font-black text-[#1A2B3C] font-heading block mt-1">
                    {appointments.filter(a => a.status === 'Completed').length}
                  </span>
                  <span className="text-[9px] text-gray-400 block font-semibold mt-1">
                    {totalHomeVisits} Home visits | {totalClinicVisits} Clinic visits
                  </span>
                </div>

                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Gross Platform Earnings</span>
                  <span className="text-2xl font-black text-[#1A2B3C] font-heading block mt-1">
                    ₹{totalCompletedEarnings.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-emerald-600 block font-semibold mt-1">
                    ₹{homeEarnings.toLocaleString('en-IN')} Home Rehab | ₹{clinicEarnings.toLocaleString('en-IN')} Clinic
                  </span>
                </div>

                <div className="bg-[#0A6E6E] text-white rounded-2xl p-5 shadow-3xs">
                  <span className="text-[10px] font-extrabold text-teal-200 uppercase block tracking-wider">Withdrawable Wallet Balance</span>
                  <span className="text-2xl font-black font-heading block mt-1">
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-teal-100 block font-semibold mt-1">
                    5% platform fee already settled
                  </span>
                </div>
              </div>

              {/* Pending Action Bookings */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
                <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Incoming Booking Requests</h3>
                <p className="text-xs text-gray-400 mb-4">Urgent client scheduling requests. Accept or reject to update live status.</p>

                <div className="space-y-4">
                  {appointments.filter(a => a.status === 'Pending').map(apt => (
                    <div key={apt.id} className="border border-amber-100 rounded-xl p-4 bg-amber-50/40 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[8px] uppercase tracking-wider">{apt.type}</span>
                          <span className="text-gray-400 font-bold">Pincode: {apt.pincode}</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1">{apt.patientName}</h4>
                        <p className="text-gray-500 font-semibold">{apt.serviceName} | Scheduled: {apt.date} at {apt.time}</p>
                        <p className="text-gray-400 font-medium mt-0.5">Location: {apt.address}</p>
                        <p className="text-[#0A6E6E] font-bold mt-1">Consultation Charge: ₹{apt.fee}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => handleUpdateAptStatus(apt.id, 'Cancelled')}
                          className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg cursor-pointer text-xs flex-grow sm:flex-grow-0 text-center"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleUpdateAptStatus(apt.id, 'Scheduled')}
                          className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-lg cursor-pointer text-xs flex-grow sm:flex-grow-0 text-center"
                        >
                          Accept Booking
                        </button>
                      </div>
                    </div>
                  ))}

                  {appointments.filter(a => a.status === 'Pending').length === 0 && (
                    <div className="text-center py-6 text-gray-400 font-medium">
                      No pending booking requests currently.
                    </div>
                  )}
                </div>
              </div>

              {/* Action-Oriented Service & Schedule Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider mb-2">Practice Offerings</h3>
                  <p className="text-[11px] text-gray-400 mb-4">Quick overview of catalog offerings and fees.</p>
                  <div className="space-y-2">
                    {services.slice(0, 3).map(s => (
                      <div key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs font-semibold text-gray-700">
                        <span className="truncate">{s.name}</span>
                        <span className="text-[#0A6E6E]">₹{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider mb-2">Earnings Bento Breakdown</h3>
                  <div className="space-y-3 mt-4 text-xs font-semibold text-gray-600">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span>Home Visits Completed:</span>
                      <span>{appointments.filter(a => a.status === 'Completed' && a.type === 'Home Visit').length} (₹{homeEarnings})</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5">
                      <span>Clinic Visits Completed:</span>
                      <span>{appointments.filter(a => a.status === 'Completed' && a.type === 'Clinic Visit').length} (₹{clinicEarnings})</span>
                    </div>
                    <div className="flex justify-between pt-1 font-black text-[#1A2B3C]">
                      <span>Gross Consultation Income:</span>
                      <span className="text-emerald-700">₹{totalCompletedEarnings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPOINTMENTS & HOME VISITS */}
          {activeTab === 'appointments' && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider">All Appointments & Home Visits</h3>
                  <p className="text-xs text-gray-400">Review schedule, update clinical statuses, and write session report summaries.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-[#D1E5E5] rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Booking Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-4">
                {appointments
                  .filter(apt => appFilter === 'all' || apt.status === appFilter)
                  .map(apt => (
                    <div key={apt.id} className="border border-[#D1E5E5]/60 rounded-2xl p-5 hover:border-slate-300 transition-all text-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              apt.type === 'Home Visit' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {apt.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              apt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              apt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1.5">{apt.patientName} ({apt.phone})</h4>
                        </div>
                        <div className="text-right sm:text-right text-slate-500">
                          <p className="font-bold">{apt.date}</p>
                          <p className="font-semibold">{apt.time}</p>
                        </div>
                      </div>

                      <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Prescribed Care Service</p>
                          <p className="font-extrabold text-slate-800 text-xs">{apt.serviceName}</p>
                          <p className="text-gray-400 font-medium">Session Fee: <span className="font-bold text-[#0A6E6E]">₹{apt.fee}</span></p>
                          <p className="text-gray-400 font-medium">Patient Address: <span>{apt.address}</span></p>
                          <p className="text-gray-400 font-medium">Location Pincode: <span className="font-mono text-indigo-700 font-bold">{apt.pincode}</span></p>
                        </div>

                        <div className="space-y-3">
                          {apt.sessionNotes ? (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <p className="font-black text-slate-700 text-[10px] uppercase mb-1">Clinical Session Notes</p>
                              <p className="text-gray-500 italic font-semibold">{apt.sessionNotes}</p>
                            </div>
                          ) : (
                            <p className="text-gray-400 italic font-medium">No session logs or clinical notes recorded.</p>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {apt.status === 'Scheduled' && (
                              <>
                                <button
                                  onClick={() => handleUpdateAptStatus(apt.id, 'Completed')}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg cursor-pointer"
                                >
                                  Complete Session ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAppointmentForNotes(apt);
                                    setTempNotes(apt.sessionNotes || '');
                                  }}
                                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 border border-gray-200 font-bold rounded-lg cursor-pointer"
                                >
                                  Add Session Notes
                                </button>
                              </>
                            )}
                            
                            {apt.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateAptStatus(apt.id, 'Scheduled')}
                                className="px-4 py-1.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-lg cursor-pointer"
                              >
                                Accept Appointment
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {appointments.filter(apt => appFilter === 'all' || apt.status === appFilter).length === 0 && (
                  <div className="text-center py-12 text-gray-400 font-semibold bg-slate-50 rounded-2xl">
                    No matching appointments found.
                  </div>
                )}
              </div>

              {/* Note Taking Modal Dialog overlay */}
              {selectedAppointmentForNotes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                  <div className="bg-white border border-[#D1E5E5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                    <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider pb-2 border-b border-slate-100">
                      Record Clinical Session Notes
                    </h3>
                    <p className="text-xs text-gray-400">
                      Add details regarding joint range of motion, muscle strength exercises, posture recovery remarks, and patient feedback.
                    </p>
                    <textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      rows={4}
                      placeholder="Enter notes (e.g., Patient completed quadriceps sets and leg raises. Flexion improved to 95 degrees...)"
                      className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedAppointmentForNotes(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-lg text-xs cursor-pointer"
                      >
                        Save Notes ✓
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICES CATALOG LIST */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Add Service Catalog Panel */}
              <div className="md:col-span-1 bg-[#F9FBFC] border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Add Practice Offering</h3>
                  <p className="text-xs text-gray-400 mb-4">Introduce custom treatment sessions into your public care catalog.</p>

                  <form onSubmit={handleAddService} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Service Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Pediatric Physiotherapy"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Session Price (₹)</label>
                      <input
                        type="number"
                        min={100}
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Short Description / Care Focus</label>
                      <textarea
                        rows={3}
                        placeholder="e.g., Focuses on coordination, motor recovery, posture correction exercises."
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-4 py-2.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Save Care Offering
                    </button>
                  </form>
                </div>
              </div>

              {/* Right List catalog */}
              <div className="md:col-span-2 bg-white border border-[#D1E5E5] rounded-2xl p-6">
                <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Your Listed Care Catalog</h3>
                <p className="text-xs text-gray-400 mb-6">These categories and session fees are published for patient bookings.</p>

                <div className="space-y-3">
                  {services.map(s => (
                    <div key={s.id} className="p-4 border border-[#D1E5E5]/60 rounded-xl hover:bg-slate-50/50 transition-colors flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#1A2B3C]">{s.name}</h4>
                        <p className="text-xs text-gray-400 font-medium mt-1">{s.description}</p>
                        <span className="inline-block mt-2 font-black text-[#0A6E6E] text-xs">Standard Consultation Fee: ₹{s.price}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-lg shrink-0 cursor-pointer"
                        title="Delete Care Offering"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {services.length === 0 && (
                    <div className="text-center py-12 text-gray-400 italic">
                      No customized physiotherapy services in catalog. Add your first service above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WALLET & SETTLEMENTS */}
          {activeTab === 'wallet' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Settlement Form */}
              <div className="md:col-span-1 bg-[#F9FBFC] border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Request Bank Payout</h3>
                  <p className="text-xs text-gray-400 mb-4">Transfer available wallet earnings securely to your registered bank account instantly.</p>

                  <div className="mb-4 p-3 bg-slate-100 rounded-xl text-xs space-y-1 font-semibold text-slate-700">
                    <p className="text-gray-400">Registered Bank Account:</p>
                    <p className="text-slate-800">{bankAccount.bankName}</p>
                    <p className="text-slate-800">A/C: {bankAccount.number}</p>
                    <p className="text-slate-800">IFSC: {bankAccount.ifsc}</p>
                  </div>

                  <form onSubmit={handleRequestSettlement} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Withdrawable Amount (₹)</label>
                      <input
                        type="number"
                        min={100}
                        max={walletBalance}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <span className="text-[9px] text-gray-400 block mt-0.5">Maximum withdrawable: ₹{walletBalance}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={walletBalance <= 0}
                      className="w-full px-4 py-2.5 bg-[#0A6E6E] hover:bg-[#075353] disabled:bg-slate-300 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Transfer to Bank
                    </button>
                  </form>
                </div>
              </div>

              {/* Ledger list of payouts */}
              <div className="md:col-span-2 bg-white border border-[#D1E5E5] rounded-2xl p-6">
                <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Settlement Ledger & Transactions</h3>
                <p className="text-xs text-gray-400 mb-6">Historic direct bank settlement payout logs.</p>

                <div className="space-y-3">
                  {settlementRequests.map((sett, idx) => (
                    <div key={sett.id || idx} className="p-3 border border-[#D1E5E5]/60 rounded-xl text-xs font-semibold text-gray-700 flex justify-between items-center bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">{sett.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black uppercase tracking-wider">{sett.status}</span>
                        </div>
                        <p className="text-gray-400 font-medium text-[10px] mt-0.5">Settled to A/C {sett.account} on {sett.date}</p>
                      </div>
                      <span className="text-emerald-700 font-black text-sm">₹{sett.amount}</span>
                    </div>
                  ))}

                  {settlementRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-400 font-semibold">
                      No direct bank settlements processed yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRACTICE PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider">Practice Profile Management</h3>
                  <p className="text-xs text-gray-400">Review clinical licenses, specialty options, and update consultation fees.</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer border border-slate-200"
                  >
                    Edit Clinic Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Clinic / Business Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Chief Therapist Name</label>
                      <input
                        type="text"
                        value={profileForm.therapistName}
                        onChange={(e) => setProfileForm({ ...profileForm, therapistName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Contact Mobile Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Specialty Focus Area</label>
                      <input
                        type="text"
                        value={profileForm.specialty}
                        onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Years of Practice Experience</label>
                      <input
                        type="number"
                        value={profileForm.experience}
                        onChange={(e) => setProfileForm({ ...profileForm, experience: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Practice Base Address</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Pincode</label>
                      <input
                        type="text"
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Base Clinic Consultation Price (₹)</label>
                      <input
                        type="number"
                        value={profileForm.clinicFee}
                        onChange={(e) => setProfileForm({ ...profileForm, clinicFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Base Home Visit Consultation Price (₹)</label>
                      <input
                        type="number"
                        value={profileForm.homeFee}
                        onChange={(e) => setProfileForm({ ...profileForm, homeFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-[#D1E5E5] rounded-lg font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-lg cursor-pointer"
                    >
                      Save Changes ✓
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-xs text-slate-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Clinic Center Name</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{profile?.name}</span>
                    </div>

                    <div className="border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Chief Physiotherapist (PT)</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{profile?.therapistName}</span>
                    </div>

                    <div className="border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Professional License Registry</span>
                      <span className="font-bold text-indigo-700 font-mono mt-0.5 block">{profile?.registrationNumber || 'IAP-98124-PT'} (Verified)</span>
                    </div>

                    <div className="border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Specialty Areas</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{profile?.specialty}</span>
                    </div>

                    <div className="border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Practice Experience</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{profile?.experience} Years</span>
                    </div>

                    <div className="border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Base Consultation Pricing</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        Clinic: <strong className="text-[#0A6E6E]">₹{(profile as any)?.clinicFee || 800}</strong> | Home Visit: <strong className="text-[#0A6E6E]">₹{(profile as any)?.homeFee || 1500}</strong>
                      </span>
                    </div>

                    <div className="border-b border-slate-100 pb-2 md:col-span-2">
                      <span className="font-extrabold text-slate-400 block uppercase tracking-wider text-[9px]">Practice Address</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{profile?.address}, {profile?.city}, {profile?.state} - {profile?.pincode}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-2">
                    <p className="font-black text-teal-800 uppercase tracking-wider text-[10px]">Verification Documents & Accreditation</p>
                    <div className="flex gap-4 flex-wrap text-teal-800 font-semibold font-mono text-[10px]">
                      <span>✓ IAP_Accreditation_Certificate.pdf</span>
                      <span>✓ Clinical_Establishment_Act_License.pdf</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </DashboardLayout>
  );
}
