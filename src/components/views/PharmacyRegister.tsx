/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Building2, Mail, Phone, Clock, ArrowLeft, Upload, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { Role, Pharmacy, Partner } from '../../types';
import { validateReferralId } from '../../data/referralUtils';
import { generateCommission } from '../../data/commissionUtils';
import { logTermsAcceptance } from '../../data/termsUtils';
import TermsConsentCheckbox from '../common/TermsConsentCheckbox';

interface PharmacyRegisterProps {
  setView: (view: string) => void;
  setUserRole?: (role: Role | null) => void;
  setUserEmail?: (email: string | null) => void;
  onAddPharmacy?: (newPharmacy: Pharmacy) => void;
  predefinedPartner?: Partner;
}

export default function PharmacyRegister({ setView, setUserRole, setUserEmail, onAddPharmacy, predefinedPartner }: PharmacyRegisterProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Territory Allocation Lock
  const [state, setState] = React.useState(predefinedPartner?.assignedState || 'Maharashtra');
  const [district, setDistrict] = React.useState(predefinedPartner?.assignedDistrict || 'Mumbai');
  const [city, setCity] = React.useState(predefinedPartner?.assignedDistrict || 'Mumbai');
  const [pincode, setPincode] = React.useState('');
  const [address, setAddress] = React.useState('');

  // Licensing Details
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [ownerName, setOwnerName] = React.useState('');
  const [licenseDocument, setLicenseDocument] = React.useState('Drug_License_Form_20.pdf');
  const [ownerIdProofDoc, setOwnerIdProofDoc] = React.useState('Owner_Aadhaar_Card.pdf');

  // Step state
  const [step, setStep] = React.useState(1);

  // Subscription Payment
  const [paymentMethod, setPaymentMethod] = React.useState('upi');
  const [subPaid, setSubPaid] = React.useState(false);

  // OTP Verification
  const [mobileOtp, setMobileOtp] = React.useState('');
  const [emailOtp, setEmailOtp] = React.useState('');
  const [sentMobileOtp, setSentMobileOtp] = React.useState('');
  const [sentEmailOtp, setSentEmailOtp] = React.useState('');
  const [mobileVerified, setMobileVerified] = React.useState(false);
  const [emailVerified, setEmailVerified] = React.useState(false);

  // Referral / Onboarding Partner info
  const [referralIdInput, setReferralIdInput] = React.useState(predefinedPartner?.referralId || '');
  const [verifiedPartner, setVerifiedPartner] = React.useState<Partner | null>(predefinedPartner || null);
  const [referralError, setReferralError] = React.useState('');

  React.useEffect(() => {
    if (predefinedPartner) {
      setVerifiedPartner(predefinedPartner);
      setReferralIdInput(predefinedPartner.referralId || '');
    }
  }, [predefinedPartner]);

  const handleValidateReferral = () => {
    setReferralError('');
    if (!referralIdInput) {
      setReferralError('Please enter a referral partner ID.');
      return;
    }
    const partnerObj = validateReferralId(referralIdInput);
    if (partnerObj) {
      setVerifiedPartner(partnerObj);
    } else {
      setReferralError('Referral ID not found. Proceeding as self-onboarded.');
      setVerifiedPartner(null);
    }
  };

  const handleSendMobileOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSentMobileOtp(code);
    alert(`[Simulated SMS Gateway] Mobile OTP Code is: ${code}`);
  };

  const handleVerifyMobileOtp = () => {
    if (mobileOtp === sentMobileOtp && mobileOtp !== '') {
      setMobileVerified(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid Mobile OTP entered.');
    }
  };

  const handleSendEmailOtp = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSentEmailOtp(code);
    alert(`[Simulated SMTP Server] Email OTP Code is: ${code}`);
  };

  const handleVerifyEmailOtp = () => {
    if (emailOtp === sentEmailOtp && emailOtp !== '') {
      setEmailVerified(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid Email OTP entered.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (step === 1) {
      if (!name || !email || !phone || !licenseNumber || !ownerName || !pincode || !address) {
        setErrorMessage('Please fill in all mandatory registry fields.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!subPaid) {
        setErrorMessage('Mandatory annual subscription charge must be processed.');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!mobileVerified || !emailVerified) {
        setErrorMessage('Verification of both phone number and email address is required.');
        return;
      }
      setStep(4);
      return;
    }

    // Step 4: Final Submission
    if (!agreeToTerms && !predefinedPartner) {
      setErrorMessage('Please accept the DoctSpark terms of clinical service.');
      return;
    }

    const newPharmacyObj: Pharmacy = {
      id: `pharm-${Date.now()}`,
      name: name.trim(),
      ownerName: ownerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state,
      pincode: pincode.trim(),
      status: predefinedPartner ? 'Pending District' : 'Pending Admin',
      onboardedBy: verifiedPartner?.id || undefined,
      onboardedByType: verifiedPartner?.partnerType || undefined,
      subscriptionPaid: true,
      mobileOtpVerified: true,
      emailOtpVerified: true,
      ownerIdProofDoc: ownerIdProofDoc,
      licenseDocuments: [licenseDocument],
      createdAt: new Date().toISOString()
    };

    // Save to localStorage list ds_pharmacies
    try {
      const savedPharmacies = localStorage.getItem('ds_pharmacies');
      const pharmList = savedPharmacies ? JSON.parse(savedPharmacies) : [];
      pharmList.push(newPharmacyObj);
      localStorage.setItem('ds_pharmacies', JSON.stringify(pharmList));

      // Save pharmacy credentials to local accounts
      const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
      const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
      localAccounts[email.trim().toLowerCase()] = {
        email: email.trim().toLowerCase(),
        password: password,
        name: name.trim(),
        role: 'pharmacy'
      };
      localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));
    } catch (err) {
      console.error(err);
    }

    // Update partner stats and wallet commissions in local store if registered by a partner
    if (verifiedPartner) {
      try {
        const savedPartners = localStorage.getItem('ds_partners');
        if (savedPartners) {
          const partnersList = JSON.parse(savedPartners);
          const updated = partnersList.map((p: any) => {
            if (p.id === verifiedPartner.id) {
              return {
                ...p,
                onboardedPharmaciesCount: (p.onboardedPharmaciesCount || 0) + 1,
                walletBalance: p.walletBalance + 2000 // ₹2,000 commission for onboarding pharmacy
              };
            }
            return p;
          });
          localStorage.setItem('ds_partners', JSON.stringify(updated));
        }
        
        // Generate actual platform commission ledger record
        generateCommission('Subscription', newPharmacyObj.id, `Pharmacy: ${newPharmacyObj.name}`, 5000, verifiedPartner.id);
      } catch (err) {
        console.error(err);
      }
    }

    // Log official T&C acceptance
    try {
      logTermsAcceptance(
        newPharmacyObj.email.toLowerCase().trim(),
        newPharmacyObj.name.trim(),
        newPharmacyObj.email.toLowerCase().trim(),
        'pharmacy',
        '1.0'
      );
    } catch (logErr) {
      console.error('Failed to log pharmacy terms acceptance:', logErr);
    }

    if (onAddPharmacy) {
      onAddPharmacy(newPharmacyObj);
    }

    setIsSuccess(true);

    if (setUserRole && setUserEmail) {
      setUserRole('pharmacy');
      setUserEmail(newPharmacyObj.email);
    }

    setTimeout(() => {
      if (predefinedPartner) {
        setView('close-modal');
      } else {
        setView('pharmacy-dashboard');
      }
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
          ✓
        </div>
        <h3 className="text-lg font-black text-[#1A2B3C] font-heading">Onboarding Request Submitted!</h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          The drug license regulatory files and identity assets for <span className="font-bold text-[#0A6E6E]">{name}</span> have been queued for partner audits.
        </p>
        <span className="inline-block mt-4 text-[10px] bg-slate-100 text-slate-500 font-extrabold px-3 py-1 rounded">
          {predefinedPartner ? 'Returning to Workspace Dashboard...' : 'Redirecting to Security Login...'}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-6">
      <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
          <button 
            type="button"
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else setView('login');
            }}
            className="p-1.5 hover:bg-slate-50 rounded-lg border border-gray-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <span className="text-[9px] font-extrabold text-[#0A6E6E] uppercase tracking-wider block">Registry Portal</span>
            <h2 className="text-base font-black text-[#1A2B3C] font-heading">Onboard Pharmacy Profile</h2>
          </div>
        </div>

        {/* Steps Indicators */}
        <div className="grid grid-cols-4 gap-2 mb-6 text-center border-b border-gray-50 pb-4">
          <div className={`py-1.5 text-[9px] font-black rounded-md ${step >= 1 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-400'}`}>1. Info & License</div>
          <div className={`py-1.5 text-[9px] font-black rounded-md ${step >= 2 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-400'}`}>2. Subscription</div>
          <div className={`py-1.5 text-[9px] font-black rounded-md ${step >= 3 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-400'}`}>3. OTP Verifications</div>
          <div className={`py-1.5 text-[9px] font-black rounded-md ${step >= 4 ? 'bg-[#0A6E6E] text-white' : 'bg-slate-100 text-gray-400'}`}>4. KYC & Review</div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg p-3 text-xs font-bold mb-4">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Pharmacy & Business Information</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Pharmacy / Store Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Wellness Pharmacy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Owner / Manager Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rajesh Kumar"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Drug License Number (Form 20/21) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. DL-MUM-28192"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Owner ID Proof (Aadhaar/PAN) *</label>
                  <select
                    value={ownerIdProofDoc}
                    onChange={(e) => setOwnerIdProofDoc(e.target.value)}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  >
                    <option value="Owner_Aadhaar_Card.pdf">Aadhaar Card Copy (Verified)</option>
                    <option value="Owner_PAN_Card.pdf">PAN Card Copy (Verified)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Pincode *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="400001"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">State *</label>
                  <input 
                    type="text" 
                    disabled 
                    value={state}
                    className="w-full bg-slate-100 border border-[#D1E5E5] p-2 rounded text-xs font-semibold text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Operating City/Town *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Full Delivery / Facility Address *</label>
                <textarea 
                  required 
                  placeholder="Street name, landmark details, shop number..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                />
              </div>

              {!predefinedPartner && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-2">
                  <label className="block text-xs font-bold text-indigo-950 mb-1">Optional Referral Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="REF-DT-4921"
                      value={referralIdInput}
                      onChange={(e) => setReferralIdInput(e.target.value)}
                      className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleValidateReferral}
                      className="px-3 bg-indigo-600 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                  {referralError && <span className="text-[9px] text-amber-700 font-bold block mt-1">{referralError}</span>}
                  {verifiedPartner && (
                    <span className="text-[10px] text-emerald-700 font-extrabold block mt-1">
                      ✓ Associated Partner: {verifiedPartner.name} ({verifiedPartner.partnerType} Level)
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs py-2.5 rounded-lg transition-all cursor-pointer"
              >
                Continue to Billing & Subscription
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">1-Year Annual Directory Subscription</span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                To connect your pharmacy directory inventory and start accepting digital orders from local DoctSpark practitioners, an annual setup charge of ₹5,000 applies.
              </p>

              <div className="border border-teal-200 rounded-xl p-4 bg-teal-50/40">
                <div className="flex justify-between items-center text-xs font-extrabold text-[#1A2B3C] mb-2">
                  <span>Directory Hosting Profile Setup</span>
                  <span>₹5,000 / Year</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
                  <span>Platform Commission Rate</span>
                  <span>0% (Free on orders)</span>
                </div>
              </div>

              {!subPaid ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">Choose Payment Method</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 border rounded-lg text-xs font-bold cursor-pointer transition-all ${paymentMethod === 'upi' ? 'bg-teal-50 border-[#0A6E6E] text-teal-900' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      📱 UPI / Google Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 border rounded-lg text-xs font-bold cursor-pointer transition-all ${paymentMethod === 'card' ? 'bg-teal-50 border-[#0A6E6E] text-teal-900' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                      💳 Credit / Debit Card
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubPaid(true)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg cursor-pointer transition-all"
                  >
                    Simulate Payment Processing
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-center text-xs font-bold">
                  ✓ Setup subscription paid successfully! Transacted on DoctSpark Gateway.
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!subPaid}
                  className="px-5 py-2 bg-[#0A6E6E] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-bold cursor-pointer ml-auto"
                >
                  Continue to OTP Verification
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Verify Contact Details (OTP)</span>
              
              {/* Phone OTP */}
              <div className="space-y-2 border border-gray-100 p-3.5 rounded-xl bg-slate-50">
                <label className="block text-xs font-bold text-slate-800">1. Facility Registered Mobile *</label>
                <div className="flex gap-2">
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={mobileVerified}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={mobileVerified || !phone}
                    className="px-3 bg-teal-50 border border-teal-200 text-teal-800 hover:border-teal-400 text-xs font-bold rounded cursor-pointer disabled:opacity-40"
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
                  <span className="text-[10px] text-emerald-700 font-bold block">✓ Mobile Verification Successful</span>
                )}
              </div>

              {/* Email OTP */}
              <div className="space-y-2 border border-gray-100 p-3.5 rounded-xl bg-slate-50">
                <label className="block text-xs font-bold text-slate-800">2. Official Email Address *</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="name@pharmacy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={emailVerified}
                    className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={emailVerified || !email}
                    className="px-3 bg-teal-50 border border-teal-200 text-teal-800 hover:border-teal-400 text-xs font-bold rounded cursor-pointer disabled:opacity-40"
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
                  <span className="text-[10px] text-emerald-700 font-bold block">✓ Email Verification Successful</span>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!mobileVerified || !emailVerified}
                  className="px-5 py-2 bg-[#0A6E6E] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-bold cursor-pointer ml-auto"
                >
                  Continue to Documents Upload
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <span className="text-xs uppercase font-extrabold text-[#0A6E6E] tracking-wider block">Document Attachments & Consent</span>
              
              <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-slate-50">
                <label className="block text-xs font-bold text-slate-800 mb-1">Upload Drug License Form 20/21 *</label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                    📎 {licenseDocument}
                  </span>
                </div>
                <div 
                  onClick={() => alert('Simulated licensing document file re-upload.')}
                  className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:bg-teal-50/50 transition-all"
                >
                  <span className="text-[10px] font-bold text-slate-500 block">Click to attach different PDF Drug License copy</span>
                  <span className="text-[8px] text-slate-400">PDF, PNG files up to 10MB permitted</span>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="space-y-2 border border-gray-100 p-3.5 rounded-xl bg-slate-50">
                <label className="block text-xs font-bold text-slate-800">Set Account Password *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="Create unique password for portals"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#D1E5E5] p-2 rounded text-xs font-semibold"
                />
              </div>

              <TermsConsentCheckbox 
                documentId="pharmacy" 
                isAccepted={agreeToTerms} 
                onChange={setAgreeToTerms} 
              />

              <div className="flex justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-slate-100 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!agreeToTerms}
                  className={`px-6 py-2.5 text-white rounded-lg text-xs font-extrabold ml-auto shadow transition-all ${
                    agreeToTerms ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed opacity-70'
                  }`}
                >
                  Submit & Request Profile Activation
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
