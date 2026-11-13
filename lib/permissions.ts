/**
 * Admin console permissions — the single source of truth.
 *
 * - A permission is a key like "cases.move_stage". A role is a named set of them.
 * - Every admin API route asks for a permission (lib/access.ts `requirePermission`), never for a role name.
 * - The console shows tabs and buttons from the same keys, so a screen and its data can never disagree.
 * - LOCKED keys belong to Super Admin forever: they cannot be given to any other role, even by Super Admin,
 *   and are stripped from any stored role as a second line of defence.
 *
 * This file is pure (no database, no React), so server routes and client screens both import it.
 */

export type PermissionDef = {
  key: string;
  label: string;
  group: string;
  /** One line that tells a Super Admin what ticking this box allows. */
  hint: string;
  /** Super Admin only, forever. Never grantable. */
  locked?: boolean;
};

export const SUPERADMIN_KEY = 'SUPERADMIN';

export const PERMISSION_GROUPS = [
  'Cases',
  'Client inquiries',
  'Clients',
  'Dues and collections',
  'Agents',
  'Daily expenses',
  'Machinery and CapEx',
  'Overview',
  'Shareholders',
  'Products',
  'Content',
  'Leads',
  'Files',
  'Administration',
] as const;

export const PERMISSIONS: PermissionDef[] = [
  // Cases
  { key: 'cases.view', group: 'Cases', label: 'See all cases', hint: 'The Lab Cases list with every case.' },
  { key: 'cases.view_own', group: 'Cases', label: 'See only their own cases', hint: 'Cases credited to this person (field agents).' },
  { key: 'cases.view_money', group: 'Cases', label: 'See billed amounts and commission', hint: 'Without this the money fields are removed from every case they receive.' },
  { key: 'cases.create', group: 'Cases', label: 'Record new cases', hint: 'Cases that came in by rider, phone or WhatsApp.' },
  { key: 'cases.move_stage', group: 'Cases', label: 'Move cases between stages', hint: 'Dispatching a case also posts its invoice automatically.' },
  { key: 'cases.delete', group: 'Cases', label: 'Delete cases permanently', hint: 'Super Admin only.', locked: true },
  // Client inquiries
  { key: 'messages.view', group: 'Client inquiries', label: 'Read client inquiries', hint: 'Messages sent through the website contact form.' },
  // Clients
  { key: 'clients.view', group: 'Clients', label: 'See all client accounts', hint: 'Every client with what they owe.' },
  { key: 'clients.view_own', group: 'Clients', label: 'See only their assigned clients', hint: 'Clients assigned to this person (field agents).' },
  { key: 'clients.create', group: 'Clients', label: 'Add client accounts', hint: 'An opening balance also needs "Record invoices".' },
  { key: 'clients.edit', group: 'Clients', label: 'Edit client accounts', hint: 'Names, phones, agent, discount notes.' },
  { key: 'clients.delete', group: 'Clients', label: 'Delete client accounts permanently', hint: 'Super Admin only.', locked: true },
  // Dues and collections
  { key: 'ledger.view', group: 'Dues and collections', label: 'See all invoices and collections', hint: 'The whole ledger.' },
  { key: 'ledger.view_own', group: 'Dues and collections', label: 'See only their clients’ ledger', hint: 'Entries for assigned clients or collected by them.' },
  { key: 'ledger.invoice', group: 'Dues and collections', label: 'Record invoices', hint: 'Creates or increases what a client owes, including discounts.' },
  { key: 'ledger.collect', group: 'Dues and collections', label: 'Record collections for any client', hint: 'Can also mark a collection verified when recording it.' },
  { key: 'ledger.collect_own', group: 'Dues and collections', label: 'Record collections for their own clients', hint: 'Cannot verify their own cash.' },
  { key: 'ledger.verify', group: 'Dues and collections', label: 'Verify collections', hint: 'The accounts team’s sign-off on cash received.' },
  // Agents
  { key: 'agents.payout', group: 'Agents', label: 'Pay agent commission', hint: 'Records a commission payout to a field agent.' },
  // Daily expenses
  { key: 'expenses.view', group: 'Daily expenses', label: 'See daily expenses', hint: 'Shows the Daily Expenses section.' },
  { key: 'expenses.create', group: 'Daily expenses', label: 'Log expenses', hint: '' },
  { key: 'expenses.edit', group: 'Daily expenses', label: 'Edit expenses', hint: 'Every edit keeps a copy of the original.' },
  { key: 'expenses.audit', group: 'Daily expenses', label: 'See the expense edit history', hint: '' },
  { key: 'expenses.delete', group: 'Daily expenses', label: 'Delete expenses permanently', hint: 'Super Admin only.', locked: true },
  // Machinery and CapEx
  { key: 'capex.view', group: 'Machinery and CapEx', label: 'See machinery and CapEx', hint: 'Shows the Machinery section.' },
  { key: 'capex.manage', group: 'Machinery and CapEx', label: 'Add and edit machinery', hint: '' },
  { key: 'capex.delete', group: 'Machinery and CapEx', label: 'Delete machinery permanently', hint: 'Super Admin only.', locked: true },
  // Overview
  { key: 'overview.view', group: 'Overview', label: 'See the Overview', hint: 'Sales, collections, expenses and dues at a glance.' },
  // Shareholders
  { key: 'shareholders.view', group: 'Shareholders', label: 'See shareholders and profit & loss', hint: 'Includes reading the expenses and ledger figures behind the P&L.' },
  { key: 'shareholders.manage', group: 'Shareholders', label: 'Add and edit shareholders', hint: '' },
  { key: 'shareholders.payout', group: 'Shareholders', label: 'Record payouts and run profit', hint: 'Super Admin only.', locked: true },
  { key: 'shareholders.delete', group: 'Shareholders', label: 'Delete shareholders permanently', hint: 'Super Admin only.', locked: true },
  // Products
  { key: 'products.view', group: 'Products', label: 'See the product list', hint: 'Needed to record a case.' },
  { key: 'products.manage', group: 'Products', label: 'Add and edit products', hint: 'Shows the Dental Products section.' },
  { key: 'products.delete', group: 'Products', label: 'Delete products permanently', hint: 'Super Admin only.', locked: true },
  // Content
  { key: 'blogs.view', group: 'Content', label: 'See blog articles', hint: '' },
  { key: 'blogs.manage', group: 'Content', label: 'Write and edit blog articles', hint: 'Shows the Blog Articles section.' },
  { key: 'blogs.delete', group: 'Content', label: 'Delete blog articles permanently', hint: 'Super Admin only.', locked: true },
  { key: 'reviews.view', group: 'Content', label: 'See testimonials', hint: '' },
  { key: 'reviews.manage', group: 'Content', label: 'Approve and edit testimonials', hint: 'Shows the Testimonials section.' },
  { key: 'reviews.delete', group: 'Content', label: 'Delete testimonials permanently', hint: 'Super Admin only.', locked: true },
  // Leads
  { key: 'leads.manage', group: 'Leads', label: 'Manage dental leads', hint: 'See and update the lead pipeline.' },
  // Files
  { key: 'uploads.create', group: 'Files', label: 'Upload images', hint: 'Needed to add pictures to articles and products.' },
  // Administration
  { key: 'users.manage', group: 'Administration', label: 'Manage team members', hint: 'Super Admin only.', locked: true },
  { key: 'roles.manage', group: 'Administration', label: 'Manage roles and permissions', hint: 'Super Admin only.', locked: true },
  { key: 'exports.run', group: 'Administration', label: 'Export lists', hint: 'Super Admin only.', locked: true },
  { key: 'audit.view', group: 'Administration', label: 'See the roles and access history', hint: 'Super Admin only.', locked: true },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);
export const LOCKED_PERMISSION_KEYS: ReadonlySet<string> = new Set(PERMISSIONS.filter((p) => p.locked).map((p) => p.key));
const KNOWN: ReadonlySet<string> = new Set(ALL_PERMISSION_KEYS);

export const isKnownPermission = (key: string) => KNOWN.has(key);
export const isLockedPermission = (key: string) => LOCKED_PERMISSION_KEYS.has(key);

/** Known, de-duplicated and sorted. Locked keys are dropped unless `keepLocked` (only Super Admin's own list). */
export function sanitizePermissions(list: unknown, { keepLocked = false } = {}): string[] {
  if (!Array.isArray(list)) return [];
  const out = new Set<string>();
  for (const k of list) if (typeof k === 'string' && KNOWN.has(k) && (keepLocked || !LOCKED_PERMISSION_KEYS.has(k))) out.add(k);
  return [...out].sort();
}

export type BuiltInRole = { key: string; name: string; description: string; permissions: string[] };

/**
 * The built-in roles. CHAIRMAN, ACCOUNTS and AGENT reproduce what those roles could do before roles became
 * editable, with these deliberate exceptions (all confirmed by the owner):
 * - recording shareholder payouts, deleting shareholders, deleting blogs and testimonials are Super Admin only;
 * - the sidebar and the data now agree: Chairman and Accounts no longer receive client inquiries, Accounts no
 *   longer reads machinery, and Chairman no longer writes blogs or testimonials (he has no screen for them);
 * - PARTNER_LAB and DOCTOR (which cannot sign in) start with no permissions.
 * MODERATOR and PRODUCTION are new.
 */
export const BUILTIN_ROLES: BuiltInRole[] = [
  { key: SUPERADMIN_KEY, name: 'Super Admin', description: 'Everything, always. Cannot be edited.', permissions: ALL_PERMISSION_KEYS },
  {
    key: 'CHAIRMAN',
    name: 'Chairman',
    description: 'Overview, cases, dues, machinery and shareholders (read-mostly).',
    permissions: ['cases.view', 'cases.view_money', 'cases.move_stage', 'clients.view', 'clients.create', 'ledger.view', 'ledger.collect', 'overview.view', 'capex.view', 'shareholders.view', 'shareholders.manage', 'products.view', 'blogs.view', 'reviews.view'],
  },
  {
    key: 'ACCOUNTS',
    name: 'Accounts',
    description: 'Cases, dues and collections, expenses and the shareholder register.',
    permissions: ['cases.view', 'cases.view_money', 'cases.create', 'cases.move_stage', 'clients.view', 'clients.create', 'ledger.view', 'ledger.invoice', 'ledger.collect', 'ledger.verify', 'agents.payout', 'overview.view', 'shareholders.view', 'shareholders.manage', 'expenses.view', 'expenses.create', 'products.view', 'blogs.view', 'reviews.view'],
  },
  {
    key: 'AGENT',
    name: 'Field agent',
    description: 'Their own clients’ dues and collections.',
    permissions: ['cases.view_own', 'cases.view_money', 'clients.view_own', 'clients.create', 'ledger.view_own', 'ledger.collect_own', 'products.view', 'blogs.view', 'reviews.view'],
  },
  { key: 'PARTNER_LAB', name: 'Partner lab', description: 'No console access until Super Admin grants some.', permissions: [] },
  { key: 'DOCTOR', name: 'Doctor', description: 'No console access until Super Admin grants some.', permissions: [] },
  {
    key: 'MODERATOR',
    name: 'Content moderator',
    description: 'Blog articles, testimonials, client inquiries and leads. No money, no cases.',
    permissions: ['blogs.view', 'blogs.manage', 'reviews.view', 'reviews.manage', 'messages.view', 'leads.manage', 'uploads.create'],
  },
  {
    key: 'PRODUCTION',
    name: 'Production',
    description: 'See cases and move them between stages. No money fields.',
    permissions: ['cases.view', 'cases.move_stage'],
  },
];

export const BUILTIN_ROLE_KEYS: ReadonlySet<string> = new Set(BUILTIN_ROLES.map((r) => r.key));
export const builtInRole = (key: string) => BUILTIN_ROLES.find((r) => r.key === key) ?? null;

export const hasPermission = (perms: readonly string[] | ReadonlySet<string>, key: string) =>
  Array.isArray(perms) ? (perms as readonly string[]).includes(key) : (perms as ReadonlySet<string>).has(key);
export const hasAnyPermission = (perms: readonly string[] | ReadonlySet<string>, keys: readonly string[]) => keys.some((k) => hasPermission(perms, k));

/**
 * Console sections and the permission that shows each one (any listed key is enough).
 * Order is the sidebar order; the first visible section is the landing page.
 */
export const TAB_PERMISSIONS: { tab: string; any: string[] }[] = [
  { tab: 'overview', any: ['overview.view'] },
  { tab: 'orders', any: ['cases.view'] },
  { tab: 'products', any: ['products.manage'] },
  { tab: 'dues', any: ['ledger.view', 'ledger.view_own'] },
  { tab: 'expenses', any: ['expenses.view'] },
  { tab: 'capex', any: ['capex.view'] },
  { tab: 'shareholders', any: ['shareholders.view'] },
  { tab: 'messages', any: ['messages.view'] },
  { tab: 'leads', any: ['leads.manage'] },
  { tab: 'blogs', any: ['blogs.manage'] },
  { tab: 'reviews', any: ['reviews.manage'] },
  { tab: 'users', any: ['users.manage'] },
  { tab: 'access', any: ['roles.manage'] },
];

export function visibleTabs(perms: readonly string[] | ReadonlySet<string>): string[] {
  return TAB_PERMISSIONS.filter((t) => hasAnyPermission(perms, t.any)).map((t) => t.tab);
}
