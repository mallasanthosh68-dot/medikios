import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { LANGUAGES, getLanguageByCode } from '../utils/languages';
import { CORE_DICTIONARY, translatePhrase, transliterateRemainingEnglish } from '../services/translationService';
import { TRANSLATIONS } from '../data/translations';
import { translatePatientSpeech } from '../services/aiService';

const LanguageContext = createContext(null);

// Robust Synchronizer for Headless Google Translate Widget
const syncGoogleTranslate = (code) => {
  if (typeof window === 'undefined') return;
  try {
    const isEnglish = !code || code === 'en';
    const googleCode = isEnglish ? '' : code;

    // Set or clear cookies across domains and paths
    const host = window.location.hostname;
    const paths = ['/'];
    const domains = [
      '',
      ...(host && host !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(host) ? [host, `.${host}`] : []),
    ];

    if (isEnglish) {
      domains.forEach((d) => {
        paths.forEach((p) => {
          const domainPart = d ? `; domain=${d}` : '';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${p}${domainPart}`;
        });
      });
    } else {
      domains.forEach((d) => {
        paths.forEach((p) => {
          const domainPart = d ? `; domain=${d}` : '';
          document.cookie = `googtrans=/en/${code}; path=${p}${domainPart}`;
          document.cookie = `googtrans=/auto/${code}; path=${p}${domainPart}`;
        });
      });
    }

    const syncCombo = () => {
      const selectEl = document.querySelector('.goog-te-combo');
      if (selectEl) {
        const targetValue = isEnglish ? '' : googleCode;
        if (selectEl.value !== targetValue) {
          selectEl.value = targetValue;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          if (typeof selectEl.onchange === 'function') {
            selectEl.onchange();
          }
        }
        return true;
      }
      return false;
    };

    if (!syncCombo()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (syncCombo() || attempts > 20) {
          clearInterval(interval);
        }
      }, 250);
    }
  } catch (e) {
    console.warn('Google Translate sync notice:', e);
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    return localStorage.getItem('medikiosk_language') || 'en';
  });

  const currentLanguageInfo = useMemo(() => {
    return getLanguageByCode(currentLanguage);
  }, [currentLanguage]);

  // Synchronize Google Translate on mount, on code change, and on google_translate_ready event
  useEffect(() => {
    syncGoogleTranslate(currentLanguage);

    const onReady = () => {
      syncGoogleTranslate(currentLanguage);
    };
    window.addEventListener('google_translate_ready', onReady);
    return () => window.removeEventListener('google_translate_ready', onReady);
  }, [currentLanguage]);

  const setLanguage = (langCode) => {
    if (!langCode) return;
    const valid = LANGUAGES.find((l) => l.code === langCode);
    const code = valid ? valid.code : 'en';
    setCurrentLanguageState(code);
    localStorage.setItem('medikiosk_language', code);

    // Notify AuthContext and global listeners about language change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('medikiosk_language_change', { detail: code }));
    }

    // RTL support for Urdu/Sindhi
    if (valid?.direction === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }

    // Synchronize Headless Google Translate Widget
    syncGoogleTranslate(code);
  };

  // Translation function t(key, fallback) supporting both t('key') and t.key
  const baseT = (key, fallback) => {
    if (!key) return '';
    if (currentLanguage === 'en') return fallback || key;

    // 1. Primary: Direct lookup in comprehensive CORE_DICTIONARY & translatePhrase (covers all 51 languages + aliases)
    const translated = translatePhrase(key, currentLanguage);
    if (translated && translated !== key) {
      return translated;
    }

    // 2. Secondary: Check legacy TRANSLATIONS table if present
    if (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) {
      return TRANSLATIONS[currentLanguage][key];
    }

    // 3. Fallback: Transliterate English word into target language script so zero words retain in English
    return transliterateRemainingEnglish(fallback || key, currentLanguage);
  };

  const t = useMemo(() => {
    return new Proxy(baseT, {
      get(target, prop) {
        if (typeof prop === 'string' && !(prop in target)) {
          return target(prop);
        }
        return target[prop];
      },
    });
  }, [currentLanguage]);

  // Universal DOM Auto-Translation Engine:
  // Dynamically translates visible text nodes in the website so the whole site turns into the selected language
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const translateDOM = () => {
      if (currentLanguage === 'en') {
        // Restore original English text cleanly
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
          if (node.__medikioskOriginal && node.nodeValue !== node.__medikioskOriginal) {
            node.nodeValue = node.__medikioskOriginal;
          }
        }
        return;
      }

      // Walk text nodes and translate matching phrases
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            // Skip scripts, styles, textareas, inputs, and components marked to avoid DOM translation
            if (['script', 'style', 'noscript', 'textarea', 'input', 'code', 'pre'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('[data-no-dom-translate]')) {
              return NodeFilter.FILTER_REJECT;
            }
            if (!node.nodeValue || !node.nodeValue.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        if (!node.__medikioskOriginal) {
          node.__medikioskOriginal = node.nodeValue;
        }

        const originalText = node.__medikioskOriginal;
        if (!originalText || !originalText.trim()) continue;

        const trimmed = originalText.trim();
        const unpunct = trimmed.replace(/[?.!]+$/, '');

        let translated = null;

        // Exact match (full or unpunctuated)
        if (CORE_DICTIONARY[trimmed] && CORE_DICTIONARY[trimmed][currentLanguage]) {
          translated = originalText.replace(trimmed, CORE_DICTIONARY[trimmed][currentLanguage]);
        } else if (CORE_DICTIONARY[unpunct] && CORE_DICTIONARY[unpunct][currentLanguage]) {
          translated = originalText.replace(unpunct, CORE_DICTIONARY[unpunct][currentLanguage]);
        } else {
          const res = translatePhrase(trimmed, currentLanguage);
          if (res && res !== trimmed) {
            translated = originalText.replace(trimmed, res);
          }
        }

        if (translated && translated !== node.nodeValue) {
          node.nodeValue = translated;
        }
      }
    };

    // Run translation immediately and after DOM settles
    translateDOM();
    const timer = setTimeout(translateDOM, 200);

    // MutationObserver to translate dynamic elements as user navigates
    const observer = new MutationObserver(() => {
      translateDOM();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        currentLanguageInfo,
        languages: LANGUAGES,
        t,
        translateText: translatePatientSpeech,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Aliased hook for common use
export const useTranslation = () => {
  const { t, currentLanguage, setLanguage, languages, currentLanguageInfo } = useLanguage();
  return { t, currentLanguage, setLanguage, languages, currentLanguageInfo };
};
