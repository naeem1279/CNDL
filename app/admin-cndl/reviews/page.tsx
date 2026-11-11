'use client';
import { useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { SectionFrame } from '../_components/SectionFrame';
import { EMPTY_REVIEW_FORM } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, Message, Order, ReviewRow, ServiceRow } from '../_lib/types';
import { apiError, formatDate } from '../_lib/utils';

export default function ReviewsPage() {
  const { me, adminFetch, askConfirm } = useAdmin();

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<ReviewRow | null>(null);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: testimonials. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['testimonials'], me.role);
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

  const closeReviewModal = () => {
    setReviewModal(false);
    setEditingReview(null);
  };

  const openEditReview = (review: ReviewRow) => {
    setEditingReview(review);
    setReviewForm({
      doctorName: review.doctorName,
      clinicName: review.clinicName,
      location: review.location,
      rating: review.rating,
      comment: review.comment,
    });
    setReviewModal(true);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      const res = await adminFetch(
        editingReview ? `/api/admin/testimonials/${editingReview.id}` : '/api/admin/testimonials',
        {
          method: editingReview ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewForm),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingReview ? 'Review updated' : 'Doctor review added');
        closeReviewModal();
        setReviewForm(EMPTY_REVIEW_FORM);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save review'));
      }
    } catch {
      toast.error('Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  const deleteReview = async (review: ReviewRow) => {
    if (!(await askConfirm(`Delete review by ${review.doctorName}? This cannot be undone.`))) return;
    setDeletingId(`review-${review.id}`);
    try {
      const res = await adminFetch(`/api/admin/testimonials/${review.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Review deleted');
        await fetchData(true);
      } else {
        toast.error(res.status === 401 ? 'Session expired — please sign in again' : 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SectionFrame
        tab="reviews"
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= DOCTOR REVIEWS ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-2xl font-semibold">Doctor Reviews</h2>
              <button
                onClick={() => setReviewModal(true)}
                className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <Plus size={16} /> Add Doctor Review
              </button>
            </div>

            {data.reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <Star size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">No reviews yet</p>
                <p className="text-xs text-slate-500 mt-1">Approved reviews appear on the homepage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(data?.reviews ?? []).map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center shrink-0">
                          {review.doctorName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{review.doctorName}</div>
                          <div className="text-xs text-gray-500 truncate">{review.clinicName}</div>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openEditReview(review)}
                          aria-label={`Edit review by ${review.doctorName}`}
                          title="Edit review"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteReview(review)}
                          disabled={deletingId === `review-${review.id}`}
                          aria-label={`Delete review by ${review.doctorName}`}
                          title="Delete review"
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                        />
                      ))}
                      <span className="text-[11px] font-semibold text-slate-500 ml-1">{review.rating}/5</span>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl p-4 text-xs md:text-sm leading-relaxed text-gray-700 whitespace-pre-wrap flex-1">
                      {review.comment}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{review.location}</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionFrame>

      {reviewModal && (
        <ModalShell onClose={closeReviewModal}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitReview}
            className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingReview ? 'Edit Doctor Review' : 'Add Doctor Review'}
              </h3>
              <button
                type="button"
                onClick={closeReviewModal}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Doctor Name *</label>
                  <input
                    required
                    value={reviewForm.doctorName}
                    onChange={(e) => setReviewForm({ ...reviewForm, doctorName: e.target.value })}
                    placeholder="Staff / Agent Full Name"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Clinic Name *</label>
                  <input
                    required
                    value={reviewForm.clinicName}
                    onChange={(e) => setReviewForm({ ...reviewForm, clinicName: e.target.value })}
                    placeholder="Clinic / Hospital"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
                  <input
                    value={reviewForm.location}
                    onChange={(e) => setReviewForm({ ...reviewForm, location: e.target.value })}
                    placeholder="Dhaka, Bangladesh"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Rating *</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-teal-700/20"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Comment *</label>
                <textarea
                  required
                  rows={5}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="The doctor's review text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 pb-6 sm:pb-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-gray-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReview}
                  className="min-h-[44px] px-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={14} className={savingReview ? 'animate-spin' : 'hidden'} />
                  {savingReview ? 'Saving...' : editingReview ? 'Save Changes' : 'Add Review'}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Client Inquiry Full-Message Drawer */}
    </>
  );
}
