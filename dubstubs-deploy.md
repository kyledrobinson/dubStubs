# DubStubs — Publishing Guide

How to put DubStubs online, in three tiers.

---

## TL;DR — pick a tier

| Tier | What you get | Time | Cost |
|------|-------------|------|------|
| **1. Static** | App live at a URL, no AI backgrounds (button shows the stub) | 5 min | $0 |
| **2. Static + AI** | Real AI backgrounds via Replicate/OpenAI, all features working | 30 min | ~$0/mo + per-image |
| **3. Scaled** | Split files, custom domain, PWA install, OG share images | 1–2 hrs | $10/yr domain |

You're at Tier 1 readiness today. Add tiers as you're ready.

---

## Tier 1 — Static deploy (today)

### File tree

```
dubstubs/
├── index.html         # rename dubstubs-v2.html → index.html
├── favicon.svg        # tab icon (any 64×64+ SVG works)
├── og-image.png       # optional, 1200×630, social share preview
└── README.md          # short note about the project
```

That's it. Three real files, one optional. The whole app is one self-contained HTML file with inline CSS/JS, so there's nothing to build.

### Add this to the top of `<head>` before deploying

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0a0b0e">
<meta name="description" content="Design custom keepsake tickets — a love letter to the show stub.">
<meta property="og:title" content="DubStubs">
<meta property="og:description" content="Design custom keepsake tickets.">
<meta property="og:image" content="/og-image.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

### Deploy options (free, ranked)

**Cloudflare Pages** *(recommended)*
1. Sign in at `dash.cloudflare.com` → Pages → Create a project.
2. **Direct upload** route: drag the folder in. Done in 60 seconds.
3. **Git** route (better for ongoing work): push to a GitHub repo, connect it. Auto-deploy on every push.
4. Build command: leave empty. Output dir: `/`.
5. Default URL: `your-project.pages.dev`.

**Netlify** — Almost identical UX. Drag-and-drop or Git. URL: `your-project.netlify.app`.

**Vercel** — Same. URL: `your-project.vercel.app`. Slightly more developer-tilted dashboard.

**GitHub Pages** — Free, simple, but no serverless backend (which you need for Tier 2). Fine for a Tier-1-only deploy. URL: `username.github.io/dubstubs`.

I recommend Cloudflare Pages because it carries you forward to Tier 2 with the same provider — Pages Functions handle the AI backend without any new account.

---

## Tier 2 — Static + real AI backgrounds

The AI button currently calls a stub. To make it real, you need a tiny serverless function that holds the API key and proxies requests. *Never put an API key in the client* — anyone who views source can steal it.

### File tree

```
dubstubs/
├── index.html
├── favicon.svg
├── og-image.png
├── README.md
└── functions/                  # Cloudflare Pages Functions auto-deploy
    └── api/
        └── generate.js
```

(For Vercel, the folder is `api/` at the root. For Netlify, `netlify/functions/`. The code below is shaped for Cloudflare Pages Functions; it's a 2-line tweak for the others.)

### `functions/api/generate.js` — Cloudflare Pages Function

```js
export async function onRequestPost(context) {
  const { prompt } = await context.request.json().catch(() => ({}));
  if (!prompt || typeof prompt !== 'string' || prompt.length > 500) {
    return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Replicate Flux Schnell — fast & cheap (~$0.003/image, 1–2s latency).
  // Swap to other models by changing the version string.
  const r = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${context.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait'   // tells Replicate to block until done; no polling needed
    },
    body: JSON.stringify({
      version: 'black-forest-labs/flux-schnell',
      input: {
        prompt,
        aspect_ratio: '21:9',     // matches the ticket
        output_format: 'png',
        num_outputs: 1
      }
    })
  });

  const data = await r.json();
  const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;

  return new Response(
    JSON.stringify({ imageUrl: imageUrl || null, error: data.error || null }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Update `generateAiBackground()` in `index.html`

Replace the stub with this:

```js
async function generateAiBackground(prompt) {
  const r = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const { imageUrl, error } = await r.json();
  if (error) { toast('AI error: ' + error); return null; }
  if (!imageUrl) return null;

  // Inline as data URL so it survives Save/Export and persists in localStorage
  const blob = await (await fetch(imageUrl)).blob();
  return await new Promise(res => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(blob);
  });
}
```

### Set the API key in Cloudflare

1. Replicate.com → Account → API tokens → create one.
2. Cloudflare Pages → your project → Settings → Environment variables → add `REPLICATE_API_TOKEN`.
3. Redeploy.

### Cost math

Flux Schnell ≈ $0.003 per image. $10 buys ~3,300 generations. If users start hitting it heavily, swap the model to a cached/cheaper one or add a per-IP rate limit (10 lines in the function).

---

## Tier 3 — Scaled (split files, PWA, custom domain)

When the single-file HTML gets unwieldy (probably ~3,000 lines in), split it.

### File tree

```
dubstubs/
├── public/                     # served as-is to the browser
│   ├── index.html
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── og-image.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── manifest.webmanifest
├── src/                        # editable source
│   ├── main.js                 # boot, wires everything together
│   ├── styles.css
│   ├── themes.js               # the THEMES const lives here now
│   ├── render.js               # renderFields, renderAll
│   ├── editor.js               # field editor panel
│   ├── persistence.js          # save/load to localStorage
│   ├── ai.js                   # generateAiBackground client
│   ├── export.js               # PNG export
│   └── helpers.js              # escapeHtml, rgbToHex, etc.
├── functions/
│   └── api/
│       └── generate.js
├── docs/
│   ├── plan.md                 # the planning doc
│   ├── CHANGELOG.md
│   └── examples/               # sample exported PNG tickets
├── .gitignore
├── .env.example
├── README.md
├── LICENSE                     # MIT or similar if you want it open
├── package.json                # if you add a bundler
└── vite.config.js              # optional Vite config
```

If you go the bundler route, `package.json` becomes:

```json
{
  "name": "dubstubs",
  "version": "0.3.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  }
}
```

You can keep being a no-bundler purist as long as you want — modern browsers handle ES modules natively. The bundler buys you minification, tree-shaking, and the ability to import `npm` packages later.

### PWA install (`manifest.webmanifest`)

```json
{
  "name": "DubStubs",
  "short_name": "DubStubs",
  "description": "Design custom keepsake tickets",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0b0e",
  "theme_color": "#0a0b0e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
  ]
}
```

Reference it in `<head>`:

```html
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

A minimal service worker is optional for offline. Skip until users ask.

### Custom domain (e.g. `dubstubs.com`)

1. Buy at **Cloudflare Registrar** — at-cost ($10/yr for .com), no upsell, no renewal scams.
2. Cloudflare Pages → your project → Custom domains → add `dubstubs.com` and `www.dubstubs.com`.
3. DNS auto-configures.
4. SSL certificate auto-issues. Live in ~1 minute.

If you bought the domain elsewhere, point its nameservers to Cloudflare and it works the same.

---

## `.gitignore`

```
.DS_Store
node_modules/
dist/
.env
.env.local
.wrangler/
.cache/
*.log
```

## `.env.example`

```
REPLICATE_API_TOKEN=
# Or, if you switch providers:
# OPENAI_API_KEY=
# STABILITY_API_KEY=
```

## Minimal `README.md`

```markdown
# DubStubs

Design custom keepsake tickets. A love letter to the show stub.

## Run locally
Open `index.html` in a browser. No build step.

## Deploy
Static files → Cloudflare Pages / Netlify / Vercel.
Set `REPLICATE_API_TOKEN` env var to enable AI backgrounds.

## License
MIT (or whatever you choose)
```

---

## What I'd actually do

If I were shipping this tomorrow:

1. Rename `dubstubs-v2.html` → `index.html`.
2. Add the `<head>` meta tags from Tier 1.
3. Push to a new GitHub repo `dubstubs`.
4. Connect to Cloudflare Pages. Live in 2 minutes at `dubstubs.pages.dev`.
5. Buy `dubstubs.com` from Cloudflare Registrar. Wire it up. Live as `dubstubs.com` in 4 more minutes.
6. (Later) drop in `functions/api/generate.js`, set the Replicate token, redeploy. AI backgrounds turn on.
7. (Later) split files when the single HTML hits ~3k lines.

Total time-to-public: ~10 minutes. Total time-to-AI: another 20 minutes once you've got a Replicate account.

---

*This guide complements `dubstubs-plan.md` (product roadmap) and `dubstubs-v2.html` (the working prototype).*
