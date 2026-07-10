/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building, Plus, Users, Shield, MapPin, IndianRupee, Clock, Trash2, CheckCircle2, 
  ChevronDown, ChevronRight, Activity, Calendar, Award, Gift, Sliders, Menu, X, 
  PlusCircle, Search, Edit2, Check, AlertTriangle, RefreshCw, BarChart3, DollarSign, 
  Briefcase, Heart, BookOpen, Layers, Phone, Mail, FileText, Settings, ShieldCheck, HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { MOCK_CLINICS, MOCK_DOCTORS } from '../../data/mockData';
import { Doctor, Clinic, Appointment, Role } from '../../types';
import DashboardLayout from '../layout/DashboardLayout';

interface ClinicDashboardProps {
  setView: (view: string) => void;
  doctorsList: Doctor[];
  clinicsList?: Clinic[];
  appointments?: Appointment[];
  userEmail?: string | null;
  onAddDoctor: (newDoc: Doctor) => void;
  onRemoveDoctor: (id: string) => void;
  currentView: string;
  userRole: Role | null;
  setUserRole: (role: Role | null) => void;
  setUserEmail: (email: string | null) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
}

export default function ClinicDashboard({
  setView,
  doctorsList,
  clinicsList = MOCK_CLINICS,
  appointments = [],
  userEmail,
  onAddDoctor,
  onRemoveDoctor,
  currentView,
  userRole,
  setUserRole,
  setUserEmail,
  notificationsCount,
  onOpenNotifications
}: ClinicDashboardProps) {

  // Evaluate the correct clinic associated with this user
  const clinic = React.useMemo(() => {
    if (!userEmail) return clinicsList[0];
    const normalizedEmail = userEmail.toLowerCase();
    return clinicsList.find(c => {
      const simpleName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const simpleEmailUser = normalizedEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      return simpleEmailUser.includes(simpleName) || simpleName.includes(simpleEmailUser);
    }) || clinicsList[0];
  }, [clinicsList, userEmail]);

  // Filter doctors associated with this clinic
  const clinicDoctors = React.useMemo(() => {
    return doctorsList.filter(d => d.clinicName === clinic.name);
  }, [doctorsList, clinic.name]);

  // Dynamic navigation & tab controls
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // listen to global tab-change events dispatched from custom header
  React.useEffect(() => {
    const handleTabChange = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('clinic-tab-change', handleTabChange);
    return () => {
      window.removeEventListener('clinic-tab-change', handleTabChange);
    };
  }, []);

  // Sync and manage local interactive appointments for this clinic
  const [localApts, setLocalApts] = React.useState<Appointment[]>([]);
  React.useEffect(() => {
    const saved = localStorage.getItem('ds_appointments');
    const list: Appointment[] = saved ? JSON.parse(saved) : appointments;
    const filtered = list.filter(appt => 
      appt.clinicName === clinic.name || 
      clinicDoctors.some(doc => doc.id === appt.doctorId || doc.name === appt.doctorName)
    );
    setLocalApts(filtered);
  }, [appointments, clinic.name, clinicDoctors]);

  const updateAppointmentStatus = (apptId: string, status: 'Confirmed' | 'Completed' | 'Cancelled') => {
    const saved = localStorage.getItem('ds_appointments');
    if (saved) {
      const all: Appointment[] = JSON.parse(saved);
      const updated = all.map(a => a.id === apptId ? { ...a, status } : a);
      localStorage.setItem('ds_appointments', JSON.stringify(updated));
      setLocalApts(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
      window.dispatchEvent(new Event('storage'));
      alert(`Appointment status updated to ${status} successfully!`);
    }
  };

  // Walk-in booking desk variables
  const [showAddBookingModal, setShowAddBookingModal] = React.useState(false);
  const [bookingPatientName, setBookingPatientName] = React.useState('');
  const [bookingPatientAge, setBookingPatientAge] = React.useState('32');
  const [bookingPatientGender, setBookingPatientGender] = React.useState('Male');
  const [bookingDocId, setBookingDocId] = React.useState(clinicDoctors[0]?.id || '');
  const [bookingDate, setBookingDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = React.useState('11:00 AM');
  const [bookingType, setBookingType] = React.useState('In-Clinic');

  // Update default selected doc once doctors are evaluated
  React.useEffect(() => {
    if (clinicDoctors.length > 0 && !bookingDocId) {
      setBookingDocId(clinicDoctors[0].id);
    }
  }, [clinicDoctors, bookingDocId]);

  const handleDirectBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPatientName.trim()) {
      alert('Please fill in the patient name.');
      return;
    }
    if (!bookingDocId) {
      alert('Please select an active doctor for association.');
      return;
    }

    const doc = clinicDoctors.find(d => d.id === bookingDocId);
    if (!doc) return;

    const newApt: Appointment = {
      id: `apt-direct-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      doctorPhoto: doc.photo,
      patientId: `patient-direct-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: bookingPatientName,
      patientAge: Number(bookingPatientAge),
      patientGender: bookingPatientGender as any,
      date: bookingDate,
      time: bookingTime,
      type: bookingType as any,
      status: 'Confirmed',
      fee: doc.feeInClinic,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
      serialNo: localApts.length + 1,
      paymentMethod: 'Cash at Desk',
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString()
    };

    const saved = localStorage.getItem('ds_appointments');
    const all: Appointment[] = saved ? JSON.parse(saved) : [];
    const updated = [newApt, ...all];
    localStorage.setItem('ds_appointments', JSON.stringify(updated));
    setLocalApts(prev => [newApt, ...prev]);
    window.dispatchEvent(new Event('storage'));

    // Reset direct booking fields
    setBookingPatientName('');
    setBookingPatientAge('32');
    setBookingPatientGender('Male');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingTime('11:00 AM');
    setShowAddBookingModal(false);
    alert(`Direct walking appointment successfully registered and scheduled for ${bookingPatientName}!`);
  };

  // Staff list state
  const [staffList, setStaffList] = React.useState([
    { id: 'st-1', name: 'Sister Preeti Sharma', role: 'Clinical Nurse Lead', department: 'Outpatient Dept', email: 'preeti@doctspark.in', phone: '+91 91234 56780', status: 'Active', shift: 'Day' },
    { id: 'st-2', name: 'Mr. Arvind Swamy', role: 'Senior Receptionist', department: 'Admission & Helpdesk', email: 'arvind@doctspark.in', phone: '+91 98123 45671', status: 'Active', shift: 'Day' },
    { id: 'st-3', name: 'Dr. Rahul Verma', role: 'Pharmacist Manager', department: 'Pharmacy Services', email: 'rahul.p@doctspark.in', phone: '+91 97123 45672', status: 'Active', shift: 'Day' },
    { id: 'st-4', name: 'Mrs. Suman Rao', role: 'Laboratory Assistant', department: 'Diagnostics & Pathology', email: 'suman.r@doctspark.in', phone: '+91 96123 45673', status: 'Active', shift: 'Night' }
  ]);
  const [showAddStaffModal, setShowAddStaffModal] = React.useState(false);
  const [staffName, setStaffName] = React.useState('');
  const [staffRole, setStaffRole] = React.useState('Clinical Nurse Lead');
  const [staffDept, setStaffDept] = React.useState('Outpatient Dept');
  const [staffEmail, setStaffEmail] = React.useState('');
  const [staffPhone, setStaffPhone] = React.useState('');
  const [staffShift, setStaffShift] = React.useState('Day');

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      alert('Please fill in the staff member name.');
      return;
    }
    const finalPhone = staffPhone.trim() || `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`;
    const finalEmail = staffEmail.trim() || `${staffName.toLowerCase().replace(/\s+/g, '')}@doctspark.in`;
    const newStaff = {
      id: `st-new-${Math.floor(100 + Math.random() * 900)}`,
      name: staffName,
      role: staffRole,
      department: staffDept,
      email: finalEmail,
      phone: finalPhone,
      status: 'Active',
      shift: staffShift
    };
    setStaffList(prev => [...prev, newStaff]);
    setShowAddStaffModal(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    alert(`${staffName} successfully registered in the clinic staff log.`);
  };

  const handleRemoveStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove staff member ${name}?`)) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  // Amenities and verified facilities state with sync
  const [clinicAmenities, setClinicAmenities] = React.useState<string[]>(
    clinic.amenities || ['Waiting Lounge', 'Diagnostic Lab', 'Pharmacy', 'ECG Room']
  );
  const handleToggleAmenity = (amenity: string) => {
    const updated = clinicAmenities.includes(amenity)
      ? clinicAmenities.filter(a => a !== amenity)
      : [...clinicAmenities, amenity];
    setClinicAmenities(updated);
    
    // Persist to clinics list in localStorage
    const saved = localStorage.getItem('ds_clinics');
    if (saved) {
      const all: Clinic[] = JSON.parse(saved);
      const updatedClinics = all.map(c => c.id === clinic.id ? { ...c, amenities: updated } : c);
      localStorage.setItem('ds_clinics', JSON.stringify(updatedClinics));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Outstanding Payout & Withdrawal logs
  const [outstandingPayout, setOutstandingPayout] = React.useState(18500);
  const [withdrawalLogs, setWithdrawalLogs] = React.useState([
    { id: 'TXN-9843102', amount: 12500, date: '2026-06-15', status: 'Settled', method: 'Bank Transfer' },
    { id: 'TXN-9843519', amount: 15000, date: '2026-06-28', status: 'Settled', method: 'UPI Instant' },
    { id: 'TXN-9844021', amount: 8500, date: '2026-07-01', status: 'Processing', method: 'Bank Transfer' }
  ]);
  const handleWithdrawFunds = () => {
    if (outstandingPayout <= 0) {
      alert("No outstanding balance available for payout.");
      return;
    }
    const amount = outstandingPayout;
    setOutstandingPayout(0);
    const newLog = {
      id: `TXN-${Math.floor(9000000 + Math.random() * 1000000)}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: 'Processing',
      method: 'UPI Instant'
    };
    setWithdrawalLogs(prev => [newLog, ...prev]);
    alert(`Bi-weekly payout of ₹${amount.toLocaleString('en-IN')} successfully initiated via UPI Instant. Funds will settle within 1 working day.`);
  };

  // Chambers Room configuration
  const [cabinRooms, setCabinRooms] = React.useState([
    { id: 'cab-1', name: 'Cabin A-101 (Ground Floor)', assignedDoc: clinicDoctors[0]?.name || 'Dr. Rajesh Khanna', status: 'Occupied', type: 'General Checkup' },
    { id: 'cab-2', name: 'Cabin B-201 (First Floor)', assignedDoc: clinicDoctors[1]?.name || 'Dr. Satish Gujral', status: 'Occupied', type: 'Cardiology wing' },
    { id: 'cab-3', name: 'Cabin C-301 (First Floor)', assignedDoc: 'None', status: 'Available', type: 'Specialist consultation' },
    { id: 'cab-4', name: 'Cabin D-401 (Therapy Floor)', assignedDoc: 'None', status: 'Maintenance', type: 'Physiotherapy' }
  ]);

  const toggleCabinStatus = (id: string) => {
    setCabinRooms(prev => prev.map(cab => {
      if (cab.id === id) {
        const nextStatus = cab.status === 'Available' ? 'Occupied' : cab.status === 'Occupied' ? 'Maintenance' : 'Available';
        return { ...cab, status: nextStatus };
      }
      return cab;
    }));
  };

  // States for adding doctor relationship
  const [showAddDocModal, setShowAddDocModal] = React.useState(false);
  const [docName, setDocName] = React.useState('');
  const [docSpecialty, setDocSpecialty] = React.useState('Cardiologist');
  const [docExperience, setDocExperience] = React.useState('8');
  const [docInClinicFee, setDocInClinicFee] = React.useState('600');
  const [docVideoFee, setDocVideoFee] = React.useState('500');
  const [docCabin, setDocCabin] = React.useState('Cabin B-201');
  const [docGender, setDocGender] = React.useState('Male');
  const [docPhone, setDocPhone] = React.useState('');
  const [docEmail, setDocEmail] = React.useState('');
  const [docEducation, setDocEducation] = React.useState('MBBS, MD');
  const [docRegNum, setDocRegNum] = React.useState('');
  const [docLanguages, setDocLanguages] = React.useState<string[]>(['English', 'Hindi']);

  // Photo presets
  const docPhotosPresets = [
    { url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', label: 'Male Doc (Mid-age)' },
    { url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400', label: 'Female Doc (Warm)' },
    { url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400', label: 'Male Doc (Senior)' },
    { url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', label: 'Female Doc (Expert)' }
  ];
  const [selectedPhoto, setSelectedPhoto] = React.useState(docPhotosPresets[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = React.useState('');

  const timeSlotsPreset = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];
  const [selectedSlots, setSelectedSlots] = React.useState<string[]>(['09:00 AM', '11:00 AM', '04:00 PM']);

  const handleToggleSlot = (slot: string) => {
    setSelectedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  const handleToggleLanguage = (lang: string) => {
    setDocLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      alert('Please fill in the doctor name.');
      return;
    }

    const finalPhoto = customPhotoUrl.trim() ? customPhotoUrl.trim() : selectedPhoto;
    const finalRegNum = docRegNum.trim() || `MCI-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalPhone = docPhone.trim() || `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
    const finalEmail = docEmail.trim() || `${docName.toLowerCase().replace(/\s+/g, '')}@doctspark.in`;

    const newDoc: Doctor = {
      id: `doc-new-${Math.floor(1000 + Math.random() * 9000)}`,
      name: docName,
      specialty: docSpecialty,
      experience: Number(docExperience),
      clinicName: clinic.name,
      city: clinic.city,
      rating: 5.0,
      reviewsCount: 1,
      feeInClinic: Number(docInClinicFee),
      feeVideo: Number(docVideoFee),
      nextAvailable: selectedSlots.length > 0 ? `Today ${selectedSlots[0]}` : 'Today 5:00 PM',
      photo: finalPhoto,
      bio: `${docName} is a highly accomplished specialist practicing in ${docCabin} with over ${docExperience} years of experience. Fully dedicated to caring clinical consultations, holding pristine values.`,
      education: docEducation,
      registrationNumber: finalRegNum,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeSlots: selectedSlots.length > 0 ? selectedSlots : ['09:00 AM', '11:00 AM', '04:00 PM'],
      lat: clinic.lat,
      lng: clinic.lng,
      cabinNumber: docCabin,
      gender: docGender,
      contactPhone: finalPhone,
      email: finalEmail,
      languages: docLanguages,
      verificationStatus: 'Approved'
    };

    onAddDoctor(newDoc);
    setShowAddDocModal(false);
    
    // Reset states
    setDocName('');
    setDocRegNum('');
    setDocPhone('');
    setDocEmail('');
    setCustomPhotoUrl('');
    setSelectedSlots(['09:00 AM', '11:00 AM', '04:00 PM']);
    alert(`Dr. ${docName} successfully associated with ${clinic.name} inside ${docCabin}!`);
  };

  // Search filter lists
  const [docSearchQuery, setDocSearchQuery] = React.useState('');
  const filteredClinicDoctors = React.useMemo(() => {
    if (!docSearchQuery.trim()) return clinicDoctors;
    const q = docSearchQuery.toLowerCase();
    return clinicDoctors.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.specialty.toLowerCase().includes(q) || 
      (d.cabinNumber && d.cabinNumber.toLowerCase().includes(q))
    );
  }, [clinicDoctors, docSearchQuery]);

  const [apptSearchQuery, setApptSearchQuery] = React.useState('');
  const [apptFilterStatus, setApptFilterStatus] = React.useState('All');
  const filteredAppointments = React.useMemo(() => {
    return localApts.filter(apt => {
      const matchesSearch = !apptSearchQuery.trim() || 
        apt.patientName.toLowerCase().includes(apptSearchQuery.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(apptSearchQuery.toLowerCase());
      const matchesStatus = apptFilterStatus === 'All' || apt.status === apptFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [localApts, apptSearchQuery, apptFilterStatus]);

  // Unique Patient Logs extraction
  const patientLogs = React.useMemo(() => {
    const map = new Map<string, {
      patientId: string;
      name: string;
      age: number;
      gender: string;
      consultCount: number;
      lastVisitDate: string;
      lastDoc: string;
      status: string;
    }>();

    // Seed defaults for clinic demo to keep it lively
    map.set('pt-demo-1', {
      patientId: 'pt-demo-1',
      name: 'Aarav Mehta',
      age: 42,
      gender: 'Male',
      consultCount: 3,
      lastVisitDate: '2026-06-30',
      lastDoc: clinicDoctors[0]?.name || 'Dr. Satish Gujral',
      status: 'Active'
    });
    map.set('pt-demo-2', {
      patientId: 'pt-demo-2',
      name: 'Priyanka Patel',
      age: 29,
      gender: 'Female',
      consultCount: 1,
      lastVisitDate: '2026-07-01',
      lastDoc: clinicDoctors[1]?.name || 'Dr. Satish Gujral',
      status: 'Active'
    });

    localApts.forEach(apt => {
      const pId = apt.patientId || `pt-${apt.patientName.replace(/\s+/g, '')}`;
      const existing = map.get(pId);
      if (existing) {
        map.set(pId, {
          ...existing,
          consultCount: existing.consultCount + 1,
          lastVisitDate: apt.date > existing.lastVisitDate ? apt.date : existing.lastVisitDate,
          lastDoc: apt.doctorName
        });
      } else {
        map.set(pId, {
          patientId: pId,
          name: apt.patientName,
          age: apt.patientAge || 30,
          gender: apt.patientGender || 'Male',
          consultCount: 1,
          lastVisitDate: apt.date,
          lastDoc: apt.doctorName,
          status: 'Active'
        });
      }
    });

    return Array.from(map.values());
  }, [localApts, clinicDoctors]);

  const [selectedPatientHistory, setSelectedPatientHistory] = React.useState<any | null>(null);

  // Revenue analytics totals
  const financials = React.useMemo(() => {
    const totalConsultFees = localApts
      .filter(a => a.status === 'Completed' || a.status === 'Confirmed')
      .reduce((sum, current) => sum + (current.fee || 500), 0);
    const grossBilling = totalConsultFees;
    const companyShare = Math.round(grossBilling * 0.05); // 5% platform standard
    const clinicPayout = grossBilling - companyShare;
    return { grossBilling, companyShare, clinicPayout };
  }, [localApts]);

  const revenueTrendData = React.useMemo(() => {
    return [
      { name: 'Mon', billing: Math.round(financials.grossBilling * 0.12), count: 2 },
      { name: 'Tue', billing: Math.round(financials.grossBilling * 0.15), count: 3 },
      { name: 'Wed', billing: Math.round(financials.grossBilling * 0.18), count: 4 },
      { name: 'Thu', billing: Math.round(financials.grossBilling * 0.14), count: 2 },
      { name: 'Fri', billing: Math.round(financials.grossBilling * 0.22), count: 5 },
      { name: 'Sat', billing: Math.round(financials.grossBilling * 0.19), count: 4 }
    ];
  }, [financials.grossBilling]);

  // Collapsible Categories Structure
  const menuCategories = [
    {
      group: 'General Control',
      items: [
        { id: 'overview', label: '📊 Admin Overview', icon: <Activity className="w-4.5 h-4.5" /> },
        { id: 'facilities', label: '🏥 Facilities & Chambers', icon: <Layers className="w-4.5 h-4.5" /> }
      ]
    },
    {
      group: 'Clinical Operations',
      items: [
        { id: 'doctors', label: '🩺 Doctors Directory', icon: <Users className="w-4.5 h-4.5" />, count: clinicDoctors.length },
        { id: 'staff', label: '👥 Staff Directory', icon: <Briefcase className="w-4.5 h-4.5" />, count: staffList.length }
      ]
    },
    {
      group: 'Patient Workspace',
      items: [
        { id: 'appointments', label: '📅 Appointment Book', icon: <Calendar className="w-4.5 h-4.5" />, count: localApts.filter(a => a.status === 'Pending').length || undefined },
        { id: 'patients', label: '🩹 Patient Directory', icon: <Heart className="w-4.5 h-4.5" /> }
      ]
    },
    {
      group: 'Financial Desk',
      items: [
        { id: 'revenue', label: '💰 Revenue Ledger', icon: <DollarSign className="w-4.5 h-4.5" /> }
      ]
    }
  ];

  // Render Sidebar Content
  const renderSidebarContent = () => (
    <div className="space-y-6">
      <div className="px-1.5 py-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0A6E6E] flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-[#14B8A6]/20">
            🏥
          </div>
          <div className="truncate">
            <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{clinic.name}</h4>
            <span className="text-[9px] text-[#0A6E6E] font-bold font-mono tracking-wider uppercase">License Verified</span>
          </div>
        </div>
        <div className="h-px bg-slate-100 my-4"></div>
      </div>

      <div className="space-y-5">
        {menuCategories.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase mb-2 px-3 block">
              {group.group}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all text-left whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? 'bg-[#0A6E6E] text-white shadow-md font-extrabold scale-102 translate-x-0.5' 
                        : 'text-slate-600 hover:text-[#0A6E6E] hover:bg-[#F0F7F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#0A6E6E]'}>
                        {item.icon}
                      </span>
                      <span>{item.label.split(' ').slice(1).join(' ')}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#F0F7F7] text-[#0A6E6E]' : 'bg-[#E1F0F0] text-[#0A6E6E]'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
        activeTab === 'overview' ? '📊 Dashboard Overview' :
        activeTab === 'facilities' ? '🏥 Chambers & Settings' :
        activeTab === 'doctors' ? '🩺 Clinical Practitioners' :
        activeTab === 'staff' ? '👥 Nursing & Admin Staff' :
        activeTab === 'appointments' ? '📅 Consult Book Logs' :
        activeTab === 'patients' ? '🩹 Clinic Patient Index' :
        activeTab === 'revenue' ? '💰 Account Revenue Ledger' : '🏥 Clinic Center'
      }
    >
      <div className="space-y-6">
          
          {/* BANNER COMPONENT */}
          <div className="bg-white rounded-3xl border border-[#D1E5E5] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#F0F7F7] text-[#0A6E6E] rounded-2xl flex items-center justify-center shrink-0 border border-[#D1E5E5] shadow-sm">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{clinic.name}</h1>
                  <span className="text-[10px] bg-[#E1F0F0] text-[#0A6E6E] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {clinic.clinicType || 'Multi-Specialty'}
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                    MCI REGISTERED
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 text-[#0A6E6E]" /> {clinic.address} • <span className="font-mono text-slate-700 text-[11px]">Lic: {clinic.licenseNumber || 'LIC-4819302'}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0 mt-3 md:mt-0">
              <button
                onClick={() => setShowAddBookingModal(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1A2B3C] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-slate-200/80 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-600" /> Walk-In Desk
              </button>
              <button
                onClick={() => setShowAddDocModal(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Doctor
              </button>
            </div>
          </div>

          {/* DYNAMIC COMPONENT LOADER BASED ON SELECTED TAB */}
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Stats Summary Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#D1E5E5] shadow-xs hover:border-[#0A6E6E]/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Practitioners</span>
                    <span className="p-1.5 bg-[#F0F7F7] text-[#0A6E6E] rounded-lg"><Users className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{clinicDoctors.length}</div>
                  <span className="text-[10px] text-emerald-600 font-bold">100% Verified status</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#D1E5E5] shadow-xs hover:border-[#0A6E6E]/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Total Consultations</span>
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{localApts.length}</div>
                  <span className="text-[10px] text-indigo-600 font-bold">In-clinic & video logs</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#D1E5E5] shadow-xs hover:border-[#0A6E6E]/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Chambers Active</span>
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Layers className="w-4 h-4" /></span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {cabinRooms.filter(c => c.status === 'Occupied').length} <span className="text-xs text-gray-400 font-bold">/ {cabinRooms.length}</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold">Live cabin monitoring</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#D1E5E5] shadow-xs hover:border-[#0A6E6E]/40 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Ledger Balance</span>
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-4 h-4" /></span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">₹{outstandingPayout.toLocaleString('en-IN')}</div>
                  </div>
                  <button 
                    onClick={handleWithdrawFunds}
                    className="mt-2 text-[10px] bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold py-1 rounded-lg transition-all"
                  >
                    Instant Withdraw
                  </button>
                </div>
              </div>

              {/* Core Insights & Standards checklist */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Side standard card */}
                <div className="md:col-span-7 bg-white rounded-3xl border border-[#D1E5E5] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">On-Duty Clinical Operations</h3>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● Active
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-600 leading-relaxed">
                    Welcome back, Clinic Administrator! You are currently looking over the operational desk. Real-time patient registrations, consulting scheduling, nursing shifts, and platform earnings payout triggers are synced underneath.
                  </div>

                  <div className="border border-[#D1E5E5]/70 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Verified Clinic Hours & Amenities</h4>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-medium">OPD Timings</span>
                        <span className="text-xs font-bold text-slate-800">{clinic.timings || '09:00 AM - 08:00 PM'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-medium">Weekly Off</span>
                        <span className="text-xs font-bold text-[#0A6E6E]">Sundays</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] text-gray-400 font-medium mb-1">Interactive Facilities Checklist</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Waiting Lounge', 'Diagnostic Lab', 'Pharmacy', 'ECG Room', 'X-Ray Wing', 'Cafeteria'].map((facility, idx) => {
                            const isChecked = clinicAmenities.includes(facility);
                            return (
                              <button
                                key={idx}
                                onClick={() => handleToggleAmenity(facility)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  isChecked 
                                    ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]/60 shadow-xs' 
                                    : 'bg-white text-gray-400 border-gray-200/80 hover:border-gray-300'
                                }`}
                              >
                                {isChecked ? `✓ ${facility}` : `+ ${facility}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side standards check lists */}
                <div className="md:col-span-5 bg-[#0A6E6E] text-white rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-md">
                  <div className="space-y-3">
                    <span className="text-[9px] font-black tracking-widest uppercase text-amber-300 block">Auditing Stand</span>
                    <h3 className="text-sm font-black leading-tight">MCI Hospital Standards & Code Compliance</h3>
                    <p className="text-xs text-[#D1E5E5] leading-relaxed">
                      Every associated healthcare specialist in your directory must hold valid state/national medical council registrations. 
                    </p>
                  </div>

                  <div className="space-y-2.5 border-t border-white/10 pt-4 text-[11px] text-slate-100 font-semibold">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" />
                      <span>Regular biometric audit checks enabled</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" />
                      <span>Digital prescription standards strictly aligned</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" />
                      <span>GST commission ledger logs visible 24/7</span>
                    </div>
                  </div>

                  <div className="bg-[#14B8A6]/20 border border-[#14B8A6]/30 rounded-xl p-3 text-center">
                    <span className="block text-[10px] text-white/80 font-bold">Need assistance?</span>
                    <span className="text-[11px] text-white font-extrabold">Call Audit Helpdesk: +91 1800 210 3200</span>
                  </div>
                </div>

              </div>
              
              {/* Quick stats with visual chart preview */}
              <div className="bg-white rounded-3xl border border-[#D1E5E5] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Consultations & Earnings Analytics</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Showing daily consult ledger billing splits</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Gross OPD Value</span>
                    <div className="text-lg font-black text-[#0A6E6E]">₹{financials.grossBilling.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData}>
                      <defs>
                        <linearGradient id="opdBilling" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0A6E6E" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#0A6E6E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="billing" name="OPD Billing (₹)" stroke="#0A6E6E" strokeWidth={2.5} fillOpacity={1} fill="url(#opdBilling)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DOCTORS DIRECTORY */}
          {activeTab === 'doctors' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Clinicians Directory ({clinicDoctors.length})</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage doctor relationships, cabin allocations, and consult fees</p>
                </div>
                
                {/* Search doctors */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text" 
                    placeholder="Filter by name / specialty..."
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1E5E5] rounded-xl outline-none text-xs text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                  />
                </div>
              </div>

              {filteredClinicDoctors.length === 0 ? (
                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-10 text-center text-slate-400 text-xs">
                  <Users className="w-12 h-12 text-[#0A6E6E] mx-auto mb-3 opacity-60" />
                  No associated practitioners found matching "{docSearchQuery}".
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#D1E5E5] overflow-hidden shadow-xs">
                  <div className="divide-y divide-gray-100">
                    {filteredClinicDoctors.map((doc) => (
                      <div key={doc.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-6 text-xs hover:bg-[#F8FAFA] transition-colors">
                        <div className="flex items-start gap-4">
                          <img 
                            src={doc.photo} 
                            alt={doc.name} 
                            className="w-16 h-16 rounded-2xl object-cover border border-[#D1E5E5] shadow-sm shrink-0" 
                            referrerPolicy="no-referrer" 
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-[#1A2B3C]">{doc.name}</h4>
                              <span className="text-[9px] bg-[#E1F0F0] text-[#0A6E6E] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {doc.gender || 'Specialist'}
                              </span>
                              {doc.cabinNumber && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                                  🏢 {doc.cabinNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#0A6E6E] font-bold mt-1">
                              {doc.specialty} • <span className="text-gray-500 font-semibold">{doc.experience} Yrs Experience</span>
                            </p>
                            
                            <div className="text-[10px] text-gray-500 font-semibold mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              <span>📞 {doc.contactPhone || 'N/A'}</span>
                              <span>✉️ {doc.email || 'N/A'}</span>
                              <span>🎓 {doc.education || 'MBBS, MD'}</span>
                            </div>

                            {doc.languages && doc.languages.length > 0 && (
                              <div className="text-[9px] text-gray-400 mt-1.5">
                                🗣️ Speaks: <span className="text-gray-600 font-bold">{doc.languages.join(', ')}</span>
                              </div>
                            )}

                            {doc.timeSlots && doc.timeSlots.length > 0 && (
                              <div className="mt-3">
                                <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Available Appointment Slots</span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.timeSlots.map((slot, idx) => (
                                    <span key={idx} className="text-[9px] bg-[#F0F7F7] text-[#0A6E6E] font-bold px-2 py-0.5 rounded border border-[#D1E5E5]/60">
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col justify-between sm:items-end items-center gap-4 sm:text-right border-t sm:border-0 pt-4 sm:pt-0 border-dashed border-gray-100">
                          <div>
                            <div className="font-extrabold text-gray-900 text-sm">₹{doc.feeInClinic} <span className="text-[10px] text-gray-400 font-bold">In-Clinic</span></div>
                            <div className="text-[10px] text-gray-500 font-bold mt-0.5">₹{doc.feeVideo} <span className="text-[9px] text-gray-400 font-bold">Video Consult</span></div>
                            <div className="text-[9px] text-gray-400 font-mono mt-1">Reg: {doc.registrationNumber}</div>
                          </div>
                          
                          <button
                            onClick={() => onRemoveDoctor(doc.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 flex items-center gap-1 text-[10px] font-black cursor-pointer"
                            title="De-associate practitioner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>De-associate</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: APPOINTMENT BOOK LOGS */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">OPD Appointment Desk ({filteredAppointments.length})</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Confirm, cancel, and audit clinical consultation bookings</p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  {/* Status Filters */}
                  <select
                    value={apptFilterStatus}
                    onChange={(e) => setApptFilterStatus(e.target.value)}
                    className="p-2.5 bg-white border border-[#D1E5E5] rounded-xl outline-none text-xs text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <div className="relative flex-1 sm:flex-initial sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search patient / doctor..."
                      value={apptSearchQuery}
                      onChange={(e) => setApptSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D1E5E5] rounded-xl outline-none text-xs text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                    />
                  </div>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="bg-white border border-[#D1E5E5] rounded-3xl p-12 text-center text-slate-400 text-xs shadow-xs">
                  <Calendar className="w-12 h-12 text-[#0A6E6E] mx-auto mb-3 opacity-60" />
                  No outpatient appointments registered in this view.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAppointments.map((apt) => (
                    <div key={apt.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                      
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 bg-[#F0F7F7] text-[#0A6E6E] font-bold rounded-xl flex items-center justify-center border shrink-0 font-mono text-xs">
                          #{apt.serialNo || 'W-1'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-800">{apt.patientName}</span>
                            <span className="text-[10px] text-gray-500 font-semibold">{apt.patientAge} Yrs • {apt.patientGender}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              apt.type === 'In-Clinic' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {apt.type === 'In-Clinic' ? '🏢 In-Clinic OPD' : '📹 Video Consultation'}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-[#0A6E6E] font-bold mt-1">
                            Consulting: <span className="text-slate-700 font-semibold">{apt.doctorName}</span> ({apt.doctorSpecialty})
                          </div>

                          <div className="text-[10px] text-slate-500 font-bold mt-2.5 flex items-center gap-4 flex-wrap">
                            <span>📅 Date: <strong className="text-slate-800">{apt.date}</strong></span>
                            <span>⏰ Slot Time: <strong className="text-slate-800">{apt.time}</strong></span>
                            <span>💰 Fee: <strong className="text-[#0A6E6E]">₹{apt.fee}</strong></span>
                            {apt.paymentMethod && <span>💳 Mode: <strong className="text-slate-700">{apt.paymentMethod}</strong></span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-gray-100 shrink-0">
                        
                        {/* Status Badge */}
                        <div className="text-center sm:text-right px-3 py-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            apt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            apt.status === 'Completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            apt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        {/* Interactive operations */}
                        {apt.status === 'Pending' && (
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                              className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {apt.status === 'Confirmed' && (
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Completed')}
                              className="flex-1 px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white rounded-lg font-black text-[10px] transition-colors cursor-pointer"
                            >
                              Mark Visited / Done
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg font-bold text-[10px] border transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: PATIENTS DIRECTORY */}
          {activeTab === 'patients' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Clinic Patient Index ({patientLogs.length})</h2>
                <p className="text-xs text-gray-400 mt-0.5">Patient database holding clinical consultation counts and history records</p>
              </div>

              <div className="bg-white rounded-3xl border border-[#D1E5E5] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#D1E5E5] text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Age / Gender</th>
                        <th className="p-4 text-center">Consultations</th>
                        <th className="p-4">Last Visit Date</th>
                        <th className="p-4">Last Consulting Doctor</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patientLogs.map((p) => (
                        <tr key={p.patientId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-extrabold text-slate-800">{p.name}</td>
                          <td className="p-4 text-gray-500 font-semibold">{p.age} Yrs • {p.gender}</td>
                          <td className="p-4 text-center font-extrabold text-[#0A6E6E]">{p.consultCount}</td>
                          <td className="p-4 text-slate-700 font-medium font-mono">{p.lastVisitDate}</td>
                          <td className="p-4 font-bold text-slate-600">{p.lastDoc}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedPatientHistory(p)}
                              className="px-3 py-1 bg-[#F0F7F7] hover:bg-[#E1F0F0] text-[#0A6E6E] rounded-lg font-bold border border-[#D1E5E5]/50 transition-colors cursor-pointer"
                            >
                              Medical File
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Patient details dialog */}
              {selectedPatientHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full border border-[#D1E5E5] p-6 relative shadow-xl">
                    <button
                      onClick={() => setSelectedPatientHistory(null)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-slate-800 font-bold"
                    >
                      ✕
                    </button>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b">
                      🏥 Clinical Patient Chart
                    </h3>
                    <div className="space-y-4 text-xs text-slate-700 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="font-extrabold text-slate-800">{selectedPatientHistory.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Demographics:</span>
                        <span>{selectedPatientHistory.age} Yrs • {selectedPatientHistory.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Registration ID:</span>
                        <span className="font-mono text-[#0A6E6E]">{selectedPatientHistory.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Consultation Count:</span>
                        <span className="text-emerald-600 font-extrabold">{selectedPatientHistory.consultCount} consultations</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Visited Specialist:</span>
                        <span>{selectedPatientHistory.lastDoc}</span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-3 border border-[#D1E5E5]/50 space-y-1.5">
                        <span className="text-[10px] text-[#0A6E6E] font-black uppercase tracking-wider block">Chronic History & Vitals</span>
                        <p className="text-gray-500 italic">No chronic diseases or drug allergies filed in current OPD register.</p>
                        <p className="text-[10px] text-gray-400">Last check: Blood Pressure normal (120/80 mmHg), Blood Group: B+ve.</p>
                      </div>
                    </div>
                    <div className="mt-5 text-right">
                      <button
                        onClick={() => setSelectedPatientHistory(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg"
                      >
                        Close Chart
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: STAFF DIRECTORY */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Clinic Staff Directory ({staffList.length})</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage nursing staff, administrative operators, and shift schedules</p>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-4 py-2 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Staff Member
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#D1E5E5] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#D1E5E5] text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                        <th className="p-4">Staff Name</th>
                        <th className="p-4">Designation / Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Shift Schedule</th>
                        <th className="p-4">Contacts</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-800">{st.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{st.id}</div>
                          </td>
                          <td className="p-4 font-bold text-slate-700">{st.role}</td>
                          <td className="p-4 text-slate-500 font-semibold">{st.department}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              st.shift === 'Day' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              {st.shift} Shift
                            </span>
                          </td>
                          <td className="p-4 space-y-0.5">
                            <div className="font-semibold text-slate-600">{st.phone}</div>
                            <div className="text-[10px] text-gray-400">{st.email}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full border border-emerald-100">
                              ● {st.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRemoveStaff(st.id, st.name)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete relationship"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: REVENUE LEDGER */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Financial Desk & Revenue Split</h2>
                <p className="text-xs text-gray-400 mt-0.5">Account billing statement, outstanding balance triggers, and GST commissions ledger</p>
              </div>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Gross consultations Billing</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">₹{financials.grossBilling.toLocaleString('en-IN')}</div>
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">Total consult collections</p>
                </div>

                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">DoctSpark Platform share (5%)</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">₹{financials.companyShare.toLocaleString('en-IN')}</div>
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">Automatic service deduction</p>
                </div>

                <div className="bg-emerald-600 border border-emerald-700 text-white rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-white/80">Outstanding Net Payout</span>
                  <div className="text-2xl font-black mt-1">₹{outstandingPayout.toLocaleString('en-IN')}</div>
                  <button
                    onClick={handleWithdrawFunds}
                    className="mt-2.5 w-full bg-white text-emerald-700 font-extrabold hover:bg-slate-50 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Initiate UPI Instant Transfer
                  </button>
                </div>
              </div>

              {/* Withdrawal History Table */}
              <div className="bg-white rounded-3xl border border-[#D1E5E5] p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Withdrawal Ledger logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#D1E5E5] text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                        <th className="p-4">Reference ID</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Settled On</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withdrawalLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors font-semibold">
                          <td className="p-4 text-slate-800 font-mono">{log.id}</td>
                          <td className="p-4 text-slate-600">{log.method}</td>
                          <td className="p-4 text-slate-800 font-extrabold">₹{log.amount.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-gray-500 font-mono">{log.date}</td>
                          <td className="p-4 text-right">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              log.status === 'Settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: CHAMBERS AND SETTINGS */}
          {activeTab === 'facilities' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Cabin Allocation & Operating Chambers</h2>
                <p className="text-xs text-gray-400 mt-0.5">Allocate clinical consult chambers to active practitioners on duty</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cabinRooms.map((cab) => (
                  <div key={cab.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">{cab.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          cab.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          cab.status === 'Occupied' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {cab.status}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1 font-semibold">OPD Wing: <span className="text-slate-600 font-bold">{cab.type}</span></p>
                      <p className="text-[#0A6E6E] font-bold mt-1.5">Assigned Specialist: <span className="text-slate-800 font-semibold">{cab.assignedDoc}</span></p>
                    </div>

                    <button
                      onClick={() => toggleCabinStatus(cab.id)}
                      className="px-3 py-1.5 bg-[#F0F7F7] hover:bg-[#E1F0F0] text-[#0A6E6E] border border-[#D1E5E5]/60 rounded-xl font-bold cursor-pointer transition-colors"
                    >
                      Cycle Status
                    </button>
                  </div>
                ))}
              </div>

              {/* Gallery Section */}
              <div className="bg-white rounded-3xl border border-[#D1E5E5] p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2.5">
                  Clinic Interiors Gallery
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {clinic.photos.map((ph, idx) => (
                    <div key={idx} className="h-32 rounded-2xl bg-gray-50 overflow-hidden border border-[#D1E5E5] shadow-xs relative group">
                      <img src={ph} alt="Clinic interior" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                  ))}
                  <div className="h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-xs text-gray-400 font-bold hover:border-[#0A6E6E] hover:text-[#0A6E6E] transition-colors cursor-pointer bg-slate-50/40">
                    <Plus className="w-5 h-5 mb-1 text-gray-400" />
                    <span>Upload Image</span>
                  </div>
                </div>
              </div>

            </div>
          )}

      {/* WALK-IN APPOINTMENT DIRECT BOOK MODAL */}
      {showAddBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <form 
            onSubmit={handleDirectBooking}
            className="bg-white rounded-2xl max-w-md w-full border border-[#D1E5E5] p-6 relative shadow-2xl flex flex-col text-xs font-semibold text-slate-700"
          >
            <button
              type="button"
              onClick={() => setShowAddBookingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-extrabold text-lg p-1"
            >
              ✕
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Calendar className="text-[#0A6E6E] w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Walk-In Booking Desk</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#1A2B3C] mb-1">Patient Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul Sen"
                  value={bookingPatientName}
                  onChange={(e) => setBookingPatientName(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Age (Years) *</label>
                  <input 
                    type="number" 
                    min="1"
                    max="120"
                    value={bookingPatientAge}
                    onChange={(e) => setBookingPatientAge(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Gender *</label>
                  <select 
                    value={bookingPatientGender}
                    onChange={(e) => setBookingPatientGender(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#1A2B3C] mb-1">Select Practitioner *</label>
                <select 
                  value={bookingDocId}
                  onChange={(e) => setBookingDocId(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                >
                  {clinicDoctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty} (₹{doc.feeInClinic})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Consultation Date *</label>
                  <input 
                    type="date" 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-xs focus:border-[#0A6E6E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Preferred Slot *</label>
                  <select 
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-xs focus:border-[#0A6E6E]"
                  >
                    {timeSlotsPreset.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-[#F0F7F7] border border-[#D1E5E5]/50 rounded-xl p-3 text-[11px] text-slate-600">
                ⚠️ **Cash Payment collection:** Ensure standard OPD consult fees are collected in cash at reception counter before confirming this walk-in ticket entry.
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddBookingModal(false)}
                className="px-4 py-2 border border-[#D1E5E5] rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Register Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW NURSING / ADMINISTRATIVE STAFF REGISTER MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <form 
            onSubmit={handleAddStaffSubmit}
            className="bg-white rounded-2xl max-w-md w-full border border-[#D1E5E5] p-6 relative shadow-2xl flex flex-col text-xs font-semibold text-slate-700"
          >
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-extrabold text-lg p-1"
            >
              ✕
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Briefcase className="text-[#0A6E6E] w-5 h-5" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Register Staff Member</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#1A2B3C] mb-1">Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sister Megha Deshmukh"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold focus:border-[#0A6E6E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Role / Designation *</label>
                  <select 
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none focus:border-[#0A6E6E]"
                  >
                    <option value="Clinical Nurse Lead">Clinical Nurse Lead</option>
                    <option value="Senior Receptionist">Senior Receptionist</option>
                    <option value="Pharmacist Manager">Pharmacist Manager</option>
                    <option value="Laboratory Assistant">Laboratory Assistant</option>
                    <option value="Medical Assistant">Medical Assistant</option>
                    <option value="Clinic Administrator">Clinic Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">OPD Department *</label>
                  <select 
                    value={staffDept}
                    onChange={(e) => setStaffDept(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none focus:border-[#0A6E6E]"
                  >
                    <option value="Outpatient Dept">Outpatient Dept</option>
                    <option value="Admission & Helpdesk">Admission & Helpdesk</option>
                    <option value="Pharmacy Services">Pharmacy Services</option>
                    <option value="Diagnostics & Pathology">Diagnostics & Pathology</option>
                    <option value="Billing & Accounts">Billing & Accounts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Shift Schedule *</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="staffShift" 
                        value="Day" 
                        checked={staffShift === 'Day'}
                        onChange={() => setStaffShift('Day')}
                        className="accent-[#0A6E6E]"
                      />
                      <span>Day</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="staffShift" 
                        value="Night" 
                        checked={staffShift === 'Night'}
                        onChange={() => setStaffShift('Night')}
                        className="accent-[#0A6E6E]"
                      />
                      <span>Night</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#1A2B3C] mb-1">Contact Phone</label>
                  <input 
                    type="tel" 
                    placeholder="+91 99999 88888"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none focus:border-[#0A6E6E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#1A2B3C] mb-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="staff@doctspark.in"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none focus:border-[#0A6E6E]"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="px-4 py-2 border border-[#D1E5E5] rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Associate Staff
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CLINIC DOCTOR ASSOCIATION FORM MODAL */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <form 
            onSubmit={handleAddDoctorSubmit}
            className="bg-white rounded-2xl max-w-lg w-full border border-[#D1E5E5] p-6 relative shadow-2xl flex flex-col max-h-[90vh]"
          >
            <button
              type="button"
              onClick={() => setShowAddDocModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-extrabold text-lg p-1"
            >
              ✕
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 shrink-0">
              <Building className="text-[#0A6E6E] w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Associate New Practitioner</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 text-xs font-semibold text-slate-700">
              
              {/* SECTION 1 */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-[10px] uppercase font-black text-[#0A6E6E] block mb-3 tracking-wider">1. Basic Practitioner Profile</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Doctor Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Satish Gujral"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Specialty Wing *</label>
                    <select 
                      value={docSpecialty}
                      onChange={(e) => setDocSpecialty(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                    >
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Dentist">Dentist</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Gynecologist">Gynecologist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Gender *</label>
                    <div className="flex gap-4 mt-2">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="radio" 
                            name="docGender" 
                            value={g} 
                            checked={docGender === g}
                            onChange={() => setDocGender(g)}
                            className="accent-[#0A6E6E]"
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Education / Degrees *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MBBS, MD, DNB"
                      value={docEducation}
                      onChange={(e) => setDocEducation(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[11px] text-[#1A2B3C] mb-1.5">Select Profile Photo Preset *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {docPhotosPresets.map((preset, idx) => {
                      const isSelected = selectedPhoto === preset.url && !customPhotoUrl;
                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            setSelectedPhoto(preset.url);
                            setCustomPhotoUrl('');
                          }}
                          className={`border-2 rounded-2xl p-2 text-center cursor-pointer transition-all relative flex flex-col items-center justify-center bg-white ${isSelected ? 'border-[#0A6E6E] bg-[#F0F7F7]/30 shadow-xs' : 'border-[#D1E5E5] hover:border-gray-400'}`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-10 h-10 rounded-full object-cover mb-1 border border-gray-100" referrerPolicy="no-referrer" />
                          <span className="text-[8px] font-black text-gray-500 block truncate w-full text-center">{preset.label}</span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 bg-[#0A6E6E] text-white text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-bold">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <label className="block text-[10px] text-gray-400 mb-1">Or Provide Custom Photo URL</label>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/photo-..."
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-[10px] uppercase font-black text-[#0A6E6E] block mb-3 tracking-wider">2. Cabin Practice & Fees</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Cabin Number / Chamber *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cabin B-201"
                      value={docCabin}
                      onChange={(e) => setDocCabin(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Experience (Years) *</label>
                    <input 
                      type="number" 
                      value={docExperience}
                      onChange={(e) => setDocExperience(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">In-Clinic Consult Fee (₹) *</label>
                    <input 
                      type="number" 
                      value={docInClinicFee}
                      onChange={(e) => setDocInClinicFee(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Video Consult Fee (₹) *</label>
                    <input 
                      type="number" 
                      value={docVideoFee}
                      onChange={(e) => setDocVideoFee(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-[10px] uppercase font-black text-[#0A6E6E] block mb-3 tracking-wider">3. Verification Codes</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Contact Phone</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210"
                      value={docPhone}
                      onChange={(e) => setDocPhone(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Official Email Address</label>
                    <input 
                      type="email" 
                      placeholder="doctor@doctspark.in"
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] text-[#1A2B3C] mb-1">Medical Council MCI/NMC Registration Number *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MCI-98745 (Leave empty to auto-generate)"
                      value={docRegNum}
                      onChange={(e) => setDocRegNum(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-xl outline-none text-[#1A2B3C] font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-[10px] uppercase font-black text-[#0A6E6E] block mb-1.5 tracking-wider">4. Availability Schedule *</span>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlotsPreset.map((slot) => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleToggleSlot(slot)}
                        className={`py-2 px-1 rounded-lg border text-center font-bold text-[10px] transition-all cursor-pointer ${
                          isSelected ? 'bg-[#0A6E6E] text-white border-[#0A6E6E] shadow-sm' : 'bg-white text-gray-600 border-[#D1E5E5] hover:bg-slate-50'
                        }`}
                      >
                        {slot} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5 */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <span className="text-[10px] uppercase font-black text-[#0A6E6E] block mb-2.5 tracking-wider">5. Languages Spoken</span>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Tamil', 'Telugu', 'Kannada'].map((lang) => {
                    const isSelected = docLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleToggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="px-4 py-2.5 border border-[#D1E5E5] rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Confirm Association
              </button>
            </div>

          </form>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
}
