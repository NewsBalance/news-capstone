import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// JSON 리소스를 직접 import
import koCommon from './locales/ko/common.json';
import enCommon from './locales/en/common.json';
import jaCommon from './locales/ja/common.json';
import zhCommon from './locales/zh/common.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { common: koCommon },
      en: { common: enCommon },
      ja: { common: jaCommon },
      zh: { common: zhCommon },
    },
    // namespace 설정
    ns: ['common'],
    defaultNS: 'common',

    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en', 'ja', 'zh'],
    lng: 'ko', // 초기 언어

    interpolation: {
      escapeValue: false, // React는 이미 XSS 방어됨
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
