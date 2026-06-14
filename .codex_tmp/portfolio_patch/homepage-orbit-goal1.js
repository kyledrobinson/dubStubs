(function () {
  const MOTION_STORAGE_KEY = "homepage-orbit-goal1-motion-stopped";
  const DISPLAY_STORAGE_KEY = "portfolio-display-mode";
  start();

  function start() {
  const bubblesRoot = document.getElementById("bubbles");
  const shell = document.querySelector(".homepage-shell");
  const layoutToggle = document.querySelector(".layout-toggle");
  const motionToggle = document.querySelector(".motion-toggle");
  let profilePanel = null;
  let cards = [];
  let profileTags = [];
  let previewAutoAdvance = null;
  let previewAutoCard = null;
  let sceneBooted = false;

  const previewLibrary = {
    "unclaimed-remains-brochure": [
      { label: "Spread 01", title: "Front-cover framing", copy: "Lead with the public-facing title block and a calmer evidence field before details stack up.", medium: "Print preview", meta: "Tone / Clear public guidance" },
      { label: "Spread 02", title: "Service-map panel", copy: "Diagram the route through the brochure so the information feels guided instead of merely listed.", medium: "Info system", meta: "Focus / Sequence and readability" },
      { label: "Spread 03", title: "Typeface proof", copy: "Balance authority and care with serif emphasis up top and quieter body copy below.", medium: "Type study", meta: "Proof / Editorial restraint" }
    ],
    "bloor-street-dart-league": [
      { label: "Identity 01", title: "League-mark pressure", copy: "Push the emblem like a neighborhood badge with poster energy instead of polished corporate calm.", medium: "Logo preview", meta: "Mood / Local and competitive" },
      { label: "Identity 02", title: "Poster crop", copy: "Show the mark inside bold event framing so the system implies flyers, brackets, and game nights.", medium: "Campaign mock", meta: "Use / Events and print" },
      { label: "Identity 03", title: "Color lane", copy: "Rotate through darker field colors and sharp accent glows to keep the identity loud without getting muddy.", medium: "Palette test", meta: "Signal / Edge-lit contrast" }
    ],
    "google-reviews": [
      { label: "Reach 01", title: "Visibility snapshot", copy: "Frame the project around traction, image performance, and local search presence before the details land.", medium: "Dashboard still", meta: "Theme / Proof of impact" },
      { label: "Reach 02", title: "Map-result story", copy: "Turn review performance into a narrative about discoverability instead of a loose metrics collage.", medium: "Info panel", meta: "Read / Practical business value" },
      { label: "Reach 03", title: "Image cue", copy: "Use supporting imagery as evidence that visual upkeep helped the listing feel active and credible.", medium: "Photo sample", meta: "Support / Listing confidence" }
    ],
    "ziggys-rotor-logo": [
      { label: "Mark 01", title: "Rotor silhouette", copy: "Treat the symbol like moving hardware with enough attitude to survive signage, merch, and social crops.", medium: "Vector mark", meta: "Intent / Mechanical energy" },
      { label: "Mark 02", title: "Application crop", copy: "Preview the logo in a real use case so the mark feels branded, not just drawn.", medium: "Mock application", meta: "Use / Poster and banner" },
      { label: "Mark 03", title: "Construction note", copy: "Include one quieter frame showing how the geometry locks together under the louder presentation.", medium: "Build note", meta: "Proof / Structured craft" }
    ],
    "motion-studies": [
      { label: "Motion 01", title: "Interaction pass", copy: "Show how hover, drag, and pacing experiments can feel atmospheric without slipping into noise.", medium: "CSS study", meta: "System / Motion language" },
      { label: "Motion 02", title: "Frame sequence", copy: "Use a compact slide to suggest how transitions behave across states, not just in isolated demos.", medium: "Sequence strip", meta: "Read / Tempo and clarity" },
      { label: "Motion 03", title: "Component rehearsal", copy: "Preview one polished fragment that could later become a reusable portfolio interaction pattern.", medium: "Prototype card", meta: "Potential / Shippable fragment" }
    ],
    "material-experiments": [
      { label: "Lab 01", title: "Surface render", copy: "Cycle through texture, shadow, and gloss ideas the same way a material board would in a studio review.", medium: "3D still", meta: "Focus / Texture and light" },
      { label: "Lab 02", title: "Model detail", copy: "Use close crops and sparse notes to tease 3D work before the user commits to the longer project view.", medium: "Model preview", meta: "Bridge / Orbit to case study" },
      { label: "Lab 03", title: "Interface fragment", copy: "Mix object thinking with interface composition so the lab reads like future product language, not leftovers.", medium: "Hybrid proof", meta: "Direction / Web-ready 3D cues" }
    ]
  };

  if (!bubblesRoot) {
    document.documentElement.classList.remove("orbit-preload");
    return;
  }

  const circles = [
    { gradient: "wavyGradient1", r: 210, speed: -0.035, ox: 0.16, oy: 0.24, amp: 8, freq: 3 },
    { gradient: "wavyGradient2", r: 165, speed: -0.06, ox: 0.76, oy: 0.3, amp: 12, freq: 4 },
    { gradient: "wavyGradient3", r: 250, speed: -0.012, ox: 0.44, oy: 0.67, amp: 10, freq: 3 },
    { gradient: "wavyGradient4", r: 195, speed: -0.028, ox: 0.66, oy: 0.82, amp: 9, freq: 5 }
  ];
  const points = 360;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let pointer = null;
  let bubbleInstances = [];
  const motionState = {
    orbitEnabled: false,
    hoveredCard: null,
    lastTimestamp: performance.now(),
    angle: -Math.PI / 2,
    cardOrder: cards.map((_, index) => index),
    drag: null,
    energy: 0,
    targetEnergy: 0,
    cardMasses: [],
    activeCategory: null,
    motionStopped: readMotionPreference(),
    displayMode: readDisplayMode()
  };

  const previewState = {
    activeCardIndex: 0,
    activeSlideIndexByCard: new Map()
  };

  function resizeViewport() {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getPreviewImage(sample) {
    return String(sample.image || sample.imageUrl || sample.img || sample.src || sample.thumbnail || sample.thumb || "").trim();
  }

  class BubbleField {
    constructor(config) {
      this.config = config;
      this.cx = width * config.ox;
      this.cy = height * config.oy;
      this.r = config.r;
      this.phase = Math.random() * Math.PI * 2;
      this.mouseInfl = 0;
      this.node = document.createElement("div");
      this.node.className = "circle-bubble";
      this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this.svg.setAttribute("width", width);
      this.svg.setAttribute("height", height);
      this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.path.classList.add("bubble-path");
      this.path.setAttribute("stroke", `url(#${config.gradient})`);
      this.svg.appendChild(this.path);
      this.node.appendChild(this.svg);
      bubblesRoot.appendChild(this.node);
    }

    draw(time, energy, cardMasses) {
      const drift = Math.sin(time * this.config.speed * 0.08 + this.phase) * 0.75;
      this.cx += Math.cos(this.phase) * 0.02 + drift * 0.18;
      this.cy += Math.sin(this.phase) * 0.014 + drift * 0.12;

      if (this.cx < -this.r) this.cx = width + this.r;
      if (this.cx > width + this.r) this.cx = -this.r;
      if (this.cy < -this.r) this.cy = height + this.r;
      if (this.cy > height + this.r) this.cy = -this.r;

      let distance = Number.MAX_SAFE_INTEGER;
      let pointerAngle = 0;
      if (pointer) {
        distance = Math.hypot(pointer.x - this.cx, pointer.y - this.cy);
        pointerAngle = Math.atan2(pointer.y - this.cy, pointer.x - this.cx);
      }

      const influence = distance < this.r * 1.45 ? Math.max(0, 1 - distance / (this.r * 1.55)) : 0;
      this.mouseInfl += (influence - this.mouseInfl) * 0.16;

      let dominantMass = null;
      let dominantStrength = 0;
      for (const mass of cardMasses) {
        const dx = mass.x - this.cx;
        const dy = mass.y - this.cy;
        const dist = Math.hypot(dx, dy) || 1;
        const strength = Math.max(0, 1 - dist / (this.r + 260)) * mass.weight;
        if (strength > dominantStrength) {
          dominantStrength = strength;
          dominantMass = { angle: Math.atan2(dy, dx), strength };
        }
      }

      const fieldInfl = dominantMass ? dominantMass.strength * (0.3 + energy * 0.9) : 0;

      const coords = [];
      for (let index = 0; index < points; index += 1) {
        const angle = (Math.PI * 2 * index) / points;
        const morph = Math.sin(time * 0.06 + this.phase + angle * this.config.freq) * this.config.amp;
        const angleDelta = normalizeAngle(angle - pointerAngle);
        const mouseMorph = Math.exp(-(angleDelta * angleDelta) / 0.55) * this.mouseInfl * this.r * 0.15;
        const fieldAngleDelta = dominantMass ? normalizeAngle(angle - dominantMass.angle) : 0;
        const fieldMorph = dominantMass
          ? Math.exp(-(fieldAngleDelta * fieldAngleDelta) / 0.8) * fieldInfl * this.r * 0.14 * Math.sin(time * 0.9 + angle * 3.2)
          : 0;
        const radius = this.r + morph + mouseMorph + fieldMorph + energy * this.r * 0.02;
        coords.push([this.cx + radius * Math.cos(angle), this.cy + radius * Math.sin(angle)]);
      }

      let d = "";
      coords.forEach((point, index) => {
        d += `${index === 0 ? "M" : "L"}${point[0]},${point[1]}`;
      });
      d += "Z";
      this.path.setAttribute("d", d);
    }
  }

  function normalizeAngle(delta) {
    let value = delta;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
  }

  function initBubbles() {
    bubblesRoot.innerHTML = "";
    bubbleInstances = [];
    resizeViewport();
    if (isDayMode()) {
      return;
    }
    circles.forEach((config) => {
      bubbleInstances.push(new BubbleField(config));
    });
  }

  function decorateCard(card, index) {
    const baseHue = Number(card.dataset.hueBase || 188 + index * 8);
    const hueRange = Number(card.dataset.hueRange || 16);
    card.style.setProperty("--card-hue-base", `${baseHue}`);
    card.style.setProperty("--card-hue-range", `${hueRange}`);
    card.style.setProperty("--glow-shift", `${baseHue}`);
  }

  function getCardProjectSlug(card) {
    const link = card.querySelector(".card-link");
    const href = link ? link.getAttribute("href") || "" : "";
    const match = href.match(/[?&]project=([^&#]+)/i);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    const title = card.querySelector("h2");
    return slugify(title ? title.textContent : "project");
  }

  function buildFallbackSamples(card) {
    const title = card.querySelector("h2")?.textContent?.trim() || "Project";
    const copy = card.querySelector(".card-copy")?.textContent?.trim() || "";
    const label = card.querySelector(".card-label")?.textContent?.trim() || "Project";
    const badges = Array.from(card.querySelectorAll(".card-badge span:last-child")).map((node) => node.textContent.trim()).filter(Boolean);
    const badgeLine = badges.length ? badges.join(" / ") : "Preview";

    return [
      { label: `${label} cue`, title: `${title} overview`, copy, medium: "Project preview", meta: `Lane / ${badgeLine}` },
      { label: "Detail lane", title: `${title} proof surface`, copy: `Rotate stills, process crops, or a short story beat here before the full case study opens.`, medium: "Media slot", meta: `Module / Dot-driven preview` },
      { label: "Bridge frame", title: `${title} next step`, copy: `Use this space for one more convincing cue that makes the View Project click feel earned.`, medium: "Bridge cue", meta: `CTA / Preview to full page` }
    ];
  }

  function getPreviewSamples(card) {
    if (card.dataset.previewSamples) {
      try {
        const parsed = JSON.parse(card.dataset.previewSamples);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed;
        }
      } catch (error) {
        // Fall through to slug-based or generated samples.
      }
    }

    const slug = getCardProjectSlug(card);
    return previewLibrary[slug] || buildFallbackSamples(card);
  }

  function normalizePreviewIndex(index, total) {
    if (!total) return 0;
    return ((index % total) + total) % total;
  }

  function getWrappedOffset(index, activeIndex, total) {
    let offset = index - activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  }

  function ensureCardPreview(card) {
    if (card.querySelector(".card-preview")) {
      return;
    }

    const link = card.querySelector(".card-link");
    const preview = document.createElement("section");
    preview.className = "card-preview";
    preview.setAttribute("aria-label", "Project preview");
    preview.innerHTML = `
      <div class="card-preview__stage" data-card-preview-stage></div>
      <div class="card-preview__dots" data-card-preview-dots aria-label="Project preview slides"></div>
    `;

    if (link) {
      card.insertBefore(preview, link);
    } else {
      card.appendChild(preview);
    }

    const previewStage = preview.querySelector("[data-card-preview-stage]");
    const previewDots = preview.querySelector("[data-card-preview-dots]");

    if (previewStage) {
      previewStage.setAttribute("tabindex", "0");
      previewStage.setAttribute("role", "button");
      previewStage.setAttribute("aria-label", "Advance project preview");
      previewStage.addEventListener("click", () => {
        nextPreviewSlide(card, 1);
      });
      previewStage.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          nextPreviewSlide(card, 1);
        }
      });
    }

    if (previewDots) {
      previewDots.addEventListener("click", (event) => {
        if (event.target.closest(".card-preview__dot")) {
          return;
        }
        nextPreviewSlide(card, 1);
      });
    }
  }

  function nextPreviewSlide(card, step = 1) {
    if (!card) {
      return;
    }

    const samples = getPreviewSamples(card);
    if (!samples.length) {
      return;
    }

    const currentIndex = previewState.activeSlideIndexByCard.get(card) || 0;
    previewState.activeSlideIndexByCard.set(card, normalizePreviewIndex(currentIndex + step, samples.length));
    previewState.activeCardIndex = cards.indexOf(card);
    renderPreviewCarousel(card);
    restartPreviewAutoplay(card);
  }

  function restartPreviewAutoplay(card = cards[previewState.activeCardIndex]) {
    if (previewAutoAdvance) {
      window.clearInterval(previewAutoAdvance);
      previewAutoAdvance = null;
    }
    previewAutoCard = null;

    if (motionState.motionStopped || isDayMode() || !card) {
      return;
    }

    const samples = getPreviewSamples(card);
    if (samples.length <= 1) {
      return;
    }

    previewAutoCard = card;
    previewAutoAdvance = window.setInterval(() => {
      const currentIndex = previewState.activeSlideIndexByCard.get(card) || 0;
      previewState.activeSlideIndexByCard.set(card, normalizePreviewIndex(currentIndex + 1, samples.length));
      renderPreviewCarousel(card);
    }, 4200);
  }

  function setActiveProject(index, options = {}) {
    if (!cards.length) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(cards.length - 1, index));
    const cardChanged = previewState.activeCardIndex !== clampedIndex;
    previewState.activeCardIndex = clampedIndex;
    const activeCard = cards[clampedIndex];
    if (cardChanged || options.resetSlide) {
      previewState.activeSlideIndexByCard.set(activeCard, 0);
    }
    renderPreviewCarousel(activeCard);
    restartPreviewAutoplay(activeCard);
  }

  function renderPreviewCarousel(card) {
    const targetCard = card || cards[previewState.activeCardIndex];
    if (!targetCard) {
      return;
    }

    const previewStage = targetCard.querySelector("[data-card-preview-stage]");
    const previewDots = targetCard.querySelector("[data-card-preview-dots]");
    if (!previewStage || !previewDots) {
      return;
    }

    const samples = getPreviewSamples(targetCard);
    const total = samples.length;
    const activeIndex = normalizePreviewIndex(previewState.activeSlideIndexByCard.get(targetCard) || 0, total);
    previewState.activeSlideIndexByCard.set(targetCard, activeIndex);

    const title = targetCard.querySelector("h2")?.textContent?.trim() || "Project";
    const label = targetCard.querySelector(".card-label")?.textContent?.trim() || "Project";
    const baseHue = Number(targetCard.dataset.hueBase || 188);

    previewStage.innerHTML = "";
    previewDots.innerHTML = "";

    samples.forEach((sample, index) => {
      const offset = getWrappedOffset(index, activeIndex, total);
      const absOffset = Math.abs(offset);
      const slide = document.createElement("article");
      slide.className = `card-preview__slide${offset === 0 ? " is-active" : ""}`;
      slide.style.setProperty("--preview-hue", `${baseHue + index * 8}`);
      slide.style.setProperty("--preview-x", `${offset * 50}%`);
      slide.style.setProperty("--preview-y", `${absOffset * 7}px`);
      slide.style.setProperty("--preview-scale", `${(1 - Math.min(absOffset, 2) * 0.14).toFixed(3)}`);
      slide.style.setProperty("--preview-rotate-y", `${offset * -16}deg`);
      slide.style.setProperty("--preview-tilt", `${offset * -1.6}deg`);
      slide.style.setProperty("--preview-opacity", `${Math.max(0, 1 - absOffset * 0.34).toFixed(3)}`);
      slide.style.setProperty("--preview-z", `${40 - absOffset}`);
      slide.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
      const imageUrl = getPreviewImage(sample);
      const mediaLabel = escapeHtml(sample.medium || "Preview");
      const imageMarkup = imageUrl
        ? `<img class="card-preview__image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async">`
        : "";

      slide.innerHTML = `
        <div class="card-preview__media${imageUrl ? " has-image" : ""}">
          ${imageMarkup}
          <span class="card-preview__media-badge">${mediaLabel}</span>
        </div>
        <div class="card-preview__body">
          <p class="card-preview__label">${escapeHtml(sample.label || "Preview")}</p>
          <p class="card-preview__title">${escapeHtml(sample.title || title)}</p>
          <p class="card-preview__copy">${escapeHtml(sample.copy || "")}</p>
          <p class="card-preview__meta">${escapeHtml(sample.meta || label)}</p>
        </div>
      `;
      previewStage.appendChild(slide);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `card-preview__dot${index === activeIndex ? " is-active" : ""}`;
      dot.style.setProperty("--preview-dot-hue", `${baseHue + index * 8}`);
      dot.setAttribute("aria-label", `Show preview ${index + 1} for ${title}`);
      dot.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");
      dot.addEventListener("click", () => {
        previewState.activeSlideIndexByCard.set(targetCard, index);
        previewState.activeCardIndex = cards.indexOf(targetCard);
        renderPreviewCarousel(targetCard);
        restartPreviewAutoplay(targetCard);
      });
      previewDots.appendChild(dot);
    });
  }

  function syncSceneElements() {
    profilePanel = document.querySelector(".profile-panel");
    cards = Array.from(document.querySelectorAll(".project-card"));
    profileTags = Array.from(document.querySelectorAll(".profile-tag"));
    previewState.activeSlideIndexByCard = new Map();
    motionState.cardOrder = cards.map((_, index) => index);

    cards.forEach((card, index) => {
      decorateCard(card, index);
      ensureCardPreview(card);
      renderPreviewCarousel(card);
      if (!card.dataset.orbitBound) {
        bindCardInteractions(card, index);
        card.dataset.orbitBound = "true";
      }
    });

    profileTags.forEach((tag) => {
      if (!tag.dataset.filterBound) {
        bindCategoryFilter(tag);
        tag.dataset.filterBound = "true";
      }
    });

    applyCategoryFilter(motionState.activeCategory);
    setOrbitEnabled();
    setActiveProject(Math.min(previewState.activeCardIndex, Math.max(0, cards.length - 1)), { resetSlide: true });
    renderFrame(performance.now(), !motionState.motionStopped);
  }

  function setOrbitEnabled() {
    motionState.orbitEnabled = !!(
      shell &&
      profilePanel &&
      cards.length &&
      !isDayMode() &&
      window.innerWidth > 980
    );
    motionState.lastTimestamp = performance.now();
    if (shell) {
      shell.classList.toggle("is-orbit-active", motionState.orbitEnabled);
    }
    if (!motionState.orbitEnabled) {
      cards.forEach((card) => {
        card.style.setProperty("--card-x", "0px");
        card.style.setProperty("--card-y", "0px");
        card.style.setProperty("--card-scale", "1");
        card.style.setProperty("--card-tilt", "0deg");
        card.style.setProperty("--card-opacity", "1");
        card.style.setProperty("--card-z", "1");
        card.style.removeProperty("--glow-shift");
        card.classList.remove("is-paused");
        card.classList.remove("is-dragging");
      });
      motionState.hoveredCard = null;
      motionState.drag = null;
      motionState.energy = 0;
      motionState.targetEnergy = 0;
      motionState.cardMasses = [];
      document.documentElement.style.setProperty("--orbit-energy", `${motionState.energy.toFixed(3)}`);
    }
  }

  function readMotionPreference() {
    try {
      return window.localStorage.getItem(MOTION_STORAGE_KEY) === "true";
    } catch (error) {
      return false;
    }
  }

  function writeMotionPreference(stopped) {
    try {
      window.localStorage.setItem(MOTION_STORAGE_KEY, stopped ? "true" : "false");
    } catch (error) {
      // Ignore storage issues and keep the in-memory toggle working.
    }
  }

  function readDisplayMode() {
    try {
      return window.localStorage.getItem(DISPLAY_STORAGE_KEY) === "day" ? "day" : "orbit";
    } catch (error) {
      return "orbit";
    }
  }

  function writeDisplayMode(mode) {
    try {
      window.localStorage.setItem(DISPLAY_STORAGE_KEY, mode);
    } catch (error) {
      // Ignore storage issues and keep the visible toggle working.
    }
  }

  function isDayMode() {
    return motionState.displayMode === "day";
  }

  function updateMotionToggleUi() {
    if (!motionToggle) {
      return;
    }

    const stopped = motionState.motionStopped;
    motionToggle.textContent = stopped ? "Resume Motion" : "Stop Motion";
    motionToggle.setAttribute("aria-pressed", stopped ? "true" : "false");
    motionToggle.classList.toggle("is-stopped", stopped);
  }

  function updateLayoutModeUi() {
    if (!layoutToggle) {
      return;
    }

    const dayMode = isDayMode();
    layoutToggle.textContent = dayMode ? "Orbit Mode" : "Day Mode";
    layoutToggle.setAttribute("aria-pressed", dayMode ? "true" : "false");
    layoutToggle.setAttribute("aria-label", dayMode ? "Switch to orbit mode" : "Switch to day timeline mode");
    layoutToggle.classList.toggle("is-day-mode", dayMode);
  }

  function setDisplayMode(mode) {
    motionState.displayMode = mode === "day" ? "day" : "orbit";
    document.documentElement.dataset.displayMode = motionState.displayMode;
    writeDisplayMode(motionState.displayMode);
    updateLayoutModeUi();
    initBubbles();
    setOrbitEnabled();
    restartPreviewAutoplay();
    renderFrame(performance.now(), !motionState.motionStopped && !isDayMode());
  }

  function setMotionStopped(stopped) {
    motionState.motionStopped = stopped;
    motionState.lastTimestamp = performance.now();
    writeMotionPreference(stopped);
    updateMotionToggleUi();
    restartPreviewAutoplay();
    renderFrame(performance.now(), !stopped && !isDayMode());
  }

  function bindCardInteractions(card, index) {
    const pause = () => {
      if (motionState.drag && motionState.drag.card === card) {
        return;
      }
      motionState.hoveredCard = card;
      card.classList.add("is-paused");
      setActiveProject(index);
    };
    const resume = () => {
      if (motionState.hoveredCard === card) {
        motionState.hoveredCard = null;
      }
      card.classList.remove("is-paused");
    };

    card.addEventListener("mouseenter", pause);
    card.addEventListener("focusin", pause);
    card.addEventListener("mouseleave", resume);
    card.addEventListener("focusout", resume);
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        return;
      }
      setActiveProject(index);
    });

    card.addEventListener("pointerdown", (event) => {
      if (!motionState.orbitEnabled || event.button !== 0 || event.target.closest("a")) {
        return;
      }

      const shellRect = shell.getBoundingClientRect();
      const rect = card.getBoundingClientRect();
      motionState.drag = {
        card,
        cardIndex: index,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        moved: false
      };
      motionState.hoveredCard = card;
      card.classList.add("is-paused");
      card.classList.add("is-dragging");
      card.setPointerCapture(event.pointerId);
      event.preventDefault();

      const translateX = event.clientX - shellRect.left - motionState.drag.offsetX - shellRect.width / 2;
      const translateY = event.clientY - shellRect.top - motionState.drag.offsetY - shellRect.height / 2;
      card.style.setProperty("--card-x", `${translateX.toFixed(2)}px`);
      card.style.setProperty("--card-y", `${translateY.toFixed(2)}px`);
      card.style.setProperty("--card-scale", "1.03");
      card.style.setProperty("--card-tilt", "0deg");
      card.style.setProperty("--card-opacity", "1");
      card.style.setProperty("--card-z", "80");
    });
  }

  function applyCategoryFilter(category) {
    motionState.activeCategory = category;
    profileTags.forEach((tag) => {
      const active = category && tag.dataset.category === category;
      tag.classList.toggle("is-active", active);
      tag.setAttribute("aria-pressed", active ? "true" : "false");
    });

    cards.forEach((card) => {
      const categories = (card.dataset.categories || "").split(/\s+/).filter(Boolean);
      const matches = !category || categories.includes(category);
      card.classList.toggle("is-filter-match", !!category && matches);
      card.classList.toggle("is-filter-dimmed", !!category && !matches);
    });
  }

  function bindCategoryFilter(tag) {
    tag.setAttribute("aria-pressed", "false");
    tag.addEventListener("click", () => {
      const nextCategory = motionState.activeCategory === tag.dataset.category ? null : tag.dataset.category;
      applyCategoryFilter(nextCategory);
    });
  }

  function handlePointerMove(event) {
    if (motionState.drag && motionState.drag.pointerId === event.pointerId && shell) {
      const drag = motionState.drag;
      const shellRect = shell.getBoundingClientRect();
      const translateX = event.clientX - shellRect.left - drag.offsetX - shellRect.width / 2;
      const translateY = event.clientY - shellRect.top - drag.offsetY - shellRect.height / 2;
      const moveDistance = Math.hypot(translateX, translateY);
      const baseHue = Number(drag.card.dataset.hueBase || 188);
      const hueRange = Number(drag.card.dataset.hueRange || 16);
      const glowShift = baseHue + Math.sin(event.clientX * 0.01) * (hueRange * 0.95) + Math.cos(event.clientY * 0.01) * (hueRange * 0.45);

      drag.moved = drag.moved || moveDistance > 12;
      drag.card.style.setProperty("--card-x", `${translateX.toFixed(2)}px`);
      drag.card.style.setProperty("--card-y", `${translateY.toFixed(2)}px`);
      drag.card.style.setProperty("--card-scale", "1.04");
      drag.card.style.setProperty("--card-tilt", `${(translateX * 0.01).toFixed(2)}deg`);
      drag.card.style.setProperty("--card-opacity", "1");
      drag.card.style.setProperty("--card-z", "80");
      drag.card.style.setProperty("--glow-shift", glowShift.toFixed(2));
      drag.card.style.setProperty("--glow-alpha", "0.28");
    }
  }

  function commitDraggedPlacement(drag, pointerX, pointerY) {
    if (!shell || !profilePanel) {
      return;
    }

    const shellRect = shell.getBoundingClientRect();
    const profileRect = profilePanel.getBoundingClientRect();
    const centerX = profileRect.left - shellRect.left + profileRect.width / 2;
    const centerY = profileRect.top - shellRect.top + profileRect.height / 2;
    const angle = Math.atan2(pointerY - shellRect.top - centerY, pointerX - shellRect.left - centerX);

    const slots = motionState.cardOrder.map((cardIndex, slotIndex) => ({
      cardIndex,
      slotIndex,
      angle: motionState.angle + (Math.PI * 2 * slotIndex) / cards.length
    }));

    let nearestSlot = 0;
    let nearestDistance = Number.MAX_SAFE_INTEGER;
    slots.forEach((slot) => {
      const delta = Math.abs(normalizeAngle(angle - slot.angle));
      if (delta < nearestDistance) {
        nearestDistance = delta;
        nearestSlot = slot.slotIndex;
      }
    });

    const oldSlot = motionState.cardOrder.indexOf(drag.cardIndex);
    if (oldSlot === -1 || oldSlot === nearestSlot) {
      return;
    }

    const nextOrder = motionState.cardOrder.slice();
    nextOrder.splice(oldSlot, 1);
    nextOrder.splice(nearestSlot, 0, drag.cardIndex);
    motionState.cardOrder = nextOrder;
  }

  function handlePointerUp(event) {
    if (!motionState.drag || motionState.drag.pointerId !== event.pointerId) {
      return;
    }

    const drag = motionState.drag;
    if (drag.card.hasPointerCapture(event.pointerId)) {
      drag.card.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      commitDraggedPlacement(drag, event.clientX, event.clientY);
    }

    drag.card.classList.remove("is-dragging");
    drag.card.classList.remove("is-paused");
    motionState.drag = null;
    if (motionState.hoveredCard === drag.card) {
      motionState.hoveredCard = null;
    }
  }

  function handleWheel(event) {
    if (!motionState.orbitEnabled || motionState.motionStopped || motionState.hoveredCard || motionState.drag) {
      return;
    }

    const shellRect = shell.getBoundingClientRect();
    const shellInView = shellRect.bottom > 0 && shellRect.top < window.innerHeight;
    if (!shellInView) {
      return;
    }

    event.preventDefault();
    const boost = Math.min(0.26, Math.abs(event.deltaY) * 0.00034);
    motionState.targetEnergy = Math.min(1, motionState.targetEnergy + boost);
  }

  function layoutOrbit(timeSeconds, shouldAnimate) {
    if (!motionState.orbitEnabled || !shell || !profilePanel || !cards.length) {
      return;
    }

    const now = performance.now();
    const delta = shouldAnimate ? Math.min(0.03, (now - motionState.lastTimestamp) / 1000) : 0;
    motionState.lastTimestamp = now;
    motionState.targetEnergy = Math.max(0, motionState.targetEnergy - delta * (motionState.hoveredCard ? 0.45 : 0.22));
    if (shouldAnimate) {
      motionState.energy += (motionState.targetEnergy - motionState.energy) * Math.min(1, delta * 7.5);
    }
    document.documentElement.style.setProperty("--orbit-energy", motionState.energy.toFixed(3));

    if (shouldAnimate && !motionState.hoveredCard && !motionState.drag) {
      motionState.angle += delta * (0.09 + motionState.energy * 0.26);
    }

    const shellRect = shell.getBoundingClientRect();
    const profileRect = profilePanel.getBoundingClientRect();
    const centerX = profileRect.left - shellRect.left + profileRect.width / 2;
    const centerY = profileRect.top - shellRect.top + profileRect.height / 2;
    const orbitX = Math.min(560, Math.max(322, shellRect.width * (0.382 + motionState.energy * 0.11)));
    const orbitY = Math.min(468, Math.max(276, shellRect.height * (0.355 + motionState.energy * 0.095)));
    motionState.cardMasses = [];

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const frozen = motionState.hoveredCard === card;
      const dragging = motionState.drag && motionState.drag.card === card;

      if (frozen || dragging) {
        return;
      }

      const slotIndex = motionState.cardOrder.indexOf(index);
      const orbitAngle = motionState.angle + (Math.PI * 2 * slotIndex) / cards.length;
      const wobbleX = 16 + motionState.energy * 16;
      const wobbleY = 14 + motionState.energy * 12;
      const radiusX = orbitX + Math.sin(timeSeconds * 0.92 + index * 0.6) * wobbleX;
      const radiusY = orbitY + Math.cos(timeSeconds * 0.74 + index * 0.45) * wobbleY;
      const x = centerX + Math.cos(orbitAngle) * radiusX - rect.width / 2;
      const y = centerY + Math.sin(orbitAngle) * radiusY - rect.height / 2;
      const depth = (Math.sin(orbitAngle) + 1) / 2;
      const floatLift = Math.sin(timeSeconds * 1.18 + index * 0.72) * (11 + motionState.energy * 10);
      const drift = Math.cos(timeSeconds * 0.83 + index * 0.54) * (8 + motionState.energy * 12) + Math.sin(timeSeconds * 1.6 + index) * (3 + motionState.energy * 4);
      const organicShift = Math.sin(timeSeconds * 1.08 + index * 0.3) * (6 + motionState.energy * 8);
      const scale = 0.84 + depth * 0.22 + motionState.energy * 0.04;
      const tilt = Math.cos(orbitAngle) * (4.2 + motionState.energy * 6) + Math.sin(timeSeconds * 1.22 + index * 0.4) * (1.4 + motionState.energy * 2.8);
      const opacity = 0.62 + depth * 0.38;
      const baseHue = Number(card.dataset.hueBase || 188);
      const hueRange = Number(card.dataset.hueRange || 16);
      const glowShift = baseHue + Math.cos(orbitAngle) * (hueRange + motionState.energy * 9) + Math.sin(timeSeconds * 1.1 + index) * (hueRange * 0.45 + motionState.energy * 6);

      card.style.setProperty("--card-x", `${(x - shellRect.width / 2 + drift + organicShift).toFixed(2)}px`);
      card.style.setProperty("--card-y", `${(y - shellRect.height / 2 + floatLift).toFixed(2)}px`);
      card.style.setProperty("--card-scale", scale.toFixed(3));
      card.style.setProperty("--card-tilt", `${tilt.toFixed(2)}deg`);
      card.style.setProperty("--card-opacity", opacity.toFixed(3));
      card.style.setProperty("--card-z", `${Math.round(12 + depth * 28)}`);
      card.style.setProperty("--glow-shift", glowShift.toFixed(2));
      card.style.setProperty("--glow-alpha", (0.12 + depth * 0.1 + motionState.energy * 0.09).toFixed(3));

      motionState.cardMasses.push({
        x: shellRect.left + centerX + Math.cos(orbitAngle) * radiusX,
        y: shellRect.top + centerY + Math.sin(orbitAngle) * radiusY,
        weight: 0.3 + depth * 0.4 + motionState.energy * 0.45
      });
    });
  }

  function renderFrame(raw, shouldAnimate) {
    if (isDayMode()) {
      return;
    }
    const time = raw * 0.0009;
    layoutOrbit(raw * 0.00032, shouldAnimate);
    bubbleInstances.forEach((bubble) => bubble.draw(time, motionState.energy, motionState.cardMasses));
  }

  function tick() {
    const raw = performance.now();
    if (!motionState.motionStopped && !isDayMode()) {
      renderFrame(raw, true);
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    initBubbles();
    setOrbitEnabled();
  });
  window.addEventListener("mousemove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  });
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("mouseleave", () => {
    pointer = null;
  });
  window.addEventListener("touchmove", (event) => {
    if (event.touches && event.touches[0]) {
      pointer = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  }, { passive: true });
  document.addEventListener("portfolio-data-hydrated", () => {
    if (sceneBooted) {
      syncSceneElements();
    }
  });

  if (motionToggle) {
    motionToggle.addEventListener("click", () => {
      setMotionStopped(!motionState.motionStopped);
    });
  }

  if (layoutToggle) {
    layoutToggle.addEventListener("click", () => {
      setDisplayMode(isDayMode() ? "orbit" : "day");
    });
  }

  function bootScene() {
    if (sceneBooted) {
      return;
    }

    sceneBooted = true;
    document.documentElement.dataset.displayMode = motionState.displayMode;
    initBubbles();
    syncSceneElements();
    updateLayoutModeUi();
    updateMotionToggleUi();
    restartPreviewAutoplay();
    renderFrame(performance.now(), !motionState.motionStopped && !isDayMode());
    document.documentElement.classList.remove("orbit-preload");
    tick();
  }

  const portfolioDataReady = window.portfolioDataReady;
  if (portfolioDataReady && typeof portfolioDataReady.finally === "function") {
    portfolioDataReady.finally(bootScene);
  } else {
    bootScene();
  }
  }
})();
