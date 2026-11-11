'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  LogOut, Package, MessageSquare, RefreshCw, Copy, Check, Phone, Mail, Reply,
  Search, X, Eye, EyeOff, ChevronLeft, ChevronRight, FileText, Star, Trash2, Plus,
  Pencil, Menu, ImagePlus, Stethoscope, Landmark, Users, Wallet, Receipt, Cog, PieChart,
  Layers, TrendingDown, TrendingUp, Cpu, Clock, User, Lock, LayoutDashboard, Activity, ChevronDown,
  CalendarDays, ClipboardList, BadgeCheck, KeyRound, MapPin, PanelLeftClose, PanelLeftOpen,
  LayoutGrid, Table2, PhoneCall, UserPlus, GripVertical, Inbox, Handshake,
} from 'lucide-react';
import { toast } from 'sonner';

const BRAND = { blue: '#0f766e', green: '#059669' };

const STATUS_OPTIONS = ['Received', 'Designing', 'Milling', 'Quality Control', 'Dispatched'];
const IN_PRODUCTION = ['Received', 'Designing', 'Milling', 'Quality Control', 'PENDING'];

const STATUS_META: Record<string, string> = {
  Received: 'bg-teal-50 text-teal-700 border-teal-200',
  Designing: 'bg-slate-100 text-slate-700 border-slate-200',
  Milling: 'bg-sky-50 text-sky-700 border-sky-200',
  'Quality Control': 'bg-amber-50 text-amber-700 border-amber-200',
  Dispatched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
};

/** Compact display labels for the clinical stage pills (DB values stay unchanged). */
const STATUS_LABELS: Record<string, string> = {
  Received: 'Received',
  Designing: 'Designing',
  Milling: 'Milling',
  'Quality Control': 'QC',
  Dispatched: 'Dispatched',
  PENDING: 'Pending',
};

/** Auto-derived production progress when a stage changes (replaces the manual slider). */
const PROGRESS_BY_STATUS: Record<string, number> = {
  Received: 10,
  Designing: 35,
  Milling: 60,
  'Quality Control': 85,
  Dispatched: 100,
  PENDING: 10,
};

const ORDERS_PER_PAGE = 8;
const MESSAGES_PER_PAGE = 12;
const ACCOUNTS_PER_PAGE = 10;
const EXPENSES_PER_PAGE = 15;
const LEADS_PER_PAGE = 20;

/** One pagination footer for every admin table (orders, inquiries, dues,
    expenses, leads) — same spacing, wording and button size everywhere. */
function Pager({
  page,
  total,
  perPage,
  onPage,
  noun,
  note,
}: {
  page: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  noun: string;
  note?: string;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), pages);
  const from = (p - 1) * perPage + 1;
  const to = Math.min(p * perPage, total);
  const btn =
    'min-h-[40px] px-3.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
  return (
    <nav
      aria-label={`${noun} pages`}
      className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3"
    >
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700 tabular-nums">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-700 tabular-nums">{total}</span> {noun}
        {note ? ` ${note}` : ''}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onPage(p - 1)} disabled={p <= 1} className={btn}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs font-semibold text-slate-600 tabular-nums px-1">
            Page {p} of {pages}
          </span>
          <button type="button" onClick={() => onPage(p + 1)} disabled={p >= pages} className={btn}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </nav>
  );
}

type Order = {
  id: string;
  caseId: string;
  customerName: string;
  phone: string;
  email: string | null;
  productType: string | null;
  quantity: number;
  orderSource: string | null;
  orderDate: string | null;
  deliveryDate: string | null;
  clinicName: string | null;
  patientName: string | null;
  toothNo: string | null;
  shade: string | null;
  billedAmount: number | null;
  status: string;
  progress: number;
  agentId: string | null;
  clientAccountId: string | null;
  isDirect: boolean;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  createdAt: string;
};

type EditState = Record<string, { status: string; progress: number }>;

type BlogRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  image: string;
  excerpt: string;
  content: string;
  publishedAt: string;
};

type ServiceRow = {
  id: string;
  category: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  specs: string | null;
  imageUrl: string | null;
  turnaroundDays: number;
  warrantyYears: number;
  basePrice: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_SERVICE_FORM = {
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

type ReviewRow = {
  id: number;
  doctorName: string;
  clinicName: string;
  location: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ErpUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  role: string;
  status: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
};

type ErpAccount = {
  id: string;
  accountType: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string | null;
  address: string | null;
  institutionType: string;
  division: string;
  district: string | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  customDiscountNote: string | null;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
};

type ErpAgent = { id: string; name: string; phone: string | null };

type ErpExpense = {
  id: string;
  category: string;
  title: string;
  amount: number;
  voucherNo: string | null;
  notes: string | null;
  expenseDate: string;
  createdAt: string;
};

type ErpAsset = {
  id: string;
  machineName: string;
  purchaseCost: number;
  purchaseDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

type ErpDividend = {
  id: string;
  shareholderName: string;
  sharesCount: number;
  amountPaid: number;
  payoutMonth: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
};

type ErpLedgerEntry = {
  id: string;
  clientAccountId: string;
  transactionType: string;
  grossAmount?: number;
  discountAmount?: number;
  netAmount: number;
  orderId?: string | null;
  collectedById?: string | null;
  isVerified?: boolean;
  notes?: string | null;
  paymentMethod?: string | null;
  paymentDate?: string | null;
  createdAt: string;
};

type ErpShareholder = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  sharesCount: number;
  paymentDetails: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_BLOG_FORM = { title: '', slug: '', category: 'Zirconia & CAD/CAM', excerpt: '', content: '', imageUrl: '/images/blog.jpg' };
const EMPTY_REVIEW_FORM = { doctorName: '', clinicName: '', location: 'Dhaka, Bangladesh', rating: 5, comment: '' };
const EMPTY_USER_FORM = { name: '', phone: '', email: '', address: '', role: 'AGENT', status: 'ACTIVE', password: '' };
const EMPTY_ACCOUNT_FORM = {
  accountType: 'CHAMBER', name: '', ownerName: '', phone: '', email: '', address: '',
  institutionType: 'CHAMBER', division: 'DHAKA', district: '', assignedAgentId: '', openingDue: '',
};
const EMPTY_INVOICE_FORM = { grossAmount: '', discountAmount: '0', orderId: '', notes: '' };
const EMPTY_PAYMENT_FORM = { netAmount: '', collectedById: '', isVerified: false, notes: '', paymentDate: '', paymentMethod: '' };
const EMPTY_EXPENSE_FORM = { category: 'RAW_MATERIAL', title: '', voucherNo: '', amount: '', notes: '', expenseDate: '' };
const EMPTY_CAPEX_FORM = { machineName: '', purchaseCost: '', purchaseDate: '', status: 'OPERATIONAL', notes: '' };
const EMPTY_DIVIDEND_FORM = { shareholderName: '', sharesCount: '1', amountPaid: '', payoutMonth: '', paymentMethod: '', notes: '' };
const EMPTY_SHAREHOLDER_FORM = { name: '', phone: '', address: '', sharesCount: '1', paymentDetails: '', notes: '' };
const EMPTY_OFFLINE_ORDER_FORM = {
  orderDate: '', deliveryDate: '', orderSource: 'OFFLINE_RIDER',
  clientAccountId: '', doctorName: '', clinicName: '', phone: '',
  patientName: '', toothNo: '', shade: '', productName: '', units: '1',
  billedAmount: '', addToLedger: false,
  attribution: 'DIRECT', agentId: '', commissionAmount: '', historical: false,
};
const EMPTY_PAYOUT_FORM = { amountPaid: '', paymentMethod: 'Cash', payoutDate: '', notes: '' };

/** Today's date as a yyyy-mm-dd string for <input type="date"> (local time). */
function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Date part only of an ISO timestamp (e.g. "12 Oct 2026"). */
function formatDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const full = formatDate(iso);
  return full === '—' ? '—' : full.split(',')[0];
}

/** Case intake channels. */
const ORDER_SOURCE_META: Record<string, { label: string; cls: string }> = {
  OFFLINE_RIDER: { label: 'Rider Pickup', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PHONE: { label: 'Phone', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  WHATSAPP: { label: 'WhatsApp', cls: 'bg-[#25D366]/15 text-[#1a8f4a] border-[#25D366]/30' },
  ONLINE: { label: 'Online', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
};

/** Vita classical A1–D4 + Bleach shades. */
const VITA_SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1', 'BL2', 'BL3', 'BL4'];

const PAYMENT_METHODS = ['Cash', 'bKash', 'Bank'];

const TOTAL_SHARES = 100;

/** Which sidebar sections each role can see. First entry = landing tab. */
const ROLE_TABS: Record<string, TabKey[]> = {
  SUPERADMIN: ['overview', 'orders', 'products', 'dues', 'expenses', 'capex', 'shareholders', 'messages', 'leads', 'blogs', 'reviews', 'users'],
  CHAIRMAN: ['overview', 'orders', 'dues', 'capex', 'shareholders'],
  ACCOUNTS: ['overview', 'orders', 'dues', 'expenses', 'shareholders'],
  AGENT: ['dues'],
  PARTNER_LAB: ['orders'],
  DOCTOR: ['orders'],
};

const EXPENSE_CATEGORY_META: Record<string, { label: string; cls: string }> = {
  RAW_MATERIAL: { label: 'Raw Material', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  LOGISTICS: { label: 'Logistics', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  LAB_UTILITY: { label: 'Lab Utility', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  MAINTENANCE: { label: 'Maintenance', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  OTHER: { label: 'Other', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const ASSET_STATUS_META: Record<string, string> = {
  OPERATIONAL: 'bg-emerald-50 text-emerald-700',
  UNDER_MAINTENANCE: 'bg-amber-50 text-amber-700',
  RETIRED: 'bg-slate-200 text-slate-600',
};

/** Institution taxonomy (Hospital / Chamber / Lab / freelance clinician). */
const INSTITUTION_TYPE_META: Record<string, { label: string; cls: string }> = {
  CHAMBER: { label: 'Chamber', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  HOSPITAL: { label: 'Hospital', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  PARTNER_LAB: { label: 'Lab', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  FREELANCE: { label: 'Personal', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

/** Bangladesh divisions (stored UPPERCASE in ClientAccount.division). */
const DIVISIONS: { key: string; label: string; bn?: string }[] = [
  { key: 'DHAKA', label: 'Dhaka', bn: 'ঢাকা' },
  { key: 'CHATTOGRAM', label: 'Chattogram' },
  { key: 'RAJSHAHI', label: 'Rajshahi' },
  { key: 'KHULNA', label: 'Khulna' },
  { key: 'SYLHET', label: 'Sylhet' },
  { key: 'BARISHAL', label: 'Barishal' },
  { key: 'RANGPUR', label: 'Rangpur' },
  { key: 'MYMENSINGH', label: 'Mymensingh' },
];
const DIVISION_LABEL: Record<string, string> = Object.fromEntries(
  DIVISIONS.map((d) => [d.key, d.label])
);

const ROLE_META: Record<string, { label: string; cls: string }> = {
  SUPERADMIN: { label: 'Super Admin', cls: 'bg-slate-800 text-white' },
  CHAIRMAN: { label: 'Chairman', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ACCOUNTS: { label: 'Accounts', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  AGENT: { label: 'Agent', cls: 'bg-teal-50 text-teal-700 border border-teal-200' },
  PARTNER_LAB: { label: 'Partner Lab', cls: 'bg-slate-100 text-slate-700 border border-slate-200' },
  DOCTOR: { label: 'Doctor', cls: 'bg-teal-700/10 text-teal-700 border border-teal-700/20' },
};

/** Role-grouped segmented filter for the User Management table. */
type UserGroupKey = 'all' | 'leadership' | 'accounts' | 'agents';
const USER_GROUPS: { key: Exclude<UserGroupKey, 'all'>; label: string; roles: string[] }[] = [
  { key: 'leadership', label: 'Leadership', roles: ['SUPERADMIN', 'CHAIRMAN'] },
  { key: 'accounts', label: 'Accounts', roles: ['ACCOUNTS'] },
  { key: 'agents', label: 'Field Agents', roles: ['AGENT'] },
];

function formatBDT(n: number) {
  const v = Math.round(n || 0);
  return `${v < 0 ? '-' : ''}৳${Math.abs(v).toLocaleString('en-IN')}`;
}

/** Best human-readable message from an API error body: the first zod issue
    (ERP routes answer { error: 'Validation failed', issues: [...] }), then
    `error`, then the caller's fallback. */
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // mirrors /api/admin/upload
const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Client-side check before uploading: returns an error message, or null if OK. */
function checkImageFile(file: File): string | null {
  if (!UPLOAD_TYPES.includes(file.type)) return 'Use a JPEG, PNG, WebP, GIF or AVIF image';
  if (file.size > UPLOAD_MAX_BYTES) return `Image is ${(file.size / 1048576).toFixed(1)} MB — the limit is 10 MB`;
  return null;
}

function apiError(body: unknown, fallback: string): string {
  const b = (body ?? {}) as { issues?: unknown; error?: unknown };
  if (Array.isArray(b.issues) && typeof b.issues[0] === 'string' && b.issues[0]) return b.issues[0];
  if (typeof b.error === 'string' && b.error && b.error !== 'Validation failed') return b.error;
  return fallback;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseClinical(productType: string | null) {
  const out = { patient: '', work: '', teeth: '', shade: '', notes: '', trial: '', insertion: '' };
  if (!productType) return out;
  const work: string[] = [];
  for (const seg of productType.split(' | ')) {
    const m = seg.match(/^(Patient|Teeth|Shade|Notes|Trial|Insertion):\s*([\s\S]*)$/);
    if (m) out[m[1].toLowerCase() as 'patient' | 'teeth' | 'shade' | 'notes' | 'trial' | 'insertion'] = m[2];
    else work.push(seg);
  }
  out.work = work.join(' | ');
  return out;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Normalize BD phone numbers to their last-10-digit core for matching
    (01XXXXXXXXX / 8801XXXXXXXXX → same core) — used for lead↔account dedupe. */
function phoneCore(p: string | null | undefined) {
  const d = (p || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

/** Single-৳ price label — strips any ৳/whitespace already stored in the value
    so a "৳3500" DB value can never render as "৳৳3500". */
function priceLabel(v: string | null | undefined) {
  const clean = (v || '').replace(/[৳\s]/g, '');
  return clean ? `৳${clean}` : 'Quote';
}

function phoneLinks(phone: string): { tel: string; wa: string } | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return null;
  let wa = digits;
  if (wa.startsWith('880')) {
    // already international
  } else if (wa.startsWith('0')) {
    wa = '880' + wa.slice(1);
  } else if (wa.length === 10) {
    wa = '880' + wa; // 1XXXXXXXXX → 8801XXXXXXXXX
  }
  return { tel: phone, wa };
}

/**
 * Best-effort callable/WhatsApp number from an inquiry.
 * Quote-request call-backs submit `callback+<digits>@cndl-global.com` placeholder
 * emails; some senders also type a Bangladeshi number inside the message body.
 */
function extractWaPhone(msg: Message): string | null {
  const candidates: string[] = [];
  const local = msg.email.split('@')[0] ?? '';
  const digitsFromEmail = local.replace(/\D/g, '');
  if (digitsFromEmail.length >= 10) candidates.push(digitsFromEmail);
  const inBody = msg.message.match(/(?:\+?88)?01[3-9]\d{8}/);
  if (inBody) candidates.push(inBody[0].replace(/\D/g, ''));
  for (const c of candidates) {
    if (c.startsWith('880')) return c;
    if (c.startsWith('0')) return '880' + c.slice(1);
    if (c.length === 10) return '880' + c;
  }
  return null;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] md:text-xs font-bold whitespace-nowrap ${STATUS_META[status] || STATUS_META.PENDING}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/** Elegant clickable clinical-stage pill — native select layered invisibly on top. */
function StagePill({
  status, saving, onChange,
}: {
  status: string;
  saving: boolean;
  onChange: (s: string) => void;
}) {
  const statuses = STATUS_OPTIONS.includes(status) ? STATUS_OPTIONS : [status, ...STATUS_OPTIONS];
  return (
    <span
      title="Click to change the clinical stage"
      className={`relative inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-opacity ${
        STATUS_META[status] || STATUS_META.PENDING
      } ${saving ? 'opacity-50' : 'hover:shadow-sm'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Dispatched' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-slate-400' : 'animate-pulse bg-current opacity-70'}`} />
      {STATUS_LABELS[status] || status}
      <ChevronDown size={12} className="opacity-50" />
      <select
        value={status}
        disabled={saving}
        onChange={(e) => {
          if (e.target.value !== status) onChange(e.target.value);
        }}
        aria-label="Change clinical stage"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
        ))}
      </select>
    </span>
  );
}

function Chip({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'gray' }) {
  const tones = {
    blue: 'bg-teal-700/10 text-teal-700',
    green: 'bg-emerald-600/15 text-emerald-700',
    gray: 'bg-slate-100 text-slate-600',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] md:text-xs font-bold max-w-full ${tones[tone]}`}>
      <span className="opacity-70">{label}:</span>
      <span className="truncate" title={value}>{value}</span>
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: value >= 100 ? BRAND.green : BRAND.blue }}
      />
    </div>
  );
}

function CaseControls({
  order, edit, onEdit, onSave, saving,
}: {
  order: Order;
  edit: { status: string; progress: number };
  onEdit: (e: { status: string; progress: number }) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const statuses = STATUS_OPTIONS.includes(order.status) ? STATUS_OPTIONS : [order.status, ...STATUS_OPTIONS];
  const changed = edit.status !== order.status || edit.progress !== order.progress;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <select
        value={edit.status}
        onChange={(e) => onEdit({ ...edit, status: e.target.value })}
        className="min-h-[44px] p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="flex items-center gap-3 flex-1 min-w-[150px]">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={edit.progress}
          onChange={(e) => onEdit({ ...edit, progress: parseInt(e.target.value) })}
          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
        />
        <span className="text-[11px] font-semibold w-10 text-right">{edit.progress}%</span>
      </div>

      <button
        onClick={onSave}
        disabled={saving || !changed}
        className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
        {saving ? 'Saving...' : changed ? 'Update' : 'Saved'}
      </button>
    </div>
  );
}

type TabKey =
  | 'overview'
  | 'orders' | 'products'
  | 'dues' | 'expenses' | 'capex' | 'shareholders'
  | 'messages' | 'blogs' | 'reviews'
  | 'leads'
  | 'users';

/** Runtime list of every valid tab — used to validate restored persisted tabs. */
const ALL_TAB_KEYS: TabKey[] = [
  'overview',
  'orders', 'products',
  'dues', 'expenses', 'capex', 'shareholders',
  'messages', 'blogs', 'reviews',
  'leads',
  'users',
];

/** Dhaka Dental Leads (CNDL local pipeline) row shape — from /api/admin/leads. */
type LeadRow = {
  key: string;
  name: string;
  contactName: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  website: string;
  status: string;
  visitNotes: string;
  lastActivityText: string;
  lastActivityAt: string;
  activityLog: { text: string; at: string }[];
};

/** Panel statuses + badge styling (unknown legacy statuses render as neutral). */
const LEAD_STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  visited: { label: 'Visited', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  sample_given: { label: 'Sample Given', cls: 'bg-slate-100 text-slate-700 border border-slate-200' },
  client: { label: 'Client', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

/** Filled-pill styling for the one-click status switcher. */
const LEAD_PILL_META: Record<string, string> = {
  new: 'bg-sky-600 text-white shadow-sm',
  visited: 'bg-amber-400 text-white shadow-sm',
  sample_given: 'bg-slate-600 text-white shadow-sm',
  client: 'bg-emerald-600 text-white shadow-sm',
};

type SessionUser = { uid: string; name: string; phone: string; role: string };

/** Reads a saved preference; safe on the server and in private mode. */
function readPref(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Starting section: a #tab link wins, then the last-used tab, then Overview.
    The role guard below re-clamps it once the signed-in user is known. The
    first paint is always the session-check screen, so this cannot cause a
    hydration mismatch. */
function initialTab(): TabKey {
  const fromHash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
  const candidate = fromHash || readPref('cndl-admin-tab') || '';
  return (ALL_TAB_KEYS as string[]).includes(candidate) ? (candidate as TabKey) : 'overview';
}

export default function AdminDashboard() {
  const [auth, setAuth] = useState<boolean | null>(null); // null = restoring session
  const [me, setMe] = useState<SessionUser | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [edits, setEdits] = useState<EditState>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Orders search/filter/pagination + modal
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [modalId, setModalId] = useState<string | null>(null);

  // Messages search/pagination
  const [msgSearch, setMsgSearch] = useState('');
  const [msgPage, setMsgPage] = useState(1);
  const [msgModal, setMsgModal] = useState<Message | null>(null);

  // Blogs & reviews management
  const [blogModal, setBlogModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [savingBlog, setSavingBlog] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<BlogRow | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewRow | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop icon-rail collapse (Linear/Vercel style). Mobile drawer is unaffected.
  const [railCollapsed, setRailCollapsed] = useState(false);
  useEffect(() => {
    try {
      setRailCollapsed(window.localStorage.getItem('cndl-admin-rail') === '1');
    } catch {
      /* private mode — default expanded */
    }
  }, []);
  const toggleRail = () =>
    setRailCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem('cndl-admin-rail', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  const [uploading, setUploading] = useState(false);
  const [dragZone, setDragZone] = useState<'blog' | 'product' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Services management state & handlers (declared at top to respect React rules of hooks)
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [savingService, setSavingService] = useState(false);

  // ERP & Accounts state
  const [erpAccounts, setErpAccounts] = useState<ErpAccount[]>([]);
  const [erpAgents, setErpAgents] = useState<ErpAgent[]>([]);
  const [erpUsers, setErpUsers] = useState<ErpUser[]>([]);
  const [erpExpenses, setErpExpenses] = useState<ErpExpense[]>([]);
  const [erpAssets, setErpAssets] = useState<ErpAsset[]>([]);
  const [erpDividends, setErpDividends] = useState<ErpDividend[]>([]);
  const [erpLedger, setErpLedger] = useState<ErpLedgerEntry[]>([]);
  const [erpShareholders, setErpShareholders] = useState<ErpShareholder[]>([]);
  const [accountModal, setAccountModal] = useState(false);
  const [userModal, setUserModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [capexModal, setCapexModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ErpExpense | null>(null);
  const [editingCapex, setEditingCapex] = useState<ErpAsset | null>(null);
  const [auditModal, setAuditModal] = useState(false);
  const [auditEntries, setAuditEntries] = useState<{
    id: string; expenseId: string; action: string; originalData: string; performedBy: string; createdAt: string;
  }[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [dividendModal, setDividendModal] = useState(false);
  const [shareholderModal, setShareholderModal] = useState(false);
  const [invoiceModalAcc, setInvoiceModalAcc] = useState<ErpAccount | null>(null);
  const [paymentModalAcc, setPaymentModalAcc] = useState<ErpAccount | null>(null);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM);
  const [capexForm, setCapexForm] = useState(EMPTY_CAPEX_FORM);
  const [dividendForm, setDividendForm] = useState(EMPTY_DIVIDEND_FORM);
  const [shareholderForm, setShareholderForm] = useState(EMPTY_SHAREHOLDER_FORM);
  const [editingUser, setEditingUser] = useState<ErpUser | null>(null);
  const [editingShareholder, setEditingShareholder] = useState<ErpShareholder | null>(null);
  const [offlineOrderModal, setOfflineOrderModal] = useState(false);
  const [offlineOrderForm, setOfflineOrderForm] = useState(EMPTY_OFFLINE_ORDER_FORM);
  const [savingOrder, setSavingOrder] = useState(false);
  const [quickAccountOpen, setQuickAccountOpen] = useState(false);
  const [quickAccountForm, setQuickAccountForm] = useState({ name: '', ownerName: '', phone: '', division: 'DHAKA' });
  const [savingQuickAccount, setSavingQuickAccount] = useState(false);
  const [payoutModalAgent, setPayoutModalAgent] = useState<ErpAgent | null>(null);
  const [payoutForm, setPayoutForm] = useState(EMPTY_PAYOUT_FORM);
  const [savingPayout, setSavingPayout] = useState(false);

  // Dhaka Dental Leads (CNDL local pipeline)
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [leadNoteKey, setLeadNoteKey] = useState<string | null>(null);
  const [leadNoteText, setLeadNoteText] = useState('');
  const [savingLeadNote, setSavingLeadNote] = useState(false);
  const [savingLeadKey, setSavingLeadKey] = useState<string | null>(null);
  // Phase 3: CRM view mode + native drag-and-drop + lead→account conversion
  const [leadView, setLeadView] = useState<'table' | 'board'>(() =>
    readPref('cndl-admin-lead-view') === 'board' ? 'board' : 'table'
  );
  const [dragLeadKey, setDragLeadKey] = useState<string | null>(null);
  const [boardDropCol, setBoardDropCol] = useState<string | null>(null);
  const [convertingLeadKey, setConvertingLeadKey] = useState<string | null>(null);

  /**
   * A 401 from any admin API means the session cookie is gone — expired
   * (8h TTL), revoked server-side, or never sent. Drop local auth state so
   * the login screen takes over instead of leaving the operator stuck with
   * "Unauthorized" errors on every action.
   */
  const handleAuthLoss = () => {
    setAuth(false);
    setMe(null);
    // Fixed id: a burst of 401s (e.g. the 13-request refresh) shows ONE toast.
    toast.error('Session expired — please sign in again', { id: 'session-expired' });
  };

  /** fetch() for admin APIs: any 401 (outside the login endpoint itself) drops
      the operator back to the sign-in screen instead of failing silently. */
  const adminFetch = async (input: string, init?: RequestInit) => {
    const res = await fetch(input, init);
    if (res.status === 401 && !input.startsWith('/api/admin/verify')) handleAuthLoss();
    return res;
  };

  /* ---------- In-app confirmation dialog (replaces window.confirm) ---------- */
  const [confirmState, setConfirmState] = useState<{ title: string; message: string; confirmLabel: string } | null>(null);
  const confirmResolver = useRef<((ok: boolean) => void) | null>(null);
  const askConfirm = (message: string) =>
    new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
      const verb = /^remove/i.test(message) ? 'Remove' : 'Delete';
      setConfirmState({ title: `${verb}?`, message, confirmLabel: verb });
    });
  const resolveConfirm = (ok: boolean) => {
    confirmResolver.current?.(ok);
    confirmResolver.current = null;
    setConfirmState(null);
  };

  const updateLead = async (key: string, patch: { status?: string; notes?: string }) => {
    setSavingLeadKey(key);
    try {
      const res = await adminFetch('/api/admin/leads', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, ...patch }),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return false;
      }
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.lead) {
        setLeads((prev) => prev.map((l) => (l.key === key ? { ...l, ...d.lead } : l)));
        return true;
      }
      toast.error(apiError(d, 'Update failed'));
      return false;
    } catch {
      toast.error('Network error updating lead');
      return false;
    } finally {
      setSavingLeadKey(null);
    }
  };

  const saveLeadNote = async () => {
    if (!leadNoteKey) return;
    setSavingLeadNote(true);
    const ok = await updateLead(leadNoteKey, { notes: leadNoteText });
    setSavingLeadNote(false);
    if (ok) {
      setLeadNoteKey(null);
      setLeadNoteText('');
    }
  };

  const waLeadLink = (phone: string) => {
    const digits = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${digits.startsWith('880') ? digits : '880' + digits.replace(/^0+/, '')}`;
  };

  /**
   * Phase 3: push a lead into the Dues/Accounts ledger as a CHAMBER
   * ClientAccount (opening due 0), then flip the lead status to `client`.
   * Duplicate-safe: a phone-core match against existing accounts (or the
   * route's own 409 DUPLICATE_PHONE guard) short-circuits creation.
   */
  const convertLeadToAccount = async (l: LeadRow) => {
    if (!l.phone || phoneCore(l.phone).length < 6) {
      toast.error('Lead has no usable phone number');
      return;
    }
    setConvertingLeadKey(l.key);
    try {
      const existing = erpAccounts.find((a) => phoneCore(a.phone) && phoneCore(a.phone) === phoneCore(l.phone));
      if (existing) {
        toast.info(`${existing.name} is already in the client ledger`);
        if ((LEAD_STATUS_META[l.status] ? l.status : 'new') !== 'client') await updateLead(l.key, { status: 'client' });
        return;
      }
      const res = await adminFetch('/api/admin/erp/accounts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: l.name || l.contactName || 'Chamber',
          ownerName: l.contactName || l.name || 'Owner',
          phone: l.phone,
          email: l.email || null,
          address: l.address || null,
          institutionType: 'CHAMBER',
          division: 'DHAKA',
          district: l.area || null,
          openingDue: 0,
        }),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body?.warning === 'DUPLICATE_PHONE') {
        toast.info(`${body.existingName || 'An account'} already exists with this phone`);
        await updateLead(l.key, { status: 'client' });
        return;
      }
      if (res.ok && body?.id) {
        setErpAccounts((prev) => [body as ErpAccount, ...prev]);
        toast.success(`Client account created — ${body.name} is now billable in Dues`);
        await updateLead(l.key, { status: 'client' });
        return;
      }
      toast.error(apiError(body, 'Failed to create client account'));
    } catch {
      toast.error('Network error converting lead');
    } finally {
      setConvertingLeadKey(null);
    }
  };
  interface OverviewMetrics {
    todayInvoicedSales: number;
    monthInvoicedSales: number;
    todayCashCollected: number;
    monthCashCollected: number;
    todayNewDuesAdded: number;
    monthNewDuesAdded: number;
    todayExpenses: number;
    monthExpenses: number;
    totalMarketDues: number;
  }

  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics>({
    todayInvoicedSales: 0,
    monthInvoicedSales: 0,
    todayCashCollected: 0,
    monthCashCollected: 0,
    todayNewDuesAdded: 0,
    monthNewDuesAdded: 0,
    todayExpenses: 0,
    monthExpenses: 0,
    totalMarketDues: 0,
  });

  const [duesView, setDuesView] = useState<'accounts' | 'collections'>(() =>
    readPref('cndl-admin-dues-view') === 'collections' ? 'collections' : 'accounts'
  );
  const [divisionFilter, setDivisionFilter] = useState('DHAKA');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [editingAccount, setEditingAccount] = useState<ErpAccount | null>(null);
  const [accountDupWarning, setAccountDupWarning] = useState<string | null>(null);
  const [profitInput, setProfitInput] = useState('');
  const [savingErp, setSavingErp] = useState(false);

  // Self-service Change Password (all roles)
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  // User Management: role-group filter + instant search
  const [userRoleFilter, setUserRoleFilter] = useState<UserGroupKey>('all');
  const [userSearch, setUserSearch] = useState('');

  // Phase 2 shell: header sync timestamp + login password visibility
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [showPw, setShowPw] = useState(false);
  // Phase 2: Client Dues search/pagination + Collection Log filters
  const [accSearch, setAccSearch] = useState('');
  const [accPage, setAccPage] = useState(1);
  const [expPage, setExpPage] = useState(1);
  const [leadPage, setLeadPage] = useState(1);
  const [collFrom, setCollFrom] = useState('');
  const [collTo, setCollTo] = useState('');
  const [collMethod, setCollMethod] = useState('ALL');
  // Phase 2: Daily Expenses audit filters
  const [expSearch, setExpSearch] = useState('');
  const [expCat, setExpCat] = useState('ALL');
  const [expMonth, setExpMonth] = useState('ALL');

  const openNewService = () => {
    setEditingService(null);
    setServiceForm({
      ...EMPTY_SERVICE_FORM,
      displayOrder: (data?.services?.length ?? 0) + 1,
    });
    setServiceModal(true);
  };

  const [uploadingProduct, setUploadingProduct] = useState(false);

  const uploadProductImage = async (file: File) => {
    const problem = checkImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setUploadingProduct(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        setServiceForm((f) => ({ ...f, imageUrl: body.url }));
        toast.success('Product photo uploaded & optimized');
      } else {
        toast.error(apiError(body, 'Upload failed'));
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingProduct(false);
    }
  };

  const openEditService = (service: ServiceRow) => {
    setEditingService(service);
    setServiceForm({
      category: service.category,
      name: service.name,
      nameBn: service.nameBn || '',
      description: service.description || '',
      specs: service.specs || '',
      imageUrl: service.imageUrl || '',
      turnaroundDays: service.turnaroundDays,
      warrantyYears: service.warrantyYears,
      basePrice: (service.basePrice || '').replace(/[৳\s]/g, ''),
      isActive: service.isActive,
      displayOrder: service.displayOrder,
    });
    setServiceModal(true);
  };

  const submitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.category.trim()) {
      toast.error('Name and category are required');
      return;
    }
    setSavingService(true);
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';
      const res = await adminFetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save service');
      }
      toast.success(editingService ? 'Product updated' : 'Product created');
      setServiceModal(false);
      setEditingService(null);
      setServiceForm(EMPTY_SERVICE_FORM);
      await fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Operation failed');
    } finally {
      setSavingService(false);
    }
  };

  const deleteService = async (service: ServiceRow) => {
    if (!(await askConfirm(`Delete "${service.name}"? This cannot be undone.`))) return;
    setDeletingId(`service-${service.id}`);
    try {
      const res = await adminFetch(`/api/admin/services/${service.id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      if (res.ok) {
        toast.success('Product deleted');
        await fetchData(true);
      } else {
        toast.error('Failed to delete service');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleServiceActive = async (service: ServiceRow) => {
    try {
      const res = await adminFetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      if (res.ok) {
        toast.success(`Product marked as ${!service.isActive ? 'Active' : 'Inactive'}`);
        await fetchData(true);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Enter your phone/email and password');
      return;
    }
    setLoggingIn(true);
    try {
      const res = await adminFetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.user) {
        setMe(body.user);
        setAuth(true);
        setPassword('');
        toast.success(`Signed in as ${body.user.name}`);
      } else {
        toast.error(apiError(body, 'Invalid credentials'));
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await adminFetch('/api/admin/verify', { method: 'DELETE' });
    } catch {
      // ignore network errors on sign out
    }
    setAuth(false);
    setMe(null);
    setIdentifier('');
    setPassword('');
    setTab('overview');
    setData({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
    setErpAccounts([]);
    setErpAgents([]);
    setErpUsers([]);
    setErpExpenses([]);
    setErpAssets([]);
    setErpDividends([]);
    setErpLedger([]);
    setErpShareholders([]);
    setProfitInput('');
    setEdits({});
    setEditingBlog(null);
    setEditingReview(null);
    setEditingUser(null);
    setEditingShareholder(null);
    setOfflineOrderModal(false);
    setDuesView('accounts');
    setPreviewUrl(null);
    setSidebarOpen(false);
    setAccountModal(false);
    setUserModal(false);
    setShareholderModal(false);
    setInvoiceModalAcc(null);
    setPaymentModalAcc(null);
    setEditingAccount(null);
    setAccountDupWarning(null);
    setDivisionFilter('DHAKA');
    setAgentFilter('ALL');
    setPayoutModalAgent(null);
    setAuditModal(false);
  };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [res, blogsRes, reviewsRes, servicesRes, erpAccRes, erpUsersRes, erpExpRes, erpCapexRes, erpDivRes, erpLedgerRes, erpShRes, metricsRes, leadsRes] = await Promise.all([
        adminFetch('/api/admin/data'),
        adminFetch('/api/admin/blogs'),
        adminFetch('/api/admin/testimonials'),
        adminFetch('/api/admin/services'),
        adminFetch('/api/admin/erp/accounts'),
        adminFetch('/api/admin/erp/users'),
        adminFetch('/api/admin/erp/expenses'),
        adminFetch('/api/admin/erp/capex'),
        adminFetch('/api/admin/erp/dividends'),
        adminFetch('/api/admin/erp/ledger'),
        adminFetch('/api/admin/erp/shareholders'),
        adminFetch('/api/admin/erp/overview-metrics'),
        adminFetch('/api/admin/leads'),
      ]);
      // Any 401 in the fan-out means the session is dead — self-heal to login.
      const allRes = [res, blogsRes, reviewsRes, servicesRes, erpAccRes, erpUsersRes, erpExpRes, erpCapexRes, erpDivRes, erpLedgerRes, erpShRes, metricsRes, leadsRes];
      if (allRes.some((r) => r && r.status === 401)) {
        handleAuthLoss();
        return;
      }
      if (!res.ok) throw new Error('fetch failed');
      const d = await res.json().catch(() => ({ orders: [], messages: [] }));
      const b = blogsRes.ok ? await blogsRes.json().catch(() => ({ blogs: [] })) : { blogs: [] };
      const r = reviewsRes.ok ? await reviewsRes.json().catch(() => ({ testimonials: [] })) : { testimonials: [] };
      const s = servicesRes.ok ? await servicesRes.json().catch(() => ({ services: [] })) : { services: [] };
      const ea = erpAccRes.ok ? await erpAccRes.json().catch(() => ({ accounts: [] })) : { accounts: [] };
      const eu = erpUsersRes.ok ? await erpUsersRes.json().catch(() => ({ users: [] })) : { users: [] };
      const ex = erpExpRes.ok ? await erpExpRes.json().catch(() => ({ expenses: [] })) : { expenses: [] };
      const cx = erpCapexRes.ok ? await erpCapexRes.json().catch(() => ({ assets: [] })) : { assets: [] };
      const dv = erpDivRes.ok ? await erpDivRes.json().catch(() => ({ dividends: [] })) : { dividends: [] };
      const lg = erpLedgerRes.ok ? await erpLedgerRes.json().catch(() => ({ entries: [] })) : { entries: [] };
      const sh = erpShRes.ok ? await erpShRes.json().catch(() => ({ shareholders: [] })) : { shareholders: [] };
      if (metricsRes?.ok) {
        const mData = await metricsRes.json().catch(() => ({}));
        if (mData?.metrics) {
          setOverviewMetrics(mData.metrics);
        }
      }

      const ordersList: Order[] = Array.isArray(d?.orders) ? d.orders : (Array.isArray(d) ? d : []);
      const messagesList: Message[] = Array.isArray(d?.messages) ? d.messages : [];
      const blogsList: BlogRow[] = Array.isArray(b?.blogs) ? b.blogs : (Array.isArray(b) ? b : []);
      const reviewsList: ReviewRow[] = Array.isArray(r?.testimonials) ? r.testimonials : (Array.isArray(r) ? r : []);
      const servicesList: ServiceRow[] = Array.isArray(s?.services) ? s.services : (Array.isArray(s) ? s : []);
      const erpAccountsList: ErpAccount[] = Array.isArray(ea?.accounts) ? ea.accounts : [];
      const erpAgentsList: ErpAgent[] = Array.isArray(ea?.agents) ? ea.agents : [];
      const erpUsersList: ErpUser[] = Array.isArray(eu?.users) ? eu.users : [];
      const erpExpensesList: ErpExpense[] = Array.isArray(ex?.expenses) ? ex.expenses : [];
      const erpAssetsList: ErpAsset[] = Array.isArray(cx?.assets) ? cx.assets : [];
      const erpDividendsList: ErpDividend[] = Array.isArray(dv?.dividends) ? dv.dividends : [];
      const erpLedgerList: ErpLedgerEntry[] = Array.isArray(lg?.entries) ? lg.entries : [];
      const erpShareholdersList: ErpShareholder[] = Array.isArray(sh?.shareholders) ? sh.shareholders : [];
      const ld = leadsRes?.ok ? await leadsRes.json().catch(() => ({ leads: [] })) : { leads: [] };
      setLeads(Array.isArray(ld?.leads) ? ld.leads : []);

      setErpAccounts(erpAccountsList);
      setErpAgents(erpAgentsList);
      setErpUsers(erpUsersList);
      setErpExpenses(erpExpensesList);
      setErpAssets(erpAssetsList);
      setErpDividends(erpDividendsList);
      setErpLedger(erpLedgerList);
      setErpShareholders(erpShareholdersList);
      setData({
        orders: ordersList,
        messages: messagesList,
        blogs: blogsList,
        reviews: reviewsList,
        services: servicesList,
      });
      setEdits((prev) => {
        const next: EditState = {};
        for (const o of ordersList) {
          if (o?.id) {
            next[o.id] = prev[o.id] ?? { status: o.status ?? 'Received', progress: o.progress ?? 10 };
          }
        }
        return next;
      });
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (order: Order) => {
    const edit = edits[order.id] ?? { status: order.status, progress: order.progress };
    setSavingId(order.id);
    try {
      const res = await adminFetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: edit.status, progress: edit.progress }),
      });
      if (res.ok) {
        toast.success(`${order.caseId} updated`);
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setSavingId(null);
    }
  };

  /** One-click clinical stage change from the modern stage pill (auto-derives progress). */
  const updateStage = async (order: Order, newStatus: string) => {
    const progress = PROGRESS_BY_STATUS[newStatus] ?? order.progress;
    setSavingId(order.id);
    // Optimistic update for a snappy pill transition.
    setEdits((prev) => ({ ...prev, [order.id]: { status: newStatus, progress } }));
    try {
      const res = await adminFetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus, progress }),
      });
      if (res.ok) {
        toast.success(`${order.caseId} → ${STATUS_LABELS[newStatus] || newStatus}`);
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Stage update failed');
        await fetchData(true);
      }
    } catch {
      toast.error('Stage update failed');
      await fetchData(true);
    } finally {
      setSavingId(null);
    }
  };

  const deleteOrder = async (order: Order) => {
    if (!(await askConfirm(`Delete / archive case ${order.caseId}? This cannot be undone.`))) return;
    setDeletingId(`order-${order.id}`);
    try {
      const res = await adminFetch(`/api/admin/data?id=${encodeURIComponent(order.id)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Case ${order.caseId} deleted`);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to delete case'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        setBlogForm((f) => ({ ...f, imageUrl: body.url }));
        setPreviewUrl(body.url);
        toast.success('Image uploaded & optimized');
      } else {
        toast.error(apiError(body, 'Upload failed'));
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onBlogFilePicked = (file: File | null | undefined) => {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file)); // instant local preview while uploading
    uploadImage(file);
  };

  const closeBlogModal = () => {
    setBlogModal(false);
    setEditingBlog(null);
    setPreviewUrl(null);
  };

  const openEditBlog = (blog: BlogRow) => {
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      excerpt: blog.excerpt,
      content: blog.content,
      imageUrl: blog.image,
    });
    setPreviewUrl(blog.image);
    setBlogModal(true);
  };

  const closeReviewModal = () => {
    setReviewModal(false);
    setEditingReview(null);
  };

  const openEditReview = (review: ReviewRow) => {
    setEditingReview(review);
    setReviewForm({
      doctorName: review.doctorName,
      clinicName: review.clinicName,
      location: review.location,
      rating: review.rating,
      comment: review.comment,
    });
    setReviewModal(true);
  };

  const submitBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBlog(true);
    try {
      const payload = { ...blogForm, slug: blogForm.slug || slugify(blogForm.title) };
      const res = await adminFetch(
        editingBlog ? `/api/admin/blogs/${editingBlog.id}` : '/api/admin/blogs',
        {
          method: editingBlog ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingBlog ? 'Article updated' : 'Article published');
        closeBlogModal();
        setBlogForm(EMPTY_BLOG_FORM);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save article'));
      }
    } catch {
      toast.error('Failed to save article');
    } finally {
      setSavingBlog(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      const res = await adminFetch(
        editingReview ? `/api/admin/testimonials/${editingReview.id}` : '/api/admin/testimonials',
        {
          method: editingReview ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewForm),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingReview ? 'Review updated' : 'Doctor review added');
        closeReviewModal();
        setReviewForm(EMPTY_REVIEW_FORM);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save review'));
      }
    } catch {
      toast.error('Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  const deleteBlog = async (blog: BlogRow) => {
    if (!(await askConfirm(`Delete article "${blog.title}"? This cannot be undone.`))) return;
    setDeletingId(`blog-${blog.id}`);
    try {
      const res = await adminFetch(`/api/admin/blogs/${blog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Article deleted');
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const deleteReview = async (review: ReviewRow) => {
    if (!(await askConfirm(`Delete review by ${review.doctorName}? This cannot be undone.`))) return;
    setDeletingId(`review-${review.id}`);
    try {
      const res = await adminFetch(`/api/admin/testimonials/${review.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Review deleted');
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- ERP: Client Dues & Ledger ---------- */
  const openInvoiceModal = (acc: ErpAccount) => {
    setInvoiceForm(EMPTY_INVOICE_FORM);
    setInvoiceModalAcc(acc);
  };

  const openPaymentModal = (acc: ErpAccount) => {
    setPaymentForm({ ...EMPTY_PAYMENT_FORM, paymentDate: todayInput() });
    setPaymentModalAcc(acc);
  };

  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm({ ...EMPTY_EXPENSE_FORM, expenseDate: todayInput() });
    setExpenseModal(true);
  };

  const openEditExpense = (x: ErpExpense) => {
    setEditingExpense(x);
    setExpenseForm({
      category: x.category,
      title: x.title,
      voucherNo: x.voucherNo || '',
      amount: String(x.amount),
      notes: x.notes || '',
      expenseDate: x.expenseDate ? x.expenseDate.slice(0, 10) : todayInput(),
    });
    setExpenseModal(true);
  };

  const deleteExpense = async (x: ErpExpense) => {
    if (!(await askConfirm(`Delete expense "${x.title}" (${formatBDT(x.amount)})? The pre-change state is preserved in the audit log.`))) return;
    setDeletingId(`expense-${x.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/expenses?id=${encodeURIComponent(x.id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Expense deleted — old state kept in audit log');
        await fetchData(true);
      } else {
        const b = await res.json().catch(() => ({}));
        toast.error(apiError(b, 'Failed to delete expense'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const openAuditHistory = async () => {
    setAuditModal(true);
    setAuditLoading(true);
    try {
      const res = await adminFetch('/api/admin/erp/expenses/audit');
      const body = await res.json().catch(() => ({}));
      if (res.ok) setAuditEntries(Array.isArray(body.entries) ? body.entries : []);
      else toast.error(apiError(body, 'Failed to load audit log'));
    } catch {
      toast.error('Network error');
    } finally {
      setAuditLoading(false);
    }
  };

  const openEditCapex = (a: ErpAsset) => {
    setEditingCapex(a);
    setCapexForm({
      machineName: a.machineName,
      purchaseCost: String(a.purchaseCost),
      purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : '',
      status: a.status || 'OPERATIONAL',
      notes: a.notes || '',
    });
    setCapexModal(true);
  };

  const deleteCapex = async (a: ErpAsset) => {
    if (!(await askConfirm(`Delete machine "${a.machineName}" (${formatBDT(a.purchaseCost)})? This cannot be undone.`))) return;
    setDeletingId(`capex-${a.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/capex?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Machine asset deleted');
        await fetchData(true);
      } else {
        const b = await res.json().catch(() => ({}));
        toast.error(apiError(b, 'Failed to delete machine asset'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const openOfflineOrder = () => {
    setOfflineOrderForm({ ...EMPTY_OFFLINE_ORDER_FORM, orderDate: todayInput() });
    setOfflineOrderModal(true);
  };

  const openPayoutModal = (agent: ErpAgent) => {
    setPayoutModalAgent(agent);
    setPayoutForm({ ...EMPTY_PAYOUT_FORM, payoutDate: todayInput() });
  };

  const submitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalAgent) return;
    const amt = parseFloat(payoutForm.amountPaid);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid payout amount');
      return;
    }
    setSavingPayout(true);
    try {
      const res = await adminFetch('/api/admin/erp/agents/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: payoutModalAgent.id,
          amountPaid: amt,
          paymentMethod: payoutForm.paymentMethod,
          notes: payoutForm.notes.trim() || null,
          payoutDate: payoutForm.payoutDate ? new Date(payoutForm.payoutDate).toISOString() : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Commission paid to ${payoutModalAgent.name}`);
        setPayoutModalAgent(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record payout'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingPayout(false);
    }
  };

    const handleQuickCreateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickAccountForm.name.trim()) {
      toast.error('Clinic / Lab name is required');
      return;
    }
    if (!quickAccountForm.ownerName.trim()) {
      toast.error('Doctor name is required');
      return;
    }
    if (!quickAccountForm.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setSavingQuickAccount(true);
    try {
      const res = await adminFetch('/api/admin/erp/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'CHAMBER',
          institutionType: 'CHAMBER',
          name: quickAccountForm.name.trim(),
          ownerName: quickAccountForm.ownerName.trim(),
          phone: quickAccountForm.phone.trim(),
          division: quickAccountForm.division || 'DHAKA',
          openingDue: 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.warning === 'DUPLICATE_PHONE') {
        toast.error(`Phone already registered to ${data.existingName || 'an account'}`);
        return;
      }
      if (!res.ok) {
        toast.error(apiError(data, 'Failed to create account'));
        return;
      }
      toast.success(`Client account "${data.name}" created!`);
      // Update local erpAccounts list immediately so it appears in the select dropdown
      setErpAccounts((prev) => [data, ...prev]);
      // Immediately select the newly created account for this order
      setOfflineOrderForm((f) => ({
        ...f,
        clientAccountId: data.id,
        clinicName: data.name,
        doctorName: data.ownerName,
        phone: data.phone,
        attribution: data.assignedAgentId ? 'AGENT' : 'DIRECT',
        agentId: data.assignedAgentId || '',
      }));
      // Reset and close quick account inline form
      setQuickAccountForm({ name: '', ownerName: '', phone: '', division: 'DHAKA' });
      setQuickAccountOpen(false);
    } catch {
      toast.error('Network error creating account');
    } finally {
      setSavingQuickAccount(false);
    }
  };

  const submitOfflineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineOrderForm.orderDate) {
      toast.error('Order date is required');
      return;
    }
    const linked = !!offlineOrderForm.clientAccountId;
    if (!linked && !offlineOrderForm.doctorName.trim()) {
      toast.error('Doctor name is required for a walk-in order');
      return;
    }
    if (!offlineOrderForm.productName) {
      toast.error('Select a product');
      return;
    }
    const billed = parseFloat(offlineOrderForm.billedAmount);
    if (offlineOrderForm.addToLedger && (!billed || billed <= 0)) {
      toast.error('Enter the billed amount to add this case to the due ledger');
      return;
    }
    const viaAgent = offlineOrderForm.attribution === 'AGENT';
    if (viaAgent && !offlineOrderForm.agentId) {
      toast.error('Select the agent this case is attributed to');
      return;
    }
    const commission = viaAgent ? (parseFloat(offlineOrderForm.commissionAmount) || 0) : 0;
    if (commission < 0) {
      toast.error('Commission cannot be negative');
      return;
    }
    setSavingOrder(true);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderDate: new Date(offlineOrderForm.orderDate).toISOString(),
          deliveryDate: offlineOrderForm.deliveryDate
            ? new Date(offlineOrderForm.deliveryDate).toISOString()
            : null,
          orderSource: offlineOrderForm.orderSource,
          clientAccountId: offlineOrderForm.clientAccountId || null,
          doctorName: linked
            ? erpAccounts.find((a) => a.id === offlineOrderForm.clientAccountId)?.ownerName || offlineOrderForm.doctorName
            : offlineOrderForm.doctorName,
          clinicName: linked
            ? erpAccounts.find((a) => a.id === offlineOrderForm.clientAccountId)?.name || offlineOrderForm.clinicName
            : offlineOrderForm.clinicName,
          phone: offlineOrderForm.phone.trim() || null,
          patientName: offlineOrderForm.patientName.trim() || null,
          toothNo: offlineOrderForm.toothNo.trim() || null,
          shade: offlineOrderForm.shade || null,
          productName: offlineOrderForm.productName,
          units: parseInt(offlineOrderForm.units) || 1,
          billedAmount: offlineOrderForm.billedAmount.trim() === '' ? null : billed,
          addToLedger: (offlineOrderForm.addToLedger || offlineOrderForm.historical) && linked,
          agentId: viaAgent ? offlineOrderForm.agentId : null,
          isDirect: !viaAgent,
          commissionAmount: commission,
          status: offlineOrderForm.historical ? 'DISPATCHED' : null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Case ${body.order?.caseId} created${offlineOrderForm.historical ? ' — recorded as delivered' : ''}${offlineOrderForm.addToLedger && linked ? ' & added to due ledger' : ''}`);
        setOfflineOrderModal(false);
        setQuickAccountOpen(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to create order'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingOrder(false);
    }
  };

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceModalAcc) return;
    const gross = parseFloat(invoiceForm.grossAmount);
    const discount = parseFloat(invoiceForm.discountAmount || '0') || 0;
    if (!gross || gross <= 0) {
      toast.error('Enter a valid gross amount');
      return;
    }
    if (discount < 0 || discount > gross) {
      toast.error('Discount must be between 0 and the gross amount');
      return;
    }
    if (discount > 0 && !invoiceForm.notes.trim()) {
      toast.error('A note is mandatory when applying a discretionary discount');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch('/api/admin/erp/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'INVOICE',
          clientAccountId: invoiceModalAcc.id,
          grossAmount: gross,
          discountAmount: discount,
          orderId: invoiceForm.orderId.trim() || null,
          notes: invoiceForm.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Invoice recorded');
        setInvoiceModalAcc(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record invoice'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalAcc) return;
    const amount = parseFloat(paymentForm.netAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid collection amount');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch('/api/admin/erp/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'PAYMENT',
          clientAccountId: paymentModalAcc.id,
          netAmount: amount,
          collectedById: paymentForm.collectedById || (me?.role === 'AGENT' && me.uid ? me.uid : null),
          isVerified: paymentForm.isVerified,
          paymentMethod: paymentForm.paymentMethod || null,
          paymentDate: paymentForm.paymentDate
            ? new Date(paymentForm.paymentDate + 'T12:00:00').toISOString()
            : null,
          notes: paymentForm.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Collection recorded');
        setPaymentModalAcc(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record collection'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const openNewAccount = () => {
    setEditingAccount(null);
    setAccountDupWarning(null);
    setAccountForm({
      ...EMPTY_ACCOUNT_FORM,
      division: divisionFilter !== 'ALL' ? divisionFilter : 'DHAKA',
    });
    setAccountModal(true);
  };

  const openEditAccount = (acc: ErpAccount) => {
    setEditingAccount(acc);
    setAccountDupWarning(null);
    setAccountForm({
      accountType: acc.accountType || 'CHAMBER',
      name: acc.name,
      ownerName: acc.ownerName,
      phone: acc.phone,
      email: acc.email || '',
      address: acc.address || '',
      institutionType: acc.institutionType || 'CHAMBER',
      division: acc.division || 'DHAKA',
      district: acc.district || '',
      assignedAgentId: acc.assignedAgentId || '',
      openingDue: '',
    });
    setAccountModal(true);
  };

  const saveAccount = async (allowDuplicate: boolean) => {
    setSavingErp(true);
    setAccountDupWarning(null);
    try {
      const editing = editingAccount;
      const payload = editing
        ? { ...accountForm, openingDue: undefined, allowDuplicate: undefined }
        : { ...accountForm, allowDuplicate: allowDuplicate || undefined };
      const res = await adminFetch(
        editing ? `/api/admin/erp/accounts/${editing.id}` : '/api/admin/erp/accounts',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body.warning === 'DUPLICATE_PHONE') {
        setAccountDupWarning(body.existingName || 'an existing account');
        return;
      }
      if (res.ok) {
        toast.success(editing ? 'Client account updated' : 'Client account created');
        setAccountModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save account'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const submitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    saveAccount(false);
  };

  /* ---------- ERP: User Management ---------- */
  const openNewUser = () => {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setUserModal(true);
  };

  const openEditUser = (u: ErpUser) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      phone: u.phone,
      email: u.email || '',
      address: u.address || '',
      role: u.role,
      status: u.status || 'ACTIVE',
      password: '',
    });
    setUserModal(true);
  };

  const submitErpUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.phone.trim()) {
      toast.error('Full name and phone are required');
      return;
    }
    setSavingErp(true);
    try {
      const payload = {
        name: userForm.name,
        phone: userForm.phone,
        email: userForm.email.trim() || null,
        address: userForm.address.trim() || null,
        role: userForm.role,
        ...(editingUser ? { status: userForm.status } : {}),
        ...(userForm.password ? { password: userForm.password } : {}),
      };
      const res = await adminFetch(
        editingUser ? `/api/admin/erp/users/${editingUser.id}` : '/api/admin/erp/users',
        {
          method: editingUser ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingUser ? 'User updated' : 'User registered');
        setUserModal(false);
        setEditingUser(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, editingUser ? 'Failed to update user' : 'Failed to register user'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const deleteUser = async (u: ErpUser) => {
    if (!(await askConfirm(`Delete user "${u.name}"? This cannot be undone.`))) return;
    setDeletingId(`user-${u.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/users/${u.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('User deleted');
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to delete user'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- Self-service Change Password ---------- */
  const openPwModal = () => {
    setPwForm({ current: '', next: '', confirm: '' });
    setPwModal(true);
  };

  const pwValid =
    pwForm.current.length > 0 &&
    pwForm.next.length >= 6 &&
    pwForm.next === pwForm.confirm;

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      const res = await adminFetch('/api/admin/erp/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(body.message || 'Password updated successfully');
        setPwModal(false);
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        toast.error(apiError(body, 'Failed to update password'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingPw(false);
    }
  };

  /* ---------- ERP: Shareholder Equity Registry ---------- */
  const openNewShareholder = () => {
    setEditingShareholder(null);
    setShareholderForm(EMPTY_SHAREHOLDER_FORM);
    setShareholderModal(true);
  };

  const openEditShareholder = (s: ErpShareholder) => {
    setEditingShareholder(s);
    setShareholderForm({
      name: s.name,
      phone: s.phone || '',
      address: s.address || '',
      sharesCount: String(s.sharesCount),
      paymentDetails: s.paymentDetails || '',
      notes: s.notes || '',
    });
    setShareholderModal(true);
  };

  const submitShareholder = async (e: React.FormEvent) => {
    e.preventDefault();
    const shares = parseInt(shareholderForm.sharesCount);
    if (!shareholderForm.name.trim()) {
      toast.error('Shareholder name is required');
      return;
    }
    if (!shares || shares < 1 || shares > TOTAL_SHARES) {
      toast.error(`Shares must be between 1 and ${TOTAL_SHARES}`);
      return;
    }
    setSavingErp(true);
    try {
      const payload = {
        name: shareholderForm.name,
        phone: shareholderForm.phone.trim() || null,
        address: shareholderForm.address.trim() || null,
        sharesCount: shares,
        paymentDetails: shareholderForm.paymentDetails.trim() || null,
        notes: shareholderForm.notes.trim() || null,
      };
      const res = await adminFetch(
        editingShareholder ? `/api/admin/erp/shareholders/${editingShareholder.id}` : '/api/admin/erp/shareholders',
        {
          method: editingShareholder ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingShareholder ? 'Shareholder updated' : 'Shareholder registered');
        setShareholderModal(false);
        setEditingShareholder(null);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save shareholder'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const deleteShareholder = async (s: ErpShareholder) => {
    if (!(await askConfirm(`Remove "${s.name}" from the equity registry? This cannot be undone.`))) return;
    setDeletingId(`shareholder-${s.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/shareholders/${s.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Shareholder removed');
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to remove shareholder'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- ERP Phase 3: Expenses, CapEx & Dividends ---------- */
  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch(
        editingExpense ? `/api/admin/erp/expenses?id=${encodeURIComponent(editingExpense.id)}` : '/api/admin/erp/expenses',
        {
          method: editingExpense ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: expenseForm.category,
            title: expenseForm.title,
            amount,
            voucherNo: expenseForm.voucherNo.trim() || null,
            notes: expenseForm.notes.trim() || null,
            expenseDate: expenseForm.expenseDate
              ? new Date(expenseForm.expenseDate + 'T12:00:00').toISOString()
              : undefined,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingExpense ? 'Expense updated — old state audited' : 'Expense logged');
        setExpenseModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save expense'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const submitCapex = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(capexForm.purchaseCost);
    if (!capexForm.machineName.trim()) {
      toast.error('Machine name is required');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast.error('Enter a valid purchase cost');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch(
        editingCapex ? `/api/admin/erp/capex?id=${encodeURIComponent(editingCapex.id)}` : '/api/admin/erp/capex',
        {
          method: editingCapex ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineName: capexForm.machineName,
            purchaseCost: cost,
            purchaseDate: capexForm.purchaseDate || null,
            status: capexForm.status,
            notes: capexForm.notes.trim() || null,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingCapex ? 'Machine asset updated' : 'Machine asset added');
        setCapexModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save machine asset'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const submitDividend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(dividendForm.amountPaid);
    const shares = parseInt(dividendForm.sharesCount);
    if (!dividendForm.shareholderName.trim()) {
      toast.error('Shareholder name is required');
      return;
    }
    if (!shares || shares < 1 || shares > TOTAL_SHARES) {
      toast.error(`Shares must be between 1 and ${TOTAL_SHARES}`);
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount paid');
      return;
    }
    if (!dividendForm.payoutMonth.trim()) {
      toast.error('Payout month is required');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch('/api/admin/erp/dividends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareholderName: dividendForm.shareholderName,
          sharesCount: shares,
          amountPaid: amount,
          payoutMonth: dividendForm.payoutMonth,
          paymentMethod: dividendForm.paymentMethod.trim() || null,
          notes: dividendForm.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Dividend distributed');
        setDividendModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to record dividend'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const copyText = async (id: string, text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (what === 'Case ID') setCopiedId(id);
      else setCopiedEmail(id);
      toast.success(`${what} copied`);
      setTimeout(() => {
        setCopiedId(null);
        setCopiedEmail(null);
      }, 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  // Restore an existing session cookie on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/verify');
        if (res.ok && !cancelled) {
          const body = await res.json().catch(() => null);
          if (body?.user) {
            setMe(body.user);
            setAuth(true);
            return;
          }
        }
      } catch {
        // network issue — fall through to the login screen
      }
      if (!cancelled) setAuth(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (auth) fetchData();
  }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-validate the session every 5 minutes so an expired cookie (8h TTL)
  // kicks the operator back to login instead of failing every mutation with
  // "Unauthorized".
  useEffect(() => {
    if (auth !== true) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/admin/verify');
        if (r.status === 401) handleAuthLoss();
      } catch {
        /* offline — keep current state */
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [auth]);  

  // Dialogs: lock the page behind any open dialog, and let Escape close the
  // top-most one (confirm prompt first, then nested pickers, then the rest).
  const anyDialogOpen = Boolean(
    confirmState || modalId || serviceModal || blogModal || reviewModal || msgModal || invoiceModalAcc ||
    paymentModalAcc || accountModal || userModal || pwModal || auditModal || expenseModal || capexModal ||
    dividendModal || shareholderModal || payoutModalAgent || offlineOrderModal
  );
  useEffect(() => {
    if (!anyDialogOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyDialogOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmState) return resolveConfirm(false);
      if (quickAccountOpen) return setQuickAccountOpen(false);
      if (offlineOrderModal) return setOfflineOrderModal(false);
      if (payoutModalAgent) return setPayoutModalAgent(null);
      if (shareholderModal) return setShareholderModal(false);
      if (dividendModal) return setDividendModal(false);
      if (capexModal) return setCapexModal(false);
      if (expenseModal) return setExpenseModal(false);
      if (auditModal) return setAuditModal(false);
      if (pwModal) return void (!savingPw && setPwModal(false));
      if (userModal) return setUserModal(false);
      if (accountModal) return setAccountModal(false);
      if (paymentModalAcc) return setPaymentModalAcc(null);
      if (invoiceModalAcc) return setInvoiceModalAcc(null);
      if (msgModal) return setMsgModal(null);
      if (reviewModal) return closeReviewModal();
      if (blogModal) return closeBlogModal();
      if (serviceModal) return setServiceModal(false);
      if (modalId) return setModalId(null);
      if (sidebarOpen) return setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const permittedTabs = ROLE_TABS[me?.role ?? 'SUPERADMIN'] ?? ROLE_TABS.SUPERADMIN;

  // Keep the active tab inside the signed-in role's permissions.
  useEffect(() => {
    if (me && !permittedTabs.includes(tab)) setTab(permittedTabs[0]);
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset pagination when filters change / clamp out-of-range pages
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    setMsgPage(1);
  }, [msgSearch]);


  useEffect(() => {
    try {
      window.localStorage.setItem('cndl-admin-tab', tab);
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && window.location.hash !== `#${tab}`) {
      window.history.replaceState(null, '', `#${tab}`);
    }
    // Each section opens at its top instead of the previous tab's scroll depth.
    window.scrollTo({ top: 0 });
  }, [tab]);

  // Browser back/forward or a pasted #link switches the section.
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1);
      if ((ALL_TAB_KEYS as string[]).includes(h)) setTab(h as TabKey);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Remember sub-views (Leads table/board, Dues accounts/collections).
  useEffect(() => {
    try {
      window.localStorage.setItem('cndl-admin-lead-view', leadView);
      window.localStorage.setItem('cndl-admin-dues-view', duesView);
    } catch {
      /* ignore */
    }
  }, [leadView, duesView]);

  /* ---------- Derived data (memoized — Phase 2 render performance).
     All hooks live ABOVE the early auth returns. ---------- */
  const counts = useMemo(
    () => ({
      orders: data.orders.length,
      dispatched: data.orders.filter((o) => o?.status === 'Dispatched').length,
      production: data.orders.filter((o) => o?.status && IN_PRODUCTION.includes(o.status)).length,
      messages: data.messages.length,
      blogs: data.blogs.length,
      reviews: data.reviews.length,
      services: data.services.length,
    }),
    [data]
  );

  const visibleAccounts = useMemo(
    () => (me?.role === 'AGENT' && me.uid ? erpAccounts.filter((a) => a.assignedAgentId === me.uid) : erpAccounts),
    [erpAccounts, me]
  );

  const { totalMarketDue, chairmanDue, compactDue } = useMemo(() => {
    const total = visibleAccounts.reduce((sum, a) => sum + Math.max(0, a.currentBalance || 0), 0);
    const chairman = visibleAccounts
      .filter((a) => a.accountType === 'CHAIRMAN_PERSONAL')
      .reduce((sum, a) => sum + Math.max(0, a.currentBalance || 0), 0);
    return {
      totalMarketDue: total,
      chairmanDue: chairman,
      compactDue:
        total >= 1000
          ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(total)
          : String(Math.round(total)),
    };
  }, [visibleAccounts]);

  const filteredAccounts = useMemo(() => {
    const sq = accSearch.trim().toLowerCase();
    return visibleAccounts.filter((a) => {
      if (divisionFilter !== 'ALL' && (a.division || 'DHAKA') !== divisionFilter) return false;
      if (agentFilter === 'UNASSIGNED' && a.assignedAgentId) return false;
      if (agentFilter !== 'ALL' && agentFilter !== 'UNASSIGNED' && a.assignedAgentId !== agentFilter) return false;
      if (
        sq &&
        ![a.name, a.ownerName, a.phone, a.district || ''].some((v) => (v || '').toLowerCase().includes(sq))
      )
        return false;
      return true;
    });
  }, [visibleAccounts, divisionFilter, agentFilter, accSearch]);

  // Due aging per account (memoized map — previously recomputed per row per render
  // and capped-ledger-dependent).
  const agingDaysByAccount = useMemo(() => {
    const m = new Map<string, number>();
    for (const acc of visibleAccounts) {
      const rows = erpLedger.filter((e) => e.clientAccountId === acc.id);
      const payments = rows.filter((e) => e.transactionType === 'PAYMENT');
      const invoices = rows.filter((e) => e.transactionType === 'INVOICE');
      let anchor: number;
      if (payments.length) {
        anchor = Math.max(...payments.map((e) => new Date(e.paymentDate || e.createdAt).getTime()));
      } else if (invoices.length) {
        anchor = Math.min(...invoices.map((e) => new Date(e.paymentDate || e.createdAt).getTime()));
      } else {
        anchor = new Date(acc.createdAt).getTime();
      }
      m.set(acc.id, Math.max(0, Math.floor((Date.now() - anchor) / 86400000)));
    }
    return m;
  }, [visibleAccounts, erpLedger]);

  // Bengali due-reminder deep links (memoized — itemized ledger summary per account).
  const reminderHrefByAccount = useMemo(() => {
    const m = new Map<string, string>();
    for (const acc of visibleAccounts) {
      const rows = erpLedger.filter((e) => e.clientAccountId === acc.id);
      const invoices = rows.filter((e) => e.transactionType === 'INVOICE').slice(0, 3);
      const paid = rows.filter((e) => e.transactionType === 'PAYMENT').reduce((s, e) => s + (e.netAmount || 0), 0);
      const parts: string[] = invoices.map(
        (inv) => `• ${formatDay(inv.createdAt)} — ৳${Math.round(inv.netAmount).toLocaleString('en-IN')}`
      );
      if (paid > 0) parts.push(`মোট পরিশোধ: ৳${Math.round(paid).toLocaleString('en-IN')}`);
      if (!parts.length) parts.push('নতুন হিসাব');
      const text = `শ্রদ্ধেয ডক্টর ${acc.ownerName}, CNDL ল্যাব থেকে আপনার মোট বকেয়া ৳${Math.round(acc.currentBalance).toLocaleString('en-IN')}। বিস্তারিত: ${parts.join(' ')}। বিকাশ/মার্চেন্ট: 01743-167963। ধন্যবাদ!`;
      const num = phoneLinks(acc.phone)?.wa || acc.phone.replace(/\D/g, '');
      m.set(acc.id, `https://wa.me/${num}?text=${encodeURIComponent(text)}`);
    }
    return m;
  }, [visibleAccounts, erpLedger]);

  const todayCollection = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const dayOf = (e: ErpLedgerEntry) => new Date(e.paymentDate || e.createdAt).getTime();
    return erpLedger
      .filter(
        (e) =>
          e.transactionType === 'PAYMENT' &&
          dayOf(e) >= start.getTime() &&
          (me?.role === 'AGENT' ? visibleAccountIds.has(e.clientAccountId) : true)
      )
      .reduce((sum, e) => sum + (e.netAmount || 0), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erpLedger, me, visibleAccounts]);
  const visibleAccountIds = useMemo(() => new Set(visibleAccounts.map((a) => a.id)), [visibleAccounts]);

  const collectedByMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of erpAgents) m[a.id] = a.name;
    for (const u of erpUsers) m[u.id] = u.name;
    return m;
  }, [erpAgents, erpUsers]);

  const { agentMetrics, agentTotals } = useMemo(() => {
    const withdrawnOf = (agentId: string) =>
      erpExpenses
        .filter((e) => e.category === 'LOGISTICS' && !!e.notes && e.notes.includes(`"agentId":"${agentId}"`))
        .reduce((s, e) => s + (e.amount || 0), 0);
    const metrics = erpAgents.map((agent) => {
      const brought = data.orders.filter((o) => o.agentId === agent.id);
      const sales = brought.reduce((s, o) => s + (o.billedAmount || 0), 0);
      const collected = erpLedger
        .filter((e) => e.transactionType === 'PAYMENT' && e.collectedById === agent.id)
        .reduce((s, e) => s + (e.netAmount || 0), 0);
      const earned = brought.reduce((s, o) => s + (o.commissionAmount || 0), 0);
      const withdrawn = withdrawnOf(agent.id);
      return { agent, cases: brought.length, sales, collected, earned, withdrawn, pending: earned - withdrawn };
    });
    const totals = metrics.reduce(
      (acc, m) => ({
        cases: acc.cases + m.cases,
        sales: acc.sales + m.sales,
        collected: acc.collected + m.collected,
        pending: acc.pending + m.pending,
      }),
      { cases: 0, sales: 0, collected: 0, pending: 0 }
    );
    return { agentMetrics: metrics, agentTotals: totals };
  }, [erpAgents, data.orders, erpLedger, erpExpenses]);

  const collectionRows = useMemo(
    () =>
      erpLedger
        .filter((e) =>
          e.transactionType === 'PAYMENT' &&
          (me?.role === 'AGENT' ? visibleAccountIds.has(e.clientAccountId) : true)
        )
        .slice()
        .sort((a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime()),
    [erpLedger, me, visibleAccountIds]
  );

  const expenseStats = useMemo(() => {
    const ms = new Date();
    ms.setDate(1);
    ms.setHours(0, 0, 0, 0);
    const me2 = new Date(ms);
    me2.setMonth(me2.getMonth() + 1);
    const inMonth = (iso: string | null | undefined) => {
      if (!iso) return false;
      const d = new Date(iso);
      return !isNaN(d.getTime()) && d >= ms && d < me2;
    };
    const rows = erpExpenses.filter((x) => inMonth(x.expenseDate));
    return {
      inMonth,
      monthTotal: rows.reduce((sum, x) => sum + (x.amount || 0), 0),
      raw: rows.filter((x) => x.category === 'RAW_MATERIAL').reduce((s, x) => s + (x.amount || 0), 0),
      logistics: rows.filter((x) => x.category === 'LOGISTICS').reduce((s, x) => s + (x.amount || 0), 0),
      maintenance: rows.filter((x) => x.category === 'MAINTENANCE').reduce((s, x) => s + (x.amount || 0), 0),
    };
  }, [erpExpenses]);

  const assetStats = useMemo(
    () => ({
      value: erpAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0),
      operational: erpAssets.filter((a) => a.status === 'OPERATIONAL').length,
      maintenance: erpAssets.filter((a) => a.status === 'UNDER_MAINTENANCE').length,
    }),
    [erpAssets]
  );

  const { totalDividendsPaid, allocatedShares, unallocatedShares, dividendsByName, shareholderHoldings } =
    useMemo(() => {
      const byName: Record<string, number> = {};
      let paid = 0;
      for (const d of erpDividends) {
        paid += d.amountPaid || 0;
        byName[d.shareholderName] = (byName[d.shareholderName] || 0) + (d.amountPaid || 0);
      }
      const allocated = erpShareholders.reduce((sum, s) => sum + (s.sharesCount || 0), 0);
      const holdings: { name: string; shares: number }[] = erpShareholders.length
        ? erpShareholders.map((s) => ({ name: s.name, shares: s.sharesCount }))
        : (() => {
            const out: { name: string; shares: number }[] = [];
            for (const d of erpDividends) {
              if (!out.some((s) => s.name === d.shareholderName)) out.push({ name: d.shareholderName, shares: d.sharesCount });
            }
            return out;
          })();
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const realized = erpLedger
        .filter((e) => {
          if (e.transactionType !== 'PAYMENT') return false;
          const d = new Date(e.paymentDate || e.createdAt);
          return !isNaN(d.getTime()) && d >= start && d < end;
        })
        .reduce((sum, e) => sum + (e.netAmount || 0), 0);
      return {
        totalDividendsPaid: paid,
        allocatedShares: allocated,
        unallocatedShares: Math.max(0, TOTAL_SHARES - allocated),
        dividendsByName: byName,
        monthRealizedRevenue: realized,
        shareholderHoldings: holdings,
      };
    }, [erpDividends, erpShareholders, erpLedger]);
  const earnedByName = (name: string) => dividendsByName[name] || 0;

  const catalogueStats = useMemo(() => {
    const services = data.services;
    return {
      zirconia: services.filter((s) => s.category === 'Zirconia & All-Ceramic').length,
      pfm: services.filter((s) => s.category === 'Porcelain (PFM)').length,
      denture: services.filter((s) => s.category === 'Dentures & Ortho').length,
      avgTurnaround: services.length
        ? Math.round(services.reduce((sum, s) => sum + (s.turnaroundDays || 0), 0) / services.length)
        : 3,
      blogCategories: new Set(data.blogs.map((b) => b.category)).size,
      msgWeek: data.messages.filter((m) => new Date(m.createdAt).getTime() >= Date.now() - 7 * 86400000).length,
      msgMonth: data.messages.filter((m) => new Date(m.createdAt).getTime() >= Date.now() - 30 * 86400000).length,
    };
  }, [data]);

  const teamStats = useMemo(
    () => ({
      chairman: erpUsers.filter((u) => u.role === 'CHAIRMAN').length,
      accounts: erpUsers.filter((u) => u.role === 'ACCOUNTS').length,
      superAdmin: erpUsers.filter((u) => u.role === 'SUPERADMIN').length,
      doctor: erpUsers.filter((u) => u.role === 'DOCTOR').length,
      partnerLab: erpUsers.filter((u) => u.role === 'PARTNER_LAB').length,
    }),
    [erpUsers]
  );

  const filteredUsers = useMemo(() => {
    const sq = userSearch.trim().toLowerCase();
    return erpUsers.filter((u) => {
      const group = USER_GROUPS.find((g) => g.key === userRoleFilter);
      if (group && !group.roles.includes(u.role)) return false;
      if (!sq) return true;
      const haystack = [u.name, u.phone, u.email || '', u.address || '', (ROLE_META[u.role] || ROLE_META.DOCTOR).label]
        .join(' ')
        .toLowerCase();
      return haystack.includes(sq);
    });
  }, [erpUsers, userRoleFilter, userSearch]);

  const { safePage, pagedOrders, orderFilteredCount } = useMemo(() => {
    const sq = search.trim().toLowerCase();
    const filtered = data.orders.filter((o) => {
      if (!o) return false;
      const c = parseClinical(o.productType);
      const haystack = [o.caseId, o.customerName, o.phone, c.patient, o.clinicName, c.work, c.teeth, c.shade, c.notes]
        .filter((v) => typeof v === 'string')
        .join(' ')
        .toLowerCase();
      const matchesSearch = !sq || haystack.includes(sq);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
    const page2 = Math.min(page, totalPages);
    return {
      orderTotalPages: totalPages,
      safePage: page2,
      pagedOrders: filtered.slice((page2 - 1) * ORDERS_PER_PAGE, page2 * ORDERS_PER_PAGE),
      orderFilteredCount: filtered.length,
    };
  }, [data.orders, search, statusFilter, page]);

  const { safeMsgPage, pagedMessages, msgFilteredCount } = useMemo(() => {
    const sq = msgSearch.trim().toLowerCase();
    const filtered = data.messages.filter((m) => {
      if (!m) return false;
      const haystack = `${m.name} ${m.email} ${m.subject ?? ''} ${m.message}`.toLowerCase();
      return !sq || haystack.includes(sq);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / MESSAGES_PER_PAGE));
    const p = Math.min(msgPage, totalPages);
    return {
      msgTotalPages: totalPages,
      safeMsgPage: p,
      pagedMessages: filtered.slice((p - 1) * MESSAGES_PER_PAGE, p * MESSAGES_PER_PAGE),
      msgFilteredCount: filtered.length,
    };
  }, [data.messages, msgSearch, msgPage]);

  const filteredLeads = useMemo(() => {
    const sq = leadSearch.trim().toLowerCase();
    return leads
      .filter((l) => leadStatusFilter === 'All' || l.status === leadStatusFilter)
      .filter(
        (l) =>
          !sq ||
          [l.name, l.contactName, l.area, l.address, l.phone].some((v) => (v || '').toLowerCase().includes(sq))
      );
  }, [leads, leadSearch, leadStatusFilter]);

  // Phase 2: dues pagination — snap back to page 1 whenever filters change.
  useEffect(() => {
    setAccPage(1);
  }, [accSearch, divisionFilter, agentFilter]);
  useEffect(() => {
    setLeadPage(1);
  }, [leadSearch, leadStatusFilter]);

  const pagedAccounts = useMemo(() => {
    const start = (accPage - 1) * ACCOUNTS_PER_PAGE;
    return filteredAccounts.slice(start, start + ACCOUNTS_PER_PAGE);
  }, [filteredAccounts, accPage]);

  // Phase 2: Collection Log filters — date range (paymentDate-aware) + method.
  const filteredCollections = useMemo(() => {
    const from = collFrom ? new Date(`${collFrom}T00:00:00`).getTime() : null;
    const to = collTo ? new Date(`${collTo}T23:59:59.999`).getTime() : null;
    return collectionRows.filter((e) => {
      const t = new Date(e.paymentDate || e.createdAt).getTime();
      if (!isNaN(t)) {
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
      }
      if (collMethod !== 'ALL' && (e.paymentMethod || '') !== collMethod) return false;
      return true;
    });
  }, [collectionRows, collFrom, collTo, collMethod]);

  // Phase 2: Daily Expenses audit filters — text + category + month.
  const expenseMonthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const x of erpExpenses) {
      if (x.expenseDate) set.add(x.expenseDate.slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [erpExpenses]);

  const filteredExpenses = useMemo(() => {
    const sq = expSearch.trim().toLowerCase();
    return erpExpenses.filter((x) => {
      if (expCat !== 'ALL' && x.category !== expCat) return false;
      if (expMonth !== 'ALL' && (x.expenseDate || '').slice(0, 7) !== expMonth) return false;
      if (sq && ![x.title, x.notes, x.voucherNo].some((v) => (v || '').toLowerCase().includes(sq))) return false;
      return true;
    });
  }, [erpExpenses, expSearch, expCat, expMonth]);
  useEffect(() => {
    setExpPage(1);
  }, [expSearch, expCat, expMonth]);
  const pagedExpenses = useMemo(() => {
    const pages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE));
    const p = Math.min(expPage, pages);
    return filteredExpenses.slice((p - 1) * EXPENSES_PER_PAGE, p * EXPENSES_PER_PAGE);
  }, [filteredExpenses, expPage]);
  const pagedLeads = useMemo(() => {
    const pages = Math.max(1, Math.ceil(filteredLeads.length / LEADS_PER_PAGE));
    const p = Math.min(leadPage, pages);
    return filteredLeads.slice((p - 1) * LEADS_PER_PAGE, p * LEADS_PER_PAGE);
  }, [filteredLeads, leadPage]);

  if (auth === null) {
    /* Restoring session — quiet splash */
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400">
        <RefreshCw size={20} className="animate-spin" />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50 text-slate-900">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-8 pt-10 pb-7 text-center">
            <span className="w-14 h-14 mx-auto rounded-2xl bg-teal-600/10 text-teal-700 flex items-center justify-center mb-5">
              <Stethoscope size={26} />
            </span>
            <h2 className="text-xl font-bold tracking-tight">CNDL Admin Console</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Sign in with your registered phone or email.
            </p>
          </div>
          <div className="px-8 pb-10 space-y-4">
            <div>
              <label htmlFor="admin-identifier" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Phone or Email
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  id="admin-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="01XXXXXXXXX or name@lab.com"
                  autoComplete="username"
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600/40 bg-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full min-h-[46px] pl-10 pr-11 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600/40 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  title={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-[46px] rounded-xl bg-teal-700 text-white text-sm font-bold tracking-tight hover:bg-teal-800 disabled:opacity-50 shadow-sm transition-colors"
            >
              {loggingIn ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Access is role-based. Accounts are issued by a SUPERADMIN under User Management.
            </p>
          </div>
        </form>
      </div>
    );
  }

  /* ---------- Derived data — thin render-facing aliases over the memoized
     Phase 2 aggregates above. ---------- */
  const totalOrders = counts.orders;
  const dispatchedCount = counts.dispatched;
  const productionCount = counts.production;
  const messageCount = counts.messages;
  const blogCount = counts.blogs;
  const reviewCount = counts.reviews;
  const serviceCount = counts.services;

  const agentList = erpAgents;

  // Aging + reminder badges read the memoized per-account maps (built above).
  const agingBadge = (acc: ErpAccount): { label: string; cls: string } | null => {
    if ((acc.currentBalance || 0) <= 0) return null;
    const d = agingDaysByAccount.get(acc.id) ?? 0;
    if (d > 30) return { label: `${d}d overdue`, cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (d >= 15) return { label: `${d}d`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: `${d}d`, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  };
  const whatsappReminderHref = (acc: ErpAccount): string => reminderHrefByAccount.get(acc.id) ?? '';

  // ERP Phase 3 metrics — render-facing aliases.
  const monthExpenseTotal = expenseStats.monthTotal;
  const monthRawMaterialSpend = expenseStats.raw;
  const monthLogisticsSpend = expenseStats.logistics;
  const monthMaintenanceSpend = expenseStats.maintenance;
  const totalAssetValue = assetStats.value;
  const operationalMachines = assetStats.operational;
  const underMaintenanceMachines = assetStats.maintenance;
  const profitNum = parseFloat(profitInput) || 0;
  const perShareValue = profitNum / TOTAL_SHARES;

  // Catalogue / CMS / team metrics for per-tab KPI cards.
  const zirconiaLines = catalogueStats.zirconia;
  const pfmLines = catalogueStats.pfm;
  const dentureLines = catalogueStats.denture;
  const avgTurnaroundDays = catalogueStats.avgTurnaround;
  const blogCategoryCount = catalogueStats.blogCategories;
  const blogDraftCount = (data?.blogs ?? []).filter((b) => !b.publishedAt).length;
  const msgThisWeek = catalogueStats.msgWeek;
  const msgThisMonth = catalogueStats.msgMonth;
  const chairmanUsers = teamStats.chairman;
  const accountsUsers = teamStats.accounts;

  /* ---------- User Management: department metrics + role-group filtering ---------- */
  const superAdminUsers = teamStats.superAdmin;
  const leadershipCount = superAdminUsers + chairmanUsers;
  const userGroupCount = (key: UserGroupKey) =>
    key === 'all'
      ? erpUsers.length
      : erpUsers.filter((u) => USER_GROUPS.find((g) => g.key === key)!.roles.includes(u.role)).length;

  const modalOrder = modalId ? (data?.orders ?? []).find((o) => o?.id === modalId) ?? null : null;

  const filtersActive = search.trim() !== '' || statusFilter !== 'All';

  const commsButtons = (order: Order, size: 'sm' | 'md' = 'md') => {
    const links = phoneLinks(order.phone);
    const btn = `min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-colors`;
    return (
      <div className="flex items-center gap-2">
        {links && (
          <>
            <a
              href={`https://wa.me/${links.wa}?text=${encodeURIComponent(`Hello, this is CNDL Dental Lab regarding Case ID: ${order.caseId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${order.caseId}`}
              title="WhatsApp the clinic"
              className={`${btn} bg-[#25D366] border-[#25D366] text-white hover:bg-[#1fbd59]`}
            >
              <svg viewBox="0 0 32 32" fill="currentColor" className={size === 'md' ? 'w-4 h-4' : 'w-4 h-4'} aria-hidden="true">
                <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
              </svg>
            </a>
            <a
              href={`tel:${links.tel}`}
              aria-label={`Call ${order.caseId}`}
              title="Call the clinic"
              className={`${btn} bg-white border-slate-200 text-teal-700 hover:bg-blue-50`}
            >
              <Phone size={15} />
            </a>
          </>
        )}
        <button
          onClick={() => setModalId(order.id)}
          aria-label={`Open prescription details for ${order.caseId}`}
          title="Case prescription details"
          className={`${btn} bg-white border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          <Eye size={15} />
        </button>
      </div>
    );
  };

type NavItem = {
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    count?: number;
    badge?: string;
  };

  const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
    {
      title: 'Command Center',
      items: [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard, badge: 'Live' },
      ],
    },
    {
      title: 'Lab Operations',
      items: [
        { key: 'orders', label: 'Lab Cases', icon: Layers, count: totalOrders },
        { key: 'products', label: 'Dental Products', icon: Package, count: serviceCount },
      ],
    },
    {
      title: 'Finance & ERP',
      items: [
        { key: 'dues', label: 'Client Dues', icon: Wallet, badge: me?.role !== 'AGENT' && totalMarketDue > 0 ? `৳${compactDue}` : undefined },
        { key: 'expenses', label: 'Daily Expenses', icon: TrendingDown },
        { key: 'capex', label: 'Machinery & CapEx', icon: Cpu },
        { key: 'shareholders', label: 'Shareholders & P&L', icon: Landmark },
      ],
    },
    {
      title: 'Growth & CMS',
      items: [
        { key: 'leads', label: 'Dental Leads', icon: MapPin, count: leads.length },
        { key: 'messages', label: 'Client Inquiries', icon: MessageSquare, count: messageCount },
        { key: 'blogs', label: 'Blog Articles', icon: FileText, count: blogCount },
        { key: 'reviews', label: 'Testimonials', icon: Star, count: reviewCount },
      ],
    },
    {
      title: 'Access & Team',
      items: [
        { key: 'users', label: 'Team & Staff', icon: Users },
      ],
    },
  ];
  const navItems = NAV_GROUPS.flatMap((g) => g.items);
  const currentNav = navItems.find((n) => n.key === tab);
  const currentGroupTitle = NAV_GROUPS.find((g) => g.items.some((i) => i.key === tab))?.title;
  const visibleNavGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => permittedTabs.includes(i.key)) }))
    .filter((g) => g.items.length > 0);

  type Kpi = {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    bg: string;
    fg: string;
    valueCls?: string;
  };

  const kpiCards: Kpi[] =
    tab === 'overview' ? [
      { label: 'Total Market Dues', value: formatBDT(overviewMetrics.totalMarketDues), icon: Landmark, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
      { label: "This Month's Invoiced Sales", value: formatBDT(overviewMetrics.monthInvoicedSales), icon: TrendingUp, bg: 'bg-teal-50', fg: 'text-teal-700', valueCls: 'text-teal-700' },
      { label: "This Month's Cash In", value: formatBDT(overviewMetrics.monthCashCollected), icon: Wallet, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
      { label: "This Month's OpEx", value: formatBDT(overviewMetrics.monthExpenses), icon: Receipt, bg: 'bg-amber-50', fg: 'text-amber-600', valueCls: 'text-amber-600' },
    ] : tab === 'orders' ? [
      { label: 'Total Cases', value: totalOrders, icon: Layers, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'In Production', value: productionCount, icon: RefreshCw, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Dispatched', value: dispatchedCount, icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
      { label: 'Turnaround Avg', value: `${avgTurnaroundDays} Days`, icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-600' },
    ] : tab === 'dues' ? (
      me?.role === 'AGENT' ? [
        { label: 'Assigned Accounts', value: visibleAccounts.length, icon: Package, bg: 'bg-teal-50', fg: 'text-teal-700' },
        { label: 'Outstanding (Assigned)', value: formatBDT(totalMarketDue), icon: Wallet, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
        { label: "Today's Collection", value: formatBDT(todayCollection), icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
      ] : [
        { label: 'Total Market Due', value: formatBDT(totalMarketDue), icon: Landmark, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
        { label: 'Active Accounts', value: visibleAccounts.length, icon: Package, bg: 'bg-teal-50', fg: 'text-teal-700' },
        { label: "Today's Collection", value: formatBDT(todayCollection), icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
        { label: 'Chairman Channel Due', value: formatBDT(chairmanDue), icon: Wallet, bg: 'bg-amber-50', fg: 'text-amber-600', valueCls: 'text-amber-600' },
      ]
    ) : tab === 'expenses' ? [
      { label: "This Month's Expenses", value: formatBDT(monthExpenseTotal), icon: Receipt, bg: 'bg-rose-50', fg: 'text-rose-600', valueCls: 'text-rose-600' },
      { label: 'Raw Materials Spend', value: formatBDT(monthRawMaterialSpend), icon: Package, bg: 'bg-teal-50', fg: 'text-teal-700' },
      { label: 'Logistics / Fuel Spend', value: formatBDT(monthLogisticsSpend), icon: Wallet, bg: 'bg-amber-50', fg: 'text-amber-600' },
      { label: 'Maintenance', value: formatBDT(monthMaintenanceSpend), icon: Cog, bg: 'bg-slate-100', fg: 'text-slate-600' },
    ] : tab === 'capex' ? [
      { label: 'Machine Asset Valuation', value: formatBDT(totalAssetValue), icon: Cpu, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Operational Units', value: `${operationalMachines} / ${erpAssets.length}`, icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
      { label: 'Maintenance Status', value: underMaintenanceMachines > 0 ? `${underMaintenanceMachines} Under Maint.` : 'All Operational', icon: Cog, bg: 'bg-amber-50', fg: 'text-amber-600' },
    ] : tab === 'shareholders' ? [
      { label: 'Shares Allocated', value: `${allocatedShares} / ${TOTAL_SHARES}`, icon: PieChart, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Unallocated Shares', value: unallocatedShares, icon: Layers, bg: unallocatedShares > 0 ? 'bg-amber-50' : 'bg-emerald-50', fg: unallocatedShares > 0 ? 'text-amber-600' : 'text-emerald-600' },
      { label: 'Cumulative Payouts', value: formatBDT(totalDividendsPaid), icon: Wallet, bg: 'bg-emerald-50', fg: 'text-emerald-600', valueCls: 'text-emerald-600' },
      { label: 'Dividend per Share', value: formatBDT(perShareValue), icon: Receipt, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
    ] : tab === 'products' ? [
      { label: 'Catalogue Items', value: serviceCount, icon: Package, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Zirconia Lines', value: zirconiaLines, icon: Layers, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'PFM Lines', value: pfmLines, icon: Layers, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Denture Lines', value: dentureLines, icon: Layers, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    ] : tab === 'blogs' ? [
      { label: 'Published Articles', value: blogCount, icon: FileText, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Categories', value: blogCategoryCount, icon: Layers, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Drafts', value: blogDraftCount, icon: Pencil, bg: 'bg-slate-200', fg: 'text-slate-600' },
    ] : tab === 'messages' ? [
      { label: 'Total Inquiries', value: messageCount, icon: MessageSquare, bg: 'bg-emerald-600/15', fg: 'text-emerald-700' },
      { label: 'New This Week', value: msgThisWeek, icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-600' },
      { label: 'Last 30 Days', value: msgThisMonth, icon: Mail, bg: 'bg-teal-50', fg: 'text-teal-700' },
    ] : tab === 'leads' ? [
      { label: 'Total Chambers', value: leads.length, icon: MapPin, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'New Leads', value: leads.filter((l) => l.status === 'new').length, icon: Activity, bg: 'bg-sky-50', fg: 'text-sky-700' },
      { label: 'Sample Given', value: leads.filter((l) => l.status === 'sample_given').length, icon: Package, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Active Clients', value: leads.filter((l) => l.status === 'client').length, icon: BadgeCheck, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
    ] : [];

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50/70">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0b1120] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-700 font-semibold flex items-center justify-center text-sm shrink-0">C</span>
          <span className="font-semibold text-sm tracking-wide">CNDL ADMIN</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {confirmState && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cndl-confirm-title"
            aria-describedby="cndl-confirm-body"
            className="bg-white w-full sm:max-w-md rounded-t-xl sm:rounded-xl shadow-xl p-6"
          >
            <h3 id="cndl-confirm-title" className="text-base font-semibold text-slate-900">
              {confirmState.title}
            </h3>
            <p id="cndl-confirm-body" className="mt-2 text-sm leading-relaxed text-slate-600">
              {confirmState.message}
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => resolveConfirm(false)}
                className="min-h-[40px] px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className="min-h-[40px] px-4 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Fixed left sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 min-h-screen bg-[#0b1120] text-white flex flex-col transform transition-all duration-300 lg:translate-x-0 ${
          railCollapsed ? 'lg:w-[76px]' : ''
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand header */}
        <div className={`px-5 py-5 border-b border-white/10 flex items-center gap-3 ${railCollapsed ? 'lg:px-0 lg:justify-center' : ''}`}>
          <span className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/40 text-teal-300 font-semibold flex items-center justify-center text-lg shrink-0">C</span>
          <div className={`min-w-0 ${railCollapsed ? 'lg:hidden' : ''}`}>
            <div className="font-semibold leading-tight">CNDL Admin</div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 text-teal-300 px-2 py-0.5 text-[11px] font-medium mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Admin Console
            </span>
          </div>
          <button
            onClick={toggleRail}
            aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:inline-flex ml-auto mr-3 w-8 h-8 items-center justify-center rounded-lg text-slate-500 hover:text-teal-300 hover:bg-white/10 transition-colors shrink-0"
          >
            {railCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="lg:hidden ml-auto min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav menu — grouped & role-filtered */}
        <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto overflow-x-hidden">
          {visibleNavGroups.map((group) => (
            <div key={group.title}>
              {railCollapsed && <div className="hidden lg:block mx-auto w-7 border-t border-white/10 mb-2" />}
              <p className={`px-4 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 select-none ${railCollapsed ? 'lg:hidden' : ''}`}>
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setTab(item.key);
                      setSidebarOpen(false);
                    }}
                    title={railCollapsed ? item.label : undefined}
                    className={`relative w-full min-h-[44px] px-4 inline-flex items-center gap-3 rounded-lg text-sm font-semibold border-l-2 transition-all duration-200 ${
                      tab === item.key
                        ? 'bg-teal-600/15 text-teal-300 border-teal-500'
                        : 'text-slate-400 border-transparent hover:bg-white/[0.06] hover:text-slate-200'
                    } ${railCollapsed ? 'lg:justify-center lg:px-0 lg:border-l-transparent' : ''}`}
                  >
                    <item.icon size={17} className="shrink-0" />
                    <span className={`flex-1 text-left truncate ${railCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                    {railCollapsed ? (
                      (item.badge || (item.count !== undefined && item.count > 0)) && (
                        <span
                          title={item.badge === 'Live' ? 'Live' : item.badge ? `Total market due: ${formatBDT(totalMarketDue)}` : `${item.count}`}
                          className={`hidden lg:inline-flex absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                            item.badge && item.badge !== 'Live' ? 'bg-rose-400' : item.badge === 'Live' ? 'bg-emerald-400' : 'bg-teal-400'
                          }`}
                        />
                      )
                    ) : item.badge ? (
                      item.badge === 'Live' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span
                          title={`Total market due: ${formatBDT(totalMarketDue)}`}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${
                            tab === item.key ? 'bg-rose-400/20 text-rose-200' : 'bg-rose-400/15 text-rose-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )
                    ) : item.count !== undefined && item.count > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          tab === item.key ? 'bg-teal-500/20 text-teal-300' : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: signed-in user + sign out */}
        <div className={`px-3 py-4 border-t border-white/10 space-y-2 ${railCollapsed ? 'lg:px-2' : ''}`}>
          <div className={`flex items-center gap-3 px-2 py-1.5 ${railCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <span className="w-9 h-9 rounded-full bg-teal-600/20 border border-teal-500/40 font-semibold text-sm flex items-center justify-center shrink-0 text-teal-300">
              {(me?.name || 'A').charAt(0).toUpperCase()}
            </span>
            <div className={`min-w-0 flex-1 ${railCollapsed ? 'lg:hidden' : ''}`}>
              <div className="text-xs font-bold truncate">{me?.name || 'Administrator'}</div>
              <div className="text-[11px] text-slate-500 truncate">{me?.phone || 'cndl-global.com'}</div>
            </div>
            <button
              onClick={openPwModal}
              aria-label="Change Password"
              title="Change Password"
              className={`shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors ${railCollapsed ? 'lg:hidden' : ''}`}
            >
              <KeyRound size={15} />
            </button>
            {me && ROLE_META[me.role] && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_META[me.role].cls} ${railCollapsed ? 'lg:hidden' : ''}`}
                title={`Signed in as ${ROLE_META[me.role].label}`}
              >
                {ROLE_META[me.role].label}
              </span>
            )}
          </div>
          {railCollapsed && (
            <button
              onClick={openPwModal}
              aria-label="Change Password"
              title="Change Password"
              className="hidden lg:inline-flex w-full min-h-[44px] items-center justify-center rounded-lg text-slate-400 hover:text-teal-300 hover:bg-white/10 transition-colors"
            >
              <KeyRound size={15} />
            </button>
          )}
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-rose-400 hover:border-rose-400/40 transition-colors ${
              railCollapsed ? 'lg:w-10 lg:min-w-0 lg:px-0 mx-auto' : 'w-full'
            }`}
          >
            <LogOut size={15} />
            <span className={railCollapsed ? 'lg:hidden' : ''}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className={railCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}>
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Section toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div>
                {currentGroupTitle && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5 select-none">
                    {currentGroupTitle}
                  </p>
                )}
                <h1 className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums leading-tight">{currentNav?.label ?? 'Dashboard'}</h1>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-600/15 text-emerald-700 px-3 py-1 text-[11px] font-bold self-center mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-3">
              {lastSyncedAt && (
                <span className="hidden md:inline text-xs font-medium text-slate-400 tabular-nums" title="Last successful sync">
                  Synced {refreshing ? '…' : new Date(lastSyncedAt).toLocaleTimeString('en-GB')}
                </span>
              )}
              <button
                onClick={() => fetchData(true)}
                className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
            </div>
          </div>

        {/* Context-specific KPI metrics — changes with the active section */}
        {tab !== 'users' && kpiCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {kpiCards.map((card) => (
            <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-3 shadow-sm">
              <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${card.bg} ${card.fg}`}>
                <card.icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 line-clamp-2 leading-tight">
                  {card.label}
                </span>
                <span className={`block text-lg sm:text-2xl font-semibold tracking-tight tabular-nums tabular-nums truncate ${card.valueCls || ''}`}>{card.value}</span>
              </span>
            </div>
          ))}
          {tab === 'shareholders' && (
            /* Distributable net profit calculator (drives the per-share KPI) */
            <div className="col-span-2 bg-white border border-teal-700/20 rounded-xl p-4 sm:p-5 shadow-sm">
              <span className="block text-xs font-medium text-teal-700/70 mb-2">
                This Month&apos;s Distributable Net — Calculator
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={profitInput}
                onChange={(e) => setProfitInput(e.target.value)}
                placeholder="Net profit to distribute (BDT)"
                className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
              />
              {profitNum > 0 ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-bold text-teal-700">
                    Distributable net: {formatBDT(profitNum)} · per share (1/{TOTAL_SHARES}): {formatBDT(perShareValue)}
                  </p>
                  {shareholderHoldings.length > 0 ? (
                    <div className="space-y-0.5 max-h-28 overflow-y-auto">
                      {shareholderHoldings.map((s) => (
                        <p key={s.name} className="text-xs text-gray-600 flex justify-between gap-2">
                          <span className="truncate">{s.name} <span className="text-slate-500">({s.shares} shares)</span></span>
                          <span className="font-bold whitespace-nowrap">{formatBDT(perShareValue * s.shares)}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No shareholders registered yet.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Enter this month&apos;s net profit to preview per-share dividends.</p>
              )}
            </div>
          )}
        </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm font-bold text-slate-500">
            <RefreshCw size={20} className="animate-spin mr-3" /> Loading dashboard...
          </div>
        ) : tab === 'overview' ? (
          /* ================= EXECUTIVE OVERVIEW — 360° COMMAND CENTER ================= */
          <div className="space-y-5">
            {/* Quick Action Bar */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Actions</p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => window.open('/order-create', '_blank')}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors shadow-sm"
                >
                  <Plus size={15} /> Submit Case
                </button>
                <button
                  onClick={() => setTab('dues')}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-teal-700/30 text-teal-700 text-xs font-bold hover:bg-teal-700/5 transition-colors"
                >
                  <Plus size={15} /> Record Due / Invoice
                </button>
                <button
                  onClick={() => {
                    setTab('expenses');
                    openNewExpense();
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-50 transition-colors"
                >
                  <Plus size={15} /> Log Expense
                </button>
                <button
                  onClick={() => {
                    setTab('shareholders');
                    openNewShareholder();
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  <Plus size={15} /> Add Shareholder
                </button>
                <button
                  onClick={() => {
                    setTab('users');
                    openNewUser();
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <Plus size={15} /> Add User
                </button>
              </div>
            </div>

            {/* ===== GROUP C: MACRO OUTSTANDING (মাঠের মোট বকেয়া) ===== */}
            <div className="rounded-xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/30 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <Landmark size={18} />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                      Macro Outstanding • মাঠের মোট বকেয়া
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-semibold text-rose-600 tracking-tight tabular-nums">
                    {formatBDT(overviewMetrics.totalMarketDues)}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Total uncollected balance across all registered client accounts &amp; partner chambers
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTab('dues')}
                    className="min-h-[44px] px-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    View Due Ledger <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* ===== GROUP A: TODAY'S REGISTER (আজকের খাতা) ===== */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                    Today&apos;s Register • আজকের খাতা
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-full">
                  Live Asia/Dhaka (UTC+6)
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Today's Invoiced Sales */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 line-clamp-2 leading-tight mb-1">
                      Today&apos;s Invoiced Sales (বিক্রি)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-slate-900 tracking-tight">
                      {formatBDT(overviewMetrics.todayInvoicedSales)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-teal-700 font-bold mt-2">
                    Invoices dated today
                  </span>
                </div>
                {/* 2. Today's Cash Collected */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 line-clamp-2 leading-tight mb-1">
                      Today&apos;s Cash Collected (নগদ আদায়)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-emerald-700 tracking-tight">
                      {formatBDT(overviewMetrics.todayCashCollected)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-emerald-700 font-bold mt-2">
                    Collections received today
                  </span>
                </div>
                {/* 3. Today's New Dues Added */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800 line-clamp-2 leading-tight mb-1">
                      Today&apos;s New Dues (বকেয়া বৃদ্ধি)
                    </span>
                    <span className={`block text-lg sm:text-2xl font-semibold tracking-tight tabular-nums ${
                      overviewMetrics.todayNewDuesAdded > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {overviewMetrics.todayNewDuesAdded > 0 ? `+${formatBDT(overviewMetrics.todayNewDuesAdded)}` : formatBDT(overviewMetrics.todayNewDuesAdded)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-amber-700 font-bold mt-2">
                    Invoiced Sales − Cash In
                  </span>
                </div>
                {/* 4. Today's Expenses */}
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 line-clamp-2 leading-tight mb-1">
                      Today&apos;s OpEx (আজকের খরচ)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-rose-600 tracking-tight">
                      {formatBDT(overviewMetrics.todayExpenses)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-rose-700 font-bold mt-2">
                    Logged daily expenses
                  </span>
                </div>
              </div>
            </div>

            {/* ===== GROUP B: THIS MONTH'S SUMMARY (চলতি মাসের হিসাব) ===== */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                    This Month&apos;s Summary • চলতি মাসের হিসাব
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-full">
                  Calendar Month MTD
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Month's Sales */}
                <div className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-800 line-clamp-2 leading-tight mb-1">
                      This Month&apos;s Sales (মোট বিক্রি)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-teal-900 tracking-tight">
                      {formatBDT(overviewMetrics.monthInvoicedSales)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-teal-700 font-bold mt-2">
                    Gross invoiced volume
                  </span>
                </div>
                {/* 2. Total Cash In */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 line-clamp-2 leading-tight mb-1">
                      Total Cash In (মোট নগদ আদায়)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-emerald-700 tracking-tight">
                      {formatBDT(overviewMetrics.monthCashCollected)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-emerald-700 font-bold mt-2">
                    Realized payments this month
                  </span>
                </div>
                {/* 3. Net Dues Added */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800 line-clamp-2 leading-tight mb-1">
                      Net Dues Added (নেট বকেয়া বৃদ্ধি)
                    </span>
                    <span className={`block text-lg sm:text-2xl font-semibold tracking-tight tabular-nums ${
                      overviewMetrics.monthNewDuesAdded > 0 ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {overviewMetrics.monthNewDuesAdded > 0 ? `+${formatBDT(overviewMetrics.monthNewDuesAdded)}` : formatBDT(overviewMetrics.monthNewDuesAdded)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-amber-700 font-bold mt-2">
                    Month Sales − Cash In
                  </span>
                </div>
                {/* 4. Month's Total OpEx */}
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 flex flex-col justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 line-clamp-2 leading-tight mb-1">
                      Month&apos;s Total OpEx (মোট খরচ)
                    </span>
                    <span className="block text-lg sm:text-2xl font-semibold text-rose-600 tracking-tight">
                      {formatBDT(overviewMetrics.monthExpenses)}
                    </span>
                  </div>
                  <span className="block text-[11px] text-rose-700 font-bold mt-2">
                    Cumulative monthly spend
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed + Split Ledger Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Activity feed */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-teal-700" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Recent Activity</h3>
                </div>
                {(() => {
                  const accName = (id: string) => erpAccounts.find((a) => a.id === id)?.name || 'Client account';
                  type FeedItem = { id: string; at: number; icon: React.ComponentType<{ size?: number; className?: string }>; iconCls: string; title: string; sub: string; amount: string | null; amountCls: string };
                  const feed: FeedItem[] = [];
                  for (const e of erpLedger.slice(0, 40)) {
                    if (feed.length >= 24) break;
                    const payment = e.transactionType === 'PAYMENT';
                    feed.push({
                      id: `lg-${e.id}`,
                      at: new Date(e.createdAt).getTime(),
                      icon: payment ? Wallet : Receipt,
                      iconCls: payment ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500',
                      title: payment ? 'Collection received' : 'Invoice recorded',
                      sub: `${accName(e.clientAccountId)}${e.orderId ? ` · Case ${e.orderId}` : ''}${e.notes ? ` · ${e.notes}` : ''}`,
                      amount: formatBDT(e.netAmount),
                      amountCls: payment ? 'text-emerald-600' : 'text-rose-500',
                    });
                  }
                  for (const x of erpExpenses.slice(0, 12)) {
                    feed.push({
                      id: `ex-${x.id}`,
                      at: new Date(x.expenseDate).getTime(),
                      icon: TrendingDown,
                      iconCls: 'bg-amber-50 text-amber-600',
                      title: x.title,
                      sub: `Expense · ${EXPENSE_CATEGORY_META[x.category]?.label || 'Other'}`,
                      amount: `-${formatBDT(x.amount)}`,
                      amountCls: 'text-amber-600',
                    });
                  }
                  for (const o of data.orders.slice(0, 12)) {
                    feed.push({
                      id: `or-${o.id}`,
                      at: new Date(o.createdAt).getTime(),
                      icon: Layers,
                      iconCls: 'bg-teal-700/10 text-teal-700',
                      title: `New case ${o.caseId}`,
                      sub: `From ${o.customerName}${o.productType ? ` · ${o.productType.split(' | ')[0]}` : ''}`,
                      amount: null,
                      amountCls: '',
                    });
                  }
                  feed.sort((a, b) => b.at - a.at);
                  const topFeed = feed.slice(0, 10);
                  if (topFeed.length === 0) {
                    return (
                      <p className="text-center text-sm text-slate-500 py-14">No activity yet — record an invoice, log an expense or receive a case to see it here.</p>
                    );
                  }
                  return (
                    <div className="divide-y divide-slate-100">
                      {topFeed.map((item) => (
                        <div key={item.id} className="py-3 flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconCls}`}>
                            <item.icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {item.amount && <p className={`text-sm font-semibold whitespace-nowrap ${item.amountCls}`}>{item.amount}</p>}
                            <p className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(new Date(item.at).toISOString())}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Split Ledger Preview */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Ledger Preview</h3>
                  <button onClick={() => setTab('dues')} className="text-xs font-bold text-teal-700 hover:underline">
                    Open ledger →
                  </button>
                </div>
                {erpLedger.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-14">No ledger entries yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {erpLedger.slice(0, 8).map((e) => {
                      const payment = e.transactionType === 'PAYMENT';
                      const acc = erpAccounts.find((a) => a.id === e.clientAccountId);
                      return (
                        <div key={e.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider whitespace-nowrap ${payment ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                              {payment ? 'Payment' : 'Invoice'}
                            </span>
                            <span className={`text-sm font-semibold whitespace-nowrap ${payment ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {payment ? '+' : ''}{formatBDT(e.netAmount)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 truncate mt-1">{acc?.name || 'Client account'}</p>
                          <p className="text-[11px] text-slate-500">{formatDate(e.createdAt)}{e.orderId ? ` · Case ${e.orderId}` : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : tab === 'orders' ? (
          /* ================= TAB 1: LAB CASES ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-lg sm:text-2xl font-semibold">Manage Lab Cases</h2>
                <button
                  onClick={openOfflineOrder}
                  className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors shadow-sm whitespace-nowrap"
                >
                  <Plus size={16} /> Add Offline Order
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Case ID, doctor or phone..."
                    className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                {filtersActive && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('All');
                    }}
                    className="min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-gray-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['All', ...STATUS_OPTIONS].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`min-h-[36px] px-4 rounded-full text-xs font-bold border transition-all duration-300 ${
                    statusFilter === s
                      ? 'bg-teal-700 border-teal-700 text-white shadow'
                      : 'bg-white border-slate-200 text-gray-500 hover:border-teal-700/20 hover:text-teal-700'
                  }`}
                >
                  {s === 'All' ? 'All Statuses' : s}
                </button>
              ))}
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden space-y-4">
              {pagedOrders.map((order) => {
                const c = parseClinical(order.productType);
                return (
                  <div key={order.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-3 py-1 text-xs font-semibold shrink-0 whitespace-nowrap">
                          {order.caseId}
                        </span>
                        {order.orderSource && ORDER_SOURCE_META[order.orderSource] && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${ORDER_SOURCE_META[order.orderSource].cls}`}>
                            {ORDER_SOURCE_META[order.orderSource].label}
                          </span>
                        )}
                        <button
                          onClick={() => copyText(order.id, order.caseId, 'Case ID')}
                          aria-label={`Copy ${order.caseId}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                        >
                          {copiedId === order.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <StagePill
                        status={order.status}
                        saving={savingId === order.id}
                        onChange={(s) => updateStage(order, s)}
                      />
                    </div>

                    <div className="text-sm space-y-1 min-w-0">
                      <div className="font-bold truncate">{order.customerName}</div>
                      {c.patient && <div className="text-xs text-gray-500 truncate">Patient: {c.patient}</div>}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> Ordered {formatDay(order.orderDate || order.createdAt)}</span>
                        {order.deliveryDate && <span className="inline-flex items-center gap-1 font-bold text-teal-700/80"><Clock size={11} /> Promised {formatDay(order.deliveryDate)}</span>}
                      </div>
                    </div>

                    {phoneLinks(order.phone) && (
                      <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 min-h-[44px]">
                        <Phone size={14} /> {order.phone}
                      </a>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {c.work && c.work.split(' | ').filter(Boolean).map((w, i) => (
                        <span key={`${order.id}-mw-${i}`} className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-100 px-2.5 py-1 text-[11px] font-bold max-w-full truncate">
                          {w}
                        </span>
                      ))}
                      {c.teeth && <Chip label="Teeth" value={c.teeth} tone="green" />}
                      {c.shade && <Chip label="Shade" value={c.shade} tone="gray" />}
                      {c.trial && <Chip label="Trial" value={c.trial} tone="gray" />}
                      {c.insertion && <Chip label="Insertion" value={c.insertion} tone="gray" />}
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 break-words" title={c.notes}>Notes: {c.notes}</p>}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {commsButtons(order, 'sm')}
                      <button
                        onClick={() => deleteOrder(order)}
                        disabled={deletingId === `order-${order.id}`}
                        aria-label={`Delete or archive ${order.caseId}`}
                        title="Delete / Archive case"
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {orderFilteredCount === 0 && (
                <p className="text-center text-sm text-slate-500 py-10">
                  {filtersActive ? 'No cases match your filters.' : 'No lab cases yet.'}
                </p>
              )}
            </div>

            {/* Tablet/Desktop: modern structured table */}
            <div className="hidden md:block overflow-x-auto rounded-xl">
              <table className="w-full text-left tabular-nums">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-4 pr-4">Case</th>
                    <th className="pb-4 pr-4">Doctor / Clinic</th>
                    <th className="pb-4 pr-4">Restoration</th>
                    <th className="pb-4 pr-4">Clinical Stage</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedOrders.map((order) => {
                    const c = parseClinical(order.productType);
                    return (
                      <tr key={order.id} className="align-top hover:bg-slate-50/80 transition-colors">
                        <td className="py-5 pr-4">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-3 py-1 text-xs font-semibold whitespace-nowrap">
                              {order.caseId}
                            </span>
                            {order.orderSource && ORDER_SOURCE_META[order.orderSource] && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${ORDER_SOURCE_META[order.orderSource].cls}`}>
                                {ORDER_SOURCE_META[order.orderSource].label}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => copyText(order.id, order.caseId, 'Case ID')}
                            aria-label={`Copy ${order.caseId}`}
                            title="Copy Case ID"
                            className="mt-1.5 p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-white"
                          >
                            {copiedId === order.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                            <CalendarDays size={11} /> Ordered {formatDay(order.orderDate || order.createdAt)}
                          </div>
                          {order.deliveryDate && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                              <Clock size={11} /> <span className="font-bold text-teal-700/80">Promised {formatDay(order.deliveryDate)}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-5 pr-4 max-w-[220px] min-w-0">
                          <div className="font-bold text-sm truncate" title={order.customerName}>{order.customerName || '—'}</div>
                          {c.patient && (
                            <div className="text-xs text-gray-500 truncate mt-0.5" title={c.patient}>
                              <span className="text-slate-500">Patient:</span> {c.patient}
                            </div>
                          )}
                        </td>
                        <td className="py-5 pr-4 max-w-[220px]">
                          {c.work ? (
                            <div className="flex flex-wrap gap-1.5">
                              {c.work.split(' | ').filter(Boolean).map((w, i) => (
                                <span
                                  key={`${order.id}-w-${i}`}
                                  className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-100 px-2.5 py-1 text-[11px] font-bold max-w-[200px] truncate"
                                  title={w}
                                >
                                  {w}
                                </span>
                              ))}
                              {c.teeth && <Chip label="Teeth" value={c.teeth} tone="green" />}
                              {c.shade && <Chip label="Shade" value={c.shade} tone="gray" />}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-5 pr-4">
                          <StagePill
                            status={order.status}
                            saving={savingId === order.id}
                            onChange={(s) => updateStage(order, s)}
                          />
                        </td>
                        <td className="py-5">
                          <div className="flex items-center gap-2">
                            {commsButtons(order)}
                            <button
                              onClick={() => deleteOrder(order)}
                              disabled={deletingId === `order-${order.id}`}
                              aria-label={`Delete or archive ${order.caseId}`}
                              title="Delete / Archive case"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orderFilteredCount === 0 && (
                <p className="text-center text-sm text-slate-500 py-10">
                  {filtersActive ? 'No cases match your filters.' : 'No lab cases yet.'}
                </p>
              )}
            </div>

            <Pager
              page={safePage}
              total={orderFilteredCount}
              perPage={ORDERS_PER_PAGE}
              onPage={setPage}
              noun={orderFilteredCount === 1 ? 'case' : 'cases'}
              note={filtersActive ? `(filtered from ${totalOrders})` : undefined}
            />
          </div>
        ) : tab === 'messages' ? (
          /* ================= TAB 2: MESSAGES ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-2xl font-semibold">Client Inquiries</h2>
              <div className="relative w-full lg:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Search sender, email, subject or message..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>
            </div>

            {msgFilteredCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <MessageSquare size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">{msgSearch ? 'No messages match your search' : 'No messages yet'}</p>
                <p className="text-xs text-slate-500 mt-1">Contact form inquiries will appear here.</p>
              </div>
            ) : (
              <>
                {/* Desktop: compact data table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pr-4">Date / Time</th>
                        <th className="pb-3 pr-4">Sender</th>
                        <th className="pb-3 pr-4">Contact</th>
                        <th className="pb-3 pr-4">Subject</th>
                        <th className="pb-3 pr-4">Message Preview</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedMessages.map((msg) => {
                        const wa = extractWaPhone(msg);
                        return (
                          <tr key={msg.id} className="align-top hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 pr-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(msg.createdAt)}</td>
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 font-semibold text-xs flex items-center justify-center shrink-0">
                                  {msg.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-bold text-sm max-w-[160px] truncate" title={msg.name}>{msg.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4">
                              <a href={`mailto:${msg.email}`} className="text-xs font-semibold text-teal-700 hover:underline block max-w-[200px] truncate" title={msg.email}>
                                {msg.email}
                              </a>
                              {wa && <a href={`tel:+${wa}`} className="text-xs text-gray-500 hover:text-teal-700 block mt-0.5">+{wa}</a>}
                            </td>
                            <td className="py-3.5 pr-4">
                              {msg.subject ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-600/15 text-emerald-700 px-3 py-1 text-[11px] font-bold max-w-[180px] truncate" title={msg.subject}>
                                  {msg.subject}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 max-w-[280px]">{msg.message}</p>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setMsgModal(msg)}
                                className="min-h-[38px] px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                              >
                                <Eye size={14} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: compact inquiry rows */}
                <div className="md:hidden divide-y divide-slate-100">
                  {pagedMessages.map((msg) => (
                    <button key={msg.id} onClick={() => setMsgModal(msg)} className="w-full text-left py-4 flex items-start gap-3">
                      <span className="w-9 h-9 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center shrink-0 text-xs">
                        {msg.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm truncate">{msg.name}</span>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                        </span>
                        {msg.subject && <span className="block text-xs font-bold text-emerald-700 truncate mt-0.5">{msg.subject}</span>}
                        <span className="block text-xs text-gray-500 line-clamp-1 mt-0.5">{msg.message}</span>
                      </span>
                      <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}

            <Pager
              page={safeMsgPage}
              total={msgFilteredCount}
              perPage={MESSAGES_PER_PAGE}
              onPage={setMsgPage}
              noun={msgFilteredCount === 1 ? 'message' : 'messages'}
            />
          </div>
                ) : tab === 'products' ? (
          /* ================= DENTAL PRODUCTS CRUD ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold">Dental Products &amp; Restorations Catalogue</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Single source of truth: Manage dynamic products, photos, warranty, pricing, and turnarounds</p>
              </div>
              <button
                onClick={openNewService}
                className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>

            {data.services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <Package size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">No dental products yet</p>
                <p className="text-xs text-slate-500 mt-1">Add items to display across Homepage, Products Catalogue, and Order forms.</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked card view */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {(data?.services ?? []).map((srv) => (
                    <div key={srv.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        {srv.imageUrl ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
                            <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package size={22} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-slate-400 font-bold">#{srv.displayOrder}</span>
                            <button
                              onClick={() => toggleServiceActive(srv)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                                srv.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {srv.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{srv.name}</h4>
                          {srv.nameBn && <p className="text-xs text-slate-500">{srv.nameBn}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {srv.category}
                            </span>
                            <span className="text-xs font-bold text-teal-700">
                              {priceLabel(srv.basePrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-500 block">Turnaround</span>
                          <span className="font-semibold text-slate-800">{srv.turnaroundDays} Days</span>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-500 block">Warranty</span>
                          <span className="font-semibold text-slate-800">{srv.warrantyYears} Yrs</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => openEditService(srv)}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteService(srv)}
                          disabled={deletingId === `service-${srv.id}`}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3">Order</th>
                      <th className="py-3 px-3">Photo</th>
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Lead Time</th>
                      <th className="py-3 px-3">Warranty</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(data?.services ?? []).map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-xs text-slate-400">{srv.displayOrder}</td>
                        <td className="py-3.5 px-3">
                          {srv.imageUrl ? (
                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
                              <img
                                src={srv.imageUrl}
                                alt={srv.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {srv.name}
                          {srv.nameBn && <span className="block text-xs font-normal text-slate-500">{srv.nameBn}</span>}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {srv.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-600">{srv.turnaroundDays} Days</td>
                        <td className="py-3.5 px-3 font-medium text-slate-600">{srv.warrantyYears} Yrs</td>
                        <td className="py-3.5 px-3 font-semibold text-teal-700">{priceLabel(srv.basePrice)}</td>
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => toggleServiceActive(srv)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                              srv.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {srv.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openEditService(srv)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Edit Product"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteService(srv)}
                            disabled={deletingId === `service-${srv.id}`}
                            className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        ) : tab === 'leads' ? (
          /* ================= TAB: DHAKA DENTAL LEADS (CNDL local pipeline) ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
                  <MapPin size={22} className="text-teal-700" /> Dhaka Dental Leads
                </h2>
                <p className="text-xs text-slate-500 mt-1">CNDL chamber pipeline — local-only (never pushed to GHL)</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-64 lg:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search chamber, doctor, area or phone..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-700/30 bg-slate-50"
                  />
                </div>
                {leadView === 'table' && (
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                  >
                    <option value="All">All Status</option>
                    {Object.entries(LEAD_STATUS_META).map(([k, m]) => (
                      <option key={k} value={k}>{m.label}</option>
                    ))}
                  </select>
                )}
                <div className="inline-flex self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Leads layout">
                  <button
                    onClick={() => setLeadView('table')}
                    aria-pressed={leadView === 'table'}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${leadView === 'table' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Table2 size={14} /> Table
                  </button>
                  <button
                    onClick={() => { setLeadView('board'); setLeadStatusFilter('All'); }}
                    aria-pressed={leadView === 'board'}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${leadView === 'board' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <LayoutGrid size={14} /> Stage Board
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const filtered = filteredLeads;
              if (!filtered.length) {
                return (
                  <div className="text-center py-16 text-slate-500">
                    <MapPin size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">{leads.length ? 'No chambers match this search/filter' : 'No CNDL leads yet — collect from the Telegram lead engine'}</p>
                  </div>
                );
              }
              const accountFor = (l: LeadRow) =>
                erpAccounts.find((a) => phoneCore(a.phone) && phoneCore(a.phone) === phoneCore(l.phone));
              const fmtAct = (iso: string) =>
                iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

              /* Append-only activity timeline (newest first) — Phase 3. */
              const leadTimeline = (l: LeadRow) =>
                (l.activityLog?.length ?? 0) > 0 ? (
                  <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Activity Timeline</p>
                    {[...l.activityLog].reverse().map((a, i) => (
                      <div key={`${a.at}-${i}`} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                        <span className="flex-1 leading-snug">{a.text}</span>
                        <span className="text-slate-400 whitespace-nowrap shrink-0">{fmtAct(a.at)}</span>
                      </div>
                    ))}
                  </div>
                ) : null;

              /* Shared note editor + timeline drawer (table + board). */
              const leadDrawer = (l: LeadRow) =>
                leadNoteKey === l.key ? (
                  <>
                    {leadTimeline(l)}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <textarea
                        value={leadNoteText}
                        onChange={(e) => setLeadNoteText(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Visit note — who met, sample given, pricing discussed, follow-up..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button onClick={() => { setLeadNoteKey(null); setLeadNoteText(''); }} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Cancel</button>
                        <button
                          onClick={saveLeadNote}
                          disabled={savingLeadNote}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
                        >
                          {savingLeadNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null;

              /* Phase 3: Convert-to-ledger control — deduped against existing accounts. */
              const convertControl = (l: LeadRow, compact = false) => {
                if (!l.phone || phoneCore(l.phone).length < 6) return null;
                const linked = accountFor(l);
                if (linked) {
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}
                      title={`Already in ledger: ${linked.name}`}
                    >
                      <Handshake size={12} /> In Ledger
                    </span>
                  );
                }
                const busy = convertingLeadKey === l.key;
                return (
                  <button
                    onClick={() => convertLeadToAccount(l)}
                    disabled={busy}
                    title="Create a client account in the Dues ledger"
                    className={`inline-flex items-center gap-1 rounded-lg text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 transition-colors ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}
                  >
                    <UserPlus size={12} /> {busy ? 'Converting…' : 'Convert'}
                  </button>
                );
              };

              /* Compact lead card — Stage Board (draggable) + mobile list. */
              const leadCard = (l: LeadRow, isBoard: boolean) => {
                const statusMeta = LEAD_STATUS_META[l.status] || { label: l.status || 'Unknown', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
                const activeStatus = LEAD_STATUS_META[l.status] ? l.status : 'new';
                const isNoteOpen = leadNoteKey === l.key;
                const isSaving = savingLeadKey === l.key;
                return (
                  <div
                    key={l.key}
                    draggable={isBoard && !isSaving}
                    onDragStart={(e) => {
                      setDragLeadKey(l.key);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', l.key);
                    }}
                    onDragEnd={() => {
                      setDragLeadKey(null);
                      setBoardDropCol(null);
                    }}
                    className={`rounded-xl border border-slate-200 bg-white p-3 transition-all ${
                      dragLeadKey === l.key ? 'opacity-40' : ''
                    } ${isBoard ? 'cursor-grab active:cursor-grabbing' : ''} hover:border-teal-400/60 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-start gap-1.5">
                        {isBoard && <GripVertical size={13} className="text-slate-300 shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <span className="font-bold text-sm truncate block">{l.name || 'Unnamed Chamber'}</span>
                          {l.contactName && (
                            <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              <Stethoscope size={11} className="text-teal-700 shrink-0" /> {l.contactName}
                            </span>
                          )}
                          {(l.area || l.address) && (
                            <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              <MapPin size={11} className="text-teal-700 shrink-0" /> {l.area || l.address}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0 ${statusMeta.cls}`}>{statusMeta.label}</span>
                    </div>
                    {l.phone && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-mono text-slate-600">{l.phone}</span>
                        <a
                          href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                        >
                          <PhoneCall size={11} /> Call
                        </a>
                        <a
                          href={waLeadLink(l.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                        >
                          <MessageSquare size={11} /> WhatsApp
                        </a>
                      </div>
                    )}
                    {l.lastActivityText && (
                      <p className="mt-1.5 text-[11px] text-slate-400 truncate" title={l.lastActivityText}>
                        Last: {l.lastActivityText}{l.lastActivityAt ? ` · ${fmtAct(l.lastActivityAt)}` : ''}
                      </p>
                    )}
                    {/* One-click status switcher (doubles as non-drag stage control) */}
                    <div
                      className={`mt-2 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 ${isSaving ? 'opacity-60' : ''}`}
                      role="group"
                      aria-label={`Update status for ${l.name || 'chamber'}`}
                    >
                      {Object.entries(LEAD_STATUS_META).map(([k, m]) => {
                        const active = activeStatus === k;
                        return (
                          <button
                            key={k}
                            onClick={() => {
                              if (!active && !isSaving) updateLead(l.key, { status: k });
                            }}
                            disabled={isSaving}
                            aria-pressed={active}
                            title={`Mark as ${m.label}`}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                              active
                                ? LEAD_PILL_META[k] || 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {convertControl(l, true)}
                      <button
                        onClick={() => {
                          setLeadNoteKey(isNoteOpen ? null : l.key);
                          setLeadNoteText(isNoteOpen ? '' : l.visitNotes || '');
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${isNoteOpen ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <Pencil size={11} /> {isNoteOpen ? 'Close' : 'Note'}
                      </button>
                      {isSaving && <span className="text-[11px] font-semibold text-slate-400 animate-pulse">Saving…</span>}
                    </div>
                    {leadDrawer(l)}
                  </div>
                );
              };

              /* ================= TABLE VIEW ================= */
              const tableView = (
                <div>
                  <div className="hidden md:block overflow-x-auto rounded-xl">
                    <table className="w-full text-left tabular-nums">
                      <thead>
                        <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="pb-4 pr-4">Chamber</th>
                          <th className="pb-4 pr-4">Phone</th>
                          <th className="pb-4 pr-4">Stage</th>
                          <th className="pb-4 pr-4">Last Activity</th>
                          <th className="pb-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedLeads.map((l) => {
                          const activeStatus = LEAD_STATUS_META[l.status] ? l.status : 'new';
                          const isNoteOpen = leadNoteKey === l.key;
                          const isSaving = savingLeadKey === l.key;
                          return (
                            [
                              <tr key={l.key} className={`align-top hover:bg-slate-50/80 transition-colors ${isNoteOpen ? 'bg-teal-50/40' : ''}`}>
                                <td className="py-3.5 pr-4">
                                  <div className="font-bold text-sm">{l.name || 'Unnamed Chamber'}</div>
                                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                    {l.contactName && <span className="inline-flex items-center gap-1"><Stethoscope size={11} className="text-teal-700" /> {l.contactName}</span>}
                                    {(l.area || l.address) && <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-teal-700" /> {l.area || l.address}</span>}
                                    {l.facebook && (
                                      <a href={l.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                                        <Activity size={11} /> FB Page
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  {l.phone ? (
                                    <div className="flex flex-col gap-1.5">
                                      <span className="text-xs font-mono text-slate-700">{l.phone}</span>
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}
                                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors inline-flex items-center gap-1"
                                        >
                                          <PhoneCall size={11} /> Call
                                        </a>
                                        <a
                                          href={waLeadLink(l.phone)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                                        >
                                          <MessageSquare size={11} /> WhatsApp
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div
                                    className={`inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 ${isSaving ? 'opacity-60' : ''}`}
                                    role="group"
                                    aria-label={`Update status for ${l.name || 'chamber'}`}
                                  >
                                    {Object.entries(LEAD_STATUS_META).map(([k, m]) => {
                                      const active = activeStatus === k;
                                      return (
                                        <button
                                          key={k}
                                          onClick={() => {
                                            if (!active && !isSaving) updateLead(l.key, { status: k });
                                          }}
                                          disabled={isSaving}
                                          aria-pressed={active}
                                          title={`Mark as ${m.label}`}
                                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                            active
                                              ? LEAD_PILL_META[k] || 'bg-slate-700 text-white shadow-sm'
                                              : 'text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer'
                                          }`}
                                        >
                                          {m.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  {l.lastActivityText ? (
                                    <div className="text-xs text-slate-600 max-w-[220px]">
                                      <p className="leading-snug line-clamp-2" title={l.lastActivityText}>{l.lastActivityText}</p>
                                      <p className="text-slate-400 mt-0.5">
                                        {fmtAct(l.lastActivityAt)} · {l.activityLog?.length ?? 0} event{(l.activityLog?.length ?? 0) === 1 ? '' : 's'}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                    {convertControl(l)}
                                    <button
                                      onClick={() => {
                                        setLeadNoteKey(isNoteOpen ? null : l.key);
                                        setLeadNoteText(isNoteOpen ? '' : l.visitNotes || '');
                                      }}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${isNoteOpen ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                      <Pencil size={12} /> {isNoteOpen ? 'Close' : 'Note'}
                                    </button>
                                    {isSaving && <span className="text-[11px] font-semibold text-slate-400 animate-pulse">Saving…</span>}
                                  </div>
                                </td>
                              </tr>,
                              isNoteOpen && (
                                <tr key={`${l.key}-drawer`} className="bg-teal-50/40">
                                  <td colSpan={5} className="px-4 py-3 border-t border-slate-100">
                                    {leadDrawer(l)}
                                  </td>
                                </tr>
                              ),
                            ]
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile: compact lead cards */}
                  <div className="md:hidden space-y-3">
                    {pagedLeads.map((l) => leadCard(l, false))}
                  </div>
                <Pager
                  page={leadPage}
                  total={filteredLeads.length}
                  perPage={LEADS_PER_PAGE}
                  onPage={setLeadPage}
                  noun={filteredLeads.length === 1 ? 'lead' : 'leads'}
                />
                </div>
              );

              /* ================= STAGE BOARD (KANBAN) ================= */
              const boardView = (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
                  {Object.entries(LEAD_STATUS_META).map(([colKey, meta]) => {
                    const colLeads = filtered.filter((l) => (LEAD_STATUS_META[l.status] ? l.status : 'new') === colKey);
                    const isOver = boardDropCol === colKey && !!dragLeadKey;
                    const dotCls = colKey === 'new' ? 'bg-sky-500' : colKey === 'visited' ? 'bg-amber-400' : colKey === 'sample_given' ? 'bg-slate-500' : 'bg-emerald-500';
                    return (
                      <div
                        key={colKey}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDragEnter={() => { if (dragLeadKey) setBoardDropCol(colKey); }}
                        onDragLeave={() => { setBoardDropCol((c) => (c === colKey ? null : c)); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const key = dragLeadKey || e.dataTransfer.getData('text/plain');
                          setBoardDropCol(null);
                          setDragLeadKey(null);
                          const ld = leads.find((x) => x.key === key);
                          if (ld && (LEAD_STATUS_META[ld.status] ? ld.status : 'new') !== colKey) updateLead(key, { status: colKey });
                        }}
                        className={`rounded-2xl border p-3 min-h-[240px] transition-colors ${isOver ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-600/20' : 'border-slate-200 bg-slate-50/70'}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                            <span className={`w-2 h-2 rounded-full ${dotCls}`} />
                            {meta.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-500">{colLeads.length}</span>
                        </div>
                        <div className="space-y-2.5">
                          {colLeads.map((l) => leadCard(l, true))}
                        </div>
                        {colLeads.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                            <Inbox size={22} />
                            <p className="text-[11px] font-bold mt-1.5 text-slate-400">Drop cards here</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );

              return leadView === 'board' ? boardView : tableView;
            })()}
          </div>
        ) : tab === 'blogs' ? (
          /* ================= TAB 3: BLOG ARTICLES ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-2xl font-semibold">Blog Articles</h2>
              <button
                onClick={() => setBlogModal(true)}
                className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <Plus size={16} /> Write New Article
              </button>
            </div>

            {data.blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <FileText size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">No articles yet</p>
                <p className="text-xs text-slate-500 mt-1">Published articles appear on the public blog.</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked card view */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {(data?.blogs ?? []).map((blog) => (
                    <div key={blog.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        <Image
                          src={blog.image}
                          alt=""
                          width={60}
                          height={60}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-2.5 py-0.5 text-[11px] font-bold">
                            {blog.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug line-clamp-2" title={blog.title}>
                            {blog.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">/blog/{blog.slug}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(blog.publishedAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => openEditBlog(blog)}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteBlog(blog)}
                          disabled={deletingId === `blog-${blog.id}`}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left tabular-nums">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="pb-4 pr-4">Thumbnail</th>
                      <th className="pb-4 pr-4">Title</th>
                      <th className="pb-4 pr-4">Category</th>
                      <th className="pb-4 pr-4">Published</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.blogs ?? []).map((blog) => (
                      <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 pr-4">
                          <Image
                            src={blog.image}
                            alt=""
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-bold text-sm max-w-[320px] truncate" title={blog.title}>{blog.title}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[320px]" title={blog.slug}>/blog/{blog.slug}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-3 py-1 text-[11px] font-bold whitespace-nowrap">
                            {blog.category}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(blog.publishedAt)}</td>
                        <td className="py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditBlog(blog)}
                              aria-label={`Edit ${blog.title}`}
                              title="Edit article"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => deleteBlog(blog)}
                              disabled={deletingId === `blog-${blog.id}`}
                              aria-label={`Delete ${blog.title}`}
                              title="Delete article"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        ) : tab === 'dues' ? (
          /* ================= CLIENT DUES & LEDGER ================= */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Client Dues &amp; Ledger</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Track chamber, partner-lab &amp; chairman channel balances, invoices and collections</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Accounts / Collection Log view toggle */}
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        onClick={() => setDuesView('accounts')}
                        className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-colors ${duesView === 'accounts' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Client Accounts
                      </button>
                      <button
                        onClick={() => setDuesView('collections')}
                        className={`min-h-[36px] px-3.5 rounded-lg text-xs font-bold transition-colors ${duesView === 'collections' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Collection Log
                      </button>
                    </div>
                    {duesView === 'accounts' && (
                      <button
                        onClick={openNewAccount}
                        className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                      >
                        <Plus size={16} /> Add Client Account
                      </button>
                    )}
                  </div>
                </div>

                {duesView === 'collections' ? (
                  <>
                    {/* Phase 2: date-range + method filters */}
                    <div className="flex flex-wrap items-end gap-2.5 mb-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">From</label>
                        <input
                          type="date"
                          value={collFrom}
                          onChange={(e) => setCollFrom(e.target.value)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">To</label>
                        <input
                          type="date"
                          value={collTo}
                          onChange={(e) => setCollTo(e.target.value)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Method</label>
                        <select
                          value={collMethod}
                          onChange={(e) => setCollMethod(e.target.value)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        >
                          <option value="ALL">All Methods</option>
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      {(collFrom || collTo || collMethod !== 'ALL') && (
                        <button
                          onClick={() => { setCollFrom(''); setCollTo(''); setCollMethod('ALL'); }}
                          className="min-h-[36px] px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </div>
                    {filteredCollections.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3.5 py-1.5 text-xs font-semibold">
                          <Wallet size={13} /> {filteredCollections.length} collection{filteredCollections.length === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3.5 py-1.5 text-xs font-semibold">
                          Total: {formatBDT(filteredCollections.reduce((s, e) => s + (e.netAmount || 0), 0))}
                        </span>
                      </div>
                    )}

                    {/* Desktop: collection log table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl">
                      <table className="w-full text-left tabular-nums">
                        <thead>
                          <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="pb-4 pr-4">Date &amp; Time</th>
                            <th className="pb-4 pr-4">Clinic</th>
                            <th className="pb-4 pr-4">Amount Collected</th>
                            <th className="pb-4 pr-4">Method</th>
                            <th className="pb-4 pr-4">Collected By</th>
                            <th className="pb-4">Verified</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCollections.map((e) => {
                            const acc = erpAccounts.find((a) => a.id === e.clientAccountId);
                            return (
                              <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 pr-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                  {formatDate(e.paymentDate || e.createdAt)}
                                  {e.paymentDate && new Date(e.paymentDate).getTime() !== new Date(e.createdAt).getTime() && (
                                    <span className="ml-1.5 rounded-full bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[11px] font-medium" title="Backdated entry">backdated</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div className="font-bold text-sm">{acc?.name || 'Client account'}</div>
                                  {e.orderId && <div className="text-[11px] text-slate-500">Case {e.orderId}</div>}
                                </td>
                                <td className="py-3.5 pr-4 font-semibold text-emerald-600 whitespace-nowrap">+{formatBDT(e.netAmount)}</td>
                                <td className="py-3.5 pr-4">
                                  {e.paymentMethod ? (
                                    <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 text-teal-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">{e.paymentMethod}</span>
                                  ) : (
                                    <span className="text-xs text-slate-500">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4 text-sm text-slate-600 whitespace-nowrap">{(e.collectedById && collectedByMap[e.collectedById]) || '—'}</td>
                                <td className="py-3.5">
                                  {e.isVerified ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap"><BadgeCheck size={12} /> Verified</span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {filteredCollections.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                            <Wallet size={28} />
                          </span>
                          <p className="text-sm font-bold text-gray-500">{collectionRows.length > 0 ? 'No collections match these filters' : 'No collections recorded yet'}</p>
                          <p className="text-xs text-slate-500 mt-1">{collectionRows.length > 0 ? 'Widen the date range or switch the method filter.' : 'Record a payment from the Client Accounts view to build the log.'}</p>
                        </div>
                      )}
                    </div>

                    {/* Mobile: collection rows */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {filteredCollections.map((e) => {
                        const acc = erpAccounts.find((a) => a.id === e.clientAccountId);
                        return (
                          <div key={e.id} className="py-3.5 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-sm truncate">{acc?.name || 'Client account'}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{formatDate(e.paymentDate || e.createdAt)}{e.paymentMethod ? ` · ${e.paymentMethod}` : ''}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {(e.collectedById && collectedByMap[e.collectedById]) || 'Unattributed'}
                                {e.isVerified ? ' · Verified' : ' · Pending verification'}
                              </div>
                            </div>
                            <span className="font-semibold text-emerald-600 whitespace-nowrap text-sm">+{formatBDT(e.netAmount)}</span>
                          </div>
                        );
                      })}
                      {filteredCollections.length === 0 && (
                        <p className="text-center text-sm text-slate-500 py-10">
                          {collectionRows.length > 0 ? 'No collections match these filters.' : 'No collections recorded yet.'}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                <>
                {/* Division & Agent filter toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                  <div className="flex items-center overflow-x-auto no-scrollbar py-1 gap-1.5 flex-nowrap -mx-2 px-2 sm:mx-0 sm:px-0">
                    <button
                      onClick={() => setDivisionFilter('ALL')}
                      className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${divisionFilter === 'ALL' ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
                    >
                      All
                    </button>
                    {DIVISIONS.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDivisionFilter(d.key)}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${divisionFilter === d.key ? 'bg-white text-teal-700 shadow-sm border border-teal-700/20' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
                      >
                        {d.bn ? `${d.label} (${d.bn})` : d.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full lg:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={accSearch}
                      onChange={(e) => setAccSearch(e.target.value)}
                      placeholder="Search account, owner, phone, district…"
                      className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="lg:ml-auto min-h-[36px] px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20 max-w-[220px]"
                  >
                    <option value="ALL">All Agents</option>
                    <option value="UNASSIGNED">Unassigned</option>
                    {agentList.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Desktop: accounts table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Account</th>
                        <th className="pb-4 pr-4 hidden 2xl:table-cell">Institution</th>
                        <th className="pb-4 pr-4">Owner / Phone</th>
                        <th className="pb-4 pr-4">Division / Area</th>
                        <th className="pb-4 pr-4">Assigned Agent</th>
                        <th className="pb-4 pr-4">Current Due (BDT)</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedAccounts.map((acc) => {
                        const instMeta = INSTITUTION_TYPE_META[acc.institutionType] || INSTITUTION_TYPE_META.CHAMBER;
                        const aging = agingBadge(acc);
                        return (
                          <tr key={acc.id} className="align-top hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="font-bold text-sm min-w-[160px]">{acc.name}</div>
                              {acc.customDiscountNote && (
                                <div className="text-[11px] text-slate-500 max-w-[180px] truncate" title={acc.customDiscountNote}>
                                  {acc.customDiscountNote}
                                </div>
                              )}
                            </td>
                            <td className="py-4 pr-4 hidden 2xl:table-cell">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap ${instMeta.cls}`}>
                                {instMeta.label}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="text-sm font-medium text-slate-800 whitespace-nowrap">{acc.ownerName}</div>
                              <div className="text-xs text-slate-500 whitespace-nowrap">{acc.phone}</div>
                            </td>
                            <td className="py-4 pr-4">
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                {DIVISION_LABEL[acc.division || 'DHAKA'] || acc.division}{acc.district ? ` — ${acc.district}` : ''}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              {acc.assignedAgentName ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 whitespace-nowrap">
                                  <User size={11} /> {acc.assignedAgentName}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-4 pr-4 whitespace-nowrap">
                              <div className={`font-semibold ${acc.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatBDT(acc.currentBalance)}
                              </div>
                              {aging && (
                                <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${aging.cls}`}>
                                  <Clock size={10} /> {aging.label}
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                {me?.role === 'SUPERADMIN' && (
                                  <button
                                    onClick={() => openEditAccount(acc)}
                                    aria-label={`Edit ${acc.name}`}
                                    title="Edit account / re-assign agent"
                                    className="min-h-[40px] w-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                )}
                                {acc.currentBalance > 0 ? (
                                  <a
                                    href={whatsappReminderHref(acc)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`WhatsApp due reminder to ${acc.name}`}
                                    title="Send Bengali due reminder on WhatsApp"
                                    className="min-h-[40px] w-10 inline-flex items-center justify-center rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 text-[#1a8f4a] hover:bg-[#25D366]/20 transition-colors"
                                  >
                                    <MessageSquare size={14} />
                                  </a>
                                ) : (
                                  <span aria-hidden="true" className="w-10 shrink-0" />
                                )}
                                <button
                                  onClick={() => openInvoiceModal(acc)}
                                  className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors whitespace-nowrap"
                                >
                                  <Plus size={13} /> Invoice
                                </button>
                                <button
                                  onClick={() => openPaymentModal(acc)}
                                  className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                                >
                                  <Check size={13} /> Collection
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredAccounts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Landmark size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">
                        {visibleAccounts.length === 0 ? 'No client accounts yet' : 'No accounts match these filters'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {visibleAccounts.length === 0
                          ? 'Add chambers, partner labs or chairman channel accounts to start billing.'
                          : 'Try another division or agent — or switch to the All tab.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile: account cards */}
                <div className="md:hidden space-y-4">
                  {pagedAccounts.map((acc) => {
                    const instMeta = INSTITUTION_TYPE_META[acc.institutionType] || INSTITUTION_TYPE_META.CHAMBER;
                    const aging = agingBadge(acc);
                    return (
                      <div key={acc.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{acc.name}</div>
                            <div className="text-xs text-gray-500 truncate">Owner: {acc.ownerName}</div>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 ${instMeta.cls}`}>
                            {instMeta.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1"><Phone size={12} /> {acc.phone}</span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                            {DIVISION_LABEL[acc.division || 'DHAKA'] || acc.division}{acc.district ? ` — ${acc.district}` : ''}
                          </span>
                          <span>Agent: {acc.assignedAgentName || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-500">Current Due</span>
                          <span className="flex items-center gap-2">
                            {aging && (
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${aging.cls}`}>
                                <Clock size={10} /> {aging.label}
                              </span>
                            )}
                            <span className={`font-semibold ${acc.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatBDT(acc.currentBalance)}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openInvoiceModal(acc)}
                            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-700/30 text-xs font-bold text-teal-700 hover:bg-teal-700/5 transition-colors"
                          >
                            <Plus size={13} /> Invoice
                          </button>
                          <button
                            onClick={() => openPaymentModal(acc)}
                            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Check size={13} /> Collection
                          </button>
                          {acc.currentBalance > 0 && (
                            <a
                              href={whatsappReminderHref(acc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-xs font-bold text-[#1a8f4a] hover:bg-[#25D366]/20 transition-colors"
                            >
                              <MessageSquare size={13} /> Reminder
                            </a>
                          )}
                          {me?.role === 'SUPERADMIN' && (
                            <button
                              onClick={() => openEditAccount(acc)}
                              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredAccounts.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">
                      {visibleAccounts.length === 0 ? 'No client accounts yet.' : 'No accounts match these filters.'}
                    </p>
                  )}
                </div>

                <Pager
                  page={accPage}
                  total={filteredAccounts.length}
                  perPage={ACCOUNTS_PER_PAGE}
                  onPage={setAccPage}
                  noun={filteredAccounts.length === 1 ? 'account' : 'accounts'}
                />
                </>
                )}
              </div>
            ) : tab === 'users' ? (
              /* ---------- USER MANAGEMENT ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold text-slate-900">Team &amp; Staff Management (ল্যাব টিম ও কর্মী ব্যবস্থাপনা)</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage internal lab employees, leadership, and field collection agents. For clinics, chambers &amp; partner labs, visit Client Dues &amp; Ledger.</p>
                  </div>
                  <button
                    onClick={openNewUser}
                    className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                  >
                    <Plus size={16} /> Add New User
                  </button>
                </div>

                {/* Department metrics strip — Internal Personnel Only */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Leadership & Exec', value: leadershipCount, icon: Landmark, cls: 'bg-amber-50 text-amber-600', sub: 'SuperAdmin & Chairman' },
                    { label: 'Finance & Accounts', value: accountsUsers, icon: Receipt, cls: 'bg-emerald-50 text-emerald-600', sub: 'Billing & Ledgers' },
                    { label: 'Field Agents', value: agentList.length, icon: Phone, cls: 'bg-teal-50 text-teal-700', sub: 'Chamber Collectors' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3.5">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}>
                        <m.icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xl font-semibold text-slate-900 tracking-tight leading-tight">{m.value}</span>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight line-clamp-2">{m.label}</span>
                        <span className="block text-xs text-slate-500">{m.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Segmented role filter + instant search */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 w-fit max-w-full overflow-x-auto">
                    {([{ key: 'all' as UserGroupKey, label: 'All Team' }, ...USER_GROUPS.map((g) => ({ key: g.key as UserGroupKey, label: g.label }))]).map((g) => (
                      <button
                        key={g.key}
                        onClick={() => setUserRoleFilter(g.key)}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                          userRoleFilter === g.key
                            ? 'bg-white text-teal-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {g.label}
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                            userRoleFilter === g.key ? 'bg-teal-700/10 text-teal-700' : 'bg-slate-200/80 text-slate-500'
                          }`}
                        >
                          {userGroupCount(g.key)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full lg:w-72 shrink-0">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, phone, email, address..."
                      className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-gray-600 hover:bg-slate-100"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Agent Performance — visible when the Field Agents segment is active */}
                {userRoleFilter === 'agents' && (
                  <div className="mb-6 space-y-4">
                    {/* Metrics bar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Cases Brought', value: String(agentTotals.cases), icon: ClipboardList, cls: 'bg-teal-50 text-teal-700' },
                        { label: 'Sales Volume', value: formatBDT(agentTotals.sales), icon: Receipt, cls: 'bg-sky-50 text-sky-700' },
                        { label: 'Cash Collected', value: formatBDT(agentTotals.collected), icon: Wallet, cls: 'bg-emerald-50 text-emerald-700' },
                        { label: 'Pending Commission', value: formatBDT(agentTotals.pending), icon: Landmark, cls: 'bg-rose-50 text-rose-600' },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}>
                            <m.icon size={17} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-base sm:text-lg font-semibold tracking-tight leading-tight truncate">{m.value}</span>
                            <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight line-clamp-2">{m.label}</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Per-agent breakdown + payout action */}
                    {/* Mobile: stacked card view */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                      {agentMetrics.map((m) => (
                        <div key={m.agent.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm">{m.agent.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{m.agent.phone || 'No phone'}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 whitespace-nowrap">
                              {m.cases} cases
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Sales Volume</span>
                              <span className="font-semibold text-slate-800">{formatBDT(m.sales)}</span>
                            </div>
                            <div>
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Cash Collected</span>
                              <span className="font-bold text-emerald-600">{formatBDT(m.collected)}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Commission Earned</span>
                              <span className="font-semibold text-slate-800">{formatBDT(m.earned)}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-[11px] uppercase font-bold text-slate-500 block">Pending Payout</span>
                              <span className={`font-semibold ${m.pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatBDT(m.pending)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-1 border-t border-slate-100">
                            <button
                              onClick={() => openPayoutModal(m.agent)}
                              disabled={m.pending <= 0}
                              className="min-h-[40px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors disabled:opacity-40 disabled:hover:bg-teal-700"
                            >
                              Record Payout
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: table view */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left tabular-nums">
                        <thead>
                          <tr className="text-[11px] uppercase font-semibold border-b text-slate-500 bg-slate-50/60">
                            <th className="px-4 py-3 pr-4">Agent</th>
                            <th className="px-2 py-3 pr-4">Cases</th>
                            <th className="px-2 py-3 pr-4">Sales (৳)</th>
                            <th className="px-2 py-3 pr-4">Collected (৳)</th>
                            <th className="px-2 py-3 pr-4">Earned (৳)</th>
                            <th className="px-2 py-3 pr-4">Withdrawn (৳)</th>
                            <th className="px-2 py-3 pr-4">Pending Commission</th>
                            <th className="px-2 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {agentMetrics.map((m) => (
                            <tr key={m.agent.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 pr-4">
                                <div className="font-bold text-sm">{m.agent.name}</div>
                                <div className="text-xs text-slate-500">{m.agent.phone || '—'}</div>
                              </td>
                              <td className="px-2 py-3 pr-4 text-sm font-bold">{m.cases}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold">{formatBDT(m.sales)}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold text-emerald-600">{formatBDT(m.collected)}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold">{formatBDT(m.earned)}</td>
                              <td className="px-2 py-3 pr-4 text-sm font-semibold text-slate-500">{formatBDT(m.withdrawn)}</td>
                              <td className={`px-2 py-3 pr-4 text-sm font-semibold ${m.pending > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {formatBDT(m.pending)}
                              </td>
                              <td className="px-2 py-3 text-right">
                                <button
                                  onClick={() => openPayoutModal(m.agent)}
                                  className="min-h-[36px] px-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
                                >
                                  <Plus size={13} /> Pay Commission
                                </button>
                              </td>
                            </tr>
                          ))}
                          {agentMetrics.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No active agents.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Desktop: users table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">User</th>
                        <th className="pb-4 pr-4">Phone</th>
                        <th className="pb-4 pr-4">Email</th>
                        <th className="pb-4 pr-4">Role</th>
                        <th className="pb-4 pr-4">Status</th>
                        <th className="pb-4 pr-4">Current Address</th>
                        <th className="pb-4 pr-4">Registered</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const roleMeta = ROLE_META[u.role] || ROLE_META.DOCTOR;
                        const isSelf = me?.uid === u.id;
                        return (
                          <tr key={u.id} className="align-top hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 font-semibold text-xs flex items-center justify-center shrink-0">
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-bold text-sm">
                                  {u.name}
                                  {isSelf && <span className="ml-1.5 text-[11px] font-bold text-slate-500">(you)</span>}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-sm">{u.phone}</td>
                            <td className="py-4 pr-4 text-sm text-gray-500 max-w-[180px] truncate" title={u.email || ''}>{u.email || '—'}</td>
                            <td className="py-4 pr-4">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap ${roleMeta.cls}`}>
                                {roleMeta.label}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-xs text-gray-500 max-w-[200px] truncate" title={u.address || ''}>{u.address || '—'}</td>
                            <td className="py-4 pr-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                            <td className="py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => openEditUser(u)}
                                  aria-label={`Edit ${u.name}`}
                                  title="Edit user"
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => deleteUser(u)}
                                  disabled={deletingId === `user-${u.id}`}
                                  aria-label={`Delete ${u.name}`}
                                  title={isSelf ? 'You cannot delete your own active account' : 'Delete user'}
                                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Users size={28} />
                      </span>
                      {erpUsers.length === 0 ? (
                        <>
                          <p className="text-sm font-bold text-gray-500">No users registered yet</p>
                          <p className="text-xs text-slate-500 mt-1">Add your team — chairman, accounts, collection agents, partner labs and doctors.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-gray-500">No users match your filter</p>
                          <p className="text-xs text-slate-500 mt-1">Try a different role group or clear the search query.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile: user cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const roleMeta = ROLE_META[u.role] || ROLE_META.DOCTOR;
                    const isSelf = me?.uid === u.id;
                    return (
                      <div key={u.id} className="py-4 flex items-start gap-3">
                        <span className="w-10 h-10 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center shrink-0 text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm truncate">
                              {u.name}{isSelf && <span className="ml-1 text-[11px] font-bold text-slate-500">(you)</span>}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 ${roleMeta.cls}`}>
                              {roleMeta.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{u.phone}{u.email ? ` · ${u.email}` : ''}</div>
                          {u.address && <div className="text-xs text-slate-500 truncate mt-0.5">{u.address}</div>}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => openEditUser(u)}
                              className="min-h-[38px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-700/5 transition-colors"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              onClick={() => deleteUser(u)}
                              disabled={deletingId === `user-${u.id}`}
                              className="min-h-[38px] px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">
                      {erpUsers.length === 0 ? 'No users registered yet.' : 'No users match your filter or search.'}
                    </p>
                  )}
                </div>
              </div>
            ) : tab === 'expenses' ? (
              /* ---------- DAILY EXPENSES ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Daily Expenses</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Track raw materials, logistics, utilities &amp; maintenance spending</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {me?.role === 'SUPERADMIN' && (
                      <button
                        onClick={openAuditHistory}
                        className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                      >
                        <ClipboardList size={15} /> Audit History
                      </button>
                    )}
                    <button
                      onClick={openNewExpense}
                      className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus size={16} /> Log Expense
                    </button>
                  </div>
                </div>

                {/* Phase 2: audit filters — text search + category + month */}
                <div className="flex flex-wrap items-end gap-2.5 mb-4">
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={expSearch}
                      onChange={(e) => setExpSearch(e.target.value)}
                      placeholder="Search title, notes, voucher…"
                      className="w-full min-h-[36px] pl-9 pr-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                    <select
                      value={expCat}
                      onChange={(e) => setExpCat(e.target.value)}
                      className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="ALL">All Categories</option>
                      {Object.entries(EXPENSE_CATEGORY_META).map(([k, m]) => (
                        <option key={k} value={k}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Month</label>
                    <select
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      className="min-h-[36px] px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="ALL">All Months</option>
                      {expenseMonthOptions.map((ym) => (
                        <option key={ym} value={ym}>
                          {new Date(`${ym}-01T00:00:00`).toLocaleString('en-GB', { month: 'short', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(expSearch || expCat !== 'ALL' || expMonth !== 'ALL') && (
                    <button
                      onClick={() => { setExpSearch(''); setExpCat('ALL'); setExpMonth('ALL'); }}
                      className="min-h-[36px] px-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>

                {/* Desktop: expenses table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Date</th>
                        <th className="pb-4 pr-4">Voucher No</th>
                        <th className="pb-4 pr-4">Category</th>
                        <th className="pb-4 pr-4">Title</th>
                        <th className="pb-4 pr-4">Amount (BDT)</th>
                        <th className="pb-4 pr-4">Notes</th>
                        {me?.role === 'SUPERADMIN' && <th className="pb-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedExpenses.map((x) => {
                        const catMeta = EXPENSE_CATEGORY_META[x.category] || EXPENSE_CATEGORY_META.OTHER;
                        return (
                          <tr key={x.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 pr-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-teal-700" /> {formatDate(x.expenseDate)}</span>
                            </td>
                            <td className="py-3.5 pr-4 text-sm font-mono text-xs">{x.voucherNo || '—'}</td>
                            <td className="py-3.5 pr-4">
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold whitespace-nowrap ${catMeta.cls}`}>
                                {catMeta.label}
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 font-bold text-sm">{x.title}</td>
                            <td className="py-3.5 pr-4 font-semibold text-rose-600 whitespace-nowrap">{formatBDT(x.amount)}</td>
                            <td className="py-3.5 pr-4 text-xs text-gray-500 max-w-[240px] truncate" title={x.notes || ''}>{x.notes || '—'}</td>
                            {me?.role === 'SUPERADMIN' && (
                              <td className="py-3.5 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditExpense(x)}
                                    aria-label={`Edit ${x.title}`}
                                    title="Edit expense"
                                    className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => deleteExpense(x)}
                                    disabled={deletingId === `expense-${x.id}`}
                                    aria-label={`Delete ${x.title}`}
                                    title="Delete expense"
                                    className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredExpenses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Receipt size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">{erpExpenses.length > 0 ? 'No expenses match these filters' : 'No expenses logged yet'}</p>
                      <p className="text-xs text-slate-500 mt-1">{erpExpenses.length > 0 ? 'Try another keyword, category or month.' : 'Log daily spending to keep the ledger clean.'}</p>
                    </div>
                  )}
                </div>

                {/* Mobile: expense rows */}
                <div className="md:hidden divide-y divide-slate-100">
                  {pagedExpenses.map((x) => {
                    const catMeta = EXPENSE_CATEGORY_META[x.category] || EXPENSE_CATEGORY_META.OTHER;
                    return (
                      <div key={x.id} className="py-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm truncate">{x.title}</span>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${catMeta.cls}`}>{catMeta.label}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-600 mt-0.5">
                            <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {formatDate(x.expenseDate)}</span>
                            {x.voucherNo ? ` · Voucher ${x.voucherNo}` : ''}
                          </div>
                          {x.notes && <div className="text-xs text-gray-500 truncate mt-0.5">{x.notes}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="font-semibold text-rose-600 whitespace-nowrap text-sm">{formatBDT(x.amount)}</span>
                          {me?.role === 'SUPERADMIN' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditExpense(x)}
                                aria-label={`Edit ${x.title}`}
                                className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => deleteExpense(x)}
                                disabled={deletingId === `expense-${x.id}`}
                                aria-label={`Delete ${x.title}`}
                                className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredExpenses.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">
                      {erpExpenses.length > 0 ? 'No expenses match these filters.' : 'No expenses logged yet.'}
                    </p>
                  )}
                </div>
                <Pager
                  page={expPage}
                  total={filteredExpenses.length}
                  perPage={EXPENSES_PER_PAGE}
                  onPage={setExpPage}
                  noun={filteredExpenses.length === 1 ? 'expense' : 'expenses'}
                />
              </div>
            ) : tab === 'capex' ? (
              /* ---------- MACHINERY & CAPEX ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Machinery &amp; CapEx</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Capital assets — Roland DWX-52Di, UP3D and other lab machinery</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCapex(null);
                      setCapexForm(EMPTY_CAPEX_FORM);
                      setCapexModal(true);
                    }}
                    className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                  >
                    <Plus size={16} /> Add Machine Asset
                  </button>
                </div>

                {/* Desktop: assets table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Machine Name</th>
                        <th className="pb-4 pr-4">Cost (BDT)</th>
                        <th className="pb-4 pr-4">Purchase Date</th>
                        <th className="pb-4 pr-4">Status</th>
                        <th className="pb-4 pr-4">Notes</th>
                        {me?.role === 'SUPERADMIN' && <th className="pb-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {erpAssets.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-sm">{a.machineName}</td>
                          <td className="py-3.5 pr-4 font-semibold text-teal-700 whitespace-nowrap">{formatBDT(a.purchaseCost)}</td>
                          <td className="py-3.5 pr-4 text-xs text-gray-500 whitespace-nowrap">{a.purchaseDate ? formatDate(a.purchaseDate).split(',')[0] : '—'}</td>
                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${ASSET_STATUS_META[a.status] || ASSET_STATUS_META.OPERATIONAL}`}>
                              {a.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-xs text-gray-500 max-w-[260px] truncate" title={a.notes || ''}>{a.notes || '—'}</td>
                          {me?.role === 'SUPERADMIN' && (
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openEditCapex(a)}
                                  aria-label={`Edit ${a.machineName}`}
                                  title="Edit machine"
                                  className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => deleteCapex(a)}
                                  disabled={deletingId === `capex-${a.id}`}
                                  aria-label={`Delete ${a.machineName}`}
                                  title="Delete machine"
                                  className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {erpAssets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Cog size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">No machines registered yet</p>
                      <p className="text-xs text-slate-500 mt-1">Add milling machines, furnaces and other capital assets.</p>
                    </div>
                  )}
                </div>

                {/* Mobile: asset cards */}
                <div className="md:hidden space-y-3">
                  {erpAssets.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm truncate">{a.machineName}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${ASSET_STATUS_META[a.status] || ASSET_STATUS_META.OPERATIONAL}`}>
                          {a.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-slate-500">{a.purchaseDate ? formatDate(a.purchaseDate).split(',')[0] : 'No purchase date'}</span>
                        <span className="font-semibold text-teal-700">{formatBDT(a.purchaseCost)}</span>
                      </div>
                      {a.notes && <p className="text-xs text-gray-500 mt-1.5 truncate">{a.notes}</p>}
                      {me?.role === 'SUPERADMIN' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => openEditCapex(a)}
                            className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => deleteCapex(a)}
                            disabled={deletingId === `capex-${a.id}`}
                            className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {erpAssets.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">No machines registered yet.</p>
                  )}
                </div>
              </div>
            ) : tab === 'shareholders' ? (
              /* ---------- SHAREHOLDERS & DIVIDENDS (100 SHARES) ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                {/* ===== Shareholder Equity Registry ===== */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Shareholder Equity Registry</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Ownership register — the lab is capitalized in {TOTAL_SHARES} shares</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal-700/10 text-teal-700 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap">
                      <PieChart size={13} /> {allocatedShares}/{TOTAL_SHARES} Allocated
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${unallocatedShares > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {unallocatedShares} Unallocated
                    </span>
                    <button
                      onClick={openNewShareholder}
                      className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      <Plus size={16} /> Add Shareholder
                    </button>
                  </div>
                </div>

                {/* 100-share allocation bar */}
                <div className="mb-6">
                  <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                    {erpShareholders.filter((s) => s.sharesCount > 0).map((s, i) => (
                      <div
                        key={s.id}
                        title={`${s.name}: ${s.sharesCount} shares (${s.sharesCount}%)`}
                        style={{ width: `${Math.min(100, s.sharesCount)}%` }}
                        className={`h-full ${['bg-teal-700', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-1000', 'bg-slate-1000', 'bg-rose-400'][i % 6]}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {erpShareholders.map((s, i) => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${['bg-teal-700', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-1000', 'bg-slate-1000', 'bg-rose-400'][i % 6]}`} />
                        {s.name} · {s.sharesCount}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* Registry: desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Shareholder Name</th>
                        <th className="pb-4 pr-4">Phone</th>
                        <th className="pb-4 pr-4">Shares Held</th>
                        <th className="pb-4 pr-4">Ownership %</th>
                        <th className="pb-4 pr-4">Total Dividends Earned</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {erpShareholders.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 font-semibold text-xs flex items-center justify-center shrink-0">
                                {s.name.charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-sm">{s.name}</div>
                                {s.paymentDetails && <div className="text-[11px] text-slate-500 max-w-[200px] truncate" title={s.paymentDetails}>{s.paymentDetails}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 text-sm text-gray-600">{s.phone || '—'}</td>
                          <td className="py-3.5 pr-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                              {s.sharesCount} / {TOTAL_SHARES}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full ${['bg-teal-700', 'bg-emerald-500', 'bg-amber-400', 'bg-slate-1000', 'bg-slate-1000', 'bg-rose-400'][i % 6]}`} style={{ width: `${Math.min(100, s.sharesCount)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-teal-700">{s.sharesCount}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-emerald-600 whitespace-nowrap">{formatBDT(earnedByName(s.name))}</td>
                          <td className="py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openEditShareholder(s)}
                                aria-label={`Edit ${s.name}`}
                                title="Edit shareholder"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => deleteShareholder(s)}
                                disabled={deletingId === `shareholder-${s.id}`}
                                aria-label={`Delete ${s.name}`}
                                title="Remove shareholder"
                                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {erpShareholders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <PieChart size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">No shareholders registered yet</p>
                      <p className="text-xs text-slate-500 mt-1">Register equity holders to allocate the {TOTAL_SHARES} shares.</p>
                    </div>
                  )}
                </div>

                {/* Registry: mobile cards */}
                <div className="md:hidden space-y-3">
                  {erpShareholders.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{s.name}</div>
                          <div className="text-xs text-gray-500 truncate">{s.phone || 'No phone'}</div>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0">
                          {s.sharesCount} sh · {s.sharesCount}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <span className="text-xs font-medium text-slate-500">Dividends Earned</span>
                        <span className="font-semibold text-emerald-600 text-sm">{formatBDT(earnedByName(s.name))}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openEditShareholder(s)}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-700/5 transition-colors"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => deleteShareholder(s)}
                          disabled={deletingId === `shareholder-${s.id}`}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {erpShareholders.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">No shareholders registered yet.</p>
                  )}
                </div>

                {/* ===== Dividend Payout History ===== */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Dividend Payout History</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">100-share dividend register and distribution engine</p>
                  </div>
                  <button
                    onClick={() => {
                      setDividendForm(EMPTY_DIVIDEND_FORM);
                      setDividendModal(true);
                    }}
                    className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                  >
                    <Plus size={16} /> Distribute Dividend
                  </button>
                </div>

                {/* Desktop: dividends table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Shareholder</th>
                        <th className="pb-4 pr-4">Shares</th>
                        <th className="pb-4 pr-4">Amount Paid</th>
                        <th className="pb-4 pr-4">Payout Month</th>
                        <th className="pb-4 pr-4">Method</th>
                        <th className="pb-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {erpDividends.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-sm">{d.shareholderName}</td>
                          <td className="py-3.5 pr-4 text-sm">{d.sharesCount}</td>
                          <td className="py-3.5 pr-4 font-semibold text-emerald-600 whitespace-nowrap">{formatBDT(d.amountPaid)}</td>
                          <td className="py-3.5 pr-4 text-sm">{d.payoutMonth}</td>
                          <td className="py-3.5 pr-4 text-sm text-gray-500">{d.paymentMethod || '—'}</td>
                          <td className="py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {erpDividends.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <PieChart size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">No dividends distributed yet</p>
                      <p className="text-xs text-slate-500 mt-1">Record payouts against the 100-share structure.</p>
                    </div>
                  )}
                </div>

                {/* Mobile: dividend rows */}
                <div className="md:hidden divide-y divide-slate-100">
                  {erpDividends.map((d) => (
                    <div key={d.id} className="py-3.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{d.shareholderName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {d.sharesCount} shares · {d.payoutMonth}{d.paymentMethod ? ` · ${d.paymentMethod}` : ''}
                        </div>
                      </div>
                      <span className="font-semibold text-emerald-600 whitespace-nowrap text-sm">{formatBDT(d.amountPaid)}</span>
                    </div>
                  ))}
                  {erpDividends.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">No dividends distributed yet.</p>
                  )}
                </div>
              </div>
        ) : tab === 'reviews' ? (
          /* ================= DOCTOR REVIEWS ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-2xl font-semibold">Doctor Reviews</h2>
              <button
                onClick={() => setReviewModal(true)}
                className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <Plus size={16} /> Add Doctor Review
              </button>
            </div>

            {data.reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <Star size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">No reviews yet</p>
                <p className="text-xs text-slate-500 mt-1">Approved reviews appear on the homepage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(data?.reviews ?? []).map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center shrink-0">
                          {review.doctorName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{review.doctorName}</div>
                          <div className="text-xs text-gray-500 truncate">{review.clinicName}</div>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEditReview(review)}
                          aria-label={`Edit review by ${review.doctorName}`}
                          title="Edit review"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteReview(review)}
                          disabled={deletingId === `review-${review.id}`}
                          aria-label={`Delete review by ${review.doctorName}`}
                          title="Delete review"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                        />
                      ))}
                      <span className="text-[11px] font-semibold text-slate-500 ml-1">{review.rating}/5</span>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl p-4 text-xs md:text-sm leading-relaxed text-gray-700 whitespace-pre-wrap flex-1">
                      {review.comment}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{review.location}</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        </main>
      </div>

      {/* Case Prescription Details Modal */}
      {modalOrder && (() => {
        const c = parseClinical(modalOrder.productType);
        const edit = edits[modalOrder.id] ?? { status: modalOrder.status, progress: modalOrder.progress };
        return (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
            onClick={() => setModalId(null)}
          >
            <div
              className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700 truncate">{modalOrder.caseId}</h3>
                  <button
                    onClick={() => copyText(modalOrder.id, modalOrder.caseId, 'Case ID')}
                    aria-label="Copy Case ID"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    {copiedId === modalOrder.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => setModalId(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <p className="text-xs text-slate-500 font-medium">
                  Created {formatDate(modalOrder.createdAt)} · Last updated {formatDate(modalOrder.updatedAt)}
                </p>

                {/* Communication shortcuts */}
                <div className="flex items-center gap-2">
                  {commsButtons(modalOrder)}
                  <span className="text-xs text-slate-500 font-medium">Contact shortcuts</span>
                </div>

                {/* Clinical parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Doctor / Clinic</p>
                    <p className="text-sm font-bold">{modalOrder.customerName}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Patient</p>
                    <p className="text-sm font-bold">{c.patient || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Phone</p>
                    {phoneLinks(modalOrder.phone) ? (
                      <a href={`tel:${modalOrder.phone}`} className="text-sm font-bold text-teal-700">
                        {modalOrder.phone}
                      </a>
                    ) : (
                      <p className="text-sm font-bold">{modalOrder.phone || '—'}</p>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Restoration &amp; Material</p>
                    <p className="text-sm font-bold">{c.work || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Tooth Number(s)</p>
                    <p className="text-sm font-bold">{c.teeth || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Shade</p>
                    <p className="text-sm font-bold">{c.shade || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Trial Date</p>
                    <p className="text-sm font-bold">{c.trial || '—'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1">Insertion / Delivery</p>
                    <p className="text-sm font-bold">{c.insertion || '—'}</p>
                  </div>
                </div>

                {c.notes && (
                  <div className="border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-2">Clinical Notes / Special Instructions</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.notes}</p>
                  </div>
                )}

                {/* Editable status inside modal */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-500">Current Status &amp; Progress</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={edit.status} />
                    <span className="text-xs font-semibold text-slate-500">{edit.progress}%</span>
                  </div>
                  <ProgressBar value={edit.progress} />
                  <CaseControls
                    order={modalOrder}
                    edit={edit}
                    onEdit={(e) => setEdits({ ...edits, [modalOrder.id]: e })}
                    onSave={() => updateStatus(modalOrder)}
                    saving={savingId === modalOrder.id}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

            {/* Service Create / Edit Modal */}
      {serviceModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitService}
            className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingService ? 'Edit Dental Product' : 'Add New Dental Product'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <select
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  >
                    <option value="Zirconia & All-Ceramic">Zirconia &amp; All-Ceramic</option>
                    <option value="Porcelain (PFM)">Porcelain (PFM)</option>
                    <option value="Dentures & Ortho">Dentures &amp; Ortho</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={serviceForm.displayOrder}
                    onChange={(e) => setServiceForm({ ...serviceForm, displayOrder: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Product Name (EN) *</label>
                <input
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Zirconia Crown / Bridge"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              {/* Product Photo Upload Field with Sharp WebP Conversion */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Product Image / Photo (Sharp WebP)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  {serviceForm.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs group">
                      <img
                        src={serviceForm.imageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, imageUrl: '' })}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Package size={26} />
                      <span className="text-[11px] font-bold mt-1">No Photo</span>
                    </div>
                  )}

                  <div
                    className={`flex-1 w-full space-y-2 rounded-xl border-2 border-dashed p-3 transition-colors ${
                      dragZone === 'product' ? 'border-teal-700 bg-teal-700/5' : 'border-transparent'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragZone('product');
                    }}
                    onDragLeave={() => setDragZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragZone(null);
                      const file = e.dataTransfer.files?.[0];
                      if (file && !uploadingProduct) uploadProductImage(file);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="min-h-[38px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shadow-xs">
                        <ImagePlus size={15} className="text-teal-700" />
                        {uploadingProduct ? 'Uploading & Converting...' : (serviceForm.imageUrl ? 'Change Photo' : 'Upload Product Photo')}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingProduct}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadProductImage(file);
                            e.target.value = ''; // allow re-picking the same file
                          }}
                          className="hidden"
                        />
                      </label>
                      {serviceForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setServiceForm({ ...serviceForm, imageUrl: '' })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {serviceForm.imageUrl ? (
                      <p className="text-xs font-mono text-slate-500 truncate max-w-full">
                        {serviceForm.imageUrl}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Drop an image here or click Upload. JPEG, PNG or WebP up to 10 MB, converted to 1200px WebP.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Bengali Name (BN)</label>
                <input
                  value={serviceForm.nameBn}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameBn: e.target.value })}
                  placeholder="e.g. Zirconia ক্রাউন / ব্রিজ"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Lead Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={serviceForm.turnaroundDays}
                    onChange={(e) => setServiceForm({ ...serviceForm, turnaroundDays: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Warranty (Years)</label>
                  <input
                    type="number"
                    min={0}
                    value={serviceForm.warrantyYears}
                    onChange={(e) => setServiceForm({ ...serviceForm, warrantyYears: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Price (BDT / Quote)</label>
                  <input
                    value={serviceForm.basePrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value.replace(/[৳\s]/g, '') })}
                    placeholder="e.g. 3500"
                    inputMode="numeric"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Clinical Specs / Tag</label>
                <input
                  value={serviceForm.specs}
                  onChange={(e) => setServiceForm({ ...serviceForm, specs: e.target.value })}
                  placeholder="e.g. Monolithic & Multilayer Aidite · Roland 5-Axis"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Clinical details, indication, materials used..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Publish on public catalogue (Active)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingService}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingService ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Write / Edit Article Modal */}
      {blogModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitBlog}
            className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingBlog ? 'Edit Article' : 'Write New Article'}
              </h3>
              <button
                type="button"
                onClick={closeBlogModal}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Title *</label>
                <input
                  required
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="Article headline"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Slug * <span className="normal-case font-medium">(auto from title if empty)</span>
                  </label>
                  <input
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: slugify(e.target.value) })}
                    placeholder="my-article-url"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                  <input
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    placeholder="Zirconia & CAD/CAM"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Short summary shown on cards and search results"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Content *</label>
                <textarea
                  required
                  rows={10}
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  placeholder="Full article text. Separate paragraphs with a blank line."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Cover Image <span className="normal-case font-medium">(auto-optimized to WebP, max 1200px)</span>
                </label>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragZone('blog');
                  }}
                  onDragLeave={() => setDragZone(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragZone(null);
                    onBlogFilePicked(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${
                    uploading || dragZone === 'blog'
                      ? 'border-teal-700 bg-teal-700/5'
                      : 'border-slate-300 hover:border-teal-700/60 hover:bg-teal-700/5'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      onBlogFilePicked(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Cover preview" className="w-full h-36 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <ImagePlus size={28} className="text-slate-400" />
                  )}
                  <span className="text-xs font-bold text-gray-500">
                    {uploading ? 'Uploading & optimizing…' : 'Drop an image here or click to upload'}
                  </span>
                </label>
                <input
                  value={blogForm.imageUrl}
                  onChange={(e) => {
                    setBlogForm({ ...blogForm, imageUrl: e.target.value });
                    setPreviewUrl(e.target.value || null);
                  }}
                  placeholder="/images/blog.jpg"
                  className="w-full min-h-[40px] mt-2 px-4 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 pb-6 sm:pb-2">
                <button
                  type="button"
                  onClick={closeBlogModal}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-gray-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBlog || uploading}
                  className="min-h-[44px] px-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={14} className={savingBlog ? 'animate-spin' : 'hidden'} />
                  {savingBlog ? 'Saving...' : editingBlog ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Doctor Review Modal */}
      {reviewModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitReview}
            className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingReview ? 'Edit Doctor Review' : 'Add Doctor Review'}
              </h3>
              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Doctor Name *</label>
                  <input
                    required
                    value={reviewForm.doctorName}
                    onChange={(e) => setReviewForm({ ...reviewForm, doctorName: e.target.value })}
                    placeholder="Staff / Agent Full Name"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Clinic Name *</label>
                  <input
                    required
                    value={reviewForm.clinicName}
                    onChange={(e) => setReviewForm({ ...reviewForm, clinicName: e.target.value })}
                    placeholder="Clinic / Hospital"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
                  <input
                    value={reviewForm.location}
                    onChange={(e) => setReviewForm({ ...reviewForm, location: e.target.value })}
                    placeholder="Dhaka, Bangladesh"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Rating *</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Comment *</label>
                <textarea
                  required
                  rows={5}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="The doctor's review text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 pb-6 sm:pb-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-gray-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReview}
                  className="min-h-[44px] px-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={14} className={savingReview ? 'animate-spin' : 'hidden'} />
                  {savingReview ? 'Saving...' : editingReview ? 'Save Changes' : 'Add Review'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Client Inquiry Full-Message Drawer */}
      {msgModal && (() => {
        const wa = extractWaPhone(msgModal);
        return (
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={() => setMsgModal(null)}
          >
            <aside
              className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              aria-label="Full inquiry message"
            >
              {/* Drawer header */}
              <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Client Inquiry</p>
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700 truncate mt-0.5">
                    {msgModal.subject || 'General Inquiry'}
                  </h3>
                </div>
                <button
                  onClick={() => setMsgModal(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center text-lg shrink-0">
                    {msgModal.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{msgModal.name}</p>
                    <a href={`mailto:${msgModal.email}`} className="text-xs text-teal-700 hover:underline block truncate">
                      {msgModal.email}
                    </a>
                    {wa && (
                      <a href={`tel:+${wa}`} className="text-xs text-gray-500 hover:text-teal-700">
                        +{wa}
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">Received {formatDate(msgModal.createdAt)}</p>

                <div className="bg-slate-50 rounded-2xl p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {msgModal.message}
                </div>
              </div>

              {/* Drawer footer actions */}
              <div className="shrink-0 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center gap-2.5">
                <a
                  href={`mailto:${msgModal.email}?subject=${encodeURIComponent(`Re: ${msgModal.subject || 'Your inquiry to CNDL Global'}`)}`}
                  className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold px-4 hover:bg-teal-800 transition-colors"
                >
                  <Reply size={14} /> Reply via Email
                </a>
                <a
                  href={
                    wa
                      ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${msgModal.name}, this is CNDL Dental Lab regarding your inquiry.`)}`
                      : `https://wa.me/?text=${encodeURIComponent(`Hello ${msgModal.name}, this is CNDL Dental Lab regarding your inquiry.`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title={wa ? 'WhatsApp the sender' : 'Open WhatsApp (choose recipient)'}
                  className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1fbd59] transition-colors"
                >
                  <svg viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
                  </svg>
                  WhatsApp
                </a>
                <button
                  onClick={() => copyText(msgModal.id, msgModal.email, 'Email')}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:bg-slate-50 transition-colors"
                  title="Copy email address"
                >
                  {copiedEmail === msgModal.id ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
              </div>
            </aside>
          </div>
        );
      })()}

      {/* Add Case Invoice Modal */}
      {invoiceModalAcc && (() => {
        const grossNum = parseFloat(invoiceForm.grossAmount) || 0;
        const discNum = parseFloat(invoiceForm.discountAmount || '0') || 0;
        const netNum = Math.max(0, grossNum - discNum);
        return (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          >
            <form
              onSubmit={submitInvoice}
              className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700">Add Case Invoice</h3>
                  <p className="text-xs text-slate-500 truncate">{invoiceModalAcc.name} · Current due {formatBDT(invoiceModalAcc.currentBalance)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceModalAcc(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Gross Amount (BDT) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceForm.grossAmount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, grossAmount: e.target.value })}
                      placeholder="e.g. 12000"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Case ID (optional)</label>
                    <input
                      value={invoiceForm.orderId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, orderId: e.target.value })}
                      placeholder="Link a lab case"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Discretionary Discount (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceForm.discountAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: e.target.value })}
                    placeholder="0"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Note {invoiceForm.discountAmount && parseFloat(invoiceForm.discountAmount) > 0 && <span className="text-rose-500 normal-case">* (mandatory for discount override)</span>}
                  </label>
                  <textarea
                    rows={2}
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    placeholder="Reason for discount, invoice context..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Net Payable</span>
                  <span className="text-lg font-semibold text-teal-700">{formatBDT(netNum)}</span>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setInvoiceModalAcc(null)}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingErp}
                  className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
                >
                  {savingErp ? 'Recording...' : 'Record Invoice'}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* Record Payment / Collection Modal */}
      {paymentModalAcc && (() => (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitPayment}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-600">Record Payment</h3>
                <p className="text-xs text-slate-500 truncate">{paymentModalAcc.name} · Current due {formatBDT(paymentModalAcc.currentBalance)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalAcc(null)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount Collected (BDT) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.netAmount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, netAmount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Collected By (Agent)</label>
                {me?.role === 'AGENT' ? (
                  <div className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center text-sm font-bold text-slate-600">
                    {me.name} (you)
                  </div>
                ) : (
                  <select
                    value={paymentForm.collectedById}
                    onChange={(e) => setPaymentForm({ ...paymentForm, collectedById: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">— Select agent —</option>
                    {agentList.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Payment Date * <span className="normal-case font-medium text-slate-400">(backdating allowed)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    <option value="">— Select —</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Note (optional)</label>
                <input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="bKash TrxID, cheque no, receipt reference..."
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={paymentForm.isVerified}
                  onChange={(e) => setPaymentForm({ ...paymentForm, isVerified: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Payment verified <span className="font-normal text-slate-500">(cash / bank / bKash confirmed)</span>
                </span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPaymentModalAcc(null)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Recording...' : 'Record Collection'}
              </button>
            </div>
          </form>
        </div>
      ))()}

      {/* Add / Edit Client Account Modal */}
      {accountModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitAccount}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingAccount ? 'Edit Client Account' : 'Add Client Account'}
              </h3>
              <button
                type="button"
                onClick={() => setAccountModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {accountDupWarning && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Phone size={13} /> Phone already registered — &ldquo;{accountDupWarning}&rdquo;
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    এই নম্বরে একটি অ্যাকাউন্ট রয়েছে। ভিন্ন নম্বর ব্যবহার করুন, অথবা নিশ্চিত হলে নিচের বাটনে গিয়ে যাই হোক তৈরি করুন।
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountDupWarning(null)}
                      className="min-h-[36px] px-3.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-amber-800 hover:bg-amber-50"
                    >
                      Change Phone
                    </button>
                    {!editingAccount && (
                      <button
                        type="button"
                        onClick={() => saveAccount(true)}
                        disabled={savingErp}
                        className="min-h-[36px] px-3.5 rounded-lg bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        {savingErp ? 'Saving…' : 'Create Anyway (allow duplicate)'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Type *</label>
                  <select
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="CHAMBER">Chamber</option>
                    <option value="PARTNER_LAB">Partner Lab</option>
                    <option value="CHAIRMAN_PERSONAL">Chairman (Personal Channel)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Institution Type *</label>
                  <select
                    value={accountForm.institutionType}
                    onChange={(e) => setAccountForm({ ...accountForm, institutionType: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="CHAMBER">Chamber</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="PARTNER_LAB">Lab</option>
                    <option value="FREELANCE">Personal (Freelance)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Name *</label>
                <input
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. Dr. Rahim Dental Care"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Owner Name *</label>
                  <input
                    required
                    value={accountForm.ownerName}
                    onChange={(e) => setAccountForm({ ...accountForm, ownerName: e.target.value })}
                    placeholder="Owner / proprietor"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone *</label>
                  <input
                    required
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Division *</label>
                  <select
                    value={accountForm.division}
                    onChange={(e) => setAccountForm({ ...accountForm, division: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d.key} value={d.key}>{d.bn ? `${d.label} (${d.bn})` : d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">District / Area</label>
                  <input
                    value={accountForm.district}
                    onChange={(e) => setAccountForm({ ...accountForm, district: e.target.value })}
                    placeholder="e.g. Dhanmondi"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Assigned Agent</label>
                <select
                  value={accountForm.assignedAgentId}
                  onChange={(e) => setAccountForm({ ...accountForm, assignedAgentId: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">— Unassigned —</option>
                  {agentList.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}{a.phone ? ` (${a.phone})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  placeholder="clinic@email.com (optional)"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Previous Opening Due (পূর্বের বকেয়া ৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={accountForm.openingDue}
                    onChange={(e) => setAccountForm({ ...accountForm, openingDue: e.target.value })}
                    placeholder="0"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Logged as an opening-balance invoice in the ledger.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                <input
                  value={accountForm.address}
                  onChange={(e) => setAccountForm({ ...accountForm, address: e.target.value })}
                  placeholder="Chamber / lab address"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setAccountModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {userModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitErpUser}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                {editingUser && <p className="text-xs text-slate-500 truncate">{editingUser.name} · {editingUser.phone}</p>}
              </div>
              <button
                type="button"
                onClick={() => setUserModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                <input
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Dr. Full Name"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone *</label>
                  <input
                    required
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="doctor@email.com"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Address (বর্তমান ঠিকানা)</label>
                <input
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  placeholder="House / Road / Area, City"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {editingUser ? 'Reset Password' : 'Login Password'} <span className="normal-case font-medium text-slate-400">(min 4 chars{editingUser ? ' — leave blank to keep current' : ' — lets this user sign in'})</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep the current password' : 'Set an initial password (optional)'}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="AGENT">Agent (Field Collector)</option>
                  <option value="ACCOUNTS">Accounts &amp; Finance</option>
                  <option value="CHAIRMAN">Chairman</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Status *</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setUserModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingUser ? 'Save Changes' : 'Register User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Your Password Modal (self-service, all roles) */}
      {pwModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitChangePassword}
            className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700 flex items-center gap-2">
                  <KeyRound size={18} /> Change Your Password
                </h3>
                <p className="text-xs text-slate-500 truncate">Signed in as {me?.name || 'Administrator'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPwModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {me && !me.uid && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                  You are signed in with the master administrator key. This password is locked in the
                  server environment and cannot be changed from here.
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Password *</label>
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  disabled={savingPw || (me !== null && !me.uid)}
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  placeholder="Enter your current password"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">New Password *</label>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  disabled={savingPw || (me !== null && !me.uid)}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className={`w-full min-h-[44px] px-4 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white disabled:bg-slate-100 disabled:text-slate-500 ${
                    pwForm.next.length > 0 && pwForm.next.length < 6 ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {pwForm.next.length > 0 && pwForm.next.length < 6 && (
                  <p className="text-xs font-semibold text-rose-500 mt-1">Password must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm New Password *</label>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  disabled={savingPw || (me !== null && !me.uid)}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Re-enter the new password"
                  className={`w-full min-h-[44px] px-4 rounded-xl border text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white disabled:bg-slate-100 disabled:text-slate-500 ${
                    pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.next ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {pwForm.confirm.length > 0 && pwForm.confirm !== pwForm.next && (
                  <p className="text-xs font-semibold text-rose-500 mt-1">Passwords do not match</p>
                )}
                {pwForm.confirm.length > 0 && pwForm.confirm === pwForm.next && pwForm.next.length >= 6 && (
                  <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                    <BadgeCheck size={12} /> Passwords match
                  </p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPwModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPw || !pwValid || (me !== null && !me.uid)}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log Daily Expense Modal */}
      {/* Expense Audit History Modal (SuperAdmin) */}
      {auditModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          onClick={() => setAuditModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">Expense Audit History</h3>
                <p className="text-xs text-slate-500">Latest 50 changes — pre-edit &amp; pre-delete snapshots</p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {auditLoading && (
                <p className="text-center text-sm text-slate-500 py-10">Loading audit trail…</p>
              )}
              {!auditLoading && auditEntries.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList size={28} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-500">No audit entries yet</p>
                  <p className="text-xs text-slate-500 mt-1">Every SuperAdmin expense edit or delete is recorded here.</p>
                </div>
              )}
              {!auditLoading && auditEntries.map((entry) => {
                let snap: { title?: string; amount?: number; category?: string; expenseDate?: string; voucherNo?: string | null } | null = null;
                try { snap = JSON.parse(entry.originalData); } catch { snap = null; }
                const isDelete = entry.action === 'DELETE';
                return (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
                        isDelete ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isDelete ? 'Deleted' : 'Edited'}
                      </span>
                      {snap?.title && <span className="font-bold text-sm truncate">{snap.title}</span>}
                      {typeof snap?.amount === 'number' && (
                        <span className="font-semibold text-rose-600 text-sm">{formatBDT(snap.amount)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {snap?.category && <span>Category: <span className="font-semibold">{snap.category.replace(/_/g, ' ')}</span></span>}
                      {snap?.expenseDate && <span>Date: <span className="font-semibold">{formatDay(snap.expenseDate)}</span></span>}
                      <span>By: <span className="font-semibold">{collectedByMap[entry.performedBy] || entry.performedBy}</span></span>
                      <span>At: <span className="font-semibold">{formatDate(entry.createdAt)}</span></span>
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600 select-none">Original snapshot (JSON)</summary>
                      <pre className="mt-1.5 rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] leading-relaxed overflow-x-auto text-slate-600 whitespace-pre-wrap break-all">{entry.originalData}</pre>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {expenseModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitExpense}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">{editingExpense ? 'Edit Expense' : 'Log Daily Expense'}</h3>
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editingExpense && (
                <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800 font-semibold">
                  Editing is SuperAdmin-only — the pre-change state is snapshotted to the audit log.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="LOGISTICS">Logistics / Fuel</option>
                    <option value="LAB_UTILITY">Lab Utility</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Voucher No</label>
                  <input
                    value={expenseForm.voucherNo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, voucherNo: e.target.value })}
                    placeholder="e.g. V-2026-014"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Title / Description *</label>
                <input
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Zirconia pucks restock (Aidite 5 pcs)"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Expense Date * <span className="normal-case font-medium text-slate-400">(backdating allowed)</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (BDT) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="e.g. 4500"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Supplier, payment mode, remarks..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingExpense ? 'Save Changes' : 'Log Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Machine Asset (CapEx) Modal */}
      {capexModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitCapex}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">{editingCapex ? 'Edit Machine Asset' : 'Add Machine Asset'}</h3>
              <button
                type="button"
                onClick={() => setCapexModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Machine Name *</label>
                <input
                  required
                  value={capexForm.machineName}
                  onChange={(e) => setCapexForm({ ...capexForm, machineName: e.target.value })}
                  placeholder="e.g. Roland DWX-52Di / UP3D P52"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Purchase Cost (BDT) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={capexForm.purchaseCost}
                    onChange={(e) => setCapexForm({ ...capexForm, purchaseCost: e.target.value })}
                    placeholder="e.g. 1850000"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Purchase Date</label>
                  <input
                    type="date"
                    value={capexForm.purchaseDate}
                    onChange={(e) => setCapexForm({ ...capexForm, purchaseDate: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <select
                  value={capexForm.status}
                  onChange={(e) => setCapexForm({ ...capexForm, status: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={capexForm.notes}
                  onChange={(e) => setCapexForm({ ...capexForm, notes: e.target.value })}
                  placeholder="Serial number, supplier, warranty details..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setCapexModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingCapex ? 'Save Changes' : 'Add Machine Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Distribute Dividend Modal */}
      {dividendModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitDividend}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">Distribute Dividend</h3>
                <p className="text-xs text-slate-500">Against the 100-share structure</p>
              </div>
              <button
                type="button"
                onClick={() => setDividendModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Shareholder Name *</label>
                <input
                  required
                  value={dividendForm.shareholderName}
                  onChange={(e) => setDividendForm({ ...dividendForm, shareholderName: e.target.value })}
                  placeholder="Full name"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Shares Held (of {TOTAL_SHARES}) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={TOTAL_SHARES}
                    value={dividendForm.sharesCount}
                    onChange={(e) => setDividendForm({ ...dividendForm, sharesCount: e.target.value })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount Paid (BDT) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={dividendForm.amountPaid}
                    onChange={(e) => setDividendForm({ ...dividendForm, amountPaid: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payout Month *</label>
                  <input
                    required
                    type="month"
                    value={dividendForm.payoutMonth}
                    onChange={(e) => setDividendForm({ ...dividendForm, payoutMonth: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={dividendForm.paymentMethod}
                    onChange={(e) => setDividendForm({ ...dividendForm, paymentMethod: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="">— Select —</option>
                    <option value="bKash">bKash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={dividendForm.notes}
                  onChange={(e) => setDividendForm({ ...dividendForm, notes: e.target.value })}
                  placeholder="Reference, TrxID, remarks..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setDividendModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Recording...' : 'Distribute Dividend'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Shareholder Modal */}
      {shareholderModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitShareholder}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                  {editingShareholder ? 'Edit Shareholder' : '+ Add Shareholder'}
                </h3>
                <p className="text-xs text-slate-500">
                  {unallocatedShares > 0
                    ? `${unallocatedShares} of ${TOTAL_SHARES} shares currently unallocated`
                    : `All ${TOTAL_SHARES} shares allocated`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareholderModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                <input
                  required
                  value={shareholderForm.name}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, name: e.target.value })}
                  placeholder="Shareholder's full name"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                  <input
                    value={shareholderForm.phone}
                    onChange={(e) => setShareholderForm({ ...shareholderForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Shares Count (1–{editingShareholder ? TOTAL_SHARES - (allocatedShares - editingShareholder.sharesCount) : unallocatedShares || 1} available) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={TOTAL_SHARES}
                    value={shareholderForm.sharesCount}
                    onChange={(e) => setShareholderForm({ ...shareholderForm, sharesCount: e.target.value })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                <input
                  value={shareholderForm.address}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, address: e.target.value })}
                  placeholder="House / Road / Area, City"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Info</label>
                <input
                  value={shareholderForm.paymentDetails}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, paymentDetails: e.target.value })}
                  placeholder="bKash / bank account / cheque details"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={shareholderForm.notes}
                  onChange={(e) => setShareholderForm({ ...shareholderForm, notes: e.target.value })}
                  placeholder="Agreement reference, remarks..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setShareholderModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingShareholder ? 'Save Changes' : 'Add Shareholder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Offline / Manual Order Modal */}
      {/* Agent Commission Payout Modal */}
      {payoutModalAgent && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitPayout}
            className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-700">Pay Commission</h3>
                <p className="text-xs text-slate-500 truncate">Agent: {payoutModalAgent.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalAgent(null)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (৳) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={payoutForm.amountPaid}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amountPaid: e.target.value })}
                    placeholder="0"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={payoutForm.paymentMethod}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash">bKash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Payout Date</label>
                <input
                  type="date"
                  value={payoutForm.payoutDate}
                  onChange={(e) => setPayoutForm({ ...payoutForm, payoutDate: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  placeholder="e.g. October commission settlement"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white resize-none"
                />
              </div>
              <p className="text-xs text-slate-500">
                Recorded as a LOGISTICS expense — &ldquo;Agent Commission - {payoutModalAgent.name}&rdquo; — and subtracted from the agent&rsquo;s pending commission.
              </p>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setPayoutModalAgent(null)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPayout}
                className="min-h-[44px] px-6 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md"
              >
                {savingPayout ? 'Recording...' : 'Record Payout'}
              </button>
            </div>
          </form>
        </div>
      )}

      {offlineOrderModal && (() => {
        const linkedAccount = offlineOrderForm.clientAccountId
          ? erpAccounts.find((a) => a.id === offlineOrderForm.clientAccountId) ?? null
          : null;
        const activeProducts = (data?.services ?? []).filter((s) => s.isActive);
        return (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
          >
            <form
              onSubmit={submitOfflineOrder}
              className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700 inline-flex items-center gap-2">
                    <ClipboardList size={18} /> Add Offline / Manual Order
                  </h3>
                  <p className="text-xs text-slate-500">Register rider pickups, phone &amp; WhatsApp intakes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOfflineOrderModal(false)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Order Date *</label>
                    <input
                      type="date"
                      required
                      value={offlineOrderForm.orderDate}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, orderDate: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Promised Delivery Date</label>
                    <input
                      type="date"
                      value={offlineOrderForm.deliveryDate}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, deliveryDate: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Order Source *</label>
                  <select
                    value={offlineOrderForm.orderSource}
                    onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, orderSource: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="OFFLINE_RIDER">Offline — Rider Pickup</option>
                    <option value="PHONE">Phone</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="ONLINE">Online (website)</option>
                  </select>
                </div>

                {/* Client account or manual entry */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-500">Client Account</label>
                    <button
                      type="button"
                      onClick={() => setQuickAccountOpen(!quickAccountOpen)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 transition-colors"
                    >
                      {quickAccountOpen ? '✕ Close Quick Add' : '+ Quick New Account'}
                    </button>
                  </div>

                  {quickAccountOpen && (
                    <div className="mb-3 p-3.5 rounded-xl border border-teal-700/30 bg-teal-700/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Quick Add Client Account</span>
                        <span className="text-[11px] text-slate-500 font-medium">Auto-selects on save</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Clinic / Lab Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Popular Dental Clinic"
                            value={quickAccountForm.name}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, name: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Doctor Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Dr. Rafiqul Islam"
                            value={quickAccountForm.ownerName}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, ownerName: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. 01711000000"
                            value={quickAccountForm.phone}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, phone: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Division *</label>
                          <select
                            value={quickAccountForm.division}
                            onChange={(e) => setQuickAccountForm({ ...quickAccountForm, division: e.target.value })}
                            className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-teal-700/30"
                          >
                            {DIVISIONS.map((d) => (
                              <option key={d.key} value={d.key}>
                                {d.bn ? `${d.label} (${d.bn})` : d.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setQuickAccountOpen(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickCreateAccount}
                          disabled={savingQuickAccount}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {savingQuickAccount ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create & Select'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  <select
                    value={offlineOrderForm.clientAccountId}
                    onChange={(e) => {
                      const acc = erpAccounts.find((a) => a.id === e.target.value);
                      setOfflineOrderForm((f) => ({
                        ...f,
                        clientAccountId: e.target.value,
                        // Auto-attribute to the account's assigned agent when one exists.
                        attribution: acc?.assignedAgentId ? 'AGENT' : 'DIRECT',
                        agentId: acc?.assignedAgentId || '',
                      }));
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    <option value="">— Walk-in / new (manual entry) —</option>
                    {erpAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} · {a.ownerName}</option>
                    ))}
                  </select>
                  {linkedAccount ? (
                    <div className="mt-2 rounded-xl border border-teal-700/20 bg-teal-700/5 px-4 py-3 text-xs">
                      <p className="font-bold text-teal-700">{linkedAccount.name}</p>
                      <p className="text-slate-600 mt-0.5">Dr. {linkedAccount.ownerName} · {linkedAccount.phone}</p>
                      <p className="text-slate-500 mt-0.5">
                        Current due: <span className={linkedAccount.currentBalance > 0 ? 'font-bold text-rose-600' : 'font-bold text-emerald-600'}>{formatBDT(linkedAccount.currentBalance)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Doctor Name *</label>
                        <input
                          required
                          value={offlineOrderForm.doctorName}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, doctorName: e.target.value })}
                          placeholder="Dr. Full Name"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Clinic Name</label>
                        <input
                          value={offlineOrderForm.clinicName}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, clinicName: e.target.value })}
                          placeholder="Clinic / chamber name"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                        <input
                          value={offlineOrderForm.phone}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, phone: e.target.value })}
                          placeholder="01XXXXXXXXX"
                          className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Order attribution */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Order Attribution *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'DIRECT', label: 'Direct CNDL' },
                      { key: 'AGENT', label: 'Via Agent' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setOfflineOrderForm({
                          ...offlineOrderForm,
                          attribution: opt.key,
                          agentId: opt.key === 'DIRECT' ? '' : (offlineOrderForm.agentId || linkedAccount?.assignedAgentId || ''),
                          commissionAmount: opt.key === 'DIRECT' ? '' : offlineOrderForm.commissionAmount,
                        })}
                        className={`min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                          offlineOrderForm.attribution === opt.key
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {offlineOrderForm.attribution === 'AGENT' && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Agent *</label>
                        <select
                          value={offlineOrderForm.agentId}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, agentId: e.target.value })}
                          className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                        >
                          <option value="">— Select agent —</option>
                          {agentList.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                        {linkedAccount?.assignedAgentId && offlineOrderForm.agentId === linkedAccount.assignedAgentId && (
                          <p className="text-[11px] text-teal-600 mt-1 font-semibold">Auto-selected from {linkedAccount.name}&rsquo;s assigned agent.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Commission (৳)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={offlineOrderForm.commissionAmount}
                          onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, commissionAmount: e.target.value })}
                          placeholder="0"
                          className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient / Tooth / Shade */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Patient Name</label>
                    <input
                      value={offlineOrderForm.patientName}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, patientName: e.target.value })}
                      placeholder="Patient"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">FDI Tooth No</label>
                    <input
                      value={offlineOrderForm.toothNo}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, toothNo: e.target.value })}
                      placeholder="e.g. 36, 11-21"
                      className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Shade (Vita / Bleach)</label>
                    <select
                      value={offlineOrderForm.shade}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, shade: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="">— Select —</option>
                      <optgroup label="Vita Classical">
                        {VITA_SHADES.filter((s) => !s.startsWith('BL')).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Bleach">
                        {VITA_SHADES.filter((s) => s.startsWith('BL')).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Product + units + billed amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Product / Restoration *</label>
                    <select
                      required
                      value={offlineOrderForm.productName}
                      onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, productName: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                    >
                      <option value="">— Select product —</option>
                      {activeProducts.map((p) => (
                        <option key={p.id} value={p.name}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                    {activeProducts.length === 0 && (
                      <p className="text-xs text-rose-500 mt-1">No active products in the catalogue — add one under Dental Products.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Units *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="200"
                        value={offlineOrderForm.units}
                        onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, units: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Billed (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offlineOrderForm.billedAmount}
                        onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, billedAmount: e.target.value })}
                        placeholder="0"
                        className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Ledger link */}
                <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  linkedAccount ? 'cursor-pointer hover:bg-slate-50 border-slate-200' : 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                }`}>
                  <input
                    type="checkbox"
                    disabled={!linkedAccount}
                    checked={offlineOrderForm.addToLedger}
                    onChange={(e) => setOfflineOrderForm({ ...offlineOrderForm, addToLedger: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Add to Client Due Ledger
                    <span className="block text-xs font-normal text-slate-500">
                      {linkedAccount
                        ? `Records an invoice against ${linkedAccount.name} and increases its outstanding due.`
                        : 'Link a client account above to enable ledger billing.'}
                    </span>
                  </span>
                </label>

                {/* Historical intake */}
                <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 cursor-pointer hover:bg-amber-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={offlineOrderForm.historical}
                    onChange={(e) => setOfflineOrderForm((f) => ({
                      ...f,
                      historical: e.target.checked,
                      // A case that was already delivered posts its full due to the ledger.
                      addToLedger: e.target.checked && linkedAccount ? true : f.addToLedger,
                    }))}
                    className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Historical Case (Already Delivered)
                    <span className="block text-xs font-normal text-gray-500">
                      Sets status straight to Dispatched — bypasses the milling queue{linkedAccount ? ' and posts the full billed amount to the client due ledger.' : '.'}
                    </span>
                  </span>
                </label>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setOfflineOrderModal(false)}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
                >
                  {savingOrder ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        );
      })()}
    </div>
  );
}
