'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Field, Input, Select } from '../_components/ui';
import { VITA_SHADES } from '../_lib/constants';
import { useAdmin } from '../_lib/session';
import type { ErpAccount } from '../_lib/types';
import { apiError } from '../_lib/utils';

/** A field agent submits a case for one of their own clients; it waits for approval before entering the lab. */
export function SubmitCaseDialog({ accounts, onClose, onSaved }: { accounts: ErpAccount[]; onClose: () => void; onSaved: (caseId: string) => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({ clientAccountId: accounts.length === 1 ? accounts[0].id : '', productName: '', units: '1', patientName: '', toothNo: '', shade: '', quotedAmount: '', deliveryDate: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (!f.clientAccountId) err.clientAccountId = 'Choose the client';
    if (f.productName.trim().length < 2) err.productName = 'Write what work is needed';
    if (f.quotedAmount && !(parseFloat(f.quotedAmount) >= 0)) err.quotedAmount = 'Enter 0 or more';
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`sc-${first}`)?.focus();
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/erp/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, units: Number(f.units) || 1, deliveryDate: f.deliveryDate ? `${f.deliveryDate}T12:00:00+06:00` : '' }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not submit the case'));
      toast.success(`${body.order.caseId} sent for approval`);
      onClose();
      onSaved(body.order.caseId);
    } catch {
      toast.error('Network error — nothing was sent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title="Submit a case"
      description="It goes to the office for approval before it enters the lab."
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Send for approval"
      saving={saving}
      savingLabel="Sending…"
    >
      <Field label="Client" htmlFor="sc-clientAccountId" required error={errors.clientAccountId}>
        <Select id="sc-clientAccountId" value={f.clientAccountId} onChange={set('clientAccountId')} invalid={!!errors.clientAccountId}>
          <option value="">Choose one of your clients</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.ownerName}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Field label="Work needed" htmlFor="sc-productName" required error={errors.productName}>
          <Input id="sc-productName" value={f.productName} onChange={set('productName')} invalid={!!errors.productName} placeholder="e.g. Zirconia crown" />
        </Field>
        <Field label="Units" htmlFor="sc-units">
          <Input id="sc-units" type="number" min={1} max={200} value={f.units} onChange={set('units')} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Patient" htmlFor="sc-patientName">
          <Input id="sc-patientName" value={f.patientName} onChange={set('patientName')} />
        </Field>
        <Field label="Teeth" htmlFor="sc-toothNo">
          <Input id="sc-toothNo" value={f.toothNo} onChange={set('toothNo')} placeholder="e.g. 11, 21" />
        </Field>
        <Field label="Shade" htmlFor="sc-shade">
          <Select id="sc-shade" value={f.shade} onChange={set('shade')}>
            <option value="">—</option>
            {VITA_SHADES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price you quoted (৳)" htmlFor="sc-quotedAmount" error={errors.quotedAmount} hint="The office confirms or changes it.">
          <Input id="sc-quotedAmount" type="number" inputMode="decimal" min={0} value={f.quotedAmount} onChange={set('quotedAmount')} invalid={!!errors.quotedAmount} />
        </Field>
        <Field label="Wanted by" htmlFor="sc-deliveryDate">
          <Input id="sc-deliveryDate" type="date" value={f.deliveryDate} onChange={set('deliveryDate')} />
        </Field>
      </div>
      <Field label="Notes for the office" htmlFor="sc-notes">
        <Input id="sc-notes" value={f.notes} onChange={set('notes')} maxLength={500} />
      </Field>
    </FormDialog>
  );
}
