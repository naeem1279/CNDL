'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Cpu, MoreHorizontal, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Field, Input, MenuButton, Segmented, Select, type Tone } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAsset } from '../_lib/types';
import { apiError, formatBDT, formatDay, todayInput } from '../_lib/utils';

const STATUS: Record<string, { label: string; tone: Tone }> = {
  OPERATIONAL: { label: 'Working', tone: 'success' },
  UNDER_MAINTENANCE: { label: 'Under repair', tone: 'warning' },
  RETIRED: { label: 'Retired', tone: 'neutral' },
};
const statusOf = (s: string) => STATUS[s] ?? { label: s, tone: 'neutral' as Tone };
type Filter = 'all' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'RETIRED';
/** yyyy-mm-dd of a stored date, in Bangladesh time. */
const bdDay = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600000).toISOString().slice(0, 10);

export default function CapexPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const canChange = me.role === 'SUPERADMIN';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [assets, setAssets] = useState<ErpAsset[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  /** undefined = closed, null = adding, a row = editing. */
  const [dialog, setDialog] = useState<ErpAsset | null | undefined>(undefined);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['capex'], me.role);
      if (!r) return;
      if (r.assets) setAssets(r.assets);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load machinery');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(
    () =>
      [...assets].sort(
        (a, b) => new Date(b.purchaseDate || b.createdAt).getTime() - new Date(a.purchaseDate || a.createdAt).getTime()
      ),
    [assets]
  );
  const shown = filter === 'all' ? sorted : sorted.filter((a) => a.status === filter);
  const count = (s: string) => assets.filter((a) => a.status === s).length;
  const total = assets.reduce((s, a) => s + (a.purchaseCost || 0), 0);
  const inUse = assets.filter((a) => a.status !== 'RETIRED');
  const year = String(new Date().getFullYear());
  const thisYear = assets.filter((a) => (a.purchaseDate || '').startsWith(year));

  const kpis: Kpi[] = [
    { label: 'Total invested', value: formatBDT(total), icon: Cpu, sub: `${assets.length} machine${assets.length === 1 ? '' : 's'}` },
    { label: 'Working', value: `${count('OPERATIONAL')} / ${inUse.length}`, icon: Cpu, sub: 'Of machines in use' },
    {
      label: 'Under repair',
      value: String(count('UNDER_MAINTENANCE')),
      icon: Wrench,
      sub: count('UNDER_MAINTENANCE') ? 'Needs attention' : 'None',
      subTone: count('UNDER_MAINTENANCE') ? 'down' : 'neutral',
    },
    { label: `Bought in ${year}`, value: formatBDT(thisYear.reduce((s, a) => s + a.purchaseCost, 0)), icon: CalendarDays, sub: `${thisYear.length} machine${thisYear.length === 1 ? '' : 's'}` },
  ];

  const remove = async (a: ErpAsset) => {
    if (!(await askConfirm(`Delete ${a.machineName} (${formatBDT(a.purchaseCost)}) from the register? This cannot be undone. To keep its record, mark it Retired instead.`))) return;
    try {
      const res = await adminFetch(`/api/admin/erp/capex?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the machine'));
      setAssets((prev) => prev.filter((x) => x.id !== a.id));
      toast.success(`${a.machineName} deleted`);
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const setStatus = async (a: ErpAsset, status: string) => {
    try {
      const res = await adminFetch(`/api/admin/erp/capex?id=${encodeURIComponent(a.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not update the machine'));
      setAssets((prev) => prev.map((x) => (x.id === a.id ? { ...x, status } : x)));
      toast.success(`${a.machineName}: ${statusOf(status).label.toLowerCase()}`);
    } catch {
      toast.error('Network error — not updated');
    }
  };

  const menu = (a: ErpAsset) =>
    canChange ? (
      <MenuButton
        label={`Actions for ${a.machineName}`}
        icon={MoreHorizontal}
        iconOnly
        variant="ghost"
        items={[
          { label: 'Edit', icon: Pencil, onSelect: () => setDialog(a) },
          ...Object.entries(STATUS)
            .filter(([k]) => k !== a.status)
            .map(([k, m]) => ({ label: `Mark ${m.label.toLowerCase()}`, onSelect: () => void setStatus(a, k) })),
          { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(a) },
        ]}
      />
    ) : null;

  return (
    <SectionFrame
      tab="capex"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        canChange ? (
          <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
            <span className="hidden sm:inline">Add machine</span>
            <span className="sm:hidden">Add</span>
          </Button>
        ) : undefined
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="no-scrollbar overflow-x-auto border-b border-zinc-100 p-3">
          <Segmented<Filter>
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `All ${assets.length}` },
              { value: 'OPERATIONAL', label: `Working ${count('OPERATIONAL')}` },
              { value: 'UNDER_MAINTENANCE', label: `Under repair ${count('UNDER_MAINTENANCE')}` },
              { value: 'RETIRED', label: `Retired ${count('RETIRED')}` },
            ]}
          />
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={Cpu} title={assets.length ? 'No machines with this status' : 'No machines yet'}>
            {assets.length ? undefined : 'Mills, scanners, furnaces and printers you buy for the lab go here.'}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full table-fixed text-left md:table">
              <thead>
                <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">Machine</th>
                  <th className="w-[120px] px-3 py-2.5 font-medium">Bought</th>
                  <th className="w-[130px] px-3 py-2.5 text-right font-medium">Cost</th>
                  <th className="w-[130px] px-3 py-2.5 font-medium">Status</th>
                  {canChange && <th className="w-12 px-2 py-2.5" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-table">
                {shown.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <p className="truncate text-body font-medium text-zinc-900" title={a.machineName}>
                        {a.machineName}
                      </p>
                      {a.notes && (
                        <p className="truncate text-meta text-zinc-500" title={a.notes}>
                          {a.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-700 tabular-nums">{a.purchaseDate ? formatDay(a.purchaseDate) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-zinc-900 tabular-nums">{formatBDT(a.purchaseCost)}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={statusOf(a.status).tone}>{statusOf(a.status).label}</Badge>
                    </td>
                    {canChange && <td className="px-2 py-1.5 text-right">{menu(a)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-zinc-100 md:hidden">
              {shown.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{a.machineName}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-zinc-500">
                      <Badge tone={statusOf(a.status).tone}>{statusOf(a.status).label}</Badge>
                      {a.purchaseDate && formatDay(a.purchaseDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-body font-medium text-zinc-900 tabular-nums">{formatBDT(a.purchaseCost)}</span>
                  {canChange && <div className="-my-1 shrink-0">{menu(a)}</div>}
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-zinc-100 px-4 py-3 text-table">
              <span className="text-zinc-500">
                {shown.length} machine{shown.length === 1 ? '' : 's'}
              </span>
              <span className="font-semibold text-zinc-900 tabular-nums">{formatBDT(shown.reduce((s, a) => s + a.purchaseCost, 0))}</span>
            </div>
          </>
        )}
      </div>

      {dialog !== undefined && <MachineDialog editing={dialog} onClose={() => setDialog(undefined)} onSaved={() => void fetchData(true)} />}
    </SectionFrame>
  );
}

function MachineDialog({ editing, onClose, onSaved }: { editing: ErpAsset | null; onClose: () => void; onSaved: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({
    machineName: editing?.machineName || '',
    purchaseCost: editing ? String(editing.purchaseCost) : '',
    purchaseDate: editing?.purchaseDate ? bdDay(editing.purchaseDate) : '',
    status: editing?.status || 'OPERATIONAL',
    notes: editing?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const cost = parseFloat(f.purchaseCost);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (f.machineName.trim().length < 2) err.machineName = 'Enter the machine name';
    if (!(cost >= 0)) err.purchaseCost = 'Enter what it cost';
    if (f.purchaseDate && f.purchaseDate > todayInput()) err.purchaseDate = 'The date cannot be in the future';
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`cx-${first}`)?.focus();
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/erp/capex?id=${encodeURIComponent(editing.id)}` : '/api/admin/erp/capex', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineName: f.machineName.trim(),
          purchaseCost: cost,
          purchaseDate: f.purchaseDate || null,
          status: f.status,
          notes: f.notes.trim() || null,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the machine'));
      toast.success(editing ? `${f.machineName.trim()} updated` : `${f.machineName.trim()} added`);
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={editing ? 'Edit machine' : 'Add machine'} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Add machine'} saving={saving}>
      <Field label="Machine" htmlFor="cx-machineName" required error={errors.machineName}>
        <Input id="cx-machineName" value={f.machineName} onChange={set('machineName')} invalid={!!errors.machineName} placeholder="e.g. 5-axis milling machine" autoFocus={!editing} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cost (৳)" htmlFor="cx-purchaseCost" required error={errors.purchaseCost}>
          <Input id="cx-purchaseCost" type="number" inputMode="decimal" min={0} value={f.purchaseCost} onChange={set('purchaseCost')} invalid={!!errors.purchaseCost} />
        </Field>
        <Field label="Bought on" htmlFor="cx-purchaseDate" error={errors.purchaseDate}>
          <Input id="cx-purchaseDate" type="date" max={todayInput()} value={f.purchaseDate} onChange={set('purchaseDate')} invalid={!!errors.purchaseDate} />
        </Field>
      </div>
      <Field label="Status" htmlFor="cx-status">
        <Select id="cx-status" value={f.status} onChange={set('status')}>
          {Object.entries(STATUS).map(([k, m]) => (
            <option key={k} value={k}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notes" htmlFor="cx-notes" hint="Supplier, serial number, warranty">
        <textarea
          id="cx-notes"
          rows={2}
          value={f.notes}
          onChange={set('notes')}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-body text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </Field>
    </FormDialog>
  );
}
