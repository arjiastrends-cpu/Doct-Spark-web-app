/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, User, ShieldAlert, Video, Calendar, Bell, Stethoscope, LogOut, Menu, X, 
  ChevronDown, ChevronRight, Search, Globe, Sun, Moon, MessageSquare, Plus, Check, Settings, 
  Activity, Building2, Wallet, Users, Award, ShieldCheck, Heart, MapPin, Home, 
  Sliders, CreditCard, Target, FileText, BookOpen, UserCheck, HelpCircle, AlertCircle, 
  CheckCircle, Clock, Send, Phone, ArrowRight, Share2, Bookmark, Flame, Sparkles,
  Pill, FlaskConical, Dumbbell
} from 'lucide-react';
import { Role } from '../../types';
import { supabase } from '../../lib/supabase';

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: Role | null;
  setUserRole: (role: Role | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  setSearchQuery?: (q: string) => void;
}

// Interactive Blog Article interface
interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Cardiology' | 'Wellness' | 'Digital Health' | 'General';
  author: string;
  authorTitle: string;
  readTime: string;
  date: string;
  imageUrl: string;
}

const MOCK_BLOG_ARTICLES: BlogArticle[] = [];

export default function Header({
  currentView,
  setView,
  userRole,
  setUserRole,
  userEmail,
  setUserEmail,
  notificationsCount,
  onOpenNotifications,
  setSearchQuery
}: HeaderProps) {
  // Navigation & Dropdown states
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [patientDisplayName, setPatientDisplayName] = useState(() => {
    if (!userEmail) return '';
    if (userRole !== 'patient') return '';
    if (userEmail === 'aarav.mehta@doctspark.in') return "Aarav Mehta";
    return localStorage.getItem(`ds_patient_name_${userEmail}`) || '';
  });

  useEffect(() => {
    if (userEmail && userRole === 'patient') {
      if (userEmail === 'aarav.mehta@doctspark.in') {
        setPatientDisplayName("Aarav Mehta");
        return;
      }
      const stored = localStorage.getItem(`ds_patient_name_${userEmail}`) || '';
      setPatientDisplayName(stored);
    } else {
      setPatientDisplayName('');
    }
  }, [userEmail, userRole]);

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string }>;
      if (customEvent.detail && customEvent.detail.name) {
        setPatientDisplayName(customEvent.detail.name);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showProDropdown, setShowProDropdown] = useState(false);
  
  // Custom Modals & Overlays
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [selectedBlogArticle, setSelectedBlogArticle] = useState<BlogArticle | null>(null);
  const [blogCategoryFilter, setBlogCategoryFilter] = useState<string>('All');
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactInquiries, setContactInquiries] = useState<any[]>([]);

  // Messages Chat Hub States
  const [messagesCount, setMessagesCount] = useState(3);
  const [showMessagesDrawer, setShowMessagesDrawer] = useState(false);

  // Custom Global Search filtering on searchable mock items
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  const isHome = currentView === 'home';

  // Dynamic header styling
  const headerClass = isHome 
    ? "sticky top-0 z-50 w-full bg-[#0A6E6E] dark:bg-slate-950 border-b border-[#0A6E6E]/10 dark:border-slate-900 transition-colors duration-300"
    : "sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[#D1E5E5]/60 dark:border-slate-800 transition-colors duration-300";

  // Navigation Links Text Color
  const navLinkClass = (viewName: string) => {
    if (isHome) {
      return `px-3 py-2 rounded-xl transition-all hover:bg-white/10 hover:text-emerald-400 whitespace-nowrap ${
        currentView === viewName ? 'text-white font-bold bg-white/15' : 'text-teal-50'
      }`;
    } else {
      return `px-3 py-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap ${
        currentView === viewName ? 'text-[#0A6E6E] dark:text-teal-400 font-bold bg-[#0A6E6E]/5' : 'text-slate-600 dark:text-slate-300'
      }`;
    }
  };

  // Header Logo clicker elements
  const logoTextClass = isHome ? "text-teal-300 dark:text-teal-400" : "text-[#0A6E6E] dark:text-teal-400";
  const logoSubtextClass = isHome ? "text-teal-100" : "text-slate-400";
  const logoBadgeClass = isHome 
    ? "bg-white/20 text-white border border-white/10" 
    : "bg-[#0A6E6E]/10 dark:bg-teal-500/10 text-[#0A6E6E] dark:text-teal-400 border border-[#0A6E6E]/10";
  const logoIconBgClass = isHome 
    ? "w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105" 
    : "w-10 h-10 bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(10,110,110,0.35)] group-hover:scale-105";

  // Menu Trigger buttons (e.g. Hamburger button on desktop and mobile)
  const hamburgerBtnClass = isHome
    ? "p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer mr-1 flex items-center justify-center"
    : "p-2 text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] hover:bg-[#F0F7F7] dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer mr-1 flex items-center justify-center";

  // General buttons (search, language, theme, messages, notifications)
  const iconBtnClass = isHome
    ? "p-2.5 text-teal-50 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
    : "p-2.5 text-slate-500 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 rounded-xl hover:bg-[#F0F7F7] dark:hover:bg-slate-800 transition-all cursor-pointer";

  const notificationsBellClass = isHome
    ? "p-2.5 text-teal-50 hover:text-white rounded-xl hover:bg-white/10 transition-all relative cursor-pointer"
    : "p-2.5 text-slate-500 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 rounded-xl hover:bg-[#F0F7F7] dark:hover:bg-slate-800 transition-all relative cursor-pointer";

  const profileDropdownTriggerClass = isHome
    ? "flex items-center gap-1.5 p-1 rounded-xl hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
    : "flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#F0F7F7] dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none";

  const chevronDownClass = isHome ? "text-white/65" : "text-slate-400";

  // For Providers Dropdown Trigger
  const proDropdownTriggerClass = isHome
    ? "hidden lg:flex items-center gap-1 px-3 py-2 text-xs font-bold text-teal-50 hover:text-emerald-400 rounded-xl hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap"
    : "hidden lg:flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap";

  // Role selector
  const roleSelectorClass = isHome
    ? "hidden md:flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-amber-200 bg-white/10 hover:bg-white/15 rounded-full transition-all border border-white/10 cursor-pointer"
    : "hidden md:flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 rounded-full transition-all border border-amber-100 dark:border-amber-900/30 cursor-pointer";

  const roleShieldClass = isHome ? "text-amber-300" : "text-amber-500";

  // Services dropdown trigger
  const servicesTriggerClass = isHome
    ? `flex items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-white/10 text-teal-50 hover:text-emerald-400 whitespace-nowrap ${
        activeDropdown === 'services' ? 'bg-white/15 text-white' : ''
      }`
    : `flex items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap ${
        activeDropdown === 'services' ? 'bg-[#0A6E6E]/5 text-[#0A6E6E] dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'
      }`;

  // Login and Register button styling
  const loginBtnClass = isHome
    ? "px-4 py-2 text-xs font-bold text-white bg-[#0A6E6E] hover:bg-[#085353] border border-white/20 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs"
    : "px-4 py-2 text-xs font-bold text-white bg-[#0A6E6E] hover:bg-[#085353] dark:bg-[#0A6E6E] dark:hover:bg-[#085353] rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs";

  const registerBtnClass = isHome
    ? "px-4 py-2 text-xs font-bold text-white bg-[#0A6E6E] hover:bg-[#085353] border border-white/20 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
    : "px-4 py-2 text-xs font-bold text-white bg-[#0A6E6E] hover:bg-[#085353] rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap";

  // Mobile bar styling
  const mobileHeaderBarClass = isHome
    ? "lg:hidden w-full bg-[#0A6E6E] dark:bg-slate-950 border-b border-[#0A6E6E]/20 dark:border-slate-800 px-4 h-14 flex items-center justify-between"
    : "lg:hidden w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 h-14 flex items-center justify-between";

  const mobileHamburgerClass = isHome
    ? "p-2 text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
    : "p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer";

  const mobileSearchClass = isHome
    ? "p-2 text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
    : "p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer";

  const mobileLogoTextClass = isHome ? "text-teal-300 dark:text-teal-400" : "text-[#0A6E6E] dark:text-teal-400";

  const mobileLogoBgClass = isHome
    ? "bg-white/15 border border-white/20 rounded-lg flex items-center justify-center"
    : "bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-lg flex items-center justify-center";

  // Custom current language
  const [currentLanguage, setCurrentLanguage] = useState('EN');

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('ds_theme') === 'dark';
  });

  // Track expanded sections in mobile drawer
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<Record<string, boolean>>({
    services: false,
    professionals: false
  });

  const headerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync dark mode on load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setShowProfileDropdown(false);
        setShowLanguageDropdown(false);
        setShowRoleSelector(false);
        setShowProDropdown(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setShowProfileDropdown(false);
        setShowLanguageDropdown(false);
        setShowRoleSelector(false);
        setShowProDropdown(false);
        setIsMobileDrawerOpen(false);
        setShowMessagesDrawer(false);
        setShowGlobalSearch(false);
        setShowBlogModal(false);
        setShowContactModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Sync touch gestures on the mobile side-drawer
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // swipe left to close
    if (isLeftSwipe) {
      setIsMobileDrawerOpen(false);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Live filter mock search suggestions
  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const query = globalSearchQuery.toLowerCase();
    
    const staticItems = [
      { type: 'doctor', name: 'Dr. Amit Sharma', subtitle: 'Cardiologist • Mumbai', action: () => { setView('doctors'); handleSearchAction('Dr. Amit Sharma'); } },
      { type: 'doctor', name: 'Dr. Priya Patil', subtitle: 'General Physician • Pune', action: () => { setView('doctors'); handleSearchAction('Dr. Priya Patil'); } },
      { type: 'doctor', name: 'Dr. Rohan Deshmukh', subtitle: 'Pathologist • Mumbai', action: () => { setView('doctors'); handleSearchAction('Dr. Rohan Deshmukh'); } },
      { type: 'specialty', name: 'Cardiology', subtitle: 'Heart specialists, ECG & chest pain', action: () => { setView('doctors'); handleSearchAction('Cardiologist'); } },
      { type: 'specialty', name: 'Dermatology', subtitle: 'Skin, acne & hair treatments', action: () => { setView('doctors'); handleSearchAction('Dermatologist'); } },
      { type: 'specialty', name: 'Pediatrics', subtitle: 'Child healthcare & vaccination schedules', action: () => { setView('doctors'); handleSearchAction('Pediatrician'); } },
      { type: 'clinic', name: 'Spandan Clinic Network', subtitle: 'Multi-specialty center • Pune', action: () => { setView('clinics'); } },
      { type: 'clinic', name: 'Pulse Diagnostics Center', subtitle: 'Verified lab screening hub • Mumbai', action: () => { setView('clinics'); } },
      { type: 'service', name: 'Video Consultation', subtitle: 'Teleconsultation specialists', action: () => { setView('doctors'); handleSearchAction('teleconsultation'); } },
      { type: 'service', name: 'Lab Tests', subtitle: 'At-home diagnostic screenings', action: () => { setView('clinics'); alert('🧪 Lab Test Booking Module: Choose a verified clinic to select blood profiles.'); } }
    ];

    const filtered = staticItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.subtitle.toLowerCase().includes(query)
    );
    setSearchSuggestions(filtered);
  }, [globalSearchQuery]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showGlobalSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showGlobalSearch]);

  const handleSearchAction = (value: string) => {
    setShowGlobalSearch(false);
    setGlobalSearchQuery('');
    setTimeout(() => {
      const searchInput = document.getElementById('doctors-search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = value;
        const event = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(event);
      }
    }, 300);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    setView('doctors');
    handleSearchAction(globalSearchQuery);
  };

  // Toggle visual theme
  const handleThemeToggle = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('ds_theme', nextMode ? 'dark' : 'light');
  };

  // Toggle mobile accordion
  const toggleMobileAccordion = (key: string) => {
    setExpandedMobileMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = async () => {
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signout failed during logout:', e);
    }
    const correctLoginView = userRole === 'partner' ? 'partner-login' : 'login';
    setUserRole(null);
    setUserEmail(null);
    setView(correctLoginView);
    setShowProfileDropdown(false);
    setActiveDropdown(null);
  };

  // Quick Action Button details based on role
  const getQuickActionDetails = () => {
    if (userRole === 'patient') {
      return {
        label: 'Patient Portal',
        onClick: () => setView('patient-dashboard'),
        style: 'bg-[#0A6E6E] hover:bg-[#085353] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all'
      };
    }
    if (userRole === 'doctor') {
      return {
        label: 'Doctor timings',
        onClick: () => {
          setView('doctor-dashboard');
          window.dispatchEvent(new CustomEvent('doctor-tab-change', { detail: 'schedule' }));
        },
        style: 'bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all'
      };
    }
    if (userRole === 'clinic') {
      return {
        label: 'Clinic Roster',
        onClick: () => {
          setView('clinic-dashboard');
        },
        style: 'bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all'
      };
    }
    if (userRole === 'partner') {
      return {
        label: 'Partner Console',
        onClick: () => {
          setView('partner-dashboard');
        },
        style: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all'
      };
    }
    if (userRole === 'superadmin') {
      return {
        label: 'Admin Portal',
        onClick: () => {
          setView('superadmin-dashboard');
        },
        style: 'bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all'
      };
    }
    return {
      label: 'Book Appointment',
      onClick: () => setView('doctors'),
      style: 'bg-[#0A6E6E] hover:bg-[#085353] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#0A6E6E]/10 hover:shadow-lg transition-all animate-pulse-subtle'
    };
  };

  const quickAction = getQuickActionDetails();

  // Contact Inquiry Handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    const newInquiry = {
      id: 'inq-' + Date.now(),
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      message: contactMessage,
      timestamp: new Date().toLocaleString()
    };
    const updatedInquiries = [newInquiry, ...contactInquiries];
    setContactInquiries(updatedInquiries);
    localStorage.setItem('ds_contact_inquiries', JSON.stringify(updatedInquiries));
    setContactSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactMessage('');
  };

  return (
    <header 
      ref={headerRef}
      className={headerClass}
      id="main-header"
    >
      <div className="hidden lg:flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 items-center justify-between">
        
        {/* BRAND LOGO (Left Side) */}
        <div className="flex items-center gap-2">
          {/* Hamburger menu trigger - Made always visible on desktop too so users can see the beautiful Sidebar/Menu bar easily */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className={hamburgerBtnClass}
            id="mobile-hamburger-btn"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
 
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => setView('home')}
            id="header-logo-clicker"
          >
            <div className={logoIconBgClass}>
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`text-base sm:text-lg font-black tracking-tight select-none leading-none ${logoTextClass}`}>
                DOCT<span className="text-[#F5A623] ml-0.5 font-bold">SPARK</span>
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${logoSubtextClass}`}>Healthcare SaaS</span>
            </div>
            
            {userRole && (
              <span className={`hidden md:inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${logoBadgeClass}`}>
                {userRole}
              </span>
            )}
          </div>
        </div>
           {/* CENTER DESKTOP NAVIGATION (Center Side) */}
        <nav className={`hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-semibold flex-nowrap whitespace-nowrap ${isHome ? 'text-teal-50' : 'text-slate-600 dark:text-slate-300'}`}>
          
          <button onClick={() => setView('home')} className={navLinkClass('home')}>Home</button>

          <button onClick={() => setView('doctors')} className={navLinkClass('doctors')}>Find Doctors</button>

          <button onClick={() => setView('clinics')} className={navLinkClass('clinics')}>Find Clinics</button>

          <button onClick={() => setView('specialties')} className={navLinkClass('specialties')}>Specialties</button>

          {/* Services (Mega Dropdown Menu) */}
          <div className="relative" onMouseEnter={() => setActiveDropdown('services')} onMouseLeave={() => setActiveDropdown(null)}>
            <button className={servicesTriggerClass} aria-haspopup="true" aria-expanded={activeDropdown === 'services'}><span>Services</span><ChevronDown className={`w-4 h-4 opacity-70 transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180' : ''}`} /></button>

            {activeDropdown === 'services' && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-[480px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 grid grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-2 duration-150"
                id="mega-services-dropdown"
              >
                {/* Mega item 1 */}
                <button 
                  onClick={() => { setView('doctors'); handleSearchAction('teleconsultation'); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 transition-all text-left group/tile"
                >
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/40 text-[#0A6E6E] dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0 group-hover/tile:scale-105 transition-transform">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      Video Consultation <Sparkles className="w-3 h-3 text-amber-500" />
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Consult specialists online in 10 minutes</p>
                  </div>
                </button>

                {/* Mega item 2 */}
                <button 
                  onClick={() => setView('doctors')}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 transition-all text-left group/tile"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 group-hover/tile:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Clinic Appointment</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Book verified local OPD clinical slots</p>
                  </div>
                </button>

                {/* Mega item 3 */}
                <button 
                  onClick={() => { setView('doctors'); setSearchQuery?.('Laboratory'); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 transition-all text-left group/tile"
                >
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0 group-hover/tile:scale-105 transition-transform">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Laboratories</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Home sample diagnostics & lipid reports</p>
                  </div>
                </button>

                {/* Mega item 4 */}
                <button 
                  onClick={() => { setView('doctors'); setSearchQuery?.('Physiotherapy'); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 transition-all text-left group/tile"
                >
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shrink-0 group-hover/tile:scale-105 transition-transform">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Physiotherapy</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Home physical therapy & rehab care</p>
                  </div>
                </button>

                {/* Mega item 5 */}
                <button 
                  onClick={() => { setView('specialties'); alert('📦 Preventative Health Packages: View curated packages inside Specialties hub.'); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 transition-all text-left group/tile"
                >
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0 group-hover/tile:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Health Packages</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Full body screening for you & your family</p>
                  </div>
                </button>

                {/* Mega item 6 */}
                <button 
                  onClick={() => setView('specialties')}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 transition-all text-left group/tile"
                >
                  <div className="w-10 h-10 bg-[#F0F7F7] dark:bg-teal-950/40 text-[#0A6E6E] dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0 group-hover/tile:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">All Specialties</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Consult specialists across 12+ disciplines</p>
                  </div>
                </button>

                {/* Bottom promotional ribbon */}
                <div className="col-span-2 mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Enjoy 15% discount on first Teleconsultation booking!
                  </span>
                  <button onClick={() => { setView('doctors'); handleSearchAction('teleconsultation'); }} className="text-[10px] font-black text-[#0A6E6E] dark:text-teal-400 hover:underline">
                    Consult Now
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setShowBlogModal(true)} className={navLinkClass('blog')}>Health Blog</button>

          <button onClick={() => setView('page-about-us')} className={navLinkClass('page-about-us')}>About Us</button>

          <button onClick={() => setShowContactModal(true)} className={navLinkClass('contact')}>Contact</button>

        </nav>

        {/* RIGHT DESKTOP ACTION PANEL (Right Side) */}
        <div className="flex items-center gap-2 xl:gap-2.5">
          
          {/* Global Search trigger */}
          <button onClick={() => setShowGlobalSearch(true)} className={iconBtnClass} aria-label="Toggle global lookup bar" id="search-overlay-trigger"><Search className="w-4.5 h-4.5" /></button>

          {/* Unified "For Professionals" Dropdown (Desktop only) */}
          {!userRole && (
            <div className="relative">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProDropdown(!showProDropdown);
                  setActiveDropdown(null);
                  setShowProfileDropdown(false);
                  setShowLanguageDropdown(false);
                  setShowRoleSelector(false);
                }} 
                onMouseDown={(e) => e.stopPropagation()}
                className={proDropdownTriggerClass} 
                id="professionals-dropdown-trigger"
              >
                <span>Providers</span>
                <ChevronDown className={`w-4 h-4 opacity-70 transition-transform duration-200 ${showProDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button onClick={() => { setView('login'); setShowProDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex flex-col gap-0.5 transition-colors"><span className="font-bold flex items-center gap-1.5 text-[#0A6E6E] dark:text-teal-400"><Users className="w-3.5 h-3.5" /> Become a Partner</span><span className="text-[10px] text-slate-400">Onboard doctors and earn commissions</span></button>
                  <button onClick={() => { setView('register-doctor'); setShowProDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex flex-col gap-0.5 transition-colors"><span className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><Stethoscope className="w-3.5 h-3.5" /> Register as Doctor</span><span className="text-[10px] text-slate-400">Consult patients virtually and offline</span></button>
                  <button onClick={() => { setView('register-clinic'); setShowProDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex flex-col gap-0.5 transition-colors"><span className="font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400"><Building2 className="w-3.5 h-3.5" /> Join as a Clinic</span><span className="text-[10px] text-slate-400">Manage multiple practitioners in one panel</span></button>
                  <div className="border-t border-slate-50 dark:border-slate-800/50 my-1"></div>
                  <button onClick={() => { setView('register-pharmacy'); setShowProDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex flex-col gap-0.5 transition-colors"><span className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Pill className="w-3.5 h-3.5" /> Join as Pharmacy / PharmEasy</span><span className="text-[10px] text-slate-400">Onboard PharmEasy / local drug store</span></button>
                  <button onClick={() => { setView('register-laboratory'); setShowProDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex flex-col gap-0.5 transition-colors"><span className="font-bold flex items-center gap-1.5 text-violet-600 dark:text-violet-400"><FlaskConical className="w-3.5 h-3.5" /> Onboard Laboratory</span><span className="text-[10px] text-slate-400">Offer health and diagnostics testing</span></button>
                  <button onClick={() => { setView('register-physiotherapy'); setShowProDropdown(false); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex flex-col gap-0.5 transition-colors"><span className="font-bold flex items-center gap-1.5 text-pink-600 dark:text-pink-400"><Dumbbell className="w-3.5 h-3.5" /> Join as Physiotherapist</span><span className="text-[10px] text-slate-400">Provide rehabilitation & physical care</span></button>
                </div>
              )}
            </div>
          )}

          {/* Messages inbox drawer (Authenticated Users) */}
          {userRole && (
            <button onClick={() => setShowMessagesDrawer(true)} className={notificationsBellClass} aria-label="View notifications messages"><MessageSquare className="w-4.5 h-4.5" />{messagesCount > 0 && <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-black animate-bounce-subtle">{messagesCount}</span>}</button>
          )}

          {/* Notifications bell (Authenticated Users) */}
          {userRole && (
            <button onClick={onOpenNotifications} className={notificationsBellClass} aria-label="View app notifications" id="notifications-bell-desktop"><Bell className="w-4.5 h-4.5" />{notificationsCount > 0 && <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">{notificationsCount}</span>}</button>
          )}

          {/* Profile Dropdown or Login Buttons */}
          {userRole ? (
            <div className="relative">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowProDropdown(false);
                  setActiveDropdown(null);
                  setShowLanguageDropdown(false);
                  setShowRoleSelector(false);
                }} 
                onMouseDown={(e) => e.stopPropagation()}
                className={profileDropdownTriggerClass} 
                aria-label="My Account Menu"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] text-white flex items-center justify-center text-xs font-black uppercase shadow-xs">
                  {userEmail ? userEmail.substring(0, 2) : 'US'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${chevronDownClass} ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in duration-100">
                  <div className="px-4 pb-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Signed In As</span>
                    {patientDisplayName && (
                      <span className="block text-sm font-black text-[#0A6E6E] dark:text-teal-400 mb-0.5">{patientDisplayName}</span>
                    )}
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{userEmail}</span>
                    <span className="inline-block bg-[#0A6E6E]/10 dark:bg-teal-400/10 text-[#0A6E6E] dark:text-teal-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5">{userRole} Account</span>
                  </div>

                  <div className="flex flex-col">
                    <button onClick={() => { setShowProfileDropdown(false); if (userRole === 'patient') setView('patient-dashboard'); if (userRole === 'doctor') setView('doctor-dashboard'); if (userRole === 'clinic') setView('clinic-dashboard'); if (userRole === 'partner') setView('partner-dashboard'); if (userRole === 'superadmin') setView('superadmin-dashboard'); }} className="w-full text-left px-4 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"><User className="w-4 h-4 text-[#0A6E6E] dark:text-teal-400" /> My Dashboard</button>
                    <button onClick={() => { setShowProfileDropdown(false); alert('🔧 Dynamic Account configuration model is ready.'); }} className="w-full text-left px-4 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors"><Settings className="w-4 h-4 text-slate-400" /> Account Settings</button>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/15 text-xs font-black text-red-500 uppercase tracking-wide flex items-center gap-2.5 transition-colors"><LogOut className="w-4 h-4 text-red-500" /> Sign Out Account</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={() => setView('login')} className={loginBtnClass} id="login-btn-header">Login</button>
              <button onClick={() => setView('register')} className={registerBtnClass} id="register-btn-header">Register</button>
            </div>
          )}

          {/* Quick Primary CTA Action button */}
          <button type="button" onClick={quickAction.onClick} className={`${quickAction.style} hidden lg:inline-block cursor-pointer whitespace-nowrap`}>{quickAction.label}</button>
          
        </div>
      </div>

      {/* MOBILE HEADER BAR - Hamburger (Left), Logo (Center), Search (Right) as requested */}
      <div className={mobileHeaderBarClass}>
        {/* Left Hand: Hamburger Menu icon */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className={mobileHamburgerClass}
          aria-label="Open side drawer list"
          id="mobile-nav-hamburger"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center: Brand Logo */}
        <div 
          onClick={() => setView('home')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className={mobileLogoBgClass + " w-8 h-8"}>
            <Stethoscope className="w-4.5 h-4.5 text-white" />
          </div>
          <span className={`text-sm font-black tracking-tight select-none ${mobileLogoTextClass}`}>
            DOCT<span className="text-[#F5A623]">SPARK</span>
          </span>
        </div>

        {/* Right Hand: Search Icon */}
        <button
          onClick={() => setShowGlobalSearch(true)}
          className={mobileSearchClass}
          aria-label="Open search engine lookup"
          id="mobile-search-toggle"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE SIDE NAVIGATION DRAWER (Slides smoothly from Left side as requested) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[100]" id="mobile-navigation-canvas">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          
          {/* Mobile Slide Drawer Panel */}
          <div 
            className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 shadow-2xl border-r border-[#D1E5E5] dark:border-slate-800 p-5 flex flex-col justify-between animate-in slide-in-from-left duration-250 ease-out z-10"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-grow overflow-y-auto pr-1 max-h-[calc(100vh-140px)] scrollbar-none">
              
              {/* Drawer Top Header section */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-black tracking-tight text-[#0A6E6E] dark:text-teal-400">
                    DOCT<span className="text-[#F5A623]">SPARK</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  aria-label="Close drawer navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Collapsible Mobile Drawer Navigation Links */}
              <nav className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 px-3">
                  Main Portal Directory
                </span>

                <button
                  onClick={() => { setView('home'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 ${
                    currentView === 'home' ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/5 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Home
                </button>

                <button
                  onClick={() => { setView('doctors'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 ${
                    currentView === 'doctors' ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/5 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Find Doctors
                </button>

                <button
                  onClick={() => { setView('clinics'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 ${
                    currentView === 'clinics' ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/5 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Find Clinics
                </button>

                <button
                  onClick={() => { setView('specialties'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 ${
                    currentView === 'specialties' ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/5 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Specialties
                </button>

                {/* Collapsible Services submenu in mobile */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleMobileAccordion('services')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex items-center justify-between cursor-pointer"
                  >
                    <span>Our Services</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedMobileMenus.services ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedMobileMenus.services && (
                    <div className="pl-4 pr-1 mt-1 mb-2 border-l border-slate-100 dark:border-slate-800 ml-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1">
                      <button
                        onClick={() => { setView('doctors'); handleSearchAction('teleconsultation'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Video className="w-3.5 h-3.5 text-[#0A6E6E] dark:text-teal-400" /> Video Consultation
                      </button>
                      <button
                        onClick={() => { setView('doctors'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> Clinic Appointment
                      </button>
                      <button
                        onClick={() => { setView('doctors'); setSearchQuery?.('Laboratory'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-purple-500" /> Laboratories
                      </button>
                      <button
                        onClick={() => { setView('doctors'); setSearchQuery?.('Physiotherapy'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Dumbbell className="w-3.5 h-3.5 text-orange-500" /> Physiotherapy
                      </button>
                      <button
                        onClick={() => { setView('specialties'); alert('📦 Preventative Health Packages: View curated packages inside Specialties hub.'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Health Packages
                      </button>
                      <button
                        onClick={() => { setView('specialties'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Activity className="w-3.5 h-3.5 text-teal-500" /> All Specialties
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setShowBlogModal(true); setIsMobileDrawerOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0A6E6E] dark:hover:text-teal-400"
                >
                  Health Blog
                </button>

                <button
                  onClick={() => { setView('page-about-us'); setIsMobileDrawerOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 ${
                    currentView === 'page-about-us' ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/5 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  About Us
                </button>

                <button
                  onClick={() => { setShowContactModal(true); setIsMobileDrawerOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0A6E6E] dark:hover:text-teal-400"
                >
                  Contact
                </button>

                {/* Collapsible Provider Signups in mobile */}
                <div className="flex flex-col">
                  <button
                    onClick={() => toggleMobileAccordion('professionals')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex items-center justify-between cursor-pointer"
                  >
                    <span>For Healthcare Providers</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedMobileMenus.professionals ? 'rotate-180' : ''}`} />
                  </button>

                   {expandedMobileMenus.professionals && (
                    <div className="pl-4 pr-1 mt-1 mb-2 border-l border-slate-100 dark:border-slate-800 ml-4 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1">
                      <button
                        onClick={() => { setView('login'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Users className="w-3.5 h-3.5" /> Become a Partner
                      </button>
                      <button
                        onClick={() => { setView('register-doctor'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Join as Doctor
                      </button>
                      <button
                        onClick={() => { setView('register-clinic'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5" /> Join as Clinic
                      </button>
                      <button
                        onClick={() => { setView('register-pharmacy'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Pill className="w-3.5 h-3.5" /> Join as Pharmacy / PharmEasy
                      </button>
                      <button
                        onClick={() => { setView('register-laboratory'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <FlaskConical className="w-3.5 h-3.5" /> Onboard Laboratory
                      </button>
                      <button
                        onClick={() => { setView('register-physiotherapy'); setIsMobileDrawerOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Dumbbell className="w-3.5 h-3.5" /> Join as Physiotherapist
                      </button>
                    </div>
                  )}
                </div>

              </nav>

              {/* Dynamic user profile or session actions on mobile */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
                {userRole ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3 px-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] text-white flex items-center justify-center font-bold text-sm">
                        {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div className="flex flex-col">
                        {patientDisplayName && (
                          <span className="block text-sm font-black text-[#0A6E6E] dark:text-teal-400 mb-0.5">{patientDisplayName}</span>
                        )}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{userEmail}</span>
                        <span className="text-[10px] text-[#0A6E6E] dark:text-teal-400 font-bold uppercase">{userRole} Account</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          if (userRole === 'patient') setView('patient-dashboard');
                          if (userRole === 'doctor') setView('doctor-dashboard');
                          if (userRole === 'clinic') setView('clinic-dashboard');
                          if (userRole === 'partner') setView('partner-dashboard');
                          if (userRole === 'superadmin') setView('superadmin-dashboard');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-[#0A6E6E] dark:text-teal-400" /> Open My Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-black text-red-500 uppercase rounded-xl flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-red-500" /> Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 px-2">
                    <button
                      onClick={() => { setView('login'); setIsMobileDrawerOpen(false); }}
                      className="w-full py-3 text-center text-xs font-bold text-[#0A6E6E] dark:text-teal-400 bg-[#D1E5E5]/30 hover:bg-[#D1E5E5]/50 dark:bg-teal-950/20 rounded-xl cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { setView('register'); setIsMobileDrawerOpen(false); }}
                      className="w-full py-3 text-center text-xs font-bold text-white bg-[#0A6E6E] hover:bg-[#085353] rounded-xl shadow-xs cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>



            </div>

            {/* Mobile close button drawer tail */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
              >
                Close Drawer Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL FULL-SCREEN SEARCH OVERLAY */}
      {showGlobalSearch && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center pt-24 px-4" id="global-search-viewport">
          {/* Blur Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setShowGlobalSearch(false)}
          />
          
          {/* Centered Search Engine Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl p-5 md:p-6 z-10 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50 dark:border-slate-700">
              <span className="text-[10px] font-black text-[#0A6E6E] dark:text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                <Search className="w-4 h-4" /> Global Lookup Engine
              </span>
              <button 
                onClick={() => setShowGlobalSearch(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-black"
                aria-label="Exit search"
              >
                ✕
              </button>
            </div>

            {/* Giant search form */}
            <form onSubmit={handleGlobalSearchSubmit} className="relative mb-5">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search doctors, clinical branches, specialties, or symptoms..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 text-sm md:text-base font-semibold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#0A6E6E] outline-none transition-all"
                aria-label="Enter clinical search query"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </form>

            {/* Search results & suggestion cards */}
            {globalSearchQuery.trim() ? (
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Live Clinical Results ({searchSuggestions.length})</span>
                {searchSuggestions.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">No active registries match "{globalSearchQuery}"</p>
                    <p className="text-[10px] text-gray-400 leading-normal">Try searching "Physician", "Amit", "Cardiology", "Spandan" or "Lab".</p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                    {searchSuggestions.map((item, index) => (
                      <button
                        key={index}
                        onClick={item.action}
                        className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 hover:bg-[#F0F7F7] dark:hover:bg-teal-950/20 rounded-xl border border-transparent hover:border-[#D1E5E5]/60 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === 'doctor' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                            item.type === 'specialty' ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400' :
                            item.type === 'clinic' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {item.type === 'doctor' ? <Stethoscope className="w-4.5 h-4.5" /> :
                             item.type === 'specialty' ? <Heart className="w-4.5 h-4.5" /> :
                             item.type === 'clinic' ? <Building2 className="w-4.5 h-4.5" /> : <Activity className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Popular Tags Quick search */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Popular Quick Searches</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Cardiologist ❤️', search: 'Cardiologist' },
                      { name: 'General Physician 🩺', search: 'Physician' },
                      { name: 'Dermatologist 🧴', search: 'Dermatologist' },
                      { name: 'Video Consultation 💻', search: 'teleconsultation' },
                      { name: 'Lab Screenings 🧪', search: 'Lab' },
                      { name: 'Pune Clinics 📍', search: 'Pune' }
                    ].map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => {
                          setGlobalSearchQuery(tag.search);
                        }}
                        className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full transition-colors cursor-pointer border border-slate-100 dark:border-slate-800"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-[9px]">ESC</kbd> to exit search</span>
                  <span>DOCT SPARK Certified Directory</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* HEALTH BLOG DRAWER OVERLAY */}
      {showBlogModal && (
        <div className="fixed inset-0 z-[110] flex justify-end" id="health-blog-drawer-overlay">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setShowBlogModal(false);
              setSelectedBlogArticle(null);
            }}
          />
          
          {/* Side Drawer Body */}
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl relative z-10 flex flex-col justify-between animate-in slide-in-from-right duration-250 border-l border-slate-100 dark:border-slate-800">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0A6E6E] dark:text-teal-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  DOCT SPARK Health Articles
                </h3>
              </div>
              <button 
                onClick={() => {
                  if (selectedBlogArticle) {
                    setSelectedBlogArticle(null);
                  } else {
                    setShowBlogModal(false);
                  }
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {selectedBlogArticle ? '← Back to List' : '✕ Close'}
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-5 md:p-6 scrollbar-none">
              {selectedBlogArticle ? (
                // Article Detail View
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="h-48 w-full rounded-2xl overflow-hidden relative shadow-sm">
                    <img 
                      src={selectedBlogArticle.imageUrl} 
                      alt={selectedBlogArticle.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-3 left-3 bg-[#0A6E6E] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                      {selectedBlogArticle.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                      {selectedBlogArticle.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <span>By {selectedBlogArticle.author} ({selectedBlogArticle.authorTitle})</span>
                      <span>•</span>
                      <span>{selectedBlogArticle.date}</span>
                      <span>•</span>
                      <span>{selectedBlogArticle.readTime}</span>
                    </div>
                  </div>

                  <div 
                    className="prose prose-slate dark:prose-invert max-w-none text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-4 space-y-4"
                    dangerouslySetInnerHTML={{ __html: selectedBlogArticle.content }}
                  />

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Did you find this medical article useful?</span>
                    <div className="flex gap-2">
                      <button onClick={() => alert('Article bookmarked in local reading vault!')} className="p-2 text-slate-500 hover:text-[#0A6E6E] hover:bg-slate-100 rounded-lg">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button onClick={() => alert('Article link copied to clipboard!')} className="p-2 text-slate-500 hover:text-[#0A6E6E] hover:bg-slate-100 rounded-lg">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Article List View
                <div className="space-y-6">
                  {/* Category Filter tabs */}
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-50 dark:border-slate-800">
                    {['All', 'Cardiology', 'Digital Health', 'Wellness'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBlogCategoryFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                          blogCategoryFilter === cat 
                            ? 'bg-[#0A6E6E] text-white' 
                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* List items */}
                  <div className="space-y-4">
                    {MOCK_BLOG_ARTICLES.filter(art => blogCategoryFilter === 'All' || art.category === blogCategoryFilter).map(art => (
                      <div 
                        key={art.id}
                        onClick={() => setSelectedBlogArticle(art)}
                        className="flex flex-col md:flex-row gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-[#F0F7F7] dark:hover:bg-teal-950/20 rounded-2xl border border-transparent hover:border-[#D1E5E5]/60 transition-all cursor-pointer group"
                      >
                        <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden shrink-0 shadow-xs">
                          <img 
                            src={art.imageUrl} 
                            alt={art.title} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1.5 flex-grow">
                          <span className="inline-block bg-teal-50 dark:bg-teal-900/30 text-[#0A6E6E] dark:text-teal-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            {art.category}
                          </span>
                          <h4 className="font-extrabold text-xs md:text-sm text-slate-800 dark:text-white leading-snug group-hover:text-[#0A6E6E] dark:group-hover:text-teal-400 transition-colors">
                            {art.title}
                          </h4>
                          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                            {art.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold uppercase font-mono mt-1 pt-1.5 border-t border-slate-100/50 dark:border-slate-800">
                            <span>{art.author}</span>
                            <span>{art.readTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer informational */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-900">
              DOCT SPARK certified medical insights. Consult practitioners before therapeutic adjustments.
            </div>
          </div>
        </div>
      )}

      {/* CONTACT US POPUP MODAL OVERLAY */}
      {showContactModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" id="contact-us-modal">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowContactModal(false)}
          />
          
          {/* 2-Column Content Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-5 animate-in zoom-in-95 duration-150">
            
            {/* Left 2 Cols: Support Hotline Information */}
            <div className="md:col-span-2 bg-[#0A6E6E] text-white p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
              {/* Abs decorative gradient circle */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-300/10 rounded-full" />

              <div className="space-y-4 relative">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-100">Get in Touch</span>
                <h3 className="text-lg md:text-xl font-black leading-tight">DOCT SPARK Outpatient Help Desk</h3>
                <p className="text-[11px] text-emerald-50/80 leading-relaxed font-medium">
                  We are available 24/7 for clinic registrations, partner queries, patient billing support, or practitioner verification issues.
                </p>
              </div>

              <div className="space-y-4 pt-6 pb-6 relative text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                    <Phone className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[10px] text-emerald-200 uppercase tracking-wider">Helpline Hotline</h5>
                    <p className="font-bold text-sm mt-0.5">+91 98765 43210</p>
                    <p className="text-[9px] text-emerald-100/60 mt-0.5">Mon - Sun (9:00 AM - 9:00 PM)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                    <Send className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[10px] text-emerald-200 uppercase tracking-wider">Corporate Email</h5>
                    <p className="font-bold text-sm mt-0.5">support@doctspark.in</p>
                    <p className="text-[9px] text-emerald-100/60 mt-0.5">Inquiries answered in 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[10px] text-emerald-200 uppercase tracking-wider">Corporate HQ</h5>
                    <p className="font-bold mt-0.5 leading-normal">
                      Naman Centre, Bandra Kurla Complex, Bandra East, Mumbai - 400051
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-emerald-200/50 font-mono pt-4 border-t border-white/10 relative">
                DOCT SPARK India Outpatient Network
              </div>
            </div>

            {/* Right 3 Cols: Active Message Form */}
            <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 dark:border-slate-700 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry Ticket Form</span>
                <button 
                  onClick={() => {
                    setShowContactModal(false);
                    setContactSubmitted(false);
                  }}
                  className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold text-sm"
                  aria-label="Exit contact view"
                >
                  ✕
                </button>
              </div>

              {contactSubmitted ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wide">Ticket Logged Successfully</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed">
                    Thank you! Your reference inquiry has been captured in local logs. Our help desk coordinator will contact you at your submitted email shortly.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A6E6E] outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 9999999999"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A6E6E] outline-none text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A6E6E] outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Inquiry *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="How can our clinical coordinator team assist you?"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A6E6E] outline-none text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0A6E6E] hover:bg-[#085353] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4.5 h-4.5" /> Submit Message Inquiry
                  </button>
                </form>
              )}

              <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-700 mt-4 pt-3 text-center">
                We safeguard your clinical data and privacy.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MESSAGES DRAWER HUB PANEL (Authenticated User chat simulator) */}
      {showMessagesDrawer && (
        <div className="fixed inset-0 z-[100]" id="messages-drawer-viewport">
          <div 
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
            onClick={() => setShowMessagesDrawer(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-[#D1E5E5] dark:border-slate-800 shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-250">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-[#0A6E6E] dark:text-teal-400" />
                  <span className="font-extrabold text-xs uppercase tracking-widest text-[#1A2B3C] dark:text-white">Messages Inbox</span>
                </div>
                <button 
                  onClick={() => setShowMessagesDrawer(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 scrollbar-none">
                {[
                  { sender: 'Dr. Amit Sharma', text: 'Please upload the clinical license verified letter for Sector-4 branch approval.', time: '10 min ago', unread: true },
                  { sender: 'Aarav Mehta', text: 'I completed my appointment. Could you verify if my 1% referral reward was credited?', time: '1 hour ago', unread: true },
                  { sender: 'Platform Bot', text: 'MCI Doctor registry synchronization has successfully verified 42 new practitioners.', time: 'Yesterday', unread: false }
                ].map((msg, index) => (
                  <div 
                    key={index} 
                    onClick={() => {
                      alert(`Reading message thread from ${msg.sender}`);
                      if (msg.unread) {
                        setMessagesCount(prev => Math.max(0, prev - 1));
                        msg.unread = false;
                      }
                    }}
                    className={`p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-[#F0F7F7] dark:hover:bg-slate-800 rounded-xl border transition-all cursor-pointer relative ${
                      msg.unread ? 'border-[#0A6E6E]/30 dark:border-teal-500/30 bg-teal-50/20 dark:bg-teal-950/10' : 'border-[#D1E5E5]/60 dark:border-slate-700'
                    }`}
                  >
                    {msg.unread && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#0A6E6E] dark:bg-teal-400"></span>}
                    <h4 className="font-black text-xs text-slate-800 dark:text-slate-200">{msg.sender}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5 line-clamp-2">{msg.text}</p>
                    <span className="text-[9px] text-gray-400 font-bold block mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setMessagesCount(0);
                setShowMessagesDrawer(false);
                alert('All messages marked as read.');
              }}
              className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#085353] text-white font-extrabold text-xs rounded-xl transition-colors mt-6"
            >
              Mark All Read
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
