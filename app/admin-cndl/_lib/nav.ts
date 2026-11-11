import {
  Cpu, FileText, Landmark, Layers, LayoutDashboard, MapPin, MessageSquare, Package, Star,
  TrendingDown, Users, Wallet,
} from 'lucide-react';
import type { TabKey } from './types';

export type NavItem = {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  live?: boolean;
};

/** Sidebar groups, in display order. Each key is also the section's route:
    /admin-cndl/<key>. */
export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Command Center',
    items: [{ key: 'overview', label: 'Overview', icon: LayoutDashboard, live: true }],
  },
  {
    title: 'Lab Operations',
    items: [
      { key: 'orders', label: 'Lab Cases', icon: Layers },
      { key: 'products', label: 'Dental Products', icon: Package },
    ],
  },
  {
    title: 'Finance & ERP',
    items: [
      { key: 'dues', label: 'Client Dues', icon: Wallet },
      { key: 'expenses', label: 'Daily Expenses', icon: TrendingDown },
      { key: 'capex', label: 'Machinery & CapEx', icon: Cpu },
      { key: 'shareholders', label: 'Shareholders & P&L', icon: Landmark },
    ],
  },
  {
    title: 'Growth & CMS',
    items: [
      { key: 'leads', label: 'Dental Leads', icon: MapPin },
      { key: 'messages', label: 'Client Inquiries', icon: MessageSquare },
      { key: 'blogs', label: 'Blog Articles', icon: FileText },
      { key: 'reviews', label: 'Testimonials', icon: Star },
    ],
  },
  {
    title: 'Access & Team',
    items: [{ key: 'users', label: 'Team & Staff', icon: Users }],
  },
];

export const adminPath = (tab: TabKey) => `/admin-cndl/${tab}`;

/** The section a pathname belongs to, or null for /admin-cndl itself. */
export function tabFromPath(pathname: string | null): TabKey | null {
  const seg = (pathname ?? '').split('/')[2] ?? '';
  return NAV_GROUPS.some((g) => g.items.some((i) => i.key === seg)) ? (seg as TabKey) : null;
}
