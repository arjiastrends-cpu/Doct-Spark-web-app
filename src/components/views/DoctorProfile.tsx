/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, ShieldAlert, Award, GraduationCap, Building, Calendar, Clock, ChevronRight, User, MapPin } from 'lucide-react';
import { MOCK_DOCTORS, MOCK_REVIEWS } from '../../data/mockData';
import { Doctor } from '../../types';

interface DoctorProfileProps {
  setView: (view: string) => void;
  selectedDoctorId: string | null;
  setSelectedDoctorId: (id: string | null) => void;
  setSelectedBookingDate: (date: string) => void;
  setSelectedBookingSlot: (slot: string) => void;
}

export default function DoctorProfile({
  setView,
  selectedDoctorId,
  setSelectedDoctorId,
  setSelectedBookingDate,
  setSelectedBookingSlot
}: DoctorProfileProps) {
  const allDoctors = React.useMemo(() => {
    const saved = localStorage.getItem('ds_doctors');
    return saved ? JSON.parse(saved) : [...MOCK_DOCTORS];
  }, []);

  // Safe Fallback if no doctor selected
  const doctor = allDoctors.find(d => d.id === selectedDoctorId) || allDoctors[0] || {
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
    reviewsCount: 10,
    registrationNumber: 'MCI-00000',
    education: 'MBBS, MD',
    experience: 5
  };

  if (doctor.id === 'placeholder-doc') {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-10" id="doctor-profile-root">
        <div className="bg-white p-8 rounded-xl border border-dashed border-[#D1E5E5] flex flex-col items-center justify-center text-center py-12 shadow-xs">
          <span className="text-3xl mb-3">🥼</span>
          <h4 className="text-sm font-extrabold text-[#1A2B3C] mb-1">No Doctor Profile Selected</h4>
          <p className="text-xs text-gray-400 max-w-md leading-relaxed">Please choose a verified specialist or consultant from our primary search directory list to view their complete profile.</p>
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
    return { label, subLabel, dateStr };
  });

  const [chosenDate, setChosenDate] = React.useState(datesList[0].dateStr);
  const [chosenSlot, setChosenSlot] = React.useState(doctor.timeSlots[0]);

  // Review pagination
  const [reviewPage, setReviewPage] = React.useState(1);
  const reviewsPerPage = 2;
  const filteredReviews = MOCK_REVIEWS.filter(r => r.doctorName === doctor.name);
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage) || 1;

  // Reset page when doctor changes to avoid out-of-bounds page issues
  React.useEffect(() => {
    setReviewPage(1);
  }, [doctor.id]);

  const currentReviews = React.useMemo(() => {
    const startIdx = (reviewPage - 1) * reviewsPerPage;
    return filteredReviews.slice(startIdx, startIdx + reviewsPerPage);
  }, [filteredReviews, reviewPage]);

  // Handle Quick Booking
  const handleProceedBooking = () => {
    setSelectedBookingDate(chosenDate);
    setSelectedBookingSlot(chosenSlot);
    setSelectedDoctorId(doctor.id);
    setView('booking');
  };

  const handleRecommendClick = (otherDocId: string) => {
    setSelectedDoctorId(otherDocId);
    setChosenSlot(allDoctors.find(d => d.id === otherDocId)?.timeSlots[0] || '10:00 AM');
    setReviewPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Similar Doctors (same specialty or city, excluding current doctor)
  const similarDoctors = allDoctors.filter(d => d.id !== doctor.id && d.specialty === doctor.specialty).slice(0, 2);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="doctor-profile-root">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
        <button onClick={() => setView('home')} className="hover:text-[#0A6E6E]">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => setView('doctors')} className="hover:text-[#0A6E6E]">Doctors</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1A2B3C]">{doctor.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT/MIDDLE: DETAILS (Hero, About, Clinic, Reviews) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 1. HERO SECTION */}
          <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 flex flex-col sm:flex-row gap-6 relative">
            <div className="absolute top-4 right-4 bg-[#0A6E6E] text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Award className="w-3.5 h-3.5" /> Verified Practitioner
            </div>

            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 mx-auto sm:mx-0">
              <img src={doctor.photo || undefined} alt={doctor.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">{doctor.name}</h1>
                <span className="bg-[#D1E5E5]/50 text-[#0A6E6E] text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider w-fit mx-auto sm:mx-0">
                  {doctor.specialty}
                </span>
              </div>

              <p className="text-xs text-gray-500 font-medium mb-3 flex items-center justify-center sm:justify-start gap-1">
                <GraduationCap className="w-4 h-4 text-[#0A6E6E]" />
                <span>{doctor.education}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-gray-600 mb-4">
                <button
                  onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1 hover:text-[#0A6E6E] hover:underline cursor-pointer transition-all"
                >
                  <Star className="w-4 h-4 text-[#F5A623] fill-current" />
                  <strong className="text-[#1A2B3C]">{doctor.rating}</strong> ({doctor.reviewsCount} verified reviews)
                </button>
                <span>•</span>
                <span><strong>{doctor.experience}</strong> Years Experience</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-[10px] font-extrabold uppercase tracking-wide">
                <span className="bg-[#F0F7F7] text-[#0A6E6E] border border-[#D1E5E5] px-2.5 py-1 rounded-full">
                  MCI: {doctor.registrationNumber}
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                  100% Medical Vetting
                </span>
              </div>
            </div>
          </div>

          {/* 2. ABOUT, BIO, EDUCATION */}
          <div className="bg-white rounded-xl border border-[#D1E5E5] p-6">
            <h2 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-3.5 border-b border-gray-100 pb-2">
              Professional Biography
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {doctor.bio}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-[#F0F7F7] p-3 rounded-lg border border-[#D1E5E5]">
                <div className="font-extrabold text-[#0A6E6E] mb-1">Education & Certifications</div>
                <div className="text-gray-600 font-medium">{doctor.education}</div>
              </div>
              <div className="bg-[#F0F7F7] p-3 rounded-lg border border-[#D1E5E5]">
                <div className="font-extrabold text-[#0A6E6E] mb-1">Clinic Name & Location</div>
                <div className="text-gray-600 font-medium">
                  {doctor.clinics && doctor.clinics.length > 0 ? (
                    doctor.clinics.map(c => c.name).join(' • ')
                  ) : (
                    `${doctor.clinicName}, ${doctor.city}`
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. CLINIC DETAILS & MAP */}
          <div className="bg-white rounded-xl border border-[#D1E5E5] p-6">
            <h2 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-3.5 border-b border-gray-100 pb-2">
              In-Clinic Details & Timings
            </h2>
            
            {doctor.clinics && doctor.clinics.length > 0 ? (
              <div className="flex flex-col gap-6">
                {doctor.clinics.map((clinic, idx) => (
                  <div key={clinic.id} className={`flex flex-col sm:flex-row gap-6 ${idx > 0 ? 'border-t border-gray-100 pt-6' : ''}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-xs font-bold text-[#1A2B3C]">{clinic.name}</h3>
                        <span className="bg-[#0A6E6E]/10 text-[#0A6E6E] text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {clinic.practiceType === 'Independent' ? 'Private' : clinic.practiceType === 'Clinic' ? 'Group' : 'Hospital'}
                        </span>
                        {idx === 0 && (
                          <span className="bg-[#F5A623] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        📍 {clinic.address}, {clinic.city}, {clinic.state} - {clinic.pincode}
                      </p>
                      <div className="bg-[#F0F7F7] p-3.5 rounded-lg border border-[#D1E5E5] text-xs font-semibold text-gray-700">
                        <div className="text-[#0A6E6E] font-bold mb-1">Operating Days</div>
                        <div>Mon - Sat: 09:00 AM - 08:00 PM</div>
                        <div className="text-gray-400 text-[10px] mt-1">(Sunday Closed)</div>
                      </div>
                    </div>

                    {/* Simulated Map Container with Clean Minimalism styles */}
                    <div className="w-full sm:w-60 h-36 rounded-lg border border-[#D1E5E5] bg-[#F0F7F7] relative overflow-hidden flex flex-col justify-between p-3 shrink-0">
                      <div className="absolute inset-0 bg-teal-50/40 border-b border-[#D1E5E5]">
                        <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#0A6E6E 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          <span className="text-xl">📍</span>
                          <span className="bg-[#0A6E6E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                            {clinic.name}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto bg-white/95 px-2 py-1.5 rounded text-[9px] font-bold text-[#1A2B3C] z-10 flex justify-between items-center border border-[#D1E5E5]">
                        <span>GPS: {clinic.latitude || '19.0760'}, {clinic.longitude || '72.8777'}</span>
                        <span className="text-[#0A6E6E]">Open Maps</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-[#1A2B3C] mb-1">{doctor.clinicName}</h3>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    {doctor.city}, India
                  </p>
                  <div className="bg-[#F0F7F7] p-3.5 rounded-lg border border-[#D1E5E5] text-xs font-semibold text-gray-700">
                    <div className="text-[#0A6E6E] font-bold mb-1">Operating Days</div>
                    <div>Mon - Sat: 09:00 AM - 08:00 PM</div>
                    <div className="text-gray-400 text-[10px] mt-1">(Sunday Closed)</div>
                  </div>
                </div>

                {/* Simulated Map Container with Clean Minimalism styles */}
                <div className="w-full sm:w-60 h-36 rounded-lg border border-[#D1E5E5] bg-[#F0F7F7] relative overflow-hidden flex flex-col justify-between p-3 shrink-0">
                  <div className="absolute inset-0 bg-teal-50/40 border-b border-[#D1E5E5]">
                    <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#0A6E6E 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <span className="text-xl">📍</span>
                      <span className="bg-[#0A6E6E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                        {doctor.clinicName}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto bg-white/95 px-2 py-1.5 rounded text-[9px] font-bold text-[#1A2B3C] z-10 flex justify-between items-center border border-[#D1E5E5]">
                    <span>Get Directions via GPS</span>
                    <span className="text-[#0A6E6E]">Open Maps</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. REVIEWS */}
          <div className="bg-white rounded-xl border border-[#D1E5E5] p-6" id="reviews-section">
            <h2 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Patient Experiences & Reviews ({filteredReviews.length})
            </h2>

            {currentReviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {currentReviews.map(rev => (
                  <div key={rev.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 bg-[#0A6E6E]/10 rounded-full flex items-center justify-center text-xs text-[#0A6E6E] font-bold">
                          {rev.patientName[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#1A2B3C]">{rev.patientName}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{rev.date}</span>
                        </div>
                      </div>
                      <div className="flex text-[#F5A623]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic pl-8.5">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalReviewPages > 1 && (
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 text-xs">
                    <button
                      onClick={() => setReviewPage(p => Math.max(p - 1, 1))}
                      disabled={reviewPage === 1}
                      className="px-3 py-1.5 border border-[#D1E5E5] rounded-md font-bold disabled:opacity-40 text-[#0A6E6E] cursor-pointer hover:bg-[#F0F7F7] active:scale-[0.98] transition-all disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-500 font-semibold">
                      Page {reviewPage} of {totalReviewPages}
                    </span>
                    <button
                      onClick={() => setReviewPage(p => Math.min(p + 1, totalReviewPages))}
                      disabled={reviewPage === totalReviewPages}
                      className="px-3 py-1.5 border border-[#D1E5E5] rounded-md font-bold disabled:opacity-40 text-[#0A6E6E] cursor-pointer hover:bg-[#F0F7F7] active:scale-[0.98] transition-all disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-500 font-medium">
                No reviews yet. Be the first to share your experience with {doctor.name}!
              </div>
            )}
          </div>

        </div>

        {/* RIGHT SIDEBAR: QUICK BOOKING CARD & SIMILAR DOCTORS */}
        <aside className="flex flex-col gap-6" id="profile-booking-sidebar">
          
          {/* BOOKING SELECTOR CARD */}
          <div className="bg-white rounded-xl border-2 border-[#0A6E6E] p-5 shadow-md flex flex-col justify-between sticky top-20">
            <div>
              <div className="bg-[#0A6E6E] text-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md text-center mb-4">
                Consultation Booking Engine
              </div>

              {/* Consultation type pricing */}
              <div className="grid grid-cols-2 gap-3 mb-5 text-center">
                <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-gray-500">In-Clinic Fee</div>
                  <div className="text-lg font-extrabold text-[#0A6E6E]">₹{doctor.feeInClinic}</div>
                </div>
                <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Video Fee</div>
                  <div className="text-lg font-extrabold text-blue-600">₹{doctor.feeVideo}</div>
                </div>
              </div>

              {/* Step A: Date Picker */}
              <div className="mb-4">
                <label className="block text-xs font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0A6E6E]" /> Select Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-3.5 scrollbar-thin scrollbar-thumb-[#0A6E6E]/60 scrollbar-track-gray-100 snap-x">
                  {datesList.map(item => (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => setChosenDate(item.dateStr)}
                      className={`py-2 px-3 rounded-xl text-center border transition-all shrink-0 snap-align-center min-w-[85px] flex flex-col items-center justify-center cursor-pointer ${chosenDate === item.dateStr ? 'bg-[#0A6E6E] text-white border-[#0A6E6E] shadow-sm' : 'bg-white text-gray-600 border-[#D1E5E5] hover:bg-[#F0F7F7] hover:border-[#0A6E6E]/30'}`}
                    >
                      <div className="text-[9px] font-extrabold uppercase tracking-wider">{item.label}</div>
                      <div className="text-xs font-bold mt-1">{item.subLabel}</div>
                      <div className="text-[9px] font-mono opacity-50 mt-0.5">{item.dateStr}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step B: Time Slots Picker */}
              <div className="mb-6">
                <label className="block text-xs font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0A6E6E]" /> Choose Time Slot
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {doctor.timeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setChosenSlot(slot)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${chosenSlot === slot ? 'bg-[#F5A623] text-white border-[#F5A623]' : 'bg-[#F0F7F7] text-gray-600 border-[#D1E5E5] hover:border-[#0A6E6E]'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Book Trigger Button */}
            <div>
              <button
                onClick={handleProceedBooking}
                className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white py-3 rounded-lg text-xs font-extrabold shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Book Selected Slot
              </button>
              <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2.5">
                Instant SMS & Dashboard Confirmation
              </div>
            </div>
          </div>

          {/* SIMILAR DOCTORS RECOMMENDATION */}
          {similarDoctors.length > 0 && (
            <div className="bg-white rounded-xl border border-[#D1E5E5] p-5">
              <h3 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Similar Doctors
              </h3>
              <div className="flex flex-col gap-3">
                {similarDoctors.map(other => (
                  <div 
                    key={other.id} 
                    onClick={() => handleRecommendClick(other.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0F7F7] cursor-pointer border border-transparent hover:border-[#D1E5E5] transition-all"
                  >
                    <img src={other.photo} alt={other.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#1A2B3C] truncate hover:text-[#0A6E6E]">{other.name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{other.specialty} • {other.experience} Yrs exp</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}
