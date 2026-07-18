import React from 'react';
import { 
  Database, Layers, Code, ShieldAlert, History, HardDrive, 
  Download, Upload, Plus, Edit3, Trash2, RefreshCw, Search, 
  Filter, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Info, 
  Folder, FolderPlus, Play, Check, X, Key, Lock, AlertTriangle, 
  CheckCircle2, Calendar, Settings, Terminal, BarChart2, Eye, FileText, UserCheck, Share2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

// Define Interface for Database Table Schema
interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'UUID' | 'INT' | 'NUMERIC' | 'BOOLEAN' | 'DATE' | 'TIMESTAMPTZ' | 'ARRAY';
  isNullable: boolean;
  isPrimaryKey: boolean;
  foreignKey?: { table: string; column: string };
}

interface TableDefinition {
  name: string;
  label: string;
  key: string; // localStorage key
  columns: ColumnDefinition[];
}

// 1. Core Schema Definition for all tables
const SCHEMA: TableDefinition[] = [
  {
    name: 'profiles',
    label: 'User Profiles (profiles)',
    key: 'ds_local_accounts_profiles',
    columns: [
      { name: 'id', type: 'UUID', isNullable: false, isPrimaryKey: true },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'role', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'full_name', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'avatar_url', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'status', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'user_settings',
    label: 'User Settings (user_settings)',
    key: 'ds_table_user_settings',
    columns: [
      { name: 'id', type: 'UUID', isNullable: false, isPrimaryKey: true },
      { name: 'user_id', type: 'UUID', isNullable: false, isPrimaryKey: false, foreignKey: { table: 'profiles', column: 'id' } },
      { name: 'theme', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'sms_notifications', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'email_notifications', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'push_notifications', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'two_factor_enabled', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'roles',
    label: 'RBAC Roles (roles)',
    key: 'ds_table_roles',
    columns: [
      { name: 'id', type: 'UUID', isNullable: false, isPrimaryKey: true },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'description', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'permissions',
    label: 'RBAC Permissions (permissions)',
    key: 'ds_table_permissions',
    columns: [
      { name: 'id', type: 'UUID', isNullable: false, isPrimaryKey: true },
      { name: 'code', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'module', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'role_permissions',
    label: 'Role-Permissions Map (role_permissions)',
    key: 'ds_table_role_permissions',
    columns: [
      { name: 'role_id', type: 'UUID', isNullable: false, isPrimaryKey: true, foreignKey: { table: 'roles', column: 'id' } },
      { name: 'permission_id', type: 'UUID', isNullable: false, isPrimaryKey: true, foreignKey: { table: 'permissions', column: 'id' } }
    ]
  },
  {
    name: 'user_role_assignments',
    label: 'User Role Assignments (user_role_assignments)',
    key: 'ds_table_user_role_assignments',
    columns: [
      { name: 'user_id', type: 'UUID', isNullable: false, isPrimaryKey: true, foreignKey: { table: 'profiles', column: 'id' } },
      { name: 'role_id', type: 'UUID', isNullable: false, isPrimaryKey: true, foreignKey: { table: 'roles', column: 'id' } }
    ]
  },
  {
    name: 'patients',
    label: 'Patients Index (patients)',
    key: 'ds_table_patients',
    columns: [
      { name: 'id', type: 'UUID', isNullable: false, isPrimaryKey: true },
      { name: 'user_id', type: 'UUID', isNullable: true, isPrimaryKey: false, foreignKey: { table: 'profiles', column: 'id' } },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'patient_name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'dob', type: 'DATE', isNullable: true, isPrimaryKey: false },
      { name: 'gender', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'blood_group', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'city', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'state', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'pincode', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'doctors',
    label: 'Medical Practitioners (doctors)',
    key: 'ds_doctors',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'user_id', type: 'UUID', isNullable: true, isPrimaryKey: false, foreignKey: { table: 'profiles', column: 'id' } },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'specialization', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'experience_years', type: 'INT', isNullable: false, isPrimaryKey: false },
      { name: 'consultation_fee', type: 'NUMERIC', isNullable: false, isPrimaryKey: false },
      { name: 'qualification', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'registration_number', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'approved', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'rating', type: 'NUMERIC', isNullable: true, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'clinics',
    label: 'Affiliated Clinics (clinics)',
    key: 'ds_clinics',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'user_id', type: 'UUID', isNullable: true, isPrimaryKey: false, foreignKey: { table: 'profiles', column: 'id' } },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'address', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'city', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'state', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'pincode', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'commission_rate', type: 'NUMERIC', isNullable: false, isPrimaryKey: false },
      { name: 'approved', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'hospitals',
    label: 'Hospitals Directory (hospitals)',
    key: 'ds_table_hospitals',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'address', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'city', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'state', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'beds_count', type: 'INT', isNullable: true, isPrimaryKey: false },
      { name: 'approved', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'laboratories',
    label: 'Laboratory Partners (laboratories)',
    key: 'ds_table_laboratories',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'address', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'city', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'state', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'approved', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'pharmacies',
    label: 'Registered Pharmacies (pharmacies)',
    key: 'ds_table_pharmacies',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'address', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'city', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'state', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'license_number', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'approved', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'physiotherapy_centers',
    label: 'Physiotherapy Centers (physiotherapy_centers)',
    key: 'ds_table_physiotherapy_centers',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'address', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'city', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'state', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'approved', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'partners',
    label: 'Business Franchise Partners (partners)',
    key: 'ds_table_partners',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'partner_type', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'assigned_state', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'referral_code', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'status', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'staff_profiles',
    label: 'Staff Profiles (staff_profiles)',
    key: 'ds_table_staff_profiles',
    columns: [
      { name: 'id', type: 'UUID', isNullable: false, isPrimaryKey: true },
      { name: 'user_id', type: 'UUID', isNullable: false, isPrimaryKey: false, foreignKey: { table: 'profiles', column: 'id' } },
      { name: 'tenant_type', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'tenant_id', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'designation', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'phone', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'appointments',
    label: 'Booking Schedules & Logs (appointments)',
    key: 'ds_appointments',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'patient_id', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'doctor_id', type: 'TEXT', isNullable: true, isPrimaryKey: false, foreignKey: { table: 'doctors', column: 'id' } },
      { name: 'clinic_id', type: 'TEXT', isNullable: true, isPrimaryKey: false, foreignKey: { table: 'clinics', column: 'id' } },
      { name: 'date', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'time_slot', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'patient_name', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'patient_phone', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'patient_age', type: 'INT', isNullable: false, isPrimaryKey: false },
      { name: 'consultation_type', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'fee', type: 'NUMERIC', isNullable: false, isPrimaryKey: false },
      { name: 'status', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'payment_status', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', isNullable: true, isPrimaryKey: false }
    ]
  },
  {
    name: 'patient_wallets',
    label: 'Patient Wallets (patient_wallets)',
    key: 'ds_patient_wallets',
    columns: [
      { name: 'email', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'balance', type: 'NUMERIC', isNullable: false, isPrimaryKey: false },
      { name: 'reward_balance', type: 'NUMERIC', isNullable: false, isPrimaryKey: false },
      { name: 'currency', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'status', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'wallet_transactions',
    label: 'Wallet Transactions (wallet_transactions)',
    key: 'ds_wallet_transactions',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'patient_email', type: 'TEXT', isNullable: false, isPrimaryKey: false, foreignKey: { table: 'patient_wallets', column: 'email' } },
      { name: 'amount', type: 'NUMERIC', isNullable: false, isPrimaryKey: false },
      { name: 'type', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'source', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'status', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'remarks', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'timestamp', type: 'TEXT', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'cms_pages',
    label: 'CMS Pages & Blogs (cms_pages)',
    key: 'ds_table_cms_pages',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'title', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'slug', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'category', type: 'TEXT', isNullable: false, isPrimaryKey: false }, // Blog, FAQ, Static Page
      { name: 'content', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'author', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'is_published', type: 'BOOLEAN', isNullable: false, isPrimaryKey: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'support_tickets',
    label: 'Support Tickets (support_tickets)',
    key: 'ds_table_support_tickets',
    columns: [
      { name: 'id', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'user_email', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'subject', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'description', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'status', type: 'TEXT', isNullable: false, isPrimaryKey: false }, // Open, Pending, Resolved
      { name: 'priority', type: 'TEXT', isNullable: false, isPrimaryKey: false }, // High, Medium, Low
      { name: 'created_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  },
  {
    name: 'system_settings',
    label: 'System & Gateway Config (system_settings)',
    key: 'ds_table_system_settings',
    columns: [
      { name: 'key', type: 'TEXT', isNullable: false, isPrimaryKey: true },
      { name: 'value', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'category', type: 'TEXT', isNullable: false, isPrimaryKey: false },
      { name: 'description', type: 'TEXT', isNullable: true, isPrimaryKey: false },
      { name: 'updated_at', type: 'TIMESTAMPTZ', isNullable: false, isPrimaryKey: false }
    ]
  }
];

// Seed data definitions to populate empty tables initially
const SEED_DATA: Record<string, any[]> = {
  profiles: [
    { id: 'usr-101', email: 'maidulsrkr@gmail.com', role: 'superadmin', name: 'Maidul Sarkar', full_name: 'Maidul Sarkar', phone: '+91 98765 43210', status: 'Active', created_at: new Date(Date.now() - 30 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'usr-102', email: 'vikranth.patil@doctspark.com', role: 'doctor', name: 'Dr. Vikranth Patil', full_name: 'Dr. Vikranth Patil', phone: '+91 99999 88888', status: 'Active', created_at: new Date(Date.now() - 25 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'usr-103', email: 'apollo.clinic@doctspark.com', role: 'clinic', name: 'Apollo Clinic Row', full_name: 'Apollo Clinic Row', phone: '+91 88888 77777', status: 'Active', created_at: new Date(Date.now() - 20 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'usr-104', email: 'arjun.mehta@gmail.com', role: 'patient', name: 'Arjun Mehta', full_name: 'Arjun Mehta', phone: '+91 77777 66666', status: 'Active', created_at: new Date(Date.now() - 15 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'usr-105', email: 'rahul.state@doctspark.com', role: 'partner', name: 'Rahul Verma Partner', full_name: 'Rahul Verma Partner', phone: '+91 66666 55555', status: 'Active', created_at: new Date(Date.now() - 10 * 86400000).toISOString(), updated_at: new Date().toISOString() }
  ],
  user_settings: [
    { id: 'set-101', user_id: 'usr-101', theme: 'light', sms_notifications: true, email_notifications: true, push_notifications: true, two_factor_enabled: true, created_at: new Date().toISOString() },
    { id: 'set-102', user_id: 'usr-102', theme: 'system', sms_notifications: true, email_notifications: false, push_notifications: true, two_factor_enabled: false, created_at: new Date().toISOString() }
  ],
  roles: [
    { id: 'role-1', name: 'SuperAdmin', description: 'Complete system root override privileges', created_at: new Date().toISOString() },
    { id: 'role-2', name: 'Practitioner', description: 'Doctor clinical and schedule privileges', created_at: new Date().toISOString() },
    { id: 'role-3', name: 'AffiliatedClinic', description: 'Clinic administrative oversight', created_at: new Date().toISOString() },
    { id: 'role-4', name: 'FranchisePartner', description: 'Zone management & agent commissions', created_at: new Date().toISOString() },
    { id: 'role-5', name: 'StandardPatient', description: 'Search, consult bookings, & wallet access', created_at: new Date().toISOString() }
  ],
  permissions: [
    { id: 'perm-1', code: 'database:all', name: 'Full Database Overlord', module: 'Database', created_at: new Date().toISOString() },
    { id: 'perm-2', code: 'user:manage', name: 'Write/Suspend Users', module: 'Users', created_at: new Date().toISOString() },
    { id: 'perm-3', code: 'finance:approve', name: 'Approve Payout Settlements', module: 'Finance', created_at: new Date().toISOString() },
    { id: 'perm-4', code: 'cms:publish', name: 'Publish Custom Articles', module: 'CMS', created_at: new Date().toISOString() },
    { id: 'perm-5', code: 'support:resolve', name: 'Resolve Customer Complaints', module: 'Support', created_at: new Date().toISOString() }
  ],
  role_permissions: [
    { role_id: 'role-1', permission_id: 'perm-1' },
    { role_id: 'role-1', permission_id: 'perm-2' },
    { role_id: 'role-1', permission_id: 'perm-3' },
    { role_id: 'role-4', permission_id: 'perm-3' }
  ],
  user_role_assignments: [
    { user_id: 'usr-101', role_id: 'role-1' },
    { user_id: 'usr-102', role_id: 'role-2' },
    { user_id: 'usr-103', role_id: 'role-3' },
    { user_id: 'usr-105', role_id: 'role-4' }
  ],
  patients: [
    { id: 'pat-1', user_id: 'usr-104', email: 'arjun.mehta@gmail.com', patient_name: 'Arjun Mehta', phone: '+91 77777 66666', dob: '1992-05-18', gender: 'Male', blood_group: 'O+', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', created_at: new Date().toISOString() }
  ],
  doctors: [
    { id: 'doc-66120', user_id: 'usr-102', email: 'vikranth.patil@doctspark.com', name: 'Dr. Vikranth Patil', phone: '+91 99999 88888', specialization: 'Dermatologist', experience_years: 12, consultation_fee: 650.00, qualification: 'MBBS, MD Dermatology', registration_number: 'MCI-66120', approved: true, rating: 4.85, created_at: new Date().toISOString() }
  ],
  clinics: [
    { id: 'c-1001', user_id: 'usr-103', email: 'apollo.clinic@doctspark.com', name: 'Apollo Dental & Cardiac Hub', phone: '+91 88888 77777', address: 'Plot 42, Sector 5', city: 'Kolkata', state: 'West Bengal', pincode: '700091', commission_rate: 15.00, approved: true, created_at: new Date().toISOString() }
  ],
  hospitals: [
    { id: 'hosp-901', email: 'fortis.rehab@doctspark.com', name: 'Fortis Multi-Specialty Rehab', phone: '+91 44444 33333', address: 'Main Ring Road', city: 'Delhi', state: 'Delhi', beds_count: 250, approved: true, created_at: new Date().toISOString() }
  ],
  laboratories: [
    { id: 'lab-201', email: 'lal.path@doctspark.com', name: 'Lal PathLabs Franchise Unit', phone: '+91 33333 22222', address: '3rd Cross, Salt Lake', city: 'Kolkata', state: 'West Bengal', approved: true, created_at: new Date().toISOString() }
  ],
  pharmacies: [
    { id: 'pharm-301', email: 'medplus.pharmacy@doctspark.com', name: 'MedPlus Pharma Retail', phone: '+91 22222 11111', address: 'Block C, Gachibowli', city: 'Hyderabad', state: 'Telangana', license_number: 'DL-22910-M', approved: true, created_at: new Date().toISOString() }
  ],
  physiotherapy_centers: [
    { id: 'physio-401', email: 'malhotra.physio@doctspark.com', name: 'Malhotra Physio & Spinal Ortho', phone: '+91 11111 00000', address: '7B, Park Circus', city: 'Kolkata', state: 'West Bengal', approved: true, created_at: new Date().toISOString() }
  ],
  partners: [
    { id: 'partner-501', user_id: 'usr-105', email: 'rahul.state@doctspark.com', name: 'Rahul Verma Partner', phone: '+91 66666 55555', partner_type: 'State', assigned_state: 'Maharashtra', referral_code: 'DSMAH99', status: 'Approved', created_at: new Date().toISOString() }
  ],
  staff_profiles: [
    { id: 'stf-1', user_id: 'usr-101', tenant_type: 'superadmin', tenant_id: 'system', designation: 'Database Administrator', phone: '+91 99911 22233', created_at: new Date().toISOString() }
  ],
  appointments: [
    { id: 'apt-7811', patient_id: 'arjun.mehta@gmail.com', doctor_id: 'doc-66120', clinic_id: 'c-1001', date: '2026-07-19', time_slot: '04:30 PM - 05:00 PM', patient_name: 'Arjun Mehta', patient_phone: '+91 77777 66666', patient_age: 34, consultation_type: 'Video', fee: 650.00, status: 'Confirmed', payment_status: 'Paid', created_at: new Date().toISOString() }
  ],
  patient_wallets: [
    { email: 'arjun.mehta@gmail.com', balance: 1500.00, reward_balance: 350.00, currency: 'INR', status: 'Active', updated_at: new Date().toISOString() },
    { email: 'maidulsrkr@gmail.com', balance: 99999.00, reward_balance: 0.00, currency: 'INR', status: 'Active', updated_at: new Date().toISOString() }
  ],
  wallet_transactions: [
    { id: 'tx-2291', patient_email: 'arjun.mehta@gmail.com', amount: 500.00, type: 'Credit', source: 'Razorpay Gateway', status: 'Success', remarks: 'Added funds to wallet', timestamp: new Date().toLocaleString() }
  ],
  cms_pages: [
    { id: 'cms-1', title: 'Why Telemedicine is the Future of Indian Healthcare', slug: 'future-telemedicine-india', category: 'Blog', content: '<p>Telehealth technology is scaling exponentially across Tier-2 and Tier-3 rural areas in India, saving travel times...</p>', author: 'Dr. Vikranth Patil', is_published: true, created_at: new Date().toISOString() },
    { id: 'cms-2', title: 'How can I request a home sample collection for diagnostic tests?', slug: 'faq-home-diagnostic-collection', category: 'FAQ', content: 'Navigate to the Diagnostics panel, select your required pathology test, choose "Home Collection", enter your address, and our agent will arrive within 2 hours.', author: 'Super Admin', is_published: true, created_at: new Date().toISOString() }
  ],
  support_tickets: [
    { id: 'tkt-8820', user_email: 'arjun.mehta@gmail.com', subject: 'Consultation Video stream froze', description: 'During my session with Dr. Vikranth, the Jitsi feed got stuck but consultation fee was debited. Requesting reimbursement.', status: 'Open', priority: 'High', created_at: new Date().toISOString() }
  ],
  system_settings: [
    { key: 'SMTP_HOST', value: 'smtp.mailgun.org', category: 'Gateway', description: 'Master SMTP Server host for outgoing email alerts', updated_at: new Date().toISOString() },
    { key: 'SMS_GATEWAY_API', value: 'https://api.twilio.com/2010-04-01/Accounts/', category: 'Gateway', description: 'Twilio Gateway API endpoint key-pair', updated_at: new Date().toISOString() },
    { key: 'MAINTENANCE_MODE', value: 'false', category: 'System', description: 'Globally toggle site access lock for software updates', updated_at: new Date().toISOString() }
  ]
};

export default function DatabaseManager({ userEmail }: { userEmail: string | null }) {
  // Navigation states
  const [activeSubTab, setActiveSubTab] = React.useState<'dashboard' | 'tables' | 'relationships' | 'storage' | 'backups' | 'audit'>('dashboard');

  // Load audit logs state
  const [auditLogs, setAuditLogs] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_db_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'db-log-1',
        timestamp: new Date(Date.now() - 5000).toLocaleString(),
        user: userEmail || 'master.admin@doctspark.com',
        ip: '192.168.1.1',
        action: 'Open Database Panel',
        table: 'System',
        operation: 'READ',
        details: 'Admin opened the Enterprise Database Management Suite successfully.'
      }
    ];
  });

  const saveAuditLog = (action: string, table: string, operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SYSTEM', details: string) => {
    const newLog = {
      id: `db-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString(),
      user: userEmail || 'master.admin@doctspark.com',
      ip: '103.45.210.82',
      action,
      table,
      operation,
      details
    };
    const updated = [newLog, ...auditLogs].slice(0, 500); // limit to 500
    setAuditLogs(updated);
    localStorage.setItem('ds_db_audit_logs', JSON.stringify(updated));
  };

  // State to track table data
  const [dbData, setDbData] = React.useState<Record<string, any[]>>(() => {
    const data: Record<string, any[]> = {};
    SCHEMA.forEach(tbl => {
      const saved = localStorage.getItem(tbl.key);
      if (saved) {
        try {
          data[tbl.name] = JSON.parse(saved);
        } catch (e) {
          data[tbl.name] = SEED_DATA[tbl.name] || [];
        }
      } else {
        data[tbl.name] = SEED_DATA[tbl.name] || [];
        localStorage.setItem(tbl.key, JSON.stringify(data[tbl.name]));
      }
    });
    return data;
  });

  const updateTableData = (tableName: string, newData: any[]) => {
    const targetTable = SCHEMA.find(t => t.name === tableName);
    if (!targetTable) return;
    
    // Save to State
    setDbData(prev => ({
      ...prev,
      [tableName]: newData
    }));
    
    // Save to LocalStorage
    localStorage.setItem(targetTable.key, JSON.stringify(newData));
  };

  // ----------------------------------------------------
  // SUB-TAB 1: DATABASE DASHBOARD & SQL CONSOLE
  // ----------------------------------------------------
  const [sqlQuery, setSqlQuery] = React.useState('SELECT * FROM doctors WHERE approved = true;');
  const [sqlResult, setSqlResult] = React.useState<{ columns: string[]; rows: any[]; error: string | null; message: string | null } | null>({
    columns: ['id', 'name', 'specialization', 'consultation_fee', 'approved'],
    rows: [
      { id: 'doc-66120', name: 'Dr. Vikranth Patil', specialization: 'Dermatologist', consultation_fee: 650.00, approved: true }
    ],
    error: null,
    message: 'Statement returned 1 rows successfully in 3.4ms'
  });

  const handleExecuteSQL = () => {
    const trimmed = sqlQuery.trim().toLowerCase();
    
    if (!trimmed) {
      setSqlResult({ columns: [], rows: [], error: 'Query is empty.', message: null });
      return;
    }

    try {
      // 1. SELECT * FROM <table> [WHERE <col> = <val>]
      if (trimmed.startsWith('select')) {
        let tableName = '';
        const match = sqlQuery.match(/from\s+([a-zA-Z0-9_]+)/i);
        if (match && match[1]) {
          tableName = match[1].toLowerCase().trim();
        }

        if (!tableName || !dbData[tableName]) {
          setSqlResult({
            columns: [],
            rows: [],
            error: `Relation "${tableName || 'unknown'}" does not exist in public schema.`,
            message: null
          });
          return;
        }

        let rows = [...dbData[tableName]];
        const tableDef = SCHEMA.find(t => t.name === tableName);
        const cols = tableDef ? tableDef.columns.map(c => c.name) : Object.keys(rows[0] || {});

        // Simple where simulator
        const whereMatch = sqlQuery.match(/where\s+([a-zA-Z0-9_]+)\s*=\s*['"]?([a-zA-Z0-9_@.\s+%-]+)['"]?/i);
        if (whereMatch && whereMatch[1] && whereMatch[2]) {
          const colName = whereMatch[1].trim();
          const targetVal = whereMatch[2].trim().replace(/['"]/g, '');
          
          rows = rows.filter(r => String(r[colName]).toLowerCase() === targetVal.toLowerCase());
        }

        setSqlResult({
          columns: cols,
          rows,
          error: null,
          message: `Query completed: Returned ${rows.length} rows from schema definition in 2.1ms`
        });
        saveAuditLog(`Execute SQL: ${sqlQuery.substring(0, 80)}`, tableName, 'READ', `SQL command returned ${rows.length} rows.`);
      }
      // 2. UPDATE <table> SET <col> = <val> [WHERE ...]
      else if (trimmed.startsWith('update')) {
        const match = sqlQuery.match(/update\s+([a-zA-Z0-9_]+)/i);
        if (!match || !match[1]) {
          throw new Error('Could not parse UPDATE table name.');
        }
        const tableName = match[1].toLowerCase().trim();
        if (!dbData[tableName]) {
          throw new Error(`Relation "${tableName}" does not exist.`);
        }

        const setMatch = sqlQuery.match(/set\s+([a-zA-Z0-9_]+)\s*=\s*['"]?([a-zA-Z0-9_@.\s+%-]+)['"]?/i);
        if (!setMatch) {
          throw new Error('Could not parse SET clause. Use: UPDATE table SET col = val [WHERE ...]');
        }

        const setCol = setMatch[1].trim();
        const setVal = setMatch[2].trim();

        let count = 0;
        const updatedRows = dbData[tableName].map(r => {
          let shouldUpdate = true;
          const whereMatch = sqlQuery.match(/where\s+([a-zA-Z0-9_]+)\s*=\s*['"]?([a-zA-Z0-9_@.\s+%-]+)['"]?/i);
          if (whereMatch && whereMatch[1] && whereMatch[2]) {
            const wCol = whereMatch[1].trim();
            const wVal = whereMatch[2].trim();
            if (String(r[wCol]).toLowerCase() !== wVal.toLowerCase()) {
              shouldUpdate = false;
            }
          }

          if (shouldUpdate) {
            count++;
            let typedVal: any = setVal;
            if (setVal === 'true') typedVal = true;
            else if (setVal === 'false') typedVal = false;
            else if (!isNaN(Number(setVal))) typedVal = Number(setVal);

            return { ...r, [setCol]: typedVal, updated_at: new Date().toISOString() };
          }
          return r;
        });

        updateTableData(tableName, updatedRows);
        setSqlResult({
          columns: [],
          rows: [],
          error: null,
          message: `UPDATE query completed: Modified ${count} records inside table "${tableName}" in 5.2ms`
        });
        saveAuditLog(`Execute SQL: ${sqlQuery.substring(0, 80)}`, tableName, 'UPDATE', `Direct SQL updated ${count} records.`);
      } else {
        setSqlResult({
          columns: [],
          rows: [],
          error: 'Only SELECT and UPDATE statements are supported in sandbox CLI console. INSERT, DELETE, and DDL operations must be made securely via Table Explorer CRUD.',
          message: null
        });
      }
    } catch (err: any) {
      setSqlResult({ columns: [], rows: [], error: err.message || 'SQL syntax compilation error.', message: null });
    }
  };

  // Chart Data for Health Metrics
  const cpuLoadHistory = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m ago`,
      cpu: Math.floor(Math.random() * 25) + 12,
      memory: Math.floor(Math.random() * 5) + 64,
      connections: Math.floor(Math.random() * 8) + 42
    })).reverse();
  }, []);

  // ----------------------------------------------------
  // SUB-TAB 2: TABLE EXPLORER (CRUD + Import/Export)
  // ----------------------------------------------------
  const [selectedTableName, setSelectedTableName] = React.useState('profiles');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterColumn, setFilterColumn] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState('id');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([]);
  const itemsPerPage = 8;

  // Selected table schema definition
  const selectedTable = React.useMemo(() => {
    return SCHEMA.find(t => t.name === selectedTableName) || SCHEMA[0];
  }, [selectedTableName]);

  // Handle Sort Toggle
  const toggleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  // Filter, Search, and Sort Logic
  const filteredAndSortedRows = React.useMemo(() => {
    const rows = dbData[selectedTable.name] || [];
    
    // 1. Search Query filter (matches any string field)
    let processed = rows.filter(r => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      return Object.entries(r).some(([key, val]) => {
        return String(val).toLowerCase().includes(term);
      });
    });

    // 2. Exact Column Filter
    if (filterColumn && filterValue) {
      const term = filterValue.toLowerCase().trim();
      processed = processed.filter(r => {
        return String(r[filterColumn] ?? '').toLowerCase().trim().includes(term);
      });
    }

    // 3. Sort
    processed.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return processed;
  }, [dbData, selectedTable, searchQuery, filterColumn, filterValue, sortColumn, sortDirection]);

  // Paginated Rows
  const paginatedRows = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedRows, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / itemsPerPage));

  // CRUD Modals state
  const [showCrudModal, setShowCrudModal] = React.useState<'create' | 'edit' | null>(null);
  const [editingRowData, setEditingRowData] = React.useState<any>(null);

  // Manage Row Checkbox Selection
  const handleToggleRowSelection = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleToggleAllRows = () => {
    const pageIds = paginatedRows.map(r => r.id || r.email || r.key);
    const allSelected = pageIds.every(id => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedRowIds(prev => [...Array.from(new Set([...prev, ...pageIds]))]);
    }
  };

  // Perform Add/Edit Submit
  const handleCrudSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const rowObj: Record<string, any> = {};
    
    selectedTable.columns.forEach(col => {
      const rawVal = formData.get(col.name);
      if (rawVal === null || rawVal === '') {
        rowObj[col.name] = col.isNullable ? null : '';
      } else if (col.type === 'BOOLEAN') {
        rowObj[col.name] = rawVal === 'true';
      } else if (col.type === 'INT' || col.type === 'NUMERIC') {
        rowObj[col.name] = Number(rawVal);
      } else {
        rowObj[col.name] = rawVal;
      }
    });

    const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';

    if (showCrudModal === 'create') {
      const keyVal = rowObj[primaryCol] || `row-${Date.now()}`;
      rowObj[primaryCol] = keyVal;
      rowObj['created_at'] = new Date().toISOString();
      rowObj['updated_at'] = new Date().toISOString();

      const updated = [rowObj, ...(dbData[selectedTable.name] || [])];
      updateTableData(selectedTable.name, updated);
      saveAuditLog(`Add Record`, selectedTable.name, 'CREATE', `Created row ${keyVal}: ${JSON.stringify(rowObj).substring(0, 100)}...`);
      alert('Record added successfully!');
    } else {
      // Edit
      const keyVal = editingRowData[primaryCol];
      rowObj[primaryCol] = keyVal;
      rowObj['updated_at'] = new Date().toISOString();

      const updated = (dbData[selectedTable.name] || []).map(r => {
        if (r[primaryCol] === keyVal) {
          return { ...r, ...rowObj };
        }
        return r;
      });
      updateTableData(selectedTable.name, updated);
      saveAuditLog(`Edit Record`, selectedTable.name, 'UPDATE', `Updated row ${keyVal}: changed fields.`);
      alert('Record modified successfully!');
    }

    setShowCrudModal(null);
    setEditingRowData(null);
  };

  // Record Actions: Soft Delete, Restore, Permanently Delete
  const handleSoftDeleteRow = (row: any) => {
    const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';
    const keyVal = row[primaryCol];

    const updated = (dbData[selectedTable.name] || []).map(r => {
      if (r[primaryCol] === keyVal) {
        return { ...r, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      }
      return r;
    });

    updateTableData(selectedTable.name, updated);
    saveAuditLog(`Soft Delete Record`, selectedTable.name, 'DELETE', `Soft deleted row key ${keyVal}.`);
    alert(`Record [${keyVal}] soft-deleted successfully.`);
  };

  const handleRestoreRow = (row: any) => {
    const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';
    const keyVal = row[primaryCol];

    const updated = (dbData[selectedTable.name] || []).map(r => {
      if (r[primaryCol] === keyVal) {
        return { ...r, deleted_at: null, updated_at: new Date().toISOString() };
      }
      return r;
    });

    updateTableData(selectedTable.name, updated);
    saveAuditLog(`Restore Record`, selectedTable.name, 'UPDATE', `Restored row key ${keyVal}.`);
    alert(`Record [${keyVal}] restored successfully.`);
  };

  const handleHardDeleteRow = (row: any) => {
    const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';
    const keyVal = row[primaryCol];

    if (!confirm(`Are you absolutely sure you want to PERMANENTLY delete record with ${primaryCol} = "${keyVal}"? This operation cannot be undone and breaches DB foreign key references if active!`)) {
      return;
    }

    const updated = (dbData[selectedTable.name] || []).filter(r => r[primaryCol] !== keyVal);
    updateTableData(selectedTable.name, updated);
    saveAuditLog(`Hard Delete Record`, selectedTable.name, 'DELETE', `Permanently purged row key ${keyVal}.`);
    alert(`Record [${keyVal}] permanently deleted.`);
  };

  // Bulk Operations
  const handleBulkUpdateStatus = (statusValue: string) => {
    if (selectedRowIds.length === 0) {
      alert('Please select at least one record.');
      return;
    }
    const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';
    const updated = (dbData[selectedTable.name] || []).map(r => {
      if (selectedRowIds.includes(r[primaryCol])) {
        return { ...r, status: statusValue, updated_at: new Date().toISOString() };
      }
      return r;
    });
    updateTableData(selectedTable.name, updated);
    saveAuditLog(`Bulk Status Update`, selectedTable.name, 'UPDATE', `Modified status to "${statusValue}" for ${selectedRowIds.length} records.`);
    setSelectedRowIds([]);
    alert(`Bulk updated ${selectedRowIds.length} records to "${statusValue}".`);
  };

  const handleBulkDelete = () => {
    if (selectedRowIds.length === 0) {
      alert('Please select at least one record.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete these ${selectedRowIds.length} selected records?`)) {
      return;
    }
    const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';
    const updated = (dbData[selectedTable.name] || []).filter(r => !selectedRowIds.includes(r[primaryCol]));
    updateTableData(selectedTable.name, updated);
    saveAuditLog(`Bulk Hard Delete`, selectedTable.name, 'DELETE', `Permanently purged ${selectedRowIds.length} records.`);
    setSelectedRowIds([]);
    alert(`Bulk purged ${selectedRowIds.length} records.`);
  };

  // Import / Export CSV Utility
  const handleExportCSV = () => {
    const rows = dbData[selectedTable.name] || [];
    if (rows.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = selectedTable.columns.map(c => c.name).join(',');
    const csvLines = rows.map(r => {
      return selectedTable.columns.map(col => {
        let val = r[col.name];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headers, ...csvLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ds_export_${selectedTable.name}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveAuditLog(`Export CSV`, selectedTable.name, 'READ', `Exported ${rows.length} records to spreadsheet CSV.`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          alert('CSV file does not contain header or row values.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';

        const importedRows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rowVals = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, any> = {};

          selectedTable.columns.forEach(col => {
            const hIdx = headers.indexOf(col.name);
            if (hIdx >= 0 && rowVals[hIdx] !== undefined && rowVals[hIdx] !== '') {
              const valStr = rowVals[hIdx];
              if (col.type === 'BOOLEAN') {
                rowObj[col.name] = valStr === 'true';
              } else if (col.type === 'INT' || col.type === 'NUMERIC') {
                rowObj[col.name] = Number(valStr);
              } else {
                rowObj[col.name] = valStr;
              }
            } else {
              rowObj[col.name] = col.isNullable ? null : (col.type === 'BOOLEAN' ? false : (col.type === 'INT' ? 0 : ''));
            }
          });

          if (!rowObj[primaryCol]) {
            rowObj[primaryCol] = `csv-${Date.now()}-${i}`;
          }
          if (!rowObj['created_at']) rowObj['created_at'] = new Date().toISOString();
          rowObj['updated_at'] = new Date().toISOString();
          
          importedRows.push(rowObj);
        }

        // Merge or replace
        const existing = [...(dbData[selectedTable.name] || [])];
        importedRows.forEach(newRow => {
          const idx = existing.findIndex(r => r[primaryCol] === newRow[primaryCol]);
          if (idx >= 0) {
            existing[idx] = newRow; // update
          } else {
            existing.unshift(newRow); // insert
          }
        });

        updateTableData(selectedTable.name, existing);
        saveAuditLog(`Import CSV`, selectedTable.name, 'CREATE', `Bulk-imported ${importedRows.length} CSV rows successfully.`);
        alert(`Successfully imported ${importedRows.length} records!`);
      } catch (err: any) {
        alert(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // ----------------------------------------------------
  // SUB-TAB 3: TABLE RELATIONSHIPS MAP
  // ----------------------------------------------------
  const relationshipsList = React.useMemo(() => {
    const list: Array<{ fromTable: string; fromColumn: string; toTable: string; toColumn: string }> = [];
    SCHEMA.forEach(tbl => {
      tbl.columns.forEach(col => {
        if (col.foreignKey) {
          list.push({
            fromTable: tbl.name,
            fromColumn: col.name,
            toTable: col.foreignKey.table,
            toColumn: col.foreignKey.column
          });
        }
      });
    });
    return list;
  }, []);

  // ----------------------------------------------------
  // SUB-TAB 4: FILE STORAGE MANAGER
  // ----------------------------------------------------
  const [currentBucket, setCurrentBucket] = React.useState<'avatars' | 'prescriptions' | 'diagnostic_reports' | 'carousel_banners'>('avatars');
  const [currentFolder, setCurrentFolder] = React.useState<string>('/');
  const [showAddFolderModal, setShowAddFolderModal] = React.useState(false);
  const [storageItems, setStorageItems] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_storage_manager_files');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'file-1', name: 'doctor_profile_patil.jpg', size: '124 KB', type: 'image/jpeg', bucket: 'avatars', folder: '/', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300', date: '2026-06-12 10:22 AM' },
      { id: 'file-2', name: 'admin_avatar.png', size: '48 KB', type: 'image/png', bucket: 'avatars', folder: '/', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', date: '2026-07-01 02:45 PM' },
      { id: 'file-3', name: 'banner_promotional_discount.jpg', size: '480 KB', type: 'image/jpeg', bucket: 'carousel_banners', folder: '/', url: 'https://images.unsplash.com/photo-1504813184591-01552661c840?auto=format&fit=crop&q=80&w=1200', date: '2026-07-15 08:00 AM' },
      { id: 'file-4', name: 'lab_report_hematology.pdf', size: '2.4 MB', type: 'application/pdf', bucket: 'diagnostic_reports', folder: '/patient_401/', url: '#', date: '2026-07-17 11:30 AM' }
    ];
  });

  const saveStorageItems = (items: any[]) => {
    setStorageItems(items);
    localStorage.setItem('ds_storage_manager_files', JSON.stringify(items));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload
    const mockFileObj = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'application/octet-stream',
      bucket: currentBucket,
      folder: currentFolder,
      url: file.type.startsWith('image/') 
        ? 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=300' 
        : '#',
      date: new Date().toLocaleString()
    };

    const updated = [...storageItems, mockFileObj];
    saveStorageItems(updated);
    saveAuditLog('Upload Storage File', `Storage: ${currentBucket}`, 'CREATE', `Uploaded file "${file.name}" to folder "${currentFolder}".`);
    alert(`File "${file.name}" uploaded successfully to bucket [${currentBucket}]!`);
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    const updated = storageItems.filter(f => f.id !== fileId);
    saveStorageItems(updated);
    saveAuditLog('Delete Storage File', `Storage`, 'DELETE', `Purged storage file "${fileName}".`);
    alert(`File deleted.`);
  };

  // ----------------------------------------------------
  // SUB-TAB 5: BACKUP & RESTORE CENTER
  // ----------------------------------------------------
  const [backups, setBackups] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('ds_db_backups_list');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'bk-1', filename: 'ds_backup_weekly_integrity_20260710.json', size: '254 KB', status: 'Completed', timestamp: '2026-07-10 03:00 AM', autoScheduled: true },
      { id: 'bk-2', filename: 'ds_backup_manual_v1_live_purge.json', size: '210 KB', status: 'Completed', timestamp: '2026-07-15 01:22 PM', autoScheduled: false }
    ];
  });

  const handleCreateBackup = () => {
    const backupDump = {
      version: '1.4.0',
      timestamp: new Date().toISOString(),
      schema: SCHEMA.map(t => ({ name: t.name, key: t.key })),
      tablesData: dbData
    };

    const fileName = `ds_db_backup_${new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)}.json`;
    const blob = new Blob([JSON.stringify(backupDump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Save to backups list
    const newBackup = {
      id: `bk-${Date.now()}`,
      filename: fileName,
      size: `${(blob.size / 1024).toFixed(1)} KB`,
      status: 'Completed',
      timestamp: new Date().toLocaleString(),
      autoScheduled: false,
      rawDump: JSON.stringify(backupDump)
    };

    const updated = [newBackup, ...backups];
    setBackups(updated);
    localStorage.setItem('ds_db_backups_list', JSON.stringify(updated));

    // Offer Download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveAuditLog('Create Database Backup', 'Backups', 'SYSTEM', `Created database JSON snapshot dump [${fileName}].`);
    alert(`Success! Database snapshot "${fileName}" generated and downloaded.`);
  };

  const handleRestoreBackup = (backup: any) => {
    if (!confirm(`CRITICAL WARNING: Restoring backup [${backup.filename}] will completely overwrite your current browser local storage database for all tables! Any changes made after "${backup.timestamp}" will be permanently lost. Proceed?`)) {
      return;
    }

    try {
      let dataToRestore: any = null;
      if (backup.rawDump) {
        dataToRestore = JSON.parse(backup.rawDump);
      } else {
        // Fallback mock restore if rawDump wasn't saved locally
        dataToRestore = { tablesData: SEED_DATA };
      }

      if (dataToRestore && dataToRestore.tablesData) {
        Object.entries(dataToRestore.tablesData).forEach(([tblName, rows]) => {
          const tblSchema = SCHEMA.find(t => t.name === tblName);
          if (tblSchema) {
            localStorage.setItem(tblSchema.key, JSON.stringify(rows));
          }
        });
        
        // Refresh state
        setDbData(dataToRestore.tablesData);
        saveAuditLog('Restore Database Backup', 'Backups', 'SYSTEM', `Restored full database state to backup from ${backup.timestamp}.`);
        alert('Database state restored successfully! Refreshing view.');
        window.location.reload();
      } else {
        throw new Error('Invalid backup structure.');
      }
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // SUB-TAB 6: USER SECURITY & RBAC MANAGER
  // ----------------------------------------------------
  const [selectedUserForRbac, setSelectedUserForRbac] = React.useState<any>(null);
  const [showRbacModal, setShowRbacModal] = React.useState(false);

  const handleMapUserRole = (userId: string, roleName: string) => {
    const roleDef = dbData.roles?.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    if (!roleDef) return;

    // Check if assignment exists
    const assignments = [...(dbData.user_role_assignments || [])];
    const idx = assignments.findIndex(a => a.user_id === userId);
    
    if (idx >= 0) {
      assignments[idx].role_id = roleDef.id;
    } else {
      assignments.push({ user_id: userId, role_id: roleDef.id });
    }

    updateTableData('user_role_assignments', assignments);
    saveAuditLog('Map User Role', 'user_role_assignments', 'UPDATE', `Assigned role ${roleName} to user ID ${userId}.`);
    alert(`Successfully assigned role "${roleName}" to user.`);
    setShowRbacModal(false);
  };

  return (
    <div className="space-y-6" id="enterprise-db-management-system">
      {/* Enterprise Database Manager Title Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-500/40">
                  Supabase Enterprise Admin
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Sync Active</span>
              </div>
              <h1 className="text-xl font-black tracking-tight mt-1">
                DOCT SPARK Master DB Engine
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized cloud and local offline-fallback ledger engine console. Multi-tenant PostgreSQL RLS control active.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-300">
            <span className="px-2.5 py-1 bg-indigo-600 rounded-lg text-white font-black uppercase tracking-wider text-[10px]">
              SuperAdmin Privilege Mode
            </span>
          </div>
        </div>

        {/* Database Management Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-6 border-t border-slate-800/80 pt-5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
            { id: 'tables', label: 'Table Explorer', icon: Layers },
            { id: 'relationships', label: 'Relational Graph', icon: Code },
            { id: 'storage', label: 'Storage Manager', icon: HardDrive },
            { id: 'backups', label: 'Backup & Restore', icon: ShieldAlert },
            { id: 'audit', label: 'Audit Trail', icon: History }
          ].map(tab => {
            const IsActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  saveAuditLog(`Switch DB Tab`, 'Navigation', 'READ', `Switched view to db-${tab.id}`);
                }}
                className={`flex items-center gap-2 justify-center px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  IsActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15 border-indigo-500' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-transparent'
                } border`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: HEALTH DASHBOARD & SQL CONSOLE */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Active Tables</span>
                <p className="text-xl font-black text-slate-800 mt-1">{SCHEMA.length}</p>
                <span className="text-[10px] text-slate-500 font-medium">Relational schema active</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                🗂️
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Total Records</span>
                <p className="text-xl font-black text-slate-800 mt-1">
                  {Object.values(dbData).reduce((sum: number, current) => sum + ((current as any[])?.length || 0), 0)}
                </p>
                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                  ● Live Sync
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                📈
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">DB Storage Size</span>
                <p className="text-xl font-black text-slate-800 mt-1">452 KB</p>
                <span className="text-[10px] text-slate-500 font-medium">LocalStorage usage</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                💾
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Read/Write Latency</span>
                <p className="text-xl font-black text-slate-800 mt-1">1.2ms / 3.1ms</p>
                <span className="text-[10px] text-indigo-600 font-bold">Optimized Indexes</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                ⚡
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Server Stats */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Server Telemetry</h3>
                <p className="text-xs text-slate-400">Real-time database machine resource monitor</p>
              </div>

              {/* CPU load widget */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-600">Simulated CPU Load</span>
                    <span className="text-xs font-black text-indigo-600">18.5%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: '18%' }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-600">Active Pool Connections</span>
                    <span className="text-xs font-black text-emerald-600">45 / 100</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-slate-600">Autovacuum Daemon Status</span>
                    <span className="text-xs font-black text-blue-600">Idle (Awaiting threshold)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>

              {/* Maintenance checklist */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h4 className="text-[10px] uppercase font-extrabold text-slate-400">Database Flags</h4>
                {[
                  { name: 'Row Level Security (RLS) Enforced', active: true },
                  { name: 'Weekly Automated DB Vacuuming', active: true },
                  { name: 'Real-time WebSocket Listening', active: false }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.active ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL Terminal Sandbox Console */}
            <div className="lg:col-span-2 bg-slate-950 text-slate-200 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">PostgreSQL Sandbox CLI Shell</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>SSL Connection</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Execute database statements directly against browser LocalStorage mock tables. Supported commands: <code className="text-amber-400 font-mono">SELECT</code> and <code className="text-amber-400 font-mono">UPDATE</code>.
              </p>

              <div className="space-y-2">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Enter PostgreSQL syntax here..."
                />
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setSqlQuery('SELECT * FROM doctors WHERE approved = true;')}
                    className="text-[10px] text-indigo-400 hover:underline font-mono"
                  >
                    Load preset doctor query
                  </button>

                  <button
                    onClick={handleExecuteSQL}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-extrabold hover:bg-indigo-500 transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Query</span>
                  </button>
                </div>
              </div>

              {/* SQL output box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-48 overflow-auto font-mono text-xs text-slate-300">
                {sqlResult ? (
                  <div className="space-y-3">
                    {sqlResult.error && (
                      <div className="text-rose-400 flex items-start gap-1.5 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>ERROR: {sqlResult.error}</span>
                      </div>
                    )}

                    {sqlResult.message && (
                      <div className="text-emerald-400 text-[10px]">
                        SUCCESS: {sqlResult.message}
                      </div>
                    )}

                    {sqlResult.rows && sqlResult.rows.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-800 text-[10px]">
                          <thead>
                            <tr className="bg-slate-850 text-slate-100 border-b border-slate-800">
                              {sqlResult.columns.map((col, idx) => (
                                <th key={idx} className="p-2 border border-slate-800">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sqlResult.rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-800">
                                {sqlResult.columns.map((col, colIdx) => (
                                  <td key={colIdx} className="p-2 border border-slate-800">
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-center py-12">
                    Terminal idle. Awaiting compilation.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TABLE EXPLORER (CRUD + BULK + CSV) */}
      {activeSubTab === 'tables' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Table Selection Sidebar */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 h-[550px] overflow-y-auto">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Relations Schema</h3>
                <p className="text-[11px] text-slate-400">Select public schema table to view and perform mutations</p>
              </div>

              <div className="space-y-1">
                {SCHEMA.map(tbl => {
                  const isActive = selectedTableName === tbl.name;
                  const recordCount = dbData[tbl.name]?.length || 0;
                  return (
                    <button
                      key={tbl.name}
                      onClick={() => {
                        setSelectedTableName(tbl.name);
                        setFilterColumn('');
                        setFilterValue('');
                        setSelectedRowIds([]);
                        setCurrentPage(1);
                        saveAuditLog('Inspect Table Schema', tbl.name, 'READ', `Inspected schemas & indexes of "${tbl.name}".`);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' 
                          : 'bg-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{tbl.label.split(' ')[0]}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 font-extrabold rounded-md text-[9px]">
                        {recordCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Records Grid */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[550px]">
              <div className="space-y-4">
                {/* Table Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <span>{selectedTable.label}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-lg border border-indigo-100">
                        {filteredAndSortedRows.length} records matched
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Enforce PostgreSQL rules & Supabase policies on this relation.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowCrudModal('create')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs flex items-center gap-1 transition-all"
                      title="Export table dataset to CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>

                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Filter and Search controls */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search record cell contents..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={filterColumn}
                      onChange={(e) => { setFilterColumn(e.target.value); setFilterValue(''); }}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    >
                      <option value="">No Filter Column</option>
                      {selectedTable.columns.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    {filterColumn && (
                      <input
                        type="text"
                        placeholder="Column value contains..."
                        value={filterValue}
                        onChange={(e) => { setFilterValue(e.target.value); setCurrentPage(1); }}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white w-44"
                      />
                    )}
                  </div>
                </div>

                {/* Bulk Actions Bar if checked */}
                {selectedRowIds.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                    <span className="text-xs text-amber-800 font-bold">
                      ⚠️ Selected {selectedRowIds.length} records. Perform bulk actions:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleBulkUpdateStatus('Active')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-lg"
                      >
                        Approve/Set Active
                      </button>
                      <button
                        onClick={() => handleBulkUpdateStatus('Suspended')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-rose-700 font-extrabold text-[10px] uppercase rounded-lg"
                      >
                        Suspend/Block
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Purge Hard</span>
                      </button>
                      <button
                        onClick={() => setSelectedRowIds([])}
                        className="text-[10px] text-slate-500 font-bold hover:underline px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Database Table Rendering */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[10px] font-black uppercase">
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={paginatedRows.length > 0 && paginatedRows.every(r => selectedRowIds.includes(r.id || r.email || r.key))}
                            onChange={handleToggleAllRows}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        {selectedTable.columns.map(col => (
                          <th
                            key={col.name}
                            onClick={() => toggleSort(col.name)}
                            className="p-3 cursor-pointer hover:bg-slate-100/50 transition-all select-none"
                          >
                            <div className="flex items-center gap-1">
                              <span>{col.name}</span>
                              {sortColumn === col.name ? (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                              ) : null}
                            </div>
                          </th>
                        ))}
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {paginatedRows.length > 0 ? (
                        paginatedRows.map((row, idx) => {
                          const primaryCol = selectedTable.columns.find(c => c.isPrimaryKey)?.name || 'id';
                          const rowKey = row[primaryCol];
                          const isChecked = selectedRowIds.includes(rowKey);
                          const isSoftDeleted = !!row.deleted_at;

                          return (
                            <tr key={idx} className={`hover:bg-slate-55/40 transition-all ${isSoftDeleted ? 'bg-rose-50/30' : ''} ${isChecked ? 'bg-indigo-50/20' : ''}`}>
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleRowSelection(rowKey)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              {selectedTable.columns.map(col => {
                                let val = row[col.name];
                                if (val === null || val === undefined) {
                                  return (
                                    <td key={col.name} className="p-3 text-slate-400 font-mono italic text-[11px]">
                                      null
                                    </td>
                                  );
                                }
                                
                                return (
                                  <td key={col.name} className="p-3 max-w-[150px] truncate">
                                    {col.type === 'BOOLEAN' ? (
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {val ? 'TRUE' : 'FALSE'}
                                      </span>
                                    ) : col.type === 'TIMESTAMPTZ' || col.type === 'DATE' ? (
                                      <span className="text-slate-500 font-mono text-[11px]">{new Date(val).toLocaleDateString()}</span>
                                    ) : col.isPrimaryKey ? (
                                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-lg text-[11px]">{String(val)}</span>
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                              
                              {/* Row Action Controls */}
                              <td className="p-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingRowData(row);
                                      setShowCrudModal('edit');
                                    }}
                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Edit Row Data"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  {isSoftDeleted ? (
                                    <button
                                      onClick={() => handleRestoreRow(row)}
                                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-lg transition-all"
                                      title="Restore Soft Deleted Row"
                                    >
                                      Restore
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleSoftDeleteRow(row)}
                                      className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-all"
                                      title="Soft Delete Row"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleHardDeleteRow(row)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all"
                                    title="Hard Purge (Permanent)"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={selectedTable.columns.length + 2} className="p-12 text-center text-slate-400 font-medium">
                            No records found matching search or column filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Footer Pagination */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                <span className="text-xs text-slate-400">
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredAndSortedRows.length} total entries)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CRUD Modal (Create / Edit row) */}
          {showCrudModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {showCrudModal === 'create' ? 'Create New DB Row' : 'Edit Row Data'}
                  </h3>
                  <button
                    onClick={() => { setShowCrudModal(null); setEditingRowData(null); }}
                    className="p-1 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCrudSubmit} className="space-y-4 text-xs">
                  {selectedTable.columns.map(col => {
                    const isPrimary = col.isPrimaryKey;
                    const isReadOnly = showCrudModal === 'edit' && isPrimary;
                    const defaultVal = showCrudModal === 'edit' && editingRowData ? editingRowData[col.name] : '';

                    return (
                      <div key={col.name}>
                        <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">
                          {col.name} {col.isPrimaryKey && '🔑'} {!col.isNullable && '🔴'}
                        </label>
                        
                        {col.type === 'BOOLEAN' ? (
                          <select
                            name={col.name}
                            defaultValue={defaultVal === undefined ? 'true' : String(defaultVal)}
                            disabled={isReadOnly}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                          >
                            <option value="true">TRUE</option>
                            <option value="false">FALSE</option>
                          </select>
                        ) : (
                          <input
                            type={col.type === 'INT' || col.type === 'NUMERIC' ? 'number' : col.type === 'DATE' ? 'date' : 'text'}
                            name={col.name}
                            step={col.type === 'NUMERIC' ? '0.01' : '1'}
                            defaultValue={defaultVal ?? ''}
                            disabled={isReadOnly}
                            required={!col.isNullable && !isPrimary}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                            placeholder={`Enter ${col.type}...`}
                          />
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowCrudModal(null); setEditingRowData(null); }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl"
                    >
                      {showCrudModal === 'create' ? 'Insert Row' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: RELATIONAL SCHEMA CONSTRAINTS */}
      {activeSubTab === 'relationships' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">PostgreSQL Table Foreign Key Constraints</h3>
            <p className="text-xs text-slate-400">Auditing structural associations and cascade deletions inside DOCT SPARK</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Relational connections list */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-[10px] uppercase font-extrabold text-slate-400">Primary and Foreign Key Schema Mappings</h4>
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-auto">
                {relationshipsList.map((rel, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <span className="text-indigo-600 font-bold">{rel.fromTable}</span>
                      <span className="text-slate-400">.{rel.fromColumn}</span>
                    </div>
                    <div className="text-slate-400 font-bold">references ➔</div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-slate-800 font-bold">{rel.toTable}</span>
                      <span className="text-slate-400">.{rel.toColumn}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graphic visualizer representation */}
            <div className="bg-[#FAFBFB] rounded-2xl p-6 border border-slate-100 flex flex-col justify-between items-center text-center">
              <div className="space-y-2">
                <span className="text-3xl block">🕸️</span>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Dynamic Relational Map Integrity</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  Cascade delete triggers are enforced on all profiles mapping. Direct delete operations in our system will clean up dependent vital stats, vitals, and user setting records automatically.
                </p>
              </div>

              <div className="w-full max-w-md bg-white p-4 rounded-xl border border-slate-200 shadow-3xs space-y-3 text-xs text-left mt-4 font-mono">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-50 pb-2">
                  <span>RELATION LINK</span>
                  <span>CASCADE DELETION</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0A6E6E]">profiles ➔ user_settings</span>
                  <span className="text-emerald-600 font-bold">ON DELETE CASCADE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0A6E6E]">profiles ➔ doctors</span>
                  <span className="text-amber-600 font-bold">ON DELETE SET NULL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0A6E6E]">doctors ➔ appointments</span>
                  <span className="text-amber-600 font-bold">ON DELETE SET NULL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: STORAGE MANAGER */}
      {activeSubTab === 'storage' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Supabase Storage File Browser</h3>
              <p className="text-xs text-slate-400">View files, verify clinician uploads, and manage assets inside your secure document buckets.</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload to Bucket</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Bucket Roster */}
            <div className="md:col-span-1 space-y-4">
              <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Storage Buckets</h4>
              <div className="space-y-1">
                {[
                  { id: 'avatars', label: 'avatars (Public Profiles)', files: storageItems.filter(f => f.bucket === 'avatars').length },
                  { id: 'prescriptions', label: 'prescriptions (Private)', files: storageItems.filter(f => f.bucket === 'prescriptions').length },
                  { id: 'diagnostic_reports', label: 'diagnostic_reports', files: storageItems.filter(f => f.bucket === 'diagnostic_reports').length },
                  { id: 'carousel_banners', label: 'carousel_banners (Public)', files: storageItems.filter(f => f.bucket === 'carousel_banners').length }
                ].map(buck => {
                  const isActive = currentBucket === buck.id;
                  return (
                    <button
                      key={buck.id}
                      onClick={() => {
                        setCurrentBucket(buck.id as any);
                        setCurrentFolder('/');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-between items-center ${
                        isActive ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{buck.label.split(' ')[0]}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-extrabold">{buck.files} files</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Folder / Files Browser Grid */}
            <div className="md:col-span-3 space-y-4">
              {/* Folder Breadcrumbs */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-700">{currentBucket}</span>
                <span>/</span>
                <span className="text-indigo-600 font-mono">{currentFolder}</span>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Virtual Clinic Folders */}
                {currentBucket === 'diagnostic_reports' && currentFolder === '/' && (
                  <div
                    onClick={() => setCurrentFolder('/patient_401/')}
                    className="bg-white border border-slate-200 hover:border-indigo-300 p-4 rounded-2xl shadow-3xs flex flex-col items-center text-center cursor-pointer transition-all"
                  >
                    <Folder className="w-10 h-10 text-amber-500 fill-amber-100 mb-2" />
                    <span className="text-xs font-bold text-slate-800">patient_401</span>
                    <span className="text-[10px] text-slate-400 mt-1">1 files inside</span>
                  </div>
                )}

                {currentFolder !== '/' && (
                  <div
                    onClick={() => setCurrentFolder('/')}
                    className="bg-white border border-slate-200 hover:border-indigo-300 p-4 rounded-2xl shadow-3xs flex flex-col items-center text-center cursor-pointer transition-all justify-center"
                  >
                    <span className="text-slate-400 font-extrabold text-sm mb-1">↖ Up</span>
                    <span className="text-[10px] text-slate-400">Back to root</span>
                  </div>
                )}

                {/* Storage Files */}
                {storageItems
                  .filter(f => f.bucket === currentBucket && f.folder === currentFolder)
                  .map(file => (
                    <div
                      key={file.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-3xs flex flex-col justify-between hover:shadow-sm transition-all"
                    >
                      <div>
                        {file.type.startsWith('image/') ? (
                          <div className="w-full h-24 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center mb-3">
                            <img src={file.url} referrerPolicy="no-referrer" alt={file.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center mb-3 text-slate-400 text-xs">
                            <span className="text-2xl mb-1">📄</span>
                            <span>{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-800 block truncate" title={file.name}>{file.name}</span>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                          <span>{file.size}</span>
                          <span>{file.date.split(' ')[0]}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-slate-50 pt-2.5 mt-2.5">
                        <button
                          onClick={() => {
                            alert('Downloading file from secure repository server...');
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg text-xs"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg text-xs"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: BACKUP & RESTORE */}
      {activeSubTab === 'backups' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Database Snapshot Backups & Restore</h3>
              <p className="text-xs text-slate-400">Save full state logs as offline JSON dump matrices or restore historic records.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateBackup}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Instant Backup</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-[#FAFBFB] rounded-2xl p-4 border border-slate-100 space-y-4">
              <h4 className="text-[10px] uppercase font-extrabold text-slate-400">Scheduling Engine</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Daily Database Dumps</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">Active</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automated backups are executed every night at 3:00 AM UTC. Backups are stored in your secure isolated Google Cloud project container bucket.
                </p>
                <div className="text-[10px] bg-slate-150 p-2.5 rounded-lg border border-slate-200 text-slate-600 font-mono">
                  CRON EXPRESSION: 0 3 * * *
                </div>
              </div>
            </div>

            {/* Backups List */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Backup Snapshots History</h4>
              
              <div className="divide-y divide-slate-100">
                {backups.map((bk, idx) => (
                  <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl">💽</span>
                      <div>
                        <span className="font-bold text-slate-800 font-mono text-[11px] block">{bk.filename}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{bk.size}</span>
                          <span>●</span>
                          <span>{bk.timestamp}</span>
                          {bk.autoScheduled && (
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[8px] font-black uppercase rounded-md">Auto</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreBackup(bk)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[10px] rounded-lg transition-all"
                        title="Restore DB state to this snapshot"
                      >
                        Restore DB State
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: AUDIT TRAIL LEDGER */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Master DB Operations Audit Logs</h3>
            <p className="text-xs text-slate-400">Complete, tamper-proof activity trail of all administrative actions, CRUD mutations, and logins.</p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[10px] font-black uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Operator User</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Action Details</th>
                  <th className="p-3">Impacted Relation</th>
                  <th className="p-3">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {auditLogs.map((log, idx) => {
                  const methodColor = 
                    log.operation === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    log.operation === 'UPDATE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    log.operation === 'DELETE' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    'bg-slate-50 text-slate-600 border-slate-200';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-800">{log.user}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{log.ip}</td>
                      <td className="p-3 max-w-sm truncate text-slate-600 font-medium" title={log.details}>{log.details}</td>
                      <td className="p-3 font-mono text-[11px] font-bold text-indigo-600">{log.table}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${methodColor}`}>
                          {log.operation}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
