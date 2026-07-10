/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Navigation, Star, ShieldCheck, SlidersHorizontal, ArrowRight, Building, ChevronDown, Check, Globe } from 'lucide-react';
import { MOCK_DOCTORS, MOCK_CLINICS, GEOGRAPHY_DATA } from '../../data/mockData';
import { Doctor, Clinic } from '../../types';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface NearbyMapProps {
  setView: (view: string) => void;
  setSelectedDoctorId: (id: string | null) => void;
  searchCity: string;
  setSearchCity: (city: string) => void;
  clinicsList?: Clinic[];
  doctorsList?: Doctor[];
}

export default function NearbyMap({ 
  setView, 
  setSelectedDoctorId, 
  searchCity, 
  setSearchCity,
  clinicsList = MOCK_CLINICS,
  doctorsList = MOCK_DOCTORS
}: NearbyMapProps) {
  const [selectedState, setSelectedState] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState('');
  const [selectedCity, setSelectedCity] = React.useState(searchCity || 'Mumbai');
  const [activeSpecialty, setActiveSpecialty] = React.useState('All');
  const [activePin, setActivePin] = React.useState<{ id: string; name: string; type: 'doctor' | 'clinic'; specialty?: string; fee?: number } | null>(null);
  const [showSetup, setShowSetup] = React.useState(false);

  // Sync state and district with selectedCity or initial searchCity prop
  React.useEffect(() => {
    const cityToFind = selectedCity || searchCity;
    if (cityToFind) {
      const foundState = GEOGRAPHY_DATA.find(s => 
        s.districts.some(d => d.cities.some(c => c.toLowerCase() === cityToFind.toLowerCase()))
      );
      if (foundState) {
        setSelectedState(foundState.stateName);
        const foundDistrict = foundState.districts.find(d => 
          d.cities.some(c => c.toLowerCase() === cityToFind.toLowerCase())
        );
        if (foundDistrict) {
          setSelectedDistrict(foundDistrict.districtName);
        }
      }
    }
  }, [selectedCity, searchCity]);

  // Filter list based on selected criteria
  const nearbyDoctors = React.useMemo(() => {
    let list = doctorsList;
    if (selectedCity) {
      list = list.filter(d => d.city.toLowerCase() === selectedCity.toLowerCase());
    } else if (selectedDistrict) {
      const foundState = GEOGRAPHY_DATA.find(s => s.stateName === selectedState);
      const foundDistrict = foundState?.districts.find(d => d.districtName === selectedDistrict);
      const citiesInDistrict = foundDistrict ? foundDistrict.cities : [];
      list = list.filter(d => citiesInDistrict.some(c => c.toLowerCase() === d.city.toLowerCase()));
    } else if (selectedState) {
      const foundState = GEOGRAPHY_DATA.find(s => s.stateName === selectedState);
      const citiesInState = foundState ? foundState.districts.flatMap(d => d.cities) : [];
      list = list.filter(d => citiesInState.some(c => c.toLowerCase() === d.city.toLowerCase()));
    }

    if (activeSpecialty !== 'All') {
      list = list.filter(d => d.specialty === activeSpecialty);
    }
    return list;
  }, [selectedState, selectedDistrict, selectedCity, activeSpecialty, doctorsList]);

  const nearbyClinics = React.useMemo(() => {
    let list = clinicsList;
    if (selectedCity) {
      list = list.filter(c => c.city.toLowerCase() === selectedCity.toLowerCase());
    } else if (selectedDistrict) {
      const foundState = GEOGRAPHY_DATA.find(s => s.stateName === selectedState);
      const foundDistrict = foundState?.districts.find(d => d.districtName === selectedDistrict);
      const citiesInDistrict = foundDistrict ? foundDistrict.cities : [];
      list = list.filter(c => citiesInDistrict.some(ct => ct.toLowerCase() === c.city.toLowerCase()));
    } else if (selectedState) {
      const foundState = GEOGRAPHY_DATA.find(s => s.stateName === selectedState);
      const citiesInState = foundState ? foundState.districts.flatMap(d => d.cities) : [];
      list = list.filter(c => citiesInState.some(ct => ct.toLowerCase() === c.city.toLowerCase()));
    }
    return list;
  }, [selectedState, selectedDistrict, selectedCity, clinicsList]);

  // Center coordinates mapping for Google Maps based on selected city
  const centerCoords = React.useMemo(() => {
    const c = selectedCity.toLowerCase();
    if (c.includes('mumbai')) return { lat: 19.076, lng: 72.8777 };
    if (c.includes('bengaluru') || c.includes('bangalore')) return { lat: 12.9716, lng: 77.5946 };
    if (c.includes('delhi')) return { lat: 28.6139, lng: 77.209 };
    if (c.includes('pune')) return { lat: 18.5204, lng: 73.8567 };
    if (c.includes('hyderabad')) return { lat: 17.385, lng: 78.4867 };
    if (c.includes('chennai')) return { lat: 13.0827, lng: 80.2707 };
    
    // Fallback to coordinates of the first matching doctor/clinic
    if (nearbyDoctors.length > 0 && nearbyDoctors[0].lat && nearbyDoctors[0].lng) {
      return { lat: nearbyDoctors[0].lat, lng: nearbyDoctors[0].lng };
    }
    return { lat: 19.076, lng: 72.8777 }; // Default to Mumbai
  }, [selectedCity, nearbyDoctors]);

  // Handle location picker
  const handleUseMyLocation = () => {
    setSelectedState('Maharashtra');
    setSelectedDistrict('Mumbai City');
    setSelectedCity('Mumbai');
    setSearchCity('Mumbai');
    alert("Retrieving GPS coordinates... Centered on Mumbai West (Your simulated location).");
  };

  const handleBook = (id: string) => {
    setSelectedDoctorId(id);
    setView('booking');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#F0F7F7]" id="nearby-map-root">
      
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-[#D1E5E5] px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 z-10 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleUseMyLocation}
            className="bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/95 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 fill-current" /> Use My Location 📍
          </button>

          {/* State Select */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => {
                const newState = e.target.value;
                setSelectedState(newState);
                setSelectedDistrict('');
                setSelectedCity('');
              }}
              className="bg-[#F0F7F7] border border-[#D1E5E5] pl-3 pr-8 py-2 rounded-lg text-xs font-bold text-[#1A2B3C] outline-none appearance-none cursor-pointer"
            >
              <option value="">All States</option>
              {GEOGRAPHY_DATA.map(st => (
                <option key={st.stateName} value={st.stateName}>{st.stateName}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* District Select */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => {
                const newDistrict = e.target.value;
                setSelectedDistrict(newDistrict);
                setSelectedCity('');
              }}
              disabled={!selectedState}
              className="bg-[#F0F7F7] border border-[#D1E5E5] pl-3 pr-8 py-2 rounded-lg text-xs font-bold text-[#1A2B3C] outline-none appearance-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">All Districts</option>
              {selectedState && GEOGRAPHY_DATA.find(st => st.stateName === selectedState)?.districts.map(dst => (
                <option key={dst.districtName} value={dst.districtName}>{dst.districtName}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* City Select */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => {
                const newCity = e.target.value;
                setSelectedCity(newCity);
                setSearchCity(newCity);
              }}
              disabled={!selectedDistrict}
              className="bg-[#F0F7F7] border border-[#D1E5E5] pl-3 pr-8 py-2 rounded-lg text-xs font-bold text-[#1A2B3C] outline-none appearance-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">All Cities</option>
              {selectedState && selectedDistrict && GEOGRAPHY_DATA.find(st => st.stateName === selectedState)?.districts.find(dst => dst.districtName === selectedDistrict)?.cities.map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Specialty Select */}
          <div className="relative">
            <select
              value={activeSpecialty}
              onChange={(e) => setActiveSpecialty(e.target.value)}
              className="bg-[#F0F7F7] border border-[#D1E5E5] pl-3 pr-8 py-2 rounded-lg text-xs font-bold text-[#1A2B3C] outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Specialties</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="General Physician">General Physician</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Orthopedic">Orthopedic</option>
              <option value="Gynecologist">Gynecologist</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3.5 text-xs font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0A6E6E]"></span> Doctor Pins</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]"></span> Clinic Pins</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        
        {/* INTERACTIVE MAP PANEL (70%) */}
        <div className="flex-1 bg-slate-200 relative min-h-[300px] lg:min-h-0 overflow-hidden" id="maps-canvas-container">
          
          {/* Status Badge Indicator */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-[#D1E5E5] flex items-center gap-2 text-[10px] sm:text-xs font-extrabold text-[#1A2B3C]">
            {hasValidKey ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-800">🌐 Live Google Map Active</span>
              </>
            ) : (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-amber-700">💻 Preview Mode (Simulated Map)</span>
                <button 
                  onClick={() => setShowSetup(true)}
                  className="bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all cursor-pointer"
                >
                  Configure Key 🔌
                </button>
              </>
            )}
          </div>

          {/* SETUP MODAL/SPLASH SCREEN (Rendered if user clicks setup) */}
          {showSetup && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-30 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#D1E5E5] text-xs relative animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setShowSetup(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-sm"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-teal-50 rounded-lg text-[#0A6E6E]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1A2B3C]">Google Maps Platform Setup</h3>
                    <p className="text-[10px] text-gray-500">Configure your workspace API key</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-gray-600 font-medium">
                  <p>
                    This application is fully prepared to render a native, interactive Google Map displaying live clinics and physicians.
                  </p>
                  
                  <div className="bg-teal-50/50 rounded-lg p-3 border border-[#D1E5E5] space-y-2 text-[#1A2B3C]">
                    <p className="font-bold text-[11px] text-[#0A6E6E]">To add your API key:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[10px] text-gray-600 leading-relaxed">
                      <li>
                        Get an API key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-[#0A6E6E] underline font-bold hover:text-teal-800">Google Cloud Console 🔗</a>
                      </li>
                      <li>
                        Open <strong>Settings</strong> (⚙️ gear icon, top-right corner of AI Studio)
                      </li>
                      <li>
                        Select <strong>Secrets</strong> panel
                      </li>
                      <li>
                        Type <code className="bg-white border px-1 rounded text-[#0A6E6E] font-bold">GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name
                      </li>
                      <li>
                        Paste your API key and press <strong>Enter</strong>
                      </li>
                    </ol>
                  </div>
                  
                  <p className="text-[10px] text-gray-500 leading-relaxed bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                    💡 <strong>Auto-Refresh:</strong> The application will build and reload automatically once the environment variable is supplied in secrets.
                  </p>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setShowSetup(false)}
                    className="bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold px-4 py-2 rounded-lg text-[11px]"
                  >
                    Got It, Continue Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasValidKey ? (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                center={centerCoords}
                zoom={12}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={false}
              >
                {/* Real Google Maps Doctor Markers */}
                {nearbyDoctors.map((doc) => {
                  if (!doc.lat || !doc.lng) return null;
                  const isActive = activePin?.id === doc.id;
                  return (
                    <AdvancedMarker
                      key={doc.id}
                      position={{ lat: doc.lat, lng: doc.lng }}
                      onClick={() => setActivePin({ id: doc.id, name: doc.name, type: 'doctor', specialty: doc.specialty, fee: doc.feeInClinic })}
                    >
                      <div style={{ width: '36px', height: '36px' }} className="flex items-center justify-center relative cursor-pointer">
                        <div className={`p-1.5 rounded-full border-2 shadow-md flex items-center justify-center transition-transform hover:scale-110 w-8 h-8 ${isActive ? 'bg-[#F5A623] border-white scale-110 z-20' : 'bg-[#0A6E6E] border-white'}`}>
                          <span className="text-white text-xs">🩺</span>
                        </div>
                        <div className="absolute top-8 bg-white/95 px-1 py-0.5 rounded shadow border border-[#D1E5E5] text-[7px] font-extrabold whitespace-nowrap text-[#1A2B3C]">
                          {doc.name.split(' ')[1] || doc.name}
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Real Google Maps Clinic Markers */}
                {nearbyClinics.map((clinic) => {
                  if (!clinic.lat || !clinic.lng) return null;
                  const isActive = activePin?.id === clinic.id;
                  return (
                    <AdvancedMarker
                      key={clinic.id}
                      position={{ lat: clinic.lat, lng: clinic.lng }}
                      onClick={() => setActivePin({ id: clinic.id, name: clinic.name, type: 'clinic' })}
                    >
                      <div style={{ width: '36px', height: '36px' }} className="flex items-center justify-center relative cursor-pointer">
                        <div className={`p-1.5 rounded-full border-2 shadow-md flex items-center justify-center transition-transform hover:scale-110 w-8 h-8 ${isActive ? 'bg-[#0A6E6E] border-white scale-110 z-20' : 'bg-[#F5A623] border-white'}`}>
                          <span className="text-white text-xs">🏢</span>
                        </div>
                        <div className="absolute top-8 bg-white/95 px-1 py-0.5 rounded shadow border border-[#D1E5E5] text-[7px] font-extrabold whitespace-nowrap text-[#1A2B3C]">
                          {clinic.name.split(' ')[0]} Clinic
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
            </APIProvider>
          ) : (
            <>
              {/* Simulated Grid Streets Layout (Fallback) */}
              <div className="absolute inset-0 bg-[#E3EFEF]">
                {/* Visual Grid Lines */}
                <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(#0A6E6E 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                {/* Simulated streets/avenues blocks */}
                <div className="absolute top-1/4 left-0 right-0 h-4 bg-white/60 -rotate-2"></div>
                <div className="absolute top-2/3 left-0 right-0 h-5 bg-white/60 rotate-1"></div>
                <div className="absolute left-1/3 top-0 bottom-0 w-4 bg-white/60 -rotate-12"></div>
                <div className="absolute left-2/3 top-0 bottom-0 w-5 bg-white/60 rotate-6"></div>
              </div>

              {/* DOCTOR PINS */}
              {nearbyDoctors.map((doc, idx) => {
                const offsetTop = 20 + (idx * 25) % 60;
                const offsetLeft = 15 + (idx * 30) % 70;
                const isActive = activePin?.id === doc.id;

                return (
                  <button
                    key={doc.id}
                    onClick={() => setActivePin({ id: doc.id, name: doc.name, type: 'doctor', specialty: doc.specialty, fee: doc.feeInClinic })}
                    className="absolute flex flex-col items-center group transition-transform hover:scale-110 z-10"
                    style={{ top: `${offsetTop}%`, left: `${offsetLeft}%` }}
                  >
                    <div className={`p-1.5 rounded-full border-2 shadow-md flex items-center justify-center transition-colors ${isActive ? 'bg-[#F5A623] border-white scale-110' : 'bg-[#0A6E6E] border-[#D1E5E5]'}`}>
                      <span className="text-white text-xs">🩺</span>
                    </div>
                    <span className="bg-white text-[9px] font-extrabold text-[#1A2B3C] px-1.5 py-0.5 rounded shadow-sm border border-[#D1E5E5] mt-1 whitespace-nowrap block group-hover:bg-[#0A6E6E] group-hover:text-white">
                      {doc.name}
                    </span>
                  </button>
                );
              })}

              {/* CLINIC PINS */}
              {nearbyClinics.map((clinic, idx) => {
                const offsetTop = 40 + (idx * 35) % 50;
                const offsetLeft = 35 + (idx * 25) % 55;
                const isActive = activePin?.id === clinic.id;

                return (
                  <button
                    key={clinic.id}
                    onClick={() => setActivePin({ id: clinic.id, name: clinic.name, type: 'clinic' })}
                    className="absolute flex flex-col items-center group transition-transform hover:scale-110 z-10"
                    style={{ top: `${offsetTop}%`, left: `${offsetLeft}%` }}
                  >
                    <div className={`p-1.5 rounded-full border-2 shadow-md flex items-center justify-center transition-colors ${isActive ? 'bg-[#0A6E6E] border-white scale-110' : 'bg-[#F5A623] border-[#D1E5E5]'}`}>
                      <span className="text-white text-xs">🏢</span>
                    </div>
                    <span className="bg-white text-[9px] font-extrabold text-[#1A2B3C] px-1.5 py-0.5 rounded shadow-sm border border-[#D1E5E5] mt-1 whitespace-nowrap block">
                      {clinic.name}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {/* Selected Pin Details Popup Overlay inside Map */}
          {activePin && (
            <div className="absolute bottom-6 left-6 right-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto bg-white border border-[#D1E5E5] p-4 rounded-xl shadow-xl z-20 w-auto sm:w-80 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button 
                onClick={() => setActivePin(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-900 font-bold"
              >
                ✕
              </button>
              <div className="flex gap-1 text-[#0A6E6E] font-extrabold text-[9px] uppercase mb-1">
                <span>📍 Nearby {activePin.type} Match</span>
              </div>
              <h4 className="font-extrabold text-sm text-[#1A2B3C]">{activePin.name}</h4>
              {activePin.specialty && (
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">{activePin.specialty}</p>
              )}
              {activePin.fee && (
                <p className="text-[10px] text-teal-700 font-extrabold mt-1">Consultation Fee: ₹{activePin.fee}</p>
              )}
              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between gap-2">
                <button
                  onClick={() => {
                    if (activePin.type === 'doctor') {
                      handleBook(activePin.id);
                    } else {
                      alert(`Walk directly to the reception desk at ${activePin.name}.`);
                    }
                  }}
                  className="bg-[#0A6E6E] text-white px-3 py-1.5 rounded text-[10px] font-bold shadow-sm"
                >
                  Book Visit
                </button>
                <button
                  onClick={() => alert(`GPS routing coordinates initiated to ${activePin.name}.`)}
                  className="border border-[#D1E5E5] text-gray-600 px-3 py-1.5 rounded text-[10px] font-bold"
                >
                  Get Route
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR: LIST OF NEARBY MATCHES */}
        <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#D1E5E5] flex flex-col min-h-0 shrink-0 shadow-sm" id="nearby-sidebar-list">
          <div className="p-3 bg-[#F0F7F7] border-b border-[#D1E5E5] font-extrabold text-xs uppercase tracking-wider text-[#1A2B3C] shrink-0">
            🏥 Hub Matches Near You ({nearbyDoctors.length + nearbyClinics.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
            {/* Doctors */}
            {nearbyDoctors.map(doc => (
              <div 
                key={doc.id}
                onClick={() => setActivePin({ id: doc.id, name: doc.name, type: 'doctor', specialty: doc.specialty, fee: doc.feeInClinic })}
                className="p-4 hover:bg-[#F0F7F7]/60 cursor-pointer transition-colors text-xs flex gap-3"
              >
                <img src={doc.photo} alt={doc.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-gray-900 truncate hover:text-[#0A6E6E]">{doc.name}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold truncate">{doc.specialty} • {doc.experience} Yrs exp</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#0A6E6E] mt-1">
                    <span>⭐ {doc.rating}</span>
                    <span>•</span>
                    <span>₹{doc.feeInClinic} In-Clinic</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Clinics */}
            {nearbyClinics.map(clinic => (
              <div 
                key={clinic.id}
                onClick={() => setActivePin({ id: clinic.id, name: clinic.name, type: 'clinic' })}
                className="p-4 hover:bg-[#F0F7F7]/60 cursor-pointer transition-colors text-xs flex gap-3"
              >
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 font-bold border border-amber-100">
                  🏢
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-gray-900 truncate hover:text-[#F5A623]">{clinic.name}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold truncate">{clinic.address}</p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#F5A623] mt-1">
                    <span>⭐ {clinic.rating}</span>
                    <span>•</span>
                    <span>Hub Clinic</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>

    </div>
  );
}
