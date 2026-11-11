'use client';

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';
import { translations, TranslationDictionary, Language } from '@/data/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'cndl-lang';
const CHANGE_EVENT = 'cndl-lang-change';

/** In-memory fallback so the toggle still works when localStorage is blocked. */
let memoryLang: Language | null = null;

function readLang(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch {
    // localStorage unavailable (private mode / blocked storage)
  }
  return memoryLang ?? 'en';
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** The server always renders English; the client switches after hydration. */
const serverLang = (): Language => 'en';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, serverLang);

  // Keep <html lang> in sync for screen readers and font selection.
  useEffect(() => {
    document.documentElement.lang = lang === 'bn' ? 'bn-BD' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    memoryLang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked — memoryLang keeps the choice for this page view
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const toggleLang = useCallback(() => {
    setLang(readLang() === 'en' ? 'bn' : 'en');
  }, [setLang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: (translations[lang] || translations.en) as TranslationDictionary,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
