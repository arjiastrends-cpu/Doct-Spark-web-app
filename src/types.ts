/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'patient' | 'doctor' | 'clinic' | 'partner' | 'superadmin' | 'pharmacy' | 'laboratory' | 'physiotherapy';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  medicalHistory?: string[];
  familyMembers?: { name: string; age: number; relation: string; gender: string }[];
  rewardsPoints?: number;
  referralCode?: string;
}

export interface Partner {
  id: string;
  name: string;
  profilePhoto: string;
  dob: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  district?: string;
  pincode: string;
  aadhaarNumber: string;
  panNumber: string;
  voterIdNumber?: string;
  fatherOrHusbandName?: string;
  ownsBike?: boolean;
  bikeRegistrationNumber?: string;
  bikeModel?: string;
  bikeMileage?: string;
  hasBikeInsurance?: boolean;
  hasDrivingLicense?: boolean;
  drivingLicenseNumber?: string;
  languagesSpokenWritten?: string;
  aboutPartner500Words?: string;
  alternatePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  qualification: string;
  highestQualificationDoc?: string;
  highestQualificationFileName?: string;
  experience: string;
  experienceCertificateDoc?: string;
  experienceCertificateFileName?: string;
  identityProofDoc?: string;
  identityProofFileName?: string;
  otherDoc?: string;
  otherDocFileName?: string;
  occupation: string;
  skills: string;
  partnerType: 'State' | 'District' | 'City';
  assignedState: string;
  assignedDistrict?: string;
  assignedCity?: string;
  status: 'Pending Verification' | 'Pending State Partner Verification' | 'Pending Admin Verification' | 'Approved (Active)' | 'Rejected' | 'Pending State' | 'Approved' | 'Active'; // State partners verify district partner, Super Admin approves all
  onboardedDoctorsCount: number;
  onboardedClinicsCount: number;
  walletBalance: number; // calculated in-app
  createdById?: string; // state partner ID who created this district partner
  referralId?: string;
  password?: string;
  createdAt?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Pending District' | 'Pending State' | 'Pending Admin' | 'Approved (Active)';
  onboardedBy?: string;
  onboardedByType?: 'State' | 'District' | 'City';
  subscriptionPaid?: boolean;
  mobileOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  ownerIdProofDoc?: string;
  licenseDocuments?: string[];
  createdAt?: string;
}

export interface Laboratory {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Pending District' | 'Pending State' | 'Pending Admin' | 'Approved (Active)';
  onboardedBy?: string;
  onboardedByType?: 'State' | 'District' | 'City';
  subscriptionPaid?: boolean;
  mobileOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  ownerIdProofDoc?: string;
  licenseDocuments?: string[];
  createdAt?: string;
}

export interface Physiotherapy {
  id: string;
  name: string; // business / clinic name
  therapistName: string; // actual therapist name
  email: string;
  phone: string;
  registrationNumber: string; // IAP registration
  specialty: string; // Orthopedic, Sports, etc.
  experience: number;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Pending District' | 'Pending State' | 'Pending Admin' | 'Approved (Active)';
  onboardedBy?: string;
  onboardedByType?: 'State' | 'District' | 'City';
  subscriptionPaid?: boolean;
  mobileOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  ownerIdProofDoc?: string;
  licenseDocuments?: string[];
  createdAt?: string;
}

export interface DoctorClinic {
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
  consultType?: string; // 'Both' | 'In-Clinic' | 'Video'
  feeInClinic?: number;
  feeVideo?: number;
  availableDays?: string[];
  availableSlots?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number; // in years
  clinicName: string;
  city: string;
  rating: number;
  reviewsCount: number;
  feeInClinic: number;
  feeVideo: number;
  nextAvailable: string; // e.g. "Today 4:00 PM"
  photo: string;
  bio: string;
  education: string;
  registrationNumber: string;
  availableDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  timeSlots: string[]; // ['09:00 AM', '09:30 AM', ...]
  lat: number;
  lng: number;
  clinics?: DoctorClinic[];
  cabinNumber?: string;
  gender?: string;
  contactPhone?: string;
  email?: string;
  languages?: string[];
  // Onboarding & Verification Workflow
  onboardedBy?: string;
  onboardedByType?: 'State' | 'District';
  verificationStatus?: 'Pending District' | 'Pending State' | 'Pending Admin' | 'Approved';
  subscriptionPaid?: boolean;
  mobileOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  state?: string;
  district?: string;
  ownerIdProofDoc?: string;
  referralPartnerId?: string;
  referralIdLocked?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviewsCount: number;
  photos: string[];
  timings: string;
  doctors: string[]; // doctor IDs
  lat: number;
  lng: number;
  clinicType?: string;
  licenseNumber?: string;
  amenities?: string[];
  totalChambers?: number;
  phone?: string;
  email?: string;
  ownerName?: string;
  tradeLicenseNumber?: string;
  licenseDocuments?: string[];
  // Onboarding & Verification Workflow
  onboardedBy?: string;
  onboardedByType?: 'State' | 'District';
  verificationStatus?: 'Pending District' | 'Pending State' | 'Pending Admin' | 'Approved';
  subscriptionPaid?: boolean;
  mobileOtpVerified?: boolean;
  emailOtpVerified?: boolean;
  state?: string;
  district?: string;
  ownerIdProofDoc?: string;
  referralPartnerId?: string;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  comment: string;
  doctorName?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhoto: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  type: 'In-Clinic' | 'Video';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Expired';
  reason?: string;
  fee: number;
  prescription?: Prescription;
  roomId?: string; // for Video Call
  clinicName?: string;
  clinicAddress?: string;
  serialNo?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string; // ISO string for booking timestamp
}

export interface Prescription {
  id: string;
  appointmentId: string;
  date: string;
  doctorName: string;
  diagnosis: string;
  medicines: { name: string; dosage: string; duration: string }[];
  notes?: string;
  attachedFileUrl?: string;
  attachedFileName?: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  doctorName: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Refunded';
  method: string;
}

export interface QuickFilterState {
  consultationType?: 'All' | 'In-Clinic' | 'Video';
  ratingThreshold?: number;
  feeRange?: number;
  availability?: 'All' | 'Today' | 'Tomorrow' | 'This Week';
  sortBy?: 'Relevance' | 'Rating' | 'Experience' | 'Fee';
}

// ==========================================
// DOCT SPARK COMMISSION & REVENUE SHARING
// ==========================================

export interface CommissionConfig {
  id: string; // "default"
  appointmentDistrictPct: number; // 20%
  appointmentStatePct: number; // 10%
  appointmentCityPct: number; // 20%
  appointmentCompanyPct: number; // 50%
  subscriptionDistrictPct: number; // 30%
  subscriptionStatePct: number; // 10%
  subscriptionCityPct: number; // 20%
  subscriptionCompanyPct: number; // 40%
  labDistrictPct?: number; // Default 20%
  labStatePct?: number; // Default 10%
  labCityPct?: number; // Default 20%
  labCompanyPct?: number; // Default 50%
  payoutSchedule: 'Weekly' | 'Monthly' | 'Bi-Weekly' | 'Custom';
  nextPayoutDate: string; // YYYY-MM-DD
}

export interface CommissionRecord {
  id: string; // unique transaction id
  type: 'Subscription' | 'Appointment' | 'PharmacyOrder' | 'LabBooking' | 'PhysioBooking' | string;
  sourceId: string; // Doctor ID, Clinic ID, or Appointment ID
  sourceName: string; // Doctor Name, Clinic Name, or Patient Name
  amount: number; // Original fee (e.g. ₹5,000 subscription, or ₹500 consult fee)
  platformCharge: number; // Platform charge (e.g. for Appt it's 5%, for Sub it's the full ₹5,000)
  cityPartnerId?: string;
  cityPartnerName?: string;
  cityPartnerCommission: number;
  districtPartnerId?: string;
  districtPartnerName?: string;
  districtPartnerCommission: number;
  statePartnerId?: string;
  statePartnerName?: string;
  statePartnerCommission: number;
  companyCommission: number;
  status: 'Pending' | 'Approved' | 'Held' | 'Paid' | 'Reversed';
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM (for monthly calculations)
  week: string; // YYYY-[WeekNo] (for weekly calculations)
  reversalReason?: string;
}

export interface PayoutReceipt {
  id: string; // payout transaction id
  partnerId: string;
  partnerName: string;
  partnerType: 'State' | 'District' | 'City';
  amount: number;
  commissionType: 'Subscription' | 'Appointment' | 'Both' | 'PharmacyOrder' | 'LabBooking' | string;
  date: string;
  periodStart: string;
  periodEnd: string;
  payoutMethod: string;
  status: 'Processed' | 'Completed';
  receiptNumber: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface TargetConfig {
  id: string; // "default"
  districtOnboardTarget: number;
  stateOnboardTarget: number;
  districtAppointmentTarget: number;
  stateAppointmentTarget: number;
  countdownDurationDays: number;
  basicSalaryAmount: number;
  travelAllowanceAmount: number;
  internationalTourEligible: boolean;
  rewardProgramEnabled: boolean;
  achievementCertificateEnabled: boolean;
}

export interface RewardEligibilityRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerType: 'District' | 'State' | 'City';
  dateAchieved: string;
  onboardsCount: number;
  appointmentsCount: number;
  basicSalary: number;
  travelAllowance: number;
  tourEligible: boolean;
  certificateIssued: boolean;
  state: string;
  district?: string;
  status: 'Pending Review' | 'Salary Reviewed' | 'Paid' | 'Approved';
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'Information' | 'Success' | 'Warning' | 'Emergency' | 'Offer' | 'Maintenance';
  icon: string; // lucide icon name or 'default'
  status: 'Draft' | 'Published' | 'Unpublished';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency'; // Order of priority
  target_audience: 'All' | 'Visitors' | 'Patients' | 'Doctors' | 'Clinics' | 'Partners' | 'Staff' | 'Admin';
  display_location: 'Website Home' | 'Website Inner' | 'Admin' | 'Patient' | 'Doctor' | 'Clinic' | 'Partner' | 'Staff' | 'All Dashboards' | 'Entire Website';
  animation_style: 'Marquee' | 'Fade' | 'Slide' | 'Static';
  animation_speed: 'Slow' | 'Medium' | 'Fast';
  background_color: string;
  text_color: string;
  border_color: string;
  link_enabled: boolean;
  button_text?: string;
  button_url?: string;
  dismissible: boolean;
  start_datetime?: string; // YYYY-MM-DDTHH:mm
  end_datetime?: string; // YYYY-MM-DDTHH:mm
  font_size?: string; // e.g. text-xs, text-sm, etc.
  padding?: string; // e.g. py-2, py-3
  height?: string; // e.g. h-10, h-12
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface Medicine {
  id: string;
  pharmacyId: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  manufacturer: string;
  strength: string;
  dosageForm: string; // e.g. Tablet, Syrup, Capsule
  packSize: string; // e.g. 10 tablets
  price: number;
  discount: number; // percentage
  gst: number; // percentage
  stockQuantity: number;
  minStockAlert: number;
  expiryDate: string; // YYYY-MM-DD
  batchNumber: string;
  prescriptionRequired: boolean;
  image?: string;
  createdAt: string;
}

export interface MedicineOrder {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  patientCity: string;
  patientState: string;
  patientPincode: string;
  items: {
    medicineId: string;
    name: string;
    genericName: string;
    brandName: string;
    price: number;
    discount: number;
    quantity: number;
    prescriptionRequired: boolean;
  }[];
  prescriptionUrl?: string;
  prescriptionStatus?: 'Pending' | 'Approved' | 'Rejected';
  prescriptionRejectReason?: string;
  paymentMethod: string; // 'Wallet' | 'Online Gateway'
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
  totalAmount: number;
  discountAmount: number;
  gstAmount: number;
  finalAmount: number;
  commissionPaid?: number; // 5% fee to platform
  status: 'Pending' | 'Prescription Review' | 'Approved' | 'Preparing' | 'Packed' | 'Ready for Dispatch' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded';
  deliveryStatusHistory?: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
}

export interface LabTestCategory {
  id: string;
  labId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface LabTest {
  id: string;
  labId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  discount: number; // e.g. 10%
  turnaroundTime: string; // e.g. "12 Hours" or "1 Day"
  preparationInstructions?: string; // e.g. "Fasting for 8-12 hours required"
  homeCollectionEnabled: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface LabHealthPackage {
  id: string;
  labId: string;
  name: string;
  description: string;
  testIds: string[]; // List of tests included in this package
  price: number;
  discount: number;
  turnaroundTime: string;
  preparationInstructions?: string;
  homeCollectionEnabled: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface LabBooking {
  id: string;
  labId: string;
  labName: string;
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  patientAddress?: string;
  patientCity?: string;
  patientState?: string;
  patientPincode?: string;
  bookingType: 'Walk-In' | 'Home Sample Collection';
  tests: { testId: string; name: string; price: number }[];
  packages: { packageId: string; name: string; price: number }[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  platformCharge: number;
  paymentMethod: string;
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
  status: 'Pending' | 'Confirmed' | 'Sample Collection Scheduled' | 'Sample Collected' | 'Sample Received' | 'Testing In Progress' | 'Report Ready' | 'Report Delivered' | 'Cancelled' | 'Refunded';
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  reports?: { name: string; url: string; uploadedAt: string; notes?: string }[];
  createdAt: string;
}





