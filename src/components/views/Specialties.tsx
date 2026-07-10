/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { SPECIALTIES } from '../../data/mockData';

interface SpecialtiesProps {
  setView: (view: string) => void;
  setSearchQuery: (q: string) => void;
}

export default function Specialties({ setView, setSearchQuery }: SpecialtiesProps) {
  
  const handleSpecialtySelect = (name: string) => {
    setSearchQuery(name);
    setView('doctors');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="specialties-root">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Clinical Classifications</span>
        <h1 className="text-2xl md:text-4xl font-extrabold text-[#1A2B3C] font-heading tracking-tight">
          Browse by Medical Speciality
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Select a specialty category to explore, filter, and schedule appointments with top accredited practitioners in India.
        </p>
      </div>

      {/* Specialties list grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="specialties-grid">
        {SPECIALTIES.map((spec) => (
          <div
            key={spec.name}
            onClick={() => handleSpecialtySelect(spec.name)}
            className="bg-white p-5 rounded-xl border border-[#D1E5E5] flex flex-col justify-between hover:border-[#0A6E6E] hover:shadow-md cursor-pointer transition-all group"
          >
            <div>
              <div className="w-14 h-14 bg-[#F0F7F7] rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-[#0A6E6E] transition-all">
                {spec.icon}
              </div>
              <h3 className="text-base font-extrabold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors mb-1.5">{spec.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold mb-4">
                {spec.desc}
              </p>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-[#0A6E6E] border-t border-gray-100 pt-3">
              <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified Experts</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
