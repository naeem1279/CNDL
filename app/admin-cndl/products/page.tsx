'use client';
import { useEffect, useState } from 'react';
import { ImagePlus, Layers, Package, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { EMPTY_SERVICE_FORM } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, Message, Order, ReviewRow, ServiceRow } from '../_lib/types';
import { apiError, checkImageFile, priceLabel } from '../_lib/utils';

export default function ProductsPage() {
  const { me, adminFetch, handleAuthLoss, askConfirm } = useAdmin();

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragZone, setDragZone] = useState<'blog' | 'product' | null>(null);

  // Services management state & handlers (declared at top to respect React rules of hooks)
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [savingService, setSavingService] = useState(false);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const openNewService = () => {
    setEditingService(null);
    setServiceForm({
      ...EMPTY_SERVICE_FORM,
      displayOrder: (data?.services?.length ?? 0) + 1,
    });
    setServiceModal(true);
  };

  const [uploadingProduct, setUploadingProduct] = useState(false);

  const uploadProductImage = async (file: File) => {
    const problem = checkImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setUploadingProduct(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminFetch('/api/admin/upload', { method: 'POST', credentials: 'same-origin', body: fd });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        setServiceForm((f) => ({ ...f, imageUrl: body.url }));
        toast.success('Product photo uploaded & optimized');
      } else {
        toast.error(apiError(body, 'Upload failed'));
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingProduct(false);
    }
  };

  const openEditService = (service: ServiceRow) => {
    setEditingService(service);
    setServiceForm({
      category: service.category,
      name: service.name,
      nameBn: service.nameBn || '',
      description: service.description || '',
      specs: service.specs || '',
      imageUrl: service.imageUrl || '',
      turnaroundDays: service.turnaroundDays,
      warrantyYears: service.warrantyYears,
      basePrice: (service.basePrice || '').replace(/[৳\s]/g, ''),
      isActive: service.isActive,
      displayOrder: service.displayOrder,
    });
    setServiceModal(true);
  };

  const submitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.category.trim()) {
      toast.error('Name and category are required');
      return;
    }
    setSavingService(true);
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';
      const res = await adminFetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save service');
      }
      toast.success(editingService ? 'Product updated' : 'Product created');
      setServiceModal(false);
      setEditingService(null);
      setServiceForm(EMPTY_SERVICE_FORM);
      await fetchData(true);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'Operation failed');
    } finally {
      setSavingService(false);
    }
  };

  const deleteService = async (service: ServiceRow) => {
    if (!(await askConfirm(`Delete "${service.name}"? This cannot be undone.`))) return;
    setDeletingId(`service-${service.id}`);
    try {
      const res = await adminFetch(`/api/admin/services/${service.id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      if (res.ok) {
        toast.success('Product deleted');
        await fetchData(true);
      } else {
        toast.error('Failed to delete service');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleServiceActive = async (service: ServiceRow) => {
    try {
      const res = await adminFetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      if (res.status === 401) {
        handleAuthLoss();
        return;
      }
      if (res.ok) {
        toast.success(`Product marked as ${!service.isActive ? 'Active' : 'Inactive'}`);
        await fetchData(true);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  /** Loads only this section's feeds: services. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['services'], me.role);
      if (!r) return;
      setData((prev) => ({
        orders: r.orders ?? prev.orders,
        messages: r.messages ?? prev.messages,
        blogs: r.blogs ?? prev.blogs,
        reviews: r.reviews ?? prev.reviews,
        services: r.services ?? prev.services,
      }));
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const serviceCount = data.services.length;

  // Catalogue / CMS / team metrics for per-tab KPI cards.
  const zirconiaLines = data.services.filter((s) => s.category === 'Zirconia & All-Ceramic').length;
  const pfmLines = data.services.filter((s) => s.category === 'Porcelain (PFM)').length;
  const dentureLines = data.services.filter((s) => s.category === 'Dentures & Ortho').length;

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards: Kpi[] = [
      { label: 'Catalogue Items', value: serviceCount, icon: Package, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Zirconia Lines', value: zirconiaLines, icon: Layers, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'PFM Lines', value: pfmLines, icon: Layers, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Denture Lines', value: dentureLines, icon: Layers, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="products"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= DENTAL PRODUCTS CRUD ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold">Dental Products &amp; Restorations Catalogue</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Single source of truth: Manage dynamic products, photos, warranty, pricing, and turnarounds</p>
              </div>
              <button
                onClick={openNewService}
                className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>

            {data.services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <Package size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">No dental products yet</p>
                <p className="text-xs text-slate-500 mt-1">Add items to display across Homepage, Products Catalogue, and Order forms.</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked card view */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {(data?.services ?? []).map((srv) => (
                    <div key={srv.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        {srv.imageUrl ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
                            <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package size={22} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-slate-400 font-bold">#{srv.displayOrder}</span>
                            <button
                              onClick={() => toggleServiceActive(srv)}
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                                srv.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {srv.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{srv.name}</h4>
                          {srv.nameBn && <p className="text-xs text-slate-500">{srv.nameBn}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {srv.category}
                            </span>
                            <span className="text-xs font-bold text-teal-700">
                              {priceLabel(srv.basePrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-500 block">Turnaround</span>
                          <span className="font-semibold text-slate-800">{srv.turnaroundDays} Days</span>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-bold text-slate-500 block">Warranty</span>
                          <span className="font-semibold text-slate-800">{srv.warrantyYears} Yrs</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => openEditService(srv)}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteService(srv)}
                          disabled={deletingId === `service-${srv.id}`}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3">Order</th>
                      <th className="py-3 px-3">Photo</th>
                      <th className="py-3 px-3">Product Name</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Lead Time</th>
                      <th className="py-3 px-3">Warranty</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {(data?.services ?? []).map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-xs text-slate-400">{srv.displayOrder}</td>
                        <td className="py-3.5 px-3">
                          {srv.imageUrl ? (
                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
                              <img
                                src={srv.imageUrl}
                                alt={srv.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package size={18} />
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {srv.name}
                          {srv.nameBn && <span className="block text-xs font-normal text-slate-500">{srv.nameBn}</span>}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {srv.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-600">{srv.turnaroundDays} Days</td>
                        <td className="py-3.5 px-3 font-medium text-slate-600">{srv.warrantyYears} Yrs</td>
                        <td className="py-3.5 px-3 font-semibold text-teal-700">{priceLabel(srv.basePrice)}</td>
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => toggleServiceActive(srv)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                              srv.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {srv.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openEditService(srv)}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Edit Product"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteService(srv)}
                            disabled={deletingId === `service-${srv.id}`}
                            className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        )}
      </SectionFrame>

      {serviceModal && (
        <ModalShell onClose={() => setServiceModal(false)}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitService}
            className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingService ? 'Edit Dental Product' : 'Add New Dental Product'}
              </h3>
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <select
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  >
                    <option value="Zirconia & All-Ceramic">Zirconia &amp; All-Ceramic</option>
                    <option value="Porcelain (PFM)">Porcelain (PFM)</option>
                    <option value="Dentures & Ortho">Dentures &amp; Ortho</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={serviceForm.displayOrder}
                    onChange={(e) => setServiceForm({ ...serviceForm, displayOrder: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Product Name (EN) *</label>
                <input
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Zirconia Crown / Bridge"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              {/* Product Photo Upload Field with Sharp WebP Conversion */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Product Image / Photo (Sharp WebP)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  {serviceForm.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs group">
                      <img
                        src={serviceForm.imageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, imageUrl: '' })}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Package size={26} />
                      <span className="text-[11px] font-bold mt-1">No Photo</span>
                    </div>
                  )}

                  <div
                    className={`flex-1 w-full space-y-2 rounded-xl border-2 border-dashed p-3 transition-colors ${
                      dragZone === 'product' ? 'border-teal-700 bg-teal-700/5' : 'border-transparent'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragZone('product');
                    }}
                    onDragLeave={() => setDragZone(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragZone(null);
                      const file = e.dataTransfer.files?.[0];
                      if (file && !uploadingProduct) uploadProductImage(file);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="min-h-[38px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shadow-xs">
                        <ImagePlus size={15} className="text-teal-700" />
                        {uploadingProduct ? 'Uploading & Converting...' : (serviceForm.imageUrl ? 'Change Photo' : 'Upload Product Photo')}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingProduct}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadProductImage(file);
                            e.target.value = ''; // allow re-picking the same file
                          }}
                          className="hidden"
                        />
                      </label>
                      {serviceForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setServiceForm({ ...serviceForm, imageUrl: '' })}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {serviceForm.imageUrl ? (
                      <p className="text-xs font-mono text-slate-500 truncate max-w-full">
                        {serviceForm.imageUrl}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Drop an image here or click Upload. JPEG, PNG or WebP up to 10 MB, converted to 1200px WebP.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Bengali Name (BN)</label>
                <input
                  value={serviceForm.nameBn}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameBn: e.target.value })}
                  placeholder="e.g. Zirconia ক্রাউন / ব্রিজ"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Lead Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={serviceForm.turnaroundDays}
                    onChange={(e) => setServiceForm({ ...serviceForm, turnaroundDays: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Warranty (Years)</label>
                  <input
                    type="number"
                    min={0}
                    value={serviceForm.warrantyYears}
                    onChange={(e) => setServiceForm({ ...serviceForm, warrantyYears: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Price (BDT / Quote)</label>
                  <input
                    value={serviceForm.basePrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value.replace(/[৳\s]/g, '') })}
                    placeholder="e.g. 3500"
                    inputMode="numeric"
                    className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Clinical Specs / Tag</label>
                <input
                  value={serviceForm.specs}
                  onChange={(e) => setServiceForm({ ...serviceForm, specs: e.target.value })}
                  placeholder="e.g. Monolithic & Multilayer Aidite · Roland 5-Axis"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Clinical details, indication, materials used..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Publish on public catalogue (Active)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingService}
                className="min-h-[44px] px-6 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-md"
              >
                {savingService ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Write / Edit Article Modal */}
    </>
  );
}
