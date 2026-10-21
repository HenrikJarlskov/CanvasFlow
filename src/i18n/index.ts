import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { da } from './locales/da';

export interface LanguageOption {
  code: 'en' | 'fr' | 'de' | 'da';
  label: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', name: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'da', label: 'Dansk', name: 'Danish', flag: '🇩🇰' },
];

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
  da: { translation: da },
} as const;

// Initialize i18next instance
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'de', 'da'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'aidboard_language',
      caches: ['localStorage'],
    },
  });

// Keep document.documentElement.lang in sync
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.resolvedLanguage || 'en';
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
