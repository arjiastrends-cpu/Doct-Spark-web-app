/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, CheckCircle2, IndianRupee, Heart, PlusCircle, User, Award, ShieldCheck, ArrowRight, Video, ClipboardList, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Appointment, Prescription, Doctor } from '../../types';
import { creditPatientWallet } from '../../data/walletUtils';

interface DoctorDashboardProps {
  setView: (view: string) => void;
  appointments: Appointment[];
  onUpdateAppointment: (updated: Appointment) => void;
  onAddAppointment?: (updated: Appointment) => void;
  setSelectedRoomId: (id: string | null) => void;
  userEmail?: string | null;
  doctorsList?: Doctor[];
}

export default function DoctorDashboard({
  setView,
  appointments: allAppointments,
  onUpdateAppointment,
  onAddAppointment,
  setSelectedRoomId,
  userEmail,
  doctorsList
}: DoctorDashboardProps) {
  // Resolve current doctor dynamically
  const currentDoctor = React.useMemo(() => {
    const list = doctorsList && doctorsList.length > 0 ? doctorsList : (() => {
      const saved = localStorage.getItem('ds_doctors');
      return saved ? JSON.parse(saved) : [];
    })();

    if (!userEmail) return list.find((d: any) => d.id === 'doc-1') || list[0] || null;

    // 1. Try exact email match
    let found = list.find((d: any) => d.email === userEmail);
    if (found) return found;

    // 2. Try email prefix name match (e.g. doctor.sharma -> Amit Sharma)
    const username = userEmail.split('@')[0];
    const namePart = username.includes('.') ? username.split('.')[1] : username;
    found = list.find((d: any) => d.name.toLowerCase().includes(namePart.toLowerCase()));
    if (found) return found;

    return list.find((d: any) => d.id === 'doc-1') || list[0] || null;
  }, [userEmail, doctorsList]);

  const doctorName = currentDoctor ? currentDoctor.name : "Dr. Rajesh Khanna";
  const doctorSpecialty = currentDoctor ? currentDoctor.specialty : "Cardiologist";
  const doctorId = currentDoctor ? currentDoctor.id : "doc-1";

  // Filter appointments for the resolved doctor (RBAC / territory sync)
  const appointments = React.useMemo(() => {
    return allAppointments.filter(a => a.doctorId === doctorId || a.doctorName === doctorName);
  }, [allAppointments, doctorId, doctorName]);

  // Calculate stats
  const todayDate = '2026-06-25'; // matching first mock appointment date
  const todayApts = appointments.filter(a => a.date === todayDate);
  const completedApts = appointments.filter(a => a.status === 'Completed');
  const totalPatients = Array.from(new Set(appointments.map(a => a.patientName))).length;
  
  // Doctor earnings calculation
  const monthlyEarnings = completedApts.reduce((sum, current) => sum + current.fee, 0) + (todayApts.filter(a => a.status === 'Completed').reduce((sum, current) => sum + current.fee, 0));
  const pendingWithdrawal = monthlyEarnings > 0 ? Math.round(monthlyEarnings * 0.9) : 0; // 10% platform fee simulation

  // Pending Actions: appointments without prescription
  const pendingPrescriptions = appointments.filter(a => a.status === 'Confirmed' && !a.prescription);

  const sortedApts = React.useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
  }, [appointments]);

  // States for prescribing
  const [activePrescribeApt, setActivePrescribeApt] = React.useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = React.useState('');
  const [medsList, setMedsList] = React.useState<{ name: string; dosage: string; duration: string }[]>([
    { name: '', dosage: '1-0-1', duration: '5 Days' }
  ]);
  const [doctorNotes, setDoctorNotes] = React.useState('');

  // Prescription Scan Upload States
  const [attachedFileUrl, setAttachedFileUrl] = React.useState<string>('');
  const [attachedFileName, setAttachedFileName] = React.useState<string>('');
  const [isDragging, setIsDragging] = React.useState<boolean>(false);

  const handleFileChangeHelper = (file: File) => {
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a PDF or image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFileUrl(reader.result as string);
      setAttachedFileName(file.name);
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>, appointment: Appointment) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a PDF or image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      const newPres: Prescription = {
        id: `PR-MOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        appointmentId: appointment.id,
        date: new Date().toISOString().split('T')[0],
        doctorName: doctorName,
        diagnosis: 'Prescription Uploaded Via File Scan',
        medicines: [],
        notes: `Physician uploaded file scan: ${file.name}`,
        attachedFileUrl: dataUrl,
        attachedFileName: file.name
      };

      const updatedApt: Appointment = {
        ...appointment,
        status: 'Completed',
        prescription: newPres
      };

      onUpdateAppointment(updatedApt);
      alert(`Successfully uploaded prescription: "${file.name}" & completed appointment for ${appointment.patientName}!`);
    };
    reader.readAsDataURL(file);
  };

  // Rescheduling States
  const [reschedulingApt, setReschedulingApt] = React.useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState<string>('');
  const [rescheduleTime, setRescheduleTime] = React.useState<string>('');
  const [scheduleTab, setScheduleTab] = React.useState<'today' | 'all'>('today');

  // New Clinical States
  const [searchTerm, setSearchTerm] = React.useState('');
  const [vitalsBP, setVitalsBP] = React.useState('');
  const [vitalsTemp, setVitalsTemp] = React.useState('');
  const [vitalsPulse, setVitalsPulse] = React.useState('');
  const [vitalsWeight, setVitalsWeight] = React.useState('');
  const [selectedPatientApt, setSelectedPatientApt] = React.useState<Appointment | null>(null);

  // New Patient Registration States (1 step simple form)
  const [regPatientName, setRegPatientName] = React.useState('');
  const [regPatientAge, setRegPatientAge] = React.useState('');
  const [regPatientGender, setRegPatientGender] = React.useState('Male');
  const [regPatientPhone, setRegPatientPhone] = React.useState('');
  const [regPatientReason, setRegPatientReason] = React.useState('');
  const [regPatientType, setRegPatientType] = React.useState<'In-Clinic' | 'Video'>('Video');
  const [regPatientDate, setRegPatientDate] = React.useState('2026-06-25');
  const [regPatientTime, setRegPatientTime] = React.useState('11:30 AM');
  const [regSuccess, setRegSuccess] = React.useState<{ name: string; id: string; date: string; time: string } | null>(null);

  const handleCreatePatientProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPatientName.trim()) {
      return;
    }
    if (!regPatientAge.trim() || isNaN(Number(regPatientAge))) {
      return;
    }

    const newAptId = `APT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newApt: Appointment = {
      id: newAptId,
      doctorId: 'doc-1', // Rajesh Khanna
      doctorName: doctorName,
      doctorSpecialty: 'Cardiologist',
      doctorPhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: regPatientName.trim(),
      patientAge: parseInt(regPatientAge, 10),
      patientGender: regPatientGender,
      date: regPatientDate,
      time: regPatientTime,
      type: regPatientType,
      status: 'Confirmed',
      fee: regPatientType === 'Video' ? 500 : 750,
      reason: regPatientReason.trim() || 'Routine Consultation'
    };

    if (onAddAppointment) {
      onAddAppointment(newApt);
      setRegSuccess({
        name: newApt.patientName,
        id: newApt.patientId,
        date: newApt.date,
        time: newApt.time
      });
      
      // Clear form fields
      setRegPatientName('');
      setRegPatientAge('');
      setRegPatientGender('Male');
      setRegPatientPhone('');
      setRegPatientReason('');
    }
  };

  const displayedApts = React.useMemo(() => {
    let filtered = sortedApts;
    if (scheduleTab === 'today') {
      filtered = filtered.filter(a => a.date === todayDate);
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.patientName.toLowerCase().includes(term) ||
        (a.reason && a.reason.toLowerCase().includes(term)) ||
        a.id.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [sortedApts, scheduleTab, searchTerm]);

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt) return;
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both a date and time for rescheduling.");
      return;
    }

    const updatedApt: Appointment = {
      ...reschedulingApt,
      date: rescheduleDate,
      time: rescheduleTime,
    };

    onUpdateAppointment(updatedApt);
    alert(`Appointment for ${reschedulingApt.patientName} has been successfully rescheduled to ${rescheduleDate} at ${rescheduleTime}.`);
    setReschedulingApt(null);
  };

  // Interactive Schedule Builder States
  const [workingDays, setWorkingDays] = React.useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startHour, setStartHour] = React.useState<string>('09:00');
  const [endHour, setEndHour] = React.useState<string>('20:00');
  const [consultationDuration, setConsultationDuration] = React.useState<number>(30);
  const [isEditingSchedule, setIsEditingSchedule] = React.useState<boolean>(false);

  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter(d => d !== day));
      } else {
        alert("You must select at least one active clinic day.");
      }
    } else {
      setWorkingDays([...workingDays, day].sort((a, b) => {
        const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return order.indexOf(a) - order.indexOf(b);
      }));
    }
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;
  };

  const generatedSlots = React.useMemo(() => {
    const slots: string[] = [];
    if (!startHour || !endHour) return slots;
    
    const [startH, startM] = startHour.split(':').map(Number);
    const [endH, endM] = endHour.split(':').map(Number);
    
    let currentMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    
    if (currentMin >= endMin || consultationDuration <= 0) return slots;
    
    while (currentMin + consultationDuration <= endMin) {
      const slotStartH = Math.floor(currentMin / 60);
      const slotStartM = currentMin % 60;
      const slotEndH = Math.floor((currentMin + consultationDuration) / 60);
      const slotEndM = (currentMin + consultationDuration) % 60;
      
      const formatTime = (h: number, m: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
      };
      
      slots.push(`${formatTime(slotStartH, slotStartM)} - ${formatTime(slotEndH, slotEndM)}`);
      currentMin += consultationDuration;
    }
    return slots;
  }, [startHour, endHour, consultationDuration]);

  const handleAddMedRow = () => {
    setMedsList([...medsList, { name: '', dosage: '1-0-1', duration: '5 Days' }]);
  };

  const handleMedChange = (index: number, field: string, value: string) => {
    const updated = [...medsList];
    updated[index] = { ...updated[index], [field]: value };
    setMedsList(updated);
  };

  const handlePrescribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalDiagnosis = diagnosis.trim();
    if (!finalDiagnosis) {
      if (attachedFileUrl) {
        finalDiagnosis = 'Prescription Uploaded Via File Scan';
      } else {
        alert('Please fill in the patient diagnosis.');
        return;
      }
    }

    if (!activePrescribeApt) return;

    // Build notes with aggregated clinical vitals
    let finalNotes = doctorNotes;
    const vitalsBlock = [];
    if (vitalsBP.trim()) vitalsBlock.push(`BP: ${vitalsBP.trim()}`);
    if (vitalsTemp.trim()) vitalsBlock.push(`Temp: ${vitalsTemp.trim()}°F`);
    if (vitalsPulse.trim()) vitalsBlock.push(`HR: ${vitalsPulse.trim()} bpm`);
    if (vitalsWeight.trim()) vitalsBlock.push(`Weight: ${vitalsWeight.trim()} kg`);
    
    if (vitalsBlock.length > 0) {
      const vitalsText = `[Clinical Vitals: ${vitalsBlock.join(' | ')}]`;
      finalNotes = finalNotes ? `${vitalsText}\n\n${finalNotes}` : vitalsText;
    }

    // Create Prescription object
    const newPres: Prescription = {
      id: `PR-MOCK-${Math.floor(1000 + Math.random() * 9000)}`,
      appointmentId: activePrescribeApt.id,
      date: new Date().toISOString().split('T')[0],
      doctorName: doctorName,
      diagnosis: finalDiagnosis,
      medicines: medsList.filter(m => m.name.trim() !== ''),
      notes: finalNotes,
      attachedFileUrl: attachedFileUrl || undefined,
      attachedFileName: attachedFileName || undefined
    };

    // Update appointment status to Completed & append prescription
    const updatedApt: Appointment = {
      ...activePrescribeApt,
      status: 'Completed',
      prescription: newPres
    };

    onUpdateAppointment(updatedApt);
    setActivePrescribeApt(null);
    setDiagnosis('');
    setMedsList([{ name: '', dosage: '1-0-1', duration: '5 Days' }]);
    setDoctorNotes('');
    setAttachedFileUrl('');
    setAttachedFileName('');
    setVitalsBP('');
    setVitalsTemp('');
    setVitalsPulse('');
    setVitalsWeight('');
    alert('Digital Prescription with vitals & attachment successfully generated & dispatched to patient dashboard!');
  };

  const handleWithdrawFunds = () => {
    if (pendingWithdrawal === 0) {
      alert("No pending withdrawal funds available this cycle.");
      return;
    }
    alert(`payout withdrawal of ₹${pendingWithdrawal.toLocaleString()} INR initiated successfully to your registered HDFC bank account!\nProcessing time: 2 hours.`);
  };

  const handleJoinCall = (roomId: string) => {
    setSelectedRoomId(roomId);
    setView('video-call');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="doctor-dashboard-root">
      
      {/* Header Profile Completion indicator */}
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase px-2.5 py-0.5 rounded-full mb-1 inline-block">MCI-102948 Verified</span>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1A2B3C] font-heading">Welcome back, Dr. Rajesh Khanna</h1>
          <p className="text-xs text-gray-500 font-medium">Your schedule is synced. 100% of your listed documents have been audited by the board.</p>
        </div>
        <div className="w-full md:w-56">
          <div className="flex justify-between items-center text-xs font-bold text-[#0A6E6E] mb-1">
            <span>Profile Completeness</span>
            <span>100%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-[#D1E5E5] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F0F7F7] text-[#0A6E6E] rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Today's Appointments</div>
            <div className="text-lg font-extrabold text-[#1A2B3C]">{todayApts.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D1E5E5] flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Unique Patient Count</div>
            <div className="text-lg font-extrabold text-[#1A2B3C]">{totalPatients}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D1E5E5] flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Total Completed</div>
            <div className="text-lg font-extrabold text-[#1A2B3C]">{completedApts.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D1E5E5] flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Earnings This Month</div>
            <div className="text-lg font-extrabold text-[#1A2B3C]">₹{monthlyEarnings.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT/MIDDLE COLUMNS: schedule timeline & pending prescription actions */}
        <div className="lg:col-span-2 flex flex-col gap-8">
                 {/* APPOINTMENT SCHEDULE TIMELINE WITH RESCHEDULING */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h2 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-widest">
                Appointment Schedule Timeline
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => setScheduleTab('today')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    scheduleTab === 'today'
                      ? 'bg-white text-[#0A6E6E] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Today ({todayApts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleTab('all')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    scheduleTab === 'all'
                      ? 'bg-white text-[#0A6E6E] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All ({appointments.length})
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-[#D1E5E5] p-5 flex flex-col gap-4 shadow-sm">
              {/* Patient Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search patients by name, symptoms, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-[#D1E5E5] px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all placeholder:text-gray-400 text-[#1A2B3C]"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {displayedApts.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 pl-5 ml-2.5 flex flex-col gap-6">
                  {displayedApts.map((apt) => (
                    <div key={apt.id} className="relative">
                      {/* Visual node bullet */}
                      <span className={`absolute -left-7.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-4 ${
                        apt.status === 'Completed' 
                          ? 'bg-emerald-500 ring-emerald-100' 
                          : 'bg-[#0A6E6E] ring-[#0A6E6E]/10'
                      }`}></span>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <span>{apt.time}</span>
                            {scheduleTab === 'all' && (
                              <span className="bg-teal-50 text-[#0A6E6E] px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase">
                                {apt.date === todayDate ? 'Today' : apt.date}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-extrabold text-[#1A2B3C] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{apt.patientName}</span>
                            {apt.serialNo && (
                              <span className="bg-amber-50 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                                Serial #{apt.serialNo}
                              </span>
                            )}
                            {apt.clinicName && (
                              <span className="bg-[#0A6E6E]/10 text-[#0A6E6E] text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#0A6E6E]/20">
                                {apt.clinicName}
                              </span>
                            )}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-semibold">{apt.patientGender} • {apt.patientAge} Years Old • Mode: <span className="text-[#0A6E6E] font-bold uppercase">{apt.type}</span></p>
                        </div>
 
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            apt.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                            apt.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            apt.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                            apt.status === 'Expired' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                            'bg-slate-50 text-slate-700 border-slate-100'
                          }`}>
                            {apt.status}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedPatientApt(apt)}
                            className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                          >
                            📋 Case History
                          </button>

                          {apt.status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...apt, status: 'Confirmed' as const };
                                  onUpdateAppointment(updated);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
                              >
                                ✓ Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...apt, status: 'Cancelled' as const, paymentStatus: 'Platform Charge Refunded' };
                                  onUpdateAppointment(updated);
                                  
                                  const patientEmail = apt.patientId && apt.patientId.includes('@') ? apt.patientId : 'aarav.mehta@doctspark.in';
                                  creditPatientWallet(patientEmail, 20, 'Platform Refund', `Platform Service Fee refund for appointment ${apt.id} rejected by doctor.`);
                                  alert(`Appointment rejected. ₹20 platform convenience fee refunded to patient's wallet.`);
                                }}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}

                          {apt.status === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => {
                                  setReschedulingApt(apt);
                                  setRescheduleDate(apt.date);
                                  setRescheduleTime(apt.time);
                              }}
                              className="px-2.5 py-1.5 border border-[#D1E5E5] text-[#0A6E6E] hover:bg-teal-50 font-bold text-[10px] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                            >
                              📅 Reschedule
                            </button>
                          )}

                          {apt.status === 'Confirmed' && apt.type === 'Video' && (
                            <button
                              type="button"
                              onClick={() => handleJoinCall(apt.roomId || 'room-demo')}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Video className="w-3.5 h-3.5" /> Start Live Call
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-semibold text-center py-6">No appointments found.</p>
              )}
            </div>
          </div>

          {/* PENDING ACTIONS: PRESCRIBE MEDICATIONS */}
          <div>
            <h2 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-widest mb-4">Pending Digital Prescriptions ({pendingPrescriptions.length})</h2>
            
            {pendingPrescriptions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {pendingPrescriptions.map((apt) => (
                  <div key={apt.id} className="bg-white border border-[#D1E5E5] rounded-xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs">
                    <div>
                      <div className="font-extrabold text-[#1A2B3C]">{apt.patientName}</div>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Consulted on: {apt.date} at {apt.time}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setActivePrescribeApt(apt)}
                        className="flex-1 sm:flex-none bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 text-[10px] font-extrabold px-3 py-2 rounded-lg shadow-sm text-center cursor-pointer transition-all"
                      >
                        ✍️ Write Prescription
                      </button>
                      
                      <label className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-teal-50 hover:bg-teal-100/80 border border-[#D1E5E5] text-[#0A6E6E] text-[10px] font-extrabold px-3 py-2 rounded-lg shadow-sm cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Direct Upload</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => handleDirectUpload(e, apt)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#D1E5E5] p-5 text-center text-xs text-gray-400 font-bold">
                🎉 All verified patients have been fully prescribed. Zero pending files!
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: earnings summary & quick links */}
        <aside className="flex flex-col gap-6" id="doctor-earnings-sidebar">
          


          {/* EARNINGS SUMMARY CARD */}
          <div className="bg-white border-2 border-[#D1E5E5] rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
              Financial Payout Portal
            </h3>

            <div className="flex flex-col gap-4 text-xs font-semibold text-gray-600 mb-5">
              <div className="flex justify-between">
                <span>Month's Gross Consultation Fees:</span>
                <strong className="text-[#1A2B3C]">₹{monthlyEarnings.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>Platform Maintenance Fee (10%):</span>
                <strong className="text-red-500">-₹{Math.round(monthlyEarnings * 0.1).toLocaleString()}</strong>
              </div>
              <div className="border-t border-gray-100 pt-3.5 flex justify-between text-sm font-extrabold text-[#1A2B3C]">
                <span>Withdrawable Balance:</span>
                <span className="text-[#0A6E6E]">₹{pendingWithdrawal.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleWithdrawFunds}
              className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-xs font-extrabold rounded-lg shadow"
            >
              Withdraw Funds Now
            </button>
          </div>

          {/* DOCTOR CLINIC TIMINGS - MY SCHEDULE BUILDER */}
          <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3.5 border-b border-gray-100 pb-2">
              <h3 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-widest">
                My Schedule Builder
              </h3>
              {!isEditingSchedule && (
                <button
                  onClick={() => setIsEditingSchedule(true)}
                  className="text-[10px] text-[#0A6E6E] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ⚙️ Edit Timings
                </button>
              )}
            </div>

            {isEditingSchedule ? (
              <div className="space-y-4">
                {/* Working Days Selection */}
                <div>
                  <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1.5">
                    Working Days
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const isActive = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWorkingDay(day)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hours Settings */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">
                      Start Hour
                    </label>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1A2B3C] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">
                      End Hour
                    </label>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1A2B3C] outline-none"
                    />
                  </div>
                </div>

                {/* Duration dropdown */}
                <div>
                  <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">
                    Consultation Duration
                  </label>
                  <select
                    value={consultationDuration}
                    onChange={(e) => setConsultationDuration(Number(e.target.value))}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#1A2B3C] outline-none cursor-pointer"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                {/* Real-time Slots Preview counts */}
                <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg">
                  <div className="flex justify-between items-center text-[10px] font-extrabold text-[#0A6E6E]">
                    <span>Generated Daily Slots:</span>
                    <span>{generatedSlots.length} Slots</span>
                  </div>
                  {generatedSlots.length > 0 && (
                    <div className="mt-1.5 max-h-24 overflow-y-auto border-t border-teal-100 pt-1.5 space-y-1 pr-1">
                      {generatedSlots.map((slot, idx) => (
                        <div key={idx} className="text-[9px] text-gray-500 font-mono text-center">
                          {slot}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save and Cancel buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingSchedule(false)}
                    className="flex-1 py-1.5 border border-[#D1E5E5] text-gray-500 text-xs font-extrabold rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingSchedule(false);
                      alert("Successfully updated & re-generated clinic appointment schedule matrix!");
                    }}
                    className="flex-1 py-1.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg shadow hover:bg-[#0A6E6E]/90 cursor-pointer"
                  >
                    Save Slots
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Working Days:</span>
                  <strong className="text-gray-900">{workingDays.join(', ')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hours of Duty:</span>
                  <strong className="text-gray-900">
                    {formatTime12h(startHour)} - {formatTime12h(endHour)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Consultation Unit:</span>
                  <strong className="text-[#0A6E6E]">{consultationDuration} minutes</strong>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-[11px] font-bold">
                  <span>Total Daily Slots:</span>
                  <span className="bg-teal-50 text-[#0A6E6E] px-2 py-0.5 rounded-full font-extrabold">
                    {generatedSlots.length} Slots
                  </span>
                </div>
                {generatedSlots.length > 0 && (
                  <div className="mt-1 max-h-28 overflow-y-auto border border-gray-100 rounded-md p-2 space-y-1 bg-gray-50/50">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold text-center mb-1">Active Generated Grid</p>
                    {generatedSlots.map((slot, idx) => (
                      <div key={idx} className="text-[9px] text-gray-500 font-mono text-center">
                        {slot}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </aside>

      </div>

      {/* WRITE PRESCRIPTION DIALOG / MODAL FORM */}
      {activePrescribeApt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handlePrescribeSubmit}
            className="bg-white rounded-xl max-w-lg w-full border border-[#D1E5E5] p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setActivePrescribeApt(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-sm"
            >
              ✕
            </button>

            <div className="border-b-2 border-[#D1E5E5] pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#1A2B3C] font-heading">℞ Write Clinical Digital Prescription</h3>
              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Patient: {activePrescribeApt.patientName} ({activePrescribeApt.patientGender}, {activePrescribeApt.patientAge})</p>
            </div>

            {/* Quick Prescribe Templates */}
            <div className="mb-4 bg-[#F0F7F7] border border-[#D1E5E5] p-3 rounded-xl">
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">⚡ Quick Fill Templates</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosis("Viral Fever with upper respiratory infection");
                    setMedsList([
                      { name: "Paracetamol 650mg", dosage: "1-0-1 (After meals)", duration: "5 Days" },
                      { name: "Amoxicillin 500mg", dosage: "1-0-1", duration: "5 Days" },
                      { name: "Vitamin C 500mg", dosage: "1-0-0", duration: "10 Days" }
                    ]);
                    setDoctorNotes("Drink plenty of warm water. Complete physical rest. Follow up if temperature exceeds 101°F.");
                  }}
                  className="px-2 py-1 text-[10px] font-bold bg-white text-[#0A6E6E] border border-[#D1E5E5] rounded-md hover:bg-teal-50 hover:text-[#0A6E6E] cursor-pointer transition-colors"
                >
                  🤒 Viral Fever
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosis("Acute Migraine Attack");
                    setMedsList([
                      { name: "Naproxen 500mg", dosage: "1-0-1 (When pain starts)", duration: "3 Days" },
                      { name: "Ondansetron 4mg", dosage: "1-0-0 (Before food)", duration: "3 Days" }
                    ]);
                    setDoctorNotes("Avoid bright screens, direct sunlight, and loud noises. Ensure dark room rest during episodes.");
                  }}
                  className="px-2 py-1 text-[10px] font-bold bg-white text-[#0A6E6E] border border-[#D1E5E5] rounded-md hover:bg-teal-50 hover:text-[#0A6E6E] cursor-pointer transition-colors"
                >
                  🧠 Migraine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosis("Essential Hypertension - Routine Follow-up");
                    setMedsList([
                      { name: "Amlodipine 5mg", dosage: "0-0-1 (At bedtime)", duration: "30 Days" }
                    ]);
                    setDoctorNotes("Reduce dietary salt intake. 30 minutes of walking daily. Log BP twice weekly.");
                  }}
                  className="px-2 py-1 text-[10px] font-bold bg-white text-[#0A6E6E] border border-[#D1E5E5] rounded-md hover:bg-teal-50 hover:text-[#0A6E6E] cursor-pointer transition-colors"
                >
                  ❤️ Hypertension
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosis("Acid Peptic Disease / Gastritis");
                    setMedsList([
                      { name: "Pantoprazole 40mg", dosage: "1-0-0 (Empty stomach)", duration: "14 Days" },
                      { name: "Syr. Sucralfate", dosage: "2 tsp (Before meals)", duration: "10 Days" }
                    ]);
                    setDoctorNotes("Avoid spicy, oily foods and caffeine. Do not lie down immediately after dinner.");
                  }}
                  className="px-2 py-1 text-[10px] font-bold bg-white text-[#0A6E6E] border border-[#D1E5E5] rounded-md hover:bg-teal-50 hover:text-[#0A6E6E] cursor-pointer transition-colors"
                >
                  🤢 Gastritis
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-xs font-medium text-gray-700">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnosis / Assessment</label>
                <input 
                  type="text" 
                  placeholder="e.g. Mild viral fever & chest congestion"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                  required
                />
              </div>

              {/* Patient Clinical Vitals */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Patient Vitals (Optional)</label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-0.5">BP (mmHg)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 120/80"
                      value={vitalsBP}
                      onChange={(e) => setVitalsBP(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1.5 rounded-md text-[10px] font-semibold text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-0.5">Temp (°F)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 98.6"
                      value={vitalsTemp}
                      onChange={(e) => setVitalsTemp(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1.5 rounded-md text-[10px] font-semibold text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-0.5">Pulse (bpm)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 72"
                      value={vitalsPulse}
                      onChange={(e) => setVitalsPulse(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1.5 rounded-md text-[10px] font-semibold text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-0.5">Weight (kg)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 70"
                      value={vitalsWeight}
                      onChange={(e) => setVitalsWeight(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-1.5 rounded-md text-[10px] font-semibold text-center outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meds Table</label>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="text-[10px] text-[#0A6E6E] font-bold"
                  >
                    + Add Medication Row
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {medsList.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <input 
                        type="text" 
                        placeholder="Paracetamol 650mg"
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        className="w-full bg-white border border-gray-200 p-1.5 rounded text-[11px] font-semibold"
                        required={idx === 0 && !attachedFileUrl}
                      />
                      <input 
                        type="text" 
                        placeholder="Dosage: 1-0-1"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        className="w-full bg-white border border-gray-200 p-1.5 rounded text-[11px] font-semibold"
                      />
                      <input 
                        type="text" 
                        placeholder="Duration: 5 Days"
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                        className="w-full bg-white border border-gray-200 p-1.5 rounded text-[11px] font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lifestyle Advice / Doctor Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Drink warm fluids. Rest for 3 days. Follow up if fever exceeds 101F."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                />
              </div>

              {/* ATTACH PHYSICAL PRESCRIPTION SCAN (PDF / IMAGE) */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Or Attach Physical Prescription Scan (PDF / Image)
                </label>
                
                {attachedFileUrl ? (
                  <div className="bg-teal-50/50 rounded-xl p-4 border border-[#D1E5E5] flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {attachedFileUrl.startsWith('data:image/') ? (
                        <img 
                          src={attachedFileUrl} 
                          alt="Prescription preview" 
                          className="w-12 h-12 rounded object-cover border border-teal-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-teal-100 flex items-center justify-center text-[#0A6E6E] shrink-0 border border-teal-200">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A2B3C] truncate">{attachedFileName}</p>
                        <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                          ✓ File loaded successfully
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFileUrl('');
                        setAttachedFileName('');
                      }}
                      className="p-1.5 hover:bg-teal-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChangeHelper(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-[#0A6E6E] bg-teal-50/60 scale-[0.99]'
                        : 'border-slate-200 hover:border-[#D1E5E5] bg-slate-50/40 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      const input = document.getElementById('modal-file-upload');
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="modal-file-upload"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChangeHelper(file);
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#0A6E6E] shadow-sm">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Drag & drop files here or <span className="text-[#0A6E6E] underline">browse</span></p>
                      <p className="text-[9px] text-gray-400 font-semibold mt-1">Supports PDF, JPG, PNG or WEBP up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePrescribeApt(null)}
                className="px-4 py-2 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0A6E6E] text-white font-bold text-xs rounded-lg shadow"
              >
                Sign & Dispatch ℞
              </button>
            </div>

          </form>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT DIALOG / MODAL FORM */}
      {reschedulingApt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleRescheduleSubmit}
            className="bg-white rounded-xl max-w-md w-full border border-[#D1E5E5] p-6 relative shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setReschedulingApt(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b-2 border-[#D1E5E5] pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#1A2B3C] font-heading flex items-center gap-1">
                📅 Reschedule Patient Appointment
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                Patient: {reschedulingApt.patientName} ({reschedulingApt.patientGender}, {reschedulingApt.patientAge})
              </p>
            </div>

            <div className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-lg p-3 mb-4 text-xs">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Schedule</div>
              <p className="text-gray-700 font-bold">
                Date: {reschedulingApt.date} <span className="mx-1">•</span> Time: {reschedulingApt.time}
              </p>
            </div>

            <div className="flex flex-col gap-4 text-xs font-medium text-gray-700">
              {/* Date selection */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Select New Date
                </label>
                <input 
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-bold outline-none cursor-pointer text-[#1A2B3C]"
                  required
                />
              </div>

              {/* Time Slot Selector - Using Builder slots or custom input */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Select New Time Slot
                </label>
                
                {generatedSlots.length > 0 ? (
                  <div className="mb-2">
                    <p className="text-[9px] text-gray-400 mb-1">Available slots from your Schedule Builder:</p>
                    <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50 pr-1">
                      {generatedSlots.map((slot) => {
                        const isSelected = rescheduleTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setRescheduleTime(slot)}
                            className={`p-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-amber-600 font-semibold mb-2">
                    ⚠️ No active template slots defined in your Schedule Builder sidebar. Use custom input or edit timings.
                  </p>
                )}

                <div>
                  <p className="text-[9px] text-gray-400 mb-1">Or enter a custom time:</p>
                  <input 
                    type="text"
                    placeholder="e.g. 10:30 AM or 11:00 AM - 11:30 AM"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-bold outline-none text-[#1A2B3C]"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Reason for Rescheduling (Optional)
                </label>
                <textarea
                  placeholder="e.g. Dr. Rajesh Khanna has an emergency surgery scheduled."
                  rows={2}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none resize-none text-[#1A2B3C]"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReschedulingApt(null)}
                className="px-4 py-2 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-bold text-xs rounded-lg shadow transition-all cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PATIENT MEDICAL HISTORY / EMR MODAL */}
      {selectedPatientApt && (() => {
        const historyData = (() => {
          const histories: Record<string, {
            allergies: string;
            vitals: { bp: string; temp: string; pulse: string; weight: string; sugar: string };
            pastConditions: string[];
            emergencyContact: string;
          }> = {
            "Amit Kumar": {
              allergies: "Sulfa Drugs, Dust Particles",
              vitals: { bp: "128/84 mmHg", temp: "98.4 °F", pulse: "76 bpm", weight: "74 kg", sugar: "112 mg/dL" },
              pastConditions: ["Mild Essential Hypertension", "Seasonal Allergic Rhinitis"],
              emergencyContact: "Sunita Kumar (Wife) - 98765 43210"
            },
            "Priya Sharma": {
              allergies: "Penicillin (rash trigger)",
              vitals: { bp: "116/72 mmHg", temp: "98.6 °F", pulse: "68 bpm", weight: "55 kg", sugar: "89 mg/dL" },
              pastConditions: ["Chronic Iron Deficiency Anemia"],
              emergencyContact: "Ravi Sharma (Father) - 98123 45678"
            },
            "Rahul Verma": {
              allergies: "No known food or drug allergies",
              vitals: { bp: "120/80 mmHg", temp: "101.2 °F", pulse: "88 bpm", weight: "82 kg", sugar: "105 mg/dL" },
              pastConditions: ["Moderate Bronchial Asthma (since childhood)"],
              emergencyContact: "Anjali Verma (Mother) - 98989 89898"
            }
          };
          
          return histories[selectedPatientApt.patientName] || {
            allergies: "No known drug allergies (NKDA)",
            vitals: { bp: "120/80 mmHg", temp: "98.6 °F", pulse: "72 bpm", weight: "70 kg", sugar: "95 mg/dL" },
            pastConditions: ["No chronic medical issues reported"],
            emergencyContact: "Next of kin - 99009 90099"
          };
        })();

        // Find past prescriptions written for this patient
        const pastAptsWithPrescriptions = appointments.filter(
          a => a.patientName === selectedPatientApt.patientName && a.status === 'Completed' && a.prescription
        );

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl max-w-lg w-full border border-[#D1E5E5] p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setSelectedPatientApt(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>

              <div className="border-b-2 border-[#D1E5E5] pb-3 mb-4">
                <span className="text-[9px] bg-[#0A6E6E]/10 text-[#0A6E6E] font-extrabold uppercase px-2 py-0.5 rounded-full">Electronic Medical Record</span>
                <h3 className="text-sm font-extrabold text-[#1A2B3C] mt-1 flex items-center gap-1 font-sans">
                  📋 Clinical Case File & EMR
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
                  Patient: {selectedPatientApt.patientName} ({selectedPatientApt.patientGender}, {selectedPatientApt.patientAge} Years)
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Clinical Vitals grid */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Recorded Baseline Vitals</h4>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">BP</div>
                      <div className="font-extrabold text-gray-800 text-[10px] sm:text-[11px] truncate">{historyData.vitals.bp}</div>
                    </div>
                    <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">Temp</div>
                      <div className="font-extrabold text-gray-800 text-[10px] sm:text-[11px] truncate">{historyData.vitals.temp}</div>
                    </div>
                    <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">Pulse</div>
                      <div className="font-extrabold text-gray-800 text-[10px] sm:text-[11px] truncate">{historyData.vitals.pulse}</div>
                    </div>
                    <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">Weight</div>
                      <div className="font-extrabold text-gray-800 text-[10px] sm:text-[11px] truncate">{historyData.vitals.weight}</div>
                    </div>
                    <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg">
                      <div className="text-[8px] text-gray-400 uppercase font-bold">Sugar</div>
                      <div className="font-extrabold text-gray-800 text-[10px] sm:text-[11px] truncate">{historyData.vitals.sugar}</div>
                    </div>
                  </div>
                </div>

                {/* Allergies & Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-lg">
                    <h5 className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">🚨 Drug Allergies</h5>
                    <p className="font-bold text-amber-900">{historyData.allergies}</p>
                  </div>
                  <div className="bg-slate-50 border border-gray-200 p-3 rounded-lg">
                    <h5 className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">📞 Emergency Contact</h5>
                    <p className="font-semibold text-gray-700">{historyData.emergencyContact}</p>
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diagnosed Chronic Conditions</h4>
                  <ul className="list-disc list-inside space-y-1 font-semibold text-gray-700">
                    {historyData.pastConditions.map((cond, index) => (
                      <li key={index}>{cond}</li>
                    ))}
                  </ul>
                </div>

                {/* Consultation Log & digital prescription list */}
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Past Digital Prescriptions in Spark EMR ({pastAptsWithPrescriptions.length})</h4>
                  {pastAptsWithPrescriptions.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {pastAptsWithPrescriptions.map((apt) => (
                        <div key={apt.id} className="border border-gray-100 bg-gray-50/50 p-2.5 rounded-lg">
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                            <span>Date: {apt.date} • {apt.time}</span>
                            <span className="text-[#0A6E6E]">{apt.prescription?.id}</span>
                          </div>
                          <div className="font-bold text-gray-800 mt-1">Diagnosis: {apt.prescription?.diagnosis}</div>
                          {apt.prescription?.medicines && apt.prescription.medicines.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {apt.prescription.medicines.map((m, idx) => (
                                <span key={idx} className="bg-white px-1.5 py-0.5 rounded border border-gray-100 text-[10px] font-semibold text-gray-600">
                                  {m.name} ({m.dosage})
                                </span>
                              ))}
                            </div>
                          )}
                          {apt.prescription?.notes && (
                            <p className="text-[10px] text-gray-500 italic mt-1 font-semibold">Notes: {apt.prescription.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic font-semibold">No past electronic prescriptions logged in this platform session.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPatientApt(null)}
                  className="px-5 py-2 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/95 rounded-lg text-xs font-bold shadow cursor-pointer"
                >
                  Close Record File
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
