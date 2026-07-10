/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SlidersHorizontal, MapPin, BadgeCheck, RotateCcw, Search, Calendar, ChevronDown, FlaskConical, Dumbbell, Building2, Stethoscope, Star, Clock, Phone, AlertCircle } from 'lucide-react';
import { MOCK_DOCTORS, INDIAN_CITIES, GEOGRAPHY_DATA } from '../../data/mockData';
import { Doctor, QuickFilterState } from '../../types';
import DoctorCard from '../common/DoctorCard';

interface DoctorListingProps {
  setView: (view: string) => void;
  setSelectedDoctorId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchCity: string;
  setSearchCity: (c: string) => void;
  initialFilters?: QuickFilterState | null;
  setInitialFilters?: (filters: QuickFilterState | null) => void;
}

export default function DoctorListing({
  setView,
  setSelectedDoctorId,
  searchQuery,
  setSearchQuery,
  searchCity,
  setSearchCity,
  initialFilters,
  setInitialFilters
}: DoctorListingProps) {
  // Filters State
  const [selectedSpecialty, setSelectedSpecialty] = React.useState(searchQuery);
  const [selectedState, setSelectedState] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState('');
  const [selectedCity, setSelectedCity] = React.useState(searchCity);
  const [consultationType, setConsultationType] = React.useState<'All' | 'In-Clinic' | 'Video'>('All');
  const [availability, setAvailability] = React.useState<'All' | 'Today' | 'Tomorrow' | 'This Week'>('All');
  const [feeRange, setFeeRange] = React.useState<number>(2000);
  const [experienceRange, setExperienceRange] = React.useState<'All' | '0-5' | '5-10' | '10+'>('All');
  const [selectedGender, setSelectedGender] = React.useState<'Any' | 'Male' | 'Female'>('Any');
  const [ratingThreshold, setRatingThreshold] = React.useState<number>(0);
  const [sortBy, setSortBy] = React.useState<'Relevance' | 'Rating' | 'Experience' | 'Fee'>('Relevance');

  // Input fields for keyword search inside results
  const [keywordInput, setKeywordInput] = React.useState(searchQuery);

  // Synchronize initial filters passed from external view (e.g., homepage quick filters)
  React.useEffect(() => {
    if (initialFilters) {
      if (initialFilters.consultationType !== undefined) {
        setConsultationType(initialFilters.consultationType);
      }
      if (initialFilters.availability !== undefined) {
        setAvailability(initialFilters.availability);
      }
      if (initialFilters.feeRange !== undefined) {
        setFeeRange(initialFilters.feeRange);
      }
      if (initialFilters.ratingThreshold !== undefined) {
        setRatingThreshold(initialFilters.ratingThreshold);
      }
      if (initialFilters.sortBy !== undefined) {
        setSortBy(initialFilters.sortBy);
      }
      // Instantly clear to avoid infinite reset loops or sticking
      if (setInitialFilters) {
        setInitialFilters(null);
      }
    }
  }, [initialFilters, setInitialFilters]);

  // Synchronize internal state with changes from parent props
  React.useEffect(() => {
    setSelectedSpecialty(searchQuery);
    setKeywordInput(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    setSelectedCity(searchCity);
    if (searchCity) {
      const foundState = GEOGRAPHY_DATA.find(s => 
        s.districts.some(d => d.cities.some(c => c.toLowerCase() === searchCity.toLowerCase()))
      );
      if (foundState) {
        setSelectedState(foundState.stateName);
        const foundDistrict = foundState.districts.find(d => 
          d.cities.some(c => c.toLowerCase() === searchCity.toLowerCase())
        );
        if (foundDistrict) {
          setSelectedDistrict(foundDistrict.districtName);
        }
      }
    } else {
      setSelectedState('');
      setSelectedDistrict('');
    }
  }, [searchCity]);

  // Handle resets
  const handleResetFilters = () => {
    setSelectedSpecialty('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedCity('');
    setConsultationType('All');
    setAvailability('All');
    setFeeRange(2000);
    setExperienceRange('All');
    setSelectedGender('Any');
    setRatingThreshold(0);
    setSortBy('Relevance');
    setSearchQuery('');
    setSearchCity('');
    setKeywordInput('');
  };

  const [activeTab, setActiveTab] = React.useState<'doctors' | 'clinics' | 'laboratories' | 'physiotherapy'>('doctors');

  React.useEffect(() => {
    if (searchQuery.toLowerCase().includes('lab')) {
      setActiveTab('laboratories');
    } else if (searchQuery.toLowerCase().includes('physio')) {
      setActiveTab('physiotherapy');
    } else if (searchQuery.toLowerCase().includes('clinic')) {
      setActiveTab('clinics');
    } else {
      setActiveTab('doctors');
    }
  }, [searchQuery]);

  // Load clinics list
  const clinicsList = React.useMemo(() => {
    const saved = localStorage.getItem('ds_clinics');
    const defaultClinics = [
      { id: 'clinic-1', name: 'Apex Cardiology & MultiSpecialty Center', address: 'Plot 101, Waterfield Road, Bandra West', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', timings: '09:00 AM - 08:00 PM', rating: 4.8, doctors: ['doc-1', 'doc-2'], photos: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600'] },
      { id: 'clinic-2', name: 'Metro Integrative Dental & Wellness Lab', address: 'Suite 203, Prime Arcade, Sector 15', city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Delhi NCR', timings: '08:00 AM - 09:00 PM', rating: 4.6, doctors: ['doc-3'], photos: ['https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600'] }
    ];
    return saved ? JSON.parse(saved) : defaultClinics;
  }, []);

  // Load laboratories list
  const laboratoriesList = React.useMemo(() => {
    const saved = localStorage.getItem('ds_laboratories');
    const defaultLabs = [
      { id: 'lab-1', name: 'Spark Diagnostics - Bandra West', email: 'bandra@sparklabs.in', phone: '9920104829', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', address: 'Plot 42, Waterfield Road, Bandra West', pincode: '400050', status: 'Approved' },
      { id: 'lab-2', name: 'Metropolis Health Center', email: 'metropolis@health.com', phone: '9833481234', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', address: 'Shop 5, Sunrise Arcade, Andheri East', pincode: '400069', status: 'Approved' },
      { id: 'lab-demo-2', name: 'Metro Diagnostics & Imaging', ownerName: 'Dr. Suresh Mehta', email: 'metro@doctspark.in', phone: '9876543211', licenseNumber: 'MC-1102-NABL', address: 'Apex Diagnostic Hub, Suite B, Thane West', city: 'Thane', district: 'Thane', state: 'Maharashtra', pincode: '400601', status: 'Approved' }
    ];
    return saved ? JSON.parse(saved) : defaultLabs;
  }, []);

  // Load physiotherapists list
  const physiotherapistsList = React.useMemo(() => {
    const saved = localStorage.getItem('ds_physiotherapists');
    const defaultPhysios = [
      { id: 'physio-seed-1', name: 'Relief Point Physiotherapy', therapistName: 'Dr. Neha Sharma (PT)', email: 'neha.physio@doctspark.in', phone: '9822334455', registrationNumber: 'IAP-77621-PT', specialty: 'Sports Physiotherapy', experience: 7, address: 'MG Road, Camp', city: 'Pune', district: 'Pune', state: 'Maharashtra', pincode: '411001', status: 'Approved' },
      { id: 'physio-seed-2', name: 'Active Life Physio Clinic', therapistName: 'Dr. Amit Patel (PT)', email: 'amit.physio@doctspark.in', phone: '9811223344', registrationNumber: 'IAP-99012-PT', specialty: 'Orthopedic Physiotherapy', experience: 12, address: 'Bandra West', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', pincode: '400050', status: 'Approved' }
    ];
    return saved ? JSON.parse(saved) : defaultPhysios;
  }, []);

  const filteredClinics = React.useMemo(() => {
    let list = [...clinicsList];
    if (selectedState) {
      list = list.filter(item => item.state?.toLowerCase() === selectedState.toLowerCase());
    }
    if (selectedDistrict) {
      list = list.filter(item => item.district?.toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (selectedCity) {
      list = list.filter(item => item.city?.toLowerCase() === selectedCity.toLowerCase());
    }
    if (keywordInput.trim()) {
      const kw = keywordInput.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(kw) || item.address.toLowerCase().includes(kw));
    }
    return list;
  }, [clinicsList, selectedState, selectedDistrict, selectedCity, keywordInput]);

  const filteredLaboratories = React.useMemo(() => {
    let list = [...laboratoriesList];
    if (selectedState) {
      list = list.filter(item => item.state?.toLowerCase() === selectedState.toLowerCase());
    }
    if (selectedDistrict) {
      list = list.filter(item => item.district?.toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (selectedCity) {
      list = list.filter(item => item.city?.toLowerCase() === selectedCity.toLowerCase());
    }
    if (keywordInput.trim()) {
      const kw = keywordInput.toLowerCase();
      list = list.filter(item => item.name.toLowerCase().includes(kw) || item.address.toLowerCase().includes(kw));
    }
    return list;
  }, [laboratoriesList, selectedState, selectedDistrict, selectedCity, keywordInput]);

  const filteredPhysios = React.useMemo(() => {
    let list = [...physiotherapistsList];
    if (selectedState) {
      list = list.filter(item => item.state?.toLowerCase() === selectedState.toLowerCase());
    }
    if (selectedDistrict) {
      list = list.filter(item => item.district?.toLowerCase() === selectedDistrict.toLowerCase());
    }
    if (selectedCity) {
      list = list.filter(item => item.city?.toLowerCase() === selectedCity.toLowerCase());
    }
    if (keywordInput.trim()) {
      const kw = keywordInput.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(kw) || 
        item.therapistName.toLowerCase().includes(kw) || 
        item.specialty.toLowerCase().includes(kw) || 
        item.address.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [physiotherapistsList, selectedState, selectedDistrict, selectedCity, keywordInput]);

  const [doctorsList, setDoctorsList] = React.useState<Doctor[]>(() => {
    const saved = localStorage.getItem('ds_doctors');
    const parsed = saved ? JSON.parse(saved) : [...MOCK_DOCTORS];
    return parsed.filter((d: any) => !d.name.includes('Simulated') && !d.name.includes('Sandbox'));
  });

  const handleDeleteDoctor = (id: string) => {
    if (window.confirm("Are you sure you want to delete this doctor's profile from the website? This action is permanent.")) {
      const updated = doctorsList.filter(d => d.id !== id);
      setDoctorsList(updated);
      localStorage.setItem('ds_doctors', JSON.stringify(updated));
    }
  };

  const handleDeleteAllDoctors = () => {
    if (window.confirm("⚠️ DANGER: Are you absolutely sure you want to delete ALL doctor profiles from the website? This will clear the entire list.")) {
      setDoctorsList([]);
      localStorage.setItem('ds_doctors', JSON.stringify([]));
    }
  };

  const filteredDoctors = React.useMemo(() => {
    let list = [...doctorsList];

    // Filter by Keyword / Name / Specialty
    if (keywordInput.trim()) {
      const kw = keywordInput.toLowerCase();
      list = list.filter(
        doc =>
          doc.name.toLowerCase().includes(kw) ||
          doc.specialty.toLowerCase().includes(kw) ||
          doc.clinicName.toLowerCase().includes(kw)
      );
    } else if (selectedSpecialty) {
      list = list.filter(doc => doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase());
    }

    // Filter by City
    if (selectedCity) {
      list = list.filter(doc => doc.city.toLowerCase() === selectedCity.toLowerCase());
    }

    // Filter by Consultation type
    if (consultationType === 'In-Clinic') {
      list = list.filter(doc => doc.feeInClinic > 0);
    } else if (consultationType === 'Video') {
      list = list.filter(doc => doc.feeVideo > 0);
    }

    // Filter by Availability
    if (availability === 'Today') {
      list = list.filter(doc => doc.nextAvailable.toLowerCase().includes('today'));
    } else if (availability === 'Tomorrow') {
      list = list.filter(doc => doc.nextAvailable.toLowerCase().includes('tomorrow'));
    }

    // Filter by Fee Range (less than or equal to chosen slider value)
    list = list.filter(doc => Math.min(doc.feeInClinic, doc.feeVideo) <= feeRange);

    // Filter by Experience Years
    if (experienceRange === '0-5') {
      list = list.filter(doc => doc.experience <= 5);
    } else if (experienceRange === '5-10') {
      list = list.filter(doc => doc.experience > 5 && doc.experience <= 10);
    } else if (experienceRange === '10+') {
      list = list.filter(doc => doc.experience > 10);
    }

    // Filter by Gender
    if (selectedGender !== 'Any') {
      // Simple logic mapping doctor names/photos to genders
      if (selectedGender === 'Female') {
        list = list.filter(doc => doc.name.includes('Anjali') || doc.name.includes('Preeti') || doc.name.includes('Meera'));
      } else {
        list = list.filter(doc => !doc.name.includes('Anjali') && !doc.name.includes('Preeti') && !doc.name.includes('Meera'));
      }
    }

    // Filter by Rating
    if (ratingThreshold > 0) {
      list = list.filter(doc => doc.rating >= ratingThreshold);
    }

    // Sorting implementation
    if (sortBy === 'Rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'Experience') {
      list.sort((a, b) => b.experience - a.experience);
    } else if (sortBy === 'Fee') {
      list.sort((a, b) => Math.min(a.feeInClinic, a.feeVideo) - Math.min(b.feeInClinic, b.feeVideo));
    }

    return list;
  }, [
    doctorsList,
    keywordInput,
    selectedSpecialty,
    selectedCity,
    consultationType,
    availability,
    feeRange,
    experienceRange,
    selectedGender,
    ratingThreshold,
    sortBy
  ]);

  const handleBook = (id: string) => {
    setSelectedDoctorId(id);
    setView('booking');
  };

  const handleViewProfile = (id: string) => {
    setSelectedDoctorId(id);
    setView('doctor-profile');
  };

  const uniqueSpecialties = Array.from(new Set(doctorsList.map(d => d.specialty)));

  return (
    <div className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-4 flex flex-col lg:h-[calc(100vh-140px)] lg:overflow-hidden" id="doctor-listing-root">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#1A2B3C] font-heading tracking-tight leading-none">
            Consult Verified Specialists
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-bold flex items-center gap-1">
            <BadgeCheck className="w-4 h-4 text-[#0A6E6E]" /> Showing {filteredDoctors.length} doctors matching your criteria in {selectedCity || 'All Cities'}
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-[#D1E5E5] px-3.5 py-2 rounded-xl text-xs font-extrabold text-[#1A2B3C] shadow-xs">
          <span>Sort By:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="outline-none bg-transparent cursor-pointer text-[#0A6E6E] font-black"
          >
            <option value="Relevance">Relevance</option>
            <option value="Rating">Rating: High to Low</option>
            <option value="Experience">Years Experience</option>
            <option value="Fee">Fee: Low to High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 lg:overflow-hidden min-h-0">
        
        {/* LEFT SIDEBAR: FILTERS */}
        <aside className="bg-white rounded-2xl border border-[#D1E5E5]/80 p-4 flex flex-col gap-4 lg:overflow-y-auto lg:max-h-full scrollbar-none shrink-0" id="filters-sidebar">
          <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
            <span className="font-extrabold text-xs uppercase tracking-wider text-[#1A2B3C] flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0A6E6E]" /> Filters
            </span>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Specialty selection */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C] outline-none"
            >
              <option value="">All Specialties</option>
              {uniqueSpecialties.map((spec, index) => (
                <option key={spec || `spec-${index}`} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* State filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                const newState = e.target.value;
                setSelectedState(newState);
                setSelectedDistrict('');
                setSelectedCity('');
              }}
              className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg text-xs font-semibold text-[#1A2B3C] outline-none cursor-pointer"
            >
              <option value="">All States</option>
              {GEOGRAPHY_DATA.map((st, index) => (
                <option key={st.stateName || `state-${index}`} value={st.stateName}>{st.stateName}</option>
              ))}
            </select>
          </div>

          {/* District filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                const newDistrict = e.target.value;
                setSelectedDistrict(newDistrict);
                setSelectedCity('');
              }}
              disabled={!selectedState}
              className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg text-xs font-semibold text-[#1A2B3C] outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Districts</option>
              {selectedState && GEOGRAPHY_DATA.find(st => st.stateName === selectedState)?.districts.map((dst, index) => (
                <option key={dst.districtName || `dist-${index}`} value={dst.districtName}>{dst.districtName}</option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedDistrict}
              className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg text-xs font-semibold text-[#1A2B3C] outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">All Cities</option>
              {selectedState && selectedDistrict && GEOGRAPHY_DATA.find(st => st.stateName === selectedState)?.districts.find(dst => dst.districtName === selectedDistrict)?.cities.map((c, index) => (
                <option key={c || `city-${index}`} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Consultation Type checkboxes */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">Consultation Mode</label>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="consultType" 
                  checked={consultationType === 'All'} 
                  onChange={() => setConsultationType('All')}
                  className="accent-[#0A6E6E]"
                />
                All Consultations
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="consultType" 
                  checked={consultationType === 'In-Clinic'} 
                  onChange={() => setConsultationType('In-Clinic')}
                  className="accent-[#0A6E6E]"
                />
                In-Clinic Visit
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="consultType" 
                  checked={consultationType === 'Video'} 
                  onChange={() => setConsultationType('Video')}
                  className="accent-[#0A6E6E]"
                />
                HD Video Consultation
              </label>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">Availability</label>
            <div className="flex flex-col gap-1">
              {(['All', 'Today', 'Tomorrow', 'This Week'] as const).map(day => (
                <label key={day} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                  <input 
                    type="radio" 
                    name="avail" 
                    checked={availability === day} 
                    onChange={() => setAvailability(day)}
                    className="accent-[#0A6E6E]"
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          {/* Fee Range Slider */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">
              <span>Max Fee</span>
              <span className="text-[#0A6E6E] font-extrabold">₹{feeRange}</span>
            </div>
            <input 
              type="range" 
              min="300" 
              max="2000" 
              step="50" 
              value={feeRange}
              onChange={(e) => setFeeRange(Number(e.target.value))}
              className="w-full h-1 bg-[#D1E5E5] rounded-lg appearance-none cursor-pointer accent-[#0A6E6E]"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-0.5">
              <span>₹300</span>
              <span>₹2000</span>
            </div>
          </div>

          {/* Experience selection */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">Experience</label>
            <div className="flex flex-col gap-1">
              {(['All', '0-5', '5-10', '10+'] as const).map(exp => (
                <label key={exp} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                  <input 
                    type="radio" 
                    name="exp" 
                    checked={experienceRange === exp} 
                    onChange={() => setExperienceRange(exp)}
                    className="accent-[#0A6E6E]"
                  />
                  {exp === 'All' ? 'Any Experience' : `${exp} Years`}
                </label>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">Gender</label>
            <div className="flex flex-col gap-1">
              {(['Any', 'Male', 'Female'] as const).map(gen => (
                <label key={gen} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
                  <input 
                    type="radio" 
                    name="gender" 
                    checked={selectedGender === gen} 
                    onChange={() => setSelectedGender(gen)}
                    className="accent-[#0A6E6E]"
                  />
                  {gen}
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#1A2B3C] uppercase tracking-wider mb-1">Rating Threshold</label>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="rating" 
                  checked={ratingThreshold === 0} 
                  onChange={() => setRatingThreshold(0)}
                  className="accent-[#0A6E6E] w-4 h-4"
                />
                Any Rating
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="rating" 
                  checked={ratingThreshold === 4.7} 
                  onChange={() => setRatingThreshold(4.7)}
                  className="accent-[#0A6E6E] w-4 h-4"
                />
                4.7★ & above
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                <input 
                  type="radio" 
                  name="rating" 
                  checked={ratingThreshold === 4.9} 
                  onChange={() => setRatingThreshold(4.9)}
                  className="accent-[#0A6E6E] w-4 h-4"
                />
                4.9★ & above
              </label>
            </div>
          </div>

        </aside>

        {/* RIGHT SIDE: DOCTOR CARDS GRID */}
        <section className="lg:col-span-3 flex flex-col gap-4 lg:overflow-y-auto lg:max-h-full pb-8 scrollbar-none min-h-0" id="doctor-results-list">
          
          {/* Service Tabs */}
          <div className="flex border border-[#D1E5E5] rounded-xl overflow-hidden bg-white p-1 gap-1 shadow-xs shrink-0 flex-nowrap overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'doctors'
                  ? 'bg-[#0A6E6E] text-white'
                  : 'text-gray-600 hover:bg-[#F0F7F7]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctors ({filteredDoctors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('clinics')}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'clinics'
                  ? 'bg-[#0A6E6E] text-white'
                  : 'text-gray-600 hover:bg-[#F0F7F7]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Clinics ({filteredClinics.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('laboratories')}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'laboratories'
                  ? 'bg-[#0A6E6E] text-white'
                  : 'text-gray-600 hover:bg-[#F0F7F7]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Labs ({filteredLaboratories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('physiotherapy')}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'physiotherapy'
                  ? 'bg-[#0A6E6E] text-white'
                  : 'text-gray-600 hover:bg-[#F0F7F7]'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Physiotherapy ({filteredPhysios.length})</span>
            </button>
          </div>

          {/* Keyword Search inside results */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#D1E5E5]/70 flex items-center gap-3 shadow-xs shrink-0">
            <Search className="text-gray-400 w-4 h-4 shrink-0" />
            <input 
              type="text" 
              placeholder={`Search in ${activeTab}...`} 
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="w-full text-xs font-semibold text-[#1A2B3C] outline-none"
            />
            {keywordInput && (
              <button 
                onClick={() => setKeywordInput('')}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 px-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Listing Grid */}
          {activeTab === 'doctors' && (
            filteredDoctors.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {filteredDoctors.map((doc, index) => (
                  <DoctorCard 
                    key={doc.id || `doc-${index}`}
                    doctor={doc}
                    variant="horizontal"
                    onBook={handleBook}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#F0F7F7] text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4">
                  🩺
                </div>
                <h3 className="text-base font-extrabold text-[#1A2B3C] mb-1">No Doctors Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">
                  We couldn't find any verified specialists matching your criteria. Try adjusting the filters or resetting.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-[#0A6E6E] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            )
          )}

          {activeTab === 'clinics' && (
            filteredClinics.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {filteredClinics.map((clinic) => {
                  const associatedDoctors = doctorsList.filter(d => clinic.doctors?.includes(d.id));
                  return (
                    <div key={clinic.id} className="bg-white rounded-xl border border-[#D1E5E5] p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-5" id={`clinic-${clinic.id}`}>
                      {clinic.photos && clinic.photos[0] && (
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <img src={clinic.photos[0]} alt={clinic.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-sm font-extrabold text-[#1A2B3C] font-heading">{clinic.name}</h3>
                            <div className="flex items-center gap-1 text-xs font-bold text-[#1A2B3C]">
                              <Star className="w-3.5 h-3.5 text-[#F5A623] fill-current" />
                              <span>{clinic.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#0A6E6E]" />
                            <span>{clinic.address} ({clinic.city})</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-[#0A6E6E] font-bold mt-2">
                            <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                            <span>{clinic.timings}</span>
                          </div>
                          {associatedDoctors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-dashed border-gray-100">
                              <span className="text-[10px] text-gray-400 font-bold self-center uppercase">Practicing:</span>
                              {associatedDoctors.map(doc => (
                                <div
                                  key={doc.id}
                                  onClick={() => handleViewProfile(doc.id)}
                                  className="flex items-center gap-1 bg-[#F0F7F7] px-2 py-0.5 rounded-full border border-[#D1E5E5] cursor-pointer text-[10px] font-bold text-[#0A6E6E] hover:bg-[#0A6E6E] hover:text-white transition-all"
                                >
                                  <span>{doc.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => alert(`Address: ${clinic.address}\nTimings: ${clinic.timings}`)}
                            className="px-3 py-1.5 border border-[#D1E5E5] text-gray-600 font-bold text-[11px] rounded-lg hover:bg-gray-50"
                            id={`contact-clinic-${clinic.id}`}
                          >
                            Contact Desk
                          </button>
                          <button
                            onClick={() => {
                              if (associatedDoctors.length > 0) {
                                handleBook(associatedDoctors[0].id);
                              } else {
                                alert('No doctors registered this hour.');
                              }
                            }}
                            className="px-4 py-1.5 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 font-bold text-[11px] rounded-lg shadow-xs"
                            id={`book-clinic-${clinic.id}`}
                          >
                            Book Visit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#F0F7F7] text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4">
                  🏢
                </div>
                <h3 className="text-base font-extrabold text-[#1A2B3C] mb-1">No Clinics Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">
                  No group clinics matching your criteria were found. Try adjusting the search filters.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-[#0A6E6E] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            )
          )}

          {activeTab === 'laboratories' && (
            filteredLaboratories.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {filteredLaboratories.map((lab) => (
                  <div key={lab.id} className="bg-white rounded-xl border border-[#D1E5E5] p-5 hover:shadow-md transition-all flex gap-4 items-start" id={`lab-${lab.id}`}>
                    <div className="w-12 h-12 bg-[#F0F7F7] border border-[#D1E5E5] text-[#0A6E6E] rounded-xl flex items-center justify-center shrink-0">
                      <FlaskConical className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-extrabold text-[#1A2B3C] font-heading">{lab.name}</h3>
                          <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#0A6E6E]" />
                            <span>{lab.address} ({lab.city})</span>
                          </p>
                        </div>
                        <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          NABL Accredited
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-[#F0F7F7]/50 border border-[#D1E5E5]/40 p-2.5 rounded-lg mt-3 text-xs">
                        <div>
                          <span className="text-gray-400 font-bold text-[9px] uppercase block">Phone / Helpline</span>
                          <span className="text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#0A6E6E]" />
                            {lab.phone || '9920104829'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold text-[9px] uppercase block">Email Address</span>
                          <span className="text-slate-700 font-semibold block mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{lab.email || 'care@sparklabs.in'}</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => alert(`Contacting ${lab.name} support desk at: ${lab.phone || '9920104829'}`)}
                          className="px-3 py-1.5 border border-[#D1E5E5] text-gray-600 font-bold text-[11px] rounded-lg hover:bg-gray-50"
                          id={`call-lab-${lab.id}`}
                        >
                          Call Hotline
                        </button>
                        <button
                          onClick={() => {
                            alert(`Successfully scheduled a NABL Home Sample Collection request with ${lab.name}. Our technician will call you within 30 minutes.`);
                          }}
                          className="px-4 py-1.5 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 font-bold text-[11px] rounded-lg shadow-xs"
                          id={`book-lab-${lab.id}`}
                        >
                          Book Home Collection
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#F0F7F7] text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4">
                  🧪
                </div>
                <h3 className="text-base font-extrabold text-[#1A2B3C] mb-1">No Laboratories Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">
                  No laboratories matching your criteria were found. Try adjusting the search filters.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-[#0A6E6E] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            )
          )}

          {activeTab === 'physiotherapy' && (
            filteredPhysios.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {filteredPhysios.map((ph) => (
                  <div key={ph.id} className="bg-white rounded-xl border border-[#D1E5E5] p-5 hover:shadow-md transition-all flex gap-4 items-start" id={`physio-${ph.id}`}>
                    <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-[#F5A623] rounded-xl flex items-center justify-center shrink-0">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-extrabold text-[#1A2B3C] font-heading">{ph.therapistName}</h3>
                          <p className="text-[11px] text-[#0A6E6E] font-bold uppercase mt-0.5">{ph.specialty} • {ph.experience || 8} Years Exp</p>
                          <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#0A6E6E]" />
                            <span>{ph.name} - {ph.address} ({ph.city})</span>
                          </p>
                        </div>
                        <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          IAP Certified
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-[#F0F7F7]/50 border border-[#D1E5E5]/40 p-2.5 rounded-lg mt-3 text-xs">
                        <div>
                          <span className="text-gray-400 font-bold text-[9px] uppercase block">Registration Code</span>
                          <span className="text-slate-700 font-bold block mt-0.5">{ph.registrationNumber || 'IAP-77621-PT'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold text-[9px] uppercase block">Direct Line</span>
                          <span className="text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-[#0A6E6E]" />
                            {ph.phone || '9822334455'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => alert(`Contacting ${ph.therapistName} at: ${ph.phone}`)}
                          className="px-3 py-1.5 border border-[#D1E5E5] text-gray-600 font-bold text-[11px] rounded-lg hover:bg-gray-50"
                          id={`enquire-physio-${ph.id}`}
                        >
                          Enquire Booking
                        </button>
                        <button
                          onClick={() => {
                            alert(`Booking requested for Physiotherapy Care with ${ph.therapistName}. Direct appointment code dispatched via SMS.`);
                          }}
                          className="px-4 py-1.5 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 font-bold text-[11px] rounded-lg shadow-xs"
                          id={`book-physio-${ph.id}`}
                        >
                          Schedule Session
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#F0F7F7] text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4">
                  🏋️
                </div>
                <h3 className="text-base font-extrabold text-[#1A2B3C] mb-1">No Physiotherapy Clinics</h3>
                <p className="text-xs text-gray-500 max-w-sm mb-6">
                  No verified physiotherapy centers matching your criteria were found. Try adjusting the search filters.
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="bg-[#0A6E6E] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            )
          )}
        </section>

      </div>
    </div>
  );
}
