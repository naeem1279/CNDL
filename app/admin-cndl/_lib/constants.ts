/* Console-wide constants: labels, badge styles, page sizes, empty forms and role access. */
import type { TabKey, UserGroupKey } from './types';

export const BRAND = { blue: '#0f766e', green: '#059669' };

export const STATUS_OPTIONS = ['Received', 'Designing', 'Milling', 'Quality Control', 'Dispatched'];
export const IN_PRODUCTION = ['Received', 'Designing', 'Milling', 'Quality Control', 'PENDING'];

export const STATUS_META: Record<string, string> = {
  Received: 'bg-teal-50 text-teal-700 border-teal-200',
  Designing: 'bg-slate-100 text-slate-700 border-slate-200',
  Milling: 'bg-sky-50 text-sky-700 border-sky-200',
  'Quality Control': 'bg-amber-50 text-amber-700 border-amber-200',
  Dispatched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
};

/** Compact display labels for the clinical stage pills (DB values stay unchanged). */
export const STATUS_LABELS: Record<string, string> = {
  Received: 'Received',
  Designing: 'Designing',
  Milling: 'Milling',
  'Quality Control': 'QC',
  Dispatched: 'Dispatched',
  PENDING: 'Pending',
};

/** Auto-derived production progress when a stage changes (replaces the manual slider). */
export const PROGRESS_BY_STATUS: Record<string, number> = {
  Received: 10,
  Designing: 35,
  Milling: 60,
  'Quality Control': 85,
  Dispatched: 100,
  PENDING: 10,
};

export const ORDERS_PER_PAGE = 8;
export const MESSAGES_PER_PAGE = 12;
export const ACCOUNTS_PER_PAGE = 10;
export const EXPENSES_PER_PAGE = 15;
export const LEADS_PER_PAGE = 20;

export const EMPTY_SERVICE_FORM = {
  category: 'Zirconia & All-Ceramic',
  name: '',
  nameBn: '',
  description: '',
  specs: '',
  imageUrl: '',
  turnaroundDays: 3,
  warrantyYears: 5,
  basePrice: '',
  isActive: true,
  displayOrder: 1,
};

export const EMPTY_BLOG_FORM = { title: '', slug: '', category: 'Zirconia & CAD/CAM', excerpt: '', content: '', imageUrl: '/images/blog.jpg' };
export const EMPTY_REVIEW_FORM = { doctorName: '', clinicName: '', location: 'Dhaka, Bangladesh', rating: 5, comment: '' };
export const EMPTY_USER_FORM = { name: '', phone: '', email: '', address: '', role: 'AGENT', status: 'ACTIVE', password: '' };
export const EMPTY_ACCOUNT_FORM = {
  accountType: 'CHAMBER', name: '', ownerName: '', phone: '', email: '', address: '',
  institutionType: 'CHAMBER', division: 'DHAKA', district: '', assignedAgentId: '', openingDue: '',
};
export const EMPTY_INVOICE_FORM = { grossAmount: '', discountAmount: '0', orderId: '', notes: '' };
export const EMPTY_PAYMENT_FORM = { netAmount: '', collectedById: '', isVerified: false, notes: '', paymentDate: '', paymentMethod: '' };
export const EMPTY_EXPENSE_FORM = { category: 'RAW_MATERIAL', title: '', voucherNo: '', amount: '', notes: '', expenseDate: '' };
export const EMPTY_CAPEX_FORM = { machineName: '', purchaseCost: '', purchaseDate: '', status: 'OPERATIONAL', notes: '' };
export const EMPTY_DIVIDEND_FORM = { shareholderName: '', sharesCount: '1', amountPaid: '', payoutMonth: '', paymentMethod: '', notes: '' };
export const EMPTY_SHAREHOLDER_FORM = { name: '', phone: '', address: '', sharesCount: '1', paymentDetails: '', notes: '' };
export const EMPTY_OFFLINE_ORDER_FORM = {
  orderDate: '', deliveryDate: '', orderSource: 'OFFLINE_RIDER',
  clientAccountId: '', doctorName: '', clinicName: '', phone: '',
  patientName: '', toothNo: '', shade: '', productName: '', units: '1',
  billedAmount: '', addToLedger: false,
  attribution: 'DIRECT', agentId: '', commissionAmount: '', historical: false,
};
export const EMPTY_PAYOUT_FORM = { amountPaid: '', paymentMethod: 'Cash', payoutDate: '', notes: '' };

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

export const TOTAL_SHARES = 100;

/** Which sidebar sections each role can see. First entry = landing tab. */
export const ROLE_TABS: Record<string, TabKey[]> = {
  SUPERADMIN: ['overview', 'orders', 'products', 'dues', 'expenses', 'capex', 'shareholders', 'messages', 'leads', 'blogs', 'reviews', 'users'],
  CHAIRMAN: ['overview', 'orders', 'dues', 'capex', 'shareholders'],
  ACCOUNTS: ['overview', 'orders', 'dues', 'expenses', 'shareholders'],
  AGENT: ['dues'],
  PARTNER_LAB: ['orders'],
  DOCTOR: ['orders'],
};

export const EXPENSE_CATEGORY_META: Record<string, { label: string; cls: string }> = {
  RAW_MATERIAL: { label: 'Raw Material', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  LOGISTICS: { label: 'Logistics', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LAB_UTILITY: { label: 'Lab Utility', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  OTHER: { label: 'Other', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const ASSET_STATUS_META: Record<string, string> = {
  OPERATIONAL: 'bg-emerald-50 text-emerald-700',
  UNDER_MAINTENANCE: 'bg-amber-50 text-amber-700',
  RETIRED: 'bg-slate-200 text-slate-600',
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
export const USER_GROUPS: { key: Exclude<UserGroupKey, 'all'>; label: string; roles: string[] }[] = [
  { key: 'leadership', label: 'Leadership', roles: ['SUPERADMIN', 'CHAIRMAN'] },
  { key: 'accounts', label: 'Accounts', roles: ['ACCOUNTS'] },
  { key: 'agents', label: 'Field Agents', roles: ['AGENT'] },
];

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
  'users',
];

/** Panel statuses + badge styling (unknown legacy statuses render as neutral). */
export const LEAD_STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  visited: { label: 'Visited', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  sample_given: { label: 'Sample Given', cls: 'bg-slate-100 text-slate-700 border border-slate-200' },
  client: { label: 'Client', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

/** Filled-pill styling for the one-click status switcher. */
export const LEAD_PILL_META: Record<string, string> = {
  new: 'bg-sky-600 text-white shadow-sm',
  visited: 'bg-amber-400 text-white shadow-sm',
  sample_given: 'bg-slate-600 text-white shadow-sm',
  client: 'bg-emerald-600 text-white shadow-sm',
};
