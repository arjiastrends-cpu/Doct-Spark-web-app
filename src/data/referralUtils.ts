/**
 * Utility functions for Partner Referral IDs and Doctor Onboarding
 */

import { Partner } from '../types';

export function generatePartnerReferralId(partnerType: 'State' | 'District', existingPartners: any[]): string {
  const prefix = partnerType === 'State' ? 'ST' : 'DT';
  const startNum = partnerType === 'State' ? 100001 : 200001;
  
  // Find all used numbers for this prefix
  const usedNums = new Set<number>();
  for (const p of existingPartners) {
    if (p.referralId && p.referralId.startsWith(`${prefix}-`)) {
      const numPart = parseInt(p.referralId.split('-')[1]);
      if (!isNaN(numPart)) {
        usedNums.add(numPart);
      }
    }
  }

  // Find the next available number starting from startNum
  let nextNum = startNum;
  while (usedNums.has(nextNum)) {
    nextNum++;
  }

  return `${prefix}-${nextNum}`;
}

/**
 * Ensures that all partners in the database (including mock demo ones)
 * have a unique, permanent referral ID generated and saved.
 */
export function ensurePartnerReferralIds(): Partner[] {
  const savedPartnersRaw = localStorage.getItem('ds_partners');
  let partners: any[] = savedPartnersRaw ? JSON.parse(savedPartnersRaw) : [];

  // Define standard demo partners
  const demoPartners: any[] = [];

  let modified = false;

  // Add demo partners to the list if they aren't already there
  for (const demo of demoPartners) {
    const existingIndex = partners.findIndex(p => p.email.toLowerCase() === demo.email.toLowerCase());
    if (existingIndex === -1) {
      partners.push(demo);
      modified = true;
    } else {
      // If demo partner exists but has no referral ID, assign it
      if (!partners[existingIndex].referralId) {
        partners[existingIndex].referralId = demo.referralId;
        modified = true;
      }
    }
  }

  // Ensure ALL other partners have a referralId
  for (let i = 0; i < partners.length; i++) {
    if (!partners[i].referralId) {
      partners[i].referralId = generatePartnerReferralId(partners[i].partnerType, partners.slice(0, i));
      modified = true;
    }
  }

  if (modified) {
    localStorage.setItem('ds_partners', JSON.stringify(partners));
  }

  return partners;
}

/**
 * Validates a Referral Partner ID.
 * Returns the matching Partner details if valid, otherwise null.
 */
export function validateReferralId(referralId: string): Partner | null {
  if (!referralId) return null;
  const partners = ensurePartnerReferralIds();
  const match = partners.find(p => p.referralId && p.referralId.trim().toUpperCase() === referralId.trim().toUpperCase());
  return match || null;
}
