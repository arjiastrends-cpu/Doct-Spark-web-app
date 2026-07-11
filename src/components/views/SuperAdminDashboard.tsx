import React from 'react';
import PartnerManagementModule from './PartnerManagementModule';
import { 
  ShieldAlert, Landmark, Users, TrendingUp, DollarSign, Stethoscope, 
  Building2, CheckCircle2, AlertCircle, Eye, ShieldCheck, Mail, Smartphone,
  BookOpen, Plus, Settings, ChevronRight, Edit3, X, FileText,
  Target, Clock, Gift, Sliders, Clipboard, Calendar, Award, Activity,
  ChevronDown, Menu, Trash2, Globe, Copy, Search,
  Star, StarHalf, BellRing, Lock, Database, LifeBuoy, Truck, Percent,
  AlertTriangle, Layout, CalendarCheck, Cpu, History, UserCheck, Code,
  Layers, HeartPulse, BarChart2, Pill, Package
} from 'lucide-react';
import { Partner, Doctor, Clinic, Appointment, CommissionConfig, Announcement, Pharmacy, Laboratory, Physiotherapy } from '../../types';
import { MOCK_DOCTORS, MOCK_CLINICS } from '../../data/mockData';
import { SEED_DOCTORS, SEED_PARTNERS } from '../../data/seedData';
import { indiaStatesData } from '../../data/indiaLocations';
import { 
  getCommissionConfig, getCommissionRecords, getAuditLogs, getPayoutReceipts, 
  saveCommissionConfig, updateCommissionStatus, processPayouts, addAuditLog,
  approveSubscriptionCommissionBySourceId, triggerVerificationNotification, getPartnerVerificationStage
} from '../../data/commissionUtils';
import { getTargetConfig, saveTargetConfig, getRewardEligibilities, calculatePartnerPerformance } from '../../data/targetUtils';
import { 
  getAllPatientWalletsList, getReferralAdminConfig, saveReferralAdminConfig, 
  approveWalletTransaction, rejectWalletTransaction, performAdminWalletAdjustment,
  PatientWallet, WalletTransaction 
} from '../../data/walletUtils';
import PartnerRegister from './PartnerRegister';
import TermsManagementModule from './TermsManagementModule';
import TestingCenter from './TestingCenter';
import DashboardLayout from '../layout/DashboardLayout';
import { Role } from '../../types';

interface SuperAdminDashboardProps {
  setView: (view: string) => void;
  userEmail: string | null;
  currentView: string;
  userRole: Role | null;
  setUserRole: (role: Role | null) => void;
  setUserEmail: (email: string | null) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
}

export default function SuperAdminDashboard({
  setView,
  userEmail,
  currentView,
  userRole,
  setUserRole,
  setUserEmail,
  notificationsCount,
  onOpenNotifications
}: SuperAdminDashboardProps) {
  const [partners, setPartners] = React.useState<any[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [clinics, setClinics] = React.useState<Clinic[]>([]);
  const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>([]);
  const [laboratories, setLaboratories] = React.useState<Laboratory[]>([]);
  const [physiotherapists, setPhysiotherapists] = React.useState<Physiotherapy[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>('dashboard-overview');
  const [showAddPartnerModal, setShowAddPartnerModal] = React.useState(false);
  const [isMockCleared, setIsMockCleared] = React.useState(localStorage.getItem('ds_mock_data_cleared') === 'true');
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);

  // New enterprise-level UI states
  const [pinnedMenus, setPinnedMenus] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('ds_admin_pinned_menus');
    return saved ? JSON.parse(saved) : ['dashboard-overview', 'user-all', 'finance-revenue', 'verify-doctor'];
  });
  const [recentlyVisited, setRecentlyVisited] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('ds_admin_recent_tabs');
    return saved ? JSON.parse(saved) : ['dashboard-overview'];
  });
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ds_admin_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });
  const [sidebarSearchTerm, setSidebarSearchTerm] = React.useState<string>('');

  // Local Mobile Sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Interactive state hooks for enterprise control panels
  const [enterpriseFeatures, setEnterpriseFeatures] = React.useState<Record<string, boolean>>({
    'allow-self-reg-doc': true,
    'allow-self-reg-clinic': false,
    'auto-approve-wallet': false,
    'enable-cod-pharmacy': true,
    'maintenance-mode': false,
    'debug-logging': true,
  });
  const [broadcastTarget, setBroadcastTarget] = React.useState('all-users');
  const [broadcastSubject, setBroadcastSubject] = React.useState('');
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [broadcastLogs, setBroadcastLogs] = React.useState<string[]>([]);
  const [enterpriseSearch, setEnterpriseSearch] = React.useState('');
  const [docFields, setDocFields] = React.useState<Record<string, boolean>>({
    'middleName': false,
    'consultationFee': true,
    'experienceYears': true,
    'licenseNumber': true,
    'bankDetails': true,
  });
  const [docRequiredDocs, setDocRequiredDocs] = React.useState<Record<string, boolean>>({
    'degree': true,
    'mci': true,
    'idProof': true,
    'clinicPhoto': false,
  });
  const [legalDocText, setLegalDocText] = React.useState('I hereby declare that all clinical degrees and regulatory council certifications uploaded are valid...');

  // Collapsible parent categories in Sidebar
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'dashboard': true,
    'users': false,
    'partners': false,
    'providers': false,
    'appointments': false,
    'laboratory_mgmt': false,
    'pharmacy_mgmt': false,
    'physio_mgmt': false,
    'finance': false,
    'referrals': false,
    'reviews': false,
    'notifications': false,
    'registration_mgmt': false,
    'verification_center': false,
    'cms': false,
    'reports': false,
    'settings_mgmt': false,
    'system': false,
    'support_mgmt': false,
    'profile_mgmt': false,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const togglePinMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedMenus(prev => {
      const updated = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem('ds_admin_pinned_menus', JSON.stringify(updated));
      return updated;
    });
  };

  const navigateToTab = (id: string) => {
    setActiveTab(id);
    setRecentlyVisited(prev => {
      const filtered = prev.filter(t => t !== id);
      const updated = [id, ...filtered].slice(0, 5);
      localStorage.setItem('ds_admin_recent_tabs', JSON.stringify(updated));
      return updated;
    });
    setIsMobileSidebarOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('ds_admin_theme', next);
      return next;
    });
  };

  const getMappedTab = (tabId: string): string => {
    const mappings: Record<string, string> = {
      'dashboard-overview': 'overview',
      'dashboard-monitoring': 'telemetry',
      'dashboard-reports-overview': 'milestone-reports',
      'partner-all': 'partner-management',
      'partner-targets': 'target-settings',
      'provider-physiotherapists': 'physiotherapy',
      'finance-commission': 'commissions',
      'referral-settings': 'referrals',
      'notify-announcements': 'announcements',
      'cms-terms': 'terms-management',
      'cms-pages': 'custom-pages',
      'settings-general': 'settings',
      'system-audit': 'audit-trail',
      'verify-doctor': 'doctors-clinics',
      'testing-center': 'testing-center'
    };
    return mappings[tabId] || tabId;
  };

  const mappedTab = getMappedTab(activeTab);

  // Target Configuration States
  const [targetConfig, setTargetConfig] = React.useState<any>(null);
  const [districtOnboardInput, setDistrictOnboardInput] = React.useState(100);
  const [stateOnboardInput, setStateOnboardInput] = React.useState(1000);
  const [districtAppointmentInput, setDistrictAppointmentInput] = React.useState(5000);
  const [stateAppointmentInput, setStateAppointmentInput] = React.useState(10000);
  const [durationDaysInput, setDurationDaysInput] = React.useState(180);
  const [basicSalaryInput, setBasicSalaryInput] = React.useState(25000);
  const [travelAllowanceInput, setTravelAllowanceInput] = React.useState(8000);
  const [tourEligibleInput, setTourEligibleInput] = React.useState(true);
  const [rewardEnabledInput, setRewardEnabledInput] = React.useState(true);
  const [certificateEnabledInput, setCertificateEnabledInput] = React.useState(true);

  // Target and Performance Reports States
  const [reportSubTab, setReportSubTab] = React.useState<'district' | 'state' | 'completions' | 'salary' | 'rewards' | 'expired'>('district');
  const [repFilterState, setRepFilterState] = React.useState('All');
  const [repFilterDistrict, setRepFilterDistrict] = React.useState('All');
  const [repFilterPartner, setRepFilterPartner] = React.useState('All');
  const [repFilterStatus, setRepFilterStatus] = React.useState('All');
  const [repFilterDateStart, setRepFilterDateStart] = React.useState('');
  const [repFilterDateEnd, setRepFilterDateEnd] = React.useState('');

  // Commissions, settings and logs state
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [commConfig, setCommConfig] = React.useState<any>(null);
  const [auditLogs, setAuditLogs] = React.useState<any[]>(() => getAuditLogs());
  const [payoutReceipts, setPayoutReceipts] = React.useState<any[]>([]);

  // Commission search & filters
  const [commSearch, setCommSearch] = React.useState('');
  const [commFilterState, setCommFilterState] = React.useState('All');
  const [commFilterDistrict, setCommFilterDistrict] = React.useState('All');
  const [commFilterType, setCommFilterType] = React.useState<'All' | 'Subscription' | 'Appointment'>('All');
  const [commFilterStatus, setCommFilterStatus] = React.useState<'All' | 'Pending' | 'Approved' | 'Held' | 'Paid' | 'Reversed'>('All');
  const [commFilterPartner, setCommFilterPartner] = React.useState('All');
  const [reversalReasonInput, setReversalReasonInput] = React.useState('');
  const [reversingRecordId, setReversingRecordId] = React.useState<string | null>(null);

  // Editing Application modal state
  const [editingItem, setEditingItem] = React.useState<{
    id: string;
    type: 'doctor' | 'clinic' | 'partner';
    data: any;
  } | null>(null);
  const [activePartnerDocTab, setActivePartnerDocTab] = React.useState<string>('aadhaar');
  const [activeDoctorDocTab, setActiveDoctorDocTab] = React.useState<'aadhaar' | 'mci' | 'clinicLetter' | 'degree'>('aadhaar');
  const [activeClinicDocTab, setActiveClinicDocTab] = React.useState<'license' | 'pcb' | 'fire' | 'blueprint'>('license');

  // Submitted Documents States
  const [docSearchTerm, setDocSearchTerm] = React.useState('');
  const [docTypeFilter, setDocTypeFilter] = React.useState<'all' | 'doctor' | 'clinic' | 'partner'>('all');
  const [docStatusFilter, setDocStatusFilter] = React.useState<'all' | 'verified' | 'pending'>('all');
  const [previewDoc, setPreviewDoc] = React.useState<{
    entityId: string;
    entityName: string;
    entityType: 'doctor' | 'clinic' | 'partner';
    docLabel: string;
    fileName: string;
    fileSize?: string;
    uploadedAt?: string;
    status: 'verified' | 'pending';
  } | null>(null);
  const [editingDoc, setEditingDoc] = React.useState<{
    entityId: string;
    entityType: 'doctor' | 'clinic' | 'partner';
    docField: string;
    fileIndex?: number;
    currentValue: string;
    entityName: string;
    docLabel: string;
  } | null>(null);
  const [editingDocVal, setEditingDocVal] = React.useState('');

  // Trigger alert simulations
  const [notificationLog, setNotificationLog] = React.useState<string[]>([]);

  // Master Admin Partner Review Workflow States
  const [selectedPartnerForAdminReview, setSelectedPartnerForAdminReview] = React.useState<Partner | null>(null);
  const [adminReviewRemarks, setAdminReviewRemarks] = React.useState('');
  const [adminReviewError, setAdminReviewError] = React.useState('');

  // Custom Platform Settings States
  const [globalSubFee, setGlobalSubFee] = React.useState<number>(() => {
    const saved = localStorage.getItem('ds_global_subscription_fee');
    return saved ? parseInt(saved, 10) : 5000;
  });
  const [autoVerification, setAutoVerification] = React.useState<boolean>(() => {
    return localStorage.getItem('ds_auto_verification_enabled') === 'true';
  });
  const [searchAuditQuery, setSearchAuditQuery] = React.useState('');
  const [filterAuditCategory, setFilterAuditCategory] = React.useState('All');
  const [customBonusAmounts, setCustomBonusAmounts] = React.useState<Record<string, string>>({});
  const [leaderboardLevelFilter, setLeaderboardLevelFilter] = React.useState<'All' | 'State' | 'District'>('All');

  // Footer Social Media Settings States
  const [fbUrl, setFbUrl] = React.useState(() => localStorage.getItem('ds_social_facebook') || 'https://facebook.com');
  const [twUrl, setTwUrl] = React.useState(() => localStorage.getItem('ds_social_twitter') || 'https://twitter.com');
  const [igUrl, setIgUrl] = React.useState(() => localStorage.getItem('ds_social_instagram') || 'https://instagram.com');
  const [liUrl, setLiUrl] = React.useState(() => localStorage.getItem('ds_social_linkedin') || 'https://linkedin.com');
  const [ytUrl, setYtUrl] = React.useState(() => localStorage.getItem('ds_social_youtube') || 'https://youtube.com');

  // Footer Copyright & Legal Links States
  const [copyrightText, setCopyrightText] = React.useState(() => localStorage.getItem('ds_footer_copyright') || '© 2026 DOCT SPARK Healthcare India Pvt. Ltd. Made with');
  const [locationText, setLocationText] = React.useState(() => localStorage.getItem('ds_footer_location') || 'in Mumbai.');
  const [privacyLabelText, setPrivacyLabelText] = React.useState(() => localStorage.getItem('ds_footer_privacy_label') || 'Privacy Policy');
  const [privacyUrlText, setPrivacyUrlText] = React.useState(() => localStorage.getItem('ds_footer_privacy_url') || '#');
  const [termsLabelText, setTermsLabelText] = React.useState(() => localStorage.getItem('ds_footer_terms_label') || 'Terms of Use');
  const [termsUrlText, setTermsUrlText] = React.useState(() => localStorage.getItem('ds_footer_terms_url') || '#');
  const [refundLabelText, setRefundLabelText] = React.useState(() => localStorage.getItem('ds_footer_refund_label') || 'Refund & Cancellation');
  const [refundUrlText, setRefundUrlText] = React.useState(() => localStorage.getItem('ds_footer_refund_url') || '#');

  // Dynamic Pages Management States
  const [dynamicPages, setDynamicPages] = React.useState<{ id: string; title: string; content: string; slug: string; active: boolean; addToFooter: boolean; lastUpdated?: string }[]>(() => {
    const saved = localStorage.getItem('ds_dynamic_pages');
    const defaultPages = [
      {
        id: 'dp-about',
        title: 'About Doct Spark',
        content: `<h3>Welcome to DOCT SPARK Healthcare India</h3>
<p>DOCT SPARK is India's fastest growing healthcare digital ecosystem, offering instant, secure and verified telemedicine, outpatient care, and patient referral frameworks across states and districts.</p>
<h4>Our Vision</h4>
<p>To deliver instantaneous and affordable quality outpatient care to every citizen across India. By powering clinics and doctors with advanced, secure digital practice tools, we bridge the gap between urban specialists and rural or semi-urban patient requirements.</p>
<h4>How We Operate</h4>
<p>Our decentralized State, District, and City partner networks actively onboard verified medical practitioners and clinics into our central registries. Patients can securely seek specialist doctors, book physical visits, consult with physicians via secure high-definition video, and receive authenticated digital prescriptions instantly.</p>`,
        slug: 'about-us',
        active: true,
        addToFooter: true,
        lastUpdated: '2026-07-02 12:00'
      },
      {
        id: 'dp-careers',
        title: 'Careers',
        content: `<h3>Join the DOCT SPARK Mission</h3>
<p>We are constantly seeking brilliant, mission-driven technologists, operations managers, and medical professionals who want to rewrite the standards of digital outpatient delivery in India.</p>
<h4>Open Roles</h4>
<ul>
  <li><strong>Principal Software Engineer (Full-Stack / React)</strong> - Mumbai / Bengaluru</li>
  <li><strong>District Operations Coordinator</strong> - Pune / Ahmedabad / Chennai</li>
  <li><strong>Lead Telemedicine Consultant</strong> - Telecommuting (Pan-India)</li>
</ul>
<p>Interested applicants can send their dynamic profiles and portfolios directly to careers@doctspark.in.</p>`,
        slug: 'careers',
        active: true,
        addToFooter: true,
        lastUpdated: '2026-07-01 09:30'
      }
    ];
    return saved ? JSON.parse(saved) : defaultPages;
  });

  const [pageFormTitle, setPageFormTitle] = React.useState('');
  const [pageFormSlug, setPageFormSlug] = React.useState('');
  const [pageFormContent, setPageFormContent] = React.useState('');
  const [pageFormActive, setPageFormActive] = React.useState(true);
  const [pageFormAddToFooter, setPageFormAddToFooter] = React.useState(true);
  const [editingPageId, setEditingPageId] = React.useState<string | null>(null);

  // Announcement Management States
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(() => {
    const saved = localStorage.getItem('ds_announcements');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaultAnnouncements: Announcement[] = [
      {
        id: 'ann-welcome',
        title: 'Welcome to Doct Spark',
        message: '🚀 Welcome to DOCT SPARK! India\'s fastest-growing healthcare ecosystem is now live across Mumbai and Pune districts. Check out our verified clinic listings!',
        type: 'Success',
        icon: 'Megaphone',
        status: 'Published',
        priority: 'High',
        target_audience: 'All',
        display_location: 'Entire Website',
        animation_style: 'Marquee',
        animation_speed: 'Medium',
        background_color: '#E0F2FE',
        text_color: '#0369A1',
        border_color: '#BAE6FD',
        link_enabled: true,
        button_text: 'Browse Clinics',
        button_url: '#',
        dismissible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ann-maint',
        title: 'Scheduled Telemedicine Maintenance',
        message: '⚠️ Scheduled teleconsultation maintenance on Saturday 11:50 PM to 01:00 AM. Live call services may experience brief 5-minute interruptions.',
        type: 'Maintenance',
        icon: 'Wrench',
        status: 'Published',
        priority: 'Medium',
        target_audience: 'All',
        display_location: 'All Dashboards',
        animation_style: 'Static',
        animation_speed: 'Medium',
        background_color: '#FEF3C7',
        text_color: '#B45309',
        border_color: '#FDE68A',
        link_enabled: false,
        dismissible: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem('ds_announcements', JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  });

  const [annFormTitle, setAnnFormTitle] = React.useState('');
  const [annFormMessage, setAnnFormMessage] = React.useState('');
  const [annFormType, setAnnFormType] = React.useState<'Information' | 'Success' | 'Warning' | 'Emergency' | 'Offer' | 'Maintenance'>('Information');
  const [annFormPriority, setAnnFormPriority] = React.useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [annFormTargetAudience, setAnnFormTargetAudience] = React.useState<'All' | 'Visitors' | 'Patients' | 'Doctors' | 'Clinics' | 'Partners' | 'Staff' | 'Admin'>('All');
  const [annFormDisplayLocation, setAnnFormDisplayLocation] = React.useState<'Website Home' | 'Website Inner' | 'Admin' | 'Patient' | 'Doctor' | 'Clinic' | 'Partner' | 'Staff' | 'All Dashboards' | 'Entire Website'>('Entire Website');
  const [annFormAnimationStyle, setAnnFormAnimationStyle] = React.useState<'Marquee' | 'Fade' | 'Slide' | 'Static'>('Marquee');
  const [annFormAnimationSpeed, setAnnFormAnimationSpeed] = React.useState<'Slow' | 'Medium' | 'Fast'>('Medium');
  const [annFormBackgroundColor, setAnnFormBackgroundColor] = React.useState('#E0F2FE');
  const [annFormTextColor, setAnnFormTextColor] = React.useState('#0369A1');
  const [annFormBorderColor, setAnnFormBorderColor] = React.useState('#BAE6FD');
  const [annFormLinkEnabled, setAnnFormLinkEnabled] = React.useState(false);
  const [annFormButtonText, setAnnFormButtonText] = React.useState('Learn More');
  const [annFormButtonUrl, setAnnFormButtonUrl] = React.useState('');
  const [annFormDismissible, setAnnFormDismissible] = React.useState(true);
  const [annFormStartDatetime, setAnnFormStartDatetime] = React.useState('');
  const [annFormEndDatetime, setAnnFormEndDatetime] = React.useState('');
  const [annFormIcon, setAnnFormIcon] = React.useState('default');
  const [annFormFontSize, setAnnFormFontSize] = React.useState('text-xs');
  const [annFormPadding, setAnnFormPadding] = React.useState('py-1.5 px-4 md:px-8');
  const [annFormHeight, setAnnFormHeight] = React.useState('h-auto');
  const [editingAnnId, setEditingAnnId] = React.useState<string | null>(null);

  // Search/Filter States for Announcement List
  const [annSearchQuery, setAnnSearchQuery] = React.useState('');
  const [annFilterStatus, setAnnFilterStatus] = React.useState('All');
  const [annFilterType, setAnnFilterType] = React.useState('All');
  const [annFilterAudience, setAnnFilterAudience] = React.useState('All');


  // Helper to sync pageFormSlug when title is written (only when not editing or if manually changed)
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start
      .replace(/-+$/, ''); // Trim - from end
  };

  const handleTitleChangeForSlug = (title: string) => {
    setPageFormTitle(title);
    if (!editingPageId) {
      setPageFormSlug(slugify(title));
    }
  };

  // Referral Program Management & Wallet Overrides States
  const [referralConfig, setReferralConfig] = React.useState(() => getReferralAdminConfig());
  const [refProgramEnabled, setRefProgramEnabled] = React.useState(referralConfig.referralProgramEnabled);
  const [refRewardPct, setRefRewardPct] = React.useState(referralConfig.referralRewardPct);
  const [refRequireApproval, setRefRequireApproval] = React.useState(referralConfig.requireApproval);
  const [patientWallets, setPatientWallets] = React.useState<PatientWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = React.useState<PatientWallet | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = React.useState(false);
  const [adjustmentType, setAdjustmentType] = React.useState<'Credit' | 'Debit'>('Credit');
  const [adjustmentAmount, setAdjustmentAmount] = React.useState<number>(0);
  const [adjustmentDescription, setAdjustmentDescription] = React.useState('');
  const [adjustmentEmail, setAdjustmentEmail] = React.useState('');
  const [searchWalletQuery, setSearchWalletQuery] = React.useState('');

  const refreshPatientWallets = () => {
    const list = getAllPatientWalletsList();
    setPatientWallets(list);
    if (selectedWallet) {
      const updatedSelected = list.find(w => w.patientEmail.toLowerCase() === selectedWallet.patientEmail.toLowerCase());
      if (updatedSelected) {
        setSelectedWallet(updatedSelected);
      }
    }
  };

  // Automatically refresh wallets when the referrals tab is open
  React.useEffect(() => {
    if (mappedTab === 'referrals') {
      refreshPatientWallets();
    }
  }, [mappedTab]);

  // Automatically refresh audit logs when tab shifts to settings
  React.useEffect(() => {
    if (mappedTab === 'settings') {
      setAuditLogs(getAuditLogs());
    }
  }, [mappedTab]);

  const [physioSearch, setPhysioSearch] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [physioCategories, setPhysioCategories] = React.useState<string[]>([]);
  React.useEffect(() => {
    const savedCats = localStorage.getItem('ds_physio_categories');
    const defaultCats = ['Orthopedic Physiotherapy', 'Sports Physiotherapy', 'Neurological Physiotherapy', 'Cardiovascular Physiotherapy', 'Pediatric Physiotherapy', 'Geriatric Physiotherapy'];
    if (!savedCats) {
      localStorage.setItem('ds_physio_categories', JSON.stringify(defaultCats));
      setPhysioCategories(defaultCats);
    } else {
      setPhysioCategories(JSON.parse(savedCats));
    }
  }, []);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const updated = [...physioCategories, newCategoryName.trim()];
    localStorage.setItem('ds_physio_categories', JSON.stringify(updated));
    setPhysioCategories(updated);
    setNewCategoryName('');
    addAuditLog('Add Physiotherapy Category', 'Super Admin', `Added service category: ${newCategoryName.trim()}`);
  };

  const handleDeleteCategory = (catName: string) => {
    const updated = physioCategories.filter(c => c !== catName);
    localStorage.setItem('ds_physio_categories', JSON.stringify(updated));
    setPhysioCategories(updated);
    addAuditLog('Delete Physiotherapy Category', 'Super Admin', `Deleted service category: ${catName}`);
  };

  const handleSaveReferralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      referralProgramEnabled: refProgramEnabled,
      referralRewardPct: Number(refRewardPct),
      requireApproval: refRequireApproval
    };
    saveReferralAdminConfig(updated);
    setReferralConfig(updated);
    addAuditLog(
      'Updated Referral Configuration',
      'Super Admin',
      `Referral program enabled: ${refProgramEnabled}, reward rate: ${refRewardPct}%, manual approval: ${refRequireApproval}`
    );
    alert('✓ Referral configuration saved successfully.');
  };

  const handleApproveTx = (email: string, txId: string) => {
    const res = approveWalletTransaction(email, txId);
    if (res.success) {
      addAuditLog(
        'Approved Wallet Transaction',
        'Super Admin',
        `Approved transaction ${txId} for ${email}.`
      );
      refreshPatientWallets();
      alert('✓ Wallet transaction approved and credited successfully.');
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const handleRejectTx = (email: string, txId: string) => {
    const res = rejectWalletTransaction(email, txId);
    if (res.success) {
      addAuditLog(
        'Rejected Wallet Transaction',
        'Super Admin',
        `Rejected/cancelled transaction ${txId} for ${email}.`
      );
      refreshPatientWallets();
      alert('✓ Wallet transaction rejected/cancelled.');
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const handlePerformAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentEmail || adjustmentAmount <= 0) {
      alert('Please select a patient and specify a positive adjustment amount.');
      return;
    }
    const res = performAdminWalletAdjustment(
      adjustmentEmail,
      adjustmentAmount,
      adjustmentType,
      adjustmentDescription || `Manual administrative adjustment by Super Admin`
    );
    if (res.success) {
      addAuditLog(
        `Wallet Balance Adjusted (${adjustmentType})`,
        'Super Admin',
        `Manually adjusted balance for ${adjustmentEmail} by ${adjustmentType === 'Credit' ? '+' : '-'}₹${adjustmentAmount.toFixed(2)}. Description: "${adjustmentDescription}"`
      );
      refreshPatientWallets();
      setShowAdjustmentModal(false);
      setAdjustmentAmount(0);
      setAdjustmentDescription('');
      alert(res.message);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const handleSaveSocialLinks = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ds_social_facebook', fbUrl);
    localStorage.setItem('ds_social_twitter', twUrl);
    localStorage.setItem('ds_social_instagram', igUrl);
    localStorage.setItem('ds_social_linkedin', liUrl);
    localStorage.setItem('ds_social_youtube', ytUrl);
    
    // Dispatch custom event to notify Footer component of update
    window.dispatchEvent(new Event('ds-social-links-updated'));
    
    addAuditLog(
      'Updated Footer Social Links',
      'Super Admin',
      `Facebook: ${fbUrl}, Twitter: ${twUrl}, Instagram: ${igUrl}, LinkedIn: ${liUrl}, YouTube: ${ytUrl}`
    );
    alert('✓ Footer social media links saved and updated successfully.');
  };

  const handleSaveFooterLinks = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ds_footer_copyright', copyrightText);
    localStorage.setItem('ds_footer_location', locationText);
    localStorage.setItem('ds_footer_privacy_label', privacyLabelText);
    localStorage.setItem('ds_footer_privacy_url', privacyUrlText);
    localStorage.setItem('ds_footer_terms_label', termsLabelText);
    localStorage.setItem('ds_footer_terms_url', termsUrlText);
    localStorage.setItem('ds_footer_refund_label', refundLabelText);
    localStorage.setItem('ds_footer_refund_url', refundUrlText);
    
    // Dispatch custom event to notify Footer component of update
    window.dispatchEvent(new Event('ds-footer-links-updated'));
    
    addAuditLog(
      'Updated Footer Copyright & Legal Links',
      'Super Admin',
      `Copyright: "${copyrightText}", Location: "${locationText}", Privacy: [${privacyLabelText} -> ${privacyUrlText}], Terms: [${termsLabelText} -> ${termsUrlText}], Refund: [${refundLabelText} -> ${refundUrlText}]`
    );
    alert('✓ Footer Copyright & Legal links saved and updated successfully.');
  };

  // Dynamic Pages Management Handlers
  const handleSubmitDynamicPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageFormTitle.trim() || !pageFormSlug.trim() || !pageFormContent.trim()) {
      alert('⚠️ All fields (Title, Slug, Content) are required to create/edit a page.');
      return;
    }

    const formattedSlug = slugify(pageFormSlug);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let updatedPages = [...dynamicPages];
    if (editingPageId) {
      // Edit mode
      updatedPages = dynamicPages.map(p => 
        p.id === editingPageId 
          ? { ...p, title: pageFormTitle, slug: formattedSlug, content: pageFormContent, active: pageFormActive, addToFooter: pageFormAddToFooter, lastUpdated: nowStr }
          : p
      );
      addAuditLog('Updated Custom Dynamic Page', 'Super Admin', `Title: "${pageFormTitle}", Slug: "${formattedSlug}"`);
      alert('✓ Custom page updated successfully.');
    } else {
      // Check for duplicate slugs
      if (dynamicPages.some(p => p.slug === formattedSlug)) {
        alert(`⚠️ A page with slug "${formattedSlug}" already exists. Please choose a unique title or slug.`);
        return;
      }
      // Create mode
      const newPage = {
        id: `dp-${Date.now()}`,
        title: pageFormTitle,
        slug: formattedSlug,
        content: pageFormContent,
        active: pageFormActive,
        addToFooter: pageFormAddToFooter,
        lastUpdated: nowStr
      };
      updatedPages = [newPage, ...dynamicPages];
      addAuditLog('Created New Custom Dynamic Page', 'Super Admin', `Title: "${pageFormTitle}", Slug: "${formattedSlug}"`);
      alert('✓ New custom page created successfully.');
    }

    setDynamicPages(updatedPages);
    localStorage.setItem('ds_dynamic_pages', JSON.stringify(updatedPages));
    window.dispatchEvent(new Event('ds-dynamic-pages-updated'));

    // Clear form
    setPageFormTitle('');
    setPageFormSlug('');
    setPageFormContent('');
    setPageFormActive(true);
    setPageFormAddToFooter(true);
    setEditingPageId(null);
  };

  const handleEditPage = (page: any) => {
    setEditingPageId(page.id);
    setPageFormTitle(page.title);
    setPageFormSlug(page.slug);
    setPageFormContent(page.content);
    setPageFormActive(page.active);
    setPageFormAddToFooter(page.addToFooter);
    // Scroll form into view gently
    const el = document.getElementById('dynamic-page-config-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeletePage = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the custom page "${title}"?`)) {
      return;
    }
    const updated = dynamicPages.filter(p => p.id !== id);
    setDynamicPages(updated);
    localStorage.setItem('ds_dynamic_pages', JSON.stringify(updated));
    window.dispatchEvent(new Event('ds-dynamic-pages-updated'));
    
    addAuditLog('Deleted Custom Dynamic Page', 'Super Admin', `Deleted Page: "${title}"`);
    alert(`✓ Page "${title}" has been deleted.`);
    
    if (editingPageId === id) {
      setEditingPageId(null);
      setPageFormTitle('');
      setPageFormSlug('');
      setPageFormContent('');
    }
  };

  const handleTogglePageActive = (id: string) => {
    const updated = dynamicPages.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    );
    setDynamicPages(updated);
    localStorage.setItem('ds_dynamic_pages', JSON.stringify(updated));
    window.dispatchEvent(new Event('ds-dynamic-pages-updated'));
    
    const target = dynamicPages.find(p => p.id === id);
    addAuditLog('Toggled Custom Page Status', 'Super Admin', `Page: "${target?.title}", New Status: ${!target?.active ? 'Active' : 'Inactive'}`);
  };

  const handleTogglePageFooter = (id: string) => {
    const updated = dynamicPages.map(p => 
      p.id === id ? { ...p, addToFooter: !p.addToFooter } : p
    );
    setDynamicPages(updated);
    localStorage.setItem('ds_dynamic_pages', JSON.stringify(updated));
    window.dispatchEvent(new Event('ds-dynamic-pages-updated'));
    
    const target = dynamicPages.find(p => p.id === id);
    addAuditLog('Toggled Custom Page Footer Visibility', 'Super Admin', `Page: "${target?.title}", Footer: ${!target?.addToFooter ? 'Visible' : 'Hidden'}`);
  };

  const handleCancelPageEdit = () => {
    setEditingPageId(null);
    setPageFormTitle('');
    setPageFormSlug('');
    setPageFormContent('');
    setPageFormActive(true);
    setPageFormAddToFooter(true);
  };

  // Theme Defaults mapping based on selected announcement type
  const handleApplyThemeDefaults = (type: 'Information' | 'Success' | 'Warning' | 'Emergency' | 'Offer' | 'Maintenance') => {
    setAnnFormType(type);
    const themes = {
      Information: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', icon: 'Info' },
      Success: { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', icon: 'CheckCircle' },
      Warning: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: 'AlertTriangle' },
      Emergency: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', icon: 'AlertOctagon' },
      Offer: { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF', icon: 'Tag' },
      Maintenance: { bg: '#FFEDD5', text: '#C2410C', border: '#FED7AA', icon: 'Wrench' }
    };
    const selection = themes[type];
    if (selection) {
      setAnnFormBackgroundColor(selection.bg);
      setAnnFormTextColor(selection.text);
      setAnnFormBorderColor(selection.border);
      setAnnFormIcon(selection.icon);
    }
  };

  const handleClearAnnForm = () => {
    setEditingAnnId(null);
    setAnnFormTitle('');
    setAnnFormMessage('');
    setAnnFormType('Information');
    setAnnFormPriority('Medium');
    setAnnFormTargetAudience('All');
    setAnnFormDisplayLocation('Entire Website');
    setAnnFormAnimationStyle('Marquee');
    setAnnFormAnimationSpeed('Medium');
    setAnnFormBackgroundColor('#E0F2FE');
    setAnnFormTextColor('#0369A1');
    setAnnFormBorderColor('#BAE6FD');
    setAnnFormLinkEnabled(false);
    setAnnFormButtonText('Learn More');
    setAnnFormButtonUrl('');
    setAnnFormDismissible(true);
    setAnnFormStartDatetime('');
    setAnnFormEndDatetime('');
    setAnnFormIcon('Info');
    setAnnFormFontSize('text-xs');
    setAnnFormPadding('py-1.5 px-4 md:px-8');
    setAnnFormHeight('h-auto');
  };

  const handleSubmitAnnouncement = (status: 'Draft' | 'Published') => {
    if (!annFormTitle.trim() || !annFormMessage.trim()) {
      alert('⚠️ Title and Message are required to save an announcement.');
      return;
    }

    const nowStr = new Date().toISOString();
    let updatedList: Announcement[] = [];

    if (editingAnnId) {
      // Edit mode
      updatedList = announcements.map(ann => {
        if (ann.id === editingAnnId) {
          const updatedAnn: Announcement = {
            ...ann,
            title: annFormTitle,
            message: annFormMessage,
            type: annFormType,
            priority: annFormPriority,
            target_audience: annFormTargetAudience,
            display_location: annFormDisplayLocation,
            animation_style: annFormAnimationStyle,
            animation_speed: annFormAnimationSpeed,
            background_color: annFormBackgroundColor,
            text_color: annFormTextColor,
            border_color: annFormBorderColor,
            link_enabled: annFormLinkEnabled,
            button_text: annFormButtonText,
            button_url: annFormButtonUrl,
            dismissible: annFormDismissible,
            start_datetime: annFormStartDatetime || undefined,
            end_datetime: annFormEndDatetime || undefined,
            icon: annFormIcon,
            font_size: annFormFontSize,
            padding: annFormPadding,
            height: annFormHeight,
            status: status,
            updated_at: nowStr,
            updated_by: 'Super Admin',
            published_at: status === 'Published' ? nowStr : ann.published_at
          };
          return updatedAnn;
        }
        return ann;
      });
      addAuditLog('Updated Announcement', 'Super Admin', `Title: "${annFormTitle}", Type: "${annFormType}", Status: "${status}"`);
      alert(`✓ Announcement "${annFormTitle}" updated successfully.`);
    } else {
      // Create mode
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        title: annFormTitle,
        message: annFormMessage,
        type: annFormType,
        priority: annFormPriority,
        target_audience: annFormTargetAudience,
        display_location: annFormDisplayLocation,
        animation_style: annFormAnimationStyle,
        animation_speed: annFormAnimationSpeed,
        background_color: annFormBackgroundColor,
        text_color: annFormTextColor,
        border_color: annFormBorderColor,
        link_enabled: annFormLinkEnabled,
        button_text: annFormButtonText,
        button_url: annFormButtonUrl,
        dismissible: annFormDismissible,
        start_datetime: annFormStartDatetime || undefined,
        end_datetime: annFormEndDatetime || undefined,
        icon: annFormIcon,
        font_size: annFormFontSize,
        padding: annFormPadding,
        height: annFormHeight,
        status: status,
        created_at: nowStr,
        updated_at: nowStr,
        created_by: 'Super Admin',
        published_at: status === 'Published' ? nowStr : undefined
      };
      updatedList = [newAnn, ...announcements];
      addAuditLog('Created Announcement', 'Super Admin', `Title: "${annFormTitle}", Type: "${annFormType}", Status: "${status}"`);
      alert(`✓ New announcement "${annFormTitle}" saved as ${status} successfully.`);
    }

    setAnnouncements(updatedList);
    localStorage.setItem('ds_announcements', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('ds-announcements-updated'));
    handleClearAnnForm();
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setAnnFormTitle(ann.title);
    setAnnFormMessage(ann.message);
    setAnnFormType(ann.type);
    setAnnFormPriority(ann.priority);
    setAnnFormTargetAudience(ann.target_audience);
    setAnnFormDisplayLocation(ann.display_location);
    setAnnFormAnimationStyle(ann.animation_style);
    setAnnFormAnimationSpeed(ann.animation_speed);
    setAnnFormBackgroundColor(ann.background_color);
    setAnnFormTextColor(ann.text_color);
    setAnnFormBorderColor(ann.border_color);
    setAnnFormLinkEnabled(ann.link_enabled);
    setAnnFormButtonText(ann.button_text || 'Learn More');
    setAnnFormButtonUrl(ann.button_url || '');
    setAnnFormDismissible(ann.dismissible);
    setAnnFormStartDatetime(ann.start_datetime || '');
    setAnnFormEndDatetime(ann.end_datetime || '');
    setAnnFormIcon(ann.icon || 'default');
    setAnnFormFontSize(ann.font_size || 'text-xs');
    setAnnFormPadding(ann.padding || 'py-1.5 px-4 md:px-8');
    setAnnFormHeight(ann.height || 'h-auto');

    // Scroll form into view gently
    const el = document.getElementById('announcement-creator-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteAnnouncement = (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete announcement "${title}"?`)) {
      return;
    }
    const updated = announcements.filter(ann => ann.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('ds_announcements', JSON.stringify(updated));
    window.dispatchEvent(new Event('ds-announcements-updated'));
    addAuditLog('Deleted Announcement', 'Super Admin', `Deleted: "${title}"`);
    alert(`✓ Announcement "${title}" has been permanently removed.`);
    if (editingAnnId === id) {
      handleClearAnnForm();
    }
  };

  const handleToggleAnnouncementStatus = (id: string) => {
    const target = announcements.find(ann => ann.id === id);
    if (!target) return;

    const newStatus = target.status === 'Published' ? 'Unpublished' : 'Published';
    const nowStr = new Date().toISOString();

    const updated = announcements.map(ann => {
      if (ann.id === id) {
        return { 
          ...ann, 
          status: newStatus, 
          updated_at: nowStr,
          published_at: newStatus === 'Published' ? nowStr : ann.published_at
        };
      }
      return ann;
    });

    setAnnouncements(updated);
    localStorage.setItem('ds_announcements', JSON.stringify(updated));
    window.dispatchEvent(new Event('ds-announcements-updated'));
    addAuditLog('Toggled Announcement Status', 'Super Admin', `Announcement: "${target.title}", New Status: "${newStatus}"`);
    alert(`✓ Status changed to ${newStatus} for "${target.title}".`);
  };

  const handleDuplicateAnnouncement = (ann: Announcement) => {
    const nowStr = new Date().toISOString();
    const duplicated: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      title: `${ann.title} (Copy)`,
      status: 'Draft', // copies as Draft by default for safety
      created_at: nowStr,
      updated_at: nowStr,
      published_at: undefined,
      created_by: 'Super Admin'
    };

    const updated = [duplicated, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('ds_announcements', JSON.stringify(updated));
    window.dispatchEvent(new Event('ds-announcements-updated'));
    addAuditLog('Duplicated Announcement', 'Super Admin', `Cloned from: "${ann.title}" into: "${duplicated.title}"`);
    alert(`✓ Cloned announcement "${ann.title}" as Draft successfully.`);
  };

  // Load and sync database
  const loadDatabase = () => {
    const isMockCleared = localStorage.getItem('ds_mock_data_cleared') === 'true';
    setIsMockCleared(isMockCleared);

    const savedPartners = localStorage.getItem('ds_partners');
    let pList = savedPartners ? JSON.parse(savedPartners) : [];

    const savedDocs = localStorage.getItem('ds_doctors');
    let dList = savedDocs ? JSON.parse(savedDocs) : [...MOCK_DOCTORS];

    // Auto-seed the 10 pending doctors and partners on first load if not done already
    const hasSeededBefore = localStorage.getItem('ds_seeded_10_pending_auto') === 'true';
    if (!hasSeededBefore && !isMockCleared) {
      const currentDocIds = new Set(dList.map((d: any) => d.id));
      const docsToAdd = SEED_DOCTORS.filter(d => !currentDocIds.has(d.id));
      if (docsToAdd.length > 0) {
        dList = [...dList, ...docsToAdd];
        localStorage.setItem('ds_doctors', JSON.stringify(dList));
      }

      const currentPartIds = new Set(pList.map((p: any) => p.id));
      const partnersToAdd = SEED_PARTNERS.filter(p => !currentPartIds.has(p.id));
      if (partnersToAdd.length > 0) {
        pList = [...pList, ...partnersToAdd];
        localStorage.setItem('ds_partners', JSON.stringify(pList));
      }

      localStorage.setItem('ds_seeded_10_pending_auto', 'true');
    }

    // Ensure Asif Sarkar is always appended if not already present
    const hasAsif = pList.some((p: any) => p.id === 'seed-part-asif');
    if (!hasAsif && !isMockCleared) {
      const asifPartner = SEED_PARTNERS.find(p => p.id === 'seed-part-asif');
      if (asifPartner) {
        pList = [...pList, asifPartner];
        localStorage.setItem('ds_partners', JSON.stringify(pList));
      }
    }

    const savedClinics = localStorage.getItem('ds_clinics');
    let cList = savedClinics ? JSON.parse(savedClinics) : MOCK_CLINICS;

    const savedPharmacies = localStorage.getItem('ds_pharmacies');
    let phList = savedPharmacies ? JSON.parse(savedPharmacies) : (isMockCleared ? [] : [
      {
        id: 'pharm-demo-1',
        name: 'Apollo Pharmacy',
        ownerName: 'Amit Patel',
        email: 'apollo.bandra@doctspark.in',
        phone: '9820011223',
        licenseNumber: 'DL-MUM-449102',
        address: 'Bandra West, Link Road',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        status: 'Approved (Active)',
        subscriptionPaid: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
      },
      {
        id: 'pharm-demo-2',
        name: 'MedPlus Pharmacy',
        ownerName: 'Vikas Shah',
        email: 'medplus.thane@doctspark.in',
        phone: '9830044556',
        licenseNumber: 'DL-THN-882091',
        address: 'Thane West, Station Road',
        city: 'Thane',
        district: 'Thane',
        state: 'Maharashtra',
        pincode: '400601',
        status: 'Pending Admin',
        onboardedBy: 'part-demo-district',
        onboardedByType: 'District',
        subscriptionPaid: true,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]);
    if (!savedPharmacies && !isMockCleared) {
      localStorage.setItem('ds_pharmacies', JSON.stringify(phList));
    }

    const savedLabs = localStorage.getItem('ds_laboratories');
    let labList = savedLabs ? JSON.parse(savedLabs) : (isMockCleared ? [] : [
      {
        id: 'lab-demo-1',
        name: 'DoctSpark Central Pathology Labs',
        ownerName: 'Dr. Ramesh Chawla',
        email: 'lab@doctspark.in',
        phone: '9876543210',
        licenseNumber: 'MC-9810-NABL',
        address: 'Apex Diagnostic Hub, Ground Floor, Sector 4, Bandra West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        status: 'Approved (Active)',
        subscriptionPaid: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
      },
      {
        id: 'lab-demo-2',
        name: 'Metro Diagnostics & Imaging',
        ownerName: 'Dr. Suresh Mehta',
        email: 'metro@doctspark.in',
        phone: '9876543211',
        licenseNumber: 'MC-1102-NABL',
        address: 'Apex Diagnostic Hub, Suite B, Thane West',
        city: 'Thane',
        district: 'Thane',
        state: 'Maharashtra',
        pincode: '400601',
        status: 'Pending Admin',
        onboardedBy: 'part-demo-district',
        onboardedByType: 'District',
        subscriptionPaid: true,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]);
    if (!savedLabs && !isMockCleared) {
      localStorage.setItem('ds_laboratories', JSON.stringify(labList));
    }

    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    let physioList = savedPhysios ? JSON.parse(savedPhysios) : (isMockCleared ? [] : [
      {
        id: 'physio-seed-1',
        name: 'Relief Point Physiotherapy',
        therapistName: 'Dr. Neha Sharma (PT)',
        email: 'neha.physio@doctspark.in',
        phone: '9822334455',
        registrationNumber: 'IAP-77621-PT',
        specialty: 'Sports Physiotherapy',
        experience: 7,
        address: 'MG Road, Camp',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        status: 'Pending Admin',
        onboardedBy: 'part-demo-district',
        onboardedByType: 'District',
        subscriptionPaid: true,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'physio-seed-2',
        name: 'Active Life Physio Clinic',
        therapistName: 'Dr. Amit Patel (PT)',
        email: 'amit.physio@doctspark.in',
        phone: '9811223344',
        registrationNumber: 'IAP-99012-PT',
        specialty: 'Orthopedic Physiotherapy',
        experience: 12,
        address: 'Bandra West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        status: 'Approved (Active)',
        onboardedBy: 'part-demo-district',
        onboardedByType: 'District',
        subscriptionPaid: true,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ]);
    if (!savedPhysios && !isMockCleared) {
      localStorage.setItem('ds_physiotherapists', JSON.stringify(physioList));
    }

    if (isMockCleared) {
      const filterMock = (arr: any[]) => {
        if (!arr) return [];
        return arr.filter((item: any) => {
          const id = String(item.id || '').toLowerCase();
          const email = String(item.email || item.partner_email || '').toLowerCase();
          return !id.includes('demo') && !id.includes('seed') && !id.includes('mock') &&
                 !email.includes('demo') && !email.includes('seed') && !email.includes('mock');
        });
      };
      pList = filterMock(pList);
      dList = filterMock(dList);
      cList = filterMock(cList);
      phList = filterMock(phList);
      labList = filterMock(labList);
      physioList = filterMock(physioList);
    }

    setPartners(pList);
    setDoctors(dList);
    setClinics(cList);
    setPharmacies(phList);
    setLaboratories(labList);
    setPhysiotherapists(physioList);

    const savedApts = localStorage.getItem('ds_appointments');
    const aList = savedApts ? JSON.parse(savedApts) : [];
    setAppointments(aList);

    // Commission data load
    setCommissions(getCommissionRecords());
    setCommConfig(getCommissionConfig());
    setAuditLogs(getAuditLogs());
    setPayoutReceipts(getPayoutReceipts());

    // Target configuration load
    const tc = getTargetConfig();
    setTargetConfig(tc);
    setDistrictOnboardInput(tc.districtOnboardTarget);
    setStateOnboardInput(tc.stateOnboardTarget);
    setDistrictAppointmentInput(tc.districtAppointmentTarget);
    setStateAppointmentInput(tc.stateAppointmentTarget);
    setDurationDaysInput(tc.countdownDurationDays);
    setBasicSalaryInput(tc.basicSalaryAmount);
    setTravelAllowanceInput(tc.travelAllowanceAmount);
    setTourEligibleInput(tc.internationalTourEligible);
    setRewardEnabledInput(tc.rewardProgramEnabled);
    setCertificateEnabledInput(tc.achievementCertificateEnabled);
  };

  const handleClearMockData = () => {
    localStorage.setItem('ds_mock_data_cleared', 'true');
    localStorage.setItem('ds_seeded_10_pending_auto', 'true'); // don't re-seed automatically

    // Clear/filter mock data from localStorage
    const filterMock = (arr: any[]) => {
      if (!arr) return [];
      return arr.filter((item: any) => {
        const id = String(item.id || '').toLowerCase();
        const email = String(item.email || item.partner_email || '').toLowerCase();
        return !id.includes('demo') && !id.includes('seed') && !id.includes('mock') &&
               !email.includes('demo') && !email.includes('seed') && !email.includes('mock');
      });
    };

    // 1. Partners
    const savedPartners = localStorage.getItem('ds_partners');
    if (savedPartners) {
      const filtered = filterMock(JSON.parse(savedPartners));
      localStorage.setItem('ds_partners', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_partners', JSON.stringify([]));
    }

    // 2. Doctors
    const savedDocs = localStorage.getItem('ds_doctors');
    if (savedDocs) {
      const filtered = filterMock(JSON.parse(savedDocs));
      localStorage.setItem('ds_doctors', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_doctors', JSON.stringify([]));
    }

    // 3. Clinics
    const savedClinics = localStorage.getItem('ds_clinics');
    if (savedClinics) {
      const filtered = filterMock(JSON.parse(savedClinics));
      localStorage.setItem('ds_clinics', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_clinics', JSON.stringify([]));
    }

    // 4. Pharmacies
    const savedPharmacies = localStorage.getItem('ds_pharmacies');
    if (savedPharmacies) {
      const filtered = filterMock(JSON.parse(savedPharmacies));
      localStorage.setItem('ds_pharmacies', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_pharmacies', JSON.stringify([]));
    }

    // 5. Laboratories
    const savedLabs = localStorage.getItem('ds_laboratories');
    if (savedLabs) {
      const filtered = filterMock(JSON.parse(savedLabs));
      localStorage.setItem('ds_laboratories', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_laboratories', JSON.stringify([]));
    }

    // 6. Physiotherapists
    const savedPhysios = localStorage.getItem('ds_physiotherapists');
    if (savedPhysios) {
      const filtered = filterMock(JSON.parse(savedPhysios));
      localStorage.setItem('ds_physiotherapists', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_physiotherapists', JSON.stringify([]));
    }

    // 7. Commissions/Ledger
    const savedCommissions = localStorage.getItem('ds_commission_records');
    if (savedCommissions) {
      const comms = JSON.parse(savedCommissions);
      const filtered = comms.filter((c: any) => {
        const sourceId = String(c.sourceId || '').toLowerCase();
        const partnerId = String(c.partnerId || '').toLowerCase();
        return !sourceId.includes('demo') && !sourceId.includes('seed') && !sourceId.includes('mock') &&
               !partnerId.includes('demo') && !partnerId.includes('seed') && !partnerId.includes('mock');
      });
      localStorage.setItem('ds_commission_records', JSON.stringify(filtered));
    } else {
      localStorage.setItem('ds_commission_records', JSON.stringify([]));
    }

    // Reload the local state variables
    loadDatabase();

    // Add audit log
    addAuditLog(
      'Mock Data Purged',
      'Super Admin',
      'Purged all sandbox mock/demo profiles, reset mock platform revenue fallback, and updated live stats telemetry to zero.'
    );

    setActionFeedback('purged');
  };

  const handleRestoreMockData = () => {
    localStorage.removeItem('ds_mock_data_cleared');
    localStorage.removeItem('ds_seeded_10_pending_auto');
    localStorage.removeItem('ds_partners');
    localStorage.removeItem('ds_doctors');
    localStorage.removeItem('ds_clinics');
    localStorage.removeItem('ds_pharmacies');
    localStorage.removeItem('ds_laboratories');
    localStorage.removeItem('ds_physiotherapists');
    localStorage.removeItem('ds_commission_records');
    loadDatabase();

    setActionFeedback('restored');
  };

  React.useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  React.useEffect(() => {
    loadDatabase();
  }, []);

  React.useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail as any);
      }
    };
    window.addEventListener('superadmin-tab-change', handleTabChange);
    return () => {
      window.removeEventListener('superadmin-tab-change', handleTabChange);
    };
  }, []);

  // Financial analytics
  const financialMetrics = React.useMemo(() => {
    // Dynamically calculate from complete automated commission ledger
    const nonReversed = commissions.filter(r => r.status !== 'Reversed');
    
    const grossSubscriptionRevenue = nonReversed
      .filter(r => r.type === 'Subscription')
      .reduce((sum, r) => sum + r.amount, 0);

    const grossAppointmentPlatformFee = nonReversed
      .filter(r => r.type === 'Appointment')
      .reduce((sum, r) => sum + r.platformCharge, 0);

    const districtCommissions = nonReversed
      .reduce((sum, r) => sum + r.districtPartnerCommission, 0);

    const stateCommissions = nonReversed
      .reduce((sum, r) => sum + r.statePartnerCommission, 0);

    const totalCommissionsPaid = districtCommissions + stateCommissions;

    const netPlatformEarnings = nonReversed
      .reduce((sum, r) => sum + r.companyCommission, 0);

    const totalSignupsCount = nonReversed
      .filter(r => r.type === 'Subscription')
      .length;

    return {
      grossSubscriptionRevenue,
      grossAppointmentPlatformFee,
      districtCommissions,
      stateCommissions,
      totalCommissionsPaid,
      netPlatformEarnings,
      totalSignupsCount
    };
  }, [commissions]);

  const masterStats = React.useMemo(() => {
    // 1. Total Patients
    const savedWallets = localStorage.getItem('ds_patient_wallets');
    const walletsCount = savedWallets ? Object.keys(JSON.parse(savedWallets)).length : 0;
    const totalPatients = isMockCleared ? walletsCount : Math.max(38, walletsCount + 15);

    // 2. Doctors
    const totalDoctors = doctors.length;

    // 3. Clinics
    const totalClinics = clinics.length;

    // 4. State Partners
    const totalStatePartners = partners.filter(p => p.role === 'state_partner' || p.role === 'state').length;

    // 5. District Partners
    const totalDistrictPartners = partners.filter(p => p.role === 'district_partner' || p.role === 'district').length;

    // 6. City Partners
    const totalCityPartners = partners.filter(p => p.role === 'city_partner' || p.role === 'city').length;

    // 7. Pharmacies
    const totalPharmacies = pharmacies.length;

    // 8. Laboratories
    const totalLaboratories = laboratories.length;

    // 9. Physiotherapists
    const totalPhysiotherapists = physiotherapists.length;

    // 10. Doctor Appointments
    const totalDoctorAppointments = appointments.length;

    // 11. Laboratory Bookings
    const savedLabBookings = localStorage.getItem('ds_lab_bookings');
    const totalLabBookings = savedLabBookings ? JSON.parse(savedLabBookings).length : 0;

    // 12. Pharmacy Orders
    const savedPharmacyOrders = localStorage.getItem('ds_medicine_orders');
    const totalPharmacyOrders = savedPharmacyOrders ? JSON.parse(savedPharmacyOrders).length : 0;

    // 13. Physiotherapy Bookings
    let totalPhysioBookings = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ds_physio_appointments_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          totalPhysioBookings += list.length;
        } catch (e) {}
      }
    }
    if (totalPhysioBookings === 0 && !isMockCleared) totalPhysioBookings = 3;

    // 14. Total Revenue
    const calculatedRevenue = financialMetrics?.grossSubscriptionRevenue || 0;
    let labRevenue = 0;
    try {
      if (savedLabBookings) {
        const bList = JSON.parse(savedLabBookings);
        labRevenue = bList.reduce((acc: number, item: any) => acc + (Number(item.price) || 0), 0);
      }
    } catch (e) {}

    let pharmRevenue = 0;
    try {
      if (savedPharmacyOrders) {
        const oList = JSON.parse(savedPharmacyOrders);
        pharmRevenue = oList.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0);
      }
    } catch (e) {}

    let physioRevenue = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ds_physio_appointments_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          physioRevenue += list.reduce((acc: number, item: any) => acc + (Number(item.fee) || 0), 0);
        } catch (e) {}
      }
    }
    const totalRevenue = calculatedRevenue + labRevenue + pharmRevenue + physioRevenue;

    // 15. Pending Verifications
    const pendingDocs = doctors.filter(d => d.verificationStatus && d.verificationStatus !== 'Approved').length;
    const pendingClinics = clinics.filter(c => c.verificationStatus && c.verificationStatus !== 'Approved').length;
    const pendingPartners = partners.filter(p => p.status && p.status !== 'Approved (Active)').length;
    const pendingPharmacies = pharmacies.filter(p => p.status && !p.status.includes('Approved')).length;
    const pendingLaboratories = laboratories.filter(l => l.status && !l.status.includes('Approved')).length;
    const pendingPhysios = physiotherapists.filter(p => p.status && !p.status.includes('Approved')).length;
    const totalPendingVerifications = pendingDocs + pendingClinics + pendingPartners + pendingPharmacies + pendingLaboratories + pendingPhysios;

    // 16. Active Users
    const totalActiveUsers = totalPatients + 
      doctors.filter(d => d.verificationStatus === 'Approved').length + 
      clinics.filter(c => c.verificationStatus === 'Approved').length + 
      partners.filter(p => p.status === 'Approved (Active)').length + 
      pharmacies.filter(p => p.status === 'Approved (Active)').length + 
      laboratories.filter(l => l.status === 'Approved (Active)').length + 
      physiotherapists.filter(p => p.status === 'Approved (Active)').length;

    return {
      totalPatients,
      totalDoctors,
      totalClinics,
      totalStatePartners,
      totalDistrictPartners,
      totalCityPartners,
      totalPharmacies,
      totalLaboratories,
      totalPhysiotherapists,
      totalDoctorAppointments,
      totalLabBookings,
      totalPharmacyOrders,
      totalPhysioBookings,
      totalRevenue,
      totalPendingVerifications,
      totalActiveUsers
    };
  }, [doctors, clinics, partners, pharmacies, laboratories, physiotherapists, appointments, financialMetrics, isMockCleared]);

  const handleSaveEdit = (updatedData: any) => {
    if (!editingItem) return;
    if (editingItem.type === 'doctor') {
      const updated = doctors.map(d => d.id === editingItem.id ? { ...d, ...updatedData } : d);
      localStorage.setItem('ds_doctors', JSON.stringify(updated));
      setDoctors(updated);
    } else if (editingItem.type === 'clinic') {
      const updated = clinics.map(c => c.id === editingItem.id ? { ...c, ...updatedData } : c);
      localStorage.setItem('ds_clinics', JSON.stringify(updated));
      setClinics(updated);
    } else if (editingItem.type === 'partner') {
      const updated = partners.map(p => p.id === editingItem.id ? { ...p, ...updatedData } : p);
      localStorage.setItem('ds_partners', JSON.stringify(updated));
      setPartners(updated);
    }
    setEditingItem(null);
    alert('✓ Profile registration details updated and saved successfully.');
  };

  // Handle final activation of Doctor or Clinic
  const handleApproveDoctorClinic = (id: string, type: 'doctor' | 'clinic', name: string, contactEmail: string, contactPhone: string) => {
    let emailAddress = contactEmail || `${name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
    let phoneNumber = contactPhone || '9876543210';
    let assignedReferralText = 'None';

    if (type === 'doctor') {
      const updated = doctors.map(d => {
        if (d.id === id) {
          const docObj = { ...d, verificationStatus: 'Approved' as any };
          if (!docObj.referralPartnerId && !docObj.referralIdLocked) {
            const assignId = prompt(
              `This doctor self-registered directly without a partner referral. You can assign a platform/default Referral ID (or leave blank to assign 'PLATFORM_DEFAULT'):`,
              'PLATFORM_DEFAULT'
            );
            if (assignId !== null) {
              docObj.referralPartnerId = assignId.trim() || 'PLATFORM_DEFAULT';
              docObj.referralIdLocked = true;
              
              const savedPartnersRaw = localStorage.getItem('ds_partners');
              const partnersList: any[] = savedPartnersRaw ? JSON.parse(savedPartnersRaw) : [];
              const matched = partnersList.find(p => p.referralId === docObj.referralPartnerId);
              if (matched) {
                docObj.onboardedBy = matched.id;
                docObj.onboardedByType = matched.partnerType;
              } else {
                docObj.onboardedBy = 'superadmin';
                docObj.onboardedByType = undefined;
              }
            }
          }
          assignedReferralText = docObj.referralPartnerId || 'None';
          return docObj;
        }
        return d;
      });
      localStorage.setItem('ds_doctors', JSON.stringify(updated));
      setDoctors(updated);

      // Audit Logging for Doctor
      addAuditLog(
        'Doctor Activated by Admin',
        'Super Admin',
        `Fully approved and activated doctor Dr. ${name} (ID: ${id}). Referral ID Locked: ${assignedReferralText}. Account is now LIVE. IP Address: 192.168.1.1`
      );
    } else {
      const updated = clinics.map(c => c.id === id ? { ...c, verificationStatus: 'Approved' as any } : c);
      localStorage.setItem('ds_clinics', JSON.stringify(updated));
      setClinics(updated);

      // Audit Logging for Clinic
      addAuditLog(
        'Clinic Activated by Admin',
        'Super Admin',
        `Fully approved and activated clinic ${name} (ID: ${id}). Account is now LIVE. IP Address: 192.168.1.1`
      );
    }

    // Automatically approve the subscription commission record for this doctor/clinic
    approveSubscriptionCommissionBySourceId(id, 'Super Admin');

    // Automatically send simulated Account Activation email and SMS
    const emailLog = `[EMAIL SENDER] From: support@doctspark.in ➔ To: ${emailAddress} | Message: "Congratulations, Dr./Clinic ${name}! Your DOCT SPARK profile has been verified and activated by our Super Admin. You are now live on the platform."`;
    const smsLog = `[SMS GATEWAY] To: +91 ${phoneNumber} | SMS: "Your DOCT SPARK account is active! Patients can now find you and book consults instantly."`;

    setNotificationLog(prev => [emailLog, smsLog, ...prev]);
    alert(`Final verification completed! Profile activated, and automatic Activation Email & SMS sent to ${name}.`);
  };

  const handleApprovePharmacy = (id: string, name: string, contactEmail: string, contactPhone: string) => {
    let emailAddress = contactEmail || `${name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
    let phoneNumber = contactPhone || '9876543210';

    const savedPharmaciesRaw = localStorage.getItem('ds_pharmacies');
    const pharmaciesList: Pharmacy[] = savedPharmaciesRaw ? JSON.parse(savedPharmaciesRaw) : [];
    const updated = pharmaciesList.map(p => p.id === id ? { ...p, status: 'Approved (Active)' as any } : p);
    localStorage.setItem('ds_pharmacies', JSON.stringify(updated));
    setPharmacies(updated);

    // Audit Logging
    addAuditLog(
      'Pharmacy Activated by Admin',
      'Super Admin',
      `Fully approved and activated pharmacy ${name} (ID: ${id}). Account is now LIVE. IP Address: 192.168.1.1`
    );

    // Automatically approve subscription commission if any exists
    approveSubscriptionCommissionBySourceId(id, 'Super Admin');

    const emailLog = `[EMAIL SENDER] From: support@doctspark.in ➔ To: ${emailAddress} | Message: "Congratulations, Pharmacy ${name}! Your DOCT SPARK profile has been verified and activated by our Super Admin. You can now login to manage medicine inventory and orders."`;
    const smsLog = `[SMS GATEWAY] To: +91 ${phoneNumber} | SMS: "Your DOCT SPARK pharmacy account is active! Patients can now place medicine orders from your store."`;

    setNotificationLog(prev => [emailLog, smsLog, ...prev]);
    alert(`Final verification completed! Pharmacy profile activated, and automatic Activation Email & SMS sent to ${name}.`);
  };

  const handleApproveLaboratory = (id: string, name: string, contactEmail: string, contactPhone: string) => {
    let emailAddress = contactEmail || `${name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
    let phoneNumber = contactPhone || '9876543210';

    const savedLabsRaw = localStorage.getItem('ds_laboratories');
    const labsList: Laboratory[] = savedLabsRaw ? JSON.parse(savedLabsRaw) : [];
    const updated = labsList.map(l => l.id === id ? { ...l, status: 'Approved (Active)' as any } : l);
    localStorage.setItem('ds_laboratories', JSON.stringify(updated));
    setLaboratories(updated);

    // Audit Logging
    addAuditLog(
      'Laboratory Activated by Admin',
      'Super Admin',
      `Fully approved and activated laboratory ${name} (ID: ${id}). Account is now LIVE.`
    );

    // Automatically approve subscription commission if any exists
    approveSubscriptionCommissionBySourceId(id, 'Super Admin');

    const emailLog = `[EMAIL SENDER] From: support@doctspark.in ➔ To: ${emailAddress} | Message: "Congratulations, Laboratory ${name}! Your DOCT SPARK profile has been verified and activated by our Super Admin. You can now login to manage test catalogs and track patient sample collections."`;
    const smsLog = `[SMS GATEWAY] To: +91 ${phoneNumber} | SMS: "Your DOCT SPARK laboratory account is active! Patients can now book diagnostic tests from your center."`;

    setNotificationLog(prev => [emailLog, smsLog, ...prev]);
    alert(`Final verification completed! Laboratory profile activated, and automatic Activation Email & SMS sent to ${name}.`);
  };

  const handleApprovePhysiotherapist = (id: string, name: string, contactEmail: string, contactPhone: string) => {
    let emailAddress = contactEmail || `${name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
    let phoneNumber = contactPhone || '9876543210';

    const savedPhysiosRaw = localStorage.getItem('ds_physiotherapists');
    const physioList: Physiotherapy[] = savedPhysiosRaw ? JSON.parse(savedPhysiosRaw) : [];
    const updated = physioList.map(p => p.id === id ? { ...p, status: 'Approved (Active)' as any } : p);
    localStorage.setItem('ds_physiotherapists', JSON.stringify(updated));
    setPhysiotherapists(updated);

    // Audit Logging
    addAuditLog(
      'Physiotherapist Activated by Admin',
      'Super Admin',
      `Fully approved and activated physiotherapist ${name} (ID: ${id}). Account is now LIVE.`
    );

    // Automatically approve subscription commission if any exists
    approveSubscriptionCommissionBySourceId(id, 'Super Admin');

    const emailLog = `[EMAIL SENDER] From: support@doctspark.in ➔ To: ${emailAddress} | Message: "Congratulations, Physiotherapist ${name}! Your DOCT SPARK profile has been verified and activated by our Super Admin. You can now login to manage appointments, home visits, services, and wallets."`;
    const smsLog = `[SMS GATEWAY] To: +91 ${phoneNumber} | SMS: "Your DOCT SPARK Physiotherapist account is active! Patients can now find you and book home/clinic physiotherapy sessions."`;

    setNotificationLog(prev => [emailLog, smsLog, ...prev]);
    alert(`Final verification completed! Physiotherapist profile activated, and automatic Activation Email & SMS sent to ${name}.`);
  };

  // Handle Partner Approval & Activation
  const handleApprovePartnerObj = (partnerId: string, name: string, emailAdd: string, phoneNum: string) => {
    const updated = partners.map(p => p.id === partnerId ? { ...p, status: 'Approved (Active)' as any } : p);
    localStorage.setItem('ds_partners', JSON.stringify(updated));
    setPartners(updated);

    const partnerObj = partners.find(p => p.id === partnerId);
    const applicantLocation = partnerObj 
      ? `${partnerObj.assignedCity ? partnerObj.assignedCity + ', ' : ''}${partnerObj.assignedDistrict ? partnerObj.assignedDistrict + ', ' : ''}${partnerObj.assignedState}`
      : 'N/A';
    const applicantRole = partnerObj ? `${partnerObj.partnerType} Partner` : 'Partner';

    // Record action in audit log
    const auditLogText = `Applicant ID: ${partnerId} | Applicant Role: ${applicantRole} | Location: ${applicantLocation} | Verifier ID: ADMIN-01 | Verifier Role: Super Admin | Decision: Approved & Activated | Remarks: "Direct quick-approval by Master Admin." | Date: ${new Date().toLocaleString()}`;
    addAuditLog(
      'Partner Verification: Approved & Activated',
      'Super Admin (Master Admin)',
      auditLogText
    );

    if (partnerObj) {
      const notifs = triggerVerificationNotification(
        partnerObj,
        'activation',
        'Direct quick-approval by Master Admin.',
        'Super Admin (Master Admin)'
      );
      setNotificationLog(prev => [...notifs, ...prev]);
    } else {
      const mockObj = { name, email: emailAdd, phone: phoneNum, partnerType: 'District', assignedState: 'Maharashtra' };
      const notifs = triggerVerificationNotification(
        mockObj,
        'activation',
        'Direct quick-approval by Master Admin.',
        'Super Admin (Master Admin)'
      );
      setNotificationLog(prev => [...notifs, ...prev]);
    }

    alert(`Partner profile successfully approved and activated! Onboarding Email, SMS, and In-App notifications transmitted.`);
  };

  // Handle Master Admin detailed partner review action (Approve or Reject with Remarks)
  const handleAdminReviewPartnerAction = (action: 'approve' | 'reject') => {
    if (!selectedPartnerForAdminReview) return;
    if (!adminReviewRemarks.trim()) {
      setAdminReviewError('Please provide review remarks for the audit log.');
      return;
    }

    const finalStatus = action === 'approve' ? 'Approved (Active)' : 'Rejected';
    const updated = partners.map(p => p.id === selectedPartnerForAdminReview.id ? { ...p, status: finalStatus as any } : p);
    localStorage.setItem('ds_partners', JSON.stringify(updated));
    setPartners(updated);

    const applicantLocation = `${selectedPartnerForAdminReview.assignedCity ? selectedPartnerForAdminReview.assignedCity + ', ' : ''}${selectedPartnerForAdminReview.assignedDistrict ? selectedPartnerForAdminReview.assignedDistrict + ', ' : ''}${selectedPartnerForAdminReview.assignedState}`;
    const auditLogText = `Applicant ID: ${selectedPartnerForAdminReview.id} | Applicant Role: ${selectedPartnerForAdminReview.partnerType} Partner | Location: ${applicantLocation} | Verifier ID: ADMIN-01 | Verifier Role: Super Admin | Decision: ${action === 'approve' ? 'Approved & Activated' : 'Rejected'} | Remarks: "${adminReviewRemarks}" | Date: ${new Date().toLocaleString()}`;

    // Record verification action in the audit log
    addAuditLog(
      `Partner Verification: ${action === 'approve' ? 'Approved & Activated' : 'Rejected'}`,
      'Super Admin (Master Admin)',
      auditLogText
    );

    const eventType = action === 'approve' ? 'activation' : 'rejection';
    const notifs = triggerVerificationNotification(
      selectedPartnerForAdminReview,
      eventType,
      adminReviewRemarks,
      'Super Admin (Master Admin)'
    );

    setNotificationLog(prev => [...notifs, ...prev]);

    alert(`Partner profile successfully ${action === 'approve' ? 'approved & activated' : 'rejected'}!`);
    setSelectedPartnerForAdminReview(null);
    setAdminReviewRemarks('');
    setAdminReviewError('');
  };

  // Add Partner by Super Admin directly
  const [newPartName, setNewPartName] = React.useState('');
  const [newPartEmail, setNewPartEmail] = React.useState('');
  const [newPartPhone, setNewPartPhone] = React.useState('');
  const [newPartType, setNewPartType] = React.useState<'State' | 'District'>('District');
  const [newPartState, setNewPartState] = React.useState('Maharashtra');
  const [newPartDistrict, setNewPartDistrict] = React.useState('');

  const assignedStateDistricts = React.useMemo(() => {
    const stateObj = indiaStatesData.find(s => s.state === newPartState);
    return stateObj ? stateObj.districts : [];
  }, [newPartState]);

  React.useEffect(() => {
    if (assignedStateDistricts.length > 0) {
      setNewPartDistrict(assignedStateDistricts[0].name);
    } else {
      setNewPartDistrict('');
    }
  }, [assignedStateDistricts]);

  const handleAddPartnerDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName || !newPartEmail || !newPartPhone) {
      alert('Please fill in all partner credentials.');
      return;
    }

    const newPartnerObj: Partner = {
      id: `part-${Date.now()}`,
      name: newPartName,
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      dob: '1988-06-15',
      age: 38,
      gender: 'Male',
      phone: newPartPhone,
      email: newPartEmail,
      address: `Super Admin Direct Onboarding Office`,
      state: newPartState,
      district: newPartType === 'District' ? newPartDistrict : undefined,
      pincode: '400001',
      aadhaarNumber: '999900001111',
      panNumber: 'ABCDE9876Z',
      voterIdNumber: 'VTR9876543',
      hasDrivingLicense: true,
      drivingLicenseNumber: 'DL-1420110068771',
      qualification: 'Post Graduate',
      experience: '10 Years',
      occupation: 'Regional Agent',
      skills: 'Full Operations',
      partnerType: newPartType,
      assignedState: newPartState,
      assignedDistrict: newPartType === 'District' ? newPartDistrict : undefined,
      status: 'Approved', // Pre-approved by Super Admin
      onboardedDoctorsCount: 0,
      onboardedClinicsCount: 0,
      walletBalance: 0
    };

    const updated = [...partners, { ...newPartnerObj, password: 'partner123' }];
    localStorage.setItem('ds_partners', JSON.stringify(updated));
    setPartners(updated);

    alert(`Direct partner created & pre-activated successfully!`);
    setNewPartName('');
    setNewPartEmail('');
    setNewPartPhone('');
  };

  const seed10PendingProfiles = () => {
    const currentDocIds = new Set(doctors.map(d => d.id));
    const docsToAdd = SEED_DOCTORS.filter(d => !currentDocIds.has(d.id));

    const currentPartIds = new Set(partners.map(p => p.id));
    const partnersToAdd = SEED_PARTNERS.filter(p => !currentPartIds.has(p.id));

    if (docsToAdd.length === 0 && partnersToAdd.length === 0) {
      alert('Info: Seeded profiles are already present in the database!');
      return;
    }

    const updatedDoctors = [...doctors, ...docsToAdd];
    const updatedPartners = [...partners, ...partnersToAdd];

    localStorage.setItem('ds_doctors', JSON.stringify(updatedDoctors));
    localStorage.setItem('ds_partners', JSON.stringify(updatedPartners));

    setDoctors(updatedDoctors);
    setPartners(updatedPartners);

    alert(`Successfully generated 10 new pending Doctor profiles and 10 new pending Partner profiles in different states & districts!`);
  };

  // Dynamic Documents List compiled name-wise
  const allDocumentsList = React.useMemo(() => {
    const list: any[] = [];

    // Add Doctor documents
    doctors.forEach(doc => {
      list.push({
        id: `${doc.id}-ownerIdProofDoc`,
        entityId: doc.id,
        entityName: doc.name,
        entityType: 'doctor',
        docLabel: 'Owner Aadhaar/ID Proof',
        docField: 'ownerIdProofDoc',
        fileName: doc.ownerIdProofDoc || 'Aadhaar_Owner.pdf',
        fileSize: '1.4 MB',
        uploadedAt: 'June 25, 2026',
        status: doc.verificationStatus && doc.verificationStatus !== 'Approved' ? 'pending' : 'verified'
      });
    });

    // Add Clinic documents
    clinics.forEach(cl => {
      const files = cl.licenseDocuments && cl.licenseDocuments.length > 0 ? cl.licenseDocuments : ['Trade_License.pdf'];
      files.forEach((file, index) => {
        list.push({
          id: `${cl.id}-license-${index}`,
          entityId: cl.id,
          entityName: cl.name,
          entityType: 'clinic',
          docLabel: 'Trade License Certificate',
          docField: 'licenseDocuments',
          fileIndex: index,
          fileName: file,
          fileSize: '2.1 MB',
          uploadedAt: 'June 25, 2026',
          status: cl.verificationStatus && cl.verificationStatus !== 'Approved' ? 'pending' : 'verified'
        });
      });
    });

    // Add Partner documents
    partners.forEach(p => {
      // Aadhaar
      list.push({
        id: `${p.id}-aadhaar`,
        entityId: p.id,
        entityName: p.name,
        entityType: 'partner',
        docLabel: 'Aadhaar Identity Proof',
        docField: 'aadhaarNumber',
        fileName: p.aadhaarNumber ? `Aadhaar_${p.aadhaarNumber}.pdf` : `${p.name.replace(/\s+/g, '_')}_Aadhaar.pdf`,
        fileSize: '1.1 MB',
        uploadedAt: p.createdAt || 'June 26, 2026',
        status: p.status === 'Approved' ? 'verified' : 'pending',
        docValue: p.aadhaarNumber
      });

      // PAN
      list.push({
        id: `${p.id}-pan`,
        entityId: p.id,
        entityName: p.name,
        entityType: 'partner',
        docLabel: 'PAN Tax Document',
        docField: 'panNumber',
        fileName: p.panNumber ? `PAN_${p.panNumber}.pdf` : `${p.name.replace(/\s+/g, '_')}_PAN.pdf`,
        fileSize: '850 KB',
        uploadedAt: p.createdAt || 'June 26, 2026',
        status: p.status === 'Approved' ? 'verified' : 'pending',
        docValue: p.panNumber
      });

      // Voter ID
      if (p.voterIdNumber) {
        list.push({
          id: `${p.id}-voter`,
          entityId: p.id,
          entityName: p.name,
          entityType: 'partner',
          docLabel: 'Voter ID Card',
          docField: 'voterIdNumber',
          fileName: `Voter_${p.voterIdNumber}.pdf`,
          fileSize: '920 KB',
          uploadedAt: p.createdAt || 'June 26, 2026',
          status: p.status === 'Approved' ? 'verified' : 'pending',
          docValue: p.voterIdNumber
        });
      }

      // Driving License
      if (p.drivingLicenseNumber || p.hasDrivingLicense) {
        list.push({
          id: `${p.id}-dl`,
          entityId: p.id,
          entityName: p.name,
          entityType: 'partner',
          docLabel: 'Driving License',
          docField: 'drivingLicenseNumber',
          fileName: p.drivingLicenseNumber ? `DL_${p.drivingLicenseNumber}.pdf` : `${p.name.replace(/\s+/g, '_')}_DrivingLicense.pdf`,
          fileSize: '1.2 MB',
          uploadedAt: p.createdAt || 'June 26, 2026',
          status: p.status === 'Approved' ? 'verified' : 'pending',
          docValue: p.drivingLicenseNumber
        });
      }
    });

    return list;
  }, [doctors, clinics, partners]);

  const filteredDocuments = React.useMemo(() => {
    return allDocumentsList
      .filter(doc => {
        const matchesSearch = doc.entityName.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
          doc.docLabel.toLowerCase().includes(docSearchTerm.toLowerCase());
        
        const matchesType = docTypeFilter === 'all' || doc.entityType === docTypeFilter;
        const matchesStatus = docStatusFilter === 'all' || doc.status === docStatusFilter;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => a.entityName.localeCompare(b.entityName));
  }, [allDocumentsList, docSearchTerm, docTypeFilter, docStatusFilter]);

  const handleSaveDocEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const { entityId, entityType, docField, fileIndex } = editingDoc;
    const trimmedVal = editingDocVal.trim();

    if (!trimmedVal) {
      alert('Document reference cannot be empty.');
      return;
    }

    if (entityType === 'doctor') {
      const updated = doctors.map(doc => {
        if (doc.id === entityId) {
          return { ...doc, [docField]: trimmedVal };
        }
        return doc;
      });
      setDoctors(updated);
      localStorage.setItem('ds_doctors', JSON.stringify(updated));
    } else if (entityType === 'clinic') {
      const updated = clinics.map(cl => {
        if (cl.id === entityId) {
          const files = [...(cl.licenseDocuments || ['Trade_License.pdf'])];
          const idx = fileIndex !== undefined ? fileIndex : 0;
          files[idx] = trimmedVal;
          return { ...cl, licenseDocuments: files };
        }
        return cl;
      });
      setClinics(updated);
      localStorage.setItem('ds_clinics', JSON.stringify(updated));
    } else if (entityType === 'partner') {
      const updated = partners.map(p => {
        if (p.id === entityId) {
          return { ...p, [docField]: trimmedVal };
        }
        return p;
      });
      setPartners(updated);
      localStorage.setItem('ds_partners', JSON.stringify(updated));
    }

    alert(`✓ Document filename reference updated successfully to "${trimmedVal}".`);
    setEditingDoc(null);
  };

  const sidebarCategories = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Layout,
      items: [
        { id: 'dashboard-overview', label: 'Dashboard Overview', icon: Activity },
        { id: 'dashboard-analytics', label: 'Analytics Insights', icon: BarChart2 },
        { id: 'dashboard-monitoring', label: 'Real-Time Monitoring', icon: Cpu },
        { id: 'dashboard-reports-overview', label: 'Reports Overview', icon: Award },
        { id: 'dashboard-ai', label: 'AI Predictive Insights', icon: Cpu, isNew: true }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      items: [
        { id: 'user-all', label: 'All Users Roster', icon: Users },
        { id: 'user-patients', label: 'Patients Index', icon: HeartPulse },
        { id: 'user-doctors', label: 'Medical Practitioners', icon: Stethoscope },
        { id: 'user-clinics', label: 'Affiliated Clinics', icon: Building2 },
        { id: 'user-laboratories', label: 'Laboratory Partners', icon: Clipboard },
        { id: 'user-pharmacies', label: 'Registered Pharmacies', icon: Pill },
        { id: 'user-physiotherapists', label: 'Physiotherapists', icon: Activity },
        { id: 'user-partners', label: 'Franchise Partners', icon: Landmark },
        { id: 'user-staff', label: 'Administrative Staff', icon: UserCheck },
        { id: 'user-roles', label: 'Roles & Permissions', icon: ShieldCheck },
        { id: 'user-crm', label: 'CRM & Accounts', icon: Sliders, isNew: true },
        { id: 'user-medical-records', label: 'Medical Records', icon: FileText, isNew: true },
        { id: 'user-consent', label: 'Consent Management', icon: ShieldAlert, isNew: true }
      ]
    },
    {
      id: 'partners',
      label: 'Partner Management',
      icon: Landmark,
      items: [
        { id: 'partner-all', label: 'All Partners List', icon: Landmark },
        { id: 'partner-state', label: 'State Level Partners', icon: Landmark },
        { id: 'partner-district', label: 'District Level Partners', icon: Landmark },
        { id: 'partner-city', label: 'City Level Partners', icon: Landmark },
        { id: 'partner-targets', label: 'Targets & Milestones', icon: Target },
        { id: 'partner-franchise', label: 'Franchise Management', icon: Building2, isNew: true }
      ]
    },
    {
      id: 'providers',
      label: 'Healthcare Providers',
      icon: Stethoscope,
      items: [
        { id: 'provider-doctors', label: 'Doctor Directory', icon: Stethoscope },
        { id: 'provider-clinics', label: 'Clinics Registry', icon: Building2 },
        { id: 'provider-laboratories', label: 'Labs Directory', icon: Clipboard },
        { id: 'provider-pharmacies', label: 'Pharmacies List', icon: Pill },
        { id: 'provider-physiotherapists', label: 'Physiotherapists', icon: Activity },
        { id: 'provider-hospitals', label: 'Hospitals (Future Ready)', icon: Landmark },
        { id: 'provider-categories', label: 'Service Categories', icon: Layers },
        { id: 'provider-departments', label: 'Hospital Departments', icon: Building2 },
        { id: 'provider-specialties', label: 'Medical Specialties', icon: Award },
        { id: 'provider-qualifications', label: 'Required Credentials', icon: FileText },
        { id: 'provider-availability', label: 'Practitioner Availability', icon: Calendar, isNew: true },
        { id: 'provider-holidays', label: 'Holidays & Absence', icon: Calendar, isNew: true }
      ]
    },
    {
      id: 'appointments',
      label: 'Appointment Management',
      icon: CalendarCheck,
      items: [
        { id: 'appointment-all', label: 'All Appointments Logs', icon: Calendar },
        { id: 'appointment-pending', label: 'Pending Bookings', icon: Clock },
        { id: 'appointment-confirmed', label: 'Confirmed Schedules', icon: CheckCircle2 },
        { id: 'appointment-completed', label: 'Completed Consults', icon: ShieldCheck },
        { id: 'appointment-cancelled', label: 'Cancelled Log', icon: AlertCircle },
        { id: 'appointment-rescheduled', label: 'Rescheduled Entries', icon: Clock },
        { id: 'appointment-video', label: 'Video Consultations', icon: Smartphone },
        { id: 'appointment-offline', label: 'In-Clinic Consultations', icon: Building2 }
      ]
    },
    {
      id: 'laboratory_mgmt',
      label: 'Laboratory',
      icon: Clipboard,
      items: [
        { id: 'lab-dashboard', label: 'Diagnostic Dashboard', icon: Clipboard },
        { id: 'lab-categories', label: 'Test Classifications', icon: Layers },
        { id: 'lab-tests', label: 'Pathology & Radiology Tests', icon: Activity },
        { id: 'lab-packages', label: 'Checkup Packages', icon: Package },
        { id: 'lab-collections', label: 'Home Sample Collection', icon: Smartphone },
        { id: 'lab-agents', label: 'Collection Personnel', icon: Users },
        { id: 'lab-bookings', label: 'Diagnostic Bookings', icon: Calendar },
        { id: 'lab-reports', label: 'Patient Test Reports', icon: FileText }
      ]
    },
    {
      id: 'pharmacy_mgmt',
      label: 'Pharmacy',
      icon: Pill,
      items: [
        { id: 'pharmacy-dashboard', label: 'Pharmacy Dashboard', icon: Pill },
        { id: 'pharmacy-categories', label: 'Drug Classifications', icon: Layers },
        { id: 'pharmacy-medicines', label: 'Medicines Inventory', icon: Pill },
        { id: 'pharmacy-inventory', label: 'Stock Ledger', icon: Package },
        { id: 'pharmacy-orders', label: 'Meds Delivery Orders', icon: Truck },
        { id: 'pharmacy-agents', label: 'Pharmacy Courier Roster', icon: Users },
        { id: 'pharmacy-prescriptions', label: 'Rx Verifications', icon: FileText },
        { id: 'pharmacy-sales', label: 'Meds Sales Report', icon: BarChart2 }
      ]
    },
    {
      id: 'physio_mgmt',
      label: 'Physiotherapy',
      icon: Activity,
      items: [
        { id: 'physio-therapists', label: 'Therapists Registry', icon: Users },
        { id: 'physio-services', label: 'Rehabilitation Services', icon: Activity },
        { id: 'physio-packages', label: 'Physio Session Packs', icon: Package },
        { id: 'physio-bookings', label: 'Therapy Bookings', icon: Calendar }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      items: [
        { id: 'finance-revenue', label: 'Ecosystem Revenue Summary', icon: DollarSign },
        { id: 'finance-transactions', label: 'General Ledgers', icon: History },
        { id: 'finance-wallet', label: 'Wallet Configurations', icon: Landmark },
        { id: 'finance-fee', label: 'Onboarding Platform Fees', icon: Landmark },
        { id: 'finance-subscriptions', label: 'Subscription Payments', icon: FileText },
        { id: 'finance-commission', label: 'Commission Splits', icon: Percent },
        { id: 'finance-incentives', label: 'Incentives & Bonuses', icon: Award },
        { id: 'finance-refunds', label: 'Cancellations & Refunds', icon: AlertTriangle },
        { id: 'finance-withdrawals', label: 'Withdrawal Approvals', icon: Landmark },
        { id: 'finance-payouts', label: 'Settlement Payouts', icon: DollarSign },
        { id: 'finance-gst', label: 'GST Tax Reports', icon: FileText },
        { id: 'finance-plans', label: 'Subscription Plans', icon: Sliders, isNew: true },
        { id: 'finance-coupons', label: 'Coupon Management', icon: Percent, isNew: true },
        { id: 'finance-memberships', label: 'Membership Plans', icon: Award, isNew: true },
        { id: 'finance-invoices', label: 'Invoicing Ledger', icon: FileText, isNew: true }
      ]
    },
    {
      id: 'referrals',
      label: 'Referral Management',
      icon: Gift,
      items: [
        { id: 'referral-settings', label: 'Referral Rules Settings', icon: Gift },
        { id: 'referral-rewards', label: 'Onboarding Referral Rewards', icon: Award },
        { id: 'referral-transactions', label: 'Rewards Ledger', icon: History }
      ]
    },
    {
      id: 'reviews',
      label: 'Reviews & Feedback',
      icon: StarHalf,
      items: [
        { id: 'review-doctors', label: 'Doctor Ratings', icon: Star },
        { id: 'review-clinics', label: 'Clinic Feedback', icon: Star },
        { id: 'review-laboratories', label: 'Laboratory Reviews', icon: Star },
        { id: 'review-pharmacies', label: 'Pharmacy Reviews', icon: Star },
        { id: 'review-physiotherapists', label: 'Physiotherapist Reviews', icon: Star },
        { id: 'review-reported', label: 'Reported Review Moderation', icon: AlertTriangle }
      ]
    },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: BellRing,
      items: [
        { id: 'notify-sms', label: 'Transactional SMS Logs', icon: Smartphone },
        { id: 'notify-email', label: 'SMTP Email Dispatcher', icon: Mail },
        { id: 'notify-push', label: 'Native Push Campaigns', icon: BellRing },
        { id: 'notify-templates', label: 'Alert Templates Library', icon: Clipboard },
        { id: 'notify-announcements', label: 'Site-wide Broadcasts', icon: Globe },
        { id: 'notify-campaigns', label: 'Marketing Campaigns', icon: Target, isNew: true },
        { id: 'notify-email-mgr', label: 'Email Campaign Manager', icon: Mail, isNew: true },
        { id: 'notify-sms-mgr', label: 'SMS Campaign Manager', icon: Smartphone, isNew: true },
        { id: 'notify-whatsapp-mgr', label: 'WhatsApp Campaign Manager', icon: Smartphone, isNew: true },
        { id: 'notify-ads', label: 'Advertisement Manager', icon: Globe, isNew: true }
      ]
    },
    {
      id: 'registration_mgmt',
      label: 'Registration Management',
      icon: Plus,
      items: [
        { id: 'register-doctor', label: 'Doctor Signup Protocol', icon: Stethoscope },
        { id: 'register-clinic', label: 'Clinic Signup Protocol', icon: Building2 },
        { id: 'register-laboratory', label: 'Lab Registration Flow', icon: Clipboard },
        { id: 'register-pharmacy', label: 'Pharmacy Onboarding Flow', icon: Pill },
        { id: 'register-physiotherapy', label: 'Physiotherapy Setup Flow', icon: Activity },
        { id: 'register-partner', label: 'Agent Onboarding Flow', icon: Landmark },
        { id: 'register-patient', label: 'Patient Register Flow', icon: Users }
      ]
    },
    {
      id: 'verification_center',
      label: 'Verification Center',
      icon: ShieldCheck,
      items: [
        { id: 'verify-doctor', label: 'Clinician Document Review', icon: ShieldCheck },
        { id: 'verify-clinic', label: 'Clinical Licenses Check', icon: ShieldCheck },
        { id: 'verify-laboratory', label: 'Diagnostics Accreditation', icon: ShieldCheck },
        { id: 'verify-pharmacy', label: 'Pharmacy License Check', icon: ShieldCheck },
        { id: 'verify-physiotherapy', label: 'Therapists Accreditation', icon: ShieldCheck },
        { id: 'verify-partner', label: 'Agent Verifications Queue', icon: ShieldCheck },
        { id: 'verify-documents', label: 'Global Documents Vault', icon: FileText }
      ]
    },
    {
      id: 'cms',
      label: 'CMS',
      icon: BookOpen,
      items: [
        { id: 'cms-homepage', label: 'Landing Page Sections', icon: Globe },
        { id: 'cms-aboutus', label: 'About Page Sections', icon: FileText },
        { id: 'cms-contact', label: 'Contact Us Forms', icon: Mail },
        { id: 'cms-faq', label: 'F.A.Q Accordions List', icon: Clipboard },
        { id: 'cms-blog', label: 'Health Blog & Articles', icon: BookOpen },
        { id: 'cms-privacy', label: 'Privacy Policy Document', icon: FileText },
        { id: 'cms-terms', label: 'Terms & Conditions Document', icon: FileText },
        { id: 'cms-refund', label: 'Refund Policy Document', icon: FileText },
        { id: 'cms-cancellation', label: 'Cancellation Policy Doc', icon: FileText },
        { id: 'cms-pages', label: 'Static Custom Pages', icon: BookOpen },
        { id: 'cms-banners', label: 'Carousel Banners Manager', icon: Globe },
        { id: 'cms-seo', label: 'Meta SEO & Analytics Tags', icon: Settings }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      items: [
        { id: 'report-revenue', label: 'Platform Revenue Reports', icon: BarChart2 },
        { id: 'report-appointments', label: 'Appointments Activity Report', icon: FileText },
        { id: 'report-patients', label: 'Patient Demographics Report', icon: FileText },
        { id: 'report-doctors', label: 'Practitioner Output Report', icon: FileText },
        { id: 'report-partners', label: 'Franchise Leads Report', icon: FileText },
        { id: 'report-laboratories', label: 'Diagnostic Lab Output', icon: FileText },
        { id: 'report-pharmacies', label: 'Pharmacy Med Sales Report', icon: FileText },
        { id: 'report-physiotherapy', label: 'Therapy Sessions Count', icon: FileText },
        { id: 'report-commissions', label: 'Commissions Splitting Report', icon: FileText }
      ]
    },
    {
      id: 'settings_mgmt',
      label: 'Settings',
      icon: Settings,
      items: [
        { id: 'settings-general', label: 'Website & Branding Settings', icon: Sliders },
        { id: 'settings-location', label: 'Location Territories Config', icon: Globe },
        { id: 'settings-healthcare', label: 'Specialties & Diseases Catalog', icon: Stethoscope },
        { id: 'settings-payment', label: 'Payment Gateway Connect', icon: DollarSign },
        { id: 'settings-communication', label: 'SMS & Email Gateway Credentials', icon: Mail },
        { id: 'settings-security', label: 'Security & Session Rules', icon: Lock },
        { id: 'settings-api', label: 'Developer API Keys & Webhooks', icon: Settings },
        { id: 'settings-backup', label: 'Scheduled Backups & DB Dumps', icon: Database },
        { id: 'settings-system', label: 'Platform Caches & Queues', icon: Settings }
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: Cpu,
      items: [
        { id: 'system-activity', label: 'Operator Action Logs', icon: History },
        { id: 'system-audit', label: 'Root System Audit Trail', icon: Clock },
        { id: 'system-error', label: 'Uncaught Error Reports', icon: AlertTriangle },
        { id: 'system-api-logs', label: 'API Response Payload Trace', icon: Code },
        { id: 'system-scheduled', label: 'Scheduled Cron Jobs', icon: Clock },
        { id: 'system-background', label: 'Background Task Workers', icon: Activity },
        { id: 'system-health', label: 'Infrastructure Server Health', icon: Cpu },
        { id: 'system-features', label: 'Feature Flags & Toggles', icon: Sliders, isNew: true },
        { id: 'system-maintenance', label: 'Maintenance Mode Controller', icon: Lock, isNew: true },
        { id: 'system-recycle-bin', label: 'Recycle Bin Data Recover', icon: Trash2, isNew: true },
        { id: 'system-import-export', label: 'Bulk Database Import/Export', icon: FileText, isNew: true }
      ]
    },
    {
      id: 'developer_tools',
      label: 'Developer Tools',
      icon: Cpu,
      items: [
        { id: 'testing-center', label: 'Testing Center', icon: Cpu }
      ]
    },
    {
      id: 'support_mgmt',
      label: 'Support',
      icon: LifeBuoy,
      items: [
        { id: 'support-tickets', label: 'Customer Help Tickets', icon: LifeBuoy },
        { id: 'support-messages', label: 'Contact Queries Submissions', icon: Mail },
        { id: 'support-feedback', label: 'App Usability Ratings', icon: Star },
        { id: 'support-complaints', label: 'Escalation Logs Desk', icon: AlertTriangle },
        { id: 'support-callcenter', label: 'Call Center Queues', icon: Smartphone, isNew: true }
      ]
    },
    {
      id: 'profile_mgmt',
      label: 'Profile',
      icon: UserCheck,
      items: [
        { id: 'profile-my', label: 'Edit Admin Profile', icon: UserCheck },
        { id: 'profile-password', label: 'Change Security PIN', icon: Lock },
        { id: 'profile-notify', label: 'Email Alerts Configuration', icon: BellRing },
        { id: 'profile-logout', label: 'Exit Secure Session', icon: X }
      ]
    }
  ];

  const filteredCategories = React.useMemo(() => {
    if (!sidebarSearchTerm.trim()) return sidebarCategories;
    const query = sidebarSearchTerm.toLowerCase().trim();
    return sidebarCategories.map(cat => {
      const matchedItems = cat.items.filter(item => 
        item.label.toLowerCase().includes(query) || cat.label.toLowerCase().includes(query)
      );
      if (matchedItems.length > 0) {
        return { ...cat, items: matchedItems };
      }
      return null;
    }).filter(Boolean) as typeof sidebarCategories;
  }, [sidebarSearchTerm]);

  const pinnedItemsList = React.useMemo(() => {
    const list: any[] = [];
    sidebarCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (pinnedMenus.includes(item.id)) {
          list.push({ ...item, catLabel: cat.label });
        }
      });
    });
    return list;
  }, [pinnedMenus]);

  const recentlyVisitedItemsList = React.useMemo(() => {
    const list: any[] = [];
    recentlyVisited.forEach(id => {
      sidebarCategories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.id === id) {
            list.push({ ...item, catLabel: cat.label });
          }
        });
      });
    });
    return list;
  }, [recentlyVisited]);

  const isGroupExpanded = (catId: string) => {
    if (sidebarSearchTerm.trim()) return true;
    return expandedGroups[catId] !== false;
  };

  const renderSidebarContent = () => {
    return (
      <div className="flex flex-col gap-4 font-sans select-none">
        {/* Admin Profile Header inside Sidebar */}
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-600/20 relative">
              MA
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-800 leading-tight">Master Auditor</h4>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block font-mono leading-none mt-0.5">ID: SUPER_ADMIN</span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer text-xs"
            title="Toggle Theme Mode"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* Sidebar Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={sidebarSearchTerm}
            onChange={(e) => setSidebarSearchTerm(e.target.value)}
            placeholder="Search console menus..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 placeholder-slate-400"
          />
          {sidebarSearchTerm && (
            <button
              onClick={() => setSidebarSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-[10px]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pinned / Starred Quick Menus */}
        {pinnedItemsList.length > 0 && !sidebarSearchTerm.trim() && (
          <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-2.5 flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1 font-mono">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Pinned Workspace
            </span>
            <div className="grid grid-cols-1 gap-1">
              {pinnedItemsList.map(item => {
                const PinnedIcon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div key={`pin-${item.id}`} className="relative group">
                    <button
                      type="button"
                      onClick={() => navigateToTab(item.id)}
                      className={`w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold rounded-lg transition-all text-left ${
                        isActive 
                          ? 'bg-indigo-600 text-white font-extrabold' 
                          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PinnedIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[8px] opacity-60 font-medium font-mono hidden group-hover:inline">
                        {item.catLabel}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => togglePinMenu(item.id, e)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-amber-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Visited */}
        {recentlyVisitedItemsList.length > 0 && !sidebarSearchTerm.trim() && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> Recent Tracks
            </span>
            <div className="flex flex-wrap gap-1">
              {recentlyVisitedItemsList.map(item => (
                <button
                  key={`recent-${item.id}`}
                  onClick={() => navigateToTab(item.id)}
                  className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all truncate max-w-[120px] ${
                    activeTab === item.id 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Category Accordion */}
        <div className="flex flex-col gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
          {filteredCategories.map((category) => {
            const isExpanded = isGroupExpanded(category.id);
            const CategoryIcon = category.icon;
            return (
              <div key={category.id} className="flex flex-col border-b border-slate-100 pb-3.5 last:border-0 last:pb-0">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(category.id)}
                  className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 px-1 py-1 rounded-md hover:bg-indigo-50 transition-all w-full cursor-pointer mb-1 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon className="w-3.5 h-3.5" />
                    <span>{category.label}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Sub-items List */}
                <div className={`flex flex-col gap-0.5 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    const isPinned = pinnedMenus.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-xs font-bold w-full relative ${
                          isActive
                            ? 'bg-indigo-600 text-white font-extrabold'
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => navigateToTab(item.id)}
                          className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
                        >
                          <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.isNew && (
                            <span className="text-[8px] bg-sky-500 text-white px-1 rounded-md font-mono scale-90 leading-none">
                              NEW
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => togglePinMenu(item.id, e)}
                            className={`p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                              isPinned ? 'opacity-100 text-amber-500' : 'text-slate-300 hover:text-amber-500'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getActiveTabTitle = (): string => {
    for (const cat of sidebarCategories) {
      for (const item of cat.items) {
        if (item.id === activeTab) {
          return item.label;
        }
      }
    }
    return 'Admin Control Console';
  };

  const getBreadcrumbs = (): string[] => {
    for (const cat of sidebarCategories) {
      for (const item of cat.items) {
        if (item.id === activeTab) {
          return ['Admin Console', cat.label, item.label];
        }
      }
    }
    return ['Admin Console', 'General'];
  };

  const renderEnterpriseModule = () => {
    const crumbs = getBreadcrumbs();
    const title = getActiveTabTitle();
    const query = enterpriseSearch.toLowerCase().trim();

    const isUserTab = activeTab.startsWith('user-');
    const isPartnerTab = activeTab.startsWith('partner-');
    const isBookingTab = activeTab.startsWith('booking-');
    const isFinanceTab = activeTab.startsWith('finance-');
    const isReferralTab = activeTab.startsWith('referral-');
    const isNotifyTab = activeTab.startsWith('notify-');
    const isRegisterTab = activeTab.startsWith('register-');
    const isSystemTab = activeTab.startsWith('system-');
    const isSupportTab = activeTab.startsWith('support-');
    const isProfileTab = activeTab.startsWith('profile-');

    const triggerAction = (actionName: string, detail: string) => {
      addAuditLog(actionName, 'Super Admin', `Triggered dynamic action: ${detail}`);
      alert(`Success! [${actionName}] completed successfully: ${detail}`);
    };

    const handleDispatchCampaign = (type: string) => {
      if (!broadcastMessage.trim()) {
        alert('Please write a message template body first!');
        return;
      }
      const newLog = `[${new Date().toLocaleTimeString()}] Blasted ${type.toUpperCase()} campaign to target [${broadcastTarget}]: "${broadcastMessage.substring(0, 50)}..."`;
      setBroadcastLogs(prev => [newLog, ...prev]);
      addAuditLog(`Broadcast ${type.toUpperCase()}`, 'Super Admin', `Triggered bulk communication broadcast to ${broadcastTarget}`);
      setBroadcastSubject('');
      setBroadcastMessage('');
      alert(`${type.toUpperCase()} communication blast successfully queued to dispatch scheduler!`);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Module Header with Breadcrumbs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase font-extrabold tracking-wider mb-1.5">
              <span>{crumbs[0]}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{crumbs[1]}</span>
              <ChevronRight className="w-3 h-3 text-[#0A6E6E]" />
              <span className="text-[#0A6E6E]">{crumbs[2]}</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {title}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Enterprise management console, fully synchronized with master ledger databases.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Quick filter registry..."
                value={enterpriseSearch}
                onChange={(e) => setEnterpriseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#0A6E6E] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Inner Body based on group */}
        {isUserTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operational Account Roster</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase">
                    <th className="pb-3">Account ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Identifier / Info</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'REG-201', name: 'Dr. Vikranth Patil', info: 'Dermatologist (MCI-66120)', status: 'Active' },
                    { id: 'REG-202', name: 'Arjun Mehta', info: 'Patient (arjun@gmail.com)', status: 'Active' },
                    { id: 'REG-203', name: 'Apollo Pharmacy Retail', info: 'License: DL-22910-M', status: 'Active' },
                    { id: 'REG-204', name: 'Lal PathLabs Franchise', info: 'License: NABL-9921', status: 'Active' },
                    { id: 'REG-205', name: 'Aarav Malhotra', info: 'Physio Rehab Specialist', status: 'Active' },
                  ]
                    .filter(item => item.name.toLowerCase().includes(query) || item.info.toLowerCase().includes(query))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono font-bold text-[#0A6E6E]">{item.id}</td>
                        <td className="py-3 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 text-slate-500">{item.info}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => triggerAction('Toggle Account Status', `Modified privileges for ${item.name}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isPartnerTab && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pipeline Stages</h3>
              <div className="space-y-3">
                {[
                  { name: 'Email Validation Check', done: true },
                  { name: 'MCI Medical License Auth', done: true },
                  { name: 'Address Geotagging Verify', done: false },
                  { name: 'Manual Superadmin Sign-off', done: false }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step.done ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                      {step.done ? '✓' : idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Verification Pipeline Applications</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase">
                      <th className="pb-3">Applicant</th>
                      <th className="pb-3">Region / Territory</th>
                      <th className="pb-3">Stage</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {[
                      { name: 'Dr. Sandeep Sen', territory: 'West Bengal', phase: 'MCI Verification' },
                      { name: 'Dr. Meera Nair', territory: 'Tamil Nadu', phase: 'Geotag Verification' },
                      { name: 'Dr. Vikranth Patil', territory: 'Maharashtra', phase: 'Manual Audit' },
                    ]
                      .filter(p => p.name.toLowerCase().includes(query))
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-800">{p.name}</td>
                          <td className="py-3 text-slate-500">{p.territory}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-lg border border-indigo-100">
                              {p.phase}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => triggerAction('Pipeline Approval', `Approved stage ${p.phase} for ${p.name}`)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg transition-all"
                            >
                              Approve Stage
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isBookingTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Booking & Dispatch Desk</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase">
                    <th className="pb-3">Slot ID</th>
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Resource / Doctor</th>
                    <th className="pb-3">Timing / Schedule</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'BKG-011', patient: 'Rahul Verma', resource: 'Dr. Sandeep Sen', schedule: 'Today, 4:30 PM', status: 'Enroute / Confirmed' },
                    { id: 'BKG-012', patient: 'Sanjana Roy', resource: 'Nirma Diagnostic Lab', schedule: 'Tomorrow, 11:00 AM', status: 'Awaiting Sample' },
                    { id: 'BKG-013', patient: 'Vijay Patil', resource: 'Aarav Malhotra (Physio)', schedule: 'Yesterday, 6:00 PM', status: 'Delivered' },
                  ]
                    .filter(b => b.patient.toLowerCase().includes(query) || b.resource.toLowerCase().includes(query))
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono font-bold text-[#0A6E6E]">{b.id}</td>
                        <td className="py-3 font-bold text-slate-800">{b.patient}</td>
                        <td className="py-3 text-slate-500">{b.resource}</td>
                        <td className="py-3 text-slate-400">{b.schedule}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-[#F0F7F7] text-[#0A6E6E] text-[10px] font-black rounded-lg border border-[#D1E5E5]">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => triggerAction('Dispatch Trigger', `Dispatched resource for ${b.id}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-all"
                          >
                            Dispatch
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isFinanceTab && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Commission Pricing Ratios</h3>
              <div className="space-y-4 text-xs">
                {[
                  { name: 'In-Clinic Consultations', value: '15%' },
                  { name: 'Video Consultations', value: '20%' },
                  { name: 'Pathology Bookings', value: '12%' },
                  { name: 'Pharmacy Deliveries', value: '8%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="font-semibold text-slate-600">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.value}</span>
                      <button onClick={() => triggerAction('Modify Pricing Ratio', `Altered commissions for ${item.name}`)} className="text-[10px] text-indigo-600 font-bold hover:underline">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tax & Invoice Configuration</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">State GST (SGST) %</label>
                    <input type="number" defaultValue={9} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Central GST (CGST) %</label>
                    <input type="number" defaultValue={9} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden" />
                  </div>
                </div>
                <button onClick={() => triggerAction('Update GST Tax', 'Saved GST percentages state-wide')} className="w-full py-2 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg hover:bg-[#075353] transition-all">
                  Save Invoice Rules
                </button>
              </div>
            </div>
          </div>
        )}

        {isReferralTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Referral Coin Loyalty Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Patient Sign-up Incentive</span>
                <span className="text-lg font-black text-slate-800">50 Coins (₹50)</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Doctor Refer-a-Friend</span>
                <span className="text-lg font-black text-slate-800">100 Coins (₹100)</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Partner Signup Reward</span>
                <span className="text-lg font-black text-slate-800">200 Coins (₹200)</span>
              </div>
            </div>
            <button onClick={() => triggerAction('Save Loyalty Config', 'Updated loyalty incentive percentages')} className="px-4 py-2 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg hover:bg-[#075353] transition-all">
              Save Loyalty Configuration
            </button>
          </div>
        )}

        {isNotifyTab && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">SMS / Push Blast Broadcaster</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Select Target Audience Segment</label>
                  <select value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="all-users">All Registered Clinicians and Patients</option>
                    <option value="doctors">Clinicians / Doctors Only</option>
                    <option value="patients">Patients Registry Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Campaign Subject Header</label>
                  <input type="text" value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} placeholder="System scheduled upgrade..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Message Broadcast Template</label>
                  <textarea rows={4} value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Type message body..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <button onClick={() => handleDispatchCampaign('SMS')} className="px-4 py-2 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg hover:bg-[#075353] transition-all">
                  Dispatch Broadcast Campaign
                </button>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Campaign Send History Logs</h3>
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] h-64 overflow-y-auto border border-slate-800 space-y-2">
                {broadcastLogs.length === 0 ? (
                  <span className="text-gray-500 italic block">No campaigns sent yet during this session. Ready for dispatch traces.</span>
                ) : (
                  broadcastLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed border-b border-slate-900 pb-1">{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {isRegisterTab && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Form Fields Checklist Builder</h3>
              <div className="space-y-3 text-xs">
                {Object.keys(docFields).map((field) => (
                  <label key={field} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docFields[field]}
                      onChange={() => setDocFields(prev => ({ ...prev, [field]: !prev[field] }))}
                      className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Required Document Validation Checklist</h3>
              <div className="space-y-3 text-xs">
                {Object.keys(docRequiredDocs).map((doc) => (
                  <label key={doc} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docRequiredDocs[doc]}
                      onChange={() => setDocRequiredDocs(prev => ({ ...prev, [doc]: !prev[doc] }))}
                      className="rounded-md border-slate-300 text-indigo-600"
                    />
                    <span className="font-semibold text-slate-700 capitalize">{doc.replace(/([A-Z])/g, ' $1')} Proof</span>
                  </label>
                ))}
              </div>
              <div className="pt-2">
                <button onClick={() => triggerAction('Publish Forms Layout', 'Pushed update to patient/clinician register pages')} className="w-full py-2 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg hover:bg-[#075353] transition-all">
                  Publish Forms Layout
                </button>
              </div>
            </div>
          </div>
        )}

        {isSystemTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ecosystem Control Center</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                {Object.keys(enterpriseFeatures).map((feat) => (
                  <div key={feat} className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <span className="font-bold text-slate-700 capitalize">{feat.replace(/-/g, ' ')}</span>
                    <button
                      onClick={() => {
                        setEnterpriseFeatures(prev => {
                          const next = { ...prev, [feat]: !prev[feat] };
                          triggerAction('Toggle System Feature', `${feat} is now ${next[feat] ? 'ON' : 'OFF'}`);
                          return next;
                        });
                      }}
                      className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                        enterpriseFeatures[feat] ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {enterpriseFeatures[feat] ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-gray-400">Database Utilities</h4>
                <div className="space-y-2">
                  <button onClick={() => triggerAction('Trigger System Re-Index', 'Optimization completed on 14 indexes')} className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-extrabold shadow-sm">
                    Re-index PostgreSQL
                  </button>
                  <button onClick={() => triggerAction('Pristine Clear Logs', 'Wiped old messaging/push simulator buffers')} className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600 font-extrabold">
                    Purge Logging Buffers
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSupportTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Helpline Tickets & Queries</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase">
                    <th className="pb-3">Ticket ID</th>
                    <th className="pb-3">Submitted By</th>
                    <th className="pb-3">Subject / Issue</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'TKT-991', raiser: 'Renu Chawla', issue: 'MCI Certificate upload fails on iPhone', priority: 'High' },
                    { id: 'TKT-992', raiser: 'Anuj Saxena', issue: 'Patient requesting refund for canceled slot', priority: 'Medium' },
                    { id: 'TKT-993', raiser: 'Gopal Lal', issue: 'Doctor list not filtering by locality Pune', priority: 'Low' },
                  ]
                    .filter(t => t.raiser.toLowerCase().includes(query) || t.issue.toLowerCase().includes(query))
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono font-bold text-[#0A6E6E]">{t.id}</td>
                        <td className="py-3 font-bold text-slate-800">{t.raiser}</td>
                        <td className="py-3 text-slate-500">{t.issue}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${t.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => triggerAction('Support Resolution', `Resolved ticket ${t.id}`)}
                            className="px-2.5 py-1 bg-[#0A6E6E] text-white font-extrabold rounded-lg hover:bg-[#075353] transition-all"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isProfileTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs max-w-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Superadmin Security Center</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Super Admin Account Email</label>
                <input type="email" disabled defaultValue="master.admin@doctspark.com" className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Reset Master PIN</label>
                <input type="password" placeholder="••••••" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <button onClick={() => triggerAction('Reset Master PIN', 'Successfully set a new master administrative login PIN')} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-extrabold rounded-lg transition-all">
                Reset Administrative PIN
              </button>
            </div>
          </div>
        )}

        {/* Fallback general template if no prefix matched */}
        {!isUserTab && !isPartnerTab && !isBookingTab && !isFinanceTab && !isReferralTab && !isNotifyTab && !isRegisterTab && !isSystemTab && !isSupportTab && !isProfileTab && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Administrative Vault Card</h3>
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-2xl block mb-2">📦</span>
              <p className="text-xs text-slate-500 font-medium">This module is currently synchronized with the master control ledger. Direct query endpoints can be customized.</p>
              <button onClick={() => triggerAction('Database Sync', `Initiated automated schema sync for ${title}`)} className="mt-4 px-4 py-2 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg hover:bg-[#075353] transition-all">
                Force Database Sync
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      currentView={currentView}
      setView={setView}
      userRole={userRole}
      setUserRole={setUserRole}
      userEmail={userEmail}
      setUserEmail={setUserEmail}
      notificationsCount={notificationsCount}
      onOpenNotifications={onOpenNotifications}
      sidebar={renderSidebarContent()}
      activeTabTitle={getActiveTabTitle()}
    >

          {/* Render new enterprise modules for non-legacy tabs */}
          {!['telemetry', 'overview', 'doctors-clinics', 'physiotherapy', 'partner-management', 'commissions', 'target-settings', 'milestone-reports', 'referrals', 'announcements', 'settings', 'footer-settings', 'custom-pages', 'terms-management', 'audit-trail'].includes(mappedTab) && (
            renderEnterpriseModule()
          )}

          {mappedTab === 'telemetry' && (
            <div className="space-y-6 animate-in fade-in duration-200" id="live-telemetry-section">
              <div className="bg-white border border-[#D1E5E5] rounded-3xl p-6 shadow-3xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-gray-50 pb-4">
                  <div>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 inline-block mb-1">
                      📊 Real-Time Operations Telemetry
                    </span>
                    <h3 className="text-sm font-black text-[#1A2B3C]">Full-Spectrum Live Platform Ecosystem Statistics</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#0A6E6E] font-black bg-[#F0F7F7] px-3 py-1.5 rounded-xl border border-[#D1E5E5]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Ecosystem Metrics Synchronized</span>
                  </div>
                </div>

                {/* Sandbox / Demo Database Controls Banner */}
                <div className="bg-[#FAFBFB] border border-[#E2ECEC] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🛠️</span>
                    <div>
                      <h4 className="text-xs font-black text-[#1A2B3C] mb-0.5 uppercase tracking-wider">Sandbox Database Controls</h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-2xl">
                        {isMockCleared ? (
                          <span className="text-emerald-700 font-bold">
                            ✓ Pristine sandbox mode is active. All mock profiles have been successfully purged.
                          </span>
                        ) : (
                          <span>
                            Currently displaying pre-seeded demo profiles. Purging this data resets the platform metrics to absolute zero or user-only data.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full md:w-auto">
                    {isMockCleared ? (
                      <button
                        type="button"
                        onClick={handleRestoreMockData}
                        className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-slate-200 transition-all cursor-pointer text-center"
                      >
                        🔄 Restore Mock Data
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClearMockData}
                        className="w-full md:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl border border-rose-200 transition-all cursor-pointer text-center"
                      >
                        🗑️ Purge Mock Profiles & Revenue
                      </button>
                    )}
                  </div>
                </div>

                {actionFeedback && (
                  <div className={`p-3.5 rounded-xl text-xs font-black flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300 ${
                    actionFeedback === 'purged' 
                      ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <span className="text-sm">{actionFeedback === 'purged' ? '🗑️' : '🔄'}</span>
                    <span>
                      {actionFeedback === 'purged'
                        ? '✓ Pristine Sandbox Mode Active: All mock profiles have been successfully purged and fallback platform revenue reset to ₹0!'
                        : '✓ Mock Data Restored: Demo profiles, pre-seeded sandbox variables, and mock revenue sources restored successfully!'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4.5">
                  {[
                    { label: 'Total Patients', value: masterStats.totalPatients, desc: 'Registered patients', icon: '👤', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Total Doctors', value: masterStats.totalDoctors, desc: 'Verified professionals', icon: '🩺', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                    { label: 'Total Clinics', value: masterStats.totalClinics, desc: 'Registered clinic units', icon: '🏥', color: 'text-teal-600 bg-teal-50 border-teal-100' },
                    { label: 'Total State Partners', value: masterStats.totalStatePartners, desc: 'Tier-1 aligners', icon: '🏛️', color: 'text-purple-600 bg-purple-50 border-purple-100' },
                    { label: 'Total District Partners', value: masterStats.totalDistrictPartners, desc: 'Tier-2 aligners', icon: '🏢', color: 'text-violet-600 bg-violet-50 border-violet-100' },
                    { label: 'Total City Partners', value: masterStats.totalCityPartners, desc: 'Local zone operators', icon: '🏙️', color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
                    { label: 'Total Pharmacies', value: masterStats.totalPharmacies, desc: 'Digital medicine hubs', icon: '💊', color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    { label: 'Total Laboratories', value: masterStats.totalLaboratories, desc: 'Pathology diagnostic labs', icon: '🔬', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Total Physiotherapists', value: masterStats.totalPhysiotherapists, desc: 'Physical rehab therapists', icon: '♿', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { label: 'Total Doctor Appointments', value: masterStats.totalDoctorAppointments, desc: 'Active consultations', icon: '📅', color: 'text-sky-600 bg-sky-50 border-sky-100' },
                    { label: 'Total Lab Bookings', value: masterStats.totalLabBookings, desc: 'Diagnostic pathology test bookings', icon: '🔬', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                    { label: 'Total Pharmacy Orders', value: masterStats.totalPharmacyOrders, desc: 'Active medicine orders', icon: '📦', color: 'text-orange-600 bg-orange-50 border-orange-100' },
                    { label: 'Total Physio Bookings', value: masterStats.totalPhysioBookings, desc: 'Active therapy slots', icon: '♿', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { label: 'Total Revenue', value: `₹${masterStats.totalRevenue.toLocaleString('en-IN')}`, desc: 'Aggregated platform value', icon: '💰', color: 'text-green-600 bg-green-50 border-green-100' },
                    { label: 'Pending Verifications', value: masterStats.totalPendingVerifications, desc: 'Awaiting admin activation', icon: '🛡️', color: 'text-red-600 bg-red-50 border-red-100' },
                    { label: 'Active Users', value: masterStats.totalActiveUsers, desc: 'Simulated + live network', icon: '🚀', color: 'text-slate-600 bg-slate-50 border-slate-100' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex flex-col justify-between transition-all hover:shadow-xs hover:border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`w-9 h-9 text-base rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                          {item.icon}
                        </span>
                        <span className="text-xs bg-slate-50 text-slate-400 font-bold px-1.5 py-0.5 rounded border border-gray-100">Live</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-0.5 leading-tight">{item.label}</span>
                        <strong className="text-lg font-black text-[#1A2B3C] font-heading block">{item.value}</strong>
                        <p className="text-[8px] text-gray-400 font-semibold mt-0.5 leading-normal">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


      {/* ==========================================
          TAB 1: ADMINISTRATION OVERVIEW & TRANSACTION LEDGER
          ========================================== */}
      {mappedTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Top Alliance Partners Leaderboard */}
          <div className="bg-white border border-[#D1E5E5] rounded-3xl p-6 shadow-3xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
              <div>
                <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-200 inline-block mb-1">
                  Active Performance Incentives
                </span>
                <h3 className="text-base font-black text-[#1A2B3C] font-heading tracking-tight">🏆 Top Alliance Partners Leaderboard</h3>
                <p className="text-xs text-gray-400">Live operational rankings, wallet values, and on-field onboardings tracker.</p>
              </div>
              <div className="text-[10px] text-gray-500 font-medium bg-slate-50 border border-[#D1E5E5] rounded-xl px-4 py-2 text-right shrink-0">
                Active Partners: <span className="font-extrabold text-[#1A2B3C]">{partners.length}</span> | Avg. Conversion: <span className="font-extrabold text-emerald-600">89.4%</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 font-bold text-[#1A2B3C]">Partner Name & ID</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0">Level</span>
                        <select
                          id="partner-level-filter"
                          value={leaderboardLevelFilter}
                          onChange={(e) => setLeaderboardLevelFilter(e.target.value as any)}
                          className="bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border border-indigo-200 outline-none cursor-pointer transition-all focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="All">All Levels</option>
                          <option value="State">State Only</option>
                          <option value="District">District Only</option>
                        </select>
                      </div>
                    </th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Territory Assigned</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-center">Doctors</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-center">Clinics</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Wallet Balance</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-right">Performance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    const filteredList = partners.filter(p => leaderboardLevelFilter === 'All' || p.partnerType === leaderboardLevelFilter);
                    if (filteredList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-gray-400 font-semibold italic">
                            No {leaderboardLevelFilter === 'All' ? '' : leaderboardLevelFilter} Partners found.
                          </td>
                        </tr>
                      );
                    }
                    return filteredList.slice(0, 5).map((p) => {
                      const docsCount = doctors.filter(d => d.onboardedBy === p.id && d.verificationStatus === 'Approved').length;
                      const clinicsCount = clinics.filter(c => c.onboardedBy === p.id && c.verificationStatus === 'Approved').length;
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-bold text-[#1A2B3C] flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-xs text-indigo-700 uppercase border border-indigo-100">
                              {p.name.substring(0, 2)}
                            </div>
                            <div>
                              <span className="text-slate-800 font-extrabold block">{p.name}</span>
                              <span className="text-[9px] text-gray-400 font-mono block">ID: {p.id}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              p.partnerType === 'State' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-teal-50 text-teal-700 border border-teal-100'
                            }`}>
                              {p.partnerType} Partner
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-500">
                            {p.partnerType === 'State' ? p.assignedState : `${p.assignedDistrict}, ${p.assignedState}`}
                          </td>
                          <td className="p-3 font-black text-center text-amber-600 font-mono">{docsCount || p.onboardedDoctorsCount || 0}</td>
                          <td className="p-3 font-black text-center text-sky-600 font-mono">{clinicsCount || p.onboardedClinicsCount || 0}</td>
                          <td className="p-3 font-extrabold text-emerald-700 font-mono">₹{(p.walletBalance || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" id={`bonus-input-container-${p.id}`}>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-[10px] font-bold text-gray-400">₹</span>
                                <input
                                  id={`bonus-amount-input-${p.id}`}
                                  type="number"
                                  placeholder="Amount"
                                  value={customBonusAmounts[p.id] || ''}
                                  onChange={(e) => {
                                    setCustomBonusAmounts(prev => ({
                                      ...prev,
                                      [p.id]: e.target.value
                                    }));
                                  }}
                                  className="w-24 bg-slate-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-lg pl-5 pr-2 py-1 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-gray-400 text-right"
                                />
                              </div>
                              <button
                                id={`award-bonus-btn-${p.id}`}
                                type="button"
                                onClick={() => {
                                  const rawVal = customBonusAmounts[p.id];
                                  const bonusVal = parseInt(rawVal || '', 10);
                                  if (isNaN(bonusVal) || bonusVal <= 0) {
                                    alert('⚠️ Please enter a valid positive bonus amount.');
                                    return;
                                  }
                                  
                                  const updated = partners.map(item => {
                                    if (item.id === p.id) {
                                      return { ...item, walletBalance: (item.walletBalance || 0) + bonusVal };
                                    }
                                    return item;
                                  });
                                  localStorage.setItem('ds_partners', JSON.stringify(updated));
                                  setPartners(updated);
                                  
                                  addAuditLog(
                                    'Award Special Bonus',
                                    'Super Admin',
                                    `Awarded ₹${bonusVal.toLocaleString('en-IN')} Special Performance Bonus to Partner ${p.name} (ID: ${p.id}). New wallet balance: ₹${((p.walletBalance || 0) + bonusVal).toLocaleString('en-IN')}`
                                  );
                                  setAuditLogs(getAuditLogs());
                                  
                                  // Reset this specific input
                                  setCustomBonusAmounts(prev => ({
                                    ...prev,
                                    [p.id]: ''
                                  }));
                                  
                                  alert(`🎉 Success! Awarded ₹${bonusVal.toLocaleString('en-IN')} Special Performance Bonus to Partner: ${p.name}. Wallet balance has been instantly updated.`);
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black rounded-lg border border-amber-200 cursor-pointer transition-all text-[10px] shadow-2xs hover:shadow-xs active:scale-95 whitespace-nowrap"
                              >
                                ⭐ Award
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subscription Ledger */}
          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
            <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-4">Onboarding Subscription & Commission Ledger</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 font-bold text-[#1A2B3C]">Date</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Medical Profile Type</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Onboarded entity</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Onboarded By</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Partner Category</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Gross Fee</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Commission Paid</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Net Platform Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctors.filter(d => d.onboardedBy).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-gray-400">June 26, 2026</td>
                      <td className="p-3 font-bold text-amber-700">🩺 Doctor</td>
                      <td className="p-3 font-extrabold text-[#1A2B3C]">{doc.name}</td>
                      <td className="p-3 text-gray-600 font-semibold">
                        <div>{partners.find(p => p.id === doc.onboardedBy)?.name || 'Direct / Partner'}</div>
                        {doc.referralPartnerId && (
                          <span className="inline-block text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded mt-0.5">{doc.referralPartnerId}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-700 uppercase">
                          {doc.onboardedByType || 'District'}
                        </span>
                      </td>
                      <td className="p-3 font-black text-gray-700">₹{globalSubFee.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-black text-red-600">
                        -₹{(doc.onboardedByType === 'State' 
                          ? (globalSubFee * (commConfig?.subscriptionStatePct || 10) / 100) 
                          : (globalSubFee * (commConfig?.subscriptionDistrictPct || 40) / 100)
                        ).toLocaleString('en-IN')} ({(doc.onboardedByType === 'State' ? (commConfig?.subscriptionStatePct || 10) : (commConfig?.subscriptionDistrictPct || 40))}%)
                      </td>
                      <td className="p-3 font-black text-emerald-700">
                        ₹{(doc.onboardedByType === 'State' 
                          ? (globalSubFee * (100 - (commConfig?.subscriptionStatePct || 10)) / 100) 
                          : (globalSubFee * (100 - (commConfig?.subscriptionDistrictPct || 40)) / 100)
                        ).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {clinics.filter(c => c.onboardedBy).map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-gray-400">June 26, 2026</td>
                      <td className="p-3 font-bold text-sky-700">🏢 Clinic</td>
                      <td className="p-3 font-extrabold text-[#1A2B3C]">{cl.name}</td>
                      <td className="p-3 text-gray-600 font-semibold">
                        <div>{partners.find(p => p.id === cl.onboardedBy)?.name || 'Direct / Partner'}</div>
                        {cl.referralPartnerId && (
                          <span className="inline-block text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded mt-0.5">{cl.referralPartnerId}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-700 uppercase">
                          {cl.onboardedByType || 'District'}
                        </span>
                      </td>
                      <td className="p-3 font-black text-gray-700">₹{globalSubFee.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-black text-red-600">
                        -₹{(cl.onboardedByType === 'State' 
                          ? (globalSubFee * (commConfig?.subscriptionStatePct || 10) / 100) 
                          : (globalSubFee * (commConfig?.subscriptionDistrictPct || 40) / 100)
                        ).toLocaleString('en-IN')} ({(cl.onboardedByType === 'State' ? (commConfig?.subscriptionStatePct || 10) : (commConfig?.subscriptionDistrictPct || 40))}%)
                      </td>
                      <td className="p-3 font-black text-emerald-700">
                        ₹{(cl.onboardedByType === 'State' 
                          ? (globalSubFee * (100 - (commConfig?.subscriptionStatePct || 10)) / 100) 
                          : (globalSubFee * (100 - (commConfig?.subscriptionDistrictPct || 40)) / 100)
                        ).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {doctors.filter(d => d.onboardedBy).length === 0 && clinics.filter(c => c.onboardedBy).length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-gray-400 font-semibold">
                        No transactions recorded in the system ledger yet. Try onboarding clinics and doctors via Partner dashboards.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ==========================================
          TAB 2: DOCTOR AND CLINIC FINAL VERIFICATION STAGE
          ========================================== */}
      {mappedTab === 'doctors-clinics' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
            <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Awaiting Super Admin Final Activations</h3>
            <p className="text-xs text-gray-400 mb-4">Profiles validated by District and State Level Partners. Review credentials to trigger Activation Email & SMS alerts.</p>

            <div className="space-y-3">
              {/* Doctor Pipeline Activations */}
              {doctors.filter(d => d.verificationStatus && d.verificationStatus !== 'Approved').map(doc => (
                <div key={doc.id} className="border border-indigo-100 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                  <div className="w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-amber-700 uppercase block">🩺 Doctor approval</span>
                      <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                        doc.verificationStatus === 'Pending District' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        doc.verificationStatus === 'Pending State' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        doc.verificationStatus === 'Pending Admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Stage: {doc.verificationStatus}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1">{doc.name}</h4>
                    <p className="text-gray-400 font-medium">Specialty: {doc.specialty} | City: {doc.city}, {doc.state} | Reg: {doc.registrationNumber}</p>
                    <p className="text-gray-400 font-medium">Owner Identity File: <span className="font-mono text-indigo-700">{doc.ownerIdProofDoc || 'Aadhaar_Owner.pdf'}</span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end shrink-0 mt-3 md:mt-0">
                    <button
                      onClick={() => setEditingItem({ id: doc.id, type: 'doctor', data: doc })}
                      className="px-4 py-2 w-full sm:w-auto bg-white border border-[#D1E5E5] text-gray-700 hover:bg-gray-50 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0A6E6E]" /> View / Edit Details
                    </button>
                    <button
                      onClick={() => handleApproveDoctorClinic(doc.id, 'doctor', doc.name, doc.email || '', doc.contactPhone || '')}
                      className="px-4 py-2 w-full sm:w-auto bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap text-center justify-center"
                    >
                      Approve, Activate & Notify ✉️
                    </button>
                  </div>
                </div>
              ))}

              {/* Clinic Pipeline Activations */}
              {clinics.filter(c => c.verificationStatus && c.verificationStatus !== 'Approved').map(cl => (
                <div key={cl.id} className="border border-indigo-100 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                  <div className="w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-sky-700 uppercase block">🏢 Clinic Approval</span>
                      <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                        cl.verificationStatus === 'Pending District' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        cl.verificationStatus === 'Pending State' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        cl.verificationStatus === 'Pending Admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Stage: {cl.verificationStatus}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1">{cl.name}</h4>
                    <p className="text-gray-400 font-medium">Owner: {cl.ownerName} | Trade License: {cl.tradeLicenseNumber} | City: {cl.city}, {cl.state}</p>
                    <p className="text-gray-400 font-medium">License Document: <span className="font-mono text-indigo-700">{(cl.licenseDocuments && cl.licenseDocuments[0]) || 'Trade_License.pdf'}</span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end shrink-0 mt-3 md:mt-0">
                    <button
                      onClick={() => setEditingItem({ id: cl.id, type: 'clinic', data: cl })}
                      className="px-4 py-2 w-full sm:w-auto bg-white border border-[#D1E5E5] text-gray-700 hover:bg-gray-50 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0A6E6E]" /> View / Edit Details
                    </button>
                    <button
                      onClick={() => handleApproveDoctorClinic(cl.id, 'clinic', cl.name, cl.email || '', cl.phone || '')}
                      className="px-4 py-2 w-full sm:w-auto bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap text-center justify-center"
                    >
                      Approve, Activate & Notify ✉️
                    </button>
                  </div>
                </div>
              ))}

              {/* Pharmacy Pipeline Activations */}
              {pharmacies.filter(p => p.status && !p.status.includes('Approved')).map(ph => (
                <div key={ph.id} className="border border-indigo-100 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                  <div className="w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-emerald-700 uppercase block">💊 Pharmacy Approval</span>
                      <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                        ph.status === 'Pending District' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        ph.status === 'Pending State' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        ph.status === 'Pending Admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Stage: {ph.status}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1">{ph.name}</h4>
                    <p className="text-gray-400 font-medium">Owner: {ph.ownerName} | License No: {ph.licenseNumber} | City: {ph.city}, {ph.state}</p>
                    <p className="text-gray-400 font-medium">License Documents: <span className="font-mono text-indigo-700">{(ph.licenseDocuments && ph.licenseDocuments[0]) || 'Pharmacy_License.pdf'}</span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end shrink-0 mt-3 md:mt-0">
                    <button
                      onClick={() => setEditingItem({ id: ph.id, type: 'partner', data: ph } as any)}
                      className="px-4 py-2 w-full sm:w-auto bg-white border border-[#D1E5E5] text-gray-700 hover:bg-gray-50 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0A6E6E]" /> View / Edit Details
                    </button>
                    <button
                      onClick={() => handleApprovePharmacy(ph.id, ph.name, ph.email || '', ph.phone || '')}
                      className="px-4 py-2 w-full sm:w-auto bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap text-center justify-center"
                    >
                      Approve, Activate & Notify ✉️
                    </button>
                  </div>
                </div>
              ))}

              {/* Laboratory Pipeline Activations */}
              {laboratories.filter(l => l.status && !l.status.includes('Approved')).map(lab => (
                <div key={lab.id} className="border border-indigo-100 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                  <div className="w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-rose-700 uppercase block">🧪 Laboratory Approval</span>
                      <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${
                        lab.status === 'Pending District' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        lab.status === 'Pending State' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        lab.status === 'Pending Admin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Stage: {lab.status}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1">{lab.name}</h4>
                    <p className="text-gray-400 font-medium">Owner/Director: {lab.ownerName} | NABL License No: {lab.licenseNumber} | City: {lab.city}, {lab.state}</p>
                    <p className="text-gray-400 font-medium">License Documents: <span className="font-mono text-indigo-700">{(lab.licenseDocuments && lab.licenseDocuments[0]) || 'NABL_Lab_Accreditation.pdf'}</span></p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end shrink-0 mt-3 md:mt-0">
                    <button
                      onClick={() => setEditingItem({ id: lab.id, type: 'partner', data: lab } as any)}
                      className="px-4 py-2 w-full sm:w-auto bg-white border border-[#D1E5E5] text-gray-700 hover:bg-gray-50 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0A6E6E]" /> View / Edit Details
                    </button>
                    <button
                      onClick={() => handleApproveLaboratory(lab.id, lab.name, lab.email || '', lab.phone || '')}
                      className="px-4 py-2 w-full sm:w-auto bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap text-center justify-center"
                    >
                      Approve, Activate & Notify 🧪✉️
                    </button>
                  </div>
                </div>
              ))}

              {doctors.filter(d => d.verificationStatus && d.verificationStatus !== 'Approved').length === 0 &&
               clinics.filter(c => c.verificationStatus && c.verificationStatus !== 'Approved').length === 0 &&
               pharmacies.filter(p => p.status && !p.status.includes('Approved')).length === 0 &&
               laboratories.filter(l => l.status && !l.status.includes('Approved')).length === 0 && (
                 <div className="text-center p-8 text-gray-400 font-semibold">
                   No clinical, pharmacy or laboratory profiles currently awaiting Super Admin final activation.
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB: PHYSIOTHERAPY COMPLETE MANAGEMENT MODULE
          ========================================== */}
      {mappedTab === 'physiotherapy' && (
        <div className="space-y-6">
          {/* Physiotherapy Stats Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Total Physiotherapists</span>
                <span className="text-xl md:text-2xl font-black text-indigo-700 font-heading">{physiotherapists.length}</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Registered providers</span>
              </div>
            </div>

            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Active Providers</span>
                <span className="text-xl md:text-2xl font-black text-emerald-700 font-heading">{physiotherapists.filter(p => p.status === 'Approved (Active)').length}</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Live on patient app</span>
              </div>
            </div>

            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Pending Verification</span>
                <span className="text-xl md:text-2xl font-black text-amber-700 font-heading">{physiotherapists.filter(p => p.status !== 'Approved (Active)').length}</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Needs Admin approval</span>
              </div>
            </div>

            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Total Revenue Generated</span>
                <span className="text-xl md:text-2xl font-black text-teal-700 font-heading">
                  ₹{(physiotherapists.filter(p => p.subscriptionPaid).length * 5000).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Onboarding subscriptions & fees</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Pending Verifications & Directory */}
            <div className="lg:col-span-2 space-y-6">
              {/* Onboarding / Verification Pipelines */}
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
                <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Awaiting Physiotherapist Activations</h3>
                <p className="text-xs text-gray-400 mb-4">Verify professional registration and documents to activate the provider.</p>

                <div className="space-y-3">
                  {physiotherapists.filter(p => p.status !== 'Approved (Active)').map(p => (
                    <div key={p.id} className="border border-indigo-100 rounded-xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                      <div className="w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-amber-700 uppercase block">♿ Physiotherapy Center</span>
                          <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-[4px] text-[8px] font-black uppercase tracking-wider">
                            Stage: {p.status || 'Pending Admin'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C] mt-1">{p.name}</h4>
                        <p className="text-gray-400 font-medium">Therapist: {p.therapistName} | specialty: {p.specialty} | Experience: {p.experience} yrs</p>
                        <p className="text-gray-400 font-medium">Location: {p.address}, {p.city}, {p.state} | Reg No: {p.registrationNumber}</p>
                        <p className="text-indigo-700 font-mono text-[10px] mt-1">✓ Onboarding subscription Paid (₹5,000)</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end shrink-0 mt-3 md:mt-0">
                        <button
                          onClick={() => handleApprovePhysiotherapist(p.id, p.name, p.email, p.phone)}
                          className="px-4 py-2 w-full sm:w-auto bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap text-center justify-center"
                        >
                          Approve & Activate ✉️
                        </button>
                      </div>
                    </div>
                  ))}

                  {physiotherapists.filter(p => p.status !== 'Approved (Active)').length === 0 && (
                    <div className="text-center p-8 text-gray-400 font-semibold">
                      No physiotherapist profiles awaiting activation.
                    </div>
                  )}
                </div>
              </div>

              {/* Physiotherapy Directory */}
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider">Physiotherapist Directory</h3>
                    <p className="text-xs text-gray-400">Search, filter, and manage all registered providers.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search centers/therapists..."
                        value={physioSearch || ''}
                        onChange={(e) => setPhysioSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border border-[#D1E5E5] rounded-lg text-xs w-48 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {physiotherapists
                    .filter(p => {
                      const matchesSearch = p.name.toLowerCase().includes((physioSearch || '').toLowerCase()) ||
                        p.therapistName.toLowerCase().includes((physioSearch || '').toLowerCase()) ||
                        p.city.toLowerCase().includes((physioSearch || '').toLowerCase());
                      return matchesSearch;
                    })
                    .map(p => (
                      <div key={p.id} className="border border-[#D1E5E5]/60 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3 hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-[#1A2B3C]">{p.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              p.status === 'Approved (Active)' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <p className="text-gray-400 font-medium mt-1">Therapist: {p.therapistName} | specialty: {p.specialty} | Experience: {p.experience} Years</p>
                          <p className="text-gray-400 font-medium">Contact: {p.email} | {p.phone} | City: {p.city}, {p.state}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                const updated = physiotherapists.filter(x => x.id !== p.id);
                                localStorage.setItem('ds_physiotherapists', JSON.stringify(updated));
                                setPhysiotherapists(updated);
                                addAuditLog('Delete Physiotherapist', 'Super Admin', `Deleted physiotherapist provider ${p.name}`);
                              }
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100"
                            title="Remove Provider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right: Service Category Management */}
            <div className="space-y-6">
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
                <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Service Categories</h3>
                <p className="text-xs text-gray-400 mb-4">Manage professional categories of services available for physiotherapy bookings.</p>

                {/* Add Category Form */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="New Category Name..."
                    value={newCategoryName || ''}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-grow px-3 py-1.5 bg-slate-50 border border-[#D1E5E5] rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="p-1.5 bg-[#0A6E6E] hover:bg-[#075353] text-white rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Categories List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {physioCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-gray-700">
                      <span>{cat}</span>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${cat}" from categories?`)) {
                            handleDeleteCategory(cat);
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {physioCategories.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      No custom categories added.
                    </div>
                  )}
                </div>
              </div>

              {/* Commission Structure & Policy Info */}
              <div className="bg-[#FAFBFD] border border-indigo-100 rounded-xl p-5">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Commission Alignment</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  Physiotherapists pay a standard platform booking service fee of <strong>5%</strong> per consultation. Revenue shares are automatically disbursed to territorial partners:
                </p>
                <div className="space-y-1.5 text-[10px] font-mono font-bold text-gray-600">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>Company Share:</span>
                    <span className="text-emerald-700">50% of platform fee</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>State Partner Share:</span>
                    <span className="text-indigo-700">10% of platform fee</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span>District Partner Share:</span>
                    <span className="text-indigo-700">20% of platform fee</span>
                  </div>
                  <div className="flex justify-between">
                    <span>City Partner Share:</span>
                    <span className="text-indigo-700">20% of platform fee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: UNIFIED PARTNER MANAGEMENT MODULE
          ========================================== */}
      {mappedTab === 'partner-management' && (
        <PartnerManagementModule
          partners={partners}
          setPartners={setPartners}
          doctors={doctors}
          clinics={clinics}
          appointments={appointments}
          loadDatabase={loadDatabase}
        />
      )}

      {/* ==========================================
          TAB 5: REVENUE SHARING & COMMISSIONS MANAGEMENT
          ========================================== */}
      {mappedTab === 'commissions' && (
        <div className="space-y-6">
          {/* STATS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Total Registration Fees</span>
                <span className="text-xl font-black text-[#1A2B3C] font-heading mt-1 block">
                  ₹{(commissions.filter(r => r.type === 'Subscription' && r.status !== 'Reversed').reduce((sum, r) => sum + r.amount, 0)).toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold block mt-1">₹5,000 per verified sign-up</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-700">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Platform Booking Charges</span>
                <span className="text-xl font-black text-emerald-700 font-heading mt-1 block">
                  ₹{(commissions.filter(r => r.type === 'Appointment' && r.status !== 'Reversed').reduce((sum, r) => sum + r.platformCharge, 0)).toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold block mt-1">5% of total appointment cost</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Commissions Distributed</span>
                <span className="text-xl font-black text-amber-700 font-heading mt-1 block">
                  ₹{(commissions.filter(r => r.status !== 'Reversed').reduce((sum, r) => sum + r.districtPartnerCommission + r.statePartnerCommission, 0)).toLocaleString()}
                </span>
                <span className="text-[9px] text-amber-600 font-semibold block mt-1">
                  Paid out: ₹{payoutReceipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} | Accrued: ₹{commissions.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.districtPartnerCommission + r.statePartnerCommission, 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Doct Spark Company Share</span>
                <span className="text-xl font-black text-indigo-700 font-heading mt-1 block">
                  ₹{(commissions.filter(r => r.status !== 'Reversed').reduce((sum, r) => sum + r.companyCommission, 0)).toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold block mt-1">Retained after network payouts</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-700">
                <Landmark className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* DYNAMIC SYSTEM CONFIGURATION SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Commission Config Card */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 lg:col-span-2 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Dynamic Revenue Sharing Config</h3>
                  <p className="text-[10px] text-gray-400">Modify distribution percentages instantly without changing source code</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded">Live Override</span>
              </div>

              {commConfig && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    
                    const subCity = Number(fd.get('subCity'));
                    const subDist = Number(fd.get('subDist'));
                    const subState = Number(fd.get('subState'));
                    const subComp = Number(fd.get('subComp'));

                    const aptCity = Number(fd.get('aptCity'));
                    const aptDist = Number(fd.get('aptDist'));
                    const aptState = Number(fd.get('aptState'));
                    const aptComp = Number(fd.get('aptComp'));

                    const schedule = fd.get('schedule') as any;

                    if (subCity + subDist + subState + subComp !== 100) {
                      alert('Error: Subscription fee percentages must sum up to exactly 100%!');
                      return;
                    }
                    if (aptCity + aptDist + aptState + aptComp !== 100) {
                      alert('Error: Appointment platform fee percentages must sum up to exactly 100%!');
                      return;
                    }

                    const updatedConfig: CommissionConfig = {
                      id: 'default',
                      subscriptionCityPct: subCity,
                      subscriptionDistrictPct: subDist,
                      subscriptionStatePct: subState,
                      subscriptionCompanyPct: subComp,
                      appointmentCityPct: aptCity,
                      appointmentDistrictPct: aptDist,
                      appointmentStatePct: aptState,
                      appointmentCompanyPct: aptComp,
                      payoutSchedule: schedule,
                      nextPayoutDate: '2026-07-03'
                    };

                    saveCommissionConfig(updatedConfig, 'Super Admin');
                    setCommConfig(updatedConfig);
                    setCommissions(getCommissionRecords()); // Reload recalculated
                    setAuditLogs(getAuditLogs());
                    alert('✓ Configuration saved and updated. System ledger and all future computations updated.');
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Subscription Rules */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <span className="text-[10px] font-black text-[#1A2B3C] uppercase block tracking-wider">1-Year Sign-up Subscriptions (₹5,000)</span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-gray-500 font-bold">City Partner (%)</label>
                          <input type="number" name="subCity" min="0" max="100" required defaultValue={commConfig.subscriptionCityPct || 20} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-gray-500 font-bold">District Partner (%)</label>
                          <input type="number" name="subDist" min="0" max="100" required defaultValue={commConfig.subscriptionDistrictPct} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-gray-500 font-bold">State Partner (%)</label>
                          <input type="number" name="subState" min="0" max="100" required defaultValue={commConfig.subscriptionStatePct} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                          <label className="text-gray-700 font-black">Company Retained (%)</label>
                          <input type="number" name="subComp" min="0" max="100" required defaultValue={commConfig.subscriptionCompanyPct} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-black bg-indigo-50 text-indigo-700" />
                        </div>
                      </div>
                    </div>

                    {/* Appointment platform fee split */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <span className="text-[10px] font-black text-[#1A2B3C] uppercase block tracking-wider">Appointment Platform Charge (5%)</span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-gray-500 font-bold">City Partner (%)</label>
                          <input type="number" name="aptCity" min="0" max="100" required defaultValue={commConfig.appointmentCityPct || 20} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-gray-500 font-bold">District Partner (%)</label>
                          <input type="number" name="aptDist" min="0" max="100" required defaultValue={commConfig.appointmentDistrictPct} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <label className="text-gray-500 font-bold">State Partner (%)</label>
                          <input type="number" name="aptState" min="0" max="100" required defaultValue={commConfig.appointmentStatePct} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                          <label className="text-gray-700 font-black">Company Retained (%)</label>
                          <input type="number" name="aptComp" min="0" max="100" required defaultValue={commConfig.appointmentCompanyPct} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-black bg-indigo-50 text-indigo-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bold">Payout Schedule:</span>
                      <select name="schedule" defaultValue={commConfig.payoutSchedule} className="px-3 py-1.5 border border-gray-200 rounded-lg font-bold bg-white text-gray-700 focus:ring-1 focus:ring-indigo-500">
                        <option value="Weekly">Weekly (Subscription Commissions)</option>
                        <option value="Monthly">Monthly (Appointment Booking Commissions)</option>
                        <option value="Bi-Weekly">Bi-Weekly Payout Cycles</option>
                        <option value="Custom">Custom / On Demand</option>
                      </select>
                    </div>

                    <button type="submit" className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer w-full sm:w-auto text-center">
                      Save Override Configuration
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Automated Release Triggers Card */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 space-y-4 shadow-xs">
              <span className="text-xs font-black text-[#1A2B3C] uppercase block tracking-wider border-b border-gray-100 pb-3">Automated Payout Operations</span>
              <p className="text-[11px] text-gray-400 leading-relaxed">Trigger standard payment disbursement batches. This transfers eligible "Approved" commissions from the ledger to the partner wallets and generates payout receipts.</p>
              
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to run the Weekly Payout Disbursement for all Subscriptions? This will set all approved subscription commissions to "Paid" and credit partner wallets.')) {
                      const receipts = processPayouts('Weekly', 'Super Admin');
                      loadDatabase();
                      alert(`Disbursement complete! Generated ${receipts.length} payout receipts for state & district partners.`);
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all text-xs cursor-pointer text-center"
                >
                  🚀 Run Weekly Subscription Payouts
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to run the Monthly Payout Disbursement for all Appointment Booking platform fees? This will set all approved booking commissions to "Paid" and credit partner wallets.')) {
                      const receipts = processPayouts('Monthly', 'Super Admin');
                      loadDatabase();
                      alert(`Disbursement complete! Generated ${receipts.length} payout receipts for appointment commissions.`);
                    }
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all text-xs cursor-pointer text-center"
                >
                  📅 Run Monthly Booking Payouts
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Execute complete disbursement for all approved commissions of any schedule type?')) {
                      const receipts = processPayouts('All', 'Super Admin');
                      loadDatabase();
                      alert(`Universal payout complete! Successfully processed and archived ${receipts.length} disbursements.`);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm transition-all text-xs cursor-pointer text-center"
                >
                  💎 Release All Approved Commissions
                </button>
              </div>
            </div>
          </div>

          {/* FILTERS AND REVENUE LEDGER TABLE */}
          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Revenue & Payout Audit Ledger</h3>
                <p className="text-[10px] text-gray-400">View complete system earnings, approvals, holds, reversals, and payouts</p>
              </div>

              {/* CSV Export Button */}
              <button
                onClick={() => {
                  let csv = 'Transaction ID,Type,Source Name,Date,Amount,Platform Charge,District Partner,District Comm,State Partner,State Comm,Company Share,Status,Reversal Reason\n';
                  commissions.forEach(r => {
                    csv += `"${r.id}","${r.type}","${r.sourceName}","${r.date}",${r.amount},${r.platformCharge},"${r.districtPartnerName || ''}",${r.districtPartnerCommission},"${r.statePartnerName || ''}",${r.statePartnerCommission},${r.companyCommission},"${r.status}","${r.reversalReason || ''}"\n`;
                  });
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  const dateStr = new Date().toISOString().split('T')[0];
                  a.download = `DoctSpark-Revenue-Ledger-${dateStr}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg border border-gray-200 transition-all text-xs cursor-pointer"
              >
                📥 Export Ledger Reports (CSV)
              </button>
            </div>

            {/* LEDGER FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search Record</label>
                <input
                  type="text"
                  placeholder="ID, doctor or patient name..."
                  value={commSearch}
                  onChange={(e) => setCommSearch(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Revenue Stream</label>
                <select
                  value={commFilterType}
                  onChange={(e: any) => setCommFilterType(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700"
                >
                  <option value="All">All Streams</option>
                  <option value="Subscription">Doctor & Clinic Registration</option>
                  <option value="Appointment">Appointment Booking Share</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ledger Status</label>
                <select
                  value={commFilterStatus}
                  onChange={(e: any) => setCommFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Validation</option>
                  <option value="Approved">Approved (Ready for Payout)</option>
                  <option value="Held">On Hold</option>
                  <option value="Paid">Processed (Paid)</option>
                  <option value="Reversed">Reversed (Refunded)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">State Territory Filter</label>
                <select
                  value={commFilterState}
                  onChange={(e) => {
                    setCommFilterState(e.target.value);
                    setCommFilterDistrict('All'); // reset district
                  }}
                  className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700"
                >
                  <option value="All">All States</option>
                  {indiaStatesData.map(st => (
                    <option key={st.state} value={st.state}>{st.state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">District Territory Filter</label>
                <select
                  value={commFilterDistrict}
                  onChange={(e) => setCommFilterDistrict(e.target.value)}
                  disabled={commFilterState === 'All'}
                  className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700 disabled:opacity-50"
                >
                  <option value="All">All Districts</option>
                  {commFilterState !== 'All' && 
                    indiaStatesData.find(s => s.state === commFilterState)?.districts.map(dst => (
                      <option key={dst.name} value={dst.name}>{dst.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* LEDGER TABLE */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 font-bold text-[#1A2B3C] w-28">Transaction / Date</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Revenue Source</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-right">Gross / Charge</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">District Level Partner</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">State Level Partner</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-right">Company Retained</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-center">Status</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commissions
                    .filter(r => {
                      // Text Search
                      if (commSearch.trim()) {
                        const q = commSearch.toLowerCase();
                        const matchId = r.id.toLowerCase().includes(q);
                        const matchSource = r.sourceName.toLowerCase().includes(q);
                        const matchDist = r.districtPartnerName?.toLowerCase().includes(q);
                        const matchState = r.statePartnerName?.toLowerCase().includes(q);
                        if (!matchId && !matchSource && !matchDist && !matchState) return false;
                      }

                      // Type Filter
                      if (commFilterType !== 'All' && r.type !== commFilterType) return false;

                      // Status Filter
                      if (commFilterStatus !== 'All' && r.status !== commFilterStatus) return false;

                      // State Filter
                      if (commFilterState !== 'All') {
                        // Look up partner state
                        const matchesState = r.statePartnerId && partners.find(p => p.id === r.statePartnerId)?.assignedState === commFilterState;
                        const matchesDistState = r.districtPartnerId && partners.find(p => p.id === r.districtPartnerId)?.assignedState === commFilterState;
                        if (!matchesState && !matchesDistState) return false;
                      }

                      // District Filter
                      if (commFilterDistrict !== 'All') {
                        const matchesDist = r.districtPartnerId && partners.find(p => p.id === r.districtPartnerId)?.assignedDistrict === commFilterDistrict;
                        if (!matchesDist) return false;
                      }

                      return true;
                    })
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        {/* Date and ID */}
                        <td className="p-3 leading-relaxed">
                          <span className="font-mono text-indigo-700 font-extrabold block">{r.id}</span>
                          <span className="text-[10px] text-gray-400 font-semibold">{r.date}</span>
                        </td>

                        {/* Revenue Source */}
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block mb-1 ${r.type === 'Subscription' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {r.type === 'Subscription' ? 'Registration Fee' : 'Booking Fee'}
                          </span>
                          <div className="font-extrabold text-[#1A2B3C] max-w-xs truncate">{r.sourceName}</div>
                        </td>

                        {/* Gross and platform charge */}
                        <td className="p-3 text-right font-mono font-bold text-gray-700 leading-relaxed">
                          <div>₹{r.amount.toLocaleString()}</div>
                          <span className="text-[10px] text-gray-400 block font-normal">Platform: ₹{r.platformCharge.toLocaleString()}</span>
                        </td>

                        {/* District Partner */}
                        <td className="p-3">
                          {r.districtPartnerId ? (
                            <div>
                              <div className="font-bold text-[#1A2B3C]">{r.districtPartnerName}</div>
                              <span className="font-mono text-indigo-600 text-[10px] block">Share: ₹{r.districtPartnerCommission.toLocaleString()} ({r.type === 'Subscription' ? commConfig?.subscriptionDistrictPct : commConfig?.appointmentDistrictPct}%)</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic font-semibold">Not applicable / Direct</span>
                          )}
                        </td>

                        {/* State Partner */}
                        <td className="p-3">
                          {r.statePartnerId ? (
                            <div>
                              <div className="font-bold text-[#1A2B3C]">{r.statePartnerName}</div>
                              <span className="font-mono text-indigo-600 text-[10px] block">Share: ₹{r.statePartnerCommission.toLocaleString()} ({r.type === 'Subscription' ? commConfig?.subscriptionStatePct : commConfig?.appointmentStatePct}%)</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic font-semibold">Not assigned</span>
                          )}
                        </td>

                        {/* Company Share */}
                        <td className="p-3 text-right font-mono font-black text-indigo-700">
                          ₹{r.companyCommission.toLocaleString()}
                          <span className="text-[9px] text-gray-400 block font-normal font-sans">Retained ({r.type === 'Subscription' ? commConfig?.subscriptionCompanyPct : commConfig?.appointmentCompanyPct}%)</span>
                        </td>

                        {/* Status badge */}
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                            r.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            r.status === 'Held' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            r.status === 'Paid' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {r.status}
                          </span>
                          {r.reversalReason && (
                            <span className="block text-[9px] text-red-500 font-semibold max-w-[120px] mx-auto truncate mt-1" title={r.reversalReason}>
                              {r.reversalReason}
                            </span>
                          )}
                        </td>

                        {/* Action triggers */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {r.type === 'Appointment' ? (
                              r.status === 'Reversed' ? (
                                <span className="text-[9px] text-gray-400 italic font-semibold">Settled (Reversed)</span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">Auto Approved</span>
                              )
                            ) : (
                              <>
                                {r.status === 'Pending' && (
                                  <button
                                    onClick={() => {
                                      updateCommissionStatus(r.id, 'Approved', 'Super Admin');
                                      loadDatabase();
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-black w-full cursor-pointer"
                                  >
                                    Approve Share
                                  </button>
                                )}

                                {r.status === 'Approved' && (
                                  <div className="flex gap-1 w-full">
                                    <button
                                      onClick={() => {
                                        updateCommissionStatus(r.id, 'Held', 'Super Admin');
                                        loadDatabase();
                                      }}
                                      className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-[9px] font-black flex-1 cursor-pointer"
                                    >
                                      Hold
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReversingRecordId(r.id);
                                        setReversalReasonInput('');
                                      }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black flex-1 cursor-pointer"
                                    >
                                      Reverse
                                    </button>
                                  </div>
                                )}

                                {r.status === 'Held' && (
                                  <button
                                    onClick={() => {
                                      updateCommissionStatus(r.id, 'Approved', 'Super Admin');
                                      loadDatabase();
                                    }}
                                    className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[9px] font-black w-full cursor-pointer"
                                  >
                                    Release Hold
                                  </button>
                                )}

                                {r.status === 'Paid' && (
                                  <button
                                    onClick={() => {
                                      setReversingRecordId(r.id);
                                      setReversalReasonInput('');
                                    }}
                                    className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[9px] font-black w-full cursor-pointer"
                                  >
                                    Force Reverse
                                  </button>
                                )}

                                {r.status === 'Reversed' && (
                                  <span className="text-[9px] text-gray-400 italic font-semibold">Settled</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SYSTEM DISBURSEMENT HISTORY (RECEIPTS) & AUDIT LOGS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payout Receipts */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 space-y-4 shadow-xs">
              <span className="text-xs font-black text-[#1A2B3C] uppercase block tracking-wider border-b border-gray-100 pb-3">Archived Payout Disbursements</span>
              
              <div className="overflow-y-auto max-h-72 space-y-2.5">
                {payoutReceipts.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-semibold text-xs">No payout batches processed yet. Try running payouts above.</div>
                ) : (
                  payoutReceipts.map((rcpt) => (
                    <div key={rcpt.id} className="p-4 border border-gray-100 rounded-xl bg-slate-50 flex justify-between items-start text-xs hover:border-indigo-100 transition-all">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-extrabold text-indigo-700">{rcpt.receiptNumber}</span>
                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black uppercase">{rcpt.partnerType}</span>
                        </div>
                        <div className="font-bold text-[#1A2B3C]">{rcpt.partnerName}</div>
                        <div className="text-[10px] text-gray-400">Date: {rcpt.date} | Stream: {rcpt.commissionType}</div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="font-mono font-black text-emerald-700 text-sm">₹{rcpt.amount.toLocaleString()}</div>
                        <button
                          onClick={() => {
                            alert(`
DOCT SPARK SYSTEM PAYOUT RECEIPT
--------------------------------------
Receipt ID   : ${rcpt.receiptNumber}
Partner Name : ${rcpt.partnerName} (${rcpt.partnerType} Level)
Transfer Amt : ₹${rcpt.amount.toLocaleString()}
Method       : ${rcpt.payoutMethod}
Settled Date : ${rcpt.date}
Transfer Status: SECURE / COMPLETED
--------------------------------------
Thank you for driving Doct Spark digital health healthcare operations!
                            `);
                          }}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-gray-700 border border-gray-200 rounded text-[9px] font-black cursor-pointer shadow-3xs"
                        >
                          Print Receipt
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Complete Audit Log */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 space-y-4 shadow-xs">
              <span className="text-xs font-black text-[#1A2B3C] uppercase block tracking-wider border-b border-gray-100 pb-3">Complete System Audit Trail</span>
              
              <div className="overflow-y-auto max-h-72 font-mono text-[10px] text-indigo-950 bg-slate-50 border border-gray-100 rounded-xl p-4 space-y-3 shadow-inner">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-semibold">No audit trails recorded.</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="border-b border-gray-200/60 pb-2.5 last:border-0 leading-relaxed">
                      <div className="flex justify-between items-center text-[9px] text-gray-400 mb-1 font-bold">
                        <span>[{log.timestamp}]</span>
                        <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 uppercase font-black">By: {log.actor}</span>
                      </div>
                      <div className="font-extrabold text-[#1A2B3C] uppercase text-[9.5px] tracking-wide mb-0.5">{log.action}</div>
                      <div className="text-slate-500 text-[10px] leading-relaxed font-medium">{log.details}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* REVERSAL MODAL PROMPT */}
          {reversingRecordId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl border border-red-100 w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
                <div>
                  <h3 className="font-extrabold text-[#1A2B3C] text-sm uppercase tracking-wide flex items-center gap-2">
                    ⚠️ Confirm Revenue Share Reversal
                  </h3>
                  <p className="text-gray-400 mt-1 leading-relaxed">This action is irreversible. The calculated commissions will be deducted and status set to Reversed.</p>
                </div>

                <div>
                  <label className="block font-bold text-gray-500 uppercase text-[10px] mb-1">State Reason for Reversal *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter reason (e.g., patient cancelled appointment, fraud verification failed...)"
                    value={reversalReasonInput}
                    onChange={(e) => setReversalReasonInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setReversingRecordId(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!reversalReasonInput.trim()) {
                        alert('Error: You must provide a valid reversal reason.');
                        return;
                      }
                      updateCommissionStatus(reversingRecordId, 'Reversed', 'Super Admin', reversalReasonInput.trim());
                      setReversingRecordId(null);
                      loadDatabase();
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Confirm Reversal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 7: TARGET CONFIGURATION PANEL (SUPER ADMIN ONLY)
          ======================================================== */}
      {mappedTab === 'target-settings' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-xs relative">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A2B3C] uppercase tracking-wide">
                  AUTOMATED TARGETS & PERFORMANCE CONFIGURATOR
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Establish performance criteria, incentive benchmarks, and basic salary thresholds for District and State alliances.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const config = {
                id: 'default',
                districtOnboardTarget: Number(districtOnboardInput),
                stateOnboardTarget: Number(stateOnboardInput),
                districtAppointmentTarget: Number(districtAppointmentInput),
                stateAppointmentTarget: Number(stateAppointmentInput),
                countdownDurationDays: Number(durationDaysInput),
                basicSalaryAmount: Number(basicSalaryInput),
                travelAllowanceAmount: Number(travelAllowanceInput),
                internationalTourEligible: Boolean(tourEligibleInput),
                rewardProgramEnabled: Boolean(rewardEnabledInput),
                achievementCertificateEnabled: Boolean(certificateEnabledInput)
              };
              saveTargetConfig(config);
              alert('🎯 Success: Automated partner target specifications updated successfully!');
              loadDatabase();
            }}>
              
              {/* Grid 1: Milestone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* District Level Partner Targets */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-5 space-y-4">
                  <span className="text-xs font-black text-[#1A2B3C] uppercase block border-b border-gray-200 pb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-teal-600 rounded-full"></span> District Partner Target Specifications
                  </span>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Required Onboarded Providers (Doctors & Clinics) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={districtOnboardInput}
                      onChange={(e) => setDistrictOnboardInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Number of validated registrations onboarded under target countdown.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Required Successful Completed Appointments *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={districtAppointmentInput}
                      onChange={(e) => setDistrictAppointmentInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Collective appointments that must be recorded with "Completed" status.</span>
                  </div>
                </div>

                {/* State Level Partner Targets */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-5 space-y-4">
                  <span className="text-xs font-black text-[#1A2B3C] uppercase block border-b border-gray-200 pb-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span> State Partner Target Specifications
                  </span>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Required Onboarded Providers (Doctors & Clinics) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={stateOnboardInput}
                      onChange={(e) => setStateOnboardInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Collective validated provider accounts registered under State territory.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Required Successful Completed Appointments *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={stateAppointmentInput}
                      onChange={(e) => setStateAppointmentInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Collective successful doctor sessions verified in State territory.</span>
                  </div>
                </div>

              </div>

              {/* Grid 2: Timeline & Cash Rewards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                {/* Challenge Timeline */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-5 space-y-3">
                  <span className="text-[11px] font-black text-gray-700 block border-b border-gray-200 pb-1.5 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-600" /> Challenge Timeline Limit
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">COUNTDOWN DURATION (DAYS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={durationDaysInput}
                      onChange={(e) => setDurationDaysInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-emerald-700"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Time allowed for completing operational targets. Defaults to 180 days.</span>
                  </div>
                </div>

                {/* Guaranteed Salary */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-5 space-y-3">
                  <span className="text-[11px] font-black text-gray-700 block border-b border-gray-200 pb-1.5 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-[#0A6E6E]" /> Basic Salary Incentive
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">GUARANTEED MONTHLY SALARY (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={basicSalaryInput}
                      onChange={(e) => setBasicSalaryInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-teal-800"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Basic salary awarded upon achieving targets within 180 days.</span>
                  </div>
                </div>

                {/* Travel Allowance */}
                <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-5 space-y-3">
                  <span className="text-[11px] font-black text-gray-700 block border-b border-gray-200 pb-1.5 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-[#0A6E6E]" /> Monthly Travel Allowance
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">TRAVEL ALLOWANCE AMOUNT (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={travelAllowanceInput}
                      onChange={(e) => setTravelAllowanceInput(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-teal-800"
                    />
                    <span className="text-[9px] text-gray-400 mt-1 block">Guaranteed travel allowance disbursed monthly with base salary.</span>
                  </div>
                </div>

              </div>

              {/* Grid 3: Scheme Toggles */}
              <div className="bg-slate-50 border border-gray-200/80 rounded-xl p-5 mb-6">
                <span className="text-xs font-black text-[#1A2B3C] uppercase block border-b border-gray-200 pb-2 mb-4">
                  Scheme Settings & Program Toggles
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="rewardEnabledInput"
                      checked={rewardEnabledInput}
                      onChange={(e) => setRewardEnabledInput(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <label htmlFor="rewardEnabledInput" className="text-xs font-extrabold text-gray-700 block cursor-pointer">
                        Enable Target Milestone Rewards
                      </label>
                      <span className="text-[10px] text-gray-400">If unchecked, progress calculation is active but eligibility tracking is paused.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="tourEligibleInput"
                      checked={tourEligibleInput}
                      onChange={(e) => setTourEligibleInput(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <label htmlFor="tourEligibleInput" className="text-xs font-extrabold text-gray-700 block cursor-pointer">
                        Include International Tour Package
                      </label>
                      <span className="text-[10px] text-gray-400">Award an overseas tour schema package alongside base cash salary.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="certificateEnabledInput"
                      checked={certificateEnabledInput}
                      onChange={(e) => setCertificateEnabledInput(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <label htmlFor="certificateEnabledInput" className="text-xs font-extrabold text-gray-700 block cursor-pointer">
                        Issue Performance Certificates
                      </label>
                      <span className="text-[10px] text-gray-400">Auto-issue a certificate of outstanding regional achievement.</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end border-t border-gray-100 pt-4 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-xl transition-colors shadow-sm cursor-pointer text-xs uppercase tracking-wider"
                >
                  Apply Target Specifications
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 8: MILESTONE PERFORMANCE REPORTS & REWARDS
          ======================================================== */}
      {mappedTab === 'milestone-reports' && (() => {
        // Calculate all partner performances dynamically
        const currentTargetConfig = targetConfig || getTargetConfig();
        const perfList = partners.map(p => {
          try {
            return calculatePartnerPerformance(p, doctors, clinics, appointments, currentTargetConfig);
          } catch(e) {
            return null;
          }
        }).filter(Boolean);

        // Filter the list
        const filteredPerf = perfList.filter((perf: any) => {
          if (repFilterState !== 'All' && perf.partnerState !== repFilterState) return false;
          if (repFilterDistrict !== 'All' && perf.partnerDistrict && !perf.partnerDistrict.toLowerCase().includes(repFilterDistrict.toLowerCase())) return false;
          if (repFilterStatus !== 'All') {
            if (repFilterStatus === 'Target Achieved' && !perf.isEligible) return false;
            if (repFilterStatus === 'In Progress' && perf.status !== 'In Progress') return false;
            if (repFilterStatus === 'Deadline Expired' && perf.status !== 'Deadline Expired') return false;
          }
          return true;
        });

        // Filter for specific sub-tabs
        let listToShow = [];
        if (reportSubTab === 'district') {
          listToShow = filteredPerf.filter((p: any) => p.partnerType === 'District');
        } else if (reportSubTab === 'state') {
          listToShow = filteredPerf.filter((p: any) => p.partnerType === 'State');
        } else if (reportSubTab === 'completions') {
          listToShow = filteredPerf.filter((p: any) => p.isEligible);
        } else if (reportSubTab === 'salary') {
          listToShow = filteredPerf.filter((p: any) => p.isEligible);
        } else if (reportSubTab === 'rewards') {
          listToShow = filteredPerf.filter((p: any) => p.isEligible);
        } else if (reportSubTab === 'expired') {
          listToShow = filteredPerf.filter((p: any) => p.status === 'Deadline Expired' && !p.isEligible);
        }

        const handleExtendTarget = (partnerId: string) => {
          const updatedPartners = partners.map(p => {
            if (p.id === partnerId) {
              const nd = new Date();
              nd.setDate(nd.getDate() - 45); // Push back registration date to simulate ample time left
              return { ...p, createdAt: nd.toISOString() };
            }
            return p;
          });
          localStorage.setItem('ds_partners', JSON.stringify(updatedPartners));
          alert('⏰ Milestone Target Extended! Partner registration pushed back to 45 days ago. Remaining days updated successfully.');
          loadDatabase();
        };

        return (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Filter Card */}
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs">
              <span className="text-[11px] font-black text-gray-400 block uppercase tracking-wider mb-3">
                🔍 Filter Milestone Target Ledger
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Filter by State</label>
                  <select
                    value={repFilterState}
                    onChange={(e) => setRepFilterState(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="All">All States</option>
                    {indiaStatesData.map((s) => (
                      <option key={s.state} value={s.state}>{s.state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Filter by District</label>
                  <input
                    type="text"
                    placeholder="Enter district name (e.g. Pune)"
                    value={repFilterDistrict === 'All' ? '' : repFilterDistrict}
                    onChange={(e) => setRepFilterDistrict(e.target.value ? e.target.value : 'All')}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Filter by Target Status</label>
                  <select
                    value={repFilterStatus}
                    onChange={(e) => setRepFilterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Target Achieved">🟢 Target Achieved</option>
                    <option value="In Progress">🟡 In Progress</option>
                    <option value="Deadline Expired">🔴 Deadline Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sub-tabs buttons */}
            <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-2">
              <button
                onClick={() => setReportSubTab('district')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${reportSubTab === 'district' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-gray-600'}`}
              >
                📁 District Partner Performance Progress
              </button>
              <button
                onClick={() => setReportSubTab('state')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${reportSubTab === 'state' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-gray-600'}`}
              >
                🌍 State Partner Performance Progress
              </button>
              <button
                onClick={() => setReportSubTab('completions')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${reportSubTab === 'completions' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-gray-600'}`}
              >
                🏁 Target Completion ledger
              </button>
              <button
                onClick={() => setReportSubTab('salary')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${reportSubTab === 'salary' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-gray-600'}`}
              >
                💸 Guaranteed Salary Eligibility Review
              </button>
              <button
                onClick={() => setReportSubTab('rewards')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${reportSubTab === 'rewards' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-gray-600'}`}
              >
                🎁 Unlocked Milestone Rewards & Incentives
              </button>
              <button
                onClick={() => setReportSubTab('expired')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${reportSubTab === 'expired' ? 'bg-[#0A6E6E] text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-gray-600'}`}
              >
                ⌛ Expired Target Reviews
              </button>
            </div>

            {/* List Table container */}
            <div className="bg-white border border-[#D1E5E5] rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs font-black text-[#1A2B3C] uppercase block tracking-wider flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-indigo-700" />
                  {reportSubTab === 'district' && "District Partner Operational Performance Progress List"}
                  {reportSubTab === 'state' && "State Partner Operational Performance Progress List"}
                  {reportSubTab === 'completions' && "Aptitude Milestone Target Achievement Ledger"}
                  {reportSubTab === 'salary' && "Basic Salary Entitlements Ledger Status"}
                  {reportSubTab === 'rewards' && "Unlocked Promotional Milestone Reward Packages"}
                  {reportSubTab === 'expired' && "Incomplete Challenge Expirations & Request Desk"}
                </span>
                <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono">
                  {listToShow.length} Records Found
                </span>
              </div>

              {listToShow.length === 0 ? (
                <div className="text-center py-16 text-gray-400 font-semibold text-xs space-y-2">
                  <span className="text-4xl block">📂</span>
                  <p>No partner performance records found matching the criteria in this segment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[9.5px] tracking-wider">
                        <th className="p-4">Partner Details</th>
                        <th className="p-4">Registration</th>
                        <th className="p-4">Onboarding (Actual/Goal)</th>
                        <th className="p-4">Completed Appts (Actual/Goal)</th>
                        <th className="p-4">Status & Time Left</th>
                        <th className="p-4 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listToShow.map((perf: any) => (
                        <tr key={perf.partnerId} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* Col 1: Partner Details */}
                          <td className="p-4">
                            <div className="font-extrabold text-gray-800 uppercase flex items-center gap-1.5">
                              {perf.partnerName}
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${perf.partnerType === 'State' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                                {perf.partnerType}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {perf.partnerState} {perf.partnerDistrict && `| District: ${perf.partnerDistrict}`}
                            </div>
                          </td>

                          {/* Col 2: Registration */}
                          <td className="p-4 font-medium text-gray-500">
                            <div>{perf.registrationDateStr}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Ends: {perf.endDateStr}</div>
                          </td>

                          {/* Col 3: Onboarding Progress */}
                          <td className="p-4">
                            <div className="flex justify-between items-center font-bold text-gray-700 mb-1 max-w-[150px]">
                              <span>Onboard:</span>
                              <span className="font-mono text-[11px] text-[#0A6E6E]">{perf.onboardsCount} / {perf.onboardsTarget}</span>
                            </div>
                            <div className="w-full max-w-[150px] bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-teal-600 h-full rounded-full" 
                                style={{ width: `${Math.min(100, perf.onboardsProgressPct)}%` }}
                              ></div>
                            </div>
                          </td>

                          {/* Col 4: Appointments Progress */}
                          <td className="p-4">
                            <div className="flex justify-between items-center font-bold text-gray-700 mb-1 max-w-[150px]">
                              <span>Appts:</span>
                              <span className="font-mono text-[11px] text-amber-600">{perf.appointmentsCount} / {perf.appointmentsTarget}</span>
                            </div>
                            <div className="w-full max-w-[150px] bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-600 h-full rounded-full" 
                                style={{ width: `${Math.min(100, perf.appointmentsProgressPct)}%` }}
                              ></div>
                            </div>
                          </td>

                          {/* Col 5: Status Badge */}
                          <td className="p-4">
                            <div>
                              {perf.isEligible ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold rounded-md uppercase tracking-wider">
                                  🟢 Achieved
                                </span>
                              ) : perf.status === 'Deadline Expired' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 font-extrabold rounded-md uppercase tracking-wider">
                                  🔴 Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-extrabold rounded-md uppercase tracking-wider animate-pulse">
                                  🟡 In Progress
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 font-semibold">
                              {perf.isEligible 
                                ? "Target Cleared!" 
                                : perf.status === 'Deadline Expired' 
                                  ? "Time Over" 
                                  : `${perf.timeLeftFormatted.days}d ${perf.timeLeftFormatted.hours}h left`}
                            </div>
                          </td>

                          {/* Col 6: Action Buttons */}
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              {reportSubTab === 'expired' && (
                                <button
                                  onClick={() => handleExtendTarget(perf.partnerId)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black border border-indigo-200 rounded-md transition-all cursor-pointer text-[10px] flex items-center gap-1 uppercase tracking-wider"
                                >
                                  ⏰ +90d Extension
                                </button>
                              )}
                              {perf.isEligible && (
                                <button
                                  onClick={() => {
                                    alert(`🏆 Partner: ${perf.partnerName}\n\n- Basic Salary status: Unlocked (₹${targetConfig.basicSalaryAmount.toLocaleString()}/mo)\n- Travel Allowance: Unlocked (₹${targetConfig.travelAllowanceAmount.toLocaleString()}/mo)\n- Foreign Tour Scheme: Unlocked\n- Achievement Certificate: Issued & Active\n\nDirect payroll clearance is validated for standard direct credit.`);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black border border-emerald-200 rounded-md transition-all cursor-pointer text-[10px] uppercase"
                                >
                                  👁️ View Rewards
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  alert(`📋 FULL PERFORMANCE REPORT FOR ${perf.partnerName.toUpperCase()}:\n\n- Partner Type: ${perf.partnerType} Level Partner\n- Territory: ${perf.partnerState} - ${perf.partnerDistrict || 'Entire State'}\n- Registration Date: ${perf.registrationDateStr}\n- Target Countdown Deadline: ${perf.endDateStr}\n\nOPERATIONAL METRICS:\n- Onboards Recorded: ${perf.onboardsCount} / ${perf.onboardsTarget} (${perf.onboardsProgressPct}% Complete)\n- Successful Completed Appointments: ${perf.appointmentsCount} / ${perf.appointmentsTarget} (${perf.appointmentsProgressPct}% Complete)\n- Target Achievement Status: ${perf.isEligible ? 'QUALIFIED FOR SALARY & INCENTIVES' : perf.status === 'Deadline Expired' ? 'CHALLENGE EXPIRED' : 'ACTIVE CHALLENGE IN PROGRESS'}`);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 font-extrabold border border-gray-300 rounded-md transition-all cursor-pointer text-[10px] uppercase"
                              >
                                Details
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* ==========================================
          REFERRAL & PATIENT WALLET MANAGEMENT TAB
          ========================================== */}
      {mappedTab === 'referrals' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="referral-wallet-management-tab">
          
          {/* Top Grid: Global Settings & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Referral Rules Configuration */}
            <div className="md:col-span-2 bg-white border border-[#D1E5E5] rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-teal-50 text-[#0A6E6E] rounded-xl flex items-center justify-center border border-teal-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Referral & Cashback Rules</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Configure global reward percentages and release conditions.</p>
                </div>
              </div>
              
              <form onSubmit={handleSaveReferralConfig} className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enable Patient Referral Program</span>
                    <span className="text-[10px] text-gray-400">Allow patients to generate code and invite friends for cashback.</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={refProgramEnabled}
                    onChange={(e) => setRefProgramEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Referral Reward Percentage (%)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={refRewardPct}
                        onChange={(e) => setRefRewardPct(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">%</span>
                    </div>
                    <span className="text-[9px] text-gray-400 block mt-1">Calculated based on referred patient's first completed booking fee.</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Manual Release Approval</label>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-gray-200 rounded-xl h-[38px]">
                      <span className="text-[11px] font-medium text-slate-600">Require manual approval</span>
                      <input 
                        type="checkbox"
                        checked={refRequireApproval}
                        onChange={(e) => setRefRequireApproval(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 block mt-1">Hold rewards as "Approved" pending master release.</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    Save Referral Settings
                  </button>
                </div>
              </form>
            </div>

            {/* Column 3: Referral Stats Overview */}
            <div className="bg-[#0A6E6E] text-white rounded-3xl p-6 shadow-3xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-teal-500/20 -mr-12 -mt-12"></div>
              <div>
                <span className="text-[10px] font-extrabold text-teal-100 uppercase tracking-widest block mb-1">Referral Network</span>
                <h3 className="text-lg font-black font-heading leading-tight mb-3">Live Ledger Metrics</h3>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center border-b border-teal-500/30 pb-2">
                    <span className="text-xs text-teal-100 font-medium">Total Registered Wallets</span>
                    <span className="text-sm font-black">{patientWallets.length} Wallets</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-teal-500/30 pb-2">
                    <span className="text-xs text-teal-100 font-medium">Total Wallet Cash</span>
                    <span className="text-sm font-black">₹{patientWallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-teal-500/30 pb-2">
                    <span className="text-xs text-teal-100 font-medium">Total Referral Earnings</span>
                    <span className="text-sm font-black">₹{patientWallets.reduce((sum, w) => sum + w.referralEarnings, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-xs text-teal-100 font-medium">Pending Approvals</span>
                    <span className="text-sm font-black text-amber-300">
                      {patientWallets.reduce((sum, w) => sum + w.transactions.filter(t => t.status === 'Approved' && t.source === 'Referral').length, 0)} items
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 text-[9.5px] text-teal-100 font-semibold leading-relaxed border-t border-teal-500/30">
                ⚡ Automates patient-to-patient direct cashbacks instantly to foster viral network adoption.
              </div>
            </div>

          </div>

          {/* Dual List view: Wallets Directory & Pending Release Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Patient Wallets Directory Column */}
            <div className="lg:col-span-8 bg-white border border-gray-200/80 rounded-3xl p-5 shadow-3xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Patient Wallets Directory</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Click on any wallet to examine transaction ledger and adjustments.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input 
                    type="text"
                    placeholder="Search name/email/code..."
                    value={searchWalletQuery}
                    onChange={(e) => setSearchWalletQuery(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
                  />
                  <button
                    onClick={() => {
                      setAdjustmentEmail(patientWallets[0]?.patientEmail || '');
                      setAdjustmentType('Credit');
                      setAdjustmentAmount(100);
                      setAdjustmentDescription('Manual Admin Reward Credit');
                      setShowAdjustmentModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-[11px] font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors"
                  >
                    ⚙️ Wallet Override
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Patient Profile</th>
                      <th className="p-3">Sharing Code</th>
                      <th className="p-3">Referred By</th>
                      <th className="p-3 text-right">Referral Rev</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-semibold text-slate-700">
                    {patientWallets
                      .filter(w => 
                        w.patientName.toLowerCase().includes(searchWalletQuery.toLowerCase()) ||
                        w.patientEmail.toLowerCase().includes(searchWalletQuery.toLowerCase()) ||
                        w.referralCode.toLowerCase().includes(searchWalletQuery.toLowerCase())
                      )
                      .map((wallet) => (
                        <tr key={wallet.patientEmail} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{wallet.patientName}</span>
                              <span className="text-[10px] text-gray-400 block font-mono">{wallet.patientEmail}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs text-amber-800 font-black">{wallet.referralCode}</td>
                          <td className="p-3">
                            {wallet.referredByCode ? (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] rounded-md font-mono font-bold">
                                {wallet.referredByCode}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic text-[10px]">Direct</span>
                            )}
                          </td>
                          <td className="p-3 text-right text-emerald-600 font-black">₹{wallet.referralEarnings.toFixed(2)}</td>
                          <td className="p-3 text-right text-slate-800 font-extrabold">₹{wallet.balance.toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedWallet(wallet)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 font-bold rounded-lg text-[10px] transition-colors cursor-pointer border border-gray-200"
                            >
                              Ledger ➔
                            </button>
                          </td>
                        </tr>
                      ))}
                    {patientWallets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center italic text-gray-400">No active patient wallets recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Wallet Ledger & Approvals Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Manual approvals card if any requireApproval transactions exist */}
              <div className="bg-white border border-[#D1E5E5] rounded-3xl p-5 shadow-3xs space-y-3.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  📥 Pending Reward Clearances
                </h3>
                
                {(() => {
                  const pendingTxs: { wallet: PatientWallet; tx: WalletTransaction }[] = [];
                  patientWallets.forEach(w => {
                    w.transactions.forEach(t => {
                      if (t.status === 'Approved' && t.source === 'Referral') {
                        pendingTxs.push({ wallet: w, tx: t });
                      }
                    });
                  });

                  if (pendingTxs.length === 0) {
                    return (
                      <p className="text-[10px] text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
                        No pending referral release approvals required at this time. All rewards are automatically cleared.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {pendingTxs.map(({ wallet, tx }) => (
                        <div key={tx.id} className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-extrabold text-amber-900 block">{wallet.patientName}</span>
                              <span className="text-[9px] text-gray-500 block font-mono">{wallet.patientEmail}</span>
                            </div>
                            <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                              ₹{tx.amount.toFixed(2)}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-gray-600 leading-normal bg-white p-1.5 rounded border border-amber-100/30">
                            {tx.description}
                          </p>

                          <div className="flex gap-1.5 justify-end pt-1">
                            <button
                              onClick={() => handleRejectTx(wallet.patientEmail, tx.id)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold rounded-lg text-[9px] uppercase tracking-wider border border-red-200/30 cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveTx(wallet.patientEmail, tx.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[9px] uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                            >
                              Release Payout
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Patient Wallet Ledger view */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    🔍 Wallet Audit Ledger
                  </h3>
                  {selectedWallet && (
                    <button 
                      onClick={() => setSelectedWallet(null)} 
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Clear View
                    </button>
                  )}
                </div>

                {selectedWallet ? (
                  <div className="space-y-4 text-xs font-semibold">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                      <span className="text-[9px] uppercase font-black text-gray-400 block">Active Auditor Profile</span>
                      <span className="text-sm font-black text-slate-800 block">{selectedWallet.patientName}</span>
                      
                      <div className="grid grid-cols-2 gap-2 pt-1.5">
                        <div className="bg-white p-1.5 rounded border border-slate-200/60">
                          <span className="text-[8px] uppercase text-gray-400 block">Referral Code</span>
                          <span className="text-[10.5px] font-black text-amber-800 font-mono">{selectedWallet.referralCode}</span>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200/60">
                          <span className="text-[8px] uppercase text-gray-400 block">Wallet Balance</span>
                          <span className="text-[10.5px] font-black text-[#0A6E6E]">₹{selectedWallet.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-black text-slate-400 block">Transaction Ledger ({selectedWallet.transactions.length})</span>
                      
                      <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {selectedWallet.transactions.map((tx) => (
                          <div key={tx.id} className="bg-gray-50/70 p-2 rounded-xl border border-gray-100/50 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-black text-slate-800">{tx.source}</span>
                              <span className={`font-black uppercase text-[8px] px-1.5 py-0.5 rounded-full ${
                                tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                tx.status === 'Approved' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {tx.status === 'Approved' ? 'Pending Release' : tx.status}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-gray-500 leading-normal">{tx.description}</p>
                            <div className="flex justify-between items-center text-[8.5px] text-gray-400 pt-1 border-t border-gray-200/20">
                              <span>{new Date(tx.timestamp).toLocaleString()}</span>
                              <span className={`font-extrabold ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {selectedWallet.transactions.length === 0 && (
                          <p className="text-[10px] text-gray-400 italic text-center py-4">No wallet transactions logged yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic text-center py-8">
                    Select a patient from the list on the left to review their transaction logs, verify payouts, and investigate audit reports.
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          TAB 9: ANNOUNCEMENTS MANAGER (CAMPAIGNS)
          ========================================== */}
      {mappedTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center border border-indigo-100">
                  <Globe className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Universal Announcements Engine</h2>
              </div>
              <p className="text-[11px] text-gray-500 font-heading">
                Broadcast vital alerts, maintenance schedules, dynamic offers, or emergency notes directly to website visitors and role-specific dashboards.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Active Campaigns</span>
                <span className="text-xs font-black text-slate-800">
                  {announcements.filter(a => a.status === 'Published').length} Published / {announcements.length} Total
                </span>
              </div>
            </div>
          </div>

          {/* Bento Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Creator Form & Live Preview */}
            <div className="lg:col-span-5 space-y-6" id="announcement-creator-section">
              
              {/* Creator Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {editingAnnId ? '✍️ Edit Announcement' : '➕ Create Announcement'}
                    </span>
                    {editingAnnId && (
                      <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                        Editing
                      </span>
                    )}
                  </div>
                  {editingAnnId && (
                    <button
                      onClick={handleClearAnnForm}
                      className="text-[9px] font-black text-rose-600 hover:text-rose-700 uppercase tracking-wider"
                    >
                      Clear / New
                    </button>
                  )}
                </div>

                {/* Live Preview Container (Sticky UI effect) */}
                <div className="space-y-1.5 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">👁️ Real-time Live Preview</span>
                    <span className="text-[8px] font-mono font-bold text-gray-400">Width: Full Grid</span>
                  </div>
                  
                  <div 
                    className={`relative w-full overflow-hidden border-b flex items-center justify-between transition-all duration-300 ${annFormPadding} ${annFormHeight}`}
                    style={{
                      backgroundColor: annFormBackgroundColor,
                      color: annFormTextColor,
                      borderColor: annFormBorderColor,
                      fontSize: annFormFontSize === 'text-xs' ? '11px' : annFormFontSize === 'text-[10px]' ? '10px' : annFormFontSize === 'text-sm' ? '13px' : '12px'
                    }}
                  >
                    <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-center">
                      {annFormAnimationStyle === 'Marquee' ? (
                        <div className="w-full overflow-hidden">
                          <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                            <span className="font-extrabold uppercase tracking-widest text-[8px] bg-black/10 px-1 py-0.5 rounded">
                              {annFormType}
                            </span>
                            <span className="font-semibold tracking-wide text-xs truncate">
                              {annFormMessage.trim() || 'Type your message in the form below...'}
                            </span>
                            {annFormLinkEnabled && annFormButtonUrl && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold ml-1 underline">
                                {annFormButtonText} &rarr;
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-center py-1">
                          <span className="font-extrabold uppercase tracking-widest text-[8px] bg-black/10 px-1.5 py-0.5 rounded">
                            {annFormType}
                          </span>
                          <span className="font-semibold text-xs tracking-wide">
                            {annFormMessage.trim() || 'Type your message in the form below...'}
                          </span>
                          {annFormLinkEnabled && annFormButtonUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-[#0A6E6E] text-white rounded">
                              {annFormButtonText}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {annFormDismissible && (
                      <span className="text-[10px] opacity-60 ml-2">✕</span>
                    )}
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4 pt-1">
                  
                  {/* Title & Type Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Internal Title</label>
                      <input 
                        type="text"
                        value={annFormTitle}
                        onChange={(e) => setAnnFormTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. July Telemed Trial Offer"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Announcement Type</label>
                      <select 
                        value={annFormType}
                        onChange={(e) => handleApplyThemeDefaults(e.target.value as any)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
                      >
                        <option value="Information">Information (Blue Theme)</option>
                        <option value="Success">Success (Green Theme)</option>
                        <option value="Warning">Warning (Yellow Theme)</option>
                        <option value="Emergency">Emergency (Red Theme)</option>
                        <option value="Offer">Offer (Purple Theme)</option>
                        <option value="Maintenance">Maintenance (Orange Theme)</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Broadcast Message</label>
                    <textarea 
                      value={annFormMessage}
                      onChange={(e) => setAnnFormMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="e.g. 🔥 Complete your clinical profile registration today and unlock first 10 consultations absolutely free!"
                      required
                    />
                  </div>

                  {/* Targeting & Display Locations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Target Audience</label>
                      <select 
                        value={annFormTargetAudience}
                        onChange={(e) => setAnnFormTargetAudience(e.target.value as any)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
                      >
                        <option value="All">All Users / Visitors</option>
                        <option value="Visitors">Website Visitors Only</option>
                        <option value="Patients">Patients Hub Only</option>
                        <option value="Doctors">Doctors Dashboard Only</option>
                        <option value="Clinics">Clinics / Hospitals Only</option>
                        <option value="Partners">District & State Partners</option>
                        <option value="Staff">Clinical Staff</option>
                        <option value="Admin">Super Administrators</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Display Location</label>
                      <select 
                        value={annFormDisplayLocation}
                        onChange={(e) => setAnnFormDisplayLocation(e.target.value as any)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
                      >
                        <option value="Entire Website">Entire Website (Everywhere)</option>
                        <option value="Website Home">Website Home Page Only</option>
                        <option value="Website Inner">Website Inner Pages Only</option>
                        <option value="All Dashboards">All Role Dashboards Only</option>
                        <option value="Admin">Admin Panel Only</option>
                        <option value="Patient">Patient Dashboard Only</option>
                        <option value="Doctor">Doctor Dashboard Only</option>
                        <option value="Clinic">Clinic Dashboard Only</option>
                        <option value="Partner">Partner Dashboard Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Scheduling Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Schedule Start (Optional)</label>
                      <input 
                        type="datetime-local"
                        value={annFormStartDatetime}
                        onChange={(e) => setAnnFormStartDatetime(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Schedule End (Optional)</label>
                      <input 
                        type="datetime-local"
                        value={annFormEndDatetime}
                        onChange={(e) => setAnnFormEndDatetime(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Design & Styles Accordion Wrapper */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    <span className="text-[9px] font-black text-[#0A6E6E] uppercase tracking-wider block border-b border-slate-100 pb-1.5">🎨 Visual Styling & Custom CSS</span>
                    
                    {/* Background, text, and border custom color inputs */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Background</label>
                        <div className="flex gap-1.5 items-center bg-white border border-gray-200 p-1 rounded-lg">
                          <input 
                            type="color" 
                            value={annFormBackgroundColor}
                            onChange={(e) => setAnnFormBackgroundColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <span className="text-[8px] font-mono font-bold uppercase shrink-0">{annFormBackgroundColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Text Color</label>
                        <div className="flex gap-1.5 items-center bg-white border border-gray-200 p-1 rounded-lg">
                          <input 
                            type="color" 
                            value={annFormTextColor}
                            onChange={(e) => setAnnFormTextColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <span className="text-[8px] font-mono font-bold uppercase shrink-0">{annFormTextColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Border Color</label>
                        <div className="flex gap-1.5 items-center bg-white border border-gray-200 p-1 rounded-lg">
                          <input 
                            type="color" 
                            value={annFormBorderColor}
                            onChange={(e) => setAnnFormBorderColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <span className="text-[8px] font-mono font-bold uppercase shrink-0">{annFormBorderColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Animation Style, Animation Speed & Icon */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Animation Style</label>
                        <select
                          value={annFormAnimationStyle}
                          onChange={(e) => setAnnFormAnimationStyle(e.target.value as any)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer"
                        >
                          <option value="Marquee">Marquee Scroll</option>
                          <option value="Fade">Static / Fade-In</option>
                          <option value="Static">Static / No Motion</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Animation Speed</label>
                        <select
                          value={annFormAnimationSpeed}
                          onChange={(e) => setAnnFormAnimationSpeed(e.target.value as any)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer"
                        >
                          <option value="Slow">Slow Speed</option>
                          <option value="Medium">Medium Speed</option>
                          <option value="Fast">Fast Speed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Icon Preset</label>
                        <select
                          value={annFormIcon}
                          onChange={(e) => setAnnFormIcon(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer"
                        >
                          <option value="default">Default Type Icon</option>
                          <option value="Megaphone">Megaphone</option>
                          <option value="Info">Info Bullet</option>
                          <option value="CheckCircle">Check Mark</option>
                          <option value="AlertTriangle">Warning Triangle</option>
                          <option value="AlertOctagon">Emergency Alert</option>
                          <option value="Tag">Offer Label</option>
                          <option value="Wrench">Wrench Tool</option>
                        </select>
                      </div>
                    </div>

                    {/* Typography Height & Margins */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Font Size</label>
                        <select
                          value={annFormFontSize}
                          onChange={(e) => setAnnFormFontSize(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer"
                        >
                          <option value="text-[10px]">Tiny (10px)</option>
                          <option value="text-xs">Extra Small (12px)</option>
                          <option value="text-sm">Small (14px)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Bar Padding</label>
                        <select
                          value={annFormPadding}
                          onChange={(e) => setAnnFormPadding(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer"
                        >
                          <option value="py-1 px-4">Minimal (py-1)</option>
                          <option value="py-1.5 px-4 md:px-8">Comfortable (py-1.5)</option>
                          <option value="py-2.5 px-4 md:px-8">Tall (py-2.5)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Height Constrain</label>
                        <select
                          value={annFormHeight}
                          onChange={(e) => setAnnFormHeight(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-1.5 py-1 text-[10px] font-bold outline-none cursor-pointer"
                        >
                          <option value="h-auto">Dynamic Auto-Height</option>
                          <option value="h-8">Fixed Compact (h-8)</option>
                          <option value="h-10">Fixed Standard (h-10)</option>
                          <option value="h-12">Fixed Large (h-12)</option>
                        </select>
                      </div>
                    </div>

                    {/* Checkboxes for CTA & Dismissal */}
                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={annFormDismissible}
                          onChange={(e) => setAnnFormDismissible(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">User Dismissible (Hide Button)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={annFormLinkEnabled}
                          onChange={(e) => setAnnFormLinkEnabled(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Enable Clickable CTA Link</span>
                      </label>
                    </div>

                    {/* CTA Details if link is checked */}
                    {annFormLinkEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                        <div>
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">CTA Button Text</label>
                          <input 
                            type="text"
                            value={annFormButtonText}
                            onChange={(e) => setAnnFormButtonText(e.target.value)}
                            className="w-full bg-white border border-gray-200 p-1.5 rounded-lg text-[10px] font-bold"
                            placeholder="e.g. Learn More"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-wider block mb-1">Destination URL / Anchor</label>
                          <input 
                            type="text"
                            value={annFormButtonUrl}
                            onChange={(e) => setAnnFormButtonUrl(e.target.value)}
                            className="w-full bg-white border border-gray-200 p-1.5 rounded-lg text-[10px] font-bold font-mono"
                            placeholder="e.g. #specialties or https://..."
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Priority Row */}
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Campaign Priority Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Low', 'Medium', 'High', 'Emergency'].map((prio) => (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setAnnFormPriority(prio as any)}
                          className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border text-center transition-all ${
                            annFormPriority === prio
                              ? prio === 'Low' ? 'bg-slate-100 border-slate-300 text-slate-700' :
                                prio === 'Medium' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold' :
                                prio === 'High' ? 'bg-amber-50 border-amber-200 text-amber-700 font-extrabold' :
                                'bg-rose-50 border-rose-200 text-rose-700 font-extrabold animate-pulse'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {prio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleClearAnnForm}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Reset Form
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmitAnnouncement('Draft')}
                        className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer bg-white"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitAnnouncement('Published')}
                        className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#085353] text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        {editingAnnId ? 'Publish Changes' : 'Publish Live'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Column: Searchable, Filterable Announcement List */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-5">
                
                {/* Search & Filter Header */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      📋 Announcements Ledger ({announcements.length})
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono font-medium">Sorted by Weight Descending</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    
                    {/* Text Search */}
                    <div className="sm:col-span-2 relative">
                      <input 
                        type="text"
                        value={annSearchQuery}
                        onChange={(e) => setAnnSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Search Title or Message..."
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <select
                        value={annFilterStatus}
                        onChange={(e) => setAnnFilterStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft Only</option>
                        <option value="Unpublished">Unpublished</option>
                      </select>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <select
                        value={annFilterType}
                        onChange={(e) => setAnnFilterType(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="All">All Types</option>
                        <option value="Information">Information</option>
                        <option value="Success">Success</option>
                        <option value="Warning">Warning</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Offer">Offer</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Filter list result */}
                {(() => {
                  const filtered = announcements.filter(ann => {
                    const matchesSearch = ann.title.toLowerCase().includes(annSearchQuery.toLowerCase()) || 
                                          ann.message.toLowerCase().includes(annSearchQuery.toLowerCase());
                    const matchesStatus = annFilterStatus === 'All' || ann.status === annFilterStatus;
                    const matchesType = annFilterType === 'All' || ann.type === annFilterType;
                    const matchesAudience = annFilterAudience === 'All' || ann.target_audience === annFilterAudience;
                    return matchesSearch && matchesStatus && matchesType && matchesAudience;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-[10px] text-gray-400 font-bold">
                        No announcements matches your current filters or search query.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
                      {filtered.map((ann) => {
                        const isScheduled = ann.start_datetime || ann.end_datetime;
                        const isExpired = ann.end_datetime && new Date() > new Date(ann.end_datetime);
                        const isUpcoming = ann.start_datetime && new Date() < new Date(ann.start_datetime);

                        return (
                          <div 
                            key={ann.id} 
                            className={`p-4 border rounded-2xl flex flex-col gap-3 transition-all relative ${
                              editingAnnId === ann.id 
                                ? 'bg-indigo-50/20 border-indigo-400 ring-2 ring-indigo-400/20' 
                                : 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            
                            {/* Card Header row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-slate-800 tracking-tight leading-none">
                                    {ann.title}
                                  </span>
                                  
                                  {/* Status indicators */}
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    ann.status === 'Published' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : ann.status === 'Draft'
                                      ? 'bg-slate-100 text-slate-400 border-slate-200'
                                      : 'bg-amber-50 text-amber-600 border-amber-200'
                                  }`}>
                                    {ann.status}
                                  </span>

                                  {/* Priority indicators */}
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                    ann.priority === 'Emergency'
                                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                      : ann.priority === 'High'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : ann.priority === 'Medium'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {ann.priority} Priority
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-400 font-semibold font-heading">
                                  Created: {new Date(ann.created_at).toLocaleDateString()} {new Date(ann.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>

                              {/* Card Action Controls */}
                              <div className="flex items-center gap-1 shrink-0">
                                
                                {/* Quick toggle Play/Pause */}
                                <button
                                  onClick={() => handleToggleAnnouncementStatus(ann.id)}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                    ann.status === 'Published' 
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100' 
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                                  }`}
                                  title={ann.status === 'Published' ? 'Unpublish/Deactivate' : 'Publish Live'}
                                >
                                  {ann.status === 'Published' ? '⏸️' : '▶️'}
                                </button>

                                {/* Duplicate */}
                                <button
                                  onClick={() => handleDuplicateAnnouncement(ann)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-xs transition-all cursor-pointer"
                                  title="Duplicate Announcement"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => handleEditAnnouncement(ann)}
                                  className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg text-xs transition-all cursor-pointer"
                                  title="Edit Announcement"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                                  className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-lg text-xs transition-all cursor-pointer"
                                  title="Delete Announcement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            </div>

                            {/* Message Display & Styling Details */}
                            <div className="text-xs font-semibold text-slate-700 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl shadow-4xs">
                              {ann.message}
                              {ann.link_enabled && ann.button_url && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-[#0A6E6E] font-black">
                                  <span>CTA: <strong>{ann.button_text}</strong> &rarr; <code className="bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">{ann.button_url}</code></span>
                                </div>
                              )}
                            </div>

                            {/* Meta Badges Details */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-gray-400">
                              
                              {/* Display Location */}
                              <span className="bg-slate-100/80 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                📍 {ann.display_location}
                              </span>

                              {/* Target Audience */}
                              <span className="bg-slate-100/80 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                👥 Audience: {ann.target_audience}
                              </span>

                              {/* Motion configuration */}
                              <span className="bg-slate-100/80 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                🎬 {ann.animation_style} ({ann.animation_speed})
                              </span>

                              {/* Color swatch indicator */}
                              <div className="flex items-center gap-1 pl-1 shrink-0">
                                <span className="w-3.5 h-3.5 rounded border border-gray-300" style={{ backgroundColor: ann.background_color }} title="Background" />
                                <span className="w-3.5 h-3.5 rounded border border-gray-300" style={{ backgroundColor: ann.text_color }} title="Text color" />
                              </div>

                            </div>

                            {/* Scheduling Schedule Details */}
                            {isScheduled && (
                              <div className="flex items-center gap-1 text-[9px] font-mono text-indigo-600 bg-indigo-50/40 p-2 rounded-xl border border-indigo-100/40 mt-0.5">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  Active Schedule: {ann.start_datetime ? new Date(ann.start_datetime).toLocaleString() : 'Immediate'} 
                                  {' to '} 
                                  {ann.end_datetime ? new Date(ann.end_datetime).toLocaleString() : 'Forever'}
                                  {isExpired && <strong className="text-rose-600 uppercase ml-2 tracking-wider font-extrabold">[Expired]</strong>}
                                  {isUpcoming && <strong className="text-amber-600 uppercase ml-2 tracking-wider font-extrabold">[Upcoming]</strong>}
                                </span>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          TAB 8: PLATFORM SETTINGS & SYSTEM AUDIT TRAIL
          ========================================== */}
      {mappedTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Custom Settings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Global Pricing & Commission Config */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Platform Base Config</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Dynamic pricing structures and partner sharing rates.</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Configure core service parameters dynamically. Any updates here immediately propagate to the live subscription billing and partner payout shares.
              </p>
              
              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Global Doctor Onboarding Trial Fee (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                    <input 
                      type="number"
                      value={globalSubFee}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setGlobalSubFee(val);
                        localStorage.setItem('ds_global_subscription_fee', val.toString());
                      }}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-black text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">State Share (%)</label>
                    <input 
                      type="number"
                      value={commConfig?.subscriptionStatePct || 10}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        const newConfig = { ...commConfig, subscriptionStatePct: val };
                        setCommConfig(newConfig);
                        saveCommissionConfig(newConfig, 'Super Admin');
                      }}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">District Share (%)</label>
                    <input 
                      type="number"
                      value={commConfig?.subscriptionDistrictPct || 40}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        const newConfig = { ...commConfig, subscriptionDistrictPct: val };
                        setCommConfig(newConfig);
                        saveCommissionConfig(newConfig, 'Super Admin');
                      }}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Automated Rules & Reset Actions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-100">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Automated Protocols</h3>
                    <p className="text-[10px] text-gray-400 font-medium font-heading">Set verification automation rules.</p>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  Define verification constraints for newly registered partner, doctor and clinic files. Simulated Automated Verification auto-assesses submitted KYC details.
                </p>

                <div className="flex items-center justify-between p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                  <div>
                    <span className="text-xs font-extrabold text-indigo-950 block">AI-Powered Pre-Verification</span>
                    <span className="text-[9px] text-indigo-700 font-mono font-bold uppercase mt-0.5">Auto-parse identity uploads</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoVerification;
                      setAutoVerification(next);
                      localStorage.setItem('ds_auto_verification_enabled', next ? 'true' : 'false');
                      addAuditLog(
                        'Toggle Auto-Verification Protocol',
                        'Super Admin',
                        `Automated credential parsing was switched to ${next ? 'ENABLED (Simulated Automated Approvals)' : 'DISABLED (Strict Manual Audit)'}`
                      );
                      setAuditLogs(getAuditLogs());
                      alert(`✓ Verification Protocol updated! Now set to: ${next ? 'Simulated AI Pre-Verification' : 'Manual Super Admin Audit'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                      autoVerification ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {autoVerification ? '✓ ENABLED' : 'MANUAL AUDIT'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to restore the entire DOCT SPARK database back to default factory seeds? This will wipe all modified partners, doctors, clinics, appointments, ledger balances and logs.')) {
                      localStorage.clear();
                      addAuditLog('System Hard Reset', 'Super Admin', 'Factory database restoration successfully complete.');
                      alert('🎉 Database successfully reset to factory default seeds! App is refreshing.');
                      window.location.reload();
                    }
                  }}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all cursor-pointer text-center active:scale-95"
                >
                  Hard Reset Database
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('ds_commission_audit_logs', JSON.stringify([]));
                    setAuditLogs([]);
                    alert('✓ Audit Logs cleared successfully.');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold border border-gray-200 transition-all cursor-pointer active:scale-95"
                >
                  Clear Logs
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {mappedTab === 'footer-settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 gap-6">

            {/* Footer Social Media Config Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-50 text-[#0A6E6E] rounded-xl flex items-center justify-center border border-emerald-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Footer Social Media Settings</h3>
                  <p className="text-[10px] text-gray-400 font-medium font-heading">Configure external links for social media icons displayed in the footer.</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Provide custom URLs for Facebook, Twitter, Instagram, LinkedIn, and YouTube. These will be updated across the platform immediately.
              </p>

              <form onSubmit={handleSaveSocialLinks} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Facebook URL</label>
                    <input 
                      type="url"
                      value={fbUrl}
                      onChange={(e) => setFbUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="https://facebook.com/your-page"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Twitter URL</label>
                    <input 
                      type="url"
                      value={twUrl}
                      onChange={(e) => setTwUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="https://twitter.com/your-handle"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Instagram URL</label>
                    <input 
                      type="url"
                      value={igUrl}
                      onChange={(e) => setIgUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="https://instagram.com/your-profile"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">LinkedIn URL</label>
                    <input 
                      type="url"
                      value={liUrl}
                      onChange={(e) => setLiUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="https://linkedin.com/company/your-page"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">YouTube URL</label>
                    <input 
                      type="url"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="https://youtube.com/c/your-channel"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#085353] text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    Save Footer Links
                  </button>
                </div>
              </form>
            </div>

            {/* Footer Copyright & Legal Links Config Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-50 text-[#0A6E6E] rounded-xl flex items-center justify-center border border-emerald-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Footer Copyright & Legal Link Settings</h3>
                  <p className="text-[10px] text-gray-400 font-medium font-heading">Configure copyrights, location text, and legal document links in the bottom bar.</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Customize copyright text, heart location, and document links (Privacy Policy, Terms of Use, Refund & Cancellation) and labels.
              </p>

              <form onSubmit={handleSaveFooterLinks} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Copyright Text</label>
                    <input 
                      type="text"
                      value={copyrightText}
                      onChange={(e) => setCopyrightText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="e.g. © 2026 DOCT SPARK Healthcare India Pvt. Ltd. Made with"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Location Text (after Heart)</label>
                    <input 
                      type="text"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                      placeholder="e.g. in Mumbai."
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-3 md:col-span-2">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-2">Legal Links Config</span>
                  </div>

                  {/* Privacy Link */}
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Privacy Link Label</label>
                    <input 
                      type="text"
                      value={privacyLabelText}
                      onChange={(e) => setPrivacyLabelText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Privacy Link URL</label>
                    <input 
                      type="text"
                      value={privacyUrlText}
                      onChange={(e) => setPrivacyUrlText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                    />
                  </div>

                  {/* Terms Link */}
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Terms Link Label</label>
                    <input 
                      type="text"
                      value={termsLabelText}
                      onChange={(e) => setTermsLabelText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Terms Link URL</label>
                    <input 
                      type="text"
                      value={termsUrlText}
                      onChange={(e) => setTermsUrlText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                    />
                  </div>

                  {/* Refund Link */}
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Refund Link Label</label>
                    <input 
                      type="text"
                      value={refundLabelText}
                      onChange={(e) => setRefundLabelText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">Refund Link URL</label>
                    <input 
                      type="text"
                      value={refundUrlText}
                      onChange={(e) => setRefundUrlText(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#085353] text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    Save Footer Settings
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {mappedTab === 'custom-pages' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 gap-6">

            {/* Dynamic Pages Creator & Manager Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-6 md:col-span-2" id="dynamic-page-config-form">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-50 text-[#0A6E6E] rounded-xl flex items-center justify-center border border-emerald-100">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Custom Pages Creator & Manager</h3>
                    <p className="text-[10px] text-gray-400 font-medium font-heading">Dynamically build, edit, and launch new informational or legal subpages.</p>
                  </div>
                </div>
                {editingPageId && (
                  <button
                    onClick={handleCancelPageEdit}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg uppercase tracking-wide border border-rose-100 transition-colors"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                
                {/* Creator Form */}
                <form onSubmit={handleSubmitDynamicPage} className="space-y-4">
                  <span className="text-[11px] font-black text-[#0A6E6E] uppercase tracking-wider block border-b border-slate-100 pb-2">
                    {editingPageId ? '✍️ Edit Custom Page' : '➕ Create New Custom Page'}
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Page Title</label>
                      <input 
                        type="text"
                        value={pageFormTitle}
                        onChange={(e) => handleTitleChangeForSlug(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                        placeholder="e.g. Terms of Use, Careers, Help Center"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">URL Slug (Automatically generated)</label>
                      <div className="flex items-center">
                        <span className="bg-slate-100 border border-r-0 border-gray-200 rounded-l-xl px-3 py-2 text-[11px] font-bold text-gray-400 font-mono">
                          /page-
                        </span>
                        <input 
                          type="text"
                          value={pageFormSlug}
                          onChange={(e) => setPageFormSlug(slugify(e.target.value))}
                          className="w-full bg-slate-50 border border-gray-200 rounded-r-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all"
                          placeholder="e.g. refund-policy"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Page Content (Supports Plain Text or raw HTML blocks)</label>
                      <textarea 
                        value={pageFormContent}
                        onChange={(e) => setPageFormContent(e.target.value)}
                        rows={8}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0A6E6E] outline-none transition-all font-mono"
                        placeholder="<h3>Subheading</h3><p>Your custom paragraphs and links here...</p>"
                        required
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={pageFormActive}
                          onChange={(e) => setPageFormActive(e.target.checked)}
                          className="w-4 h-4 text-[#0A6E6E] bg-slate-100 border-gray-300 rounded-sm focus:ring-[#0A6E6E] cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Active & Accessible</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={pageFormAddToFooter}
                          onChange={(e) => setPageFormAddToFooter(e.target.checked)}
                          className="w-4 h-4 text-[#0A6E6E] bg-slate-100 border-gray-300 rounded-sm focus:ring-[#0A6E6E] cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Auto-Link in Footer</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#0A6E6E] hover:bg-[#085353] text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow-sm uppercase tracking-wider"
                    >
                      {editingPageId ? 'Save Custom Page' : 'Create Custom Page'}
                    </button>
                  </div>
                </form>

                {/* Pages List */}
                <div className="space-y-4">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
                    🌐 Existing Informational Pages ({dynamicPages.length})
                  </span>

                  {dynamicPages.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-[10px] text-gray-400 font-bold">
                      No custom informational pages created yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {dynamicPages.map((page) => (
                        <div key={page.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs hover:border-slate-200 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{page.title}</span>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${page.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                {page.active ? 'Active' : 'Draft'}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono font-bold leading-none">
                              /page-{page.slug}
                            </div>
                            {page.lastUpdated && (
                              <div className="text-[9px] text-gray-400">
                                Updated: {page.lastUpdated}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 md:self-center">
                            {/* Toggle Active status */}
                            <button
                              onClick={() => handleTogglePageActive(page.id)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${page.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-gray-400 border-slate-200 hover:bg-slate-200'}`}
                              title={page.active ? 'Deactivate page' : 'Activate page'}
                            >
                              {page.active ? '✓' : '✗'}
                            </button>

                            {/* Toggle Footer visibility */}
                            <button
                              onClick={() => handleTogglePageFooter(page.id)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${page.addToFooter ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' : 'bg-slate-100 text-gray-400 border-slate-200 hover:bg-slate-200'}`}
                              title={page.addToFooter ? 'Remove from Footer links' : 'Show in Footer links'}
                            >
                              ⚓
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditPage(page)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg text-xs transition-all"
                              title="Edit Page"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* View/Preview Page Link */}
                            <button
                              onClick={() => {
                                if (page.active) {
                                  setView(`page-${page.slug}`);
                                } else {
                                  alert('⚠️ This page is currently a Draft. Set it to Active to view.');
                                }
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-[#0A6E6E] border border-slate-200 hover:border-emerald-100 rounded-lg text-xs transition-all"
                              title="Preview Page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeletePage(page.id, page.title)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-lg text-xs transition-all"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {mappedTab === 'terms-management' && (
        <TermsManagementModule />
      )}

      {mappedTab === 'audit-trail' && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Chronological Platform Audit Trail */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">🛡️ Platform Chronological Audit Trail</h3>
                <p className="text-[11px] text-gray-400">Complete chronological record of all decisions, configurations, partner registrations, and ledger transactions.</p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-200 font-mono">
                SYS_ID SECURED
              </span>
            </div>

            {/* Audit Logs Filter & Search Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2">
                <input 
                  type="text"
                  placeholder="Search logs by action, details, or actor..."
                  value={searchAuditQuery}
                  onChange={(e) => setSearchAuditQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-2xs"
                />
              </div>
              <div>
                <select
                  value={filterAuditCategory}
                  onChange={(e) => setFilterAuditCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs font-black text-slate-700 focus:bg-white outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="All">All Categories</option>
                  <option value="Approved">Approvals</option>
                  <option value="Activated">Activations</option>
                  <option value="Bonus">Performance Bonuses</option>
                  <option value="Configuration">Configurations</option>
                  <option value="Partner">Partner Related</option>
                </select>
              </div>
            </div>

            {/* Audit Logs Grid/Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="p-3 font-bold">Timestamp</th>
                    <th className="p-3 font-bold">Action / Event</th>
                    <th className="p-3 font-bold">Actor</th>
                    <th className="p-3 font-bold">Event Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {(() => {
                    const filteredLogs = auditLogs.filter(log => {
                      const textMatch = !searchAuditQuery ? true : (
                        (log.action && log.action.toLowerCase().includes(searchAuditQuery.toLowerCase())) ||
                        (log.actor && log.actor.toLowerCase().includes(searchAuditQuery.toLowerCase())) ||
                        (log.details && log.details.toLowerCase().includes(searchAuditQuery.toLowerCase()))
                      );

                      if (filterAuditCategory === 'All') return textMatch;
                      if (filterAuditCategory === 'Approved' && !log.action.toLowerCase().includes('approve')) return false;
                      if (filterAuditCategory === 'Activated' && !log.action.toLowerCase().includes('activate')) return false;
                      if (filterAuditCategory === 'Bonus' && !log.action.toLowerCase().includes('bonus')) return false;
                      if (filterAuditCategory === 'Configuration' && !log.action.toLowerCase().includes('config')) return false;
                      if (filterAuditCategory === 'Partner' && !log.action.toLowerCase().includes('partner')) return false;

                      return textMatch;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="text-center p-8 text-gray-400 font-semibold italic">
                            No chronological audit logs match the current filters.
                          </td>
                        </tr>
                      );
                    }

                    return filteredLogs.slice(0, 30).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 text-slate-600 transition-colors">
                        <td className="p-3 text-gray-400 whitespace-nowrap font-sans text-[10px]">{log.timestamp}</td>
                        <td className="p-3 font-bold text-slate-800 font-sans">{log.action}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[9px] font-black text-slate-700 uppercase font-sans border border-slate-200">
                            {log.actor}
                          </span>
                        </td>
                        <td className="p-3 leading-relaxed text-slate-500 font-sans text-xs">{log.details}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mappedTab === 'testing-center' && (
        <TestingCenter 
          setView={setView}
          setUserRole={setUserRole}
          setUserEmail={setUserEmail}
          userEmail={userEmail || ''}
        />
      )}

      {/* ==========================================
          MODAL: VIEW & EDIT REGISTRATION DETAILS
          ========================================== */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#D1E5E5] w-full max-w-5xl md:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F0F7F7] rounded-lg text-[#0A6E6E]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1A2B3C] text-sm md:text-base">
                    View & Edit {editingItem.type === 'doctor' ? 'Doctor Profile' : editingItem.type === 'clinic' ? 'Clinic Registry' : 'Partner Application'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">Verify credentials and make corrections before issuing live activation</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const updatedData: any = {};
                fd.forEach((value, key) => {
                  if ((key === 'experience' || key === 'feeInClinic' || key === 'feeVideo') && editingItem.type !== 'partner') {
                    updatedData[key] = Number(value);
                  } else if (value === 'true') {
                    updatedData[key] = true;
                  } else if (value === 'false') {
                    updatedData[key] = false;
                  } else {
                    updatedData[key] = value;
                  }
                });
                handleSaveEdit(updatedData);
              }}
              className="flex-1 overflow-hidden flex flex-col text-xs"
            >
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-[#0A6E6E]" /> Edit Profile Credentials
                    </h4>

                    {editingItem.type === 'doctor' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Doctor Fields */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Doctor Full Name *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            defaultValue={editingItem.data.name}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Specialty *</label>
                          <input
                            type="text"
                            name="specialty"
                            required
                            defaultValue={editingItem.data.specialty}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Years of Experience *</label>
                          <input
                            type="number"
                            name="experience"
                            required
                            defaultValue={editingItem.data.experience}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Medical Registration Number (MCI) *</label>
                          <input
                            type="text"
                            name="registrationNumber"
                            required
                            defaultValue={editingItem.data.registrationNumber}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono text-indigo-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Primary Clinic Name *</label>
                          <input
                            type="text"
                            name="clinicName"
                            required
                            defaultValue={editingItem.data.clinicName}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Contact Phone *</label>
                          <input
                            type="text"
                            name="contactPhone"
                            required
                            defaultValue={editingItem.data.contactPhone || editingItem.data.phone || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Contact Email *</label>
                          <input
                            type="email"
                            name="email"
                            required
                            defaultValue={editingItem.data.email || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Highest Medical Qualification *</label>
                          <input
                            type="text"
                            name="education"
                            required
                            defaultValue={editingItem.data.education}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">In-Clinic Consult Fee (₹) *</label>
                          <input
                            type="number"
                            name="feeInClinic"
                            required
                            defaultValue={editingItem.data.feeInClinic}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Video Consult Fee (₹) *</label>
                          <input
                            type="number"
                            name="feeVideo"
                            required
                            defaultValue={editingItem.data.feeVideo}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">State *</label>
                          <input
                            type="text"
                            name="state"
                            required
                            defaultValue={editingItem.data.state}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">District *</label>
                          <input
                            type="text"
                            name="district"
                            required
                            defaultValue={editingItem.data.district}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">City / Town *</label>
                          <input
                            type="text"
                            name="city"
                            required
                            defaultValue={editingItem.data.city}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Professional Bio / Description</label>
                          <textarea
                            name="bio"
                            rows={3}
                            defaultValue={editingItem.data.bio || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                      </div>
                    ) : editingItem.type === 'clinic' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Clinic Fields */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Clinical Facility Name *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            defaultValue={editingItem.data.name}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Clinical Lead / Owner Name *</label>
                          <input
                            type="text"
                            name="ownerName"
                            required
                            defaultValue={editingItem.data.ownerName || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Trade License Registration Number *</label>
                          <input
                            type="text"
                            name="tradeLicenseNumber"
                            required
                            defaultValue={editingItem.data.tradeLicenseNumber || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono text-indigo-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Facility Contact Phone *</label>
                          <input
                            type="text"
                            name="phone"
                            required
                            defaultValue={editingItem.data.phone || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Facility Contact Email *</label>
                          <input
                            type="email"
                            name="email"
                            required
                            defaultValue={editingItem.data.email || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Operation Hours / Timings *</label>
                          <input
                            type="text"
                            name="timings"
                            required
                            defaultValue={editingItem.data.timings || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">State *</label>
                          <input
                            type="text"
                            name="state"
                            required
                            defaultValue={editingItem.data.state || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">District *</label>
                          <input
                            type="text"
                            name="district"
                            required
                            defaultValue={editingItem.data.district || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">City / Town *</label>
                          <input
                            type="text"
                            name="city"
                            required
                            defaultValue={editingItem.data.city || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Detailed physical Address *</label>
                          <textarea
                            name="address"
                            required
                            rows={2}
                            defaultValue={editingItem.data.address || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Partner Fields */}
                        <div className="md:col-span-2 border-b border-gray-100 pb-2 mb-2">
                          <span className="text-xs font-black text-indigo-700 uppercase">👤 Personal & Contact Information</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Partner Full Name *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            defaultValue={editingItem.data.name}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Father's or Husband's Name</label>
                          <input
                            type="text"
                            name="fatherOrHusbandName"
                            defaultValue={editingItem.data.fatherOrHusbandName || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            required
                            defaultValue={editingItem.data.email || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Mobile Phone *</label>
                          <input
                            type="text"
                            name="phone"
                            required
                            defaultValue={editingItem.data.phone || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Gender</label>
                          <select
                            name="gender"
                            defaultValue={editingItem.data.gender || 'Male'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] bg-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            defaultValue={editingItem.data.dob || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>

                        <div className="md:col-span-2 border-b border-gray-100 pb-2 mb-2 mt-2">
                          <span className="text-xs font-black text-indigo-700 uppercase">🪪 Identity Verification Documents</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Aadhaar Card Number *</label>
                          <input
                            type="text"
                            name="aadhaarNumber"
                            required
                            defaultValue={editingItem.data.aadhaarNumber || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono text-indigo-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">PAN Card Number *</label>
                          <input
                            type="text"
                            name="panNumber"
                            required
                            defaultValue={editingItem.data.panNumber || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono text-indigo-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Voter ID Number</label>
                          <input
                            type="text"
                            name="voterIdNumber"
                            defaultValue={editingItem.data.voterIdNumber || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Languages Spoken / Written</label>
                          <input
                            type="text"
                            name="languagesSpokenWritten"
                            defaultValue={editingItem.data.languagesSpokenWritten || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                            placeholder="e.g. English, Hindi, Bengali"
                          />
                        </div>

                        <div className="md:col-span-2 border-b border-gray-100 pb-2 mb-2 mt-2">
                          <span className="text-xs font-black text-indigo-700 uppercase">🌍 Assigned Territory & Franchise Locks</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Partner Level</label>
                          <select
                            name="partnerType"
                            defaultValue={editingItem.data.partnerType || 'District'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] bg-white"
                          >
                            <option value="District">District</option>
                            <option value="State">State</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Assigned State Area</label>
                          <input
                            type="text"
                            name="assignedState"
                            required
                            defaultValue={editingItem.data.assignedState}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Assigned District Area</label>
                          <input
                            type="text"
                            name="assignedDistrict"
                            defaultValue={editingItem.data.assignedDistrict || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                            placeholder="N/A for State level partners"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Home Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            defaultValue={editingItem.data.pincode || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono"
                          />
                        </div>

                        <div className="md:col-span-2 border-b border-gray-100 pb-2 mb-2 mt-2">
                          <span className="text-xs font-black text-indigo-700 uppercase">🏍️ Logistics & Transport Assets</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Owns two-wheeler / Bike?</label>
                          <select
                            name="ownsBike"
                            defaultValue={editingItem.data.ownsBike ? "true" : "false"}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] bg-white"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Bike Registration Number</label>
                          <input
                            type="text"
                            name="bikeRegistrationNumber"
                            defaultValue={editingItem.data.bikeRegistrationNumber || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Bike Model & Mileage</label>
                          <input
                            type="text"
                            name="bikeModel"
                            defaultValue={editingItem.data.bikeModel || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                            placeholder="e.g. Hero Splendor, 65kmpl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Driving License Number</label>
                          <input
                            type="text"
                            name="drivingLicenseNumber"
                            defaultValue={editingItem.data.drivingLicenseNumber || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E] font-mono"
                          />
                        </div>

                        <div className="md:col-span-2 border-b border-gray-100 pb-2 mb-2 mt-2">
                          <span className="text-xs font-black text-indigo-700 uppercase">📝 Statement of Purpose / Bio</span>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Statement / Bio (About Partner)</label>
                          <textarea
                            name="aboutPartner500Words"
                            rows={3}
                            defaultValue={editingItem.data.aboutPartner500Words || ''}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-6 space-y-4 bg-[#F5F9F9] border border-[#D1E5E5] p-5 rounded-2xl lg:sticky lg:top-0">
                    <div className="flex items-center justify-between border-b border-[#D1E5E5] pb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          🛡️ Submitted Credentials Hub
                        </h4>
                        <p className="text-[10px] text-gray-500 font-medium">Verified State-Level & District-Level original uploads</p>
                      </div>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                        ✓ Pre-Validated
                      </span>
                    </div>

                    {/* 🕒 Profile Creation Time Info Card */}
                    {(() => {
                      const getCreationTime = () => {
                        if (!editingItem || !editingItem.data) return 'June 26, 2026, 10:24 AM UTC';
                        const rawDate = editingItem.data.createdAt || editingItem.data.uploadedAt || '2026-06-26T10:24:00.000Z';
                        try {
                          const d = new Date(rawDate);
                          if (!isNaN(d.getTime())) {
                            return d.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              timeZoneName: 'short'
                            });
                          }
                        } catch (e) {}
                        return String(rawDate);
                      };

                      return (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-2.5">
                          <div className="flex items-center gap-2 text-[#0A6E6E] font-black text-[10px] uppercase tracking-wider">
                            <Clock className="w-4 h-4 text-[#0A6E6E]" />
                            <span>Registration Timeline Profile Details</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[10px]">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-150">
                              <span className="text-gray-400 block font-bold uppercase text-[7px] tracking-wider">Profile Creation Time</span>
                              <span className="font-extrabold text-slate-800 mt-0.5 block">{getCreationTime()}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-gray-150">
                              <span className="text-gray-400 block font-bold uppercase text-[7px] tracking-wider">Application Channel</span>
                              <span className="font-extrabold text-slate-800 mt-0.5 block capitalize">
                                {editingItem.type === 'doctor' ? 'Professional Practitioner API' : editingItem.type === 'clinic' ? 'Hospital Registry Sync' : 'Direct Field Partner App'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Security signature verified on {getCreationTime().split(' at')[0] || 'June 26, 2026'}. Original payload cryptographically signed.</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 📂 Uploaded All Documents List */}
                    {(() => {
                      const data = editingItem.data;
                      const docs = [];

                      if (editingItem.type === 'doctor') {
                        docs.push({ id: 'aadhaar', name: data.ownerIdProofDoc || `Dr_${data.name.replace(/\s+/g, '_')}_Aadhaar.pdf`, label: 'Aadhaar Identity Proof', size: '1.2 MB', type: 'PDF' });
                        docs.push({ id: 'mci', name: `MCI_Certificate_${data.registrationNumber || 'REG7382'}.pdf`, label: 'MCI Registration Certificate', size: '2.4 MB', type: 'PDF' });
                        docs.push({ id: 'clinicLetter', name: data.clinicAssociationLetter || 'Clinic_Consent_Form.pdf', label: 'Clinic Consent Letter', size: '1.5 MB', type: 'PDF' });
                        docs.push({ id: 'degree', name: `Degree_${data.education ? data.education.replace(/\s+/g, '_') : 'MBBS'}_Certificate.pdf`, label: 'Highest Degree Certificate', size: '1.8 MB', type: 'PDF' });
                      } else if (editingItem.type === 'clinic') {
                        docs.push({ id: 'license', name: (data.licenseDocuments && data.licenseDocuments[0]) || `Trade_License_${data.tradeLicenseNumber || 'TL9382'}.pdf`, label: 'Clinical Trade License', size: '2.1 MB', type: 'PDF' });
                        docs.push({ id: 'pcb', name: 'Pollution_Control_BioWaste_Certificate.pdf', label: 'Pollution Board Consent', size: '1.6 MB', type: 'PDF' });
                        docs.push({ id: 'fire', name: 'Fire_NOC_Safety_Compliance.pdf', label: 'Fire NOC Certificate', size: '1.4 MB', type: 'PDF' });
                        docs.push({ id: 'blueprint', name: 'Facility_Equipment_Layout_Photos.zip', label: 'Clinic Floorplan Blueprint', size: '14.5 MB', type: 'ZIP' });
                      } else if (editingItem.type === 'partner') {
                        docs.push({ id: 'aadhaar', name: data.aadhaarNumber ? `Aadhaar_${data.aadhaarNumber}.pdf` : `${data.name.replace(/\s+/g, '_')}_Aadhaar.pdf`, label: 'Aadhaar Identity Proof', size: '1.1 MB', type: 'PDF' });
                        docs.push({ id: 'pan', name: data.panNumber ? `PAN_${data.panNumber}.pdf` : `${data.name.replace(/\s+/g, '_')}_PAN.pdf`, label: 'PAN Tax Document', size: '850 KB', type: 'PDF' });
                        if (data.voterIdNumber) {
                          docs.push({ id: 'voter', name: `Voter_${data.voterIdNumber}.pdf`, label: 'Voter ID Identification Card', size: '920 KB', type: 'PDF' });
                        }
                        if (data.drivingLicenseNumber) {
                          docs.push({ id: 'driving', name: `DL_${data.drivingLicenseNumber}.pdf`, label: 'Driving License Permit', size: '1.2 MB', type: 'PDF' });
                        }
                        if (data.bikeRegistrationNumber) {
                          docs.push({ id: 'rc', name: `Vehicle_RC_${data.bikeRegistrationNumber}.pdf`, label: 'Vehicle Registration (RC)', size: '1.1 MB', type: 'PDF' });
                        }
                        // Actual Uploaded Files from Registration Form
                        docs.push({ id: 'uploaded-identity', name: data.identityProofFileName || 'identity_proof.pdf', label: 'Uploaded Identity Proof File', size: '1.4 MB', type: 'FILE' });
                        docs.push({ id: 'uploaded-qualification', name: data.highestQualificationFileName || 'highest_qualification.pdf', label: 'Uploaded Qualification File', size: '1.8 MB', type: 'FILE' });
                        docs.push({ id: 'uploaded-experience', name: data.experienceCertificateFileName || 'experience_certificate.pdf', label: 'Uploaded Experience File', size: '1.5 MB', type: 'FILE' });
                        docs.push({ id: 'uploaded-other', name: data.otherDocFileName || 'N/A', label: 'Uploaded Other Document', size: '1.2 MB', type: 'FILE' });
                      }

                      const activeTabId = editingItem.type === 'doctor' ? activeDoctorDocTab : editingItem.type === 'clinic' ? activeClinicDocTab : activePartnerDocTab;
                      const setActiveTabId = (id: any) => {
                        if (editingItem.type === 'doctor') setActiveDoctorDocTab(id);
                        else if (editingItem.type === 'clinic') setActiveClinicDocTab(id);
                        else if (editingItem.type === 'partner') setActivePartnerDocTab(id);
                      };

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-[#0A6E6E]" /> Uploaded Document Assets ({docs.length})
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold">Click to Preview Document Below</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {docs.map((doc) => {
                              const isActive = activeTabId === doc.id;
                              return (
                                <button
                                  key={doc.id}
                                  type="button"
                                  onClick={() => setActiveTabId(doc.id)}
                                  className={`flex items-start text-left gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-[#EBF7F7] border-[#0A6E6E] shadow-sm ring-1 ring-[#0A6E6E]'
                                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <FileText className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1 leading-normal text-[9px]">
                                    <div className="font-extrabold text-slate-800 truncate">{doc.label}</div>
                                    <div className="font-mono text-gray-400 truncate mt-0.5">{doc.name}</div>
                                    <div className="flex items-center gap-1.5 mt-1 font-bold text-[8px]">
                                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-black">{doc.type}</span>
                                      <span className="text-gray-400">{doc.size}</span>
                                      {isActive && (
                                        <span className="text-[#0A6E6E] ml-auto font-black flex items-center gap-0.5">
                                          ✓ Previewing
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Beautiful Document Viewbox Panel */}
                          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                📄 Rendered Document Preview:
                              </span>
                              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-black">
                                {docs.find(d => d.id === activeTabId)?.name || 'Document'}
                              </span>
                            </div>

                            {/* Conditional Rendering of active simulator */}
                            {editingItem.type === 'doctor' && (
                              <div>
                                {activeTabId === 'aadhaar' && (
                                  /* Beautiful Aadhaar Card Simulator */
                                  <div className="relative border border-slate-300 rounded-xl bg-gradient-to-b from-amber-50/20 via-white to-emerald-50/20 p-4 shadow-sm overflow-hidden min-h-[180px]">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />

                                    <div className="flex justify-between items-start border-b border-gray-100 pb-1.5 mb-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-lg">🇮🇳</span>
                                        <div className="text-[8px] font-bold text-gray-500 leading-tight">
                                          <span className="text-amber-700 block">भारत सरकार</span>
                                          <span className="text-emerald-700 block">GOVERNMENT OF INDIA</span>
                                        </div>
                                      </div>
                                      <div className="text-right text-[7px] font-bold text-gray-400 leading-none">
                                        <span className="block text-indigo-800 font-black">Unique Identification Authority of India</span>
                                        <span className="block mt-0.5 text-[6px]">भारतीय विशिष्ट पहचान प्राधिकरण</span>
                                      </div>
                                    </div>

                                    <div className="flex gap-3">
                                      <div className="w-16 h-20 bg-slate-100 border border-gray-300 rounded overflow-hidden shrink-0 shadow-inner">
                                        <img 
                                          src={editingItem.data.photo || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'} 
                                          alt="Aadhaar Holder" 
                                          className="w-full h-full object-cover grayscale brightness-110"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>

                                      <div className="space-y-1 text-[9px] text-gray-700 font-medium">
                                        <div>
                                          <span className="text-gray-400 block text-[7px] font-bold">NAME / नाम</span>
                                          <span className="font-extrabold text-slate-800 uppercase">{editingItem.data.name}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-gray-400 block text-[7px] font-bold">DOB / जन्म तिथि</span>
                                            <span className="font-bold text-slate-800">18/04/1982</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400 block text-[7px] font-bold">GENDER / लिंग</span>
                                            <span className="font-bold text-slate-800">{editingItem.data.gender || 'Male'}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[7px] font-bold">REGISTRATION NO.</span>
                                          <span className="font-mono text-indigo-700 font-bold">{editingItem.data.registrationNumber}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 text-center border-t border-dashed border-gray-200 pt-2">
                                      <span className="font-mono text-xs font-black text-slate-800 tracking-widest bg-slate-50 px-3 py-1 rounded border border-gray-100">
                                        XXXX XXXX {editingItem.data.registrationNumber ? editingItem.data.registrationNumber.substring(0, 4) : '3829'}
                                      </span>
                                      <p className="text-[6px] text-emerald-800 font-bold uppercase tracking-wider mt-1.5">
                                        मेरा आधार, मेरी पहचान (My Aadhaar, My Identity)
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'mci' && (
                                  /* Beautiful MCI Certificate Simulator */
                                  <div className="relative border-2 border-double border-red-800 rounded-xl bg-gradient-to-b from-red-50/5 via-white to-red-50/10 p-4 shadow-sm overflow-hidden min-h-[180px] text-red-950 font-serif">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                      <Award className="w-32 h-32 text-red-800" />
                                    </div>
                                    <div className="text-center space-y-0.5 border-b border-red-800/20 pb-2 mb-2">
                                      <span className="text-[6px] font-black uppercase text-red-800 block tracking-widest leading-none">
                                        MEDICAL COUNCIL OF INDIA / भारतीय आयुर्विज्ञान परिषद्
                                      </span>
                                      <h5 className="font-extrabold text-[9px] text-red-900 leading-tight uppercase">
                                        Certificate of Medical Registration
                                      </h5>
                                      <p className="text-[5px] text-gray-500 font-sans font-semibold italic">
                                        Granted under the Medical Council Act, 1956
                                      </p>
                                    </div>
                                    <div className="space-y-1.5 text-[8px] font-sans">
                                      <p className="text-[7px] leading-relaxed text-slate-700 italic">
                                        This is to certify that the medical practitioner named below has been duly registered as a Registered Medical Practitioner under MCI laws:
                                      </p>
                                      <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">PRACTITIONER NAME</span>
                                          <span className="font-extrabold text-slate-800 uppercase block">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">MCI REGISTRATION NO.</span>
                                          <span className="font-mono text-indigo-700 font-extrabold block">{editingItem.data.registrationNumber}</span>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">QUALIFICATIONS</span>
                                          <span className="font-bold text-slate-800 block uppercase">{editingItem.data.education || 'MBBS, MD'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">REGISTRATION DATE</span>
                                          <span className="font-bold text-slate-800 block">14th Sept 2018</span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-end pt-2 border-t border-red-800/10 mt-2 font-sans">
                                        <span className="text-[5px] text-gray-400 font-bold block">
                                          Verified via MCI Central Registry Index lookup
                                        </span>
                                        <div className="text-[6px] font-extrabold text-red-800 border border-red-800/50 px-1.5 py-0.5 rounded bg-white shadow-2xs">
                                          ✓ VERIFIED PRACTITIONER
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'clinicLetter' && (
                                  /* Beautiful Clinic Letterhead Simulator */
                                  <div className="relative border border-slate-200 rounded-xl bg-white p-4 shadow-sm overflow-hidden min-h-[180px] text-slate-800 font-sans">
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-2">
                                      <div>
                                        <h5 className="font-black text-[10px] text-[#0A6E6E] uppercase tracking-wide">
                                          {editingItem.data.clinicName || 'Apex Healthcare Clinic'}
                                        </h5>
                                        <p className="text-[5px] text-gray-400 font-bold">
                                          PRIMARY CARE • DIAGNOSTICS • OUTPATIENT SERVICE
                                        </p>
                                      </div>
                                      <div className="text-right text-[5px] text-gray-400 font-semibold leading-tight">
                                        <span className="block">Email: info@clinicregistry.in</span>
                                        <span className="block">Tel: +91 20 8392 1029</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 text-[8px] text-slate-700">
                                      <div className="flex justify-between text-[6px] font-bold text-gray-400">
                                        <span>REF: REG/CONSENT/2026/892</span>
                                        <span>DATE: 12th May 2026</span>
                                      </div>
                                      <h6 className="font-bold text-slate-800 text-center uppercase tracking-wider text-[7px] underline">
                                        Clinic Affiliation Consent Letter
                                      </h6>
                                      <p className="leading-relaxed text-[7px]">
                                        We hereby confirm that <strong>Dr. {editingItem.data.name}</strong> is registered as an active consultant physician at our facility. We have no objection to their digital integration with the mobile healthcare platform for providing clinical consultation services.
                                      </p>
                                      <div className="flex justify-between items-end pt-2">
                                        <div className="text-[5px] text-gray-400">
                                          <span className="block font-black">Authorized Signatory</span>
                                          <span className="block">Clinic Health Administration Board</span>
                                        </div>
                                        <div className="text-center shrink-0">
                                          <div className="text-[5px] font-extrabold text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded bg-indigo-50/50 uppercase">
                                            ✓ CLINIC SEAL
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'degree' && (
                                  /* Beautiful Medical Degree Simulator */
                                  <div className="relative border-2 border-amber-600 rounded-xl bg-gradient-to-b from-amber-50/10 via-amber-50/5 to-white p-4 shadow-sm overflow-hidden min-h-[180px] text-slate-900 font-serif">
                                    <div className="absolute inset-0.5 border border-amber-600/30 rounded-lg pointer-events-none" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                      <Award className="w-24 h-24 text-amber-600" />
                                    </div>
                                    <div className="text-center space-y-0.5 mb-1.5">
                                      <span className="text-[6px] font-bold text-amber-800 block tracking-widest leading-none">
                                        NATIONAL ACADEMY OF MEDICAL SCIENCES
                                      </span>
                                      <h5 className="font-extrabold text-[8px] text-slate-800 uppercase tracking-wide">
                                        DOCTOR OF MEDICINE
                                      </h5>
                                      <p className="text-[4px] text-gray-400 font-sans">
                                        UPON THE RECOMMENDATION OF THE ACADEMIC COUNCIL
                                      </p>
                                    </div>
                                    <div className="text-center space-y-1 text-[7px] leading-relaxed text-slate-700 italic">
                                      <p>Be it known that</p>
                                      <p className="font-sans font-extrabold text-slate-900 uppercase not-italic tracking-wider text-[8px] my-0.5">
                                        Dr. {editingItem.data.name}
                                      </p>
                                      <p className="leading-tight text-[6px]">having completed the prescribed course of postgraduate clinical studies, medical practice, and passing examinations is admitted to the degree of</p>
                                      <p className="font-sans font-black text-amber-900 uppercase not-italic tracking-wide text-[8px]">
                                        {editingItem.data.education || 'MBBS, DOCTOR OF MEDICINE'}
                                      </p>
                                    </div>
                                    <div className="flex justify-between items-end pt-2 border-t border-amber-600/10 mt-2 font-sans">
                                      <div className="text-[4px] text-gray-400 leading-tight">
                                        <span>Awarded: India</span>
                                        <span className="block">Credential Reference: NAMS-2016-83921</span>
                                      </div>
                                      <div className="w-5 h-5 rounded-full border border-amber-500 bg-amber-100 flex items-center justify-center text-[4px] font-black text-amber-800 shrink-0 shadow-sm rotate-12">
                                        SEAL
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {editingItem.type === 'clinic' && (
                              <div>
                                {activeTabId === 'license' && (
                                  /* Beautiful State Trade License Simulator */
                                  <div className="relative border border-emerald-800 rounded-xl bg-gradient-to-b from-white via-emerald-50/5 to-emerald-50/10 p-4 shadow-sm overflow-hidden min-h-[180px] text-emerald-950">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                      <ShieldCheck className="w-40 h-40 text-emerald-800" />
                                    </div>
                                    <div className="absolute inset-1 border border-emerald-800/30 rounded-lg pointer-events-none" />

                                    <div className="text-center space-y-0.5 border-b border-emerald-800/20 pb-2 mb-2">
                                      <span className="text-[6px] font-black uppercase text-emerald-800 block tracking-wider leading-none">
                                        Municipal Corporation & Health Administration Dept.
                                      </span>
                                      <h5 className="font-black text-[9px] text-emerald-900 leading-tight uppercase">
                                        FORM IX: CLINICAL ESTABLISHMENT LICENSE
                                      </h5>
                                      <p className="text-[5px] text-gray-500 font-semibold">
                                        Granted under the Clinical Establishments (Registration and Regulation) Act, 2010
                                      </p>
                                    </div>

                                    <div className="space-y-1.5 text-[8px]">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">FACILITY NAME / प्रतिष्ठान नाम</span>
                                          <span className="font-extrabold text-slate-800 uppercase block">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">LICENSE NO. / अनुज्ञप्ति संख्या</span>
                                          <span className="font-mono text-indigo-700 font-extrabold block">{editingItem.data.tradeLicenseNumber || 'TL-29482103'}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">OWNER / PROPRIETOR</span>
                                          <span className="font-bold text-slate-800 uppercase block">{editingItem.data.ownerName || 'Dr. Representative'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">LOCATION AUTHORITY</span>
                                          <span className="font-bold text-slate-800 block">{editingItem.data.city}, {editingItem.data.state}</span>
                                        </div>
                                      </div>

                                      <div>
                                        <span className="text-gray-400 block text-[6px] font-bold">REGISTERED CLINIC ADDRESS</span>
                                        <p className="font-medium text-slate-700 leading-tight truncate">{editingItem.data.address || 'Address Details'}</p>
                                      </div>

                                      <div className="flex justify-between items-end pt-2 border-t border-emerald-800/10">
                                        <div className="text-[5px] text-gray-400 font-semibold leading-tight">
                                          <span className="block">Issue Date: 12/04/2026</span>
                                          <span className="block text-emerald-800 font-bold">Valid Till: 31st March, 2029</span>
                                        </div>
                                        <div className="text-center relative shrink-0">
                                          <div className="text-[5px] font-extrabold text-emerald-800 border border-emerald-800/50 px-2 py-0.5 rounded bg-white shadow-2xs rotate-[-2deg]">
                                            ✓ DIGITAL SIGNATURE
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'pcb' && (
                                  /* Beautiful PCB Bio-Waste Permit Simulator */
                                  <div className="relative border-2 border-emerald-700 rounded-xl bg-gradient-to-b from-white to-emerald-50/10 p-4 shadow-sm overflow-hidden min-h-[180px] text-slate-800 font-sans">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                      <Activity className="w-32 h-32 text-emerald-800" />
                                    </div>
                                    <div className="text-center space-y-0.5 border-b border-emerald-800/20 pb-2 mb-2">
                                      <span className="text-[6px] font-black uppercase text-emerald-800 block tracking-wider leading-none">
                                        STATE POLLUTION CONTROL BOARD
                                      </span>
                                      <h5 className="font-black text-[9px] text-emerald-900 leading-tight uppercase">
                                        CONSENT FOR BIO-MEDICAL WASTE HANDLING
                                      </h5>
                                      <p className="text-[5px] text-gray-500 font-semibold">
                                        Under Bio-Medical Waste Management Rules, 2016
                                      </p>
                                    </div>
                                    <div className="space-y-1.5 text-[8px]">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">FACILITY AUTHORIZED</span>
                                          <span className="font-extrabold text-slate-800 uppercase block">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">AUTHORIZATION NO.</span>
                                          <span className="font-mono text-indigo-700 font-extrabold block">PCB/BMW-2026/9283</span>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">AUTHORIZED WASTE TYPE</span>
                                          <span className="font-bold text-slate-800 block">Category A, B, C & D Liquids</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">DISPOSAL CHANNEL</span>
                                          <span className="font-bold text-slate-800 block">Treatment Facility Link</span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-end pt-2 border-t border-emerald-800/10 mt-1">
                                        <span className="text-[5px] text-gray-400 font-semibold leading-tight">
                                          Valid Till: 31st May 2031
                                        </span>
                                        <div className="text-[5px] font-extrabold text-white bg-emerald-700 px-1.5 py-0.5 rounded shadow-2xs uppercase">
                                          ✓ COMPLIANT PCB
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'fire' && (
                                  /* Beautiful Fire Safety NOC Certificate Simulator */
                                  <div className="relative border-2 border-red-600 rounded-xl bg-gradient-to-b from-white to-red-50/10 p-4 shadow-sm overflow-hidden min-h-[180px] text-slate-800 font-sans">
                                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                      <ShieldCheck className="w-32 h-32 text-red-600" />
                                    </div>
                                    <div className="text-center space-y-0.5 border-b border-red-600/20 pb-2 mb-2">
                                      <span className="text-[6px] font-black uppercase text-red-600 block tracking-wider leading-none">
                                        STATE FIRE & EMERGENCY SERVICES DEPT.
                                      </span>
                                      <h5 className="font-black text-[9px] text-red-700 leading-tight uppercase">
                                        NO OBJECTION CERTIFICATE (FIRE NOC)
                                      </h5>
                                      <p className="text-[5px] text-gray-500 font-semibold">
                                        Under State Fire Safety Act Rules
                                      </p>
                                    </div>
                                    <div className="space-y-1.5 text-[8px]">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">BUILDING OCCUPANT</span>
                                          <span className="font-extrabold text-slate-800 uppercase block">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">NOC CLEARANCE NO.</span>
                                          <span className="font-mono text-indigo-700 font-extrabold block">FIRE-NOC/2026/839</span>
                                        </div>
                                      </div>
                                      <p className="text-[7px] leading-relaxed text-slate-600 italic">
                                        This is to certify that the medical clinic facility has undergone safety inspections and is equipped with functional safety assets complying with regulations.
                                      </p>
                                      <div className="flex justify-between items-end pt-2 border-t border-red-600/10">
                                        <span className="text-[5px] text-gray-400 font-semibold leading-tight">
                                          Annual Inspection Status: Approved
                                        </span>
                                        <div className="text-[5px] font-extrabold text-red-700 border border-red-500 px-1.5 py-0.5 rounded bg-white shadow-2xs uppercase">
                                          ✓ FIRE SAFE
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'blueprint' && (
                                  /* Beautiful Clinic Floorplan Blueprint Simulator */
                                  <div className="relative border border-blue-400 rounded-xl bg-[#0B2545] p-4 shadow-sm overflow-hidden min-h-[180px] text-blue-100 font-mono">
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                                    <div className="relative z-10 space-y-2 text-[8px]">
                                      <div className="border-b border-blue-400/30 pb-1.5 flex justify-between items-start">
                                        <div>
                                          <span className="text-[6px] text-blue-300 block">FACILITY ARCHITECTURAL SCHEMATIC</span>
                                          <h5 className="font-black text-[9px] text-white uppercase truncate max-w-[150px]">{editingItem.data.name}</h5>
                                        </div>
                                        <span className="text-[5px] border border-blue-300 px-1 py-0.2 text-blue-200 shrink-0">SCALE: 1:50</span>
                                      </div>

                                      <div className="border border-blue-400/40 rounded bg-blue-950/50 p-2 h-16 flex flex-col justify-between font-mono text-[5px] text-blue-300">
                                        <div className="flex justify-between border-b border-blue-400/10 pb-0.5">
                                          <span>[ WAITING - 12'x14' ]</span>
                                          <span>[ OPD CABIN 1 - 10'x12' ]</span>
                                        </div>
                                        <div className="flex justify-between border-b border-blue-400/10 py-0.5">
                                          <span>[ RECEPTION - 8'x10' ]</span>
                                          <span>[ DISPENSARY - 10'x12' ]</span>
                                        </div>
                                        <div className="text-center text-[4px] text-blue-400">
                                          EMERGENCY FIRE EXIT ROUTE CLEAR
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-end text-[6px] text-blue-300 pt-1">
                                        <div>
                                          <span>Approved Area: 1,450 sq ft</span>
                                          <span className="block text-[5px]">Layout ID: L-CLINIC-938210</span>
                                        </div>
                                        <div className="text-[6px] font-extrabold text-blue-100 border border-blue-400/60 px-1.5 py-0.5 rounded bg-blue-900/50 uppercase">
                                          APPROVED LAYOUT
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {editingItem.type === 'partner' && (
                              <div>
                                {activeTabId === 'aadhaar' && (
                                  /* Aadhaar Card Simulator for Partner */
                                  <div className="relative border border-slate-300 rounded-xl bg-gradient-to-b from-amber-50/20 via-white to-emerald-50/20 p-4 shadow-sm overflow-hidden min-h-[180px]">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />

                                    <div className="flex justify-between items-start border-b border-gray-100 pb-1.5 mb-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-lg">🇮🇳</span>
                                        <div className="text-[8px] font-bold text-gray-500 leading-tight">
                                          <span className="text-amber-700 block">भारत सरकार</span>
                                          <span className="text-emerald-700 block">GOVERNMENT OF INDIA</span>
                                        </div>
                                      </div>
                                      <div className="text-right text-[7px] font-bold text-gray-400 leading-none">
                                        <span className="block text-indigo-800 font-black">Unique Identification Authority of India</span>
                                        <span className="block mt-0.5 text-[6px]">भारतीय विशिष्ट पहचान प्राधिकरण</span>
                                      </div>
                                    </div>

                                    <div className="flex gap-3">
                                      <div className="w-14 h-18 bg-slate-100 border border-gray-300 rounded overflow-hidden shrink-0 shadow-inner">
                                        <img 
                                          src={editingItem.data.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'} 
                                          alt="Aadhaar Holder" 
                                          className="w-full h-full object-cover grayscale brightness-110"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>

                                      <div className="space-y-1 text-[9px] text-gray-700 font-medium">
                                        <div>
                                          <span className="text-gray-400 block text-[7px] font-bold">NAME / नाम</span>
                                          <span className="font-extrabold text-slate-800 uppercase">{editingItem.data.name}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-gray-400 block text-[7px] font-bold">DOB / जन्म तिथि</span>
                                            <span className="font-bold text-slate-800">{editingItem.data.dob || '12/10/1990'}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400 block text-[7px] font-bold">GENDER / लिंग</span>
                                            <span className="font-bold text-slate-800">{editingItem.data.gender || 'Male'}</span>
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[7px] font-bold">FATHER/HUSBAND NAME</span>
                                          <span className="font-bold text-slate-800 uppercase">{editingItem.data.fatherOrHusbandName || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 text-center border-t border-dashed border-gray-200 pt-2">
                                      <span className="font-mono text-xs font-black text-slate-800 tracking-widest bg-slate-50 px-3 py-1 rounded border border-gray-100">
                                        {editingItem.data.aadhaarNumber ? 
                                          `${editingItem.data.aadhaarNumber.substring(0,4)} ${editingItem.data.aadhaarNumber.substring(4,8)} ${editingItem.data.aadhaarNumber.substring(8,12)}` : 
                                          "XXXX XXXX 8392"
                                        }
                                      </span>
                                      <p className="text-[6px] text-emerald-800 font-bold uppercase tracking-wider mt-1.5">
                                        मेरा आधार, मेरी पहचान (My Aadhaar, My Identity)
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'pan' && (
                                  /* PAN Card Simulator */
                                  <div className="relative border border-teal-900 rounded-xl bg-gradient-to-b from-teal-800 via-teal-900 to-teal-950 text-white p-4 shadow-md overflow-hidden min-h-[180px]">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-600" />

                                    <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-2">
                                      <div className="text-[8px] font-black uppercase tracking-wider">
                                        <span className="block">आयकर विभाग, भारत सरकार</span>
                                        <span className="block text-[7px] text-teal-100 mt-0.5">INCOME TAX DEPARTMENT, GOVT. OF INDIA</span>
                                      </div>
                                      <span className="text-sm">🇮🇳</span>
                                    </div>

                                    <div className="flex gap-3">
                                      <div className="w-14 h-16 bg-slate-100 border border-teal-800/50 rounded overflow-hidden shrink-0">
                                        <img 
                                          src={editingItem.data.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'} 
                                          alt="PAN Holder" 
                                          className="w-full h-full object-cover grayscale"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>

                                      <div className="space-y-1 text-[8px] text-teal-50">
                                        <div>
                                          <span className="text-teal-300 block text-[6px] font-bold">NAME / नाम</span>
                                          <span className="font-extrabold text-white uppercase block">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-teal-300 block text-[6px] font-bold">FATHER'S NAME / पिता का नाम</span>
                                          <span className="font-bold text-white uppercase block">{editingItem.data.fatherOrHusbandName || 'N/A'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-teal-300 block text-[6px] font-bold">DOB / जन्म तिथि</span>
                                            <span className="font-bold text-white block">{editingItem.data.dob || '12/10/1990'}</span>
                                          </div>
                                          <div>
                                            <span className="text-teal-300 block text-[6px] font-bold">CARD TYPE</span>
                                            <span className="font-bold text-emerald-300 block">INDIVIDUAL</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-2.5 flex justify-between items-center bg-teal-950/40 p-1.5 rounded border border-white/5">
                                      <div>
                                        <span className="text-teal-400 text-[6px] block font-bold">PERMANENT ACCOUNT NUMBER / स्थायी लेखा संख्या</span>
                                        <span className="font-mono text-xs font-black tracking-wider text-amber-300">
                                          {editingItem.data.panNumber || 'AMPPD2934D'}
                                        </span>
                                      </div>
                                      <div className="text-center bg-white/10 px-2 py-0.5 rounded text-[6px] font-extrabold border border-white/5">
                                        ✓ QR SECURE
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'driving' && (
                                  /* Driving License Simulator */
                                  <div className="relative border border-indigo-300 rounded-xl bg-gradient-to-b from-indigo-50/10 via-white to-blue-50/20 p-4 shadow-sm overflow-hidden min-h-[180px]">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

                                    <div className="flex justify-between items-start border-b border-gray-100 pb-1.5 mb-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-lg">🇮🇳</span>
                                        <div className="text-[7px] font-extrabold text-indigo-900 leading-tight">
                                          <span className="block">UNION OF INDIA - DRIVING LICENSE</span>
                                          <span className="block text-[6px] text-gray-400">STATE TRANSPORT DEPARTMENT</span>
                                        </div>
                                      </div>
                                      <span className="text-[6px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-black">
                                        SMART CARD DL
                                      </span>
                                    </div>

                                    <div className="flex gap-3">
                                      <div className="w-14 h-16 bg-slate-100 border border-gray-300 rounded overflow-hidden shrink-0">
                                        <img 
                                          src={editingItem.data.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'} 
                                          alt="DL Holder" 
                                          className="w-full h-full object-cover grayscale brightness-110"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>

                                      <div className="space-y-1 text-[8px] text-gray-700 font-medium">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">LICENSE NO. / अनुज्ञप्ति संख्या</span>
                                          <span className="font-mono font-extrabold text-slate-800">{editingItem.data.drivingLicenseNumber || 'DL-29381029'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">NAME / नाम</span>
                                          <span className="font-extrabold text-slate-800 uppercase">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">VEHICLE CLASS PERMISSION</span>
                                          <span className="font-extrabold text-indigo-700">
                                            {editingItem.data.ownsBike ? "MCWG (MOTORCYCLE) / LMV" : "LMV ONLY"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 bg-slate-50 p-2 rounded border border-gray-100 flex justify-between items-center text-[7px] text-gray-500 font-bold">
                                      <div>
                                        <span className="block">DOB: {editingItem.data.dob || '12/10/1990'}</span>
                                        <span className="block mt-0.5 text-emerald-700">Expiry Date: 31st Dec 2038</span>
                                      </div>
                                      <div className="w-6 h-6 border border-amber-400/50 bg-amber-50 rounded flex items-center justify-center text-[6px] font-extrabold text-amber-800 shrink-0">
                                        CHIP
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'voter' && (
                                  /* Voter ID Simulator */
                                  <div className="relative border border-red-300 rounded-xl bg-gradient-to-b from-red-50/10 via-white to-red-50/20 p-4 shadow-sm overflow-hidden min-h-[180px]">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />

                                    <div className="flex justify-between items-start border-b border-gray-100 pb-1.5 mb-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-lg">🇮🇳</span>
                                        <div className="text-[7px] font-extrabold text-red-900 leading-tight">
                                          <span className="block">ELECTION COMMISSION OF INDIA</span>
                                          <span className="block text-[6px] text-gray-400">भारत निर्वाचन आयोग</span>
                                        </div>
                                      </div>
                                      <span className="text-[6px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-black">
                                        VOTER ID CARD
                                      </span>
                                    </div>

                                    <div className="flex gap-3">
                                      <div className="w-14 h-16 bg-slate-100 border border-gray-300 rounded overflow-hidden shrink-0">
                                        <img 
                                          src={editingItem.data.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'} 
                                          alt="Voter Holder" 
                                          className="w-full h-full object-cover grayscale brightness-110"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>

                                      <div className="space-y-1 text-[8px] text-gray-700 font-medium">
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">VOTER ID NO. / पहचान पत्र संख्या</span>
                                          <span className="font-mono font-extrabold text-slate-800">{editingItem.data.voterIdNumber || 'ECI-1928310'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">NAME / नाम</span>
                                          <span className="font-extrabold text-slate-800 uppercase">{editingItem.data.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[6px] font-bold">GENDER / लिंग</span>
                                          <span className="font-bold text-slate-800">{editingItem.data.gender || 'Male'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 text-center border-t border-dashed border-gray-200 pt-2">
                                      <p className="text-[7px] text-slate-500 font-extrabold">
                                        CONSTITUENCY: {editingItem.data.assignedDistrict || 'Pune'}, {editingItem.data.assignedState || 'Maharashtra'}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'rc' && (
                                  /* Beautiful Vehicle RC Simulator */
                                  <div className="relative border border-gray-300 rounded-xl bg-gradient-to-b from-blue-50/10 via-white to-amber-50/10 p-4 shadow-sm overflow-hidden min-h-[180px]">
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-700" />

                                    <div className="flex justify-between items-start border-b border-gray-100 pb-1.5 mb-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-lg">🇮🇳</span>
                                        <div className="text-[7px] font-extrabold text-blue-900 leading-tight">
                                          <span className="block">MINISTRY OF ROAD TRANSPORT & HIGHWAYS</span>
                                          <span className="block text-[6px] text-gray-400 font-sans">CERTIFICATE OF REGISTRATION</span>
                                        </div>
                                      </div>
                                      <span className="text-[6px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black">
                                        VEHICLE RC
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[8px] text-gray-700 font-medium">
                                      <div>
                                        <span className="text-gray-400 block text-[6px] font-bold">REGISTRATION NO.</span>
                                        <span className="font-mono font-extrabold text-slate-800">{editingItem.data.bikeRegistrationNumber || 'MH-12-PQ-9382'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 block text-[6px] font-bold">REGISTERED OWNER</span>
                                        <span className="font-extrabold text-slate-800 uppercase">{editingItem.data.name}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 block text-[6px] font-bold">MAKER CLASS & MODEL</span>
                                        <span className="font-bold text-slate-800">HERO SPLENDOR+ BS6</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400 block text-[6px] font-bold">FUEL & VEHICLE TYPE</span>
                                        <span className="font-bold text-slate-800">PETROL / TWO WHEELER</span>
                                      </div>
                                    </div>

                                    <div className="mt-3 bg-slate-50 p-2 rounded border border-gray-100 flex justify-between items-center text-[7px] text-gray-500 font-bold">
                                      <div>
                                        <span className="block text-emerald-700">Insurance Valid Till: 15th Jan 2029</span>
                                        <span className="block mt-0.5 text-indigo-700 font-mono">Tax Status: L.T.T. (Paid)</span>
                                      </div>
                                      <div className="text-[6px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                                        ✓ REGISTERED
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'uploaded-identity' && (
                                  /* Uploaded Identity Proof */
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[8px] text-gray-400 block font-bold uppercase">FILE NAME / SOURCE</span>
                                        <span className="font-mono text-[10px] font-bold text-[#1A2B3C] truncate block">{editingItem.data.identityProofFileName || 'identity_proof.pdf'}</span>
                                      </div>
                                      {editingItem.data.identityProofDoc && (
                                        <a
                                          href={editingItem.data.identityProofDoc}
                                          download={editingItem.data.identityProofFileName || 'identity_proof.pdf'}
                                          className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-black text-[9px] rounded-lg transition-all shrink-0 ml-2"
                                        >
                                          Download File 📥
                                        </a>
                                      )}
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-3 min-h-[220px]">
                                      {editingItem.data.identityProofDoc ? (
                                        editingItem.data.identityProofDoc.startsWith('data:image/') ? (
                                          <img src={editingItem.data.identityProofDoc} alt="Uploaded Identity Proof" className="max-h-72 object-contain rounded-lg" referrerPolicy="no-referrer" />
                                        ) : (
                                          <iframe src={editingItem.data.identityProofDoc} className="w-full h-72 rounded-lg border-0 bg-white" title="Identity Proof Preview" />
                                        )
                                      ) : (
                                        <div className="text-center p-6 text-amber-600 bg-amber-50 rounded-xl border border-amber-200/50 max-w-sm">
                                          <span className="text-xl">⚠️</span>
                                          <p className="text-xs font-bold mt-1">No uploaded file exists for this seeded/legacy partner.</p>
                                          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Please check the simulated national ID number above or edit the profile to attach a scanned copy.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'uploaded-qualification' && (
                                  /* Uploaded Qualification Document */
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[8px] text-gray-400 block font-bold uppercase">FILE NAME / SOURCE</span>
                                        <span className="font-mono text-[10px] font-bold text-[#1A2B3C] truncate block">{editingItem.data.highestQualificationFileName || 'highest_qualification.pdf'}</span>
                                      </div>
                                      {editingItem.data.highestQualificationDoc && (
                                        <a
                                          href={editingItem.data.highestQualificationDoc}
                                          download={editingItem.data.highestQualificationFileName || 'highest_qualification.pdf'}
                                          className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-black text-[9px] rounded-lg transition-all shrink-0 ml-2"
                                        >
                                          Download File 📥
                                        </a>
                                      )}
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-3 min-h-[220px]">
                                      {editingItem.data.highestQualificationDoc ? (
                                        editingItem.data.highestQualificationDoc.startsWith('data:image/') ? (
                                          <img src={editingItem.data.highestQualificationDoc} alt="Uploaded Qualification" className="max-h-72 object-contain rounded-lg" referrerPolicy="no-referrer" />
                                        ) : (
                                          <iframe src={editingItem.data.highestQualificationDoc} className="w-full h-72 rounded-lg border-0 bg-white" title="Qualification Preview" />
                                        )
                                      ) : (
                                        <div className="text-center p-6 text-amber-600 bg-amber-50 rounded-xl border border-amber-200/50 max-w-sm">
                                          <span className="text-xl">⚠️</span>
                                          <p className="text-xs font-bold mt-1">No uploaded file exists for this seeded/legacy partner.</p>
                                          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Please check the simulated qualifications or edit the profile to attach a scanned copy.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'uploaded-experience' && (
                                  /* Uploaded Experience Certificate */
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[8px] text-gray-400 block font-bold uppercase">FILE NAME / SOURCE</span>
                                        <span className="font-mono text-[10px] font-bold text-[#1A2B3C] truncate block">{editingItem.data.experienceCertificateFileName || 'experience_certificate.pdf'}</span>
                                      </div>
                                      {editingItem.data.experienceCertificateDoc && (
                                        <a
                                          href={editingItem.data.experienceCertificateDoc}
                                          download={editingItem.data.experienceCertificateFileName || 'experience_certificate.pdf'}
                                          className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-black text-[9px] rounded-lg transition-all shrink-0 ml-2"
                                        >
                                          Download File 📥
                                        </a>
                                      )}
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-3 min-h-[220px]">
                                      {editingItem.data.experienceCertificateDoc ? (
                                        editingItem.data.experienceCertificateDoc.startsWith('data:image/') ? (
                                          <img src={editingItem.data.experienceCertificateDoc} alt="Uploaded Experience Certificate" className="max-h-72 object-contain rounded-lg" referrerPolicy="no-referrer" />
                                        ) : (
                                          <iframe src={editingItem.data.experienceCertificateDoc} className="w-full h-72 rounded-lg border-0 bg-white" title="Experience Certificate Preview" />
                                        )
                                      ) : (
                                        <div className="text-center p-6 text-amber-600 bg-amber-50 rounded-xl border border-amber-200/50 max-w-sm">
                                          <span className="text-xl">⚠️</span>
                                          <p className="text-xs font-bold mt-1">No uploaded file exists for this seeded/legacy partner.</p>
                                          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Please check the background history or edit the profile to attach a scanned copy.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {activeTabId === 'uploaded-other' && (
                                  /* Uploaded Other Document */
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[8px] text-gray-400 block font-bold uppercase">FILE NAME / SOURCE</span>
                                        <span className="font-mono text-[10px] font-bold text-[#1A2B3C] truncate block">{editingItem.data.otherDocFileName || 'other_document.pdf'}</span>
                                      </div>
                                      {editingItem.data.otherDoc && (
                                        <a
                                          href={editingItem.data.otherDoc}
                                          download={editingItem.data.otherDocFileName || 'other_document.pdf'}
                                          className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#075353] text-white font-black text-[9px] rounded-lg transition-all shrink-0 ml-2"
                                        >
                                          Download File 📥
                                        </a>
                                      )}
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-3 min-h-[220px]">
                                      {editingItem.data.otherDoc ? (
                                        editingItem.data.otherDoc.startsWith('data:image/') ? (
                                          <img src={editingItem.data.otherDoc} alt="Uploaded Other Document" className="max-h-72 object-contain rounded-lg" referrerPolicy="no-referrer" />
                                        ) : (
                                          <iframe src={editingItem.data.otherDoc} className="w-full h-72 rounded-lg border-0 bg-white" title="Other Document Preview" />
                                        )
                                      ) : (
                                        <div className="text-center p-6 text-amber-600 bg-amber-50 rounded-xl border border-amber-200/50 max-w-sm">
                                          <span className="text-xl">⚠️</span>
                                          <p className="text-xs font-bold mt-1">No uploaded file exists for this seeded/legacy partner.</p>
                                          <p className="text-[10px] text-amber-700 font-medium mt-0.5">No additional document was attached during registration.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Document Attributes checklist */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2 text-[10px] text-slate-600 font-medium">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 block">
                        Super Admin Verification Checklist
                      </span>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-all">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#0A6E6E] focus:ring-[#0A6E6E]" />
                          <span>Check spelling matches government document matches bank ledger</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-all">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#0A6E6E] focus:ring-[#0A6E6E]" />
                          <span>Registration number matches state registrar index lookup</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 transition-all">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#0A6E6E] focus:ring-[#0A6E6E]" />
                          <span>Photo matches physical verification inspection log</span>
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#075353] text-white font-extrabold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Save Registration Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-indigo-100 flex flex-col">
            <div className="bg-[#0A6E6E] text-white px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-100 tracking-wider">Document Authenticity Hub</span>
                <h3 className="font-extrabold text-sm flex items-center gap-1">
                  🔍 Previewing {previewDoc.docLabel}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-white hover:text-indigo-100 p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-grow overflow-y-auto text-xs text-slate-600">
              {/* Virtual PDF Preview Header */}
              <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black">
                    PDF
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 break-all">{previewDoc.fileName}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold">{previewDoc.fileSize || '1.2 MB'} • Linked on {previewDoc.uploadedAt || 'June 26, 2026'}</p>
                  </div>
                </div>
              </div>

              {/* Document Metadata Details */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-indigo-800 uppercase block tracking-wider">Verification Attributes</span>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                  <div>
                    <span className="text-gray-400 block text-[9px]">Submitted By</span>
                    <span className="text-slate-800 font-bold">{previewDoc.entityName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">Entity Type</span>
                    <span className="text-slate-800 font-bold capitalize">{previewDoc.entityType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">Document Role</span>
                    <span className="text-slate-800 font-bold">{previewDoc.docLabel}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">Verification Status</span>
                    <span className={`font-black ${previewDoc.status === 'verified' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {previewDoc.status === 'verified' ? '✓ Verified' : '⚠ Pending Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Mock Canvas representation of a scanned document */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-100 flex flex-col items-center justify-center py-8 text-center space-y-2.5">
                <FileText className="w-12 h-12 text-[#0A6E6E]" />
                <div>
                  <span className="text-[11px] font-black text-slate-800">DOCT SPARK DIGITAL ENVELOPE</span>
                  <p className="text-[10px] text-gray-400 max-w-xs mt-0.5">Automated visual decryption. Scanned PDF document reference is cryptographically healthy and verified.</p>
                </div>
                <div className="flex gap-2">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Downloading decrypted document: ${previewDoc.fileName}`);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] shadow cursor-pointer"
                  >
                    Download Scanned Copy 📥
                  </a>
                </div>
              </div>

              {/* Verification Actions */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-[11px] flex gap-2">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                  <span className="font-extrabold text-emerald-800 block">Super Admin Verification Override</span>
                  <p className="text-emerald-700 font-medium mt-0.5">This document has been cross-referenced with Central National Registry databases and is deemed genuine.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DOCUMENT FILENAME EDIT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-indigo-100">
            <div className="bg-slate-950 text-white px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Profile Revision</span>
                <h3 className="font-extrabold text-sm">
                  ✏️ Edit Document File Reference
                </h3>
              </div>
              <button 
                onClick={() => setEditingDoc(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocEdit}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-black text-indigo-700 uppercase block mb-1">Entity Information</span>
                  <p className="font-bold text-[#1A2B3C]">{editingDoc.entityName} ({editingDoc.entityType})</p>
                  <p className="text-gray-400 font-semibold">{editingDoc.docLabel}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">File Name / Path Reference *</label>
                  <input
                    type="text"
                    required
                    value={editingDocVal}
                    onChange={(e) => setEditingDocVal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-indigo-700"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Update the scanned filename mapping inside the digital vault records. This corrects sync discrepancies instantly.</span>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-lg shadow-sm"
                >
                  Save Document Path
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MASTER ADMIN PARTNER REVIEW OVERLAY
          ========================================== */}
      {selectedPartnerForAdminReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-indigo-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-indigo-700 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white block mb-1 w-max">
                  Master Admin Verification Panel
                </span>
                <h3 className="text-lg font-extrabold">Final Review: {selectedPartnerForAdminReview.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedPartnerForAdminReview(null)}
                className="text-white hover:text-indigo-200 font-bold text-lg p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs leading-relaxed text-[#1A2B3C]">
              {adminReviewError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg font-bold flex items-center gap-2">
                  <span className="text-base">⚠️</span> {adminReviewError}
                </div>
              )}

              {/* Status Banner */}
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl text-indigo-950 font-semibold">
                <span className="font-extrabold block mb-1">📋 Current Application Routing Status: {selectedPartnerForAdminReview.status}</span>
                {selectedPartnerForAdminReview.status === 'Pending State Partner Verification' ? (
                  <p className="text-[10px] text-orange-800">Note: This self-registered application is pending state-level partner review, but as Master Admin, you have full final authority to override and approve/reject now.</p>
                ) : (
                  <p className="text-[10px] text-indigo-700">This application is ready for final verification and activation by the Master Admin.</p>
                )}
              </div>

              {/* Grid 1: Basic Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider mb-2">Personal & Territory Info</h4>
                  <ul className="space-y-1.5 font-semibold text-gray-700">
                    <li><span className="text-gray-400">Name:</span> {selectedPartnerForAdminReview.name}</li>
                    <li><span className="text-gray-400">Gender / Age:</span> {selectedPartnerForAdminReview.gender || 'Male'} ({selectedPartnerForAdminReview.age || '30'} Yrs)</li>
                    <li><span className="text-gray-400">Email:</span> {selectedPartnerForAdminReview.email}</li>
                    <li><span className="text-gray-400">Phone:</span> {selectedPartnerForAdminReview.phone}</li>
                    <li><span className="text-gray-400">Role level:</span> {selectedPartnerForAdminReview.partnerType} Level Partner</li>
                    <li><span className="text-gray-400">Assigned Territory:</span> {selectedPartnerForAdminReview.assignedDistrict ? `${selectedPartnerForAdminReview.assignedDistrict}, ` : ''}{selectedPartnerForAdminReview.assignedState}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-extrabold text-indigo-700 uppercase text-[10px] tracking-wider mb-2">Qualifications & Background</h4>
                  <ul className="space-y-1.5 font-semibold text-gray-700">
                    <li><span className="text-gray-400">Education:</span> {selectedPartnerForAdminReview.qualification}</li>
                    <li><span className="text-gray-400">Occupation:</span> {selectedPartnerForAdminReview.occupation}</li>
                    <li><span className="text-gray-400">Experience:</span> {selectedPartnerForAdminReview.experience}</li>
                    <li><span className="text-gray-400">Skills:</span> {selectedPartnerForAdminReview.skills}</li>
                    <li><span className="text-gray-400">Pincode:</span> {selectedPartnerForAdminReview.pincode}</li>
                    <li><span className="text-gray-400">Address:</span> {selectedPartnerForAdminReview.address}</li>
                  </ul>
                </div>
              </div>

              {/* National Identity details */}
              <div className="border border-gray-100 rounded-xl p-4 bg-slate-50 space-y-2">
                <h4 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">KYC Verification Documents (Entered Numbers)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Aadhaar Card</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{selectedPartnerForAdminReview.aadhaarNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">PAN Card</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{selectedPartnerForAdminReview.panNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Voter ID</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{selectedPartnerForAdminReview.voterIdNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Verification Documents */}
              <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/20 space-y-3">
                <h4 className="font-extrabold text-[#0A6E6E] uppercase text-[10px] tracking-wider flex items-center gap-1">
                  📁 Uploaded Verification Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Identity Proof Doc */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between gap-2 shadow-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Identity Proof</p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedPartnerForAdminReview.identityProofFileName || "identity_proof.pdf"}
                      </p>
                    </div>
                    {selectedPartnerForAdminReview.identityProofDoc ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <a
                          href={selectedPartnerForAdminReview.identityProofDoc}
                          download={selectedPartnerForAdminReview.identityProofFileName || "identity_proof.pdf"}
                          className="text-[10px] font-extrabold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          📥 Download File
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<iframe src="${selectedPartnerForAdminReview.identityProofDoc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                          }}
                          className="text-[10px] font-extrabold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          👁️ View Full
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded border border-amber-200/50 mt-1 text-center">
                        ⚠️ No file uploaded (Legacy Partner)
                      </p>
                    )}
                  </div>

                  {/* Qualification Doc */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between gap-2 shadow-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Highest Qualification</p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedPartnerForAdminReview.highestQualificationFileName || "qualification_document.pdf"}
                      </p>
                    </div>
                    {selectedPartnerForAdminReview.highestQualificationDoc ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <a
                          href={selectedPartnerForAdminReview.highestQualificationDoc}
                          download={selectedPartnerForAdminReview.highestQualificationFileName || "qualification_document.pdf"}
                          className="text-[10px] font-extrabold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          📥 Download File
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<iframe src="${selectedPartnerForAdminReview.highestQualificationDoc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                          }}
                          className="text-[10px] font-extrabold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          👁️ View Full
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded border border-amber-200/50 mt-1 text-center">
                        ⚠️ No file uploaded (Legacy Partner)
                      </p>
                    )}
                  </div>

                  {/* Experience Certificate */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between gap-2 shadow-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Experience Certificate</p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedPartnerForAdminReview.experienceCertificateFileName || "experience_certificate.pdf"}
                      </p>
                    </div>
                    {selectedPartnerForAdminReview.experienceCertificateDoc ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <a
                          href={selectedPartnerForAdminReview.experienceCertificateDoc}
                          download={selectedPartnerForAdminReview.experienceCertificateFileName || "experience_certificate.pdf"}
                          className="text-[10px] font-extrabold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          📥 Download File
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<iframe src="${selectedPartnerForAdminReview.experienceCertificateDoc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                          }}
                          className="text-[10px] font-extrabold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          👁️ View Full
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-1.5 rounded border border-amber-200/50 mt-1 text-center">
                        ⚠️ No file uploaded (Legacy Partner)
                      </p>
                    )}
                  </div>

                  {/* Other Document */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col justify-between gap-2 shadow-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Other Document (Optional)</p>
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {selectedPartnerForAdminReview.otherDocFileName || "N/A"}
                      </p>
                    </div>
                    {selectedPartnerForAdminReview.otherDoc ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <a
                          href={selectedPartnerForAdminReview.otherDoc}
                          download={selectedPartnerForAdminReview.otherDocFileName || "other_document.pdf"}
                          className="text-[10px] font-extrabold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          📥 Download File
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const win = window.open();
                            if (win) {
                              win.document.write(`<iframe src="${selectedPartnerForAdminReview.otherDoc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }
                          }}
                          className="text-[10px] font-extrabold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-md text-center flex-1 transition-all"
                        >
                          👁️ View Full
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-bold bg-gray-50 p-1.5 rounded border border-gray-100 mt-1 text-center">
                        No other document uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Statement */}
              {selectedPartnerForAdminReview.aboutPartner500Words && (
                <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50 space-y-1.5">
                  <h4 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">Statement of Purpose</h4>
                  <p className="whitespace-pre-wrap text-gray-600 font-medium bg-white p-3 rounded-lg border border-gray-100">{selectedPartnerForAdminReview.aboutPartner500Words}</p>
                </div>
              )}

              {/* Review Remarks Field */}
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/60 space-y-3">
                <h4 className="font-extrabold text-indigo-950 uppercase text-[10px] tracking-wider">
                  Review Remarks & Audit Logging
                </h4>
                <p className="text-[10px] text-indigo-800 font-medium">
                  Please enter detailed final review remarks. Your decision, name (Super Admin), role (Master Admin), current timestamp, and remarks will be recorded in the audit log.
                </p>
                <textarea 
                  value={adminReviewRemarks}
                  onChange={(e) => setAdminReviewRemarks(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-indigo-200 p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] shadow-xs focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Reviewed State Partner assessment. Checked National ID files. Verified territory availability. Partner is fully active now."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-2">
              <button 
                onClick={() => setSelectedPartnerForAdminReview(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <div className="flex gap-2 text-xs">
                <button 
                  onClick={() => handleAdminReviewPartnerAction('reject')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg cursor-pointer"
                >
                  Reject Application
                </button>
                <button 
                  onClick={() => handleAdminReviewPartnerAction('approve')}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-lg cursor-pointer shadow-sm"
                >
                  Approve & Activate ✉️ ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual adjustment override modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-teal-100 p-6 space-y-4">
            <button 
              onClick={() => setShowAdjustmentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-sm p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
            >
              ✕
            </button>
            
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Manual Wallet Override</h3>
              <p className="text-[10px] text-gray-400 font-medium">Manually credit or debit a patient's promotional wallet balance.</p>
            </div>

            <form onSubmit={handlePerformAdjustment} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Select Patient Wallet</label>
                <select
                  value={adjustmentEmail}
                  onChange={(e) => setAdjustmentEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-sans"
                >
                  {patientWallets.map(w => (
                    <option key={w.patientEmail} value={w.patientEmail}>
                      {w.patientName} ({w.patientEmail})
                    </option>
                  ))}
                  {patientWallets.length === 0 && (
                    <option value="">No wallets registered</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as 'Credit' | 'Debit')}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer font-sans"
                  >
                    <option value="Credit">Credit (+)</option>
                    <option value="Debit">Debit (-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Audit Log Remarks / Description</label>
                <textarea
                  value={adjustmentDescription}
                  onChange={(e) => setAdjustmentDescription(e.target.value)}
                  placeholder="e.g., Manual loyalty campaign credit, refund resolution..."
                  rows={3}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
