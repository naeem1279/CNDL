'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const WHATSAPP_URL = 'https://wa.me/8801743167963';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-(--bg-secondary) pt-20 pb-20 md:pb-8">
      <div className="container text-xs md:text-sm lg:text-base xl:text-lg">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 pb-14 ">
          <div className="lg:col-span-2">
            <div className="flex flex-col items-start gap-2 mb-6">
              <Link href="/">
                <Image
                  src="/icon/Logo_footer.svg"
                  alt="CNDL Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[11px] font-semibold text-[#1977C5]">
                <ShieldCheck size={13} />
                <span>{t.footer.servingSince}</span>
              </div>
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={22} className="text-(--text-muted)" /> 419/1/C Khilgaon (West Side of Jorpukur Field), Dhaka-1219, Bangladesh
              </li>
              <li className="flex items-start gap-3">
                <Mail size={20} className="text-(--text-muted)" /> chistiyanizamiyad@gmail.com
              </li>
              <li className="flex items-start gap-3">
                <Phone size={20} className="text-(--text-muted)" />
                <span>
                  <a href="tel:+8801743167963">+880 1743-167963</a>
                  {' / '}
                  <a href="tel:+8801805976351">+880 1805-976351</a>
                </span>
              </li>
            </ul>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-xs md:text-sm font-bold text-white shadow-md hover:brightness-105 hover:shadow-lg transition-all min-h-[48px]"
            >
              <MessageCircle size={17} />
              {t.footer.chatDirector}
            </a>
          </div>

          <ul className="space-y-4">
            <li>
              <Link href="/">{t.footer.home}</Link>
            </li>
            <li>
              <Link href="/about">{t.footer.about}</Link>
            </li>
            <li>
              <Link href="/products">{t.footer.products}</Link>
            </li>
            <li>
              <Link href="/technology">{t.footer.technology}</Link>
            </li>
            <li>
              <Link href="/case-tracker">{t.footer.caseTracker}</Link>
            </li>
          </ul>

          <ul className="space-y-4">
            <li>
              <Link href="/contact#contact-form">{t.footer.getPricing}</Link>
            </li>
            <li>
              <Link href="/order-create">{t.footer.orderForm}</Link>
            </li>
            <li>
              <Link href="/contact#contact-form">{t.footer.contactUs}</Link>
            </li>
          </ul>

          <ul className="space-y-4">
            <li>
              <Link href="/terms-conditions">{t.footer.privacyPolicy}</Link>
            </li>
            <li>
              <Link href="/terms-conditions">{t.footer.termsConditions}</Link>
            </li>
            <li>
              <Link href="/prep-guide" className="hover:text-[#1977C5] transition-colors">
                Preparation Guide
              </Link>
            </li>
            <li>
              <Link href="/lab-slip" target="_blank" className="font-semibold text-[#1977C5] hover:underline">
                Official Lab Slip (PDF)
              </Link>
            </li>
          </ul>
        </div>

        <div className="border-t border-(--border-primary)"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8">   
          <p className="text-center md:text-left">
            {t.footer.copyright} • <span className="text-[#1977C5] font-semibold">{t.footer.servingSince}</span>
          </p>

          <div className="flex items-center gap-4">
            <Link href="https://www.facebook.com/cndentallab" target="_blank">Facebook</Link>
            <span className="w-px h-4 bg-(--border-primary)" />
            <Link href="#" target="_blank">Linkedin</Link>
            <span className="w-px h-4 bg-(--border-primary)" />
            <Link href="#" target="_blank">Twitter</Link>
            <span className="w-px h-4 bg-(--border-primary)" />
            <Link href="https://instagram.com/cndlglobal" target="_blank">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
