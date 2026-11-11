'use client';
import { ChevronDown } from 'lucide-react';
import { BRAND, STATUS_LABELS, STATUS_META, STATUS_OPTIONS } from '../_lib/constants';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] md:text-xs font-bold whitespace-nowrap ${STATUS_META[status] || STATUS_META.PENDING}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/** Elegant clickable clinical-stage pill — native select layered invisibly on top. */
export function StagePill({
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

export function Chip({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'gray' }) {
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

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: value >= 100 ? BRAND.green : BRAND.blue }}
      />
    </div>
  );
}
