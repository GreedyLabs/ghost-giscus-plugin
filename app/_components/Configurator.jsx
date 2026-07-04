'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { CDN, LOCALES, NAMES, GISCUS, GISCUS_LANG } from '../../lib/site';

const DEF = { padTop: 0, padRight: 0, padBottom: 48, padLeft: 0 };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const int = (v, def) => { const n = parseInt(v, 10); return isNaN(n) ? def : n; };

export default function Configurator({ locale }) {
  const t = useTranslations();
  const [o, setO] = useState({
    target: '.gh-content', place: 'after', className: 'gh-comments gh-canvas',
    padTop: DEF.padTop, padRight: DEF.padRight, padBottom: DEF.padBottom, padLeft: DEF.padLeft,
    showComments: false
  });
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState('');
  const timer = useRef(null);
  const set = (k) => (e) => setO((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  useEffect(() => setMounted(true), []);

  // giscus theme string: "preferred_color_scheme" follows the OS in giscus.
  function giscusTheme() {
    if (!mounted || theme === 'system') return 'preferred_color_scheme';
    return resolvedTheme || 'preferred_color_scheme';
  }

  // Load the plugin (data-auto="false" skips its own auto-init; we drive it).
  useEffect(() => {
    if (window.GreedyLabsGiscus) { setReady(true); return; }
    const s = document.createElement('script');
    s.src = '/giscus-mount.js'; s.setAttribute('data-auto', 'false');
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);

  // Placement / comments-area change: rebuild the mount and (re)load giscus.
  useEffect(() => {
    if (!ready || !window.GreedyLabsGiscus) return;
    const slot = document.getElementById('demo-slot');
    // Clear any prior giscus frame and mount.
    const frame = document.querySelector('iframe.giscus-frame');
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
    const prev = document.querySelector('[data-greedylabs-giscus]');
    if (prev && slot && !slot.contains(prev) && prev.parentNode) prev.parentNode.removeChild(prev);
    if (slot) {
      slot.hidden = !o.showComments;
      slot.innerHTML = o.showComments
        ? `<div class="gh-comments gh-canvas"><span class="demo-slot-label">${t('slotLabel')}</span></div>`
        : '';
    }
    const node = window.GreedyLabsGiscus.mount({
      target: o.place === 'replace' ? '.gh-comments' : '.demo-article',
      place: o.place, className: o.className,
      paddingTop: int(o.padTop, 0), paddingRight: int(o.padRight, 0),
      paddingBottom: int(o.padBottom, 0), paddingLeft: int(o.padLeft, 0)
    });
    if (!node) { setNote(t('noteNoComments')); return; }
    setNote('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const g = document.createElement('script');
      g.src = 'https://giscus.app/client.js'; g.async = true; g.crossOrigin = 'anonymous';
      g.setAttribute('data-repo', GISCUS.repo);
      g.setAttribute('data-repo-id', GISCUS.repoId);
      g.setAttribute('data-category', GISCUS.category);
      g.setAttribute('data-category-id', GISCUS.categoryId);
      g.setAttribute('data-mapping', GISCUS.mapping);
      g.setAttribute('data-reactions-enabled', GISCUS.reactionsEnabled);
      g.setAttribute('data-emit-metadata', GISCUS.emitMetadata);
      g.setAttribute('data-input-position', GISCUS.inputPosition);
      g.setAttribute('data-loading', GISCUS.loading);
      g.setAttribute('data-lang', GISCUS_LANG[locale] || 'en');
      g.setAttribute('data-theme', giscusTheme());
      document.body.appendChild(g);
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, o.place, o.showComments, locale]);

  // Class / padding change: restyle the existing mount in place, no reload.
  useEffect(() => {
    const node = document.querySelector('[data-greedylabs-giscus]');
    if (!node) return;
    const base = o.place === 'replace' ? ['gh-comments', 'gh-canvas', 'giscus'] : ['giscus'];
    o.className.split(/\s+/).forEach((c) => { if (c && base.indexOf(c) < 0) base.push(c); });
    node.className = base.join(' ');
    node.style.paddingTop = int(o.padTop, 0) > 0 ? int(o.padTop, 0) + 'px' : '';
    node.style.paddingRight = int(o.padRight, 0) > 0 ? int(o.padRight, 0) + 'px' : '';
    node.style.paddingBottom = int(o.padBottom, 0) > 0 ? int(o.padBottom, 0) + 'px' : '';
    node.style.paddingLeft = int(o.padLeft, 0) > 0 ? int(o.padLeft, 0) + 'px' : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.className, o.padTop, o.padRight, o.padBottom, o.padLeft]);

  // Keep giscus theme in sync without reloading (postMessage to its iframe).
  useEffect(() => {
    if (!mounted) return;
    const f = document.querySelector('iframe.giscus-frame');
    if (f && f.contentWindow) {
      f.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, theme, mounted]);

  const snippet = buildSnippet(o);
  function copy() {
    copyText(snippet).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  return (
    <aside className="panel">
      <h1>ghost-giscus-plugin</h1>
      <div className="panel-meta">
        <div className="field row">
          <div>
            <label htmlFor="lang-select">{t('langLabel')}</label>
            <select id="lang-select" value={`/${locale}/`} onChange={(e) => { location.href = e.target.value; }}>
              {LOCALES.map((l) => <option key={l} value={`/${l}/`}>{NAMES[l]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="theme-select">{t('themeLabel')}</label>
            <select id="theme-select" value={mounted ? (theme || 'system') : 'system'} onChange={(e) => setTheme(e.target.value)}>
              <option value="system">{t('themeSystem')}</option>
              <option value="light">{t('themeLight')}</option>
              <option value="dark">{t('themeDark')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-target">{t('lblTarget')} <span style={{ fontWeight: 400, color: 'var(--ui-muted)' }}>{t('hintTarget')}</span></label>
        <input type="text" id="f-target" value={o.target} onChange={set('target')} />
        <div className="presets">
          <button type="button" className="preset" onClick={() => setO((p) => ({ ...p, target: '.gh-content' }))}>.gh-content</button>
          <button type="button" className="preset" onClick={() => setO((p) => ({ ...p, target: '.gh-comments' }))}>.gh-comments</button>
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-place">{t('lblPlace')}</label>
        <select id="f-place" value={o.place} onChange={set('place')}>
          <option value="after">{t('optAfter')}</option>
          <option value="before">{t('optBefore')}</option>
          <option value="append">{t('optAppend')}</option>
          <option value="prepend">{t('optPrepend')}</option>
          <option value="replace">{t('optReplace')}</option>
        </select>
      </div>
      <div className="field check">
        <input type="checkbox" id="f-show-comments" checked={o.showComments} onChange={set('showComments')} />
        <label htmlFor="f-show-comments">{t('lblShowComments')}</label>
      </div>
      {note ? <p className="hint">{note}</p> : null}
      <div className="field">
        <label htmlFor="f-class">{t('lblClass')} <span style={{ fontWeight: 400, color: 'var(--ui-muted)' }}>{t('hintClass')}</span></label>
        <input type="text" id="f-class" value={o.className} onChange={set('className')} placeholder="gh-comments gh-canvas" />
      </div>
      <div className="field" style={{ marginBottom: 4 }}><label>{t('lblPadding')}</label></div>
      <div className="field row">
        <div><label htmlFor="f-pad-top">{t('padTop')}</label><input type="number" id="f-pad-top" value={o.padTop} step="4" min="0" onChange={set('padTop')} /></div>
        <div><label htmlFor="f-pad-bottom">{t('padBottom')}</label><input type="number" id="f-pad-bottom" value={o.padBottom} step="4" min="0" onChange={set('padBottom')} /></div>
      </div>
      <div className="field row">
        <div><label htmlFor="f-pad-left">{t('padLeft')}</label><input type="number" id="f-pad-left" value={o.padLeft} step="4" min="0" onChange={set('padLeft')} /></div>
        <div><label htmlFor="f-pad-right">{t('padRight')}</label><input type="number" id="f-pad-right" value={o.padRight} step="4" min="0" onChange={set('padRight')} /></div>
      </div>

      <div className="code">
        <div className="code-head"><strong>{t('embedLabel')}</strong><button className={'copy' + (copied ? ' ok' : '')} id="copy" onClick={copy}>{copied ? t('copyDone') : t('copy')}</button></div>
        <pre><code id="snippet">{snippet}</code></pre>
        <p className="hint">{t('embedHint')} <a href="https://giscus.app" target="_blank" rel="noopener">giscus.app</a></p>
      </div>

      <div className="panel-support">
        <p>{t('support')}</p>
        <a href="https://www.buymeacoffee.com/daeho.ro" target="_blank" rel="noopener">
          <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" height="40" width="145" />
        </a>
      </div>
    </aside>
  );
}

function buildSnippet(o) {
  const a = [`data-target="${esc(o.target)}"`, `data-place="${esc(o.place)}"`];
  if (o.className.trim()) a.push(`data-class="${esc(o.className.trim())}"`);
  if (int(o.padTop, 0) > 0) a.push(`data-padding-top="${int(o.padTop, 0)}"`);
  if (int(o.padRight, 0) > 0) a.push(`data-padding-right="${int(o.padRight, 0)}"`);
  if (int(o.padBottom, 0) > 0) a.push(`data-padding-bottom="${int(o.padBottom, 0)}"`);
  if (int(o.padLeft, 0) > 0) a.push(`data-padding-left="${int(o.padLeft, 0)}"`);
  return `<script src="${CDN}/giscus-mount.min.js"\n        ${a.join('\n        ')}></script>`;
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return legacyCopy(text);
}
function legacyCopy(text) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    ok ? resolve() : reject();
  });
}
