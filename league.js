const LEAGUE_CONFIG = {
  a: {
    label: "A-Team",
    clubName: "FC Lachendorf A",
    opponents: [],
  },
  b: {
    label: "B-Team",
    clubName: "FC Lachendorf B",
    opponents: [],
  },
};

const leagueEls = {
  navLinks: [...document.querySelectorAll("[data-tool-target]")],
  pages: [...document.querySelectorAll("[data-tool-page]")],
  nav: document.getElementById("nav"),

  teamButtons: [...document.querySelectorAll("[data-league-team]")],
  locationButtons: [...document.querySelectorAll("[data-match-location]")],
  opponent: document.getElementById("resultOpponent"),
  customOpponentWrap: document.getElementById("customOpponentWrap"),
  customOpponent: document.getElementById("resultCustomOpponent"),
  ourScore: document.getElementById("resultOurScore"),
  opponentScore: document.getElementById("resultOpponentScore"),
  matchday: document.getElementById("resultMatchday"),
  date: document.getElementById("resultDate"),
  canvas: document.getElementById("resultCanvas"),
  downloadButton: document.getElementById("resultDownloadButton"),
};

const leagueState = {
  activeTool: "training",
  team: "a",
  location: "home",
};

if (leagueEls.canvas) {
  leagueEls.ctx = leagueEls.canvas.getContext("2d");
  initLeagueTools();
}

async function initLeagueTools() {
  leagueEls.date.value = toLeagueInputDate(new Date());
  bindLeagueEvents();
  populateOpponentSelect();
  await loadLeagueFonts();
  updateLeagueUi();
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
  ].forEach((element) => {
    element?.addEventListener("input", () => {
      updateCustomOpponentUi();
      renderResultStory();
    });
    element?.addEventListener("change", () => {
      updateCustomOpponentUi();
      renderResultStory();
    });
  });

  leagueEls.downloadButton.addEventListener("click", downloadResultStory);
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
  } catch (error) {
    console.warn("Liga-Schriften konnten nicht vollständig geladen werden.", error);
  }
}

function renderResultStory() {
  const ctx = leagueEls.ctx;
  const width = leagueEls.canvas.width;
  const height = leagueEls.canvas.height;
  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const opponentName = getSelectedOpponentName() || "GEGNER";
  const ourScore = sanitizeLeagueScore(leagueEls.ourScore.value);
  const opponentScore = sanitizeLeagueScore(leagueEls.opponentScore.value);
  const resultLabel = getResultLabel(ourScore, opponentScore);
  const isHome = leagueState.location === "home";

  const homeName = isHome ? teamConfig.clubName : opponentName;
  const awayName = isHome ? opponentName : teamConfig.clubName;
  const homeScore = isHome ? ourScore : opponentScore;
  const awayScore = isHome ? opponentScore : ourScore;

  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#08080a");
  background.addColorStop(0.58, "#111116");
  background.addColorStop(1, "#08080a");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  drawResultGrid(ctx, width, height);
  drawResultAccents(ctx, width, height);

  ctx.textAlign = "left";
  ctx.fillStyle = "#e31b2f";
  ctx.font = '34px "TacticSans", system-ui, sans-serif';
  ctx.fillText(`DART LIGA  •  ${teamConfig.label.toUpperCase()}`, 76, 140);

  ctx.fillStyle = "#ededf5";
  ctx.font = '118px "Topshow", Impact, sans-serif';
  ctx.fillText("ERGEBNIS", 72, 275);

  const matchdayText = sanitizeLeagueScore(leagueEls.matchday.value);
  const metaParts = [leagueState.location === "home" ? "HEIMSPIEL" : "AUSWÄRTSSPIEL"];
  if (matchdayText) metaParts.push(`${matchdayText}. SPIELTAG`);

  ctx.fillStyle = "#a0a0ad";
  ctx.font = '31px "TacticSans", system-ui, sans-serif';
  ctx.fillText(metaParts.join("  •  "), 76, 345);

  drawTeamBlock(ctx, homeName, "HEIM", 76, 600, width - 152);
  drawScoreBlock(ctx, homeScore, awayScore, width, 910);
  drawTeamBlock(ctx, awayName, "AUSWÄRTS", 76, 1240, width - 152);

  const badgeWidth = 430;
  const badgeX = (width - badgeWidth) / 2;
  const badgeY = 1480;
  ctx.fillStyle = resultLabel.color;
  roundRect(ctx, badgeX, badgeY, badgeWidth, 112, 28);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = '58px "Topshow", Impact, sans-serif';
  ctx.fillText(resultLabel.text, width / 2, badgeY + 76);

  ctx.fillStyle = "#6f6f79";
  ctx.font = '30px "TacticSans", system-ui, sans-serif';
  ctx.fillText(formatLeagueDate(leagueEls.date.value), width / 2, 1740);

  ctx.fillStyle = "#ededf5";
  ctx.font = '38px "Topshow", Impact, sans-serif';
  ctx.fillText("FC LACHENDORF DARTS", width / 2, 1825);

  ctx.fillStyle = "#e31b2f";
  ctx.fillRect(380, 1865, 320, 8);
}

function drawResultGrid(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawResultAccents(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = "rgba(227, 27, 47, 0.92)";
  ctx.beginPath();
  ctx.moveTo(width * 0.72, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 380);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(227, 27, 47, 0.12)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width, height * 0.53);
  ctx.lineTo(width, height * 0.63);
  ctx.lineTo(0, height * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTeamBlock(ctx, teamName, role, x, y, maxWidth) {
  ctx.textAlign = "left";
  ctx.fillStyle = "#e31b2f";
  ctx.font = '28px "TacticSans", system-ui, sans-serif';
  ctx.fillText(role, x, y);

  drawLeagueFittedText(ctx, String(teamName).toUpperCase(), {
    x,
    y: y + 96,
    maxWidth,
    fontSize: 72,
    minFontSize: 38,
    family: "Topshow",
    color: "#ededf5",
    align: "left",
  });
}

function drawScoreBlock(ctx, homeScore, awayScore, width, y) {
  const left = homeScore || "–";
  const right = awayScore || "–";

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = '196px "Topshow", Impact, sans-serif';
  ctx.fillText(left, width / 2 - 170, y);
  ctx.fillText(right, width / 2 + 170, y);

  ctx.fillStyle = "#e31b2f";
  ctx.font = '116px "Topshow", Impact, sans-serif';
  ctx.fillText(":", width / 2, y - 18);
}

function drawLeagueFittedText(ctx, text, options) {
  let fontSize = options.fontSize;
  ctx.save();
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align;
  ctx.textBaseline = "alphabetic";

  while (fontSize > options.minFontSize) {
    ctx.font = `${fontSize}px "${options.family}", Impact, sans-serif`;
    if (ctx.measureText(text).width <= options.maxWidth) break;
    fontSize -= 2;
  }

  ctx.fillText(text, options.x, options.y);
  ctx.restore();
}

function getSelectedOpponentName() {
  if (leagueEls.opponent.value === "__custom__") {
    return leagueEls.customOpponent.value.trim();
  }

  const option = leagueEls.opponent.selectedOptions?.[0];
  return option?.value ? option.textContent.trim() : "";
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

function downloadResultStory() {
  renderResultStory();
  const teamConfig = LEAGUE_CONFIG[leagueState.team];
  const opponent = getSelectedOpponentName() || "gegner";
  const date = leagueEls.date.value || toLeagueInputDate(new Date());
  const fileName = `ergebnis-${leagueSlugify(teamConfig.label)}-${leagueSlugify(opponent)}-${date}.png`;

  const link = document.createElement("a");
  link.download = fileName;
  link.href = leagueEls.canvas.toDataURL("image/png");
  link.click();
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
