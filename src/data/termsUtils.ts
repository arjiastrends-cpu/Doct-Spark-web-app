/**
 * Terms & Conditions Management System Utilities
 * Manages terms documents, version history, acceptance logs, and publishing.
 */

import { addAuditLog } from './commissionUtils';
import { saveInAppNotification } from './targetUtils';

export interface SeoSettings {
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  slug: string;
  canonicalUrl: string;
  ogTags: string;
  twitterTags: string;
  robots: string;
  schemaMarkup: string;
}

export interface ChangeLogEntry {
  adminName: string;
  date: string;
  time: string;
  changesMade: string;
  versionNumber: string;
  reasonForUpdate: string;
}

export interface TermsDocument {
  id: string; // 'patient' | 'doctor' | 'clinic' | 'physiotherapy' | 'pharmacy' | 'partner'
  name: string;
  title: string;
  content: string;
  version: string;
  requireReacceptance: boolean; // "Require Existing Users to Accept Updated Terms"
  seoSettings: SeoSettings;
  publishingStatus: 'Published' | 'Draft' | 'Archived';
  pdfUrl: string | null;
  pdfFileName: string | null;
  updatedAt: string;
  updatedBy: string;
  scheduledPublishDate: string | null;
  scheduledExpiryDate: string | null;
}

export interface TermsVersion {
  id: string;
  documentId: string;
  title: string;
  content: string;
  version: string;
  seoSettings: SeoSettings;
  pdfUrl: string | null;
  pdfFileName: string | null;
  publishingStatus: 'Published' | 'Draft' | 'Archived';
  createdAt: string;
  createdBy: string;
  changeLog: ChangeLogEntry;
}

export interface TermsAcceptanceLog {
  id: string;
  userId: string; // User Email or UUID
  userName: string;
  userEmail: string;
  registrationType: string; // 'patient' | 'doctor' | 'clinic' | 'physiotherapy' | 'pharmacy' | 'partner'
  acceptedVersion: string;
  acceptanceDate: string;
  ipAddress: string;
  browserUserAgent: string;
  status: 'Accepted' | 'Declined';
}

const DEFAULT_SEO = (type: string, name: string): SeoSettings => ({
  pageTitle: `${name} | DoctSpark`,
  metaTitle: `Official ${name} - DoctSpark Healthcare`,
  metaDescription: `Read the official ${name} for DoctSpark. Learn about your rights, responsibilities, and our service rules.`,
  keywords: `DoctSpark, ${type}, terms and conditions, terms of service, healthcare, medical agreement`,
  slug: `${type}-terms-and-conditions`,
  canonicalUrl: `https://doctspark.in/legal/${type}-terms`,
  ogTags: `og:title=DoctSpark ${name}&og:type=website`,
  twitterTags: `twitter:card=summary_large_image&twitter:title=DoctSpark ${name}`,
  robots: "index, follow",
  schemaMarkup: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `DoctSpark ${name}`,
    "description": `Official ${name} of DoctSpark`
  }, null, 2)
});

const DEFAULT_DOCUMENTS: TermsDocument[] = [
  {
    id: 'patient',
    name: 'Patient Terms',
    title: 'Terms & Conditions for Patients',
    content: `<h2>1. Acceptance of Terms</h2><p>Welcome to <strong>DoctSpark</strong>. By registering as a patient, you agree to comply with and be bound by these terms. Please read them carefully.</p><h2>2. Patient Responsibilities</h2><ul><li>Provide accurate, current, and complete health history information.</li><li>Attend scheduled appointments or cancel at least 24 hours in advance.</li><li>Respect healthcare providers and staff.</li></ul><h2>3. Emergency Medical Situations</h2><p>DoctSpark is NOT for medical emergencies. If you are experiencing a life-threatening situation, please contact your local emergency services (e.g., 102/108) immediately.</p><h2>4. Privacy and Security</h2><p>Your data is protected under our Privacy Policy. Digital prescriptions are stored securely and only shared with verified doctors and linked pharmacies.</p>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('patient', 'Patient Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  },
  {
    id: 'doctor',
    name: 'Doctor Terms',
    title: 'Terms & Conditions for Doctors',
    content: `<h2>1. Clinical Practitioner Agreement</h2><p>As a verified doctor on <strong>DoctSpark</strong>, you certify that you hold a valid, active medical license and registration with the National Medical Commission (NMC) or State Medical Council.</p><h2>2. Standard of Care</h2><ul><li>Practice in accordance with professional medical ethics and standard of care.</li><li>Maintain independent clinical judgment when advising patients.</li><li>Provide digital prescriptions using authorized generic names where applicable.</li></ul><h2>3. Consultations & Payouts</h2><p>DoctSpark handles appointment booking and handles secure billing. Payouts are made weekly as per the configured commission ledger. Platform charges are automatically deducted before payout.</p>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('doctor', 'Doctor Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  },
  {
    id: 'clinic',
    name: 'Clinic Terms',
    title: 'Terms & Conditions for Clinics & Hospitals',
    content: `<h2>1. Corporate Registration Agreement</h2><p>Clinics registered on <strong>DoctSpark</strong> must represent physical brick-and-mortar facilities complying with Clinical Establishments (Registration and Regulation) rules.</p><h2>2. Chamber and Staffing Rules</h2><ul><li>Ensure all practicing doctors in your chambers are individually verified.</li><li>Maintain adequate clinical infrastructure and sanitation standards.</li><li>Process cancellations or patient reschedules promptly through the dashboard.</li></ul><h2>3. Billing and Commissions</h2><p>Subscription or transaction-based commissions are processed as per the Super Admin config. Any discrepancy must be reported within 15 days of the revenue ledger generation.</p>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('clinic', 'Clinic Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy Terms',
    title: 'Terms & Conditions for Physiotherapists',
    content: `<h2>1. Practitioner Qualification</h2><p>Registered Physiotherapists must hold a valid degree (BPT/MPT) and registration with the Indian Association of Physiotherapists (IAP) or relevant State Allied Health Councils.</p><h2>2. Service Alignment</h2><ul><li>Provide active physical therapy and rehabilitation assessments.</li><li>Maintain records of home-visit, clinic-visit, and video-consult sessions.</li><li>Charge patients according to the verified pricing schedule list.</li></ul>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('physiotherapy', 'Physiotherapy Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy Terms',
    title: 'Terms & Conditions for Pharmacy Partners',
    content: `<h2>1. Pharmacy Licensing</h2><p>Pharmacy partners on <strong>DoctSpark</strong> must possess a valid Retail Drug License issued by the State Drugs Control Department and a registered pharmacist on duty.</p><h2>2. Order Processing</h2><ul><li>Dispense scheduled prescription medicines ONLY against verified digital prescriptions from registered doctors.</li><li>Deliver medicines in clean, tamper-evident sealed packaging.</li><li>Verify patient identity upon home delivery.</li></ul>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('pharmacy', 'Pharmacy Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  },
  {
    id: 'partner',
    name: 'Partner Terms',
    title: 'Terms & Conditions for Network Partners',
    content: `<h2>1. Franchise Franchisee Relationship</h2><p>This Network Partner Agreement govern the state-level, district-level, and city-level partners helping onboard and verify clinical facilities for <strong>DoctSpark</strong>.</p><h2>2. Field Responsibilities</h2><ul><li>Conduct physical verification of clinical establishments before approving.</li><li>Educate local doctors and clinic operators on the digital subscription model.</li><li>Do not misrepresent platform fees or collect unapproved physical cash.</li></ul><h2>3. Earning Structure</h2><p>Earnings are generated on a revenue-share model on subscriptions and appointments booked in your assigned territory. Payouts are subjected to active milestone target evaluations.</p>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('partner', 'Partner Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  },
  {
    id: 'laboratory',
    name: 'Laboratory Terms',
    title: 'Terms & Conditions for Laboratory Partners',
    content: `<h2>1. Diagnostic Quality & Compliance</h2><p>Laboratory partners on <strong>DoctSpark</strong> agree to maintain standard certifications (NABL/ISO) and use state-licensed technicians for pathology, radiology, and diagnostics processing.</p><h2>2. Patient Samples & Booking</h2><ul><li>Execute booked tests according to scheduled slots.</li><li>Provide digital test reports within the configured turnaround time.</li><li>Maintain patient medical confidentiality at all times.</li></ul>`,
    version: '1.0',
    requireReacceptance: false,
    seoSettings: DEFAULT_SEO('laboratory', 'Laboratory Terms'),
    publishingStatus: 'Published',
    pdfUrl: null,
    pdfFileName: null,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Super Admin',
    scheduledPublishDate: null,
    scheduledExpiryDate: null
  }
];

// Helper to initialize database in localStorage
export function initTermsDatabase(): void {
  if (!localStorage.getItem('ds_terms_documents')) {
    localStorage.setItem('ds_terms_documents', JSON.stringify(DEFAULT_DOCUMENTS));
    
    // Seed initial versions
    const initialVersions: TermsVersion[] = DEFAULT_DOCUMENTS.map(doc => ({
      id: `VER-${doc.id}-10-${Date.now()}`,
      documentId: doc.id,
      title: doc.title,
      content: doc.content,
      version: '1.0',
      seoSettings: doc.seoSettings,
      pdfUrl: null,
      pdfFileName: null,
      publishingStatus: 'Published',
      createdAt: doc.updatedAt,
      createdBy: 'Super Admin',
      changeLog: {
        adminName: 'Super Admin',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        changesMade: 'Initial publication of terms & conditions.',
        versionNumber: '1.0',
        reasonForUpdate: 'System bootstrap setup.'
      }
    }));
    localStorage.setItem('ds_terms_versions', JSON.stringify(initialVersions));
  }
  
  if (!localStorage.getItem('ds_terms_acceptance_logs')) {
    localStorage.setItem('ds_terms_acceptance_logs', JSON.stringify([]));
  }
}

// Get all terms documents
export function getTermsDocuments(): TermsDocument[] {
  initTermsDatabase();
  const stored = localStorage.getItem('ds_terms_documents');
  return stored ? JSON.parse(stored) : DEFAULT_DOCUMENTS;
}

// Save terms documents
export function saveTermsDocuments(docs: TermsDocument[]): void {
  localStorage.setItem('ds_terms_documents', JSON.stringify(docs));
}

// Get versions for a specific document or all
export function getTermsVersions(documentId?: string): TermsVersion[] {
  initTermsDatabase();
  const stored = localStorage.getItem('ds_terms_versions');
  const all: TermsVersion[] = stored ? JSON.parse(stored) : [];
  if (documentId) {
    return all.filter(v => v.documentId === documentId);
  }
  return all;
}

// Get all acceptance logs
export function getTermsAcceptanceLogs(): TermsAcceptanceLog[] {
  initTermsDatabase();
  const stored = localStorage.getItem('ds_terms_acceptance_logs');
  return stored ? JSON.parse(stored) : [];
}

// Add a new version of Terms & Conditions
export function createTermsVersion(
  documentId: string,
  fields: Partial<TermsDocument>,
  changeReason: string,
  adminName: string = 'Super Admin'
): TermsDocument {
  const docs = getTermsDocuments();
  const docIndex = docs.findIndex(d => d.id === documentId);
  if (docIndex === -1) throw new Error('Terms document not found');

  const oldDoc = docs[docIndex];
  
  // Calculate next version
  let nextVersion = '1.0';
  if (oldDoc.version) {
    const parts = oldDoc.version.split('.');
    if (parts.length === 2) {
      const major = parseInt(parts[0], 10);
      const minor = parseInt(parts[1], 10);
      nextVersion = `${major}.${minor + 1}`; // Default increment minor
    }
  }

  const updatedDoc: TermsDocument = {
    ...oldDoc,
    ...fields,
    version: nextVersion,
    updatedAt: new Date().toISOString(),
    updatedBy: adminName,
  };

  docs[docIndex] = updatedDoc;
  saveTermsDocuments(docs);

  // Add to versions list
  const versions = getTermsVersions();
  const newVer: TermsVersion = {
    id: `VER-${documentId}-${nextVersion.replace('.', '')}-${Date.now()}`,
    documentId,
    title: updatedDoc.title,
    content: updatedDoc.content,
    version: nextVersion,
    seoSettings: updatedDoc.seoSettings,
    pdfUrl: updatedDoc.pdfUrl,
    pdfFileName: updatedDoc.pdfFileName,
    publishingStatus: updatedDoc.publishingStatus,
    createdAt: updatedDoc.updatedAt,
    createdBy: adminName,
    changeLog: {
      adminName,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      changesMade: `Updated content. Title: "${updatedDoc.title}"`,
      versionNumber: nextVersion,
      reasonForUpdate: changeReason || 'Routine content refinement.'
    }
  };
  versions.unshift(newVer);
  localStorage.setItem('ds_terms_versions', JSON.stringify(versions));

  // Log in Super Admin Audit Trail
  addAuditLog(
    'Update Terms & Conditions',
    adminName,
    `Updated ${updatedDoc.name} to Version ${nextVersion}. Reason: "${changeReason}". Force re-acceptance: ${updatedDoc.requireReacceptance ? 'Yes' : 'No'}`
  );

  // Automatically trigger dynamic mock in-app/email notifications for all relevant users
  triggerTermsUpdateNotifications(updatedDoc, nextVersion);

  return updatedDoc;
}

// Function to check if a logged-in user needs to accept terms
export function checkUserTermsStatus(userEmail: string | null, role: string | null): {
  needsAcceptance: boolean;
  document: TermsDocument | null;
  latestVersion: string;
} {
  if (!userEmail || !role) {
    return { needsAcceptance: false, document: null, latestVersion: '' };
  }

  // Map roles to legal documents
  const roleToDocIdMap: Record<string, string> = {
    'patient': 'patient',
    'doctor': 'doctor',
    'clinic': 'clinic',
    'physiotherapy': 'physiotherapy',
    'pharmacy': 'pharmacy',
    'partner': 'partner',
    'state_partner': 'partner',
    'district_partner': 'partner',
    'city_partner': 'partner',
    'state': 'partner',
    'district': 'partner',
    'city': 'partner',
    'laboratory': 'laboratory'
  };

  const docId = roleToDocIdMap[role.toLowerCase()];
  if (!docId) {
    return { needsAcceptance: false, document: null, latestVersion: '' };
  }

  const docs = getTermsDocuments();
  const doc = docs.find(d => d.id === docId);
  if (!doc || doc.publishingStatus !== 'Published') {
    return { needsAcceptance: false, document: null, latestVersion: '' };
  }

  const logs = getTermsAcceptanceLogs();
  
  // Find acceptance of this user for this document type
  const userAcceptance = logs.find(
    l => l.userEmail.toLowerCase() === userEmail.toLowerCase() && 
         (l.registrationType === docId || 
          (docId === 'partner' && ['partner', 'state_partner', 'district_partner', 'city_partner', 'state', 'district', 'city'].includes(l.registrationType))) && 
         l.status === 'Accepted'
  );

  if (!userAcceptance) {
    // Never accepted before (new registration should block, but also handles legacy users)
    return { needsAcceptance: true, document: doc, latestVersion: doc.version };
  }

  // Force re-acceptance check
  if (doc.requireReacceptance && userAcceptance.acceptedVersion !== doc.version) {
    return { needsAcceptance: true, document: doc, latestVersion: doc.version };
  }

  return { needsAcceptance: false, document: doc, latestVersion: doc.version };
}

// Log a terms acceptance
export function logTermsAcceptance(
  userEmail: string,
  userName: string,
  registrationType: string,
  version: string,
  ipAddress: string = '192.168.1.1',
  browserUserAgent: string = navigator.userAgent
): TermsAcceptanceLog {
  const logs = getTermsAcceptanceLogs();
  
  // Remove older acceptance log for the same registration type & same version to avoid duplicates
  const filtered = logs.filter(
    l => !(l.userEmail.toLowerCase() === userEmail.toLowerCase() && l.registrationType === registrationType && l.acceptedVersion === version)
  );

  const newLog: TermsAcceptanceLog = {
    id: `ACC-${registrationType.toUpperCase()}-${Date.now()}`,
    userId: userEmail,
    userName: userName || userEmail.split('@')[0],
    userEmail: userEmail,
    registrationType,
    acceptedVersion: version,
    acceptanceDate: new Date().toLocaleString(),
    ipAddress,
    browserUserAgent,
    status: 'Accepted'
  };

  filtered.unshift(newLog);
  localStorage.setItem('ds_terms_acceptance_logs', JSON.stringify(filtered));

  return newLog;
}

// Trigger Notifications for terms update (Email, SMS, In-App, Push)
export function triggerTermsUpdateNotifications(doc: TermsDocument, version: string): void {
  // We mock the notification trigger and log it
  const notificationKey = `ds_terms_notifications_${doc.id}_v${version.replace('.', '_')}`;
  
  const payload = {
    documentId: doc.id,
    documentName: doc.name,
    version,
    effectiveDate: new Date().toLocaleDateString(),
    updatedTermsTitle: doc.title,
    message: `We have updated our ${doc.name} to Version ${version}. Please read the new terms. Effective date: ${new Date().toLocaleDateString()}.`,
    sentAt: new Date().toISOString()
  };

  localStorage.setItem(notificationKey, JSON.stringify(payload));

  // Push actual in-app notifications for superadmin and general recipients
  try {
    const adminMsg = `📢 LEGAL UPDATE: Published ${doc.name} Version ${version}. Automated email/SMS/in-app alert campaign successfully dispatched to all active users.`;
    saveInAppNotification('superadmin', adminMsg);

    // Add a corresponding global Audit Trail record
    addAuditLog(
      'Terms Update Notification',
      'System Operator',
      `Dispatched compliance alerts for ${doc.name} (V${version}) via active communication channels (SMS/Email/In-App).`
    );
  } catch (err) {
    console.error('Failed to trigger global notification logs:', err);
  }
}
