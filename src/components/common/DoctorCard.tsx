/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Shield, Clock, MapPin, Video, Building } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorCardProps {
  key?: React.Key;
  doctor: Doctor;
  onBook: (id: string) => void;
  onViewProfile: (id: string) => void;
  variant?: 'horizontal' | 'vertical';
  onDelete?: (id: string) => void;
}

export default function DoctorCard({ doctor, onBook, onViewProfile, variant = 'horizontal', onDelete }: DoctorCardProps) {
  if (variant === 'vertical') {
    return (
      <div 
        className="bg-white rounded-xl border border-[#D1E5E5] p-5 flex flex-col justify-between transition-all hover:border-[#0A6E6E] hover:shadow-[0_4px_16px_rgba(10,110,110,0.06)] group"
        id={`doctor-card-vertical-${doctor.id}`}
      >
        <div>
          {/* Header Photo + Verified Tag */}
          <div className="relative w-full h-44 rounded-lg overflow-hidden mb-4 bg-gray-100">
            <img 
              src={doctor.photo} 
              alt={doctor.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute top-2.5 right-2.5 bg-[#0A6E6E] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
              <Shield className="w-2.5 h-2.5" /> Verified
            </div>
          </div>

          {/* Specialization & Exp */}
          <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            <span>{doctor.specialty}</span>
            <span>{doctor.experience} Yrs Exp</span>
          </div>

          {/* Name & Clinic */}
          <h3 className="text-base font-bold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors mb-1">{doctor.name}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2.5">
            <Building className="w-3.5 h-3.5 text-[#0A6E6E] shrink-0" />
            <span className="truncate">{doctor.clinicName}, {doctor.city}</span>
          </p>

          {/* Rating */}
          <button
            type="button"
            onClick={() => onViewProfile(doctor.id)}
            className="flex items-center gap-1 mb-3 hover:text-[#0A6E6E] hover:underline cursor-pointer transition-colors text-left"
          >
            <Star className="w-3.5 h-3.5 text-[#F5A623] fill-current" />
            <span className="text-xs font-bold text-[#1A2B3C]">{doctor.rating}</span>
            <span className="text-xs text-gray-400">({doctor.reviewsCount} reviews)</span>
          </button>
        </div>

        {/* Fees and slots footer */}
        <div className="border-t border-gray-100 pt-3.5 mt-3.5">
          <div className="flex justify-between items-center text-xs mb-3 font-semibold text-[#1A2B3C]">
            <span className="text-gray-500">Video / Clinic Fee</span>
            <span>₹{doctor.feeVideo} / ₹{doctor.feeInClinic}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#0A6E6E] font-bold bg-[#F0F7F7] p-2 rounded-lg mb-4">
            <Clock className="w-3.5 h-3.5 shrink-0 text-[#F5A623]" />
            <span>Next: {doctor.nextAvailable}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onViewProfile(doctor.id)}
              className="py-2 text-xs font-bold text-[#0A6E6E] hover:bg-[#F0F7F7] border border-[#D1E5E5] rounded-lg transition-all"
            >
              Profile
            </button>
            <button 
              onClick={() => onBook(doctor.id)}
              className="py-2 text-xs font-bold text-white bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 rounded-lg shadow-sm transition-all"
            >
              Book Now
            </button>
          </div>
          {onDelete && (
            <button 
              onClick={() => onDelete(doctor.id)}
              className="mt-2 w-full py-1.5 text-center bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg border border-rose-100 hover:border-rose-200 transition-all cursor-pointer"
            >
              🗑️ Delete Profile
            </button>
          )}
        </div>
      </div>
    );
  }

  // Horizontal Card Variant (Default for listings)
  return (
    <div 
      className="bg-white rounded-xl border border-[#D1E5E5] p-3.5 flex flex-col sm:flex-row gap-3.5 transition-all hover:border-[#0A6E6E] hover:shadow-[0_4px_16px_rgba(10,110,110,0.06)] group"
      id={`doctor-card-horizontal-${doctor.id}`}
    >
      {/* Left: Avatar with badge */}
      <div className="relative w-full sm:w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
        <img 
          src={doctor.photo} 
          alt={doctor.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />
        <div className="absolute bottom-1.5 left-1.5 bg-emerald-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
          <Shield className="w-2 h-2" /> Verified
        </div>
      </div>

      {/* Middle: Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h3 className="text-sm font-extrabold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors leading-tight">{doctor.name}</h3>
            <span className="bg-[#D1E5E5]/50 text-[#0A6E6E] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              {doctor.specialty}
            </span>
          </div>

          <p className="text-[11px] text-gray-500 font-bold mb-1 flex items-center gap-1">
            <Building className="w-3 h-3 text-[#0A6E6E]" />
            <span className="truncate">{doctor.clinicName}, {doctor.city}</span>
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-gray-500">
            <button
              type="button"
              onClick={() => onViewProfile(doctor.id)}
              className="flex items-center gap-0.5 hover:text-[#0A6E6E] hover:underline cursor-pointer transition-colors text-left"
            >
              <Star className="w-3 h-3 text-[#F5A623] fill-current" />
              <strong className="text-[#1A2B3C]">{doctor.rating}</strong> ({doctor.reviewsCount} Patients)
            </button>
            <span>•</span>
            <span><strong>{doctor.experience}</strong> Years Experience</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-[#1A2B3C] border-t border-gray-100/80 pt-1.5 mt-1.5">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Consultation:</span>
            <span className="text-[#0A6E6E] font-black">₹{doctor.feeInClinic}</span> (Clinic) / <span className="text-blue-600 font-black">₹{doctor.feeVideo}</span> (Video)
          </div>
        </div>
      </div>

      {/* Right: Booking Actions */}
      <div className="w-full sm:w-44 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-3.5 flex flex-col justify-between">
        <div>
          <div className="text-[9px] text-gray-400 font-black uppercase tracking-wider mb-0.5">Availability</div>
          <div className="flex items-center gap-1 text-[11px] text-[#0A6E6E] font-black bg-[#F0F7F7] p-1.5 rounded-lg">
            <Clock className="w-3 h-3 text-[#F5A623] shrink-0" />
            <span className="truncate">{doctor.nextAvailable}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <button 
            onClick={() => onBook(doctor.id)}
            className="w-full py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-black text-[11px] rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer"
          >
            Book Appointment
          </button>
          <button 
            onClick={() => onViewProfile(doctor.id)}
            className="w-full py-1.5 hover:bg-[#F0F7F7] text-[#0A6E6E] font-black text-[11px] border border-[#D1E5E5] rounded-lg transition-all cursor-pointer"
          >
            View Full Profile
          </button>
          {onDelete && (
            <button 
              onClick={() => onDelete(doctor.id)}
              className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[10px] border border-rose-100 hover:border-rose-200 rounded-lg transition-all cursor-pointer text-center"
            >
              🗑️ Delete Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
