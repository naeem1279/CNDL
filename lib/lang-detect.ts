/**
 * Default interface language.
 *
 * 1. A choice the visitor made with the EN / বাং switch (saved in localStorage) always wins.
 * 2. Otherwise visitors whose device clock is set to Bangladesh time (Asia/Dhaka) get Bengali,
 *    everyone else gets English.
 *
 * The time zone stands in for "is this visitor in Bangladesh": it is known instantly on the
 * device, needs no IP lookup or third-party service, and sends nothing anywhere. Search engines
 * crawl in English, so server-rendered HTML (and SEO) stays English.
 */
export const LANG_STORAGE_KEY = 'cndl-lang';
export const BD_TIME_ZONES = ['Asia/Dhaka', 'Asia/Dacca'];

/**
 * Runs in <head> before the page paints (see app/layout.tsx). It marks <html class="js"> (scroll
 * reveal only hides content when JS runs), sets <html lang>, records the
 * resolved language on window.__cndlLang, and for Bengali hides translated text for an instant
 * (class "i18n-pending") so visitors never see English flash before React switches it.
 * Keep it dependency-free and in sync with detectLang() below.
 */
export const LANG_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,s=null;d.classList.add('js');if(typeof IntersectionObserver==='undefined')d.classList.add('no-io');try{s=localStorage.getItem('${LANG_STORAGE_KEY}')}catch(e){}var z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}var l=(s==='bn'||s==='en')?s:(${JSON.stringify(BD_TIME_ZONES)}.indexOf(z)>-1?'bn':'en');window.__cndlLang=l;d.lang=l==='bn'?'bn-BD':'en';if(l==='bn'){d.classList.add('i18n-pending');setTimeout(function(){d.classList.remove('i18n-pending')},1500)}}catch(e){}})();`;

export type Lang = 'en' | 'bn';

/** Saved choice, else time-zone default. Client only. */
export function detectLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch {
    // storage blocked: fall through to the time-zone default
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (BD_TIME_ZONES.includes(tz)) return 'bn';
  } catch {
    // very old browser: English
  }
  return 'en';
}
