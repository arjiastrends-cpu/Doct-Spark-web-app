import React from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Upload, Check, User, Phone, Mail, MapPin, Briefcase, FileText, GraduationCap, Award } from 'lucide-react';
import { indiaStatesData } from '../../data/indiaLocations';
import { Partner } from '../../types';
import { generatePartnerReferralId } from '../../data/referralUtils';
import { addAuditLog } from '../../data/commissionUtils';
import { logTermsAcceptance } from '../../data/termsUtils';
import TermsConsentCheckbox from '../common/TermsConsentCheckbox';

interface DocumentUploadFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value?: string;
  fileName?: string;
  onChange: (base64: string, name: string) => void;
  onClear: () => void;
}

function DocumentUploadField({
  id,
  label,
  required = false,
  value,
  fileName,
  onChange,
  onClear
}: DocumentUploadFieldProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a document or image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string, file.name);
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  return (
    <div className="space-y-1.5" id={id}>
      <label className="block text-xs text-[#1A2B3C] font-bold tracking-wide flex items-center justify-between">
        <span>{label}</span>
        {required ? (
          <span className="text-[9px] bg-rose-50 text-rose-600 font-extrabold px-2 py-0.5 rounded-full border border-rose-100">Required</span>
        ) : (
          <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full border border-slate-200">Optional</span>
        )}
      </label>
      
      {value ? (
        <div className="flex items-center justify-between border-2 border-emerald-100 bg-emerald-50/40 p-3 rounded-xl text-xs gap-3 shadow-inner hover:bg-emerald-50/70 transition-colors">
          <div className="flex items-center gap-3 truncate">
            {value.startsWith('data:image/') ? (
              <img src={value} alt="Preview" className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex flex-col items-center justify-center flex-shrink-0 text-emerald-800 font-black text-[10px] shadow-sm">
                <FileText className="w-4 h-4 mb-0.5 text-emerald-600" />
                <span>PDF</span>
              </div>
            )}
            <div className="truncate">
              <p className="font-extrabold text-slate-800 truncate text-[11px]">{fileName || "document.pdf"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-black bg-emerald-100 rounded-full p-0.5" />
                <span className="text-[9px] text-emerald-700 font-black uppercase tracking-wider">Ready for KYC</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 text-[10px] font-black text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 transition-all cursor-pointer text-center relative overflow-hidden group ${
            isDragging 
              ? 'border-[#0A6E6E] bg-[#E1F0F0]/40 shadow-md scale-[1.01]' 
              : 'border-[#C2E0E0] bg-white hover:border-[#0A6E6E] hover:bg-[#F0F7F7]/30 hover:shadow-sm'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#F0F7F7] border border-[#D1E5E5] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Upload className={`w-4 h-4 ${isDragging ? 'text-[#0A6E6E]' : 'text-slate-500'}`} />
          </div>
          <span className="text-[11px] font-extrabold text-[#1A2B3C] group-hover:text-[#0A6E6E] transition-colors">
            {isDragging ? "Drop document to upload!" : "Upload document file"}
          </span>
          <span className="text-[9px] text-gray-400 mt-1">Drag & drop or <span className="text-[#0A6E6E] font-bold underline">browse files</span></span>
          <span className="text-[8px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">PDF, PNG, JPG up to 5MB</span>
          <input
            type="file"
            accept=".pdf, image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </label>
      )}
    </div>
  );
}

interface PartnerRegisterProps {
  setView: (view: string) => void;
  onAddPartner?: (partner: Partner) => void;
  creatorType?: 'Admin' | 'StatePartner' | 'DistrictPartner';
  creatorState?: string;
  creatorDistrict?: string;
}

export default function PartnerRegister({ 
  setView, 
  onAddPartner,
  creatorType,
  creatorState,
  creatorDistrict
}: PartnerRegisterProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [registeredReferralId, setRegisteredReferralId] = React.useState('');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);

  // Core Form Fields
  const [name, setName] = React.useState('');
  const [profilePhoto, setProfilePhoto] = React.useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200');
  const [dob, setDob] = React.useState('');
  const [age, setAge] = React.useState('30');
  const [gender, setGender] = React.useState('Male');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [state, setState] = React.useState(
    creatorType === 'StatePartner' && creatorState ? creatorState : 'Maharashtra'
  );
  const [district, setDistrict] = React.useState('');
  const [pincode, setPincode] = React.useState('');

  const [aadhaarNumber, setAadhaarNumber] = React.useState('');
  const [panNumber, setPanNumber] = React.useState('');
  const [voterIdNumber, setVoterIdNumber] = React.useState('');

  // Brand new rich details
  const [fatherOrHusbandName, setFatherOrHusbandName] = React.useState('');
  const [ownsBike, setOwnsBike] = React.useState(true);
  const [bikeRegistrationNumber, setBikeRegistrationNumber] = React.useState('');
  const [bikeModel, setBikeModel] = React.useState('');
  const [bikeMileage, setBikeMileage] = React.useState('');
  const [hasBikeInsurance, setHasBikeInsurance] = React.useState(true);
  const [hasDrivingLicense, setHasDrivingLicense] = React.useState(true);
  const [drivingLicenseNumber, setDrivingLicenseNumber] = React.useState('');
  const [languagesSpokenWritten, setLanguagesSpokenWritten] = React.useState('English, Hindi, Marathi');
  const [aboutPartner500Words, setAboutPartner500Words] = React.useState('');
  const [alternatePhone, setAlternatePhone] = React.useState('');
  const [emergencyContactName, setEmergencyContactName] = React.useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState('');

  const [qualification, setQualification] = React.useState('Post Graduate (MBA)');
  const [experience, setExperience] = React.useState('5 Years');
  const [occupation, setOccupation] = React.useState('Healthcare Consultant');
  const [skills, setSkills] = React.useState('Territory Management, Doctor Relations, Sales');

  const [partnerType, setPartnerType] = React.useState<'State' | 'District' | 'City'>(
    creatorType === 'DistrictPartner' ? 'City' : 'District'
  );
  const [assignedState, setAssignedState] = React.useState(
    (creatorType === 'StatePartner' || creatorType === 'DistrictPartner') && creatorState ? creatorState : 'Maharashtra'
  );
  const [assignedDistrict, setAssignedDistrict] = React.useState(
    (creatorType === 'StatePartner' || creatorType === 'DistrictPartner') && creatorDistrict ? creatorDistrict : ''
  );
  const [assignedCity, setAssignedCity] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Document Upload States
  const [highestQualificationDoc, setHighestQualificationDoc] = React.useState('');
  const [highestQualificationFileName, setHighestQualificationFileName] = React.useState('');
  const [experienceCertificateDoc, setExperienceCertificateDoc] = React.useState('');
  const [experienceCertificateFileName, setExperienceCertificateFileName] = React.useState('');
  const [identityProofDoc, setIdentityProofDoc] = React.useState('');
  const [identityProofFileName, setIdentityProofFileName] = React.useState('');
  const [otherDoc, setOtherDoc] = React.useState('');
  const [otherDocFileName, setOtherDocFileName] = React.useState('');

  const [existingPartners, setExistingPartners] = React.useState<Partner[]>(() => {
    const saved = localStorage.getItem('ds_partners');
    return saved ? JSON.parse(saved) : [];
  });

  const isStateAssigned = (stateName: string) => {
    return existingPartners.some(p => p.partnerType === 'State' && p.assignedState === stateName && p.status !== 'Rejected');
  };

  const isDistrictAssigned = (stateName: string, distName: string) => {
    return existingPartners.some(p => p.partnerType === 'District' && p.assignedState === stateName && p.assignedDistrict === distName && p.status !== 'Rejected');
  };

  const isCityAssigned = (stateName: string, distName: string, cityName: string) => {
    return existingPartners.some(p => p.partnerType === 'City' && p.assignedState === stateName && p.assignedDistrict === distName && p.assignedCity === cityName && p.status !== 'Rejected');
  };

  // OTP Verification States
  const [isPhoneVerified, setIsPhoneVerified] = React.useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = React.useState(false);
  const [phoneOtpInput, setPhoneOtpInput] = React.useState('');
  const [phoneGeneratedOtp, setPhoneGeneratedOtp] = React.useState('');

  const [isEmailVerified, setIsEmailVerified] = React.useState(false);
  const [emailOtpSent, setEmailOtpSent] = React.useState(false);
  const [emailOtpInput, setEmailOtpInput] = React.useState('');
  const [emailGeneratedOtp, setEmailGeneratedOtp] = React.useState('');

  const handlePhoneChange = (val: string) => {
    // Only permit digits
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    setIsPhoneVerified(false);
    setPhoneOtpSent(false);
    setPhoneOtpInput('');
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setIsEmailVerified(false);
    setEmailOtpSent(false);
    setEmailOtpInput('');
  };

  const handleSendPhoneOtp = () => {
    if (!phone || phone.length !== 10) {
      setErrorMsg('Please specify a valid 10-digit mobile number before sending OTP.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPhoneGeneratedOtp(code);
    setPhoneOtpSent(true);
    setPhoneOtpInput('');
    setErrorMsg('');
  };

  const handleVerifyPhoneOtp = () => {
    if (phoneOtpInput === phoneGeneratedOtp) {
      setIsPhoneVerified(true);
      setPhoneOtpSent(false);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid Mobile OTP. Please double-check or try resending.');
    }
  };

  const handleSendEmailOtp = () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address before sending OTP.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setEmailGeneratedOtp(code);
    setEmailOtpSent(true);
    setEmailOtpInput('');
    setErrorMsg('');
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtpInput === emailGeneratedOtp) {
      setIsEmailVerified(true);
      setEmailOtpSent(false);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid Email OTP. Please double-check or try resending.');
    }
  };

  // Selected State's districts for dynamic district picker
  const selectedStateData = React.useMemo(() => {
    return indiaStatesData.find(s => s.state === assignedState) || indiaStatesData[0];
  }, [assignedState]);

  React.useEffect(() => {
    if (selectedStateData && selectedStateData.districts.length > 0) {
      setAssignedDistrict(selectedStateData.districts[0].name);
    } else {
      setAssignedDistrict('');
    }
  }, [selectedStateData]);

  // Selected District's cities for dynamic city picker
  const selectedDistrictData = React.useMemo(() => {
    return selectedStateData?.districts.find(d => d.name === assignedDistrict) || null;
  }, [selectedStateData, assignedDistrict]);

  React.useEffect(() => {
    if (selectedDistrictData && selectedDistrictData.cities.length > 0) {
      setAssignedCity(selectedDistrictData.cities[0]);
    } else {
      setAssignedCity('');
    }
  }, [selectedDistrictData]);

  // General state selection for residential address
  const residentialStateData = React.useMemo(() => {
    return indiaStatesData.find(s => s.state === state) || indiaStatesData[0];
  }, [state]);

  React.useEffect(() => {
    if (residentialStateData && residentialStateData.districts.length > 0) {
      setDistrict(residentialStateData.districts[0].name);
    } else {
      setDistrict('');
    }
  }, [residentialStateData]);

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!name || !dob || !phone || !email || !address || !pincode) {
        setErrorMsg('Please enter all required personal information fields.');
        return;
      }
      if (!phone.match(/^\d{10}$/)) {
        setErrorMsg('Please specify a valid 10-digit mobile number.');
        return;
      }
      if (!email.includes('@')) {
        setErrorMsg('Please specify a valid email address.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!aadhaarNumber || !panNumber || !voterIdNumber) {
        setErrorMsg('Aadhaar, PAN, and Voter ID card details are mandatory for regulatory KYC.');
        return;
      }
      if (aadhaarNumber.length < 12) {
        setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
        return;
      }
      if (panNumber.length < 10) {
        setErrorMsg('Please enter a valid 10-character PAN number.');
        return;
      }
      if (voterIdNumber.length < 10) {
        setErrorMsg('Please enter a valid 10-character Voter ID Card Number.');
        return;
      }
      if (!identityProofDoc) {
        setErrorMsg('Please upload a scanned copy of your Identity Proof (Aadhaar / PAN Card / Voter ID scan) to proceed.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Dynamic unique location assignment validation (frontend and backend prevention)
    if (partnerType === 'State') {
      if (isStateAssigned(assignedState)) {
        setErrorMsg('A State Partner is already assigned for this state.');
        return;
      }
    } else if (partnerType === 'District') {
      if (isDistrictAssigned(assignedState, assignedDistrict)) {
        setErrorMsg('A District Partner is already assigned for this district.');
        return;
      }
    } else if (partnerType === 'City') {
      if (isCityAssigned(assignedState, assignedDistrict, assignedCity)) {
        setErrorMsg('A City Partner is already assigned for this city.');
        return;
      }
    }

    if (!isPhoneVerified) {
      setErrorMsg('Mobile OTP verification is mandatory before registration submission.');
      return;
    }

    if (!isEmailVerified) {
      setErrorMsg('Email OTP verification is mandatory before registration submission.');
      return;
    }

    if (!qualification || !occupation || !password) {
      setErrorMsg('Please fill in your qualifications, occupation, and choose a secure portal password.');
      return;
    }

    if (!highestQualificationDoc) {
      setErrorMsg('Please upload your Highest Qualification Document before submitting.');
      return;
    }

    if (!experienceCertificateDoc) {
      setErrorMsg('Please upload your Experience Certificate before submitting.');
      return;
    }

    if (!fatherOrHusbandName) {
      setErrorMsg('Father or Husband\'s Name is required.');
      return;
    }

    if (ownsBike) {
      if (!bikeRegistrationNumber) {
        setErrorMsg('Please specify your Bike Registration Number as you selected owning a bike.');
        return;
      }
      if (!bikeModel) {
        setErrorMsg('Please specify your Bike Model.');
        return;
      }
      if (!bikeMileage) {
        setErrorMsg('Please specify your Bike Mileage.');
        return;
      }
    }

    if (hasDrivingLicense) {
      if (!drivingLicenseNumber) {
        setErrorMsg('Please specify your Driving License Number as you selected having a valid license.');
        return;
      }
    }

    if (!languagesSpokenWritten) {
      setErrorMsg('Please enter the languages you speak or write.');
      return;
    }

    const wordCount = aboutPartner500Words.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      setErrorMsg(`Please write a detailed profile write-up (Currently: ${wordCount} words. Minimum 100 words required for operational KYC review).`);
      return;
    }

    // Store in LocalStorage
    const savedPartners = localStorage.getItem('ds_partners');
    const list = savedPartners ? JSON.parse(savedPartners) : [];
    
    const generatedRefId = generatePartnerReferralId(partnerType, list);

    const newPartner: Partner = {
      id: `part-${Date.now()}`,
      name: name.trim(),
      profilePhoto: profilePhoto,
      dob: dob,
      age: Number(age) || 30,
      gender: gender,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      state: state,
      district: district,
      pincode: pincode.trim(),
      aadhaarNumber: aadhaarNumber.trim(),
      panNumber: panNumber.trim().toUpperCase(),
      voterIdNumber: voterIdNumber.trim().toUpperCase(),
      fatherOrHusbandName: fatherOrHusbandName.trim(),
      ownsBike: ownsBike,
      bikeRegistrationNumber: ownsBike ? bikeRegistrationNumber.trim() : undefined,
      bikeModel: ownsBike ? bikeModel.trim() : undefined,
      bikeMileage: ownsBike ? bikeMileage.trim() : undefined,
      hasBikeInsurance: ownsBike ? hasBikeInsurance : undefined,
      hasDrivingLicense: hasDrivingLicense,
      drivingLicenseNumber: hasDrivingLicense ? drivingLicenseNumber.trim().toUpperCase() : undefined,
      languagesSpokenWritten: languagesSpokenWritten.trim(),
      aboutPartner500Words: aboutPartner500Words.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      qualification: qualification.trim(),
      highestQualificationDoc: highestQualificationDoc || undefined,
      highestQualificationFileName: highestQualificationFileName || undefined,
      experience: experience.trim(),
      experienceCertificateDoc: experienceCertificateDoc || undefined,
      experienceCertificateFileName: experienceCertificateFileName || undefined,
      identityProofDoc: identityProofDoc || undefined,
      identityProofFileName: identityProofFileName || undefined,
      otherDoc: otherDoc || undefined,
      otherDocFileName: otherDocFileName || undefined,
      occupation: occupation.trim(),
      skills: skills.trim(),
      partnerType: partnerType,
      assignedState: assignedState,
      assignedDistrict: (partnerType === 'District' || partnerType === 'City') ? assignedDistrict : undefined,
      assignedCity: partnerType === 'City' ? assignedCity : undefined,
      status: 'Pending Verification',
      onboardedDoctorsCount: 0,
      onboardedClinicsCount: 0,
      walletBalance: 0,
      referralId: generatedRefId
    };

    setRegisteredReferralId(generatedRefId);

    // Add credentials and details
    list.push({ ...newPartner, password: password });
    localStorage.setItem('ds_partners', JSON.stringify(list));

    // Save partner credentials to local accounts for login fallback
    try {
      const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
      const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
      localAccounts[email.trim().toLowerCase()] = {
        email: email.trim().toLowerCase(),
        password: password,
        name: name.trim(),
        role: 'partner'
      };
      localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));
    } catch (err) {
      console.warn('Failed to save partner to local accounts:', err);
    }

    // Every verification / routing action must be recorded in the audit log
    const territoryDesc = newPartner.partnerType === 'State' 
      ? newPartner.assignedState 
      : newPartner.partnerType === 'District' 
        ? `${newPartner.assignedDistrict}, ${newPartner.assignedState}` 
        : `${newPartner.assignedCity}, ${newPartner.assignedDistrict}, ${newPartner.assignedState}`;

    addAuditLog(
      'Partner Registered (Self)',
      newPartner.name,
      `Self-registered as ${newPartner.partnerType} Partner for ${territoryDesc}. System routed verification request as: "${newPartner.status}".`
    );

    if (onAddPartner) {
      onAddPartner(newPartner);
    }

    // Log official T&C acceptance
    try {
      logTermsAcceptance(
        newPartner.email.toLowerCase().trim(),
        newPartner.name.trim(),
        newPartner.email.toLowerCase().trim(),
        'partner',
        '1.0'
      );
    } catch (logErr) {
      console.error('Failed to log partner terms acceptance:', logErr);
    }

    setSuccess(true);
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 bg-slate-50" id="partner-register-root">
      <div className="max-w-2xl w-full bg-white rounded-2xl border border-[#D1E5E5] p-6 md:p-8 shadow-md">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] font-heading">Partner Registration Form</h2>
            <p className="text-[10px] text-gray-400">Join the DOCT SPARK medical service directory expansion</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A6E6E]">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#0A6E6E] text-white' : 'bg-[#F0F7F7]'}`}>1</span>
            <span className="text-gray-300">/</span>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#0A6E6E] text-white' : 'bg-[#F0F7F7]'}`}>2</span>
            <span className="text-gray-300">/</span>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-[#0A6E6E] text-white' : 'bg-[#F0F7F7]'}`}>3</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-5">
            ⚠️ {errorMsg}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100 animate-bounce">
              ✓
            </div>
            <h3 className="text-lg font-bold text-[#1A2B3C] font-heading">Application Submitted Successfully!</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
              Your DOCT SPARK Partner Application for <strong>{partnerType} Level Partner ({partnerType === 'State' ? assignedState : partnerType === 'District' ? `${assignedDistrict}, ${assignedState}` : `${assignedCity}, ${assignedDistrict}, ${assignedState}`})</strong> is now under verification review.
            </p>
            
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 my-5 text-left text-xs max-w-sm mx-auto">
              <span className="text-[9px] uppercase font-bold text-emerald-800 block mb-1">Generated Referral ID (Permanent)</span>
              <strong className="text-sm text-emerald-900 block tracking-wider font-mono bg-white border border-emerald-100 px-2 py-1 rounded text-center">{registeredReferralId}</strong>
              <div className="text-gray-500 text-[9px] mt-2 italic">This ID is permanent. Doctors & clinics onboarded through your network will verify this Referral ID.</div>
            </div>

            <div className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-xl p-4 my-6 text-left text-xs max-w-sm mx-auto">
              <span className="text-[9px] uppercase font-bold text-[#0A6E6E] block mb-1">Approval Hierarchy Pipeline</span>
              <p className="text-gray-600">
                {(partnerType === 'District' || partnerType === 'City') ? 'State Partner Review ➔ Super Admin Activation' : 'Super Admin Activation Review'}
              </p>
              <div className="text-gray-400 text-[9px] mt-2 italic">You can login using password choice once activated!</div>
            </div>
            <button
              onClick={() => {
                if (creatorType) {
                  setView('close-modal');
                } else {
                  setView('login');
                }
              }}
              className="px-6 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {creatorType ? 'Close Wizard & Refresh' : 'Return to Login Portal'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Personal Information</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1.5 font-bold">Profile Photo *</label>
                    <div className="flex items-center gap-3 bg-[#F0F7F7] border border-[#D1E5E5] p-3 rounded-xl">
                      <div className="relative group w-14 h-14 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex-shrink-0">
                        <img 
                          src={profilePhoto} 
                          alt="Partner Profile Preview" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div 
                          onClick={() => {
                            const mockAvatars = [
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
                              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
                              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
                            ];
                            // Pick a random avatar from the list that is different from current
                            const filtered = mockAvatars.filter(a => a !== profilePhoto);
                            const chosen = filtered[Math.floor(Math.random() * filtered.length)];
                            setProfilePhoto(chosen);
                          }}
                          className="border border-dashed border-[#A5CECE] hover:border-[#0A6E6E] bg-white rounded-lg p-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 hover:bg-[#F0F7F7]/30"
                        >
                          <div className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-[#0A6E6E]" />
                            <span className="text-[10px] font-extrabold text-[#0A6E6E] uppercase tracking-wider">Upload Profile Photo</span>
                          </div>
                          <p className="text-[8px] text-gray-400">Click to simulate professional headshot capture</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Father's or Husband's Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter Father's or Husband's Full Legal Name"
                    value={fatherOrHusbandName}
                    onChange={(e) => setFatherOrHusbandName(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Date of Birth *</label>
                    <input 
                      type="date" 
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Age *</label>
                    <input 
                      type="number" 
                      required
                      min="18"
                      max="100"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Gender *</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Mobile Number *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Email ID *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Alternate Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="Secondary contact number"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Emergency Contact Person</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Spouse / Sibling"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Emergency Contact Number</label>
                    <input 
                      type="tel" 
                      placeholder="Emergency phone number"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Residential Address *</label>
                  <textarea 
                    required
                    placeholder="Enter permanent or corporate address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C] h-16"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">State *</label>
                    <select 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    >
                      {indiaStatesData.map((s) => (
                        <option key={s.state} value={s.state}>{s.state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">District *</label>
                    <select 
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    >
                      {residentialStateData.districts.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Pincode *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="6-digit pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (creatorType) {
                        setView('close-modal');
                      } else {
                        setView('login');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    Continue to KYC <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Identity details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Identity Details (National Verification ID)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Aadhaar Card Number *</label>
                    <input 
                      type="text" 
                      maxLength={12}
                      required
                      placeholder="12-digit Aadhaar number"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">PAN Card Number *</label>
                    <input 
                      type="text" 
                      maxLength={10}
                      required
                      placeholder="10-character PAN card"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Voter ID Card Number *</label>
                    <input 
                      type="text" 
                      maxLength={10}
                      required
                      placeholder="10-digit Voter ID number"
                      value={voterIdNumber}
                      onChange={(e) => setVoterIdNumber(e.target.value.toUpperCase())}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2"></div>

                {/* Identity Proof Document Card */}
                <div className="bg-gradient-to-br from-[#F0F7F7] to-[#E8F3F3] border-2 border-[#D1E5E5] p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[#D1E5E5]/60">
                    <div className="p-2 rounded-xl bg-[#0A6E6E]/10 text-[#0A6E6E] shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wider">Upload Identity Proof Document *</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Scanned copy of Aadhaar, PAN Card, or Voter ID Card scan</p>
                    </div>
                  </div>
                  <DocumentUploadField
                    id="identity-proof-upload"
                    label="Identity Proof (Aadhaar / PAN Card / Voter ID Scan)"
                    required={true}
                    value={identityProofDoc}
                    fileName={identityProofFileName}
                    onChange={(base64, name) => {
                      setIdentityProofDoc(base64);
                      setIdentityProofFileName(name);
                    }}
                    onClear={() => {
                      setIdentityProofDoc('');
                      setIdentityProofFileName('');
                    }}
                  />
                  <p className="text-[10px] text-slate-500 mt-2.5 leading-normal">Please provide a scanned copy or clear photograph of your official Government Identity Card (Aadhaar, PAN, or Voter ID) for administrative KYC cross-referencing.</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
                  <div className="text-lg">🛡️</div>
                  <div>
                    <span className="font-bold block mb-0.5">Government ID Verification Notice</span>
                    Your Aadhaar, PAN, and Voter ID Card details are cross-verified with UIDAI, NSDL, & Electoral Commission databases prior to activation. Any incorrect details will result in application rejection.
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    Professional Profile <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Professional info & partner config */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Professional Background & Territory Settings</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Highest Educational Qualification *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Master in Public Health"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Total Work Experience *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 8 Years"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                </div>

                {/* Document Uploads Center */}
                <div className="space-y-4">
                  <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">📁 Professional Credential Documents</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Qualification Card */}
                    <div className="bg-gradient-to-br from-[#F0F7F7] to-[#E8F3F3] border-2 border-[#D1E5E5] p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-2 rounded-lg bg-[#0A6E6E]/10 text-[#0A6E6E] shadow-xs">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wide">Highest Qualification *</h4>
                          <p className="text-[9px] text-slate-500 font-medium">Scanned copy of degree/diploma certificate</p>
                        </div>
                      </div>
                      <DocumentUploadField
                        id="qualification-doc-upload"
                        label="Upload Qualification Document"
                        required={true}
                        value={highestQualificationDoc}
                        fileName={highestQualificationFileName}
                        onChange={(base64, name) => {
                          setHighestQualificationDoc(base64);
                          setHighestQualificationFileName(name);
                        }}
                        onClear={() => {
                          setHighestQualificationDoc('');
                          setHighestQualificationFileName('');
                        }}
                      />
                    </div>

                    {/* Experience Certificate Card */}
                    <div className="bg-gradient-to-br from-[#F0F7F7] to-[#E8F3F3] border-2 border-[#D1E5E5] p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-2 rounded-lg bg-[#0A6E6E]/10 text-[#0A6E6E] shadow-xs">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wide">Experience Certificate *</h4>
                          <p className="text-[9px] text-slate-500 font-medium">Service proof or previous job certificates</p>
                        </div>
                      </div>
                      <DocumentUploadField
                        id="experience-cert-upload"
                        label="Upload Experience Certificate"
                        required={true}
                        value={experienceCertificateDoc}
                        fileName={experienceCertificateFileName}
                        onChange={(base64, name) => {
                          setExperienceCertificateDoc(base64);
                          setExperienceCertificateFileName(name);
                        }}
                        onClear={() => {
                          setExperienceCertificateDoc('');
                          setExperienceCertificateFileName('');
                        }}
                      />
                    </div>

                    {/* Other Document Card */}
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#F0F7F7] to-[#E8F3F3] border-2 border-[#D1E5E5] p-4 rounded-xl shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-2 rounded-lg bg-[#0A6E6E]/10 text-[#0A6E6E] shadow-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[#1A2B3C] uppercase tracking-wide">Any Other Document (Optional)</h4>
                          <p className="text-[9px] text-slate-500 font-medium">Supplementary business profiles, awards, or custom credentials</p>
                        </div>
                      </div>
                      <DocumentUploadField
                        id="other-doc-upload"
                        label="Upload Supporting Credentials"
                        required={false}
                        value={otherDoc}
                        fileName={otherDocFileName}
                        onChange={(base64, name) => {
                          setOtherDoc(base64);
                          setOtherDocFileName(name);
                        }}
                        onClear={() => {
                          setOtherDoc('');
                          setOtherDocFileName('');
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Current Occupation *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Healthcare Network Agent"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="Marketing, Negotiation, Relations"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2"></div>

                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Vehicle, Mobility & Licenses</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-gray-100 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1.5 font-bold">Do you own a two-wheeler / bike? *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOwnsBike(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${ownsBike ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setOwnsBike(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${!ownsBike ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1.5 font-bold">Do you have a valid Driving License? *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasDrivingLicense(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${hasDrivingLicense ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasDrivingLicense(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${!hasDrivingLicense ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasDrivingLicense && (
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs text-[#1A2B3C] mb-1 font-bold">Driving License Number *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter Driving License Number (e.g. DL-1420110068769)"
                        value={drivingLicenseNumber}
                        onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                      />
                    </div>
                  )}

                  {ownsBike && (
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-200/60">
                      <div>
                        <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Bike Model *</label>
                        <input 
                          type="text"
                          placeholder="e.g. Honda Activa / Splendor"
                          value={bikeModel}
                          onChange={(e) => setBikeModel(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Bike Registration Number *</label>
                        <input 
                          type="text"
                          placeholder="e.g. MH-12-AB-1234"
                          value={bikeRegistrationNumber}
                          onChange={(e) => setBikeRegistrationNumber(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Bike Average Mileage (km/L) *</label>
                        <input 
                          type="text"
                          placeholder="e.g. 50"
                          value={bikeMileage}
                          onChange={(e) => setBikeMileage(e.target.value)}
                          className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-3">
                        <label className="block text-xs text-[#1A2B3C] mb-1.5 font-bold">Do you have active Bike Insurance? *</label>
                        <div className="flex gap-2 max-w-xs">
                          <button
                            type="button"
                            onClick={() => setHasBikeInsurance(true)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${hasBikeInsurance ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setHasBikeInsurance(false)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${!hasBikeInsurance ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2"></div>

                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Languages & Communication Profile</span>
                
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl space-y-3">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Languages You Can Speak and Write *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. English, Hindi, Marathi, Telugu"
                      value={languagesSpokenWritten}
                      onChange={(e) => setLanguagesSpokenWritten(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Specify all languages you can comfortably write and speak with local doctors and clinical managers.</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2"></div>

                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Write About Yourself / Statement of Purpose *</span>
                  <span className="text-[10px] font-bold text-gray-400">Target: ~500 Words</span>
                </div>
                
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl space-y-3">
                  <div>
                    <textarea 
                      required
                      placeholder="Write a detailed self-description. Discuss your background, why you wish to join DOCT SPARK, your experience in healthcare network operations, and how you will manage your assigned territory (approximately 500 words requested)."
                      value={aboutPartner500Words}
                      onChange={(e) => setAboutPartner500Words(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C] h-40 font-sans"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-gray-400">Please provide a complete layout of your operational plan.</span>
                      <span className={`text-[10px] font-black ${aboutPartner500Words.trim().split(/\s+/).filter(Boolean).length >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        Word Count: {aboutPartner500Words.trim().split(/\s+/).filter(Boolean).length} / 500 words
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2"></div>

                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Partner Role & Territory Allocation</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Select Partner Type *</label>
                    <div className="flex gap-2">
                      {creatorType === 'DistrictPartner' ? (
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2 text-xs font-bold rounded-lg border border-[#0A6E6E] bg-[#E1F0F0] text-[#0A6E6E]"
                        >
                          City Level Partner
                        </button>
                      ) : creatorType === 'StatePartner' ? (
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2 text-xs font-bold rounded-lg border border-[#0A6E6E] bg-[#E1F0F0] text-[#0A6E6E]"
                        >
                          District Level Partner
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPartnerType('State')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${partnerType === 'State' ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            State Level
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartnerType('District')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${partnerType === 'District' ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            District Level
                          </button>
                          <button
                            type="button"
                            onClick={() => setPartnerType('City')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${partnerType === 'City' ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E]' : 'bg-white text-gray-500 border-gray-200'}`}
                          >
                            City Level
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#0A6E6E] font-bold mb-1">Choose Assigned State *</label>
                    <select 
                      value={assignedState}
                      onChange={(e) => setAssignedState(e.target.value)}
                      disabled={creatorType === 'StatePartner' || creatorType === 'DistrictPartner'}
                      className={`w-full bg-white border border-[#0A6E6E] p-2.5 rounded-lg text-xs font-bold text-[#1A2B3C] ${(creatorType === 'StatePartner' || creatorType === 'DistrictPartner') ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500' : ''}`}
                    >
                      {indiaStatesData.map((s) => (
                        <option key={s.state} value={s.state} disabled={partnerType === 'State' && isStateAssigned(s.state)}>
                          {s.state}{partnerType === 'State' && isStateAssigned(s.state) ? ' - Already Assigned' : ''}
                        </option>
                      ))}
                    </select>
                    {partnerType === 'State' && isStateAssigned(assignedState) && (
                      <p className="text-rose-600 font-bold text-[11px] mt-1">A State Partner is already assigned for this state.</p>
                    )}
                  </div>
                </div>

                {(partnerType === 'District' || partnerType === 'City') && (
                  <div>
                    <label className="block text-xs text-[#0A6E6E] font-bold mb-1">Choose Assigned Working District *</label>
                    <select 
                      value={assignedDistrict}
                      onChange={(e) => setAssignedDistrict(e.target.value)}
                      className="w-full bg-white border border-[#0A6E6E] p-2.5 rounded-lg text-xs font-bold text-[#1A2B3C]"
                    >
                      {selectedStateData.districts.map((d) => (
                        <option key={d.name} value={d.name} disabled={partnerType === 'District' && isDistrictAssigned(assignedState, d.name)}>
                          {d.name}{partnerType === 'District' && isDistrictAssigned(assignedState, d.name) ? ' - Already Assigned' : ''}
                        </option>
                      ))}
                    </select>
                    {partnerType === 'District' && isDistrictAssigned(assignedState, assignedDistrict) && (
                      <p className="text-rose-600 font-bold text-[11px] mt-1">A District Partner is already assigned for this district.</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">You will only be authorized to onboard clinical establishments within this assigned territory.</p>
                  </div>
                )}

                {partnerType === 'City' && (
                  <div>
                    <label className="block text-xs text-[#0A6E6E] font-bold mb-1">Choose Assigned Working City *</label>
                    <select 
                      value={assignedCity}
                      onChange={(e) => setAssignedCity(e.target.value)}
                      className="w-full bg-white border border-[#0A6E6E] p-2.5 rounded-lg text-xs font-bold text-[#1A2B3C]"
                    >
                      {selectedDistrictData?.cities.map((c) => (
                        <option key={c} value={c} disabled={isCityAssigned(assignedState, assignedDistrict, c)}>
                          {c}{isCityAssigned(assignedState, assignedDistrict, c) ? ' - Already Assigned' : ''}
                        </option>
                      )) || <option value="">No Cities Found</option>}
                    </select>
                    {isCityAssigned(assignedState, assignedDistrict, assignedCity) && (
                      <p className="text-rose-600 font-bold text-[11px] mt-1">A City Partner is already assigned for this city.</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">You will only be authorized to onboard clinical establishments within this assigned working city.</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4 mt-2"></div>

                <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block mb-1">Contact Verification (OTP) *</span>
                <p className="text-[10px] text-gray-400 mb-3">Please verify your registered Mobile Number and Email ID using the secure OTP options below to complete your registration.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-teal-50/40 border border-[#D1E5E5]/50 p-4 rounded-xl">
                  {/* Mobile Number OTP Section */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs text-[#1A2B3C] font-bold">Mobile Number: <span className="text-slate-600">{phone || 'N/A'}</span></label>
                      {isPhoneVerified ? (
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ✗ Not Verified
                        </span>
                      )}
                    </div>
                    
                    {!isPhoneVerified && (
                      <div className="space-y-2">
                        {!phoneOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={!phone || phone.length !== 10}
                            className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#085a5a] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                          >
                            Send Mobile OTP
                          </button>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-amber-800 font-extrabold uppercase">
                              <span>💬 Simulated SMS Portal</span>
                              <span className="bg-amber-200/70 px-2 py-0.5 rounded text-amber-950 animate-pulse">OTP: {phoneGeneratedOtp}</span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit OTP"
                                value={phoneOtpInput}
                                onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 bg-white border border-amber-300 p-2 rounded-lg text-xs text-center font-mono font-bold tracking-widest text-[#1A2B3C]"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyPhoneOtp}
                                className="px-4 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                              >
                                Verify
                              </button>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-amber-700 font-medium">
                              <span>Didn't receive code?</span>
                              <button
                                type="button"
                                onClick={handleSendPhoneOtp}
                                className="font-bold underline hover:text-amber-900 cursor-pointer text-[10px]"
                              >
                                Resend
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isPhoneVerified && (
                      <div className="text-center py-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 font-bold border border-emerald-200">
                        Mobile Number Verified Successfully!
                      </div>
                    )}
                  </div>

                  {/* Email ID OTP Section */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs text-[#1A2B3C] font-bold">Email ID: <span className="text-slate-600 truncate max-w-[120px] inline-block align-bottom">{email || 'N/A'}</span></label>
                      {isEmailVerified ? (
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ✗ Not Verified
                        </span>
                      )}
                    </div>

                    {!isEmailVerified && (
                      <div className="space-y-2">
                        {!emailOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendEmailOtp}
                            disabled={!email || !email.includes('@')}
                            className="w-full py-2.5 bg-[#0A6E6E] hover:bg-[#085a5a] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
                          >
                            Send Email OTP
                          </button>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-amber-800 font-extrabold uppercase">
                              <span>📧 Simulated Email Portal</span>
                              <span className="bg-amber-200/70 px-2 py-0.5 rounded text-amber-950 animate-pulse">OTP: {emailGeneratedOtp}</span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit OTP"
                                value={emailOtpInput}
                                onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 bg-white border border-amber-300 p-2 rounded-lg text-xs text-center font-mono font-bold tracking-widest text-[#1A2B3C]"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyEmailOtp}
                                className="px-4 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                              >
                                Verify
                              </button>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-amber-700 font-medium">
                              <span>Didn't receive email?</span>
                              <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                className="font-bold underline hover:text-amber-900 cursor-pointer text-[10px]"
                              >
                                Resend
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isEmailVerified && (
                      <div className="text-center py-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 font-bold border border-emerald-200">
                        Email Address Verified Successfully!
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2"></div>

                <div>
                  <label className="block text-xs text-[#1A2B3C] mb-1 font-semibold">Choose Secure Sign-In Password *</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Enter password for portal log-in"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold text-[#1A2B3C]"
                  />
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <TermsConsentCheckbox 
                    documentId="partner" 
                    isAccepted={agreeToTerms} 
                    onChange={setAgreeToTerms} 
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!agreeToTerms}
                    className={`px-6 py-2.5 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 transition-all ${
                      agreeToTerms ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed opacity-70'
                    }`}
                  >
                    Submit Application ✓
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
