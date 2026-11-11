'use client';
import { useDialog } from './ModalShell';
import { buttonClass } from './ui';

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  /** "danger" (default) for deletes and removals; "primary" for actions such as recording payouts. */
  tone?: 'danger' | 'primary';
};

/** Optional wording for askConfirm; anything left out is derived from the message. */
export type ConfirmOptions = Partial<Omit<ConfirmRequest, 'message'>>;

/** In-app replacement for window.confirm: Escape or Cancel declines. */
export function ConfirmDialog({ request, onResolve }: { request: ConfirmRequest; onResolve: (ok: boolean) => void }) {
  useDialog(() => onResolve(false));
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cndl-confirm-title"
        aria-describedby="cndl-confirm-body"
        className="w-full rounded-t-xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6"
      >
        <h3 id="cndl-confirm-title" className="text-title font-semibold text-zinc-900">
          {request.title}
        </h3>
        <p id="cndl-confirm-body" className="mt-2 text-body text-zinc-600 [overflow-wrap:anywhere]">
          {request.message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={() => onResolve(false)} className={buttonClass('secondary')}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={buttonClass(request.tone === 'primary' ? 'primary' : 'danger')}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
