# DubStubs — AI Background Generation

Choosing a model, setting up Replicate, and the path to self-hosted compute.

---

## TL;DR

**Start with Flux Schnell on Replicate.** Apache 2.0 license, ~$0.003 per image, 1–2 second generation, runs on any modest GPU later if you self-host. It's the practical sweet spot.

When you outgrow Replicate's pricing or want full control, **swap to a self-hosted Flux Schnell or HiDream-I1 endpoint** on your own GPU or a rented RunPod box. The client code stays identical — only the server endpoint changes.

---

## 1. Open-source model options, ranked for ticket backgrounds

### Dense diffusion transformers (the standard)

| Model | Params | License | Quality | Speed | Why it fits |
|-------|--------|---------|---------|-------|-------------|
| **Flux.1 Schnell** | 12B | Apache 2.0 | Excellent | 1–4 steps, fastest | Commercial-friendly, Replicate-cheap, runs on a 4090 with quantization |
| **Flux.1 Dev** | 12B | Non-commercial | Best | 50 steps, slower | Highest quality but you can't ship it commercially without a license |
| **Stable Diffusion 3.5 Large** | 8B | Stability Community | Great | Medium | Solid all-rounder, well-documented |
| **PixArt-Σ** | 0.6B | OpenRAIL | Good | Very fast | Runs on weak GPUs, fine for textured backgrounds |

### Mixture-of-Experts diffusion (your specific ask)

| Model | Total / Active | License | Notes |
|-------|----------------|---------|-------|
| **HiDream-I1** | 17B / 8.5B | MIT | The main MoE image-gen model (late 2024 / early 2025). Excellent creative quality for atmospheric, unusual prompts — exactly what ticket backgrounds want. Available on Replicate. |

MoE in image generation is much rarer than in LLMs. HiDream-I1 is essentially the only mainstream open-weight MoE diffusion model right now. It activates a subset of experts per token, so inference cost is closer to an 8.5B dense model while quality matches a 17B one. Worth trying if you want maximum creative range.

### Why Flux Schnell wins for the start

- Ships under Apache 2.0 — you can run a paid commercial product on it.
- Replicate charges ~$0.003/image — $1 buys you 333 backgrounds.
- Runs on consumer GPUs (RTX 3090 / 4090 / 4500) with int8 quantization when you self-host later.
- Generation takes 1–2 seconds at 1024×768, fits a "click → see result" UX.

### When to consider HiDream-I1 over Flux

- Ticket prompts referencing unusual venues, surreal moods, abstract textures — HiDream's MoE routing handles these better.
- Slightly higher cost (~$0.012/image on Replicate) but still cheap.
- Same self-hosting story — needs ~24 GB VRAM with quantization.

---

## 2. The Replicate setup — step by step

This gets your AI button working in production within ~20 minutes. The serverless function holds your API key safely; the browser never sees it.

### Step 1 — Sign up and fund

1. Go to **[replicate.com](https://replicate.com)** → Sign up.
2. **Account → Billing** → add a card. $5 minimum. That's ~1,600 Flux Schnell generations.
3. **Account → API tokens** → click *Create token*. Name it something like `dubstubs-prod`. **Copy the token** (starts with `r8_…`). You'll only see it once.

### Step 2 — Pick a host and add the function

The function file goes in different folders depending on host:

- **Cloudflare Pages** → `functions/api/generate.js`
- **Vercel** → `api/generate.js`
- **Netlify** → `netlify/functions/generate.js`

**Cloudflare Pages function** (recommended):

```js
// functions/api/generate.js
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const prompt = (body?.prompt || '').toString().trim();

    if (!prompt || prompt.length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const r = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${context.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'   // synchronous — no polling needed
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-schnell',
        input: {
          prompt,
          aspect_ratio: '21:9',     // matches the ticket
          output_format: 'png',
          num_outputs: 1,
          num_inference_steps: 4
        }
      })
    });

    const data = await r.json();
    const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;

    return new Response(
      JSON.stringify({ imageUrl: imageUrl || null, error: data.error || null }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

To swap models later, just change the `version` string:

```js
version: 'prunaai/hidream-l1-fast'         // HiDream-I1
version: 'stability-ai/stable-diffusion-3.5-large'
version: 'black-forest-labs/flux-dev'
```

### Step 3 — Add the API token to Cloudflare

1. Cloudflare Dashboard → **Workers & Pages** → your project → **Settings → Environment variables**.
2. Add `REPLICATE_API_TOKEN` with your `r8_…` token. Mark it **encrypted**.
3. Save. Redeploy the project (push a commit or click Retry deployment).

For Vercel: **Settings → Environment Variables** → add the same name.
For Netlify: **Site settings → Environment variables** → same.

### Step 4 — Patch `index.html`

Find the existing `generateAiBackground()` stub in the script block. Replace its body with:

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

  // Inline the image as a data URL so it survives Save / Export / localStorage
  const blob = await (await fetch(imageUrl)).blob();
  return await new Promise(res => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(blob);
  });
}
```

Push the change. AI Background button now works.

### Step 5 — Test

1. Open the deployed site.
2. Click **Background → AI Background**.
3. Edit the prompt or accept the auto-fill.
4. Click **Generate**. You should see a real image, not the gradient stub.

Replicate's dashboard shows each prediction with its cost and latency — useful for monitoring.

---

## 3. Self-hosting (your own compute)

When you outgrow Replicate's pricing, or want offline / private generation:

### Hardware floor

| GPU | VRAM | What runs |
|-----|------|-----------|
| RTX 3060 12 GB | 12 GB | PixArt-Σ, SDXL with quantization |
| RTX 3090 / 4090 | 24 GB | Flux Schnell, SD3.5 Large, HiDream-I1 (quantized) |
| RTX 4500 / 4090 + offload | 24 GB | Comfortable Flux/HiDream |
| A6000 / A100 / H100 | 48 GB+ | Any model unquantized |

If you don't own a GPU yet, **rent one on RunPod or Vast.ai** — about $0.30–0.40/hr for a 4090. You can spin up an instance, run inference for an hour, shut it down. ~$0.0001/image at full GPU utilization.

### Stack options

- **ComfyUI** — node-based UI, fastest path to "running models." Has an HTTP API mode.
- **🤗 diffusers** (Python) — for embedding into a custom server.
- **Replicate Cog** — lets you wrap your own model in the same API your function expects, then host it anywhere.
- **vLLM / TensorRT-LLM** — for production-scale inference.

### The migration from Replicate to self-hosted

The beautiful part: **the client code never changes**. The serverless function's `fetch('/api/generate')` URL stays the same. You just swap what's behind it:

```js
// Replicate (today)
const r = await fetch('https://api.replicate.com/v1/predictions', {...});

// Your self-hosted endpoint (later)
const r = await fetch('https://your-gpu-box.com/sdapi/v1/txt2img', {...});
```

So shipping on Replicate now and migrating to your own compute later is a **one-file change**, no client code touched.

---

## 4. Cost rough math

For 1,000 images generated:

| Path | Cost |
|------|------|
| Replicate Flux Schnell | $3 |
| Replicate HiDream-I1 | $12 |
| Replicate Flux Dev | $25 |
| Replicate SDXL | $1.20 |
| RunPod 4090 (1 sec/img) | $0.10 |
| Your own 4090 at home | electricity: ~$0.30 |

Replicate wins until you're doing thousands of images per day. Self-hosting wins at scale and gives you offline / private capability.

---

## 5. Recommendation for DubStubs

1. **Today:** Replicate + Flux Schnell. Cheapest, fastest, commercial-OK license. Ship it.
2. **In 3 months** when you have real users: optionally try HiDream-I1 as an A/B test. Same wiring, swap the version string.
3. **At 10k+ users / month** when Replicate bills get noisy: self-host Flux Schnell on a rented or owned 4090 with ComfyUI's API. Same client code; different `/api/generate` backend.
4. **Bonus** when you want differentiation: fine-tune Flux Schnell on your hand-designed tickets so the AI "knows" the DubStubs aesthetic. ~$50 of training compute on Replicate. The model becomes yours to host.

---

## 6. Prompt-engineering tips for ticket backgrounds

The current `generateAiBackground` builds the prompt automatically from event name + venue + theme. To get better results, tweak the helper template:

```
"{theme adjective} ticket stub background, themed around {eventName} at {venue},
 {mood from venue}, subtle paper texture, no text, no people, leaves room
 for typography in the center, photorealistic OR illustrated style"
```

Negative prompts (Flux doesn't use them, but SDXL/SD3.5 do):

```
"text, letters, faces, people, watermark, signature, busy detail, sharp lines"
```

Models like to obey these instructions for backgrounds: *no people, no text, atmospheric, textured*. Your prompt template already nails this.

---

*This guide is a companion to `dubstubs-deploy.md` — that one shows you how to deploy the static site; this one shows you how to wire AI behind it.*
