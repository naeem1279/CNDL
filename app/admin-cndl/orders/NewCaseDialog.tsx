'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Button, Field, Input, Segmented, Select } from '../_components/ui';
import { DIVISIONS, ORDER_SOURCE_META, VITA_SHADES } from '../_lib/constants';
import { useAdmin } from '../_lib/session';
import type { ErpAccount, ErpAgent, ServiceRow } from '../_lib/types';
import { apiError, formatBDT, todayInput } from '../_lib/utils';

type Form = {
  orderDate: string;
  deliveryDate: string;
  orderSource: string;
  clientAccountId: string;
  doctorName: string;
  clinicName: string;
  phone: string;
  attribution: 'DIRECT' | 'AGENT';
  agentId: string;
  commission: string;
  patientName: string;
  toothNo: string;
  shade: string;
  productName: string;
  units: string;
  billed: string;
  addToLedger: boolean;
  historical: boolean;
};
type Errors = Partial<Record<keyof Form, string>>;

const SECTION = 'space-y-4 border-t border-zinc-100 pt-4 first:border-0 first:pt-0';
const CHECK_ROW = 'flex items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2.5';

/** Records a case that came in by rider, phone or WhatsApp (SUPERADMIN / ACCOUNTS). */
export function NewCaseDialog({
  accounts,
  agents,
  services,
  onAccountCreated,
  onClose,
  onSaved,
}: {
  accounts: ErpAccount[];
  agents: ErpAgent[];
  services: ServiceRow[];
  onAccountCreated: (a: ErpAccount) => void;
  onClose: () => void;
  onSaved: (caseId: string) => void;
}) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState<Form>({
    orderDate: todayInput(),
    deliveryDate: '',
    orderSource: 'OFFLINE_RIDER',
    clientAccountId: '',
    doctorName: '',
    clinicName: '',
    phone: '',
    attribution: 'DIRECT',
    agentId: '',
    commission: '',
    patientName: '',
    toothNo: '',
    shade: '',
    productName: '',
    units: '1',
    billed: '',
    addToLedger: false,
    historical: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [quick, setQuick] = useState<null | { name: string; ownerName: string; phone: string; division: string }>(null);
  const [savingQuick, setSavingQuick] = useState(false);

  const account = accounts.find((a) => a.id === f.clientAccountId);
  const products = services.filter((s) => s.isActive);
  const billed = parseFloat(f.billed) || 0;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const onText = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(k, e.target.value as never);

  const pickAccount = (id: string) => {
    const a = accounts.find((x) => x.id === id);
    setF((x) => ({
      ...x,
      clientAccountId: id,
      // The account's field agent gets the credit by default.
      attribution: a?.assignedAgentId ? 'AGENT' : 'DIRECT',
      agentId: a?.assignedAgentId || '',
      addToLedger: id ? x.addToLedger || x.historical : false,
    }));
    setErrors((x) => ({ ...x, doctorName: undefined }));
  };

  const createQuick = async () => {
    if (!quick) return;
    if (quick.name.trim().length < 2 || quick.ownerName.trim().length < 2 || quick.phone.replace(/\D/g, '').length < 6) {
      toast.error('Enter the clinic name, doctor name and phone');
      return;
    }
    setSavingQuick(true);
    try {
      const res = await adminFetch('/api/admin/erp/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: 'CHAMBER',
          institutionType: 'CHAMBER',
          name: quick.name.trim(),
          ownerName: quick.ownerName.trim(),
          phone: quick.phone.trim(),
          division: quick.division,
          openingDue: 0,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data?.warning === 'DUPLICATE_PHONE') {
        toast.error(`That phone already belongs to ${data.existingName || 'an account'}. Pick it from the list instead.`);
        return;
      }
      if (!res.ok) return void toast.error(apiError(data, 'Could not create the account'));
      onAccountCreated(data as ErpAccount);
      setF((x) => ({ ...x, clientAccountId: data.id, attribution: 'DIRECT', agentId: '' }));
      setQuick(null);
      toast.success(`${data.name} added to Client Dues`);
    } catch {
      toast.error('Network error — account not created');
    } finally {
      setSavingQuick(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (!f.orderDate) err.orderDate = 'Pick the order date';
    if (f.deliveryDate && f.orderDate && f.deliveryDate < f.orderDate) err.deliveryDate = 'Delivery cannot be before the order date';
    if (!account && f.doctorName.trim().length < 2) err.doctorName = "Enter the doctor's name, or pick a client account";
    if (!account && f.phone.trim() && f.phone.replace(/\D/g, '').length < 10) err.phone = 'Enter a full phone number';
    if (!f.productName) err.productName = 'Pick the restoration';
    const units = parseInt(f.units, 10);
    if (!(units >= 1 && units <= 200)) err.units = '1 to 200';
    if (f.billed && !(billed >= 0)) err.billed = 'Enter 0 or more';
    if ((f.addToLedger || (f.historical && account)) && !(billed > 0)) err.billed = 'Enter the billed amount to add it to their dues';
    if (f.attribution === 'AGENT' && !f.agentId) err.agentId = 'Pick the agent';
    if (f.attribution === 'AGENT' && f.commission && !(parseFloat(f.commission) >= 0)) err.commission = 'Enter 0 or more';
    setErrors(err);
    const first = (Object.keys(err) as (keyof Form)[]).find((k) => err[k]);
    if (first) {
      document.getElementById(`case-${first}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const viaAgent = f.attribution === 'AGENT';
      const res = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderDate: new Date(f.orderDate).toISOString(),
          deliveryDate: f.deliveryDate ? new Date(f.deliveryDate).toISOString() : null,
          orderSource: f.orderSource,
          clientAccountId: account?.id || null,
          doctorName: account ? account.ownerName : f.doctorName.trim(),
          clinicName: account ? account.name : f.clinicName.trim() || null,
          phone: account ? null : f.phone.trim() || null,
          patientName: f.patientName.trim() || null,
          toothNo: f.toothNo.trim() || null,
          shade: f.shade || null,
          productName: f.productName,
          units,
          billedAmount: f.billed.trim() === '' ? null : billed,
          addToLedger: (f.addToLedger || f.historical) && !!account,
          agentId: viaAgent ? f.agentId : null,
          isDirect: !viaAgent,
          commissionAmount: viaAgent ? parseFloat(f.commission) || 0 : 0,
          status: f.historical ? 'DISPATCHED' : null,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not create the case'));
      const caseId = body.order?.caseId as string;
      const billedNote = (f.addToLedger || f.historical) && account && billed > 0 ? ` · ${formatBDT(billed)} added to ${account.name}'s dues` : '';
      toast.success(`Case ${caseId} created${f.historical ? ' as already delivered' : ''}${billedNote}`);
      onClose();
      onSaved(caseId);
    } catch {
      toast.error('Network error — the case was not created');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title="New case" description="For cases that came in by rider, phone or WhatsApp" onClose={onClose} onSubmit={submit} submitLabel="Create case" saving={saving} savingLabel="Creating…">
      <div className={SECTION}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order date" htmlFor="case-orderDate" required error={errors.orderDate}>
            <Input id="case-orderDate" type="date" max={todayInput()} value={f.orderDate} onChange={onText('orderDate')} invalid={!!errors.orderDate} />
          </Field>
          <Field label="Promised delivery" htmlFor="case-deliveryDate" error={errors.deliveryDate}>
            <Input id="case-deliveryDate" type="date" min={f.orderDate || undefined} value={f.deliveryDate} onChange={onText('deliveryDate')} invalid={!!errors.deliveryDate} />
          </Field>
        </div>
        <Field label="Came in by" htmlFor="case-orderSource">
          <Select id="case-orderSource" value={f.orderSource} onChange={onText('orderSource')}>
            {Object.entries(ORDER_SOURCE_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className={SECTION}>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Field label="Client account" htmlFor="case-clientAccountId" hint={account ? `Owes ${formatBDT(account.currentBalance)} · ${account.phone}` : 'Leave empty for a walk-in'}>
              <Select id="case-clientAccountId" value={f.clientAccountId} onChange={(e) => pickAccount(e.target.value)}>
                <option value="">Walk-in (type details below)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.ownerName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
        {!quick && !account && (
          <Button size="sm" variant="ghost" className="-mt-2" onClick={() => setQuick({ name: '', ownerName: '', phone: '', division: 'DHAKA' })}>
            + New client account
          </Button>
        )}
        {quick && (
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
            <p className="text-table font-medium text-zinc-800">New client account</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input aria-label="Clinic name" placeholder="Clinic name" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} />
              <Input aria-label="Doctor name" placeholder="Doctor name" value={quick.ownerName} onChange={(e) => setQuick({ ...quick, ownerName: e.target.value })} />
              <Input aria-label="Phone" type="tel" placeholder="01XXXXXXXXX" value={quick.phone} onChange={(e) => setQuick({ ...quick, phone: e.target.value })} />
              <Select aria-label="Division" value={quick.division} onChange={(e) => setQuick({ ...quick, division: e.target.value })}>
                {DIVISIONS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setQuick(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={() => void createQuick()} disabled={savingQuick}>
                {savingQuick ? 'Adding…' : 'Add and select'}
              </Button>
            </div>
          </div>
        )}
        {!account && !quick && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Doctor" htmlFor="case-doctorName" required error={errors.doctorName}>
              <Input id="case-doctorName" value={f.doctorName} onChange={onText('doctorName')} invalid={!!errors.doctorName} />
            </Field>
            <Field label="Clinic" htmlFor="case-clinicName">
              <Input id="case-clinicName" value={f.clinicName} onChange={onText('clinicName')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Phone" htmlFor="case-phone" error={errors.phone}>
                <Input id="case-phone" type="tel" value={f.phone} onChange={onText('phone')} invalid={!!errors.phone} placeholder="01XXXXXXXXX" />
              </Field>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <span className="block text-table font-medium text-zinc-700">Credit</span>
          <Segmented<'DIRECT' | 'AGENT'>
            label="Credit"
            value={f.attribution}
            onChange={(v) => set('attribution', v)}
            options={[
              { value: 'DIRECT', label: 'Direct to lab' },
              { value: 'AGENT', label: 'Field agent' },
            ]}
          />
        </div>
        {f.attribution === 'AGENT' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Agent" htmlFor="case-agentId" required error={errors.agentId}>
              <Select id="case-agentId" value={f.agentId} onChange={onText('agentId')} invalid={!!errors.agentId}>
                <option value="">Pick an agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Commission (৳)" htmlFor="case-commission" error={errors.commission}>
              <Input id="case-commission" type="number" inputMode="decimal" min={0} value={f.commission} onChange={onText('commission')} invalid={!!errors.commission} placeholder="0" />
            </Field>
          </div>
        )}
      </div>

      <div className={SECTION}>
        <Field label="Restoration" htmlFor="case-productName" required error={errors.productName} hint={products.length ? undefined : 'No active products: add one under Dental Products first.'}>
          <Select id="case-productName" value={f.productName} onChange={onText('productName')} invalid={!!errors.productName}>
            <option value="">Pick a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.category})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <Field label="Patient" htmlFor="case-patientName">
              <Input id="case-patientName" value={f.patientName} onChange={onText('patientName')} />
            </Field>
          </div>
          <Field label="Teeth (FDI)" htmlFor="case-toothNo">
            <Input id="case-toothNo" value={f.toothNo} onChange={onText('toothNo')} placeholder="11, 21" />
          </Field>
          <Field label="Shade" htmlFor="case-shade">
            <Select id="case-shade" value={f.shade} onChange={onText('shade')}>
              <option value="">—</option>
              {VITA_SHADES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Units" htmlFor="case-units" required error={errors.units}>
            <Input id="case-units" type="number" inputMode="numeric" min={1} max={200} value={f.units} onChange={onText('units')} invalid={!!errors.units} />
          </Field>
          <Field label="Billed (৳)" htmlFor="case-billed" error={errors.billed}>
            <Input id="case-billed" type="number" inputMode="decimal" min={0} value={f.billed} onChange={onText('billed')} invalid={!!errors.billed} placeholder="0" />
          </Field>
        </div>
      </div>

      <div className={`${SECTION} space-y-2`}>
        <label className={`${CHECK_ROW} ${account ? 'cursor-pointer hover:bg-zinc-50' : 'opacity-60'}`}>
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" disabled={!account} checked={f.addToLedger || (f.historical && !!account)} onChange={(e) => set('addToLedger', e.target.checked)} />
          <span className="text-body text-zinc-700">
            Add the bill to their dues now
            <span className="block text-meta text-zinc-500">
              {account ? `Records an invoice on ${account.name}. Otherwise it is billed when the case is dispatched.` : 'Pick a client account to bill this case.'}
            </span>
          </span>
        </label>
        <label className={`${CHECK_ROW} cursor-pointer hover:bg-zinc-50`}>
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={f.historical} onChange={(e) => set('historical', e.target.checked)} />
          <span className="text-body text-zinc-700">
            Already delivered
            <span className="block text-meta text-zinc-500">
              For entering past cases: goes straight to Dispatched{account ? ' and the bill is added to their dues' : ''}.
            </span>
          </span>
        </label>
      </div>
    </FormDialog>
  );
}
