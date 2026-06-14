# DubStubs — Deployment 1

A static, self-contained build ready to upload to any host.

## Folder contents

```
deployment_1/
├── index.html              # the app
├── styles.css              # extracted stylesheet
├── favicon.svg             # tab icon
├── og-image.svg            # social share preview (1200×630)
├── manifest.webmanifest    # PWA install metadata
├── robots.txt              # tells search crawlers what to index
├── sitemap.xml             # tells Google what pages exist
├── README.md               # this file
└── img/                    # background images (drop your own here)
    └── README.md
```

## Run locally

Just open `index.html` in a browser. No build step. No server required.

For best results (so paths like `/favicon.svg` resolve), serve the folder over a tiny local server:

```
# Python
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Deploy

Pick any static host. All free for this size:

| Host | Steps | URL |
|------|-------|-----|
| **Cloudflare Pages** | Drag this folder into Pages → done | `your-project.pages.dev` |
| **Netlify** | Drag this folder into app.netlify.com/drop | `your-project.netlify.app` |
| **Vercel** | `npx vercel` from this folder | `your-project.vercel.app` |
| **GitHub Pages** | Push to a repo, enable Pages on the main branch | `username.github.io/repo` |

Once you wire up your domain (`dubstubs.com`), the meta tags + sitemap + manifest start working as advertised.

## Custom domain

The HTML already references `https://dubstubs.com/` in the canonical URL, OG tags, and sitemap. If you publish under a different domain temporarily, the site still works — just search-engine + share-card metadata will point to dubstubs.com until you update the strings in `index.html`, `sitemap.xml`, and `robots.txt`.

## What's wired up

- **Title, description, keywords** — for search engines.
- **Open Graph + Twitter Card** — for link previews on Slack, Discord, Twitter, iMessage, etc.
- **JSON-LD structured data** — tells Google this is a free WebApplication.
- **Canonical URL** — tells search engines the official address.
- **`robots.txt`** — allows everything except `/img/uploads/`.
- **`sitemap.xml`** — submit this to Google Search Console after publishing.
- **PWA manifest** — lets users "Install" the app on phones and desktops.
- **Favicon** — yellow `DS` tile, scales to any size.
- **OG image** — branded 1200×630 share card.

## After publishing — a 5-minute SEO checklist

1. Sign in at [Google Search Console](https://search.google.com/search-console).
2. Add property → Domain → `dubstubs.com`. Verify by DNS TXT record.
3. Sitemaps → submit `https://dubstubs.com/sitemap.xml`.
4. Run a [Lighthouse audit](https://web.dev/measure/) — should score 95+ on Performance, Accessibility, SEO out of the box.
5. Test the OG image with [opengraph.xyz](https://www.opengraph.xyz) — paste your URL.

## Editing the app

- Layout/positions/colors/fonts → edit the `THEMES = { ... }` const inside `index.html`.
- Visual styling → edit `styles.css`.
- App logic → the `<script>` block at the bottom of `index.html`.

When you tweak the THEMES const, you're updating the permanent baseline that loads for every visitor. To preview before committing, design in the running app, then click *Themes → Copy current as theme code* and paste into `index.html`.

## Img folder

`img/` is where you drop background image files (paper textures, photo overlays, AI-generated backgrounds you've saved locally). Reference them in HTML/CSS/JS as `/img/your-file.png` once deployed.

For user-uploaded backgrounds in the running app, the file is converted to a data URL and stored in localStorage — `img/` is for *your* curated assets, not user uploads.
