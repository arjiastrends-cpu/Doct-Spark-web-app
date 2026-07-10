/**
 * DOCT SPARK Commission & Revenue Sharing System Utilities
 */

import { Partner, Doctor, Clinic, Appointment, CommissionConfig, CommissionRecord, PayoutReceipt, AuditLog, Pharmacy, MedicineOrder, Laboratory, LabBooking } from '../types';
import { MOCK_DOCTORS } from './mockData';

// Helper to generate a unique ID with prefix
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Format Date as YYYY-MM-DD
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get Year-Month string
function getMonthString(dateStr: string): string {
  return dateStr.substring(0, 7); // "YYYY-MM"
}

// Get Week Number string
function getWeekString(dateStr: string): string {
  const d = new Date(dateStr);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

// 1. Get Commission Config
export function getCommissionConfig(): CommissionConfig {
  const stored = localStorage.getItem('ds_commission_config');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure city percentages exist
      if (parsed.appointmentCityPct === undefined) parsed.appointmentCityPct = 20;
      if (parsed.subscriptionCityPct === undefined) parsed.subscriptionCityPct = 20;
      if (parsed.labDistrictPct === undefined) parsed.labDistrictPct = 20;
      if (parsed.labStatePct === undefined) parsed.labStatePct = 10;
      if (parsed.labCityPct === undefined) parsed.labCityPct = 20;
      if (parsed.labCompanyPct === undefined) parsed.labCompanyPct = 50;
      return parsed;
    } catch (e) {
      console.error('Failed to parse commission config, using default', e);
    }
  }

  // Default configuration as per specifications
  const defaultConfig: CommissionConfig = {
    id: 'default',
    appointmentCityPct: 20,     // 20% of platform charge
    appointmentDistrictPct: 20, // 20% of platform charge
    appointmentStatePct: 10,    // 10% of platform charge
    appointmentCompanyPct: 50,  // 50% of platform charge
    subscriptionCityPct: 20,     // 20% of sub fee (₹1,000)
    subscriptionDistrictPct: 30, // 30% of sub fee (₹1,500)
    subscriptionStatePct: 10,    // 10% of sub fee (₹500)
    subscriptionCompanyPct: 40,  // 40% of sub fee (₹2,000)
    labCityPct: 20,
    labDistrictPct: 20,
    labStatePct: 10,
    labCompanyPct: 50,
    payoutSchedule: 'Weekly',
    nextPayoutDate: '2026-07-03' // Example upcoming Friday
  };

  localStorage.setItem('ds_commission_config', JSON.stringify(defaultConfig));
  return defaultConfig;
}

// 2. Save Commission Config
export function saveCommissionConfig(config: CommissionConfig, actor: string = 'Super Admin'): void {
  localStorage.setItem('ds_commission_config', JSON.stringify(config));
  addAuditLog(
    'Update Commission Configuration',
    actor,
    `Updated percentages: Subscription (City: ${config.subscriptionCityPct}%, Dist: ${config.subscriptionDistrictPct}%, State: ${config.subscriptionStatePct}%), Appointments (City: ${config.appointmentCityPct}%, Dist: ${config.appointmentDistrictPct}%, State: ${config.appointmentStatePct}%), Schedule: ${config.payoutSchedule}`
  );
}

// 3. Get Audit Logs
export function getAuditLogs(): AuditLog[] {
  const stored = localStorage.getItem('ds_commission_audit_logs');
  return stored ? JSON.parse(stored) : [];
}

// 4. Add Audit Log
export function addAuditLog(action: string, actor: string, details: string): void {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    id: generateUniqueId('LOG'),
    timestamp: new Date().toLocaleString(),
    action,
    actor,
    details
  };
  logs.unshift(newLog); // newer first
  localStorage.setItem('ds_commission_audit_logs', JSON.stringify(logs.slice(0, 500))); // Limit to last 500 logs
}

// 5. Get Payout Receipts
export function getPayoutReceipts(): PayoutReceipt[] {
  const stored = localStorage.getItem('ds_commission_payout_receipts');
  return stored ? JSON.parse(stored) : [];
}

// 6. Save Payout Receipts
export function savePayoutReceipts(receipts: PayoutReceipt[]): void {
  localStorage.setItem('ds_commission_payout_receipts', JSON.stringify(receipts));
}

// Helper to find parent State Partner for a given District Partner
export function findParentStatePartner(districtPartner: Partner, partners: Partner[]): Partner | undefined {
  return partners.find(p => p.partnerType === 'State' && p.assignedState === districtPartner.assignedState);
}

// 7. Get Commission Records (Generates initial mock data if empty)
export function getCommissionRecords(): CommissionRecord[] {
  const stored = localStorage.getItem('ds_commission_records');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse commission records', e);
    }
  }

  // Generate initial records from existing data to make the app fully alive!
  const records: CommissionRecord[] = [];
  const partnersRaw = localStorage.getItem('ds_partners');
  const partners: Partner[] = partnersRaw ? JSON.parse(partnersRaw) : [];

  const doctorsRaw = localStorage.getItem('ds_doctors');
  const doctors: Doctor[] = doctorsRaw ? JSON.parse(doctorsRaw) : MOCK_DOCTORS;

  const clinicsRaw = localStorage.getItem('ds_clinics');
  const clinics: Clinic[] = clinicsRaw ? JSON.parse(clinicsRaw) : [];

  const appointmentsRaw = localStorage.getItem('ds_appointments');
  const appointments: Appointment[] = appointmentsRaw ? JSON.parse(appointmentsRaw) : [];

  const config = getCommissionConfig();

  // Create audit log for initialization
  addAuditLog('System Initialization', 'System', 'Commission engine initialized. Seeding historic commission data.');

  // A. Seed Subscription Commissions from doctors that have onboardedBy and subscriptionPaid
  doctors.forEach((doc, idx) => {
    if (doc.onboardedBy && doc.subscriptionPaid) {
      const partner = partners.find(p => p.id === doc.onboardedBy || p.referralId === doc.onboardedBy);
      if (partner) {
        let cityId: string | undefined = undefined;
        let cityName: string | undefined = undefined;
        let distId: string | undefined = undefined;
        let distName: string | undefined = undefined;
        let stateId: string | undefined = undefined;
        let stateName: string | undefined = undefined;

        if (partner.partnerType === 'City') {
          cityId = partner.id;
          cityName = partner.name;
          const parentDist = partners.find(p => p.partnerType === 'District' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState);
          if (parentDist) {
            distId = parentDist.id;
            distName = parentDist.name;
            const parentState = findParentStatePartner(parentDist, partners);
            if (parentState) {
              stateId = parentState.id;
              stateName = parentState.name;
            }
          } else {
            const parentState = partners.find(p => p.partnerType === 'State' && p.assignedState === partner.assignedState);
            if (parentState) {
              stateId = parentState.id;
              stateName = parentState.name;
            }
          }
        } else if (partner.partnerType === 'District') {
          distId = partner.id;
          distName = partner.name;
          const parentState = findParentStatePartner(partner, partners);
          if (parentState) {
            stateId = parentState.id;
            stateName = parentState.name;
          }
        } else {
          stateId = partner.id;
          stateName = partner.name;
        }

        // 50% company, 40% district, 10% state of ₹5,000
        const amount = 5000;
        const subCityComm = cityId ? amount * (config.subscriptionCityPct / 100) : 0;
        const subDistComm = distId ? amount * (config.subscriptionDistrictPct / 100) : 0;
        const subStateComm = stateId ? amount * (config.subscriptionStatePct / 100) : 0;
        const companyComm = amount - (subCityComm + subDistComm + subStateComm);

        // Status is 'Paid' for some older ones, 'Approved' for newer ones
        const status = idx % 3 === 0 ? 'Approved' : 'Paid';
        const date = `2026-06-${(10 + (idx % 15)).toString().padStart(2, '0')}`;

        records.push({
          id: `TXN-SUB-${1000 + idx}`,
          type: 'Subscription',
          sourceId: doc.id,
          sourceName: `Dr. ${doc.name}`,
          amount,
          platformCharge: amount,
          cityPartnerId: cityId,
          cityPartnerName: cityName,
          cityPartnerCommission: subCityComm,
          districtPartnerId: distId,
          districtPartnerName: distName,
          districtPartnerCommission: subDistComm,
          statePartnerId: stateId,
          statePartnerName: stateName,
          statePartnerCommission: subStateComm,
          companyCommission: companyComm,
          status,
          date,
          month: getMonthString(date),
          week: getWeekString(date)
        });
      }
    }
  });

  // B. Seed Subscription Commissions from clinics
  clinics.forEach((cl, idx) => {
    if (cl.onboardedBy && cl.subscriptionPaid) {
      const partner = partners.find(p => p.id === cl.onboardedBy || p.referralId === cl.onboardedBy);
      if (partner) {
        let cityId: string | undefined = undefined;
        let cityName: string | undefined = undefined;
        let distId: string | undefined = undefined;
        let distName: string | undefined = undefined;
        let stateId: string | undefined = undefined;
        let stateName: string | undefined = undefined;

        if (partner.partnerType === 'City') {
          cityId = partner.id;
          cityName = partner.name;
          const parentDist = partners.find(p => p.partnerType === 'District' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState);
          if (parentDist) {
            distId = parentDist.id;
            distName = parentDist.name;
            const parentState = findParentStatePartner(parentDist, partners);
            if (parentState) {
              stateId = parentState.id;
              stateName = parentState.name;
            }
          } else {
            const parentState = partners.find(p => p.partnerType === 'State' && p.assignedState === partner.assignedState);
            if (parentState) {
              stateId = parentState.id;
              stateName = parentState.name;
            }
          }
        } else if (partner.partnerType === 'District') {
          distId = partner.id;
          distName = partner.name;
          const parentState = findParentStatePartner(partner, partners);
          if (parentState) {
            stateId = parentState.id;
            stateName = parentState.name;
          }
        } else {
          stateId = partner.id;
          stateName = partner.name;
        }

        const amount = 5000;
        const subCityComm = cityId ? amount * (config.subscriptionCityPct / 100) : 0;
        const subDistComm = distId ? amount * (config.subscriptionDistrictPct / 100) : 0;
        const subStateComm = stateId ? amount * (config.subscriptionStatePct / 100) : 0;
        const companyComm = amount - (subCityComm + subDistComm + subStateComm);

        const status = idx % 2 === 0 ? 'Approved' : 'Paid';
        const date = `2026-06-${(12 + (idx % 10)).toString().padStart(2, '0')}`;

        records.push({
          id: `TXN-SUBC-${2000 + idx}`,
          type: 'Subscription',
          sourceId: cl.id,
          sourceName: cl.name,
          amount,
          platformCharge: amount,
          cityPartnerId: cityId,
          cityPartnerName: cityName,
          cityPartnerCommission: subCityComm,
          districtPartnerId: distId,
          districtPartnerName: distName,
          districtPartnerCommission: subDistComm,
          statePartnerId: stateId,
          statePartnerName: stateName,
          statePartnerCommission: subStateComm,
          companyCommission: companyComm,
          status,
          date,
          month: getMonthString(date),
          week: getWeekString(date)
        });
      }
    }
  });

  // C. Seed Appointment Booking platform charges (5%)
  // We can manufacture some appointments or look at existing ones.
  // If `appointments` list is empty, let's seed some mock appointment commissions to show activity
  const sourceAppointments = appointments.length > 0 ? appointments : [
    { id: 'apt-1', doctorId: 'doc-1', doctorName: 'Dr. Rajesh Khanna', patientName: 'John Doe', fee: 800, date: '2026-06-25', status: 'Completed' },
    { id: 'apt-2', doctorId: 'doc-1', doctorName: 'Dr. Rajesh Khanna', patientName: 'Jane Smith', fee: 800, date: '2026-06-26', status: 'Completed' },
    { id: 'apt-3', doctorId: 'doc-2', doctorName: 'Dr. Anjali Desai', patientName: 'Ramesh Kumar', fee: 500, date: '2026-06-27', status: 'Completed' },
    { id: 'apt-4', doctorId: 'doc-1', doctorName: 'Dr. Rajesh Khanna', patientName: 'Vijay Patel', fee: 800, date: '2026-06-24', status: 'Cancelled' }
  ];

  sourceAppointments.forEach((apt: any, idx) => {
    const doc = doctors.find(d => d.id === apt.doctorId);
    // Even if doc doesn't have onboardedBy, we can assign a demo partner for rich visualization
    const partnerId = doc?.onboardedBy || 'part-demo-district';
    const partner = partners.find(p => p.id === partnerId || p.referralId === partnerId);

    if (partner) {
      let cityId: string | undefined = undefined;
      let cityName: string | undefined = undefined;
      let distId: string | undefined = undefined;
      let distName: string | undefined = undefined;
      let stateId: string | undefined = undefined;
      let stateName: string | undefined = undefined;

      if (partner.partnerType === 'City') {
        cityId = partner.id;
        cityName = partner.name;
        const parentDist = partners.find(p => p.partnerType === 'District' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState);
        if (parentDist) {
          distId = parentDist.id;
          distName = parentDist.name;
          const parentState = findParentStatePartner(parentDist, partners);
          if (parentState) {
            stateId = parentState.id;
            stateName = parentState.name;
          }
        } else {
          const parentState = partners.find(p => p.partnerType === 'State' && p.assignedState === partner.assignedState);
          if (parentState) {
            stateId = parentState.id;
            stateName = parentState.name;
          }
        }
      } else if (partner.partnerType === 'District') {
        distId = partner.id;
        distName = partner.name;
        const parentState = findParentStatePartner(partner, partners);
        if (parentState) {
          stateId = parentState.id;
          stateName = parentState.name;
        }
      } else {
        stateId = partner.id;
        stateName = partner.name;
      }

      const originalFee = apt.fee || 500;
      const platformCharge = originalFee * 0.05; // 5% platform charge

      const aptCityComm = cityId ? platformCharge * (config.appointmentCityPct / 100) : 0;
      const aptDistComm = distId ? platformCharge * (config.appointmentDistrictPct / 100) : 0;
      const aptStateComm = stateId ? platformCharge * (config.appointmentStatePct / 100) : 0;
      const companyComm = platformCharge - (aptCityComm + aptDistComm + aptStateComm);

      let status: 'Pending' | 'Approved' | 'Held' | 'Paid' | 'Reversed' = 'Approved';
      if (apt.status === 'Cancelled') {
        status = 'Reversed';
      } else if (idx % 2 === 0) {
        status = 'Paid';
      }

      const date = apt.date || '2026-06-26';

      records.push({
        id: `TXN-APT-${3000 + idx}`,
        type: 'Appointment',
        sourceId: apt.id,
        sourceName: `${apt.patientName || 'Patient'} with ${apt.doctorName}`,
        amount: originalFee,
        platformCharge,
        cityPartnerId: cityId,
        cityPartnerName: cityName,
        cityPartnerCommission: aptCityComm,
        districtPartnerId: distId,
        districtPartnerName: distName,
        districtPartnerCommission: aptDistComm,
        statePartnerId: stateId,
        statePartnerName: stateName,
        statePartnerCommission: aptStateComm,
        companyCommission: companyComm,
        status,
        date,
        month: getMonthString(date),
        week: getWeekString(date),
        reversalReason: apt.status === 'Cancelled' ? 'Patient cancelled booking' : undefined
      });
    }
  });

  localStorage.setItem('ds_commission_records', JSON.stringify(records));
  return records;
}

// 8. Save Commission Records
export function saveCommissionRecords(records: CommissionRecord[]): void {
  localStorage.setItem('ds_commission_records', JSON.stringify(records));
}

// 9. Generate Commission Automatically after Payment
export function generateCommission(
  type: 'Subscription' | 'Appointment' | 'PharmacyOrder' | 'LabBooking',
  sourceId: string,
  sourceName: string,
  amount: number,
  onboardedByPartnerId?: string
): CommissionRecord | null {
  const records = getCommissionRecords();

  // Prevent Duplicate Generation
  const exists = records.find(r => r.type === type && r.sourceId === sourceId);
  if (exists) {
    console.log(`Commission for ${type} ${sourceId} already exists`);
    return exists;
  }

  const config = getCommissionConfig();
  const partnersRaw = localStorage.getItem('ds_partners');
  const partners: Partner[] = partnersRaw ? JSON.parse(partnersRaw) : [];

  // Determine who gets commission
  let targetPartnerId = onboardedByPartnerId;
  
  if (!targetPartnerId && type === 'Appointment') {
    // Look up doctor to find who onboarded them
    const doctorsRaw = localStorage.getItem('ds_doctors');
    const doctors: Doctor[] = doctorsRaw ? JSON.parse(doctorsRaw) : [];
    // We assume sourceName contains "Patient with Dr. Rajesh Khanna" or sourceId points to appointment
    // Let's load appointments to trace doctorId
    const appointmentsRaw = localStorage.getItem('ds_appointments');
    const appointments: Appointment[] = appointmentsRaw ? JSON.parse(appointmentsRaw) : [];
    const apt = appointments.find(a => a.id === sourceId);
    if (apt) {
      const doc = doctors.find(d => d.id === apt.doctorId);
      if (doc) {
        targetPartnerId = doc.onboardedBy;
      }
    }
  } else if (!targetPartnerId && type === 'PharmacyOrder') {
    // Look up pharmacy to find who onboarded them
    const pharmaciesRaw = localStorage.getItem('ds_pharmacies');
    const pharmacies: Pharmacy[] = pharmaciesRaw ? JSON.parse(pharmaciesRaw) : [];
    const ordersRaw = localStorage.getItem('ds_medicine_orders');
    const orders: MedicineOrder[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    const ord = orders.find(o => o.id === sourceId);
    if (ord) {
      const pharm = pharmacies.find(p => p.id === ord.pharmacyId);
      if (pharm) {
        targetPartnerId = pharm.onboardedBy;
      }
    }
  } else if (!targetPartnerId && type === 'LabBooking') {
    // Look up lab booking to find who onboarded the laboratory
    const bookingsRaw = localStorage.getItem('ds_lab_bookings');
    const bookings: LabBooking[] = bookingsRaw ? JSON.parse(bookingsRaw) : [];
    const bk = bookings.find(b => b.id === sourceId);
    if (bk) {
      const labsRaw = localStorage.getItem('ds_laboratories');
      const labs: Laboratory[] = labsRaw ? JSON.parse(labsRaw) : [];
      const lab = labs.find(l => l.id === bk.labId);
      if (lab) {
        targetPartnerId = lab.onboardedBy;
      }
    }
  }

  // Fallback to a demo partner if none specified, so that the cycle works for mock files
  if (!targetPartnerId) {
    targetPartnerId = 'part-demo-district';
  }

  const partner = partners.find(p => p.id === targetPartnerId || p.referralId === targetPartnerId);
  if (!partner) {
    console.error(`No partner found for ID ${targetPartnerId}. Cannot distribute commission.`);
    return null;
  }

  let cityId: string | undefined = undefined;
  let cityName: string | undefined = undefined;
  let distId: string | undefined = undefined;
  let distName: string | undefined = undefined;
  let stateId: string | undefined = undefined;
  let stateName: string | undefined = undefined;

  if (partner.partnerType === 'City') {
    cityId = partner.id;
    cityName = partner.name;
    // Find parent district partner
    const parentDist = partners.find(p => p.partnerType === 'District' && p.assignedDistrict === partner.assignedDistrict && p.assignedState === partner.assignedState);
    if (parentDist) {
      distId = parentDist.id;
      distName = parentDist.name;
      const parentState = findParentStatePartner(parentDist, partners);
      if (parentState) {
        stateId = parentState.id;
        stateName = parentState.name;
      }
    } else {
      // Fallback state lookup if district is missing
      const parentState = partners.find(p => p.partnerType === 'State' && p.assignedState === partner.assignedState);
      if (parentState) {
        stateId = parentState.id;
        stateName = parentState.name;
      }
    }
  } else if (partner.partnerType === 'District') {
    distId = partner.id;
    distName = partner.name;
    const parentState = findParentStatePartner(partner, partners);
    if (parentState) {
      stateId = parentState.id;
      stateName = parentState.name;
    }
  } else {
    stateId = partner.id;
    stateName = partner.name;
  }

  const today = getTodayDateString();
  const txnId = generateUniqueId(`TXN-${type === 'Subscription' ? 'SUB' : (type === 'PharmacyOrder' ? 'PHM' : (type === 'LabBooking' ? 'LAB' : 'APT'))}`);

  let platformCharge = amount;
  let cityComm = 0;
  let distComm = 0;
  let stateComm = 0;
  let compComm = 0;

  if (type === 'Subscription') {
    platformCharge = amount; // Full subscription charge
    cityComm = cityId ? amount * (config.subscriptionCityPct / 100) : 0;
    distComm = distId ? amount * (config.subscriptionDistrictPct / 100) : 0;
    stateComm = stateId ? amount * (config.subscriptionStatePct / 100) : 0;
    compComm = amount - (cityComm + distComm + stateComm);
  } else if (type === 'LabBooking') {
    platformCharge = amount * 0.05; // 5% booking charge
    const pctCity = config.labCityPct !== undefined ? config.labCityPct : 20;
    const pctDist = config.labDistrictPct !== undefined ? config.labDistrictPct : 20;
    const pctState = config.labStatePct !== undefined ? config.labStatePct : 10;
    cityComm = cityId ? platformCharge * (pctCity / 100) : 0;
    distComm = distId ? platformCharge * (pctDist / 100) : 0;
    stateComm = stateId ? platformCharge * (pctState / 100) : 0;
    compComm = platformCharge - (cityComm + distComm + stateComm);
  } else {
    platformCharge = amount * 0.05; // 5% booking charge
    cityComm = cityId ? platformCharge * (config.appointmentCityPct / 100) : 0;
    distComm = distId ? platformCharge * (config.appointmentDistrictPct / 100) : 0;
    stateComm = stateId ? platformCharge * (config.appointmentStatePct / 100) : 0;
    compComm = platformCharge - (cityComm + distComm + stateComm);
  }

  // For subscriptions, status becomes 'Approved' once subscriptionPaid is true and admin approves.
  // By default we mark it 'Approved' if it is approved immediately, or 'Pending'
  const status = type === 'Subscription' ? 'Pending' : 'Approved';

  const newRecord: CommissionRecord = {
    id: txnId,
    type,
    sourceId,
    sourceName,
    amount,
    platformCharge,
    cityPartnerId: cityId,
    cityPartnerName: cityName,
    cityPartnerCommission: cityComm,
    districtPartnerId: distId,
    districtPartnerName: distName,
    districtPartnerCommission: distComm,
    statePartnerId: stateId,
    statePartnerName: stateName,
    statePartnerCommission: stateComm,
    companyCommission: compComm,
    status,
    date: today,
    month: getMonthString(today),
    week: getWeekString(today)
  };

  records.unshift(newRecord);
  saveCommissionRecords(records);

  addAuditLog(
    'Generate Commission',
    'System',
    `Generated automatic ${type} commission (${txnId}) for ₹${amount.toLocaleString()} from source ${sourceName}. Platform Charge: ₹${platformCharge.toLocaleString()}`
  );

  return newRecord;
}

// 10. Automatic Reversal for Cancelled/Refunded Transactions
export function reverseCommission(sourceId: string, reason: string): boolean {
  const records = getCommissionRecords();
  let modified = false;

  for (let i = 0; i < records.length; i++) {
    if (records[i].sourceId === sourceId && records[i].status !== 'Reversed') {
      const oldStatus = records[i].status;
      records[i].status = 'Reversed';
      records[i].reversalReason = reason;
      modified = true;

      addAuditLog(
        'Reverse Commission',
        'System',
        `Reversed commission (${records[i].id}) for ${records[i].type} (Source ID: ${sourceId}). Reason: ${reason}. Old Status: ${oldStatus}`
      );
      break;
    }
  }

  if (modified) {
    saveCommissionRecords(records);
    return true;
  }
  return false;
}

// 11. Admin Action: Approve, Reject, Hold, Reverse Commission Record
export function updateCommissionStatus(
  recordId: string,
  newStatus: 'Pending' | 'Approved' | 'Held' | 'Paid' | 'Reversed',
  actor: string,
  reason?: string
): boolean {
  const records = getCommissionRecords();
  const index = records.findIndex(r => r.id === recordId);

  if (index !== -1) {
    const oldStatus = records[index].status;
    records[index].status = newStatus;
    if (reason) {
      records[index].reversalReason = reason;
    }
    saveCommissionRecords(records);

    addAuditLog(
      'Update Commission Status',
      actor,
      `Manually changed commission ${recordId} status from ${oldStatus} to ${newStatus}. ${reason ? 'Reason: ' + reason : ''}`
    );
    return true;
  }
  return false;
}

// 11.5 Automatically Approve Subscription Commission on Approval of Doctor or Clinic
export function approveSubscriptionCommissionBySourceId(sourceId: string, actor: string = 'Super Admin'): boolean {
  const records = getCommissionRecords();
  let modified = false;
  for (let i = 0; i < records.length; i++) {
    if (records[i].sourceId === sourceId && records[i].type === 'Subscription' && records[i].status === 'Pending') {
      records[i].status = 'Approved';
      modified = true;
      addAuditLog(
        'Approve Subscription Commission',
        actor,
        `Approved subscription commission record (${records[i].id}) for ${records[i].sourceName} automatically upon provider activation.`
      );
    }
  }
  if (modified) {
    saveCommissionRecords(records);
    return true;
  }
  return false;
}

// 12. Process and release Payouts for a Partner Level
export function processPayouts(
  scheduleType: 'Weekly' | 'Monthly' | 'All',
  actor: string
): PayoutReceipt[] {
  const records = getCommissionRecords();
  const partnersRaw = localStorage.getItem('ds_partners');
  const partners: Partner[] = partnersRaw ? JSON.parse(partnersRaw) : [];

  // Filter approved records that can be paid
  const eligibleRecords = records.filter(r => {
    if (r.status !== 'Approved') return false;
    if (scheduleType === 'Weekly') {
      return r.type === 'Subscription';
    } else if (scheduleType === 'Monthly') {
      return r.type === 'Appointment';
    }
    return true; // All
  });

  if (eligibleRecords.length === 0) {
    addAuditLog('Process Payouts', actor, `Payout cycle executed. No eligible 'Approved' commission records found to release.`);
    return [];
  }

  const newReceipts: PayoutReceipt[] = [];
  const today = getTodayDateString();

  // Group payouts by partner
  const partnerPayouts: {
    [partnerId: string]: {
      partner: Partner;
      amount: number;
      recordsToUpdate: string[];
      types: Set<string>;
    };
  } = {};

  eligibleRecords.forEach(r => {
    // City Partner Payout
    if (r.cityPartnerId && r.cityPartnerCommission > 0) {
      const pId = r.cityPartnerId;
      if (!partnerPayouts[pId]) {
        const partner = partners.find(p => p.id === pId);
        if (partner) {
          partnerPayouts[pId] = { partner, amount: 0, recordsToUpdate: [], types: new Set() };
        }
      }
      if (partnerPayouts[pId]) {
        partnerPayouts[pId].amount += r.cityPartnerCommission;
        partnerPayouts[pId].recordsToUpdate.push(r.id);
        partnerPayouts[pId].types.add(r.type);
      }
    }

    // District Partner Payout
    if (r.districtPartnerId && r.districtPartnerCommission > 0) {
      const pId = r.districtPartnerId;
      if (!partnerPayouts[pId]) {
        const partner = partners.find(p => p.id === pId);
        if (partner) {
          partnerPayouts[pId] = { partner, amount: 0, recordsToUpdate: [], types: new Set() };
        }
      }
      if (partnerPayouts[pId]) {
        partnerPayouts[pId].amount += r.districtPartnerCommission;
        partnerPayouts[pId].recordsToUpdate.push(r.id);
        partnerPayouts[pId].types.add(r.type);
      }
    }

    // State Partner Payout
    if (r.statePartnerId && r.statePartnerCommission > 0) {
      const pId = r.statePartnerId;
      if (!partnerPayouts[pId]) {
        const partner = partners.find(p => p.id === pId);
        if (partner) {
          partnerPayouts[pId] = { partner, amount: 0, recordsToUpdate: [], types: new Set() };
        }
      }
      if (partnerPayouts[pId]) {
        partnerPayouts[pId].amount += r.statePartnerCommission;
        partnerPayouts[pId].recordsToUpdate.push(r.id);
        partnerPayouts[pId].types.add(r.type);
      }
    }
  });

  const savedReceipts = getPayoutReceipts();

  // Execute Payouts and Update Balances
  Object.keys(partnerPayouts).forEach(pId => {
    const data = partnerPayouts[pId];
    if (data.amount <= 0) return;

    // Credit partner's wallet balance
    const pIndex = partners.findIndex(p => p.id === pId);
    if (pIndex !== -1) {
      partners[pIndex].walletBalance = (partners[pIndex].walletBalance || 0) + data.amount;
    }

    // Generate unique payout receipt
    const receiptId = generateUniqueId('PAY');
    const rcptNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const typeArr = Array.from(data.types);
    const commType = typeArr.length > 1 ? 'Both' : typeArr[0];

    const receipt: PayoutReceipt = {
      id: receiptId,
      partnerId: pId,
      partnerName: data.partner.name,
      partnerType: data.partner.partnerType,
      amount: data.amount,
      commissionType: commType as 'Subscription' | 'Appointment' | 'Both',
      date: today,
      periodStart: '2026-06-01', // Example period start
      periodEnd: today,
      payoutMethod: 'Direct Bank Transfer',
      status: 'Completed',
      receiptNumber: rcptNo
    };

    newReceipts.push(receipt);
    savedReceipts.unshift(receipt);

    // Update records status to 'Paid'
    records.forEach(r => {
      if (data.recordsToUpdate.includes(r.id)) {
        r.status = 'Paid';
      }
    });

    addAuditLog(
      'Process Payouts',
      actor,
      `Released payout of ₹${data.amount.toLocaleString()} to ${data.partner.partnerType} Partner ${data.partner.name} (${receipt.receiptNumber}).`
    );
  });

  // Save everything back to localStorage
  saveCommissionRecords(records);
  savePayoutReceipts(savedReceipts);
  localStorage.setItem('ds_partners', JSON.stringify(partners));

  return newReceipts;
}

// 13. Get Partner Earnings Summary
export function getPartnerEarningsSummary(partnerId: string) {
  const records = getCommissionRecords();
  const partnerRecords = records.filter(
    r => r.cityPartnerId === partnerId || r.districtPartnerId === partnerId || r.statePartnerId === partnerId
  );

  let totalEarnings = 0;
  let weeklySubComm = 0;
  let monthlyAptComm = 0;
  let pendingComm = 0;
  let approvedComm = 0;
  let paidComm = 0;

  partnerRecords.forEach(r => {
    const isCity = r.cityPartnerId === partnerId;
    const isDist = r.districtPartnerId === partnerId;
    const isState = r.statePartnerId === partnerId;
    const commAmt = isCity ? r.cityPartnerCommission : (isDist ? r.districtPartnerCommission : (isState ? r.statePartnerCommission : 0));

    if (commAmt <= 0) return;

    if (r.status !== 'Reversed') {
      totalEarnings += commAmt;

      if (r.type === 'Subscription') {
        weeklySubComm += commAmt;
      } else {
        monthlyAptComm += commAmt;
      }
    }

    if (r.status === 'Pending') {
      pendingComm += commAmt;
    } else if (r.status === 'Approved' || r.status === 'Held') {
      approvedComm += commAmt;
    } else if (r.status === 'Paid') {
      paidComm += commAmt;
    }
  });

  return {
    totalEarnings,
    weeklySubComm,
    monthlyAptComm,
    pendingComm,
    approvedComm,
    paidComm,
    partnerRecords
  };
}

// Hierarchical Routing Verification Stage Resolver
export function getPartnerVerificationStage(p: Partner, partnersList: Partner[]): 'District' | 'State' | 'Admin' | 'Done' {
  if (p.status === 'Approved' || p.status === 'Approved (Active)' || p.status === 'Active') {
    return 'Done';
  }
  if (p.status === 'Rejected') {
    return 'Done';
  }

  // State Level Partner always goes directly to Admin
  if (p.partnerType === 'State') {
    return 'Admin';
  }

  // District Level Partner goes to State, then to Admin
  if (p.partnerType === 'District') {
    if (p.status === 'Pending Admin Verification') {
      return 'Admin';
    }
    const statePartnerExists = partnersList.some(
      x => x.partnerType === 'State' && 
           x.assignedState === p.assignedState && 
           (x.status === 'Approved (Active)' || x.status === 'Approved' || x.status === 'Active')
    );
    if (statePartnerExists) {
      return 'State';
    } else {
      return 'Admin';
    }
  }

  // City Level Partner goes to District, then State, then Admin
  if (p.partnerType === 'City') {
    if (p.status === 'Pending Admin Verification') {
      return 'Admin';
    }
    if (p.status === 'Pending State Partner Verification') {
      const statePartnerExists = partnersList.some(
        x => x.partnerType === 'State' && 
             x.assignedState === p.assignedState && 
             (x.status === 'Approved (Active)' || x.status === 'Approved' || x.status === 'Active')
      );
      if (statePartnerExists) {
        return 'State';
      } else {
        return 'Admin';
      }
    }

    // Initial Stage: Check if District Partner is available
    const districtPartnerExists = partnersList.some(
      x => x.partnerType === 'District' && 
           x.assignedState === p.assignedState && 
           x.assignedDistrict === p.assignedDistrict && 
           (x.status === 'Approved (Active)' || x.status === 'Approved' || x.status === 'Active')
    );
    if (districtPartnerExists) {
      return 'District';
    }

    // Fallback 1: Go directly to State Partner
    const statePartnerExists = partnersList.some(
      x => x.partnerType === 'State' && 
           x.assignedState === p.assignedState && 
           (x.status === 'Approved (Active)' || x.status === 'Approved' || x.status === 'Active')
    );
    if (statePartnerExists) {
      return 'State';
    }

    // Fallback 2: Go directly to Admin
    return 'Admin';
  }

  return 'Admin';
}

// Persistent Notification Log Writer
export function logPartnerNotification(
  recipientEmail: string,
  recipientPhone: string,
  type: 'SMS' | 'Email' | 'In-App',
  content: string
): void {
  const saved = localStorage.getItem('ds_partner_notification_logs');
  const logs = saved ? JSON.parse(saved) : [];
  
  // Prevent duplicate notifications in the last 1 minute
  const duplicate = logs.some((l: any) => 
    l.recipientEmail === recipientEmail && 
    l.type === type && 
    l.content === content &&
    (Date.now() - new Date(l.timestamp).getTime()) < 60000
  );
  if (duplicate) return;

  const newLog = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientEmail,
    recipientPhone,
    type,
    content,
    status: 'Delivered',
    timestamp: new Date().toLocaleString()
  };

  logs.unshift(newLog);
  localStorage.setItem('ds_partner_notification_logs', JSON.stringify(logs.slice(0, 1000)));
}

// Automated Verification Event Notification Trigger
export function triggerVerificationNotification(
  partnerObj: any,
  eventType: 'receipt' | 'approval' | 'rejection' | 'activation',
  remarks: string,
  verifierDetails?: string
): string[] {
  const name = partnerObj.name || 'Partner';
  const role = `${partnerObj.partnerType || 'District'} Partner`;
  const location = `${partnerObj.assignedCity ? partnerObj.assignedCity + ', ' : ''}${partnerObj.assignedDistrict ? partnerObj.assignedDistrict + ', ' : ''}${partnerObj.assignedState}`;
  const verifier = verifierDetails || 'System Hierarchy';

  let emailContent = '';
  let smsContent = '';
  let inAppContent = '';

  if (eventType === 'receipt') {
    emailContent = `[EMAIL SENDER] To: ${partnerObj.email} | Subject: DOCT SPARK Partner Application Received | Body: "Dear ${name}, your application as a ${role} for ${location} has been successfully received and is currently Pending Verification. Login and dashboard access remain disabled until final approval."`;
    smsContent = `[SMS GATEWAY] To: +91 ${partnerObj.phone} | "DOCT SPARK: Partner application received for ${location}. Status: Pending Verification. Login is currently disabled."`;
    inAppContent = `[IN-APP] Your partner application has been received and queued in the verification pipeline.`;
  } else if (eventType === 'approval') {
    emailContent = `[EMAIL SENDER] To: ${partnerObj.email} | Subject: DOCT SPARK Partner Application Stage Approved | Body: "Dear ${name}, your application as a ${role} has been approved by ${verifier} and forwarded to the next verification stage. Remarks: ${remarks}"`;
    smsContent = `[SMS GATEWAY] To: +91 ${partnerObj.phone} | "DOCT SPARK: Partner application approved by ${verifier} and forwarded to the next stage."`;
    inAppContent = `[IN-APP] Partner verification stage approved by ${verifier}. Forwarded to next stage.`;
  } else if (eventType === 'rejection') {
    emailContent = `[EMAIL SENDER] To: ${partnerObj.email} | Subject: DOCT SPARK Partner Application Rejected | Body: "Dear ${name}, your application as a ${role} has been Rejected. Reason: ${remarks}. Please re-apply with corrected documents if allowed."`;
    smsContent = `[SMS GATEWAY] To: +91 ${partnerObj.phone} | "DOCT SPARK: Partner application Rejected. Reason: ${remarks}"`;
    inAppContent = `[IN-APP] Partner application was rejected. Reason: ${remarks}`;
  } else if (eventType === 'activation') {
    emailContent = `[EMAIL SENDER] To: ${partnerObj.email} | Subject: DOCT SPARK Account Active & Enabled | Body: "Dear ${name}, your application as a ${role} is complete. Your account is now Active, login is enabled, and full dashboard access is enabled. Welcome to the team! Start territory operations today."`;
    smsContent = `[SMS GATEWAY] To: +91 ${partnerObj.phone} | "DOCT SPARK: Account activated! Start onboarding medical establishments in your territory today."`;
    inAppContent = `[IN-APP] Congratulations! Your partner account is now fully Active. Full dashboard access is enabled.`;
  }

  // Save to persistent logs
  logPartnerNotification(partnerObj.email, partnerObj.phone, 'Email', emailContent);
  logPartnerNotification(partnerObj.email, partnerObj.phone, 'SMS', smsContent);
  logPartnerNotification(partnerObj.email, partnerObj.phone, 'In-App', inAppContent);

  return [emailContent, smsContent, inAppContent];
}
