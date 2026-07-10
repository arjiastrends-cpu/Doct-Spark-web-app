/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Doctor, Clinic, Review, Appointment } from '../types';
import { indiaStatesData } from './indiaLocations';

export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad'
];

export interface GeographyState {
  stateName: string;
  districts: {
    districtName: string;
    cities: string[];
  }[];
}

export const GEOGRAPHY_DATA: GeographyState[] = [
  ...indiaStatesData.map(st => ({
    stateName: st.state,
    districts: st.districts.map(dst => ({
      districtName: dst.name,
      cities: dst.cities
    }))
  })),
  {
    stateName: 'Delhi NCR',
    districts: [
      { districtName: 'New Delhi', cities: ['Delhi'] },
      { districtName: 'Gautam Buddha Nagar', cities: ['Noida'] },
      { districtName: 'Ghaziabad', cities: ['Ghaziabad'] },
      { districtName: 'Gurugram', cities: ['Gurgaon'] }
    ]
  }
];

export const SPECIALTIES = [
  { name: 'General Physician', icon: '🩺', desc: 'For everyday health issues, colds, fevers' },
  { name: 'Cardiologist', icon: '❤️', desc: 'Heart health, chest pain, high blood pressure' },
  { name: 'Dermatologist', icon: '🧴', desc: 'Skin, hair, nails, acne, eczema treatment' },
  { name: 'Orthopedic', icon: '🦴', desc: 'Bone and joint care, fractures, arthritis' },
  { name: 'Pediatrician', icon: '👶', desc: 'Child healthcare, vaccinations, development' },
  { name: 'Gynecologist', icon: '🤱', desc: 'Women\'s health, pregnancy, maternity care' },
  { name: 'Neurologist', icon: '🧠', desc: 'Brain, nerves, headaches, migraine care' },
  { name: 'Psychiatrist', icon: '💭', desc: 'Mental health, anxiety, depression support' },
  { name: 'Dentist', icon: '🦷', desc: 'Teeth cleaning, fillings, root canals' },
  { name: 'Ophthalmologist', icon: '👁️', desc: 'Eye care, vision tests, spectacles' },
  { name: 'ENT Specialist', icon: '👂', desc: 'Ear, nose, and throat treatment' },
  { name: 'Urologist', icon: '💧', desc: 'Urinary tract, kidney health' }
];

export const MOCK_DOCTORS: Doctor[] = [];

export const MOCK_CLINICS: Clinic[] = [];

export const MOCK_REVIEWS: Review[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

