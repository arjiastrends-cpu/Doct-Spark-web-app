/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  Briefcase, 
  Activity, 
  Stethoscope, 
  Award,
  Phone
} from 'lucide-react';

interface PatientPhysiotherapyProps {
  userEmail: string;
  addNotification: (title: string, message: string) => void;
  walletBalance: number;
  deductFromWallet: (amount: number, reason: string) => boolean;
}

interface Physiotherapist {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  experience: number;
  clinicName: string;
  city: string;
  pincode: string;
  feesClinic: number;
  feesHome: number;
  status: string;
}

export default function PatientPhysiotherapy({ userEmail, addNotification, walletBalance, deductFromWallet }: PatientPhysiotherapyProps) {
  // 1. Core Lists
  const [physios, setPhysios] = React.useState<Physiotherapist[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // 2. Selection & Form State
  const [selectedPhysio, setSelectedPhysio] = React.useState<Physiotherapist | null>(null);
  const [bookingType, setBookingType] = React.useState<'Clinic' | 'Home'>('Clinic');
  const [patientDetails, setPatientDetails] = React.useState({
    name: 'Aarav Mehta',
    phone: '9876543210',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    address: 'A-402 Bandra West, Link Road',
    notes: 'Knee rehabilitation post meniscus tear surgery.'
  });

  // 3. Appointment History across all therapists for this user email
  const [appointments, setAppointments] = React.useState<any[]>([]);

  // Load therapists & aggregate history
  React.useEffect(() => {
    // 1. Load therapists
    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    let loadedPhysios: Physiotherapist[] = [];
    if (savedPhysios) {
      loadedPhysios = JSON.parse(savedPhysios);
    } else {
      loadedPhysios = [
        { id: 'pht-1', name: 'Dr. Rohan Deshmukh (PT)', email: 'rohan.pt@sparkphysio.in', phone: '9920183421', specialty: 'Orthopedic Rehabilitation', experience: 8, clinicName: 'Spark Ortho & Physio Care', city: 'Mumbai', pincode: '400050', feesClinic: 600, feesHome: 1000, status: 'Approved' },
        { id: 'pht-2', name: 'Dr. Anjali Sen (PT)', email: 'anjali.pt@gmail.com', phone: '9820549201', specialty: 'Sports Injury & Neuro PT', experience: 6, clinicName: 'Sen Rehab Center', city: 'Mumbai', pincode: '400069', feesClinic: 700, feesHome: 1200, status: 'Approved' }
      ];
      localStorage.setItem('ds_physiotherapists', JSON.stringify(loadedPhysios));
    }
    setPhysios(loadedPhysios);

    // 2. Aggregated history across all therapists' local store slots
    const aggregated: any[] = [];
    loadedPhysios.forEach(phy => {
      const emailKey = phy.email.replace(/\./g, '_');
      const savedApts = localStorage.getItem(`ds_physio_appointments_${emailKey}`);
      if (savedApts) {
        const list = JSON.parse(savedApts);
        // filter bookings for this patient
        const matches = list.filter((a: any) => a.patientEmail === userEmail);
        matches.forEach((m: any) => {
          aggregated.push({
            ...m,
            physioName: phy.name,
            physioEmail: phy.email,
            physioSpecialty: phy.specialty
          });
        });
      }
    });

    // If empty, add a default completed appointment to look polished
    if (aggregated.length === 0 && loadedPhysios.length > 0) {
      const firstPhy = loadedPhysios[0];
      const emailKey = firstPhy.email.replace(/\./g, '_');
      const sampleApt = {
        id: 'PHY-APT-291',
        patientEmail: userEmail,
        patientName: 'Aarav Mehta',
        phone: '9876543210',
        date: '2026-07-02',
        time: '10:00 AM',
        bookingType: 'Clinic',
        fees: firstPhy.feesClinic,
        status: 'Completed',
        notes: 'Initial musculoskeletal posture analysis',
        created_at: '2026-07-01T09:30:00Z'
      };
      localStorage.setItem(`ds_physio_appointments_${emailKey}`, JSON.stringify([sampleApt]));
      aggregated.push({
        ...sampleApt,
        physioName: firstPhy.name,
        physioEmail: firstPhy.email,
        physioSpecialty: firstPhy.specialty
      });
    }

    // Sort by date desc
    aggregated.sort((a, b) => b.date.localeCompare(a.date));
    setAppointments(aggregated);
  }, [userEmail]);

  // Filter therapists
  const filteredPhysios = React.useMemo(() => {
    return physios.filter(p => {
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) || 
             p.specialty.toLowerCase().includes(query) || 
             p.clinicName.toLowerCase().includes(query) ||
             p.city.toLowerCase().includes(query);
    });
  }, [physios, searchQuery]);

  // Booking Handler
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhysio) return;

    const price = bookingType === 'Clinic' ? selectedPhysio.feesClinic : selectedPhysio.feesHome;

    // Deduct from wallet
    const success = deductFromWallet(price, `Physiotherapy Booking: ${selectedPhysio.name}`);
    if (!success) {
      alert('❌ Insufficient balance in your Spark Wallet to complete this Physiotherapy booking.');
      return;
    }

    const newApt = {
      id: `PHY-APT-${Math.floor(100 + Math.random() * 900)}`,
      patientEmail: userEmail,
      patientName: patientDetails.name,
      phone: patientDetails.phone,
      date: patientDetails.date,
      time: patientDetails.time,
      bookingType,
      fees: price,
      status: 'Confirmed',
      notes: patientDetails.notes,
      address: bookingType === 'Home' ? patientDetails.address : selectedPhysio.clinicName,
      created_at: new Date().toISOString()
    };

    // Save back to therapist's database so they see it!
    const emailKey = selectedPhysio.email.replace(/\./g, '_');
    const savedApts = localStorage.getItem(`ds_physio_appointments_${emailKey}`);
    const list = savedApts ? JSON.parse(savedApts) : [];
    const updated = [newApt, ...list];
    localStorage.setItem(`ds_physio_appointments_${emailKey}`, JSON.stringify(updated));

    // Update local state list
    const addedLocal = {
      ...newApt,
      physioName: selectedPhysio.name,
      physioEmail: selectedPhysio.email,
      physioSpecialty: selectedPhysio.specialty
    };
    const newAggregated = [addedLocal, ...appointments];
    setAppointments(newAggregated);

    // Reset selection
    setSelectedPhysio(null);

    addNotification('Physio Booked', `Successfully scheduled clinical visit with ${selectedPhysio.name}. Booking ID: ${newApt.id}`);
    alert(`✓ Physiotherapy Appointment Booked Successfully!\nID: ${newApt.id}\nPaid ₹${price} via Spark Wallet.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider">♿ Physical Physiotherapy rehabilitation</h3>
          <p className="text-xs text-gray-400">Book professional clinics or comfort-focused home therapies with expert physical therapists.</p>
        </div>
        {selectedPhysio && (
          <button
            onClick={() => setSelectedPhysio(null)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all cursor-pointer"
          >
            ← Back to Specialists
          </button>
        )}
      </div>

      {!selectedPhysio ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search therapists by name, rehabilitation specialty, or clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Grid list of therapists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhysios.map((phy) => (
              <div 
                key={phy.id} 
                className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs hover:border-[#0A6E6E] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[8px] bg-teal-50 text-[#0A6E6E] border border-teal-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {phy.experience}+ Years Experience
                    </span>
                    <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      Verified
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-800">{phy.name}</h4>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-0.5 tracking-wider text-indigo-700 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" /> {phy.specialty}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs font-medium text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-300" /> {phy.clinicName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-300" /> {phy.city} - {phy.pincode}
                    </p>
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50 text-[10px] bg-slate-50 rounded-xl p-2.5">
                    <div>
                      <span className="block text-gray-400 font-bold">CLINIC SESSION</span>
                      <strong className="text-slate-800 text-xs font-black">₹{phy.feesClinic}</strong>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-bold">HOME APPOINTMENT</span>
                      <strong className="text-slate-800 text-xs font-black">₹{phy.feesHome}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => setSelectedPhysio(phy)}
                    className="w-full py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Select & Book Schedule
                  </button>
                </div>
              </div>
            ))}

            {filteredPhysios.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 font-bold bg-slate-50 rounded-2xl">
                No physical therapists found.
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Selected Profile detail block */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 space-y-5">
              <div className="flex gap-4 items-start border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100 text-xl font-bold text-[#0A6E6E]">
                  ♿
                </div>
                <div>
                  <h4 className="text-base font-black text-[#1A2B3C]">{selectedPhysio.name}</h4>
                  <p className="text-xs text-indigo-700 font-extrabold uppercase tracking-wide">{selectedPhysio.specialty}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedPhysio.clinicName} | Experience: {selectedPhysio.experience} Years</p>
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-black text-[#1A2B3C] uppercase tracking-widest mb-2">Clinical Qualifications & Specialties</h5>
                <ul className="text-xs font-semibold text-gray-500 space-y-2 list-disc pl-4">
                  <li>Specialist orthopedic and spinal alignments</li>
                  <li>Post-surgical recovery & ligamentous sports injury rehabilitation</li>
                  <li>In-depth geriatric mobility and musculoskeletal alignment correction</li>
                  <li>State-of-the-art ultrasound, TENS, and therapeutic exercise integrations</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex gap-2">
                  <span className="text-lg">🏥</span>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-400">Clinic Visitation Fees</span>
                    <strong className="text-slate-800 text-xs font-black">₹{selectedPhysio.feesClinic}</strong>
                  </div>
                </div>
                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex gap-2">
                  <span className="text-lg">🏡</span>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-gray-400">Physio Home Visitation Fees</span>
                    <strong className="text-slate-800 text-xs font-black">₹{selectedPhysio.feesHome}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking configuration Form */}
          <div>
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                Configure Therapy Session
              </h4>

              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs mt-4">
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Session Location Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingType('Clinic')}
                      className={`py-1.5 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                        bookingType === 'Clinic' ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      🏥 Clinic Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('Home')}
                      className={`py-1.5 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                        bookingType === 'Home' ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      🏡 Home Visit
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Patient Registered Name</label>
                  <input
                    type="text"
                    value={patientDetails.name}
                    onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Date</label>
                    <input
                      type="date"
                      value={patientDetails.date}
                      onChange={(e) => setPatientDetails({ ...patientDetails, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Time Slot</label>
                    <input
                      type="text"
                      value={patientDetails.time}
                      onChange={(e) => setPatientDetails({ ...patientDetails, time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {bookingType === 'Home' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Full Home Address</label>
                    <textarea
                      value={patientDetails.address}
                      onChange={(e) => setPatientDetails({ ...patientDetails, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                      rows={2}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Chief Complaint / Injury Details</label>
                  <textarea
                    value={patientDetails.notes}
                    onChange={(e) => setPatientDetails({ ...patientDetails, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Pay ₹{bookingType === 'Clinic' ? selectedPhysio.feesClinic : selectedPhysio.feesHome} & Confirm
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* Appointment History */}
      <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">Your Physiotherapy Appointment History</h4>
        <p className="text-xs text-gray-400 mb-4">View treatment progress schedules, doctor timings, and rehabilitation program files.</p>

        <div className="space-y-4">
          {appointments.map((a) => (
            <div key={a.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#0A6E6E]">{a.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    a.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    a.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {a.status}
                  </span>
                  <span className="text-gray-400 font-bold">{a.bookingType} Visitation</span>
                </div>
                <h5 className="font-extrabold text-[#1A2B3C] text-sm mt-1">{a.physioName}</h5>
                <p className="text-gray-400 font-medium mt-0.5">{a.physioSpecialty} | Email: {a.physioEmail}</p>
                <p className="text-gray-400 font-medium">Scheduled Treatment Slot: {a.date} at {a.time}</p>
                {a.notes && <p className="text-gray-500 italic mt-1 font-semibold">" {a.notes} "</p>}
              </div>

              <div className="text-right shrink-0">
                <span className="font-black text-[#1A2B3C] text-sm block">Session Fees: ₹{a.fees}</span>
              </div>
            </div>
          ))}

          {appointments.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-semibold bg-slate-50 rounded-xl">
              No physical therapy appointments requested yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
