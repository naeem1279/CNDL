'use client';

import { useLanguage } from '@/context/LanguageContext';
import { homeCopy, type HomeCopy } from '@/data/home-i18n';

/** The home copy in the current language. */
export function useHomeCopy(): HomeCopy {
  const { lang } = useLanguage();
  return homeCopy[lang] ?? homeCopy.en;
}

/**
 * One string of home copy by dotted path, e.g. <HomeText path="reviews.title" />.
 * Lets server components (Reviews, Blog) show translated headings.
 */
export default function HomeText({ path }: { path: string }) {
  const copy = useHomeCopy();
  const value = path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], copy);
  return <>{typeof value === 'string' ? value : ''}</>;
}
