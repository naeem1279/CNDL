'use client';
import { RefreshCw } from 'lucide-react';
import { STATUS_OPTIONS } from '../_lib/constants';
import type { Order } from '../_lib/types';

export function CaseControls({
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
