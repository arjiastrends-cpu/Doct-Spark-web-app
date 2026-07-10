/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Mail, Phone, KeyRound, Calendar, ArrowLeft, ShieldCheck, Check, MapPin } from 'lucide-react';
import { Role } from '../../types';
import { getOrCreatePatientWallet } from '../../data/walletUtils';
import { supabase } from '../../lib/supabase';
import { logTermsAcceptance } from '../../data/termsUtils';
import TermsConsentCheckbox from '../common/TermsConsentCheckbox';

interface PatientRegisterProps {
  setView: (view: string) => void;
  setUserRole: (role: Role | null) => void;
  setUserEmail: (email: string | null) => void;
}

export default function PatientRegister({ setView, setUserRole, setUserEmail }: PatientRegisterProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [gender, setGender] = React.useState('Male');
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [tempId, setTempId] = React.useState('');

  // Location States
  const [state, setState] = React.useState('Maharashtra');
  const [district, setDistrict] = React.useState('Mumbai');
  const [city, setCity] = React.useState('Mumbai City');
  const [pincode, setPincode] = React.useState('');
  const [latitude, setLatitude] = React.useState('');
  const [longitude, setLongitude] = React.useState('');
  const [geoTagStatus, setGeoTagStatus] = React.useState('');

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [generatedOtp, setGeneratedOtp] = React.useState('');

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !password.trim() || !dob) {
      setErrorMessage('Please fill in all the required fields.');
      return;
    }

    if (!agreeToTerms) {
      setErrorMessage('You must agree to the Terms & Conditions and HIPAA privacy policies.');
      return;
    }

    // Generate simulated 4-digit OTP code
    const mockOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(mockOtp);
    setShowOtpScreen(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.trim() === generatedOtp || otpCode.trim() === '1234') {
      // Generate random Spark ID for the registered patient
      const randomId = `DSP-${2026}-${Math.floor(1000 + Math.random() * 9000)}`;
      setTempId(randomId);
      
      const finalEmail = email.trim() ? email.toLowerCase().trim() : `${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
      
      // Save patient name to local storage immediately
      localStorage.setItem(`ds_patient_name_${finalEmail}`, name.trim());

      // Auto create patient wallet and referral code
      getOrCreatePatientWallet(finalEmail, name);
      
      // Save to local accounts database for local sign in
      const savedAccountsRaw = localStorage.getItem('ds_local_accounts');
      const localAccounts = savedAccountsRaw ? JSON.parse(savedAccountsRaw) : {};
      localAccounts[finalEmail] = {
        email: finalEmail,
        password: password,
        name: name.trim(),
        role: 'patient'
      };
      localStorage.setItem('ds_local_accounts', JSON.stringify(localAccounts));

      // Attempt live Supabase Auth signup in the background if configured
      try {
        const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
        if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: finalEmail,
            password: password,
            options: {
              data: {
                name: name.trim(),
                role: 'patient'
              }
            }
          });
          if (!authError && authData?.user) {
            // Write to profiles table as well with full details (Requirement 8)
            try {
              const { error: upsertErr } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: finalEmail,
                role: 'patient',
                name: name.trim(),
                full_name: name.trim(),
                created_at: new Date().toISOString()
              });
              
              if (upsertErr) {
                // Try fallback column fields if schema doesn't match
                try {
                  await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: finalEmail,
                    role: 'patient',
                    name: name.trim()
                  });
                } catch (e2) {
                  try {
                    await supabase.from('profiles').upsert({
                      id: authData.user.id,
                      email: finalEmail,
                      role: 'patient',
                      full_name: name.trim()
                    });
                  } catch (e3) {
                    // Fallback to minimal fields
                    await supabase.from('profiles').upsert({
                      id: authData.user.id,
                      email: finalEmail,
                      role: 'patient'
                    });
                  }
                }
              }
            } catch (upsertCatchErr) {
              console.warn('Upsert profile failed inside try:', upsertCatchErr);
              await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: finalEmail,
                role: 'patient'
              });
            }
          }
        }
      } catch (err) {
        console.warn('Background Supabase signup failed:', err);
      }

      // Log official T&C acceptance
      try {
        logTermsAcceptance(finalEmail, name.trim(), finalEmail, 'patient', '1.0');
      } catch (logErr) {
        console.error('Failed to log terms acceptance', logErr);
      }

      setIsSuccess(true);
      setShowOtpScreen(false);
    } else {
      setErrorMessage('Invalid verification code. Please check and try again or use standard bypass code (1234).');
    }
  };

  const handleLaunchDashboard = () => {
    setView('login');
  };

  return (
    <div className="flex-1 max-w-lg w-full mx-auto px-4 md:px-8 py-12" id="patient-register-root">
      {/* Back to Login link */}
      <button 
        onClick={() => {
          if (showOtpScreen) {
            setShowOtpScreen(false);
          } else {
            setView('login');
          }
        }}
        className="mb-6 text-xs font-bold text-[#0A6E6E] hover:underline flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {showOtpScreen ? 'Back to Form' : 'Back to Login Portal'}
      </button>

      {isSuccess ? (
        <div className="bg-white rounded-xl border border-[#D1E5E5] p-8 shadow-md text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-100 animate-bounce">
            🎉
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Profile Created Successfully!</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Congratulations <strong>{name}</strong>! Your digital patient health profile is live and secure.
          </p>

          <div className="bg-[#F0F7F7] border border-[#D1E5E5] rounded-xl p-4 my-6 text-left">
            <span className="text-[10px] font-extrabold text-[#0A6E6E] uppercase block mb-1 tracking-wider">Your Spark Patient Identity card</span>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-[#1A2B3C]">{name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{email ? email : '(No email linked)'}</div>
                {dob && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">
                      Age: {calculateAge(dob)} years old
                    </span>
                    <span className="text-[9px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                      📍 {city}, {state}
                    </span>
                    {latitude && longitude && (
                      <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono font-bold">
                        GPS: {latitude}, {longitude}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="inline-block bg-teal-600 text-white font-mono text-[10px] font-bold px-2 py-1 rounded">
                  {tempId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleLaunchDashboard}
              className="w-full py-3 bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white text-xs font-extrabold rounded-lg shadow-sm cursor-pointer transition-all"
            >
              👉 Proceed to Universal Sign In
            </button>
            <button
              onClick={() => setView('home')}
              className="w-full py-2.5 bg-white border border-[#D1E5E5] text-gray-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      ) : showOtpScreen ? (
        <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 md:p-8 shadow-md">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">Security Check</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Verify Mobile OTP</h2>
            <p className="text-xs text-gray-400 mt-1">We sent a 4-digit verification code to your phone number <strong>{phone}</strong></p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Code Hint */}
          <div className="bg-blue-50/70 border border-blue-200 text-blue-900 rounded-xl p-3 text-xs leading-relaxed mb-6">
            💡 <strong>Simulated SMS Alert:</strong> Your registration code is <span className="font-mono font-bold text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{generatedOtp}</span> (or you can use standard bypass <strong>1234</strong>).
          </div>

          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1.5 text-center">Enter 4-Digit Verification OTP *</label>
              <input 
                type="text" 
                required
                maxLength={4}
                placeholder="XXXX"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center bg-[#F0F7F7] border border-[#D1E5E5] p-3 rounded-lg text-lg tracking-[0.5em] font-mono font-bold outline-none text-[#1A2B3C] focus:bg-white transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 text-white font-extrabold text-xs py-3 rounded-lg shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer mt-2"
            >
              Verify OTP & Complete Registration
            </button>

            <div className="text-center mt-2">
              <button 
                type="button"
                onClick={() => {
                  const mockOtp = String(Math.floor(1000 + Math.random() * 9000));
                  setGeneratedOtp(mockOtp);
                  setErrorMessage('');
                }}
                className="text-xs font-bold text-[#0A6E6E] hover:underline cursor-pointer"
              >
                Resend OTP Code
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#D1E5E5] p-6 md:p-8 shadow-md">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold text-[#0A6E6E] uppercase tracking-wider block mb-1">New Patient Setup</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1A2B3C] font-heading">Register Health Profile</h2>
            <p className="text-xs text-gray-400 mt-1">Create your personal secure profile in 1 simple step</p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-3 text-xs font-bold mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Full Name *</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Email - Optional */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-gray-400 w-4 h-4" />
                <input 
                  type="email" 
                  placeholder="e.g. ramesh.chandra@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                />
              </div>
            </div>

            {/* Phone */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Secure Password *</label>
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

            {/* Date of Birth & Gender Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-[#1A2B3C]">Date of Birth *</label>
                  {dob && (
                    <span className="text-[10px] font-bold text-[#0A6E6E] bg-teal-50 px-1.5 py-0.5 rounded shrink-0">
                      Age: {calculateAge(dob)} yrs
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 text-gray-400 w-4 h-4" />
                  <input 
                    type="date" 
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 pl-9 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1A2B3C] mb-1">Gender *</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#F0F7F7] border border-[#D1E5E5] p-2.5 rounded-lg text-xs font-semibold outline-none text-[#1A2B3C]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Terms and conditions */}
            <TermsConsentCheckbox 
              documentId="patient" 
              isAccepted={agreeToTerms} 
              onChange={setAgreeToTerms} 
            />

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={!agreeToTerms}
              className={`w-full text-white font-extrabold text-xs py-3 rounded-lg shadow-sm transition-all cursor-pointer mt-3 ${
                agreeToTerms ? 'bg-[#0A6E6E] hover:bg-[#0A6E6E]/95 active:scale-[0.99]' : 'bg-slate-300 cursor-not-allowed opacity-70'
              }`}
            >
              Create Patient Health Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
