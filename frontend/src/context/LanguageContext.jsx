import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { LANGUAGES, getLanguageByCode } from '../utils/languages';
import { CORE_DICTIONARY, translatePhrase, transliterateRemainingEnglish } from '../services/translationService';
import { TRANSLATIONS } from '../data/translations';
import { translatePatientSpeech } from '../services/aiService';

const LanguageContext = createContext(null);

// Keep original English text for DOM elements to enable clean multi-way language switching
const originalTextMap = new WeakMap();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    return localStorage.getItem('medikiosk_language') || 'en';
  });

  const currentLanguageInfo = useMemo(() => {
    return getLanguageByCode(currentLanguage);
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
    try {
      const googleCode = code === 'en' ? 'en' : code;
      document.cookie = `googtrans=/auto/${googleCode}; path=/;`;
      document.cookie = `googtrans=/en/${googleCode}; path=/;`;
      if (typeof window !== 'undefined' && window.location.hostname) {
        document.cookie = `googtrans=/auto/${googleCode}; path=/; domain=${window.location.hostname};`;
      }

      const selectEl = document.querySelector('.goog-te-combo');
      if (selectEl) {
        selectEl.value = googleCode;
        selectEl.dispatchEvent(new Event('change'));
      }
    } catch (e) {
      console.warn('Google Translate sync notice:', e);
    }
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
        // Restore original English text
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
          if (originalTextMap.has(node)) {
            node.nodeValue = originalTextMap.get(node);
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
            // Skip scripts, styles, textareas, inputs, and components managed directly by React with t()
            if (['script', 'style', 'noscript', 'textarea', 'input', 'code', 'pre'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            // Exclude header navbar and elements with data-no-dom-translate so React handles them directly
            if (parent.closest('header') || parent.closest('[data-no-dom-translate]')) {
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
      const dictKeys = Object.keys(CORE_DICTIONARY);

      while ((node = walker.nextNode())) {
        if (!originalTextMap.has(node)) {
          originalTextMap.set(node, node.nodeValue);
        }

        const originalText = originalTextMap.get(node);
        const trimmed = originalText.trim();

        // Exact match
        if (CORE_DICTIONARY[trimmed] && CORE_DICTIONARY[trimmed][currentLanguage]) {
          node.nodeValue = originalText.replace(trimmed, CORE_DICTIONARY[trimmed][currentLanguage]);
          continue;
        }

        // Substring phrases replacement for common titles & labels
        let replaced = originalText;
        for (const key of dictKeys) {
          if (replaced.includes(key) && CORE_DICTIONARY[key][currentLanguage]) {
            replaced = replaced.split(key).join(CORE_DICTIONARY[key][currentLanguage]);
          }
        }

        // 4. Fallback: Transliterate any remaining English words into the target language script
        if (currentLanguage !== 'en') {
          replaced = transliterateRemainingEnglish(replaced, currentLanguage);
        }

        if (replaced !== originalText) {
          node.nodeValue = replaced;
        }
      }
    };

    // Run translation on load and after DOM settles
    translateDOM();
    const timer = setTimeout(translateDOM, 250);

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
