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
  DollarSign
} from 'lucide-react';
import { Medicine, MedicineOrder, Pharmacy } from '../../types';
import { generateCommission } from '../../data/commissionUtils';

interface PharmacyDashboardProps {
  setView: (view: string) => void;
  userEmail: string | null;
}

// Initial mock medicines if localStorage is empty
const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    pharmacyId: 'pharm-demo',
    name: 'Paracetamol 650mg',
    genericName: 'Paracetamol',
    brandName: 'Dolo 650',
    category: 'Analgesics / Antipyretics',
    manufacturer: 'Micro Labs Ltd',
    strength: '650mg',
    dosageForm: 'Tablet',
    packSize: '15 Tablets',
    price: 30,
    discount: 10,
    gst: 12,
    stockQuantity: 150,
    minStockAlert: 20,
    expiryDate: '2027-12-31',
    batchNumber: 'BT-PR928',
    prescriptionRequired: false,
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString()
  },
  {
    id: 'med-2',
    pharmacyId: 'pharm-demo',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    brandName: 'Novamox 500',
    category: 'Antibiotics',
    manufacturer: 'Cipla Ltd',
    strength: '500mg',
    dosageForm: 'Capsule',
    packSize: '10 Capsules',
    price: 120,
    discount: 15,
    gst: 12,
    stockQuantity: 80,
    minStockAlert: 15,
    expiryDate: '2026-10-15',
    batchNumber: 'BT-AM391',
    prescriptionRequired: true,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString()
  },
  {
    id: 'med-3',
    pharmacyId: 'pharm-demo',
    name: 'Atorvastatin 10mg',
    genericName: 'Atorvastatin',
    brandName: 'Lipvas 10',
    category: 'Cardiac / Cholesterol',
    manufacturer: 'Cipla Ltd',
    strength: '10mg',
    dosageForm: 'Tablet',
    packSize: '15 Tablets',
    price: 85,
    discount: 8,
    gst: 12,
    stockQuantity: 50,
    minStockAlert: 10,
    expiryDate: '2026-04-30', // Near expiry
    batchNumber: 'BT-AT109',
    prescriptionRequired: true,
    image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString()
  },
  {
    id: 'med-4',
    pharmacyId: 'pharm-demo',
    name: 'Metformin 500mg ER',
    genericName: 'Metformin Hydrochloride',
    brandName: 'Glycomet 500 SR',
    category: 'Diabetes / Antidiabetic',
    manufacturer: 'USV Private Ltd',
    strength: '500mg',
    dosageForm: 'Tablet',
    packSize: '20 Tablets',
    price: 60,
    discount: 5,
    gst: 12,
    stockQuantity: 12, // Low stock
    minStockAlert: 20,
    expiryDate: '2028-01-01',
    batchNumber: 'BT-MF502',
    prescriptionRequired: true,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString()
  }
];

// Initial mock orders if localStorage is empty
const INITIAL_ORDERS: MedicineOrder[] = [
  {
    id: 'ord-1001',
    pharmacyId: 'pharm-demo',
    pharmacyName: 'Wellness Pharmacy',
    patientEmail: 'aarav.mehta@doctspark.in',
    patientName: 'Aarav Mehta',
    patientPhone: '9876543210',
    patientAddress: 'A-402, Sea Breeze Apartments, Bandra West',
    patientCity: 'Mumbai',
    patientState: 'Maharashtra',
    patientPincode: '400050',
    items: [
      {
        medicineId: 'med-1',
        name: 'Paracetamol 650mg',
        genericName: 'Paracetamol',
        brandName: 'Dolo 650',
        price: 30,
        discount: 10,
        quantity: 2,
        prescriptionRequired: false
      }
    ],
    paymentMethod: 'Wallet',
    paymentStatus: 'Paid',
    totalAmount: 60,
    discountAmount: 6,
    gstAmount: 6.48,
    finalAmount: 60.48,
    commissionPaid: 3.02,
    status: 'Delivered',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
  },
  {
    id: 'ord-1002',
    pharmacyId: 'pharm-demo',
    pharmacyName: 'Wellness Pharmacy',
    patientEmail: 'priya.sharma@doctspark.in',
    patientName: 'Priya Sharma',
    patientPhone: '9820123456',
    patientAddress: 'Flat 12B, Regency Heights, Thane West',
    patientCity: 'Thane',
    patientState: 'Maharashtra',
    patientPincode: '400601',
    items: [
      {
        medicineId: 'med-2',
        name: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin Trihydrate',
        brandName: 'Novamox 500',
        price: 120,
        discount: 15,
        quantity: 1,
        prescriptionRequired: true
      }
    ],
    prescriptionUrl: 'Dr_R_Sharma_Prescription_7721.jpg',
    prescriptionStatus: 'Pending',
    paymentMethod: 'Online Gateway',
    paymentStatus: 'Paid',
    totalAmount: 120,
    discountAmount: 18,
    gstAmount: 12.24,
    finalAmount: 114.24,
    commissionPaid: 5.71,
    status: 'Prescription Review',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
  },
  {
    id: 'ord-1003',
    pharmacyId: 'pharm-demo',
    pharmacyName: 'Wellness Pharmacy',
    patientEmail: 'kabir.singh@doctspark.in',
    patientName: 'Kabir Singh',
    patientPhone: '9911002233',
    patientAddress: 'House 44, Sector 15',
    patientCity: 'Noida',
    patientState: 'Uttar Pradesh',
    patientPincode: '201301',
    items: [
      {
        medicineId: 'med-4',
        name: 'Metformin 500mg ER',
        genericName: 'Metformin Hydrochloride',
        brandName: 'Glycomet 500 SR',
        price: 60,
        discount: 5,
        quantity: 3,
        prescriptionRequired: true
      }
    ],
    prescriptionUrl: 'Dr_Anjali_Mehta_RX_4492.pdf',
    prescriptionStatus: 'Approved',
    paymentMethod: 'Wallet',
    paymentStatus: 'Paid',
    totalAmount: 180,
    discountAmount: 9,
    gstAmount: 20.52,
    finalAmount: 191.52,
    commissionPaid: 9.58,
    status: 'Preparing',
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

export default function PharmacyDashboard({ setView, userEmail }: PharmacyDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'profile' | 'catalog' | 'inventory' | 'verifications' | 'orders' | 'wallet' | 'reports' | 'reviews' | 'settings'
  >('overview');

  // Load and cache active logged-in pharmacy profile
  const [pharmacy, setPharmacy] = React.useState<Pharmacy | null>(null);

  // States
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [logs, setLogs] = React.useState<{ id: string; timestamp: string; item: string; action: string; prevVal: string; newVal: string }[]>([]);
  const [reviews, setReviews] = React.useState<{ id: string; author: string; rating: number; comment: string; date: string }[]>([
    { id: 'rev-1', author: 'Aarav Mehta', rating: 5, comment: 'Excellent prompt delivery, medicines were genuine with long expiry dates.', date: '3 days ago' },
    { id: 'rev-2', author: 'Sonal Gupta', rating: 4, comment: 'Prescription approval took some time but packaging was highly professional.', date: '1 week ago' }
  ]);

  // Modals / Editing States for Medicines
  const [showMedicineModal, setShowMedicineModal] = React.useState(false);
  const [editingMedicine, setEditingMedicine] = React.useState<Medicine | null>(null);

  // Medicine Form States
  const [medName, setMedName] = React.useState('');
  const [medGeneric, setMedGeneric] = React.useState('');
  const [medBrand, setMedBrand] = React.useState('');
  const [medCategory, setMedCategory] = React.useState('Analgesics / Antipyretics');
  const [medManufacturer, setMedManufacturer] = React.useState('');
  const [medStrength, setMedStrength] = React.useState('');
  const [medDosage, setMedDosage] = React.useState('Tablet');
  const [medPackSize, setMedPackSize] = React.useState('');
  const [medPrice, setMedPrice] = React.useState(0);
  const [medDiscount, setMedDiscount] = React.useState(0);
  const [medGst, setMedGst] = React.useState(12);
  const [medStock, setMedStock] = React.useState(100);
  const [medMinStock, setMedMinStock] = React.useState(20);
  const [medExpiry, setMedExpiry] = React.useState('');
  const [medBatch, setMedBatch] = React.useState('');
  const [medRxReq, setMedRxReq] = React.useState(false);
  const [medImage, setMedImage] = React.useState('');

  // Search and Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [rxFilter, setRxFilter] = React.useState('All');

  // Profile Form States
  const [profileName, setProfileName] = React.useState('');
  const [profileOwner, setProfileOwner] = React.useState('');
  const [profilePhone, setProfilePhone] = React.useState('');
  const [profileAddress, setProfileAddress] = React.useState('');
  const [profileCity, setProfileCity] = React.useState('');
  const [profileDistrict, setProfileDistrict] = React.useState('');
  const [profileState, setProfileState] = React.useState('');
  const [profilePincode, setProfilePincode] = React.useState('');
  const [profileLicense, setProfileLicense] = React.useState('');

  // Prescription Verification Actions
  const [rejectReason, setRejectReason] = React.useState('');
  const [activeReviewOrder, setActiveReviewOrder] = React.useState<MedicineOrder | null>(null);

  // Notifications State
  const [localNotifications, setLocalNotifications] = React.useState<{ id: string; title: string; desc: string; time: string; read: boolean }[]>([
    { id: 'not-1', title: 'New Order Received', desc: 'Order ord-1002 requires Drug Prescription Verification.', time: '3 hours ago', read: false },
    { id: 'not-2', title: 'Low Stock Alert', desc: 'Metformin 500mg ER stock is down to 12 capsules (Alert Limit: 20).', time: '1 day ago', read: false }
  ]);

  // Load Database
  React.useEffect(() => {
    // 1. Load active pharmacy or fallback
    const savedPharmaciesRaw = localStorage.getItem('ds_pharmacies');
    const pharmaciesList: Pharmacy[] = savedPharmaciesRaw ? JSON.parse(savedPharmaciesRaw) : [];
    const matched = pharmaciesList.find(p => p.email.toLowerCase() === userEmail?.toLowerCase());

    const activePharm = matched || {
      id: 'pharm-demo',
      name: 'Wellness Pharmacy',
      ownerName: 'Rajesh Kumar',
      email: userEmail || 'pharmacy@doctspark.in',
      phone: '9876543210',
      licenseNumber: 'DL-MUM-28192',
      address: 'Central Plaza, Mumbai Road',
      city: 'Mumbai',
      district: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      status: 'Approved (Active)',
      subscriptionPaid: true,
      createdAt: new Date().toISOString()
    };
    setPharmacy(activePharm);

    setProfileName(activePharm.name);
    setProfileOwner(activePharm.ownerName);
    setProfilePhone(activePharm.phone);
    setProfileAddress(activePharm.address);
    setProfileCity(activePharm.city);
    setProfileDistrict(activePharm.district || 'Mumbai');
    setProfileState(activePharm.state);
    setProfilePincode(activePharm.pincode);
    setProfileLicense(activePharm.licenseNumber);

    // 2. Load Medicines
    const savedMedsRaw = localStorage.getItem('ds_medicines');
    let loadedMeds: Medicine[] = savedMedsRaw ? JSON.parse(savedMedsRaw) : [];
    
    // Filter out mock ones that are from other pharmacies if needed, but in our demo environment,
    // let's link them to this pharmacy ID to ensure catalog exists
    const myMeds = loadedMeds.filter(m => m.pharmacyId === activePharm.id);
    if (myMeds.length === 0) {
      // Seed default ones linked to this pharmacy ID
      const seeded = INITIAL_MEDICINES.map(m => ({ ...m, pharmacyId: activePharm.id }));
      loadedMeds = [...loadedMeds.filter(m => m.pharmacyId !== activePharm.id), ...seeded];
      localStorage.setItem('ds_medicines', JSON.stringify(loadedMeds));
      setMedicines(seeded);
    } else {
      setMedicines(myMeds);
    }

    // 3. Load Orders
    const savedOrdersRaw = localStorage.getItem('ds_medicine_orders');
    let loadedOrders: MedicineOrder[] = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
    const myOrders = loadedOrders.filter(o => o.pharmacyId === activePharm.id);
    if (myOrders.length === 0) {
      const seeded = INITIAL_ORDERS.map(o => ({ ...o, pharmacyId: activePharm.id, pharmacyName: activePharm.name }));
      loadedOrders = [...loadedOrders.filter(o => o.pharmacyId !== activePharm.id), ...seeded];
      localStorage.setItem('ds_medicine_orders', JSON.stringify(loadedOrders));
      setOrders(seeded);
    } else {
      setOrders(myOrders);
    }

    // 4. Load adjustment logs
    const savedLogs = localStorage.getItem(`ds_inv_logs_${activePharm.id}`);
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      const initialLogs = [
        { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), item: 'Dolo 650', action: 'Initial Stocking', prevVal: '0', newVal: '150' },
        { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), item: 'Novamox 500', action: 'Direct Recount', prevVal: '100', newVal: '80' }
      ];
      localStorage.setItem(`ds_inv_logs_${activePharm.id}`, JSON.stringify(initialLogs));
      setLogs(initialLogs);
    }
  }, [userEmail]);

  // Sync state helpers
  const saveMedicinesToStore = (newMeds: Medicine[]) => {
    const savedMedsRaw = localStorage.getItem('ds_medicines');
    const allMeds: Medicine[] = savedMedsRaw ? JSON.parse(savedMedsRaw) : [];
    const filteredOtherPharm = allMeds.filter(m => m.pharmacyId !== (pharmacy?.id || 'pharm-demo'));
    const updated = [...filteredOtherPharm, ...newMeds];
    localStorage.setItem('ds_medicines', JSON.stringify(updated));
    setMedicines(newMeds);
  };

  const saveOrdersToStore = (newOrders: MedicineOrder[]) => {
    const savedOrdersRaw = localStorage.getItem('ds_medicine_orders');
    const allOrders: MedicineOrder[] = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
    const filteredOtherPharm = allOrders.filter(o => o.pharmacyId !== (pharmacy?.id || 'pharm-demo'));
    const updated = [...filteredOtherPharm, ...newOrders];
    localStorage.setItem('ds_medicine_orders', JSON.stringify(updated));
    setOrders(newOrders);
  };

  const logInventoryAdjustment = (item: string, action: string, prevVal: string, newVal: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      item,
      action,
      prevVal,
      newVal
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(`ds_inv_logs_${pharmacy?.id || 'pharm-demo'}`, JSON.stringify(updatedLogs));
  };

  // Add notification log
  const pushNotification = (title: string, desc: string) => {
    const newNotif = {
      id: `not-${Date.now()}`,
      title,
      desc,
      time: 'Just now',
      read: false
    };
    setLocalNotifications(prev => [newNotif, ...prev]);
  };

  // Handle Profile Update
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy) return;

    const updatedPharm: Pharmacy = {
      ...pharmacy,
      name: profileName,
      ownerName: profileOwner,
      phone: profilePhone,
      address: profileAddress,
      city: profileCity,
      district: profileDistrict,
      state: profileState,
      pincode: profilePincode,
      licenseNumber: profileLicense
    };

    const savedPharmaciesRaw = localStorage.getItem('ds_pharmacies');
    const pharmaciesList: Pharmacy[] = savedPharmaciesRaw ? JSON.parse(savedPharmaciesRaw) : [];
    const updatedList = pharmaciesList.map(p => p.id === pharmacy.id ? updatedPharm : p);
    localStorage.setItem('ds_pharmacies', JSON.stringify(updatedList));

    setPharmacy(updatedPharm);
    pushNotification('Profile Updated Successfully', 'Your store profiles and regulatory documents were synched.');
    alert('✓ Pharmacy profile details updated successfully!');
  };

  // Handle Add/Edit Medicine
  const openAddMedicine = () => {
    setEditingMedicine(null);
    setMedName('');
    setMedGeneric('');
    setMedBrand('');
    setMedCategory('Analgesics / Antipyretics');
    setMedManufacturer('');
    setMedStrength('');
    setMedDosage('Tablet');
    setMedPackSize('');
    setMedPrice(0);
    setMedDiscount(0);
    setMedGst(12);
    setMedStock(100);
    setMedMinStock(20);
    setMedExpiry('');
    setMedBatch('');
    setMedRxReq(false);
    setMedImage('');
    setShowMedicineModal(true);
  };

  const openEditMedicine = (med: Medicine) => {
    setEditingMedicine(med);
    setMedName(med.name);
    setMedGeneric(med.genericName);
    setMedBrand(med.brandName);
    setMedCategory(med.category);
    setMedManufacturer(med.manufacturer);
    setMedStrength(med.strength);
    setMedDosage(med.dosageForm);
    setMedPackSize(med.packSize);
    setMedPrice(med.price);
    setMedDiscount(med.discount);
    setMedGst(med.gst);
    setMedStock(med.stockQuantity);
    setMedMinStock(med.minStockAlert);
    setMedExpiry(med.expiryDate);
    setMedBatch(med.batchNumber);
    setMedRxReq(med.prescriptionRequired);
    setMedImage(med.image || '');
    setShowMedicineModal(true);
  };

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy) return;

    if (editingMedicine) {
      // Edit mode
      const updatedMeds = medicines.map(m => {
        if (m.id === editingMedicine.id) {
          const updated = {
            ...m,
            name: medName,
            genericName: medGeneric,
            brandName: medBrand,
            category: medCategory,
            manufacturer: medManufacturer,
            strength: medStrength,
            dosageForm: medDosage,
            packSize: medPackSize,
            price: Number(medPrice),
            discount: Number(medDiscount),
            gst: Number(medGst),
            stockQuantity: Number(medStock),
            minStockAlert: Number(medMinStock),
            expiryDate: medExpiry,
            batchNumber: medBatch,
            prescriptionRequired: medRxReq,
            image: medImage || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'
          };
          
          if (m.stockQuantity !== updated.stockQuantity) {
            logInventoryAdjustment(
              updated.name,
              'Manual Count Sync',
              String(m.stockQuantity),
              String(updated.stockQuantity)
            );
          }
          return updated;
        }
        return m;
      });
      saveMedicinesToStore(updatedMeds);
      pushNotification('Medicine Updated', `${medBrand} details adjusted in catalog.`);
    } else {
      // Add mode
      const newMed: Medicine = {
        id: `med-${Date.now()}`,
        pharmacyId: pharmacy.id,
        name: medName,
        genericName: medGeneric,
        brandName: medBrand,
        category: medCategory,
        manufacturer: medManufacturer,
        strength: medStrength,
        dosageForm: medDosage,
        packSize: medPackSize,
        price: Number(medPrice),
        discount: Number(medDiscount),
        gst: Number(medGst),
        stockQuantity: Number(medStock),
        minStockAlert: Number(medMinStock),
        expiryDate: medExpiry,
        batchNumber: medBatch,
        prescriptionRequired: medRxReq,
        image: medImage || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString()
      };
      const updatedMeds = [...medicines, newMed];
      saveMedicinesToStore(updatedMeds);
      logInventoryAdjustment(newMed.name, 'Initial Catalog Addition', '0', String(newMed.stockQuantity));
      pushNotification('New Medicine Registered', `${newMed.brandName} successfully catalogued.`);
    }

    setShowMedicineModal(false);
  };

  const handleDeleteMedicine = (medId: string, nameStr: string) => {
    if (confirm(`Are you sure you want to completely delete "${nameStr}" from the medicine catalog?`)) {
      const updated = medicines.filter(m => m.id !== medId);
      saveMedicinesToStore(updated);
      pushNotification('Medicine Discontinued', `Removed ${nameStr} from the directory.`);
    }
  };

  // Prescription approval workflow
  const handleVerifyPrescription = (orderId: string, approve: boolean) => {
    if (!pharmacy) return;

    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    let nextStatus: MedicineOrder['status'] = 'Approved';
    let rxStatus: MedicineOrder['prescriptionStatus'] = 'Approved';
    let note = 'Prescription approved by pharmacist.';

    if (!approve) {
      if (!rejectReason.trim()) {
        alert('Please fill out a valid rejection reason for the patient.');
        return;
      }
      nextStatus = 'Cancelled';
      rxStatus = 'Rejected';
      note = `Prescription rejected: ${rejectReason}`;
    }

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: nextStatus,
          prescriptionStatus: rxStatus,
          prescriptionRejectReason: approve ? undefined : rejectReason,
          paymentStatus: approve ? o.paymentStatus : (o.paymentStatus === 'Paid' ? 'Refunded' : o.paymentStatus),
          deliveryStatusHistory: [
            ...(o.deliveryStatusHistory || []),
            { status: nextStatus, timestamp: new Date().toISOString(), note }
          ]
        };
      }
      return o;
    });

    saveOrdersToStore(updatedOrders);
    
    // Simulate SMS/Email notification dispatch
    const alertMsg = approve 
      ? `✓ Prescription APPROVED!\nOrder ord-${orderId} is now advanced to Preparation stage.\nSMS dispatched to patient.`
      : `⚠️ Prescription REJECTED.\nOrder ord-${orderId} has been cancelled & refunded.\nSMS notification sent to patient with reason: "${rejectReason}".`;
    
    alert(alertMsg);

    // If approved, trigger commission generation if not already done
    if (approve) {
      // Commission Engine: Service Fee = 5%
      const serviceFee = ord.finalAmount * 0.05;
      generateCommission('PharmacyOrder', ord.id, `Pharmacy Order: ${ord.id}`, ord.finalAmount);
    }

    // Clear state
    setActiveReviewOrder(null);
    setRejectReason('');
    pushNotification(
      approve ? 'Order Approved' : 'Order Prescription Rejected',
      `Processed prescription verification for Aarav Mehta (ord-${orderId}).`
    );
  };

  // Order status progression
  const handleProgressOrderStatus = (orderId: string, currentStatus: string) => {
    let nextStatus: MedicineOrder['status'] = 'Delivered';
    let note = '';

    if (currentStatus === 'Approved') {
      nextStatus = 'Preparing';
      note = 'Medicines being collected from safe inventory bins.';
    } else if (currentStatus === 'Preparing') {
      nextStatus = 'Packed';
      note = 'Packed securely with barcode labels and bubble-wrap.';
    } else if (currentStatus === 'Packed') {
      nextStatus = 'Ready for Dispatch';
      note = 'Handed over to fulfillment warehouse dispatch bays.';
    } else if (currentStatus === 'Ready for Dispatch') {
      nextStatus = 'Out for Delivery';
      note = 'Assigned to logistics home courier team.';
    } else if (currentStatus === 'Out for Delivery') {
      nextStatus = 'Delivered';
      note = 'Delivered safely at patient residence threshold.';
    } else {
      return;
    }

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: nextStatus,
          deliveryStatusHistory: [
            ...(o.deliveryStatusHistory || []),
            { status: nextStatus, timestamp: new Date().toISOString(), note }
          ]
        };
      }
      return o;
    });

    saveOrdersToStore(updatedOrders);
    pushNotification('Order Status Transition', `Order ord-${orderId} updated to: ${nextStatus}`);
  };

  // Simulated Report Exports (trigger actual files!)
  const triggerReportExport = (reportType: 'orders' | 'inventory' | 'sales' | 'expired', format: 'pdf' | 'excel' | 'csv') => {
    let content = '';
    let fileName = '';

    if (reportType === 'inventory') {
      fileName = `DoctSpark_Inventory_Report_${Date.now()}.${format}`;
      if (format === 'csv') {
        content = 'ID,Name,Brand Name,Generic,Category,Price,Stock,Alert Threshold,Expiry\n';
        medicines.forEach(m => {
          content += `${m.id},"${m.name}","${m.brandName}","${m.genericName}","${m.category}",₹${m.price},${m.stockQuantity},${m.minStockAlert},${m.expiryDate}\n`;
        });
      } else {
        content = `DOCT SPARK PHARMACY MODULE - INVENTORY STATUS REPORT\n\nGenerated: ${new Date().toLocaleString()}\nPharmacy: ${pharmacy?.name || 'Wellness Pharmacy'}\nLicense: ${pharmacy?.licenseNumber || 'DL-MUM-28192'}\n\n`;
        medicines.forEach(m => {
          content += `• [${m.id}] ${m.brandName} (${m.name}) | Cat: ${m.category} | Stock: ${m.stockQuantity} | Price: ₹${m.price} | Expiry: ${m.expiryDate}\n`;
        });
      }
    } else if (reportType === 'orders' || reportType === 'sales') {
      fileName = `DoctSpark_Sales_Report_${Date.now()}.${format}`;
      if (format === 'csv') {
        content = 'Order ID,Date,Patient,Pincode,Total,Final Paid,Status,Payment\n';
        orders.forEach(o => {
          content += `${o.id},${o.createdAt.slice(0, 10)},"${o.patientName}",${o.patientPincode},₹${o.totalAmount},₹${o.finalAmount},${o.status},${o.paymentStatus}\n`;
        });
      } else {
        content = `DOCT SPARK PHARMACY MODULE - SALES SUMMARY REPORT\n\nGenerated: ${new Date().toLocaleString()}\nPharmacy: ${pharmacy?.name || 'Wellness Pharmacy'}\n\n`;
        orders.forEach(o => {
          content += `Order: #${o.id} | Date: ${o.createdAt.slice(0, 10)} | Patient: ${o.patientName} | Paid: ₹${o.finalAmount} | Status: ${o.status}\n`;
        });
      }
    } else {
      fileName = `DoctSpark_Expiry_Report_${Date.now()}.${format}`;
      content = `DOCT SPARK PHARMACY MODULE - MEDICINE EXPIRY THREAT REPORT\n\nGenerated: ${new Date().toLocaleString()}\n\n`;
      medicines.forEach(m => {
        const isExpired = new Date(m.expiryDate) < new Date();
        content += `• [${isExpired ? 'EXPIRED' : 'ACTIVE'}] ${m.brandName} - Batch: ${m.batchNumber} - Expiry: ${m.expiryDate} - Stock Left: ${m.stockQuantity}\n`;
      });
    }

    // Trigger Download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✓ Successfully compiled & exported ${reportType.toUpperCase()} directory report as ${format.toUpperCase()}! File download triggered.`);
  };

  // Calculations
  const metrics = React.useMemo(() => {
    const activeMedsCount = medicines.length;
    const lowStockCount = medicines.filter(m => m.stockQuantity <= m.minStockAlert).length;
    const expiredCount = medicines.filter(m => new Date(m.expiryDate) <= new Date()).length;
    
    const fulfilledOrders = orders.filter(o => o.status === 'Delivered');
    const totalEarnings = fulfilledOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const pendingOrdersCount = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Refunded').length;

    return {
      activeMedsCount,
      lowStockCount,
      expiredCount,
      totalEarnings,
      pendingOrdersCount,
      totalOrdersCount: orders.length
    };
  }, [medicines, orders]);

  // Filtering Medicines
  const filteredMedicines = React.useMemo(() => {
    return medicines.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.genericName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'All' || m.category === categoryFilter;
      const matchRx = rxFilter === 'All' || 
                      (rxFilter === 'Yes' && m.prescriptionRequired) || 
                      (rxFilter === 'No' && !m.prescriptionRequired);

      return matchSearch && matchCategory && matchRx;
    });
  }, [medicines, searchQuery, categoryFilter, rxFilter]);

  // Categories list
  const categoriesList = ['Analgesics / Antipyretics', 'Antibiotics', 'Cardiac / Cholesterol', 'Diabetes / Antidiabetic', 'Respiratory', 'Vitamins / Minerals'];

  if (!pharmacy) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <span className="w-10 h-10 border-4 border-[#0A6E6E] border-t-transparent rounded-full animate-spin"></span>
        <span className="ml-3 font-bold text-sm text-gray-500">Loading Pharmacy Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6" id="pharmacy-dashboard">
      
      {/* Real-time SMS logs banner */}
      {localNotifications.length > 0 && (
        <div className="mb-4 bg-slate-950 text-emerald-400 font-mono text-[10px] p-3 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-500 font-black tracking-widest text-[8px] animate-pulse">LIVE</span>
            <span className="text-slate-400 font-black">LATEST PHARMACY EVENT:</span>
            <span>{localNotifications[0].title} — {localNotifications[0].desc} ({localNotifications[0].time})</span>
          </div>
          <button 
            onClick={() => setLocalNotifications([])} 
            className="text-[9px] font-bold text-rose-400 hover:underline shrink-0 bg-transparent"
          >
            Clear Alerts
          </button>
        </div>
      )}

      {/* Main Grid: Responsive 12-columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT RAIL: Navigation */}
        <div className="lg:col-span-3 bg-white border border-[#D1E5E5] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
            <div className="w-10 h-10 bg-[#0A6E6E]/10 text-[#0A6E6E] rounded-full flex items-center justify-center text-lg font-black border border-[#0A6E6E]/20">
              💊
            </div>
            <div className="overflow-hidden">
              <h3 className="font-extrabold text-sm text-[#1A2B3C] truncate leading-tight">{pharmacy.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">Lic: {pharmacy.licenseNumber}</p>
              <span className="inline-block mt-1 text-[8px] bg-emerald-50 text-emerald-700 font-black px-1.5 py-0.5 rounded border border-emerald-200">
                Active / Verified
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'profile' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <User className="w-4 h-4" /> Store Profile
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'catalog' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Pill className="w-4 h-4" /> Medicine Catalog
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Boxes className="w-4 h-4" /> Inventory Management
            </button>
            <button
              onClick={() => setActiveTab('verifications')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'verifications' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" /> Prescription Audit
              </span>
              {orders.filter(o => o.status === 'Prescription Review').length > 0 && (
                <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full animate-pulse">
                  {orders.filter(o => o.status === 'Prescription Review').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" /> Order Tracking
              </span>
              {metrics.pendingOrdersCount > 0 && (
                <span className="bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full">
                  {metrics.pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'wallet' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Wallet className="w-4 h-4" /> Wallet & Settlement
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <FileText className="w-4 h-4" /> Export Analytics
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'reviews' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Star className="w-4 h-4" /> Reviews & Feedback
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-[#0A6E6E] text-white' : 'text-gray-500 hover:bg-slate-50'}`}
            >
              <Settings className="w-4 h-4" /> Settings & Alerts
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setView('login');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Disconnect Session
            </button>
          </div>
        </div>

        {/* RIGHT AREA: View Content */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* ==========================================
              TAB: OVERVIEW
              ========================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Total Sales (Completed)</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-extrabold text-[#1A2B3C]">₹{metrics.totalEarnings.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-extrabold block mt-2">✓ Verified Settlements</span>
                </div>

                <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Active Catalog</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-extrabold text-[#1A2B3C]">{metrics.activeMedsCount}</span>
                    <span className="text-xs text-gray-400 font-medium">items</span>
                  </div>
                  <span className="text-[9px] text-[#0A6E6E] font-extrabold block mt-2">In stock & listed</span>
                </div>

                <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Low Stock Alerts</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-xl font-extrabold ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-700'}`}>{metrics.lowStockCount}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 block mt-2">Threshold configured per brand</span>
                </div>

                <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Expired Batches</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-xl font-extrabold ${metrics.expiredCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{metrics.expiredCount}</span>
                  </div>
                  <span className="text-[9px] text-rose-500 font-bold block mt-2">Requires immediate disposal</span>
                </div>
              </div>

              {/* Graphical Overview (SVG) */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs">
                <h3 className="text-sm font-black text-[#1A2B3C] font-heading mb-4 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0A6E6E]" /> Sales & Orders Volume Trend
                </h3>
                
                {/* SVG Bar Chart */}
                <div className="h-44 w-full flex items-end justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="h-10 w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition-all flex items-end justify-center text-[9px] font-black text-emerald-800 pb-1" style={{ height: '35%' }}>₹3.4K</div>
                    <span className="text-[9px] text-gray-400 font-bold">Jul 01</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="h-10 w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition-all flex items-end justify-center text-[9px] font-black text-emerald-800 pb-1" style={{ height: '55%' }}>₹5.1K</div>
                    <span className="text-[9px] text-gray-400 font-bold">Jul 02</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="h-10 w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition-all flex items-end justify-center text-[9px] font-black text-emerald-800 pb-1" style={{ height: '40%' }}>₹4.2K</div>
                    <span className="text-[9px] text-gray-400 font-bold">Jul 03</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="h-10 w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded transition-all flex items-end justify-center text-[9px] font-black text-emerald-800 pb-1" style={{ height: '80%' }}>₹7.8K</div>
                    <span className="text-[9px] text-gray-400 font-bold">Jul 04</span>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1.5">
                    <div className="h-10 w-full bg-emerald-500/30 hover:bg-emerald-500/40 rounded transition-all flex items-end justify-center text-[9px] font-black text-emerald-800 pb-1" style={{ height: '95%' }}>₹9.5K</div>
                    <span className="text-[9px] text-gray-400 font-bold">Jul 05</span>
                  </div>
                </div>
              </div>

              {/* Pending Queue Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pending Prescriptions */}
                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Awaiting Rx Verification</h3>
                    <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                      {orders.filter(o => o.status === 'Prescription Review').length} orders
                    </span>
                  </div>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'Prescription Review').map(o => (
                      <div key={o.id} className="border border-gray-100 rounded-xl p-3 bg-slate-50 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-[#1A2B3C]">ord-{o.id} ({o.patientName})</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{o.items.length} prescription medicines</p>
                        </div>
                        <button 
                          onClick={() => { setActiveReviewOrder(o); setActiveTab('verifications'); }}
                          className="px-2.5 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-black text-[10px] rounded"
                        >
                          Verify Rx ➔
                        </button>
                      </div>
                    ))}
                    {orders.filter(o => o.status === 'Prescription Review').length === 0 && (
                      <p className="text-xs text-gray-400 font-bold text-center py-6">All prescriptions audited successfully!</p>
                    )}
                  </div>
                </div>

                {/* Logistics Status Summary */}
                <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Active Deliveries</h3>
                    <span className="text-[9px] font-black bg-teal-50 text-[#0A6E6E] px-2 py-0.5 rounded">
                      {orders.filter(o => ['Approved', 'Preparing', 'Packed', 'Ready for Dispatch', 'Out for Delivery'].includes(o.status)).length} orders
                    </span>
                  </div>
                  <div className="space-y-3">
                    {orders.filter(o => ['Approved', 'Preparing', 'Packed', 'Ready for Dispatch', 'Out for Delivery'].includes(o.status)).map(o => (
                      <div key={o.id} className="border border-gray-100 rounded-xl p-3 bg-slate-50 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-extrabold text-[#1A2B3C]">ord-{o.id} — {o.patientName}</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Status: <span className="font-black text-indigo-700 uppercase">{o.status}</span></p>
                        </div>
                        <button 
                          onClick={() => { setActiveTab('orders'); }}
                          className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-gray-700 font-black text-[10px] rounded"
                        >
                          Track / Step
                        </button>
                      </div>
                    ))}
                    {orders.filter(o => ['Approved', 'Preparing', 'Packed', 'Ready for Dispatch', 'Out for Delivery'].includes(o.status)).length === 0 && (
                      <p className="text-xs text-gray-400 font-bold text-center py-6">No pending deliveries right now.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==========================================
              TAB: PROFILE
              ========================================== */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs animate-fadeIn">
              <h3 className="text-base font-black text-[#1A2B3C] font-heading uppercase mb-1 tracking-wider">Pharmacy Profile Registry</h3>
              <p className="text-xs text-gray-400 mb-6">Modify directory presence, operating territories, and verified licenses.</p>

              <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Pharmacy / Store Name *</label>
                    <input 
                      type="text" 
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Owner / Manager Name *</label>
                    <input 
                      type="text" 
                      required
                      value={profileOwner}
                      onChange={(e) => setProfileOwner(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Registered Drug License *</label>
                    <input 
                      type="text" 
                      required
                      value={profileLicense}
                      onChange={(e) => setProfileLicense(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Registered Mobile Phone *</label>
                    <input 
                      type="text" 
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Operating City *</label>
                    <input 
                      type="text" 
                      required
                      value={profileCity}
                      onChange={(e) => setProfileCity(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Operating District *</label>
                    <input 
                      type="text" 
                      required
                      value={profileDistrict}
                      onChange={(e) => setProfileDistrict(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Pincode *</label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={profilePincode}
                      onChange={(e) => setProfilePincode(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#1A2B3C] uppercase mb-1">Detailed Operating Address *</label>
                  <textarea 
                    required
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold rounded-lg shadow-xs"
                >
                  Save Store Registry Profile
                </button>
              </form>
            </div>
          )}

          {/* ==========================================
              TAB: CATALOG
              ========================================== */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header Action Row */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xs">
                <div className="flex gap-2 w-full md:w-auto flex-1">
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-3 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search by brand name, formula, generic name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-xl text-xs font-semibold outline-none focus:border-[#0A6E6E]"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-[#D1E5E5] p-2 rounded-xl text-xs font-bold"
                  >
                    <option value="All">All Categories</option>
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={rxFilter}
                    onChange={(e) => setRxFilter(e.target.value)}
                    className="bg-white border border-[#D1E5E5] p-2 rounded-xl text-xs font-bold"
                  >
                    <option value="All">Rx Filter (All)</option>
                    <option value="Yes">Prescription Required</option>
                    <option value="No">OTC Only</option>
                  </select>
                </div>

                <button
                  onClick={openAddMedicine}
                  className="w-full md:w-auto px-4 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Add New Medicine
                </button>
              </div>

              {/* Medicine Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMedicines.map(m => (
                  <div key={m.id} className="bg-white border border-[#D1E5E5] rounded-2xl p-4 flex gap-4 shadow-2xs relative overflow-hidden">
                    <img 
                      src={m.image || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=120'}
                      alt={m.brandName}
                      className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-gray-100 shrink-0 self-center"
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                            {m.category}
                          </span>
                          <h4 className="text-sm font-black text-[#1A2B3C] font-heading mt-0.5">
                            {m.brandName}
                          </h4>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button 
                            onClick={() => openEditMedicine(m)}
                            className="p-1 text-[#0A6E6E] hover:bg-[#0A6E6E]/10 rounded border border-transparent"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMedicine(m.id, m.brandName)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-transparent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 font-bold leading-tight">
                        Generic: {m.genericName} ({m.strength})
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium leading-none">
                        Mfr: {m.manufacturer} | Form: {m.dosageForm} ({m.packSize})
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2 text-xs">
                        <div>
                          <span className="font-extrabold text-[#1A2B3C]">₹{m.price - (m.price * (m.discount / 100))}</span>
                          {m.discount > 0 && (
                            <span className="text-[10px] text-gray-400 font-medium line-through ml-1.5">₹{m.price}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-black uppercase text-[8px] px-1.5 py-0.5 rounded ${m.stockQuantity <= m.minStockAlert ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-800'}`}>
                            Stock: {m.stockQuantity}
                          </span>
                        </div>
                      </div>

                      {m.prescriptionRequired && (
                        <span className="absolute bottom-2 right-2 text-[8px] bg-red-50 text-red-700 border border-red-100 font-black px-1.5 py-0.5 rounded">
                          Rx Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {filteredMedicines.length === 0 && (
                  <div className="col-span-full bg-white border border-[#D1E5E5] rounded-2xl p-12 text-center text-gray-400">
                    <Pill className="w-10 h-10 mx-auto text-[#0A6E6E] opacity-40 mb-3" />
                    <p className="text-sm font-black text-slate-600">No medicines found match filters</p>
                    <p className="text-xs mt-1">Try expanding your search query or choosing another category.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: INVENTORY MANAGEMENT
              ========================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Alert Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-1">
                  <span className="flex items-center gap-1.5 font-extrabold text-amber-900 uppercase text-[10px]">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock Warning Levels
                  </span>
                  <p className="text-amber-800 leading-relaxed font-semibold">
                    You have <span className="font-bold underline">{metrics.lowStockCount} items</span> below safety thresholds. Replenish catalog immediately.
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-1">
                  <span className="flex items-center gap-1.5 font-extrabold text-rose-950 uppercase text-[10px]">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Expired or Near Expiry ({"<"}30 Days)
                  </span>
                  <p className="text-rose-800 leading-relaxed font-semibold">
                    You have <span className="font-bold underline">{metrics.expiredCount} batches</span> requiring removal from active sales lists.
                  </p>
                </div>
              </div>

              {/* Inventory Control List */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Comprehensive Inventory Ledger</h3>
                  <button 
                    onClick={() => triggerReportExport('inventory', 'csv')}
                    className="text-[10px] bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold px-3 py-1.5 rounded flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-extrabold bg-slate-50/50 uppercase text-[9px] tracking-wider">
                        <th className="p-3">Brand Name</th>
                        <th className="p-3">Batch No</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Current Stock</th>
                        <th className="p-3">Min Alert</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-[#1A2B3C] divide-y divide-gray-100">
                      {medicines.map(m => {
                        const isExpired = new Date(m.expiryDate) <= new Date();
                        const isLowStock = m.stockQuantity <= m.minStockAlert;
                        
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-3">
                              <div>
                                <p className="font-black text-sm">{m.brandName}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{m.genericName}</p>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-indigo-700">{m.batchNumber}</td>
                            <td className="p-3">
                              <span className={isExpired ? 'text-rose-600 underline decoration-dashed' : 'text-gray-500'}>
                                {m.expiryDate}
                              </span>
                            </td>
                            <td className="p-3 text-sm">{m.stockQuantity}</td>
                            <td className="p-3 text-gray-400">{m.minStockAlert}</td>
                            <td className="p-3">₹{m.price}</td>
                            <td className="p-3">
                              {isExpired ? (
                                <span className="bg-rose-100 text-rose-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Expired</span>
                              ) : isLowStock ? (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">Low Stock</span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded">In Stock</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjustment Logs */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider border-b border-gray-50 pb-2">Inventory Recount & Audit History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[10px] text-gray-500">
                  {logs.map(l => (
                    <div key={l.id} className="flex justify-between items-start border-b border-slate-50 pb-1.5">
                      <span>[{new Date(l.timestamp).toLocaleString()}] {l.item} — {l.action}</span>
                      <span className="font-bold text-[#1A2B3C] shrink-0">({l.prevVal} ➔ {l.newVal})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: PRESCRIPTION VERIFICATIONS QUEUE
              ========================================== */}
          {activeTab === 'verifications' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs">
                <h3 className="text-base font-black text-[#1A2B3C] font-heading uppercase mb-1 tracking-wider">Prescription Verification Desk</h3>
                <p className="text-xs text-gray-400 mb-6">Review legal medical practitioner files to validate medicine distribution requirements.</p>

                <div className="space-y-4">
                  {orders.filter(o => o.status === 'Prescription Review').map(o => (
                    <div key={o.id} className="border border-indigo-100 rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-4 shadow-3xs">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">🚨 Rx Audit Necessary</span>
                          <span className="text-[9px] bg-[#0A6E6E]/10 text-[#0A6E6E] font-black px-2 py-0.5 rounded">
                            Order: ord-{o.id}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-[#1A2B3C] text-sm">Patient: {o.patientName} ({o.patientPhone})</h4>
                        <p className="text-gray-400 font-semibold">Address: {o.patientAddress}, {o.patientCity}, {o.patientPincode}</p>
                        
                        <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 mt-2">
                          <span className="text-[9px] font-black text-indigo-950 uppercase block mb-1">Medicines in Cart requiring prescription:</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-indigo-900 font-semibold">
                            {o.items.filter(i => i.prescriptionRequired).map((it, idx) => (
                              <li key={idx}>{it.brandName} ({it.name}) — Qty: {it.quantity}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="shrink-0 space-y-2 w-full md:w-auto">
                        <div className="border border-gray-200 rounded-lg p-2.5 bg-white text-center">
                          <span className="text-[10px] font-mono text-indigo-700 font-bold block mb-1">📎 {o.prescriptionUrl}</span>
                          <button 
                            onClick={() => alert(`Reviewing prescription document: ${o.prescriptionUrl}\n\nClinician: Dr. Rajesh Sharma\nRegistered MCI: MCI-289192\nExpires: Valid Outpatient Consult`)}
                            className="text-[9px] text-teal-800 underline font-extrabold"
                          >
                            Click to View Dr. Rx File
                          </button>
                        </div>

                        {activeReviewOrder?.id === o.id ? (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3 shadow-sm animate-fadeIn">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Rejection Reason *</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Incomplete generic formulation or missing clinician signature."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-[11px]"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleVerifyPrescription(o.id, false)}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded text-[10px]"
                              >
                                Confirm Rejection
                              </button>
                              <button 
                                onClick={() => setActiveReviewOrder(null)}
                                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 w-full md:w-auto justify-end">
                            <button 
                              onClick={() => { setActiveReviewOrder(o); setRejectReason(''); }}
                              className="flex-1 md:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleVerifyPrescription(o.id, true)}
                              className="flex-1 md:flex-none px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold rounded-lg shadow-sm"
                            >
                              Approve Rx
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {orders.filter(o => o.status === 'Prescription Review').length === 0 && (
                    <div className="text-center p-8 text-gray-400 font-semibold bg-slate-50 rounded-xl">
                      No prescriptions currently awaiting verification in your dispatch queue.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: ORDER TRACKING (LOGISTICS)
              ========================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs">
                <h3 className="text-base font-black text-[#1A2B3C] font-heading uppercase mb-1 tracking-wider">Home Delivery Dispatch Desk</h3>
                <p className="text-xs text-gray-400 mb-6">Track medicine home packaging pipelines and progress logistics milestones seamlessly.</p>

                <div className="space-y-4">
                  {orders.map(o => (
                    <div key={o.id} className="border border-gray-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'Cancelled' || o.status === 'Refunded' ? 'bg-rose-100 text-rose-800' :
                            o.status === 'Prescription Review' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            Status: {o.status}
                          </span>
                          <span className="text-gray-400 font-medium">{o.createdAt.slice(0, 10)}</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">ord-{o.id} — Patient: {o.patientName}</h4>
                        <p className="text-gray-400 font-medium">Cart: {o.items.map(it => `${it.brandName} x ${it.quantity}`).join(', ')}</p>
                        <p className="text-gray-400 font-medium">Address: {o.patientAddress}, {o.patientCity} — Payout: <span className="font-bold text-[#0A6E6E]">₹{o.finalAmount}</span></p>
                      </div>

                      <div className="shrink-0 space-y-1 text-right w-full md:w-auto mt-3 md:mt-0 flex flex-col items-stretch md:items-end">
                        {['Approved', 'Preparing', 'Packed', 'Ready for Dispatch', 'Out for Delivery'].includes(o.status) ? (
                          <button
                            onClick={() => handleProgressOrderStatus(o.id, o.status)}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-lg flex items-center justify-center gap-1.5 shadow-sm text-center"
                          >
                            <Truck className="w-4 h-4" /> 
                            {o.status === 'Approved' && 'Start Preparing ➔'}
                            {o.status === 'Preparing' && 'Confirm Packed ➔'}
                            {o.status === 'Packed' && 'Hand to Dispatch ➔'}
                            {o.status === 'Ready for Dispatch' && 'Dispatch out for Delivery ➔'}
                            {o.status === 'Out for Delivery' && 'Complete Delivery ✓'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">Logistics sequence final</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: WALLET & EARNINGS
              ========================================== */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0A6E6E] text-white p-5 rounded-2xl shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase text-[#D1E5E5] block tracking-wider">Available Balance</span>
                  <div className="text-2xl font-black">₹{(metrics.totalEarnings * 0.95).toFixed(2)}</div>
                  <span className="text-[9px] text-[#D1E5E5] block pt-2 border-t border-[#0A6E6E]/40">After Platform Fee (5%)</span>
                </div>

                <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-2xs space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Gross Pharmacy Orders</span>
                  <div className="text-xl font-extrabold text-[#1A2B3C]">₹{metrics.totalEarnings}</div>
                  <span className="text-[9px] text-gray-400 block pt-2 border-t border-gray-50">Total volume completed</span>
                </div>

                <div className="bg-white border border-[#D1E5E5] p-5 rounded-2xl shadow-2xs space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Co-Partner Commissions Paid</span>
                  <div className="text-xl font-extrabold text-[#1A2B3C]">₹{(metrics.totalEarnings * 0.05).toFixed(2)}</div>
                  <span className="text-[9px] text-amber-600 font-extrabold block pt-2 border-t border-gray-50">Distributed 5%</span>
                </div>
              </div>

              {/* Commission Ledger summary & Settlement request */}
              <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Earnings Settlement Registry</h3>
                  <button
                    onClick={() => alert('✓ Settlement request submitted! Funds will be credited to your linked UPI bank account in 48 hours.')}
                    className="px-3 py-1.5 bg-[#0A6E6E] text-white font-extrabold text-[10px] rounded"
                  >
                    Request Payout
                  </button>
                </div>
                
                <div className="space-y-3 text-xs">
                  {orders.filter(o => o.status === 'Delivered').map(o => (
                    <div key={o.id} className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <div>
                        <p className="font-extrabold text-slate-800">Order ord-{o.id} Earnings Credit</p>
                        <p className="text-[10px] text-gray-400 font-medium">Customer: {o.patientName} | Gross: ₹{o.finalAmount}</p>
                      </div>
                      <div className="text-right font-mono font-bold text-emerald-700">
                        +₹{(o.finalAmount * 0.95).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === 'Delivered').length === 0 && (
                    <p className="text-center py-6 text-gray-400 font-semibold">No transacted earnings settled yet.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              TAB: REPORTS
              ========================================== */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs animate-fadeIn space-y-6">
              <h3 className="text-base font-black text-[#1A2B3C] font-heading uppercase mb-1 tracking-wider">Dynamic Pharmacy Reports</h3>
              <p className="text-xs text-gray-400 mb-6">Select report domains and compile secure PDFs, spreadsheets, and data feeds.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Inventory Report Card */}
                <div className="border border-gray-100 p-4 rounded-2xl bg-slate-50 flex justify-between items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C]">1. Inventory & Low Stock Ledger</h4>
                    <p className="text-gray-400 mt-1">Contains active catalog counts, low stock alerts, batch listings, and batch expiry dates.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button 
                      onClick={() => triggerReportExport('inventory', 'pdf')}
                      className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-bold text-[10px] rounded text-center whitespace-nowrap"
                    >
                      Export PDF
                    </button>
                    <button 
                      onClick={() => triggerReportExport('inventory', 'csv')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-gray-700 font-bold text-[10px] rounded text-center whitespace-nowrap"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Sales & Revenue Card */}
                <div className="border border-gray-100 p-4 rounded-2xl bg-slate-50 flex justify-between items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C]">2. Sales & Earnings Ledger</h4>
                    <p className="text-gray-400 mt-1">Includes transacted gross amounts, platform commission deductions, and net payouts history.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button 
                      onClick={() => triggerReportExport('sales', 'pdf')}
                      className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-bold text-[10px] rounded text-center whitespace-nowrap"
                    >
                      Export PDF
                    </button>
                    <button 
                      onClick={() => triggerReportExport('sales', 'csv')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-gray-700 font-bold text-[10px] rounded text-center whitespace-nowrap"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Threat Expiry Ledger Card */}
                <div className="border border-gray-100 p-4 rounded-2xl bg-slate-50 flex justify-between items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C]">3. Threat Expiry Batches</h4>
                    <p className="text-gray-400 mt-1">Lists all catalog batches which are past their recommended expiration shelf-lives.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button 
                      onClick={() => triggerReportExport('expired', 'pdf')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded text-center whitespace-nowrap"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB: REVIEWS
              ========================================== */}
          {activeTab === 'reviews' && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs animate-fadeIn space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-[#1A2B3C] font-heading uppercase tracking-wider">Patient Reviews & Feedback</h3>
                  <p className="text-xs text-gray-400">Direct evaluations of pharmacy accuracy, packing standard, and delivery speed.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-900 font-extrabold px-3 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> 4.8 / 5.0 Average
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border border-gray-100 p-4 rounded-xl bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800">{r.author}</span>
                      <span className="text-gray-400">{r.date}</span>
                    </div>
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 font-medium leading-relaxed italic">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: SETTINGS
              ========================================== */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-2xs animate-fadeIn space-y-6">
              <h3 className="text-base font-black text-[#1A2B3C] font-heading uppercase mb-1 tracking-wider">Notification & Alert Preferences</h3>
              <p className="text-xs text-gray-400 mb-6">Configure integrated SMS, Email, and In-App notification gateways.</p>

              <div className="space-y-4 text-xs">
                
                <div className="border border-gray-100 p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C]">Direct Mobile SMS Alerts</h4>
                    <p className="text-gray-400 mt-0.5">Receive immediate SMS dispatch coordinates when a patient places an order.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#0A6E6E] w-4 h-4 shrink-0" />
                </div>

                <div className="border border-gray-100 p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C]">SMTP Email Notifications</h4>
                    <p className="text-gray-400 mt-0.5">Receive periodic audit invoices and daily cash-ledger settlement receipts.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#0A6E6E] w-4 h-4 shrink-0" />
                </div>

                <div className="border border-gray-100 p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1A2B3C]">Low Inventory Threat Triggers</h4>
                    <p className="text-gray-400 mt-0.5">In-App warning banners displayed when brand levels fall past preset safety thresholds.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-[#0A6E6E] w-4 h-4 shrink-0" />
                </div>

                <button 
                  onClick={() => alert('✓ Alert preferences saved!')}
                  className="px-5 py-2.5 bg-[#0A6E6E] text-white font-extrabold rounded-lg shadow-2xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ==========================================
          MODAL: ADD/EDIT MEDICINE
          ========================================== */}
      {showMedicineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#D1E5E5] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn shadow-2xl">
            <h3 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1 font-heading border-b border-gray-100 pb-3">
              {editingMedicine ? 'Edit Catalog Medicine Details' : 'Onboard New Catalog Formulation'}
            </h3>

            <form onSubmit={handleSaveMedicine} className="space-y-4 text-xs mt-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Standard Formulation Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Paracetamol 650mg IP"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Generic / Molecule Composition *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Paracetamol"
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Brand Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Dolo 650"
                    value={medBrand}
                    onChange={(e) => setMedBrand(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Manufacturer *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Micro Labs"
                    value={medManufacturer}
                    onChange={(e) => setMedManufacturer(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Therapeutic Category *</label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded"
                  >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Strength *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 650mg"
                    value={medStrength}
                    onChange={(e) => setMedStrength(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Dosage Form *</label>
                  <select
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Pack Size *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 15 Tablets"
                    value={medPackSize}
                    onChange={(e) => setMedPackSize(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Batch Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. BT-PR928"
                    value={medBatch}
                    onChange={(e) => setMedBatch(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">MRP Price *</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    value={medPrice}
                    onChange={(e) => setMedPrice(Number(e.target.value))}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Discount % *</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    max={99}
                    value={medDiscount}
                    onChange={(e) => setMedDiscount(Number(e.target.value))}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">GST % *</label>
                  <select
                    value={medGst}
                    onChange={(e) => setMedGst(Number(e.target.value))}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded"
                  >
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Expiry Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={medExpiry}
                    onChange={(e) => setMedExpiry(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Stock Quantity *</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    value={medStock}
                    onChange={(e) => setMedStock(Number(e.target.value))}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Minimum Alert Limit *</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    value={medMinStock}
                    onChange={(e) => setMedMinStock(Number(e.target.value))}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-dashed border-gray-100 p-3 rounded-lg">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={medRxReq}
                    onChange={(e) => setMedRxReq(e.target.checked)}
                    className="accent-[#0A6E6E] w-4 h-4"
                  />
                  <span>Prescription Verification Required (Rx Schedule H)</span>
                </label>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Simulated Image Link</label>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/photo-..."
                    value={medImage}
                    onChange={(e) => setMedImage(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMedicineModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Formulation
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
