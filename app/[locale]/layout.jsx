import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { jsonLdScriptProps } from 'react-schemaorg';
import { ORIGIN, LOCALES, OG_LOCALES, FAVICON, jsonLd } from '../../lib/site';
import Providers from '../_components/Providers';
import '../demo.css';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport = { themeColor: '#1a73e8' };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const url = `${ORIGIN}/${locale}/`;
  const languages = {};
  LOCALES.forEach((l) => { languages[l] = `${ORIGIN}/${l}/`; });
  languages['x-default'] = `${ORIGIN}/`;
  const title = t('title');
  const description = t('description');
  return {
    metadataBase: new URL(ORIGIN),
    title,
    description,
    authors: [{ name: 'GreedyLabs' }],
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages },
    icons: { icon: FAVICON },
    openGraph: {
      type: 'website', siteName: 'ghost-giscus-plugin', title, description, url,
      images: [{ url: `${ORIGIN}/og-image.png`, width: 1200, height: 630 }],
      locale: OG_LOCALES[locale]
    },
    twitter: {
      card: 'summary_large_image', title, description,
      images: [`${ORIGIN}/og-image.png`]
    }
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale });
  const ld = jsonLd(locale, t, `${ORIGIN}/${locale}/`);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script {...jsonLdScriptProps(ld)} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://giscus.app" />
        <link rel="dns-prefetch" href="https://umami.greedylabs.kr" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/400.css" />
        <script defer src="https://umami.greedylabs.kr/script.js" data-website-id="8f01c957-29ec-43f7-8b89-898ffd0ceda3" />
      </head>
      <body>
        <Providers>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
