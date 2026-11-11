'use client';
import { RefreshCw } from 'lucide-react';
import { NAV_GROUPS } from '../_lib/nav';
import type { TabKey } from '../_lib/types';
import { StatTile, type Kpi } from './StatTile';
import { IconButton, Skeleton } from './ui';

/** Page header (section group, title, sync time, refresh, page actions), the
    KPI row and the loading state shared by every /admin-cndl/<section> page. */
export function SectionFrame({
  tab,
  kpis = [],
  kpiExtra,
  actions,
  description,
  loading,
  refreshing,
  lastSyncedAt,
  onRefresh,
  children,
}: {
  tab: TabKey;
  kpis?: Kpi[];
  /** Extra tile(s) appended to the KPI grid (e.g. the dividend calculator). */
  kpiExtra?: React.ReactNode;
  /** Primary page actions, shown at the right of the header. */
  actions?: React.ReactNode;
  description?: React.ReactNode;
  loading: boolean;
  refreshing: boolean;
  lastSyncedAt: number | null;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const group = NAV_GROUPS.find((g) => g.items.some((i) => i.key === tab));
  const label = group?.items.find((i) => i.key === tab)?.label ?? 'Dashboard';
  const synced = lastSyncedAt
    ? `Updated ${new Date(lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : null;
  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {group && <p className="text-meta font-medium text-zinc-500">{group.title}</p>}
          <h1 className="mt-0.5 text-page font-semibold tracking-tight text-zinc-900">{label}</h1>
          {description && <p className="mt-1 max-w-2xl text-body text-zinc-500">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {synced && (
            <span className="hidden text-meta text-zinc-400 tabular-nums md:inline" aria-live="polite">
              {refreshing ? 'Updating…' : synced}
            </span>
          )}
          <IconButton
            icon={({ size, className }) => <RefreshCw size={size} className={`${className ?? ''} ${refreshing ? 'animate-spin' : ''}`} />}
            label="Refresh data"
            variant="secondary"
            onClick={onRefresh}
            disabled={refreshing}
          />
          {actions}
        </div>
      </header>

      {kpis.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
          {loading
            ? kpis.map((k) => <Skeleton key={k.label} className="h-[106px] rounded-lg" />)
            : kpis.map((card) => <StatTile key={card.label} card={card} />)}
          {!loading && kpiExtra}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        children
      )}
    </>
  );
}
