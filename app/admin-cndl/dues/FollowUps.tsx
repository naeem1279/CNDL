'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Input, Segmented } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import { apiError, formatBDT, formatDay, todayInput } from '../_lib/utils';

export type FollowUp = {
  id: string;
  clientAccountId: string;
  kind: 'NOTE' | 'PROMISE';
  note: string;
  promiseAmount: number | null;
  promiseDate: string | null;
  status: 'OPEN' | 'KEPT' | 'BROKEN' | 'DONE';
  createdByName: string | null;
  createdAt: string;
};

const STATUS_TONE = { OPEN: 'warning', KEPT: 'success', BROKEN: 'danger', DONE: 'neutral' } as const;
const STATUS_LABEL = { OPEN: 'Promised', KEPT: 'Kept', BROKEN: 'Broken', DONE: 'Note' } as const;

/** Notes and promises to pay for one client, with a small form to add one. */
export function FollowUps({ accountId, onChange }: { accountId: string; onChange?: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [items, setItems] = useState<FollowUp[] | null>(null);
  const [kind, setKind] = useState<'NOTE' | 'PROMISE'>('NOTE');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayInput());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/erp/dues/followups?account=${encodeURIComponent(accountId)}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok) setItems(body.followUps ?? []);
      else setItems([]);
    } catch {
      setItems([]);
    }
  }, [adminFetch, accountId]);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 2) return void toast.error('Write a short note');
    if (kind === 'PROMISE' && !(parseFloat(amount) > 0)) return void toast.error('Enter the promised amount');
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/erp/dues/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientAccountId: accountId,
          kind,
          note: note.trim(),
          ...(kind === 'PROMISE' ? { promiseAmount: parseFloat(amount), promiseDate: `${date}T12:00:00+06:00` } : {}),
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save'));
      setNote('');
      setAmount('');
      toast.success(kind === 'PROMISE' ? 'Promise saved — it will show in Call today on that date' : 'Note saved');
      await load();
      onChange?.();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  const mark = async (f: FollowUp, status: FollowUp['status']) => {
    try {
      const res = await adminFetch(`/api/admin/erp/dues/followups/${f.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.status === 401) return handleAuthLoss();
      if (!res.ok) return void toast.error(apiError(await res.json().catch(() => ({})), 'Could not update'));
      setItems((prev) => prev?.map((x) => (x.id === f.id ? { ...x, status } : x)) ?? prev);
      onChange?.();
    } catch {
      toast.error('Network error — not updated');
    }
  };

  const today = todayInput();
  return (
    <div className="space-y-3">
      <form onSubmit={save} className="space-y-2 rounded-lg border border-zinc-200 p-3">
        <Segmented<'NOTE' | 'PROMISE'>
          label="Kind of follow-up"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'NOTE', label: 'Note' },
            { value: 'PROMISE', label: 'Promise to pay' },
          ]}
        />
        <Input aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder={kind === 'PROMISE' ? 'e.g. Will send by bKash' : 'e.g. Called, asked to call back Sunday'} />
        {kind === 'PROMISE' && (
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="Promised amount (৳)" type="number" inputMode="decimal" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ৳" />
            <Input aria-label="Promised date" type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        <Button type="submit" size="sm" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : kind === 'PROMISE' ? 'Save promise' : 'Save note'}
        </Button>
      </form>

      {items === null ? (
        <p className="text-table text-zinc-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-table text-zinc-400">No notes or promises yet.</p>
      ) : (
        <ol className="divide-y divide-zinc-100">
          {items.map((f) => {
            const overdue = f.status === 'OPEN' && f.promiseDate && f.promiseDate.slice(0, 10) < today;
            return (
              <li key={f.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={overdue ? 'danger' : STATUS_TONE[f.status]}>{overdue ? 'Promise overdue' : STATUS_LABEL[f.status]}</Badge>
                  {f.kind === 'PROMISE' && f.promiseAmount != null && (
                    <span className="text-table font-medium tabular-nums text-zinc-900">
                      {formatBDT(f.promiseAmount)} by {formatDay(f.promiseDate)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-table text-zinc-700 [overflow-wrap:anywhere]">{f.note}</p>
                <p className="text-meta text-zinc-500">
                  {f.createdByName ?? 'Someone'} · {formatDay(f.createdAt)}
                </p>
                {f.kind === 'PROMISE' && f.status === 'OPEN' && (
                  <div className="mt-1.5 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void mark(f, 'KEPT')}>
                      Paid as promised
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void mark(f, 'BROKEN')}>
                      Broken
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
