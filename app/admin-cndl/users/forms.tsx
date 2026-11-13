'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Field, IconButton, Input, Select } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import type { ErpUser } from '../_lib/types';
import { apiError, formatBDT, todayInput } from '../_lib/utils';

/** A role as listed by /api/admin/erp/roles. A role with no permissions can be assigned (record only) but cannot use the console. */
export type RoleOption = { key: string; name: string; description: string | null; permissions: string[] };
export const canUseConsole = (r: RoleOption | undefined) => !!r && r.permissions.length > 0;
const MIN_PASSWORD = 8;

export function MemberDialog({ editing, roles, onClose, onSaved }: { editing: ErpUser | null; roles: RoleOption[]; onClose: () => void; onSaved: () => void }) {
  const { me, adminFetch, handleAuthLoss } = useAdmin();
  const isSelf = !!editing && editing.id === me.uid;
  const [f, setF] = useState({
    name: editing?.name || '',
    phone: editing?.phone || '',
    email: editing?.email || '',
    address: editing?.address || '',
    role: editing?.roleKey || editing?.role || (roles.some((r) => r.key === 'AGENT') ? 'AGENT' : roles[0]?.key || ''),
    status: editing?.status || 'ACTIVE',
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const role = roles.find((r) => r.key === f.role);
  const signsIn = canUseConsole(role);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (f.name.trim().length < 2) err.name = 'Enter their full name';
    if (f.phone.replace(/\D/g, '').length < 10) err.phone = 'Enter a full phone number (used to sign in)';
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) err.email = 'Enter a valid email or leave it empty';
    if (!editing && signsIn && !f.password) err.password = 'Set a password so they can sign in';
    if (f.password && f.password.length < MIN_PASSWORD) err.password = `Use at least ${MIN_PASSWORD} characters`;
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`mb-${first}`)?.focus();
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/erp/users/${editing.id}` : '/api/admin/erp/users', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name.trim(),
          phone: f.phone.trim(),
          email: f.email.trim() || null,
          address: f.address.trim() || null,
          ...(isSelf ? {} : { roleKey: f.role }),
          ...(editing && !isSelf ? { status: f.status } : {}),
          ...(f.password ? { password: f.password } : {}),
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the team member'));
      toast.success(editing ? `${f.name.trim()} updated${f.password ? ' · new password set' : ''}` : `${f.name.trim()} added`);
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={editing ? 'Edit team member' : 'Add team member'} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Add member'} saving={saving}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="mb-name" required error={errors.name}>
          <Input id="mb-name" value={f.name} onChange={set('name')} invalid={!!errors.name} autoComplete="off" />
        </Field>
        <Field label="Phone" htmlFor="mb-phone" required error={errors.phone} hint="They sign in with this number">
          <Input id="mb-phone" type="tel" value={f.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="01XXXXXXXXX" autoComplete="off" />
        </Field>
      </div>
      <Field label="Role" htmlFor="mb-role" hint={isSelf ? 'You cannot change your own role.' : role?.description || (signsIn ? undefined : 'Record only — this role cannot sign in to the console.')}>
        <Select id="mb-role" value={f.role} onChange={set('role')} disabled={isSelf}>
          {roles.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name}
              {canUseConsole(r) ? '' : ' (no sign-in)'}
            </option>
          ))}
        </Select>
      </Field>
      {editing && (
        <Field label="Status" htmlFor="mb-status" hint={isSelf ? 'You cannot suspend your own account.' : 'Suspended members are signed out at once and cannot sign in.'}>
          <Select id="mb-status" value={f.status} onChange={set('status')} disabled={isSelf}>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive (left the team)</option>
          </Select>
        </Field>
      )}
      {(signsIn || editing) && (
        <Field
          label={editing ? 'New password' : 'Password'}
          htmlFor="mb-password"
          required={!editing && signsIn}
          error={errors.password}
          hint={editing ? 'Leave empty to keep their current password.' : `At least ${MIN_PASSWORD} characters. Share it with them privately.`}
        >
          <div className="relative">
            <Input id="mb-password" type={showPw ? 'text' : 'password'} value={f.password} onChange={set('password')} invalid={!!errors.password} autoComplete="new-password" className="pr-10" />
            <IconButton icon={showPw ? EyeOff : Eye} label={showPw ? 'Hide password' : 'Show password'} size="sm" onClick={() => setShowPw((v) => !v)} className="absolute right-0.5 top-1/2 -translate-y-1/2" />
          </div>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="mb-email" error={errors.email} hint="Can also be used to sign in">
          <Input id="mb-email" type="email" value={f.email} onChange={set('email')} invalid={!!errors.email} autoComplete="off" />
        </Field>
        <Field label="Address" htmlFor="mb-address">
          <Input id="mb-address" value={f.address} onChange={set('address')} />
        </Field>
      </div>
    </FormDialog>
  );
}

export function PayoutDialog({ agent, due, onClose, onSaved }: { agent: { id: string; name: string }; due: number; onClose: () => void; onSaved: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({ amount: due > 0 ? String(Math.round(due)) : '', method: 'Cash', date: todayInput(), notes: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const amount = parseFloat(f.amount) || 0;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (!(amount > 0)) err.amount = 'Enter the amount paid';
    if (!f.date) err.date = 'Pick the date';
    else if (f.date > todayInput()) err.date = 'The date cannot be in the future';
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`po-${first}`)?.focus();
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/erp/agents/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          amountPaid: amount,
          paymentMethod: f.method,
          notes: f.notes.trim() || null,
          payoutDate: new Date(`${f.date}T12:00:00`).toISOString(),
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not record the payout'));
      toast.success(`${formatBDT(amount)} commission paid to ${agent.name}`);
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
      title="Pay commission"
      description={`${agent.name} · ${formatBDT(due)} due`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={amount > 0 ? `Pay ${formatBDT(amount)}` : 'Record payout'}
      saving={saving}
      savingLabel="Recording…"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (৳)" htmlFor="po-amount" required error={errors.amount} hint={amount > due && due > 0 ? `More than the ${formatBDT(due)} due` : undefined}>
          <Input id="po-amount" type="number" inputMode="decimal" min={0} value={f.amount} onChange={set('amount')} invalid={!!errors.amount} />
        </Field>
        <Field label="Paid by" htmlFor="po-method">
          <Select id="po-method" value={f.method} onChange={set('method')}>
            {['Cash', 'bKash', 'Bank'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Date" htmlFor="po-date" required error={errors.date}>
        <Input id="po-date" type="date" max={todayInput()} value={f.date} onChange={set('date')} invalid={!!errors.date} />
      </Field>
      <Field label="Note" htmlFor="po-notes">
        <Input id="po-notes" value={f.notes} onChange={set('notes')} placeholder="e.g. October commission" />
      </Field>
      <p className="text-meta text-zinc-500">Recorded in Daily Expenses (Logistics) as “Agent Commission - {agent.name}”, and taken off what they are owed.</p>
    </FormDialog>
  );
}
