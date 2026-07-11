/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, ArrowLeft, ArrowRight, ShieldCheck, Upload, CreditCard, Building, Stethoscope, User, MapPin, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import { SPECIALTIES } from '../../data/mockData';
import { indiaStatesData } from '../../data/indiaLocations';
import { Partner } from '../../types';
import { validateReferralId } from '../../data/referralUtils';
import { addAuditLog } from '../../data/commissionUtils';
import { saveInAppNotification } from '../../data/targetUtils';
import { logTermsAcceptance, getTermsDocuments } from '../../data/termsUtils';
import TermsConsentCheckbox from '../common/TermsConsentCheckbox';
import { supabase } from '../../lib/supabase';

interface DoctorRegisterProps {
  setView: (view: string) => void;
  onSubmitDoctor: (doctorData: any) => void;
  predefinedPartner?: Partner;
}

export default function DoctorRegister({ setView, onSubmitDoctor, predefinedPartner }: DoctorRegisterProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [geoTagStatus, setGeoTagStatus] = React.useState('');
  const [editingClinicId, setEditingClinicId] = React.useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = React.useState(() => ({
    // Step 1
    name: '',
    email: '',
    phone: '',
    password: '',
    dob: '',
    gender: 'Male',
    // Step 2
    regNumber: '',
    specialty: 'General Physician',
    subSpecialty: '',
    experience: '5',
    degree: 'MBBS',
    university: '',
    passingYear: '2018',
    // Step 3
    practiceType: 'Independent',
    clinicName: '',
    city: predefinedPartner?.assignedDistrict || 'Mumbai City',
    district: predefinedPartner?.assignedDistrict || 'Mumbai',
    state: predefinedPartner?.assignedState || 'Maharashtra',
    pincode: '',
    address: '',
    latitude: '',
    longitude: '',
    clinicPhotos: [] as string[],
    clinics: [] as {
      id: string;
      name: string;
      practiceType: string;
      state: string;
      district: string;
      city: string;
      pincode: string;
      address: string;
      latitude?: string;
      longitude?: string;
      photos?: string[];
    }[],
    // Step 4
    consultType: 'Both',
    feeInClinic: '500',
    feeVideo: '400',
    duration: '30 min',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as string[],
    morningSlots: true,
    eveningSlots: true,
    // Step 5 (Simulated file uploads)
    degreeUploaded: false,
    regUploaded: false,
    idUploaded: false,
    photoUploaded: false,
    // Step 6
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'Savings',
    // Terms
    agreeToTerms: false
  }));

  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // OTP Verification States
  const [showOtpVerification, setShowOtpVerification] = React.useState(false);
  const [mobileOtpCode, setMobileOtpCode] = React.useState('');
  const [emailOtpCode, setEmailOtpCode] = React.useState('');
  const [generatedMobileOtp, setGeneratedMobileOtp] = React.useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = React.useState('');
  const [mobileOtpVerified, setMobileOtpVerified] = React.useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = React.useState(false);

  // Referral Partner Verification States
  const [referralStep, setReferralStep] = React.useState(!predefinedPartner);
  const [referralIdInput, setReferralIdInput] = React.useState(predefinedPartner?.referralId || '');
  const [verifiedPartner, setVerifiedPartner] = React.useState<Partner | null>(predefinedPartner || null);
  const [referralError, setReferralError] = React.useState('');

  // Subscription Payment States
  const [showPaymentScreen, setShowPaymentScreen] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('UPI');
  const [paymentSimulating, setPaymentSimulating] = React.useState(false);
  const [subscriptionPaid, setSubscriptionPaid] = React.useState(false);

  // Navigation handlers with simple validations
  const handleNext = () => {
    setErrorMessage('');
    
    // Step Validation
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.dob) {
        setErrorMessage('Please fill in all basic fields correctly.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.regNumber || !formData.degree || !formData.university) {
        setErrorMessage('Registration number, degree, and university are required.');
        return;
      }
    } else if (currentStep === 3) {
      let updatedClinics = [...formData.clinics];
      // Auto-save active draft clinic if they typed something but forgot to click Add
      if (formData.clinicName.trim() && formData.address.trim() && formData.pincode.trim()) {
        const alreadyExists = updatedClinics.some(c => c.name === formData.clinicName && c.address === formData.address);
        if (!alreadyExists) {
          const newC = {
            id: editingClinicId || ('c-' + Date.now()),
            name: formData.clinicName,
            practiceType: formData.practiceType,
            state: formData.state,
            district: formData.district,
            city: formData.city,
            pincode: formData.pincode,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude
          };
          if (editingClinicId) {
            updatedClinics = updatedClinics.map(c => c.id === editingClinicId ? newC : c);
            setEditingClinicId(null);
          } else {
            updatedClinics.push(newC);
          }
          // We can set the form state asynchronously, but to make sure updatedClinics is propagated, we'll use it directly below
        }
      }

      if (updatedClinics.length === 0) {
        setErrorMessage('Please fill in details and add at least one clinic or chamber address to proceed.');
        return;
      }

      // Also set the main/primary clinic fields to the first clinic for backward compatibility
      const primary = updatedClinics[0];
      setFormData(prev => ({
        ...prev,
        clinics: updatedClinics,
        clinicName: primary.name,
        practiceType: primary.practiceType,
        state: primary.state,
        district: primary.district,
        city: primary.city,
        pincode: primary.pincode,
        address: primary.address,
        latitude: primary.latitude || '',
        longitude: primary.longitude || '',
        // If we auto-saved, clear the inputs
        ...(formData.clinicName.trim() && formData.address.trim() && formData.pincode.trim() ? {
          clinicName: '',
          address: '',
          pincode: '',
          latitude: '',
          longitude: ''
        } : {})
      }));
    } else if (currentStep === 4) {
      for (const clinic of formData.clinics) {
        const cConsultType = clinic.consultType || 'Both';
        const cFeeInClinic = clinic.feeInClinic !== undefined ? clinic.feeInClinic : 500;
        const cFeeVideo = clinic.feeVideo !== undefined ? clinic.feeVideo : 400;
        const cAvailableDays = clinic.availableDays || [];

        if (cConsultType === 'Both' || cConsultType === 'In-Clinic') {
          if (cFeeInClinic <= 0) {
            setErrorMessage(`Please enter a valid In-Clinic Fee for ${clinic.name}.`);
            return;
          }
        }
        if (cConsultType === 'Both' || cConsultType === 'Video') {
          if (cFeeVideo <= 0) {
            setErrorMessage(`Please enter a valid Video Consultation Fee for ${clinic.name}.`);
            return;
          }
        }
        if (cAvailableDays.length === 0) {
          setErrorMessage(`Please select at least one available day for ${clinic.name}.`);
          return;
        }
        const cAvailableSlots = clinic.availableSlots || [];
        if (cAvailableSlots.length === 0) {
          setErrorMessage(`Please select at least one available time slot for ${clinic.name}.`);
          return;
        }
      }

      // Check for schedule conflicts between clinics
      for (let i = 0; i < formData.clinics.length; i++) {
        const c1 = formData.clinics[i];
        const days1 = c1.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const slots1 = c1.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

        for (let j = i + 1; j < formData.clinics.length; j++) {
          const c2 = formData.clinics[j];
          const days2 = c2.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          const slots2 = c2.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

          const commonDays = days1.filter(d => days2.includes(d));
          if (commonDays.length > 0) {
            const commonSlots = slots1.filter(s => slots2.includes(s));
            if (commonSlots.length > 0) {
              setErrorMessage("This time slot conflicts with an existing schedule. A doctor cannot be assigned to multiple clinics at the same date and time. Please select a different time slot.");
              return;
            }
          }
        }
      }
    } else if (currentStep === 5) {
      if (!formData.photoUploaded && !formData.degreeUploaded) {
        setErrorMessage('Please upload at least your Degree Certificate and Profile Photo to proceed.');
        return;
      }
    } else if (currentStep === 6) {
      if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
        setErrorMessage('Bank details are required to configure withdrawals.');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMessage('');
    setCurrentStep(prev => prev - 1);
  };

  const toggleDay = (day: string) => {
    if (formData.availableDays.includes(day)) {
      setFormData(prev => ({ ...prev, availableDays: prev.availableDays.filter(d => d !== day) }));
    } else {
      setFormData(prev => ({ ...prev, availableDays: [...prev.availableDays, day] }));
    }
  };

  const updateClinicFields = (clinicId: string, fields: Partial<typeof formData.clinics[0]>) => {
    setFormData(prev => ({
      ...prev,
      clinics: prev.clinics.map(c => c.id === clinicId ? { ...c, ...fields } : c)
    }));
  };

  const toggleClinicPhoto = (photoType: 'facade' | 'waiting' | 'room') => {
    const photoUrls = {
      facade: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&auto=format&fit=crop',
      waiting: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop',
      room: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop'
    };
    const url = photoUrls[photoType];
    setFormData(prev => {
      const current = prev.clinicPhotos || [];
      const updated = current.includes(url) 
        ? current.filter(p => p !== url) 
        : [...current, url];
      return { ...prev, clinicPhotos: updated };
    });
  };

  const toggleClinicDay = (clinicId: string, day: string) => {
    const target = formData.clinics.find(c => c.id === clinicId);
    if (!target) return;
    const currentDays = target.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    const isSelecting = !currentDays.includes(day);
    if (isSelecting) {
      const targetSlots = target.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
      for (const other of formData.clinics) {
        if (other.id === clinicId) continue;
        const otherDays = other.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const otherSlots = other.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
        
        if (otherDays.includes(day)) {
          const commonSlots = targetSlots.filter(s => otherSlots.includes(s));
          if (commonSlots.length > 0) {
            setErrorMessage("This time slot conflicts with an existing schedule. A doctor cannot be assigned to multiple clinics at the same date and time. Please select a different time slot.");
            return;
          }
        }
      }
    }

    setErrorMessage('');
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateClinicFields(clinicId, { availableDays: updatedDays });
  };

  const toggleClinicSlot = (clinicId: string, slot: string) => {
    const target = formData.clinics.find(c => c.id === clinicId);
    if (!target) return;
    const currentSlots = target.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
    
    const isSelecting = !currentSlots.includes(slot);
    if (isSelecting) {
      const targetDays = target.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      for (const other of formData.clinics) {
        if (other.id === clinicId) continue;
        const otherDays = other.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const otherSlots = other.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
        
        const commonDays = targetDays.filter(d => otherDays.includes(d));
        if (commonDays.length > 0 && otherSlots.includes(slot)) {
          setErrorMessage("This time slot conflicts with an existing schedule. A doctor cannot be assigned to multiple clinics at the same date and time. Please select a different time slot.");
          return;
        }
      }
    }

    setErrorMessage('');
    const updatedSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot];
    updateClinicFields(clinicId, { availableSlots: updatedSlots });
  };

  const handleAddOrUpdateClinic = () => {
    setErrorMessage('');
    if (!formData.clinicName.trim() || !formData.address.trim() || !formData.pincode.trim()) {
      setErrorMessage('Clinic/Hospital Name, Address, and Pincode are required.');
      return;
    }

    const target = formData.clinics.find(c => c.id === editingClinicId);
    const newC = {
      id: editingClinicId || ('c-' + Date.now()),
      name: formData.clinicName,
      practiceType: formData.practiceType,
      state: formData.state,
      district: formData.district,
      city: formData.city,
      pincode: formData.pincode,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      consultType: target?.consultType || 'Both',
      feeInClinic: target?.feeInClinic || 500,
      feeVideo: target?.feeVideo || 400,
      availableDays: target?.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableSlots: target?.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
      photos: formData.clinicPhotos || []
    };

    let updatedClinics;
    if (editingClinicId) {
      updatedClinics = formData.clinics.map(c => c.id === editingClinicId ? newC : c);
      setEditingClinicId(null);
    } else {
      updatedClinics = [...formData.clinics, newC];
    }

    setFormData(prev => ({
      ...prev,
      clinics: updatedClinics,
      clinicName: '',
      address: '',
      pincode: '',
      latitude: '',
      longitude: '',
      clinicPhotos: []
    }));
    setGeoTagStatus('');
  };

  const handleEditClinic = (id: string) => {
    const target = formData.clinics.find(c => c.id === id);
    if (!target) return;

    setEditingClinicId(id);
    setFormData(prev => ({
      ...prev,
      practiceType: target.practiceType,
      clinicName: target.name,
      state: target.state,
      district: target.district,
      city: target.city,
      pincode: target.pincode,
      address: target.address,
      latitude: target.latitude || '',
      longitude: target.longitude || '',
      clinicPhotos: target.photos || []
    }));
    setGeoTagStatus('Editing added clinic...');
  };

  const handleDeleteClinic = (id: string) => {
    setFormData(prev => ({
      ...prev,
      clinics: prev.clinics.filter(c => c.id !== id)
    }));
    if (editingClinicId === id) {
      setEditingClinicId(null);
      setFormData(prev => ({
        ...prev,
        clinicName: '',
        address: '',
        pincode: '',
        latitude: '',
        longitude: ''
      }));
    }
  };

  const handleSimulateSubscriptionPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSimulating(true);
    setErrorMessage('');
    setTimeout(() => {
      setPaymentSimulating(false);
      setSubscriptionPaid(true);
      setShowPaymentScreen(false);
      
      // Initialize referral verification view first
      setReferralStep(true);
      setReferralIdInput('');
      setVerifiedPartner(null);
      setReferralError('');
      
      setGeneratedMobileOtp('');
      setGeneratedEmailOtp('');
      setMobileOtpCode('');
      setEmailOtpCode('');
      setMobileOtpVerified(false);
      setEmailOtpVerified(false);
      setShowOtpVerification(true);
    }, 1500);
  };

  const handleVerifyReferralId = (e: React.MouseEvent) => {
    e.preventDefault();
    setReferralError('');
    if (!referralIdInput.trim()) {
      setReferralError('Please enter a Partner Referral ID.');
      return;
    }
    const partner = validateReferralId(referralIdInput);
    if (partner) {
      setVerifiedPartner(partner);
      setReferralError('');
    } else {
      setReferralError('Invalid Referral Partner ID. Please make sure to enter a valid ID (e.g. ST-100001 or DT-200001).');
      setVerifiedPartner(null);
    }
  };

  const handleProceedToOtp = (e: React.MouseEvent, usePartner: boolean) => {
    e.preventDefault();
    const activePartner = usePartner ? verifiedPartner : null;
    setVerifiedPartner(activePartner);
    
    // Generate simulated OTPs
    const mockMobileOtp = String(Math.floor(1000 + Math.random() * 9000));
    const mockEmailOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedMobileOtp(mockMobileOtp);
    setGeneratedEmailOtp(mockEmailOtp);
    
    // Proceed to OTP screen
    setReferralStep(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      setErrorMessage('You must agree to the Terms & Conditions before submission.');
      return;
    }
    
    // Redirect first to the 1-Year Subscription payment screen
    setShowPaymentScreen(true);
    setErrorMessage('');
  };

  const handleVerifyDoctorOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const isMobileValid = mobileOtpCode.trim() === generatedMobileOtp || mobileOtpCode.trim() === '1234';
    const isEmailValid = emailOtpCode.trim() === generatedEmailOtp || emailOtpCode.trim() === '1234';

    if (isMobileValid && isEmailValid) {
      setMobileOtpVerified(true);
      setEmailOtpVerified(true);
      setIsSubmitted(true);
      
      // Map complete typed doctor object matching exact types.ts schema to populate platform registers correctly
      const firstClinic = formData.clinics[0] || {};
      const doctorId = `doc-reg-${Math.floor(1000 + Math.random() * 9000)}`;
      const completedDoctorData: any = {
        id: doctorId,
        name: formData.name,
        specialty: formData.specialty,
        experience: Number(formData.experience) || 5,
        clinicName: firstClinic.name || formData.clinicName || 'Doct Spark Clinic',
        city: firstClinic.city || formData.city || 'Mumbai City',
        rating: 5.0,
        reviewsCount: 0,
        feeInClinic: Number(firstClinic.feeInClinic) || Number(formData.feeInClinic) || 500,
        feeVideo: Number(firstClinic.feeVideo) || Number(formData.feeVideo) || 400,
        nextAvailable: 'Today 4:00 PM',
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
        bio: `${formData.specialty} with ${formData.experience} years of clinical experience. Registered under MCI council license ${formData.regNumber}.`,
        education: `${formData.degree} from ${formData.university} (${formData.passingYear})`,
        registrationNumber: formData.regNumber,
        availableDays: firstClinic.availableDays || formData.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timeSlots: firstClinic.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
        lat: Number(firstClinic.latitude) || 19.0760,
        lng: Number(firstClinic.longitude) || 72.8777,
        clinics: formData.clinics.map(c => ({
          id: c.id,
          name: c.name,
          practiceType: c.practiceType,
          state: c.state,
          district: c.district,
          city: c.city,
          pincode: c.pincode,
          address: c.address,
          latitude: c.latitude,
          longitude: c.longitude,
          consultType: c.consultType || 'Both',
          feeInClinic: c.feeInClinic,
          feeVideo: c.feeVideo,
          availableDays: c.availableDays,
          availableSlots: c.availableSlots
        })),
        gender: formData.gender,
        contactPhone: formData.phone,
        email: formData.email,
        languages: ['English', 'Hindi'],
        subscriptionPaid: true,
        mobileOtpVerified: true,
        emailOtpVerified: true,
        state: firstClinic.state || formData.state || 'Maharashtra',
        district: firstClinic.district || formData.district || 'Mumbai',
        ownerIdProofDoc: 'national_id.jpg'
      };

      const finalState = completedDoctorData.state;
      const finalDistrict = completedDoctorData.district;

      // DOCT SPARK Auto Routing Logic
      const savedPartnersRaw = localStorage.getItem('ds_partners');
      const partnersList: any[] = savedPartnersRaw ? JSON.parse(savedPartnersRaw) : [];

      // Find partners
      const distPartner = partnersList.find(
        p => p.partnerType === 'District' && 
             p.assignedState === finalState && 
             p.assignedDistrict === finalDistrict && 
             p.status === 'Approved'
      );
      const statePartner = partnersList.find(
        p => p.partnerType === 'State' && 
             p.assignedState === finalState && 
             p.status === 'Approved'
      );

      let initialStatus: 'Pending District' | 'Pending State' | 'Pending Admin' = 'Pending Admin';
      let routeReason = '';

      if (distPartner) {
        initialStatus = 'Pending District';
        routeReason = `Assigned District Partner ${distPartner.name} (${distPartner.referralId})`;
      } else if (statePartner) {
        initialStatus = 'Pending State';
        routeReason = `Assigned State Partner ${statePartner.name} (${statePartner.referralId}) (No District Partner Assigned)`;
      } else {
        initialStatus = 'Pending Admin';
        routeReason = 'Super Admin directly (No State or District Partner Assigned)';
      }

      completedDoctorData.verificationStatus = initialStatus;

      // Handle Referral ID & Locking
      if (verifiedPartner) {
        completedDoctorData.onboardedBy = verifiedPartner.id;
        completedDoctorData.onboardedByType = verifiedPartner.partnerType;
        completedDoctorData.referralPartnerId = verifiedPartner.referralId;
        completedDoctorData.referralIdLocked = true;
      } else {
        completedDoctorData.referralIdLocked = false;
      }

      // 1. Log in Audit Log
      addAuditLog(
        'Doctor Self Registration',
        `Dr. ${completedDoctorData.name}`,
        `Registered directly from website. Selected State: ${finalState}, District: ${finalDistrict}. ` +
        `Referral ID: ${verifiedPartner ? verifiedPartner.referralId + ' (Locked)' : 'None'}. ` +
        `Routed to: ${routeReason}. IP Address: 192.168.1.${Math.floor(Math.random() * 254) + 1}`
      );

      // 2. Trigger in-app notification to next verifier
      if (initialStatus === 'Pending District' && distPartner) {
        saveInAppNotification(distPartner.id, `New self-registered doctor Dr. ${completedDoctorData.name} has been routed to you for District verification.`);
      } else if (initialStatus === 'Pending State' && statePartner) {
        saveInAppNotification(statePartner.id, `New self-registered doctor Dr. ${completedDoctorData.name} has been routed to you for State verification.`);
      } else {
        saveInAppNotification('superadmin', `New self-registered doctor Dr. ${completedDoctorData.name} has been routed to Admin because no matching partners were assigned.`);
      }

      // Save doctor to local accounts for local sign in
      try {
        const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
        const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
        localAccounts[formData.email.toLowerCase().trim()] = {
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          name: formData.name,
          role: 'doctor'
        };
        localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));
      } catch (err) {
        console.warn('Failed to save doctor to local accounts:', err);
      }

      // Attempt live Supabase Auth signup in the background if configured
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
          console.log('Signing up doctor in Supabase Auth:', formData.email);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            options: {
              data: {
                name: formData.name.trim(),
                role: 'doctor'
              }
            }
          });
          if (!authError && authData?.user) {
            console.log('Doctor signed up successfully in Supabase Auth. Creating profile...');
            try {
              const docTerms = getTermsDocuments().find(d => d.id === 'doctor');
              const latestVersion = docTerms && docTerms.publishingStatus === 'Published' ? docTerms.version : '1.0';
              
              const { error: upsertErr } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: formData.email.toLowerCase().trim(),
                role: 'doctor',
                name: formData.name.trim(),
                full_name: formData.name.trim(),
                created_at: new Date().toISOString(),
                terms_accepted: true,
                accepted_terms_version: latestVersion,
                accepted_terms_at: new Date().toISOString()
              });
              if (upsertErr) {
                console.warn('Upsert profile failed:', upsertErr.message);
              } else {
                console.log('Doctor profile created in profiles table.');
              }
            } catch (upsertCatchErr) {
              console.warn('Failed to upsert doctor profile:', upsertCatchErr);
            }
          } else if (authError) {
            console.warn('Supabase Auth signUp returned error:', authError.message);
          }
        }
      } catch (err) {
        console.warn('Background Supabase signup failed for doctor:', err);
      }

      // Log official T&C acceptance
      try {
        logTermsAcceptance(
          formData.email.toLowerCase().trim(),
          formData.name.trim(),
          formData.email.toLowerCase().trim(),
          'doctor',
          '1.0'
        );
      } catch (logErr) {
        console.error('Failed to log doctor terms acceptance:', logErr);
      }

      onSubmitDoctor(completedDoctorData);
    } else {
      let err = '';
      if (!isMobileValid && !isEmailValid) {
        err = 'Invalid Mobile OTP and Email OTP. Please check both codes or use bypass 1234.';
      } else if (!isMobileValid) {
        err = 'Invalid Mobile OTP. Please check the code or use bypass 1234.';
      } else {
        err = 'Invalid Email OTP. Please check the code or use bypass 1234.';
      }
      setErrorMessage(err);
    }
  };

  const stepsList = [
    { num: 1, title: 'Basic Info' },
    { num: 2, title: 'Professional' },
    { num: 3, title: 'Practice' },
    { num: 4, title: 'Consultation' },
    { num: 5, title: 'Documents' },
    { num: 6, title: 'Bank Details' },
    { num: 7, title: 'Review & Submit' }
  ];

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-10" id="doctor-register-root">
      
      {/* Title block */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold text-[#1A2B3C] font-heading tracking-tight">
          Join Doct Spark Medical Network
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1.5 max-w-lg mx-auto">
          Complete the 7-step professional registration. Your details will be reviewed and verified by our clinical audit board within 24-48 hours.
        </p>
      </div>

      {/* Progress Steps Indicators */}
      <div className="mb-10 overflow-x-auto pb-2">
        <div className="flex justify-between items-center min-w-[600px] px-4">
          {stepsList.map((st) => (
            <React.Fragment key={st.num}>
              {st.num > 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= st.num ? 'bg-[#0A6E6E]' : 'bg-gray-200'}`}></div>
              )}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === st.num ? 'bg-[#F5A623] text-white ring-4 ring-[#F5A623]/20' : currentStep > st.num ? 'bg-[#0A6E6E] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {currentStep > st.num ? <Check className="w-4.5 h-4.5" /> : st.num}
                </div>
                <span className={`text-[10px] font-bold mt-1 whitespace-nowrap ${currentStep === st.num ? 'text-[#0A6E6E]' : 'text-gray-400'}`}>
                  {st.title}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Form container */}
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 md:p-8 shadow-sm">
        {errorMessage && (
          <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3.5 text-xs font-bold mb-6">
            ⚠️ {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#F0F7F7] text-[#0A6E6E] rounded-full flex items-center justify-center text-4xl mb-4 border border-[#D1E5E5] animate-bounce">
              📋
            </div>
            <h2 className="text-xl font-bold text-[#1A2B3C] font-heading">Verify OTP & Submitted for Verification!</h2>
            <p className="text-xs text-gray-500 max-w-md mt-2 mb-6 leading-relaxed">
              Thank you, Dr. <strong>{formData.name}</strong>. Your professional profile has been submitted for document verification. Our multi-level verification flow requires approvals from the <strong>District Partner</strong>, <strong>State Partner</strong>, and finally the <strong>Super Admin</strong>. Once approved, your profile will instantly go live!
            </p>
            <div className="bg-[#F0F7F7] p-5 rounded-xl border border-[#D1E5E5] text-xs font-semibold text-gray-700 max-w-md text-left mb-6 space-y-3">
              <div className="text-[#0A6E6E] font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span>🔔</span> SMS & Email Notifications Active
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                You will receive real-time updates as your profile progresses through the approval levels:
              </p>
              <ul className="space-y-1.5 text-gray-600 pl-1">
                <li className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[#0A6E6E]">⏳</span> <strong>Stage 1:</strong> District Partner Verification
                </li>
                <li className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[#0A6E6E]">⏳</span> <strong>Stage 2:</strong> State Partner Verification
                </li>
                <li className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-[#0A6E6E]">⏳</span> <strong>Stage 3:</strong> Super Admin Final Activation
                </li>
              </ul>
              <div className="border-t border-[#D1E5E5] pt-2 text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-1.5 rounded">
                📱 Simulated notifications are registered to: <span className="font-mono">{formData.phone}</span> & <span className="font-mono">{formData.email}</span>
              </div>
            </div>
            <button 
              onClick={() => setView(predefinedPartner ? 'partner-dashboard' : 'home')}
              className="bg-[#0A6E6E] text-white font-extrabold text-xs px-8 py-3 rounded-lg shadow-md hover:bg-[#0A6E6E]/90 cursor-pointer"
            >
              {predefinedPartner ? 'Back to Partner Dashboard' : 'Back to Homepage'}
            </button>
          </div>
        ) : (
          <div>
            {/* STEP 1: BASIC INFO */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                  <User className="text-[#0A6E6E] w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 1: Basic Professional Info</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Full Name (Prefix Dr.)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Dr. Ramesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Contact Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. ramesh.sharma@doctspark.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Mobile Phone (for OTP/SMS)</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Account Secure Password</label>
                    <input 
                      type="password" 
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PROFESSIONAL DETAILS */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                  <Stethoscope className="text-[#0A6E6E] w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 2: Medical Certifications & Degrees</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Medical Registration Number (MCI/State)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MCI-23490"
                      value={formData.regNumber}
                      onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Primary Speciality</label>
                    <select 
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    >
                      {SPECIALTIES.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Sub-Speciality (optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Interventional Cardiology, Pediatric Dermatology"
                      value={formData.subSpecialty}
                      onChange={(e) => setFormData({ ...formData, subSpecialty: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Years of Experience (Post MD/MBBS)</label>
                    <input 
                      type="number" 
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Highest Medical Degree</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MBBS, MD, MS, DM"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Medical University & Passing Year</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        placeholder="University name"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="col-span-2 w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                      />
                      <input 
                        type="number" 
                        placeholder="Year"
                        value={formData.passingYear}
                        onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CURRENT PRACTICE */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building className="text-[#0A6E6E] w-5 h-5" />
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 3: Clinics & Practice Locations</h3>
                  </div>
                  <span className="bg-[#F0F7F7] text-[#0A6E6E] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#D1E5E5]">
                    {formData.clinics.length} Registered Location(s)
                  </span>
                </div>

                {/* CURRENT CLINICS LIST */}
                {formData.clinics.length > 0 && (
                  <div className="flex flex-col gap-3.5 mb-2">
                    <h4 className="text-xs font-bold text-[#1A2B3C] uppercase tracking-wider">My Practice Locations:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.clinics.map((clinic, index) => (
                        <div 
                          key={clinic.id} 
                          className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-xl p-4 flex flex-col justify-between relative shadow-sm group hover:border-[#0A6E6E]/60 transition-all"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="bg-[#0A6E6E] text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {clinic.practiceType === 'Independent' ? 'Private Clinic' : clinic.practiceType === 'Clinic' ? 'Group Clinic' : 'Hospital Practice'}
                              </span>
                              {index === 0 && (
                                <span className="bg-[#F5A623] text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Primary
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-extrabold text-[#1A2B3C] font-heading">{clinic.name}</h5>
                            <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed font-semibold">
                              📍 {clinic.address}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {clinic.city}, {clinic.district}, {clinic.state} - <span className="font-mono">{clinic.pincode}</span>
                            </p>
                            {clinic.latitude && clinic.longitude && (
                              <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                🌐 GPS: {clinic.latitude}, {clinic.longitude}
                              </span>
                            )}
                            {clinic.photos && clinic.photos.length > 0 && (
                              <div className="flex gap-1.5 mt-2.5">
                                {clinic.photos.map((ph, pIdx) => (
                                  <div key={pIdx} className="w-8 h-8 rounded border border-gray-200 overflow-hidden relative shadow-sm hover:scale-105 transition-all">
                                    <img src={ph} alt="Clinic thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                ))}
                                <span className="text-[9px] text-[#0A6E6E] font-bold self-center ml-1 uppercase tracking-wider">
                                  {clinic.photos.length} Photo(s)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 border-t border-[#D1E5E5]/60 pt-3 mt-3.5">
                            <button
                              type="button"
                              onClick={() => handleEditClinic(clinic.id)}
                              className="p-1.5 text-[#0A6E6E] hover:bg-white rounded-lg border border-[#D1E5E5] cursor-pointer transition-all"
                              title="Edit location details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClinic(clinic.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 cursor-pointer transition-all"
                              title="Delete location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADD/EDIT FORM SECTION */}
                <div className="bg-white border-2 border-dashed border-[#D1E5E5] rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Plus className="text-[#0A6E6E] w-4 h-4" />
                    <h4 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-wider">
                      {editingClinicId ? '✏️ Edit Clinic or Chamber Address' : '🏥 Add New Clinic or Chamber Address'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Practice Type</label>
                      <select 
                        value={formData.practiceType}
                        onChange={(e) => setFormData({ ...formData, practiceType: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                      >
                        <option value="Independent">Independent Private Clinic</option>
                        <option value="Clinic">Associated Group Clinic</option>
                        <option value="Hospital">Hospital Practice</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Clinic or Hospital Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. LifeCare Specialist Centre"
                        value={formData.clinicName}
                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">State *</label>
                      <select 
                        value={formData.state}
                        disabled={!!predefinedPartner}
                        onChange={(e) => {
                          const selectedState = e.target.value;
                          const firstDistrict = indiaStatesData.find(s => s.state === selectedState)?.districts[0]?.name || '';
                          setFormData({ 
                            ...formData, 
                            state: selectedState, 
                            district: firstDistrict
                          });
                        }}
                        className={`w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] ${predefinedPartner ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {indiaStatesData.map(s => (
                          <option key={s.state} value={s.state}>{s.state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">District *</label>
                      <select 
                        value={formData.district || ''}
                        disabled={!!predefinedPartner && predefinedPartner.partnerType === 'District'}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className={`w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] ${(predefinedPartner && predefinedPartner.partnerType === 'District') ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {indiaStatesData.find(s => s.state === formData.state)?.districts.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        )) || <option value="">Select District</option>}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">City / Town / Area *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Andheri"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Pincode (Postal Code) *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 400053"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Full Physical Address</label>
                      <textarea 
                        rows={2}
                        placeholder="e.g. Shop 42, Ground Floor, Sunset Boulevard, Andheri West"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                      />
                    </div>

                    {/* HIGH FIDELITY GPS GEOLOCATION TAG BOX */}
                    <div className="sm:col-span-2 bg-[#F5FBFB] border-2 border-teal-100 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-[#0A6E6E] flex items-center gap-1.5 uppercase tracking-wider">
                            <MapPin className="w-4 h-4 text-teal-600 animate-pulse" />
                            GPS Geo-Tag Location coordinates
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Capture coordinates for exact patient route maps</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              setGeoTagStatus('Accessing secure GPS sensor...');
                              navigator.geolocation.getCurrentPosition(
                                (position) => {
                                  const lat = position.coords.latitude.toFixed(6);
                                  const lng = position.coords.longitude.toFixed(6);
                                  setFormData(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    address: prev.address ? `${prev.address} (GPS: ${lat}, ${lng})` : `GPS: ${lat}, ${lng}`
                                  }));
                                  setGeoTagStatus(`✓ Successfully captured coordinates!`);
                                },
                                (error) => {
                                  console.error(error);
                                  const lat = (19.0760 + (Math.random() - 0.5) * 0.05).toFixed(6);
                                  const lng = (72.8777 + (Math.random() - 0.5) * 0.05).toFixed(6);
                                  setFormData(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng
                                  }));
                                  setGeoTagStatus(`✓ Captured Simulated Location (${lat}, ${lng})`);
                                }
                              );
                            } else {
                              setGeoTagStatus('⚠️ Geolocation not supported by this browser.');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-teal-600 text-white font-extrabold text-[10px] rounded-lg hover:bg-teal-700 cursor-pointer transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                        >
                          📍 Grab GPS Location
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Latitude Coordinate</label>
                          <input
                            type="text"
                            readOnly
                            placeholder="Latitude"
                            value={formData.latitude || ''}
                            className="w-full bg-[#E6F2F2] border border-[#C2E0E0] p-2.5 rounded-lg text-xs font-mono font-bold outline-none text-[#1A2B3C]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Longitude Coordinate</label>
                          <input
                            type="text"
                            readOnly
                            placeholder="Longitude"
                            value={formData.longitude || ''}
                            className="w-full bg-[#E6F2F2] border border-[#C2E0E0] p-2.5 rounded-lg text-xs font-mono font-bold outline-none text-[#1A2B3C]"
                          />
                        </div>
                      </div>
                      {geoTagStatus && (
                        <div className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg self-start">
                          {geoTagStatus}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 CLINIC PHOTOS UPLOAD */}
                  <div className="bg-[#F8FAFA] border border-[#D1E5E5] rounded-xl p-4 flex flex-col gap-3 mt-1">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#0A6E6E] flex items-center gap-1.5 uppercase tracking-wider">
                        📸 Clinic Photos (Upload 3 Photos)
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Simulate uploading 3 high-quality photos of your practice location (Facade, Waiting Area, and Consulting Room).</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-1">
                      {/* Photo 1: Facade */}
                      {(() => {
                        const url = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=300&auto=format&fit=crop';
                        const isUploaded = (formData.clinicPhotos || []).includes(url);
                        return (
                          <div 
                            onClick={() => toggleClinicPhoto('facade')}
                            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all relative aspect-video flex flex-col items-center justify-center overflow-hidden ${isUploaded ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#D1E5E5] hover:border-[#0A6E6E] bg-white'}`}
                          >
                            {isUploaded ? (
                              <>
                                <img src={url} alt="Entrance Facade" className="absolute inset-0 w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                                  <span className="bg-emerald-500 text-white rounded-full p-1 text-[8px] font-extrabold">✓</span>
                                  <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wider shadow-sm text-center">1. Entrance / Facade</span>
                                  <span className="text-[7px] text-gray-200 mt-0.5">Click to Remove</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                <span className="text-[10px] font-bold text-gray-700">1. Entrance Facade</span>
                                <span className="text-[8px] text-gray-400 mt-0.5">Click to Simulate Upload</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Photo 2: Waiting Lounge */}
                      {(() => {
                        const url = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop';
                        const isUploaded = (formData.clinicPhotos || []).includes(url);
                        return (
                          <div 
                            onClick={() => toggleClinicPhoto('waiting')}
                            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all relative aspect-video flex flex-col items-center justify-center overflow-hidden ${isUploaded ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#D1E5E5] hover:border-[#0A6E6E] bg-white'}`}
                          >
                            {isUploaded ? (
                              <>
                                <img src={url} alt="Waiting Lounge" className="absolute inset-0 w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                                  <span className="bg-emerald-500 text-white rounded-full p-1 text-[8px] font-extrabold">✓</span>
                                  <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wider shadow-sm text-center">2. Waiting Lounge</span>
                                  <span className="text-[7px] text-gray-200 mt-0.5">Click to Remove</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                <span className="text-[10px] font-bold text-gray-700">2. Waiting Lounge</span>
                                <span className="text-[8px] text-gray-400 mt-0.5">Click to Simulate Upload</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Photo 3: Consult Room */}
                      {(() => {
                        const url = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop';
                        const isUploaded = (formData.clinicPhotos || []).includes(url);
                        return (
                          <div 
                            onClick={() => toggleClinicPhoto('room')}
                            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all relative aspect-video flex flex-col items-center justify-center overflow-hidden ${isUploaded ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#D1E5E5] hover:border-[#0A6E6E] bg-white'}`}
                          >
                            {isUploaded ? (
                              <>
                                <img src={url} alt="Consultation Chamber" className="absolute inset-0 w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                                  <span className="bg-emerald-500 text-white rounded-full p-1 text-[8px] font-extrabold">✓</span>
                                  <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wider shadow-sm text-center">3. Consult Chamber</span>
                                  <span className="text-[7px] text-gray-200 mt-0.5">Click to Remove</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center">
                                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                <span className="text-[10px] font-bold text-gray-700">3. Consulting Chamber</span>
                                <span className="text-[8px] text-gray-400 mt-0.5">Click to Simulate Upload</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddOrUpdateClinic}
                      className="px-5 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/90 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm uppercase tracking-wider cursor-pointer"
                    >
                      {editingClinicId ? 'Update Clinic/Chamber Location' : 'Save & Add Location to List'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CONSULTATION DETAILS */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                  <Clock className="text-[#0A6E6E] w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 4: Clinic-wise Consultation Modes, Fees & Weekly Availability</h3>
                </div>

                <div className="flex flex-col gap-6">
                  {formData.clinics.map((clinic, index) => {
                    const cConsultType = clinic.consultType || 'Both';
                    const cFeeInClinic = clinic.feeInClinic !== undefined ? clinic.feeInClinic : 500;
                    const cFeeVideo = clinic.feeVideo !== undefined ? clinic.feeVideo : 400;
                    const cAvailableDays = clinic.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

                    return (
                      <div key={clinic.id} className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-[#D1E5E5]/60 pb-2">
                          <span className="w-5 h-5 bg-[#0A6E6E] text-white rounded-full flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </span>
                          <h4 className="text-xs font-extrabold text-[#1A2B3C] uppercase tracking-wider font-heading">
                            {clinic.name}
                          </h4>
                          <span className="ml-auto bg-[#0A6E6E]/10 text-[#0A6E6E] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                            {clinic.practiceType === 'Independent' ? 'Private' : clinic.practiceType === 'Clinic' ? 'Group' : 'Hospital'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Preferred Consultation Mode</label>
                            <select 
                              value={cConsultType}
                              onChange={(e) => updateClinicFields(clinic.id, { consultType: e.target.value })}
                              className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                            >
                              <option value="Both">Both In-Clinic and Video</option>
                              <option value="Video">Video Consultations Only</option>
                              <option value="In-Clinic">In-Clinic Consultation Only</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Average Appointment Duration</label>
                            <select 
                              value={formData.duration}
                              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                              className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                            >
                              <option value="15 min">15 minutes</option>
                              <option value="30 min">30 minutes</option>
                              <option value="45 min">45 minutes</option>
                              <option value="60 min">60 minutes</option>
                            </select>
                          </div>

                          {(cConsultType === 'Both' || cConsultType === 'In-Clinic') && (
                            <div>
                              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">In-Clinic Fee (₹ INR)</label>
                              <input 
                                type="number" 
                                value={cFeeInClinic}
                                onChange={(e) => updateClinicFields(clinic.id, { feeInClinic: parseInt(e.target.value) || 0 })}
                                className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                              />
                            </div>
                          )}

                          {(cConsultType === 'Both' || cConsultType === 'Video') && (
                            <div>
                              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Video Consultation Fee (₹ INR)</label>
                              <input 
                                type="number" 
                                value={cFeeVideo}
                                onChange={(e) => updateClinicFields(clinic.id, { feeVideo: parseInt(e.target.value) || 0 })}
                                className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                              />
                            </div>
                          )}

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-[#1A2B3C] mb-2">Available Practice Days for this Location</label>
                            <div className="flex flex-wrap gap-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                const isSelected = cAvailableDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleClinicDay(clinic.id, day)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${isSelected ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white text-gray-500 border-[#D1E5E5] hover:bg-[#F0F7F7]'}`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-xs font-bold text-[#1A2B3C]">Available Time Slots for this Location</label>
                              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">
                                {(clinic.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']).length} Selected
                              </span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-white/60 p-3.5 rounded-lg border border-[#D1E5E5]/60">
                              <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">☀️ Morning Hours</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {['06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'].map(slot => {
                                    const cAvailableSlots = clinic.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
                                    const isSelected = cAvailableSlots.includes(slot);
                                    return (
                                      <button
                                        key={slot}
                                        type="button"
                                        onClick={() => toggleClinicSlot(clinic.id, slot)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-500 border-[#D1E5E5] hover:bg-[#F0F7F7]'}`}
                                      >
                                        {slot}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">🌤️ Afternoon Hours</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'].map(slot => {
                                    const cAvailableSlots = clinic.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
                                    const isSelected = cAvailableSlots.includes(slot);
                                    return (
                                      <button
                                        key={slot}
                                        type="button"
                                        onClick={() => toggleClinicSlot(clinic.id, slot)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-[#D1E5E5] hover:bg-[#F0F7F7]'}`}
                                      >
                                        {slot}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">🌙 Evening Hours</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'].map(slot => {
                                    const cAvailableSlots = clinic.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
                                    const isSelected = cAvailableSlots.includes(slot);
                                    return (
                                      <button
                                        key={slot}
                                        type="button"
                                        onClick={() => toggleClinicSlot(clinic.id, slot)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${isSelected ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white text-gray-500 border-[#D1E5E5] hover:bg-[#F0F7F7]'}`}
                                      >
                                        {slot}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: DOCUMENTS UPLOAD */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                  <Upload className="text-[#0A6E6E] w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 5: Verify Identity & Certificates</h3>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                  Upload crisp digital copies (JPEG or PDF) to support validation. Click the mock upload boxes to simulate secure uploads.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Medical degree upload */}
                  <div 
                    onClick={() => setFormData({ ...formData, degreeUploaded: !formData.degreeUploaded })}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${formData.degreeUploaded ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-[#D1E5E5] hover:border-[#0A6E6E]'}`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="text-xs font-bold">Medical Degree Certificate</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">MBBS or MD Certificate copy</p>
                    <span className="text-[10px] font-extrabold block mt-2">{formData.degreeUploaded ? '✅ UPLOADED (degree.pdf)' : 'CLICK TO SIMULATE UPLOAD'}</span>
                  </div>

                  {/* Registration Certificate */}
                  <div 
                    onClick={() => setFormData({ ...formData, regUploaded: !formData.regUploaded })}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${formData.regUploaded ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-[#D1E5E5] hover:border-[#0A6E6E]'}`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="text-xs font-bold">MCI / State Council Certificate</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Active medical license registration copy</p>
                    <span className="text-[10px] font-extrabold block mt-2">{formData.regUploaded ? '✅ UPLOADED (mci_reg.pdf)' : 'CLICK TO SIMULATE UPLOAD'}</span>
                  </div>

                  {/* ID Proof */}
                  <div 
                    onClick={() => setFormData({ ...formData, idUploaded: !formData.idUploaded })}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${formData.idUploaded ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-[#D1E5E5] hover:border-[#0A6E6E]'}`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="text-xs font-bold">Owner / Manager / Doctor Identity Proof</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Aadhaar Card, Passport, or PAN card copy</p>
                    <span className="text-[10px] font-extrabold block mt-2">{formData.idUploaded ? '✅ UPLOADED (national_id.jpg)' : 'CLICK TO SIMULATE UPLOAD'}</span>
                  </div>

                  {/* Profile Photo */}
                  <div 
                    onClick={() => setFormData({ ...formData, photoUploaded: !formData.photoUploaded })}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${formData.photoUploaded ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-[#D1E5E5] hover:border-[#0A6E6E]'}`}
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <div className="text-xs font-bold">Professional Portrait Avatar</div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Clear front-facing image (Min 300x300px)</p>
                    <span className="text-[10px] font-extrabold block mt-2">{formData.photoUploaded ? '✅ UPLOADED (doctor_headshot.png)' : 'CLICK TO SIMULATE UPLOAD'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: BANK DETAILS */}
            {currentStep === 6 && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                  <CreditCard className="text-[#0A6E6E] w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 6: Setup Withdrawal & Bank Account</h3>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                  Configure the bank account where your monthly/bi-weekly consultation consultation fees and payouts will be sent.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Account Holder Name (must match MCI profile)</label>
                    <input 
                      type="text" 
                      placeholder="As per bank passbook"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. HDFC Bank, ICICI, SBI"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Account Number</label>
                    <input 
                      type="text" 
                      placeholder="12 to 16 digit account number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Bank IFSC Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. HDFC0000124"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Account Type</label>
                    <select 
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none"
                    >
                      <option value="Savings">Savings Account</option>
                      <option value="Current">Current Account</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: REVIEW & SUBMIT */}
            {currentStep === 7 && (
              showPaymentScreen ? (
                <form onSubmit={handleSimulateSubscriptionPayment} className="flex flex-col gap-5">
                  <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                    <CreditCard className="text-[#0A6E6E] w-5 h-5" />
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 7: 1-Year Subscription Charge</h3>
                  </div>

                  <div className="bg-[#F0F7F7] border border-[#D1E5E5] p-6 rounded-xl flex flex-col gap-4 text-center">
                    <span className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-xl mx-auto border border-teal-100 font-extrabold">
                      ₹
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1A2B3C] uppercase tracking-wider">Doct Spark Provider Subscription</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        A flat fee of <strong>₹5,000 INR</strong> is charged for 1 year of platform maintenance, verified registry badge, automated patient routing, and digital prescription facilities.
                      </p>
                    </div>

                    <div className="border-t border-[#D1E5E5] pt-4 text-left max-w-md mx-auto w-full">
                      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2.5">Select Payment Option</span>
                      <div className="grid grid-cols-3 gap-2">
                        {['UPI', 'Card', 'Netbanking'].map(method => {
                          const isSelected = selectedPaymentMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setSelectedPaymentMethod(method)}
                              className={`py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${isSelected ? 'bg-[#0A6E6E] text-white border-[#0A6E6E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                            >
                              {method === 'UPI' ? '📱 UPI' : method === 'Card' ? '💳 Card' : '🏦 Netbank'}
                            </button>
                          );
                        })}
                      </div>

                      {selectedPaymentMethod === 'UPI' && (
                        <div className="mt-3">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">UPI ID (VPA) *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. name@okhdfc"
                            defaultValue="doctor.sharma@upi"
                            className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                          />
                        </div>
                      )}

                      {selectedPaymentMethod === 'Card' && (
                        <div className="mt-3 space-y-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Card Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="XXXX XXXX XXXX XXXX"
                              defaultValue="4111 2222 3333 4444"
                              className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">Expiry *</label>
                              <input
                                type="text"
                                required
                                placeholder="MM/YY"
                                defaultValue="12/29"
                                className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">CVV *</label>
                              <input
                                type="password"
                                required
                                placeholder="***"
                                defaultValue="123"
                                className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPaymentMethod === 'Netbanking' && (
                        <div className="mt-3">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Select Bank *</label>
                          <select className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]">
                            <option>HDFC Bank</option>
                            <option>ICICI Bank</option>
                            <option>State Bank of India</option>
                            <option>Axis Bank</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPaymentScreen(false)}
                      className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Back to Review
                    </button>
                    <button
                      type="submit"
                      disabled={paymentSimulating}
                      className="px-8 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white rounded-lg text-xs font-extrabold shadow disabled:opacity-50 cursor-pointer"
                    >
                      {paymentSimulating ? 'Processing Secure Payment...' : 'Pay ₹5,000 INR & Proceed'}
                    </button>
                  </div>
                </form>
              ) : showOtpVerification ? (
                referralStep ? (
                  <div className="flex flex-col gap-5">
                    <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="text-[#0A6E6E] w-5 h-5 animate-pulse" />
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 7: Partner Network Verification</h3>
                    </div>

                    <div className="text-center py-4 px-2">
                      <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Referral Partnership</span>
                      <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] font-heading">Referral Partner ID Verification</h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto font-medium">
                        If you are being onboarded or referred by a DOCT SPARK Partner (State or District Level), please enter their Partner Referral ID below.
                      </p>
                    </div>

                    {referralError && (
                      <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold">
                        ⚠️ {referralError}
                      </div>
                    )}

                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 space-y-4">
                      <div>
                        <label className="block text-xs text-[#1A2B3C] mb-1.5 font-bold">Referral Partner ID (Optional)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. ST-100001 or DT-200001"
                            value={referralIdInput}
                            onChange={(e) => {
                              setReferralIdInput(e.target.value.toUpperCase());
                              setReferralError('');
                            }}
                            className="flex-grow bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C] uppercase tracking-wider font-mono focus:border-[#0A6E6E]"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyReferralId}
                            className="px-4 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer"
                          >
                            Verify Referral ID
                          </button>
                        </div>
                      </div>

                      {verifiedPartner && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2 animate-fadeIn">
                          <span className="text-[9px] uppercase font-bold text-emerald-800 block">✓ Valid Referral Partner Details</span>
                          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                            <span className="text-emerald-800 font-semibold">Partner Name:</span>
                            <span className="text-emerald-950 font-black">{verifiedPartner.name}</span>
                            
                            <span className="text-emerald-800 font-semibold">Partner Level:</span>
                            <span className="text-emerald-950 font-bold">{verifiedPartner.partnerType} Level Partner</span>
                            
                            <span className="text-emerald-800 font-semibold">Territory:</span>
                            <span className="text-emerald-950 font-medium">
                              {verifiedPartner.partnerType === 'State' ? verifiedPartner.assignedState : `${verifiedPartner.assignedDistrict}, ${verifiedPartner.assignedState}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setShowOtpVerification(false)}
                        className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Cancel & Review
                      </button>
                      <div className="flex gap-2">
                        {!verifiedPartner ? (
                          <button
                            type="button"
                            onClick={(e) => handleProceedToOtp(e, false)}
                            className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-extrabold shadow cursor-pointer"
                          >
                            Skip / Direct Onboarding
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleProceedToOtp(e, true)}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold shadow animate-pulse cursor-pointer"
                          >
                            Proceed to OTP Verification
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyDoctorOtps} className="flex flex-col gap-5">
                    <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="text-[#0A6E6E] w-5 h-5 animate-pulse" />
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 7: Security Verification</h3>
                    </div>

                    <div className="text-center py-4 px-2">
                      <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Dual-Channel OTP Check</span>
                      <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] font-heading">Verify Mobile & Email</h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto font-medium">
                        For clinical audit and registry compliance, we have sent unique verification codes to your communication channels.
                      </p>
                    </div>

                    {verifiedPartner && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs flex items-center justify-between">
                        <div>
                          <p className="text-emerald-800 font-bold">Onboarding Linked Partner Referral ID</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">{verifiedPartner.referralId} - {verifiedPartner.name} ({verifiedPartner.partnerType})</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setVerifiedPartner(null);
                            setReferralStep(true);
                          }}
                          className="text-[10px] text-red-600 hover:underline font-bold cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                      {/* Mobile OTP column */}
                      <div className="bg-[#F0F7F7] p-5 rounded-xl border border-[#D1E5E5] flex flex-col gap-3.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-teal-600/10 text-teal-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl uppercase tracking-wider">SMS Channel</div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Mobile Phone</span>
                          <strong className="text-[#1A2B3C] text-sm">{formData.phone}</strong>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-lg p-2.5 text-[11px] leading-snug">
                          💡 <strong>Simulated SMS:</strong> Your verification code is <span className="font-mono font-bold text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{generatedMobileOtp}</span> (or bypass with <strong>1234</strong>)
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">Enter Mobile OTP</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            placeholder="XXXX"
                            value={mobileOtpCode}
                            onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-base tracking-[0.5em] font-mono font-bold outline-none text-[#1A2B3C] focus:ring-1 focus:ring-[#0A6E6E] transition-all"
                          />
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const code = String(Math.floor(1000 + Math.random() * 9000));
                              setGeneratedMobileOtp(code);
                              setErrorMessage('');
                            }}
                            className="text-[10px] font-bold text-[#0A6E6E] hover:underline cursor-pointer"
                          >
                            Resend SMS Code
                          </button>
                        </div>
                      </div>

                      {/* Email OTP column */}
                      <div className="bg-[#F0F7F7] p-5 rounded-xl border border-[#D1E5E5] flex flex-col gap-3.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-600/10 text-blue-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl uppercase tracking-wider">Email Channel</div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">Email Address</span>
                          <strong className="text-[#1A2B3C] text-sm truncate block">{formData.email}</strong>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 text-blue-950 rounded-lg p-2.5 text-[11px] leading-snug">
                          💡 <strong>Simulated Email:</strong> Your verification code is <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{generatedEmailOtp}</span> (or bypass with <strong>1234</strong>)
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">Enter Email OTP</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            placeholder="XXXX"
                            value={emailOtpCode}
                            onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-base tracking-[0.5em] font-mono font-bold outline-none text-[#1A2B3C] focus:ring-1 focus:ring-[#0A6E6E] transition-all"
                          />
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const code = String(Math.floor(1000 + Math.random() * 9000));
                              setGeneratedEmailOtp(code);
                              setErrorMessage('');
                            }}
                            className="text-[10px] font-bold text-[#0A6E6E] hover:underline cursor-pointer"
                          >
                            Resend Email Code
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => setReferralStep(true)}
                        className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Back to Referral ID
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white rounded-lg text-xs font-extrabold shadow cursor-pointer"
                      >
                        Verify OTP & Submit for Verification
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="text-[#0A6E6E] w-5 h-5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Step 7: Final Application Verification</h3>
                </div>

                <div className="bg-[#F0F7F7] p-5 rounded-xl border border-[#D1E5E5] text-xs font-semibold text-gray-700 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Dr. Name & Email</span>
                      <strong className="text-[#1A2B3C]">{formData.name}</strong> • {formData.email}
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Contact Phone</span>
                      <strong className="text-[#1A2B3C]">{formData.phone}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-gray-200">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Specialty & MCI License</span>
                      <strong className="text-[#1A2B3C]">{formData.specialty}</strong> (Reg: {formData.regNumber})
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Practice Address(es)</span>
                      {formData.clinics && formData.clinics.length > 0 ? (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {formData.clinics.map((c, i) => (
                            <div key={c.id} className="text-[11px] text-gray-700">
                              <span className="font-extrabold text-[#0A6E6E]">{i + 1}. {c.name}</span>{' '}
                              <span className="text-[9px] bg-[#0A6E6E]/10 text-[#0A6E6E] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {c.practiceType === 'Independent' ? 'Private' : c.practiceType === 'Clinic' ? 'Group' : 'Hospital'}
                              </span>
                              <div className="text-gray-500 font-semibold mt-0.5 pl-4">
                                {c.address}, {c.city}, {c.state} - {c.pincode}
                              </div>
                              {c.photos && c.photos.length > 0 && (
                                <div className="flex gap-1.5 mt-1.5 pl-4">
                                  {c.photos.map((p, pIdx) => (
                                    <div key={pIdx} className="w-10 h-7 rounded border border-gray-100 overflow-hidden shadow-sm">
                                      <img src={p} alt="Clinic photo review" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-700">
                          <strong className="text-[#1A2B3C]">{formData.clinicName}</strong>, {formData.address}, {formData.city}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pb-3 border-b border-gray-200">
                    <span className="text-gray-400 block text-[10px] uppercase mb-1.5">Consultation Fees & Availability per Location</span>
                    <div className="flex flex-col gap-2 mt-1">
                      {formData.clinics.map((c, i) => (
                        <div key={c.id} className="text-[11px] text-gray-700 bg-white/60 p-2.5 rounded-lg border border-gray-200/80">
                          <div className="flex justify-between items-center font-extrabold text-[#1A2B3C]">
                            <span>{i + 1}. {c.name}</span>
                            <span className="text-[9px] bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 rounded">
                              {c.consultType || 'Both'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 text-gray-500 font-semibold">
                            <div>
                              Fees:{' '}
                              {(c.consultType === 'Video' || c.consultType === 'Both') && (
                                <span className="text-blue-700 font-bold">Video: ₹{c.feeVideo || 400}</span>
                              )}
                              {c.consultType === 'Both' && ' • '}
                              {(c.consultType === 'In-Clinic' || c.consultType === 'Both') && (
                                <span className="text-teal-700 font-bold">In-Clinic: ₹{c.feeInClinic || 500}</span>
                              )}
                            </div>
                            <div className="md:text-right">
                              Days: <span className="text-gray-700 font-bold">{(c.availableDays || []).join(', ')}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1.5 border-t border-gray-100/50 pt-1.5 flex flex-wrap gap-1 items-center">
                            <span>Time Slots:</span>
                            {(c.availableSlots || ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']).map(slot => (
                              <span key={slot} className="bg-gray-100 text-gray-700 font-bold px-1 rounded text-[9px]">{slot}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Withdrawal Setup</span>
                      Bank: <strong className="text-[#1A2B3C]">{formData.bankName}</strong> ({formData.accountType})
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase">Account Number</span>
                      <strong className="text-gray-700">{formData.accountNumber}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <TermsConsentCheckbox 
                    documentId="doctor" 
                    isAccepted={formData.agreeToTerms} 
                    onChange={(val) => setFormData({ ...formData, agreeToTerms: val })} 
                  />
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-[#0A6E6E] hover:bg-[#F0F7F7]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.agreeToTerms}
                    className={`px-8 py-2.5 text-white rounded-lg text-xs font-extrabold shadow transition-all ${
                      formData.agreeToTerms ? 'bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 cursor-pointer' : 'bg-slate-300 cursor-not-allowed opacity-70'
                    }`}
                  >
                    Submit Verification Application
                  </button>
                </div>
              </form>
              )
            )}

            {/* STEP STEERING CONTROLS */}
            {currentStep < 7 && (
              <div className="border-t border-gray-100 pt-6 mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="px-5 py-2.5 border border-[#D1E5E5] rounded-lg text-xs font-bold text-[#0A6E6E] hover:bg-[#F0F7F7] disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
