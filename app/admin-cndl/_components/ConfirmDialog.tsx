'use client';
import { useDialog } from './ModalShell';

export type ConfirmRequest = { title: string; message: string; confirmLabel: string };

/** In-app replacement for window.confirm: Escape or Cancel declines. */
export function ConfirmDialog({ request, onResolve }: { request: ConfirmRequest; onResolve: (ok: boolean) => void }) {
  useDialog(() => onResolve(false));
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cndl-confirm-title"
        aria-describedby="cndl-confirm-body"
        className="bg-white w-full sm:max-w-md rounded-t-xl sm:rounded-xl shadow-xl p-6"
      >
        <h3 id="cndl-confirm-title" className="text-base font-semibold text-slate-900">
          {request.title}
        </h3>
        <p id="cndl-confirm-body" className="mt-2 text-sm leading-relaxed text-slate-600">
          {request.message}
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => onResolve(false)}
            className="min-h-[40px] px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className="min-h-[40px] px-4 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
