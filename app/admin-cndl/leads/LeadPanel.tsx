'use client';
import Link from 'next/link';
import { ChevronDown, ExternalLink, Globe, Mail, MapPin, MessageSquare, Phone, Stethoscope, UserPlus } from 'lucide-react';
import { SidePanel } from '../_components/SidePanel';
import { Badge, Button, buttonClass } from '../_components/ui';
import { LEAD_STAGES, LEAD_STAGE_LABEL, leadStage, type LeadStage } from '../_lib/constants';
import type { ErpAccount, LeadRow } from '../_lib/types';
import { phoneCore, phoneLinks } from '../_lib/utils';

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

/** The lead engine writes Bengali status prefixes into the log; show them as
    English stage moves. Note text itself is left exactly as typed. */
export function activityText(t: string): string {
  return t
    .replace(/স্ট্যাটস:\s*([a-z_]+)/g, (_, k: string) => `Moved to ${LEAD_STAGE_LABEL[k] ?? k}`)
    .replace(/^ভিজিট নোট:\s*/, 'Note: ')
    .replace(/^নোট আপডেট$/, 'Note cleared');
}

/** "just now", "5m ago", "3h ago", "2d ago", then "11 Nov" (with year if not this year). */
export function relTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)}d ago`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

export const fullTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export const hasUsablePhone = (l: LeadRow) => phoneCore(l.phone).length >= 6;

/** Compact native stage picker (keyboard and touch friendly) with the stage dot. */
export function StageSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (s: LeadStage) => void;
  disabled?: boolean;
  label: string;
}) {
  const stage = leadStage(value);
  const dot = LEAD_STAGES.find((s) => s.key === stage)?.dot;
  return (
    <span className="relative inline-flex">
      <span aria-hidden="true" className={cx('pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full', dot)} />
      <select
        aria-label={label}
        value={stage}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value as LeadStage)}
        className="h-8 appearance-none rounded-md border border-zinc-200 bg-white pl-6 pr-7 text-table font-medium text-zinc-800 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
      >
        {LEAD_STAGES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-zinc-100 py-4 first:pt-0 last:border-0 last:pb-0">
      <h3 className="mb-2.5 text-meta font-medium text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

function InfoRow({ icon: I, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-1 text-body text-zinc-700">
      <I size={15} className="mt-[3px] shrink-0 text-zinc-400" />
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

export function LeadPanel({
  lead,
  account,
  saving,
  converting,
  draft,
  onDraft,
  onStage,
  onConvert,
  onSaveNote,
  onClose,
}: {
  lead: LeadRow;
  account?: ErpAccount;
  saving: boolean;
  converting: boolean;
  /** Unsaved note text for this lead (kept by the page, so closing never loses it). */
  draft: string;
  onDraft: (text: string) => void;
  onStage: (s: LeadStage) => void;
  onConvert: () => void;
  onSaveNote: () => void;
  onClose: () => void;
}) {
  const stage = leadStage(lead.status);
  const links = phoneLinks(lead.phone);
  const noteDirty = draft.trim() !== (lead.visitNotes || '').trim();
  const log = [...(lead.activityLog || [])].reverse();
  const where = lead.area || lead.address;

  return (
    <SidePanel
      title={lead.name || 'Unnamed chamber'}
      subtitle={[lead.contactName, lead.area].filter(Boolean).join(' · ') || undefined}
      onClose={onClose}
    >
      <Section title="Stage">
        <div role="radiogroup" aria-label="Lead stage" className="grid grid-cols-2 gap-1.5">
          {LEAD_STAGES.map((s) => {
            const on = stage === s.key;
            return (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={saving}
                onClick={() => !on && onStage(s.key)}
                className={cx(
                  'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-table font-medium transition-colors disabled:opacity-60',
                  on ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                )}
              >
                <span className={cx('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden="true" />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Contact">
        {lead.contactName && <InfoRow icon={Stethoscope}>{lead.contactName}</InfoRow>}
        {lead.phone ? (
          <InfoRow icon={Phone}>
            <span className="font-mono text-table tabular-nums">{lead.phone}</span>
          </InfoRow>
        ) : (
          <InfoRow icon={Phone}>
            <span className="text-zinc-400">No phone number</span>
          </InfoRow>
        )}
        {where && <InfoRow icon={MapPin}>{lead.address && lead.area && lead.address !== lead.area ? `${lead.address}, ${lead.area}` : where}</InfoRow>}
        {lead.email && (
          <InfoRow icon={Mail}>
            <a href={`mailto:${lead.email}`} className="text-brand-700 hover:underline">{lead.email}</a>
          </InfoRow>
        )}
        {(lead.facebook || lead.website) && (
          <InfoRow icon={Globe}>
            <span className="flex flex-wrap gap-x-3">
              {lead.facebook && (
                <a href={lead.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                  Facebook <ExternalLink size={12} />
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                  Website <ExternalLink size={12} />
                </a>
              )}
            </span>
          </InfoRow>
        )}
        {links && (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <a href={`tel:${links.tel.replace(/[^\d+]/g, '')}`} className={buttonClass('secondary', 'sm')}>
              <Phone size={14} /> Call
            </a>
            <a href={`https://wa.me/${links.wa}`} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'sm')}>
              <MessageSquare size={14} /> WhatsApp
            </a>
          </div>
        )}
      </Section>

      <Section title="Client Dues">
        {account ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Badge tone="success">In Client Dues</Badge>
              <p className="mt-1 truncate text-body text-zinc-700">{account.name}</p>
            </div>
            <Link href="/admin-cndl/dues" className={buttonClass('secondary', 'sm', 'shrink-0')}>
              Open
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-table text-zinc-500">
              {hasUsablePhone(lead)
                ? 'Adds this chamber to Client Dues with a zero opening balance and marks the lead as Client.'
                : 'Add a phone number in the lead engine before this chamber can be billed.'}
            </p>
            <Button variant="primary" size="sm" icon={UserPlus} onClick={onConvert} disabled={converting || saving || !hasUsablePhone(lead)}>
              {converting ? 'Adding…' : 'Add to Client Dues'}
            </Button>
          </div>
        )}
      </Section>

      <Section title="Visit note">
        <label htmlFor="lead-note" className="sr-only">Visit note</label>
        <textarea
          id="lead-note"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Who you met, sample given, prices discussed, next follow-up…"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-body text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-meta text-zinc-400 tabular-nums">
            {noteDirty ? 'Unsaved changes · ' : ''}
            {draft.length}/1000
          </span>
          <div className="flex gap-2">
            {noteDirty && (
              <Button size="sm" variant="ghost" onClick={() => onDraft(lead.visitNotes || '')} disabled={saving}>
                Reset
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={onSaveNote} disabled={!noteDirty || saving}>
              {saving ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        </div>
      </Section>

      <Section title={`Activity${log.length ? ` · ${log.length}` : ''}`}>
        {log.length === 0 ? (
          <p className="text-table text-zinc-400">No activity yet.</p>
        ) : (
          <ol className="space-y-2.5">
            {log.map((a, i) => (
              <li key={`${a.at}-${i}`} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                <div className="min-w-0 flex-1">
                  <p className="text-table text-zinc-700 [overflow-wrap:anywhere]">{activityText(a.text)}</p>
                  <p className="text-meta text-zinc-400" title={fullTime(a.at)}>{relTime(a.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </SidePanel>
  );
}
