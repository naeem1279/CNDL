'use client';

import { useLanguage } from '@/context/LanguageContext';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Menu, Search, X, Phone, MapPin, Clock4,
  FileText, ScanSearch, Loader2, MessageCircle, Check,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

import Image from 'next/image';
import { toast } from 'sonner';

type BlogHit = { title: string; slug: string; category: string };

const WHATSAPP_URL = 'https://wa.me/8801743167963';
const LAB_PHONE_DISPLAY = '+880 1743-167963';
const LAB_PHONE_TEL = 'tel:+8801743167963';

/** Service options for the pricing/quote enquiry */
const PRICING_SERVICES = [
  'Zirconia Crown/Bridge',
  'E-Max',
  'PFM',
  'Flexible Denture',
  'Clear Aligner',
  'Other',
];

// Bilingual dictionary is now imported from @/context/LanguageContext

export default function NavBer() {
  const [isOpen, setIsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { lang, setLang, t: globalT } = useLanguage();
  const t = {
    ...globalT.nav,
    nav: globalT.nav,
  };

  // Pricing / quotation enquiry form
  const [priceForm, setPriceForm] = useState({ name: '', phone: '', service: '', note: '' });
  const [callbackState, setCallbackState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const priceWhatsApp = async () => {
    const msg =
      `Hello CNDL Global, I would like a service price quotation.\n` +
      `Name: ${priceForm.name || '-'}\n` +
      `Phone/WhatsApp: ${priceForm.phone || '-'}\n` +
      `Service of Interest: ${priceForm.service || '-'}\n` +
      `Note: ${priceForm.note || '-'}`;
    // U7 (2026-11-05): capture WhatsApp-route pricing leads in the DB too —
    // best-effort only; the WhatsApp handoff must never be blocked by it.
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: priceForm.name.trim() || 'Pricing enquiry (WhatsApp route)',
          email: `pricing+${priceForm.phone.replace(/[^\d]/g, '') || 'unknown'}@cndl-global.com`,
          subject: `Get Pricing — ${priceForm.service || 'General'}`,
          message:
            `WhatsApp pricing enquiry.\n` +
            `Phone/WhatsApp: ${priceForm.phone || '-'}\n` +
            `Service of Interest: ${priceForm.service || '-'}\n` +
            `Note: ${priceForm.note || '-'}`,
        }),
      });
    } catch {
      // capture is best-effort — fall through to WhatsApp
    }
    window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  const requestCallBack = async () => {
    if (!priceForm.name.trim() || !priceForm.phone.trim()) {
      toast.error('Please enter your name and phone number');
      return;
    }
    setCallbackState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: priceForm.name.trim(),
          email: `callback+${priceForm.phone.replace(/[^\d]/g, '')}@cndl-global.com`,
          subject: `Call Back Request — ${priceForm.service || 'General Pricing'}`,
          message:
            `Requesting a call back for service pricing.\n` +
            `Phone/WhatsApp: ${priceForm.phone}\n` +
            `Service of Interest: ${priceForm.service || '-'}\n` +
            `Note: ${priceForm.note || '-'}`,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setCallbackState('sent');
      toast.success('Call back requested — our lab specialists will phone you shortly.');
    } catch {
      setCallbackState('idle');
      toast.error(`Could not submit — please call us directly at ${LAB_PHONE_DISPLAY}.`);
    }
  };

  // Quick search
  const [searchQ, setSearchQ] = useState('');
  const [hits, setHits] = useState<BlogHit[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setIsOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Search dialog data (blog topics; empty q returns latest posts as suggestions)
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ.trim())}`);
        const data = await res.json();
        setHits(Array.isArray(data.blogs) ? data.blogs : []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQ, searchOpen]);

  // Close search dialog on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const openSearch = () => {
    setSearchOpen(true);
    setSearchQ('');
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const looksLikeCaseId = /^[a-z0-9-]{4,}$/i.test(searchQ.trim()) && searchQ.trim().length >= 4;

  const pathname = usePathname();
  // Bengali nav labels are longer: keep the inline menu for 1280px and up only.
  const wideLabels = lang === 'bn';
  const navMenu = [
    { key: 'home' as const, href: '/' },
    { key: 'about' as const, href: '/about' },
    { key: 'products' as const, href: '/products' },
    { key: 'technology' as const, href: '/technology' },
    { key: 'tracker' as const, href: '/case-tracker' },
    { key: 'contact' as const, href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-[60]">
      {/* Info bar: contact details, quiet slate. Phones show the main number only. */}
      <div className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
        <div className="container flex h-10 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <a href="tel:+8801743167963" className="inline-flex h-10 items-center gap-1.5 hover:text-slate-900">
              <Phone size={14} aria-hidden="true" />
              01743-167963
            </a>
            <a href="tel:+8801805976351" className="hidden h-10 items-center gap-1.5 hover:text-slate-900 lg:inline-flex">
              <Phone size={14} aria-hidden="true" />
              01805-976351
            </a>
            <span className="hidden items-center gap-1.5 truncate md:inline-flex">
              <MapPin size={14} aria-hidden="true" />
              419/1/C Khilgaon, Dhaka-1219
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
            <Clock4 size={14} aria-hidden="true" />
            {t.topbarHours}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Main">
          <Link href="/" className="inline-flex h-11 shrink-0 items-center" aria-label="CNDL Global home">
            <Image src="/icon/Logo_footer.svg" alt="CNDL" width={162} height={52} priority className="h-9 w-auto sm:h-10" />
          </Link>

          <div className={`hidden items-center gap-0.5 xl:gap-1 ${wideLabels ? "xl:flex" : "lg:flex"}`}>
            {navMenu.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex h-10 items-center whitespace-nowrap rounded-full px-2.5 text-sm font-medium transition-colors xl:px-3.5 ${
                    active ? 'bg-[#1977C5]/10 text-[#1668AD]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {t.nav[item.key]}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-slate-700">
            <button
              onClick={openSearch}
              aria-label="Search cases and articles"
              title="Search / খুঁজুন"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-900"
            >
              <Search size={20} />
            </button>

            {/* Language: always visible, two-state toggle. The choice is saved (LanguageContext). */}
            <div
              role="group"
              aria-label="Language / ভাষা"
              className="flex h-11 items-center rounded-full border border-slate-200 bg-slate-50/80 p-0.5"
            >
              {(
                [
                  ['en', 'EN', 'English'],
                  ['bn', 'বাং', 'বাংলা'],
                ] as const
              ).map(([code, label, name]) => {
                const on = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={on}
                    aria-label={name}
                    lang={code === 'bn' ? 'bn' : 'en'}
                    // "বাং" uses the device's own font so this one label does not make English
                    // pages download Noto Sans Bengali (app/layout.tsx); Bengali pages load it anyway.
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ${
                      code === 'bn' ? 'font-[system-ui,sans-serif]' : ''
                    } ${
                      on ? 'bg-[#1977C5] text-white shadow-sm shadow-[#1977C5]/30' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <span className={`ml-1 hidden xl:ml-2 ${wideLabels ? "xl:block" : "lg:block"}`}>
              <Button onClick={() => setPricingOpen(true)}>
              {t.pricing}
              <ArrowRight size={16} aria-hidden="true" className="hidden xl:block" />
            </Button>
            </span>

            <button
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 ${wideLabels ? "xl:hidden" : "lg:hidden"}`}
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              aria-expanded={isOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </div>

      {/* Phone menu: slide-in panel. */}
      <div
        className={`fixed inset-0 bg-slate-900/40 transition-opacity duration-300 ${wideLabels ? 'xl:hidden' : 'lg:hidden'} ` + (isOpen ? 'visible opacity-100' : 'invisible opacity-0')}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={
          `fixed right-0 top-0 flex h-full w-[min(320px,85vw)] flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out ${wideLabels ? 'xl:hidden' : 'lg:hidden'} ` +
          (isOpen ? 'translate-x-0' : 'invisible translate-x-full')
        }
        aria-label="Menu"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Image src="/icon/Logo_footer.svg" alt="CNDL" width={162} height={52} className="h-9 w-auto" />
          <button onClick={() => setIsOpen(false)} aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100">
            <X size={22} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navMenu.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-12 items-center rounded-lg px-3 text-base font-medium ${active ? 'bg-[#1977C5]/10 text-[#1668AD]' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {t.nav[item.key]}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-slate-200 p-4">
          <Button
            onClick={() => {
              setIsOpen(false);
              setPricingOpen(true);
            }}
            size="lg"
            className="w-full"
          >
            {t.pricing}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </aside>

      {/* ================= PRICING / SERVICE QUOTE MODAL ================= */}
      {pricingOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={() => setPricingOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_30px_90px_-20px_rgba(2,32,71,0.55)] p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <span className="text-xs md:text-xs font-semibold uppercase tracking-widest text-[#1977C5]">
                  Service Quote
                </span>
                <h3 className="text-lg md:text-2xl font-semibold secondary leading-tight mt-1">
                  Get Service Pricing &amp; Quotation
                </h3>
              </div>
              <button onClick={() => setPricingOpen(false)} aria-label="Close" className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs md:text-sm text-slate-500 mb-5">
              Tell us what you need and our lab specialists will assist you directly via Phone or
              WhatsApp.
            </p>

            <div className="space-y-3.5">
              <label className="block">
                <span className="text-xs md:text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                  Your Name <span className="normal-case font-medium text-slate-400">(ডাক্তার / ক্লিনিক / রোগীর নাম)</span>
                </span>
                <input
                  type="text"
                  value={priceForm.name}
                  onChange={(e) => setPriceForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Dr. Ayesha Rahman / Bright Smile Dental Care"
                  className="w-full h-11 px-4 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all"
                />
              </label>

              <label className="block">
                <span className="text-xs md:text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                  Phone Number / WhatsApp
                </span>
                <input
                  type="tel"
                  value={priceForm.phone}
                  onChange={(e) => setPriceForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full h-11 px-4 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all"
                />
              </label>

              <label className="block">
                <span className="text-xs md:text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                  Service of Interest
                </span>
                <select
                  value={priceForm.service}
                  onChange={(e) => setPriceForm((p) => ({ ...p, service: e.target.value }))}
                  className="w-full h-11 px-3 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all cursor-pointer"
                >
                  <option value="">Select a service…</option>
                  {PRICING_SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs md:text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">
                  Short Note / Requirements
                </span>
                <textarea
                  value={priceForm.note}
                  onChange={(e) => setPriceForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="e.g., 3-unit zirconia bridge, shades attached, needed before Eid…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1977C5] focus:ring-2 focus:ring-[#1977C5]/20 transition-all resize-none"
                />
              </label>
            </div>

            <button
              onClick={priceWhatsApp}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#128C7E] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0F7A6D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]/40 focus-visible:ring-offset-2"
            >
              <MessageCircle size={16} />
              Inquire via WhatsApp
              <ArrowRight size={15} />
            </button>

            <button
              onClick={requestCallBack}
              disabled={callbackState === 'sending' || callbackState === 'sent'}
              className="mt-2.5 w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 px-6 py-3.5 text-xs md:text-sm font-semibold text-slate-700 hover:border-[#1977C5]/50 hover:text-[#1977C5] transition-all min-h-[48px] disabled:opacity-60 cursor-pointer"
            >
              {callbackState === 'sending' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting…
                </>
              ) : callbackState === 'sent' ? (
                <>
                  <Check size={16} />
                  Call Back Requested
                </>
              ) : (
                <>
                  <Phone size={16} />
                  Request Call Back
                </>
              )}
            </button>

            <p className="mt-3.5 text-center text-xs md:text-xs text-slate-400">
              Your details go straight to our lab specialists — never shared or published.
            </p>

            <div className="mt-4 rounded-xl border border-[#1977C5]/20 bg-[#EAF2FA]/80 px-4 py-3 text-center">
              <p className="text-xs md:text-xs text-slate-600 leading-relaxed">
                Are you a dental lab seeking B2B CAD/CAM milling outsourcing? Contact our Lab
                Director directly at{' '}
                <a href={LAB_PHONE_TEL} className="font-semibold text-[#1977C5] whitespace-nowrap">
                  {LAB_PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= GLOBAL QUICK SEARCH DIALOG ================= */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-[16px] md:rounded-[24px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t.search.placeholder}
                className="w-full h-9 text-sm md:text-base focus:outline-none bg-transparent"
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close search" className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-3">
              {/* case tracking action */}
              {looksLikeCaseId && (
                <Link
                  href={`/case-tracker?q=${encodeURIComponent(searchQ.trim())}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-[12px] hover:bg-[#1977C5]/5 transition-colors group"
                >
                  <span className="w-9 h-9 rounded-[10px] bg-[#1977C5]/10 flex items-center justify-center shrink-0">
                    <ScanSearch size={17} className="text-[#1977C5]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-[#1977C5] truncate">
                      {t.search.trackCase} &ldquo;{searchQ.trim()}&rdquo;
                    </span>
                    <span className="block text-xs md:text-xs text-gray-400">
                      {t.search.openTimeline}
                    </span>
                  </span>
                  <ArrowRight size={15} className="text-[#1977C5] group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              )}

              {/* blog results */}
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> {t.search.searching}
                </div>
              ) : hits.length > 0 ? (
                <>
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {searchQ.trim() ? t.search.articles : t.search.popular}
                  </p>
                  {hits.map((hit) => (
                    <Link
                      key={hit.slug}
                      href={`/blog/${hit.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-[12px] hover:bg-slate-100 transition-colors group"
                    >
                      <span className="w-9 h-9 rounded-[10px] bg-[#1977C5]/10 flex items-center justify-center shrink-0">
                        <FileText size={17} className="text-[#1977C5]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{hit.title}</span>
                        <span className="block text-xs md:text-xs text-[#1977C5] font-semibold uppercase tracking-widest">
                          {hit.category}
                        </span>
                      </span>
                      <ArrowRight size={15} className="text-gray-300 group-hover:translate-x-1 group-hover:text-[#1977C5] transition-all shrink-0" />
                    </Link>
                  ))}
                </>
              ) : searchQ.trim() ? (
                <p className="px-3 py-6 text-center text-xs md:text-sm text-gray-400">
                  {t.search.noResults}
                  {looksLikeCaseId ? '' : t.search.hint}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
