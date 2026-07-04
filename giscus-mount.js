/*!
 * ghost-giscus-plugin — places giscus comments at a chosen spot on the page.
 * https://github.com/GreedyLabs/ghost-giscus-plugin
 * MIT License
 *
 * This does NOT wrap or replace giscus. It only prepares the mount point:
 * it creates (or reuses) an element with the `giscus` class at the position
 * you configure, so the official giscus client.js finds it and mounts there.
 *
 * IMPORTANT: load this BEFORE the official giscus <script>. giscus decides
 * where to mount the instant it runs; the `.giscus` element must already
 * exist by then, so this script has to come first.
 *
 *   <!-- 1) this plugin, first -->
 *   <script src=".../giscus-mount.js"
 *           data-target="article"
 *           data-place="after"
 *           data-padding-bottom="48"></script>
 *   <!-- 2) official giscus tag, unchanged -->
 *   <script src="https://giscus.app/client.js" data-repo="..." ... async></script>
 *
 * All data-* options (with defaults):
 *   data-target          CSS selector for the anchor element   (".gh-content")
 *   data-place           append|prepend|before|after|replace   ("after")
 *   data-class           extra class(es) on the mount wrapper   ("")
 *   data-padding-top     wrapper padding-top (px)               (unset)
 *   data-padding-right   wrapper padding-right (px)             (unset)
 *   data-padding-bottom  wrapper padding-bottom (px)            (unset)
 *   data-padding-left    wrapper padding-left (px)              (unset)
 *   data-guard           "false" to keep giscus on no-target pages ("true")
 *   data-auto            "false" to skip auto-init              ("true")
 *
 * Page guard: when the target isn't found (and no .giscus exists), the sibling
 * giscus <script> would fall back to mounting comments at its own tag, e.g. at
 * a site footer on the home page. So we remove that script (unless data-guard
 * is "false"). Because this plugin runs before the async giscus tag is even
 * parsed, we watch for it and remove it the instant it appears.
 *
 * Programmatic API (for the configurator / live previews):
 *   var el = GreedyLabsGiscus.mount({ target: 'article', place: 'after' });
 */
(function () {
    'use strict';

    // marks the element we created, so re-mounting moves it (keeping giscus's
    // iframe) instead of duplicating it
    var MARK = 'data-greedylabs-giscus';

    var DEFAULTS = {
        target: '.gh-content',
        place: 'after',
        className: '',
        paddingTop: null,
        paddingRight: null,
        paddingBottom: null,
        paddingLeft: null
    };

    // Merge defined options over DEFAULTS and normalise `place`.
    function resolveConfig(options) {
        var cfg = {}, k;
        for (k in DEFAULTS) { if (DEFAULTS.hasOwnProperty(k)) { cfg[k] = DEFAULTS[k]; } }
        if (options) {
            for (k in options) {
                if (options.hasOwnProperty(k) && options[k] !== undefined && options[k] !== null) { cfg[k] = options[k]; }
            }
        }
        var places = { append: 1, prepend: 1, before: 1, after: 1, replace: 1 };
        if (!places[cfg.place]) { cfg.place = 'after'; }
        return cfg;
    }

    // Put `node` at `place` relative to `target`. appendChild/insertBefore move
    // an existing node, so a repeat call relocates the same element.
    function place(node, target, mode) {
        var parent = target.parentNode;
        switch (mode) {
            case 'prepend': target.insertBefore(node, target.firstChild); break;
            case 'before': if (parent) { parent.insertBefore(node, target); } break;
            case 'after': if (parent) { parent.insertBefore(node, target.nextSibling); } break;
            case 'append': default: target.appendChild(node);
        }
    }

    // Create/relocate the `.giscus` mount point. Returns the element, or null if
    // the target selector matches nothing (its absence is the page guard).
    function mount(options) {
        var cfg = resolveConfig(options);

        var target = typeof cfg.target === 'string' ? document.querySelector(cfg.target) : cfg.target;
        if (!target) { return null; }

        var node = document.querySelector('[' + MARK + ']');

        if (cfg.place === 'replace') {
            // the target itself becomes the mount: clear it once, keep its own
            // classes (e.g. gh-comments gh-canvas) and just add `giscus`
            if (node && node !== target && node.parentNode) { node.parentNode.removeChild(node); }
            if (!target.hasAttribute(MARK)) { target.innerHTML = ''; }
            node = target;
            node.classList.add('giscus');
        } else {
            if (!node) { node = document.createElement('div'); }
            node.className = 'giscus';
        }
        node.setAttribute(MARK, '');

        if (cfg.className) {
            cfg.className.split(/\s+/).forEach(function (c) { if (c) { node.classList.add(c); } });
        }
        node.style.paddingTop = cfg.paddingTop != null ? cfg.paddingTop + 'px' : '';
        node.style.paddingRight = cfg.paddingRight != null ? cfg.paddingRight + 'px' : '';
        node.style.paddingBottom = cfg.paddingBottom != null ? cfg.paddingBottom + 'px' : '';
        node.style.paddingLeft = cfg.paddingLeft != null ? cfg.paddingLeft + 'px' : '';

        if (cfg.place !== 'replace') { place(node, target, cfg.place); }
        return node;
    }

    // Remove the sibling giscus <script> (and any fallback container it inserts)
    // so it never mounts on pages without a target. Watches the DOM because the
    // async giscus tag is parsed after this script runs.
    function suppressGiscus() {
        function kill() {
            var s = document.querySelector('script[src*="giscus.app/client.js"]');
            if (s && s.parentNode) { s.parentNode.removeChild(s); }
            var stray = document.querySelectorAll('.giscus');
            for (var i = 0; i < stray.length; i++) {
                if (!stray[i].hasAttribute(MARK) && stray[i].parentNode) { stray[i].parentNode.removeChild(stray[i]); }
            }
        }
        var obs = window.MutationObserver ? new MutationObserver(kill) : null;
        if (obs) { obs.observe(document.documentElement, { childList: true, subtree: true }); }
        function stop() { kill(); if (obs) { obs.disconnect(); } }
        if (document.readyState !== 'loading') { stop(); }
        else { document.addEventListener('DOMContentLoaded', stop); }
    }

    window.GreedyLabsGiscus = { mount: mount, defaults: DEFAULTS };

    // Auto-init from this script's own data-* attributes (unless data-auto="false").
    var thisScript = document.currentScript;
    function num(v) { return v === null ? undefined : parseInt(v, 10); }
    var script = thisScript || document.querySelector('script[src*="giscus-mount"]');
    if (script && script.getAttribute('data-auto') !== 'false') {
        var attr = function (name) { return script.getAttribute('data-' + name); };
        var mounted = mount({
            target: attr('target') || undefined,
            place: attr('place') || undefined,
            className: attr('class') || undefined,
            paddingTop: num(attr('padding-top')),
            paddingRight: num(attr('padding-right')),
            paddingBottom: num(attr('padding-bottom')),
            paddingLeft: num(attr('padding-left'))
        });
        // No mount point and no manually-placed .giscus: stop the giscus tag so
        // it doesn't dump comments at the page footer.
        if (!mounted && attr('guard') !== 'false' && !document.querySelector('.giscus')) {
            suppressGiscus();
        }
    }
})();
