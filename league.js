const LEAGUE_CONFIG = {
  a: {
    label: "A-Team",
    clubName: "FC Lachendorf A",
    logo: "assets/league/logos/fc-lachendorf-a.png",
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

const RESULT_BUILD_VERSION = "20260927-noimage-2";

const RESULT_STORY = {
  width: 1080,
  height: 1920,
  assetBase: "assets/league/result/story/",
};

/*
 * ============================================================
 * POSITIONEN / GRÖSSEN FÜR DIE ERGEBNIS-STORY
 * ============================================================
 * Hier kannst du später die Pixelwerte fein einstellen.
 * Alle Werte beziehen sich auf 1080 x 1920 px.
 */
const RESULT_STORY_LAYOUT = {
  matchday: {
    x: 170,
    y: 212,
    fontSize: 50,
    colorA: "#cc2331",
    colorB: "#ededf5",
    align: "center",
  },

  logos: {
    home: { x: 217, y: 1399, size: 160 },
    away: { x: 855, y: 1399, size: 160 },
  },

  scores: {
    homeX: 410,
    awayX: 630,
    colonX: 530,
    y: 1468,
    fontSize: 200,
    colonFontSize: 0,
    color: "#f3f3f5",
    colonColor: "#e31b2f",
  },

  teamNames: {
    homeX: 217,
    awayX: 855,
    y: 1562,
    maxWidth: 440,
    fontSize: 40,
    minFontSize: 25,
    color: "#f3f3f5",
  },

  date: {
    x: 540,
    y: 1900,
    fontSize: 30,
    color: "#7a7a82",
  },

  stats: {
    columnShift: 519,
    valueFontSize: 31,
    valueColorTop: "#ffffff",
    valueColorBottom: "#ffffff",
    slots: [
      { key: "top-left", row: "top", col: 0, x: 505, y: 1737 },
      { key: "top-right", row: "top", col: 1, x: 1025, y: 1737 },
      { key: "bottom-left", row: "bottom", col: 0, x: 505, y: 1808 },
      { key: "bottom-right", row: "bottom", col: 1, x: 1025, y: 1808 },
    ],
  },
};

const RESULT_STORY_LAYOUT_NO_IMAGE = {
  matchday: {
    x: 240,
    y: 265,
    fontSize: 72,
    colorA: "#cc2331",
    colorB: "#ededf5",
    align: "center",
  },

  logos: {
    home: { x: 235, y: 751, size: 180 },
    away: { x: 834, y: 751, size: 180 },
  },

  scores: {
    homeX: 215,
    awayX: 805,
    y: 1220,
    fontSize: 300,
    color: "#f3f3f5",
  },

  teamNames: {
    homeX: 235,
    awayX: 834,
    y: 950,
    maxWidth: 430,
    fontSize: 44,
    minFontSize: 24,
    color: "#f3f3f5",
  },

  date: {
    x: 540,
    y: 1890,
    fontSize: 30,
    color: "#7a7a82",
  },

  stats: {
    rowShift: 71,
    valueFontSize: 31,
    valueColor: "#ffffff",
    slots: [
      { index: 0, style: "color", x: 757, y: 1513 },
      { index: 1, style: "mono",  x: 757, y: 1584 },
      { index: 2, style: "color", x: 757, y: 1655 },
      { index: 3, style: "mono",  x: 757, y: 1726 },
    ],
  },
};

function hasResultPhoto() {
  return Boolean(leagueState.resultPhoto);
}

function getActiveStoryLayout() {
  return hasResultPhoto() ? RESULT_STORY_LAYOUT : RESULT_STORY_LAYOUT_NO_IMAGE;
}

const STORY_ASSET_FILES = [
  "bg.png",
  "bgb.png",
  "overlaya.png",
  "overlayb.png",
  "overlaya-no.png",
  "overlayb-no.png",
  "footer.png",
  "headera.png",
  "headerb.png",
  "headera-no.png",
  "headerb-no.png",
  "seta.png",
  "setb.png",
  "seta-no.png",
  "setb-no.png",
  "win.png",
  "draw.png",
  "lose.png",
  "win-no.png",
  "draw-no.png",
  "lose-no.png",
  "legs-top-a.png",
  "legs-top-b.png",
  "legs-top-a-no.png",
  "legs-top-b-no.png",
  "short-top-a.png",
  "short-top-b.png",
  "short-top-a-no.png",
  "short-top-b-no.png",
  "short-bottom-no.png",
  "fin-top-a.png",
  "fin-top-b.png",
  "fin-bottom.png",
  "fin-top-a-no.png",
  "fin-top-b-no.png",
  "fin-bottom-no.png",
  "counter-top-a.png",
  "counter-top-b.png",
  "counter-bottom.png",
  "counter-top-a-no.png",
  "counter-top-b-no.png",
  "counter-bottom-no.png",
];

const leagueEls = {
  navLinks: [...document.querySelectorAll("[data-tool-target]")],
  pages: [...document.querySelectorAll("[data-tool-page]")],
  nav: document.getElementById("nav"),
  resultTool: document.getElementById("resultTool"),

  teamButtons: [...document.querySelectorAll("[data-league-team]")],
  locationButtons: [...document.querySelectorAll("[data-match-location]")],

  opponent: document.getElementById("resultOpponent"),
  customOpponentWrap: document.getElementById("customOpponentWrap"),
  customOpponent: document.getElementById("resultCustomOpponent"),
  ourScore: document.getElementById("resultOurScore"),
  opponentScore: document.getElementById("resultOpponentScore"),
  matchday: document.getElementById("resultMatchday"),
  date: document.getElementById("resultDate"),
  scoreHint: document.getElementById("resultScoreHint"),
  scoreGrid: document.querySelector(".result-score-grid"),

  photoInput: document.getElementById("resultPhotoInput"),
  photoLabel: document.getElementById("resultPhotoLabel"),
  photoRemove: document.getElementById("resultPhotoRemove"),
  photoAdjust: document.getElementById("resultPhotoAdjust"),
  photoZoom: document.getElementById("resultPhotoZoom"),
  photoX: document.getElementById("resultPhotoX"),
  photoY: document.getElementById("resultPhotoY"),

  showLegs: document.getElementById("resultShowLegs"),
  legsHome: document.getElementById("resultLegsHome"),
  legsAway: document.getElementById("resultLegsAway"),
  showShort: document.getElementById("resultShowShort"),
  short: document.getElementById("resultShort"),
  showFinish: document.getElementById("resultShowFinish"),
  finish: document.getElementById("resultFinish"),
  showCounter: document.getElementById("resultShowCounter"),
  counter: document.getElementById("resultCounter"),

  canvas: document.getElementById("resultCanvas"),
  modalCanvas: document.getElementById("resultModalCanvas"),
  previewModal: document.getElementById("resultPreviewModal"),
  openPreviewButton: document.getElementById("openResultPreview"),
  modalCloseButtons: [...document.querySelectorAll("[data-result-modal-close]")],
  downloadStoryButton: document.getElementById("downloadResultStory"),
};

const leagueState = {
  activeTool: "training",
  team: "a",
  location: "home",

  resultPhoto: null,
  resultPhotoName: "",
  photoTransform: {
    zoom: 1,
    x: 0,
    y: 0,
  },

  images: {
    logos: new Map(),
    story: {},
  },

  pointers: new Map(),
  drag: {
    active: false,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
  },
  pinch: {
    active: false,
    startDistance: 0,
    startZoom: 1,
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
  updateScoreHint();
  updateStatInputs();

  await Promise.all([loadLeagueFonts(), preloadLeagueImages()]);

  updateLeagueUi();
  updatePhotoRanges();
  renderResultStory();
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
      renderResultStory();
    });
  });

  leagueEls.locationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      leagueState.location = button.dataset.matchLocation === "away" ? "away" : "home";
      updateLeagueUi();
      renderResultStory();
    });
  });

  [
    leagueEls.opponent,
    leagueEls.customOpponent,
    leagueEls.ourScore,
    leagueEls.opponentScore,
    leagueEls.matchday,
    leagueEls.date,
    leagueEls.legsHome,
    leagueEls.legsAway,
    leagueEls.short,
    leagueEls.finish,
    leagueEls.counter,
  ].forEach((element) => {
    element?.addEventListener("input", handleResultInput);
    element?.addEventListener("change", handleResultInput);
  });

  [
    leagueEls.showLegs,
    leagueEls.showShort,
    leagueEls.showFinish,
    leagueEls.showCounter,
  ].forEach((element) => {
    element?.addEventListener("change", () => {
      updateStatInputs();
      renderResultStory();
    });
  });

  leagueEls.photoInput?.addEventListener("change", handleResultPhoto);
  leagueEls.photoRemove?.addEventListener("click", removeResultPhoto);

  leagueEls.photoZoom?.addEventListener("input", () => {
    leagueState.photoTransform.zoom = Number(leagueEls.photoZoom.value);
    updatePhotoRanges();
    renderResultStory();
  });

  [leagueEls.photoX, leagueEls.photoY].forEach((element) => {
    element?.addEventListener("input", () => {
      syncPhotoTransformFromRanges();
      renderResultStory();
    });
  });

  leagueEls.openPreviewButton?.addEventListener("click", openResultPreview);
  leagueEls.modalCloseButtons.forEach((button) => button.addEventListener("click", closeResultPreview));
  leagueEls.downloadStoryButton?.addEventListener("click", downloadResultStory);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && leagueEls.previewModal && !leagueEls.previewModal.hidden) {
      closeResultPreview();
    }
  });

  leagueEls.canvas.addEventListener("pointerdown", onResultPointerDown);
  leagueEls.canvas.addEventListener("pointermove", onResultPointerMove);
  leagueEls.canvas.addEventListener("pointerup", onResultPointerUp);
  leagueEls.canvas.addEventListener("pointercancel", onResultPointerUp);
  leagueEls.canvas.addEventListener("pointerleave", onResultPointerUp);
}

function handleResultInput() {
  updateCustomOpponentUi();
  updateScoreHint();
  renderResultStory();
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
    renderResultStory();
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

  if (leagueEls.resultTool) {
    leagueEls.resultTool.dataset.team = leagueState.team;
  }

  updateCustomOpponentUi();
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

  const ours = parseOptionalNumber(leagueEls.ourScore.value);
  const theirs = parseOptionalNumber(leagueEls.opponentScore.value);

  leagueEls.scoreGrid.classList.remove("score-check");
  leagueEls.scoreHint.classList.remove("is-warning");

  if (ours === null || theirs === null) {
    leagueEls.scoreHint.hidden = true;
    leagueEls.scoreHint.textContent = "";
    return;
  }

  const total = ours + theirs;
  leagueEls.scoreHint.hidden = false;

  if (total === 12) {
    leagueEls.scoreHint.textContent = "Zusammen: 12 Punkte.";
    return;
  }

  leagueEls.scoreGrid.classList.add("score-check");
  leagueEls.scoreHint.classList.add("is-warning");
  leagueEls.scoreHint.textContent = `Zusammen: ${total} Punkte · bitte prüfen (erwartet: 12).`;
}

function updateStatInputs() {
  const singlePairs = [
    [leagueEls.showShort, leagueEls.short],
    [leagueEls.showFinish, leagueEls.finish],
    [leagueEls.showCounter, leagueEls.counter],
  ];

  singlePairs.forEach(([toggle, input]) => {
    if (!toggle || !input) return;
    input.disabled = !toggle.checked;
  });

  const legsEnabled = Boolean(leagueEls.showLegs?.checked);
  if (leagueEls.legsHome) leagueEls.legsHome.disabled = !legsEnabled;
  if (leagueEls.legsAway) leagueEls.legsAway.disabled = !legsEnabled;
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

  const entries = await Promise.all(
    STORY_ASSET_FILES.map(async (fileName) => {
      const image = await loadLeagueImage(`${RESULT_STORY.assetBase}${fileName}`, false);
      return [fileName, image];
    })
  );

  leagueState.images.story = Object.fromEntries(entries);
}

function loadLeagueImage(src, optional = false) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => {
      if (!optional) console.warn(`Konnte Liga-Bild nicht laden: ${src}`);
      resolve(null);
    };

    const separator = src.includes("?") ? "&" : "?";
    image.src = `${src}${separator}v=${RESULT_BUILD_VERSION}`;
  });
}

function renderResultStory() {
  const ctx = leagueEls.ctx;
  const width = RESULT_STORY.width;
  const height = RESULT_STORY.height;

  if (leagueEls.canvas.width !== width || leagueEls.canvas.height !== height) {
    leagueEls.canvas.width = width;
    leagueEls.canvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);

  const assets = leagueState.images.story;
  const teamSuffix = leagueState.team;
  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const opponent = getSelectedOpponent();
  const withPhoto = hasResultPhoto();
  const layout = getActiveStoryLayout();

  const ourScore = sanitizeScore(leagueEls.ourScore.value);
  const opponentScore = sanitizeScore(leagueEls.opponentScore.value);
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

  const backgroundFile = withPhoto
    ? "bg.png"
    : teamSuffix === "a"
      ? "bg.png"
      : "bgb.png";

  const overlayFile = withPhoto
    ? `overlay${teamSuffix}.png`
    : `overlay${teamSuffix}-no.png`;

  const headerFile = withPhoto
    ? `header${teamSuffix}.png`
    : `header${teamSuffix}-no.png`;

  const setFile = withPhoto
    ? `set${teamSuffix}.png`
    : `set${teamSuffix}-no.png`;

  drawFullAsset(ctx, assets[backgroundFile]);

  if (withPhoto) {
    drawResultPhoto(ctx);
  }

  drawFullAsset(ctx, assets[overlayFile]);
  drawFullAsset(ctx, assets["footer.png"]);
  drawFullAsset(ctx, assets[headerFile]);
  drawFullAsset(ctx, assets[setFile]);

  const outcomeFile = getOutcomeAssetFile(ourScore, opponentScore, withPhoto);
  if (outcomeFile) {
    drawFullAsset(ctx, assets[outcomeFile]);
  }

  drawMatchday(ctx);
  drawTeamLogo(ctx, homeTeam.logo, layout.logos.home);
  drawTeamLogo(ctx, awayTeam.logo, layout.logos.away);
  drawScores(ctx, homeScore, awayScore);
  drawTeamNames(ctx, homeTeam.name, awayTeam.name);
  drawDate(ctx);
  drawDynamicStats(ctx);

  syncModalPreview();
}
function drawFullAsset(ctx, image, offsetX = 0, offsetY = 0) {
  if (!image) return;
  ctx.drawImage(image, offsetX, offsetY, RESULT_STORY.width, RESULT_STORY.height);
}

function drawResultPhoto(ctx) {
  const image = leagueState.resultPhoto;
  if (!image) return;

  clampPhotoTransform();

  const size = getResultPhotoCoverSize(image, leagueState.photoTransform.zoom);
  const x = (RESULT_STORY.width - size.width) / 2 + leagueState.photoTransform.x;
  const y = (RESULT_STORY.height - size.height) / 2 + leagueState.photoTransform.y;

  ctx.drawImage(image, x, y, size.width, size.height);
}

function getResultPhotoCoverSize(image, zoom = 1) {
  const imageRatio = image.width / image.height;
  const canvasRatio = RESULT_STORY.width / RESULT_STORY.height;

  let width;
  let height;

  if (imageRatio > canvasRatio) {
    height = RESULT_STORY.height * zoom;
    width = height * imageRatio;
  } else {
    width = RESULT_STORY.width * zoom;
    height = width / imageRatio;
  }

  return { width, height };
}

function getResultPhotoBounds() {
  if (!leagueState.resultPhoto) return { maxX: 0, maxY: 0 };

  const size = getResultPhotoCoverSize(
    leagueState.resultPhoto,
    leagueState.photoTransform.zoom
  );

  return {
    maxX: Math.max(0, Math.round((size.width - RESULT_STORY.width) / 2)),
    maxY: Math.max(0, Math.round((size.height - RESULT_STORY.height) / 2)),
  };
}

function updatePhotoRanges() {
  if (!leagueEls.photoX || !leagueEls.photoY) return;

  const { maxX, maxY } = getResultPhotoBounds();

  leagueEls.photoX.min = String(-maxX);
  leagueEls.photoX.max = String(maxX);
  leagueEls.photoY.min = String(-maxY);
  leagueEls.photoY.max = String(maxY);

  clampPhotoTransform();

  leagueEls.photoX.value = String(Math.round(leagueState.photoTransform.x));
  leagueEls.photoY.value = String(Math.round(leagueState.photoTransform.y));
  leagueEls.photoZoom.value = String(leagueState.photoTransform.zoom);

  leagueEls.photoX.disabled = maxX === 0;
  leagueEls.photoY.disabled = maxY === 0;
}

function clampPhotoTransform() {
  const { maxX, maxY } = getResultPhotoBounds();

  leagueState.photoTransform.x = clamp(
    Number(leagueState.photoTransform.x),
    -maxX,
    maxX
  );

  leagueState.photoTransform.y = clamp(
    Number(leagueState.photoTransform.y),
    -maxY,
    maxY
  );
}

function syncPhotoTransformFromRanges() {
  leagueState.photoTransform.x = Number(leagueEls.photoX.value);
  leagueState.photoTransform.y = Number(leagueEls.photoY.value);
  clampPhotoTransform();
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
      leagueState.photoTransform = { zoom: 1, x: 0, y: 0 };

      leagueEls.photoLabel.textContent = file.name;
      leagueEls.photoRemove.hidden = false;
      leagueEls.photoAdjust.hidden = false;

      updatePhotoRanges();
      renderResultStory();
    };

    image.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function removeResultPhoto() {
  leagueState.resultPhoto = null;
  leagueState.resultPhotoName = "";
  leagueState.photoTransform = { zoom: 1, x: 0, y: 0 };

  leagueEls.photoInput.value = "";
  leagueEls.photoLabel.textContent = "Foto auswählen / aufnehmen";
  leagueEls.photoRemove.hidden = true;
  leagueEls.photoAdjust.hidden = true;
  leagueEls.photoAdjust.open = false;

  updatePhotoRanges();
  renderResultStory();
}

function onResultPointerDown(event) {
  if (!leagueState.resultPhoto) return;

  leagueEls.canvas.setPointerCapture?.(event.pointerId);
  leagueState.pointers.set(event.pointerId, event);

  if (leagueState.pointers.size === 1) {
    leagueState.drag.active = true;
    leagueState.drag.startClientX = event.clientX;
    leagueState.drag.startClientY = event.clientY;
    leagueState.drag.startX = leagueState.photoTransform.x;
    leagueState.drag.startY = leagueState.photoTransform.y;
  }

  if (leagueState.pointers.size === 2) {
    const [a, b] = [...leagueState.pointers.values()];
    leagueState.pinch.active = true;
    leagueState.pinch.startDistance = getPointerDistance(a, b);
    leagueState.pinch.startZoom = leagueState.photoTransform.zoom;
    leagueState.drag.active = false;
  }
}

function onResultPointerMove(event) {
  if (!leagueState.resultPhoto || !leagueState.pointers.has(event.pointerId)) return;

  event.preventDefault();
  leagueState.pointers.set(event.pointerId, event);

  if (leagueState.pinch.active && leagueState.pointers.size >= 2) {
    const [a, b] = [...leagueState.pointers.values()];
    const distance = getPointerDistance(a, b);
    const ratio = distance / leagueState.pinch.startDistance;

    leagueState.photoTransform.zoom = clamp(
      leagueState.pinch.startZoom * ratio,
      Number(leagueEls.photoZoom.min),
      Number(leagueEls.photoZoom.max)
    );

    updatePhotoRanges();
    renderResultStory();
    return;
  }

  if (leagueState.drag.active && leagueState.pointers.size === 1) {
    const rect = leagueEls.canvas.getBoundingClientRect();
    const scaleX = RESULT_STORY.width / rect.width;
    const scaleY = RESULT_STORY.height / rect.height;

    leagueState.photoTransform.x =
      leagueState.drag.startX +
      (event.clientX - leagueState.drag.startClientX) * scaleX;

    leagueState.photoTransform.y =
      leagueState.drag.startY +
      (event.clientY - leagueState.drag.startClientY) * scaleY;

    clampPhotoTransform();
    updatePhotoRanges();
    renderResultStory();
  }
}

function onResultPointerUp(event) {
  leagueState.pointers.delete(event.pointerId);

  if (leagueState.pointers.size < 2) {
    leagueState.pinch.active = false;
  }

  if (leagueState.pointers.size === 1) {
    const remaining = [...leagueState.pointers.values()][0];

    leagueState.drag.active = true;
    leagueState.drag.startClientX = remaining.clientX;
    leagueState.drag.startClientY = remaining.clientY;
    leagueState.drag.startX = leagueState.photoTransform.x;
    leagueState.drag.startY = leagueState.photoTransform.y;
  } else {
    leagueState.drag.active = false;
  }
}

function getPointerDistance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function drawMatchday(ctx) {
  const value = sanitizeIntegerText(leagueEls.matchday.value);
  if (!value) return;

  const config = getActiveStoryLayout().matchday;

  ctx.save();
  ctx.textAlign = config.align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = leagueState.team === "a" ? config.colorA : config.colorB;
  ctx.font = `${config.fontSize}px "Topshow", Impact, sans-serif`;
  ctx.fillText(value, config.x, config.y);
  ctx.restore();
}

function drawTeamLogo(ctx, logoPath, config) {
  const image = getLeagueLogo(logoPath);
  if (!image) return;

  const ratio = Math.min(config.size / image.width, config.size / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;

  ctx.drawImage(
    image,
    config.x - width / 2,
    config.y - height / 2,
    width,
    height
  );
}

function drawScores(ctx, homeScore, awayScore) {
  const config = getActiveStoryLayout().scores;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = config.color;
  ctx.font = `${config.fontSize}px "Topshow", Impact, sans-serif`;

  ctx.fillText(homeScore || "-", config.homeX, config.y);
  ctx.fillText(awayScore || "-", config.awayX, config.y);

  ctx.restore();
}

function drawTeamNames(ctx, homeName, awayName) {
  const config = getActiveStoryLayout().teamNames;

  drawFittedStoryText(ctx, String(homeName).toUpperCase(), {
    x: config.homeX,
    y: config.y,
    maxWidth: config.maxWidth,
    fontSize: config.fontSize,
    minFontSize: config.minFontSize,
    color: config.color,
    align: "center",
    family: "Topshow",
  });

  drawFittedStoryText(ctx, String(awayName).toUpperCase(), {
    x: config.awayX,
    y: config.y,
    maxWidth: config.maxWidth,
    fontSize: config.fontSize,
    minFontSize: config.minFontSize,
    color: config.color,
    align: "center",
    family: "Topshow",
  });
}

function drawDate(ctx) {
  const value = formatLeagueDate(leagueEls.date.value);
  if (!value) return;

  const config = getActiveStoryLayout().date;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = config.color;
  ctx.font = `${config.fontSize}px "TacticSans", system-ui, sans-serif`;
  ctx.fillText(value, config.x, config.y);
  ctx.restore();
}

function drawDynamicStats(ctx) {
  if (hasResultPhoto()) {
    drawDynamicStatsWithPhoto(ctx);
  } else {
    drawDynamicStatsNoPhoto(ctx);
  }
}

function drawDynamicStatsWithPhoto(ctx) {
  const placedStats = getPlacedStats();

  placedStats.forEach((item, index) => {
    const slot = RESULT_STORY_LAYOUT.stats.slots[index];
    if (!slot) return;

    const assetInfo = getStatAssetInfo(item.key, slot);
    if (!assetInfo) return;

    const image = leagueState.images.story[assetInfo.fileName];
    const offsetX =
      (slot.col - assetInfo.naturalColumn) *
      RESULT_STORY_LAYOUT.stats.columnShift;

    drawFullAsset(ctx, image, offsetX, 0);

    const value = formatStatValue(item.key, item.value);
    if (!value) return;

    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle =
      slot.row === "top"
        ? RESULT_STORY_LAYOUT.stats.valueColorTop
        : RESULT_STORY_LAYOUT.stats.valueColorBottom;
    ctx.font = `${RESULT_STORY_LAYOUT.stats.valueFontSize}px "TacticSans", system-ui, sans-serif`;
    ctx.fillText(value, slot.x, slot.y);
    ctx.restore();
  });
}

function drawDynamicStatsNoPhoto(ctx) {
  const activeStats = getNoPhotoStats();
  const config = RESULT_STORY_LAYOUT_NO_IMAGE.stats;

  activeStats.forEach((item, index) => {
    const slot = config.slots[index];
    if (!slot) return;

    const assetInfo = getNoPhotoStatAssetInfo(item.key, slot);
    if (!assetInfo) return;

    const image = leagueState.images.story[assetInfo.fileName];
    const offsetY =
      (slot.index - assetInfo.naturalIndex) *
      config.rowShift;

    drawFullAsset(ctx, image, 0, offsetY);

    const value = formatStatValue(item.key, item.value);
    if (!value) return;

    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = config.valueColor;
    ctx.font = `${config.valueFontSize}px "TacticSans", system-ui, sans-serif`;
    ctx.fillText(value, slot.x, slot.y);
    ctx.restore();
  });
}

function getPlacedStats() {
  const leftTop = leagueEls.showLegs.checked
    ? {
        key: "legs",
        value: {
          home: leagueEls.legsHome.value,
          away: leagueEls.legsAway.value,
        },
      }
    : leagueEls.showFinish.checked
      ? { key: "finish", value: leagueEls.finish.value }
      : null;

  const rightTop = leagueEls.showShort.checked
    ? { key: "short", value: leagueEls.short.value }
    : leagueEls.showCounter.checked
      ? { key: "counter", value: leagueEls.counter.value }
      : null;

  const leftBottom =
    leagueEls.showLegs.checked && leagueEls.showFinish.checked
      ? { key: "finish", value: leagueEls.finish.value }
      : null;

  const rightBottom =
    leagueEls.showShort.checked && leagueEls.showCounter.checked
      ? { key: "counter", value: leagueEls.counter.value }
      : null;

  return [leftTop, rightTop, leftBottom, rightBottom].filter(Boolean);
}

function getNoPhotoStats() {
  return [
    leagueEls.showLegs.checked
      ? {
          key: "legs",
          value: {
            home: leagueEls.legsHome.value,
            away: leagueEls.legsAway.value,
          },
        }
      : null,
    leagueEls.showFinish.checked
      ? { key: "finish", value: leagueEls.finish.value }
      : null,
    leagueEls.showShort.checked
      ? { key: "short", value: leagueEls.short.value }
      : null,
    leagueEls.showCounter.checked
      ? { key: "counter", value: leagueEls.counter.value }
      : null,
  ].filter(Boolean);
}

function getStatAssetInfo(statKey, slot) {
  const suffix = leagueState.team;

  if (slot.row === "top") {
    if (statKey === "legs") {
      return { fileName: `legs-top-${suffix}.png`, naturalColumn: 0 };
    }

    if (statKey === "short") {
      return { fileName: `short-top-${suffix}.png`, naturalColumn: 1 };
    }

    if (statKey === "finish") {
      return { fileName: `fin-top-${suffix}.png`, naturalColumn: 0 };
    }

    if (statKey === "counter") {
      return { fileName: `counter-top-${suffix}.png`, naturalColumn: 1 };
    }
  }

  if (slot.row === "bottom") {
    if (statKey === "finish") {
      return { fileName: "fin-bottom.png", naturalColumn: 0 };
    }

    if (statKey === "counter") {
      return { fileName: "counter-bottom.png", naturalColumn: 1 };
    }
  }

  return null;
}

function getNoPhotoStatAssetInfo(statKey, slot) {
  const suffix = leagueState.team;
  const colored = slot.style === "color";

  // Alle No-Image-Assets liegen bereits an ihrer natürlichen Grundposition:
  // Legs = Zeile 0, Finish = Zeile 1, Short Game = Zeile 2, Counter = Zeile 3.
  // Deshalb darf bei allen vier aktiven Stats überhaupt keine Verschiebung
  // stattfinden. Erst wenn ein vorheriger Stat fehlt, wird nach oben geschoben.
  const naturalIndex = {
    legs: 0,
    finish: 1,
    short: 2,
    counter: 3,
  }[statKey];

  if (naturalIndex === undefined) return null;

  if (colored) {
    if (statKey === "legs") {
      return { fileName: `legs-top-${suffix}-no.png`, naturalIndex };
    }

    if (statKey === "finish") {
      return { fileName: `fin-top-${suffix}-no.png`, naturalIndex };
    }

    if (statKey === "short") {
      return { fileName: `short-top-${suffix}-no.png`, naturalIndex };
    }

    if (statKey === "counter") {
      return { fileName: `counter-top-${suffix}-no.png`, naturalIndex };
    }
  }

  if (statKey === "finish") {
    return { fileName: "fin-bottom-no.png", naturalIndex };
  }

  if (statKey === "short") {
    return { fileName: "short-bottom-no.png", naturalIndex };
  }

  if (statKey === "counter") {
    return { fileName: "counter-bottom-no.png", naturalIndex };
  }

  // Legs ist immer der erste aktive Stat und kann daher nur farbig oben stehen.
  if (statKey === "legs") {
    return { fileName: `legs-top-${suffix}-no.png`, naturalIndex };
  }

  return null;
}

function formatStatValue(statKey, rawValue) {
  if (statKey === "legs") {
    const home = sanitizeIntegerText(rawValue?.home);
    const away = sanitizeIntegerText(rawValue?.away);

    if (!home || !away) return "";
    return `${home}:${away}`;
  }

  const raw = String(rawValue ?? "").trim();
  if (!raw) return "";

  return sanitizeIntegerText(raw);
}
function getOutcomeAssetFile(ourScore, opponentScore, withPhoto = hasResultPhoto()) {
  if (!ourScore || !opponentScore) return "";

  const ours = Number(ourScore);
  const theirs = Number(opponentScore);
  const suffix = withPhoto ? "" : "-no";

  if (ours > theirs) return `win${suffix}.png`;
  if (ours < theirs) return `lose${suffix}.png`;
  return `draw${suffix}.png`;
}

function getSelectedOpponent() {
  if (leagueEls.opponent.value === "__custom__") {
    const name = leagueEls.customOpponent.value.trim();
    return name ? { id: "__custom__", name, logo: null } : null;
  }

  return (
    LEAGUE_CONFIG[leagueState.team].opponents.find(
      (opponent) => opponent.id === leagueEls.opponent.value
    ) || null
  );
}

function getLeagueLogo(path) {
  if (!path) return null;
  return leagueState.images.logos.get(path) || null;
}

function drawFittedStoryText(ctx, text, options) {
  let fontSize = options.fontSize;

  ctx.save();
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align;
  ctx.textBaseline = "alphabetic";

  while (fontSize > options.minFontSize) {
    ctx.font = `${fontSize}px "${options.family}", Impact, sans-serif`;

    if (ctx.measureText(text).width <= options.maxWidth) {
      break;
    }

    fontSize -= 2;
  }

  ctx.font = `${fontSize}px "${options.family}", Impact, sans-serif`;
  ctx.fillText(text, options.x, options.y);
  ctx.restore();
}

function openResultPreview() {
  if (!leagueEls.previewModal) return;

  leagueEls.previewModal.hidden = false;
  document.body.classList.add("result-modal-open");
  renderResultStory();
  syncModalPreview();
}

function closeResultPreview() {
  if (!leagueEls.previewModal) return;

  leagueEls.previewModal.hidden = true;
  document.body.classList.remove("result-modal-open");
}

function syncModalPreview() {
  if (
    !leagueEls.previewModal ||
    leagueEls.previewModal.hidden ||
    !leagueEls.modalCanvas ||
    !leagueEls.canvas
  ) {
    return;
  }

  const ctx = leagueEls.modalCanvas.getContext("2d");

  leagueEls.modalCanvas.width = RESULT_STORY.width;
  leagueEls.modalCanvas.height = RESULT_STORY.height;

  ctx.clearRect(0, 0, RESULT_STORY.width, RESULT_STORY.height);
  ctx.drawImage(leagueEls.canvas, 0, 0);
}

function downloadResultStory() {
  if (!validateResultBeforeExport()) return;

  renderResultStory();

  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const opponent = getSelectedOpponent()?.name || "gegner";
  const date = leagueEls.date.value || toLeagueInputDate(new Date());

  const link = document.createElement("a");
  link.download = `ergebnis-${leagueSlugify(teamConfig.label)}-${leagueSlugify(opponent)}-${date}.png`;
  link.href = leagueEls.canvas.toDataURL("image/png");
  link.click();
}

function validateResultBeforeExport() {
  const opponent = getSelectedOpponent();

  if (!opponent) {
    window.alert("Bitte zuerst einen Gegner auswählen.");
    return false;
  }

  const ours = parseOptionalNumber(leagueEls.ourScore.value);
  const theirs = parseOptionalNumber(leagueEls.opponentScore.value);

  if (ours === null || theirs === null) {
    window.alert("Bitte beide Ergebnisfelder ausfüllen.");
    return false;
  }

  if (!validateOptionalStats()) {
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

function validateOptionalStats() {
  if (leagueEls.showLegs.checked) {
    const homeLegs = parseOptionalNumber(leagueEls.legsHome.value);
    const awayLegs = parseOptionalNumber(leagueEls.legsAway.value);

    if (homeLegs === null || awayLegs === null) {
      window.alert("Bitte Heim- und Auswärts-Legs eingeben.");
      return false;
    }
  }

  if (leagueEls.showShort.checked) {
    const shortGame = parseOptionalNumber(leagueEls.short.value);

    if (shortGame === null || shortGame < 9 || shortGame > 18) {
      window.alert("Short Game muss zwischen 9 und 18 Darts liegen.");
      return false;
    }
  }

  if (leagueEls.showFinish.checked) {
    const finish = parseOptionalNumber(leagueEls.finish.value);

    if (finish === null || finish < 1 || finish > 170) {
      window.alert("Highest Finish muss zwischen 1 und 170 liegen.");
      return false;
    }
  }

  if (leagueEls.showCounter.checked) {
    const counter = parseOptionalNumber(leagueEls.counter.value);

    if (counter === null || counter < 1 || counter > 99) {
      window.alert("Bitte die Anzahl der 180er als ganze Zahl eingeben.");
      return false;
    }
  }

  return true;
}

function sanitizeScore(value) {
  const raw = sanitizeIntegerText(value);
  return raw.slice(0, 2);
}

function sanitizeIntegerText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\D/g, "");
}

function parseOptionalNumber(value) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
