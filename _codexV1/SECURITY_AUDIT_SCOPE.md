<!-- _codexV1/SECURITY_AUDIT_SCOPE.md -->
<!-- Security audit scope, threat model, and prioritized findings for the DubStubs duplicated demo app. -->
<!-- This file documents what was reviewed and what still needs hardening; it is not application runtime code. -->

# DubStubs Security Audit Scope

Audit date: 2026-05-14
Branch: `security/dubstubs-audit`
Target reviewed: `_codexV1`, copied from `deployment_1`

## A. Executive Summary

Top 5 risks:

| Rank | Severity | Risk | Status |
|---|---|---|---|
| 1 | High | Public `POST /api/generate.php` can spend Replicate credits without abuse controls. | Basic rate limit added; auth still optional |
| 2 | High | Original API token search allowed public-webroot env fallbacks. A misplaced `replicate.env` could expose the API token. | Fixed in first patch |
| 3 | Medium | Original API errors returned deployment paths, raw request snippets, cURL details, and upstream provider bodies. | Fixed in first patch |
| 4 | Medium | Browser image uploads were unbounded. Large images could exhaust memory or localStorage and break the app. | Fixed with type, size, and dimension checks |
| 5 | Medium | Frontend depended on a third-party CDN script without SRI or CSP. | Fixed by self-hosting `html2canvas` |

Short version: the app is simple and has a small attack surface. The risky part is the AI generation proxy. There is no database, no payment flow, no admin area, and no server-side upload storage in this copy.

## Phase 1: Project Structure And Attack Surface

### Architecture Summary

DubStubs `_codexV1` is a static single-page ticket designer with one PHP API route.

- Frontend: `index.html` plus `styles.css`
- Runtime storage: browser `localStorage`
- Image upload flow: browser-only `FileReader.readAsDataURL`
- Export flow: browser-only `html2canvas` and `canvas.toDataURL`
- AI image flow: browser `fetch('/api/generate.php')` -> PHP cURL proxy -> Replicate Flux Schnell -> returned image data URL
- Server: PHP/cURL only
- Database: none found
- Auth/admin/payment: none found

### Externally Reachable Endpoints

| Endpoint | Method | Purpose | Notes |
|---|---:|---|---|
| `/` or `/index.html` | GET | Main ticket designer app. | Public static page. |
| `/styles.css` | GET | App styling. | Public static asset. |
| `/manifest.webmanifest` | GET | PWA metadata. | Public static asset. |
| `/robots.txt` | GET | Crawler rules. | Disallows `/img/uploads/`, though no upload backend exists. |
| `/sitemap.xml` | GET | Search sitemap. | Points to `https://dubstubs.com/`. |
| `/favicon.svg`, `/og-image.svg`, `/img/*` | GET | Visual assets. | Public static files. |
| `/api/generate.php` | POST | Generates AI background through Replicate. | Public cost-bearing route. Basic per-IP file rate limit added. |

No server-side ticket edit, delete, payment, database write, admin, or file upload endpoint was found.

## Phase 2: Secrets And Environment Safety

No real API keys, OpenAI keys, database credentials, webhook secrets, or `.env` values were found in `_codexV1`.

Issues found:

- There was no `_codexV1/.gitignore` before the first patch.
- Original `api/generate.php` looked for `replicate.env` inside public app paths.
- Original error responses exposed deployment hints such as attempted paths and `HOME`.

First patch applied:

- Added `_codexV1/.gitignore`.
- Added `_codexV1/.htaccess` to block accidental secret/debug files on Apache/cPanel.
- Updated `api/generate.php` to read only private env locations or `REPLICATE_API_TOKEN`.
- Removed raw path, body, provider, and cURL details from public JSON responses.

Recommended manual setup:

- Put `REPLICATE_API_TOKEN` in cPanel environment variables if supported, or in `/home/YOUR_CPANEL_USER/private/replicate.env`.
- Never place `replicate.env` under `public_html`, `_codexV1`, `/api`, or `/img`.

## Phase 3: Input Validation And Sanitization

Current important controls:

- Ticket text is rendered with `innerText` in `renderFields()`.
- Most displayed user text is escaped with `escapeHtml()` or assigned through `textContent`.
- PHP prompt length is capped and now requires JSON with a max body size.

Recommended validation rules:

| Field / Input | Rule |
|---|---|
| AI prompt | Required string, trim, max 500-1000 chars, JSON only, no raw prompt in public errors, rate limited by IP/session. |
| Design name | Trim, max 80 chars, safe filename slug for download, no HTML rendering. |
| Ticket field text | Max 120 chars for short fields, max 300 for multi-line notes, render only with `textContent`/`innerText`. |
| Field id / role | If import/share is added, allow only `/^[a-zA-Z0-9_-]{1,40}$/`; never insert raw role/id with `innerHTML`. |
| Colors | Strict `^#[0-9a-fA-F]{6}$`. Current code already does this for hex inputs. |
| Numeric field controls | Clamp all values in JavaScript, not just input attributes: x/y -5..105, width/height 0.1..100, z 1..99, rotation -180..180. |
| Background/photo upload | Allow only JPEG/PNG/WebP, reject SVG/GIF, max 5 MB, max 4096 px per side before `FileReader`. |
| Generated image URL | Accept only HTTPS and expected Replicate delivery hosts before server-side fetch. Add byte/content-type caps. |

## Phase 4: Authentication And Authorization

No auth exists. That is acceptable for static editing and local-only saved designs. `POST /api/generate.php` now has a basic per-IP rate limit, but auth is still useful if the demo should be private.

Minimal auth suitable for Namecheap/cPanel:

- For private demo: password-protect `_codexV1` or `/api` using cPanel Directory Privacy / HTTP Basic Auth.
- For public beta: keep the editor public, but gate `/api/generate.php` with IP rate limiting plus Cloudflare Turnstile or a short invite-code flow.
- For production accounts later: use Clerk or Firebase in front of a non-cPanel API host, or move the API to a small serverless function with per-user quotas.

## Phase 5: API And Server Security

`api/generate.php` now returns JSON only, disables display errors, sends `Cache-Control: no-store`, and sends `X-Content-Type-Options: nosniff`.

Still needed:

- Decide whether the demo should also require cPanel Basic Auth, a demo token, or Cloudflare Turnstile.
- Add cPanel/PHP log review instructions.

Current generation tracking:

- Writes JSONL events to `/home/YOUR_CPANEL_USER/private/dubstubs-logs/generate-events.jsonl`.
- Tracks request ID, IP hash, prompt length, prompt hash, Replicate HTTP code/status/id, generated image host, image content type, and image byte size.
- Does not log raw prompts, API tokens, full provider responses, or generated image bytes.

No custom CORS header is present. That is good by default: browsers from other origins cannot read the API response. It does not stop direct scripted abuse.

## Phase 6: File Upload And Generated Asset Security

No server-side file upload or saved generated asset folder exists. Browser uploads are converted to data URLs and stored locally.

Recommended safe folder structure if server-side files are added later:

```text
/home/USER/private/replicate.env
/home/USER/private/dubstubs-logs/
/home/USER/private/dubstubs-quarantine/
/home/USER/public_html/
  index.html
  styles.css
  api/generate.php
  img/static-curated-assets-only/
```

Avoid writing user uploads or generated images directly under `public_html`. If files must be public, save only random names with fixed extensions after MIME/type verification, then serve through a controlled route.

## Phase 7: Database Safety

No database code was found. No SQL injection surface exists in `_codexV1`.

If a database is added:

- Use prepared statements only.
- Use a least-privilege DB user.
- Store only the minimum ticket metadata needed.
- Avoid storing raw prompts or uploaded images unless explicitly needed.
- Add retention and deletion rules before launch.

## Phase 8: Front-End Security

Good findings:

- Ticket text uses `innerText`.
- Lightbox title/description use `textContent`.
- Saved design names are escaped before `innerHTML`.

Current controls:

- Browser uploads now allow PNG, JPG, and WebP only.
- Uploads are capped at 5 MB.
- Upload dimensions are capped at 4096 px on each side before `FileReader` reads the file.

Open risks:

- Several UI renderers use `innerHTML`; some include fields like `f.role` that are safe today only because the UI does not expose role editing.
- Inline script and inline handlers make a strict CSP hard to add.
- `localStorage` can grow until the browser quota fails.

## Phase 9: OpenAI / Replicate API Usage Security

No OpenAI key was found. The app uses Replicate in `api/generate.php`.

Current controls:

- API token is server-side only.
- Prompt is length-limited.
- First patch removed public debug details.
- Basic per-IP rate limiting is enabled.
- Raw prompts are not logged; prompt length and hash are tracked.
- Generated image URLs must be HTTPS and hosted by Replicate delivery hosts unless configured otherwise.
- Generated image downloads reject redirects, unsupported image content types, and files over 8 MB.

Still needed:

- Decide whether to add auth before public launch.
- Add cost ceilings outside code: Replicate spending limits, monitoring, and alerts.

## Phase 10: Production Readiness For Namecheap/cPanel

Practical hardening checklist:

- Enable HTTPS and redirect HTTP to HTTPS.
- Keep `replicate.env` outside `public_html`.
- Confirm `.htaccess` is honored.
- Enable PHP `curl`.
- Disable `display_errors` in cPanel PHP settings.
- Add Cloudflare or cPanel rate limiting if available.
- Add a simple 404 page.
- Review logs weekly during beta.
- Back up static files before edits.
- Submit `sitemap.xml` only when the public version is ready.

## B. Findings Table

| ID | Severity | File | Line/function | Issue | Why it matters | Recommended fix | Patch difficulty |
|---|---|---|---|---|---|---|---|
| DUB-001 | High | `api/generate.php` | `POST /api/generate.php`, Replicate cURL at line 157 | Public generation endpoint needed abuse controls. | Anyone could call the endpoint directly and spend API credits or create availability pressure. | Basic per-IP file rate limit added. Add auth/Turnstile if the demo should be private. | Partially done |
| DUB-002 | High | `api/generate.php` | Original token candidate list; current private candidates at line 68 | Original code allowed public-webroot env fallback. | If a token file is placed under webroot, it can be downloaded or exposed by misconfigured hosting. | Keep secrets only in `/home/USER/private/replicate.env` or environment variables. | Done |
| DUB-003 | Medium | `api/generate.php`, `index.html` | Original API errors; client detail display at lines 1438-1448 | Original errors exposed paths, raw body snippets, cURL details, and provider responses. | Public diagnostics help attackers map hosting and can leak sensitive provider/debug data. | Return generic client errors; log details server-side. | Done |
| DUB-004 | Medium | `api/generate.php` | Body parsing around lines 111-137 | Original route read the request body without a size cap and accepted malformed JSON as missing prompt. | Large bodies can waste memory; loose parsing makes abuse handling noisy. | Require JSON and cap request bytes before decoding. | Done |
| DUB-005 | Medium | `index.html` | `validateImageFile()` line 1559; upload handlers lines 1065 and 1217 | Browser uploads had no type, size, or dimension checks. | Large images could freeze the browser or exceed localStorage quota. SVG/GIF should not be accepted if later persisted. | Limited to JPEG/PNG/WebP, max 5 MB, max 4096 px per side. | Done |
| DUB-006 | Medium | `index.html` | `innerHTML` at lines 753, 1047, 1309, 1604 | Dynamic HTML rendering is used in several UI paths. | Ticket text is safe today, but future import/share or localStorage-loaded fields could turn raw `role`/template values into XSS. | Prefer DOM creation and `textContent`; escape `f.role`; remove inline `onerror`. | Medium |
| DUB-007 | Medium | `index.html` | CDN script line 56 | `html2canvas` was loaded from CDN without SRI or local pinning. | If the CDN response changed maliciously, code would run in the DubStubs origin. | Vendored `html2canvas` locally under `vendor/`. | Done |
| DUB-008 | Medium | `api/generate.php` | Generated image fetch starts around line 455 | Server fetched provider-returned image URL with redirects and no host/content-length check. | Mostly provider-controlled today, but allowlisting prevents future SSRF/content abuse if upstream response changes. | Requires HTTPS, allows Replicate delivery hosts, rejects redirects, caps bytes, verifies image content type. | Done |
| DUB-009 | Low | `index.html` | `link.download` line 1384 | Design name was used as a download filename without slugging. | Bad filenames can produce odd downloads or OS-specific filename issues. | Added `safeFilename()` with length and character replacement. | Done |
| DUB-010 | Low | `index.html` | `localStorage` lines 1273-1274 | Saved designs are unbounded and include image data URLs. | Users can hit browser quota and lose saves or crash rendering. | Limit saved design count/size and catch quota errors with a friendly message. | Low |

## C. Quick Wins Under 30 Minutes

- Decide whether to add cPanel Basic Auth or Cloudflare Turnstile on top of the new rate limit.
- Escape `f.role` in field chips and bubbles.
- Confirm `.htaccess` is active on the host.

## D. Must-Fix Before Public Launch

- Confirm private rate-limit/log directories are writable on cPanel.
- Decide whether public demo generation also needs Basic Auth, Turnstile, or invite-code gating.
- Set Replicate account spend alerts/limits outside code.

## E. Suggested Pull Requests

PR 1: Secrets and env cleanup

- Status: implemented in this branch.
- Files: `.gitignore`, `.htaccess`, `api/generate.php`.
- Scope: private token lookup only, safer error responses, basic JSON/body validation.

PR 2: API hardening

- Status: basic file-based rate limiting and generated image host/content checks are implemented.
- Still consider Cloudflare Turnstile or Basic Auth if the demo should be private.
- Set Replicate spend alerts outside code.

PR 3: Input validation

- Status: upload type/size/dimension checks and filename slugging are implemented.
- Clamp numeric controls in JavaScript.

PR 4: Upload/generated file safety

- Keep current browser-only storage unless server-side storage is truly needed.
- If added, write outside public webroot and serve through controlled routes.

PR 5: Production headers and logging

- Confirm `.htaccess` behavior.
- Add CSP after moving inline JS/handlers.
- Add HSTS only after HTTPS is verified.
- Document PHP error log location and safe log retention.

## F. Branch And Patch Status

Created branch: `security/dubstubs-audit`

Security patches completed:

- `_codexV1/api/generate.php`
- `_codexV1/.gitignore`
- `_codexV1/.htaccess`
- `_codexV1/index.html`
- `_codexV1/vendor/html2canvas.min.js`
- `_codexV1/SECURITY_AUDIT_SCOPE.md`
- `_codexV1/security_audit.html`

Not completed locally:

- No remote GitHub PR was opened.
- No PHP runtime validation was run because `php` is not installed in this local shell.
- No UI redesign or unrelated refactor was performed.
