// i18n/request.ts
// next-intl server-side config for lesson engine.
// Locale is always passed via ?lang= URL parameter from LMS.
// Falls back to 'id' if param is absent or invalid.
import { getRequestConfig } from 'next-intl/server';

export const locales = ['id', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'id';

export default getRequestConfig(async () => {
  // In the lesson engine, locale comes from the URL query param ?lang=
  // This is a server-side config — the actual lang param is read
  // client-side via useUrlParams() and passed to useTranslations.
  // Server components use the default locale; client components
  // use the lang param from URL via the client-side t() hook.
  const locale: Locale = 'id'; // server default; client overrides via useUrlParams
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
