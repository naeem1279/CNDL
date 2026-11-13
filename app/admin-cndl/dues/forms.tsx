'use client';
import { hasPermission } from '@/lib/permissions';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Button, Field, Input, Select } from '../_components/ui';
import { DIVISIONS, PAYMENT_METHODS } from '../_lib/constants';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent } from '../_lib/types';
import { apiError, formatBDT, todayInput } from '../_lib/utils';

const TEXTAREA =
  'block w-full rounded-lg border bg-white px-3 py-2 text-body text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

/** Role rules mirrored from the API so nobody is shown a button the server refuses. */
export function duesPermissions(permissions: readonly string[]) {
  const has = (k: string) => hasPermission(permissions, k);
  return {
    /** Sees only their own clients and collections (a field agent). */
    isAgent: !has('ledger.view') && has('ledger.view_own'),
    canInvoice: has('ledger.invoice'),
    canVerify: has('ledger.verify'),
    canEditAccount: has('clients.edit'),
    canSetOpeningDue: has('ledger.invoice'),
  };
}

const focusFirst = (prefix: string, errors: Record<string, string | undefined>) => {
  const k = Object.keys(errors).find((x) => errors[x]);
  if (k) document.getElementById(`${prefix}-${k}`)?.focus();
};

async function postJson(adminFetch: ReturnType<typeof useAdmin>['adminFetch'], url: string, method: string, body: unknown) {
  const res = await adminFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/* ------------------------------------------------------------- invoice */

export function InvoiceDialog({ account, onClose, onSaved }: { account: ErpAccount; onClose: () => void; onSaved: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({ gross: '', discount: '', orderId: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const gross = parseFloat(f.gross) || 0;
  const discount = parseFloat(f.discount) || 0;
  const net = Math.max(0, gross - discount);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (!(gross > 0)) err.gross = 'Enter the invoice amount';
    if (discount < 0 || discount > gross) err.discount = 'Discount must be between 0 and the gross amount';
    if (discount > 0 && !f.notes.trim()) err.notes = 'Say why the discount was given';
    setErrors(err);
    if (Object.values(err).some(Boolean)) return focusFirst('inv', err);
    setSaving(true);
    try {
      const { res, data } = await postJson(adminFetch, '/api/admin/erp/ledger', 'POST', {
        transactionType: 'INVOICE',
        clientAccountId: account.id,
        grossAmount: gross,
        discountAmount: discount,
        orderId: f.orderId.trim() || null,
        notes: f.notes.trim() || null,
      });
      if (res.status === 401) return handleAuthLoss();
      if (!res.ok) return void toast.error(apiError(data, 'Could not record the invoice'));
      toast.success(`Invoice of ${formatBDT(net)} added to ${account.name}`);
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was recorded');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title="Record invoice"
      description={`${account.name} · owes ${formatBDT(account.currentBalance)}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={net > 0 ? `Record ${formatBDT(net)}` : 'Record invoice'}
      saving={saving}
      savingLabel="Recording…"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (৳)" htmlFor="inv-gross" required error={errors.gross}>
          <Input id="inv-gross" type="number" inputMode="decimal" min={0} value={f.gross} onChange={set('gross')} invalid={!!errors.gross} autoFocus />
        </Field>
        <Field label="Discount (৳)" htmlFor="inv-discount" error={errors.discount}>
          <Input id="inv-discount" type="number" inputMode="decimal" min={0} value={f.discount} onChange={set('discount')} invalid={!!errors.discount} placeholder="0" />
        </Field>
      </div>
      <Field label="Case ID" htmlFor="inv-orderId" hint="Optional: link the lab case this bill is for">
        <Input id="inv-orderId" value={f.orderId} onChange={set('orderId')} placeholder="CNDL-…" />
      </Field>
      <Field label="Note" htmlFor="inv-notes" required={discount > 0} error={errors.notes} hint={discount > 0 ? 'Required when a discount is given' : undefined}>
        <textarea id="inv-notes" rows={2} value={f.notes} onChange={set('notes')} className={`${TEXTAREA} ${errors.notes ? 'border-rose-400' : 'border-zinc-200'}`} aria-invalid={!!errors.notes || undefined} />
      </Field>
      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
        <span className="text-table text-zinc-600">Adds to their due</span>
        <span className="text-title font-semibold text-zinc-900 tabular-nums">{formatBDT(net)}</span>
      </div>
    </FormDialog>
  );
}

/* ---------------------------------------------------------- collection */

export function CollectionDialog({
  account,
  agents,
  onClose,
  onSaved,
}: {
  account: ErpAccount;
  agents: ErpAgent[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { me, adminFetch, handleAuthLoss } = useAdmin();
  const perm = duesPermissions(me.permissions);
  const [f, setF] = useState({
    amount: '',
    method: '',
    date: todayInput(),
    collectedById: '',
    notes: '',
    verified: false,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const amount = parseFloat(f.amount) || 0;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (!(amount > 0)) err.amount = 'Enter the amount collected';
    if (!f.date) err.date = 'Pick the date the money was received';
    else if (f.date > todayInput()) err.date = 'The date cannot be in the future';
    setErrors(err);
    if (Object.values(err).some(Boolean)) return focusFirst('col', err);
    setSaving(true);
    try {
      const { res, data } = await postJson(adminFetch, '/api/admin/erp/ledger', 'POST', {
        transactionType: 'PAYMENT',
        clientAccountId: account.id,
        netAmount: amount,
        collectedById: perm.isAgent ? me.uid || null : f.collectedById || null,
        isVerified: perm.isAgent ? false : f.verified,
        paymentMethod: f.method || null,
        paymentDate: new Date(`${f.date}T12:00:00`).toISOString(),
        notes: f.notes.trim() || null,
      });
      if (res.status === 401) return handleAuthLoss();
      if (!res.ok) return void toast.error(apiError(data, 'Could not record the collection'));
      toast.success(`${formatBDT(amount)} collected from ${account.name}`);
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was recorded');
    } finally {
      setSaving(false);
    }
  };

  const after = account.currentBalance - amount;
  return (
    <FormDialog
      title="Record collection"
      description={`${account.name} · owes ${formatBDT(account.currentBalance)}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={amount > 0 ? `Record ${formatBDT(amount)}` : 'Record collection'}
      saving={saving}
      savingLabel="Recording…"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (৳)" htmlFor="col-amount" required error={errors.amount}>
          <Input id="col-amount" type="number" inputMode="decimal" min={0} value={f.amount} onChange={set('amount')} invalid={!!errors.amount} autoFocus />
        </Field>
        <Field label="Method" htmlFor="col-method">
          <Select id="col-method" value={f.method} onChange={set('method')}>
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
      {account.currentBalance > 0 && (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setF((x) => ({ ...x, amount: String(Math.round(account.currentBalance)) }))}>
            Full due {formatBDT(account.currentBalance)}
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Received on" htmlFor="col-date" required error={errors.date} hint="Earlier dates are allowed">
          <Input id="col-date" type="date" max={todayInput()} value={f.date} onChange={set('date')} invalid={!!errors.date} />
        </Field>
        <Field label="Collected by" htmlFor="col-collectedById">
          {perm.isAgent ? (
            <Input id="col-collectedById" value={`${me.name} (you)`} disabled />
          ) : (
            <Select id="col-collectedById" value={f.collectedById} onChange={set('collectedById')}>
              <option value="">Office / not an agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Reference" htmlFor="col-notes" hint="bKash TrxID, cheque number or receipt">
        <Input id="col-notes" value={f.notes} onChange={set('notes')} />
      </Field>
      {perm.canVerify ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 hover:bg-zinc-50">
          <input type="checkbox" checked={f.verified} onChange={set('verified')} className="mt-0.5 h-4 w-4 accent-brand-600" />
          <span className="text-body text-zinc-700">
            Money confirmed received
            <span className="block text-meta text-zinc-500">Tick only if the cash, bank transfer or bKash has arrived.</span>
          </span>
        </label>
      ) : (
        <p className="text-meta text-zinc-500">The accounts team verifies this collection once the money arrives.</p>
      )}
      {amount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
          <span className="text-table text-zinc-600">Due after this</span>
          <span className={`text-title font-semibold tabular-nums ${after < 0 ? 'text-amber-700' : 'text-zinc-900'}`}>
            {after < 0 ? `${formatBDT(-after)} advance` : formatBDT(after)}
          </span>
        </div>
      )}
    </FormDialog>
  );
}

/* ------------------------------------------------------------- account */

type AccountForm = {
  accountType: string;
  institutionType: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  division: string;
  district: string;
  address: string;
  assignedAgentId: string;
  openingDue: string;
};

export function AccountDialog({
  editing,
  agents,
  defaultDivision,
  onClose,
  onSaved,
}: {
  editing: ErpAccount | null;
  agents: ErpAgent[];
  defaultDivision: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { me, adminFetch, handleAuthLoss } = useAdmin();
  const perm = duesPermissions(me.permissions);
  const [f, setF] = useState<AccountForm>(() => ({
    accountType: editing?.accountType || 'CHAMBER',
    institutionType: editing?.institutionType || 'CHAMBER',
    name: editing?.name || '',
    ownerName: editing?.ownerName || '',
    phone: editing?.phone || '',
    email: editing?.email || '',
    division: editing?.division || defaultDivision,
    district: editing?.district || '',
    address: editing?.address || '',
    // An agent's new account is assigned to them, or it would vanish from their list.
    assignedAgentId: editing ? editing.assignedAgentId || '' : perm.isAgent ? me.uid : '',
    openingDue: '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof AccountForm, string>>>({});
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
    if (k === 'phone') setDuplicateOf(null);
  };

  const save = async (allowDuplicate: boolean) => {
    const err: Partial<Record<keyof AccountForm, string>> = {};
    if (f.name.trim().length < 2) err.name = 'Enter the account name';
    if (f.ownerName.trim().length < 2) err.ownerName = "Enter the owner's name";
    if (f.phone.replace(/\D/g, '').length < 6) err.phone = 'Enter a phone number';
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) err.email = 'Enter a valid email or leave it empty';
    if (f.openingDue && !(parseFloat(f.openingDue) >= 0)) err.openingDue = 'Enter 0 or more';
    setErrors(err);
    if (Object.values(err).some(Boolean)) return focusFirst('acc', err);
    setSaving(true);
    try {
      const base = {
        accountType: f.accountType,
        institutionType: f.institutionType,
        name: f.name.trim(),
        ownerName: f.ownerName.trim(),
        phone: f.phone.trim(),
        email: f.email.trim() || null,
        division: f.division,
        district: f.district.trim() || null,
        address: f.address.trim() || null,
        assignedAgentId: f.assignedAgentId || null,
      };
      const { res, data } = editing
        ? await postJson(adminFetch, `/api/admin/erp/accounts/${editing.id}`, 'PUT', base)
        : await postJson(adminFetch, '/api/admin/erp/accounts', 'POST', {
            ...base,
            openingDue: perm.canSetOpeningDue ? f.openingDue || '0' : '0',
            allowDuplicate: allowDuplicate || undefined,
          });
      if (res.status === 401) return handleAuthLoss();
      if (res.status === 409 && data?.warning === 'DUPLICATE_PHONE') {
        setDuplicateOf(data.existingName || 'another account');
        return;
      }
      if (!res.ok) return void toast.error(apiError(data, 'Could not save the account'));
      toast.success(editing ? `${base.name} updated` : `${base.name} added`);
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
      title={editing ? 'Edit client account' : 'Add client account'}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        void save(false);
      }}
      submitLabel={editing ? 'Save changes' : 'Add account'}
      saving={saving}
    >
      {duplicateOf && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-table text-amber-900">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle size={14} aria-hidden="true" /> This phone already belongs to {duplicateOf}
          </p>
          <p className="mt-1 text-meta text-amber-800">Use a different number, or add it anyway if this really is a separate account.</p>
          {!editing && (
            <Button size="sm" variant="secondary" className="mt-2" onClick={() => void save(true)} disabled={saving}>
              Add anyway
            </Button>
          )}
        </div>
      )}
      <Field label="Account name" htmlFor="acc-name" required error={errors.name}>
        <Input id="acc-name" value={f.name} onChange={set('name')} invalid={!!errors.name} placeholder="e.g. Smile Care Dental" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Owner" htmlFor="acc-ownerName" required error={errors.ownerName}>
          <Input id="acc-ownerName" value={f.ownerName} onChange={set('ownerName')} invalid={!!errors.ownerName} />
        </Field>
        <Field label="Phone" htmlFor="acc-phone" required error={errors.phone}>
          <Input id="acc-phone" type="tel" value={f.phone} onChange={set('phone')} invalid={!!errors.phone || !!duplicateOf} placeholder="01XXXXXXXXX" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account type" htmlFor="acc-accountType">
          <Select id="acc-accountType" value={f.accountType} onChange={set('accountType')}>
            <option value="CHAMBER">Chamber</option>
            <option value="PARTNER_LAB">Partner lab</option>
            <option value="CHAIRMAN_PERSONAL">Chairman channel</option>
          </Select>
        </Field>
        <Field label="Institution" htmlFor="acc-institutionType">
          <Select id="acc-institutionType" value={f.institutionType} onChange={set('institutionType')}>
            <option value="CHAMBER">Chamber</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="PARTNER_LAB">Lab</option>
            <option value="FREELANCE">Personal (freelance)</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Division" htmlFor="acc-division">
          <Select id="acc-division" value={f.division} onChange={set('division')}>
            {DIVISIONS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Area" htmlFor="acc-district">
          <Input id="acc-district" value={f.district} onChange={set('district')} placeholder="e.g. Dhanmondi" />
        </Field>
      </div>
      {!perm.isAgent && (
        <Field label="Field agent" htmlFor="acc-assignedAgentId">
          <Select id="acc-assignedAgentId" value={f.assignedAgentId} onChange={set('assignedAgentId')}>
            <option value="">Not assigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {!editing && perm.canSetOpeningDue && (
        <Field label="Opening due (৳)" htmlFor="acc-openingDue" error={errors.openingDue} hint="What they already owed before this system. Recorded as an opening invoice.">
          <Input id="acc-openingDue" type="number" inputMode="decimal" min={0} value={f.openingDue} onChange={set('openingDue')} invalid={!!errors.openingDue} placeholder="0" />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="acc-email" error={errors.email}>
          <Input id="acc-email" type="email" value={f.email} onChange={set('email')} invalid={!!errors.email} />
        </Field>
        <Field label="Address" htmlFor="acc-address">
          <Input id="acc-address" value={f.address} onChange={set('address')} />
        </Field>
      </div>
    </FormDialog>
  );
}
