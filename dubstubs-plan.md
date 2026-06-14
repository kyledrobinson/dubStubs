# DubStubs — Product & Build Plan

A planning doc for turning your Ticketmaster-style custom ticket maker into a real responsive app, with AI-generated themed backgrounds and a mobile path.

---

## 1. Vision

DubStubs is a design tool for keepsakes. Users open the app, pick a real-world memory (a concert, a game, a flight, a date), and produce a beautifully-designed Ticketmaster-style stub they can save, share, or print. The differentiator is **design fidelity** — the result should feel like an actual perforated stub, not a clipart card — and **AI-themed backgrounds** that match the event (band, venue, mood) without requiring graphic-design skill.

Not a ticket-selling marketplace. A memory-design canvas.

---

## 2. Where you are today

Your `dubstubsWORK.html` file already proves out:

- A free-form text block model (drag, font, color, rotate, align, lock)
- Background image upload with opacity
- Export to PNG via `html2canvas`
- The ambition of every field being independently editable

What's holding it back:

- Every predefined text block is dumped at `(10 + i*20, 10 + i*20)` and stacks in a diagonal pile — it never *looks* like a ticket out of the box.
- No semantic model. A "band name" is the same kind of object as "convenience charge." The app can't reason about what it's editing.
- No themes. Switching from "Yellow Ticketmaster" to "Red Rocks Dark Blue" means redoing every block by hand.
- Mouse-only drag (`onmousedown`). Mobile is broken.
- No persistence. Reload = start over.
- No AI integration hook.
- Editor and canvas share one column → no room for a real Ticketmaster-style wide layout.

---

## 3. What the v2 prototype in this session delivers

`dubstubs-v2.html` — a single-file upgrade that lands these:

1. **Three real templates** matching your example tickets — Yellow Ticketmaster (Beirut), Lilac Photo (Ezra Furman), Red Rocks Dark — pre-positioned so the canvas looks correct on first load.
2. **Theme switcher** that swaps colors, fonts, and field positions in one click.
3. **Field-based editing** — click any text on the ticket to edit it inline. No retyping into a side panel.
4. **Touch + mouse drag** — works on phones.
5. **Background upload + opacity** + a "tint" overlay so photos blend in like the Ezra Furman ticket.
6. **Photo layer** — separate from background, for the artist photo that sits behind the text.
7. **Save/Load** to `localStorage` — multiple named designs, no accounts.
8. **Export PNG** at print resolution.
9. **AI background stub** — a button + prompt dialog wired to a single function that you'll point at a real image-gen API in step 7 below. The whole pipeline works; only the API call is mocked.
10. **Responsive layout** — editor docks to the right on desktop, collapses to a bottom sheet on mobile.

---

## 4. Architecture & tech stack

**Web (now):** Single-page app. Plain HTML/CSS/JS for v2 (matches your skill set, zero build step). When complexity warrants, port to Vite + a light framework (Svelte or vanilla web components — not React unless you want it) — but only when state management starts hurting.

**Mobile (later):** Two paths, in priority order:
- **PWA first** — make the web app installable, add a manifest + service worker. 90% of users get a "real app" experience for free. Cheap to ship.
- **Capacitor wrap** — when you want App Store / Play Store presence and native-feeling gestures. Capacitor lets you reuse the entire web codebase and adds native plugins (camera, share sheet, haptics). Recommended over React Native because you keep your single codebase.

**Storage:**
- v2: `localStorage` only — designs as JSON keyed by ticket ID.
- v3 (when needed): IndexedDB for larger image blobs, then optional cloud sync via Supabase (auth + Postgres + storage in one) when users actually ask to share across devices.

**Image generation:**
- Plan an API integration (see §7).

**Export:**
- `html2canvas` is fine for v2 PNG export.
- For print-quality (300 DPI, 8.5×3.5"), upgrade to `html-to-image` library or render via `<canvas>` directly. Add a "Print Mode" toggle that boosts resolution.

---

## 5. Data model

Every saved ticket is a JSON document. Sketch:

```
{
  id: "tkt_abc123",
  name: "Beirut at Stockton — Nov 2015",
  theme: "ticketmaster-yellow",
  size: { width: 2600, height: 924 },
  background: {
    type: "color" | "image" | "ai",
    color: "#F5D547",
    imageUrl: "data:image/...",
    opacity: 0.2,
    aiPrompt: "warm yellow paper, vintage ticket"
  },
  photoLayer: {
    imageUrl: null,
    opacity: 0.6,
    blendMode: "multiply"
  },
  fields: [
    {
      id: "f_eventName",
      role: "eventName",
      text: "BEIRUT",
      x: 1100, y: 380, width: 600,
      fontFamily: "Helvetica",
      fontSize: 96,
      fontWeight: 700,
      color: "#000",
      align: "center",
      rotation: 0,
      letterSpacing: 0,
      locked: false,
      zIndex: 5
    },
    // ... eventName, date, venue, address, section, row, seat, price,
    //     barcode, convenienceCharge, ticketNumber, etc.
  ],
  createdAt: 1730000000,
  updatedAt: 1730000000
}
```

The `role` field is the unlock — themes can target fields by role to apply consistent styling, and the AI prompt builder can read the event name to auto-fill the prompt.

---

## 6. Feature roadmap

### MVP (v2 — this session)
Three themes, click-to-edit fields, drag, background upload, export PNG, localStorage save/load, AI stub.

### v3 — "Real ticket maker"
- More templates (sports stub, boarding pass, movie ticket, festival wristband).
- Custom fonts (Google Fonts picker).
- Per-field styling sidebar (cleaner than per-block popovers).
- Undo/redo.
- Snap-to-grid + guides.
- Multi-select + group move.
- Ticket gallery (view all your saved tickets in a grid).

### v4 — "Real backgrounds"
- AI background generator wired to a real API (§7).
- "Style transfer" mode: upload a band photo, get a ticket designed around it.
- Background packs (paper textures, holographic, foil, vintage).

### v5 — "Make it a thing"
- PWA install + offline.
- Share sheet → social-ready PNG sizes.
- Capacitor wrap for app stores.
- Optional accounts + cloud sync (only if users ask).
- Print fulfillment partner integration (Moo, Vistaprint API) so users can order real laminated stubs.

---

## 7. AI background integration plan

The v2 prototype includes a stub function that you'll fill in. Here's the architecture:

**Provider options, ranked for this use case:**

1. **Replicate** — pay-per-image, lots of fine-tuned ticket/poster models, easy REST API. Recommended starting point. Cost: ~$0.01–0.05 per image.
2. **OpenAI Images (DALL-E 3 / gpt-image-1)** — cleaner API, higher quality for typography-friendly backgrounds, but more expensive (~$0.04–0.17 per image) and stricter content rules.
3. **Stable Diffusion via Stability AI API** — middle ground, good control over style.
4. **Self-host SDXL** — only worth it at scale.

**Pipeline:**

```
User clicks "Generate AI Background"
  → modal opens, pre-fills prompt from eventName + venue + theme
  → user edits prompt, clicks Generate
  → call your serverless function (Cloudflare Workers / Vercel Edge)
  → function calls Replicate, returns image URL
  → image loads into ticket as background, opacity slider visible
  → user can regenerate or accept
```

**Why a serverless function and not direct from browser:** API keys can't ship to the client. You need a tiny backend even in v2. Cloudflare Workers free tier is plenty. ~30 lines of code.

**Prompt engineering helper** (build into the app):

```
"{theme adjective} ticket stub background, themed around {eventName} at {venue},
 {mood from venue type}, subtle texture, no text, no people, leaves room
 for typography in the center"
```

Example: *"warm vintage paper ticket stub background, themed around Beirut at Stockton Company, intimate folk venue mood, subtle texture, no text, no people, leaves room for typography in the center"*

---

## 8. Mobile native path

Order of operations:

1. Make the v2 web app responsive (done).
2. Add a `manifest.json` and a basic service worker → installable PWA. ~1 day of work.
3. Add iOS-specific touches: status bar color, splash screen, share sheet via `navigator.share`.
4. When ready for stores: `npm install @capacitor/core @capacitor/ios @capacitor/android`, wrap the existing site, add native share + camera plugins. ~1–2 weeks to first build.
5. Ship to TestFlight + Play Internal Testing before public launch.

You do **not** need to rewrite anything to go native via Capacitor. The same HTML/CSS/JS runs in a WebView with native chrome around it.

---

## 9. Open questions for later

- **Pricing model.** Free with optional print fulfillment? Subscription for AI generations? One-time pro upgrade? Decide before v4.
- **User-generated content moderation.** If users can publish tickets to a gallery, you need basic content rules (no IP infringement on copyrighted artwork, no offensive imagery from AI gen). Punt until you ship a public gallery.
- **Print accuracy.** Real ticket stocks have specific colors, perforation, and barcode standards. If "order a real stub" becomes a feature, partner choice drives the export specs.
- **Brand name.** "TicketMasters.AI" in your file is too close to Ticketmaster — likely trademark trouble. "DubStubs" (matches your folder + Instagram) is safer and more distinctive.

---

## 10. Suggested next session

- Wire the AI background button to a real Replicate call (you need: a Replicate API key + a tiny Cloudflare Worker).
- Add three more templates (sports, flight, movie).
- Add undo/redo (small but huge UX win).
- Build the "My Tickets" gallery view.

---

*End of plan. The v2 prototype is in `dubstubs-v2.html`.*
