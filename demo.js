/* Configurator logic for the ghost-giscus-plugin demo page.
   The page's comments are placed by our plugin (dogfooding) into a stand-in
   .gh-comments slot. Changing the placement rebuilds the slot and reloads giscus;
   class/padding tweaks mutate the mount in place. None of this ships. */
(function () {
    var CDN = 'https://cdn.jsdelivr.net/gh/GreedyLabs/ghost-giscus-plugin@1';
    var I = window.GGISC_I18N || { copy: '복사', copyDone: '복사됨', slotLabel: '댓글 블럭' };
    var $ = function (id) { return document.getElementById(id); };

    var SLOT_HTML = '<div class="gh-comments gh-canvas"><span class="demo-slot-label">' + I.slotLabel + '</span></div>';
    // capture the demo's original giscus config so we can re-run it on placement change
    var GISCUS_ATTRS = {};
    (function () {
        var orig = document.querySelector('script[src*="giscus.app/client.js"]');
        if (orig) {
            [].forEach.call(orig.attributes, function (a) {
                if (a.name.indexOf('data-') === 0) { GISCUS_ATTRS[a.name] = a.value; }
            });
        }
    })();

    function track(name, data) {
        try { if (window.umami && window.umami.track) { window.umami.track(name, data); } } catch (e) {}
    }

    function intField(id, def) {
        var v = parseInt($(id).value, 10);
        return isNaN(v) ? def : v;
    }

    function read() {
        return {
            target: $('f-target').value.trim() || '.gh-content',
            place: $('f-place').value,
            className: $('f-class').value.trim(),
            paddingTop: intField('f-pad-top', 0),
            paddingRight: intField('f-pad-right', 0),
            paddingBottom: intField('f-pad-bottom', 0),
            paddingLeft: intField('f-pad-left', 0)
        };
    }

    // The comments slot only exists for replace mode; other modes anchor to the
    // article. The target field only shapes the snippet.
    function liveTarget(place) { return place === 'replace' ? '.gh-comments' : '.demo-article'; }

    // Drop any prior mount/iframe, and show the .gh-comments slot only for replace.
    function reset(place) {
        var frame = document.querySelector('iframe.giscus-frame');
        if (frame && frame.parentNode) { frame.parentNode.removeChild(frame); }
        var slot = $('demo-slot');
        var m = document.querySelector('[data-greedylabs-giscus]');
        if (m && !slot.contains(m) && m.parentNode) { m.parentNode.removeChild(m); }
        if (place === 'replace') { slot.hidden = false; slot.innerHTML = SLOT_HTML; }
        else { slot.hidden = true; slot.innerHTML = ''; }
    }

    function giscusTheme() {
        var m = $('theme-select') ? $('theme-select').value : 'system';
        return m === 'system' ? 'preferred_color_scheme' : m;
    }

    var reloadTimer = null;
    function loadGiscus() {
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(function () {
            var s = document.createElement('script');
            s.src = 'https://giscus.app/client.js';
            s.async = true; s.crossOrigin = 'anonymous';
            for (var k in GISCUS_ATTRS) { if (GISCUS_ATTRS.hasOwnProperty(k)) { s.setAttribute(k, GISCUS_ATTRS[k]); } }
            s.setAttribute('data-theme', giscusTheme());
            document.body.appendChild(s);
        }, 350);
    }

    function place(o) {
        window.GreedyLabsGiscus.mount({
            target: liveTarget(o.place),
            place: o.place,
            className: o.className,
            paddingTop: o.paddingTop,
            paddingRight: o.paddingRight,
            paddingBottom: o.paddingBottom,
            paddingLeft: o.paddingLeft
        });
    }

    // Placement/target change: rebuild + re-run giscus.
    function rebuild() {
        var o = read();
        reset(o.place);
        place(o);
        loadGiscus();
        updateSnippet(o);
    }

    // Class/padding change: mutate the existing mount, no reload.
    function restyle() {
        var o = read();
        var node = document.querySelector('[data-greedylabs-giscus]');
        if (node) {
            // replace mounts onto the .gh-comments slot, so keep its own classes
            var classes = o.place === 'replace' ? ['gh-comments', 'gh-canvas', 'giscus'] : ['giscus'];
            o.className.split(/\s+/).forEach(function (c) { if (c && classes.indexOf(c) < 0) { classes.push(c); } });
            node.className = classes.join(' ');
            node.style.paddingTop = o.paddingTop > 0 ? o.paddingTop + 'px' : '';
            node.style.paddingRight = o.paddingRight > 0 ? o.paddingRight + 'px' : '';
            node.style.paddingBottom = o.paddingBottom > 0 ? o.paddingBottom + 'px' : '';
            node.style.paddingLeft = o.paddingLeft > 0 ? o.paddingLeft + 'px' : '';
        }
        updateSnippet(o);
    }

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function updateSnippet(o) {
        var a = ['data-target="' + esc(o.target) + '"', 'data-place="' + esc(o.place) + '"'];
        if (o.className) { a.push('data-class="' + esc(o.className) + '"'); }
        if (o.paddingTop > 0) { a.push('data-padding-top="' + o.paddingTop + '"'); }
        if (o.paddingRight > 0) { a.push('data-padding-right="' + o.paddingRight + '"'); }
        if (o.paddingBottom > 0) { a.push('data-padding-bottom="' + o.paddingBottom + '"'); }
        if (o.paddingLeft > 0) { a.push('data-padding-left="' + o.paddingLeft + '"'); }

        // Only the plugin tag; the official giscus tag is described under the code.
        var code = '<script src="' + CDN + '/giscus-mount.min.js"\n        ' + a.join('\n        ') + '><\/script>';
        $('snippet').textContent = code;
    }

    // placement/target rebuild the mount; class/padding just restyle it
    $('f-place').addEventListener('change', function () { rebuild(); track('config_change', { field: 'place', value: this.value }); });
    $('f-target').addEventListener('input', function () { updateSnippet(read()); });
    $('f-class').addEventListener('input', restyle);
    ['f-pad-top', 'f-pad-right', 'f-pad-bottom', 'f-pad-left'].forEach(function (id) {
        $(id).addEventListener('input', restyle);
    });
    $('f-class').addEventListener('change', function () { track('config_change', { field: 'class', value: this.value.slice(0, 60) }); });

    // Copy via the async Clipboard API, falling back to a hidden textarea +
    // execCommand for insecure contexts / unfocused documents / old browsers.
    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
        }
        return legacyCopy(text);
    }
    function legacyCopy(text) {
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
            document.body.appendChild(ta); ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) {}
            document.body.removeChild(ta);
            ok ? resolve() : reject();
        });
    }

    $('copy').addEventListener('click', function () {
        var btn = this, o = read();
        track('copy_code', { place: o.place });
        copyText($('snippet').textContent).then(function () {
            btn.textContent = I.copyDone; btn.classList.add('ok');
            setTimeout(function () { btn.textContent = I.copy; btn.classList.remove('ok'); }, 1500);
        });
    });

    var langSel = $('lang-select');
    if (langSel) { langSel.addEventListener('change', function () { location.href = this.value; }); }

    // theme switcher: light / dark / system, persisted; giscus kept in sync over postMessage.
    var themeSel = $('theme-select');
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    function effectiveTheme(mode) { return mode === 'system' ? (mql.matches ? 'dark' : 'light') : mode; }
    function syncGiscus(theme) {
        var f = document.querySelector('iframe.giscus-frame');
        if (f && f.contentWindow) {
            f.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, 'https://giscus.app');
        }
    }
    function applyTheme(mode) {
        document.documentElement.setAttribute('data-theme', effectiveTheme(mode));
        syncGiscus(mode === 'system' ? 'preferred_color_scheme' : effectiveTheme(mode));
    }
    if (themeSel) {
        var saved = 'system';
        try { saved = localStorage.getItem('ggisc-theme') || 'system'; } catch (e) {}
        themeSel.value = saved;
        applyTheme(saved);
        themeSel.addEventListener('change', function () {
            try { localStorage.setItem('ggisc-theme', this.value); } catch (e) {}
            applyTheme(this.value);
            track('theme_change', { theme: this.value });
        });
        mql.addEventListener('change', function () {
            if (themeSel.value === 'system') { applyTheme('system'); }
        });
        var giscusSynced = false;
        window.addEventListener('message', function (e) {
            if (e.origin !== 'https://giscus.app' || giscusSynced) { return; }
            if (e.data && e.data.giscus) {
                giscusSynced = true;
                if (themeSel.value !== 'system') { syncGiscus(effectiveTheme(themeSel.value)); }
            }
        });
    }

    // target presets — fill the field with one click (snippet-only)
    [].forEach.call(document.querySelectorAll('.preset'), function (btn) {
        btn.addEventListener('click', function () {
            $('f-target').value = this.getAttribute('data-target');
            updateSnippet(read());
            track('preset', { target: this.getAttribute('data-target') });
        });
    });

    // Initial DOM is already set by the plugin's auto-init (+ the page's giscus
    // tag); just render the snippet to match the panel defaults.
    updateSnippet(read());
})();
