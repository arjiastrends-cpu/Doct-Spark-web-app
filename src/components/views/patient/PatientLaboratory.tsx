/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText, 
  Beaker, 
  Filter, 
  Activity, 
  ShieldCheck,
  User,
  Plus
} from 'lucide-react';

interface PatientLaboratoryProps {
  userEmail: string;
  addNotification: (title: string, message: string) => void;
  walletBalance: number;
  deductFromWallet: (amount: number, reason: string) => boolean;
}

export default function PatientLaboratory({ userEmail, addNotification, walletBalance, deductFromWallet }: PatientLaboratoryProps) {
  // 1. Core State
  const [labs, setLabs] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'tests' | 'packages'>('all');
  const [selectedLab, setSelectedLab] = React.useState<any | null>(null);
  
  // 2. Test Lists by Lab
  const [labTests, setLabTests] = React.useState<any[]>([]);
  const [labPkgs, setLabPkgs] = React.useState<any[]>([]);

  // 3. Cart & Booking Form State
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);
  const [bookingType, setBookingType] = React.useState<'Home' | 'Lab'>('Lab');
  const [patientDetails, setPatientDetails] = React.useState({
    name: 'Aarav Mehta',
    age: 28,
    gender: 'Male',
    phone: '9876543210',
    address: 'Bandra West, Link Road',
    pincode: '400050',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM'
  });

  // 4. Booking History
  const [bookings, setBookings] = React.useState<any[]>([]);

  // Load labs & bookings from local storage
  React.useEffect(() => {
    // Labs load
    const savedLabs = localStorage.getItem('ds_laboratories');
    if (savedLabs) {
      setLabs(JSON.parse(savedLabs));
    } else {
      // Default Mock Lab if empty
      const defaultLabs = [
        { id: 'lab-1', name: 'Spark Diagnostics - Bandra West', email: 'bandra@sparklabs.in', phone: '9920104829', city: 'Mumbai', address: 'Plot 42, Waterfield Road, Bandra West', pincode: '400050', status: 'Approved' },
        { id: 'lab-2', name: 'Metropolis Health Center', email: 'metropolis@health.com', phone: '9833481234', city: 'Mumbai', address: 'Shop 5, Sunrise Arcade, Andheri East', pincode: '400069', status: 'Approved' }
      ];
      localStorage.setItem('ds_laboratories', JSON.stringify(defaultLabs));
      setLabs(defaultLabs);
    }

    // Bookings load
    const savedBookings = localStorage.getItem('ds_lab_bookings');
    if (savedBookings) {
      const all = JSON.parse(savedBookings);
      // filter for this patient
      setBookings(all.filter((b: any) => b.patientEmail === userEmail));
    } else {
      const defaultBookings = [
        {
          id: 'LAB-BK-391',
          labId: 'lab-1',
          labName: 'Spark Diagnostics - Bandra West',
          patientEmail: userEmail,
          patientName: 'Aarav Mehta',
          itemName: 'Complete Hemogram (CBC)',
          type: 'tests',
          bookingType: 'Home',
          price: 450,
          date: '2026-07-04',
          time: '08:30 AM',
          status: 'Completed',
          reportUrl: 'data:text/plain;base64,Q0JDIFJlcG9ydDogSGVtb2dsb2JpbjogMTQuNSBnL2RMLCBSQkM6IDUuMiBNL3VMLCBXQkM6IDY1MDAgL3VMLCBQbGF0ZWxldHM6IDIuNUwgL3VMCg==',
          reportName: 'CBC_Report_Aarav.pdf'
        }
      ];
      localStorage.setItem('ds_lab_bookings', JSON.stringify(defaultBookings));
      setBookings(defaultBookings.filter((b: any) => b.patientEmail === userEmail));
    }
  }, [userEmail]);

  // Load tests & packages when lab is selected
  React.useEffect(() => {
    if (selectedLab) {
      // Tests load
      const savedTests = localStorage.getItem(`ds_lab_tests_${selectedLab.id}`);
      const defaultTests = [
        { id: 't-101', name: 'Complete Hemogram (CBC)', price: 450, time: '12 Hours', code: 'CBC', desc: 'Measures RBC, WBC, Hemoglobin, Platelets and other parameters.' },
        { id: 't-102', name: 'HbA1c (Glycated Haemoglobin)', price: 600, time: '24 Hours', code: 'HBA1C', desc: 'Reflects average blood sugar levels over the past 3 months.' },
        { id: 't-103', name: 'Lipid Profile (Cholesterol)', price: 800, time: '12 Hours', code: 'LPD', desc: 'Measures LDL, HDL, Triglycerides, and Total Cholesterol levels.' },
        { id: 't-104', name: 'Thyroid Profile (T3, T4, TSH)', price: 750, time: '24 Hours', code: 'THY', desc: 'Evaluates thyroid hormone production and gland function.' }
      ];
      if (savedTests) {
        setLabTests(JSON.parse(savedTests));
      } else {
        localStorage.setItem(`ds_lab_tests_${selectedLab.id}`, JSON.stringify(defaultTests));
        setLabTests(defaultTests);
      }

      // Packages load
      const savedPkgs = localStorage.getItem(`ds_lab_pkgs_${selectedLab.id}`);
      const defaultPkgs = [
        { id: 'p-201', name: 'Comprehensive Wellness Package', price: 1999, testsCount: 52, time: '24 Hours', desc: 'Full body screening including Liver, Kidney, Lipid, Thyroid, Blood Sugar, and CBC.' },
        { id: 'p-202', name: 'Senior Citizen Health Screening', price: 2499, testsCount: 60, time: '36 Hours', desc: 'Aged care checkup including Arthritis panel, Cardiac markers, Liver profile, and Urine tests.' }
      ];
      if (savedPkgs) {
        setLabPkgs(JSON.parse(savedPkgs));
      } else {
        localStorage.setItem(`ds_lab_pkgs_${selectedLab.id}`, JSON.stringify(defaultPkgs));
        setLabPkgs(defaultPkgs);
      }
    } else {
      setLabTests([]);
      setLabPkgs([]);
    }
  }, [selectedLab]);

  // Search/Filter matching items across all labs or inside selected lab
  const filteredAllItems = React.useMemo(() => {
    // If a lab is selected, we filter its items. If not, we search laboratories
    return labs.filter(lab => 
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lab.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.pincode.includes(searchQuery)
    );
  }, [labs, searchQuery]);

  // Handle Booking submission
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab || !selectedItem) return;

    const price = selectedItem.price;

    // Try paying with wallet
    const success = deductFromWallet(price, `Diagnostic Test Booking: ${selectedItem.name}`);
    if (!success) {
      alert('❌ Insufficient balance in your Spark Wallet to complete this diagnostic booking.');
      return;
    }

    const newBooking = {
      id: `LAB-BK-${Math.floor(100 + Math.random() * 900)}`,
      labId: selectedLab.id,
      labName: selectedLab.name,
      patientEmail: userEmail,
      patientName: patientDetails.name,
      itemName: selectedItem.name,
      type: selectedItem.testsCount ? 'packages' : 'tests',
      bookingType,
      price,
      date: patientDetails.date,
      time: patientDetails.time,
      status: 'Pending',
      address: bookingType === 'Home' ? `${patientDetails.address}, Pincode: ${patientDetails.pincode}` : selectedLab.address
    };

    // Save to global list
    const savedBookings = localStorage.getItem('ds_lab_bookings');
    const list = savedBookings ? JSON.parse(savedBookings) : [];
    const updated = [newBooking, ...list];
    localStorage.setItem('ds_lab_bookings', JSON.stringify(updated));

    // Update local list
    setBookings(updated.filter((b: any) => b.patientEmail === userEmail));
    setSelectedItem(null);

    addNotification('Diagnostic Booked', `Successfully booked ${newBooking.itemName} with ${newBooking.labName}. Booking ID: ${newBooking.id}`);
    alert(`✓ Diagnostic Booking successful!\nID: ${newBooking.id}\nPaid: ₹${price} via Spark Wallet.`);
  };

  const handleDownloadReport = (b: any) => {
    if (!b.reportUrl) {
      alert('Report is not generated yet.');
      return;
    }
    // Create link and download
    const link = document.createElement('a');
    link.href = b.reportUrl;
    link.download = b.reportName || 'Diagnostic_Report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider">🔬 Diagnostic Labs & Health Packages</h3>
          <p className="text-xs text-gray-400">Search labs, schedule home sample collections, and download lab reports instantly.</p>
        </div>
        {selectedLab && (
          <button
            onClick={() => setSelectedLab(null)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all cursor-pointer"
          >
            ← Back to Laboratories
          </button>
        )}
      </div>

      {!selectedLab ? (
        <div className="space-y-6">
          {/* Main Labs search block */}
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search labs by name, city, or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#D1E5E5] rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <span className="text-[10px] uppercase font-extrabold text-gray-400">Spark Verified Only</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>

          {/* Laboratories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAllItems.map((lab) => (
              <div 
                key={lab.id} 
                className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs hover:border-[#0A6E6E] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      ★ 4.8 Rating
                    </span>
                    <span className="text-[8px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-[#1A2B3C] leading-snug">{lab.name}</h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    {lab.address}, {lab.city} - {lab.pincode}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Phone: {lab.phone}</p>
                </div>

                <div className="pt-4 border-t border-slate-50 mt-4">
                  <button
                    onClick={() => setSelectedLab(lab)}
                    className="w-full py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center"
                  >
                    Browse Tests & Packages
                  </button>
                </div>
              </div>
            ))}

            {filteredAllItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 font-bold bg-slate-50 rounded-2xl">
                No verified diagnostic laboratories found.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Lab tests & packages catalogue list */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Laboratories Menu for {selectedLab.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Select a diagnostic pathology test or full-body health package.</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded ${
                      filterType === 'all' ? 'bg-[#0A6E6E] text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('tests')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded ${
                      filterType === 'tests' ? 'bg-[#0A6E6E] text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    Individual Tests
                  </button>
                  <button
                    onClick={() => setFilterType('packages')}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase rounded ${
                      filterType === 'packages' ? 'bg-[#0A6E6E] text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    Packages
                  </button>
                </div>
              </div>

              {/* Individual Tests Catalogue */}
              {(filterType === 'all' || filterType === 'tests') && (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">🧪 Individual Pathology Tests</h5>
                  {labTests.map(t => (
                    <div key={t.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs hover:border-slate-300 transition-all">
                      <div>
                        <h6 className="font-extrabold text-[#1A2B3C]">{t.name} ({t.code})</h6>
                        <p className="text-gray-400 text-[10px] font-medium mt-0.5">{t.desc}</p>
                        <span className="text-[9px] text-gray-400 block mt-1">TAT / Reports in: <strong className="font-semibold">{t.time}</strong></span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-black text-[#0A6E6E] text-sm">₹{t.price}</span>
                        <button
                          onClick={() => setSelectedItem(t)}
                          className="mt-2 px-3 py-1 bg-teal-50 text-[#0A6E6E] border border-teal-200 hover:bg-teal-100 text-[10px] font-extrabold rounded-md cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Packages Catalogue */}
              {(filterType === 'all' || filterType === 'packages') && (
                <div className="space-y-3 mt-6">
                  <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">🎁 Health & Wellness Packages</h5>
                  {labPkgs.map(p => (
                    <div key={p.id} className="p-4 border border-[#D1E5E5] rounded-xl bg-gradient-to-br from-emerald-50/20 to-white flex justify-between items-center text-xs hover:border-emerald-300 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-extrabold text-[#1A2B3C]">{p.name}</h6>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[8px] font-black uppercase tracking-wider">
                            {p.testsCount} Parameters
                          </span>
                        </div>
                        <p className="text-gray-400 text-[10px] font-medium mt-1">{p.desc}</p>
                        <span className="text-[9px] text-gray-400 block mt-1">Report Delivery: <strong className="font-semibold">{p.time}</strong></span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-black text-emerald-700 text-sm">₹{p.price}</span>
                        <button
                          onClick={() => setSelectedItem(p)}
                          className="mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-extrabold rounded-md cursor-pointer"
                        >
                          Book Package
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Form Overlay side view */}
          <div className="space-y-6">
            {selectedItem ? (
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-xs">
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
                  Configure Lab Booking
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5 mt-4">
                  <p className="text-gray-400 uppercase text-[9px] font-bold">Selected Service</p>
                  <p className="font-extrabold text-[#1A2B3C]">{selectedItem.name}</p>
                  <p className="font-black text-[#0A6E6E] text-sm">Earning Charge: ₹{selectedItem.price}</p>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs mt-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Sample Collection Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingType('Lab')}
                        className={`py-1.5 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                          bookingType === 'Lab' ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Visit Diagnostic Lab
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingType('Home')}
                        className={`py-1.5 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                          bookingType === 'Home' ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Home Blood Sample
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Patient Name</label>
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
                      <label className="font-bold text-slate-600 block">Age</label>
                      <input
                        type="number"
                        value={patientDetails.age}
                        onChange={(e) => setPatientDetails({ ...patientDetails, age: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Gender</label>
                      <select
                        value={patientDetails.gender}
                        onChange={(e) => setPatientDetails({ ...patientDetails, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {bookingType === 'Home' && (
                    <>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block">Home Address</label>
                        <textarea
                          value={patientDetails.address}
                          onChange={(e) => setPatientDetails({ ...patientDetails, address: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                          rows={2}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600 block">Pincode</label>
                        <input
                          type="text"
                          value={patientDetails.pincode}
                          onChange={(e) => setPatientDetails({ ...patientDetails, pincode: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Pref Date</label>
                      <input
                        type="date"
                        value={patientDetails.date}
                        onChange={(e) => setPatientDetails({ ...patientDetails, date: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Pref Time slot</label>
                      <input
                        type="text"
                        value={patientDetails.time}
                        onChange={(e) => setPatientDetails({ ...patientDetails, time: e.target.value })}
                        placeholder="e.g., 09:30 AM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-xl cursor-pointer shadow-xs text-center justify-center flex"
                  >
                    Confirm & Book (Pay ₹{selectedItem.price})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-xs font-semibold text-gray-400 py-12">
                Click "Book Now" on any diagnostic test to configure home collection or clinic appointments.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking History & Status, Reports Download */}
      <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6">
        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">Your Laboratory Diagnostic Bookings</h4>
        <p className="text-xs text-gray-400 mb-4">View upcoming appointments, tracking real-time status and download report copies.</p>

        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#0A6E6E]">{b.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    b.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.status}
                  </span>
                  <span className="text-gray-400 font-medium">Type: {b.bookingType} Collection</span>
                </div>
                <h5 className="font-extrabold text-[#1A2B3C] text-sm mt-1">{b.itemName}</h5>
                <p className="text-gray-400 font-medium mt-0.5">Lab: {b.labName} | Patient: {b.patientName}</p>
                <p className="text-gray-400 font-medium">Scheduled slot: {b.date} at {b.time}</p>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <span className="font-black text-[#1A2B3C]">₹{b.price}</span>
                {b.status === 'Completed' && b.reportUrl ? (
                  <button
                    onClick={() => handleDownloadReport(b)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-black text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download Report
                  </button>
                ) : b.status === 'Completed' ? (
                  <span className="text-[10px] text-gray-400 italic">Report processing</span>
                ) : (
                  <span className="text-[10px] text-gray-400 italic">Collection slot active</span>
                )}
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-semibold bg-slate-50 rounded-xl">
              No diagnostic pathology bookings or health packages requested yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
