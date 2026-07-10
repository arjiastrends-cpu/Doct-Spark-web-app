/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Stethoscope, ChevronDown, ChevronRight, LogOut, Menu, X, Bell, Search, Zap, ShieldCheck, Users, DollarSign, Sliders } from 'lucide-react';
import { Role } from '../../types';
import { supabase } from '../../lib/supabase';

interface DashboardHeaderProps {
  currentView: string;
  setView: (view: string) => void;
  userRole: Role | null;
  setUserRole: (role: Role | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  onOpenMobileMenu?: () => void;
}

interface NavItem {
  label: string;
  view?: string;
  tab?: string;
  action?: string;
  children?: NavItem[];
}

const SUPERADMIN_NAV: NavItem[] = [
  {
    label: 'General Control',
    children: [
      { label: 'Admin Overview', view: 'superadmin-dashboard', tab: 'overview' }
    ]
  },
  {
    label: 'Approval Pipelines',
    children: [
      { label: 'Clinical Verification', view: 'superadmin-dashboard', tab: 'doctors-clinics' },
      { label: 'Approve Partners', view: 'superadmin-dashboard', tab: 'partners' }
    ]
  },
  {
    label: 'Revenue & Zones',
    children: [
      { label: 'Territory Alignment', view: 'superadmin-dashboard', tab: 'territories' },
      { label: 'Revenue Ledger', view: 'superadmin-dashboard', tab: 'commissions' },
      { label: 'Referral Management', view: 'superadmin-dashboard', tab: 'referrals' }
    ]
  },
  {
    label: 'Performance Targets',
    children: [
      { label: 'Target Settings', view: 'superadmin-dashboard', tab: 'target-settings' },
      { label: 'Milestone Reports', view: 'superadmin-dashboard', tab: 'milestone-reports' }
    ]
  },
  {
    label: 'Settings & Core',
    children: [
      { label: 'Platform Settings', view: 'superadmin-dashboard', tab: 'settings' },
      { label: 'Footer Settings', view: 'superadmin-dashboard', tab: 'footer-settings' },
      { label: 'Custom Pages Creator', view: 'superadmin-dashboard', tab: 'custom-pages' },
      { label: 'Platform Audit Trail', view: 'superadmin-dashboard', tab: 'audit-trail' },
      { label: 'Announcements Manager', view: 'superadmin-dashboard', tab: 'announcements' }
    ]
  }
];

const PARTNER_NAV: NavItem[] = [
  {
    label: 'Dashboard & Analytics',
    children: [
      { label: 'Performance Overview', view: 'partner-dashboard', tab: 'overview' },
      { label: 'Earnings & Payouts', view: 'partner-dashboard', tab: 'earnings' }
    ]
  },
  {
    label: 'Directory Onboarding',
    children: [
      { label: 'Onboard New Doctor', view: 'partner-dashboard', tab: 'onboard-doctor' },
      { label: 'Onboard New Clinic', view: 'partner-dashboard', tab: 'onboard-clinic' }
    ]
  },
  {
    label: 'Compliance & Network',
    children: [
      { label: 'Verification Pipeline', view: 'partner-dashboard', tab: 'verifications' },
      { label: 'District Partners', view: 'partner-dashboard', tab: 'district-partners' }
    ]
  },
  {
    label: 'Account & Settings',
    children: [
      { label: 'My Profile Details', view: 'partner-dashboard', tab: 'profile' },
      { label: 'Visit Public Site', view: 'home' }
    ]
  }
];

const PATIENT_NAV: NavItem[] = [
  {
    label: 'Health Workspace',
    children: [
      { label: 'Health Overview', view: 'patient-dashboard', tab: 'overview' },
      { label: 'My Profile & Alerts', view: 'patient-dashboard', tab: 'profile' }
    ]
  },
  {
    label: 'Medical Directory',
    children: [
      { label: 'Book Specialist', view: 'patient-dashboard', tab: 'book' },
      { label: 'Verified Clinics', view: 'clinics' },
      { label: 'Doctor Specialties', view: 'specialties' },
      { label: 'Live Location Map', view: 'nearby' }
    ]
  },
  {
    label: 'Care Records',
    children: [
      { label: 'Consultations & Bookings', view: 'patient-dashboard', tab: 'appointments' },
      { label: 'Prescriptions & Reports', view: 'patient-dashboard', tab: 'prescriptions' }
    ]
  },
  {
    label: 'Wallet & Rewards',
    children: [
      { label: 'Spark Wallet', view: 'patient-dashboard', tab: 'wallet' },
      { label: 'Referrals & Earnings', view: 'patient-dashboard', tab: 'wallet' }
    ]
  }
];

const CLINIC_NAV: NavItem[] = [
  {
    label: 'General Control',
    children: [
      { label: '📊 Admin Overview', view: 'clinic-dashboard', tab: 'overview' },
      { label: '🏥 Facilities & Chambers', view: 'clinic-dashboard', tab: 'facilities' }
    ]
  },
  {
    label: 'Clinical Operations',
    children: [
      { label: '🩺 Doctors Directory', view: 'clinic-dashboard', tab: 'doctors' },
      { label: '👥 Staff Directory', view: 'clinic-dashboard', tab: 'staff' }
    ]
  },
  {
    label: 'Patient Workspace',
    children: [
      { label: '📅 Appointment Book', view: 'clinic-dashboard', tab: 'appointments' },
      { label: '🩹 Patient Directory', view: 'clinic-dashboard', tab: 'patients' }
    ]
  },
  {
    label: 'Financial Desk',
    children: [
      { label: '💰 Revenue Ledger', view: 'clinic-dashboard', tab: 'revenue' }
    ]
  }
];

const DASHBOARD_NAV_ITEMS_BY_ROLE: Record<string, NavItem[]> = {
  superadmin: SUPERADMIN_NAV,
  partner: PARTNER_NAV,
  doctor: [
    { label: 'Home', view: 'doctor-dashboard', tab: 'dashboard' },
    { label: 'Consultations', view: 'doctor-dashboard', tab: 'appointments' },
    { label: 'My Patients', view: 'doctor-dashboard', tab: 'patients' },
    { label: 'My Earnings', view: 'doctor-dashboard', tab: 'earnings' },
    { label: 'Schedule Builder', view: 'doctor-dashboard', tab: 'schedule' },
    { label: 'Doctor Profile', view: 'doctor-dashboard', tab: 'profile' },
    { label: 'Visit Public Site', view: 'home' }
  ],
  clinic: CLINIC_NAV,
  patient: PATIENT_NAV
};

export default function DashboardHeader({
  currentView,
  setView,
  userRole,
  setUserRole,
  userEmail,
  setUserEmail,
  notificationsCount,
  onOpenNotifications,
  onOpenMobileMenu
}: DashboardHeaderProps) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);

  const [patientDisplayName, setPatientDisplayName] = React.useState(() => {
    if (!userEmail) return '';
    if (userRole !== 'patient') return '';
    if (userEmail === 'aarav.mehta@doctspark.in') return "Aarav Mehta";
    return localStorage.getItem(`ds_patient_name_${userEmail}`) || '';
  });

  React.useEffect(() => {
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

  React.useEffect(() => {
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
  const [activeTab, setActiveTab] = React.useState('overview');
  const [expandedMobileMenus, setExpandedMobileMenus] = React.useState<Record<string, boolean>>({});

  // Superadmin Custom Controls
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [showQuickActions, setShowQuickActions] = React.useState(false);

  const searchItems = [
    { label: "Admin Overview & System Stats", tab: "overview", category: "General Control" },
    { label: "Clinical Document Verification Pipeline", tab: "doctors-clinics", category: "Approval Pipelines" },
    { label: "Regional Partner Onboarding & Approval", tab: "partners", category: "Approval Pipelines" },
    { label: "Territory Assignment & Pin Code Lock-ins", tab: "territories", category: "Revenue & Zones" },
    { label: "Commission Configurations & Ledger Logs", tab: "commissions", category: "Revenue & Zones" },
    { label: "Referral Program Cashback Adjustments", tab: "referrals", category: "Revenue & Zones" },
    { label: "Monthly Performance Quota Settings", tab: "target-settings", category: "Performance Targets" },
    { label: "Partner Milestone Audit Records", tab: "milestone-reports", category: "Performance Targets" },
    { label: "Platform Global Variables & System Settings", tab: "settings", category: "Settings & Core" },
    { label: "Footer Copyright & Legal Link Settings", tab: "footer-settings", category: "Settings & Core" },
    { label: "Custom Pages Creator & Manager", tab: "custom-pages", category: "Settings & Core" },
    { label: "Platform Chronological Audit Trail", tab: "audit-trail", category: "Settings & Core" },
    { label: "Announcements Manager & Banner Broadcast", tab: "announcements", category: "Settings & Core" }
  ];

  const filteredSearchResults = globalSearch.trim() === '' ? [] : searchItems.filter(item => 
    item.label.toLowerCase().includes(globalSearch.toLowerCase()) || 
    item.category.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const headerRef = React.useRef<HTMLDivElement>(null);

  // Click outside to close desktop dropdowns
  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setShowProfileDropdown(false);
        setShowSearchResults(false);
        setShowQuickActions(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Synchronize internal active tab with custom event triggers (since some dashboards use state-tabs)
  React.useEffect(() => {
    if (!userRole) return;
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    const eventName = `${userRole}-tab-change`;
    window.addEventListener(eventName, handleTabChange);
    return () => {
      window.removeEventListener(eventName, handleTabChange);
    };
  }, [userRole]);

  // Determine correct default landing view of current role for logo or home clicks
  const getDashboardHomeView = (role: Role | null): string => {
    if (role === 'patient') return 'patient-dashboard';
    if (role === 'doctor') return 'doctor-dashboard';
    if (role === 'partner') return 'partner-dashboard';
    if (role === 'superadmin') return 'superadmin-dashboard';
    if (role === 'clinic') return 'clinic-dashboard';
    return 'home';
  };

  const navItems = userRole ? (DASHBOARD_NAV_ITEMS_BY_ROLE[userRole] || []) : [];

  const handleMenuClick = (item: NavItem) => {
    if (item.action === 'logout') {
      handleLogout();
      return;
    }
    if (item.view) {
      setView(item.view);
    }
    if (item.tab) {
      setActiveTab(item.tab);
      // Dispatch tab-change event instantly for dashboards
      const eventName = `${userRole}-tab-change`;
      window.dispatchEvent(new CustomEvent(eventName, { detail: item.tab }));
    }
    setActiveDropdown(null);
    setIsMobileDrawerOpen(false);
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
    setIsMobileDrawerOpen(false);
  };

  const handleLogoClick = () => {
    const homeView = getDashboardHomeView(userRole);
    setView(homeView);
    const eventName = `${userRole}-tab-change`;
    window.dispatchEvent(new CustomEvent(eventName, { detail: 'overview' }));
    window.dispatchEvent(new CustomEvent(eventName, { detail: 'dashboard' }));
  };

  const isParentActive = (parentItem: NavItem): boolean => {
    if (parentItem.view === currentView) {
      if (!parentItem.tab || parentItem.tab === activeTab) {
        return true;
      }
    }
    if (parentItem.children) {
      return parentItem.children.some((child) => isParentActive(child));
    }
    return false;
  };

  const isChildActive = (item: NavItem): boolean => {
    if (item.view === currentView) {
      if (!item.tab || item.tab === activeTab) {
        return true;
      }
    }
    if (item.children) {
      return item.children.some((child) => isChildActive(child));
    }
    return false;
  };

  const toggleMobileMenuAccordion = (label: string) => {
    setExpandedMobileMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Renders dropdown items with unlimited nesting support
  const renderDropdownItems = (items: NavItem[]) => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      const childActive = isChildActive(item);
      
      if (hasChildren) {
        return (
          <div key={idx} className="relative group/sub">
            <button
              className={`w-full text-left px-4 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 transition-colors flex items-center justify-between text-xs ${
                childActive ? 'text-[#0A6E6E] dark:text-teal-400 font-bold bg-[#0A6E6E]/5 dark:bg-teal-950/15' : 'text-slate-700 dark:text-slate-300 font-medium'
              }`}
            >
              <span>{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            </button>
            
            <div className="absolute left-full top-0 ml-1 hidden group-hover/sub:block w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50">
              {renderDropdownItems(item.children)}
            </div>
          </div>
        );
      }
      
      return (
        <button
          key={idx}
          onClick={() => handleMenuClick(item)}
          className={`w-full text-left px-4 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 transition-colors text-xs ${
            childActive ? 'text-[#0A6E6E] dark:text-teal-400 font-bold bg-[#0A6E6E]/5 dark:bg-teal-950/15' : 'text-slate-700 dark:text-slate-300 font-medium'
          }`}
        >
          {item.label}
        </button>
      );
    });
  };

  // Recursive mobile drawer renderer
  const renderMobileMenuItems = (items: NavItem[], depth = 0) => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      const active = isParentActive(item);
      const isExpanded = !!expandedMobileMenus[item.label];

      if (hasChildren) {
        return (
          <div key={idx} className="flex flex-col w-full">
            <button
              onClick={() => toggleMobileMenuAccordion(item.label)}
              className={`w-full text-left transition-all duration-200 px-3.5 py-2.5 rounded-xl cursor-pointer text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 flex items-center justify-between ${
                active 
                  ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/5 dark:bg-teal-950/15 font-semibold' 
                  : 'text-slate-600 dark:text-slate-300'
              }`}
              style={{ paddingLeft: `${depth * 12 + 14}px` }}
            >
              <span>{item.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
              <div className="flex flex-col pl-2 border-l border-slate-100 dark:border-slate-800 ml-4 my-1 gap-1">
                {renderMobileMenuItems(item.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={idx}
          onClick={() => handleMenuClick(item)}
          className={`w-full text-left transition-all duration-200 px-3.5 py-2 rounded-xl cursor-pointer text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0A6E6E] dark:hover:text-teal-400 ${
            active 
              ? 'text-[#0A6E6E] dark:text-teal-400 bg-[#0A6E6E]/10 dark:bg-teal-950/20 font-semibold' 
              : 'text-slate-600 dark:text-slate-300'
          }`}
          style={{ paddingLeft: `${depth * 12 + 14}px` }}
        >
          <span>{item.label}</span>
        </button>
      );
    });
  };

  return (
    <header 
      ref={headerRef}
      className="sticky top-0 z-50 bg-[#0A6E6E] dark:bg-slate-950 border-b border-[#0A6E6E]/10 dark:border-slate-900 px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between shrink-0 shadow-sm transition-colors duration-300" 
      id="dashboard-header"
    >
      {/* BRAND & MOBILE TRIGGER */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger menu */}
        <button
          onClick={() => {
            if (onOpenMobileMenu) {
              onOpenMobileMenu();
            } else {
              setIsMobileDrawerOpen(true);
            }
          }}
          className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer mr-1 flex items-center justify-center"
          aria-label="Open dashboard navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo (routes to internal dashboard home) */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={handleLogoClick}
          id="dashboard-logo"
        >
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105">
            <Stethoscope className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg md:text-xl font-sans font-extrabold tracking-tight text-teal-300 dark:text-teal-400 select-none">
            DOCT<span className="text-[#F5A623] ml-0.5 font-bold">SPARK</span>
          </span>
          <span className="hidden sm:inline-block bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/10">
            {userRole} Portal
          </span>
        </div>
      </div>

      {/* HORIZONTAL DESKTOP NAVIGATION (TEXT ONLY - ELEGANT TYPOGRAPHY) */}
      <nav className="hidden lg:flex items-center gap-5 text-[13px] font-semibold text-teal-50">
        {navItems.map((item, idx) => {
          const hasChildren = item.children && item.children.length > 0;
          const active = isParentActive(item);
          const isOpen = activeDropdown === item.label;

          return (
            <div key={idx} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasChildren) {
                    setActiveDropdown(isOpen ? null : item.label);
                  } else {
                    handleMenuClick(item);
                  }
                }}
                className={`transition-all duration-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/10 hover:text-emerald-400 font-semibold tracking-wide flex items-center gap-1 ${
                  active 
                    ? 'text-white bg-white/15 font-bold' 
                    : 'text-teal-50'
                }`}
              >
                <span>{item.label}</span>
                {hasChildren && <ChevronDown className="w-3.5 h-3.5 opacity-80" />}
              </button>

              {hasChildren && isOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex flex-col text-slate-700 dark:text-slate-200 text-xs">
                    {renderDropdownItems(item.children)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* RIGHT SIDE USER PROFILE & CONTROLS */}
      <div className="flex items-center gap-4">
        
        {/* Global Search Bar (Superadmin only) */}
        {userRole === 'superadmin' && (
          <div className="relative hidden md:block">
            <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 focus-within:bg-white/15 focus-within:border-white/30 transition-all w-60">
              <Search className="w-4 h-4 text-teal-100 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search modules..." 
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="bg-transparent border-0 outline-none text-xs w-full text-white placeholder-teal-200"
              />
              {globalSearch && (
                <button 
                  onClick={() => {
                    setGlobalSearch('');
                    setShowSearchResults(false);
                  }}
                  className="p-0.5 hover:bg-white/10 rounded-full"
                >
                  <X className="w-3 h-3 text-teal-100" />
                </button>
              )}
            </div>

            {showSearchResults && globalSearch.trim() !== '' && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-2.5 z-50 max-h-80 overflow-y-auto animate-in fade-in duration-100">
                <div className="px-3.5 pb-1.5 border-b border-slate-50 dark:border-slate-800 mb-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Search Results ({filteredSearchResults.length})</span>
                </div>
                {filteredSearchResults.length === 0 ? (
                  <div className="px-3.5 py-3 text-center text-xs text-slate-400">
                    No modules or targets match your search.
                  </div>
                ) : (
                  filteredSearchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setView('superadmin-dashboard');
                        setActiveTab(result.tab);
                        setGlobalSearch('');
                        setShowSearchResults(false);
                        const eventName = `superadmin-tab-change`;
                        window.dispatchEvent(new CustomEvent(eventName, { detail: result.tab }));
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 text-slate-700 dark:text-slate-300 hover:text-[#0A6E6E] dark:hover:text-teal-400 transition-colors flex flex-col text-xs cursor-pointer"
                    >
                      <span className="font-semibold">{result.label}</span>
                      <span className="text-[10px] text-[#0A6E6E] dark:text-teal-400 font-bold uppercase tracking-wider font-mono mt-0.5">{result.category}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions (Superadmin only) */}
        {userRole === 'superadmin' && (
          <div className="relative hidden md:block">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickActions(!showQuickActions);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Quick Actions</span>
              <ChevronDown className={`w-3 h-3 text-white/80 transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
            </button>

            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-3.5 z-50 animate-in fade-in duration-100">
                <div className="px-4 pb-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fast Audits & Setup</span>
                </div>
                <div className="flex flex-col text-slate-700 text-xs">
                  <button
                    onClick={() => {
                      setView('superadmin-dashboard');
                      setActiveTab('doctors-clinics');
                      setShowQuickActions(false);
                      const eventName = `superadmin-tab-change`;
                      window.dispatchEvent(new CustomEvent(eventName, { detail: 'doctors-clinics' }));
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Clinical Verification Pipeline</span>
                  </button>
                  <button
                    onClick={() => {
                      setView('superadmin-dashboard');
                      setActiveTab('commissions');
                      setShowQuickActions(false);
                      const eventName = `superadmin-tab-change`;
                      window.dispatchEvent(new CustomEvent(eventName, { detail: 'commissions' }));
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>Commissions & Ledger Logs</span>
                  </button>
                  <button
                    onClick={() => {
                      setView('superadmin-dashboard');
                      setActiveTab('settings');
                      setShowQuickActions(false);
                      const eventName = `superadmin-tab-change`;
                      window.dispatchEvent(new CustomEvent(eventName, { detail: 'settings' }));
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>Global Platform Variables</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Notifications Bell */}
        <button 
          onClick={onOpenNotifications}
          className="p-2 text-teal-50 hover:text-white rounded-xl hover:bg-white/10 relative transition-all cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 text-current" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">
              {notificationsCount}
            </span>
          )}
        </button>

        {/* PROFILE DROP-DOWN & USER AVATAR */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileDropdown(!showProfileDropdown);
            }}
            className="flex items-center gap-1.5 focus:outline-none p-1.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            aria-label="User Profile Options"
          >
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center border border-white/25 text-xs font-bold uppercase text-white shadow-xs">
              {userEmail ? userEmail.substring(0, 2) : 'US'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-teal-100" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl py-3.5 z-50 animate-in fade-in duration-100">
              {/* Account Details info */}
              <div className="px-4 pb-2 border-b border-slate-50 dark:border-slate-800 mb-2">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Account</span>
                {patientDisplayName && (
                  <span className="block text-sm font-black text-[#0A6E6E] dark:text-teal-400 mb-0.5">{patientDisplayName}</span>
                )}
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{userEmail}</span>
                <span className="inline-block bg-[#0A6E6E]/10 dark:bg-teal-400/10 text-[#0A6E6E] dark:text-teal-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1.5">
                  {userRole}
                </span>
              </div>

              <div className="flex flex-col text-slate-700 text-xs">
                <button
                  onClick={() => {
                    handleLogoClick();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  Dashboard Home
                </button>
                <button
                  onClick={() => {
                    setView('home');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#0A6E6E]/5 dark:hover:bg-teal-950/20 hover:text-[#0A6E6E] dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  Visit Public Site
                </button>
                
                <div className="border-t border-slate-50 dark:border-slate-800 my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/15 text-red-600 font-semibold uppercase tracking-wider transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE RESPONSIVE SIDE DRAWER NAVIGATION (TEXT ONLY - ACCORDION STYLE) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer content pane - Styled with exact same mobile view sidebar colors as the Home Page drawer */}
          <div className="relative w-80 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-[#D1E5E5] dark:border-slate-800 flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-250 ease-out overflow-y-auto">
            <div>
              {/* Drawer Header Brand */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-md font-extrabold tracking-tight text-[#0A6E6E] dark:text-teal-400">
                    DOCT<span className="text-[#F5A623]">SPARK</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu items list */}
              <nav className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 px-3">
                  Dashboard Directory
                </span>
                {renderMobileMenuItems(navItems)}
              </nav>
            </div>

            {/* Logout drawer footer info */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex flex-col gap-3">
              <div className="px-3.5">
                <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">User Account</span>
                {patientDisplayName && (
                  <span className="block text-sm font-black text-[#0A6E6E] dark:text-teal-400 mb-0.5">{patientDisplayName}</span>
                )}
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 justify-center py-2.5 bg-red-50 dark:bg-red-950/15 hover:bg-red-100 dark:hover:bg-red-950/25 text-red-600 dark:text-red-400 font-semibold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
