'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, TranslationDictionary, Language } from '@/data/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cndl-lang') as Language | null;
      if (saved === 'bn' || saved === 'en') {
        setLangState(saved);
        document.documentElement.lang = saved === 'bn' ? 'bn-BD' : 'en';
      }
    } catch {
      // localStorage unavailable (SSR/private)
    }
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem('cndl-lang', next);
    } catch {
      // localStorage fallback
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'bn' ? 'bn-BD' : 'en';
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'bn' : 'en');
  };

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
