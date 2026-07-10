/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Heart, Users, Star, ArrowRight, BookOpen, Smartphone, Clock, BadgeCheck, Video, ChevronLeft, ChevronRight, Stethoscope, Building2, FlaskConical, Dumbbell, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { SPECIALTIES, MOCK_DOCTORS, MOCK_REVIEWS } from '../../data/mockData';
import SearchBar from '../common/SearchBar';
import DoctorCard from '../common/DoctorCard';
import { QuickFilterState } from '../../types';

interface HomepageProps {
  setView: (view: string) => void;
  setSelectedDoctorId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSearchCity: (c: string) => void;
  setInitialFilters: (filters: QuickFilterState | null) => void;
}

export default function Homepage({ setView, setSelectedDoctorId, setSearchQuery, setSearchCity, setInitialFilters }: HomepageProps) {
  const [stats, setStats] = React.useState({ 
    doctors: 0, 
    clinics: 0, 
    laboratories: 0, 
    physiotherapists: 0, 
    patients: 0, 
    appointments: 0 
  });
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const activeDoctors = React.useMemo(() => {
    const saved = localStorage.getItem('ds_doctors');
    const docs = saved ? JSON.parse(saved) : [];
    // Show approved doctors, or any doctor in the list, excluding simulated ones
    return docs.filter((d: any) => 
      (d.verificationStatus === 'Approved' || d.verificationStatus === 'Approved (Active)' || d.verificationStatus === 'MCI Verified' || !d.verificationStatus) &&
      !d.name.includes('Simulated') && !d.name.includes('Sandbox')
    );
  }, []);

  const prevSlide = () => {
    if (MOCK_REVIEWS.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? MOCK_REVIEWS.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    if (MOCK_REVIEWS.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % MOCK_REVIEWS.length);
  };

  const visibleReviews = React.useMemo(() => {
    if (MOCK_REVIEWS.length === 0) {
      return { single: null, triple: [] };
    }
    // Return 3 reviews starting from currentSlide for desktop
    const r1 = MOCK_REVIEWS[currentSlide];
    const r2 = MOCK_REVIEWS[(currentSlide + 1) % MOCK_REVIEWS.length];
    const r3 = MOCK_REVIEWS[(currentSlide + 2) % MOCK_REVIEWS.length];
    return { single: r1, triple: [r1, r2, r3] };
  }, [currentSlide]);

  // Simple animation for Stats Counter on mount
  React.useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      setStats({
        doctors: Math.floor(progress * 10000),
        clinics: Math.floor(progress * 2500),
        laboratories: Math.floor(progress * 1200),
        physiotherapists: Math.floor(progress * 850),
        patients: Math.floor(progress * 500000),
        appointments: Math.floor(progress * 150000)
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const handleSearch = (q: string, city: string) => {
    setSearchQuery(q);
    setSearchCity(city);
    setView('doctors');
  };

  const handleFilterPillClick = (filters: QuickFilterState) => {
    setSearchQuery('');
    setInitialFilters(filters);
    setView('doctors');
  };

  const handleSpecialtyClick = (specialtyName: string) => {
    setSearchQuery(specialtyName);
    setView('doctors');
  };

  const handleBook = (id: string) => {
    setSelectedDoctorId(id);
    setView('booking');
  };

  const handleViewProfile = (id: string) => {
    setSelectedDoctorId(id);
    setView('doctor-profile');
  };

  const blogPosts = [
    {
      id: 'blog-1',
      title: 'Understanding Hypertension: The Silent Killer',
      excerpt: 'Learn about key dietary changes and regular exercises to control your blood pressure levels effectively.',
      category: 'Cardiology',
      date: 'June 20, 2026',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'blog-2',
      title: 'Essential Skin Care Routine for Indian Monsoon',
      excerpt: 'Combat high humidity and bacterial skin breakouts with these expert recommendations from top dermatologists.',
      category: 'Dermatology',
      date: 'June 18, 2026',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'blog-3',
      title: 'How to Manage Pediatric Allergies Safely',
      excerpt: 'A comprehensive checklist for young parents to identify allergy triggers and ensure simple first-aid ready at home.',
      category: 'Pediatrics',
      date: 'June 15, 2026',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&q=80&w=400'
    }
  ];

  return (
    <div className="flex-1 bg-[#F0F7F7]/30" id="homepage-root">
      
      {/* 1. HERO SECTION WITH DECORATIVE ACCENTS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-[#F0F7F7]/60 pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 md:px-12 lg:px-16 flex flex-col items-center justify-center text-center">
        {/* Decorative Grid Mesh & Radial Gradients */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a6e6e08_1px,transparent_1px),linear-gradient(to_bottom,#0a6e6e08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#14B8A6]/8 to-[#0A6E6E]/12 blur-3xl rounded-full pointer-events-none" />

        {/* Floating Verified Banner Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative inline-flex items-center gap-2 bg-[#0A6E6E]/8 text-[#0A6E6E] px-4 py-1.5 rounded-full text-[11px] font-black tracking-wide border border-[#0A6E6E]/15 mb-6 text-center max-w-full shadow-xs"
        >
          <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span className="truncate">10,000+ Vetted & Certified Medical Officers across India</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1A2B3C] font-heading tracking-tight leading-tight mb-4 max-w-4xl"
        >
          Consult India's <span className="bg-gradient-to-r from-[#0A6E6E] to-[#14B8A6] bg-clip-text text-transparent">Top Specialists</span> <br className="hidden sm:inline" /> Instantly & Securely
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mb-8 leading-relaxed px-2"
        >
          Skip the waiting room. Access verified private clinics and top-rated medical practitioners for in-clinic visits or crystal-clear video consultations.
        </motion.p>

        {/* Dynamic Search Bar Component */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-3xl relative z-10"
        >
          <SearchBar onSearch={handleSearch} onFindNearby={() => setView('nearby')} />
        </motion.div>

        {/* Premium Hero CTA Buttons Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8 relative z-10"
          id="hero-premium-ctas"
        >
          <button
            onClick={() => { setSearchQuery(''); setView('doctors'); }}
            className="flex flex-col sm:flex-row items-center gap-3 bg-white hover:bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] p-4 rounded-2xl transition-all duration-300 group text-left cursor-pointer hover:shadow-md active:scale-98"
            id="cta-book-doctors"
          >
            <div className="w-10 h-10 bg-[#F0F7F7] group-hover:bg-[#0A6E6E] text-[#0A6E6E] group-hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-all duration-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors leading-tight">Book Doctor</div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5 leading-none">In-clinic or Video</div>
            </div>
          </button>

          <button
            onClick={() => { setSearchQuery('Clinic'); setView('doctors'); }}
            className="flex flex-col sm:flex-row items-center gap-3 bg-white hover:bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] p-4 rounded-2xl transition-all duration-300 group text-left cursor-pointer hover:shadow-md active:scale-98"
            id="cta-book-clinics"
          >
            <div className="w-10 h-10 bg-teal-50 group-hover:bg-[#0A6E6E] text-teal-600 group-hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-all duration-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors leading-tight">Book Clinic</div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5 leading-none">Visit group clinics</div>
            </div>
          </button>

          <button
            onClick={() => { setSearchQuery('Laboratory'); setView('doctors'); }}
            className="flex flex-col sm:flex-row items-center gap-3 bg-white hover:bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] p-4 rounded-2xl transition-all duration-300 group text-left cursor-pointer hover:shadow-md active:scale-98"
            id="cta-book-labs"
          >
            <div className="w-10 h-10 bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-all duration-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-[#1A2B3C] group-hover:text-amber-600 transition-colors leading-tight">Book Lab Test</div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5 leading-none">NABL home collection</div>
            </div>
          </button>

          <button
            onClick={() => { setSearchQuery('Physiotherapy'); setView('doctors'); }}
            className="flex flex-col sm:flex-row items-center gap-3 bg-white hover:bg-[#F0F7F7] border border-[#D1E5E5] hover:border-[#0A6E6E] p-4 rounded-2xl transition-all duration-300 group text-left cursor-pointer hover:shadow-md active:scale-98"
            id="cta-book-physio"
          >
            <div className="w-10 h-10 bg-orange-50 group-hover:bg-orange-500 text-orange-600 group-hover:text-white rounded-xl flex items-center justify-center shrink-0 transition-all duration-300">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-[#1A2B3C] group-hover:text-orange-600 transition-colors leading-tight">Physiotherapy</div>
              <div className="text-[10px] text-gray-400 font-bold mt-0.5 leading-none">Home & center visits</div>
            </div>
          </button>
        </motion.div>

        {/* Horizontal scrollable strip of filter pills */}
        {(() => {
          const filterPills = [
            {
              label: 'Top Rated Physicians',
              icon: <Star className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />,
              filters: { sortBy: 'Rating' as const, ratingThreshold: 4.5 }
            },
            {
              label: 'Affordable (Under ₹500)',
              icon: <span className="font-extrabold text-[#0A6E6E] text-[13px] leading-none">₹</span>,
              filters: { feeRange: 500 }
            },
            {
              label: 'Available Today',
              icon: <Clock className="w-3.5 h-3.5 text-[#22C55E]" />,
              filters: { availability: 'Today' as const }
            }
          ];

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-full max-w-4xl mt-6 sm:mt-8" 
              id="homepage-quick-filters"
            >
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A6E6E]"></span>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Quick Filter Short-Cuts
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A6E6E]"></span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 px-1 scrollbar-none snap-x justify-start md:justify-center">
                {filterPills.map((pill, idx) => (
                  <button
                    key={`filter-pill-${pill.label}-${idx}`}
                    onClick={() => handleFilterPillClick(pill.filters)}
                    className="flex items-center gap-1.5 bg-white hover:bg-[#F0F7F7] hover:border-[#0A6E6E] text-[#1A2B3C] hover:text-[#0A6E6E] px-4 py-2.5 rounded-full border border-[#D1E5E5]/80 text-xs font-bold whitespace-nowrap transition-all shadow-xs hover:shadow-sm active:scale-[0.97] cursor-pointer shrink-0 snap-align-center"
                  >
                    {pill.icon}
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })()}

      </section>

      {/* OUR KEY HEALTHCARE SERVICES */}
      <section className="py-16 bg-[#F0F7F7]/20 border-b border-[#D1E5E5]/50" id="services-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black text-[#0A6E6E] uppercase tracking-widest block mb-1">Our Offerings</span>
            <h2 className="text-2xl md:text-3xl font-black font-heading text-[#1A2B3C] tracking-tight">Comprehensive Digital Healthcare</h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Directly schedule, book, and coordinate care through our partner medical network</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service 1: Doctors */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => { setSearchQuery(''); setView('doctors'); }}
              className="bg-white p-6 rounded-2xl border border-[#D1E5E5]/70 flex flex-col justify-between transition-all hover:border-[#0A6E6E] hover:shadow-[0_12px_24px_rgba(10,110,110,0.04)] cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 bg-[#F0F7F7] group-hover:bg-[#0A6E6E] text-[#0A6E6E] group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 mb-5 shadow-xs">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors font-heading mb-2">Doctors & Specialists</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Book direct in-clinic consultations or secure HD video sessions with verified MDs and top-rated physicians in your area.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#0A6E6E] mt-5 uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Book Consultant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Service 2: Clinics */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => { setSearchQuery('Clinic'); setView('doctors'); }}
              className="bg-white p-6 rounded-2xl border border-[#D1E5E5]/70 flex flex-col justify-between transition-all hover:border-[#0A6E6E] hover:shadow-[0_12px_24px_rgba(10,110,110,0.04)] cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 bg-teal-50 group-hover:bg-[#0A6E6E] text-teal-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 mb-5 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors font-heading mb-2">Group Clinics</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Consult multi-specialty clinical centers, family practice desks, and specialized healthcare groups with advanced diagnostics.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#0A6E6E] mt-5 uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Browse Clinics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Service 3: Laboratories */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => { setSearchQuery('Laboratory'); setView('doctors'); }}
              className="bg-white p-6 rounded-2xl border border-[#D1E5E5]/70 flex flex-col justify-between transition-all hover:border-amber-500 hover:shadow-[0_12px_24px_rgba(245,166,35,0.04)] cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 mb-5 shadow-xs">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1A2B3C] group-hover:text-amber-600 transition-colors font-heading mb-2">Laboratory Tests</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Schedule diagnostic tests, health screenings, and comprehensive blood work with certified NABL home sample collection desks.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 mt-5 uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Book Lab Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Service 4: Physiotherapy */}
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => { setSearchQuery('Physiotherapy'); setView('doctors'); }}
              className="bg-white p-6 rounded-2xl border border-[#D1E5E5]/70 flex flex-col justify-between transition-all hover:border-orange-500 hover:shadow-[0_12px_24px_rgba(249,115,22,0.04)] cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 bg-orange-50 group-hover:bg-orange-500 text-orange-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 mb-5 shadow-xs">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1A2B3C] group-hover:text-orange-600 transition-colors font-heading mb-2">Physiotherapy Services</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Connect with registered physical therapists, ortho-rehab specialists, and sports injury professionals for home care.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 mt-5 uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Book Physiotherapist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. SPECIALTY ICON GRID */}
      <section className="py-20 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto" id="specialty-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <span className="text-xs font-black text-[#0A6E6E] uppercase tracking-widest block mb-1">Clinical Specialties</span>
            <h2 className="text-2xl md:text-3xl font-black font-heading text-[#1A2B3C] tracking-tight">Browse by Expertise</h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Connect directly with certified practitioners matching your specific treatment needs</p>
          </div>
          <button 
            onClick={() => setView('specialties')}
            className="text-[#0A6E6E] text-xs font-black flex items-center gap-1 hover:gap-2 transition-all group cursor-pointer"
          >
            <span>View All Specialties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {SPECIALTIES.map((spec, idx) => (
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              key={`specialty-${spec.name}-${idx}`}
              onClick={() => handleSpecialtyClick(spec.name)}
              className="bg-white p-5 rounded-2xl border border-[#D1E5E5]/70 flex flex-col items-center gap-4 transition-all hover:border-[#0A6E6E] hover:shadow-[0_8px_24px_rgba(10,110,110,0.04)] cursor-pointer group"
            >
              <div className="w-14 h-14 bg-[#F0F7F7] rounded-2xl flex items-center justify-center text-2xl group-hover:bg-[#0A6E6E] transition-all duration-300">
                {spec.icon}
              </div>
              <span className="text-xs font-extrabold text-center text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors">{spec.name}</span>
            </motion.div>
          ))}
        </div>
      </section>



      {/* 3. TOP RATED DOCTORS */}
      <section className="py-20 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto" id="top-doctors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <span className="text-xs font-black text-[#0A6E6E] uppercase tracking-widest block mb-1">Vetted Professionals</span>
            <h2 className="text-2xl md:text-3xl font-black font-heading text-[#1A2B3C] tracking-tight">Highly Rated Practitioners</h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Book consultations with verified, highly rated clinical experts in India</p>
          </div>
          <button 
            onClick={() => setView('doctors')}
            className="text-[#0A6E6E] text-xs font-black border-b-2 border-[#0A6E6E] hover:text-[#0A6E6E]/80 pb-0.5 transition-colors cursor-pointer"
          >
            See All Doctors
          </button>
        </div>

        {activeDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeDoctors.slice(0, 3).map((doc, idx) => (
              <DoctorCard 
                key={doc.id ? `doc-card-${doc.id}-${idx}` : `doc-card-idx-${idx}`}
                doctor={doc}
                variant="vertical"
                onBook={handleBook}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-[#D1E5E5] flex flex-col items-center justify-center text-center py-16 shadow-xs">
            <span className="text-4xl mb-4">🩺</span>
            <h4 className="text-sm font-black text-[#1A2B3C] mb-1">No Active Verified Doctors</h4>
            <p className="text-xs text-gray-400 max-w-md leading-relaxed">Verified doctors and specialists registered under the platform will appear here once approved by our verification department.</p>
            <button
              onClick={() => setView('register-doctor')}
              className="mt-6 px-5 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Onboard Doctor Profile
            </button>
          </div>
        )}
      </section>

      {/* 4. STATS COUNTER */}
      <section className="bg-gradient-to-r from-[#0A6E6E] via-[#0E7490] to-[#0A6E6E] text-white py-16 px-6 md:px-12 lg:px-16 shrink-0 relative overflow-hidden" id="stats-counter">
        <div className="absolute inset-0 bg-white/[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center relative z-10" id="stats-metrics-grid">
          <div>
            <div className="text-3xl md:text-5xl font-black tracking-tight font-heading mb-1.5 drop-shadow-sm">
              {stats.doctors.toLocaleString()}+
            </div>
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-[#D1E5E5]/90">Total Doctors</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black tracking-tight font-heading mb-1.5 drop-shadow-sm">
              {stats.clinics.toLocaleString()}+
            </div>
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-[#D1E5E5]/90">Total Clinics</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black tracking-tight font-heading mb-1.5 drop-shadow-sm">
              {stats.laboratories.toLocaleString()}+
            </div>
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-[#D1E5E5]/90">Total Laboratories</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black tracking-tight font-heading mb-1.5 drop-shadow-sm">
              {stats.physiotherapists.toLocaleString()}+
            </div>
            <div className="text-[10px] uppercase tracking-widest font-extrabold text-[#D1E5E5]/90">Total Physiotherapists</div>
          </div>
        </div>
      </section>

      {/* 5. PATIENT TESTIMONIALS */}
      <section className="py-20 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto" id="testimonials">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
          <div>
            <span className="text-xs font-black text-[#0A6E6E] uppercase tracking-widest block mb-1">Success Stories</span>
            <h2 className="text-2xl md:text-3xl font-black font-heading text-[#1A2B3C] tracking-tight">What Our Patients Say</h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Genuine, verified reviews from patients who booked specialists through Doct Spark</p>
          </div>

          {/* Navigation Slider Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={prevSlide}
              aria-label="Previous Testimonial"
              className="p-2.5 border border-[#D1E5E5] bg-white rounded-xl hover:bg-[#F0F7F7] hover:border-[#0A6E6E] text-[#0A6E6E] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Testimonial"
              className="p-2.5 border border-[#D1E5E5] bg-white rounded-xl hover:bg-[#F0F7F7] hover:border-[#0A6E6E] text-[#0A6E6E] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel View Track */}
        <div>
          {visibleReviews.single ? (
            <>
              {/* Mobile Single Card View */}
              <div className="block md:hidden">
                <div className="bg-white p-5 rounded-2xl border border-[#D1E5E5]/70 flex flex-col justify-between shadow-xs min-h-[170px] animate-in fade-in duration-300">
                  <div>
                    <div className="flex gap-0.5 text-[#F5A623] mb-3">
                      {[...Array(Math.max(0, Math.floor(visibleReviews.single.rating || 0)))].map((_, i) => (
                        <Star key={`star-single-${i}`} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed mb-4">
                      "{visibleReviews.single.comment}"
                    </p>
                  </div>
                  <div className="border-t border-gray-100/80 pt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-[#1A2B3C]">{visibleReviews.single.patientName}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">{visibleReviews.single.date}</span>
                    </div>
                    {visibleReviews.single.doctorName && (
                      <span className="text-[10px] bg-[#F0F7F7] text-[#0A6E6E] font-extrabold px-3 py-1 rounded-full border border-[#D1E5E5]/40">
                        {visibleReviews.single.doctorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop/Tablet Multi Card View */}
              <div className="hidden md:grid grid-cols-3 gap-6">
                {visibleReviews.triple.map((rev, index) => (
                  <motion.div 
                    whileHover={{ y: -3 }}
                    key={`review-card-${rev.id || index}`} 
                    className="bg-white p-5 rounded-2xl border border-[#D1E5E5]/70 flex flex-col justify-between shadow-xs min-h-[170px] transition-all hover:border-[#0A6E6E]/30 animate-in fade-in duration-300"
                  >
                    <div>
                      <div className="flex gap-0.5 text-[#F5A623] mb-3">
                        {[...Array(Math.max(0, Math.floor(rev.rating || 0)))].map((_, i) => (
                          <Star key={`star-rev-${rev.id || index}-${i}`} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 italic leading-relaxed mb-4">
                        "{rev.comment}"
                      </p>
                    </div>
                    <div className="border-t border-gray-100/80 pt-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-[#1A2B3C]">{rev.patientName}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">{rev.date}</span>
                      </div>
                      {rev.doctorName && (
                        <span className="text-[10px] bg-[#F0F7F7] text-[#0A6E6E] font-extrabold px-3 py-1 rounded-full border border-[#D1E5E5]/40">
                          {rev.doctorName}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Slider Progress Dots */}
              {MOCK_REVIEWS.length > 0 && (
                <div className="flex justify-center gap-2 mt-6">
                  {MOCK_REVIEWS.map((_, idx) => (
                    <button
                      key={`slide-dot-${idx}`}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${currentSlide === idx ? 'w-6 bg-[#0A6E6E]' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-dashed border-[#D1E5E5] flex flex-col items-center justify-center text-center py-10 shadow-xs">
              <span className="text-2xl mb-2">⭐</span>
              <h4 className="text-xs font-extrabold text-[#1A2B3C] mb-1">No Reviews Available Yet</h4>
              <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed">Newly onboarded verified physicians and clinics will receive ratings and client reviews after completing their scheduled consultation appointments.</p>
            </div>
          )}
        </div>
      </section>

      {/* 6. HEALTH BLOGS SECTION */}
      <section className="bg-white py-20 px-6 md:px-12 lg:px-16 border-t border-[#D1E5E5]/50" id="blog-preview-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
            <div>
              <span className="text-xs font-black text-[#0A6E6E] uppercase tracking-widest block mb-1">Medical Insights</span>
              <h2 className="text-2xl md:text-3xl font-black font-heading text-[#1A2B3C] tracking-tight">Our Curated Medical Blog</h2>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Up-to-date health guidelines, research, and preventive care curated by leading clinicians</p>
            </div>
            <a href="#" className="text-xs font-black text-[#0A6E6E] hover:underline cursor-pointer">Read All Posts</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, idx) => (
              <article key={`blog-post-${post.id || idx}`} className="group border border-[#D1E5E5]/70 rounded-2xl overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.03)] hover:border-[#0A6E6E]/20 transition-all duration-300 bg-white">
                <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                  <span className="absolute top-3.5 left-3.5 bg-[#0A6E6E]/90 backdrop-blur-xs text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <a href="#" className="text-xs text-[#0A6E6E] font-bold inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. DOWNLOAD APP BANNER */}
      <section className="py-16 px-6 md:px-10 max-w-7xl mx-auto" id="download-app-banner">
        <div className="bg-gradient-to-r from-[#0A6E6E] to-[#074E4E] rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          {/* Subtle design circles */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-white/5"></div>
          <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-white/5"></div>

          <div className="max-w-xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F5A623] block mb-2">Healthcare in Your Pocket</span>
            <h2 className="text-2xl md:text-4xl font-bold font-heading mb-4">Download the Doct Spark Companion App</h2>
            <p className="text-xs md:text-sm text-[#D1E5E5] leading-relaxed mb-6">
              Track active appointments, keep encrypted medical files, receive custom reminders for medication, and initiate video visits seamlessly on-the-go.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="bg-white text-[#0A6E6E] hover:bg-gray-100 px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                <Smartphone className="w-4 h-4 text-[#F5A623]" /> App Store (iOS)
              </button>
              <button className="bg-[#1A2B3C] hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border border-gray-800">
                <span>▶</span> Google Play Store (Android)
              </button>
            </div>
          </div>

          <div className="w-full md:w-72 shrink-0 flex items-center justify-center relative">
            {/* Visual Phone mockup simulation using HTML elements */}
            <div className="w-44 h-80 bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-xl p-2 relative flex flex-col overflow-hidden">
              {/* Notch */}
              <div className="w-16 h-3 bg-slate-900 mx-auto rounded-full mb-2"></div>
              {/* Screen Content */}
              <div className="bg-[#F0F7F7] flex-1 rounded-2xl p-2 flex flex-col text-slate-800 text-[8px]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-extrabold text-[#0A6E6E]">Doct Spark</span>
                  <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
                </div>
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 mb-1">
                  <div className="font-extrabold">Your Appointment</div>
                  <div className="text-[6px] text-gray-500">Dr. Rajesh Khanna • 4:00 PM</div>
                </div>
                <div className="flex-1 bg-slate-100 rounded-lg flex items-center justify-center flex-col text-center p-1 mt-1 border border-dashed border-gray-300">
                  <BadgeCheck className="w-5 h-5 text-[#0A6E6E]" />
                  <span className="font-bold text-[6px] mt-1">100% Vetted Doctors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
