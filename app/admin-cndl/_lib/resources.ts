import type { AdminFetch } from './adminFetch';
import type {
  BlogRow, ErpAccount, ErpAgent, ErpAsset, ErpDividend, ErpExpense, ErpLedgerEntry, ErpShareholder,
  ErpUser, LeadRow, Message, Order, OverviewMetrics, ReviewRow, ServiceRow,
} from './types';

/** Every admin read endpoint a section can ask for. Each section page lists
    only the ones it renders, so opening Dues no longer downloads blogs. */
const ENDPOINTS = {
  data: '/api/admin/data', // orders + inquiries
  blogs: '/api/admin/blogs',
  testimonials: '/api/admin/testimonials',
  services: '/api/admin/services',
  accounts: '/api/admin/erp/accounts', // client accounts + field agents
  users: '/api/admin/erp/users',
  expenses: '/api/admin/erp/expenses',
  capex: '/api/admin/erp/capex',
  dividends: '/api/admin/erp/dividends',
  ledger: '/api/admin/erp/ledger',
  shareholders: '/api/admin/erp/shareholders',
  metrics: '/api/admin/erp/overview-metrics',
  leads: '/api/admin/leads',
} as const;

export type ResourceKey = keyof typeof ENDPOINTS;

/** Feeds the API only serves to some roles (mirrors the route guards). A
    role outside the list is never sent the request, so a field agent on
    mobile data does not pay for a guaranteed 403. */
const FINANCE = ['SUPERADMIN', 'CHAIRMAN', 'ACCOUNTS'];
const READ_ROLES: Partial<Record<ResourceKey, string[]>> = {
  users: ['SUPERADMIN'],
  expenses: FINANCE,
  capex: FINANCE,
  dividends: FINANCE,
  shareholders: FINANCE,
  metrics: FINANCE,
};

export type Loaded = {
  orders?: Order[];
  messages?: Message[];
  blogs?: BlogRow[];
  reviews?: ReviewRow[];
  services?: ServiceRow[];
  accounts?: ErpAccount[];
  agents?: ErpAgent[];
  users?: ErpUser[];
  expenses?: ErpExpense[];
  assets?: ErpAsset[];
  dividends?: ErpDividend[];
  ledger?: ErpLedgerEntry[];
  shareholders?: ErpShareholder[];
  metrics?: OverviewMetrics;
  leads?: LeadRow[];
};

/* eslint-disable @typescript-eslint/no-explicit-any -- response bodies are loosely shaped JSON */
const list = <T,>(body: any, key: string): T[] =>
  Array.isArray(body?.[key]) ? body[key] : Array.isArray(body) ? body : [];

/**
 * Loads the given endpoints in parallel. Returns null when any of them says
 * the session is gone (adminFetch has already sent the operator to sign-in).
 * A failing orders/inquiries feed throws; any other failing feed reads as
 * empty, the same as before the split. Feeds `role` cannot read are skipped.
 */
export async function loadResources(
  adminFetch: AdminFetch,
  wanted: readonly ResourceKey[],
  role: string
): Promise<Loaded | null> {
  const keys = wanted.filter((k) => READ_ROLES[k]?.includes(role) ?? true);
  const responses = await Promise.all(keys.map((k) => adminFetch(ENDPOINTS[k])));
  if (responses.some((r) => r.status === 401)) return null;
  const out: Loaded = {};
  await Promise.all(
    keys.map(async (key, i) => {
      const res = responses[i];
      if (key === 'data' && !res.ok) throw new Error('fetch failed');
      const body: any = res.ok ? await res.json().catch(() => ({})) : {};
      switch (key) {
        case 'data':
          out.orders = list<Order>(body, 'orders');
          out.messages = Array.isArray(body?.messages) ? body.messages : [];
          break;
        case 'blogs':
          out.blogs = list<BlogRow>(body, 'blogs');
          break;
        case 'testimonials':
          out.reviews = list<ReviewRow>(body, 'testimonials');
          break;
        case 'services':
          out.services = list<ServiceRow>(body, 'services');
          break;
        case 'accounts':
          out.accounts = Array.isArray(body?.accounts) ? body.accounts : [];
          out.agents = Array.isArray(body?.agents) ? body.agents : [];
          break;
        case 'users':
          out.users = Array.isArray(body?.users) ? body.users : [];
          break;
        case 'expenses':
          out.expenses = Array.isArray(body?.expenses) ? body.expenses : [];
          break;
        case 'capex':
          out.assets = Array.isArray(body?.assets) ? body.assets : [];
          break;
        case 'dividends':
          out.dividends = Array.isArray(body?.dividends) ? body.dividends : [];
          break;
        case 'ledger':
          out.ledger = Array.isArray(body?.entries) ? body.entries : [];
          break;
        case 'shareholders':
          out.shareholders = Array.isArray(body?.shareholders) ? body.shareholders : [];
          break;
        case 'metrics':
          if (body?.metrics) out.metrics = body.metrics;
          break;
        case 'leads':
          out.leads = Array.isArray(body?.leads) ? body.leads : [];
          break;
      }
    })
  );
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
