'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FileText, ImagePlus, Layers, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { EMPTY_BLOG_FORM } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, Message, Order, ReviewRow, ServiceRow } from '../_lib/types';
import { apiError, checkImageFile, formatDate, slugify } from '../_lib/utils';

export default function BlogsPage() {
  const { me, adminFetch, handleAuthLoss, askConfirm } = useAdmin();

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Blogs & reviews management
  const [blogModal, setBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [savingBlog, setSavingBlog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<BlogRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragZone, setDragZone] = useState<'blog' | 'product' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: blogs. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['blogs'], me.role);
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

  const uploadImage = async (file: File) => {
    setUploading(true);
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
        setBlogForm((f) => ({ ...f, imageUrl: body.url }));
        setPreviewUrl(body.url);
        toast.success('Image uploaded & optimized');
      } else {
        toast.error(apiError(body, 'Upload failed'));
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onBlogFilePicked = (file: File | null | undefined) => {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file)); // instant local preview while uploading
    uploadImage(file);
  };

  const closeBlogModal = () => {
    setBlogModal(false);
    setEditingBlog(null);
    setPreviewUrl(null);
  };

  const openEditBlog = (blog: BlogRow) => {
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      excerpt: blog.excerpt,
      content: blog.content,
      imageUrl: blog.image,
    });
    setPreviewUrl(blog.image);
    setBlogModal(true);
  };

  const submitBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBlog(true);
    try {
      const payload = { ...blogForm, slug: blogForm.slug || slugify(blogForm.title) };
      const res = await adminFetch(
        editingBlog ? `/api/admin/blogs/${editingBlog.id}` : '/api/admin/blogs',
        {
          method: editingBlog ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(editingBlog ? 'Article updated' : 'Article published');
        closeBlogModal();
        setBlogForm(EMPTY_BLOG_FORM);
        await fetchData(true);
      } else {
        toast.error(apiError(body, 'Failed to save article'));
      }
    } catch {
      toast.error('Failed to save article');
    } finally {
      setSavingBlog(false);
    }
  };

  const deleteBlog = async (blog: BlogRow) => {
    if (!(await askConfirm(`Delete article "${blog.title}"? This cannot be undone.`))) return;
    setDeletingId(`blog-${blog.id}`);
    try {
      const res = await adminFetch(`/api/admin/blogs/${blog.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Article deleted');
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
  const blogCount = data.blogs.length;
  const blogCategoryCount = new Set(data.blogs.map((b) => b.category)).size;
  const blogDraftCount = (data?.blogs ?? []).filter((b) => !b.publishedAt).length;

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards: Kpi[] = [
      { label: 'Published Articles', value: blogCount, icon: FileText, bg: 'bg-teal-700/10', fg: 'text-teal-700' },
      { label: 'Categories', value: blogCategoryCount, icon: Layers, bg: 'bg-slate-100', fg: 'text-slate-600' },
      { label: 'Drafts', value: blogDraftCount, icon: Pencil, bg: 'bg-slate-200', fg: 'text-slate-600' },
  ];

  return (
    <>
      <SectionFrame
        tab="blogs"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= TAB 3: BLOG ARTICLES ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-2xl font-semibold">Blog Articles</h2>
              <button
                onClick={() => setBlogModal(true)}
                className="min-h-[44px] px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors"
              >
                <Plus size={16} /> Write New Article
              </button>
            </div>

            {data.blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <FileText size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">No articles yet</p>
                <p className="text-xs text-slate-500 mt-1">Published articles appear on the public blog.</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked card view */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {(data?.blogs ?? []).map((blog) => (
                    <div key={blog.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                      <div className="flex items-start gap-3">
                        <Image
                          src={blog.image}
                          alt=""
                          width={60}
                          height={60}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-2.5 py-0.5 text-[11px] font-bold">
                            {blog.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug line-clamp-2" title={blog.title}>
                            {blog.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">/blog/{blog.slug}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(blog.publishedAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => openEditBlog(blog)}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteBlog(blog)}
                          disabled={deletingId === `blog-${blog.id}`}
                          className="min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left tabular-nums">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="pb-4 pr-4">Thumbnail</th>
                      <th className="pb-4 pr-4">Title</th>
                      <th className="pb-4 pr-4">Category</th>
                      <th className="pb-4 pr-4">Published</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.blogs ?? []).map((blog) => (
                      <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 pr-4">
                          <Image
                            src={blog.image}
                            alt=""
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-bold text-sm max-w-[320px] truncate" title={blog.title}>{blog.title}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[320px]" title={blog.slug}>/blog/{blog.slug}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="inline-flex items-center rounded-full bg-teal-700/10 text-teal-700 px-3 py-1 text-[11px] font-bold whitespace-nowrap">
                            {blog.category}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(blog.publishedAt)}</td>
                        <td className="py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditBlog(blog)}
                              aria-label={`Edit ${blog.title}`}
                              title="Edit article"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => deleteBlog(blog)}
                              disabled={deletingId === `blog-${blog.id}`}
                              aria-label={`Delete ${blog.title}`}
                              title="Delete article"
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
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

      {blogModal && (
        <ModalShell onClose={closeBlogModal}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
        >
          <form
            onSubmit={submitBlog}
            className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl shadow-xl"
            role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3 rounded-t-xl">
              <h3 className="text-base sm:text-lg font-semibold text-teal-700">
                {editingBlog ? 'Edit Article' : 'Write New Article'}
              </h3>
              <button
                type="button"
                onClick={closeBlogModal}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Title *</label>
                <input
                  required
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="Article headline"
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Slug * <span className="normal-case font-medium">(auto from title if empty)</span>
                  </label>
                  <input
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: slugify(e.target.value) })}
                    placeholder="my-article-url"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                  <input
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    placeholder="Zirconia & CAD/CAM"
                    className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Short summary shown on cards and search results"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Content *</label>
                <textarea
                  required
                  rows={10}
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  placeholder="Full article text. Separate paragraphs with a blank line."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Cover Image <span className="normal-case font-medium">(auto-optimized to WebP, max 1200px)</span>
                </label>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragZone('blog');
                  }}
                  onDragLeave={() => setDragZone(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragZone(null);
                    onBlogFilePicked(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${
                    uploading || dragZone === 'blog'
                      ? 'border-teal-700 bg-teal-700/5'
                      : 'border-slate-300 hover:border-teal-700/60 hover:bg-teal-700/5'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      onBlogFilePicked(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Cover preview" className="w-full h-36 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <ImagePlus size={28} className="text-slate-400" />
                  )}
                  <span className="text-xs font-bold text-gray-500">
                    {uploading ? 'Uploading & optimizing…' : 'Drop an image here or click to upload'}
                  </span>
                </label>
                <input
                  value={blogForm.imageUrl}
                  onChange={(e) => {
                    setBlogForm({ ...blogForm, imageUrl: e.target.value });
                    setPreviewUrl(e.target.value || null);
                  }}
                  placeholder="/images/blog.jpg"
                  className="w-full min-h-[40px] mt-2 px-4 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 pb-6 sm:pb-2">
                <button
                  type="button"
                  onClick={closeBlogModal}
                  className="min-h-[44px] px-5 rounded-xl border border-slate-200 text-xs font-bold text-gray-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBlog || uploading}
                  className="min-h-[44px] px-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={14} className={savingBlog ? 'animate-spin' : 'hidden'} />
                  {savingBlog ? 'Saving...' : editingBlog ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add / Edit Doctor Review Modal */}
    </>
  );
}
