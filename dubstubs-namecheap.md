# DubStubs — Namecheap Deployment

Specifics for deploying on Namecheap's Stellar shared hosting (cPanel + Apache + PHP). Everything in `dubstubs-deploy.md` still applies for the static files; this doc handles the cPanel-specific bits and replaces the serverless function with a PHP equivalent.

---

## 1. What Namecheap means for your stack

| Feature | Namecheap Stellar | Cloudflare Pages / Vercel |
|---------|-------------------|---------------------------|
| Static file hosting | ✅ via `public_html/` | ✅ |
| Serverless JS functions | ❌ | ✅ |
| PHP backend | ✅ | ❌ |
| Free SSL (auto-renew) | ✅ AutoSSL | ✅ |
| Drag-and-drop deploy | ❌ — File Manager / FTP | ✅ |
| Custom domain wiring | ✅ free at registrar | ✅ |
| Build pipeline | ❌ | ✅ |

**Translation for DubStubs:**
- Static files (HTML / CSS / JS / images) — drop into `public_html/`. Easy.
- The AI Background button needs a server proxy to hide your Replicate API key. On Namecheap that's a **PHP file** (`api/generate.php`) instead of a JS serverless function.
- Your client code (`generateAiBackground()`) still calls `/api/generate` — only the backend file format differs.

---

## 2. Upload the static files

### Option A — cPanel File Manager (easiest)

1. Sign into cPanel: `https://yourdomain.com:2083` (or the URL Namecheap emailed you).
2. Find **File Manager** in the dashboard.
3. Open the `public_html/` folder. (Subdomains use their own folder; for the main domain, it's `public_html`.)
4. Either:
    - **Drag & drop** the files from `deployment_1/` directly into File Manager, or
    - Compress `deployment_1/` to a zip locally → click **Upload** in File Manager → upload the zip → right-click the zip in File Manager → **Extract** → move the contents up so `index.html` sits at `public_html/index.html`.
5. Make sure the directory structure ends up as:

```
public_html/
├── index.html
├── styles.css
├── favicon.svg
├── og-image.svg
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
└── img/
    ├── dubStubs-SleepyKitty.png
    └── dubStubs-Strokes.jpg
```

### Option B — FTP (FileZilla)

1. cPanel → **FTP Accounts** → use the master credentials (or create a new FTP account).
2. Open FileZilla → connect to your domain with those credentials.
3. Drag `deployment_1/*` into `/public_html/`.

### Option C — Git Version Control (if your plan includes it)

cPanel → **Git Version Control** → create a repo at `/home/youruser/repos/dubstubs`. Push from local. Deploy via cPanel's pull-from-repo feature.

---

## 3. SSL / HTTPS

Namecheap's AutoSSL handles free certificates.

1. cPanel → **SSL/TLS Status**.
2. Click **Run AutoSSL**. Wait 1–5 minutes.
3. cPanel → **Domains** → toggle **Force HTTPS Redirect** on.

Verify at `https://yourdomain.com` — you should see a padlock.

If you want a stronger cipher config, drop this in `public_html/.htaccess`:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set Referrer-Policy "strict-origin-when-cross-origin"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
```

---

## 4. Domain setup

Since you're already on Namecheap as the registrar, this is the simplest case:

- If `dubstubs.com` is already pointing to your hosting plan, you're done.
- If not: **Domain List → Manage → Nameservers** → set to `dns1.namecheaphosting.com` / `dns2.namecheaphosting.com` (your hosting plan's nameservers — they're shown in the cPanel welcome email).
- DNS propagates in 5 minutes to a few hours.

To preview before pointing the domain, you can use cPanel's **Temporary URL** or a subdomain.

---

## 5. AI Background — PHP backend

Drop these in `public_html/api/`:

```
public_html/
└── api/
    └── generate.php
```

**`api/generate.php`** — server-side proxy that holds your Replicate token and returns the generated image as a data URL (so it survives Save/Export/localStorage exactly like the stub does):

```php
<?php
// CORS — only your own domain calls this, but explicit is good
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'POST only']);
  exit;
}

// ── Load API token from a file OUTSIDE public_html for safety ──
// Create /home/YOURUSER/private/replicate.env with one line:
//   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxx
$envPath = dirname(__DIR__, 2) . '/private/replicate.env';
$token = '';
if (file_exists($envPath)) {
  foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (strpos($line, 'REPLICATE_API_TOKEN=') === 0) {
      $token = trim(substr($line, strlen('REPLICATE_API_TOKEN=')));
      break;
    }
  }
}
if (!$token) {
  http_response_code(500);
  echo json_encode(['error' => 'API token not configured']);
  exit;
}

// ── Validate prompt ──
$body = json_decode(file_get_contents('php://input'), true);
$prompt = trim($body['prompt'] ?? '');
if (!$prompt || strlen($prompt) > 500) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid prompt']);
  exit;
}

// ── Call Replicate (Flux Schnell — Apache 2.0, fast & cheap) ──
$ch = curl_init('https://api.replicate.com/v1/predictions');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTPHEADER => [
    'Authorization: Token ' . $token,
    'Content-Type: application/json',
    'Prefer: wait'   // synchronous; no polling needed
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'version' => 'black-forest-labs/flux-schnell',
    'input' => [
      'prompt' => $prompt,
      'aspect_ratio' => '21:9',
      'output_format' => 'png',
      'num_outputs' => 1,
      'num_inference_steps' => 4,
    ],
  ]),
]);
$response = curl_exec($ch);
if (curl_errno($ch)) {
  http_response_code(502);
  echo json_encode(['error' => 'Replicate fetch failed: ' . curl_error($ch)]);
  exit;
}
curl_close($ch);

$data = json_decode($response, true);
$imageUrl = is_array($data['output'] ?? null) ? ($data['output'][0] ?? null) : ($data['output'] ?? null);

if (!$imageUrl) {
  http_response_code(502);
  echo json_encode(['error' => $data['error'] ?? 'No image returned', 'raw' => $data]);
  exit;
}

// ── Server-side fetch the image and inline as data URL ──
// (This sidesteps any CORS issues fetching Replicate's CDN from the browser.)
$imgBytes = @file_get_contents($imageUrl);
if ($imgBytes === false) {
  // Fallback: return the URL and let the client try
  echo json_encode(['imageUrl' => $imageUrl]);
  exit;
}
$dataUrl = 'data:image/png;base64,' . base64_encode($imgBytes);
echo json_encode(['imageUrl' => $dataUrl]);
```

### Where to put the API token

**Don't** hardcode the token in the PHP file. **Don't** put it in `public_html/.env` either — Apache might serve it.

Best practice on cPanel:

1. cPanel → **File Manager** → toggle **Show Hidden Files** in Settings.
2. Navigate to `/home/YOURUSER/` (one level above `public_html`).
3. Create a folder called `private`.
4. Inside, create `replicate.env` with this content:
   ```
   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. The PHP script reads from there. Files in `/home/YOURUSER/private/` are not web-accessible.

**Get your token:** [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) → Create token → copy the `r8_…` string.

### Update the client to call `/api/generate.php`

In `public_html/index.html`, find `generateAiBackground` and replace the stub body with this:

```js
async function generateAiBackground(prompt) {
  const r = await fetch('/api/generate.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await r.json();
  if (data.error) { toast('AI error: ' + data.error); return null; }
  if (!data.imageUrl) return null;

  // Already a data URL from the PHP proxy — use directly
  if (data.imageUrl.startsWith('data:')) return data.imageUrl;

  // Fallback: client-side fetch + base64
  const blob = await (await fetch(data.imageUrl)).blob();
  return await new Promise(res => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(blob);
  });
}
```

### Optional: clean URL `/api/generate` instead of `/api/generate.php`

In `public_html/.htaccess`, add:

```apache
RewriteEngine On
RewriteRule ^api/generate$ api/generate.php [L]
```

Then in `index.html` the fetch URL can stay as `/api/generate` (no `.php`) — matching what the cloud-host docs use.

---

## 6. Testing

1. Visit `https://yourdomain.com`. The site should load with no console errors.
2. Click **Background → AI Background**. Edit the prompt. Click Generate.
3. **First time:** check that the API token file is in place and readable. Look at cPanel → **Errors** if something failed (PHP errors land there).
4. Replicate dashboard at [replicate.com/predictions](https://replicate.com/predictions) shows every successful call with cost (~$0.003 each for Flux Schnell).

---

## 7. Plan limits to watch

Namecheap Stellar shared hosting has a few limits worth knowing:

- **PHP `max_execution_time`** — usually 30s. Flux Schnell finishes in ~2s, so fine.
- **PHP memory_limit** — usually 256MB. Image base64-encoding fits easily.
- **Concurrent connections** — soft limit ~150. Wouldn't hit unless you go viral.
- **Bandwidth** — Stellar plan has unlimited bandwidth, but heavy AI usage can run into "fair use" territory. If you start serving thousands of generations a day, upgrade to Stellar Business or VPS.

For light personal / portfolio use, Stellar is fine. For real public traffic and frequent AI use, Stellar Business ($4.88/mo) or moving the AI proxy to a Cloudflare Worker (free tier, 100k req/day) is the move.

---

## 8. Migration path

You're not locked in. The structure is flat: static files + one PHP endpoint. If you outgrow shared hosting:

1. Move static files to Cloudflare Pages (free, faster CDN).
2. Move the PHP proxy to a Cloudflare Worker (free, JS instead of PHP — code's almost identical, in `dubstubs-deploy.md`).
3. Keep the domain at Namecheap or transfer to Cloudflare Registrar (cheaper renewals).

The `index.html` doesn't change. Only the `/api/generate` backend changes language and host.

---

*Companion docs: `dubstubs-deploy.md` (cloud hosts), `dubstubs-ai-setup.md` (model selection), `dubstubs-plan.md` (product roadmap).*
