/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building, Mail, Phone, KeyRound, Clock, ArrowLeft, Upload, MapPin, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { Role, Clinic, Partner } from '../../types';
import { validateReferralId } from '../../data/referralUtils';
import { logTermsAcceptance } from '../../data/termsUtils';
import TermsConsentCheckbox from '../common/TermsConsentCheckbox';

interface ClinicRegisterProps {
  setView: (view: string) => void;
  setUserRole: (role: Role | null) => void;
  setUserEmail: (email: string | null) => void;
  onAddClinic: (newClinic: Clinic) => void;
  predefinedPartner?: Partner;
}

export default function ClinicRegister({ setView, setUserRole, setUserEmail, onAddClinic, predefinedPartner }: ClinicRegisterProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [timings, setTimings] = React.useState('Monday - Saturday (09:00 AM - 07:00 PM)');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [tempId, setTempId] = React.useState('');

  // Location States
  const [state, setState] = React.useState(predefinedPartner?.assignedState || 'Maharashtra');
  const [city, setCity] = React.useState(predefinedPartner?.assignedDistrict || 'Mumbai');
  const [pincode, setPincode] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [latitude, setLatitude] = React.useState('19.0760');
  const [longitude, setLongitude] = React.useState('72.8777');
  const [geoTagStatus, setGeoTagStatus] = React.useState('');

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [generatedOtp, setGeneratedOtp] = React.useState('');

  // 3 Clinic Photos
  const [photos, setPhotos] = React.useState<string[]>([]);

  // Advanced Clinic Setup States
  const [clinicType, setClinicType] = React.useState('Multi-Specialty');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [totalChambers, setTotalChambers] = React.useState('3');
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(['Waiting Area A/C', 'In-House Pharmacy']);
  const [ownerName, setOwnerName] = React.useState('');
  const [tradeLicenseNumber, setTradeLicenseNumber] = React.useState('');
  const [licenseDocuments, setLicenseDocuments] = React.useState<string[]>(['Clinical_Establishment_NOC.pdf', 'Trade_License_Certificate.pdf']);

  // Owner Identity Proof Upload State
  const [ownerIdProofUploaded, setOwnerIdProofUploaded] = React.useState(false);

  // Clinic Subscription & Dual-Channel OTP States
  const [showPaymentScreen, setShowPaymentScreen] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('UPI');
  const [paymentSimulating, setPaymentSimulating] = React.useState(false);
  const [subscriptionPaid, setSubscriptionPaid] = React.useState(false);

  // Dual OTP Verification States
  const [mobileOtpCode, setMobileOtpCode] = React.useState('');
  const [emailOtpCode, setEmailOtpCode] = React.useState('');
  const [generatedMobileOtp, setGeneratedMobileOtp] = React.useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = React.useState('');

  // Referral Partner Verification States
  const [referralStep, setReferralStep] = React.useState(!predefinedPartner);
  const [referralIdInput, setReferralIdInput] = React.useState(predefinedPartner?.referralId || '');
  const [verifiedPartner, setVerifiedPartner] = React.useState<Partner | null>(predefinedPartner || null);
  const [referralError, setReferralError] = React.useState('');

  const amenitiesPreset = [
    'Waiting Area A/C',
    'In-House Pharmacy',
    'Diagnostic Lab',
    'Wheelchair Accessible',
    'Emergency First Aid',
    'Ambulance Bay',
    'Oxygen Cylinder Setup',
    'ECG Monitor'
  ];

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSimulateGeotag = () => {
    setGeoTagStatus('Pinpointing address coordinates...');
    setTimeout(() => {
      // Simulate slightly varied Mumbai or standard coordinates
      const randomLat = (19.0 + Math.random() * 0.2).toFixed(4);
      const randomLng = (72.8 + Math.random() * 0.1).toFixed(4);
      setLatitude(randomLat);
      setLongitude(randomLng);
      setGeoTagStatus('✅ Live GPS Coordinates Loaded Successfully!');
    }, 800);
  };

  const togglePhoto = (photoType: 'facade' | 'waiting' | 'room') => {
    const urls = {
      facade: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop',
      waiting: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&auto=format&fit=crop',
      room: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop'
    };
    const url = urls[photoType];
    setPhotos(prev => {
      if (prev.includes(url)) {
        return prev.filter(p => p !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const handleSimulateSubscriptionPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSimulating(true);
    setErrorMessage('');
    setTimeout(() => {
      setPaymentSimulating(false);
      setSubscriptionPaid(true);
      setShowPaymentScreen(false);
      
      // Initialize referral step states
      setReferralStep(true);
      setReferralIdInput('');
      setVerifiedPartner(null);
      setReferralError('');
      
      setGeneratedMobileOtp('');
      setGeneratedEmailOtp('');
      setMobileOtpCode('');
      setEmailOtpCode('');
      setShowOtpScreen(true);
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !password.trim() || !address.trim() || !pincode.trim()) {
      setErrorMessage('Please fill in all the required fields.');
      return;
    }

    if (photos.length < 3) {
      setErrorMessage('Please complete your profile by uploading all 3 required clinic photos (Facade, Waiting Lounge, and Consulting Chamber).');
      return;
    }

    if (!ownerName.trim()) {
      setErrorMessage('Please specify the Clinic Owner or General Manager name.');
      return;
    }

    if (!tradeLicenseNumber.trim()) {
      setErrorMessage('Please specify the Business Trade License Number.');
      return;
    }

    if (!ownerIdProofUploaded) {
      setErrorMessage('Please upload the Owner / Manager Identity Proof Document.');
      return;
    }

    if (licenseDocuments.length === 0) {
      setErrorMessage('Please attach or select at least one trade license certificate or established NOC for clinical verification.');
      return;
    }

    if (!agreeToTerms) {
      setErrorMessage('You must agree to the Terms & Conditions and clinical practice guidelines.');
      return;
    }

    // Redirect to the 1-Year Subscription payment screen
    setShowPaymentScreen(true);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const isMobileValid = mobileOtpCode.trim() === generatedMobileOtp || mobileOtpCode.trim() === '1234';
    const isEmailValid = emailOtpCode.trim() === generatedEmailOtp || emailOtpCode.trim() === '1234';

    if (isMobileValid && isEmailValid) {
      const generatedClinicId = `clinic-reg-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newClinic: Clinic = {
        id: generatedClinicId,
        name: name.trim(),
        city: city,
        address: `${address.trim()}, ${city}, ${state} - ${pincode.trim()}`,
        rating: 5.0,
        reviewsCount: 0,
        photos: photos,
        timings: timings,
        doctors: [],
        lat: Number(latitude),
        lng: Number(longitude),
        clinicType: clinicType,
        licenseNumber: licenseNumber.trim() || `CL-${Math.floor(100000 + Math.random() * 900000)}`,
        amenities: selectedAmenities,
        totalChambers: Number(totalChambers) || 3,
        phone: phone.trim(),
        email: email.trim(),
        ownerName: ownerName.trim() || 'Principal Manager',
        tradeLicenseNumber: tradeLicenseNumber.trim() || `TRD-${Math.floor(200000 + Math.random() * 800000)}`,
        licenseDocuments: licenseDocuments,
        verificationStatus: 'Pending District',
        subscriptionPaid: true,
        mobileOtpVerified: true,
        emailOtpVerified: true,
        state: state,
        district: city,
        ownerIdProofDoc: 'owner_id_proof.jpg',
        onboardedBy: verifiedPartner ? verifiedPartner.id : undefined,
        onboardedByType: verifiedPartner ? verifiedPartner.partnerType : undefined,
        referralPartnerId: verifiedPartner ? verifiedPartner.referralId : undefined
      };

      // Save clinic to local accounts for local sign in
      try {
        const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
        const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
        localAccounts[email.toLowerCase().trim()] = {
          email: email.toLowerCase().trim(),
          password: password,
          name: name,
          role: 'clinic'
        };
        localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));
      } catch (err) {
        console.warn('Failed to save clinic to local accounts:', err);
      }

      // Log official T&C acceptance
      try {
        logTermsAcceptance(
          email.toLowerCase().trim(),
          name.trim(),
          email.toLowerCase().trim(),
          'clinic',
          '1.0'
        );
      } catch (logErr) {
        console.error('Failed to log clinic terms acceptance:', logErr);
      }

      onAddClinic(newClinic);
      setTempId(generatedClinicId);
      setIsSuccess(true);
      setShowOtpScreen(false);
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

  const handleLaunchDashboard = () => {
    if (predefinedPartner) {
      setView('partner-dashboard');
    } else {
      setView('login');
    }
  };

  return (
    <div className="flex-1 max-w-lg w-full mx-auto px-4 md:px-8 py-12" id="clinic-register-root">
      <button 
        onClick={() => {
          if (showOtpScreen) {
            setShowOtpScreen(false);
          } else {
            setView(predefinedPartner ? 'partner-dashboard' : 'login');
          }
        }}
        className="mb-6 text-xs font-bold text-[#0A6E6E] hover:underline flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {showOtpScreen ? 'Back to Form' : predefinedPartner ? 'Back to Partner Dashboard' : 'Back to Login'}
      </button>

      {isSuccess ? (
        <div className="bg-white rounded-xl border border-[#D1E5E5] border-t-4 border-t-[#0A6E6E] p-8 shadow-md text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-100 animate-bounce">
            📋
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Clinic Submitted for Verification!</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Thank you, your clinical facility <strong>{name}</strong> has been submitted for multi-level verification (District Partner, State Partner, and Admin). You will be notified by SMS & Email at each stage.
          </p>

          <div className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-xl p-5 my-6 text-left text-xs">
            <span className="text-[10px] font-extrabold text-[#0A6E6E] uppercase block mb-2.5 tracking-wider">Verified Clinical Facility Profile</span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#1A2B3C] text-sm">{name}</span>
                <span className="text-[9px] bg-[#E1F0F0] text-[#0A6E6E] font-extrabold px-2 py-0.5 rounded">
                  {clinicType}
                </span>
              </div>
              <div className="text-gray-500">{address}, {city} - {pincode}</div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 border-t border-[#D1E5E5]/60 pt-2 mt-2">
                <div>🕒 <strong>Timings:</strong> {timings}</div>
                <div>🏢 <strong>Chambers:</strong> {totalChambers} Active Rooms</div>
                <div>📞 <strong>Contact:</strong> {phone}</div>
                <div>🛡️ <strong>License ID:</strong> {licenseNumber.trim() || 'Pending Verification'}</div>
                <div>👤 <strong>Owner/Manager:</strong> {ownerName.trim() || 'Principal Owner'}</div>
                <div>📄 <strong>Trade License:</strong> {tradeLicenseNumber.trim() || 'Pending verification'}</div>
              </div>

              {licenseDocuments.length > 0 && (
                <div className="border-t border-[#D1E5E5]/60 pt-2 mt-2">
                  <span className="text-[9px] font-extrabold text-[#0A6E6E] uppercase block mb-1">Uploaded Trade License Documents</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {licenseDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[9px] text-[#0A6E6E] font-semibold bg-white px-2 py-1 rounded border border-[#D1E5E5]/60 shadow-xs">
                        <span className="text-emerald-500">📎</span> {doc} <span className="text-[8px] text-gray-400 font-normal ml-auto">Verified ✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAmenities.length > 0 && (
                <div className="border-t border-[#D1E5E5]/60 pt-2 mt-2">
                  <span className="text-[9px] font-extrabold text-[#0A6E6E] uppercase block mb-1">Clinic Amenities Available</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedAmenities.map((amenity, idx) => (
                      <span key={idx} className="text-[8px] bg-white text-[#0A6E6E] font-bold px-1.5 py-0.5 rounded border border-[#D1E5E5]/60">
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-1.5 mt-3 border-t border-[#D1E5E5]/60 pt-2">
                {photos.map((ph, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <img src={ph} alt="Clinic Uploaded" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleLaunchDashboard}
              className="w-full py-3 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-xs font-extrabold rounded-lg shadow-sm cursor-pointer transition-all"
            >
              {predefinedPartner ? 'Back to Partner Dashboard' : '👉 Proceed to Universal Sign In'}
            </button>
            <button
              onClick={() => setView(predefinedPartner ? 'partner-dashboard' : 'home')}
              className="w-full py-2.5 bg-white border border-[#D1E5E5] text-gray-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              {predefinedPartner ? 'Back to Partner Dashboard' : 'Go to Homepage'}
            </button>
          </div>
        </div>
      ) : showPaymentScreen ? (
        <div className="bg-white rounded-xl border border-[#D1E5E5] border-t-4 border-t-[#0A6E6E] p-6 md:p-8 shadow-md">
          <div className="text-center mb-6">
            <CreditCard className="text-[#0A6E6E] w-12 h-12 mx-auto mb-2 animate-pulse" />
            <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Onboarding Fee Setup</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">1-Year Subscription Charge</h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              To verify and establish your clinical profile on Doct Spark, a <strong>₹5,000 INR</strong> subscription fee is required.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSimulateSubscriptionPayment} className="flex flex-col gap-4">
            <div className="border-t border-[#D1E5E5] pt-4">
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
                    placeholder="e.g. clinic@okhdfc"
                    defaultValue="clinic.sharma@upi"
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
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
                      className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
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
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">CVV *</label>
                      <input
                        type="password"
                        required
                        placeholder="***"
                        defaultValue="123"
                        className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'Netbanking' && (
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Select Bank *</label>
                  <select className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]">
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>State Bank of India</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowPaymentScreen(false)}
                className="w-1/3 py-3 bg-white border border-[#D1E5E5] text-gray-600 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentSimulating}
                className="w-2/3 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs py-3 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {paymentSimulating ? 'Processing Secure Payment...' : 'Pay ₹5,000 INR & Proceed'}
              </button>
            </div>
          </form>
        </div>
      ) : showOtpScreen ? (
        referralStep ? (
          <div className="bg-white rounded-xl border border-[#D1E5E5] border-t-4 border-t-[#0A6E6E] p-6 md:p-8 shadow-md flex flex-col gap-5">
            <div className="border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="text-[#0A6E6E] w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#1A2B3C]">Clinic Network Verification</h3>
            </div>

            <div className="text-center py-4 px-2">
              <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Referral Partnership</span>
              <h2 className="text-lg md:text-xl font-bold text-[#1A2B3C] font-heading">Referral Partner ID Verification</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto font-medium">
                If this clinic is being onboarded or referred by a DOCT SPARK Partner (State or District Level), please enter their Partner Referral ID below.
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
                onClick={() => setShowOtpScreen(false)}
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
          <div className="bg-white rounded-xl border border-[#D1E5E5] border-t-4 border-t-[#0A6E6E] p-6 md:p-8 shadow-md">
            <div className="text-center mb-6">
              <ShieldCheck className="text-[#0A6E6E] w-12 h-12 mx-auto mb-2" />
              <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Clinical Registration Verification</span>
              <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Dual-Channel OTP Verification</h2>
              <p className="text-xs text-gray-400 mt-1">Unique security codes have been sent to your registered communication channels.</p>
            </div>

            {verifiedPartner && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs flex items-center justify-between mb-4">
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

            {errorMessage && (
              <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className="space-y-2 mb-6">
              <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-3 text-[11px] leading-relaxed">
                💡 <strong>Simulated SMS Alert:</strong> Code sent to <strong>{phone}</strong> is <span className="font-mono font-bold text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{generatedMobileOtp}</span> (or use bypass <strong>1234</strong>).
              </div>
              <div className="bg-blue-50 border border-blue-100 text-blue-950 rounded-xl p-3 text-[11px] leading-relaxed">
                💡 <strong>Simulated Email Alert:</strong> Code sent to <strong>{email || 'admin@clinic.com'}</strong> is <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{generatedEmailOtp}</span> (or use bypass <strong>1234</strong>).
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-gray-500">Mobile OTP *</label>
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
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="XXXX"
                    value={mobileOtpCode}
                    onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-sm tracking-[0.3em] font-mono font-bold outline-none text-[#1A2B3C] focus:ring-1 focus:ring-[#0A6E6E] transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-gray-500">Email OTP *</label>
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
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="XXXX"
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-sm tracking-[0.3em] font-mono font-bold outline-none text-[#1A2B3C] focus:ring-1 focus:ring-[#0A6E6E] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setReferralStep(true)}
                  className="px-4 py-2 border border-[#D1E5E5] text-gray-600 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Back to Referral ID
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Verify OTP & Submit for Verification
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-[#D1E5E5] border-t-4 border-t-[#0A6E6E] p-6 md:p-8 shadow-md">
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Group Clinic Registration</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Register Clinic Profile</h2>
            <p className="text-xs text-gray-400 mt-1">Setup your private or group clinic in our verified network</p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4 text-xs font-semibold">
            {/* Clinic Name */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Clinic Name *</label>
              <div className="relative flex items-center">
                <Building className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Care Point Clinic"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Clinic Email *</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="email" 
                  required
                  placeholder="e.g. admin@carepoint.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Contact Phone Number *</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Secure Password */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Secure Account Password *</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="password" 
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Timings */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Operational Timings *</label>
              <div className="relative flex items-center">
                <Clock className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Monday - Saturday (09:00 AM - 07:00 PM)"
                  value={timings}
                  onChange={(e) => setTimings(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Clinical Licensing & Facilities Options */}
            <div className="border border-dashed border-[#D1E5E5] rounded-xl p-3.5 bg-slate-50/50 mt-1">
              <span className="text-[10px] uppercase font-extrabold text-[#0A6E6E] block mb-2">Clinical Licensing & Facilities</span>
              
              <div className="grid grid-cols-2 gap-3.5 mb-2.5">
                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">Clinic Facility Type *</label>
                  <select 
                    value={clinicType}
                    onChange={(e) => setClinicType(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none text-[#1A2B3C] font-semibold"
                  >
                    <option value="Multi-Specialty">Multi-Specialty Clinic</option>
                    <option value="General Practice">General Practice Chamber</option>
                    <option value="Cardiology Special">Cardiology Center</option>
                    <option value="Dental Clinic">Dental Clinic</option>
                    <option value="Pediatric Care">Pediatric Care Clinic</option>
                    <option value="Dermatological Hub">Dermatological Hub</option>
                    <option value="Diagnostic & Scan">Diagnostic & Scan Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">Total Consultation Chambers *</label>
                  <input 
                    type="number" 
                    min="1"
                    max="50"
                    required
                    value={totalChambers}
                    onChange={(e) => setTotalChambers(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none text-[#1A2B3C] font-semibold"
                  />
                </div>
              </div>

              <div className="mb-2.5">
                <label className="block text-[10px] text-[#1A2B3C] mb-1">Clinical Establishment License Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. REG-MUM-984251 (Leave blank to auto-generate)"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none text-[#1A2B3C] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#1A2B3C] mb-1.5">Amenities Available at Facility</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {amenitiesPreset.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`text-left p-1.5 rounded-lg border text-[10px] transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-[#E1F0F0] text-[#0A6E6E] border-[#0A6E6E] font-bold' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                      >
                        <span>{amenity}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#0A6E6E]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Clinic Ownership & Verified Trade Documents */}
            <div className="border border-dashed border-[#D1E5E5] rounded-xl p-3.5 bg-slate-50/50 mt-1">
              <span className="text-[10px] uppercase font-extrabold text-[#0A6E6E] block mb-2">Clinic Owner & Trade Verification</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-2.5">
                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">Owner / Manager Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Mr. Aditya Roy"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs outline-none text-[#1A2B3C] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">Trade License Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. TRD-MUM-48201"
                    value={tradeLicenseNumber}
                    onChange={(e) => setTradeLicenseNumber(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2.5 rounded-lg text-xs outline-none text-[#1A2B3C] font-semibold"
                  />
                </div>
              </div>

              {/* Verified Documents Upload UI */}
              <div className="mt-3 bg-white border border-[#D1E5E5] rounded-lg p-3">
                <span className="text-[10px] text-[#1A2B3C] font-bold block mb-1">Verify Trade Documents & Certifications *</span>
                <p className="text-[9px] text-gray-400 mb-2">Attach or select required clinical establishment certs (minimum 1 file to complete verification)</p>
                
                {/* Simulated Doc upload presets */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { name: 'Trade_License_Certificate.pdf', label: '📄 Trade License' },
                    { name: 'Clinical_Establishment_NOC.pdf', label: '📄 Establishment NOC' },
                    { name: 'Pharmacy_NOC_Drug_License.pdf', label: '📄 Pharmacy NOC' },
                    { name: 'Fire_Safety_Certificate.pdf', label: '📄 Fire Safety Cert' }
                  ].map((presetDoc) => {
                    const isUploaded = licenseDocuments.includes(presetDoc.name);
                    return (
                      <button
                        key={presetDoc.name}
                        type="button"
                        onClick={() => {
                          if (isUploaded) {
                            setLicenseDocuments(prev => prev.filter(d => d !== presetDoc.name));
                          } else {
                            setLicenseDocuments(prev => [...prev, presetDoc.name]);
                          }
                        }}
                        className={`px-2 py-1 rounded border text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${isUploaded ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}
                      >
                        <span>{presetDoc.label}</span>
                        {isUploaded ? <span className="text-[8px] text-emerald-600 font-extrabold">✓ Attached</span> : <span className="text-gray-400 font-normal">+ Add</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Drag and Drop Simulator Area */}
                <div 
                  onClick={() => {
                    // Simulate random doc upload
                    const list = ['Drug_Store_Licensing.pdf', 'Pollution_Control_Board_NOC.pdf', 'GST_Registration_Certificate.pdf'];
                    const chosen = list[Math.floor(Math.random() * list.length)];
                    if (!licenseDocuments.includes(chosen)) {
                      setLicenseDocuments(prev => [...prev, chosen]);
                      alert(`Successfully simulated drag-and-drop file upload for "${chosen}"!`);
                    } else {
                      alert(`File "${chosen}" is already attached!`);
                    }
                  }}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-[#F0F7F7] hover:border-[#0A6E6E] cursor-pointer transition-colors relative mb-2"
                >
                  <div className="flex flex-col items-center">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] font-bold text-gray-600">Drag & Drop Documents Here</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Click here to simulate uploading local files (PDF, PNG, JPG up to 10MB)</span>
                  </div>
                </div>

                {/* List of Attached Documents */}
                {licenseDocuments.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-extrabold text-[#0A6E6E] block">Currently Attached files ({licenseDocuments.length})</span>
                    {licenseDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#F0F7F7] border border-[#D1E5E5]/60 rounded-md px-2 py-1 text-[9px] text-gray-700 font-semibold">
                        <span className="truncate">📎 {doc}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-emerald-600 bg-emerald-100 font-bold px-1 rounded">Verified ✓</span>
                          <button
                            type="button"
                            onClick={() => setLicenseDocuments(prev => prev.filter(d => d !== doc))}
                            className="text-red-500 hover:text-red-700 font-bold text-xs px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[9px] text-red-500 block font-bold mt-1">⚠️ At least one trade document required for clinical verification.</span>
                )}
              </div>

              {/* Owner / Manager ID Proof upload */}
              <div className="mt-3 bg-white border border-[#D1E5E5] rounded-lg p-3">
                <span className="text-[10px] text-[#1A2B3C] font-bold block mb-1">Owner / Manager Identity Proof Document *</span>
                <p className="text-[9px] text-gray-400 mb-2.5">Upload a verified copy of Aadhaar, PAN card, or Passport of the chief clinic owner or medical director.</p>
                <div 
                  onClick={() => setOwnerIdProofUploaded(!ownerIdProofUploaded)}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${ownerIdProofUploaded ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800' : 'border-gray-200 hover:border-[#0A6E6E] bg-slate-50/20'}`}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <span className="text-[10px] font-extrabold block">{ownerIdProofUploaded ? '✅ UPLOADED (owner_id_proof.jpg)' : 'CLICK TO SIMULATE OWNER ID UPLOAD'}</span>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="border border-dashed border-[#D1E5E5] rounded-xl p-3.5 bg-slate-50/50 mt-1">
              <span className="text-[10px] uppercase font-extrabold text-[#0A6E6E] block mb-2">Location & Geo-tagging</span>
              
              <div className="grid grid-cols-2 gap-3.5 mb-2.5">
                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">State *</label>
                  <select 
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">City Hub *</label>
                  <select 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </select>
                </div>
              </div>

              <div className="mb-2.5">
                <label className="block text-[10px] text-[#1A2B3C] mb-1">Clinical Street Address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 102, Sunrise Business Plaza, Andheri West"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <label className="block text-[10px] text-[#1A2B3C] mb-1">Pincode *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 400053"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleSimulateGeotag}
                    className="w-full bg-[#0A6E6E] text-white p-2 rounded-lg text-xs font-bold hover:bg-[#0A6E6E]/90 flex items-center justify-center gap-1 shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Locate GPS Coordinates
                  </button>
                </div>
              </div>

              {geoTagStatus && (
                <div className="text-[10px] font-extrabold text-[#0A6E6E] mt-1.5 text-center">
                  {geoTagStatus} {latitude && `(${latitude}, ${longitude})`}
                </div>
              )}
            </div>

            {/* 3 CLINIC PHOTOS */}
            <div className="bg-[#F8FAFA] border border-[#D1E5E5] rounded-xl p-4 flex flex-col gap-3 mt-1">
              <div>
                <h4 className="text-xs font-extrabold text-[#0A6E6E] flex items-center gap-1.5 uppercase tracking-wider">
                  📸 Clinic Photos (Upload 3 Photos) *
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Please simulated-upload 3 photos of your practice location (Entrance Facade, Waiting Area, and Consulting Room).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-1">
                {/* Facade */}
                {(() => {
                  const url = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&auto=format&fit=crop';
                  const isUploaded = photos.includes(url);
                  return (
                    <div 
                      onClick={() => togglePhoto('facade')}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all relative aspect-video flex flex-col items-center justify-center overflow-hidden ${isUploaded ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#D1E5E5] hover:border-[#0A6E6E] bg-white'}`}
                    >
                      {isUploaded ? (
                        <>
                          <img src={url} alt="Entrance Facade" className="absolute inset-0 w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                            <span className="bg-emerald-500 text-white rounded-full p-1 text-[8px] font-extrabold">✓</span>
                            <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wider text-center">1. Entrance / Facade</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-700">1. Entrance Facade</span>
                          <span className="text-[8px] text-gray-400 mt-0.5">Simulate Upload</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Waiting */}
                {(() => {
                  const url = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&auto=format&fit=crop';
                  const isUploaded = photos.includes(url);
                  return (
                    <div 
                      onClick={() => togglePhoto('waiting')}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all relative aspect-video flex flex-col items-center justify-center overflow-hidden ${isUploaded ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#D1E5E5] hover:border-[#0A6E6E] bg-white'}`}
                    >
                      {isUploaded ? (
                        <>
                          <img src={url} alt="Waiting Lounge" className="absolute inset-0 w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                            <span className="bg-emerald-500 text-white rounded-full p-1 text-[8px] font-extrabold">✓</span>
                            <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wider text-center">2. Waiting Lounge</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-700">2. Waiting Lounge</span>
                          <span className="text-[8px] text-gray-400 mt-0.5">Simulate Upload</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Room */}
                {(() => {
                  const url = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop';
                  const isUploaded = photos.includes(url);
                  return (
                    <div 
                      onClick={() => togglePhoto('room')}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all relative aspect-video flex flex-col items-center justify-center overflow-hidden ${isUploaded ? 'border-emerald-500 bg-emerald-50/20' : 'border-[#D1E5E5] hover:border-[#0A6E6E] bg-white'}`}
                    >
                      {isUploaded ? (
                        <>
                          <img src={url} alt="Consultation Chamber" className="absolute inset-0 w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                            <span className="bg-emerald-500 text-white rounded-full p-1 text-[8px] font-extrabold">✓</span>
                            <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wider text-center">3. Consult Chamber</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-[10px] font-bold text-gray-700">3. Consult Chamber</span>
                          <span className="text-[8px] text-gray-400 mt-0.5">Simulate Upload</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Terms */}
            <TermsConsentCheckbox 
              documentId="clinic" 
              isAccepted={agreeToTerms} 
              onChange={setAgreeToTerms} 
            />

            {/* Submit */}
            <button 
              type="submit"
              disabled={!agreeToTerms}
              className={`w-full text-white font-extrabold text-xs py-3 rounded-lg shadow-sm transition-all cursor-pointer mt-3 ${
                agreeToTerms ? 'bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 active:scale-[0.99]' : 'bg-slate-300 cursor-not-allowed opacity-70'
              }`}
            >
              Verify Clinic & Register Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
