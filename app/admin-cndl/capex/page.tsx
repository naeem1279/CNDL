'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, Cog, Cpu, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { ASSET_STATUS_META, EMPTY_CAPEX_FORM } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ErpAsset } from '../_lib/types';
import { apiError, formatBDT, formatDate } from '../_lib/utils';

export default function CapexPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [erpAssets, setErpAssets] = useState<ErpAsset[]>([]);
  const [capexModal, setCapexModal] = useState(false);
  const [editingCapex, setEditingCapex] = useState<ErpAsset | null>(null);
  const [capexForm, setCapexForm] = useState(EMPTY_CAPEX_FORM);
  const [savingErp, setSavingErp] = useState(false);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: capex. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['capex'], me.role);
      if (!r) return;
      if (r.assets) setErpAssets(r.assets);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openEditCapex = (a: ErpAsset) => {
    setEditingCapex(a);
    setCapexForm({
      machineName: a.machineName,
      purchaseCost: String(a.purchaseCost),
      purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : '',
      status: a.status || 'OPERATIONAL',
      notes: a.notes || '',
    });
    setCapexModal(true);
  };

  const deleteCapex = async (a: ErpAsset) => {
    if (!(await askConfirm(`Delete machine "${a.machineName}" (${formatBDT(a.purchaseCost)})? This cannot be undone.`))) return;
    setDeletingId(`capex-${a.id}`);
    try {
      const res = await adminFetch(`/api/admin/erp/capex?id=${encodeURIComponent(a.id)}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Machine asset deleted');
        await fetchData(true);
      } else {
        const b = await res.json().catch(() => ({}));
        toast.error(apiError(b, 'Failed to delete machine asset'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const submitCapex = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(capexForm.purchaseCost);
    if (!capexForm.machineName.trim()) {
      toast.error('Machine name is required');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast.error('Enter a valid purchase cost');
      return;
    }
    setSavingErp(true);
    try {
      const res = await adminFetch(
        editingCapex ? `/api/admin/erp/capex?id=${encodeURIComponent(editingCapex.id)}` : '/api/admin/erp/capex',
        {
          method: editingCapex ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machineName: capexForm.machineName,
            purchaseCost: cost,
            purchaseDate: capexForm.purchaseDate || null,
            status: capexForm.status,
            notes: capexForm.notes.trim() || null,
          }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingCapex ? 'Machine asset updated' : 'Machine asset added');
        setCapexModal(false);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save machine asset'));
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingErp(false);
    }
  };

  const assetStats = useMemo(
    () => ({
      value: erpAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0),
      operational: erpAssets.filter((a) => a.status === 'OPERATIONAL').length,
      maintenance: erpAssets.filter((a) => a.status === 'UNDER_MAINTENANCE').length,
    }),
    [erpAssets]
  );
  const totalAssetValue = assetStats.value;
  const operationalMachines = assetStats.operational;
  const underMaintenanceMachines = assetStats.maintenance;

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards: Kpi[] = [
      { label: 'Machine Asset Valuation', value: formatBDT(totalAssetValue), icon: Cpu, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Operational Units', value: `${operationalMachines} / ${erpAssets.length}`, icon: Check, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
      { label: 'Maintenance Status', value: underMaintenanceMachines > 0 ? `${underMaintenanceMachines} Under Maint.` : 'All Operational', icon: Cog, bg: 'bg-amber-50', fg: 'text-amber-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="capex"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
              /* ---------- MACHINERY & CAPEX ---------- */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold">Machinery &amp; CapEx</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Capital assets — Roland DWX-52Di, UP3D and other lab machinery</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCapex(null);
                      setCapexForm(EMPTY_CAPEX_FORM);
                      setCapexModal(true);
                    }}
                    className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
                  >
                    <Plus size={16} /> Add Machine Asset
                  </button>
                </div>

                {/* Desktop: assets table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-4 pr-4">Machine Name</th>
                        <th className="pb-4 pr-4">Cost (BDT)</th>
                        <th className="pb-4 pr-4">Purchase Date</th>
                        <th className="pb-4 pr-4">Status</th>
                        <th className="pb-4 pr-4">Notes</th>
                        {me?.role === 'SUPERADMIN' && <th className="pb-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {erpAssets.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-sm">{a.machineName}</td>
                          <td className="py-3.5 pr-4 font-semibold text-teal-700 whitespace-nowrap">{formatBDT(a.purchaseCost)}</td>
                          <td className="py-3.5 pr-4 text-xs text-gray-500 whitespace-nowrap">{a.purchaseDate ? formatDate(a.purchaseDate).split(',')[0] : '—'}</td>
                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${ASSET_STATUS_META[a.status] || ASSET_STATUS_META.OPERATIONAL}`}>
                              {a.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-xs text-gray-500 max-w-[260px] truncate" title={a.notes || ''}>{a.notes || '—'}</td>
                          {me?.role === 'SUPERADMIN' && (
                            <td className="py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => openEditCapex(a)}
                                  aria-label={`Edit ${a.machineName}`}
                                  title="Edit machine"
                                  className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-teal-700/30 hover:text-teal-700 transition-colors"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => deleteCapex(a)}
                                  disabled={deletingId === `capex-${a.id}`}
                                  aria-label={`Delete ${a.machineName}`}
                                  title="Delete machine"
                                  className="min-h-[36px] w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {erpAssets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                        <Cog size={28} />
                      </span>
                      <p className="text-sm font-bold text-gray-500">No machines registered yet</p>
                      <p className="text-xs text-slate-500 mt-1">Add milling machines, furnaces and other capital assets.</p>
                    </div>
                  )}
                </div>

                {/* Mobile: asset cards */}
                <div className="md:hidden space-y-3">
                  {erpAssets.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm truncate">{a.machineName}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${ASSET_STATUS_META[a.status] || ASSET_STATUS_META.OPERATIONAL}`}>
                          {a.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-slate-500">{a.purchaseDate ? formatDate(a.purchaseDate).split(',')[0] : 'No purchase date'}</span>
                        <span className="font-semibold text-teal-700">{formatBDT(a.purchaseCost)}</span>
                      </div>
                      {a.notes && <p className="text-xs text-gray-500 mt-1.5 truncate">{a.notes}</p>}
                      {me?.role === 'SUPERADMIN' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => openEditCapex(a)}
                            className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => deleteCapex(a)}
                            disabled={deletingId === `capex-${a.id}`}
                            className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {erpAssets.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-10">No machines registered yet.</p>
                  )}
                </div>
              </div>
        )}
      </SectionFrame>

      {capexModal && (
        <ModalShell onClose={() => setCapexModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitCapex}
            className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">{editingCapex ? 'Edit Machine Asset' : 'Add Machine Asset'}</h3>
              <button
                type="button"
                onClick={() => setCapexModal(false)}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Machine Name *</label>
                <input
                  required
                  value={capexForm.machineName}
                  onChange={(e) => setCapexForm({ ...capexForm, machineName: e.target.value })}
                  placeholder="e.g. Roland DWX-52Di / UP3D P52"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Purchase Cost (BDT) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={capexForm.purchaseCost}
                    onChange={(e) => setCapexForm({ ...capexForm, purchaseCost: e.target.value })}
                    placeholder="e.g. 1850000"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Purchase Date</label>
                  <input
                    type="date"
                    value={capexForm.purchaseDate}
                    onChange={(e) => setCapexForm({ ...capexForm, purchaseDate: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                <select
                  value={capexForm.status}
                  onChange={(e) => setCapexForm({ ...capexForm, status: e.target.value })}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                <textarea
                  rows={2}
                  value={capexForm.notes}
                  onChange={(e) => setCapexForm({ ...capexForm, notes: e.target.value })}
                  placeholder="Serial number, supplier, warranty details..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setCapexModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingErp}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingErp ? 'Saving...' : editingCapex ? 'Save Changes' : 'Add Machine Asset'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Distribute Dividend Modal */}
    </>
  );
}
