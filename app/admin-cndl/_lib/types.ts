/* Row shapes returned by the admin APIs, shared by every console section. */

export type Order = {
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

export type Message = {
  id: string;
  name: string;
  email: string;
  /** Saved by the contact form since 2026-11-05; older rows have none. */
  phone?: string | null;
  subject: string | null;
  message: string;
  createdAt: string;
};


export type BlogRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  image: string;
  excerpt: string;
  content: string;
  publishedAt: string;
};

export type ServiceRow = {
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

export type ReviewRow = {
  id: number;
  doctorName: string;
  clinicName: string;
  location: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ErpUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  role: string;
  /** Current role (built-in key or custom_xxxx); `role` is only the legacy column. */
  roleKey?: string;
  roleName?: string;
  status: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ErpAccount = {
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

export type ErpAgent = { id: string; name: string; phone: string | null };

export type ErpExpense = {
  id: string;
  category: string;
  title: string;
  amount: number;
  voucherNo: string | null;
  notes: string | null;
  expenseDate: string;
  createdAt: string;
};

export type ErpAsset = {
  id: string;
  machineName: string;
  purchaseCost: number;
  purchaseDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

export type ErpDividend = {
  id: string;
  shareholderName: string;
  sharesCount: number;
  amountPaid: number;
  payoutMonth: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
};

export type ErpLedgerEntry = {
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

export type ErpShareholder = {
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


export type TabKey =
  | 'overview'
  | 'orders' | 'products'
  | 'dues' | 'expenses' | 'capex' | 'shareholders'
  | 'messages' | 'blogs' | 'reviews'
  | 'leads'
  | 'users' | 'access';

/** Dhaka Dental Leads (CNDL local pipeline) row shape — from /api/admin/leads. */
export type LeadRow = {
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

/** The signed-in operator. `permissions` are the keys their role holds right now (from /api/admin/verify). */
export type SessionUser = { uid: string; name: string; phone: string; role: string; roleName?: string; permissions: string[] };

/** Finance snapshot behind the Overview KPI row (from /api/admin/erp/overview-metrics). */
export interface OverviewMetrics {
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
