/**
 * DOCT SPARK Partner Target, Reward & Countdown System Utilities
 */

import { Partner, Doctor, Clinic, Appointment, TargetConfig, RewardEligibilityRecord } from '../types';
import { addAuditLog } from './commissionUtils';

// Helper to generate a unique ID
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

// Default Target Settings Configuration
const DEFAULT_TARGET_CONFIG: TargetConfig = {
  id: 'default',
  districtOnboardTarget: 100,
  stateOnboardTarget: 1000,
  districtAppointmentTarget: 5000,
  stateAppointmentTarget: 10000,
  countdownDurationDays: 180,
  basicSalaryAmount: 25000,
  travelAllowanceAmount: 8000,
  internationalTourEligible: true,
  rewardProgramEnabled: true,
  achievementCertificateEnabled: true,
};

// 1. Get Target Configuration
export function getTargetConfig(): TargetConfig {
  const stored = localStorage.getItem('ds_target_config');
  if (stored) {
    try {
      return { ...DEFAULT_TARGET_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse target config', e);
    }
  }
  localStorage.setItem('ds_target_config', JSON.stringify(DEFAULT_TARGET_CONFIG));
  return DEFAULT_TARGET_CONFIG;
}

// 2. Save Target Configuration
export function saveTargetConfig(config: TargetConfig, actor: string = 'Super Admin'): void {
  localStorage.setItem('ds_target_config', JSON.stringify(config));
  addAuditLog(
    'Update Target Settings',
    actor,
    `Updated Targets: Dist Onboard (${config.districtOnboardTarget}), Dist Appt (${config.districtAppointmentTarget}), State Onboard (${config.stateOnboardTarget}), State Appt (${config.stateAppointmentTarget}), Duration: ${config.countdownDurationDays} Days`
  );
}

// 3. Get Reward Eligibility Records
export function getRewardEligibilities(): RewardEligibilityRecord[] {
  const stored = localStorage.getItem('ds_reward_eligibilities');
  return stored ? JSON.parse(stored) : [];
}

// 4. Save Reward Eligibility Records
export function saveRewardEligibilities(records: RewardEligibilityRecord[]): void {
  localStorage.setItem('ds_reward_eligibilities', JSON.stringify(records));
}

// 5. Add Reward Eligibility Record
export function addRewardEligibility(record: Omit<RewardEligibilityRecord, 'id'>): RewardEligibilityRecord {
  const records = getRewardEligibilities();
  const newRecord: RewardEligibilityRecord = {
    ...record,
    id: generateUniqueId('RWD'),
  };
  records.unshift(newRecord);
  saveRewardEligibilities(records);
  return newRecord;
}

// 6. Get Partner's Registration Date or default to 180 days ago minus some time for demo
export function getPartnerRegistrationDate(partner: Partner): Date {
  if (partner.createdAt) {
    return new Date(partner.createdAt);
  }
  
  // If no createdAt is present, let's look for a saved registration date for this partner
  const key = `ds_partner_reg_${partner.id}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return new Date(stored);
  }
  
  // For demo/existing partners, let's assign a stable registration date (e.g., 60 days ago so the countdown is active)
  const regDate = new Date();
  regDate.setDate(regDate.getDate() - 45); // 45 days ago
  const dateStr = regDate.toISOString();
  localStorage.setItem(key, dateStr);
  
  // Also save it back to the partner object if we can
  try {
    const partnersRaw = localStorage.getItem('ds_partners');
    if (partnersRaw) {
      const partners: Partner[] = JSON.parse(partnersRaw);
      const index = partners.findIndex(p => p.id === partner.id);
      if (index !== -1) {
        partners[index].createdAt = dateStr;
        localStorage.setItem('ds_partners', JSON.stringify(partners));
      }
    }
  } catch (e) {
    console.error(e);
  }

  return regDate;
}

// Helper to manually set partner registration date for demo purposes
export function setPartnerRegistrationDate(partnerId: string, daysAgo: number): string {
  const regDate = new Date();
  regDate.setDate(regDate.getDate() - daysAgo);
  const dateStr = regDate.toISOString();
  localStorage.setItem(`ds_partner_reg_${partnerId}`, dateStr);
  
  try {
    const partnersRaw = localStorage.getItem('ds_partners');
    if (partnersRaw) {
      const partners: Partner[] = JSON.parse(partnersRaw);
      const index = partners.findIndex(p => p.id === partnerId);
      if (index !== -1) {
        partners[index].createdAt = dateStr;
        localStorage.setItem('ds_partners', JSON.stringify(partners));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return dateStr;
}

// 7. Core Target Performance Calculation
export interface PartnerPerformance {
  onboardsCount: number;
  onboardsTarget: number;
  onboardsProgressPct: number;
  appointmentsCount: number;
  appointmentsTarget: number;
  appointmentsProgressPct: number;
  overallProgressPct: number;
  daysRemaining: number;
  timeLeftFormatted: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  };
  status: 'Target Achieved' | 'In Progress' | 'Deadline Expired' | 'Eligible for Salary Review';
  isEligible: boolean;
  registrationDateStr: string;
  endDateStr: string;
}

export function calculatePartnerPerformance(
  partner: Partner,
  doctors: Doctor[],
  clinics: Clinic[],
  appointments: Appointment[],
  config: TargetConfig
): PartnerPerformance {
  const regDate = getPartnerRegistrationDate(partner);
  const durationMs = config.countdownDurationDays * 24 * 60 * 60 * 1000;
  const endDate = new Date(regDate.getTime() + durationMs);
  
  const now = new Date();
  const timeDiff = endDate.getTime() - now.getTime();
  const expired = timeDiff <= 0;
  
  // Format remaining time
  let days = 0, hours = 0, minutes = 0, seconds = 0;
  if (!expired) {
    days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  }

  // 1. Calculate Onboards Count
  const onboardedDocs = doctors.filter(d => {
    if (partner.partnerType === 'District') {
      return d.onboardedBy === partner.id;
    } else {
      // State Partner: gets credit for all doctors in their state
      return d.state === partner.assignedState || d.onboardedBy === partner.id;
    }
  });

  const onboardedClinics = clinics.filter(c => {
    if (partner.partnerType === 'District') {
      return c.onboardedBy === partner.id;
    } else {
      // State Partner
      return c.state === partner.assignedState || c.onboardedBy === partner.id;
    }
  });

  const onboardsCount = onboardedDocs.length + onboardedClinics.length;
  const onboardsTarget = partner.partnerType === 'District' 
    ? config.districtOnboardTarget 
    : config.stateOnboardTarget;
  const onboardsProgressPct = Math.min(100, Math.round((onboardsCount / onboardsTarget) * 100)) || 0;

  // 2. Calculate Completed Appointments Count
  const onboardedDocIds = onboardedDocs.map(d => d.id);
  const successfulAppointments = appointments.filter(apt => 
    onboardedDocIds.includes(apt.doctorId) && apt.status === 'Completed'
  );
  
  const appointmentsCount = successfulAppointments.length;
  const appointmentsTarget = partner.partnerType === 'District' 
    ? config.districtAppointmentTarget 
    : config.stateAppointmentTarget;
  const appointmentsProgressPct = Math.min(100, Math.round((appointmentsCount / appointmentsTarget) * 100)) || 0;

  // Overall completion percentage (average of both criteria)
  const overallProgressPct = Math.round((onboardsProgressPct + appointmentsProgressPct) / 2);

  // Status computation
  const achieved = onboardsCount >= onboardsTarget && appointmentsCount >= appointmentsTarget;
  
  let status: 'Target Achieved' | 'In Progress' | 'Deadline Expired' | 'Eligible for Salary Review' = 'In Progress';
  if (achieved) {
    status = config.rewardProgramEnabled ? 'Eligible for Salary Review' : 'Target Achieved';
  } else if (expired) {
    status = 'Deadline Expired';
  }

  return {
    onboardsCount,
    onboardsTarget,
    onboardsProgressPct,
    appointmentsCount,
    appointmentsTarget,
    appointmentsProgressPct,
    overallProgressPct,
    daysRemaining: expired ? 0 : days,
    timeLeftFormatted: {
      days,
      hours,
      minutes,
      seconds,
      expired,
    },
    status,
    isEligible: achieved,
    registrationDateStr: regDate.toLocaleDateString(),
    endDateStr: endDate.toLocaleDateString(),
  };
}

// 8. Handle Target Achievements and trigger Notifications
export function checkAndTriggerRewards(
  partner: Partner,
  performance: PartnerPerformance,
  config: TargetConfig
): { triggered: boolean; notifications: string[] } {
  if (!performance.isEligible) {
    return { triggered: false, notifications: [] };
  }

  const eligibilities = getRewardEligibilities();
  const alreadyRegistered = eligibilities.some(e => e.partnerId === partner.id);
  
  if (alreadyRegistered) {
    return { triggered: false, notifications: [] };
  }

  // Generate reward eligibility record
  const rewardRecord = addRewardEligibility({
    partnerId: partner.id,
    partnerName: partner.name,
    partnerType: partner.partnerType,
    dateAchieved: new Date().toISOString().split('T')[0],
    onboardsCount: performance.onboardsCount,
    appointmentsCount: performance.appointmentsCount,
    basicSalary: config.basicSalaryAmount,
    travelAllowance: config.travelAllowanceAmount,
    tourEligible: config.internationalTourEligible,
    certificateIssued: config.achievementCertificateEnabled,
    state: partner.assignedState,
    district: partner.assignedDistrict,
    status: 'Pending Review',
  });

  // Simulated notifications array
  const systemLogs: string[] = [];
  const timestamp = new Date().toLocaleTimeString();

  // 1. In-App Notification
  const inAppMsg = `🏆 TARGET ACHIEVED! Congratulations ${partner.name}! You have successfully completed your ${partner.partnerType} Partner target. Eligible for basic salary (₹${config.basicSalaryAmount.toLocaleString()}) & rewards!`;
  saveInAppNotification(partner.id, inAppMsg);
  systemLogs.push(`[${timestamp}] 📱 In-App Notification: Transmitted to Partner ${partner.name}`);

  // 2. Email Notification
  const emailMsg = `Subject: DOCT SPARK Target Achieved!\nDear ${partner.name},\nWe are thrilled to inform you that you have met your targets within ${config.countdownDurationDays} days! Basic Salary Eligibility Approved.`;
  systemLogs.push(`[${timestamp}] ✉ Email Notification: Sent to ${partner.email}`);

  // 3. SMS Notification
  const smsMsg = `DOCT SPARK: Dear ${partner.name}, congratulations on achieving your ${partner.partnerType} Partner target! Check your dashboard for salary and tour package details.`;
  systemLogs.push(`[${timestamp}] 💬 SMS Notification: Sent to ${partner.phone}`);

  // 4. Notify Super Admin
  const adminMsg = `🚨 Partner Achievement: ${partner.partnerType} Partner ${partner.name} (${partner.assignedState}) has completed their onboarding & appointment target! Reward Record generated (ID: ${rewardRecord.id}).`;
  saveInAppNotification('superadmin', adminMsg);
  systemLogs.push(`[${timestamp}] ⚙ Admin Alert: Super Admin console notified of achievement.`);

  // Write audit log
  addAuditLog(
    'Target Achieved',
    partner.name,
    `Successfully achieved ${partner.partnerType} Partner Target. Onboarded: ${performance.onboardsCount}, Successful Appointments: ${performance.appointmentsCount}. Salary and rewards eligibility initialized.`
  );

  return { triggered: true, notifications: systemLogs };
}

// 9. Persistent In-App Notification Storage
export interface AppNotification {
  id: string;
  recipientId: string; // 'superadmin' or partner ID
  text: string;
  time: string;
  read: boolean;
}

export function getInAppNotifications(recipientId: string): AppNotification[] {
  const stored = localStorage.getItem(`ds_notifications_${recipientId}`);
  return stored ? JSON.parse(stored) : [];
}

export function saveInAppNotification(recipientId: string, text: string): void {
  const notifications = getInAppNotifications(recipientId);
  const newNotif: AppNotification = {
    id: generateUniqueId('NTF'),
    recipientId,
    text,
    time: 'Just now',
    read: false,
  };
  notifications.unshift(newNotif);
  localStorage.setItem(`ds_notifications_${recipientId}`, JSON.stringify(notifications));
}

export function markInAppNotificationsRead(recipientId: string): void {
  const notifications = getInAppNotifications(recipientId);
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem(`ds_notifications_${recipientId}`, JSON.stringify(updated));
}
