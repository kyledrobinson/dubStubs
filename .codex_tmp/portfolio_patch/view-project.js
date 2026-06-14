(function () {
  const DISPLAY_STORAGE_KEY = "portfolio-display-mode";
  const endpoint = window.PORTFOLIO_DATA_ENDPOINT || "";
  const params = new URLSearchParams(window.location.search);
  const requested = slugify(params.get("project") || "");
  const modeToggle = document.querySelector(".project-mode-toggle");

  const fallbackProjects = [
    { label: "Featured", title: "Unclaimed Remains Brochure", badges: ["Id", "Print"], description: "An informational brochure concept that balances sensitivity, clarity, and public-facing guidance.", categories: ["Print Production", "Information Design", "Layout Systems", "Production Design"] },
    { label: "Identity", title: "Bloor Street Dart League", badges: ["Ai", "Print"], description: "A neighborhood sports identity direction with room for posters, league graphics, and event materials.", categories: ["Visual Design", "Production Design", "Print Production"] },
    { label: "Reach", title: "Google Reviews", badges: ["Ps", "Info"], description: "A proof-of-impact story built around map visibility, image traction, and practical digital reach.", categories: ["Photo Editing", "Information Design", "Visual Design"] },
    { label: "Brand Mark", title: "Ziggy's Rotor Logo", badges: ["Ai", "Vector"], description: "A logo exploration shaped around mechanical energy, local character, and bold edge-lit contrast.", categories: ["Visual Design", "Production Design"] },
    { label: "Process", title: "Motion Studies", badges: ["Code", "Motion"], description: "CSS-led interaction tests focused on atmosphere, responsiveness, and visual restraint.", categories: ["Front-End Development", "Motion Graphics", "AI Workflows"] },
    { label: "Lab", title: "Material Experiments", badges: ["3D", "Script"], description: "A space for texture, lighting, and 3D-inspired interface fragments that inform future portfolio directions.", categories: ["3D Exploration", "AI Workflows", "Front-End Development"] }
  ];

  function slugify(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function parseList(value) {
    if (Array.isArray(value)) return value;
    return String(value || "").split(/[|,]/).map((item) => item.trim()).filter(Boolean);
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
      // Keep the visual toggle usable even when storage is unavailable.
    }
  }

  function updateDisplayModeUi(mode) {
    document.documentElement.dataset.displayMode = mode;

    if (!modeToggle) {
      return;
    }

    const dayMode = mode === "day";
    modeToggle.textContent = dayMode ? "Night Mode" : "Day Mode";
    modeToggle.setAttribute("aria-pressed", dayMode ? "true" : "false");
    modeToggle.setAttribute("aria-label", dayMode ? "Switch to night mode" : "Switch to day mode");
    modeToggle.classList.toggle("is-day-mode", dayMode);
  }

  function setDisplayMode(mode) {
    const nextMode = mode === "day" ? "day" : "orbit";
    writeDisplayMode(nextMode);
    updateDisplayModeUi(nextMode);
  }

  function badgeSymbol(label) {
    const key = String(label || "").trim().toLowerCase();
    const mapping = { id: "vp-badge-app", ai: "vp-badge-app", ps: "vp-badge-photo", print: "vp-badge-print", info: "vp-badge-layout", vector: "vp-badge-vector", code: "vp-badge-code", motion: "vp-badge-motion", "3d": "vp-badge-cube", script: "vp-badge-code" };
    return mapping[key] || "vp-badge-app";
  }

  function createBadge(label) {
    const badge = document.createElement("span");
    badge.className = "project-badge";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${badgeSymbol(label)}`);
    icon.appendChild(use);
    const text = document.createElement("span");
    text.textContent = label;
    badge.appendChild(icon);
    badge.appendChild(text);
    return badge;
  }

  function renderProject(project) {
    document.getElementById("project-kicker").textContent = `${project.label || "Project"} / Case view`;
    document.getElementById("project-title").textContent = project.title || "Untitled Project";
    document.getElementById("project-summary").textContent = project.description || "";
    document.getElementById("fact-type").textContent = parseList(project.categories).slice(0, 2).join(" / ") || "Selected work";
    document.getElementById("fact-mode").textContent = parseList(project.badges).join(" / ") || "Project system";
    document.getElementById("fact-read").textContent = "Selected work / ongoing project / process record";
    document.getElementById("fact-status").textContent = "Live structure / ready for content";
    document.getElementById("project-frame-copy").textContent = `${project.title || "This project"} should explain the design problem, the chosen system, and the logic behind the final output without losing the atmosphere of the homepage.`;
    document.getElementById("project-reflection").textContent = `${project.title || "This project"} belongs in the portfolio because it shows not only the finished output, but the way thinking, tools, and presentation come together into a readable creative system.`;

    const badges = document.getElementById("project-badges");
    badges.innerHTML = "";
    parseList(project.badges).forEach((badge) => badges.appendChild(createBadge(badge)));

    const processList = document.getElementById("process-list");
    processList.innerHTML = "";
    [
      `Frame the project through ${parseList(project.categories).slice(0, 2).join(" and ").toLowerCase() || "the strongest disciplines"}.`,
      `Show the tool and process signals: ${parseList(project.badges).join(", ") || "core tools and methods"}.`,
      "Balance visual evidence with short clear writing instead of over-explaining."
    ].forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      processList.appendChild(li);
    });
  }

  async function load() {
    let projects = fallbackProjects;
    if (endpoint) {
      try {
        const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.projects) && data.projects.length) {
            projects = data.projects;
          }
        }
      } catch (error) {
        console.warn("View project sheet hydration skipped:", error);
      }
    }

    const project = projects.find((item) => slugify(item.title || item.label) === requested) || projects[0];
    renderProject(project || fallbackProjects[0]);
  }

  updateDisplayModeUi(readDisplayMode());

  if (modeToggle) {
    modeToggle.addEventListener("click", () => {
      setDisplayMode(readDisplayMode() === "day" ? "orbit" : "day");
    });
  }

  load();
})();
