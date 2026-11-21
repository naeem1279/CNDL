/* Console-wide constants: labels, badge styles, page sizes, empty forms and role access. */
import type { TabKey } from './types';

export const MESSAGES_PER_PAGE = 12;
export const ACCOUNTS_PER_PAGE = 10;
export const EXPENSES_PER_PAGE = 15;
export const LEADS_PER_PAGE = 20;



/** Case intake channels. */
export const ORDER_SOURCE_META: Record<string, { label: string; cls: string }> = {
  OFFLINE_RIDER: { label: 'Rider Pickup', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PHONE: { label: 'Phone', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  WHATSAPP: { label: 'WhatsApp', cls: 'bg-[#25D366]/15 text-[#1a8f4a] border-[#25D366]/30' },
  ONLINE: { label: 'Online', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

/** Vita classical A1–D4 + Bleach shades. */
export const VITA_SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1', 'BL2', 'BL3', 'BL4'];

export const PAYMENT_METHODS = ['Cash', 'bKash', 'Bank'];

export { TOTAL_SHARES } from '@/lib/shares';


/** Order = order in the expense form. Keys are stored in the database: never rename a key. */
export const EXPENSE_CATEGORY_META: Record<string, { label: string; cls: string }> = {
  HOUSE_RENT: { label: 'House Rent', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  ELECTRICITY: { label: 'Electricity', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  WATER_BILL: { label: 'Water Bill', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  INTERNET_BILL: { label: 'Internet Bill', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FOOD_BILL: { label: 'Food Bill', cls: 'bg-lime-50 text-lime-800 border-lime-200' },
  RAW_MATERIAL: { label: 'Materials Cost', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  SALARY: { label: 'Salary', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  GAS_BILL: { label: 'Gas Bill', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  TRAVEL_ALLOWANCE: { label: 'Travel Allowance (TA)', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  MOBILE_BILL: { label: 'Mobile Bill', cls: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  DESIGN_COST: { label: 'Design Cost', cls: 'bg-pink-50 text-pink-700 border-pink-200' },
  LOGISTICS: { label: 'Logistics', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LAB_UTILITY: { label: 'Lab Utility', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  OTHER: { label: 'Others Expense', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};


/** Institution taxonomy (Hospital / Chamber / Lab / freelance clinician). */
export const INSTITUTION_TYPE_META: Record<string, { label: string; cls: string }> = {
  CHAMBER: { label: 'Chamber', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  HOSPITAL: { label: 'Hospital', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  PARTNER_LAB: { label: 'Lab', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  FREELANCE: { label: 'Personal', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

/** Bangladesh divisions (stored UPPERCASE in ClientAccount.division). */
export const DIVISIONS: { key: string; label: string; bn?: string }[] = [
  { key: 'DHAKA', label: 'Dhaka', bn: 'ঢাকা' },
  { key: 'CHATTOGRAM', label: 'Chattogram' },
  { key: 'RAJSHAHI', label: 'Rajshahi' },
  { key: 'KHULNA', label: 'Khulna' },
  { key: 'SYLHET', label: 'Sylhet' },
  { key: 'BARISHAL', label: 'Barishal' },
  { key: 'RANGPUR', label: 'Rangpur' },
  { key: 'MYMENSINGH', label: 'Mymensingh' },
];
export const DIVISION_LABEL: Record<string, string> = Object.fromEntries(
  DIVISIONS.map((d) => [d.key, d.label])
);

export const ROLE_META: Record<string, { label: string; cls: string }> = {
  SUPERADMIN: { label: 'Super Admin', cls: 'bg-slate-800 text-white' },
  CHAIRMAN: { label: 'Chairman', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ACCOUNTS: { label: 'Accounts', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  AGENT: { label: 'Agent', cls: 'bg-teal-50 text-teal-700 border border-teal-200' },
  PARTNER_LAB: { label: 'Partner Lab', cls: 'bg-slate-100 text-slate-700 border border-slate-200' },
  DOCTOR: { label: 'Doctor', cls: 'bg-teal-700/10 text-teal-700 border border-teal-700/20' },
};

/** Best human-readable message from an API error body: the first zod issue
    (ERP routes answer { error: 'Validation failed', issues: [...] }), then
    `error`, then the caller's fallback. */
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // mirrors /api/admin/upload
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Runtime list of every valid tab — used to validate restored persisted tabs. */
export const ALL_TAB_KEYS: TabKey[] = [
  'overview',
  'orders', 'products',
  'dues', 'expenses', 'capex', 'shareholders',
  'messages', 'blogs', 'reviews',
  'leads',
  'users', 'access',
];

/** Panel statuses + badge styling (unknown legacy statuses render as neutral). */
/** Lead pipeline stages, in order. Keys match /api/admin/leads ALLOWED_STATUS.
    `dot` is the only colour a stage gets; the client stage is the one success state. */
export type LeadStage = 'new' | 'visited' | 'sample_given' | 'client';
export const LEAD_STAGES: { key: LeadStage; label: string; dot: string }[] = [
  { key: 'new', label: 'New', dot: 'bg-zinc-400' },
  { key: 'visited', label: 'Visited', dot: 'bg-brand-500' },
  { key: 'sample_given', label: 'Sample given', dot: 'bg-amber-500' },
  { key: 'client', label: 'Client', dot: 'bg-emerald-500' },
];
export const LEAD_STAGE_LABEL: Record<string, string> = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s.label]));
/** Unknown or missing statuses are treated as "new" everywhere. */
export const leadStage = (s: string | null | undefined): LeadStage =>
  (LEAD_STAGES.some((x) => x.key === s) ? s : 'new') as LeadStage;
