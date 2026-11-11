export type Kpi = {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  fg: string;
  valueCls?: string;
};

/** One KPI card in a section's metric row. */
export function StatTile({ card }: { card: Kpi }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center gap-3 shadow-sm">
      <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${card.bg} ${card.fg}`}>
        <card.icon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 line-clamp-2 leading-tight">
          {card.label}
        </span>
        <span className={`block text-lg sm:text-2xl font-semibold tracking-tight tabular-nums truncate ${card.valueCls || ''}`}>{card.value}</span>
      </span>
    </div>
  );
}
