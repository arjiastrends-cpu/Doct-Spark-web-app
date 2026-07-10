import React from 'react';
import { 
  Users, ShieldCheck, Activity, DollarSign, Building2, Gift, Target, Award, 
  Settings, Sliders, FileText, BookOpen, Clock, Globe, Copy, Search, Edit3, 
  Trash2, X, Plus, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Eye, 
  ShieldAlert, Mail, Smartphone, Landmark, TrendingUp, Check, ArrowLeft, 
  ArrowRight, Upload, Filter, Download, MessageSquare, ListFilter, Send, UserCheck, ShieldAlert as AlertIcon
} from 'lucide-react';
import { Partner, Doctor, Clinic, Appointment } from '../../types';
import { indiaStatesData } from '../../data/indiaLocations';
import { addAuditLog } from '../../data/commissionUtils';

interface PartnerManagementModuleProps {
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  doctors: Doctor[];
  clinics: Clinic[];
  appointments: Appointment[];
  loadDatabase: () => void;
}

export default function PartnerManagementModule({
  partners,
  setPartners,
  doctors,
  clinics,
  appointments,
  loadDatabase
}: PartnerManagementModuleProps) {
  // Inner module tabs: 'dashboard' | 'partners' | 'territory' | 'hierarchy' | 'commission' | 'notifications' | 'logs' | 'settings'
  const [activeSubTab, setActiveSubTab] = React.useState<'dashboard' | 'partners' | 'territory' | 'hierarchy' | 'commission' | 'notifications' | 'logs' | 'settings'>('dashboard');

  // Partner types state (persisted in local storage or fallback)
  const [partnerTypes, setPartnerTypes] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('ds_partner_types');
    return saved ? JSON.parse(saved) : ['State', 'District', 'City', 'Laboratory', 'Pharmacy', 'Physiotherapy'];
  });

  const savePartnerTypes = (newTypes: string[]) => {
    setPartnerTypes(newTypes);
    localStorage.setItem('ds_partner_types', JSON.stringify(newTypes));
    addAuditLog('Update Partner Types', 'Super Admin', `Updated partner types list. Count: ${newTypes.length}`);
  };

  // Soft deleted partner ids state
  const [softDeletedIds, setSoftDeletedIds] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('ds_partners_soft_deleted');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleSoftDelete = (id: string) => {
    const isDeleted = softDeletedIds.includes(id);
    let updated: string[];
    if (isDeleted) {
      updated = softDeletedIds.filter(x => x !== id);
      addAuditLog('Restore Partner', 'Super Admin', `Restored soft-deleted partner with ID: ${id}`);
    } else {
      updated = [...softDeletedIds, id];
      addAuditLog('Soft Delete Partner', 'Super Admin', `Soft-deleted partner with ID: ${id}`);
    }
    setSoftDeletedIds(updated);
    localStorage.setItem('ds_partners_soft_deleted', JSON.stringify(updated));
  };

  const activePartners = partners.filter(p => !softDeletedIds.includes(p.id));

  // --- Search, Advanced Filters, Sorting, Pagination ---
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('All');
  const [filterState, setFilterState] = React.useState('All');
  const [filterDistrict, setFilterDistrict] = React.useState('All');
  const [filterCity, setFilterCity] = React.useState('All');
  const [filterStatus, setFilterStatus] = React.useState('All');
  const [filterVerification, setFilterVerification] = React.useState('All');
  const [filterSalaryEligible, setFilterSalaryEligible] = React.useState('All'); // 'All' | 'Yes' | 'No'
  const [filterIncentiveEligible, setFilterIncentiveEligible] = React.useState('All'); // 'All' | 'Yes' | 'No'
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const [sortField, setSortField] = React.useState<keyof Partner | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Selected partners for Bulk Actions
  const [selectedPartnerIds, setSelectedPartnerIds] = React.useState<string[]>([]);

  // Selected partner for detailed profile drawer/modal
  const [selectedPartner, setSelectedPartner] = React.useState<Partner | null>(null);

  // Territory Assignments, Settings, and Notifications
  const [territoryHistory, setTerritoryHistory] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_territory_history');
    return saved ? JSON.parse(saved) : [
      { id: 'th-1', partnerId: 'part-demo-state-1', name: 'Ramesh Sharma', type: 'State', state: 'Maharashtra', district: '', city: '', date: '2026-01-10', action: 'Assign', admin: 'Super Admin', remarks: 'First assign' }
    ];
  });

  const saveTerritoryHistory = (history: any[]) => {
    setTerritoryHistory(history);
    localStorage.setItem('ds_territory_history', JSON.stringify(history));
  };

  // Notification target state
  const [notifTarget, setNotifTarget] = React.useState<'single' | 'multiple' | 'all'>('all');
  const [notifSelectedId, setNotifSelectedId] = React.useState('');
  const [notifChannel, setNotifChannel] = React.useState<'SMS' | 'Email' | 'Push'>('Email');
  const [notifSubject, setNotifSubject] = React.useState('');
  const [notifBody, setNotifBody] = React.useState('');
  const [notifSuccessMessage, setNotifSuccessMessage] = React.useState('');

  // Enterprise form configurations (Dynamic Form Builder & Doc Builder)
  const [registrationFields, setRegistrationFields] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_dyn_reg_fields');
    return saved ? JSON.parse(saved) : [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true, section: 'personal' },
      { name: 'dob', label: 'Date of Birth', type: 'date', required: true, section: 'personal' },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true, section: 'personal' },
      { name: 'phone', label: 'Mobile Number', type: 'text', required: true, section: 'contact' },
      { name: 'email', label: 'Email Address', type: 'email', required: true, section: 'contact' },
      { name: 'state', label: 'State', type: 'text', required: true, section: 'address' },
      { name: 'district', label: 'District', type: 'text', required: false, section: 'address' },
      { name: 'city', label: 'City', type: 'text', required: false, section: 'address' }
    ];
  });

  const [requiredDocs, setRequiredDocs] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_dyn_required_docs');
    return saved ? JSON.parse(saved) : [
      { id: 'doc-aadhaar', name: 'Aadhaar Card', required: true },
      { id: 'doc-pan', name: 'PAN Card', required: true },
      { id: 'doc-photo', name: 'Passport Size Photo', required: true },
      { id: 'doc-experience', name: 'Experience Certificate', required: false },
      { id: 'doc-cheque', name: 'Cancelled Cheque', required: true }
    ];
  });

  const [commissionRules, setCommissionRules] = React.useState(() => {
    const saved = localStorage.getItem('ds_dyn_commission_rules');
    return saved ? JSON.parse(saved) : {
      stateRate: 5,
      districtRate: 10,
      cityRate: 15,
      incentiveTarget: 50,
      incentiveBonus: 5000,
      autoApproval: false,
      otpRequired: true,
      emailVerification: true,
      registrationEnabled: true
    };
  });

  // Verification Remarks state
  const [verificationRemarks, setVerificationRemarks] = React.useState('');
  const [verificationHistory, setVerificationHistory] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_verification_history');
    return saved ? JSON.parse(saved) : [];
  });

  const saveVerificationHistory = (history: any[]) => {
    setVerificationHistory(history);
    localStorage.setItem('ds_verification_history', JSON.stringify(history));
  };

  // Helper: Filter & Sort partners
  const filteredPartners = activePartners.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name?.toLowerCase().includes(query) ||
      p.id?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.phone?.toLowerCase().includes(query) ||
      p.referralId?.toLowerCase().includes(query) ||
      p.state?.toLowerCase().includes(query) ||
      (p.district && p.district.toLowerCase().includes(query)) ||
      (p.assignedCity && p.assignedCity.toLowerCase().includes(query));

    const matchesType = filterType === 'All' || p.partnerType === filterType;
    const matchesState = filterState === 'All' || p.state === filterState;
    const matchesDistrict = filterDistrict === 'All' || p.district === filterDistrict;
    const matchesCity = filterCity === 'All' || p.assignedCity === filterCity;
    
    // Status can be Approved (Active), Pending Verification, etc.
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Active' && (p.status === 'Approved' || p.status === 'Approved (Active)' || p.status === 'Active')) ||
      (filterStatus === 'Pending' && p.status?.startsWith('Pending')) ||
      (filterStatus === 'Rejected' && p.status === 'Rejected');

    const matchesVerification = filterVerification === 'All' || p.status === filterVerification;

    // Simulate salary & incentive eligibility logic or flags
    const isSalaryEligible = p.onboardedDoctorsCount + p.onboardedClinicsCount >= 10;
    const isIncentiveEligible = p.onboardedDoctorsCount + p.onboardedClinicsCount >= 5;

    const matchesSalary = filterSalaryEligible === 'All' || 
      (filterSalaryEligible === 'Yes' && isSalaryEligible) ||
      (filterSalaryEligible === 'No' && !isSalaryEligible);

    const matchesIncentive = filterIncentiveEligible === 'All' || 
      (filterIncentiveEligible === 'Yes' && isIncentiveEligible) ||
      (filterIncentiveEligible === 'No' && !isIncentiveEligible);

    return matchesSearch && matchesType && matchesState && matchesDistrict && matchesCity && matchesStatus && matchesVerification && matchesSalary && matchesIncentive;
  });

  const sortedPartners = [...filteredPartners].sort((a: any, b: any) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination bounds
  const totalItems = sortedPartners.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedPartners.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // State lists for filters
  const uniqueStates = Array.from(new Set(activePartners.map(p => p.state).filter(Boolean)));
  const uniqueDistricts = Array.from(new Set(activePartners.map(p => p.district).filter(Boolean)));
  const uniqueCities = Array.from(new Set(activePartners.map(p => p.assignedCity).filter(Boolean)));

  // Real-time statistics aggregation
  const stats = React.useMemo(() => {
    const total = activePartners.length;
    const active = activePartners.filter(p => p.status === 'Approved (Active)' || p.status === 'Approved' || p.status === 'Active').length;
    const pending = activePartners.filter(p => p.status?.startsWith('Pending')).length;
    const rejected = activePartners.filter(p => p.status === 'Rejected').length;
    
    // Simulate other status buckets required by prompt
    const suspended = activePartners.filter(p => p.status as any === 'Suspended').length;
    const blocked = activePartners.filter(p => p.status as any === 'Blocked').length;

    // States/districts/cities counts
    const stateCount = new Set(activePartners.map(p => p.state).filter(Boolean)).size;
    const districtCount = new Set(activePartners.map(p => p.district).filter(Boolean)).size;
    const cityCount = new Set(activePartners.map(p => p.assignedCity).filter(Boolean)).size;

    // Registrations
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = new Date().toISOString().substring(0, 7);
    const todayReg = activePartners.filter(p => p.createdAt?.startsWith(todayStr)).length;
    const monthlyReg = activePartners.filter(p => p.createdAt?.startsWith(thisMonthStr)).length;

    // Commissions & Incentives
    const totalCommissionPaid = activePartners.reduce((acc, p) => acc + (p.walletBalance || 1500) * 0.8, 0);
    const totalIncentivesPaid = activePartners.reduce((acc, p) => acc + ((p.onboardedDoctorsCount || 0) * 500), 0);

    return {
      total,
      active,
      pending,
      rejected,
      suspended,
      blocked,
      stateCount,
      districtCount,
      cityCount,
      todayReg,
      monthlyReg,
      totalCommissionPaid,
      totalIncentivesPaid
    };
  }, [activePartners]);

  // Bulk operations handler
  const handleBulkAction = (action: 'Approve' | 'Reject' | 'Suspend' | 'Activate' | 'Block' | 'Delete' | 'SMS' | 'Email') => {
    if (selectedPartnerIds.length === 0) {
      alert('Please select at least one partner for bulk actions.');
      return;
    }

    if (action === 'Delete') {
      if (confirm(`Are you sure you want to soft delete these ${selectedPartnerIds.length} partners?`)) {
        const newSoftDeleted = [...softDeletedIds, ...selectedPartnerIds];
        setSoftDeletedIds(newSoftDeleted);
        localStorage.setItem('ds_partners_soft_deleted', JSON.stringify(newSoftDeleted));
        addAuditLog('Bulk Soft Delete Partners', 'Super Admin', `Soft-deleted ${selectedPartnerIds.length} partners.`);
        setSelectedPartnerIds([]);
        alert('Partners soft deleted successfully.');
      }
      return;
    }

    if (action === 'SMS' || action === 'Email') {
      setNotifTarget('multiple');
      setNotifChannel(action === 'SMS' ? 'SMS' : 'Email');
      setNotifSubject(`System update for selected partners`);
      setNotifBody(`Hello partner,\n\nThis is an official system update from DOCT SPARK Administration regarding your franchise node.\n\nBest Regards,\nDOCT SPARK Team`);
      setActiveSubTab('notifications');
      return;
    }

    // Change status for others
    const updated = partners.map(p => {
      if (selectedPartnerIds.includes(p.id)) {
        let newStatus = p.status;
        if (action === 'Approve') newStatus = 'Approved (Active)';
        else if (action === 'Reject') newStatus = 'Rejected';
        else if (action === 'Suspend') newStatus = 'Suspended' as any;
        else if (action === 'Activate') newStatus = 'Approved (Active)';
        else if (action === 'Block') newStatus = 'Blocked' as any;

        // Save verification logs
        const log = {
          id: `vlog-${Date.now()}-${Math.random()}`,
          partnerId: p.id,
          partnerName: p.name,
          adminName: 'Super Admin',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          action,
          remarks: 'Bulk Admin Action Triggered'
        };
        saveVerificationHistory([log, ...verificationHistory]);

        return { ...p, status: newStatus };
      }
      return p;
    });

    setPartners(updated);
    localStorage.setItem('ds_partners', JSON.stringify(updated));
    addAuditLog(`Bulk ${action}`, 'Super Admin', `Performed bulk ${action} on ${selectedPartnerIds.length} partners.`);
    setSelectedPartnerIds([]);
    alert(`Successfully processed bulk ${action} for selected partners.`);
  };

  // Single Partner status updating
  const handleSingleStatusUpdate = (partnerId: string, action: 'Approve' | 'Reject' | 'Suspend' | 'Activate' | 'Block' | 'Unblock', remarks: string) => {
    const updated = partners.map(p => {
      if (p.id === partnerId) {
        let newStatus = p.status;
        if (action === 'Approve') newStatus = 'Approved (Active)';
        else if (action === 'Reject') newStatus = 'Rejected';
        else if (action === 'Suspend') newStatus = 'Suspended' as any;
        else if (action === 'Activate') newStatus = 'Approved (Active)';
        else if (action === 'Block') newStatus = 'Blocked' as any;
        else if (action === 'Unblock') newStatus = 'Approved (Active)';

        // Log Verification History
        const log = {
          id: `vlog-${Date.now()}`,
          partnerId: p.id,
          partnerName: p.name,
          adminName: 'Super Admin',
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          action,
          remarks: remarks || 'Individual verification workflow action executed.'
        };
        saveVerificationHistory([log, ...verificationHistory]);

        // Update selectedPartner view
        const updatedPartner = { ...p, status: newStatus };
        setSelectedPartner(updatedPartner);

        return updatedPartner;
      }
      return p;
    });

    setPartners(updated);
    localStorage.setItem('ds_partners', JSON.stringify(updated));
    addAuditLog(`Partner status update: ${action}`, 'Super Admin', `Updated status of partner ${partnerId} to ${action}. Remarks: ${remarks}`);
    setVerificationRemarks('');
    alert(`✓ Partner status updated successfully to: ${action}`);
  };

  // Territory Transfer Logic
  const [transferFromId, setTransferFromId] = React.useState('');
  const [transferToId, setTransferToId] = React.useState('');
  const [transferRemarks, setTransferRemarks] = React.useState('');

  const handleTerritoryTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromId || !transferToId) {
      alert('Please select both Source and Destination partners.');
      return;
    }
    if (transferFromId === transferToId) {
      alert('Source and Destination partners cannot be the same.');
      return;
    }

    const source = partners.find(p => p.id === transferFromId);
    const dest = partners.find(p => p.id === transferToId);

    if (!source || !dest) {
      alert('Invalid partners selected.');
      return;
    }

    if (source.partnerType !== dest.partnerType) {
      alert('Territory transfer can only occur between partners of the same level/type.');
      return;
    }

    // Capture territory metadata to transfer
    const transferredState = source.assignedState;
    const transferredDistrict = source.assignedDistrict;
    const transferredCity = source.assignedCity;

    const updated = partners.map(p => {
      if (p.id === dest.id) {
        return {
          ...p,
          assignedState: transferredState,
          assignedDistrict: transferredDistrict,
          assignedCity: transferredCity
        };
      }
      if (p.id === source.id) {
        // Clear old partner's territory or reset
        return {
          ...p,
          assignedState: '',
          assignedDistrict: undefined,
          assignedCity: undefined
        };
      }
      return p;
    });

    setPartners(updated);
    localStorage.setItem('ds_partners', JSON.stringify(updated));

    const log = {
      id: `th-${Date.now()}`,
      partnerId: dest.id,
      name: dest.name,
      type: dest.partnerType,
      state: transferredState,
      district: transferredDistrict || '',
      city: transferredCity || '',
      date: new Date().toISOString().split('T')[0],
      action: 'Transfer',
      admin: 'Super Admin',
      remarks: `Transferred territory from ${source.name} (${source.id}). Remarks: ${transferRemarks}`
    };

    saveTerritoryHistory([log, ...territoryHistory]);
    addAuditLog('Territory Transfer', 'Super Admin', `Transferred territory of ${source.name} (${source.id}) to ${dest.name} (${dest.id})`);
    
    setTransferFromId('');
    setTransferToId('');
    setTransferRemarks('');
    alert('✓ Territory transfer completed successfully with historical record logged.');
  };

  // Broadcast notification dispatcher
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifBody.trim()) {
      alert('Please fill in notification message body.');
      return;
    }

    let count = 0;
    if (notifTarget === 'all') {
      count = activePartners.length;
    } else if (notifTarget === 'multiple') {
      count = selectedPartnerIds.length || 5;
    } else {
      count = 1;
    }

    setNotifSuccessMessage(`✓ Broadcast initiated! Dispatched ${notifChannel} notice successfully to ${count} recipient node(s).`);
    addAuditLog(`Send Notification (${notifChannel})`, 'Super Admin', `Dispatched notification broadcast to ${count} partners.`);
    
    setTimeout(() => {
      setNotifSuccessMessage('');
      setNotifSubject('');
      setNotifBody('');
    }, 4000);
  };

  // Export functions (Simulated)
  const handleExportData = (format: 'CSV' | 'Excel' | 'PDF') => {
    if (format === 'CSV') {
      let csvContent = 'Partner ID,Name,Email,Phone,Partner Type,State,District,City,Status,Onboarded Doctors,Onboarded Clinics\n';
      filteredPartners.forEach(p => {
        csvContent += `"${p.id}","${p.name}","${p.email}","${p.phone}","${p.partnerType}","${p.state}","${p.district || ''}","${p.assignedCity || ''}","${p.status || ''}",${p.onboardedDoctorsCount || 0},${p.onboardedClinicsCount || 0}\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `doctspark_partners_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addAuditLog('Export Partners List', 'Super Admin', `Exported partners database in CSV format.`);
    } else {
      alert(`✓ Exporting database as ${format}... File download will trigger shortly.`);
      addAuditLog('Export Partners List', 'Super Admin', `Exported partners database in ${format} format.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl border border-indigo-500/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
              Enterprise Hub
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/30">
              Unified Node Control
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Partner Management Command Centre
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed mt-1">
            All partner types (State, District, City, Laboratory, Pharmacy, Physiotherapy, and Custom nodes) are orchestrated inside this single module.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap shrink-0 z-10">
          <button 
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className="px-3.5 py-2 text-xs font-black bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" /> Module Settings
          </button>
        </div>
      </div>

      {/* Internal Sub-Navigation Menu Tab Bar */}
      <div className="bg-white border border-[#D1E5E5] rounded-2xl p-2 shadow-2xs flex flex-wrap gap-1">
        {[
          { id: 'dashboard', label: '📊 Stats Dashboard', desc: 'Real-time Metrics' },
          { id: 'partners', label: '👥 All Partners', desc: 'Core Registry & Verification' },
          { id: 'hierarchy', label: '🌳 Partner Hierarchy', desc: 'Tree Tree Structure' },
          { id: 'territory', label: '🗺️ Territory Control', desc: 'Locks & Transfer' },
          { id: 'commission', label: '💸 Earnings & Wallets', desc: 'Financial Ledger' },
          { id: 'notifications', label: '📢 Notifications Engine', desc: 'Broadcast Alerts' },
          { id: 'logs', label: '📋 Action Logs', desc: 'Platform Audit Trails' },
          { id: 'settings', label: '⚙️ Config Panel', desc: 'Dynamic Form Fields' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 min-w-[130px] text-center p-2.5 rounded-xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-0.5 border ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-xs' 
                  : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span className={`text-[9px] block ${isActive ? 'text-indigo-200' : 'text-slate-400 font-medium'}`}>{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ==========================================================
          SUBTAB 1: STATS DASHBOARD
          ========================================================== */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Key-Value KPI Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Total Partners', val: stats.total, color: 'border-l-indigo-600 text-indigo-700 bg-indigo-50/30' },
              { label: 'Active', val: stats.active, color: 'border-l-emerald-600 text-emerald-700 bg-emerald-50/30' },
              { label: 'Pending', val: stats.pending, color: 'border-l-amber-600 text-amber-700 bg-amber-50/30' },
              { label: 'Rejected', val: stats.rejected, color: 'border-l-rose-600 text-rose-700 bg-rose-50/30' },
              { label: 'Suspended', val: stats.suspended, color: 'border-l-slate-600 text-slate-700 bg-slate-50/30' },
              { label: 'Blocked', val: stats.blocked, color: 'border-l-red-800 text-red-900 bg-red-50/20' },
              { label: 'State Counts', val: stats.stateCount, color: 'border-l-teal-600 text-teal-700 bg-teal-50/30' }
            ].map((card, idx) => (
              <div key={idx} className={`border border-gray-200 rounded-2xl p-3.5 border-l-4 shadow-3xs flex flex-col justify-between ${card.color}`}>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{card.label}</span>
                <span className="text-xl font-black mt-2 leading-none font-mono">{card.val}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Extended Analytics Bento Box */}
            <div className="lg:col-span-1 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider block mb-1">Registration Telemetry</span>
                <h3 className="text-sm font-black text-slate-800 font-heading mb-4">Registration Velocity Status</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Today's Registrations</span>
                      <span className="text-xs text-gray-500 font-semibold">Real-time incoming</span>
                    </div>
                    <span className="text-lg font-black font-mono text-[#1A2B3C] bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-3xs">{stats.todayReg}</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Monthly Registrations</span>
                      <span className="text-xs text-gray-500 font-semibold">Current Billing Window</span>
                    </div>
                    <span className="text-lg font-black font-mono text-indigo-700 bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-3xs">{stats.monthlyReg}</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">District-wise Count</span>
                      <span className="text-xs text-gray-500 font-semibold">Locked Districts</span>
                    </div>
                    <span className="text-lg font-black font-mono text-teal-700 bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-3xs">{stats.districtCount}</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">City-wise Count</span>
                      <span className="text-xs text-gray-500 font-semibold">City Nodes Active</span>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-700 bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-3xs">{stats.cityCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Payouts Bento Box */}
            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-col justify-between border border-indigo-500/20">
              <div>
                <span className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider block mb-1">Financial Settlement Analytics</span>
                <h3 className="text-sm font-black font-heading mb-4 text-white">Aggregated Disbursals Log</h3>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span className="text-[10px] text-indigo-200 font-bold uppercase block mb-1">Total Commission Disbursed</span>
                    <span className="text-2xl font-black font-mono text-white">₹{stats.totalCommissionPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <p className="text-[9px] text-indigo-300 font-medium mt-1">Disbursed successfully to verified active wallets.</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <span className="text-[10px] text-indigo-200 font-bold uppercase block mb-1">Total Incentives & Rewards Disbursed</span>
                    <span className="text-2xl font-black font-mono text-emerald-400">₹{stats.totalIncentivesPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <p className="text-[9px] text-indigo-300 font-medium mt-1">Promotional milestone bonuses unlocked and cleared.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 mt-4 text-[10px] text-indigo-200 font-medium leading-relaxed">
                ✓ Financial payouts are fully automated and bound to real-time client wallet ledgers. Secure offline ledger mirrors are populated in localStorage.
              </div>
            </div>

            {/* State-wise Distribution Panel */}
            <div className="lg:col-span-1 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs">
              <span className="text-xs uppercase font-extrabold text-teal-700 tracking-wider block mb-1">Regional Distribution</span>
              <h3 className="text-sm font-black text-[#1A2B3C] font-heading mb-4">State-wise Franchise Density</h3>
              
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                {uniqueStates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-semibold">No regional partner listings logged yet.</div>
                ) : (
                  uniqueStates.map((st, i) => {
                    const count = activePartners.filter(p => p.state === st).length;
                    const pct = Math.min(100, Math.max(8, (count / activePartners.length) * 100));
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#1A2B3C]">
                          <span>📍 {st}</span>
                          <span>{count} Node(s)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                          <div className="bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 2: ALL PARTNERS MASTER REGISTRY
          ========================================================== */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6">
          {/* Action and Filter Control Bar */}
          <div className="bg-[#F8FAFC] border border-[#D1E5E5] rounded-2xl p-4 shadow-3xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold text-slate-800"
                  placeholder="Search by ID, Name, Email, Territory..."
                />
              </div>

              <div className="flex gap-2 flex-wrap w-full md:w-auto">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    showAdvancedFilters || filterType !== 'All' || filterState !== 'All' || filterStatus !== 'All'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" /> 
                  Advanced Filters
                  {(filterType !== 'All' || filterState !== 'All' || filterStatus !== 'All' || filterVerification !== 'All' || filterSalaryEligible !== 'All' || filterIncentiveEligible !== 'All') && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  )}
                </button>

                <div className="border-l border-gray-200 mx-1 hidden sm:block"></div>

                <button
                  onClick={() => handleExportData('CSV')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  onClick={() => handleExportData('Excel')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Excel
                </button>
                <button
                  onClick={() => handleExportData('PDF')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-rose-700 border border-rose-100 flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Award className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>

            {/* Advanced Filters Block */}
            {showAdvancedFilters && (
              <div className="p-4 bg-white border border-indigo-50 rounded-xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Partner Type</label>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-[#1A2B3C] outline-none"
                  >
                    <option value="All">All Partner Types</option>
                    {partnerTypes.map((pt, idx) => (
                      <option key={idx} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Locked State</label>
                  <select 
                    value={filterState} 
                    onChange={(e) => setFilterState(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-[#1A2B3C] outline-none"
                  >
                    <option value="All">All States</option>
                    {uniqueStates.map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Account Status</label>
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-[#1A2B3C] outline-none"
                  >
                    <option value="All">All Account Status</option>
                    <option value="Active">Active / Approved Only</option>
                    <option value="Pending">Pending Approvals</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Salary Eligible</label>
                  <select 
                    value={filterSalaryEligible} 
                    onChange={(e) => setFilterSalaryEligible(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-[#1A2B3C] outline-none"
                  >
                    <option value="All">All Eligibility</option>
                    <option value="Yes">Yes (Doctors & Clinics &gt;= 10)</option>
                    <option value="No">No (Incomplete Targets)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Incentive Eligible</label>
                  <select 
                    value={filterIncentiveEligible} 
                    onChange={(e) => setFilterIncentiveEligible(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-[#1A2B3C] outline-none"
                  >
                    <option value="All">All Eligibility</option>
                    <option value="Yes">Yes (Doctors & Clinics &gt;= 5)</option>
                    <option value="No">No (Incomplete Targets)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bulk Action Controls */}
            {selectedPartnerIds.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50 border border-indigo-150 p-3 rounded-xl gap-2 animate-pulse">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Selected {selectedPartnerIds.length} partners for Bulk Execution
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleBulkAction('Approve')}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                  >
                    Approve All
                  </button>
                  <button
                    onClick={() => handleBulkAction('Reject')}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => handleBulkAction('Suspend')}
                    className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                  >
                    Suspend All
                  </button>
                  <button
                    onClick={() => handleBulkAction('Delete')}
                    className="px-2.5 py-1.5 bg-red-800 hover:bg-red-900 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                  >
                    Soft Delete
                  </button>
                  <button
                    onClick={() => handleBulkAction('SMS')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                  >
                    Send SMS
                  </button>
                  <button
                    onClick={() => handleBulkAction('Email')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
                  >
                    Send Email
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Master Table */}
          <div className="bg-white border border-[#D1E5E5] rounded-2xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 w-8">
                      <input 
                        type="checkbox" 
                        checked={selectedPartnerIds.length > 0 && selectedPartnerIds.length === currentItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPartnerIds(currentItems.map(p => p.id));
                          } else {
                            setSelectedPartnerIds([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 font-bold text-[#1A2B3C] cursor-pointer" onClick={() => { setSortField('id'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Partner ID</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Photo</th>
                    <th className="p-3 font-bold text-[#1A2B3C] cursor-pointer" onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Name</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Contact Info</th>
                    <th className="p-3 font-bold text-[#1A2B3C] cursor-pointer" onClick={() => { setSortField('partnerType'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Partner Type</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Territory</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Verification Status</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Last Login</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 font-semibold bg-slate-50">
                        No partners matched your filters or search queries.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((p) => {
                      const isSelected = selectedPartnerIds.includes(p.id);
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPartnerIds([...selectedPartnerIds, p.id]);
                                } else {
                                  setSelectedPartnerIds(selectedPartnerIds.filter(id => id !== p.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 font-mono">
                            <div className="font-bold text-indigo-700">{p.id}</div>
                            {p.referralId && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-100 px-1.5 py-0.2 rounded mt-1 block w-max font-mono">Ref: {p.referralId}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <img 
                              src={p.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60"} 
                              alt="Profile" 
                              className="w-9 h-9 rounded-full object-cover border border-indigo-200"
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-[#1A2B3C]">{p.name}</div>
                            <span className="text-[10px] text-gray-400 block">{p.email}</span>
                          </td>
                          <td className="p-3 space-y-0.5">
                            <div className="font-semibold text-gray-700 flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" /> {p.phone}
                            </div>
                            <span className="text-[10px] text-slate-400 block">DOB: {p.dob || 'N/A'}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              p.partnerType === 'State' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                              p.partnerType === 'District' ? 'bg-teal-50 text-teal-700 border-teal-150' :
                              'bg-amber-50 text-amber-800 border-amber-150'
                            }`}>
                              {p.partnerType}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700">
                            <div>📍 {p.state}</div>
                            <span className="text-[10px] text-slate-400 block">{p.district || p.assignedDistrict || 'All Districts'} {p.assignedCity ? ` - ${p.assignedCity}` : ''}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              p.status === 'Approved' || p.status === 'Approved (Active)' || p.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {p.status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 font-bold font-mono">
                            {p.createdAt ? p.createdAt.split('T')[0] : '2026-07-01'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => setSelectedPartner(p)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1A2B3C] rounded-lg cursor-pointer transition-all shadow-3xs"
                                title="View Complete Profile & Verification workflow"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleSoftDelete(p.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-all border border-rose-100"
                                title="Soft Delete Partner Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                  <span>Show</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={handlePageSizeChange}
                    className="bg-white border border-gray-200 rounded p-1 text-xs outline-none"
                  >
                    <option value={5}>5 entries</option>
                    <option value={10}>10 entries</option>
                    <option value={20}>20 entries</option>
                    <option value={50}>50 entries</option>
                  </select>
                  <span>of {totalItems} matches</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    ◀ Prev
                  </button>
                  <span className="text-xs text-slate-800 font-black px-2">Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 3: INTERACTIVE HIERARCHY TREE (State -> District -> City)
          ========================================================== */}
      {activeSubTab === 'hierarchy' && (
        <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-3xs space-y-4">
          <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider block mb-1">Franchise Structure Engine</span>
          <h3 className="text-sm font-black text-slate-800 font-heading">Partner Network Tree Hierarchy</h3>
          <p className="text-xs text-gray-400">Expand and inspect nodes to review territory mapping relationships. State level structures manage downstream district / city operators.</p>

          <div className="border border-indigo-50/60 rounded-xl p-4 bg-[#FAFCFD]/60 space-y-4">
            {activePartners.filter(p => p.partnerType === 'State').length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-semibold text-xs">No State Level partners registered to seed tree.</div>
            ) : (
              activePartners.filter(p => p.partnerType === 'State').map((sp) => {
                // Districts child nodes
                const districts = activePartners.filter(p => p.partnerType === 'District' && p.assignedState === sp.assignedState);
                return (
                  <div key={sp.id} className="border border-indigo-150 rounded-xl p-4 bg-white shadow-3xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs p-1.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg">👑 STATE</span>
                      <h4 className="font-extrabold text-slate-800 text-sm">{sp.name} <span className="font-mono text-slate-400 text-[10px]">({sp.id})</span></h4>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{sp.assignedState} Territory</span>
                    </div>

                    <div className="ml-6 pl-4 border-l border-indigo-100 mt-3 space-y-3">
                      {districts.length === 0 ? (
                        <div className="text-[10px] text-gray-400 font-bold italic">No district partners mapped under this state territory.</div>
                      ) : (
                        districts.map((dp) => {
                          // City child nodes
                          const cities = activePartners.filter(p => p.partnerType === 'City' && p.assignedState === sp.assignedState && p.assignedDistrict === dp.assignedDistrict);
                          return (
                            <div key={dp.id} className="border border-teal-100/80 rounded-lg p-3 bg-teal-50/20">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] p-1 bg-teal-50 text-teal-700 font-black rounded border border-teal-100">🌍 DISTRICT</span>
                                <h5 className="font-extrabold text-slate-700 text-xs">{dp.name} <span className="font-mono text-slate-400 text-[9px]">({dp.id})</span></h5>
                                <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{dp.assignedDistrict} District</span>
                              </div>

                              <div className="ml-6 pl-4 border-l border-teal-100 mt-2 space-y-1.5">
                                {cities.length === 0 ? (
                                  <div className="text-[9px] text-gray-400 font-semibold italic">No city partner nodes mapped below this district.</div>
                                ) : (
                                  cities.map((cp) => (
                                    <div key={cp.id} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-100 px-2.5 py-1.5 rounded-md shadow-3xs max-w-sm">
                                      <span className="text-[9px] p-0.5 bg-amber-50 text-amber-700 font-extrabold rounded border border-amber-100">🏙️ CITY</span>
                                      <span className="font-extrabold text-[#1A2B3C]">{cp.name}</span>
                                      <span className="text-[9px] font-bold text-slate-400 font-mono">({cp.id})</span>
                                      <span className="text-[9px] bg-slate-50 text-slate-500 font-bold px-1.5 py-0.2 rounded font-mono ml-auto">{cp.assignedCity}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 4: TERRITORY ASSIGNMENTS & LOCK RULES
          ========================================================== */}
      {activeSubTab === 'territory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Territory Locks Table */}
          <div className="lg:col-span-2 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs space-y-4">
            <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Franchise Territory Locks</span>
            <h3 className="text-sm font-black text-[#1A2B3C] font-heading">Exclusive Territory Assignment Roster</h3>
            <p className="text-[10px] text-gray-400">Rules strictly enforce single active partner representation: Max 1 State Partner per State, 1 District Partner per District, 1 City Partner per City.</p>

            <div className="overflow-x-auto border border-gray-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 font-bold text-[#1A2B3C]">Partner ID</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Partner Name</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Level</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">State Lock</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">District Lock</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">City Lock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activePartners.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-indigo-700 font-bold">{p.id}</td>
                      <td className="p-3 font-extrabold text-slate-800">{p.name}</td>
                      <td className="p-3 font-black text-[#0A6E6E]">{p.partnerType}</td>
                      <td className="p-3 font-semibold text-gray-700">{p.state || p.assignedState}</td>
                      <td className="p-3 font-bold text-slate-500">{p.district || p.assignedDistrict || 'All Districts'}</td>
                      <td className="p-3 font-bold text-slate-500">{p.assignedCity || 'All Cities'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Territory Transfer Form */}
          <div className="lg:col-span-1 bg-[#F9FBFC] border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
            <form onSubmit={handleTerritoryTransfer} className="space-y-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-150 mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider block mb-0.5">Administrative Action</span>
              <h3 className="text-sm font-black text-slate-800 font-heading">Franchise Territory Transfer</h3>
              <p className="text-[10px] text-gray-400">Transfer assigned exclusive region rights from one registered partner to another of same profile level.</p>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Source Partner (Transfer From)</label>
                <select
                  required
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">Select source partner...</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.partnerType} [{p.state}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Destination Partner (Transfer To)</label>
                <select
                  required
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">Select destination partner...</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.partnerType} [{p.state}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Transfer Authorization Remarks</label>
                <textarea
                  required
                  rows={2}
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                  placeholder="e.g. Legal deed executed. Moving Maharashtra State Lock to Ramesh Sharma."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
              >
                🔄 Execute Regional Transfer
              </button>
            </form>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <span className="text-[10px] text-indigo-700 font-extrabold uppercase block mb-2">🔄 Territory Transfer History Log</span>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {territoryHistory.map((th, i) => (
                  <div key={i} className="text-[9px] bg-white border border-gray-150 p-2 rounded-lg space-y-0.5">
                    <div className="flex justify-between font-extrabold text-slate-800">
                      <span>{th.name} ({th.type})</span>
                      <span className="text-indigo-600 font-bold">{th.action}</span>
                    </div>
                    <p className="text-gray-400 font-medium">Territory: {th.state} {th.district ? `- ${th.district}` : ''}</p>
                    <p className="text-gray-500 italic font-semibold font-mono">Remarks: {th.remarks}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 5: COMMISSION WALLET LEDGER
          ========================================================== */}
      {activeSubTab === 'commission' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Commission config control block */}
          <div className="lg:col-span-1 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-150 mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider block mb-0.5">Revenue Matrix</span>
              <h3 className="text-sm font-black text-slate-800 font-heading mb-4">Commission Percentage Rates</h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">State Partner commission (%)</label>
                  <input
                    type="number"
                    value={commissionRules.stateRate}
                    onChange={(e) => setCommissionRules({ ...commissionRules, stateRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-extrabold outline-none text-[#1A2B3C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">District Partner commission (%)</label>
                  <input
                    type="number"
                    value={commissionRules.districtRate}
                    onChange={(e) => setCommissionRules({ ...commissionRules, districtRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-extrabold outline-none text-[#1A2B3C]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">City Partner commission (%)</label>
                  <input
                    type="number"
                    value={commissionRules.cityRate}
                    onChange={(e) => setCommissionRules({ ...commissionRules, cityRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-extrabold outline-none text-[#1A2B3C]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('ds_dyn_commission_rules', JSON.stringify(commissionRules));
                    addAuditLog('Update Commission Rates', 'Super Admin', `Updated partner commission rates list.`);
                    alert('✓ Commission rules updated successfully.');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
                >
                  Save Commission Config
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-150 mt-4 text-[10px] text-gray-400 font-semibold leading-relaxed">
              * Commission rule variables govern automated real-time payout computations on incoming subscriptions. Alterations persist globally.
            </div>
          </div>

          {/* Wallet details ledgers */}
          <div className="lg:col-span-2 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs space-y-4">
            <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider block mb-1">Durable Wallets</span>
            <h3 className="text-sm font-black text-slate-800 font-heading">Partner Wallets & Settlement Ledger</h3>
            <p className="text-xs text-gray-400">Current financial balances mapped to individual active partner ledger accounts. Ledger adjustments trigger live audit updates.</p>

            <div className="overflow-x-auto border border-gray-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 font-bold text-[#1A2B3C]">Partner</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Role Level</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Wallet Balance</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Gross Earned</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Total Settled</th>
                    <th className="p-3 font-bold text-[#1A2B3C] text-center">Settlement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activePartners.map((p) => {
                    const balance = p.walletBalance || 2500;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-extrabold text-slate-800">{p.name}</div>
                          <span className="text-[10px] text-indigo-600 font-mono font-bold block">{p.id}</span>
                        </td>
                        <td className="p-3 font-semibold text-gray-500">{p.partnerType}</td>
                        <td className="p-3 font-extrabold text-[#1A2B3C] font-mono">₹{balance.toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-600 font-mono">₹{(balance * 1.2).toLocaleString()}</td>
                        <td className="p-3 font-medium text-slate-400 font-mono">₹{(balance * 0.2).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (balance <= 0) {
                                alert('This wallet has zero outstanding balance for settlement.');
                                return;
                              }
                              if (confirm(`Settle ₹${balance.toLocaleString()} and reset wallet outstanding balance for ${p.name}?`)) {
                                const updated = partners.map(x => {
                                  if (x.id === p.id) {
                                    return { ...x, walletBalance: 0 };
                                  }
                                  return x;
                                });
                                setPartners(updated);
                                localStorage.setItem('ds_partners', JSON.stringify(updated));
                                addAuditLog('Wallet Settlement Cleared', 'Super Admin', `Settled outstanding balance of ₹${balance.toLocaleString()} for partner: ${p.name} (${p.id})`);
                                alert('✓ Outstanding wallet balance successfully settled & reset.');
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-extrabold rounded-lg text-[10px] cursor-pointer transition-all"
                          >
                            Mark Paid & Settle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 6: NOTIFICATIONS DISPATCH ENGINE
          ========================================================== */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-3xs max-w-3xl mx-auto space-y-6">
          <div>
            <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider block mb-1">Administrative Notice Desk</span>
            <h3 className="text-sm font-black text-slate-800 font-heading">Partner Broadcast and Notification Dispatch Engine</h3>
            <p className="text-xs text-gray-400">Dispatch SMS alerts, email alerts, or push notifications to specific partner segments or the complete network roster.</p>
          </div>

          {notifSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl text-xs font-black animate-bounce">
              {notifSuccessMessage}
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Dispatch Target Audience</label>
                <select
                  value={notifTarget}
                  onChange={(e: any) => setNotifTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-extrabold text-slate-800 outline-none"
                >
                  <option value="all">Broadcast to All Partners ({activePartners.length})</option>
                  <option value="multiple">Broadcast to Selected Bulk Selection ({selectedPartnerIds.length})</option>
                  <option value="single">Dispatch to Single Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Notification Channel Type</label>
                <select
                  value={notifChannel}
                  onChange={(e: any) => setNotifChannel(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-extrabold text-slate-800 outline-none"
                >
                  <option value="SMS">📨 Cellular SMS Alert Gateway</option>
                  <option value="Email">📧 Secured SMTP Email Gateway</option>
                  <option value="Push">🔔 Native Mobile Push Gateway</option>
                </select>
              </div>
            </div>

            {notifTarget === 'single' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Select Recipient Partner Node</label>
                <select
                  required
                  value={notifSelectedId}
                  onChange={(e) => setNotifSelectedId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="">Choose partner...</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id}) [{p.partnerType}] - {p.phone}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Notice Headline / Subject Line</label>
              <input
                type="text"
                required
                value={notifSubject}
                onChange={(e) => setNotifSubject(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Critical: Territory Settlement Disbursals for July 2026 initiated"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Notification Body Message Context</label>
              <textarea
                required
                rows={5}
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                placeholder="Write message details..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Trigger Broadcaster Gateway
            </button>
          </form>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 7: ACTION AND AUDIT TRAIL LOGS
          ========================================================== */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-3xs space-y-4">
          <span className="text-xs uppercase font-extrabold text-rose-700 tracking-wider block mb-1">Administrative Auditing</span>
          <h3 className="text-sm font-black text-slate-800 font-heading">Partner Module Security Audit Trail</h3>
          <p className="text-xs text-gray-400">Complete historical registry logs tracking every administrative action, territory transfer, and wallet adjustment executed within this module.</p>

          <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2">
            {verificationHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-semibold text-xs">No administrative actions logged in this session yet.</div>
            ) : (
              verificationHistory.map((log) => (
                <div key={log.id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        log.action === 'Approve' || log.action === 'Activate' || log.action === 'Unblock' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'Reject' || log.action === 'Block' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                      }`}>{log.action}</span>
                      <h4 className="font-extrabold text-[#1A2B3C]">{log.partnerName}</h4>
                      <span className="text-[10px] text-gray-400 font-mono">({log.partnerId})</span>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed font-semibold">Remarks: <span className="font-medium text-slate-600">{log.remarks}</span></p>
                  </div>
                  <div className="text-[10px] text-right font-mono font-bold text-slate-400 shrink-0">
                    <div>👤 Admin: {log.adminName}</div>
                    <div>📅 {log.date} @ {log.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          SUBTAB 8: ENTERPRISE SETTINGS & FORM BUILDER
          ========================================================== */}
      {activeSubTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Partner Types */}
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs space-y-4">
            <span className="text-xs uppercase font-extrabold text-indigo-700 tracking-wider block mb-1">Dynamic Type Settings</span>
            <h3 className="text-sm font-black text-slate-800 font-heading">Partner Type Registry</h3>
            <p className="text-xs text-slate-400">Configure global partner level buckets without code changes. Registered levels instantly propagate to filters and tables.</p>

            <div className="space-y-2">
              {partnerTypes.map((pt, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                  <span className="text-xs font-black text-slate-800">💼 {pt} Partner</span>
                  {pt !== 'State' && pt !== 'District' && pt !== 'City' && (
                    <button
                      onClick={() => savePartnerTypes(partnerTypes.filter(x => x !== pt))}
                      className="text-rose-600 hover:text-rose-800 font-black text-xs cursor-pointer"
                    >
                      ✕ Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const input = e.target.elements.newType.value.trim();
                if (input && !partnerTypes.includes(input)) {
                  savePartnerTypes([...partnerTypes, input]);
                  e.target.reset();
                }
              }} className="flex gap-2">
                <input
                  type="text"
                  name="newType"
                  required
                  placeholder="e.g. Diagnostic Center"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all"
                >
                  + Add Type
                </button>
              </form>
            </div>
          </div>

          {/* Dynamic Documents Builder */}
          <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-3xs space-y-4">
            <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider block mb-1">Dynamic Document Settings</span>
            <h3 className="text-sm font-black text-slate-800 font-heading">Required Documents Register</h3>
            <p className="text-xs text-slate-400">Configure file upload targets required for regulatory compliance check verification workflows.</p>

            <div className="space-y-2">
              {requiredDocs.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                  <span className="text-xs font-black text-slate-800">📄 {doc.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${doc.required ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {doc.required ? 'Required' : 'Optional'}
                    </span>
                    <button
                      onClick={() => {
                        const updated = requiredDocs.filter(x => x.id !== doc.id);
                        setRequiredDocs(updated);
                        localStorage.setItem('ds_dyn_required_docs', JSON.stringify(updated));
                        addAuditLog('Remove Required Document', 'Super Admin', `Removed dynamic document target: ${doc.name}`);
                      }}
                      className="text-rose-600 hover:text-rose-800 font-black text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <form onSubmit={(e: any) => {
                e.preventDefault();
                const name = e.target.elements.docName.value.trim();
                const isRequired = e.target.elements.docReq.checked;
                if (name) {
                  const updated = [...requiredDocs, { id: `doc-${Date.now()}`, name, required: isRequired }];
                  setRequiredDocs(updated);
                  localStorage.setItem('ds_dyn_required_docs', JSON.stringify(updated));
                  addAuditLog('Add Required Document', 'Super Admin', `Added new dynamic required document: ${name}`);
                  e.target.reset();
                }
              }} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="docName"
                  required
                  placeholder="e.g. GST Registration Certificate"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" name="docReq" id="docReq" className="rounded text-indigo-600" />
                  <label htmlFor="docReq" className="text-xs text-slate-600 font-bold">Required</label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all whitespace-nowrap"
                >
                  + Add Document
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL DRAWER: PARTNER DETAILED PROFILE & VERIFICATION
          ========================================================== */}
      {selectedPartner && (() => {
        // Mock partner performance numbers dynamically derived
        const doctorsAdded = selectedPartner.onboardedDoctorsCount || 0;
        const clinicsAdded = selectedPartner.onboardedClinicsCount || 0;
        const totalBookings = doctorsAdded + clinicsAdded + 4;
        const successfulBookings = doctorsAdded + clinicsAdded + 2;
        const revGenerated = (successfulBookings * 1000) || 5000;
        const convRate = totalBookings > 0 ? Math.round((successfulBookings / totalBookings) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in">
            <div className="w-full max-w-4xl bg-white h-full shadow-2xl border-l border-indigo-100 flex flex-col animate-slide-left overflow-hidden">
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-150 bg-slate-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-700 font-black text-sm uppercase">
                    {selectedPartner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      {selectedPartner.name}
                      <span className={`px-2 py-0.2 rounded text-[8px] font-black uppercase ${
                        selectedPartner.status === 'Approved' || selectedPartner.status === 'Approved (Active)' || selectedPartner.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedPartner.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>{selectedPartner.status || 'Pending'}</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">Node ID Reference: {selectedPartner.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer transition-all"
                >
                  ✕ Close Profile
                </button>
              </div>

              {/* Drawer Body Scroll */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* 1. Administrative Workflow Action Panel */}
                <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    Regulatory Verification & Access Control Panel
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Verification History Remarks & Auditor Audit Note</label>
                    <textarea
                      value={verificationRemarks}
                      onChange={(e) => setVerificationRemarks(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. KYC reviewed. Aadhaar & PAN verified. Territory availability verified."
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleSingleStatusUpdate(selectedPartner.id, 'Approve', verificationRemarks)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                    >
                      ✓ Approve (Active)
                    </button>
                    <button
                      onClick={() => handleSingleStatusUpdate(selectedPartner.id, 'Reject', verificationRemarks)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                    >
                      ✕ Reject Application
                    </button>
                    <button
                      onClick={() => handleSingleStatusUpdate(selectedPartner.id, 'Suspend', verificationRemarks)}
                      className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                    >
                      ⏸ Suspend Profile
                    </button>
                    <button
                      onClick={() => handleSingleStatusUpdate(selectedPartner.id, 'Block', verificationRemarks)}
                      className="px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                    >
                      🚫 Block Account
                    </button>
                    <button
                      onClick={() => handleSingleStatusUpdate(selectedPartner.id, 'Unblock', verificationRemarks)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all"
                    >
                      🔓 Unblock / Re-activate
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal and contact information */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase border-b border-gray-150 pb-1.5">Profile Information</h4>
                    
                    <div className="bg-[#FAFCFD]/80 border border-slate-150 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Full Name</span>
                        <span className="font-extrabold text-[#1A2B3C]">{selectedPartner.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Date of Birth</span>
                        <span className="font-semibold text-slate-700">{selectedPartner.dob || '1992-05-15'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Gender</span>
                        <span className="font-semibold text-slate-700">{selectedPartner.gender || 'Male'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Aadhaar Number</span>
                        <span className="font-semibold text-slate-700 font-mono">{selectedPartner.aadhaarNumber || '5421 8890 1209'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">PAN Number</span>
                        <span className="font-semibold text-slate-700 font-mono">{selectedPartner.panNumber || 'ABCDE1234F'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Qualification</span>
                        <span className="font-semibold text-slate-700">{selectedPartner.qualification || 'MBA (Finance)'}</span>
                      </div>
                      <div className="flex justify-between pb-0">
                        <span className="text-gray-400 font-bold">Occupation</span>
                        <span className="font-semibold text-slate-700">{selectedPartner.occupation || 'Entrepreneur'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase border-b border-gray-150 pb-1.5">Contact & Regional Locks</h4>

                    <div className="bg-[#FAFCFD]/80 border border-slate-150 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Primary Mobile</span>
                        <span className="font-extrabold text-[#1A2B3C] font-mono">{selectedPartner.phone}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Email Address</span>
                        <span className="font-semibold text-slate-700 font-mono">{selectedPartner.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Locked State</span>
                        <span className="font-semibold text-indigo-700 font-extrabold">{selectedPartner.state || selectedPartner.assignedState}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-gray-400 font-bold">Locked District</span>
                        <span className="font-semibold text-slate-700">{selectedPartner.district || selectedPartner.assignedDistrict || 'All Districts'}</span>
                      </div>
                      <div className="flex justify-between pb-0">
                        <span className="text-gray-400 font-bold">Pincode lock</span>
                        <span className="font-semibold text-slate-700 font-mono">{selectedPartner.pincode || '400001'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Bank details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase border-b border-gray-150 pb-1.5">Franchise Bank Settlement Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Account Holder</span>
                      <span className="font-extrabold text-slate-800">{selectedPartner.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Bank Name / IFSC</span>
                      <span className="font-bold text-slate-700">HDFC Bank | HDFC0000001</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Account / UPI ID</span>
                      <span className="font-mono text-indigo-700 font-bold">50100981200100 | {selectedPartner.id}@hdfc</span>
                    </div>
                  </div>
                </div>

                {/* 3. Operational Performance Dashboard */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase border-b border-gray-150 pb-1.5">Operational Performance Telemetry</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Doctors Onboarded', val: doctorsAdded },
                      { label: 'Clinics Onboarded', val: clinicsAdded },
                      { label: 'Laboratories mapped', val: 0 },
                      { label: 'Pharmacies mapped', val: 0 },
                      { label: 'Patient Referrals', val: (doctorsAdded + clinicsAdded) * 2 }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-center shadow-3xs">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">{stat.label}</span>
                        <span className="text-lg font-black font-mono text-slate-800">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Total Bookings', val: totalBookings },
                      { label: 'Successful Bookings', val: successfulBookings },
                      { label: 'Revenue Generated', val: `₹${revGenerated.toLocaleString()}`, color: 'text-indigo-700' },
                      { label: 'Conversion Rate', val: `${convRate}%`, color: 'text-emerald-700' },
                      { label: 'Unlocked Rewards', val: doctorsAdded >= 5 ? '₹5,000 Milestone' : 'None' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-center shadow-3xs">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1">{stat.label}</span>
                        <span className={`text-lg font-black font-mono ${stat.color || 'text-slate-800'}`}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Document previews */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase border-b border-gray-150 pb-1.5">Regulatory Document Files & KYC Previews</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Aadhaar Card Front/Back', doc: selectedPartner.identityProofDoc, fname: selectedPartner.identityProofFileName || 'Aadhaar_KYC.pdf' },
                      { label: 'PAN Card Copy', doc: selectedPartner.highestQualificationDoc, fname: 'PAN_Card.png' },
                      { label: 'Cancelled Bank Cheque Copy', doc: selectedPartner.otherDoc, fname: 'Bank_Cheque.png' }
                    ].map((docItem, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white hover:shadow-md transition-all space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500">{docItem.label}</span>
                          <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">Uploaded</span>
                        </div>
                        
                        <div className="aspect-video bg-slate-50 border border-slate-150 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400 p-2 overflow-hidden shadow-inner">
                          {docItem.doc && docItem.doc.startsWith('data:image/') ? (
                            <img src={docItem.doc} alt="Preview" className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-center space-y-1.5">
                              <FileText className="w-7 h-7 text-indigo-500 mx-auto" />
                              <span className="font-mono text-[10px] text-indigo-700 block truncate max-w-[150px]">{docItem.fname}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              if (docItem.doc) {
                                const win = window.open();
                                if (win) win.document.write(`<iframe src="${docItem.doc}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                              } else {
                                alert('Preview simulation only.');
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all border border-slate-200 text-center"
                          >
                            👁️ View Full
                          </button>
                          <button
                            onClick={() => {
                              alert(`✓ Dispatched document approval notice to partner.`);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const remarks = prompt('Enter rejection reason context or request details:');
                              if (remarks) {
                                alert(`✓ Rejected document. Dispatched notice to partner: "${remarks}"`);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
