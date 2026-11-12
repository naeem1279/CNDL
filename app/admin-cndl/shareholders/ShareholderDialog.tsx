'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Field, Input } from '../_components/ui';
import { TOTAL_SHARES } from '../_lib/constants';
import { MIN_SHARES, formatShares, hasTwoDecimalsAtMost, roundShares, toHundredths } from '@/lib/shares';
import { useAdmin } from '../_lib/session';
import type { ErpShareholder } from '../_lib/types';
import { apiError } from '../_lib/utils';

type Form = { name: string; phone: string; address: string; sharesCount: string; paymentDetails: string; notes: string };
type Errors = Partial<Record<keyof Form, string>>;

const TEXTAREA =
  'block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-body text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

/** Add or edit one shareholder. `available` is how many shares this person may hold
    (unallocated shares, plus their own when editing). */
export function ShareholderDialog({
  editing,
  available,
  onClose,
  onSaved,
}: {
  editing: ErpShareholder | null;
  available: number;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [form, setForm] = useState<Form>(() => ({
    name: editing?.name ?? '',
    phone: editing?.phone ?? '',
    address: editing?.address ?? '',
    sharesCount: editing ? formatShares(editing.sharesCount) : available >= 1 ? '1' : available > 0 ? formatShares(available) : '',
    paymentDetails: editing?.paymentDetails ?? '',
    notes: editing?.notes ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = 'Enter the full name (at least 2 characters)';
    const n = Number(form.sharesCount);
    if (!form.sharesCount.trim() || !Number.isFinite(n) || n < MIN_SHARES) e.sharesCount = `Enter at least ${MIN_SHARES} share (e.g. 0.5 or 2)`;
    else if (!hasTwoDecimalsAtMost(n)) e.sharesCount = 'Use at most 2 decimal places (e.g. 0.25)';
    else if (toHundredths(n) > toHundredths(available))
      e.sharesCount = available > 0 ? `Only ${formatShares(available)} ${available > 1 ? 'shares are' : 'share is'} available` : 'No shares are available';
    if (form.phone.trim() && form.phone.trim().length < 6) e.phone = 'Phone must be at least 6 characters';
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`sh-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/erp/shareholders/${editing.id}` : '/api/admin/erp/shareholders', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          sharesCount: roundShares(Number(form.sharesCount)),
          paymentDetails: form.paymentDetails.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(apiError(body, 'Could not save the shareholder'));
        return;
      }
      toast.success(editing ? `${form.name.trim()} updated` : `${form.name.trim()} added`);
      onClose();
      await onSaved();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title={editing ? 'Edit shareholder' : 'Add shareholder'}
      description={`${formatShares(available)} of ${TOTAL_SHARES} shares available${editing ? ' to this shareholder' : ''}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={editing ? 'Save changes' : 'Add shareholder'}
      saving={saving}
    >
      <Field
        label="Full name"
        htmlFor="sh-name"
        required
        error={errors.name}
        hint={editing ? 'Past payouts stay recorded under the name they were paid to.' : undefined}
      >
        <Input id="sh-name" value={form.name} onChange={set('name')} invalid={!!errors.name} autoComplete="off" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shares" htmlFor="sh-sharesCount" required error={errors.sharesCount} hint={`${MIN_SHARES} to ${formatShares(available)} · decimals allowed, e.g. 0.5`}>
          <Input
            id="sh-sharesCount"
            type="number"
            inputMode="decimal"
            step={MIN_SHARES}
            min={MIN_SHARES}
            max={available}
            value={form.sharesCount}
            onChange={set('sharesCount')}
            invalid={!!errors.sharesCount}
          />
        </Field>
        <Field label="Phone" htmlFor="sh-phone" error={errors.phone}>
          <Input id="sh-phone" type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="01XXXXXXXXX" />
        </Field>
      </div>
      <Field label="Payment details" htmlFor="sh-paymentDetails" hint="bKash number, or bank and account number">
        <Input id="sh-paymentDetails" value={form.paymentDetails} onChange={set('paymentDetails')} />
      </Field>
      <Field label="Address" htmlFor="sh-address">
        <Input id="sh-address" value={form.address} onChange={set('address')} />
      </Field>
      <Field label="Notes" htmlFor="sh-notes">
        <textarea id="sh-notes" rows={2} value={form.notes} onChange={set('notes')} className={TEXTAREA} placeholder="Agreement reference, remarks" />
      </Field>
    </FormDialog>
  );
}
