/**
 * Doct Spark Patient Wallet & Referral System Utilities
 */

export interface WalletTransaction {
  id: string;
  timestamp: string; // ISO string
  type: 'Credit' | 'Debit';
  amount: number;
  source: 'Referral' | 'Platform Refund' | 'Manual Admin Credit' | 'Manual Admin Debit' | 'Platform Fee Payment';
  description: string;
  status: 'Approved' | 'Suspended' | 'Cancelled' | 'Completed';
}

export interface PatientWallet {
  patientEmail: string;
  patientName: string;
  balance: number;
  referralEarnings: number;
  refundEarnings: number;
  referralCode: string;
  referredByCode?: string; // code of the referrer
  transactions: WalletTransaction[];
}

export interface WalletAdminConfig {
  walletPaymentsEnabled: boolean;
  minimumWalletUsageAmount: number; // default ₹50
  refundRulesEnabled: boolean;
}

export interface ReferralAdminConfig {
  referralProgramEnabled: boolean;
  referralRewardPct: number; // default 1% (0.01)
  requireApproval: boolean; // default false
}

// Default Configuration getters
export function getWalletAdminConfig(): WalletAdminConfig {
  const saved = localStorage.getItem('ds_admin_wallet_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  const defaultConfig: WalletAdminConfig = {
    walletPaymentsEnabled: true,
    minimumWalletUsageAmount: 50,
    refundRulesEnabled: true
  };
  localStorage.setItem('ds_admin_wallet_config', JSON.stringify(defaultConfig));
  return defaultConfig;
}

export function saveWalletAdminConfig(config: WalletAdminConfig) {
  localStorage.setItem('ds_admin_wallet_config', JSON.stringify(config));
}

export function getReferralAdminConfig(): ReferralAdminConfig {
  const saved = localStorage.getItem('ds_admin_referral_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  const defaultConfig: ReferralAdminConfig = {
    referralProgramEnabled: true,
    referralRewardPct: 1, // 1%
    requireApproval: false
  };
  localStorage.setItem('ds_admin_referral_config', JSON.stringify(defaultConfig));
  return defaultConfig;
}

export function saveReferralAdminConfig(config: ReferralAdminConfig) {
  localStorage.setItem('ds_admin_referral_config', JSON.stringify(config));
}

// Core Wallets Retrieval & Storage
export function getStoredWallets(): Record<string, PatientWallet> {
  const saved = localStorage.getItem('ds_patient_wallets');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  // Seed initial wallets for demonstration
  const initialWallets: Record<string, PatientWallet> = {};
  localStorage.setItem('ds_patient_wallets', JSON.stringify(initialWallets));
  return initialWallets;
}

export function saveWallets(wallets: Record<string, PatientWallet>) {
  localStorage.setItem('ds_patient_wallets', JSON.stringify(wallets));
}

export function getOrCreatePatientWallet(patientEmail: string, patientName?: string): PatientWallet {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  
  if (wallets[emailKey]) {
    return wallets[emailKey];
  }
  
  const name = patientName || extractNameFromEmail(patientEmail);
  const referralCode = generateReferralCodeForPatient(name);
  
  const newWallet: PatientWallet = {
    patientEmail: emailKey,
    patientName: name,
    balance: 0,
    referralEarnings: 0,
    refundEarnings: 0,
    referralCode,
    transactions: []
  };
  
  wallets[emailKey] = newWallet;
  saveWallets(wallets);
  return newWallet;
}

function extractNameFromEmail(email: string): string {
  const username = email.split('@')[0];
  if (username.includes('.')) {
    return username.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function generateReferralCodeForPatient(name: string): string {
  const prefix = name.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'DSP';
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}${num}`;
}

// Perform a Wallet Credit operation
export function creditPatientWallet(
  patientEmail: string,
  amount: number,
  source: WalletTransaction['source'],
  description: string,
  status: WalletTransaction['status'] = 'Completed'
): PatientWallet {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  const wallet = wallets[emailKey] || getOrCreatePatientWallet(emailKey);
  
  const transaction: WalletTransaction = {
    id: `wt-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    type: 'Credit',
    amount,
    source,
    description,
    status
  };
  
  wallet.transactions.unshift(transaction);
  
  if (status === 'Completed') {
    wallet.balance += amount;
    if (source === 'Referral') {
      wallet.referralEarnings += amount;
    } else if (source === 'Platform Refund') {
      wallet.refundEarnings += amount;
    }
  }
  
  wallets[emailKey] = wallet;
  saveWallets(wallets);
  return wallet;
}

// Perform a Wallet Debit operation
export function debitPatientWallet(
  patientEmail: string,
  amount: number,
  source: WalletTransaction['source'],
  description: string
): PatientWallet | null {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  const wallet = wallets[emailKey];
  
  if (!wallet || wallet.balance < amount) {
    return null; // Insufficient balance or wallet not found
  }
  
  const transaction: WalletTransaction = {
    id: `wt-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    type: 'Debit',
    amount,
    source,
    description,
    status: 'Completed'
  };
  
  wallet.transactions.unshift(transaction);
  wallet.balance -= amount;
  
  wallets[emailKey] = wallet;
  saveWallets(wallets);
  return wallet;
}

// Referral program apply code
export function applyReferralCode(patientEmail: string, code: string): { success: boolean; message: string } {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  const wallet = wallets[emailKey] || getOrCreatePatientWallet(emailKey);
  
  const codeNormalized = code.trim().toUpperCase();
  if (!codeNormalized) {
    return { success: false, message: 'Please enter a referral code.' };
  }
  
  if (wallet.referralCode === codeNormalized) {
    return { success: false, message: 'You cannot refer yourself!' };
  }
  
  if (wallet.referredByCode) {
    return { success: false, message: 'You have already applied a referral code.' };
  }
  
  // Find referrer
  let referrerWallet: PatientWallet | null = null;
  for (const key of Object.keys(wallets)) {
    if (wallets[key].referralCode === codeNormalized) {
      referrerWallet = wallets[key];
      break;
    }
  }
  
  if (!referrerWallet) {
    return { success: false, message: 'Invalid referral code. Please check and try again.' };
  }
  
  // Prevent duplicate/fake referrals (e.g. sharing IPs/same person, but for simulation we just prevent self-referrals and mark referredByCode)
  wallet.referredByCode = codeNormalized;
  wallets[emailKey] = wallet;
  saveWallets(wallets);
  
  return { 
    success: true, 
    message: `Referral code successfully linked to referrer ${referrerWallet.patientName}! Reward will be processed on your first successful appointment booking.` 
  };
}

// Complete first appointment refer reward check
export function processFirstAppointmentReferralReward(patientEmail: string, appointmentAmount: number, appointmentId: string) {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  const wallet = wallets[emailKey];
  
  if (!wallet || !wallet.referredByCode) return;
  
  // Check if they have other successful appointments
  const savedAptsRaw = localStorage.getItem('ds_appointments');
  if (savedAptsRaw) {
    try {
      const appointments = JSON.parse(savedAptsRaw);
      const successfulCount = appointments.filter(
        (a: any) => (a.patientId === patientEmail || a.patientName === wallet.patientName) && 
        a.status === 'Completed' && a.id !== appointmentId
      ).length;
      
      if (successfulCount > 0) {
        // Not their first successful appointment!
        return;
      }
    } catch (e) {
      // ignore
    }
  }
  
  // Find referrer wallet
  let referrerEmail: string | null = null;
  for (const key of Object.keys(wallets)) {
    if (wallets[key].referralCode === wallet.referredByCode) {
      referrerEmail = key;
      break;
    }
  }
  
  if (referrerEmail) {
    const config = getReferralAdminConfig();
    if (!config.referralProgramEnabled) return;
    
    // Reward is 1% (or configured percentage) of booked appointment fee
    const rewardPercentage = config.referralRewardPct / 100;
    const rewardAmount = Math.max(1, Math.round(appointmentAmount * rewardPercentage));
    
    const rewardStatus = config.requireApproval ? 'Approved' : 'Completed';
    
    creditPatientWallet(
      referrerEmail,
      rewardAmount,
      'Referral',
      `Referral reward: Referred patient ${wallet.patientName} completed their first successful appointment (${appointmentId}).`,
      rewardStatus
    );
  }
}

// Check and process automatic expiration of pending appointments older than 24 hours
export function processPendingAppointmentsExpiry(): { expiredCount: number; refundedAmount: number } {
  const savedAptsRaw = localStorage.getItem('ds_appointments');
  if (!savedAptsRaw) return { expiredCount: 0, refundedAmount: 0 };
  
  try {
    const appointments = JSON.parse(savedAptsRaw);
    let expiredCount = 0;
    let refundedAmount = 0;
    
    const updatedApts = appointments.map((apt: any) => {
      if (apt.status === 'Pending') {
        const createdTime = apt.createdAt ? new Date(apt.createdAt).getTime() : new Date(`${apt.date} ${apt.time}`).getTime() - (12 * 60 * 60 * 1000);
        const ageMs = Date.now() - createdTime;
        const limitMs = 24 * 60 * 60 * 1000; // 24 hours
        
        if (ageMs > limitMs) {
          apt.status = 'Expired';
          apt.paymentStatus = 'Platform Charge Refunded';
          expiredCount++;
          
          const patientEmail = apt.patientId && apt.patientId.includes('@') ? apt.patientId : 'aarav.mehta@doctspark.in';
          creditPatientWallet(
            patientEmail,
            20,
            'Platform Refund',
            `Automatic ₹20 Platform Service Fee refund for expired appointment ${apt.id} with ${apt.doctorName}.`
          );
          refundedAmount += 20;
        }
      }
      return apt;
    });
    
    if (expiredCount > 0) {
      localStorage.setItem('ds_appointments', JSON.stringify(updatedApts));
    }
    
    return { expiredCount, refundedAmount };
  } catch (e) {
    return { expiredCount: 0, refundedAmount: 0 };
  }
}

// Get all patient wallets as an array
export function getAllPatientWalletsList(): PatientWallet[] {
  const wallets = getStoredWallets();
  return Object.values(wallets);
}

// Admin Release / Approval of a pending transaction
export function approveWalletTransaction(patientEmail: string, txId: string): { success: boolean; message: string } {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  const wallet = wallets[emailKey];
  if (!wallet) return { success: false, message: 'Wallet not found.' };

  const tx = wallet.transactions.find(t => t.id === txId);
  if (!tx) return { success: false, message: 'Transaction not found.' };

  if (tx.status === 'Completed') {
    return { success: false, message: 'Transaction is already completed.' };
  }

  // Update status to Completed
  tx.status = 'Completed';
  
  // Credit the amount to the balance
  wallet.balance += tx.amount;
  if (tx.source === 'Referral') {
    wallet.referralEarnings += tx.amount;
  } else if (tx.source === 'Platform Refund') {
    wallet.refundEarnings += tx.amount;
  }

  wallets[emailKey] = wallet;
  saveWallets(wallets);

  return { success: true, message: 'Transaction approved and balance credited.' };
}

// Admin Cancellation / Rejection of a pending transaction
export function rejectWalletTransaction(patientEmail: string, txId: string): { success: boolean; message: string } {
  const wallets = getStoredWallets();
  const emailKey = patientEmail.toLowerCase().trim();
  const wallet = wallets[emailKey];
  if (!wallet) return { success: false, message: 'Wallet not found.' };

  const tx = wallet.transactions.find(t => t.id === txId);
  if (!tx) return { success: false, message: 'Transaction not found.' };

  if (tx.status !== 'Approved') {
    return { success: false, message: `Cannot reject transaction with status ${tx.status}.` };
  }

  tx.status = 'Cancelled';
  
  wallets[emailKey] = wallet;
  saveWallets(wallets);

  return { success: true, message: 'Transaction rejected/cancelled successfully.' };
}

// Direct admin override credit/debit
export function performAdminWalletAdjustment(patientEmail: string, amount: number, type: 'Credit' | 'Debit', description: string): { success: boolean; message: string } {
  const emailKey = patientEmail.toLowerCase().trim();
  if (type === 'Credit') {
    creditPatientWallet(emailKey, amount, 'Manual Admin Credit', description, 'Completed');
    return { success: true, message: `Successfully credited ₹${amount.toFixed(2)} to ${patientEmail}.` };
  } else {
    const success = debitPatientWallet(emailKey, amount, 'Manual Admin Debit', description);
    if (success) {
      return { success: true, message: `Successfully debited ₹${amount.toFixed(2)} from ${patientEmail}.` };
    } else {
      return { success: false, message: 'Insufficient balance or wallet not found.' };
    }
  }
}


