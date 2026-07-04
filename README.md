# ghost-giscus-plugin

A tiny, dependency-free helper that places [giscus](https://giscus.app) comments
at a spot you choose. It does **not** wrap or replace giscus. It only prepares
the mount point, so the official giscus script finds it and mounts there.
Companion to [ghost-toc-plugin](https://github.com/GreedyLabs/ghost-toc-plugin)
and [ghost-progress-plugin](https://github.com/GreedyLabs/ghost-progress-plugin).

- Keep the **official giscus `<script>` as-is**, just add one line before it
- Put comments after your `<article>`, inside `.gh-content`, or reuse an
  existing comments block
- Works through Ghost **code injection** with no theme editing
- The target selector's absence is the page guard: no match, nothing happens

## Quick start

For **Ghost**: Settings → Code injection → **Site Footer**.

```html
<script src="https://cdn.jsdelivr.net/gh/GreedyLabs/ghost-giscus-plugin@1/giscus-mount.min.js"
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
        async></script>
```

Get the giscus values (`data-repo`, `data-repo-id`, `data-category`,
`data-category-id`) from [giscus.app](https://giscus.app).

> **Order matters.** This plugin must come **before** the giscus script. giscus
> decides where to mount the moment it runs, so the `.giscus` element has to
> exist first. Reverse the order and comments land at the script tag instead.

## Options

All set as `data-*` attributes on the **plugin** `<script>` tag.

| Attribute | Default | Description |
|---|---|---|
| `data-target` | `.gh-content` | CSS selector for the anchor element |
| `data-place` | `after` | `append`, `prepend`, `before`, `after`, or `replace` |
| `data-class` | — | Extra class(es) on the mount wrapper (inherit theme styling) |
| `data-padding-top` | — | Wrapper `padding-top` in px |
| `data-padding-right` | — | Wrapper `padding-right` in px |
| `data-padding-bottom` | — | Wrapper `padding-bottom` in px |
| `data-padding-left` | — | Wrapper `padding-left` in px |
| `data-guard` | `true` | `false` keeps giscus on pages where the target is missing |
| `data-auto` | `true` | Set to `false` to skip auto-init |

### Placement modes

- `append` / `prepend` — inside the target, at the end / start
- `before` / `after` — as a sibling before / after the target
- `replace` — clear the target and use it as the mount point (reuse an existing
  `.gh-comments` block)

### Styling

To match your theme's comment area, either inherit a class that already has the
styling, or set spacing directly:

```html
<!-- inherit one or more stylesheet rules (space-separated) -->
data-class="gh-comments gh-canvas"

<!-- or set spacing without touching the theme -->
data-padding-bottom="48"
```

## Programmatic API

```js
var el = GreedyLabsGiscus.mount({ target: "article", place: "after" });
```

Calling `mount()` again moves the same element (keeping giscus's iframe) instead
of duplicating it.

## Page guard

Because the giscus tag sits in a site-wide footer, on a page without the target
(the home page, tag archives) giscus would otherwise fall back to mounting
comments at its own script tag. When the plugin finds no target and no manually
placed `.giscus`, it removes the giscus script so comments only appear where you
meant them. Pass `data-guard="false"` to opt out.

## Notes

- Ghost's built-in comments area only renders for members on some themes, so it
  may be absent. Anchoring to `.gh-content` or `article`, which always exist, is
  safer.
- Load the plugin `<script>` without `defer`/`async` so it runs before the async
  giscus script.

## License

MIT © GreedyLabs
