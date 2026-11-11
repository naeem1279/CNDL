'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, FileText, Folder, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormDialog } from '../_components/FormDialog';
import { ImageField } from '../_components/ImageField';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Field, Input, MenuButton, Select } from '../_components/ui';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow } from '../_lib/types';
import { apiError, bdMonthKey, formatDay, slugify } from '../_lib/utils';

const DEFAULT_IMAGE = '/images/blog.jpg';

export default function BlogsPage() {
  const { me, adminFetch, askConfirm, handleAuthLoss } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  /** undefined = closed, null = writing a new one, a row = editing. */
  const [dialog, setDialog] = useState<BlogRow | null | undefined>(undefined);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['blogs'], me.role);
      if (!r) return;
      if (r.blogs) setBlogs(r.blogs);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => [...blogs].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()), [blogs]);
  const categories = useMemo(() => [...new Set(blogs.map((b) => b.category).filter(Boolean))].sort(), [blogs]);
  const filtered = sorted.filter((b) => {
    if (category !== 'ALL' && b.category !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || [b.title, b.excerpt, b.slug].some((v) => (v || '').toLowerCase().includes(q));
  });
  const month = bdMonthKey(new Date().toISOString());
  const latest = sorted[0];
  const kpis: Kpi[] = [
    { label: 'Articles', value: String(blogs.length), icon: FileText, sub: 'Live on the blog' },
    { label: 'This month', value: String(blogs.filter((b) => bdMonthKey(b.publishedAt) === month).length), icon: CalendarDays, sub: 'New articles' },
    { label: 'Categories', value: String(categories.length), icon: Folder, sub: categories.slice(0, 2).join(', ') || '—' },
    { label: 'Latest', value: latest ? new Date(latest.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—', icon: CalendarDays, sub: latest ? 'Most recent article' : 'Nothing yet' },
  ];

  const remove = async (b: BlogRow) => {
    if (!(await askConfirm(`Delete "${b.title}"? It disappears from the website and /blog/${b.slug} stops working. This cannot be undone.`))) return;
    try {
      const res = await adminFetch(`/api/admin/blogs/${b.id}`, { method: 'DELETE' });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not delete the article'));
      setBlogs((prev) => prev.filter((x) => x.id !== b.id));
      toast.success('Article deleted');
    } catch {
      toast.error('Network error — nothing was deleted');
    }
  };

  const menu = (b: BlogRow) => (
    <MenuButton
      label={`Actions for ${b.title}`}
      icon={MoreHorizontal}
      iconOnly
      variant="ghost"
      items={[
        { label: 'Edit', icon: Pencil, onSelect: () => setDialog(b) },
        { label: 'View on website', icon: ExternalLink, onSelect: () => window.open(`/blog/${b.slug}`, '_blank', 'noopener') },
        { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(b) },
      ]}
    />
  );

  return (
    <SectionFrame
      tab="blogs"
      kpis={kpis}
      loading={loading}
      refreshing={refreshing}
      lastSyncedAt={lastSyncedAt}
      onRefresh={() => fetchData(true)}
      actions={
        <Button variant="primary" icon={Plus} onClick={() => setDialog(null)}>
          <span className="hidden sm:inline">Write article</span>
          <span className="sm:hidden">Write</span>
        </Button>
      }
    >
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles and summaries" aria-label="Search articles" className="pl-9" />
          </div>
          {categories.length > 1 && (
            <div className="w-full sm:w-56">
              <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="ALL">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title={blogs.length ? 'No articles match' : 'No articles yet'}>
            {blogs.length ? 'Try another search.' : 'Articles you write appear on the website blog and help it show up in search.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((b) => (
              <li key={b.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={b.image || DEFAULT_IMAGE} alt="" className="h-14 w-20 shrink-0 rounded-md border border-zinc-200 object-cover sm:h-12 sm:w-[72px]" />
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => setDialog(b)} className="text-left text-body font-medium text-zinc-900 hover:underline [overflow-wrap:anywhere]">
                    {b.title}
                  </button>
                  <p className="line-clamp-1 text-meta text-zinc-500">{b.excerpt}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-zinc-400">
                    <Badge>{b.category}</Badge>
                    {formatDay(b.publishedAt)}
                    <span className="hidden font-mono sm:inline">/blog/{b.slug}</span>
                  </p>
                </div>
                <div className="-my-1 shrink-0">{menu(b)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {dialog !== undefined && <ArticleDialog editing={dialog} categories={categories} taken={blogs.filter((b) => b.id !== dialog?.id).map((b) => b.slug)} onClose={() => setDialog(undefined)} onSaved={() => void fetchData(true)} />}
    </SectionFrame>
  );
}

function ArticleDialog({
  editing,
  categories,
  taken,
  onClose,
  onSaved,
}: {
  editing: BlogRow | null;
  categories: string[];
  taken: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { adminFetch, handleAuthLoss } = useAdmin();
  const [f, setF] = useState({
    title: editing?.title || '',
    slug: editing?.slug || '',
    category: editing?.category || 'Zirconia & CAD/CAM',
    excerpt: editing?.excerpt || '',
    content: editing?.content || '',
    imageUrl: editing?.image || DEFAULT_IMAGE,
  });
  /** The address follows the title until someone edits it by hand. */
  const [slugTouched, setSlugTouched] = useState(!!editing);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const slug = slugTouched ? f.slug : slugify(f.title);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const words = f.content.trim() ? f.content.trim().split(/\s+/).length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string | undefined> = {};
    if (f.title.trim().length < 3) err.title = 'Enter a title';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3) err.slug = 'Use lowercase letters, numbers and hyphens';
    else if (taken.includes(slug)) err.slug = 'Another article already uses this address';
    if (f.category.trim().length < 2) err.category = 'Enter a category';
    if (f.excerpt.trim().length < 10) err.excerpt = 'Write a one or two sentence summary (at least 10 characters)';
    if (f.excerpt.length > 500) err.excerpt = 'Keep the summary under 500 characters';
    if (f.content.trim().length < 20) err.content = 'Write the article (at least 20 characters)';
    setErrors(err);
    const first = Object.keys(err).find((k) => err[k]);
    if (first) return void document.getElementById(`bl-${first}`)?.focus();
    if (uploading) return void toast.info('Wait for the image to finish uploading');
    setSaving(true);
    try {
      const res = await adminFetch(editing ? `/api/admin/blogs/${editing.id}` : '/api/admin/blogs', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: f.title.trim(),
          slug,
          category: f.category.trim(),
          excerpt: f.excerpt.trim(),
          content: f.content.trim(),
          imageUrl: f.imageUrl || DEFAULT_IMAGE,
        }),
      });
      if (res.status === 401) return handleAuthLoss();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(apiError(body, 'Could not save the article'));
      toast.success(editing ? 'Article updated' : 'Article published');
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
    <FormDialog
      wide
      title={editing ? 'Edit article' : 'Write article'}
      description={editing ? `Published ${formatDay(editing.publishedAt)}` : 'Publishes to the website blog straight away.'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={editing ? 'Save changes' : 'Publish'}
      saving={saving || uploading}
      savingLabel={uploading ? 'Uploading image…' : 'Saving…'}
    >
      <Field label="Title" htmlFor="bl-title" required error={errors.title}>
        <Input id="bl-title" value={f.title} onChange={set('title')} invalid={!!errors.title} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address" htmlFor="bl-slug" required error={errors.slug} hint={editing ? 'Changing it breaks links people already shared.' : undefined}>
          <div className="flex items-center rounded-lg border border-zinc-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
            <span className="pl-3 text-table text-zinc-400">/blog/</span>
            <input
              id="bl-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setF((x) => ({ ...x, slug: slugify(e.target.value) }));
                setErrors((x) => ({ ...x, slug: undefined }));
              }}
              aria-invalid={!!errors.slug || undefined}
              className="h-9 min-w-0 flex-1 rounded-r-lg bg-transparent px-1 font-mono text-table text-zinc-900 focus:outline-none"
            />
          </div>
        </Field>
        <Field label="Category" htmlFor="bl-category" error={errors.category}>
          <Input id="bl-category" list="bl-categories" value={f.category} onChange={set('category')} invalid={!!errors.category} />
          <datalist id="bl-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field label="Summary" htmlFor="bl-excerpt" required error={errors.excerpt} hint={`${f.excerpt.length}/500 · shown on the blog list and in search results`}>
        <textarea id="bl-excerpt" rows={2} value={f.excerpt} onChange={set('excerpt')} className={`${TEXTAREA} ${errors.excerpt ? 'border-rose-400' : 'border-zinc-200'}`} />
      </Field>
      <Field label="Article" htmlFor="bl-content" required error={errors.content} hint={`${words} word${words === 1 ? '' : 's'}`}>
        <textarea id="bl-content" rows={12} value={f.content} onChange={set('content')} className={`${TEXTAREA} font-[inherit] ${errors.content ? 'border-rose-400' : 'border-zinc-200'}`} />
      </Field>
      <ImageField label="Cover image" value={f.imageUrl === DEFAULT_IMAGE ? '' : f.imageUrl} onChange={(url) => setF((x) => ({ ...x, imageUrl: url || DEFAULT_IMAGE }))} onUploading={setUploading} hint="Without one, the standard blog image is used." />
    </FormDialog>
  );
}
