'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const WHATSAPP_URL = 'https://wa.me/8801743167963';

const LINK = 'inline-flex min-h-10 items-center text-sm text-slate-600 transition-colors hover:text-slate-900';
const HEADING = 'mb-2 text-sm font-semibold text-slate-900';

export default function Footer() {
  const { t, lang } = useLanguage();
  const bn = lang === 'bn';

  return (
    <footer className="relative border-t border-slate-200 bg-white print:hidden">
      <div aria-hidden className="bar-brand absolute inset-x-0 top-0 h-1" />
      <div className="container pb-28 pt-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <Link href="/" aria-label="CNDL Global home" className="inline-block">
              <Image src="/icon/Logo_footer.svg" alt="CNDL" width={162} height={52} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#1977C5]/20 bg-[#1977C5]/5 px-3 py-1 text-xs font-medium text-[#1668AD]">
              <ShieldCheck size={14} aria-hidden="true" />
              {t.footer.servingSince}
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                419/1/C Khilgaon (West Side of Jorpukur Field), Dhaka-1219, Bangladesh
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                <a href="mailto:chistiyanizamiyad@gmail.com" className="-my-2.5 inline-flex min-h-10 items-center break-all hover:text-slate-900">
                  chistiyanizamiyad@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="flex flex-wrap gap-x-2">
                  <a href="tel:+8801743167963" className="-my-2.5 inline-flex min-h-10 items-center hover:text-slate-900">
                    +880 1743-167963
                  </a>
                  <span aria-hidden="true" className="text-slate-300">
                    /
                  </span>
                  <a href="tel:+8801805976351" className="-my-2.5 inline-flex min-h-10 items-center hover:text-slate-900">
                    +880 1805-976351
                  </a>
                </span>
              </li>
            </ul>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#128C7E] px-5 text-sm font-medium text-white transition-colors hover:bg-[#0F7A6D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]/40 focus-visible:ring-offset-2"
            >
              <MessageCircle size={16} aria-hidden="true" />
              {t.footer.chatDirector}
            </a>
          </div>

          <nav aria-label={bn ? 'কোম্পানি' : 'Company'} className="lg:col-span-2">
            <p className={HEADING}>{bn ? 'কোম্পানি' : 'Company'}</p>
            <ul>
              <li><Link href="/" className={LINK}>{t.footer.home}</Link></li>
              <li><Link href="/about" className={LINK}>{t.footer.about}</Link></li>
              <li><Link href="/products" className={LINK}>{t.footer.products}</Link></li>
              <li><Link href="/technology" className={LINK}>{t.footer.technology}</Link></li>
            </ul>
          </nav>

          <nav aria-label={bn ? 'কেস পাঠান' : 'Work with us'} className="lg:col-span-2">
            <p className={HEADING}>{bn ? 'কেস পাঠান' : 'Work with us'}</p>
            <ul>
              <li><Link href="/order-create" className={LINK}>{t.footer.orderForm}</Link></li>
              <li><Link href="/case-tracker" className={LINK}>{t.footer.caseTracker}</Link></li>
              <li><Link href="/contact#contact-form" className={LINK}>{t.footer.getPricing}</Link></li>
              <li><Link href="/contact#contact-form" className={LINK}>{t.footer.contactUs}</Link></li>
            </ul>
          </nav>

          <nav aria-label={bn ? 'রিসোর্স' : 'Resources'} className="lg:col-span-3">
            <p className={HEADING}>{bn ? 'রিসোর্স' : 'Resources'}</p>
            <ul>
              <li><Link href="/prep-guide" className={LINK}>Preparation Guide</Link></li>
              <li>
                <Link href="/lab-slip" target="_blank" className="inline-flex min-h-10 items-center text-sm font-medium text-[#1668AD] hover:underline">
                  Official Lab Slip (PDF)
                </Link>
              </li>
              <li><Link href="/blog" className={LINK}>Blog</Link></li>
              <li><Link href="/terms-conditions" className={LINK}>{t.footer.termsConditions}</Link></li>
              <li><Link href="/terms-conditions#privacy" className={LINK}>{t.footer.privacyPolicy}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex-row">
          <p className="text-center md:text-left">{t.footer.copyright}</p>
          <div className="flex items-center gap-1">
            <a href="https://www.facebook.com/cndentallab" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full px-3 hover:bg-slate-100 hover:text-slate-900">
              Facebook
            </a>
            <a href="https://instagram.com/cndlglobal" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full px-3 hover:bg-slate-100 hover:text-slate-900">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
