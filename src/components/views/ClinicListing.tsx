/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building, MapPin, Star, Clock, Calendar, Check } from 'lucide-react';
import { MOCK_CLINICS, MOCK_DOCTORS } from '../../data/mockData';
import { Clinic, Doctor } from '../../types';

interface ClinicListingProps {
  setView: (view: string) => void;
  setSelectedDoctorId: (id: string | null) => void;
  clinicsList?: Clinic[];
  doctorsList?: Doctor[];
}

export default function ClinicListing({ 
  setView, 
  setSelectedDoctorId,
  clinicsList = MOCK_CLINICS,
  doctorsList = MOCK_DOCTORS
}: ClinicListingProps) {
  const [selectedCity, setSelectedCity] = React.useState('Mumbai');

  const filteredClinics = React.useMemo(() => {
    return clinicsList.filter(c => c.city.toLowerCase() === selectedCity.toLowerCase());
  }, [selectedCity, clinicsList]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="clinic-listing-root">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A2B3C] font-heading tracking-tight">
            Explore Associated Group Clinics
          </h1>
          <p className="text-xs text-gray-500 mt-1">Walk directly into premier clinical offices equipped with cutting-edge medical facilities.</p>
        </div>

        {/* City Filter */}
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="bg-white border border-[#D1E5E5] px-4 py-2 rounded-lg text-xs font-bold text-[#1A2B3C] outline-none shadow-sm cursor-pointer"
        >
          <option value="Mumbai">Mumbai Hub</option>
          <option value="Delhi">Delhi NCR Hub</option>
          <option value="Bengaluru">Bengaluru Tech Hub</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="clinics-grid">
        {filteredClinics.map((clinic) => {
          // Get doctors associated with this clinic
          const associatedDoctors = doctorsList.filter(d => clinic.doctors.includes(d.id));

          return (
            <div key={clinic.id} className="bg-white rounded-xl border border-[#D1E5E5] p-5 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                {/* Image block */}
                <div className="h-44 rounded-lg overflow-hidden mb-4 bg-gray-100 border border-gray-100">
                  <img src={clinic.photos[0]} alt={clinic.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex justify-between items-start">
                  <h3 className="text-base font-extrabold text-[#1A2B3C] font-heading">{clinic.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#1A2B3C]">
                    <Star className="w-3.5 h-3.5 text-[#F5A623] fill-current" />
                    <span>{clinic.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-[#0A6E6E]" />
                  <span>{clinic.address}</span>
                </p>

                <div className="flex items-center gap-1.5 text-xs text-[#0A6E6E] font-bold bg-[#F0F7F7] p-2.5 rounded-lg mb-4">
                  <Clock className="w-4 h-4 text-[#F5A623] shrink-0" />
                  <span>{clinic.timings}</span>
                </div>

                {/* Associated Doctor list preview */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block mb-2">Practicing Doctors</span>
                  <div className="flex flex-col gap-2">
                    {associatedDoctors.map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => {
                          setSelectedDoctorId(doc.id);
                          setView('doctor-profile');
                        }}
                        className="flex justify-between items-center bg-[#F0F7F7]/40 hover:bg-[#F0F7F7] border border-transparent hover:border-[#D1E5E5] p-2 rounded-lg cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <img src={doc.photo} alt={doc.name} className="w-7 h-7 rounded-full object-cover bg-gray-100" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold text-[#1A2B3C] hover:text-[#0A6E6E]">{doc.name}</span>
                        </div>
                        <span className="text-[10px] bg-[#D1E5E5]/50 text-[#0A6E6E] px-2 py-0.5 rounded-full font-bold">{doc.specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="border-t border-gray-100 pt-4 mt-5 flex justify-end gap-2">
                <button
                  onClick={() => alert(`Address: ${clinic.address}\nTimings: ${clinic.timings}\nContact: contact@${clinic.id}.doctspark.in`)}
                  className="px-4 py-2 border border-[#D1E5E5] text-gray-600 font-bold text-xs rounded-lg hover:bg-gray-50"
                >
                  Contact Desk
                </button>
                <button
                  onClick={() => {
                    if (associatedDoctors.length > 0) {
                      setSelectedDoctorId(associatedDoctors[0].id);
                      setView('booking');
                    } else {
                      alert('No doctors registered this hour.');
                    }
                  }}
                  className="px-5 py-2 bg-[#0A6E6E] text-white hover:bg-[#0A6E6E]/90 font-bold text-xs rounded-lg shadow-sm"
                >
                  Book Instant Visit
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
