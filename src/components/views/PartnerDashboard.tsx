import React from 'react';
import { 
  Briefcase, Wallet, Users, Landmark, AlertCircle, CheckCircle, 
  UserCheck, Send, ShieldAlert, Check, Upload, CreditCard, Building2, 
  Stethoscope, ShieldCheck, Phone, Mail, FileText, Plus, Trash2, ArrowRight,
  Clock, Target, Award, TrendingUp, Gift, ChevronDown, ChevronRight, Menu, X
} from 'lucide-react';
import { Partner, Doctor, Clinic, Appointment, Pharmacy, Laboratory, Physiotherapy } from '../../types';
import { indiaStatesData } from '../../data/indiaLocations';
import { getPartnerEarningsSummary, getCommissionRecords, getCommissionConfig, getPayoutReceipts, generateCommission, addAuditLog, getPartnerVerificationStage, triggerVerificationNotification } from '../../data/commissionUtils';
import { getTargetConfig, calculatePartnerPerformance, checkAndTriggerRewards, setPartnerRegistrationDate, getRewardEligibilities, saveInAppNotification } from '../../data/targetUtils';
import { MOCK_DOCTORS, MOCK_CLINICS } from '../../data/mockData';
import { SEED_PARTNERS } from '../../data/seedData';
import DoctorRegister from './DoctorRegister';
import ClinicRegister from './ClinicRegister';
import PartnerRegister from './PartnerRegister';
import PharmacyRegister from './PharmacyRegister';
import LaboratoryRegister from './LaboratoryRegister';
import PhysiotherapyRegister from './PhysiotherapyRegister';

interface PartnerDashboardProps {
  setView: (view: string) => void;
  userEmail: string | null;
}

export default function PartnerDashboard({ setView, userEmail }: PartnerDashboardProps) {
  // Load Partner information
  const [partner, setPartner] = React.useState<Partner | null>(null);
  const [partners, setPartners] = React.useState<any[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const [clinics, setClinics] = React.useState<Clinic[]>([]);
  const [laboratories, setLaboratories] = React.useState<Laboratory[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [notificationLog, setNotificationLog] = React.useState<string[]>([]);

  // Target Performance System States
  const [targetConfig, setTargetConfig] = React.useState<any>(null);
  const [performance, setPerformance] = React.useState<any>(null);

  // DOCT SPARK Review States
  const [selectedDocForReview, setSelectedDocForReview] = React.useState<Doctor | null>(null);
  const [reviewReferralId, setReviewReferralId] = React.useState('');
  const [reviewCorrectionNotes, setReviewCorrectionNotes] = React.useState('');
  const [reviewShowCorrection, setReviewShowCorrection] = React.useState(false);
  const [reviewError, setReviewError] = React.useState('');

  // Partner Verification Workflow States
  const [selectedPartnerForReview, setSelectedPartnerForReview] = React.useState<Partner | null>(null);
  const [partnerReviewRemarks, setPartnerReviewRemarks] = React.useState('');
  const [partnerReviewError, setPartnerReviewError] = React.useState('');
  const [showAddPartnerModal, setShowAddPartnerModal] = React.useState(false);

  React.useEffect(() => {
    if (selectedDocForReview) {
      if (selectedDocForReview.referralIdLocked) {
        setReviewReferralId(selectedDocForReview.referralPartnerId || '');
      } else {
        setReviewReferralId(partner?.referralId || '');
      }
      setReviewCorrectionNotes('');
      setReviewShowCorrection(false);
      setReviewError('');
    }
  }, [selectedDocForReview, partner]);

  // Synchronize target and countdown in real time
  React.useEffect(() => {
    if (!partner) return;
    
    const config = getTargetConfig();
    setTargetConfig(config);

    const calc = () => {
      const perf = calculatePartnerPerformance(partner, doctors, clinics, appointments, config);
      setPerformance(perf);
      
      // Auto trigger rewards and system notifications when achieved
      const triggerResult = checkAndTriggerRewards(partner, perf, config);
      if (triggerResult.triggered) {
        setNotificationLog(prev => [...triggerResult.notifications, ...prev]);
        // Re-load partners list from localStorage to reflect potential updates
        const savedPartners = localStorage.getItem('ds_partners');
        if (savedPartners) setPartners(JSON.parse(savedPartners));
      }
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [partner, doctors, clinics, appointments]);

  // Navigation tabs inside Dashboard
  const [activeTab, setActiveTab] = React.useState<'overview' | 'onboard-doctor' | 'onboard-clinic' | 'onboard-pharmacy' | 'onboard-laboratory' | 'onboard-physiotherapy' | 'verifications' | 'district-partners' | 'city-partners' | 'profile' | 'earnings'>('overview');

  // Local Mobile Sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Collapsible parent categories in Sidebar
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'dashboard': true,
    'onboarding': true,
    'compliance': true,
    'network': true,
    'account': true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Earnings search and filter states
  const [earnSearch, setEarnSearch] = React.useState('');
  const [earnFilterType, setEarnFilterType] = React.useState<'All' | 'Subscription' | 'Appointment'>('All');
  const [earnFilterStatus, setEarnFilterStatus] = React.useState<'All' | 'Pending' | 'Approved' | 'Held' | 'Paid' | 'Reversed'>('All');

  // Load and sync database on mount
  React.useEffect(() => {
    const savedPartners = localStorage.getItem('ds_partners');
    let pList = savedPartners ? JSON.parse(savedPartners) : [];
    // Ensure Asif Sarkar is always appended if not already present
    const hasAsif = pList.some((p: any) => p.id === 'seed-part-asif');
    if (!hasAsif) {
      const asifPartner = SEED_PARTNERS.find(p => p.id === 'seed-part-asif');
      if (asifPartner) {
        pList = [...pList, asifPartner];
        localStorage.setItem('ds_partners', JSON.stringify(pList));
      }
    }
    setPartners(pList);

    const savedDocs = localStorage.getItem('ds_doctors');
    const dList = savedDocs ? JSON.parse(savedDocs) : MOCK_DOCTORS;
    setDoctors(dList);

    const savedClinics = localStorage.getItem('ds_clinics');
    const cList = savedClinics ? JSON.parse(savedClinics) : MOCK_CLINICS;
    setClinics(cList);

    const savedLabs = localStorage.getItem('ds_laboratories');
    const labList = savedLabs ? JSON.parse(savedLabs) : [];
    setLaboratories(labList);

    const savedApts = localStorage.getItem('ds_appointments');
    const aList = savedApts ? JSON.parse(savedApts) : [];
    setAppointments(aList);

    // Identify current logged-in partner
    const emailToFind = userEmail || 'district.partner@doctspark.in';
    let current = pList.find((p: any) => p.email.toLowerCase() === emailToFind.toLowerCase());

    if (!current) {
      // Create fallback demo partner based on email
      const isState = emailToFind.includes('state');
      current = {
        id: isState ? 'part-demo-state' : 'part-demo-district',
        name: isState ? 'Aditya Deshmukh' : 'Suresh Patel',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        dob: '1985-04-12',
        age: 41,
        gender: 'Male',
        phone: isState ? '9811223344' : '9876543210',
        email: emailToFind,
        address: isState ? 'Bandra West, Mumbai' : 'Deccan Gymkhana, Pune',
        state: 'Maharashtra',
        district: isState ? undefined : 'Pune',
        pincode: isState ? '400050' : '411004',
        aadhaarNumber: '111122223333',
        panNumber: 'ABCDE1234F',
        voterIdNumber: 'VTR1234567',
        hasDrivingLicense: true,
        drivingLicenseNumber: 'DL-1420110068769',
        qualification: 'MBA - Healthcare Management',
        experience: '12 Years',
        occupation: 'Medical Franchise Owner',
        skills: 'Business Growth, Doctor Relations, Verification',
        partnerType: isState ? 'State' : 'District',
        assignedState: 'Maharashtra',
        assignedDistrict: isState ? undefined : 'Pune',
        status: 'Approved',
        onboardedDoctorsCount: 0,
        onboardedClinicsCount: 0,
        walletBalance: 0
      };
    }
    setPartner(current);
  }, [userEmail]);

  React.useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail as any);
      }
    };
    window.addEventListener('partner-tab-change', handleTabChange);
    return () => {
      window.removeEventListener('partner-tab-change', handleTabChange);
    };
  }, []);

  // Recalculate partner stats dynamically based on actual onboarded accounts & appointments
  const partnerStats = React.useMemo(() => {
    if (!partner) return { doctorsCount: 0, clinicsCount: 0, pharmaciesCount: 0, laboratoriesCount: 0, physiotherapyCount: 0, instantEarnings: 0, monthlyEarnings: 0, totalWallet: 0 };

    // 1. Count actual onboarded by this partner
    const onboardedDocs = doctors.filter(d => d.onboardedBy === partner.id);
    const onboardedCls = clinics.filter(c => c.onboardedBy === partner.id);

    const savedPharmacies = localStorage.getItem('ds_pharmacies');
    const pharmaciesList: Pharmacy[] = savedPharmacies ? JSON.parse(savedPharmacies) : [];
    const onboardedPharms = pharmaciesList.filter(p => p.onboardedBy === partner.id);

    const savedLaboratories = localStorage.getItem('ds_laboratories');
    const laboratoriesList: Laboratory[] = savedLaboratories ? JSON.parse(savedLaboratories) : [];
    const onboardedLabs = laboratoriesList.filter(l => l.onboardedBy === partner.id);

    const savedPhysio = localStorage.getItem('ds_physiotherapists');
    const physioList: Physiotherapy[] = savedPhysio ? JSON.parse(savedPhysio) : [];
    const onboardedPhysios = physioList.filter(p => p.onboardedBy === partner.id);

    // Get dynamic config percentages
    const config = getCommissionConfig();
    
    // Subscription fee per profile (₹5,000)
    const subPct = partner.partnerType === 'City' 
      ? config.subscriptionCityPct 
      : partner.partnerType === 'District' 
      ? config.subscriptionDistrictPct 
      : config.subscriptionStatePct;
      
    const commissionPerProfile = (subPct / 100) * 5000;
    const totalOnboardedProfiles = onboardedDocs.length + onboardedCls.length + onboardedPharms.length + onboardedLabs.length + onboardedPhysios.length;
    const instantEarnings = totalOnboardedProfiles * commissionPerProfile;

    // Appointment Platform charge (5% of booking fee)
    // The partner gets their appointment percentage out of that platform charge
    const aptPct = partner.partnerType === 'City'
      ? config.appointmentCityPct
      : partner.partnerType === 'District'
      ? config.appointmentDistrictPct
      : config.appointmentStatePct;

    let onboardedRevenue = 0;
    const onboardedDocIds = onboardedDocs.map(d => d.id);

    appointments.forEach(apt => {
      if (onboardedDocIds.includes(apt.doctorId) && (apt.status === 'Confirmed' || apt.status === 'Completed')) {
        const platformCharge = apt.fee * 0.05;
        onboardedRevenue += platformCharge;
      }
    });

    const monthlyEarnings = Math.round(onboardedRevenue * (aptPct / 100));
    
    // Get ledger summary to be safe and accurate
    const summary = getPartnerEarningsSummary(partner.id);
    const totalWallet = partner.walletBalance || summary.approvedComm || (instantEarnings + monthlyEarnings);

    return {
      doctorsCount: onboardedDocs.length,
      clinicsCount: onboardedCls.length,
      pharmaciesCount: onboardedPharms.length,
      laboratoriesCount: onboardedLabs.length,
      physiotherapyCount: onboardedPhysios.length,
      instantEarnings: summary.weeklySubComm || instantEarnings,
      monthlyEarnings: summary.monthlyAptComm || monthlyEarnings,
      totalWallet
    };
  }, [partner, doctors, clinics, appointments]);

  // ==========================================
  // ONBOARDING FORM STATES (DOCTOR & CLINIC)
  // ==========================================
  const [docName, setDocName] = React.useState('');
  const [docSpecialty, setDocSpecialty] = React.useState('General Physician');
  const [docExperience, setDocExperience] = React.useState('5');
  const [docClinicName, setDocClinicName] = React.useState('');
  const [docCity, setDocCity] = React.useState('');
  const [docState, setDocState] = React.useState('');
  const [docDistrict, setDocDistrict] = React.useState('');
  const [docPincode, setDocPincode] = React.useState('');
  const [docPhone, setDocPhone] = React.useState('');
  const [docEmail, setDocEmail] = React.useState('');
  const [docRegNum, setDocRegNum] = React.useState('');
  const [docBio, setDocBio] = React.useState('');
  const [docEducation, setDocEducation] = React.useState('');

  const [clinicNameInput, setClinicNameInput] = React.useState('');
  const [clinicType, setClinicType] = React.useState('Multi-Specialty');
  const [clinicOwner, setClinicOwner] = React.useState('');
  const [clinicTradeLicense, setClinicTradeLicense] = React.useState('');
  const [clinicCity, setClinicCity] = React.useState('');
  const [clinicStateInput, setClinicStateInput] = React.useState('');
  const [clinicDistrictInput, setClinicDistrictInput] = React.useState('');
  const [clinicPincode, setClinicPincode] = React.useState('');
  const [clinicAddress, setClinicAddress] = React.useState('');
  const [clinicPhone, setClinicPhone] = React.useState('');
  const [clinicEmail, setClinicEmail] = React.useState('');

  // Step-by-Step Validation & Interactive simulation states
  const [onboardStep, setOnboardStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [subPaid, setSubPaid] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'upi' | 'card' | 'net'>('upi');
  const [mobileVerified, setMobileVerified] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState(false);
  const [mobileOtp, setMobileOtp] = React.useState('');
  const [emailOtp, setEmailOtp] = React.useState('');
  const [sentMobileOtp, setSentMobileOtp] = React.useState('');
  const [sentEmailOtp, setSentEmailOtp] = React.useState('');
  const [idProofUploaded, setIdProofUploaded] = React.useState<string | null>(null);
  const [licenseUploaded, setLicenseUploaded] = React.useState<string | null>(null);

  const [formError, setFormError] = React.useState('');
  const [onboardSuccess, setOnboardSuccess] = React.useState(false);

  // Initialize territory locks on form based on partner details
  React.useEffect(() => {
    if (partner) {
      setDocState(partner.assignedState);
      setClinicStateInput(partner.assignedState);
      if (partner.partnerType === 'District' && partner.assignedDistrict) {
        setDocDistrict(partner.assignedDistrict);
        setClinicDistrictInput(partner.assignedDistrict);
      }
    }
  }, [partner, activeTab]);

  const handleSendMobileOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSentMobileOtp(code);
    alert(`[Simulated SMS Gateway] OTP code for Mobile Verification is: ${code}`);
  };

  const handleVerifyMobileOtp = () => {
    if (mobileOtp === sentMobileOtp && mobileOtp !== '') {
      setMobileVerified(true);
      setFormError('');
    } else {
      setFormError('Invalid Mobile OTP entered.');
    }
  };

  const handleSendEmailOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSentEmailOtp(code);
    alert(`[Simulated Email Server] OTP code for Email Verification is: ${code}`);
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtp === sentEmailOtp && emailOtp !== '') {
      setEmailVerified(true);
      setFormError('');
    } else {
      setFormError('Invalid Email OTP entered.');
    }
  };

  const handleSimulatePayment = () => {
    setSubPaid(true);
  };

  const handleOnboardDoctorFromRegister = (doctorData: any) => {
    // 1. Map to exact Doctor schema, reinforcing onboardedBy and territory locks
    const finalDoc: Doctor = {
      ...doctorData,
      id: doctorData.id || `doc-${Date.now()}`,
      onboardedBy: partner?.id,
      onboardedByType: partner?.partnerType,
      verificationStatus: partner?.partnerType === 'District' ? 'Pending District' : 'Pending State',
    };

    // 2. Save to database & update state
    const updatedDocs = [finalDoc, ...doctors];
    localStorage.setItem('ds_doctors', JSON.stringify(updatedDocs));
    setDoctors(updatedDocs);

    // 3. Generate subscription commission if paid
    if (finalDoc.subscriptionPaid) {
      generateCommission('Subscription', finalDoc.id, `Dr. ${finalDoc.name}`, 5000, finalDoc.onboardedBy);
    }

    // 4. Update parent states and show success message
    setOnboardSuccess(true);
  };

  const handleOnboardClinicFromRegister = (clinicData: any) => {
    // 1. Map to exact Clinic schema, reinforcing onboardedBy and territory locks
    const finalClinic: Clinic = {
      ...clinicData,
      id: clinicData.id || `clinic-${Date.now()}`,
      onboardedBy: partner?.id,
      onboardedByType: partner?.partnerType,
      verificationStatus: partner?.partnerType === 'District' ? 'Pending District' : 'Pending State',
    };

    // 2. Save to database & update state
    const updatedClinics = [finalClinic, ...clinics];
    localStorage.setItem('ds_clinics', JSON.stringify(updatedClinics));
    setClinics(updatedClinics);

    // 3. Generate subscription commission if paid
    if (finalClinic.subscriptionPaid) {
      generateCommission('Subscription', finalClinic.id, finalClinic.name, 5000, finalClinic.onboardedBy);
    }

    // 4. Update parent states and show success message
    setOnboardSuccess(true);
  };

  // Onboard Doctor Submit Action
  const submitOnboardDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!docName || !docPhone || !docEmail || !docRegNum || !docCity || !docPincode) {
      setFormError('Please fill in all mandatory doctor registration fields.');
      return;
    }

    // Verify territory
    if (partner) {
      if (docState !== partner.assignedState) {
        setFormError(`Territory Violation: This doctor lies in state ${docState}, but your territory is locked to ${partner.assignedState}.`);
        return;
      }
      if (partner.partnerType === 'District' && partner.assignedDistrict && docDistrict !== partner.assignedDistrict) {
        setFormError(`Territory Violation: This doctor lies in district ${docDistrict}, but your district territory is locked to ${partner.assignedDistrict}.`);
        return;
      }
    }

    if (!idProofUploaded) {
      setFormError('Owner / Manager identity proof document upload is mandatory.');
      return;
    }

    if (!subPaid || !mobileVerified || !emailVerified) {
      setFormError('Subscription payment, Mobile OTP, and Email OTP verifications are mandatory before profile submission.');
      return;
    }

    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      name: docName.trim(),
      specialty: docSpecialty,
      experience: Number(docExperience) || 5,
      clinicName: docClinicName.trim() || 'Central Clinic',
      city: docCity.trim(),
      state: docState,
      district: docDistrict,
      rating: 5.0,
      reviewsCount: 0,
      feeInClinic: 500,
      feeVideo: 400,
      nextAvailable: 'Tomorrow 10:00 AM',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      bio: docBio.trim() || `${docName} is a newly onboarded specialist.`,
      education: docEducation.trim() || 'MBBS, MD',
      registrationNumber: docRegNum.trim(),
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '04:00 PM', '04:30 PM'],
      lat: 19.076,
      lng: 72.8777,
      onboardedBy: partner?.id,
      onboardedByType: partner?.partnerType,
      verificationStatus: partner?.partnerType === 'District' ? 'Pending District' : 'Pending State', // Pipeline starts
      subscriptionPaid: true,
      mobileOtpVerified: true,
      emailOtpVerified: true,
      ownerIdProofDoc: idProofUploaded
    };

    // Save to database
    const updatedDocs = [newDoc, ...doctors];
    localStorage.setItem('ds_doctors', JSON.stringify(updatedDocs));
    setDoctors(updatedDocs);

    // Reset Form & Show Success
    setOnboardSuccess(true);
    resetFormStates();
  };

  // Onboard Clinic Submit Action
  const submitOnboardClinic = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!clinicNameInput || !clinicOwner || !clinicTradeLicense || !clinicCity || !clinicPincode || !clinicAddress || !clinicPhone || !clinicEmail) {
      setFormError('Please fill in all mandatory clinic onboarding fields.');
      return;
    }

    // Verify territory
    if (partner) {
      if (clinicStateInput !== partner.assignedState) {
        setFormError(`Territory Violation: This clinic lies in state ${clinicStateInput}, but your territory is locked to ${partner.assignedState}.`);
        return;
      }
      if (partner.partnerType === 'District' && partner.assignedDistrict && clinicDistrictInput !== partner.assignedDistrict) {
        setFormError(`Territory Violation: This clinic lies in district ${clinicDistrictInput}, but your district territory is locked to ${partner.assignedDistrict}.`);
        return;
      }
    }

    if (!idProofUploaded) {
      setFormError('Owner / Manager identity proof document upload is mandatory.');
      return;
    }

    if (!licenseUploaded) {
      setFormError('Business Trade License document upload is mandatory for clinics.');
      return;
    }

    if (!subPaid || !mobileVerified || !emailVerified) {
      setFormError('Subscription payment, Mobile OTP, and Email OTP verifications are mandatory before profile submission.');
      return;
    }

    const newClinic: Clinic = {
      id: `c-${Date.now()}`,
      name: clinicNameInput.trim(),
      city: clinicCity.trim(),
      state: clinicStateInput,
      district: clinicDistrictInput,
      address: clinicAddress.trim(),
      rating: 5.0,
      reviewsCount: 0,
      photos: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400'],
      timings: '09:00 AM - 08:00 PM',
      doctors: [],
      lat: 19.076,
      lng: 72.8777,
      clinicType: clinicType,
      phone: clinicPhone.trim(),
      email: clinicEmail.trim(),
      ownerName: clinicOwner.trim(),
      tradeLicenseNumber: clinicTradeLicense.trim(),
      licenseDocuments: [licenseUploaded],
      onboardedBy: partner?.id,
      onboardedByType: partner?.partnerType,
      verificationStatus: partner?.partnerType === 'District' ? 'Pending District' : 'Pending State', // Pipeline starts
      subscriptionPaid: true,
      mobileOtpVerified: true,
      emailOtpVerified: true,
      ownerIdProofDoc: idProofUploaded
    };

    // Save to database
    const updatedClinics = [newClinic, ...clinics];
    localStorage.setItem('ds_clinics', JSON.stringify(updatedClinics));
    setClinics(updatedClinics);

    // Reset Form & Show Success
    setOnboardSuccess(true);
    resetFormStates();
  };

  const resetFormStates = () => {
    setDocName('');
    setDocClinicName('');
    setDocCity('');
    setDocPincode('');
    setDocPhone('');
    setDocEmail('');
    setDocRegNum('');
    setDocBio('');
    setDocEducation('');

    setClinicNameInput('');
    setClinicOwner('');
    setClinicTradeLicense('');
    setClinicCity('');
    setClinicPincode('');
    setClinicAddress('');
    setClinicPhone('');
    setClinicEmail('');

    setSubPaid(false);
    setMobileVerified(false);
    setEmailVerified(false);
    setMobileOtp('');
    setEmailOtp('');
    setSentMobileOtp('');
    setSentEmailOtp('');
    setIdProofUploaded(null);
    setLicenseUploaded(null);
    setOnboardStep(1);
  };

  // ==========================================
  // PIPELINE VERIFICATIONS ACTION
  // ==========================================
  const handleVerifyRequest = (id: string, type: 'doctor' | 'clinic' | 'laboratory', nextStatus: 'Pending State' | 'Pending Admin') => {
    let targetName = '';
    let targetPhone = '';
    let targetEmail = '';

    if (type === 'doctor') {
      const doc = doctors.find(d => d.id === id);
      if (doc) {
        targetName = doc.name;
        targetPhone = doc.phone || '9876543210';
        targetEmail = doc.email || `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
      }
      const updated = doctors.map(d => d.id === id ? { ...d, verificationStatus: nextStatus } : d);
      localStorage.setItem('ds_doctors', JSON.stringify(updated));
      setDoctors(updated);
    } else if (type === 'laboratory') {
      const lab = laboratories.find(l => l.id === id);
      if (lab) {
        targetName = lab.name;
        targetPhone = lab.phone || '9876543210';
        targetEmail = lab.email || `${lab.name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
      }
      const updated = laboratories.map(l => l.id === id ? { ...l, status: nextStatus as any } : l);
      localStorage.setItem('ds_laboratories', JSON.stringify(updated));
      setLaboratories(updated);
    } else {
      const cl = clinics.find(c => c.id === id);
      if (cl) {
        targetName = cl.name;
        targetPhone = cl.phone || '9876543210';
        targetEmail = cl.email || `${cl.name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;
      }
      const updated = clinics.map(c => c.id === id ? { ...c, verificationStatus: nextStatus } : c);
      localStorage.setItem('ds_clinics', JSON.stringify(updated));
      setClinics(updated);
    }

    const stageName = nextStatus === 'Pending State' ? 'District Partner Verification' : 'State Partner Verification';
    const nextApprover = nextStatus === 'Pending State' ? 'State Partner' : 'Super Admin';

    const emailLog = `[EMAIL SENDER] To: ${targetEmail} | Subject: DOCT SPARK Profile Status Update | Body: "Dear ${targetName}, your clinical profile has been verified and approved at the ${stageName} stage. It has been advanced to ${nextApprover} review."`;
    const smsLog = `[SMS GATEWAY] To: +91 ${targetPhone} | SMS: "Doct Spark Alert: Your profile has cleared ${stageName}! Next level: ${nextApprover} verification."`;

    setNotificationLog(prev => [emailLog, smsLog, ...prev]);
    alert(
      `✓ Document Verification Approved!\n\n` +
      `Establishment: ${targetName}\n` +
      `Advanced to: ${nextStatus}\n\n` +
      `✉ AUTOMATED NOTIFICATIONS TRANSMITTED:\n` +
      `• SMS sent to +91 ${targetPhone}\n` +
      `• Email sent to ${targetEmail}`
    );
  };

  // ==========================================
  // DOCT SPARK DETAILED DOCTOR VERIFICATION FLOW
  // ==========================================
  const handleVerifyDoctor = (docId: string, actionType: 'approve' | 'reject' | 'correction' | 'send_back') => {
    if (!partner) return;
    setReviewError('');

    const doc = doctors.find(d => d.id === docId);
    if (!doc) {
      setReviewError('Doctor profile not found.');
      return;
    }

    const savedPartnersRaw = localStorage.getItem('ds_partners');
    const partnersList: any[] = savedPartnersRaw ? JSON.parse(savedPartnersRaw) : [];

    let updatedDocs = [...doctors];
    let auditAction = '';
    let auditDetails = '';
    let nextStatus: 'Pending District' | 'Pending State' | 'Pending Admin' | 'Approved' | 'Rejected' | 'Correction Requested' = doc.verificationStatus || 'Pending District';

    const targetPhone = doc.contactPhone || '9876543210';
    const targetEmail = doc.email || `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}@doctspark.in`;

    if (actionType === 'approve') {
      // 1. Determine next status based on routing hierarchy
      if (partner.partnerType === 'District') {
        // District partner approves -> advances to State Partner if exists, otherwise Super Admin
        const statePartnerExists = partnersList.some(p => p.partnerType === 'State' && p.assignedState === doc.state && p.status === 'Approved');
        nextStatus = statePartnerExists ? 'Pending State' : 'Pending Admin';
      } else if (partner.partnerType === 'State') {
        // State partner approves -> advances to Admin
        nextStatus = 'Pending Admin';
      }

      // 2. Validate and Save Referral ID if not locked
      let referralIdToSave = doc.referralPartnerId || '';
      let onboardedById = doc.onboardedBy;
      let onboardedByTypeVal = doc.onboardedByType;

      if (!doc.referralIdLocked) {
        if (!reviewReferralId.trim()) {
          setReviewError('Partner Referral ID is mandatory because it was not supplied at registration.');
          return;
        }

        // Validate Referral ID
        const matchPartner = partnersList.find(p => p.referralId && p.referralId.trim().toUpperCase() === reviewReferralId.trim().toUpperCase());
        if (!matchPartner) {
          setReviewError('Invalid Referral Partner ID. Please enter a valid Partner Referral ID (e.g. ST-100001 or DT-200001).');
          return;
        }

        // Must enter their OWN referral ID
        if (matchPartner.id !== partner.id) {
          setReviewError(`You must enter your own Referral ID (${partner.referralId}) to receive onboarding credit.`);
          return;
        }

        referralIdToSave = matchPartner.referralId;
        onboardedById = matchPartner.id;
        onboardedByTypeVal = matchPartner.partnerType;
      }

      updatedDocs = doctors.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            verificationStatus: nextStatus,
            referralPartnerId: referralIdToSave,
            onboardedBy: onboardedById,
            onboardedByType: onboardedByTypeVal,
            referralIdLocked: true, // Lock permanently
            correctionRequested: false,
            correctionNotes: ''
          };
        }
        return d;
      });

      auditAction = 'Doctor Approved & Forwarded';
      auditDetails = `Approved doctor Dr. ${doc.name} (ID: ${doc.id}) at ${partner.partnerType} Stage. Referral ID Locked: ${referralIdToSave || 'None'}. Advanced to: ${nextStatus}.`;

      // In-app Notification to the next stage verifier
      if (nextStatus === 'Pending State') {
        const statePartObj = partnersList.find(p => p.partnerType === 'State' && p.assignedState === doc.state && p.status === 'Approved');
        if (statePartObj) {
          saveInAppNotification(statePartObj.id, `New self-registered doctor Dr. ${doc.name} verified by District Partner ${partner.name} and forwarded to you.`);
        }
      } else if (nextStatus === 'Pending Admin') {
        saveInAppNotification('superadmin', `Doctor Dr. ${doc.name} verified by State Partner ${partner.name} and forwarded for final activation.`);
      }

      // SMS/Email Simulator Logs
      const stageName = partner.partnerType === 'District' ? 'District Partner Verification' : 'State Partner Verification';
      const nextApprover = nextStatus === 'Pending State' ? 'State Partner' : 'Super Admin';
      const emailLog = `[EMAIL SENDER] To: ${targetEmail} | Subject: DOCT SPARK Profile Status Update | Body: "Dear Dr. ${doc.name}, your clinical profile has been verified and approved at the ${stageName} stage. It has been advanced to ${nextApprover} review."`;
      const smsLog = `[SMS GATEWAY] To: +91 ${targetPhone} | SMS: "Doct Spark Alert: Your profile has cleared ${stageName}! Next level: ${nextApprover} verification."`;
      setNotificationLog(prev => [emailLog, smsLog, ...prev]);

      alert(`✓ Doctor Dr. ${doc.name} successfully verified and advanced to ${nextStatus}!`);

    } else if (actionType === 'reject') {
      nextStatus = 'Rejected' as any;
      updatedDocs = doctors.map(d => d.id === docId ? { ...d, verificationStatus: 'Rejected' as any } : d);

      auditAction = 'Doctor Rejected';
      auditDetails = `Rejected doctor Dr. ${doc.name} (ID: ${doc.id}) at ${partner.partnerType} Level. Reason: Documents invalid or ineligible.`;

      const emailLog = `[EMAIL SENDER] To: ${targetEmail} | Subject: DOCT SPARK Profile Status Update | Body: "Dear Dr. ${doc.name}, we regret to inform you that your registration has been rejected at the ${partner.partnerType} Partner stage. Please contact support."`;
      const smsLog = `[SMS GATEWAY] To: +91 ${targetPhone} | SMS: "Doct Spark Alert: Your registration has been rejected at the ${partner.partnerType} Partner stage."`;
      setNotificationLog(prev => [emailLog, smsLog, ...prev]);

      alert(`✗ Doctor Dr. ${doc.name} registration request has been Rejected.`);

    } else if (actionType === 'correction') {
      if (!reviewCorrectionNotes.trim()) {
        setReviewError('Please specify the correction instructions.');
        return;
      }

      updatedDocs = doctors.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            correctionRequested: true,
            correctionNotes: reviewCorrectionNotes,
          };
        }
        return d;
      });

      auditAction = 'Doctor Correction Requested';
      auditDetails = `Requested corrections for Dr. ${doc.name} (ID: ${doc.id}) at ${partner.partnerType} Level. Instructions: "${reviewCorrectionNotes}"`;

      const emailLog = `[EMAIL SENDER] To: ${targetEmail} | Subject: DOCT SPARK Action Required: Profile Correction | Body: "Dear Dr. ${doc.name}, your registration requires corrections. Please fix: ${reviewCorrectionNotes}"`;
      const smsLog = `[SMS GATEWAY] To: +91 ${targetPhone} | SMS: "Doct Spark Action Required: Profile Correction requested by ${partner.partnerType} Partner. Please check email."`;
      setNotificationLog(prev => [emailLog, smsLog, ...prev]);

      alert(`⚠️ Correction instructions sent to Dr. ${doc.name}.`);

    } else if (actionType === 'send_back') {
      if (partner.partnerType !== 'State') {
        setReviewError('Only State Level Partners can send a profile back to District.');
        return;
      }

      nextStatus = 'Pending District';
      updatedDocs = doctors.map(d => d.id === docId ? { ...d, verificationStatus: 'Pending District', correctionRequested: true, correctionNotes: reviewCorrectionNotes } : d);

      auditAction = 'Doctor Sent Back to District';
      auditDetails = `Sent doctor Dr. ${doc.name} back to District Partner for review. Reason: ${reviewCorrectionNotes || 'Incomplete details'}`;

      const distPartnerObj = partnersList.find(p => p.partnerType === 'District' && p.assignedState === doc.state && p.assignedDistrict === doc.district && p.status === 'Approved');
      if (distPartnerObj) {
        saveInAppNotification(distPartnerObj.id, `⚠️ Doctor Dr. ${doc.name} was sent back to you by State Partner ${partner.name}. Reason: ${reviewCorrectionNotes}`);
      }

      const emailLog = `[EMAIL SENDER] To: ${targetEmail} | Subject: DOCT SPARK Profile Sent Back | Body: "Dear Dr. ${doc.name}, your profile has been sent back to District Level Partner for review. Reason: ${reviewCorrectionNotes}"`;
      setNotificationLog(prev => [emailLog, ...prev]);

      alert(`➔ Dr. ${doc.name} sent back to District Level Partner.`);
    }

    // Save and log everything
    localStorage.setItem('ds_doctors', JSON.stringify(updatedDocs));
    setDoctors(updatedDocs);

    addAuditLog(
      auditAction,
      `Partner ${partner.name} (${partner.referralId})`,
      `${auditDetails} IP Address: 192.168.1.${Math.floor(Math.random() * 254) + 1}`
    );

    // Reset review states
    setSelectedDocForReview(null);
    setReviewReferralId('');
    setReviewCorrectionNotes('');
    setReviewShowCorrection(false);
    setReviewError('');
  };

  // ==========================================
  // DISTRICT PARTNERS GENERATION (STATE PARTNER ONLY)
  // ==========================================
  const [distPartName, setDistPartName] = React.useState('');
  const [distPartEmail, setDistPartEmail] = React.useState('');
  const [distPartPhone, setDistPartPhone] = React.useState('');
  const [distPartDistrict, setDistPartDistrict] = React.useState('');
  const [distPartPassword, setDistPartPassword] = React.useState('');

  const assignedStateDistricts = React.useMemo(() => {
    if (!partner) return [];
    const stateObj = indiaStatesData.find(s => s.state === partner.assignedState);
    return stateObj ? stateObj.districts : [];
  }, [partner]);

  React.useEffect(() => {
    if (assignedStateDistricts.length > 0) {
      setDistPartDistrict(assignedStateDistricts[0].name);
    }
  }, [assignedStateDistricts]);

  const handleCreateDistrictPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distPartName || !distPartEmail || !distPartPhone || !distPartDistrict || !distPartPassword) {
      alert('Please fill in all district partner credentials.');
      return;
    }

    const newPartnerObj: Partner = {
      id: `part-${Date.now()}`,
      name: distPartName,
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      dob: '1990-01-01',
      age: 36,
      gender: 'Male',
      phone: distPartPhone,
      email: distPartEmail,
      address: `District Hub, ${distPartDistrict}`,
      state: partner?.assignedState || 'Maharashtra',
      district: distPartDistrict,
      pincode: '400001',
      aadhaarNumber: '444455556666',
      panNumber: 'ABCDE5678X',
      voterIdNumber: 'VTR5678901',
      hasDrivingLicense: true,
      drivingLicenseNumber: 'DL-1420110068770',
      qualification: 'Graduate',
      experience: '3 Years',
      occupation: 'Agent',
      skills: 'Sourcing',
      partnerType: 'District',
      assignedState: partner?.assignedState || 'Maharashtra',
      assignedDistrict: distPartDistrict,
      status: 'Pending State', // Starts as pending state level partner verification
      onboardedDoctorsCount: 0,
      onboardedClinicsCount: 0,
      walletBalance: 0,
      createdById: partner?.id
    };

    const savedPartners = localStorage.getItem('ds_partners');
    const list = savedPartners ? JSON.parse(savedPartners) : [];
    list.push({ ...newPartnerObj, password: distPartPassword });
    localStorage.setItem('ds_partners', JSON.stringify(list));
    setPartners(list);

    alert(`District partner registered! Needs verification to escalate to Super Admin for activation.`);
    setDistPartName('');
    setDistPartEmail('');
    setDistPartPhone('');
    setDistPartPassword('');
  };

  const handleReviewPartnerAction = (action: 'approve' | 'reject') => {
    if (!selectedPartnerForReview) return;
    if (!partner) return;
    if (!partnerReviewRemarks.trim()) {
      setPartnerReviewError('Please provide review remarks for the audit log.');
      return;
    }

    let newStatus: string;
    let successMessage: string;

    if (action === 'reject') {
      newStatus = 'Rejected';
      successMessage = `Partner application has been successfully rejected.`;
    } else {
      // Approve action
      if (selectedPartnerForReview.partnerType === 'City') {
        if (partner.partnerType === 'District') {
          // Check if State Partner exists for this state
          const statePartnerExists = partners.some(
            x => x.partnerType === 'State' && 
                 x.assignedState === selectedPartnerForReview.assignedState && 
                 (x.status === 'Approved (Active)' || x.status === 'Approved' || x.status === 'Active')
          );
          newStatus = statePartnerExists ? 'Pending State Partner Verification' : 'Pending Admin Verification';
          successMessage = statePartnerExists 
            ? `Partner application approved and forwarded to State Partner of ${selectedPartnerForReview.assignedState}.`
            : `Partner application approved and forwarded directly to Super Admin (No State Partner assigned).`;
        } else {
          // State Partner is approving, next stage is always Admin
          newStatus = 'Pending Admin Verification';
          successMessage = `Partner application approved and forwarded to Super Admin.`;
        }
      } else {
        // District Partner approved by State Partner
        newStatus = 'Pending Admin Verification';
        successMessage = `Partner application approved and forwarded to Super Admin.`;
      }
    }

    const updated = partners.map(p => {
      if (p.id === selectedPartnerForReview.id) {
        return { ...p, status: newStatus as any };
      }
      return p;
    });

    localStorage.setItem('ds_partners', JSON.stringify(updated));
    setPartners(updated);

    // Record audit log
    const applicantLocation = `${selectedPartnerForReview.assignedCity ? selectedPartnerForReview.assignedCity + ', ' : ''}${selectedPartnerForReview.assignedDistrict ? selectedPartnerForReview.assignedDistrict + ', ' : ''}${selectedPartnerForReview.assignedState}`;
    const auditLogText = `Applicant ID: ${selectedPartnerForReview.id} | Applicant Role: ${selectedPartnerForReview.partnerType} Partner | Location: ${applicantLocation} | Verifier ID: ${partner.id} | Verifier Role: ${partner.partnerType} Partner | Decision: ${action === 'approve' ? 'Approved & Forwarded' : 'Rejected'} | Remarks: "${partnerReviewRemarks}" | Date: ${new Date().toLocaleString()}`;

    addAuditLog(
      `Partner Verification: ${action === 'approve' ? 'Approved & Forwarded' : 'Rejected'}`,
      `${partner.name} (${partner.partnerType} Partner)`,
      auditLogText
    );

    // Trigger notification
    const eventType = action === 'approve' ? 'approval' : 'rejection';
    const notifs = triggerVerificationNotification(
      selectedPartnerForReview,
      eventType,
      partnerReviewRemarks,
      `${partner.name} (${partner.partnerType} Partner)`
    );

    // Update real-time event logs displayed in UI
    setNotificationLog(prev => [...notifs, ...prev]);

    alert(successMessage);
    setSelectedPartnerForReview(null);
    setPartnerReviewRemarks('');
    setPartnerReviewError('');
  };

  const handleVerifyDistrictPartner = (partId: string) => {
    const dp = partners.find(p => p.id === partId);
    const updated = partners.map(p => p.id === partId ? { ...p, status: 'Pending Admin Verification' as any } : p);
    localStorage.setItem('ds_partners', JSON.stringify(updated));
    setPartners(updated);

    // Every verification action must be recorded in the audit log
    addAuditLog(
      'Partner Verification: Approved & Forwarded',
      `${partner.name} (State Level Partner)`,
      `Verified and forwarded district partner ${dp ? dp.name : partId} to Super Admin for activation. Remarks: "Directly verified via State Partner action."`
    );

    alert('District Partner verified! Sent forward to Super Admin for final approval & activation.');
  };

  if (!partner) return null;

  const sidebarCategories = [
    {
      id: 'dashboard',
      label: 'Dashboard & Analytics',
      icon: TrendingUp,
      items: [
        { id: 'overview', label: 'Performance Overview', icon: Target },
        { id: 'earnings', label: 'Earnings & Payouts', icon: Wallet }
      ]
    },
    {
      id: 'onboarding',
      label: 'Clinical Directory',
      icon: Plus,
      items: [
        { id: 'onboard-doctor', label: 'Onboard New Doctor', icon: UserCheck },
        { id: 'onboard-clinic', label: 'Onboard New Clinic', icon: Building2 },
        { id: 'onboard-pharmacy', label: 'Onboard Pharmacy', icon: FileText },
        { id: 'onboard-laboratory', label: 'Onboard Laboratory', icon: ShieldCheck },
        { id: 'onboard-physiotherapy', label: 'Onboard Physiotherapy', icon: Stethoscope }
      ]
    },
    ...(partner.partnerType !== 'City' ? [{
      id: 'compliance',
      label: 'Compliance Hub',
      icon: ShieldCheck,
      items: [
        { id: 'verifications', label: 'Verification Pipeline', icon: CheckCircle }
      ]
    }] : []),
    ...(partner.partnerType === 'State' ? [{
      id: 'network',
      label: 'Territory Network',
      icon: Landmark,
      items: [
        { id: 'district-partners', label: 'District Partners', icon: Users }
      ]
    }] : partner.partnerType === 'District' ? [{
      id: 'network',
      label: 'Territory Network',
      icon: Landmark,
      items: [
        { id: 'city-partners', label: 'City Partners', icon: Users }
      ]
    }] : []),
    {
      id: 'account',
      label: 'Account Settings',
      icon: FileText,
      items: [
        { id: 'profile', label: 'My Profile Details', icon: FileText }
      ]
    }
  ];

  const renderSidebarContent = () => {
    return (
      <div className="flex flex-col gap-6">
        {sidebarCategories.map((category) => {
          const isExpanded = expandedGroups[category.id] !== false;
          const CategoryIcon = category.icon;
          return (
            <div key={category.id} className="flex flex-col border-b border-[#D1E5E5]/30 pb-4 last:border-b-0 last:pb-0">
              {/* Category Header (collapsible toggle) */}
              <button
                onClick={() => toggleGroup(category.id)}
                className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-[#0A6E6E] hover:text-[#0A6E6E] px-2 py-1.5 rounded-lg hover:bg-teal-50/50 transition-colors w-full cursor-pointer mb-1"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-3.5 h-3.5" />
                  <span>{category.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Sub-items list with collapse height transition */}
              <div className={`flex flex-col gap-1 transition-all duration-300 ${isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                {category.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setOnboardSuccess(false);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0A6E6E] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#0A6E6E] hover:bg-slate-50'
                      }`}
                    >
                      <ItemIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="partner-dashboard-container">
      
      {/* Top Welcome Title & Status Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-[#D1E5E5] rounded-2xl p-6 mb-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-teal-50 text-[#0A6E6E] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-[#D1E5E5]/60">
              {partner.partnerType} Level Partner
            </span>
            <span className="text-xs text-gray-400 font-semibold">Territory: {partner.assignedDistrict ? `${partner.assignedDistrict}, ` : ''}{partner.assignedState}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#1A2B3C] font-heading">Welcome, {partner.name}!</h1>
          <p className="text-xs text-gray-500">Manage clinical directory onboarding and track performance commissions instantly.</p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2">
          <button 
            onClick={() => { setView('partner-login'); setView('home'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
          >
            Go Public Site
          </button>
          <button 
            onClick={() => setView('partner-login')}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg cursor-pointer transition-all"
          >
            Logout Portal
          </button>
        </div>
      </div>

      {/* Mobile Navigation Header Bar */}
      <div className="lg:hidden flex justify-between items-center bg-white border border-[#D1E5E5] rounded-2xl px-4 py-3 mb-6 shadow-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 bg-teal-50 text-[#0A6E6E] rounded-xl border border-teal-100"
          >
            <Menu className="w-5 h-5 cursor-pointer" />
          </button>
          <div>
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Currently Viewing</span>
            <span className="text-xs font-black text-slate-800">
              {activeTab === 'overview' && '📊 Performance Overview'}
              {activeTab === 'onboard-doctor' && '🩺 Onboard New Doctor'}
              {activeTab === 'onboard-clinic' && '🏢 Onboard New Clinic'}
              {activeTab === 'verifications' && '🛡️ Verification Pipeline'}
              {activeTab === 'district-partners' && '👥 District Partners'}
              {activeTab === 'profile' && '👤 My Profile Details'}
              {activeTab === 'earnings' && '💸 Earnings & Payouts'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="text-xs font-extrabold bg-[#0A6E6E]/10 text-[#0A6E6E] px-3 py-1.5 rounded-xl border border-[#0A6E6E]/15 hover:bg-[#0A6E6E]/15 transition-all cursor-pointer"
        >
          Menu
        </button>
      </div>

      {/* Local Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="relative w-80 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#0A6E6E] to-[#14B8A6] rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-extrabold text-[#0A6E6E]">Partner Controls</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderSidebarContent()}
            </div>
            
            {/* Footer/Account Area */}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <div className="px-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Logged in partner</span>
                <span className="block text-xs font-bold text-slate-800 truncate">{partner.name}</span>
                <span className="block text-[9px] text-slate-400 mt-0.5">{partner.partnerType} Partner</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMN 1: NEW SIDEBAR NAVIGATION PANEL */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex flex-col gap-6">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-0.5">Partner Workspace</span>
              <span className="text-xs font-bold text-slate-500">Manage directory pipelines</span>
            </div>
            
            {renderSidebarContent()}
          </div>
        </div>

        {/* COLUMN 2: ACTIVE TAB VIEWPORTS & METRICS */}
        <div className="col-span-1 lg:col-span-3">
          
          {/* CORE FINANCIAL WALLET AND PERFORMANCE STATISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            {/* Wallet Balance Card */}
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Wallet Balance</span>
                <span className="text-lg md:text-xl font-black text-emerald-700 font-heading">₹{partnerStats.totalWallet.toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Subscription Earned</span>
              </div>
              <span className="absolute right-3 top-3 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 rounded">Active</span>
            </div>

            {/* Onboarded Doctors */}
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Onboarded Docs</span>
                <span className="text-lg md:text-xl font-black text-[#1A2B3C] font-heading">{partnerStats.doctorsCount} Docs</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Assigned areas</span>
              </div>
            </div>

            {/* Onboarded Clinics */}
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center border border-sky-100">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Clinics</span>
                <span className="text-lg md:text-xl font-black text-[#1A2B3C] font-heading">{partnerStats.clinicsCount} Clinics</span>
                <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Trade verified certificates</span>
              </div>
            </div>

            {/* Territory parameters */}
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F0F7F7] text-[#0A6E6E] rounded-xl flex items-center justify-center border border-[#D1E5E5]">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Active Territory</span>
                <span className="text-sm font-black text-[#0A6E6E] block truncate">{partner.assignedDistrict || 'All Districts'}</span>
                <span className="text-[9px] text-gray-400 block font-semibold">{partner.assignedState} state lock</span>
              </div>
            </div>

          </div>

      {onboardSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-5 mb-6 text-center">
          <span className="text-3xl block mb-2">🎉</span>
          <span className="text-sm font-black block">Onboarding Profile Submitted Successfully!</span>
          <p className="text-xs text-gray-600 mt-1 max-w-lg mx-auto">
            The subscription transaction was recorded, and the verification pipeline is active. 
            The profile has been sent for District & State validation stages prior to Super Admin activation.
          </p>
          <button
            onClick={() => setOnboardSuccess(false)}
            className="mt-3 px-4 py-1.5 bg-[#0A6E6E] text-white text-xs font-bold rounded-md"
          >
            Onboard Another
          </button>
        </div>
      )}

      {/* ==========================================
          TAB 1: PERFORMANCE OVERVIEW
          ========================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ========================================================
              PARTNER PERFORMANCE TARGET & COUNTDOWN REWARD SYSTEM
              ======================================================== */}
          {performance && targetConfig && (
            <div className="bg-white border border-[#D1E5E5] rounded-2xl p-6 shadow-xs overflow-hidden relative" id="partner-performance-tracker-section">
              {/* Header section with Status Badge */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 mb-5 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-teal-50 text-[#0A6E6E] rounded-xl border border-teal-100">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1A2B3C] flex items-center gap-2">
                      DOCT SPARK Partner Target Program
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {targetConfig.countdownDurationDays} Days Challenge
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Onboard providers, generate completed appointments, and qualify for guaranteed basic salary and foreign tours.
                    </p>
                  </div>
                </div>
                
                {/* Achievement Badge Status */}
                <div>
                  {performance.status === 'Eligible for Salary Review' || performance.status === 'Target Achieved' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-xs uppercase tracking-wider">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                      🟢 Target Achieved
                    </span>
                  ) : performance.status === 'Deadline Expired' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-800 font-bold rounded-lg text-xs uppercase tracking-wider">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      🔴 Deadline Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-lg text-xs uppercase tracking-wider">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      🟡 In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* Congratulations Banner / Expired Message */}
              {performance.isEligible && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6 text-center animate-fadeIn relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 text-xl opacity-30 select-none">🏆</div>
                  <span className="text-4xl block mb-2">🎉</span>
                  <h4 className="text-sm md:text-base font-black text-emerald-950 font-heading">
                    {partner.partnerType === 'District' 
                      ? "Congratulations! You have successfully achieved your District Partner Target within 180 days." 
                      : "Congratulations! You have successfully achieved your State Partner Target within 180 days."}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 max-w-xl mx-auto">
                    Your performance verification is 100% complete. You have successfully unlocked all special partner rewards including standard basic salary review, travel allowance, and performance achievement certifications!
                  </p>
                </div>
              )}

              {performance.timeLeftFormatted.expired && !performance.isEligible && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6 text-center">
                  <span className="text-3xl block mb-2">⏳</span>
                  <h4 className="text-sm md:text-base font-black text-red-950">
                    Challenge Deadline Expired
                  </h4>
                  <p className="text-xs text-red-800 mt-1 max-w-xl mx-auto">
                    The {targetConfig.countdownDurationDays}-day target period has elapsed. Please contact the Super Admin or your parent State Partner to request a timeline extension or manual review.
                  </p>
                </div>
              )}

              {/* Grid 1: Live Countdown & Reward List */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                
                {/* Live Countdown Card */}
                <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden border border-slate-800">
                  <div className="absolute -right-4 -bottom-4 opacity-10 text-8xl font-black">{targetConfig.countdownDurationDays}</div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> Live Countdown Timer
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-200 font-bold rounded-md">
                        {targetConfig.countdownDurationDays} Days Limit
                      </span>
                    </div>
                    
                    {/* Countdown Boxes */}
                    <div className="grid grid-cols-4 gap-2 text-center my-2">
                      <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
                        <span className="text-2xl font-black font-mono block text-emerald-400">
                          {String(performance.timeLeftFormatted.days).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold block mt-0.5">Days</span>
                      </div>
                      <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
                        <span className="text-2xl font-black font-mono block text-emerald-400">
                          {String(performance.timeLeftFormatted.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold block mt-0.5">Hours</span>
                      </div>
                      <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
                        <span className="text-2xl font-black font-mono block text-emerald-400">
                          {String(performance.timeLeftFormatted.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold block mt-0.5">Mins</span>
                      </div>
                      <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/50">
                        <span className="text-2xl font-black font-mono block text-emerald-400">
                          {String(performance.timeLeftFormatted.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold block mt-0.5">Secs</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                    <span>Reg Date: <strong>{performance.registrationDateStr}</strong></span>
                    <span>Deadline: <strong>{performance.endDateStr}</strong></span>
                  </div>
                </div>

                {/* Eligibility Rewards Grid */}
                <div className="lg:col-span-7 bg-slate-50 border border-gray-100 rounded-2xl p-5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-3 flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-amber-500" /> Milestone Reward Eligibility Status
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Basic Salary Benefit */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-xs">
                      <div className={`p-2 rounded-lg ${performance.isEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 font-bold block">BASIC SALARY STATUS</span>
                        <span className="text-xs font-black text-gray-800">₹{targetConfig.basicSalaryAmount.toLocaleString()}/Month</span>
                      </div>
                      <div className="text-right">
                        {performance.isEligible ? (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Eligible</span>
                        ) : (
                          <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-semibold">Locked</span>
                        )}
                      </div>
                    </div>

                    {/* Travel Allowance Benefit */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-xs">
                      <div className={`p-2 rounded-lg ${performance.isEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 font-bold block">TRAVEL ALLOWANCE</span>
                        <span className="text-xs font-black text-gray-800">₹{targetConfig.travelAllowanceAmount.toLocaleString()}/Month</span>
                      </div>
                      <div className="text-right">
                        {performance.isEligible ? (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Eligible</span>
                        ) : (
                          <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-semibold">Locked</span>
                        )}
                      </div>
                    </div>

                    {/* International Tour Package */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-xs">
                      <div className={`p-2 rounded-lg ${performance.isEligible && targetConfig.internationalTourEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 font-bold block">INTERNATIONAL TOUR</span>
                        <span className="text-xs font-black text-gray-800">World Package Eligible</span>
                      </div>
                      <div className="text-right">
                        {performance.isEligible && targetConfig.internationalTourEligible ? (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Eligible</span>
                        ) : (
                          <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-semibold">Locked</span>
                        )}
                      </div>
                    </div>

                    {/* Achievement Certificate */}
                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-xs">
                      <div className={`p-2 rounded-lg ${performance.isEligible && targetConfig.achievementCertificateEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 font-bold block">ACHIEVEMENT CERTIFICATE</span>
                        <span className="text-xs font-black text-gray-800">Guaranteed Issuance</span>
                      </div>
                      <div className="text-right">
                        {performance.isEligible && targetConfig.achievementCertificateEnabled ? (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Eligible</span>
                        ) : (
                          <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-semibold">Locked</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Grid 2: Animated Progress Bars */}
              <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5 mb-5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-4 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0A6E6E]" /> Operational Milestone Progress Status
                </span>

                <div className="space-y-4">
                  {/* Onboarding Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1">
                      <span className="flex items-center gap-1.5 text-gray-800">
                        📁 Doctor & Clinic Onboarding Progress
                      </span>
                      <span className="text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-gray-100">
                        {performance.onboardsCount} / {performance.onboardsTarget} Completed ({performance.onboardsProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-600 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${performance.onboardsProgressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Appointments Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1">
                      <span className="flex items-center gap-1.5 text-gray-800">
                        📅 Successful Completed Appointments Progress
                      </span>
                      <span className="text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-gray-100">
                        {performance.appointmentsCount.toLocaleString()} / {performance.appointmentsTarget.toLocaleString()} Completed ({performance.appointmentsProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${performance.appointmentsProgressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Overall Target Progress Bar */}
                  <div className="pt-2 border-t border-gray-200/60">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1">
                      <span className="flex items-center gap-1.5 text-indigo-900 font-extrabold uppercase text-[10px] tracking-wider">
                        ⭐ Overall Challenge Target Completion Index
                      </span>
                      <span className="text-indigo-900 font-black font-mono bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 text-[11px]">
                        {performance.overallProgressPct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden p-0.5 border border-indigo-50">
                      <div 
                        className="bg-gradient-to-r from-teal-500 via-indigo-500 to-indigo-700 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${performance.overallProgressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Developer Sandbox is disabled */}
              <div className="hidden border border-indigo-100 rounded-xl overflow-hidden bg-indigo-50/50 mt-4">
                <details className="group">
                  <summary className="flex justify-between items-center p-3 text-[11px] font-bold text-indigo-950 cursor-pointer hover:bg-indigo-50 select-none">
                    <span className="flex items-center gap-1.5">
                      ⚙️ DEVELOPER SANDBOX: Instant Performance & Timeline Simulator
                    </span>
                    <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  
                  <div className="p-4 border-t border-indigo-100 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    
                    <button
                      onClick={() => {
                        // Add dummy doctors directly to trigger 100% Onboarding Target
                        const docTarget = performance.onboardsTarget;
                        const onboardedCount = performance.onboardsCount;
                        const missing = Math.max(0, docTarget - onboardedCount);
                        
                        if (missing > 0) {
                          const list = [...doctors];
                          for (let i = 0; i < missing; i++) {
                            const id = `doc-sim-${Math.random().toString(36).substring(2, 6)}`;
                            list.push({
                              id,
                              name: `Simulated Provider ${i+1}`,
                              specialty: 'Pediatrics',
                              experience: 8,
                              clinicName: 'Sim Clinic Corp',
                              city: partner.assignedDistrict || 'Mumbai',
                              rating: 4.7,
                              reviewsCount: 12,
                              feeInClinic: 400,
                              feeVideo: 400,
                              nextAvailable: 'Today',
                              photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
                              bio: 'Simulated specialist doctor for program testing.',
                              education: 'MD',
                              registrationNumber: `MCI-${Math.floor(10000 + Math.random() * 90000)}`,
                              availableDays: ['Mon'],
                              timeSlots: ['10:00 AM'],
                              lat: 19.076,
                              lng: 72.877,
                              onboardedBy: partner.id,
                              onboardedByType: partner.partnerType,
                              verificationStatus: 'Approved',
                              state: partner.assignedState,
                              district: partner.assignedDistrict,
                              subscriptionPaid: true
                            });
                          }
                          localStorage.setItem('ds_doctors', JSON.stringify(list));
                          setDoctors(list);
                          alert(`Simulated ${missing} providers added directly to meet Onboarding target!`);
                        } else {
                          alert('Onboarding target is already completed!');
                        }
                      }}
                      className="p-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-extrabold rounded-lg transition-colors cursor-pointer"
                    >
                      🚀 Meet Onboard Target
                    </button>

                    <button
                      onClick={() => {
                        // Add dummy completed appointments to meet target
                        const apptTarget = performance.appointmentsTarget;
                        const currentApptsCount = performance.appointmentsCount;
                        const missing = Math.max(0, apptTarget - currentApptsCount);

                        if (missing > 0) {
                          const list = [...appointments];
                          // Ensure we have at least one doctor onboarded to link appointments to
                          const onboardDocs = doctors.filter(d => d.onboardedBy === partner.id);
                          let docId = 'doc-sim-1';
                          if (onboardDocs.length === 0) {
                            // Onboard a temporary doctor first
                            const tempDoc = {
                              id: docId,
                              name: `Dr. Sandbox Target`,
                              specialty: 'General',
                              experience: 5,
                              clinicName: 'Clinic Sandbox',
                              city: partner.assignedDistrict || 'Mumbai',
                              rating: 4.5,
                              reviewsCount: 5,
                              feeInClinic: 500,
                              feeVideo: 500,
                              nextAvailable: 'Today',
                              photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
                              bio: 'Temporary doctor for sandbox testing',
                              education: 'MBBS',
                              registrationNumber: 'MCI-11111',
                              availableDays: ['Mon'],
                              timeSlots: ['10:00 AM'],
                              lat: 19.076,
                              lng: 72.877,
                              onboardedBy: partner.id,
                              onboardedByType: partner.partnerType,
                              verificationStatus: 'Approved',
                              state: partner.assignedState,
                              district: partner.assignedDistrict,
                              subscriptionPaid: true
                            };
                            const updatedDocs = [...doctors, tempDoc];
                            localStorage.setItem('ds_doctors', JSON.stringify(updatedDocs));
                            setDoctors(updatedDocs);
                          } else {
                            docId = onboardDocs[0].id;
                          }

                          // Bulk push mock completed appointments
                          for (let i = 0; i < missing; i++) {
                            list.push({
                              id: `apt-bulk-${i}-${Math.random().toString(36).substring(2, 5)}`,
                              doctorId: docId,
                              doctorName: 'Sim Doctor',
                              doctorSpecialty: 'General Medicine',
                              doctorPhoto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
                              patientId: 'pat-1',
                              patientName: 'Sandbox Tester',
                              patientAge: 30,
                              patientGender: 'Male',
                              date: '2026-06-25',
                              time: '10:00 AM',
                              type: 'In-Clinic',
                              status: 'Completed',
                              fee: 500
                            });
                          }
                          localStorage.setItem('ds_appointments', JSON.stringify(list));
                          setAppointments(list);
                          alert(`Simulated ${missing} Completed Appointments generated for onboarded providers!`);
                        } else {
                          alert('Appointment target is already completed!');
                        }
                      }}
                      className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold rounded-lg transition-colors cursor-pointer"
                    >
                      📅 Meet Appointment Target
                    </button>

                    <button
                      onClick={() => {
                        const newDateStr = setPartnerRegistrationDate(partner.id, targetConfig.countdownDurationDays - 1);
                        // Force local partner state refresh to pick up new createdAt date
                        const updatedPartner = { ...partner, createdAt: newDateStr };
                        setPartner(updatedPartner);
                        // Save to partners database
                        const updatedPartners = partners.map(p => p.id === partner.id ? updatedPartner : p);
                        localStorage.setItem('ds_partners', JSON.stringify(updatedPartners));
                        setPartners(updatedPartners);
                        alert('Timeline set! Registration date updated to ' + (targetConfig.countdownDurationDays - 1) + ' days ago. Timer shows less than 24 hours remaining.');
                      }}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold rounded-lg transition-colors cursor-pointer"
                    >
                      ⏱️ Set 1 Day Remaining
                    </button>

                    <button
                      onClick={() => {
                        const newDateStr = setPartnerRegistrationDate(partner.id, targetConfig.countdownDurationDays + 2);
                        const updatedPartner = { ...partner, createdAt: newDateStr };
                        setPartner(updatedPartner);
                        const updatedPartners = partners.map(p => p.id === partner.id ? updatedPartner : p);
                        localStorage.setItem('ds_partners', JSON.stringify(updatedPartners));
                        setPartners(updatedPartners);
                        alert('Timeline expired! Registration date set to ' + (targetConfig.countdownDurationDays + 2) + ' days ago.');
                      }}
                      className="p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-extrabold rounded-lg transition-colors cursor-pointer"
                    >
                      ☠️ Simulate Deadline Expiry
                    </button>

                    <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                      <button
                        onClick={() => {
                          const cleanedDocs = doctors.filter(d => !d.id.startsWith('doc-sim-') && d.id !== 'doc-sim-1');
                          const cleanedApts = appointments.filter(a => !a.id.startsWith('apt-bulk-'));
                          
                          const newDateStr = setPartnerRegistrationDate(partner.id, 45);
                          const updatedPartner = { ...partner, createdAt: newDateStr };
                          setPartner(updatedPartner);
                          
                          const updatedPartners = partners.map(p => p.id === partner.id ? updatedPartner : p);
                          localStorage.setItem('ds_partners', JSON.stringify(updatedPartners));
                          setPartners(updatedPartners);

                          const cleanedEligibilities = getRewardEligibilities().filter(e => e.partnerId !== partner.id);
                          localStorage.setItem('ds_reward_eligibilities', JSON.stringify(cleanedEligibilities));

                          localStorage.setItem('ds_doctors', JSON.stringify(cleanedDocs));
                          localStorage.setItem('ds_appointments', JSON.stringify(cleanedApts));
                          
                          setDoctors(cleanedDocs);
                          setAppointments(cleanedApts);
                          
                          alert('All target metrics, timelines, and reward records successfully reset!');
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold rounded-lg transition-colors border border-gray-300 cursor-pointer text-[10px]"
                      >
                        🔄 Reset All Sandbox Metrics
                      </button>
                    </div>

                  </div>
                </details>
              </div>

            </div>
          )}

          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
            <h3 className="text-sm font-black text-[#1A2B3C] mb-4 uppercase tracking-wider">Territory Earnings Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-50 border border-gray-100 rounded-xl p-4">
                <span className="text-xs font-bold text-[#0A6E6E] block mb-2">1. Instant Onboarding Dividends</span>
                <div className="flex justify-between items-center border-b border-gray-200 py-2 text-xs text-gray-600">
                  <span>Commission Rate:</span>
                  <span className="font-extrabold">{partner.partnerType === 'District' ? '40% (₹2,000)' : '20% (₹1,000)'} per signup</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 py-2 text-xs text-gray-600">
                  <span>Total Profiles Onboarded:</span>
                  <span className="font-extrabold">{partnerStats.doctorsCount + partnerStats.clinicsCount} signups</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs font-bold text-gray-800">
                  <span>Total Instant Credited:</span>
                  <span className="text-teal-700">₹{partnerStats.instantEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-gray-100 rounded-xl p-4">
                <span className="text-xs font-bold text-amber-700 block mb-2">2. Monthly Booking Incentive (10% / 5%)</span>
                <div className="flex justify-between items-center border-b border-gray-200 py-2 text-xs text-gray-600">
                  <span>Commission Rate:</span>
                  <span className="font-extrabold">{partner.partnerType === 'District' ? '10%' : '5%'} of consultation fees</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 py-2 text-xs text-gray-600">
                  <span>In-Clinic & Video Traffic:</span>
                  <span className="font-extrabold">Active booking feeds</span>
                </div>
                <div className="flex justify-between items-center py-2 text-xs font-bold text-gray-800">
                  <span>Total Booking Credited:</span>
                  <span className="text-amber-700">₹{partnerStats.monthlyEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          </div>

          {/* List of Onboarded Doctors/Clinics */}
          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
            <h3 className="text-sm font-black text-[#1A2B3C] mb-4 uppercase tracking-wider">My Onboarded Profiles ({partnerStats.doctorsCount + partnerStats.clinicsCount})</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                    <th className="p-3 font-bold text-[#1A2B3C]">Type</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Doctor / Clinic Name</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Specialty / Category</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Contact</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Working Area</th>
                    <th className="p-3 font-bold text-[#1A2B3C]">Verification Pipeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctors.filter(d => d.onboardedBy === partner.id).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-amber-700">🩺 Doctor</td>
                      <td className="p-3 font-extrabold text-[#1A2B3C]">{doc.name}</td>
                      <td className="p-3 font-semibold text-gray-600">{doc.specialty}</td>
                      <td className="p-3 text-gray-500 font-medium">{doc.contactPhone || 'N/A'}</td>
                      <td className="p-3 text-gray-500 font-semibold">{doc.district}, {doc.state}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black ${
                          doc.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          doc.verificationStatus === 'Pending Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {doc.verificationStatus || 'Approved'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {clinics.filter(c => c.onboardedBy === partner.id).map((cl) => (
                    <tr key={cl.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-sky-700">🏢 Clinic</td>
                      <td className="p-3 font-extrabold text-[#1A2B3C]">{cl.name}</td>
                      <td className="p-3 font-semibold text-gray-600">{cl.clinicType || 'Multi-Specialty'}</td>
                      <td className="p-3 text-gray-500 font-medium">{cl.phone || 'N/A'}</td>
                      <td className="p-3 text-gray-500 font-semibold">{cl.district}, {cl.state}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black ${
                          cl.verificationStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          cl.verificationStatus === 'Pending Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {cl.verificationStatus || 'Approved'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {doctors.filter(d => d.onboardedBy === partner.id).length === 0 && clinics.filter(c => c.onboardedBy === partner.id).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400 font-semibold">
                        No medical profiles onboarded yet. Click "Onboard New Doctor/Clinic" tabs above to start.
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
          TAB 1.5: MY PROFILE DETAILS
          ========================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={partner.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'}
                  alt={partner.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#0A6E6E]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="text-base font-black text-[#1A2B3C] font-heading">{partner.name}</h2>
                  <p className="text-xs text-[#0A6E6E] font-bold">{partner.partnerType} Level Partner Profile</p>
                  <p className="text-[10px] text-gray-400">UID: {partner.id}</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 bg-[#F0F7F7] border border-[#D1E5E5] px-4 py-2 rounded-xl text-right">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Status Badge</span>
                <span className="text-xs font-black text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 block mt-1">✓ {partner.status || 'Active'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Personal & Family Details */}
              <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider border-b border-gray-200 pb-2 mb-3">👨‍👩‍👦 Personal & Identity Background</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-400 font-bold">Father / Husband Name:</span>
                  <span className="text-slate-800 font-black">{partner.fatherOrHusbandName || 'Ramesh Kumar (Simulated)'}</span>
                  
                  <span className="text-gray-400 font-bold">Aadhaar Card:</span>
                  <span className="text-slate-800 font-bold">{partner.aadhaarNumber || 'Verified (UIDAI Checked)'}</span>
                  
                  <span className="text-gray-400 font-bold">PAN Card:</span>
                  <span className="text-slate-800 font-bold">{partner.panNumber || 'Verified (NSDL Checked)'}</span>

                  <span className="text-gray-400 font-bold">Voter ID Card:</span>
                  <span className="text-slate-800 font-bold">{partner.voterIdNumber || 'Verified (ECI Checked)'}</span>

                  <span className="text-gray-400 font-bold">Date of Birth:</span>
                  <span className="text-slate-800 font-medium">{partner.dob || '1992-05-14'} (Age: {partner.age || '34'})</span>

                  <span className="text-gray-400 font-bold">Gender:</span>
                  <span className="text-slate-800 font-medium">{partner.gender || 'Male'}</span>

                  <span className="text-gray-400 font-bold">Address:</span>
                  <span className="text-slate-800 font-medium">{partner.address || 'N/A'}</span>
                </div>
              </div>

              {/* Box 2: Emergency & Contact Details */}
              <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider border-b border-gray-200 pb-2 mb-3">📞 Contact & Emergency Parameters</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-400 font-bold">Primary Phone:</span>
                  <span className="text-slate-800 font-black">{partner.phone || 'N/A'}</span>

                  <span className="text-gray-400 font-bold">Alternate Phone:</span>
                  <span className="text-slate-800 font-bold">{partner.alternatePhone || '+91 98230 45678 (Simulated)'}</span>

                  <span className="text-gray-400 font-bold">Email Address:</span>
                  <span className="text-slate-800 font-medium">{partner.email || 'N/A'}</span>

                  <span className="text-gray-400 font-bold">Emergency Contact Person:</span>
                  <span className="text-slate-800 font-bold">{partner.emergencyContactName || 'Sunita Sharma'}</span>

                  <span className="text-gray-400 font-bold">Emergency Phone:</span>
                  <span className="text-slate-800 font-bold text-red-600">{partner.emergencyContactPhone || '+91 99220 12345'}</span>

                  <span className="text-gray-400 font-bold">Assigned Territory:</span>
                  <span className="text-slate-800 font-extrabold text-[#0A6E6E]">{partner.assignedDistrict ? `${partner.assignedDistrict}, ` : ''}{partner.assignedState}</span>
                </div>
              </div>

              {/* Box 3: Vehicle, Mobility & Driving Details */}
              <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider border-b border-gray-200 pb-2 mb-3">🏍️ Vehicle, Mobility & License</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-400 font-bold">Owns Two-Wheeler / Bike:</span>
                  <span className={`font-black ${partner.ownsBike !== false ? 'text-emerald-700' : 'text-red-600'}`}>{partner.ownsBike !== false ? 'Yes' : 'No'}</span>

                  {partner.ownsBike !== false && (
                    <>
                      <span className="text-gray-400 font-bold">Bike Model:</span>
                      <span className="text-slate-800 font-bold">{partner.bikeModel || 'Hero Splendor Plus'}</span>

                      <span className="text-gray-400 font-bold">Bike Registration Number:</span>
                      <span className="text-slate-800 font-bold uppercase font-mono">{partner.bikeRegistrationNumber || 'MH-12-PQ-5678'}</span>

                      <span className="text-gray-400 font-bold">Bike Average Mileage:</span>
                      <span className="text-slate-800 font-semibold">{partner.bikeMileage || '55'} km/liter</span>

                      <span className="text-gray-400 font-bold">Bike Active Insurance:</span>
                      <span className={`font-bold ${partner.hasBikeInsurance !== false ? 'text-emerald-600' : 'text-red-500'}`}>{partner.hasBikeInsurance !== false ? 'Yes' : 'No'}</span>
                    </>
                  )}

                  <span className="text-gray-400 font-bold">Valid Driving License (DL):</span>
                  <span className={`font-black ${partner.hasDrivingLicense !== false ? 'text-emerald-700' : 'text-red-600'}`}>{partner.hasDrivingLicense !== false ? 'Yes' : 'No'}</span>

                  {partner.hasDrivingLicense !== false && (
                    <>
                      <span className="text-gray-400 font-bold">Driving License Number:</span>
                      <span className="text-slate-800 font-bold uppercase font-mono">{partner.drivingLicenseNumber || 'DL-1420110068769'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Box 4: Language & Professional Skills */}
              <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider border-b border-gray-200 pb-2 mb-3">🗣️ Linguistic & Professional Competence</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-gray-400 font-bold">Highest Qualification:</span>
                  <span className="text-slate-800 font-semibold">{partner.qualification || 'Graduate'}</span>

                  <span className="text-gray-400 font-bold">Work Experience:</span>
                  <span className="text-slate-800 font-semibold">{partner.experience || 'N/A'}</span>

                  <span className="text-gray-400 font-bold">Current Occupation:</span>
                  <span className="text-slate-800 font-semibold">{partner.occupation || 'N/A'}</span>

                  <span className="text-gray-400 font-bold">Territory Skills:</span>
                  <span className="text-slate-800 font-medium">{partner.skills || 'N/A'}</span>

                  <span className="text-gray-400 font-bold">Languages (Spoken & Written):</span>
                  <span className="text-[#0A6E6E] font-black">{partner.languagesSpokenWritten || 'English, Hindi, Marathi'}</span>
                </div>
              </div>
            </div>

            {/* Box 5: Self Write-up / Statement of Purpose (500 Words) */}
            <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 mt-6">
              <h3 className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider border-b border-gray-200 pb-2 mb-3">📝 Self Description & Statement of Purpose</h3>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                {partner.aboutPartner500Words || "This partner works dedicatedly to establish and expand the DOCT SPARK digital consultation networks. Over the past few years, we have worked on several medical networking setups. We aim to leverage regional operations, coordinate medical-clinic establishment verifications securely, and handle community awareness loops dynamically to make DOCT SPARK the primary regional healthcare companion."}
              </p>
              <div className="text-[10px] text-gray-400 mt-2 text-right font-bold">
                Word Count: {(partner.aboutPartner500Words || "This partner works dedicatedly to establish and expand the DOCT SPARK digital consultation networks. Over the past few years, we have worked on several medical networking setups. We aim to leverage regional operations, coordinate medical-clinic establishment verifications securely, and handle community awareness loops dynamically to make DOCT SPARK the primary regional healthcare companion.").trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          TAB: EARNINGS & PAYOUTS LEDGER
          ========================================== */}
      {activeTab === 'earnings' && partner && (() => {
        const summary = getPartnerEarningsSummary(partner.id);
        const allCommissions = getCommissionRecords().filter(r => r.districtPartnerId === partner.id || r.statePartnerId === partner.id);
        const myReceipts = getPayoutReceipts().filter(r => r.partnerId === partner.id);
        const config = getCommissionConfig();

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick stats banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Wallet/Accrued Balance */}
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Withdrawable Wallet Balance</span>
                  <span className="text-xl font-black text-[#1A2B3C] font-heading mt-1 block">
                    ₹{summary.approvedComm.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold block mt-1">
                    Next payout: {config.nextPayoutDate} ({config.payoutSchedule})
                  </span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-700">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              {/* Total Payouts Released */}
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Total Disbursed Earnings</span>
                  <span className="text-xl font-black text-emerald-700 font-heading mt-1 block">
                    ₹{summary.paidComm.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                    Deposited directly to bank
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
                  <Landmark className="w-6 h-6" />
                </div>
              </div>

              {/* Total Accrued Earnings */}
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Cumulative Partner Earnings</span>
                  <span className="text-xl font-black text-[#0A6E6E] font-heading mt-1 block">
                    ₹{summary.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                    Pending Validation: ₹{summary.pendingComm.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg text-[#0A6E6E]">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              {/* Network statistics */}
              <div className="bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase block tracking-wider">Active Territory Network</span>
                  <span className="text-sm font-black text-[#1A2B3C] font-heading mt-1 block truncate">
                    {partner.assignedDistrict ? `${partner.assignedDistrict}, ` : ''}{partner.assignedState}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                    Onboarded profiles: {doctors.filter(d => d.onboardedBy === partner.id).length + clinics.filter(c => c.onboardedBy === partner.id).length}
                  </span>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg text-[#0A6E6E]">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* COMMISSION SPLIT TRANSPARENCY CARD */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <span className="text-base">💎</span>
                <div>
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Partner Tier Revenue-Sharing Parameters</h3>
                  <p className="text-[10px] text-gray-400">Your assigned commission split based on the current platform live configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                {/* Rule 1: Registration Subscription fee */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center font-extrabold text-[#1A2B3C]">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-[#0A6E6E]" /> New Sign-up Subscription</span>
                    <span className="text-[#0A6E6E] font-black">₹5,000 Fee</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Charged upon successful verification and activation of any doctor or clinic in your assigned territory.</p>
                  <div className="flex justify-between items-center text-[11px] border-t border-gray-200/60 pt-2 font-bold text-gray-500">
                    <span>District Share: {config.subscriptionDistrictPct}% (₹{(5000 * config.subscriptionDistrictPct / 100).toLocaleString()})</span>
                    <span>State Share: {config.subscriptionStatePct}% (₹{(5000 * config.subscriptionStatePct / 100).toLocaleString()})</span>
                  </div>
                </div>

                {/* Rule 2: Appointment Booking charge */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center font-extrabold text-[#1A2B3C]">
                    <span className="flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-emerald-600" /> Appointment Service Fee</span>
                    <span className="text-emerald-700 font-black">5% Charge</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Deducted from booking totals on the platform. The onboarding District partner and State manager receive active splits.</p>
                  <div className="flex justify-between items-center text-[11px] border-t border-gray-200/60 pt-2 font-bold text-gray-500">
                    <span>District Split: {config.appointmentDistrictPct}% of platform fee</span>
                    <span>State Split: {config.appointmentStatePct}% of platform fee</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PARTNER REVENUE LEDGER LISTING */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">My Commission Revenue Ledger</h3>
                  <p className="text-[10px] text-gray-400">Interactive transaction journal showing complete splits, statuses, and reasons</p>
                </div>

                <button
                  onClick={() => {
                    let csv = 'Transaction ID,Type,Source Profile,Date,Gross Amount,Your Commission,Status,Reversal Reason\n';
                    allCommissions.forEach(r => {
                      const comm = r.districtPartnerId === partner.id ? r.districtPartnerCommission : r.statePartnerCommission;
                      csv += `"${r.id}","${r.type}","${r.sourceName}","${r.date}",${r.amount},${comm},"${r.status}","${r.reversalReason || ''}"\n`;
                    });
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `DoctSpark-Partner-Commissions-${partner.id}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#085C5C] text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-3xs"
                >
                  📥 Download Earnings Statement (CSV)
                </button>
              </div>

              {/* FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-gray-100 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Search Record</label>
                  <input
                    type="text"
                    placeholder="Search doctor, clinic or appointment ID..."
                    value={earnSearch}
                    onChange={(e) => setEarnSearch(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0A6E6E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Earning Stream</label>
                  <select
                    value={earnFilterType}
                    onChange={(e: any) => setEarnFilterType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700"
                  >
                    <option value="All">All Streams</option>
                    <option value="Subscription">First-Year Subscriptions</option>
                    <option value="Appointment">Appointment Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Disbursement Status</label>
                  <select
                    value={earnFilterStatus}
                    onChange={(e: any) => setEarnFilterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#D1E5E5] rounded-lg bg-white text-gray-700"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending Audit</option>
                    <option value="Approved">Approved (In Wallet)</option>
                    <option value="Held">On Hold</option>
                    <option value="Paid">Processed (Settled)</option>
                    <option value="Reversed">Reversed</option>
                  </select>
                </div>
              </div>

              {/* LEDGER TABLE */}
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F0F7F7] border-b border-[#D1E5E5]">
                      <th className="p-3 font-bold text-[#1A2B3C] w-28">Ref ID / Date</th>
                      <th className="p-3 font-bold text-[#1A2B3C]">Revenue Source Profile</th>
                      <th className="p-3 font-bold text-[#1A2B3C] text-right">Gross Transacted</th>
                      <th className="p-3 font-bold text-[#1A2B3C] text-center">My Share Pct</th>
                      <th className="p-3 font-bold text-[#1A2B3C] text-right">My Commission</th>
                      <th className="p-3 font-bold text-[#1A2B3C] text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allCommissions
                      .filter(r => {
                        if (earnSearch.trim()) {
                          const q = earnSearch.toLowerCase();
                          const matchId = r.id.toLowerCase().includes(q);
                          const matchSrc = r.sourceName.toLowerCase().includes(q);
                          if (!matchId && !matchSrc) return false;
                        }

                        if (earnFilterType !== 'All' && r.type !== earnFilterType) return false;
                        if (earnFilterStatus !== 'All' && r.status !== earnFilterStatus) return false;

                        return true;
                      })
                      .map((r) => {
                        const myComm = r.districtPartnerId === partner.id ? r.districtPartnerCommission : r.statePartnerCommission;
                        const myPct = r.districtPartnerId === partner.id ? 
                          (r.type === 'Subscription' ? config.subscriptionDistrictPct : config.appointmentDistrictPct) :
                          (r.type === 'Subscription' ? config.subscriptionStatePct : config.appointmentStatePct);

                        return (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <span className="font-mono text-indigo-700 font-extrabold block">{r.id}</span>
                              <span className="text-[10px] text-gray-400">{r.date}</span>
                            </td>

                            <td className="p-3">
                              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase inline-block mb-1 ${r.type === 'Subscription' ? 'bg-[#F0F7F7] text-[#0A6E6E] border border-teal-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {r.type === 'Subscription' ? 'Registration fee' : 'Appointment commission'}
                              </span>
                              <div className="font-extrabold text-[#1A2B3C]">{r.sourceName}</div>
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-gray-600">
                              ₹{r.amount.toLocaleString()}
                            </td>

                            <td className="p-3 text-center font-extrabold text-gray-500">
                              {myPct}%
                            </td>

                            <td className="p-3 text-right font-mono font-black text-[#0A6E6E]">
                              ₹{myComm.toLocaleString()}
                            </td>

                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                                r.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                r.status === 'Held' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                r.status === 'Paid' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {r.status}
                              </span>
                              {r.reversalReason && (
                                <span className="block text-[8px] text-red-500 font-bold max-w-[100px] mx-auto truncate mt-0.5" title={r.reversalReason}>
                                  {r.reversalReason}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {allCommissions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 font-semibold italic">
                          No commission ledger records found for your account ID. Onboard doctors and book appointments to generate splits.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DISBURSEMENT RECEIPT LOGS */}
            <div className="bg-white border border-[#D1E5E5] rounded-xl p-6 shadow-xs space-y-4">
              <span className="text-xs font-black text-[#1A2B3C] uppercase block tracking-wider border-b border-gray-100 pb-3">My Bank Transfer Receipts</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myReceipts.map((rcpt) => (
                  <div key={rcpt.id} className="p-4 border border-gray-100 rounded-xl bg-slate-50 flex justify-between items-start text-xs hover:border-[#0A6E6E] transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-indigo-700">{rcpt.receiptNumber}</span>
                        <span className="px-1.5 py-0.2 bg-[#F0F7F7] text-[#0A6E6E] rounded text-[8.5px] font-black uppercase">Settled</span>
                      </div>
                      <div className="font-extrabold text-[#1A2B3C]">{rcpt.commissionType} Stream</div>
                      <div className="text-[10px] text-gray-400">Date: {rcpt.date} | Bank Code: HDFC-NEFT-9922</div>
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
Method       : ${rcpt.payoutMethod} (Verified Bank IMPS)
Settled Date : ${rcpt.date}
Transfer Status: SECURE / COMPLETED
--------------------------------------
Thank you for driving Doct Spark digital health healthcare operations!
                          `);
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-gray-700 border border-gray-200 rounded text-[9px] font-black cursor-pointer shadow-3xs"
                      >
                        Download PDF Receipt
                      </button>
                    </div>
                  </div>
                ))}

                {myReceipts.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400 font-semibold italic">
                    No payment disbursements processed for your account yet. Payments are released on-schedule by the company super admin.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}


      {/* ==========================================
          TAB 2: ONBOARD NEW DOCTOR (WITH STEP-BY-STEP VERIFICATIONS)
          ========================================== */}
      {activeTab === 'onboard-doctor' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Doctor Profile</h2>
          <p className="text-xs text-gray-400 mb-6">Subscription fee, identity validation, and detailed settings are pre-integrated into this unified registration profile form</p>
          <DoctorRegister 
            setView={(targetView) => {
              setActiveTab('overview');
              setOnboardSuccess(true);
            }} 
            onSubmitDoctor={handleOnboardDoctorFromRegister}
            predefinedPartner={partner || undefined}
          />
        </div>
      )}

      {false && activeTab === 'onboard-doctor' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Doctor Profile</h2>
          <p className="text-xs text-gray-400 mb-6">Subscription fee and identity proof validation is mandatory before saving</p>

          <div className="grid grid-cols-4 gap-2 mb-6 text-center border-b border-gray-100 pb-4">
            <button 
              type="button"
              onClick={() => setOnboardStep(1)}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 1 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
            >
              1. Doctor Info
            </button>
            <button 
              type="button"
              onClick={() => { if (docName) setOnboardStep(2); }}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 2 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
              disabled={!docName}
            >
              2. Subscription Payment
            </button>
            <button 
              type="button"
              onClick={() => { if (subPaid) setOnboardStep(3); }}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 3 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
              disabled={!subPaid}
            >
              3. OTP Verifications
            </button>
            <button 
              type="button"
              onClick={() => { if (mobileVerified && emailVerified) setOnboardStep(4); }}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 4 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
              disabled={!mobileVerified || !emailVerified}
            >
              4. ID Upload & Submit
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={submitOnboardDoctor} className="space-y-4">
            {onboardStep === 1 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Doctor Credentials & Specialty</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Doctor Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Dr. Ramesh Kumar"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Specialty Category *</label>
                    <select
                      value={docSpecialty}
                      onChange={(e) => setDocSpecialty(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    >
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Orthopedic">Orthopedic</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Practice Experience (Years) *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 10"
                      value={docExperience}
                      onChange={(e) => setDocExperience(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Medical Registration Number (MCI/NMC) *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. MCI-92810"
                      value={docRegNum}
                      onChange={(e) => setDocRegNum(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <span className="text-xs uppercase font-extrabold text-amber-700 tracking-wider block mb-2">Locked Territory Assignment</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5 uppercase font-bold">Assigned State</label>
                      <span className="text-xs font-black text-slate-800">{docState}</span>
                    </div>
                    {partner.partnerType === 'District' ? (
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5 uppercase font-bold">Assigned District</label>
                        <span className="text-xs font-black text-slate-800">{docDistrict}</span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5 uppercase font-bold">State Districts (Unlock)</label>
                        <select 
                          value={docDistrict}
                          onChange={(e) => setDocDistrict(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] px-2 py-1 rounded text-xs font-bold"
                        >
                          {(indiaStatesData.find(s => s.state === partner.assignedState)?.districts || []).map(d => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] text-[#0A6E6E] mb-0.5 uppercase font-extrabold">Operating City *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Pune"
                        value={docCity}
                        onChange={(e) => setDocCity(e.target.value)}
                        className="bg-white border border-[#D1E5E5] px-2 py-1 rounded text-xs font-semibold w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Primary Clinic Association</label>
                    <input 
                      type="text" 
                      placeholder="Spandan Heart Care Clinic"
                      value={docClinicName}
                      onChange={(e) => setDocClinicName(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Local Pincode *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="6-digit pincode"
                      value={docPincode}
                      onChange={(e) => setDocPincode(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Highest Educational Degree</label>
                    <input 
                      type="text" 
                      placeholder="MBBS, MD (Medicine)"
                      value={docEducation}
                      onChange={(e) => setDocEducation(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => { if (docName && docCity) setOnboardStep(2); else setFormError('Please specify Doctor Name and Operating City to proceed.'); }}
                    className="px-5 py-2.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 2 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">1-Year Subscription Charge</span>
                
                <div className="bg-slate-50 border border-[#D1E5E5] rounded-xl p-5 text-center">
                  <span className="text-xs text-gray-500 font-semibold block uppercase">Yearly Corporate Verification Listing Fee</span>
                  <span className="text-3xl font-black text-[#1A2B3C] block mt-1">₹5,000 <span className="text-xs text-gray-400 font-semibold">INR / Year</span></span>
                  <p className="text-[10px] text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    This charge covers digital medical verification, MCI license audit, and verified practitioner search placement.
                  </p>
                </div>

                {!subPaid ? (
                  <div className="border border-dashed border-[#D1E5E5] rounded-xl p-4 bg-amber-50/40">
                    <span className="text-xs font-bold text-slate-700 block mb-3">Select Subscription Payment Option *</span>
                    
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${paymentMethod === 'upi' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        <span>📱</span> UPI / GPay
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${paymentMethod === 'card' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        <CreditCard className="w-4 h-4 text-sky-600" /> Card Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('net')}
                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${paymentMethod === 'net' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        <span>🏦</span> Netbanking
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-xs cursor-pointer"
                    >
                      Process Secure ₹5,000 Payment
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <div>
                        <span className="font-bold block">1-Year Subscription Charge Paid Successfully!</span>
                        <span className="text-[10px] text-gray-500 font-mono">Txn ID: DOCT-SUB-{(Math.random()*1000000).toFixed(0)}</span>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black text-[9px]">PAID</span>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to Info
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (subPaid) setOnboardStep(3); else setFormError('You must clear the 1-Year Subscription charge first.'); }}
                    className="px-5 py-2.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    disabled={!subPaid}
                  >
                    Continue to OTPs <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 3 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Mandatory Contact OTP Verifications</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-gray-200">
                  {/* Mobile OTP */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800">1. Mobile OTP Verification *</label>
                    <div className="flex gap-2">
                      <input 
                        type="tel" 
                        placeholder="Doctor 10-digit mobile number"
                        value={docPhone}
                        onChange={(e) => setDocPhone(e.target.value)}
                        disabled={mobileVerified}
                        className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        disabled={mobileVerified || !docPhone}
                        className="px-3 bg-teal-50 border border-teal-200 hover:border-teal-500 text-teal-800 text-xs font-bold rounded cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        Send OTP
                      </button>
                    </div>

                    {!mobileVerified ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter 4-digit code"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          className="px-3 bg-[#0A6E6E] text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Verify Code
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 p-1.5 rounded text-center border border-emerald-200">✓ Mobile Verification Confirmed</span>
                    )}
                  </div>

                  {/* Email OTP */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800">2. Email OTP Verification *</label>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="Doctor verified email"
                        value={docEmail}
                        onChange={(e) => setDocEmail(e.target.value)}
                        disabled={emailVerified}
                        className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={emailVerified || !docEmail}
                        className="px-3 bg-teal-50 border border-teal-200 hover:border-teal-500 text-teal-800 text-xs font-bold rounded cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        Send OTP
                      </button>
                    </div>

                    {!emailVerified ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter 4-digit code"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          className="px-3 bg-[#0A6E6E] text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Verify Code
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 p-1.5 rounded text-center border border-emerald-200">✓ Email Verification Confirmed</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(2)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (mobileVerified && emailVerified) setOnboardStep(4); else setFormError('You must complete BOTH Mobile and Email OTP verifications first.'); }}
                    className="px-5 py-2.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    disabled={!mobileVerified || !emailVerified}
                  >
                    Continue to ID Upload <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 4 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">ID Proof & Submission Review</span>
                
                {/* ID Proof upload preset buttons */}
                <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-slate-50/50">
                  <label className="block text-xs font-bold text-slate-800 mb-1">Owner / Manager Identity Proof Document *</label>
                  <p className="text-[9px] text-gray-400 mb-3">Attach official identification (Aadhaar Card, PAN Card, or Indian Passport)</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Aadhaar_Card_Copy.pdf', 'PAN_Card_Copy.pdf', 'Indian_Passport.pdf'].map((docNameStr) => {
                      const isSelected = idProofUploaded === docNameStr;
                      return (
                        <button
                          key={docNameStr}
                          type="button"
                          onClick={() => setIdProofUploaded(docNameStr)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                          {docNameStr} {isSelected ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>

                  <div 
                    onClick={() => {
                      setIdProofUploaded('Owner_ID_Verified.pdf');
                      alert('Simulated drag-and-drop ID proof file attachment!');
                    }}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-[#F0F7F7] hover:border-[#0A6E6E] cursor-pointer transition-all"
                  >
                    <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-gray-600 block">Drag & Drop ID Proof Here</span>
                    <span className="text-[8px] text-gray-400">or click to upload from local machine (PDF, PNG up to 10MB)</span>
                  </div>

                  {idProofUploaded ? (
                    <div className="bg-[#F0F7F7] border border-[#D1E5E5]/60 rounded-lg px-3 py-2 mt-2 text-[10px] text-teal-800 font-extrabold flex justify-between items-center">
                      <span>📎 {idProofUploaded}</span>
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px]">Ready to Submit</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-red-500 font-bold block mt-1">⚠️ Owner ID document is mandatory for verification.</span>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(3)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to OTPs
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    Onboard & Submit Profile <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ==========================================
          TAB 3: ONBOARD NEW CLINIC (WITH STEP-BY-STEP VERIFICATIONS)
          ========================================== */}
      {activeTab === 'onboard-clinic' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Clinic profile</h2>
          <p className="text-xs text-gray-400 mb-6">Subscription payment, contact OTPs, owner ID proof, and trade license are mandatory</p>
          <ClinicRegister 
            setView={(targetView) => {
              setActiveTab('overview');
              setOnboardSuccess(true);
            }}
            setUserRole={() => {}}
            setUserEmail={() => {}}
            onAddClinic={handleOnboardClinicFromRegister}
            predefinedPartner={partner || undefined}
          />
        </div>
      )}

      {activeTab === 'onboard-pharmacy' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Pharmacy Profile</h2>
          <p className="text-xs text-gray-400 mb-6">Drug license validation, contact OTPs, owner ID proof, and ₹5,000 subscription setup are mandatory</p>
          <PharmacyRegister 
            setView={(targetView) => {
              setActiveTab('overview');
              setOnboardSuccess(true);
            }}
            onAddPharmacy={(newPharm) => {
              const savedPharmacies = localStorage.getItem('ds_pharmacies');
              const pharmList = savedPharmacies ? JSON.parse(savedPharmacies) : [];
              const exists = pharmList.some((p: any) => p.id === newPharm.id);
              if (!exists) {
                pharmList.push(newPharm);
                localStorage.setItem('ds_pharmacies', JSON.stringify(pharmList));
              }
            }}
            predefinedPartner={partner || undefined}
          />
        </div>
      )}

      {activeTab === 'onboard-laboratory' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Laboratory Profile</h2>
          <p className="text-xs text-gray-400 mb-6">NABL certificate validation, contact OTPs, owner ID proof, and ₹5,000 subscription setup are mandatory</p>
          <LaboratoryRegister 
            setView={(targetView) => {
              setActiveTab('overview');
              setOnboardSuccess(true);
            }}
            onAddLaboratory={(newLab) => {
              const savedLabs = localStorage.getItem('ds_laboratories');
              const labList = savedLabs ? JSON.parse(savedLabs) : [];
              const exists = labList.some((p: any) => p.id === newLab.id);
              if (!exists) {
                labList.push(newLab);
                localStorage.setItem('ds_laboratories', JSON.stringify(labList));
              }
            }}
            predefinedPartner={partner || undefined}
          />
        </div>
      )}

      {activeTab === 'onboard-physiotherapy' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Physiotherapy Profile</h2>
          <p className="text-xs text-gray-400 mb-6">IAP degree validation, specialty settings, contact OTPs, and ₹5,000 subscription setup are mandatory</p>
          <PhysiotherapyRegister 
            setView={(targetView) => {
              setActiveTab('overview');
              setOnboardSuccess(true);
            }}
            onAddPhysiotherapy={(newPhysio) => {
              const savedPhysios = localStorage.getItem('ds_physiotherapists');
              const physioList = savedPhysios ? JSON.parse(savedPhysios) : [];
              const exists = physioList.some((p: any) => p.id === newPhysio.id);
              if (!exists) {
                physioList.push(newPhysio);
                localStorage.setItem('ds_physiotherapists', JSON.stringify(physioList));
              }
            }}
            predefinedPartner={partner || undefined}
          />
        </div>
      )}

      {false && activeTab === 'onboard-clinic' && !onboardSuccess && (
        <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
          <h2 className="text-base font-black text-[#1A2B3C] mb-1 font-heading">Onboard Clinic profile</h2>
          <p className="text-xs text-gray-400 mb-6">Subscription payment, contact OTPs, owner ID proof, and trade license are mandatory</p>

          <div className="grid grid-cols-4 gap-2 mb-6 text-center border-b border-gray-100 pb-4">
            <button 
              type="button"
              onClick={() => setOnboardStep(1)}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 1 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
            >
              1. Clinic Details
            </button>
            <button 
              type="button"
              onClick={() => { if (clinicNameInput) setOnboardStep(2); }}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 2 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
              disabled={!clinicNameInput}
            >
              2. Subscription Payment
            </button>
            <button 
              type="button"
              onClick={() => { if (subPaid) setOnboardStep(3); }}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 3 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
              disabled={!subPaid}
            >
              3. OTP Verifications
            </button>
            <button 
              type="button"
              onClick={() => { if (mobileVerified && emailVerified) setOnboardStep(4); }}
              className={`py-2 text-[10px] font-black rounded-lg ${onboardStep === 4 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-500'}`}
              disabled={!mobileVerified || !emailVerified}
            >
              4. Documents & Submit
            </button>
          </div>

          {formError && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={submitOnboardClinic} className="space-y-4">
            {onboardStep === 1 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Clinic & Business Information</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Clinic / Hospital Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Spandan Healthcare"
                      value={clinicNameInput}
                      onChange={(e) => setClinicNameInput(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Clinic Type *</label>
                    <select
                      value={clinicType}
                      onChange={(e) => setClinicType(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    >
                      <option value="Multi-Specialty">Multi-Specialty Hospital</option>
                      <option value="Cardiology Center">Cardiology Center</option>
                      <option value="Dental Clinic">Dental Clinic</option>
                      <option value="Eye Care Center">Eye Care Center</option>
                      <option value="General Diagnostics">General Diagnostics</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Owner / Manager Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Mr. Aditya Deshmukh"
                      value={clinicOwner}
                      onChange={(e) => setClinicOwner(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Business Trade License Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. TRD-MUM-92810"
                      value={clinicTradeLicense}
                      onChange={(e) => setClinicTradeLicense(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <span className="text-xs uppercase font-extrabold text-amber-700 tracking-wider block mb-2">Locked Territory Assignment</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5 uppercase font-bold">Assigned State</label>
                      <span className="text-xs font-black text-slate-800">{clinicStateInput}</span>
                    </div>
                    {partner.partnerType === 'District' ? (
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5 uppercase font-bold">Assigned District</label>
                        <span className="text-xs font-black text-slate-800">{clinicDistrictInput}</span>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-0.5 uppercase font-bold">State Districts (Unlock)</label>
                        <select 
                          value={clinicDistrictInput}
                          onChange={(e) => setClinicDistrictInput(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] px-2 py-1 rounded text-xs font-bold"
                        >
                          {(indiaStatesData.find(s => s.state === partner.assignedState)?.districts || []).map(d => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] text-[#0A6E6E] mb-0.5 uppercase font-extrabold">Operating City *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Pune"
                        value={clinicCity}
                        onChange={(e) => setClinicCity(e.target.value)}
                        className="bg-white border border-[#D1E5E5] px-2 py-1 rounded text-xs font-semibold w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Street Address *</label>
                  <textarea 
                    required
                    placeholder="Enter full physical address of the clinic"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold h-16"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Clinic Local Pincode *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="6-digit pincode"
                      value={clinicPincode}
                      onChange={(e) => setClinicPincode(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => { if (clinicNameInput && clinicCity) setOnboardStep(2); else setFormError('Please specify Clinic Name and Operating City to proceed.'); }}
                    className="px-5 py-2.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 2 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">1-Year Subscription Charge</span>
                
                <div className="bg-slate-50 border border-[#D1E5E5] rounded-xl p-5 text-center">
                  <span className="text-xs text-gray-500 font-semibold block uppercase">Yearly Clinical Verification Listing Fee</span>
                  <span className="text-3xl font-black text-[#1A2B3C] block mt-1">₹5,000 <span className="text-xs text-gray-400 font-semibold">INR / Year</span></span>
                  <p className="text-[10px] text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    This fee covers physical trade document verification, fire safety check, and premium clinic search placement.
                  </p>
                </div>

                {!subPaid ? (
                  <div className="border border-dashed border-[#D1E5E5] rounded-xl p-4 bg-amber-50/40">
                    <span className="text-xs font-bold text-slate-700 block mb-3">Select Subscription Payment Option *</span>
                    
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${paymentMethod === 'upi' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        <span>📱</span> UPI / GPay
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${paymentMethod === 'card' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        <CreditCard className="w-4 h-4 text-sky-600" /> Card Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('net')}
                        className={`p-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${paymentMethod === 'net' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        <span>🏦</span> Netbanking
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-xs cursor-pointer"
                    >
                      Process Secure ₹5,000 Payment
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      <div>
                        <span className="font-bold block">1-Year Subscription Charge Paid Successfully!</span>
                        <span className="text-[10px] text-gray-500 font-mono">Txn ID: DOCT-SUB-{(Math.random()*1000000).toFixed(0)}</span>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black text-[9px]">PAID</span>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to Info
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (subPaid) setOnboardStep(3); else setFormError('You must clear the 1-Year Subscription charge first.'); }}
                    className="px-5 py-2.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    disabled={!subPaid}
                  >
                    Continue to OTPs <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 3 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Mandatory Contact OTP Verifications</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-gray-200">
                  {/* Mobile OTP */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800">1. Mobile OTP Verification *</label>
                    <div className="flex gap-2">
                      <input 
                        type="tel" 
                        placeholder="Clinic 10-digit phone"
                        value={clinicPhone}
                        onChange={(e) => setClinicPhone(e.target.value)}
                        disabled={mobileVerified}
                        className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        disabled={mobileVerified || !clinicPhone}
                        className="px-3 bg-teal-50 border border-teal-200 hover:border-teal-500 text-teal-800 text-xs font-bold rounded cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        Send OTP
                      </button>
                    </div>

                    {!mobileVerified ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter 4-digit code"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          className="px-3 bg-[#0A6E6E] text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Verify Code
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 p-1.5 rounded text-center border border-emerald-200">✓ Mobile Verification Confirmed</span>
                    )}
                  </div>

                  {/* Email OTP */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800">2. Email OTP Verification *</label>
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="Clinic business email"
                        value={clinicEmail}
                        onChange={(e) => setClinicEmail(e.target.value)}
                        disabled={emailVerified}
                        className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={emailVerified || !clinicEmail}
                        className="px-3 bg-teal-50 border border-teal-200 hover:border-teal-500 text-teal-800 text-xs font-bold rounded cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        Send OTP
                      </button>
                    </div>

                    {!emailVerified ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Enter 4-digit code"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          className="px-3 bg-[#0A6E6E] text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Verify Code
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 p-1.5 rounded text-center border border-emerald-200">✓ Email Verification Confirmed</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(2)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (mobileVerified && emailVerified) setOnboardStep(4); else setFormError('You must complete BOTH Mobile and Email OTP verifications first.'); }}
                    className="px-5 py-2.5 bg-[#0A6E6E] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    disabled={!mobileVerified || !emailVerified}
                  >
                    Continue to Document Upload <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 4 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">ID Proof & Business Verification Uploads</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Identity Proof upload (Owner / Manager) */}
                  <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-800 mb-1">1. Owner / Manager ID Proof *</label>
                    <p className="text-[9px] text-gray-400 mb-2">Attach verified identification document</p>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Aadhaar_Owner.pdf', 'Passport_Owner.pdf'].map((docNameStr) => (
                        <button
                          key={docNameStr}
                          type="button"
                          onClick={() => setIdProofUploaded(docNameStr)}
                          className={`px-2 py-1 rounded text-[9px] font-black border cursor-pointer ${idProofUploaded === docNameStr ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                          {docNameStr}
                        </button>
                      ))}
                    </div>

                    <div 
                      onClick={() => setIdProofUploaded('Simulated_Owner_ID.pdf')}
                      className="border border-dashed border-gray-300 rounded p-3 text-center text-[10px] text-gray-500 hover:bg-[#F0F7F7] cursor-pointer"
                    >
                      Click to simulate Drag & Drop ID Proof
                    </div>
                    {idProofUploaded && <span className="text-[9px] text-emerald-600 font-extrabold mt-1 block">✓ Attached: {idProofUploaded}</span>}
                  </div>

                  {/* 2. Trade License Certificate upload */}
                  <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-800 mb-1">2. Business Trade License *</label>
                    <p className="text-[9px] text-gray-400 mb-2">Attach official business Trade Certificate</p>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Trade_License_Certificate.pdf', 'Clinical_Establishment_Act.pdf'].map((docNameStr) => (
                        <button
                          key={docNameStr}
                          type="button"
                          onClick={() => setLicenseUploaded(docNameStr)}
                          className={`px-2 py-1 rounded text-[9px] font-black border cursor-pointer ${licenseUploaded === docNameStr ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                          {docNameStr}
                        </button>
                      ))}
                    </div>

                    <div 
                      onClick={() => setLicenseUploaded('Simulated_Trade_License.pdf')}
                      className="border border-dashed border-gray-300 rounded p-3 text-center text-[10px] text-gray-500 hover:bg-[#F0F7F7] cursor-pointer"
                    >
                      Click to simulate Drag & Drop License
                    </div>
                    {licenseUploaded && <span className="text-[9px] text-emerald-600 font-extrabold mt-1 block">✓ Attached: {licenseUploaded}</span>}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(3)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Back to OTPs
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    Onboard & Submit Clinic <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}


      {/* ==========================================
          TAB 4: PIPELINE VERIFICATIONS LISTING (DISTRICT/STATE CONTROLLERS)
          ========================================== */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          {notificationLog.length > 0 && (
            <div className="bg-slate-900 text-emerald-400 font-mono rounded-xl p-4 text-[10px] space-y-1 shadow max-h-36 overflow-y-auto animate-fadeIn border border-slate-800">
              <div className="font-extrabold uppercase text-gray-400 border-b border-gray-800 pb-1.5 mb-1.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5">📢 Real-Time Automated Event Notification Logs</span>
                <button onClick={() => setNotificationLog([])} className="text-red-400 hover:underline font-bold cursor-pointer">Clear Logs</button>
              </div>
              {notificationLog.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white border border-[#D1E5E5] rounded-xl p-6">
            <h2 className="text-sm font-black text-[#1A2B3C] uppercase tracking-wider mb-1">Awaiting Action Pipeline</h2>
            <p className="text-xs text-gray-400 mb-4">Validate trade papers, identity proof documents, and forward to next hierarchy</p>

            {partner.partnerType === 'District' ? (
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-teal-800 block">District Stage Pending Profiles (Locked to {partner.assignedDistrict})</span>
                
                <div className="space-y-3">
                  {/* List Doctors pending district verification in our district */}
                  {doctors.filter(d => d.district === partner.assignedDistrict && d.verificationStatus === 'Pending District').map(doc => (
                    <div key={doc.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-amber-700 uppercase block">🩺 Doctor Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{doc.name}</h4>
                        <p className="text-gray-400">Specialty: {doc.specialty} | Reg: {doc.registrationNumber}</p>
                        <p className="text-gray-400 mt-1">ID Proof Doc: <span className="font-mono text-indigo-700">{doc.ownerIdProofDoc || 'Owner_ID.pdf'}</span></p>
                      </div>
                      <button
                        onClick={() => setSelectedDocForReview(doc)}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        View & Verify ➔
                      </button>
                    </div>
                  ))}

                  {/* List Clinics pending district verification in our district */}
                  {clinics.filter(c => c.district === partner.assignedDistrict && c.verificationStatus === 'Pending District').map(cl => (
                    <div key={cl.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-sky-700 uppercase block">🏢 Clinic Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{cl.name}</h4>
                        <p className="text-gray-400">Trade License: {cl.tradeLicenseNumber} | City: {cl.city}</p>
                        <p className="text-gray-400 mt-1">ID Proof: <span className="font-mono text-indigo-700">{cl.ownerIdProofDoc || 'Owner_ID.pdf'}</span></p>
                      </div>
                      <button
                        onClick={() => handleVerifyRequest(cl.id, 'clinic', 'Pending State')}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        Verify & Forward ➔
                      </button>
                    </div>
                  ))}

                  {/* List Laboratories pending district verification in our district */}
                  {laboratories.filter(l => l.district === partner.assignedDistrict && l.status === 'Pending District').map(lab => (
                    <div key={lab.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-rose-700 uppercase block">🧪 Laboratory Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{lab.name}</h4>
                        <p className="text-gray-400">Owner Name: {lab.ownerName} | NABL License: {lab.licenseNumber}</p>
                        <p className="text-gray-400 mt-1">ID Proof Doc: <span className="font-mono text-indigo-700">{lab.ownerIdProofDoc || 'Owner_ID.pdf'}</span></p>
                      </div>
                      <button
                        onClick={() => handleVerifyRequest(lab.id, 'laboratory', 'Pending State')}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        Verify & Forward ➔
                      </button>
                    </div>
                  ))}

                  {/* List City Partners awaiting District approval */}
                  {partners.filter(p => p.partnerType === 'City' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState && getPartnerVerificationStage(p, partners) === 'District').map(p => (
                    <div key={p.id} className="border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50/50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-indigo-700 uppercase block">👥 City Partner Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{p.name}</h4>
                        <p className="text-gray-400">Email: {p.email} | Phone: +91 {p.phone}</p>
                        <p className="text-gray-400">Assigned City: <span className="font-bold text-slate-700">{p.assignedCity}</span></p>
                        <p className="text-gray-400 mt-1">KYC Docs: PAN: <span className="font-mono font-bold text-slate-700">{p.panNumber}</span> | Aadhaar: <span className="font-mono font-bold text-slate-700">{p.aadhaarNumber}</span></p>
                      </div>
                      <button
                        onClick={() => setSelectedPartnerForReview(p)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        Review & Verify ➔
                      </button>
                    </div>
                  ))}

                  {doctors.filter(d => d.district === partner.assignedDistrict && d.verificationStatus === 'Pending District').length === 0 &&
                   clinics.filter(c => c.district === partner.assignedDistrict && c.verificationStatus === 'Pending District').length === 0 &&
                   laboratories.filter(l => l.district === partner.assignedDistrict && l.status === 'Pending District').length === 0 &&
                   partners.filter(p => p.partnerType === 'City' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState && getPartnerVerificationStage(p, partners) === 'District').length === 0 && (
                     <div className="text-center p-8 text-gray-400 font-semibold bg-slate-50 rounded-xl">
                       No medical, laboratory, or partner applications currently awaiting District verification in {partner.assignedDistrict}.
                     </div>
                  )}
                </div>
              </div>
            ) : (
              // State Level Partner Pipeline Verifications
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-teal-800 block">State Stage Pending Profiles (Locked to {partner.assignedState})</span>
                
                <div className="space-y-3">
                  {/* List Doctors pending State verification in our State */}
                  {doctors.filter(d => d.state === partner.assignedState && d.verificationStatus === 'Pending State').map(doc => (
                    <div key={doc.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-amber-700 uppercase block">🩺 Doctor Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{doc.name}</h4>
                        <p className="text-gray-400">Specialty: {doc.specialty} | District: {doc.district}</p>
                        <p className="text-gray-400 mt-1">ID Proof: <span className="font-mono text-indigo-700">{doc.ownerIdProofDoc || 'Owner_ID.pdf'}</span></p>
                      </div>
                      <button
                        onClick={() => setSelectedDocForReview(doc)}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        View & Verify ➔
                      </button>
                    </div>
                  ))}

                  {/* List Clinics pending State verification in our State */}
                  {clinics.filter(c => c.state === partner.assignedState && c.verificationStatus === 'Pending State').map(cl => (
                    <div key={cl.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-sky-700 uppercase block">🏢 Clinic Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{cl.name}</h4>
                        <p className="text-gray-400">Trade License: {cl.tradeLicenseNumber} | District: {cl.district}</p>
                        <p className="text-gray-400 mt-1">ID Proof: <span className="font-mono text-indigo-700">{cl.ownerIdProofDoc || 'Owner_ID.pdf'}</span></p>
                      </div>
                      <button
                        onClick={() => handleVerifyRequest(cl.id, 'clinic', 'Pending Admin')}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        Approve & Forward to Super Admin ➔
                      </button>
                    </div>
                  ))}

                  {/* List Laboratories pending State verification in our State */}
                  {laboratories.filter(l => l.state === partner.assignedState && l.status === 'Pending State').map(lab => (
                    <div key={lab.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-rose-700 uppercase block">🧪 Laboratory Verification</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{lab.name}</h4>
                        <p className="text-gray-400">Owner Name: {lab.ownerName} | District: {lab.district}</p>
                        <p className="text-gray-400 mt-1">ID Proof: <span className="font-mono text-indigo-700">{lab.ownerIdProofDoc || 'Owner_ID.pdf'}</span></p>
                      </div>
                      <button
                        onClick={() => handleVerifyRequest(lab.id, 'laboratory', 'Pending Admin')}
                        className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        Approve & Forward to Super Admin ➔
                      </button>
                    </div>
                  ))}

                  {/* List Lower-Level Partners pending State verification in our State */}
                  {partners.filter(p => p.assignedState === partner.assignedState && getPartnerVerificationStage(p, partners) === 'State').map(p => (
                    <div key={p.id} className="border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50/50 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black text-indigo-700 uppercase block">👥 {p.partnerType} Partner Verification (State Stage)</span>
                        <h4 className="font-extrabold text-sm text-[#1A2B3C]">{p.name}</h4>
                        <p className="text-gray-400">Email: {p.email} | Phone: +91 {p.phone}</p>
                        <p className="text-gray-400">Territory: {p.assignedCity ? `${p.assignedCity}, ` : ''}{p.assignedDistrict ? `${p.assignedDistrict}, ` : ''}{p.assignedState}</p>
                        <p className="text-gray-400 mt-1">KYC Docs: PAN: <span className="font-mono font-bold text-slate-700">{p.panNumber}</span> | Aadhaar: <span className="font-mono font-bold text-slate-700">{p.aadhaarNumber}</span></p>
                      </div>
                      <button
                        onClick={() => setSelectedPartnerForReview(p)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer text-xs"
                      >
                        Review & Verify ➔
                      </button>
                    </div>
                  ))}

                  {doctors.filter(d => d.state === partner.assignedState && d.verificationStatus === 'Pending State').length === 0 &&
                   clinics.filter(c => c.state === partner.assignedState && c.verificationStatus === 'Pending State').length === 0 &&
                   laboratories.filter(l => l.state === partner.assignedState && l.status === 'Pending State').length === 0 &&
                   partners.filter(p => p.assignedState === partner.assignedState && getPartnerVerificationStage(p, partners) === 'State').length === 0 && (
                     <div className="text-center p-8 text-gray-400 font-semibold bg-slate-50 rounded-xl">
                       No medical, laboratory, or partner applications currently awaiting State verification in {partner.assignedState}.
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ==========================================
          TAB 5: MANAGE DISTRICT PARTNERS (STATE PARTNERS ONLY)
          ========================================== */}
      {activeTab === 'district-partners' && partner.partnerType === 'State' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create District Partner Form */}
          <div className="col-span-1 bg-[#F9FBFC] border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-teal-50 text-[#0A6E6E] rounded-xl flex items-center justify-center border border-teal-100 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Onboard District Partner</span>
              <h3 className="text-sm font-black text-[#1A2B3C] font-heading mb-2">District Profile Creator Wizard</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                Launch the complete, official multi-step onboarding system to register a District franchise controller under your assigned state (<strong>{partner.assignedState}</strong>). This registers them with security OTP validation, complete KYC documents, bike and vehicle credentials, alternate contacts, and custom territory lockouts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPartnerModal(true)}
              className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs py-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs animate-pulse"
            >
              🤝 Launch Full Onboarding Wizard
            </button>
          </div>

          {/* List of District Partners under this state */}
          <div className="col-span-2 bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs">
            <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">My District Franchise Partners</span>
            <p className="text-[10px] text-gray-400 mb-4">Verification and status of district partners in {partner.assignedState}</p>

            <div className="space-y-3.5">
              {partners.filter(p => p.partnerType === 'District' && p.assignedState === partner.assignedState).map((dp) => (
                <div key={dp.id} className="border border-gray-100 rounded-xl p-4 bg-slate-50 flex justify-between items-center text-xs gap-3">
                  <div>
                    <h4 className="font-extrabold text-[#1A2B3C] text-sm">{dp.name}</h4>
                    <p className="text-gray-400 font-medium">District Lock: <span className="font-bold text-gray-700">{dp.assignedDistrict}</span></p>
                    <p className="text-gray-400 font-medium">Email: {dp.email} | Mobile: {dp.phone}</p>
                    <p className="text-[10px] text-gray-500 font-semibold mt-1">
                      Status: <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                        dp.status === 'Approved' || dp.status === 'Approved (Active)' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : dp.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>{dp.status}</span>
                    </p>
                  </div>
                  
                  {(dp.status === 'Pending State' || dp.status === 'Pending State Partner Verification') && (
                    <button
                      onClick={() => {
                        setSelectedPartnerForReview(dp);
                        setPartnerReviewRemarks('');
                        setPartnerReviewError('');
                      }}
                      className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      View & Verify ➔
                    </button>
                  )}
                </div>
              ))}

              {partners.filter(p => p.partnerType === 'District' && p.assignedState === partner.assignedState).length === 0 && (
                <div className="text-center p-8 text-gray-400 font-semibold">
                  No district partners have been registered under your state franchise. Use the form to onboard one.
                </div>
              )}
            </div>
          </div>

          {showAddPartnerModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-[90vh] overflow-y-auto p-1 text-left">
                <button 
                  onClick={() => setShowAddPartnerModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
                >
                  ✕
                </button>
                <div className="p-2">
                  <PartnerRegister 
                    setView={(v) => {
                      if (v === 'close-modal' || v === 'partner-login') {
                        setShowAddPartnerModal(false);
                        // Reload database of partners
                        const savedPartners = localStorage.getItem('ds_partners');
                        if (savedPartners) {
                          setPartners(JSON.parse(savedPartners));
                        }
                      }
                    }}
                    creatorType="StatePartner"
                    creatorState={partner.assignedState}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}


      {/* ==========================================
          TAB 5.5: MANAGE CITY PARTNERS (DISTRICT PARTNERS ONLY)
          ========================================== */}
      {activeTab === 'city-partners' && partner.partnerType === 'District' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create City Partner Form */}
          <div className="col-span-1 bg-[#F9FBFC] border border-[#D1E5E5] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-teal-50 text-[#0A6E6E] rounded-xl flex items-center justify-center border border-teal-100 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Onboard City Partner</span>
              <h3 className="text-sm font-black text-[#1A2B3C] font-heading mb-2">City Partner Creator Wizard</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                Launch the official multi-step onboarding system to register a City franchise partner under your assigned district (<strong>{partner.assignedDistrict}</strong>, {partner.assignedState}). City Partners can onboard clinical, diagnostic, and pharmacy facilities locally under your network.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPartnerModal(true)}
              className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs py-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs animate-pulse"
            >
              🤝 Launch City Onboarding Wizard
            </button>
          </div>

          {/* List of City Partners under this district */}
          <div className="col-span-2 bg-white border border-[#D1E5E5] rounded-xl p-5 shadow-xs">
            <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">My City Franchise Partners</span>
            <p className="text-[10px] text-gray-400 mb-4">Verification and status of city partners in district: {partner.assignedDistrict}</p>

            <div className="space-y-3.5">
              {partners.filter(p => p.partnerType === 'City' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState).map((cp) => (
                <div key={cp.id} className="border border-gray-100 rounded-xl p-4 bg-slate-50 flex justify-between items-center text-xs gap-3">
                  <div>
                    <h4 className="font-extrabold text-[#1A2B3C] text-sm">{cp.name}</h4>
                    <p className="text-gray-400 font-medium">City Assigned: <span className="font-bold text-gray-700">{cp.assignedCity || cp.assignedDistrict}</span></p>
                    <p className="text-gray-400 font-medium">Email: {cp.email} | Mobile: {cp.phone}</p>
                    <p className="text-[10px] text-gray-500 font-semibold mt-1">
                      Status: <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                        cp.status === 'Approved' || cp.status === 'Approved (Active)' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : cp.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>{cp.status}</span>
                    </p>
                  </div>
                  
                  {(cp.status === 'Pending State' || cp.status === 'Pending State Partner Verification') && (
                    <button
                      onClick={() => {
                        setSelectedPartnerForReview(cp);
                        setPartnerReviewRemarks('');
                        setPartnerReviewError('');
                      }}
                      className="px-3 py-1.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      View & Verify ➔
                    </button>
                  )}
                </div>
              ))}

              {partners.filter(p => p.partnerType === 'City' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState).length === 0 && (
                <div className="text-center p-8 text-gray-400 font-semibold">
                  No city partners have been registered under your district franchise. Use the form to onboard one.
                </div>
              )}
            </div>
          </div>

          {showAddPartnerModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-[90vh] overflow-y-auto p-1 text-left">
                <button 
                  onClick={() => setShowAddPartnerModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
                >
                  ✕
                </button>
                <div className="p-2">
                  <PartnerRegister 
                    setView={(v) => {
                      if (v === 'close-modal' || v === 'partner-login') {
                        setShowAddPartnerModal(false);
                        // Reload database of partners
                        const savedPartners = localStorage.getItem('ds_partners');
                        if (savedPartners) {
                          setPartners(JSON.parse(savedPartners));
                        }
                      }
                    }}
                    creatorType="DistrictPartner"
                    creatorState={partner.assignedState}
                    creatorDistrict={partner.assignedDistrict}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

        </div> {/* COLUMN 2 END */}
      </div> {/* GRID END */}

      {/* ==========================================
          DOCT SPARK: DOCTOR REVIEW MODAL OVERLAY
          ========================================== */}
      {selectedDocForReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-teal-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-[#0A6E6E] text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white block mb-1 w-max">
                  DOCT SPARK Profile Verification
                </span>
                <h3 className="text-lg font-extrabold">Review Profile: Dr. {selectedDocForReview.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedDocForReview(null)}
                className="text-white hover:text-teal-200 font-bold text-lg p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs leading-relaxed text-[#1A2B3C]">
              {reviewError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg font-bold flex items-center gap-2">
                  <span className="text-base">⚠️</span> {reviewError}
                </div>
              )}

              {/* Grid 1: Academic & Professional Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F0F7F7] p-4 rounded-xl border border-[#D1E5E5]">
                <div>
                  <h4 className="font-extrabold text-[#0A6E6E] uppercase text-[10px] tracking-wider mb-2">Academic & Experience</h4>
                  <ul className="space-y-1.5 font-semibold text-gray-700">
                    <li><span className="text-gray-400">Degree:</span> {selectedDocForReview.degree || 'MBBS'}</li>
                    <li><span className="text-gray-400">University:</span> {selectedDocForReview.university || 'KEM Hospital, Mumbai'}</li>
                    <li><span className="text-gray-400">Passing Year:</span> {selectedDocForReview.passingYear || '2018'}</li>
                    <li><span className="text-gray-400">Specialty:</span> {selectedDocForReview.specialty}</li>
                    <li><span className="text-gray-400">Experience:</span> {selectedDocForReview.experience} Years</li>
                    <li><span className="text-gray-400">Registration:</span> {selectedDocForReview.registrationNumber || selectedDocForReview.regNumber || 'N/A'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0A6E6E] uppercase text-[10px] tracking-wider mb-2">Practice details</h4>
                  <ul className="space-y-1.5 font-semibold text-gray-700">
                    <li><span className="text-gray-400">Practice Type:</span> {selectedDocForReview.practiceType || 'Independent'}</li>
                    <li><span className="text-gray-400">Primary Clinic:</span> {selectedDocForReview.clinicName || 'Apex General Clinic'}</li>
                    <li><span className="text-gray-400">State:</span> {selectedDocForReview.state}</li>
                    <li><span className="text-gray-400">District:</span> {selectedDocForReview.district}</li>
                    <li><span className="text-gray-400">Pincode:</span> {selectedDocForReview.pincode || '400012'}</li>
                    <li><span className="text-gray-400">Address:</span> {selectedDocForReview.address || '12, MG Road'}</li>
                  </ul>
                </div>
              </div>

              {/* Grid 2: Identification & Credentials Check */}
              <div className="border border-gray-100 rounded-xl p-4 bg-slate-50 space-y-2.5">
                <h4 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">Submitted Verification Papers</h4>
                <div className="flex flex-wrap gap-4 text-gray-600 font-semibold">
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="text-[#0A6E6E]">📄</span>
                    <div>
                      <p className="text-[10px] font-bold text-gray-800">Owner ID Proof Doc</p>
                      <p className="text-[9px] text-indigo-600 font-mono">{selectedDocForReview.ownerIdProofDoc || 'national_id.jpg'}</p>
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                    <span className="text-[#0A6E6E]">📄</span>
                    <div>
                      <p className="text-[10px] font-bold text-gray-800">State Medical Council Cert</p>
                      <p className="text-[9px] text-indigo-600 font-mono">medical_council_license_reg.pdf</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral Assignment & Locking Control */}
              <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/60 space-y-3">
                <h4 className="font-extrabold text-teal-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  🛡️ Commission Allocation & Referral Lock Status
                </h4>
                {selectedDocForReview.referralIdLocked ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-black">
                      <span>🔒</span> Referral ID Permanently Locked
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      This doctor entered a valid Referral ID at registration: <span className="underline font-bold text-emerald-950">{selectedDocForReview.referralPartnerId}</span>. No partner or admin can modify this assignment. Onboarding credit is locked.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-black">
                      <span>⚠️</span> Self-Registration (No Referral ID Provided)
                    </div>
                    <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                      This profile was created without a Referral ID. You are required to assign your own Partner Referral ID before verification. It will be permanently locked.
                    </p>
                    <div>
                      <label className="block text-[10px] text-teal-950 font-bold mb-1">Enter Your Partner Referral ID *</label>
                      <input 
                        type="text"
                        value={reviewReferralId}
                        onChange={(e) => setReviewReferralId(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-teal-200 p-2 rounded-lg text-xs font-bold outline-none text-[#1a2b3c] shadow-xs focus:ring-1 focus:ring-teal-500 uppercase"
                        placeholder="e.g. DT-200001 or ST-100001"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Correction Input Fields */}
              {reviewShowCorrection && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider">
                    Specify Required Corrections
                  </h4>
                  <p className="text-[10px] text-amber-800 font-medium">
                    Please describe the necessary corrections. An automated status alert will be sent to the doctor.
                  </p>
                  <textarea 
                    value={reviewCorrectionNotes}
                    onChange={(e) => setReviewCorrectionNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-amber-200 p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] shadow-xs focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Please upload a clearer copy of your State Medical Registration Certificate..."
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button 
                      onClick={() => setReviewShowCorrection(false)}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold rounded-lg cursor-pointer text-gray-700"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => handleVerifyDoctor(selectedDocForReview.id, 'correction')}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Send Correction Request ➔
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!reviewShowCorrection && (
              <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                <button 
                  onClick={() => setSelectedDocForReview(null)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-xs cursor-pointer"
                >
                  Close Review
                </button>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button 
                    onClick={() => setReviewShowCorrection(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg cursor-pointer"
                  >
                    Request Correction
                  </button>
                  <button 
                    onClick={() => handleVerifyDoctor(selectedDocForReview.id, 'reject')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg cursor-pointer"
                  >
                    Reject Profile
                  </button>
                  {partner.partnerType === 'State' && (
                    <button 
                      onClick={() => handleVerifyDoctor(selectedDocForReview.id, 'send_back')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg cursor-pointer"
                      title="Send back to District Partner for re-assessment"
                    >
                      Send back to District
                    </button>
                  )}
                  <button 
                    onClick={() => handleVerifyDoctor(selectedDocForReview.id, 'approve')}
                    className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg cursor-pointer shadow-sm"
                  >
                    Approve & Forward ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          PARTNER REVIEW MODAL OVERLAY
          ========================================== */}
      {selectedPartnerForReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-teal-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8 animate-fadeIn">
            {/* Header */}
            <div className="bg-[#0A6E6E] text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white block mb-1 w-max">
                  Franchise Partner Verification
                </span>
                <h3 className="text-lg font-extrabold">Review Partner Profile: {selectedPartnerForReview.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedPartnerForReview(null)}
                className="text-white hover:text-teal-200 font-bold text-lg p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] text-xs leading-relaxed text-[#1A2B3C]">
              {partnerReviewError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg font-bold flex items-center gap-2">
                  <span className="text-base">⚠️</span> {partnerReviewError}
                </div>
              )}

              {/* Grid 1: Basic Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F0F7F7] p-4 rounded-xl border border-[#D1E5E5]">
                <div>
                  <h4 className="font-extrabold text-[#0A6E6E] uppercase text-[10px] tracking-wider mb-2">Personal & Territory Info</h4>
                  <ul className="space-y-1.5 font-semibold text-gray-700">
                    <li><span className="text-gray-400">Name:</span> {selectedPartnerForReview.name}</li>
                    <li><span className="text-gray-400">Gender / Age:</span> {selectedPartnerForReview.gender || 'Male'} ({selectedPartnerForReview.age || '30'} Yrs)</li>
                    <li><span className="text-gray-400">Email:</span> {selectedPartnerForReview.email}</li>
                    <li><span className="text-gray-400">Phone:</span> {selectedPartnerForReview.phone}</li>
                    <li><span className="text-gray-400">Role level:</span> {selectedPartnerForReview.partnerType} Level Partner</li>
                    <li><span className="text-gray-400">Assigned Territory:</span> {selectedPartnerForReview.assignedCity ? `${selectedPartnerForReview.assignedCity}, ` : ''}{selectedPartnerForReview.assignedDistrict ? `${selectedPartnerForReview.assignedDistrict}, ` : ''}{selectedPartnerForReview.assignedState}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0A6E6E] uppercase text-[10px] tracking-wider mb-2">Qualifications & Background</h4>
                  <ul className="space-y-1.5 font-semibold text-gray-700">
                    <li><span className="text-gray-400">Education:</span> {selectedPartnerForReview.qualification}</li>
                    <li><span className="text-gray-400">Occupation:</span> {selectedPartnerForReview.occupation}</li>
                    <li><span className="text-gray-400">Experience:</span> {selectedPartnerForReview.experience}</li>
                    <li><span className="text-gray-400">Skills:</span> {selectedPartnerForReview.skills}</li>
                    <li><span className="text-gray-400">Pincode:</span> {selectedPartnerForReview.pincode}</li>
                    <li><span className="text-gray-400">Address:</span> {selectedPartnerForReview.address}</li>
                  </ul>
                </div>
              </div>

              {/* National Identity details */}
              <div className="border border-gray-100 rounded-xl p-4 bg-slate-50 space-y-2">
                <h4 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">KYC Verification Documents (Entered Numbers)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Aadhaar Card</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{selectedPartnerForReview.aadhaarNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">PAN Card</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{selectedPartnerForReview.panNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Voter ID</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{selectedPartnerForReview.voterIdNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Bio Statement */}
              {selectedPartnerForReview.aboutPartner500Words && (
                <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50 space-y-1.5">
                  <h4 className="font-extrabold text-gray-800 uppercase text-[10px] tracking-wider">Statement of Purpose</h4>
                  <p className="whitespace-pre-wrap text-gray-600 font-medium bg-white p-3 rounded-lg border border-gray-100">{selectedPartnerForReview.aboutPartner500Words}</p>
                </div>
              )}

              {/* Review Remarks Field */}
              <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/60 space-y-3">
                <h4 className="font-extrabold text-teal-950 uppercase text-[10px] tracking-wider">
                  Review Remarks & Audit Logging
                </h4>
                <p className="text-[10px] text-teal-800 font-medium">
                  Please enter detailed review remarks. Your name, role, decision, and these remarks will be permanently logged in the secure audit log.
                </p>
                <textarea 
                  value={partnerReviewRemarks}
                  onChange={(e) => setPartnerReviewRemarks(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-teal-200 p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] shadow-xs focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Verified Aadhaar & PAN details. Education credentials found valid. Forwarding for final admin approval."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-2">
              <button 
                onClick={() => setSelectedPartnerForReview(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <div className="flex gap-2 text-xs">
                <button 
                  onClick={() => handleReviewPartnerAction('reject')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg cursor-pointer"
                >
                  Reject Application
                </button>
                <button 
                  onClick={() => handleReviewPartnerAction('approve')}
                  className="px-5 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold rounded-lg cursor-pointer shadow-sm"
                >
                  Approve & Forward ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
