# img/

Drop background images, paper textures, photo overlays, and any other static visual assets you want to ship with the site here.

Reference them from HTML/CSS/JS using a leading slash, e.g.:

```html
<img src="/img/paper-texture.jpg">
```

```css
background-image: url('/img/holographic.png');
```

```js
state.bgImage = '/img/vintage-stock-1.jpg';
```

## Suggestions

- `paper-texture.jpg` — subtle paper grain for a vintage feel
- `holographic.png` — iridescent foil overlay
- `noise.png` — film grain
- `stadium-bg.jpg` — venue photo backgrounds
- Themed packs: `/img/themes/festival/`, `/img/themes/sports/`, etc.

## Performance

- JPGs for photos, PNGs for transparency, SVGs for graphics, WebP if you want max compression.
- Aim for under 200 KB per file — these load every time someone opens the app.
- Resize to the ticket aspect (2.81 : 1) and roughly 1300 px wide before uploading. Larger than that wastes bandwidth.

## Subfolders

`img/uploads/` is in `robots.txt` as `Disallow:` — use it for user-uploaded or auto-generated content you don't want indexed by Google.
