const LEAGUE_CONFIG = {
  a: {
    label: "A-Team",
    clubName: "FC Lachendorf A",
    logo: "assets/league/logos/fc-lachendorf-a.png",
    theme: { accent: "#e31b2f", soft: "rgba(227,27,47,0.12)", line: "#e31b2f" },
    opponents: [
      { id: "dsv-hambuehren-d", name: "DSV Hambühren D", logo: "assets/league/logos/dsv-hambuehren-d.png" },
      { id: "mtv-beedenbostel-b", name: "MTV Beedenbostel B", logo: "assets/league/logos/mtv-beedenbostel-b.png" },
      { id: "psv-celle-b", name: "PSV Celle B", logo: "assets/league/logos/psv-celle-b.png" },
      { id: "scheuener-heidedarter-a", name: "Scheuener Heidedarter A", logo: "assets/league/logos/scheuener-heidedarter-a.png" },
      { id: "tus-eschede-a", name: "TuS Eschede A", logo: "assets/league/logos/tus-eschede-a.png" },
      { id: "vorwerk-fun-force-a", name: "Vorwerk Fun Force A", logo: "assets/league/logos/vorwerk-fun-force-a.png" },
    ],
  },
  b: {
    label: "B-Team",
    clubName: "FC Lachendorf B",
    logo: "assets/league/logos/fc-lachendorf-b.png",
    theme: { accent: "#111114", soft: "rgba(255,255,255,0.07)", line: "#d4d4dc" },
    opponents: [
      { id: "bulls-eye-c", name: "Bulls Eye C", logo: "assets/league/logos/bulls-eye-c.png" },
      { id: "dsv-hambuehren-c", name: "DSV Hambühren C", logo: "assets/league/logos/dsv-hambuehren-c.png" },
      { id: "mtv-beedenbostel-a", name: "MTV Beedenbostel A", logo: "assets/league/logos/mtv-beedenbostel-a.png" },
      { id: "team-utd-suedseite-c", name: "Team Utd. Südseite C", logo: "assets/league/logos/team-utd-suedseite-c.png" },
      { id: "tus-eschede-b", name: "TuS Eschede B", logo: "assets/league/logos/tus-eschede-b.png" },
      { id: "vfl-schickeria-a", name: "VfL Schickeria A", logo: "assets/league/logos/vfl-schickeria-a.png" },
    ],
  },
};

const RESULT_FORMATS = {
  story: {
    label: "Story",
    width: 1080,
    height: 1920,
    layerBase: "assets/league/result/story/",
  },
  post: {
    label: "Post",
    width: 1080,
    height: 1350,
    layerBase: "assets/league/result/post/",
  },
};

const RESULT_LAYER_FILES = ["bg.png", "overlay.png", "accents.png", "header.png", "footer.png"];

const leagueEls = {
  navLinks: [...document.querySelectorAll("[data-tool-target]")],
  pages: [...document.querySelectorAll("[data-tool-page]")],
  nav: document.getElementById("nav"),

  teamButtons: [...document.querySelectorAll("[data-league-team]")],
  locationButtons: [...document.querySelectorAll("[data-match-location]")],
  formatButtons: [...document.querySelectorAll("[data-result-format]")],
  backgroundButtons: [...document.querySelectorAll("[data-result-background]")],

  opponent: document.getElementById("resultOpponent"),
  customOpponentWrap: document.getElementById("customOpponentWrap"),
  customOpponent: document.getElementById("resultCustomOpponent"),
  ourScore: document.getElementById("resultOurScore"),
  opponentScore: document.getElementById("resultOpponentScore"),
  matchday: document.getElementById("resultMatchday"),
  date: document.getElementById("resultDate"),
  scoreHint: document.getElementById("resultScoreHint"),
  scoreGrid: document.querySelector(".result-score-grid"),
  resultTool: document.getElementById("resultTool"),

  photoControls: document.getElementById("resultPhotoControls"),
  photoInput: document.getElementById("resultPhotoInput"),
  photoLabel: document.getElementById("resultPhotoLabel"),
  photoRemove: document.getElementById("resultPhotoRemove"),

  canvas: document.getElementById("resultCanvas"),
  previewSize: document.getElementById("resultPreviewSize"),
  previewFormat: document.getElementById("resultPreviewFormat"),
  modalCanvas: document.getElementById("resultModalCanvas"),
  previewModal: document.getElementById("resultPreviewModal"),
  openPreviewButton: document.getElementById("openResultPreview"),
  modalCloseButtons: [...document.querySelectorAll("[data-result-modal-close]")],

  downloadStoryButton: document.getElementById("downloadResultStory"),
  downloadPostButton: document.getElementById("downloadResultPost"),
};

const leagueState = {
  activeTool: "training",
  team: "a",
  location: "home",
  format: "story",
  backgroundMode: "standard",
  resultPhoto: null,
  resultPhotoName: "",
  images: {
    logos: new Map(),
    layers: {
      story: {},
      post: {},
    },
  },
};

if (leagueEls.canvas) {
  leagueEls.ctx = leagueEls.canvas.getContext("2d");
  initLeagueTools();
}

async function initLeagueTools() {
  leagueEls.date.value = toLeagueInputDate(new Date());
  bindLeagueEvents();
  populateOpponentSelect();
  updateCanvasFormat();

  await Promise.all([loadLeagueFonts(), preloadLeagueImages()]);

  updateLeagueUi();
  renderResult();
}

function bindLeagueEvents() {
  leagueEls.navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.dataset.toolTarget;
      if (!target) return;
      setActiveTool(target);
    });
  });

  leagueEls.teamButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const team = button.dataset.leagueTeam;
      if (!LEAGUE_CONFIG[team]) return;

      leagueState.team = team;
      populateOpponentSelect();
      updateLeagueUi();
      renderResult();
    });
  });

  leagueEls.locationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      leagueState.location = button.dataset.matchLocation === "away" ? "away" : "home";
      updateLeagueUi();
      renderResult();
    });
  });

  leagueEls.formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const format = button.dataset.resultFormat;
      if (!RESULT_FORMATS[format]) return;

      leagueState.format = format;
      updateCanvasFormat();
      updateLeagueUi();
      renderResult();
    });
  });

  leagueEls.backgroundButtons.forEach((button) => {
    button.addEventListener("click", () => {
      leagueState.backgroundMode = button.dataset.resultBackground === "photo" ? "photo" : "standard";
      updateLeagueUi();
      renderResult();
    });
  });

  [
    leagueEls.opponent,
    leagueEls.customOpponent,
    leagueEls.ourScore,
    leagueEls.opponentScore,
    leagueEls.matchday,
    leagueEls.date,
  ].forEach((element) => {
    element?.addEventListener("input", handleResultInput);
    element?.addEventListener("change", handleResultInput);
  });

  leagueEls.photoInput?.addEventListener("change", handleResultPhoto);
  leagueEls.photoRemove?.addEventListener("click", removeResultPhoto);

  leagueEls.openPreviewButton?.addEventListener("click", openResultPreview);
  leagueEls.modalCloseButtons.forEach((button) => button.addEventListener("click", closeResultPreview));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !leagueEls.previewModal?.hidden) closeResultPreview();
  });

  leagueEls.canvas?.addEventListener("click", openResultPreview);
  leagueEls.downloadStoryButton?.addEventListener("click", () => downloadResult("story"));
  leagueEls.downloadPostButton?.addEventListener("click", () => downloadResult("post"));
}

function handleResultInput() {
  updateCustomOpponentUi();
  updateScoreHint();
  renderResult();
}

function setActiveTool(tool) {
  leagueState.activeTool = tool;

  leagueEls.pages.forEach((page) => {
    page.hidden = page.dataset.toolPage !== tool;
  });

  leagueEls.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.toolTarget === tool);
  });

  leagueEls.nav?.classList.remove("open");

  if (tool === "result") {
    renderResult();
  }
}

function updateLeagueUi() {
  leagueEls.teamButtons.forEach((button) => {
    const active = button.dataset.leagueTeam === leagueState.team;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  leagueEls.locationButtons.forEach((button) => {
    const active = button.dataset.matchLocation === leagueState.location;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  leagueEls.formatButtons.forEach((button) => {
    const active = button.dataset.resultFormat === leagueState.format;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  leagueEls.backgroundButtons.forEach((button) => {
    const active = button.dataset.resultBackground === leagueState.backgroundMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (leagueEls.resultTool) leagueEls.resultTool.dataset.team = leagueState.team;
  if (leagueEls.photoControls) leagueEls.photoControls.hidden = leagueState.backgroundMode !== "photo";
  if (leagueEls.photoRemove) leagueEls.photoRemove.hidden = !leagueState.resultPhoto;

  updateCustomOpponentUi();
  updateScoreHint();
}

function populateOpponentSelect() {
  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const previousValue = leagueEls.opponent.value;

  leagueEls.opponent.innerHTML = "";
  leagueEls.opponent.append(new Option("Gegner auswählen", ""));

  teamConfig.opponents.forEach((opponent) => {
    leagueEls.opponent.append(new Option(opponent.name, opponent.id));
  });

  leagueEls.opponent.append(new Option("Andere Mannschaft …", "__custom__"));

  const optionStillExists = [...leagueEls.opponent.options].some(
    (option) => option.value === previousValue
  );

  leagueEls.opponent.value = optionStillExists ? previousValue : "";
  updateCustomOpponentUi();
}

function updateCustomOpponentUi() {
  const isCustom = leagueEls.opponent.value === "__custom__";
  leagueEls.customOpponentWrap.hidden = !isCustom;
}

function updateScoreHint() {
  if (!leagueEls.scoreHint || !leagueEls.scoreGrid) return;

  const ours = parseOptionalScore(leagueEls.ourScore.value);
  const theirs = parseOptionalScore(leagueEls.opponentScore.value);

  leagueEls.scoreGrid.classList.remove("score-win", "score-loss", "score-draw", "score-check");
  leagueEls.scoreHint.classList.remove("is-warning", "is-ok");

  if (ours === null || theirs === null) {
    leagueEls.scoreHint.hidden = true;
    leagueEls.scoreHint.textContent = "";
    return;
  }

  const total = ours + theirs;
  leagueEls.scoreHint.hidden = false;

  if (total !== 12) {
    leagueEls.scoreGrid.classList.add("score-check");
    leagueEls.scoreHint.textContent = `Zusammen: ${total} Punkte · bitte prüfen (erwartet: 12).`;
    leagueEls.scoreHint.classList.add("is-warning");
    return;
  }

  const stateClass = ours > theirs ? "score-win" : ours < theirs ? "score-loss" : "score-draw";
  leagueEls.scoreGrid.classList.add(stateClass);
  leagueEls.scoreHint.textContent = "Zusammen: 12 Punkte · passt.";
  leagueEls.scoreHint.classList.add("is-ok");
}

function updateCanvasFormat() {
  const format = RESULT_FORMATS[leagueState.format];
  leagueEls.canvas.width = format.width;
  leagueEls.canvas.height = format.height;

  if (leagueEls.previewSize) {
    leagueEls.previewSize.textContent = `${format.width} × ${format.height} px`;
  }

  if (leagueEls.previewFormat) {
    leagueEls.previewFormat.textContent = format.label;
  }

  leagueEls.canvas.dataset.format = leagueState.format;

  if (leagueEls.modalCanvas) {
    leagueEls.modalCanvas.width = format.width;
    leagueEls.modalCanvas.height = format.height;
  }
}

async function loadLeagueFonts() {
  try {
    const definitions = [
      ["Topshow", "fonts/topshow.otf"],
      ["TacticSans", "fonts/tacticsans.otf"],
    ];

    await Promise.all(
      definitions.map(async ([family, source]) => {
        if (document.fonts.check(`16px "${family}"`)) return;
        const face = new FontFace(family, `url(${source})`);
        const loaded = await face.load();
        document.fonts.add(loaded);
      })
    );

    await document.fonts.ready;
  } catch (error) {
    console.warn("Liga-Schriften konnten nicht vollständig geladen werden.", error);
  }
}

async function preloadLeagueImages() {
  const logoPaths = new Set();

  Object.values(LEAGUE_CONFIG).forEach((team) => {
    logoPaths.add(team.logo);
    team.opponents.forEach((opponent) => logoPaths.add(opponent.logo));
  });

  await Promise.all(
    [...logoPaths].map(async (path) => {
      const image = await loadLeagueImage(path, false);
      leagueState.images.logos.set(path, image);
    })
  );

  await Promise.all(
    Object.entries(RESULT_FORMATS).map(async ([formatKey, format]) => {
      const entries = await Promise.all(
        RESULT_LAYER_FILES.map(async (fileName) => {
          let image = await loadLeagueImage(`${format.layerBase}${fileName}`, true);
          if (!image && fileName === "accents.png") {
            image = await loadLeagueImage(`${format.layerBase}accent.png`, true);
          }
          return [fileName, image];
        })
      );

      leagueState.images.layers[formatKey] = Object.fromEntries(entries);
    })
  );
}

function loadLeagueImage(src, optional = false) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      if (!optional) console.warn(`Konnte Liga-Bild nicht laden: ${src}`);
      resolve(null);
    };

    image.src = src;
  });
}

function renderResult(formatKey = leagueState.format) {
  const format = RESULT_FORMATS[formatKey];
  const ctx = leagueEls.ctx;

  if (leagueEls.canvas.width !== format.width || leagueEls.canvas.height !== format.height) {
    leagueEls.canvas.width = format.width;
    leagueEls.canvas.height = format.height;
  }

  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const opponent = getSelectedOpponent();
  const ourScore = sanitizeLeagueScore(leagueEls.ourScore.value);
  const opponentScore = sanitizeLeagueScore(leagueEls.opponentScore.value);
  const resultLabel = getResultLabel(ourScore, opponentScore);
  const isHome = leagueState.location === "home";

  const ourTeam = {
    name: teamConfig.clubName,
    logo: teamConfig.logo,
  };

  const otherTeam = {
    name: opponent?.name || "GEGNER",
    logo: opponent?.logo || null,
  };

  const homeTeam = isHome ? ourTeam : otherTeam;
  const awayTeam = isHome ? otherTeam : ourTeam;
  const homeScore = isHome ? ourScore : opponentScore;
  const awayScore = isHome ? opponentScore : ourScore;

  drawResultBase(ctx, formatKey, format.width, format.height, teamConfig);
  drawResultLayers(
    ctx,
    formatKey,
    format.width,
    format.height,
    leagueState.backgroundMode === "photo" && Boolean(leagueState.resultPhoto)
  );

  if (formatKey === "post") {
    drawResultPost(ctx, {
      width: format.width,
      height: format.height,
      teamConfig,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      resultLabel,
    });
  } else {
    drawResultStory(ctx, {
      width: format.width,
      height: format.height,
      teamConfig,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      resultLabel,
    });
  }

  if (leagueEls.previewModal && !leagueEls.previewModal.hidden) {
    syncModalPreview();
  }
}

function drawResultBase(ctx, formatKey, width, height, teamConfig) {
  ctx.clearRect(0, 0, width, height);

  const usePhoto = leagueState.backgroundMode === "photo" && leagueState.resultPhoto;

  if (usePhoto) {
    drawCoverImage(ctx, leagueState.resultPhoto, 0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(0, 0, width, height);
  } else {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#070709");
    background.addColorStop(0.52, "#15151a");
    background.addColorStop(1, "#09090c");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    const step = formatKey === "story" ? 90 : 75;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const theme = teamConfig.theme || LEAGUE_CONFIG.a.theme;

  ctx.save();
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.moveTo(width * 0.77, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height * 0.18);
  ctx.closePath();
  ctx.fill();

  if (leagueState.team === "b") {
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  ctx.fillStyle = theme.soft;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.68);
  ctx.lineTo(width, height * 0.53);
  ctx.lineTo(width, height * 0.62);
  ctx.lineTo(0, height * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawResultLayers(ctx, formatKey, width, height, skipBackground = false) {
  const layers = leagueState.images.layers[formatKey] || {};

  RESULT_LAYER_FILES.forEach((fileName) => {
    if (skipBackground && fileName === "bg.png") return;
    const image = layers[fileName];
    if (!image) return;
    ctx.drawImage(image, 0, 0, width, height);
  });
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}
function drawResultStory(ctx, data) {
  const { width, teamConfig, homeTeam, awayTeam, homeScore, awayScore, resultLabel } = data;

  drawHeader(ctx, teamConfig, 118, 250, 116);
  drawMetaLine(ctx, width, 335, 31);

  drawTeamIdentity(ctx, homeTeam, {
    centerX: 270,
    logoY: 470,
    logoSize: 245,
    role: "HEIM",
    roleY: 765,
    nameY: 835,
    nameWidth: 420,
    nameFont: 52,
    nameMinFont: 28,
  });

  drawTeamIdentity(ctx, awayTeam, {
    centerX: 810,
    logoY: 470,
    logoSize: 245,
    role: "AUSWÄRTS",
    roleY: 765,
    nameY: 835,
    nameWidth: 420,
    nameFont: 52,
    nameMinFont: 28,
  });

  drawScore(ctx, homeScore, awayScore, width, 1115, 205, 118);
  drawResultBadge(ctx, resultLabel, width, 1260, 440, 112, 58);
  drawFooter(ctx, width, 1715, 1825, 38);
}

function drawResultPost(ctx, data) {
  const { width, teamConfig, homeTeam, awayTeam, homeScore, awayScore, resultLabel } = data;

  drawHeader(ctx, teamConfig, 84, 178, 82);
  drawMetaLine(ctx, width, 238, 26);

  drawTeamIdentity(ctx, homeTeam, {
    centerX: 270,
    logoY: 335,
    logoSize: 205,
    role: "HEIM",
    roleY: 575,
    nameY: 632,
    nameWidth: 410,
    nameFont: 44,
    nameMinFont: 25,
  });

  drawTeamIdentity(ctx, awayTeam, {
    centerX: 810,
    logoY: 335,
    logoSize: 205,
    role: "AUSWÄRTS",
    roleY: 575,
    nameY: 632,
    nameWidth: 410,
    nameFont: 44,
    nameMinFont: 25,
  });

  drawScore(ctx, homeScore, awayScore, width, 835, 165, 96);
  drawResultBadge(ctx, resultLabel, width, 930, 390, 92, 48);
  drawFooter(ctx, width, 1150, 1265, 32);
}

function drawHeader(ctx, teamConfig, leagueY, titleY, titleFontSize) {
  ctx.textAlign = "left";
  ctx.fillStyle = teamConfig.theme?.line || "#e31b2f";
  ctx.font = '900 30px "TacticSans", system-ui, sans-serif';
  ctx.fillText(`DART LIGA - ${teamConfig.label.toUpperCase()}`, 72, leagueY);

  ctx.fillStyle = "#ededf5";
  ctx.font = `${titleFontSize}px "Topshow", Impact, sans-serif`;
  ctx.fillText("ERGEBNIS", 70, titleY);
}

function drawMetaLine(ctx, width, y, fontSize) {
  const matchday = sanitizeLeagueScore(leagueEls.matchday.value);
  const parts = [leagueState.location === "home" ? "HEIMSPIEL" : "AUSWÄRTSSPIEL"];
  if (matchday) parts.push(`${matchday}. SPIELTAG`);

  ctx.textAlign = "center";
  ctx.fillStyle = "#9d9da8";
  ctx.font = `${fontSize}px "TacticSans", system-ui, sans-serif`;
  ctx.fillText(parts.join(" - "), width / 2, y);
}

function drawTeamIdentity(ctx, team, options) {
  const logo = getLeagueLogo(team.logo);
  drawLogoPlate(ctx, logo, options.centerX, options.logoY, options.logoSize, team.name);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e31b2f";
  ctx.font = '900 25px "TacticSans", system-ui, sans-serif';
  ctx.fillText(options.role, options.centerX, options.roleY);

  drawTeamName(ctx, String(team.name).toUpperCase(), {
    centerX: options.centerX,
    y: options.nameY,
    maxWidth: options.nameWidth,
    fontSize: options.nameFont,
    minFontSize: options.nameMinFont,
    lineHeight: Math.round(options.nameFont * 1.05),
  });
}

function drawLogoPlate(ctx, image, centerX, y, size, fallbackName) {
  const x = centerX - size / 2;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.055)";
  roundRect(ctx, x, y, size, size, size * 0.18);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, size, size, size * 0.18);
  ctx.stroke();

  if (image) {
    const padding = size * 0.12;
    drawContainedImage(ctx, image, x + padding, y + padding, size - padding * 2, size - padding * 2);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.round(size * 0.12)}px system-ui, sans-serif`;
    ctx.fillText(getInitials(fallbackName), centerX, y + size / 2);
  }

  ctx.restore();
}

function drawContainedImage(ctx, image, x, y, width, height) {
  const ratio = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawTeamName(ctx, text, options) {
  ctx.save();
  ctx.fillStyle = "#ededf5";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let fontSize = options.fontSize;
  let lines = [text];

  while (fontSize >= options.minFontSize) {
    ctx.font = `${fontSize}px "Topshow", Impact, sans-serif`;
    lines = createTeamNameLines(ctx, text, options.maxWidth);
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));

    if (lines.length <= 2 && widest <= options.maxWidth) break;
    fontSize -= 2;
  }

  const lineHeight = Math.round(fontSize * 1.05);
  const startY = options.y - ((lines.length - 1) * lineHeight) / 2;

  lines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, options.centerX, startY + index * lineHeight);
  });

  ctx.restore();
}

function createTeamNameLines(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return [text];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];

  let best = null;

  for (let split = 1; split < words.length; split += 1) {
    const first = words.slice(0, split).join(" ");
    const second = words.slice(split).join(" ");
    const maxLineWidth = Math.max(ctx.measureText(first).width, ctx.measureText(second).width);

    if (!best || maxLineWidth < best.maxLineWidth) {
      best = { lines: [first, second], maxLineWidth };
    }
  }

  return best?.lines || [text];
}

function drawScore(ctx, homeScore, awayScore, width, y, scoreFontSize, colonFontSize) {
  const left = homeScore || "-";
  const right = awayScore || "-";

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `${scoreFontSize}px "Topshow", Impact, sans-serif`;
  ctx.fillText(left, width / 2 - 175, y);
  ctx.fillText(right, width / 2 + 175, y);

  ctx.fillStyle = "#e31b2f";
  ctx.font = `${colonFontSize}px "Topshow", Impact, sans-serif`;
  ctx.fillText(":", width / 2, y - scoreFontSize * 0.1);
}

function drawResultBadge(ctx, resultLabel, width, y, badgeWidth, badgeHeight, fontSize) {
  const x = (width - badgeWidth) / 2;

  ctx.fillStyle = resultLabel.color;
  roundRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight * 0.25);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = `${fontSize}px "Topshow", Impact, sans-serif`;
  ctx.fillText(resultLabel.text, width / 2, y + badgeHeight * 0.68);
}

function drawFooter(ctx, width, dateY, brandY, brandFontSize) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#777781";
  ctx.font = '30px "TacticSans", system-ui, sans-serif';
  ctx.fillText(formatLeagueDate(leagueEls.date.value), width / 2, dateY);

  ctx.fillStyle = "#ededf5";
  ctx.font = `${brandFontSize}px "Topshow", Impact, sans-serif`;
  ctx.fillText("FC LACHENDORF DARTS", width / 2, brandY);

  ctx.fillStyle = "#e31b2f";
  ctx.fillRect(width / 2 - 145, brandY + 38, 290, 7);
}

function getSelectedOpponent() {
  if (leagueEls.opponent.value === "__custom__") {
    const name = leagueEls.customOpponent.value.trim();
    return name ? { id: "__custom__", name, logo: null } : null;
  }

  return LEAGUE_CONFIG[leagueState.team].opponents.find(
    (opponent) => opponent.id === leagueEls.opponent.value
  ) || null;
}

function getLeagueLogo(path) {
  if (!path) return null;
  return leagueState.images.logos.get(path) || null;
}

function getResultLabel(ourScore, opponentScore) {
  if (ourScore === "" || opponentScore === "") {
    return { text: "ERGEBNIS", color: "#34343c" };
  }

  const ours = Number(ourScore);
  const theirs = Number(opponentScore);

  if (ours > theirs) return { text: "SIEG", color: "#b51224" };
  if (ours < theirs) return { text: "NIEDERLAGE", color: "#34343c" };
  return { text: "UNENTSCHIEDEN", color: "#7a1823" };
}

function parseOptionalScore(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

function sanitizeLeagueScore(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 2);
}

function formatLeagueDate(inputValue) {
  if (!inputValue) return "";
  const [year, month, day] = inputValue.split("-");
  if (!year || !month || !day) return inputValue;
  return `${day}.${month}.${year}`;
}

function toLeagueInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function downloadResult(formatKey) {
  const format = RESULT_FORMATS[formatKey];
  if (!format || !validateResultBeforeExport()) return;

  renderResult(formatKey);
  const dataUrl = leagueEls.canvas.toDataURL("image/png");

  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const opponent = getSelectedOpponent()?.name || "gegner";
  const date = leagueEls.date.value || toLeagueInputDate(new Date());
  const fileName = `ergebnis-${leagueSlugify(teamConfig.label)}-${leagueSlugify(opponent)}-${formatKey}-${date}.png`;

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();

  renderResult(leagueState.format);
}

function handleResultPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      leagueState.resultPhoto = image;
      leagueState.resultPhotoName = file.name;
      leagueState.backgroundMode = "photo";

      if (leagueEls.photoLabel) leagueEls.photoLabel.textContent = file.name;
      updateLeagueUi();
      renderResult();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function removeResultPhoto() {
  leagueState.resultPhoto = null;
  leagueState.resultPhotoName = "";
  if (leagueEls.photoInput) leagueEls.photoInput.value = "";
  if (leagueEls.photoLabel) leagueEls.photoLabel.textContent = "Foto auswählen / aufnehmen";
  updateLeagueUi();
  renderResult();
}

function openResultPreview() {
  if (!leagueEls.previewModal) return;
  leagueEls.previewModal.hidden = false;
  document.body.classList.add("result-modal-open");
  renderResult();
  syncModalPreview();
}

function closeResultPreview() {
  if (!leagueEls.previewModal) return;
  leagueEls.previewModal.hidden = true;
  document.body.classList.remove("result-modal-open");
}

function syncModalPreview() {
  if (!leagueEls.modalCanvas || !leagueEls.canvas) return;
  const ctx = leagueEls.modalCanvas.getContext("2d");
  leagueEls.modalCanvas.width = leagueEls.canvas.width;
  leagueEls.modalCanvas.height = leagueEls.canvas.height;
  ctx.clearRect(0, 0, leagueEls.modalCanvas.width, leagueEls.modalCanvas.height);
  ctx.drawImage(leagueEls.canvas, 0, 0);
}

function validateResultBeforeExport() {
  const opponent = getSelectedOpponent();
  if (!opponent) {
    window.alert("Bitte zuerst einen Gegner auswählen.");
    return false;
  }

  const ours = parseOptionalScore(leagueEls.ourScore.value);
  const theirs = parseOptionalScore(leagueEls.opponentScore.value);

  if (ours === null || theirs === null) {
    window.alert("Bitte beide Ergebnisfelder ausfüllen.");
    return false;
  }

  const total = ours + theirs;
  if (total !== 12) {
    return window.confirm(
      `Der eingetragene Endstand ${ours}:${theirs} ergibt ${total} Punkte statt 12. Bitte überprüfe das Ergebnis.\n\nWenn es trotzdem richtig ist, kannst du mit „OK“ exportieren.`
    );
  }

  return true;
}

function leagueSlugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getInitials(value) {
  return String(value || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
