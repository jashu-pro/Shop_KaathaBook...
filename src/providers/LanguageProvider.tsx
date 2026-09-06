import React, { createContext, useContext, useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/languages';
import type { LanguageOption, TranslationDictionary } from '../i18n/languages';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  currentLanguage: LanguageOption;
  t: TranslationDictionary;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const saved = localStorage.getItem('khattabook_merchant_language');
    if (saved && TRANSLATIONS[saved]) return saved;

    // Detect browser regional language if possible
    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang && TRANSLATIONS[browserLang]) return browserLang;

    return 'en'; // Default to English
  });

  const setLanguage = (code: string) => {
    if (TRANSLATIONS[code]) {
      setLanguageState(code);
      localStorage.setItem('khattabook_merchant_language', code);
    }
  };

  useEffect(() => {
    localStorage.setItem('khattabook_merchant_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const currentLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLanguage, t, languages: SUPPORTED_LANGUAGES }}>
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
