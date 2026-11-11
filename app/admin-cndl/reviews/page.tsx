'use client';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, MessageSquareQuote, MoreHorizontal, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Button, EmptyState, Field, Input, MenuButton } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { ReviewRow } from '../_lib/types';
import { apiError } from '../_lib/utils';

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} aria-hidden="true" className={i <= value ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  /** undefined = closed, null = adding, a row = editing. */
  const [dialog, setDialog] = useState<ReviewRow | null | undefined>(undefined);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['testimonials'], me.role);
      if (!r) return;
      if (r.reviews) setReviews(r.reviews);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [reviews]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const kpis: Kpi[] = [
    { label: 'Testimonials', value: String(reviews.length), icon: MessageSquareQuote, sub: 'On the website' },
    { label: 'Average rating', value: reviews.length ? `${avg.toFixed(1)} / 5` : '—', icon: Star, sub: `${reviews.filter((r) => r.rating === 5).length} five-star` },
    { label: 'Places', value: String(new Set(reviews.map((r) => r.location)).size), icon: MapPin, sub: 'Doctors from' },
    { label: 'Latest', value: sorted[0] ? new Date(sorted[0].createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—', icon: MessageSquareQuote, sub: sorted[0]?.doctorName || 'Nothing yet' },
  ];

  const remove = async (r: ReviewRow) => {
    if (!(await askConfirm(`Delete the testimonial from ${r.doctorName}? It disappears from the website. This cannot be undone.`))) return;
    try {
      const res = await adminFetch(`/api/admin/testimonials/${r.id}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the testimonial'));
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  return (
    <SectionFrame
      tab="reviews"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
          <span className="hidden sm:inline">Add testimonial</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <EmptyState icon={MessageSquareQuote} title="No testimonials yet">
            Add what doctors say about the lab; they appear on the website.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((r) => (
            <li key={r.id} className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <Stars value={r.rating} />
                <div className="-mr-1.5 -mt-1.5">
                  <MenuButton
                    label={`Actions for ${r.doctorName}'s testimonial`}
                    icon={MoreHorizontal}
                    iconOnly
                    variant="ghost"
                    items={[
                      { label: 'Edit', icon: Pencil, onSelect: () => setDialog(r) },
                      { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(r) },
                    ]}
                  />
                </div>
              </div>
              <blockquote className="mt-2 flex-1 text-body text-zinc-700 [overflow-wrap:anywhere]">
                <p className="line-clamp-6">“{r.comment}”</p>
              </blockquote>
              <footer className="mt-3 border-t border-zinc-100 pt-3">
                <p className="text-body font-medium text-zinc-900 [overflow-wrap:anywhere]">{r.doctorName}</p>
                <p className="text-meta text-zinc-500 [overflow-wrap:anywhere]">
                  {r.clinicName} · {r.location}
                </p>
              </footer>
            </li>
          ))}
        </ul>
      )}
      {dialog !== undefined && <ReviewDialog editing={dialog} onClose={() => setDialog(undefined)} onSaved={() => void fetchData(true)} />}
    </SectionFrame>
  );
}

function ReviewDialog({ editing, onClose, onSaved }: { editing: ReviewRow | null; onClose: () => void; onSaved: () => void }) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({
    doctorName: editing?.doctorName || '',
    clinicName: editing?.clinicName || '',
    location: editing?.location || 'Dhaka, Bangladesh',
    rating: editing?.rating ?? 5,
    comment: editing?.comment || '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: 'doctorName' | 'clinicName' | 'location' | 'comment') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (f.doctorName.trim().length < 3) err.doctorName = "Enter the doctor's name";
    if (f.clinicName.trim().length < 2) err.clinicName = 'Enter the clinic';
    if (f.location.trim().length < 2) err.location = 'Enter the town or city';
    if (f.comment.trim().length < 10) err.comment = 'Write what they said (at least 10 characters)';
    if (f.comment.length > 1500) err.comment = 'Keep it under 1,500 characters';
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`rv-${first}`)?.focus();
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/testimonials/${editing.id}` : '/api/admin/testimonials', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorName: f.doctorName.trim(), clinicName: f.clinicName.trim(), location: f.location.trim(), rating: f.rating, comment: f.comment.trim() }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the testimonial'));
      toast.success(editing ? 'Testimonial updated' : 'Testimonial added');
      onClose();
      onSaved();
    } catch {
      toast.error('Network error — nothing was saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={editing ? 'Edit testimonial' : 'Add testimonial'} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Save changes' : 'Add testimonial'} saving={saving}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Doctor" htmlFor="rv-doctorName" required error={errors.doctorName}>
          <Input id="rv-doctorName" value={f.doctorName} onChange={set('doctorName')} invalid={!!errors.doctorName} placeholder="Dr. Full Name" />
        </Field>
        <Field label="Clinic" htmlFor="rv-clinicName" required error={errors.clinicName}>
          <Input id="rv-clinicName" value={f.clinicName} onChange={set('clinicName')} invalid={!!errors.clinicName} />
        </Field>
      </div>
      <Field label="Location" htmlFor="rv-location" required error={errors.location}>
        <Input id="rv-location" value={f.location} onChange={set('location')} invalid={!!errors.location} />
      </Field>
      <div className="space-y-1.5">
        <span className="block text-table font-medium text-zinc-700">Rating</span>
        <div role="radiogroup" aria-label="Rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={f.rating === i}
              aria-label={`${i} star${i === 1 ? '' : 's'}`}
              onClick={() => setF((x) => ({ ...x, rating: i }))}
              className="rounded-md p-1 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <Star size={22} aria-hidden="true" className={i <= f.rating ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'} />
            </button>
          ))}
        </div>
      </div>
      <Field label="What they said" htmlFor="rv-comment" required error={errors.comment} hint={`${f.comment.length}/1500`}>
        <textarea
          id="rv-comment"
          rows={5}
          value={f.comment}
          onChange={set('comment')}
          className={`block w-full rounded-lg border bg-white px-3 py-2 text-body text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${errors.comment ? 'border-rose-400' : 'border-zinc-200'}`}
        />
      </Field>
    </FormDialog>
  );
}
