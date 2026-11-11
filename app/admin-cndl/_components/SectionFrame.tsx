'use client';
import { RefreshCw } from 'lucide-react';
import { NAV_GROUPS } from '../_lib/nav';
import type { TabKey } from '../_lib/types';
import { StatTile, type Kpi } from './StatTile';

/** Section heading, refresh control, KPI row and loading state shared by
    every /admin-cndl/<section> page. */
export function SectionFrame({
  tab,
  kpis = [],
  kpiExtra,
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
  loading: boolean;
  refreshing: boolean;
  lastSyncedAt: number | null;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const group = NAV_GROUPS.find((g) => g.items.some((i) => i.key === tab));
  const label = group?.items.find((i) => i.key === tab)?.label ?? 'Dashboard';
  return (
    <>
      {/* Section toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div>
            {group && (
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5 select-none">
                {group.title}
              </p>
            )}
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums leading-tight">{label}</h1>
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
            onClick={onRefresh}
            className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Context-specific KPI metrics */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {kpis.map((card) => (
            <StatTile key={card.label} card={card} />
          ))}
          {kpiExtra}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm font-bold text-slate-500">
          <RefreshCw size={20} className="animate-spin mr-3" /> Loading dashboard...
        </div>
      ) : (
        children
      )}
    </>
  );
}
