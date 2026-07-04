#!/usr/bin/env node
/* Generates the localized demo pages from i18n/translations.json:
 *   /<lang>/index.html   — fully translated, indexable, hreflang-linked
 *   /index.html          — language detector that redirects to /<lang>/
 *   /sitemap.xml         — root + every language URL
 * Shared assets (giscus-mount.js, demo.css, demo.js, og-image.png) stay at root
 * and are referenced with absolute paths so every language page shares them.
 *
 * Run from the repo root:  node scripts/build-i18n.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://ghost-giscus-plugin.greedylabs.kr';
const CDN = 'https://cdn.jsdelivr.net/gh/GreedyLabs/ghost-giscus-plugin@1';
const data = JSON.parse(readFileSync(join(ROOT, 'i18n/translations.json'), 'utf8'));
const ORDER = data.order;
const DEFAULT = data.default;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

// giscus UI language codes (fall back to en for unsupported)
const GISCUS_LANG = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN', es: 'es', fr: 'fr', de: 'de', pt: 'pt', hi: 'en' };

// giscus backend for this demo page's own comments (dogfooding). The comment
// block on the page is placed by our own plugin. Swap category/category-id for a
// dedicated ghost-giscus-plugin discussion category when it exists.
const GISCUS = {
  repo: 'GreedyLabs/giscus-comment',
  repoId: 'R_kgDOTHbOrw',
  category: 'ghost-giscus-plugin.greedylabs.kr',
  categoryId: 'DIC_kwDOTHbOr84DAegR'
};

// Code samples shown in the article body. Language-neutral, so they live here.
const codeInstall = () =>
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

const CODE_OPTIONS =
`data-target=".gh-content"
data-place="after"
data-class="gh-comments gh-canvas"
data-padding-bottom="48"`;

// The recommended default: place giscus right after the article body.
const CODE_AFTER =
`<script src="${CDN}/giscus-mount.min.js"
        data-target=".gh-content"
        data-place="after"
        data-class="gh-comments gh-canvas"
        data-padding-bottom="48"></script>`;

// Reuse a theme's existing comments slot as the giscus mount.
const CODE_REPLACE =
`<script src="${CDN}/giscus-mount.min.js"
        data-target=".gh-comments"
        data-place="replace"></script>`;

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231a73e8'/%3E%3Cpath d='M8 9h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z' fill='white'/%3E%3C/svg%3E";

function hreflangs() {
  const links = ORDER.map(
    (l) => `    <link rel="alternate" hreflang="${l}" href="${ORIGIN}/${l}/">`
  );
  links.push(`    <link rel="alternate" hreflang="x-default" href="${ORIGIN}/">`);
  return links.join('\n');
}

function langSwitch(cur) {
  const opts = ORDER.map(
    (l) => `<option value="/${l}/"${l === cur ? ' selected' : ''}>${esc(data.langs[l].name)}</option>`
  ).join('\n                    ');
  return `<select id="lang-select">
                    ${opts}
                </select>`;
}

function themeSwitch(t) {
  return `<select id="theme-select">
                    <option value="system">${esc(t.themeSystem)}</option>
                    <option value="light">${esc(t.themeLight)}</option>
                    <option value="dark">${esc(t.themeDark)}</option>
                </select>`;
}

const REPO = 'https://github.com/GreedyLabs/ghost-giscus-plugin';
const ORG = 'https://github.com/GreedyLabs';

function jsonld(lang, t, url) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'ghost-giscus-plugin',
        description: t.description,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web (Ghost)',
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
        inLanguage: lang,
        publisher: { '@type': 'Organization', name: 'GreedyLabs', url: ORG }
      }
    ]
  };
  return JSON.stringify(graph, null, 2)
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');
}

function page(lang) {
  const t = data.langs[lang];
  const url = `${ORIGIN}/${lang}/`;
  const i18nJson = JSON.stringify({ copy: t.copy, copyDone: t.copyDone, slotLabel: t.slotLabel, noteNoComments: t.noteNoComments });
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>${esc(t.title)}</title>
    <meta name="description" content="${escAttr(t.description)}">
    <meta name="author" content="GreedyLabs">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${url}">
    <meta name="theme-color" content="#1a73e8">
    <link rel="icon" href="${FAVICON}">

    <!-- Set the theme before paint to avoid a flash (system unless the user chose one) -->
    <script>
      (function () {
        try {
          var m = localStorage.getItem('ggisc-theme') || 'system';
          var dark = m === 'dark' || (m === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
          document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        } catch (e) {}
      })();
    </script>

${hreflangs()}

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ghost-giscus-plugin">
    <meta property="og:title" content="${escAttr(t.title)}">
    <meta property="og:description" content="${escAttr(t.description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${ORIGIN}/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="${t.locale}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escAttr(t.title)}">
    <meta name="twitter:description" content="${escAttr(t.description)}">
    <meta name="twitter:image" content="${ORIGIN}/og-image.png">

    <script type="application/ld+json">
${jsonld(lang, t, url)}
    </script>

    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="dns-prefetch" href="https://umami.greedylabs.kr">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/400.css">
    <link rel="stylesheet" href="/demo.css">

    <script defer src="https://umami.greedylabs.kr/script.js"
            data-website-id="8f01c957-29ec-43f7-8b89-898ffd0ceda3"></script>
</head>
<body>
    <aside class="panel">
        <h1>ghost-giscus-plugin</h1>
        <div class="panel-meta">
            <div class="field row">
                <div>
                    <label for="lang-select">${esc(t.langLabel)}</label>
                    ${langSwitch(lang)}
                </div>
                <div>
                    <label for="theme-select">${esc(t.themeLabel)}</label>
                    ${themeSwitch(t)}
                </div>
            </div>
        </div>

        <div class="field">
            <label for="f-target">${esc(t.lblTarget)} <span style="font-weight:400;color:var(--ui-muted)">${esc(t.hintTarget)}</span></label>
            <input type="text" id="f-target" value=".gh-content">
            <div class="presets">
                <button type="button" class="preset" data-target=".gh-content">.gh-content</button>
                <button type="button" class="preset" data-target=".gh-comments">.gh-comments</button>
            </div>
        </div>
        <div class="field">
            <label for="f-place">${esc(t.lblPlace)}</label>
            <select id="f-place">
                <option value="after" selected>${esc(t.optAfter)}</option>
                <option value="before">${esc(t.optBefore)}</option>
                <option value="append">${esc(t.optAppend)}</option>
                <option value="prepend">${esc(t.optPrepend)}</option>
                <option value="replace">${esc(t.optReplace)}</option>
            </select>
        </div>
        <div class="field check">
            <input type="checkbox" id="f-show-comments">
            <label for="f-show-comments">${esc(t.lblShowComments)}</label>
        </div>
        <p id="demo-note" class="hint" hidden></p>
        <div class="field">
            <label for="f-class">${esc(t.lblClass)} <span style="font-weight:400;color:var(--ui-muted)">${esc(t.hintClass)}</span></label>
            <input type="text" id="f-class" value="gh-comments gh-canvas" placeholder="gh-comments gh-canvas">
        </div>
        <div class="field" style="margin-bottom:4px"><label>${esc(t.lblPadding)}</label></div>
        <div class="field row">
            <div><label for="f-pad-top">${esc(t.padTop)}</label><input type="number" id="f-pad-top" value="0" step="4" min="0"></div>
            <div><label for="f-pad-bottom">${esc(t.padBottom)}</label><input type="number" id="f-pad-bottom" value="48" step="4" min="0"></div>
        </div>
        <div class="field row">
            <div><label for="f-pad-left">${esc(t.padLeft)}</label><input type="number" id="f-pad-left" value="0" step="4" min="0"></div>
            <div><label for="f-pad-right">${esc(t.padRight)}</label><input type="number" id="f-pad-right" value="0" step="4" min="0"></div>
        </div>

        <div class="code">
            <div class="code-head"><strong>${esc(t.embedLabel)}</strong><button class="copy" id="copy">${esc(t.copy)}</button></div>
            <pre><code id="snippet"></code></pre>
            <p class="hint">${esc(t.embedHint)} <a href="https://giscus.app" target="_blank" rel="noopener">giscus.app</a></p>
        </div>

        <div class="panel-support">
            <p>${esc(t.support)}</p>
            <script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="daeho.ro" data-color="#FFDD00" data-emoji="" data-font="Cookie" data-text="Buy me a coffee" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#ffffff"></script>
        </div>
    </aside>

    <div class="demo-hero">${esc(t.heroText)}</div>

    <article class="demo-article gh-content gh-canvas">
        <h1>${esc(t.demoTitle)}</h1>
        <p>${esc(t.demoIntro)}</p>

        <h2>${esc(t.h_intro)}</h2>
        <p>${esc(t.bodyIntro)}</p>

        <h2>${esc(t.h_install)}</h2>
        <p>${esc(t.bodyInstall)}</p>
        <pre><code>${esc(codeInstall(t))}</code></pre>
        <h3>${esc(t.h_ordering)}</h3>
        <p>${esc(t.bodyOrdering)}</p>
        <h3>${esc(t.h_options)}</h3>
        <p>${esc(t.bodyOptions)}</p>
        <pre><code>${esc(CODE_OPTIONS)}</code></pre>

        <h2>${esc(t.h_placement)}</h2>
        <p>${esc(t.bodyPlacement)}</p>
        <h3>${esc(t.h_placeAfter)}</h3>
        <p>${esc(t.bodyPlaceAfter)}</p>
        <pre><code>${esc(CODE_AFTER)}</code></pre>
        <h3>${esc(t.h_placeReplace)}</h3>
        <p>${esc(t.bodyPlaceReplace)}</p>
        <pre><code>${esc(CODE_REPLACE)}</code></pre>

        <h2>${esc(t.h_setup)}</h2>
        <p>${esc(t.bodySetup)}</p>
        <p><a href="https://giscus.app" target="_blank" rel="noopener">${esc(t.setupLink)} →</a></p>

        <h2>${esc(t.h_faq)}</h2>
        <h4>${esc(t.faqQ1)}</h4>
        <p>${esc(t.faqA1)}</p>
        <h4>${esc(t.faqQ2)}</h4>
        <p>${esc(t.faqA2)}</p>
        <h4>${esc(t.faqQ3)}</h4>
        <p>${esc(t.faqA3)}</p>

        <h2>${esc(t.h_closing)}</h2>
        <p>${esc(t.bodyClosing)}</p>
    </article>

    <!-- Stands in for the theme's native comments slot, shown only in replace
         mode where the plugin clears it and turns it into the giscus mount. -->
    <div id="demo-slot" hidden>
        <div class="gh-comments gh-canvas"><span class="demo-slot-label">${esc(t.slotLabel)}</span></div>
    </div>

    <!-- 1) our plugin, loaded FIRST so the .giscus mount exists before giscus runs -->
    <script src="/giscus-mount.js"
            data-target=".demo-article"
            data-place="after"
            data-class="gh-comments gh-canvas"
            data-padding-bottom="48"></script>
    <!-- 2) official giscus tag, unchanged -->
    <script src="https://giscus.app/client.js"
            data-repo="${GISCUS.repo}"
            data-repo-id="${GISCUS.repoId}"
            data-category="${GISCUS.category}"
            data-category-id="${GISCUS.categoryId}"
            data-mapping="pathname"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="top"
            data-theme="preferred_color_scheme"
            data-lang="${GISCUS_LANG[lang] || 'en'}"
            data-loading="lazy"
            crossorigin="anonymous"
            async>
    </script>

    <script>window.GGISC_I18N = ${i18nJson};</script>
    <script src="/demo.js"></script>
</body>
</html>
`;
}

function redirector() {
  const noscript = ORDER.map((l) => `<li><a href="/${l}/">${esc(data.langs[l].name)}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="${DEFAULT}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ghost-giscus-plugin: place giscus comments anywhere</title>
    <meta name="description" content="${escAttr(data.langs[DEFAULT].description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${ORIGIN}/">
    <link rel="icon" href="${FAVICON}">
${hreflangs()}
    <script>
        (function () {
            var supported = ${JSON.stringify(ORDER)};
            var def = ${JSON.stringify(DEFAULT)};
            var n = ((navigator.languages && navigator.languages[0]) || navigator.language || def).toLowerCase();
            var pick = def;
            for (var i = 0; i < supported.length; i++) {
                if (n === supported[i] || n.indexOf(supported[i] + '-') === 0) { pick = supported[i]; break; }
            }
            location.replace('/' + pick + '/');
        })();
    </script>
</head>
<body>
    <noscript>
        <p>Choose a language / 언어 선택:</p>
        <ul>${noscript}</ul>
    </noscript>
    <p><a href="/${DEFAULT}/">Continue in English →</a></p>
</body>
</html>
`;
}

function sitemap() {
  const items = [`  <url>\n    <loc>${ORIGIN}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>`];
  for (const l of ORDER) {
    items.push(`  <url>\n    <loc>${ORIGIN}/${l}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>\n`;
}

// --- write everything ---
for (const lang of ORDER) {
  mkdirSync(join(ROOT, lang), { recursive: true });
  writeFileSync(join(ROOT, lang, 'index.html'), page(lang));
  console.log('wrote', `${lang}/index.html`);
}
writeFileSync(join(ROOT, 'index.html'), redirector());
console.log('wrote', 'index.html (redirector)');
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap());
console.log('wrote', 'sitemap.xml');
console.log('done:', ORDER.length, 'languages');
