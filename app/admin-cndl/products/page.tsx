'use client';
import { useEffect, useMemo, useState } from 'react';
import { Clock, Eye, EyeOff, ImageOff, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { ImageField } from '../_components/ImageField';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Field, Input, MenuButton, Select } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ServiceRow } from '../_lib/types';
import { apiError, priceLabel } from '../_lib/utils';

const CATEGORIES = ['Zirconia & All-Ceramic', 'Porcelain (PFM)', 'Dentures & Ortho', 'Other'];
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');
type Show = 'all' | 'live' | 'hidden';

export default function ProductsPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [show, setShow] = useState<Show>('all');
  /** undefined = closed, null = adding, a row = editing. */
  const [dialog, setDialog] = useState<ServiceRow | null | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['services'], me.role);
      if (!r) return;
      if (r.services) setServices(r.services);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => [...services].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)), [services]);
  const categories = useMemo(() => [...new Set([...CATEGORIES, ...services.map((s) => s.category)])], [services]);
  const filtered = sorted.filter((s) => {
    if (category !== 'ALL' && s.category !== category) return false;
    if (show === 'live' && !s.isActive) return false;
    if (show === 'hidden' && s.isActive) return false;
    const q = query.trim().toLowerCase();
    return !q || [s.name, s.nameBn, s.specs, s.description].some((v) => (v || '').toLowerCase().includes(q));
  });

  const live = services.filter((s) => s.isActive);
  const noPhoto = live.filter((s) => !s.imageUrl);
  const avgDays = live.length ? Math.round((live.reduce((t, s) => t + s.turnaroundDays, 0) / live.length) * 10) / 10 : 0;
  const kpis: Kpi[] = [
    { label: 'On the website', value: String(live.length), icon: Eye, sub: `${services.length - live.length} hidden` },
    { label: 'Categories', value: String(new Set(live.map((s) => s.category)).size), icon: Package, sub: 'With live products' },
    { label: 'Average turnaround', value: `${avgDays} days`, icon: Clock, sub: 'Of live products' },
    { label: 'Missing a photo', value: String(noPhoto.length), icon: ImageOff, sub: noPhoto.length ? 'Need a photo' : 'All have photos', subTone: noPhoto.length ? 'down' : 'neutral' },
  ];

  const toggle = async (s: ServiceRow) => {
    setTogglingId(s.id);
    try {
      const res = await adminFetch(`/api/admin/services/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not update the product'));
      setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive: !s.isActive } : x)));
      toast.success(`${s.name} ${s.isActive ? 'hidden from' : 'shown on'} the website`);
    } catch {
      toast.error('Network error — not updated');
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (s: ServiceRow) => {
    if (!(await askConfirm(`Delete "${s.name}"? This cannot be undone. To take it off the website but keep it, hide it instead.`))) return;
    try {
      const res = await adminFetch(`/api/admin/services/${s.id}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the product'));
      setServices((prev) => prev.filter((x) => x.id !== s.id));
      toast.success(`${s.name} deleted`);
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const menu = (s: ServiceRow) => (
    <MenuButton
      label={`Actions for ${s.name}`}
      icon={MoreHorizontal}
      iconOnly
      variant="ghost"
      items={[
        { label: 'Edit', icon: Pencil, onSelect: () => setDialog(s) },
        { label: s.isActive ? 'Hide from website' : 'Show on website', icon: s.isActive ? EyeOff : Eye, onSelect: () => void toggle(s) },
        { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(s) },
      ]}
    />
  );
  const thumb = (s: ServiceRow) =>
    s.imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
      <img src={s.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-md border border-zinc-200 object-cover" />
    ) : (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-300 text-zinc-300" title="No photo">
        <ImageOff size={14} aria-hidden="true" />
      </span>
    );

  return (
    <SectionFrame
      tab="products"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      description="The restoration catalogue shown on the website, and offered in the New case form."
      actions={
        <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
          <span className="hidden sm:inline">Add product</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" aria-label="Search products" className="pl-9" />
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <div className="min-w-0 sm:w-52">
              <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="ALL">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="min-w-0 sm:w-40">
              <Select aria-label="Visibility" value={show} onChange={(e) => setShow(e.target.value as Show)}>
                <option value="all">Live and hidden</option>
                <option value="live">On the website</option>
                <option value="hidden">Hidden</option>
              </Select>
            </div>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title={services.length ? 'No products match' : 'No products yet'}>
            {services.length ? 'Try another search or filter.' : 'Add the restorations the lab makes; they appear on the website and in the New case form.'}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full table-fixed text-left md:table">
              <thead>
                <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                  <th className="w-12 py-2.5 pl-4 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Product</th>
                  <th className="hidden w-[180px] px-3 py-2.5 font-medium xl:table-cell">Category</th>
                  <th className="w-[110px] px-3 py-2.5 text-right font-medium">Price</th>
                  <th className="hidden w-[140px] px-3 py-2.5 font-medium lg:table-cell">Turnaround</th>
                  <th className="w-[110px] px-3 py-2.5 font-medium">Website</th>
                  <th className="w-12 px-2 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-table">
                {filtered.map((s) => (
                  <tr key={s.id} className={cx('hover:bg-zinc-50', !s.isActive && 'text-zinc-400')}>
                    <td className="py-2.5 pl-4 text-meta text-zinc-400 tabular-nums">{s.displayOrder}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        {thumb(s)}
                        <div className="min-w-0">
                          <button type="button" onClick={() => setDialog(s)} className={cx('block max-w-full truncate text-left text-body font-medium hover:underline', s.isActive ? 'text-zinc-900' : 'text-zinc-500')}>
                            {s.name}
                          </button>
                          <p className="truncate text-meta text-zinc-500">
                            <span className="xl:hidden">{s.category}</span>
                            <span className="hidden xl:inline">{[s.nameBn, s.specs].filter(Boolean).join(' · ') || '—'}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden truncate px-3 py-2.5 text-zinc-600 xl:table-cell">{s.category}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{priceLabel(s.basePrice)}</td>
                    <td className="hidden px-3 py-2.5 text-zinc-600 lg:table-cell">
                      {s.turnaroundDays}d · {s.warrantyYears}y warranty
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.isActive}
                        aria-label={`${s.name} on the website`}
                        disabled={togglingId === s.id}
                        onClick={() => void toggle(s)}
                        className="inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className={cx('relative h-5 w-9 rounded-full transition-colors', s.isActive ? 'bg-brand-600' : 'bg-zinc-300')}>
                          <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', s.isActive ? 'left-[18px]' : 'left-0.5')} />
                        </span>
                        <span className="text-meta text-zinc-600">{s.isActive ? 'Live' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-right">{menu(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-zinc-100 md:hidden">
              {filtered.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  {thumb(s)}
                  <div className="min-w-0 flex-1">
                    <p className={cx('text-body font-medium [overflow-wrap:anywhere]', s.isActive ? 'text-zinc-900' : 'text-zinc-500')}>{s.name}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-meta text-zinc-500">
                      {priceLabel(s.basePrice)} · {s.turnaroundDays}d
                      {!s.isActive && <Badge>Hidden</Badge>}
                    </p>
                  </div>
                  <div className="-my-1 shrink-0">{menu(s)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {dialog !== undefined && (
        <ProductDialog
          editing={dialog}
          categories={categories}
          nextOrder={services.reduce((m, s) => Math.max(m, s.displayOrder), 0) + 1}
          onClose={() => setDialog(undefined)}
          onSaved={() => void fetchData(true)}
        />
      )}
    </SectionFrame>
  );
}

function ProductDialog({
  editing,
  categories,
  nextOrder,
  onClose,
  onSaved,
}: {
  editing: ServiceRow | null;
  categories: string[];
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({
    name: editing?.name || '',
    nameBn: editing?.nameBn || '',
    category: editing?.category || categories[0],
    basePrice: (editing?.basePrice || '').replace(/[৳\s]/g, ''),
    turnaroundDays: String(editing?.turnaroundDays ?? 3),
    warrantyYears: String(editing?.warrantyYears ?? 5),
    specs: editing?.specs || '',
    description: editing?.description || '',
    imageUrl: editing?.imageUrl || '',
    displayOrder: String(editing?.displayOrder ?? nextOrder),
    isActive: editing?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (f.name.trim().length < 2) err.name = 'Enter the product name';
    const days = Number(f.turnaroundDays);
    if (!Number.isInteger(days) || days < 1 || days > 30) err.turnaroundDays = '1 to 30 days';
    const years = Number(f.warrantyYears);
    if (!Number.isInteger(years) || years < 0 || years > 30) err.warrantyYears = '0 to 30 years';
    if (f.description.length > 1000) err.description = 'Keep it under 1,000 characters';
    if (f.specs.length > 300) err.specs = 'Keep it under 300 characters';
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`pr-${first}`)?.focus();
    if (uploading) return void toast.info('Wait for the photo to finish uploading');
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/services/${editing.id}` : '/api/admin/services', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name.trim(),
          nameBn: f.nameBn.trim() || null,
          category: f.category,
          basePrice: f.basePrice.trim() || null,
          turnaroundDays: days,
          warrantyYears: years,
          specs: f.specs.trim() || null,
          description: f.description.trim() || null,
          imageUrl: f.imageUrl || null,
          displayOrder: Number(f.displayOrder) || 0,
          isActive: f.isActive,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the product'));
      toast.success(editing ? `${f.name.trim()} updated` : `${f.name.trim()} added`);
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  const TEXTAREA = 'block w-full rounded-lg border bg-white px-3 py-2 text-body text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';
  return (
    <FormDialog title={editing ? 'Edit product' : 'Add product'} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Add product'} saving={saving || uploading} savingLabel={uploading ? 'Uploading photo…' : 'Saving…'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="pr-name" required error={errors.name}>
          <Input id="pr-name" value={f.name} onChange={set('name')} invalid={!!errors.name} placeholder="e.g. Zirconia crown" />
        </Field>
        <Field label="Name in Bengali" htmlFor="pr-nameBn">
          <Input id="pr-nameBn" value={f.nameBn} onChange={set('nameBn')} lang="bn" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="pr-category">
          <Select id="pr-category" value={f.category} onChange={set('category')}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Price (৳)" htmlFor="pr-basePrice" hint="Leave empty to show “Quote”">
          <Input id="pr-basePrice" value={f.basePrice} onChange={set('basePrice')} placeholder="e.g. 3500 or 3500–4500" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Turnaround (days)" htmlFor="pr-turnaroundDays" error={errors.turnaroundDays}>
          <Input id="pr-turnaroundDays" type="number" min={1} max={30} value={f.turnaroundDays} onChange={set('turnaroundDays')} invalid={!!errors.turnaroundDays} />
        </Field>
        <Field label="Warranty (years)" htmlFor="pr-warrantyYears" error={errors.warrantyYears}>
          <Input id="pr-warrantyYears" type="number" min={0} max={30} value={f.warrantyYears} onChange={set('warrantyYears')} invalid={!!errors.warrantyYears} />
        </Field>
        <Field label="Order" htmlFor="pr-displayOrder" hint="Lower shows first">
          <Input id="pr-displayOrder" type="number" value={f.displayOrder} onChange={set('displayOrder')} />
        </Field>
      </div>
      <Field label="Key specs" htmlFor="pr-specs" error={errors.specs} hint="One line, e.g. 1200 MPa · translucent · 5-year warranty">
        <Input id="pr-specs" value={f.specs} onChange={set('specs')} invalid={!!errors.specs} />
      </Field>
      <Field label="Description" htmlFor="pr-description" error={errors.description}>
        <textarea id="pr-description" rows={3} value={f.description} onChange={set('description')} className={`${TEXTAREA} ${errors.description ? 'border-rose-400' : 'border-zinc-200'}`} />
      </Field>
      <ImageField label="Photo" value={f.imageUrl} onChange={(url) => setF((x) => ({ ...x, imageUrl: url }))} onUploading={setUploading} aspect="aspect-[4/3]" hint="Shown on the products page. Converted to WebP automatically." />
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 hover:bg-zinc-50">
        <input type="checkbox" checked={f.isActive} onChange={(e) => setF((x) => ({ ...x, isActive: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-brand-600" />
        <span className="text-body text-zinc-700">
          Show on the website
          <span className="block text-meta text-zinc-500">Hidden products stay here and can be shown again any time.</span>
        </span>
      </label>
    </FormDialog>
  );
}
