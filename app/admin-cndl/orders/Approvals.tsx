'use client';
import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { Badge, Button, Field, Input } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import type { Order } from '../_lib/types';
import { apiError, formatBDT, formatDay, parseClinical } from '../_lib/utils';

type Submission = Order & { agentName: string | null };

/** Cases field agents submitted, waiting for someone who can record cases to approve or reject them. */
export function Approvals({ onDecided }: { onDecided: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [items, setItems] = useState<Submission[]>([]);
  const [deciding, setDeciding] = useState<{ s: Submission; action: 'approve' | 'reject' } | null>(null);

  const [version, setVersion] = useState(0);
  const load = useCallback(async () => setVersion((v) => v + 1), []);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await adminFetch('/api/admin/erp/submissions');
        if (!res.ok || !live) return;
        const body = await res.json().catch(() => ({}));
        if (live) setItems(body.submissions ?? []);
      } catch {
        /* stays as it was */
      }
    })();
    return () => {
      live = false;
    };
  }, [adminFetch, version]);

  if (items.length === 0) return null;
  return (
    <section aria-label="Waiting for approval" className="rounded-lg border border-amber-200 bg-amber-50/60">
      <header className="flex items-center justify-between gap-3 border-b border-amber-200 px-4 py-2.5">
        <h2 className="text-table font-semibold text-amber-900">
          {items.length} {items.length === 1 ? 'case' : 'cases'} from field agents waiting for approval
        </h2>
      </header>
      <ul className="divide-y divide-amber-100">
        {items.map((s) => {
          const c = parseClinical(s.productType);
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-table font-medium text-zinc-900">
                  {s.clinicName} · {c.work || '—'}
                </p>
                <p className="text-meta text-zinc-600">
                  <span className="font-mono">{s.caseId}</span> · from {s.agentName ?? 'an agent'} · {formatDay(s.createdAt)}
                  {s.billedAmount ? ` · quoted ${formatBDT(s.billedAmount)}` : ''}
                  {c.patient ? ` · ${c.patient}` : ''}
                </p>
                {c.notes && <p className="text-meta text-zinc-600 [overflow-wrap:anywhere]">“{c.notes}”</p>}
              </div>
              <Badge tone="warning">Awaiting approval</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" icon={Check} onClick={() => setDeciding({ s, action: 'approve' })}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={() => setDeciding({ s, action: 'reject' })}>
                  Reject
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {deciding && (
        <DecisionDialog
          s={deciding.s}
          action={deciding.action}
          onClose={() => setDeciding(null)}
          onDone={async (msg) => {
            setDeciding(null);
            toast.success(msg);
            await load();
            onDecided();
          }}
          onAuthLoss={handleAuthLoss}
          adminFetch={adminFetch}
        />
      )}
    </section>
  );
}

function DecisionDialog({
  s,
  action,
  onClose,
  onDone,
  onAuthLoss,
  adminFetch,
}: {
  s: Submission;
  action: 'approve' | 'reject';
  onClose: () => void;
  onDone: (msg: string) => void | Promise<void>;
  onAuthLoss: () => void;
  adminFetch: ReturnType<typeof useAdmin>['adminFetch'];
}) {
  const [amount, setAmount] = useState(s.billedAmount != null ? String(s.billedAmount) : '');
  const [commission, setCommission] = useState('');
  const [due, setDue] = useState(s.deliveryDate ? s.deliveryDate.slice(0, 10) : '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === 'reject' && reason.trim().length < 3) return void toast.error('Say why the case is not approved');
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/erp/submissions/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'approve'
            ? { action, billedAmount: amount, commissionAmount: commission, deliveryDate: due ? `${due}T12:00:00+06:00` : '' }
            : { action, reason: reason.trim() }
        ),
      });
      if (res.status === 401) return onAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the decision'));
      await onDone(action === 'approve' ? `${s.caseId} approved — now in the lab` : `${s.caseId} not approved`);
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title={action === 'approve' ? `Approve ${s.caseId}` : `Reject ${s.caseId}`}
      description={`${s.clinicName ?? ''} · from ${s.agentName ?? 'an agent'}`}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={action === 'approve' ? 'Approve — send to the lab' : 'Reject'}
      saving={saving}
    >
      {action === 'approve' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Billed amount (৳)" htmlFor="ap-amount" hint={s.billedAmount != null ? `Agent quoted ${formatBDT(s.billedAmount)}` : 'No price quoted'}>
              <Input id="ap-amount" type="number" inputMode="decimal" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Agent commission (৳)" htmlFor="ap-commission">
              <Input id="ap-commission" type="number" inputMode="decimal" min={0} value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="0" />
            </Field>
          </div>
          <Field label="Delivery date" htmlFor="ap-due">
            <Input id="ap-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </>
      ) : (
        <Field label="Why not?" htmlFor="ap-reason" required hint="The agent sees this.">
          <Input id="ap-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Client has unpaid dues, collect first" />
        </Field>
      )}
    </FormDialog>
  );
}
