'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** One pagination footer for every admin table (orders, inquiries, dues,
    expenses, leads) — same spacing, wording and button size everywhere. */
export function Pager({
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
