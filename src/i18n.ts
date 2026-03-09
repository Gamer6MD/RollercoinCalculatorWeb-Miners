import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tr from './locales/tr.json';
import en from './locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        showSupportNotice: false,
        resources: {
            tr: {
                translation: tr,
            },
            en: {
                translation: en,
            },
        },
        fallbackLng: 'tr',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        detection: {
            // Priority: URL path first, then localStorage, then defaults
            order: ['path', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

export default i18n;
