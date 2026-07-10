/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LabTestCategory, LabTest, LabHealthPackage, LabBooking } from '../types';

export const INITIAL_LAB_CATEGORIES = (labId: string): LabTestCategory[] => [
  { id: 'cat-1', labId, name: 'Biochemistry', description: 'Blood glucose, kidney, liver and metabolic profiles', createdAt: new Date().toISOString() },
  { id: 'cat-2', labId, name: 'Hematology', description: 'Complete Blood Counts, blood typing, and coagulation tests', createdAt: new Date().toISOString() },
  { id: 'cat-3', labId, name: 'Immunology & Serology', description: 'Antibody tests, infectious disease screening, and immune panels', createdAt: new Date().toISOString() },
  { id: 'cat-4', labId, name: 'Hormones & Endocrinology', description: 'Thyroid, diabetes, and reproductive hormone profiles', createdAt: new Date().toISOString() }
];

export const INITIAL_LAB_TESTS = (labId: string): LabTest[] => [
  {
    id: 'test-1',
    labId,
    categoryId: 'cat-1',
    name: 'HbA1c (Glycated Haemoglobin)',
    description: 'Measures average blood sugar levels over the past 3 months.',
    price: 400,
    discount: 10,
    turnaroundTime: '12 Hours',
    preparationInstructions: 'Fasting is not required. Can be done at any time.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-2',
    labId,
    categoryId: 'cat-1',
    name: 'Lipid Profile (Cholesterol)',
    description: 'Evaluates total cholesterol, HDL, LDL, and triglycerides in blood.',
    price: 600,
    discount: 15,
    turnaroundTime: '12 Hours',
    preparationInstructions: '10-12 hours of overnight fasting is mandatory. Water is permitted.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-3',
    labId,
    categoryId: 'cat-2',
    name: 'Complete Blood Count (CBC)',
    description: 'Evaluates overall health and detects a wide range of disorders, including anemia and infection.',
    price: 350,
    discount: 5,
    turnaroundTime: '6 Hours',
    preparationInstructions: 'No special preparation needed.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-4',
    labId,
    categoryId: 'cat-3',
    name: 'Typhoid IgG/IgM Antibody',
    description: 'A rapid serological test to detect typhoid fever antibodies.',
    price: 500,
    discount: 0,
    turnaroundTime: '8 Hours',
    preparationInstructions: 'No special preparation needed.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-5',
    labId,
    categoryId: 'cat-4',
    name: 'Thyroid Profile (T3, T4, TSH)',
    description: 'Evaluates thyroid gland function and diagnoses thyroid disorders.',
    price: 800,
    discount: 20,
    turnaroundTime: '24 Hours',
    preparationInstructions: 'Morning sample preferred. Fasting not mandatory but recommended.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_LAB_PACKAGES = (labId: string): LabHealthPackage[] => [
  {
    id: 'pkg-1',
    labId,
    name: 'Essential Health Checkup',
    description: 'Includes CBC, HbA1c, and Lipid Profile for general metabolic and hematological screening.',
    testIds: ['test-1', 'test-2', 'test-3'],
    price: 1350,
    discount: 25, // 25% package savings discount
    turnaroundTime: '24 Hours',
    preparationInstructions: '10-12 hours of overnight fasting required.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pkg-2',
    labId,
    name: 'Advanced Thyroid & Diabetic Control',
    description: 'Includes Thyroid Profile (T3, T4, TSH) and HbA1c test for hormone regulation and diabetic staging.',
    testIds: ['test-1', 'test-5'],
    price: 1200,
    discount: 20,
    turnaroundTime: '24 Hours',
    preparationInstructions: 'Morning sample recommended.',
    homeCollectionEnabled: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_LAB_BOOKINGS = (labId: string, labName: string): LabBooking[] => [
  {
    id: 'lbk-901',
    labId,
    labName,
    patientEmail: 'patient@doctspark.in',
    patientName: 'Karan Sharma',
    patientPhone: '9820123456',
    patientAddress: 'Flat 405, Green Heights, Opp. Central Mall, Andheri West',
    patientCity: 'Mumbai',
    patientState: 'Maharashtra',
    patientPincode: '400053',
    bookingType: 'Home Sample Collection',
    tests: [
      { testId: 'test-1', name: 'HbA1c (Glycated Haemoglobin)', price: 400 },
      { testId: 'test-2', name: 'Lipid Profile (Cholesterol)', price: 600 }
    ],
    packages: [],
    totalAmount: 1000,
    discountAmount: 130, // applied discounts
    finalAmount: 870,
    platformCharge: 43.5, // 5%
    paymentMethod: 'Online Gateway',
    paymentStatus: 'Paid',
    status: 'Pending',
    preferredDate: '2026-07-07',
    preferredTime: '08:00 AM - 10:00 AM',
    notes: 'Please call before arriving. Fasting is completed.',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() // 4 hours ago
  },
  {
    id: 'lbk-902',
    labId,
    labName,
    patientEmail: 'priya.patel@doctspark.in',
    patientName: 'Priya Patel',
    patientPhone: '9819988776',
    bookingType: 'Walk-In',
    tests: [],
    packages: [
      { packageId: 'pkg-1', name: 'Essential Health Checkup', price: 1350 }
    ],
    totalAmount: 1350,
    discountAmount: 337.5,
    finalAmount: 1012.5,
    platformCharge: 50.63,
    paymentMethod: 'Wallet',
    paymentStatus: 'Paid',
    status: 'Confirmed',
    preferredDate: '2026-07-08',
    preferredTime: '10:00 AM - 12:00 PM',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'lbk-903',
    labId,
    labName,
    patientEmail: 'amit.nair@doctspark.in',
    patientName: 'Amit Nair',
    patientPhone: '9892011223',
    patientAddress: 'Plot No. 12, Sector 17, Vashi',
    patientCity: 'Navi Mumbai',
    patientState: 'Maharashtra',
    patientPincode: '400703',
    bookingType: 'Home Sample Collection',
    tests: [
      { testId: 'test-3', name: 'Complete Blood Count (CBC)', price: 350 }
    ],
    packages: [],
    totalAmount: 350,
    discountAmount: 17.5,
    finalAmount: 332.5,
    platformCharge: 16.63,
    paymentMethod: 'Online Gateway',
    paymentStatus: 'Paid',
    status: 'Report Ready',
    preferredDate: '2026-07-05',
    preferredTime: '07:00 AM - 09:00 AM',
    reports: [
      {
        name: 'CBC_Report_AmitNair.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        notes: 'All hematological parameters fall within healthy clinical ranges. Platelets and hemoglobin are optimal.'
      }
    ],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() // 2 days ago
  }
];

export const INITIAL_REVIEWS = [
  { id: 'rev-1', patientName: 'Amit Nair', rating: 5, comment: 'Super fast home sample collection. Collected at 7:15 AM and report was ready by evening. Highly recommend!', date: '2026-07-05' },
  { id: 'rev-2', patientName: 'Pooja Deshmukh', rating: 4, comment: 'Clean facility for walk-in checks. Staff is highly cooperative and professional.', date: '2026-07-02' }
];

export const INITIAL_NOTIFICATIONS = [
  { id: 'not-1', title: 'New Booking Received', message: 'Karan Sharma booked Home Sample Collection for 2026-07-07.', date: new Date().toISOString(), read: false },
  { id: 'not-2', title: 'Payment Settled', message: '₹1,012.50 was credited to your wallet for booking lbk-902.', date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), read: true }
];
