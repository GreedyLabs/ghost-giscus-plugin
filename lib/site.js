import React from 'react';
import meta from '../i18n/meta.json';

export const ORIGIN = 'https://ghost-giscus-plugin.greedylabs.kr';
export const CDN = 'https://cdn.jsdelivr.net/gh/GreedyLabs/ghost-giscus-plugin@1';
export const REPO = 'https://github.com/GreedyLabs/ghost-giscus-plugin';
export const ORG = 'https://github.com/GreedyLabs';
export const LOCALES = meta.order;
export const DEFAULT_LOCALE = meta.default;
export const NAMES = meta.names;
export const OG_LOCALES = meta.locales;

export const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231a73e8'/%3E%3Cpath d='M8 9h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z' fill='white'/%3E%3C/svg%3E";

export const GISCUS_LANG = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN', es: 'es', fr: 'fr', de: 'de', pt: 'pt', hi: 'en' };

// The live demo's own giscus config (the official client.js tag). The plugin only
// places the mount; giscus itself is loaded with these attributes.
export const GISCUS = {
  repo: 'GreedyLabs/giscus-comment',
  repoId: 'R_kgDOTHbOrw',
  category: 'ghost-plugins',
  categoryId: 'DIC_kwDOTHbOr84DAhRe',
  mapping: 'specific',
  term: 'ghost-giscus-plugin',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  loading: 'lazy'
};

export const CODE_INSTALL =
`<script src="${CDN}/giscus-mount.min.js"
        data-target=".gh-content"
        data-place="after"
        data-class="gh-comments gh-canvas"
        data-padding-bottom="48"></script>

<script src="https://giscus.app/client.js"
        data-repo="[YOUR REPO]"
        data-repo-id="[REPO ID]"
        data-category="[CATEGORY]"
        data-category-id="[CATEGORY ID]"
        data-mapping="pathname"
        data-theme="preferred_color_scheme"
        crossorigin="anonymous"
        async></script>`;

export const CODE_OPTIONS =
`data-target=".gh-content"
data-place="after"
data-class="gh-comments gh-canvas"
data-padding-bottom="48"`;

export const CODE_AFTER =
`<script src="${CDN}/giscus-mount.min.js"
        data-target=".gh-content"
        data-place="after"
        data-class="gh-comments gh-canvas"
        data-padding-bottom="48"></script>`;

export const CODE_REPLACE =
`<script src="${CDN}/giscus-mount.min.js"
        data-target=".gh-comments"
        data-place="replace"></script>`;

// Wrap code tokens (data-* attrs, selectors, class names, CSS vars) in <code> for monospace.
const CODE_RE = /(data-[a-z]+(?:-[a-z]+)*(?:="[^"]*")?)|(\.gh-[a-z-]+)|(\.notion-page-content)|(\.giscus)(?![\w-])|(gh-comments gh-canvas)|(--[a-z-]*ghost[a-z-]*)|(--color-[a-z-]+)|(greedylabs-ghost-[a-z-]+)/g;

export function richText(s) {
  const out = []; let last = 0, m; CODE_RE.lastIndex = 0;
  while ((m = CODE_RE.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(React.createElement('code', { key: m.index }, m[0]));
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function jsonLd(locale, t, url) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'ghost-giscus-plugin',
        description: t('description'),
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web (Ghost, Notion)',
        softwareVersion: '1',
        url,
        codeRepository: REPO,
        license: 'https://opensource.org/licenses/MIT',
        author: { '@type': 'Organization', name: 'GreedyLabs', url: ORG },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        sameAs: [REPO]
      },
      {
        '@type': 'WebSite',
        name: 'ghost-giscus-plugin',
        url: `${ORIGIN}/`,
        inLanguage: locale,
        publisher: { '@type': 'Organization', name: 'GreedyLabs', url: ORG }
      }
    ]
  };
}
