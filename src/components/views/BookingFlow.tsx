/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Shield, ArrowLeft, ArrowRight, Clock, User, Heart, CreditCard, Check, TicketPercent, Building } from 'lucide-react';
import { MOCK_DOCTORS, INITIAL_APPOINTMENTS } from '../../data/mockData';
import { Appointment } from '../../types';
import { getOrCreatePatientWallet, debitPatientWallet, getWalletAdminConfig } from '../../data/walletUtils';
import { saveAppointmentToSupabase } from '../../lib/supabase';

interface BookingFlowProps {
  setView: (view: string) => void;
  selectedDoctorId: string | null;
  selectedBookingDate: string;
  selectedBookingSlot: string;
  setSelectedBookingDate: (date: string) => void;
  setSelectedBookingSlot: (slot: string) => void;
  onAddAppointment: (appointment: Appointment) => void;
  userEmail: string | null;
}

export default function BookingFlow({
  setView,
  selectedDoctorId,
  selectedBookingDate,
  selectedBookingSlot,
  setSelectedBookingDate,
  setSelectedBookingSlot,
  onAddAppointment,
  userEmail
}: BookingFlowProps) {
  const allDoctors = React.useMemo(() => {
    const saved = localStorage.getItem('ds_doctors');
    return saved ? JSON.parse(saved) : [...MOCK_DOCTORS];
  }, []);

  const doctor = allDoctors.find((d: any) => d.id === selectedDoctorId) || allDoctors[0] || {
    id: 'placeholder-doc',
    name: 'Doctor',
    specialty: 'Specialist',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    clinics: [],
    timeSlots: [],
    feeInClinic: 500,
    feeVideo: 500,
    clinicName: 'Clinic',
    city: 'City',
    rating: 5,
    reviewsCount: 10
  };

  const [step, setStep] = React.useState(1);

  // Form States
  const [appointmentFor, setAppointmentFor] = React.useState<'Myself' | 'Family'>('Myself');
  const [patientName, setPatientName] = React.useState('Aarav Mehta');
  const [patientAge, setPatientAge] = React.useState('32');
  const [patientGender, setPatientGender] = React.useState<'Male' | 'Female' | 'Other'>('Male');
  const [consultationType, setConsultationType] = React.useState<'In-Clinic' | 'Video'>('Video');
  const [selectedClinicId, setSelectedClinicId] = React.useState<string>(
    doctor.clinics && doctor.clinics.length > 0 ? doctor.clinics[0].id : ''
  );
  const [reasonForVisit, setReasonForVisit] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'PayAtClinic'>('UPI');
  const [useWallet, setUseWallet] = React.useState(false);

  // Error messages state
  const [errorMsg, setErrorMsg] = React.useState('');
  
  // Custom action confirmation states
  const [calendarStatus, setCalendarStatus] = React.useState('');
  const [receiptStatus, setReceiptStatus] = React.useState('');
  const [bookedSerialNo, setBookedSerialNo] = React.useState<number>(0);

  // Auto configure preselected slot if passed down (only once on mount)
  React.useEffect(() => {
    if (selectedBookingDate && selectedBookingSlot) {
      setStep(2); // Jump to details since date/slot already chosen
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (consultationType === 'Video' && paymentMethod === 'PayAtClinic') {
      setPaymentMethod('UPI');
    }
  }, [consultationType, paymentMethod]);

  // Date list calculations: Generate 15 days dynamically starting from today
  const datesList = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    let label = '';
    if (i === 0) {
      label = 'Today';
    } else if (i === 1) {
      label = 'Tomorrow';
    } else {
      label = d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    const subLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const weekdayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { label, subLabel, dateStr, weekdayName };
  });

  // Fee calculation breakdown
  const chosenClinic = doctor.clinics?.find(c => c.id === selectedClinicId);
  const slotsToDisplay = (consultationType === 'In-Clinic' && chosenClinic && chosenClinic.availableSlots && chosenClinic.availableSlots.length > 0)
    ? chosenClinic.availableSlots
    : (doctor.timeSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']);

  const consultationFee = consultationType === 'In-Clinic'
    ? (chosenClinic && chosenClinic.feeInClinic !== undefined ? chosenClinic.feeInClinic : doctor.feeInClinic)
    : (chosenClinic && chosenClinic.feeVideo !== undefined ? chosenClinic.feeVideo : doctor.feeVideo);
  
  const platformFee = 20;
  const platformGst = Math.round(platformFee * 0.18 * 100) / 100; // GST on platform fee is 18%
  
  // GST on consultation fee is NOT included when selecting Pay at Clinic
  const consultationGst = paymentMethod === 'PayAtClinic' ? 0 : Math.round(consultationFee * 0.18 * 100) / 100;
  
  // Total GST includes platform GST and consultation GST (if applicable)
  const gstAmount = Math.round((consultationGst + platformGst) * 100) / 100;
  
  const totalAmount = Math.round((consultationFee + platformFee + gstAmount) * 100) / 100;

  const patientEmail = userEmail || 'aarav.mehta@doctspark.in';
  const wallet = getOrCreatePatientWallet(patientEmail, patientName);
  const walletConfig = getWalletAdminConfig();
  const platformChargeTotal = Math.round((platformFee + platformGst) * 100) / 100; // ₹23.60
  
  const hasMinWalletBalance = wallet.balance >= walletConfig.minimumWalletUsageAmount;
  const isWalletUsageAllowed = walletConfig.walletPaymentsEnabled && hasMinWalletBalance;
  const finalPlatformChargePaidOnline = useWallet ? 0 : platformChargeTotal;
  const finalTotalPaidOnline = useWallet ? Math.round((totalAmount - platformChargeTotal) * 100) / 100 : totalAmount;

  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!selectedBookingDate || !selectedBookingSlot) {
        setErrorMsg('Please select both a consultation date and a time slot.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!patientName.trim() || !patientAge) {
        setErrorMsg('Patient full name and age are required.');
        return;
      }
      setStep(3);
    }
  };

  const handleBackStep = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const [bookingId, setBookingId] = React.useState('');

  const handleCompletePayment = () => {
    const generatedId = `DS2026${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingId(generatedId);

    const chosenClinic = doctor.clinics?.find(c => c.id === selectedClinicId);
    const clinicNameVal = consultationType === 'In-Clinic' 
      ? (chosenClinic ? chosenClinic.name : doctor.clinicName)
      : undefined;
    const clinicAddressVal = consultationType === 'In-Clinic'
      ? (chosenClinic ? `${chosenClinic.address}, ${chosenClinic.city}, ${chosenClinic.state}` : `${doctor.clinicName}, ${doctor.city}`)
      : undefined;

    let existingApts: Appointment[] = [];
    try {
      const saved = localStorage.getItem('ds_appointments');
      if (saved) {
        existingApts = JSON.parse(saved);
      } else {
        existingApts = INITIAL_APPOINTMENTS;
      }
    } catch (e) {
      existingApts = INITIAL_APPOINTMENTS;
    }

    const sameDayClinicBookings = existingApts.filter(
      apt => apt.doctorId === doctor.id && 
             apt.date === selectedBookingDate && 
             (consultationType === 'In-Clinic' ? apt.clinicName === clinicNameVal : apt.type === 'Video')
    );
    const calculatedSerialNo = sameDayClinicBookings.length + 1;
    setBookedSerialNo(calculatedSerialNo);

    // If using wallet, process debit
    if (useWallet) {
      debitPatientWallet(patientEmail, platformChargeTotal, 'Platform Fee Payment', `Paid Platform Service Fee for appointment ${generatedId}`);
    }

    // Create persistent Appointment object
    const newApt: Appointment = {
      id: generatedId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorPhoto: doctor.photo,
      patientId: patientEmail,
      patientName: patientName,
      patientAge: Number(patientAge),
      patientGender: patientGender,
      date: selectedBookingDate,
      time: selectedBookingSlot,
      type: consultationType,
      status: 'Pending',
      reason: reasonForVisit || 'General Health Consultation',
      fee: consultationFee,
      clinicName: clinicNameVal,
      clinicAddress: clinicAddressVal,
      serialNo: calculatedSerialNo,
      roomId: consultationType === 'Video' ? `room-${doctor.id.split('-')[1]}-${Date.now().toString().slice(-4)}` : undefined,
      paymentMethod: (paymentMethod === 'PayAtClinic' ? 'Pay at Clinic' : paymentMethod) + (useWallet ? ' + Wallet' : ''),
      paymentStatus: paymentMethod === 'PayAtClinic' 
        ? (useWallet ? 'Platform Fee Paid by Wallet' : 'Platform Charge Paid') 
        : (useWallet ? 'Fully Paid (Platform Fee Covered by Wallet)' : 'Fully Paid'),
      createdAt: new Date().toISOString()
    };

    onAddAppointment(newApt);
    
    // Save to Supabase backend tables asynchronously
    saveAppointmentToSupabase(newApt, doctor).catch(err => {
      console.error('Error in background save to Supabase:', err);
    });

    setStep(4);
  };

  if (doctor.id === 'placeholder-doc') {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10" id="booking-flow-root">
        <div className="bg-white p-8 rounded-xl border border-dashed border-[#D1E5E5] flex flex-col items-center justify-center text-center py-12 shadow-xs">
          <span className="text-3xl mb-3">🩺</span>
          <h4 className="text-sm font-extrabold text-[#1A2B3C] mb-1">No Doctor Selected</h4>
          <p className="text-xs text-gray-400 max-w-md leading-relaxed">Please choose a verified specialist or consultant from our primary search directory list to book a real-time consultation.</p>
          <button
            onClick={() => setView('doctors')}
            className="mt-4 px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Browse Doctor Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10" id="booking-flow-root">
      
      {/* Mini doctor card banner at top */}
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-4 flex items-center gap-4 mb-8">
        <img src={doctor.photo || undefined} alt={doctor.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100" referrerPolicy="no-referrer" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#1A2B3C] font-heading">{doctor.name}</h2>
            <span className="bg-[#D1E5E5]/50 text-[#0A6E6E] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{doctor.specialty}</span>
          </div>
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
            <Building className="w-3.5 h-3.5 text-[#0A6E6E]" />
            <span>{doctor.clinicName}, {doctor.city}</span>
          </p>
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 mt-1">
            <Star className="w-3.5 h-3.5 text-[#F5A623] fill-current" />
            <span>{doctor.rating}</span>
            <span className="text-gray-400">({doctor.reviewsCount} Patient visits)</span>
          </div>
        </div>
      </div>

      {/* Steps indicator headers */}
      <div className="grid grid-cols-4 gap-2 mb-8 text-center text-xs font-bold text-gray-400">
        <div className={`pb-2 border-b-2 ${step >= 1 ? 'border-[#0A6E6E] text-[#0A6E6E]' : 'border-gray-200'}`}>1. Select Slot</div>
        <div className={`pb-2 border-b-2 ${step >= 2 ? 'border-[#0A6E6E] text-[#0A6E6E]' : 'border-gray-200'}`}>2. Patient Info</div>
        <div className={`pb-2 border-b-2 ${step >= 3 ? 'border-[#0A6E6E] text-[#0A6E6E]' : 'border-gray-200'}`}>3. Payment</div>
        <div className={`pb-2 border-b-2 ${step >= 4 ? 'border-[#0A6E6E] text-[#0A6E6E]' : 'border-gray-200'}`}>4. Confirmed</div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-6">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 shadow-sm">
        
        {/* STEP 1: SELECT SLOT */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C] mb-3">Choose Consultation Mode & Date</h3>
              
              {/* Consultation type */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <button
                  type="button"
                  onClick={() => setConsultationType('Video')}
                  className={`p-4 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${consultationType === 'Video' ? 'border-[#0A6E6E] bg-[#F0F7F7]' : 'border-[#D1E5E5] bg-white hover:bg-gray-50'}`}
                >
                  <span className="text-xl">📹</span>
                  <div className="text-xs font-bold text-[#1A2B3C]">Video Consultation</div>
                  <div className="text-[10px] text-gray-400">Fee: ₹{chosenClinic && chosenClinic.feeVideo !== undefined ? chosenClinic.feeVideo : doctor.feeVideo}</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConsultationType('In-Clinic');
                    if (doctor.clinics && doctor.clinics.length > 0 && !selectedClinicId) {
                      setSelectedClinicId(doctor.clinics[0].id);
                    }
                  }}
                  className={`p-4 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${consultationType === 'In-Clinic' ? 'border-[#0A6E6E] bg-[#F0F7F7]' : 'border-[#D1E5E5] bg-white hover:bg-gray-50'}`}
                >
                  <span className="text-xl">🏥</span>
                  <div className="text-xs font-bold text-[#1A2B3C]">In-Clinic Walk-In</div>
                  <div className="text-[10px] text-gray-400">Fee: ₹{chosenClinic && chosenClinic.feeInClinic !== undefined ? chosenClinic.feeInClinic : doctor.feeInClinic}</div>
                </button>
              </div>

              {/* Clinic Selection (In-Clinic only) */}
              {consultationType === 'In-Clinic' && (
                <div className="mb-6 bg-teal-50/40 border border-teal-100 p-4 rounded-xl flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#0A6E6E]" />
                    Select Practice Chamber Location
                  </h4>
                  {doctor.clinics && doctor.clinics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {doctor.clinics.map(clinic => (
                        <button
                          key={clinic.id}
                          type="button"
                          onClick={() => setSelectedClinicId(clinic.id)}
                          className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${selectedClinicId === clinic.id ? 'bg-white border-[#0A6E6E] shadow-sm ring-1 ring-[#0A6E6E]' : 'bg-white border-[#D1E5E5] hover:border-[#0A6E6E]/60'}`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="font-extrabold text-xs text-[#1A2B3C]">{clinic.name}</span>
                              <span className="bg-[#0A6E6E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                {clinic.practiceType === 'Independent' ? 'Private' : clinic.practiceType === 'Clinic' ? 'Group' : 'Hospital'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                              📍 {clinic.address}, {clinic.city}
                            </p>
                            <div className="text-[9px] font-bold text-teal-800 mt-1 flex gap-1.5">
                              <span>Fee: ₹{clinic.feeInClinic || 500}</span>
                              <span>•</span>
                              <span>Days: {(clinic.availableDays || []).slice(0, 3).join(', ')}{(clinic.availableDays || []).length > 3 ? '...' : ''}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-[#D1E5E5] rounded-lg text-[11px] text-gray-600 font-medium">
                      📍 Default Location: <strong className="text-[#1A2B3C]">{doctor.clinicName}</strong>, {doctor.city}
                    </div>
                  )}
                </div>
              )}

              {/* Date pick */}
              <div className="flex gap-2.5 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-[#0A6E6E]/60 scrollbar-track-gray-100 snap-x">
                {datesList.map(item => {
                  const allowedDays = consultationType === 'Video'
                    ? (doctor.availableDays || [])
                    : (chosenClinic?.availableDays || doctor.availableDays || []);
                  const isAvailable = allowedDays.includes(item.weekdayName);

                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => setSelectedBookingDate(item.dateStr)}
                      className={`py-2.5 px-4 rounded-xl text-center border transition-all shrink-0 snap-align-center min-w-[100px] flex flex-col items-center justify-center cursor-pointer ${selectedBookingDate === item.dateStr ? 'bg-[#0A6E6E] text-white border-[#0A6E6E] shadow-sm' : 'bg-white text-gray-600 border-[#D1E5E5] hover:bg-[#F0F7F7] hover:border-[#0A6E6E]/30'}`}
                    >
                      <div className="text-[10px] font-extrabold uppercase tracking-wider">{item.label}</div>
                      <div className="text-xs font-bold mt-1">{item.subLabel}</div>
                      <div className="text-[9px] font-mono opacity-50 mt-0.5">{item.dateStr}</div>
                      {isAvailable ? (
                        <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                          🟢 Open
                        </span>
                      ) : (
                        <span className="text-[8px] font-extrabold text-red-500 bg-red-50 border border-red-100 px-1 py-0.5 rounded mt-1.5 uppercase tracking-wider">
                          🔴 Closed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C] mb-3">Available Time Slots</h3>
              <div className="grid grid-cols-4 gap-2">
                {slotsToDisplay.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedBookingSlot(slot)}
                    className={`py-2 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${selectedBookingSlot === slot ? 'bg-[#F5A623] text-white border-[#F5A623]' : 'bg-[#F0F7F7] text-gray-600 border-[#D1E5E5] hover:border-[#0A6E6E]'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 mt-4 flex justify-between">
              <button 
                type="button" 
                onClick={() => setView('doctors')}
                className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Back to Listing
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="px-8 py-2.5 bg-[#0A6E6E] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#0A6E6E]/90 transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PATIENT DETAILS */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C] border-b border-gray-100 pb-2">
              Patient Information & Demographics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Appointment is for</label>
                <select 
                  value={appointmentFor} 
                  onChange={(e) => {
                    const val = e.target.value as 'Myself' | 'Family';
                    setAppointmentFor(val);
                    if (val === 'Myself') {
                      setPatientName('Aarav Mehta');
                      setPatientAge('32');
                      setPatientGender('Male');
                    } else {
                      setPatientName('');
                      setPatientAge('');
                    }
                  }}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="Myself">Myself (Aarav Mehta)</option>
                  <option value="Family">A Family Member</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Patient Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Mehta"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Patient Age (Years)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 35"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Patient Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Male', 'Female', 'Other'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPatientGender(g)}
                      className={`py-2 px-1 rounded-lg text-center text-xs font-bold border transition-colors cursor-pointer ${patientGender === g ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white text-gray-500 border-[#D1E5E5] hover:bg-[#F0F7F7]'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Reason for consultation / Symptoms (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Describe health conditions, chest issues, prescriptions requested, etc."
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 mt-4 flex justify-between">
              <button 
                type="button" 
                onClick={handleBackStep}
                className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button 
                type="button" 
                onClick={handleNextStep}
                className="px-8 py-2.5 bg-[#0A6E6E] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#0A6E6E]/90 transition-colors"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT */}
        {step === 3 && (
          <div className="flex flex-col gap-6" id="booking-payment-panel">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C] border-b border-gray-100 pb-2">
              Payment Summary & Razorpay Billing Check
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Order breakdown */}
              <div className="bg-[#F0F7F7] p-5 rounded-xl border border-[#D1E5E5] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-[#0A6E6E] uppercase tracking-wider mb-2">Invoice Summary</div>
                  {paymentMethod === 'PayAtClinic' ? (
                    <div className="space-y-3 text-xs font-medium text-gray-600">
                      {/* Section: Pay Online Now */}
                      <div className="border-b border-dashed border-gray-200 pb-2">
                        <div className="text-[10px] font-black text-[#1A2B3C] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]"></span>
                          Pay Online Now (Platform Charge)
                        </div>
                        <div className="space-y-1 pl-2.5">
                          <div className="flex justify-between">
                            <span>Platform Convenience Fee (incl. GST)</span>
                            <strong className="text-[#1A2B3C]">₹{(platformFee + platformGst).toFixed(2)}</strong>
                          </div>
                          {useWallet && (
                            <div className="flex justify-between text-teal-700 font-extrabold text-[10px]">
                              <span>Wallet Payment (Platform Fee)</span>
                              <span>-₹{platformChargeTotal.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs font-extrabold text-[#0A6E6E] pt-1">
                            <span>{useWallet ? 'Platform Charge Due Online' : 'Platform Charge Total'}</span>
                            <span>₹{finalPlatformChargePaidOnline.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section: Pay at Clinic */}
                      <div>
                        <div className="text-[10px] font-black text-[#1A2B3C] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0A6E6E]"></span>
                          Pay at Clinic (Doctor Fee)
                        </div>
                        <div className="space-y-1 pl-2.5">
                          <div className="flex justify-between">
                            <span>Doctor Consultation Fee</span>
                            <strong className="text-[#1A2B3C]">₹{consultationFee.toFixed(2)}</strong>
                          </div>
                          <div className="flex justify-between text-xs font-extrabold text-teal-700 pt-1">
                            <span>Clinic Payment Total</span>
                            <span>₹{(consultationFee + consultationGst).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs font-medium text-gray-600">
                      <div className="flex justify-between">
                        <span>{doctor.name} ({consultationType})</span>
                        <strong className="text-[#1A2B3C]">₹{consultationFee.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Convenience Fee (incl. GST)</span>
                        <strong className="text-[#1A2B3C]">₹{(platformFee + platformGst).toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>GST on Consultation (18%)</span>
                        <strong className="text-[#1A2B3C]">₹{consultationGst.toFixed(2)}</strong>
                      </div>
                      {useWallet && (
                        <div className="flex justify-between text-teal-700 font-extrabold text-[11px] bg-teal-50/50 p-1.5 rounded border border-teal-100/50">
                          <span>Wallet Payment (Platform Fee)</span>
                          <span>-₹{platformChargeTotal.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-extrabold text-[#1A2B3C]">
                        <span>{useWallet ? 'Amount Due Online' : 'Grand Total'}</span>
                        <span className="text-[#0A6E6E]">₹{finalTotalPaidOnline.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PATIENT WALLET SELECTION */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2 shadow-3xs mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-wider flex items-center gap-1.5">
                      💳 Patient Spark Wallet
                    </span>
                    <span className="text-[10px] bg-[#0A6E6E] text-white px-2 py-0.5 rounded-full font-bold">
                      Balance: ₹{wallet.balance.toFixed(2)}
                    </span>
                  </div>
                  
                  {isWalletUsageAllowed ? (
                    <div className="flex items-start gap-2.5 mt-1.5 p-2 bg-teal-50/50 border border-teal-100 rounded-lg">
                      <input 
                        type="checkbox"
                        id="use-wallet-platform-fee"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="mt-0.5 accent-[#0A6E6E] cursor-pointer w-4 h-4"
                      />
                      <label htmlFor="use-wallet-platform-fee" className="text-[11px] text-gray-700 font-bold leading-relaxed cursor-pointer select-none">
                        Use Wallet Balance to cover Platform Service Fee (₹{platformChargeTotal.toFixed(2)})
                        <span className="block text-[9px] text-[#0A6E6E] font-medium mt-0.5">
                          Wallet rules: Balance can only be used to pay Platform Service Fees, and can only be used when available balance is ₹{walletConfig.minimumWalletUsageAmount} or more.
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-700 font-semibold bg-amber-50/70 border border-amber-100/50 rounded-lg p-2.5 leading-normal mt-1">
                      {!walletConfig.walletPaymentsEnabled ? (
                        "⚠️ Wallet payments are temporarily disabled by the administration."
                      ) : (
                        `⚠️ Your wallet balance (₹${wallet.balance.toFixed(2)}) is below the minimum usage threshold of ₹${walletConfig.minimumWalletUsageAmount.toFixed(2)}. Balance can only be used when it is ₹${walletConfig.minimumWalletUsageAmount} or more.`
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[10px] text-emerald-800 font-semibold mt-4">
                  🔥 Offer Applied: Free follow-up consultation within 7 days.
                </div>
              </div>

              {/* Payment selection */}
              <div className="flex flex-col gap-4">
                <label className="block text-xs font-bold text-[#1A2B3C]">Select Payment Method</label>
                
                <div className="flex flex-col gap-2">
                  <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'UPI' ? 'border-[#0A6E6E] bg-[#F0F7F7]' : 'border-[#D1E5E5]'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📱</span>
                      <span className="text-xs font-bold text-[#1A2B3C]">UPI (GPay, PhonePe, Paytm)</span>
                    </div>
                    <input 
                      type="radio" 
                      name="paymode" 
                      checked={paymentMethod === 'UPI'} 
                      onChange={() => setPaymentMethod('UPI')}
                      className="accent-[#0A6E6E]"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'Card' ? 'border-[#0A6E6E] bg-[#F0F7F7]' : 'border-[#D1E5E5]'}`}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-[#1A2B3C]">Credit / Debit Card</span>
                    </div>
                    <input 
                      type="radio" 
                      name="paymode" 
                      checked={paymentMethod === 'Card'} 
                      onChange={() => setPaymentMethod('Card')}
                      className="accent-[#0A6E6E]"
                    />
                  </label>

                  <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'NetBanking' ? 'border-[#0A6E6E] bg-[#F0F7F7]' : 'border-[#D1E5E5]'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏦</span>
                      <span className="text-xs font-bold text-[#1A2B3C]">Net Banking</span>
                    </div>
                    <input 
                      type="radio" 
                      name="paymode" 
                      checked={paymentMethod === 'NetBanking'} 
                      onChange={() => setPaymentMethod('NetBanking')}
                      className="accent-[#0A6E6E]"
                    />
                  </label>

                  {consultationType === 'In-Clinic' && (
                    <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'PayAtClinic' ? 'border-[#0A6E6E] bg-[#F0F7F7]' : 'border-[#D1E5E5]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏥</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#1A2B3C]">Pay at Clinic</span>
                          <span className="text-[10px] text-gray-400 font-semibold">Pay appointment fee at clinic, only platform charge paid now</span>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="paymode" 
                        checked={paymentMethod === 'PayAtClinic'} 
                        onChange={() => setPaymentMethod('PayAtClinic')}
                        className="accent-[#0A6E6E]"
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>

            <div className="border-t border-gray-100 pt-5 mt-4 flex justify-between">
              <button 
                type="button" 
                onClick={handleBackStep}
                className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button 
                type="button" 
                onClick={handleCompletePayment}
                className="px-8 py-2.5 bg-[#F5A623] hover:bg-[#F5A623]/95 text-white rounded-lg text-xs font-extrabold shadow cursor-pointer transition-all"
              >
                {paymentMethod === 'PayAtClinic' ? (
                  useWallet ? 'Confirm Booking (Platform Fee Paid from Wallet)' : `Pay ₹${platformChargeTotal.toFixed(2)} Platform Charge Now`
                ) : (
                  `Pay ₹${finalTotalPaidOnline.toFixed(2)} Now`
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 4 && (
          <div className="text-center py-10 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-4 border border-emerald-100 shadow-md">
              <Check className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-[#1A2B3C] font-heading">Booking Confirmed!</h2>
            <p className="text-xs text-[#0A6E6E] font-bold mt-1 uppercase tracking-wider">Appointment Confirmed with {doctor.name}</p>

            <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-5 rounded-xl text-left max-w-md w-full my-6 text-xs font-semibold text-gray-700 flex flex-col gap-3">
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span>Booking ID:</span>
                <strong className="text-gray-900 font-mono text-xs">{bookingId}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span>Doctor Name:</span>
                <strong className="text-gray-900">{doctor.name}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span>Date & Time:</span>
                <strong className="text-gray-900">{selectedBookingDate} at {selectedBookingSlot}</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200">
                <span>Consultation Mode:</span>
                <strong className="text-blue-600 uppercase tracking-widest text-[10px]">{consultationType} Visit</strong>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-200 bg-amber-50/60 p-2 rounded-lg border border-amber-100/80 items-center">
                <span className="text-amber-800 font-extrabold text-[11px] uppercase tracking-wider">Queue Serial No:</span>
                <strong className="text-amber-900 font-black text-sm">#{bookedSerialNo || 1}</strong>
              </div>
              {paymentMethod.includes('Pay at Clinic') ? (
                <>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span>Paid Online (Platform Charge):</span>
                    <strong className="text-[#0A6E6E]">
                      {useWallet ? '₹0.00 (₹23.60 covered by Wallet)' : `₹${platformChargeTotal.toFixed(2)}`}
                    </strong>
                  </div>
                  <div className="flex justify-between bg-teal-50/60 p-2 rounded-lg border border-teal-100 items-center">
                    <span className="text-teal-800 font-extrabold text-[11px] uppercase tracking-wider">To Pay at Clinic:</span>
                    <strong className="text-teal-900 font-black text-sm">₹{(consultationFee + consultationGst).toFixed(2)}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between pb-1 text-gray-500">
                    <span>Total Bill:</span>
                    <strong>₹{totalAmount.toFixed(2)}</strong>
                  </div>
                  {useWallet && (
                    <div className="flex justify-between pb-1 text-teal-700 font-bold">
                      <span>Paid from Wallet (Platform Fee):</span>
                      <span>-₹{platformChargeTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-1.5">
                    <span>Paid Amount:</span>
                    <strong className="text-[#0A6E6E]">₹{finalTotalPaidOnline.toFixed(2)}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 w-full max-w-md">
              <div className="flex gap-3 justify-center w-full">
                <button 
                  onClick={() => {
                    setCalendarStatus('Added! Details synced with Google Calendar successfully.');
                    setTimeout(() => setCalendarStatus(''), 4000);
                  }}
                  className="px-4 py-2 hover:bg-[#F0F7F7] border border-[#D1E5E5] text-[#0A6E6E] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Add to Calendar
                </button>
                <button 
                  onClick={() => {
                    setReceiptStatus('Sent! Receipt generated and sent via SMS to Aarav Mehta.');
                    setTimeout(() => setReceiptStatus(''), 4000);
                  }}
                  className="px-4 py-2 hover:bg-[#F0F7F7] border border-[#D1E5E5] text-[#0A6E6E] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Download Receipt
                </button>
                <button 
                  onClick={() => setView('patient-dashboard')}
                  className="px-6 py-2 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/95 font-bold text-xs rounded-lg shadow transition-all cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
              
              {calendarStatus && (
                <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 px-3 w-full text-center animate-in fade-in slide-in-from-bottom-1 duration-150">
                  📅 {calendarStatus}
                </div>
              )}
              {receiptStatus && (
                <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 px-3 w-full text-center animate-in fade-in slide-in-from-bottom-1 duration-150">
                  📱 {receiptStatus}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
