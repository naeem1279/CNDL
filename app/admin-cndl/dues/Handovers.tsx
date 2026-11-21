'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../_components/ui';
import { useAdmin } from '../_lib/session';
import { apiError, formatBDT, formatDay } from '../_lib/utils';

type Handover = { id: string; agentId: string; agentName: string | null; amount: number; collectionIds: string[]; note: string | null; createdAt: string };

/** Cash handovers from field agents waiting for the office ("ledger.verify"). Receiving verifies every collection in it. */
export function Handovers({ onChanged }: { onChanged: () => void }) {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const [items, setItems] = useState<Handover[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/erp/handovers?status=SUBMITTED');
      if (!res.ok) return;
      const body = await res.json().catch(() => ({}));
      setItems(body.handovers ?? []);
    } catch {
      /* stays as it was */
    }
  }, [adminFetch]);
  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (h: Handover, action: 'receive' | 'dispute') => {
    let note: string | null = null;
    if (action === 'receive') {
      if (!(await askConfirm(`Received ${formatBDT(h.amount)} in cash from ${h.agentName ?? 'the agent'}? Its ${h.collectionIds.length} collections will be marked verified.`, { title: 'Receive handover?', confirmLabel: `Received ${formatBDT(h.amount)}`, tone: 'primary' }))) return;
    } else {
      note = window.prompt('What is wrong with this handover? (the agent sees this)')?.trim() ?? null;
      if (!note || note.length < 3) return;
    }
    setBusy(h.id);
    try {
      const res = await adminFetch(`/api/admin/erp/handovers/${h.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }) });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not update the handover'));
      toast.success(action === 'receive' ? `${formatBDT(h.amount)} received and verified` : 'Handover disputed');
      await load();
      onChanged();
    } catch {
      toast.error('Network error — not updated');
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) return null;
  return (
    <section aria-label="Cash handovers waiting" className="border-b border-zinc-100 p-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50/60">
        <h2 className="border-b border-amber-200 px-4 py-2.5 text-table font-semibold text-amber-900">
          {items.length} cash {items.length === 1 ? 'handover' : 'handovers'} waiting to be received
        </h2>
        <ul className="divide-y divide-amber-100">
          {items.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-table font-medium text-zinc-900">
                  {h.agentName ?? 'Agent'} · <span className="tabular-nums">{formatBDT(h.amount)}</span>
                </p>
                <p className="text-meta text-zinc-600">
                  {h.collectionIds.length} {h.collectionIds.length === 1 ? 'collection' : 'collections'} · {formatDay(h.createdAt)}
                  {h.note ? ` · “${h.note}”` : ''}
                </p>
              </div>
              {h.agentId === me.uid ? (
                <span className="text-meta text-zinc-500">Your own handover — someone else must receive it</span>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => void decide(h, 'receive')} disabled={busy === h.id}>
                    Received
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void decide(h, 'dispute')} disabled={busy === h.id}>
                    Dispute
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
