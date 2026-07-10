/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  Pill, 
  Boxes, 
  CheckSquare, 
  ShoppingBag, 
  Wallet, 
  FileText, 
  Star, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft,
  Download,
  DollarSign,
  Activity,
  Calendar,
  Users,
  MapPin,
  Upload,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { 
  LabTestCategory, 
  LabTest, 
  LabHealthPackage, 
  LabBooking, 
  Laboratory,
  Partner,
  CommissionRecord
} from '../../types';
import { 
  INITIAL_LAB_CATEGORIES, 
  INITIAL_LAB_TESTS, 
  INITIAL_LAB_PACKAGES, 
  INITIAL_LAB_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS
} from '../../data/labMockData';
import { generateCommission } from '../../data/commissionUtils';

interface LaboratoryDashboardProps {
  setView: (view: string) => void;
  userEmail: string | null;
}

export default function LaboratoryDashboard({ setView, userEmail }: LaboratoryDashboardProps) {
  const emailKey = userEmail ? userEmail.trim().toLowerCase() : '';

  // 1. Load current Laboratory profile
  const [labProfile, setLabProfile] = React.useState<Laboratory | null>(null);

  React.useEffect(() => {
    const savedLabs = localStorage.getItem('ds_laboratories');
    const labsList: Laboratory[] = savedLabs ? JSON.parse(savedLabs) : [];
    let matched = labsList.find(l => l.email.toLowerCase() === emailKey);
    if (!matched && labsList.length > 0) {
      // fallback to first lab
      matched = labsList[0];
    }
    if (matched) {
      setLabProfile(matched);
    } else {
      // create default fallback lab
      const defaultLab: Laboratory = {
        id: 'lab-demo',
        name: 'DoctSpark Central Pathology Labs',
        ownerName: 'Dr. Ramesh Chawla',
        email: emailKey || 'lab@doctspark.in',
        phone: '9876543210',
        licenseNumber: 'MC-9810-NABL',
        address: 'Apex Diagnostic Hub, Ground Floor, Sector 4, Bandra West',
        city: 'Mumbai',
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        status: 'Approved (Active)',
        subscriptionPaid: true,
        createdAt: new Date().toISOString()
      };
      setLabProfile(defaultLab);
      localStorage.setItem('ds_laboratories', JSON.stringify([defaultLab, ...labsList]));
    }
  }, [emailKey]);

  const labId = labProfile?.id || 'lab-demo';
  const labName = labProfile?.name || 'DoctSpark Central Pathology Labs';

  // State Tabs
  const [activeTab, setActiveTab] = React.useState<string>('overview');

  // Core Data Lists (loaded from / synchronized with localStorage)
  const [categories, setCategories] = React.useState<LabTestCategory[]>([]);
  const [tests, setTests] = React.useState<LabTest[]>([]);
  const [packages, setPackages] = React.useState<LabHealthPackage[]>([]);
  const [bookings, setBookings] = React.useState<LabBooking[]>([]);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Modals / Selection states
  const [showNotificationPopup, setShowNotificationPopup] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<LabBooking | null>(null);
  
  // Create / Edit forms state
  const [categoryModal, setCategoryModal] = React.useState<{ show: boolean, editId?: string, name: string, description: string }>({ show: false, name: '', description: '' });
  const [testModal, setTestModal] = React.useState<{ show: boolean, editId?: string, categoryId: string, name: string, description: string, price: number, discount: number, turnaroundTime: string, preparationInstructions: string, homeCollectionEnabled: boolean }>({
    show: false, categoryId: '', name: '', description: '', price: 0, discount: 0, turnaroundTime: '12 Hours', preparationInstructions: '', homeCollectionEnabled: true
  });
  const [packageModal, setPackageModal] = React.useState<{ show: boolean, editId?: string, name: string, description: string, selectedTestIds: string[], price: number, discount: number, turnaroundTime: string, preparationInstructions: string, homeCollectionEnabled: boolean }>({
    show: false, name: '', description: '', selectedTestIds: [], price: 0, discount: 0, turnaroundTime: '24 Hours', preparationInstructions: '', homeCollectionEnabled: true
  });

  // Report Upload state
  const [uploadModal, setUploadModal] = React.useState<{ show: boolean, bookingId: string, fileNames: string[], clinicalNotes: string }>({ show: false, bookingId: '', fileNames: ['NABL_Pathology_Report_Signed.pdf'], clinicalNotes: '' });

  // Quick price adjust state
  const [editingPriceId, setEditingPriceId] = React.useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = React.useState<number>(0);
  const [quickDiscountVal, setQuickDiscountVal] = React.useState<number>(0);

  // Filters & Searches
  const [bookingSearch, setBookingSearch] = React.useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = React.useState('All');
  const [testSearch, setTestSearch] = React.useState('');
  const [testFilterCategory, setTestFilterCategory] = React.useState('All');

  // Load and seed Laboratory Data
  React.useEffect(() => {
    if (!labId) return;

    // 1. Categories
    const savedCats = localStorage.getItem(`ds_lab_cats_${labId}`);
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    } else {
      const defaultCats = INITIAL_LAB_CATEGORIES(labId);
      setCategories(defaultCats);
      localStorage.setItem(`ds_lab_cats_${labId}`, JSON.stringify(defaultCats));
    }

    // 2. Tests
    const savedTests = localStorage.getItem(`ds_lab_tests_${labId}`);
    if (savedTests) {
      setTests(JSON.parse(savedTests));
    } else {
      const defaultTests = INITIAL_LAB_TESTS(labId);
      setTests(defaultTests);
      localStorage.setItem(`ds_lab_tests_${labId}`, JSON.stringify(defaultTests));
    }

    // 3. Packages
    const savedPkgs = localStorage.getItem(`ds_lab_pkgs_${labId}`);
    if (savedPkgs) {
      setPackages(JSON.parse(savedPkgs));
    } else {
      const defaultPkgs = INITIAL_LAB_PACKAGES(labId);
      setPackages(defaultPkgs);
      localStorage.setItem(`ds_lab_pkgs_${labId}`, JSON.stringify(defaultPkgs));
    }

    // 4. Bookings (Patient database synchronized)
    const savedBookings = localStorage.getItem('ds_lab_bookings');
    if (savedBookings) {
      const parsedBookings: LabBooking[] = JSON.parse(savedBookings);
      // Filter bookings matching this laboratory
      setBookings(parsedBookings.filter(b => b.labId === labId));
    } else {
      const defaultBookings = INITIAL_LAB_BOOKINGS(labId, labName);
      setBookings(defaultBookings);
      // save globally
      localStorage.setItem('ds_lab_bookings', JSON.stringify(defaultBookings));
    }

    // 5. Reviews
    const savedReviews = localStorage.getItem(`ds_lab_reviews_${labId}`);
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      setReviews(INITIAL_REVIEWS);
      localStorage.setItem(`ds_lab_reviews_${labId}`, JSON.stringify(INITIAL_REVIEWS));
    }

    // 6. Notifications
    const savedNotifs = localStorage.getItem(`ds_lab_notifs_${labId}`);
    if (savedNotifs) {
      setNotifications(JSON.parse(savedNotifs));
    } else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem(`ds_lab_notifs_${labId}`, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }, [labId, labName]);

  // Sync back local bookings to global `ds_lab_bookings`
  const updateGlobalBookings = (updatedLocalList: LabBooking[]) => {
    setBookings(updatedLocalList);
    try {
      const savedGlobal = localStorage.getItem('ds_lab_bookings');
      let globalList: LabBooking[] = savedGlobal ? JSON.parse(savedGlobal) : [];
      // remove existing bookings of this laboratory and replace with updated ones
      globalList = globalList.filter(b => b.labId !== labId).concat(updatedLocalList);
      localStorage.setItem('ds_lab_bookings', JSON.stringify(globalList));
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Edit save
  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!labProfile) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    
    const updatedLab: Laboratory = {
      ...labProfile,
      name: String(data.get('name')),
      ownerName: String(data.get('ownerName')),
      phone: String(data.get('phone')),
      address: String(data.get('address')),
      city: String(data.get('city')),
      district: String(data.get('district')),
      state: String(data.get('state')),
      pincode: String(data.get('pincode')),
      licenseNumber: String(data.get('licenseNumber'))
    };

    setLabProfile(updatedLab);
    // save to ds_laboratories
    try {
      const savedLabs = localStorage.getItem('ds_laboratories');
      const labsList: Laboratory[] = savedLabs ? JSON.parse(savedLabs) : [];
      const updatedList = labsList.map(l => l.id === updatedLab.id ? updatedLab : l);
      localStorage.setItem('ds_laboratories', JSON.stringify(updatedList));
      alert('Laboratory Profile updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // Test Categories CRUD
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryModal.name) return;

    let updatedList = [...categories];
    if (categoryModal.editId) {
      updatedList = updatedList.map(c => c.id === categoryModal.editId ? { ...c, name: categoryModal.name, description: categoryModal.description } : c);
    } else {
      const newCat: LabTestCategory = {
        id: `cat-${Date.now()}`,
        labId,
        name: categoryModal.name,
        description: categoryModal.description,
        createdAt: new Date().toISOString()
      };
      updatedList.push(newCat);
    }

    setCategories(updatedList);
    localStorage.setItem(`ds_lab_cats_${labId}`, JSON.stringify(updatedList));
    setCategoryModal({ show: false, name: '', description: '' });
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Are you sure you want to delete this test category?')) {
      const updatedList = categories.filter(c => c.id !== id);
      setCategories(updatedList);
      localStorage.setItem(`ds_lab_cats_${labId}`, JSON.stringify(updatedList));
    }
  };

  // Test CRUD
  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModal.name || !testModal.categoryId) return;

    let updatedList = [...tests];
    if (testModal.editId) {
      updatedList = updatedList.map(t => t.id === testModal.editId ? {
        ...t,
        categoryId: testModal.categoryId,
        name: testModal.name,
        description: testModal.description,
        price: Number(testModal.price),
        discount: Number(testModal.discount),
        turnaroundTime: testModal.turnaroundTime,
        preparationInstructions: testModal.preparationInstructions,
        homeCollectionEnabled: testModal.homeCollectionEnabled
      } : t);
    } else {
      const newTest: LabTest = {
        id: `test-${Date.now()}`,
        labId,
        categoryId: testModal.categoryId,
        name: testModal.name,
        description: testModal.description,
        price: Number(testModal.price),
        discount: Number(testModal.discount),
        turnaroundTime: testModal.turnaroundTime,
        preparationInstructions: testModal.preparationInstructions,
        homeCollectionEnabled: testModal.homeCollectionEnabled,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      updatedList.push(newTest);
    }

    setTests(updatedList);
    localStorage.setItem(`ds_lab_tests_${labId}`, JSON.stringify(updatedList));
    setTestModal({
      show: false, categoryId: '', name: '', description: '', price: 0, discount: 0, turnaroundTime: '12 Hours', preparationInstructions: '', homeCollectionEnabled: true
    });
  };

  const handleDeleteTest = (id: string) => {
    if (window.confirm('Are you sure you want to delete this test from your catalog?')) {
      const updatedList = tests.filter(t => t.id !== id);
      setTests(updatedList);
      localStorage.setItem(`ds_lab_tests_${labId}`, JSON.stringify(updatedList));
    }
  };

  // Packages CRUD
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageModal.name || packageModal.selectedTestIds.length === 0) {
      alert('Please fill in package name and select at least 1 diagnostic test.');
      return;
    }

    let updatedList = [...packages];
    if (packageModal.editId) {
      updatedList = updatedList.map(p => p.id === packageModal.editId ? {
        ...p,
        name: packageModal.name,
        description: packageModal.description,
        testIds: packageModal.selectedTestIds,
        price: Number(packageModal.price),
        discount: Number(packageModal.discount),
        turnaroundTime: packageModal.turnaroundTime,
        preparationInstructions: packageModal.preparationInstructions,
        homeCollectionEnabled: packageModal.homeCollectionEnabled
      } : p);
    } else {
      const newPkg: LabHealthPackage = {
        id: `pkg-${Date.now()}`,
        labId,
        name: packageModal.name,
        description: packageModal.description,
        testIds: packageModal.selectedTestIds,
        price: Number(packageModal.price),
        discount: Number(packageModal.discount),
        turnaroundTime: packageModal.turnaroundTime,
        preparationInstructions: packageModal.preparationInstructions,
        homeCollectionEnabled: packageModal.homeCollectionEnabled,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      updatedList.push(newPkg);
    }

    setPackages(updatedList);
    localStorage.setItem(`ds_lab_pkgs_${labId}`, JSON.stringify(updatedList));
    setPackageModal({
      show: false, name: '', description: '', selectedTestIds: [], price: 0, discount: 0, turnaroundTime: '24 Hours', preparationInstructions: '', homeCollectionEnabled: true
    });
  };

  const handleDeletePackage = (id: string) => {
    if (window.confirm('Are you sure you want to delete this health package?')) {
      const updatedList = packages.filter(p => p.id !== id);
      setPackages(updatedList);
      localStorage.setItem(`ds_lab_pkgs_${labId}`, JSON.stringify(updatedList));
    }
  };

  // Quick Price Adjust
  const handleQuickPriceUpdate = (id: string, type: 'test' | 'package') => {
    if (type === 'test') {
      const updated = tests.map(t => t.id === id ? { ...t, price: quickPriceVal, discount: quickDiscountVal } : t);
      setTests(updated);
      localStorage.setItem(`ds_lab_tests_${labId}`, JSON.stringify(updated));
    } else {
      const updated = packages.map(p => p.id === id ? { ...p, price: quickPriceVal, discount: quickDiscountVal } : p);
      setPackages(updated);
      localStorage.setItem(`ds_lab_pkgs_${labId}`, JSON.stringify(updated));
    }
    setEditingPriceId(null);
  };

  // Booking updates
  const handleUpdateBookingStatus = (bookingId: string, newStatus: LabBooking['status'], additionalChanges?: Partial<LabBooking>) => {
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        const item: LabBooking = {
          ...b,
          status: newStatus,
          ...additionalChanges
        };

        // Trigger Commission generation automatically if status switches to 'Report Ready' or 'Report Delivered' or 'Confirmed'
        // Let's generate it once if it's not already generated!
        if (newStatus === 'Confirmed' && b.paymentStatus === 'Paid') {
          generateCommission('LabBooking', b.id, `Diagnostic booking: ${b.id}`, b.finalAmount);
        }

        // Notify patient
        const newNotification = {
          id: `not-${Date.now()}`,
          title: `Diagnostic Booking Status: ${newStatus}`,
          message: `Your booking ${b.id} with ${labName} is now: ${newStatus}.`,
          date: new Date().toISOString(),
          read: false
        };

        // simulated triggers
        console.log(`[Push Notification / SMS Triggered to ${b.patientPhone}]: ${newNotification.message}`);

        return item;
      }
      return b;
    });

    updateGlobalBookings(updated);
    if (selectedBooking && selectedBooking.id === bookingId) {
      const match = updated.find(b => b.id === bookingId);
      if (match) setSelectedBooking(match);
    }

    // append to local notifications
    const updatedNotifs = [
      { id: `not-${Date.now()}`, title: 'Booking Status Updated', message: `Booking ${bookingId} transitioned to ${newStatus}.`, date: new Date().toISOString(), read: false },
      ...notifications
    ];
    setNotifications(updatedNotifs);
    localStorage.setItem(`ds_lab_notifs_${labId}`, JSON.stringify(updatedNotifs));
  };

  // Report uploading multi-files
  const handleUploadReports = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadModal.fileNames.length === 0) return;

    const reportFiles = uploadModal.fileNames.map(f => ({
      name: f,
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // simulate standard verified medical report host
      uploadedAt: new Date().toISOString(),
      notes: uploadModal.clinicalNotes
    }));

    handleUpdateBookingStatus(uploadModal.bookingId, 'Report Ready', {
      reports: reportFiles
    });

    setUploadModal({ show: false, bookingId: '', fileNames: ['NABL_Pathology_Report_Signed.pdf'], clinicalNotes: '' });
    alert('Laboratory Medical Report compiled & dispatched successfully! Patient notified.');
  };

  // Notifications read trigger
  const handleClearNotif = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem(`ds_lab_notifs_${labId}`, JSON.stringify(updated));
  };

  // Analytics Exports
  const handleExportData = (type: 'CSV' | 'Excel' | 'PDF') => {
    let content = "Booking ID,Patient Name,Booking Type,Date,Amount,Status\n";
    bookings.forEach(b => {
      content += `${b.id},${b.patientName},${b.bookingType},${b.preferredDate},₹${b.finalAmount},${b.status}\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DoctSpark_Lab_Report_${labId}_export.${type.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Financial Calculations for Wallet Tab
  const totalEarnings = bookings
    .filter(b => b.paymentStatus === 'Paid' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + b.finalAmount, 0);

  const pendingSettlement = bookings
    .filter(b => b.paymentStatus === 'Paid' && !['Report Ready', 'Report Delivered'].includes(b.status))
    .reduce((sum, b) => sum + b.finalAmount, 0);

  const availableBalance = totalEarnings - pendingSettlement;

  // Render Subviews
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick stats panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">Total Bookings</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">{bookings.length}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ Active Diagnostic Stream</span>
                </div>
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">Home Collections</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">
                    {bookings.filter(b => b.bookingType === 'Home Sample Collection').length}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold block mt-1">✓ Fleet dispatch ready</span>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">Net Lab Revenue</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">₹{totalEarnings.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 block mt-1">Platform fee of 5% (deducted)</span>
                </div>
                <div className="w-12 h-12 bg-[#F0F7F7] rounded-xl flex items-center justify-center text-[#0A6E6E] border border-[#D1E5E5]">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-emerald-200 p-5 rounded-2xl flex items-center justify-between shadow-sm bg-emerald-50/20">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-800 block tracking-wider">Available Balance</span>
                  <span className="text-2xl font-black text-emerald-950 block mt-1">₹{availableBalance.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1">Settled on Fri payout</span>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 border border-emerald-200">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Action Bento Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Bookings Quick list */}
              <div className="md:col-span-2 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                  <h3 className="text-sm font-black text-slate-800 font-heading">Recent Clinical Orders</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs text-[#0A6E6E] font-extrabold hover:underline">View All</button>
                </div>
                {bookings.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No bookings found. Onboarding tests to directory.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">{b.patientName}</span>
                            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${b.bookingType === 'Home Sample Collection' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {b.bookingType}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Pref Date: <span className="font-bold">{b.preferredDate}</span> ({b.preferredTime})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">₹{b.finalAmount}</span>
                          <span className={`text-[9px] font-extrabold uppercase ${b.status === 'Report Ready' ? 'text-emerald-600' : b.status === 'Pending' ? 'text-amber-500' : 'text-indigo-600'}`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats and ratings */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 font-heading mb-3">Facility Reputation</h3>
                  <div className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-xl p-4 text-center">
                    <span className="text-3xl font-black text-slate-800 block">4.8</span>
                    <div className="flex justify-center gap-0.5 my-1.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
                    </div>
                    <span className="text-[10px] text-gray-500 block">Based on verified patient reviews</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 mt-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>NABL Audits</span>
                    <span className="font-bold text-emerald-600">✓ Compliance verified</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">License No: MC-9810-NABL</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'bookings':
        const filteredBookings = bookings.filter(b => {
          const matchS = b.patientName.toLowerCase().includes(bookingSearch.toLowerCase()) || b.id.toLowerCase().includes(bookingSearch.toLowerCase());
          const matchF = bookingFilterStatus === 'All' || b.status === bookingFilterStatus;
          return matchS && matchF;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-white border border-[#D1E5E5] p-4 rounded-xl">
              <div className="flex items-center gap-2 w-full md:w-auto bg-[#F0F7F7] border border-[#D1E5E5] rounded-lg px-2 py-1.5">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Patient name or ID..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Filter Status:</span>
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="bg-white border border-[#D1E5E5] rounded-lg p-1.5 text-xs font-semibold"
                >
                  <option value="All">All Bookings</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Sample Collection Scheduled">Collection Scheduled</option>
                  <option value="Sample Collected">Sample Collected</option>
                  <option value="Sample Received">Sample Received</option>
                  <option value="Testing In Progress">Testing In Progress</option>
                  <option value="Report Ready">Report Ready</option>
                  <option value="Report Delivered">Report Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-[#D1E5E5] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5] text-[10px] uppercase font-extrabold text-slate-700">
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Patient Details</th>
                    <th className="p-4">Tests/Packages</th>
                    <th className="p-4">Date/Type</th>
                    <th className="p-4">Amt</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400">
                        No patient diagnostic bookings match filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-indigo-700">{b.id}</td>
                        <td className="p-4">
                          <span className="font-black text-slate-800 block">{b.patientName}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{b.patientPhone}</span>
                        </td>
                        <td className="p-4">
                          <div className="max-w-xs space-y-0.5">
                            {b.tests.map(t => (
                              <span key={t.testId} className="inline-block text-[9px] bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 rounded font-medium mr-1 mb-1">
                                🔬 {t.name}
                              </span>
                            ))}
                            {b.packages.map(p => (
                              <span key={p.packageId} className="inline-block text-[9px] bg-indigo-50 text-indigo-800 border border-indigo-100 px-1.5 py-0.5 rounded font-medium mr-1 mb-1">
                                📦 {p.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-700 block">{b.preferredDate}</span>
                          <span className={`text-[9px] font-extrabold mt-0.5 block ${b.bookingType === 'Home Sample Collection' ? 'text-indigo-600' : 'text-amber-600'}`}>
                            {b.bookingType}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">₹{b.finalAmount}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            b.status === 'Report Ready' || b.status === 'Report Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            b.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => setSelectedBooking(b)}
                              className="px-2.5 py-1 border border-[#D1E5E5] hover:bg-[#F0F7F7] text-slate-700 rounded text-[10px] font-black cursor-pointer"
                            >
                              Manage Flow
                            </button>
                            {b.status !== 'Report Ready' && b.status !== 'Report Delivered' && b.status !== 'Cancelled' && (
                              <button
                                onClick={() => setUploadModal({ show: true, bookingId: b.id, fileNames: ['NABL_Pathology_Report_Signed.pdf'], clinicalNotes: '' })}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-black cursor-pointer"
                              >
                                Dispatch Report
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected Booking detail panel modal */}
            {selectedBooking && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white border border-[#D1E5E5] rounded-2xl w-full max-w-xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
                  <div className="bg-[#F0F7F7] border-b border-[#D1E5E5] p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#0A6E6E] uppercase tracking-wider block">Diagnostic Process Control</span>
                      <h3 className="text-sm font-black text-slate-800 font-heading">Booking: {selectedBooking.id}</h3>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[450px] overflow-y-auto text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400 block font-bold uppercase text-[9px] tracking-wider">Patient Details</span>
                        <p className="font-black text-slate-800 mt-1">{selectedBooking.patientName}</p>
                        <p className="text-gray-500">{selectedBooking.patientPhone}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{selectedBooking.patientEmail}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold uppercase text-[9px] tracking-wider">Preferred Slots</span>
                        <p className="font-bold text-slate-800 mt-1">{selectedBooking.preferredDate}</p>
                        <p className="text-gray-500">{selectedBooking.preferredTime}</p>
                      </div>
                    </div>

                    {selectedBooking.bookingType === 'Home Sample Collection' && (
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <span className="text-indigo-950 font-black flex items-center gap-1.5 mb-1 text-[10px] uppercase">
                          <Truck className="w-3.5 h-3.5" /> Home Pickup Address Details
                        </span>
                        <p className="font-semibold text-indigo-900 leading-relaxed">{selectedBooking.patientAddress}</p>
                        <p className="text-[10px] text-indigo-500 mt-1">Location Lock: {selectedBooking.patientCity}, {selectedBooking.patientState} - {selectedBooking.patientPincode}</p>
                        {selectedBooking.notes && (
                          <div className="bg-white/80 border border-indigo-100 p-2 rounded mt-2 text-slate-600 italic">
                            Patient Notes: "{selectedBooking.notes}"
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-3">
                      <span className="text-gray-400 block font-bold uppercase text-[9px] tracking-wider mb-2">Advance Workflow Progress Tracking</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <button
                          onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Confirmed')}
                          className="p-2 border border-gray-100 bg-teal-50/20 hover:bg-teal-50 rounded text-center font-bold text-[10px] cursor-pointer text-[#0A6E6E]"
                        >
                          ✓ Confirm Booking
                        </button>
                        
                        {selectedBooking.bookingType === 'Home Sample Collection' && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Sample Collection Scheduled')}
                              className="p-2 border border-gray-100 bg-indigo-50/20 hover:bg-indigo-50 rounded text-center font-bold text-[10px] cursor-pointer text-indigo-700"
                            >
                              📅 Schedule Fleet Agent
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Sample Collected')}
                              className="p-2 border border-gray-100 bg-sky-50/20 hover:bg-sky-50 rounded text-center font-bold text-[10px] cursor-pointer text-sky-700"
                            >
                              🧪 Mark Sample Collected
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Sample Received')}
                          className="p-2 border border-gray-100 bg-amber-50/20 hover:bg-amber-50 rounded text-center font-bold text-[10px] cursor-pointer text-amber-700"
                        >
                          📥 Mark Sample Received
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Testing In Progress')}
                          className="p-2 border border-gray-100 bg-purple-50/20 hover:bg-purple-50 rounded text-center font-bold text-[10px] cursor-pointer text-purple-700"
                        >
                          ⚙ Testing In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'Cancelled')}
                          className="p-2 border border-rose-100 bg-rose-50/20 hover:bg-rose-50 rounded text-center font-bold text-[10px] cursor-pointer text-rose-700"
                        >
                          ✕ Cancel Booking
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
                    <button onClick={() => setSelectedBooking(null)} className="px-4 py-2 bg-slate-200 text-slate-800 font-extrabold rounded-lg hover:bg-slate-300 cursor-pointer">
                      Close Detail Portal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'home-collection':
        const collectionBookings = bookings.filter(b => b.bookingType === 'Home Sample Collection');
        return (
          <div className="space-y-6">
            <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Logistics Operational Dispatch Desk</span>
              <h3 className="text-sm font-black text-slate-800 font-heading">Home Sample Collection Fleet Requests</h3>
              <p className="text-xs text-gray-400 mt-1">Manage and assign pathology collectors to patients' map locations and homes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collectionBookings.map(b => (
                <div key={b.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <div>
                      <span className="text-xs font-black text-slate-800">{b.patientName}</span>
                      <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">📅 Slots: {b.preferredDate} ({b.preferredTime})</span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded ${
                      b.status === 'Sample Collected' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      b.status === 'Sample Collection Scheduled' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{b.patientAddress}</p>
                        <p className="text-[10px] text-gray-400">{b.patientCity}, {b.patientState} - {b.patientPincode}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-[#D1E5E5] rounded-xl p-3">
                      <span className="text-[10px] uppercase font-extrabold text-gray-500 block">Assigned Logistics Collector Agent</span>
                      <p className="font-bold text-slate-800 mt-0.5">DoctSpark Pathologist Fleet Agent</p>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ Real-time map route lock active</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => handleUpdateBookingStatus(b.id, 'Sample Collection Scheduled')}
                      className="px-3 py-1.5 border border-indigo-200 hover:bg-indigo-50 text-indigo-800 font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      Assign Collector & Schedule
                    </button>
                    <button
                      onClick={() => handleUpdateBookingStatus(b.id, 'Sample Collected')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      Mark Sample Collected
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-[#D1E5E5] p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-black text-slate-800 font-heading">Diagnostic Test Categories</h3>
                <p className="text-[11px] text-gray-500">Group laboratory tests by medical department specialty.</p>
              </div>
              <button
                onClick={() => setCategoryModal({ show: true, name: '', description: '' })}
                className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Department Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(c => (
                <div key={c.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono bg-teal-50 border border-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">
                      {c.id}
                    </span>
                    <h4 className="text-sm font-black text-slate-800 mt-2 font-heading">{c.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{c.description || 'No department summary available.'}</p>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-4">
                    <button
                      onClick={() => setCategoryModal({ show: true, editId: c.id, name: c.name, description: c.description || '' })}
                      className="p-1.5 hover:bg-[#F0F7F7] text-teal-700 rounded border border-gray-100 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded border border-gray-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Category creation modal */}
            {categoryModal.show && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleSaveCategory} className="bg-white border border-[#D1E5E5] rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
                  <div className="bg-[#F0F7F7] border-b border-[#D1E5E5] p-4 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 font-heading">
                      {categoryModal.editId ? 'Edit Specialty Category' : 'Create Pathology Category'}
                    </h3>
                    <button type="button" onClick={() => setCategoryModal({ show: false, name: '', description: '' })} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category / Department Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={categoryModal.name}
                        onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        placeholder="e.g. Serology, Biochemistry"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Department Description</label>
                      <textarea
                        value={categoryModal.description}
                        onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        rows={3}
                        placeholder="Clinical overview..."
                      />
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-50 bg-slate-50 flex justify-end gap-2">
                    <button type="button" onClick={() => setCategoryModal({ show: false, name: '', description: '' })} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-[#0A6E6E] text-white rounded text-xs font-black cursor-pointer">
                      Save Department
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        );

      case 'tests':
        const filteredTests = tests.filter(t => {
          const matchS = t.name.toLowerCase().includes(testSearch.toLowerCase());
          const matchC = testFilterCategory === 'All' || t.categoryId === testFilterCategory;
          return matchS && matchC;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white border border-[#D1E5E5] p-4 rounded-xl">
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-[#F0F7F7] border border-[#D1E5E5] rounded-lg px-2 py-1.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search diagnostic tests..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
                  />
                </div>
                <select
                  value={testFilterCategory}
                  onChange={(e) => setTestFilterCategory(e.target.value)}
                  className="bg-white border border-[#D1E5E5] rounded-lg p-1.5 text-xs font-semibold"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setTestModal({ show: true, categoryId: categories[0]?.id || '', name: '', description: '', price: 0, discount: 0, turnaroundTime: '12 Hours', preparationInstructions: '', homeCollectionEnabled: true })}
                className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm w-full md:w-auto justify-center"
              >
                <Plus className="w-4 h-4" /> Onboard Individual Test
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTests.map(t => {
                const category = categories.find(c => c.id === t.categoryId);
                const isEditing = editingPriceId === t.id;

                return (
                  <div key={t.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-extrabold text-[#0A6E6E] bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                          {category?.name || 'Department'}
                        </span>
                        {t.homeCollectionEnabled && (
                          <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 rounded font-bold">
                            🏠 Home Sample
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-800 mt-2 font-heading leading-tight">{t.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-1 leading-normal line-clamp-2">{t.description}</p>
                    </div>

                    <div className="bg-slate-50 border border-[#D1E5E5] rounded-xl p-3 text-[11px] space-y-1">
                      <p className="text-slate-500 font-bold">⏱ Turnaround: <span className="text-slate-800">{t.turnaroundTime}</span></p>
                      {t.preparationInstructions && (
                        <p className="text-slate-500 line-clamp-1 italic">📌 Prep: {t.preparationInstructions}</p>
                      )}
                    </div>

                    {/* Pricing Display / Adjuster */}
                    <div className="border-t border-gray-100 pt-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold uppercase">Price (₹)</label>
                              <input
                                type="number"
                                value={quickPriceVal}
                                onChange={(e) => setQuickPriceVal(Number(e.target.value))}
                                className="w-full bg-white border border-[#D1E5E5] p-1 rounded text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold uppercase">Discount (%)</label>
                              <input
                                type="number"
                                value={quickDiscountVal}
                                onChange={(e) => setQuickDiscountVal(Number(e.target.value))}
                                className="w-full bg-white border border-[#D1E5E5] p-1 rounded text-xs font-semibold"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingPriceId(null)} className="px-2 py-0.5 bg-slate-100 text-gray-600 rounded text-[9px] font-black cursor-pointer">Cancel</button>
                            <button onClick={() => handleQuickPriceUpdate(t.id, 'test')} className="px-2.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black cursor-pointer">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs text-slate-800 font-black">₹{t.price - (t.price * (t.discount || 0) / 100)}</span>
                            {t.discount > 0 && (
                              <span className="text-[10px] text-gray-400 line-through ml-1.5">₹{t.price}</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingPriceId(t.id);
                              setQuickPriceVal(t.price);
                              setQuickDiscountVal(t.discount);
                            }}
                            className="text-[10px] font-black text-[#0A6E6E] hover:underline"
                          >
                            ₹ Adjust Pricing
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-50 pt-2.5">
                      <button
                        onClick={() => setTestModal({
                          show: true,
                          editId: t.id,
                          categoryId: t.categoryId,
                          name: t.name,
                          description: t.description,
                          price: t.price,
                          discount: t.discount,
                          turnaroundTime: t.turnaroundTime,
                          preparationInstructions: t.preparationInstructions || '',
                          homeCollectionEnabled: t.homeCollectionEnabled
                        })}
                        className="p-1.5 hover:bg-[#F0F7F7] text-teal-700 rounded border border-gray-100 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTest(t.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded border border-gray-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Test creation/editing modal */}
            {testModal.show && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleSaveTest} className="bg-white border border-[#D1E5E5] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
                  <div className="bg-[#F0F7F7] border-b border-[#D1E5E5] p-4 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 font-heading">
                      {testModal.editId ? 'Modify Pathology Test' : 'Onboard New Pathology Test'}
                    </h3>
                    <button type="button" onClick={() => setTestModal({ ...testModal, show: false })} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>
                  <div className="p-5 space-y-3 text-xs max-h-[400px] overflow-y-auto">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Select Specialty Category *</label>
                      <select
                        value={testModal.categoryId}
                        onChange={(e) => setTestModal({ ...testModal, categoryId: e.target.value })}
                        className="w-full bg-white border border-[#D1E5E5] p-2 rounded font-semibold"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Diagnostic Test Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={testModal.name}
                        onChange={(e) => setTestModal({ ...testModal, name: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        placeholder="e.g. Vitamin D3 (25-Hydroxy)"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Clinical Description *</label>
                      <textarea
                        required
                        value={testModal.description}
                        onChange={(e) => setTestModal({ ...testModal, description: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        rows={2}
                        placeholder="Purpose of this diagnostic test..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                        <input 
                          type="number" 
                          required 
                          value={testModal.price || ''}
                          onChange={(e) => setTestModal({ ...testModal, price: Number(e.target.value) })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. 800"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Discount (%)</label>
                        <input 
                          type="number" 
                          value={testModal.discount || ''}
                          onChange={(e) => setTestModal({ ...testModal, discount: Number(e.target.value) })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. 15"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Turnaround Time *</label>
                        <input 
                          type="text" 
                          required 
                          value={testModal.turnaroundTime}
                          onChange={(e) => setTestModal({ ...testModal, turnaroundTime: e.target.value })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. 12 Hours"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Preparation Instructions</label>
                        <input 
                          type="text" 
                          value={testModal.preparationInstructions}
                          onChange={(e) => setTestModal({ ...testModal, preparationInstructions: e.target.value })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. Fasting required"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 select-none cursor-pointer mt-2 font-bold text-slate-700">
                      <input 
                        type="checkbox" 
                        checked={testModal.homeCollectionEnabled}
                        onChange={(e) => setTestModal({ ...testModal, homeCollectionEnabled: e.target.checked })}
                        className="accent-[#0A6E6E]"
                      />
                      <span>Enable Home Sample Collection for this test</span>
                    </label>
                  </div>
                  <div className="p-4 border-t border-gray-50 bg-slate-50 flex justify-end gap-2">
                    <button type="button" onClick={() => setTestModal({ ...testModal, show: false })} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-[#0A6E6E] text-white rounded text-xs font-black cursor-pointer">
                      Save Diagnostic Test
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        );

      case 'packages':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-[#D1E5E5] p-4 rounded-xl">
              <div>
                <h3 className="text-sm font-black text-slate-800 font-heading">Comprehensive Health Packages</h3>
                <p className="text-[11px] text-gray-500 font-medium">Bundle multiple individual tests together into comprehensive health checkups.</p>
              </div>
              <button
                onClick={() => setPackageModal({ show: true, name: '', description: '', selectedTestIds: [], price: 0, discount: 0, turnaroundTime: '24 Hours', preparationInstructions: '', homeCollectionEnabled: true })}
                className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
              >
                <Plus className="w-4 h-4" /> Assemble Health Package
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map(p => {
                const isEditing = editingPriceId === p.id;
                return (
                  <div key={p.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 font-heading leading-tight">{p.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{p.description}</p>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded ${p.homeCollectionEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
                        {p.homeCollectionEnabled ? '🏠 Home Sample' : 'Walk-In'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Bundle Contents ({p.testIds.length} Tests)</span>
                      <div className="flex flex-wrap gap-1">
                        {p.testIds.map(tId => {
                          const testObj = tests.find(t => t.id === tId);
                          return (
                            <span key={tId} className="text-[9px] bg-teal-50 border border-teal-100 text-teal-800 px-1.5 rounded font-medium">
                              🔬 {testObj?.name || 'Diagnostic test'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-[#D1E5E5] p-3 rounded-xl text-[11px] space-y-1">
                      <p className="text-slate-500 font-bold">⏱ Expected Report: {p.turnaroundTime}</p>
                      <p className="text-slate-500 line-clamp-1 italic">📌 Guidelines: {p.preparationInstructions || 'Fasting check guidelines'}</p>
                    </div>

                    {/* Quick Pricing Adjust */}
                    <div className="border-t border-gray-100 pt-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            <div>
                              <label className="text-gray-400 font-bold uppercase block mb-0.5">Price (₹)</label>
                              <input
                                type="number"
                                value={quickPriceVal}
                                onChange={(e) => setQuickPriceVal(Number(e.target.value))}
                                className="w-full bg-white border border-[#D1E5E5] p-1 rounded text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-gray-400 font-bold uppercase block mb-0.5">Discount (%)</label>
                              <input
                                type="number"
                                value={quickDiscountVal}
                                onChange={(e) => setQuickDiscountVal(Number(e.target.value))}
                                className="w-full bg-white border border-[#D1E5E5] p-1 rounded text-xs font-semibold"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingPriceId(null)} className="px-2 py-0.5 bg-slate-100 text-gray-600 rounded text-[9px] font-black cursor-pointer">Cancel</button>
                            <button onClick={() => handleQuickPriceUpdate(p.id, 'package')} className="px-2.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black cursor-pointer">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs text-slate-800 font-black">₹{p.price - (p.price * (p.discount || 0) / 100)}</span>
                            {p.discount > 0 && (
                              <span className="text-[10px] text-gray-400 line-through ml-1.5">₹{p.price}</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingPriceId(p.id);
                              setQuickPriceVal(p.price);
                              setQuickDiscountVal(p.discount);
                            }}
                            className="text-[10px] font-black text-[#0A6E6E] hover:underline"
                          >
                            ₹ Adjust Pricing
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-50 pt-2.5">
                      <button
                        onClick={() => setPackageModal({
                          show: true,
                          editId: p.id,
                          name: p.name,
                          description: p.description,
                          selectedTestIds: p.testIds,
                          price: p.price,
                          discount: p.discount,
                          turnaroundTime: p.turnaroundTime,
                          preparationInstructions: p.preparationInstructions || '',
                          homeCollectionEnabled: p.homeCollectionEnabled
                        })}
                        className="p-1.5 hover:bg-[#F0F7F7] text-teal-700 rounded border border-gray-100 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePackage(p.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded border border-gray-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assemble Package Modal */}
            {packageModal.show && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleSavePackage} className="bg-white border border-[#D1E5E5] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
                  <div className="bg-[#F0F7F7] border-b border-[#D1E5E5] p-4 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 font-heading">
                      {packageModal.editId ? 'Edit Assembled Package' : 'Assemble Health Package'}
                    </h3>
                    <button type="button" onClick={() => setPackageModal({ ...packageModal, show: false })} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>
                  <div className="p-5 space-y-3 text-xs max-h-[400px] overflow-y-auto">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Package Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={packageModal.name}
                        onChange={(e) => setPackageModal({ ...packageModal, name: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        placeholder="e.g. Full Body Active Wellness"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bundle Description</label>
                      <textarea
                        value={packageModal.description}
                        onChange={(e) => setPackageModal({ ...packageModal, description: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        rows={2}
                        placeholder="Key pathology parameters screened..."
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase text-[9px] tracking-wider text-teal-800">Select Diagnostic Tests to include (Multi-select) *</label>
                      <div className="border border-[#D1E5E5] p-3 rounded-xl max-h-[120px] overflow-y-auto space-y-1.5 bg-slate-50">
                        {tests.map(t => {
                          const isChecked = packageModal.selectedTestIds.includes(t.id);
                          return (
                            <label key={t.id} className="flex items-center gap-2 select-none cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                className="accent-[#0A6E6E]"
                                onChange={() => {
                                  let current = [...packageModal.selectedTestIds];
                                  if (isChecked) {
                                    current = current.filter(id => id !== t.id);
                                  } else {
                                    current.push(t.id);
                                  }
                                  setPackageModal({ ...packageModal, selectedTestIds: current });
                                }}
                              />
                              <span className="font-medium text-slate-700 leading-tight">{t.name} (₹{t.price})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Package Price (₹) *</label>
                        <input 
                          type="number" 
                          required 
                          value={packageModal.price || ''}
                          onChange={(e) => setPackageModal({ ...packageModal, price: Number(e.target.value) })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. 1500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Combo Discount (%)</label>
                        <input 
                          type="number" 
                          value={packageModal.discount || ''}
                          onChange={(e) => setPackageModal({ ...packageModal, discount: Number(e.target.value) })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. 20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Turnaround Time</label>
                        <input 
                          type="text" 
                          required 
                          value={packageModal.turnaroundTime}
                          onChange={(e) => setPackageModal({ ...packageModal, turnaroundTime: e.target.value })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Preparation Guidelines</label>
                        <input 
                          type="text" 
                          value={packageModal.preparationInstructions}
                          onChange={(e) => setPackageModal({ ...packageModal, preparationInstructions: e.target.value })}
                          className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded font-semibold"
                          placeholder="e.g. Fasting 12h required"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 select-none cursor-pointer mt-2 font-bold text-slate-700">
                      <input 
                        type="checkbox" 
                        checked={packageModal.homeCollectionEnabled}
                        onChange={(e) => setPackageModal({ ...packageModal, homeCollectionEnabled: e.target.checked })}
                        className="accent-[#0A6E6E]"
                      />
                      <span>Enable Home Sample Collection for combo</span>
                    </label>
                  </div>
                  <div className="p-4 border-t border-gray-50 bg-slate-50 flex justify-end gap-2">
                    <button type="button" onClick={() => setPackageModal({ ...packageModal, show: false })} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-[#0A6E6E] text-white rounded text-xs font-black cursor-pointer">
                      Save Health Package
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        );

      case 'wallet':
        // retrieve platform commission records from this laboratory
        const savedRecords = localStorage.getItem('ds_commission_records');
        const commRecords: CommissionRecord[] = savedRecords ? JSON.parse(savedRecords) : [];
        const labComms = commRecords.filter(r => r.type === 'LabBooking' && r.id.includes('LAB'));

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 block tracking-wider">Gross Booking Earnings</span>
                <span className="text-2xl font-black text-slate-800 block mt-1">₹{totalEarnings.toLocaleString()}</span>
                <p className="text-[10px] text-gray-400 mt-1">Sum of all completed diagnostic checks</p>
              </div>

              <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] uppercase font-extrabold text-amber-800 block tracking-wider">Pending Release</span>
                <span className="text-2xl font-black text-amber-900 block mt-1">₹{pendingSettlement.toLocaleString()}</span>
                <p className="text-[10px] text-amber-600 font-medium mt-1">Held until PDF reports are verified & ready</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
                <span className="text-[10px] uppercase font-extrabold text-emerald-800 block tracking-wider">Available Wallet Balance</span>
                <span className="text-2xl font-black text-emerald-950 block mt-1">₹{availableBalance.toLocaleString()}</span>
                <p className="text-[10px] text-emerald-700 font-bold mt-1">Platform service fee (5%) deducted</p>
              </div>
            </div>

            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                <h3 className="text-sm font-black text-slate-800 font-heading">Referral & Platform Commissions Ledger</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded font-bold">Platform service charge: 5%</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5] text-[10px] uppercase font-extrabold text-slate-700">
                      <th className="p-3">Reference Txn ID</th>
                      <th className="p-3">Client details</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Platform Charge (5%)</th>
                      <th className="p-3">Partner Share (Payout)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labComms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No commission ledger entries registered yet. Commissions automatically generate upon Confirmed payments.
                        </td>
                      </tr>
                    ) : (
                      labComms.map(r => (
                        <tr key={r.id}>
                          <td className="p-3 font-mono font-bold text-slate-800">{r.id}</td>
                          <td className="p-3 font-medium text-slate-700">{r.sourceName}</td>
                          <td className="p-3 font-bold text-slate-800">₹{r.amount}</td>
                          <td className="p-3 text-rose-600 font-bold">₹{r.platformCharge}</td>
                          <td className="p-3 text-emerald-600 font-bold">
                            ₹{(r.cityPartnerCommission + r.districtPartnerCommission + r.statePartnerCommission).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'patients':
        // gather list of unique patients
        const patientMap: { [email: string]: { name: string, phone: string, bookings: LabBooking[] } } = {};
        bookings.forEach(b => {
          if (!patientMap[b.patientEmail]) {
            patientMap[b.patientEmail] = { name: b.patientName, phone: b.patientPhone, bookings: [] };
          }
          patientMap[b.patientEmail].bookings.push(b);
        });

        return (
          <div className="space-y-6">
            <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-extrabold text-[#0A6E6E] block tracking-wider mb-1">Diagnostic Registry</span>
              <h3 className="text-sm font-black text-slate-800 font-heading">Historical Patient Database</h3>
              <p className="text-xs text-gray-400 mt-1">Browse patients who booked tests, access report history, and download documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(patientMap).length === 0 ? (
                <div className="col-span-full bg-white border border-[#D1E5E5] p-12 text-center text-gray-400 rounded-2xl">
                  No patient clinical histories stored.
                </div>
              ) : (
                Object.keys(patientMap).map(email => {
                  const p = patientMap[email];
                  return (
                    <div key={email} className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-800 font-heading">{p.name}</h4>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">{email} | {p.phone}</span>
                        </div>
                        <span className="text-[9px] bg-teal-50 border border-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full">
                          {p.bookings.length} Bookings
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Completed Diagnostic Reports</span>
                        <div className="space-y-2">
                          {p.bookings.flatMap(b => b.reports || []).length === 0 ? (
                            <p className="text-gray-400 italic text-[10px]">No medical reports generated yet.</p>
                          ) : (
                            p.bookings.flatMap(b => b.reports || []).map((rep, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-gray-100 p-2 rounded-xl">
                                <div>
                                  <span className="font-bold text-slate-700 block truncate max-w-[200px]">{rep.name}</span>
                                  <span className="text-[8px] text-gray-400">Uploaded: {new Date(rep.uploadedAt).toLocaleDateString()}</span>
                                </div>
                                <a
                                  href={rep.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-[#0A6E6E] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" /> Get PDF
                                </a>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-extrabold text-amber-500 block tracking-wider mb-1">Reputation Desk</span>
              <h3 className="text-sm font-black text-slate-800 font-heading">Patient Feedback & Ratings</h3>
              <p className="text-xs text-gray-400 mt-1">Read reviews written by patients regarding diagnostic checkups and home collections.</p>
            </div>

            <div className="divide-y divide-gray-100 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-sm">
              {reviews.length === 0 ? (
                <p className="p-4 text-center text-gray-400 text-xs">No reviews submitted yet.</p>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-black text-slate-800">{r.patientName}</span>
                        <span className="text-gray-400 text-[10px] block mt-0.5">{r.date}</span>
                      </div>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{r.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <form onSubmit={handleSaveProfile} className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-sm space-y-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Compliance Controls</span>
              <h3 className="text-sm font-black text-slate-800 font-heading">Facility Profile & Operational Range</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pathology Lab Name *</label>
                <input 
                  type="text" 
                  name="name"
                  required 
                  defaultValue={labProfile?.name || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Owner Name *</label>
                <input 
                  type="text" 
                  name="ownerName"
                  required 
                  defaultValue={labProfile?.ownerName || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <input 
                  type="tel" 
                  name="phone"
                  required 
                  defaultValue={labProfile?.phone || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input 
                  type="email" 
                  disabled
                  value={labProfile?.email || ''}
                  className="w-full bg-slate-100 text-gray-500 border border-[#D1E5E5] p-2.5 rounded font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">NABL Accreditation / License *</label>
                <input 
                  type="text" 
                  name="licenseNumber"
                  required 
                  defaultValue={labProfile?.licenseNumber || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Facility / Center Address *</label>
              <textarea 
                name="address"
                required 
                rows={2}
                defaultValue={labProfile?.address || ''}
                className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                <input 
                  type="text" 
                  name="pincode"
                  required 
                  maxLength={6}
                  defaultValue={labProfile?.pincode || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Operating City *</label>
                <input 
                  type="text" 
                  name="city"
                  required 
                  defaultValue={labProfile?.city || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">District *</label>
                <input 
                  type="text" 
                  name="district"
                  required 
                  defaultValue={labProfile?.district || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">State *</label>
                <input 
                  type="text" 
                  name="state"
                  required 
                  defaultValue={labProfile?.state || ''}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between gap-4">
              <div className="text-[10px] text-gray-400 mt-2">
                ✓ Onboarded under certified NABL Clinical establishment criteria.
              </div>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold rounded-lg cursor-pointer transition-all shadow"
              >
                Save Operational Profile Settings
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Professional Banner */}
      <header className="bg-[#0A6E6E] text-white px-6 py-4 flex justify-between items-center shadow-md border-b border-[#0A6E6E]/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/25">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight font-heading">{labName}</h1>
              <span className="text-[8px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ✓ NABL Verified
              </span>
            </div>
            <p className="text-[10px] text-teal-100">Pathology & Home Sample Collection Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications bar */}
          <div className="relative">
            <button 
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-all flex items-center justify-center border border-transparent hover:border-white/20"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 z-50 bg-white border border-[#D1E5E5] w-72 rounded-2xl p-4 shadow-xl text-xs text-slate-800 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                  <span className="font-extrabold uppercase text-[9px] text-gray-400">Clinical Alerts</span>
                  <button onClick={() => setShowNotificationPopup(false)} className="text-gray-400 font-bold">×</button>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-2 rounded-xl border ${n.read ? 'bg-slate-50 border-gray-100 text-gray-500' : 'bg-teal-50/40 border-teal-100 font-medium'}`}>
                      <div className="flex justify-between items-start gap-1">
                        <p className="leading-tight">{n.message}</p>
                        {!n.read && (
                          <button onClick={() => handleClearNotif(n.id)} className="text-[9px] text-[#0A6E6E] hover:underline whitespace-nowrap">Mark</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-800 text-white rounded-full flex items-center justify-center font-bold text-xs border border-white/20">
              {labName ? labName.charAt(0) : 'L'}
            </div>
            <div className="hidden md:block">
              <span className="text-[10px] text-teal-100 block">Logged in as</span>
              <span className="text-xs font-bold block leading-none">{emailKey}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-[#D1E5E5] p-4 flex flex-col justify-between space-y-6">
          <div className="space-y-1.5">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block px-3">Laboratory Portal</span>
            
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Desk
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'bookings' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <ClipboardList className="w-4 h-4" /> Manage Bookings
            </button>

            <button
              onClick={() => setActiveTab('home-collection')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'home-collection' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Truck className="w-4 h-4" /> Home Collection Fleet
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Boxes className="w-4 h-4" /> Test Categories
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tests' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Pill className="w-4 h-4" /> Tests Database
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'packages' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Layers className="w-4 h-4" /> Health Packages
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'wallet' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Wallet className="w-4 h-4" /> Wallet & Commissions
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'patients' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Users className="w-4 h-4" /> Patient Database
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'reviews' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Star className="w-4 h-4" /> Reputation Feedback
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4" /> Center Settings
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Quick Export Panel */}
            <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-3 rounded-xl">
              <span className="text-[9px] uppercase font-extrabold text-[#0A6E6E] block mb-1">Export Daily Report</span>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => handleExportData('PDF')} className="bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 py-1 rounded text-[9px] font-bold transition-all cursor-pointer">PDF</button>
                <button onClick={() => handleExportData('CSV')} className="bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 py-1 rounded text-[9px] font-bold transition-all cursor-pointer">CSV</button>
                <button onClick={() => handleExportData('Excel')} className="bg-white hover:bg-slate-50 border border-gray-200 text-slate-700 py-1 rounded text-[9px] font-bold transition-all cursor-pointer">Excel</button>
              </div>
            </div>

            <button
              onClick={() => setView('login')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Secure Terminate Session
            </button>
          </div>
        </aside>

        {/* Display panel */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-73px)]">
          {renderTabContent()}
        </main>
      </div>

      {/* Global Clinical Report Upload Modal */}
      {uploadModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUploadReports} className="bg-white border border-[#D1E5E5] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
            <div className="bg-[#F0F7F7] border-b border-[#D1E5E5] p-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-extrabold text-[#0A6E6E] uppercase block tracking-wider">Accredited Lab dispatch Desk</span>
                <h3 className="text-xs font-black text-slate-800 font-heading">Compile Medical Reports</h3>
              </div>
              <button type="button" onClick={() => setUploadModal({ show: false, bookingId: '', fileNames: ['NABL_Pathology_Report_Signed.pdf'], clinicalNotes: '' })} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#F0F7F7]/50 border border-[#D1E5E5] p-3 rounded-xl text-slate-700">
                <span className="text-[10px] uppercase font-extrabold text-gray-500 block">Target Patient Booking</span>
                <p className="font-bold text-slate-800 mt-0.5">Booking ID: {uploadModal.bookingId}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attached PDF File Assets *</label>
                <div className="space-y-1.5 mb-2">
                  {uploadModal.fileNames.map((fn, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                      <span className="font-mono font-bold text-slate-700">📎 {fn}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const rest = uploadModal.fileNames.filter((_, i) => i !== idx);
                          setUploadModal({ ...uploadModal, fileNames: rest });
                        }}
                        className="text-rose-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div 
                  onClick={() => {
                    const extra = prompt('Simulated File Attachment: Enter PDF file name:', `Pathology_Accreditation_Report_${Math.floor(100+Math.random()*900)}.pdf`);
                    if (extra) {
                      setUploadModal({ ...uploadModal, fileNames: [...uploadModal.fileNames, extra] });
                    }
                  }}
                  className="border-2 border-dashed border-[#D1E5E5] rounded-xl p-4 text-center hover:bg-teal-50/50 transition-all cursor-pointer"
                >
                  <Upload className="w-5 h-5 mx-auto text-[#0A6E6E] opacity-50 mb-1.5" />
                  <span className="text-[11px] font-black text-[#0A6E6E] block">Attach Pathology PDF Report</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 block">NABL certified digital signature will be auto-stamped</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Remarks / Report Notes</label>
                <textarea
                  value={uploadModal.clinicalNotes}
                  onChange={(e) => setUploadModal({ ...uploadModal, clinicalNotes: e.target.value })}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-semibold text-slate-800"
                  rows={3}
                  placeholder="Enter medical remarks (e.g., Blood glucose levels are within normal physiological ranges. Consult primary physician...)"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-50 bg-slate-50 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setUploadModal({ show: false, bookingId: '', fileNames: ['NABL_Pathology_Report_Signed.pdf'], clinicalNotes: '' })} 
                className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold cursor-pointer"
              >
                Cancel Dispatch
              </button>
              <button 
                type="submit" 
                className="px-5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-black cursor-pointer shadow"
              >
                ✓ Compile & Dispatch Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
