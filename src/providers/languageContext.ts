import { createContext, useContext } from 'react';
import type { LanguageOption, TranslationDictionary } from '../i18n/languages';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  currentLanguage: LanguageOption;
  t: TranslationDictionary;
  languages: LanguageOption[];
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
