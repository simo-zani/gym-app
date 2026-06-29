import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import itTranslations from './locales/it.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'it',
    load: 'languageOnly',
    // Normalize it-IT → it, en-US → en etc.
    supportedLngs: ['it', 'en'],
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    resources: {
      it: { common: itTranslations },
      en: { common: enTranslations },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'gymapp-language',
    },
  });

export default i18n;
