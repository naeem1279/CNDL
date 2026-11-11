'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Field, Input, Select } from '../_components/ui';
import { EXPENSE_CATEGORY_META } from '../_lib/constants';
import { useAdmin } from '../_lib/session';
import type { ErpExpense } from '../_lib/types';
import { apiError, formatBDT, todayInput } from '../_lib/utils';

type Form = { expenseDate: string; category: string; title: string; amount: string; voucherNo: string; notes: string };
type Errors = Partial<Record<keyof Form, string>>;

/** yyyy-mm-dd of a stored expense date, in Bangladesh time. */
const bdDay = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600000).toISOString().slice(0, 10);

/** Add (ACCOUNTS / SUPERADMIN) or edit (SUPERADMIN, audited) one expense. */
export function ExpenseDialog({ editing, onClose, onSaved }: { editing: ErpExpense | null; onClose: () => void; onSaved: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState<Form>(() => ({
    expenseDate: editing ? bdDay(editing.expenseDate) : todayInput(),
    category: editing?.category || 'RAW_MATERIAL',
    title: editing?.title || '',
    amount: editing ? String(editing.amount) : '',
    voucherNo: editing?.voucherNo || '',
    notes: editing?.notes || '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const amount = parseFloat(f.amount) || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (!f.expenseDate) err.expenseDate = 'Pick the date';
    else if (f.expenseDate > todayInput()) err.expenseDate = 'The date cannot be in the future';
    if (f.title.trim().length < 2) err.title = 'Say what the money was spent on';
    if (!(amount > 0)) err.amount = 'Enter the amount';
    setErrors(err);
    const first = (Object.keys(err) as (keyof Form)[]).find((k) => err[k]);
    if (first) return void document.getElementById(`exp-${first}`)?.focus();
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/erp/expenses?id=${encodeURIComponent(editing.id)}` : '/api/admin/erp/expenses', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: f.category,
          title: f.title.trim(),
          amount,
          voucherNo: f.voucherNo.trim() || null,
          notes: f.notes.trim() || null,
          expenseDate: f.expenseDate,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the expense'));
      toast.success(editing ? 'Expense updated · the previous version is in change history' : `${formatBDT(amount)} expense added`);
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title={editing ? 'Edit expense' : 'Add expense'}
      description={editing ? 'The current version is kept in change history.' : undefined}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={editing ? 'Save changes' : amount > 0 ? `Add ${formatBDT(amount)}` : 'Add expense'}
      saving={saving}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="exp-expenseDate" required error={errors.expenseDate}>
          <Input id="exp-expenseDate" type="date" max={todayInput()} value={f.expenseDate} onChange={set('expenseDate')} invalid={!!errors.expenseDate} />
        </Field>
        <Field label="Category" htmlFor="exp-category">
          <Select id="exp-category" value={f.category} onChange={set('category')}>
            {Object.entries(EXPENSE_CATEGORY_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="What for" htmlFor="exp-title" required error={errors.title}>
        <Input id="exp-title" value={f.title} onChange={set('title')} invalid={!!errors.title} placeholder="e.g. Zirconia blocks, courier, electricity bill" autoFocus={!editing} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (৳)" htmlFor="exp-amount" required error={errors.amount}>
          <Input id="exp-amount" type="number" inputMode="decimal" min={0} value={f.amount} onChange={set('amount')} invalid={!!errors.amount} />
        </Field>
        <Field label="Voucher no." htmlFor="exp-voucherNo">
          <Input id="exp-voucherNo" value={f.voucherNo} onChange={set('voucherNo')} />
        </Field>
      </div>
      <Field label="Notes" htmlFor="exp-notes">
        <textarea
          id="exp-notes"
          rows={2}
          value={f.notes}
          onChange={set('notes')}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-body text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </Field>
    </FormDialog>
  );
}
