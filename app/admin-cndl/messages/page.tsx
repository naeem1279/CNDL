'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Clock, Copy, Eye, Mail, MessageSquare, Reply, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModalShell } from '../_components/ModalShell';
import { Pager } from '../_components/Pager';
import { SectionFrame } from '../_components/SectionFrame';
import type { Kpi } from '../_components/StatTile';
import { MESSAGES_PER_PAGE } from '../_lib/constants';
import { loadResources } from '../_lib/resources';
import { useAdmin } from '../_lib/session';
import type { BlogRow, Message, Order, ReviewRow, ServiceRow } from '../_lib/types';
import { extractWaPhone, formatDate } from '../_lib/utils';

export default function MessagesPage() {
  const { me, adminFetch } = useAdmin();

  const [data, setData] = useState<{ orders: Order[]; messages: Message[]; blogs: BlogRow[]; reviews: ReviewRow[]; services: ServiceRow[] }>({ orders: [], messages: [], blogs: [], reviews: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setCopiedId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Messages search/pagination
  const [msgSearch, setMsgSearch] = useState('');
  const [msgPage, setMsgPage] = useState(1);
  const [msgModal, setMsgModal] = useState<Message | null>(null);

  // Header "Synced" timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  /** Loads only this section's feeds: data. */
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await loadResources(adminFetch, ['data'], me.role);
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

  const copyText = async (id: string, text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (what === 'Case ID') setCopiedId(id);
      else setCopiedEmail(id);
      toast.success(`${what} copied`);
      setTimeout(() => {
        setCopiedId(null);
        setCopiedEmail(null);
      }, 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  useEffect(() => {
    setMsgPage(1);
  }, [msgSearch]);

  const { safeMsgPage, pagedMessages, msgFilteredCount } = useMemo(() => {
    const sq = msgSearch.trim().toLowerCase();
    const filtered = data.messages.filter((m) => {
      if (!m) return false;
      const haystack = `${m.name} ${m.email} ${m.subject ?? ''} ${m.message}`.toLowerCase();
      return !sq || haystack.includes(sq);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / MESSAGES_PER_PAGE));
    const p = Math.min(msgPage, totalPages);
    return {
      msgTotalPages: totalPages,
      safeMsgPage: p,
      pagedMessages: filtered.slice((p - 1) * MESSAGES_PER_PAGE, p * MESSAGES_PER_PAGE),
      msgFilteredCount: filtered.length,
    };
  }, [data.messages, msgSearch, msgPage]);
  const messageCount = data.messages.length;
  const { msgThisWeek, msgThisMonth } = useMemo(() => ({ msgThisWeek: data.messages.filter((m) => new Date(m.createdAt).getTime() >= Date.now() - 7 * 86400000).length, msgThisMonth: data.messages.filter((m) => new Date(m.createdAt).getTime() >= Date.now() - 30 * 86400000).length }), [data.messages]);

  useEffect(() => {
    void fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards: Kpi[] = [
      { label: 'Total Inquiries', value: messageCount, icon: MessageSquare, bg: 'bg-emerald-600/15', fg: 'text-emerald-700' },
      { label: 'New This Week', value: msgThisWeek, icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-600' },
      { label: 'Last 30 Days', value: msgThisMonth, icon: Mail, bg: 'bg-teal-50', fg: 'text-teal-700' },
  ];

  return (
    <>
      <SectionFrame
        tab="messages"
        kpis={kpiCards}
        loading={loading}
        refreshing={refreshing}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => fetchData(true)}
      >
        {(
          /* ================= TAB 2: MESSAGES ================= */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-none p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-2xl font-semibold">Client Inquiries</h2>
              <div className="relative w-full lg:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                  placeholder="Search sender, email, subject or message..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-700/20 bg-white"
                />
              </div>
            </div>

            {msgFilteredCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 mb-4">
                  <MessageSquare size={28} />
                </span>
                <p className="text-sm font-bold text-gray-500">{msgSearch ? 'No messages match your search' : 'No messages yet'}</p>
                <p className="text-xs text-slate-500 mt-1">Contact form inquiries will appear here.</p>
              </div>
            ) : (
              <>
                {/* Desktop: compact data table */}
                <div className="hidden md:block overflow-x-auto rounded-xl">
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pr-4">Date / Time</th>
                        <th className="pb-3 pr-4">Sender</th>
                        <th className="pb-3 pr-4">Contact</th>
                        <th className="pb-3 pr-4">Subject</th>
                        <th className="pb-3 pr-4">Message Preview</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedMessages.map((msg) => {
                        const wa = extractWaPhone(msg);
                        return (
                          <tr key={msg.id} className="align-top hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 pr-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(msg.createdAt)}</td>
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-700 font-semibold text-xs flex items-center justify-center shrink-0">
                                  {msg.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="font-bold text-sm max-w-[160px] truncate" title={msg.name}>{msg.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4">
                              <a href={`mailto:${msg.email}`} className="text-xs font-semibold text-teal-700 hover:underline block max-w-[200px] truncate" title={msg.email}>
                                {msg.email}
                              </a>
                              {wa && <a href={`tel:+${wa}`} className="text-xs text-gray-500 hover:text-teal-700 block mt-0.5">+{wa}</a>}
                            </td>
                            <td className="py-3.5 pr-4">
                              {msg.subject ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-600/15 text-emerald-700 px-3 py-1 text-[11px] font-bold max-w-[180px] truncate" title={msg.subject}>
                                  {msg.subject}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 max-w-[280px]">{msg.message}</p>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setMsgModal(msg)}
                                className="min-h-[38px] px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-teal-700 hover:border-teal-700/20 hover:bg-teal-700/5 transition-colors"
                              >
                                <Eye size={14} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: compact inquiry rows */}
                <div className="md:hidden divide-y divide-slate-100">
                  {pagedMessages.map((msg) => (
                    <button key={msg.id} onClick={() => setMsgModal(msg)} className="w-full text-left py-4 flex items-start gap-3">
                      <span className="w-9 h-9 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center shrink-0 text-xs">
                        {msg.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm truncate">{msg.name}</span>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                        </span>
                        {msg.subject && <span className="block text-xs font-bold text-emerald-700 truncate mt-0.5">{msg.subject}</span>}
                        <span className="block text-xs text-gray-500 line-clamp-1 mt-0.5">{msg.message}</span>
                      </span>
                      <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}

            <Pager
              page={safeMsgPage}
              total={msgFilteredCount}
              perPage={MESSAGES_PER_PAGE}
              onPage={setMsgPage}
              noun={msgFilteredCount === 1 ? 'message' : 'messages'}
            />
          </div>
        )}
      </SectionFrame>

      {msgModal && (() => {
        const wa = extractWaPhone(msgModal);
        return (
          <ModalShell onClose={() => setMsgModal(null)}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={() => setMsgModal(null)}
          >
            <aside
              className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              aria-label="Full inquiry message"
            >
              {/* Drawer header */}
              <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Client Inquiry</p>
                  <h3 className="text-base sm:text-lg font-semibold text-teal-700 truncate mt-0.5">
                    {msgModal.subject || 'General Inquiry'}
                  </h3>
                </div>
                <button
                  onClick={() => setMsgModal(null)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-teal-700/10 text-teal-700 font-semibold flex items-center justify-center text-lg shrink-0">
                    {msgModal.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{msgModal.name}</p>
                    <a href={`mailto:${msgModal.email}`} className="text-xs text-teal-700 hover:underline block truncate">
                      {msgModal.email}
                    </a>
                    {wa && (
                      <a href={`tel:+${wa}`} className="text-xs text-gray-500 hover:text-teal-700">
                        +{wa}
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium">Received {formatDate(msgModal.createdAt)}</p>

                <div className="bg-slate-50 rounded-2xl p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {msgModal.message}
                </div>
              </div>

              {/* Drawer footer actions */}
              <div className="shrink-0 border-t border-slate-200 px-6 py-4 pb-6 sm:pb-4 flex items-center gap-2.5">
                <a
                  href={`mailto:${msgModal.email}?subject=${encodeURIComponent(`Re: ${msgModal.subject || 'Your inquiry to CNDL Global'}`)}`}
                  className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 text-white text-xs font-bold px-4 hover:bg-teal-800 transition-colors"
                >
                  <Reply size={14} /> Reply via Email
                </a>
                <a
                  href={
                    wa
                      ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${msgModal.name}, this is CNDL Dental Lab regarding your inquiry.`)}`
                      : `https://wa.me/?text=${encodeURIComponent(`Hello ${msgModal.name}, this is CNDL Dental Lab regarding your inquiry.`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  title={wa ? 'WhatsApp the sender' : 'Open WhatsApp (choose recipient)'}
                  className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1fbd59] transition-colors"
                >
                  <svg viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.72 6.4L3.2 28.8l6.56-1.68a12.74 12.74 0 0 0 6.24 1.6h.004c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8Zm0 23.47h-.004a10.63 10.63 0 0 1-5.42-1.48l-.388-.23-4.03 1.032 1.076-3.93-.254-.404a10.58 10.58 0 0 1-1.624-5.658c0-5.866 4.776-10.638 10.648-10.638 2.842 0 5.512 1.108 7.52 3.118a10.56 10.56 0 0 1 3.114 7.526c-.004 5.868-4.778 10.664-10.638 10.664Zm5.838-7.976c-.32-.16-1.892-.934-2.184-1.04-.292-.108-.506-.162-.718.16-.212.32-.824 1.04-1.01 1.252-.186.212-.372.238-.692.08-.32-.16-1.35-.498-2.57-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.494.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.212.052-.398-.028-.558-.08-.16-.718-1.73-.984-2.37-.26-.622-.522-.538-.718-.548l-.612-.01c-.212 0-.558.08-.85.398-.292.32-1.114 1.088-1.114 2.654s1.14 3.078 1.3 3.29c.16.212 2.244 3.426 5.436 4.804.76.328 1.352.524 1.814.67.762.242 1.456.208 2.004.126.612-.09 1.892-.772 2.158-1.52.266-.748.266-1.388.186-1.522-.08-.134-.292-.212-.612-.372Z" />
                  </svg>
                  WhatsApp
                </a>
                <button
                  onClick={() => copyText(msgModal.id, msgModal.email, 'Email')}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 text-gray-500 hover:bg-slate-50 transition-colors"
                  title="Copy email address"
                >
                  {copiedEmail === msgModal.id ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
              </div>
            </aside>
          </ModalShell>
        );
      })()}

      {/* Add Case Invoice Modal */}
    </>
  );
}
