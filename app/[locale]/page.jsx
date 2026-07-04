import { setRequestLocale, getTranslations } from 'next-intl/server';
import { LOCALES, CODE_INSTALL, CODE_OPTIONS, CODE_AFTER, CODE_REPLACE, richText } from '../../lib/site';
import Configurator from '../_components/Configurator';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function Page({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <>
      <Configurator locale={locale} />

      <div className="demo-hero">{t('heroText')}</div>

      <article className="demo-article gh-content gh-canvas">
        <h1>{t('demoTitle')}</h1>
        <p>{richText(t('demoIntro'))}</p>

        <h2>{t('h_intro')}</h2>
        <p>{richText(t('bodyIntro'))}</p>

        <h2>{t('h_install')}</h2>
        <p>{richText(t('bodyInstall'))}</p>
        <pre><code>{CODE_INSTALL}</code></pre>
        <h3>{t('h_ordering')}</h3>
        <p>{richText(t('bodyOrdering'))}</p>
        <h3>{t('h_options')}</h3>
        <p>{richText(t('bodyOptions'))}</p>
        <pre><code>{CODE_OPTIONS}</code></pre>

        <h2>{t('h_placement')}</h2>
        <p>{richText(t('bodyPlacement'))}</p>
        <h3>{t('h_placeAfter')}</h3>
        <p>{richText(t('bodyPlaceAfter'))}</p>
        <pre><code>{CODE_AFTER}</code></pre>
        <h3>{t('h_placeReplace')}</h3>
        <p>{richText(t('bodyPlaceReplace'))}</p>
        <pre><code>{CODE_REPLACE}</code></pre>

        <h2>{t('h_setup')}</h2>
        <p>{richText(t('bodySetup'))}</p>
        <p><a href="https://giscus.app" target="_blank" rel="noopener">{t('setupLink')} →</a></p>

        <h2>{t('h_faq')}</h2>
        <h4>{t('faqQ1')}</h4>
        <p>{richText(t('faqA1'))}</p>
        <h4>{t('faqQ2')}</h4>
        <p>{richText(t('faqA2'))}</p>
        <h4>{t('faqQ3')}</h4>
        <p>{richText(t('faqA3'))}</p>

        <h2>{t('h_closing')}</h2>
        <p>{richText(t('bodyClosing'))}</p>
      </article>

      <div id="demo-slot" hidden />
    </>
  );
}
