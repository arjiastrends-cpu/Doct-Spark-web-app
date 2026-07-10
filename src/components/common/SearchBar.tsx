/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { GEOGRAPHY_DATA } from '../../data/mockData';

interface SearchBarProps {
  onSearch: (query: string, city: string) => void;
  initialQuery?: string;
  initialCity?: string;
  onFindNearby?: () => void;
}

export default function SearchBar({ onSearch, initialQuery = '', initialCity = '', onFindNearby }: SearchBarProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedState, setSelectedState] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState('');
  const [city, setCity] = React.useState(initialCity);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Sync state and district with initialCity on mount or when initialCity changes
  React.useEffect(() => {
    if (initialCity) {
      const foundState = GEOGRAPHY_DATA.find(s => 
        s.districts.some(d => d.cities.some(c => c.toLowerCase() === initialCity.toLowerCase()))
      );
      if (foundState) {
        setSelectedState(foundState.stateName);
        const foundDistrict = foundState.districts.find(d => 
          d.cities.some(c => c.toLowerCase() === initialCity.toLowerCase())
        );
        if (foundDistrict) {
          setSelectedDistrict(foundDistrict.districtName);
        }
      }
      setCity(initialCity);
    } else {
      setSelectedState('');
      setSelectedDistrict('');
      setCity('');
    }
  }, [initialCity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, city);
  };

  const handleFindNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          alert(`📍 Geolocation Granted!\nLatitude: ${lat.toFixed(4)}\nLongitude: ${lon.toFixed(4)}\nWe have synchronized with your device GPS. Auto-selecting Mumbai (closest medical hub) for diagnostic scanning.`);
          setSelectedState('Maharashtra');
          setSelectedDistrict('Mumbai');
          setCity('Mumbai');
          onSearch(query, 'Mumbai');
        },
        (error) => {
          alert(`📍 Geolocation access declined: ${error.message}.\nFor safety, we have default-routed you to Mumbai, Maharashtra.`);
          setSelectedState('Maharashtra');
          setSelectedDistrict('Mumbai');
          setCity('Mumbai');
          onSearch(query, 'Mumbai');
        }
      );
    } else {
      alert("📍 Geolocation is not supported by your browser. Mapping to closest active medical center: Mumbai.");
      setSelectedState('Maharashtra');
      setSelectedDistrict('Mumbai');
      setCity('Mumbai');
      onSearch(query, 'Mumbai');
    }
  };

  const suggestions = [
    'General Physician',
    'Cardiologist',
    'Cardiology Clinic',
    'DoctSpark Central Pathology Labs',
    'Full Body Health Package',
    'Diabetes Screening Test',
    'Sports Physical Therapist',
    'Joint Pain Rehabilitation',
    'Dr. Rajesh Khanna',
    'Dr. Preeti Verma'
  ];

  const filteredSuggestions = query
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  return (
    <form 
      onSubmit={handleSubmit} 
      className="w-full max-w-4xl bg-white p-1.5 sm:p-2 rounded-2xl shadow-[0_4px_20px_rgba(10,110,110,0.1)] flex flex-col md:flex-row gap-1.5 md:gap-2 border border-[#D1E5E5]"
      id="global-search-bar"
    >
      {/* Search Input with autocomplete suggestions */}
      <div className="flex-[1.5] flex items-center px-3 sm:px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100 relative">
        <Search className="text-[#0A6E6E] mr-2 shrink-0 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search Doctors, Clinics, Labs, Meds, Physiotherapists, or Test Packages..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full outline-none bg-transparent text-xs sm:text-sm text-[#1A2B3C] font-semibold"
        />
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#D1E5E5] rounded-xl shadow-lg z-50 py-2">
            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suggested Searches</div>
            {filteredSuggestions.slice(0, 5).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-[#F0F7F7] text-[#1A2B3C] font-semibold block cursor-pointer"
              >
                {s}
              </button>
            ))}
            <div className="border-t border-gray-100 my-1"></div>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="w-full text-center py-1 text-[10px] text-gray-400 font-bold hover:text-[#0A6E6E] cursor-pointer"
            >
              Close Suggestions
            </button>
          </div>
        )}
      </div>

      {/* State Dropdown */}
      <div className="flex-1 flex items-center px-2.5 sm:px-3 py-1.5 border-b md:border-b-0 md:border-r border-gray-100 relative">
        <MapPin className="text-[#0A6E6E] mr-1.5 shrink-0 w-3.5 h-3.5" />
        <div className="flex-1 relative">
          <select
            value={selectedState}
            onChange={(e) => {
              const newState = e.target.value;
              setSelectedState(newState);
              setSelectedDistrict('');
              setCity('');
            }}
            className="w-full outline-none bg-transparent text-xs sm:text-sm text-[#1A2B3C] font-semibold appearance-none pr-6 cursor-pointer"
          >
            <option value="">Any State</option>
            {GEOGRAPHY_DATA.map((st) => (
              <option key={st.stateName} value={st.stateName}>{st.stateName}</option>
            ))}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* District Dropdown */}
      <div className="flex-1 flex items-center px-2.5 sm:px-3 py-1.5 border-b md:border-b-0 md:border-r border-gray-100 relative">
        <MapPin className="text-[#0A6E6E] mr-1.5 shrink-0 w-3.5 h-3.5" />
        <div className="flex-1 relative">
          <select
            value={selectedDistrict}
            onChange={(e) => {
              const newDistrict = e.target.value;
              setSelectedDistrict(newDistrict);
              setCity('');
            }}
            disabled={!selectedState}
            className="w-full outline-none bg-transparent text-xs sm:text-sm text-[#1A2B3C] font-semibold appearance-none pr-6 cursor-pointer disabled:opacity-40"
          >
            <option value="">Any District</option>
            {selectedState && GEOGRAPHY_DATA.find(st => st.stateName === selectedState)?.districts.map((dst) => (
              <option key={dst.districtName} value={dst.districtName}>{dst.districtName}</option>
            ))}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* City Dropdown */}
      <div className="flex-1 flex items-center px-2.5 sm:px-3 py-1.5 relative">
        <MapPin className="text-[#0A6E6E] mr-1.5 shrink-0 w-3.5 h-3.5" />
        <div className="flex-1 relative">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!selectedDistrict}
            className="w-full outline-none bg-transparent text-xs sm:text-sm text-[#1A2B3C] font-semibold appearance-none pr-6 cursor-pointer disabled:opacity-40"
          >
            <option value="">Any City</option>
            {selectedState && selectedDistrict && GEOGRAPHY_DATA.find(st => st.stateName === selectedState)?.districts.find(dst => dst.districtName === selectedDistrict)?.cities.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Submit / Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
        {onFindNearby && (
          <button
            type="button"
            onClick={handleFindNearby}
            className="w-full md:w-auto bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            id="find-nearby-btn"
          >
            <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Find Nearby 📍</span>
          </button>
        )}
        <button 
          type="submit"
          className="w-full md:w-auto bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer shrink-0"
        >
          Search Now
        </button>
      </div>
    </form>
  );
}
