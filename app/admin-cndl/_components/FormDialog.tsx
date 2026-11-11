'use client';
import { X } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { Button, IconButton } from './ui';

/**
 * Standard create/edit form dialog: bottom sheet on phones, centred card from
 * `sm` up. Escape closes it; a backdrop click never does, so a stray tap
 * cannot throw away what was typed.
 */
export function FormDialog({
  title,
  description,
  onClose,
  onSubmit,
  submitLabel,
  saving,
  savingLabel = 'Saving…',
  wide = false,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  saving?: boolean;
  savingLabel?: string;
  /** Wider card (for long-form editors such as blog articles). */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ModalShell
      onClose={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-6"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-title font-semibold text-zinc-900">{title}</h2>
            {description && <p className="mt-0.5 text-meta text-zinc-500">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} className="-mr-1.5 shrink-0" />
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        <footer className="flex flex-col-reverse gap-2 border-t border-zinc-100 px-5 py-3 pb-5 sm:flex-row sm:justify-end sm:pb-3">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? savingLabel : submitLabel}
          </Button>
        </footer>
      </form>
    </ModalShell>
  );
}
