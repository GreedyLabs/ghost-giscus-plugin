import { getRequestConfig } from 'next-intl/server';
import meta from './meta.json';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !meta.order.includes(locale)) locale = meta.default;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
