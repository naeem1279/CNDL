'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Copy, Inbox, Mail, MessageSquare, PhoneCall, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import { SidePanel } from '../_components/SidePanel';
import type { Kpi } from '../_components/StatTile';
import { Badge, Button, EmptyState, Input, buttonClass } from '../_components/ui';
import { MESSAGES_PER_PAGE } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { Message } from '../_lib/types';
import { extractWaPhone, formatDate, formatDay } from '../_lib/utils';

type Filter = 'all' | 'week' | 'callback';
const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');
const DAY = 86400000;

/** The price form's "call me back" requests carry a placeholder address, not a real inbox. */
const isCallback = (m: Message) => /^callback\+\d*@cndl-global\.com$/i.test(m.email);

/** "just now", "5m ago", "3h ago", "2d ago", then the date. */
function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  if (mins < 7 * 1440) return `${Math.round(mins / 1440)}d ago`;
  return formatDay(iso);
}

export default function MessagesPage() {
  const { me, adminFetch } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['data'], me.role);
      if (!r) return;
      if (r.messages) setMessages(r.messages);
      setLastSyncedAt(Date.now());
    } catch {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [query, filter]);

  const weekAgo = Date.now() - 7 * DAY;
  const inWeek = (m: Message) => new Date(m.createdAt).getTime() >= weekAgo;
  const callbacks = messages.filter(isCallback);
  const reachable = messages.filter((m) => extractWaPhone(m));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return messages.filter((m) => {
      if (filter === 'week' && !inWeek(m)) return false;
      if (filter === 'callback' && !isCallback(m)) return false;
      if (!q) return true;
      const text = [m.name, isCallback(m) ? '' : m.email, m.subject, m.message].some((v) => (v || '').toLowerCase().includes(q));
      const phone = qDigits.length >= 3 && (extractWaPhone(m) || '').includes(qDigits);
      return text || phone;
    });
  }, [messages, query, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(filtered.length / MESSAGES_PER_PAGE));
  const curPage = Math.min(page, pages);
  const rows = filtered.slice((curPage - 1) * MESSAGES_PER_PAGE, curPage * MESSAGES_PER_PAGE);

  const kpis: Kpi[] = [
    { label: 'This week', value: String(messages.filter(inWeek).length), icon: CalendarDays, sub: 'Last 7 days' },
    { label: 'Last 30 days', value: String(messages.filter((m) => new Date(m.createdAt).getTime() >= Date.now() - 30 * DAY).length), icon: Mail, sub: `${messages.length} in total` },
    { label: 'Call-back requests', value: String(callbacks.length), icon: PhoneCall, sub: 'From the price form' },
    { label: 'Reachable by phone', value: String(reachable.length), icon: MessageSquare, sub: 'Call or WhatsApp' },
  ];

  const open = openId ? messages.find((m) => m.id === openId) : undefined;
  const contactLine = (m: Message) => {
    const wa = extractWaPhone(m);
    if (isCallback(m)) return wa ? `+${wa}` : 'No phone given';
    return m.email;
  };

  const chip = (on: boolean) =>
    cx('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-table font-medium transition-colors', on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');
  const chips: { key: Filter; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: messages.length },
    { key: 'week', label: 'This week', n: messages.filter(inWeek).length },
    { key: 'callback', label: 'Call-back requests', n: callbacks.length },
  ];

  const copyEmail = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <SectionFrame tab="messages" kpis={kpis} loading={loading} refreshing={refreshing} lastSyncedAt={lastSyncedAt} onRefresh={() => fetchData(true)}>
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="space-y-2 border-b border-zinc-100 p-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone or message" aria-label="Search inquiries" className="pl-9" />
          </div>
          <div role="radiogroup" aria-label="Filter inquiries" className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            {chips.map((c) => (
              <button key={c.key} type="button" role="radio" aria-checked={filter === c.key} onClick={() => setFilter(c.key)} className={chip(filter === c.key)}>
                {c.label}
                <span className={cx('tabular-nums', filter === c.key ? 'text-zinc-300' : 'text-zinc-400')}>{c.n}</span>
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={messages.length ? 'No inquiries match' : 'No inquiries yet'}>
            {messages.length ? 'Try another search or filter.' : 'Messages from the website contact and price forms appear here.'}
          </EmptyState>
        ) : (
          <>
            <table className="hidden w-full table-fixed text-left md:table">
              <thead>
                <tr className="border-b border-zinc-200 text-meta text-zinc-500">
                  <th className="w-[260px] px-4 py-2.5 font-medium">From</th>
                  <th className="px-3 py-2.5 font-medium">Message</th>
                  <th className="w-[110px] px-3 py-2.5 text-right font-medium">Received</th>
                  <th className="w-10 py-2.5" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((m) => (
                  <tr key={m.id} onClick={() => setOpenId(m.id)} className="group cursor-pointer hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(m.id);
                        }}
                        className="block max-w-full truncate text-left text-body font-medium text-zinc-900 hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {m.name}
                      </button>
                      <p className="truncate text-meta text-zinc-500" title={contactLine(m)}>
                        {contactLine(m)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="truncate text-table text-zinc-800">
                        {isCallback(m) && <Badge tone="brand" className="mr-1.5">Call back</Badge>}
                        {m.subject ? <span className="font-medium">{m.subject} · </span> : null}
                        <span className="text-zinc-500">{m.message}</span>
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right text-meta text-zinc-500 tabular-nums" title={formatDate(m.createdAt)}>
                      {ago(m.createdAt)}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <ChevronRight size={16} className="inline text-zinc-300 group-hover:text-zinc-500" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-zinc-100 md:hidden">
              {rows.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setOpenId(m.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-body font-medium text-zinc-900">{m.name}</span>
                        <span className="shrink-0 text-meta text-zinc-400">{ago(m.createdAt)}</span>
                      </p>
                      <p className="line-clamp-2 text-meta text-zinc-500">
                        {isCallback(m) ? 'Call-back request · ' : m.subject ? `${m.subject} · ` : ''}
                        {m.message}
                      </p>
                    </div>
                    <ChevronRight size={16} className="mt-1 shrink-0 text-zinc-300" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="px-4 pb-4">
          <Pager page={curPage} total={filtered.length} perPage={MESSAGES_PER_PAGE} onPage={setPage} noun={filtered.length === 1 ? 'inquiry' : 'inquiries'} />
        </div>
      </div>

      {open && (
        <SidePanel
          key={open.id}
          title={open.name}
          subtitle={`${isCallback(open) ? 'Call-back request · ' : ''}${formatDate(open.createdAt)}`}
          onClose={() => setOpenId(null)}
        >
          <section className="border-b border-zinc-100 pb-4">
            {open.subject && <h3 className="mb-2 text-title font-semibold text-zinc-900 [overflow-wrap:anywhere]">{open.subject}</h3>}
            <p className="whitespace-pre-wrap text-body text-zinc-800 [overflow-wrap:anywhere]">{open.message}</p>
          </section>
          <section className="pt-4">
            <h3 className="mb-2 text-meta font-medium text-zinc-500">Reply</h3>
            {(() => {
              const wa = extractWaPhone(open);
              const greeting = `Hello ${open.name}, this is CNDL Dental Lab regarding your inquiry.`;
              return (
                <>
                  <dl className="mb-3 space-y-1 text-table">
                    {!isCallback(open) && (
                      <div className="flex gap-2">
                        <dt className="w-14 shrink-0 text-zinc-500">Email</dt>
                        <dd className="min-w-0 text-zinc-800 [overflow-wrap:anywhere]">{open.email}</dd>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <dt className="w-14 shrink-0 text-zinc-500">Phone</dt>
                      <dd className="text-zinc-800 tabular-nums">{wa ? `+${wa}` : <span className="text-zinc-400">Not given</span>}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {wa && (
                      <>
                        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(greeting)}`} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'sm')}>
                          <MessageSquare size={14} /> WhatsApp
                        </a>
                        <a href={`tel:+${wa}`} className={buttonClass('secondary', 'sm')}>
                          <PhoneCall size={14} /> Call
                        </a>
                      </>
                    )}
                    {!isCallback(open) && (
                      <>
                        <a
                          href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || 'Your inquiry to CNDL Global'}`)}`}
                          className={buttonClass(wa ? 'secondary' : 'primary', 'sm')}
                        >
                          <Mail size={14} /> Reply by email
                        </a>
                        <Button size="sm" variant="ghost" icon={copied ? Check : Copy} onClick={() => void copyEmail(open)}>
                          {copied ? 'Copied' : 'Copy email'}
                        </Button>
                      </>
                    )}
                  </div>
                  {isCallback(open) && !wa && <p className="mt-2 text-meta text-zinc-500">This request has no usable phone number.</p>}
                </>
              );
            })()}
          </section>
        </SidePanel>
      )}
    </SectionFrame>
  );
}
