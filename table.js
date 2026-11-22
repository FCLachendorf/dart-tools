// Alle Positionen beziehen sich auf die exportierten 1080 × 1920 Pixel.
// Größeres Y = weiter unten. Die Eingabereihenfolge bleibt unverändert.
const TABLE_STORY_LAYOUT = {
  width: 1080, height: 1920,
  background: "assets/league/table/story/bgb.png",
  matchday: { x: 134, y: 254, fontSize: 58, maxWidth: 64, color: "#ededf5" },
  headerY: 660, startY: 770, rowHeight: 118,
  columns: {
    place: { x: 100, maxWidth: 75, align: "center", label: "PLATZ" },
    team: { x: 163, maxWidth: 395, align: "left", label: "MANNSCHAFT" },
    games: { x: 613, maxWidth: 86, align: "center", label: "SPIELE" },
    points: { x: 719, maxWidth: 88, align: "center", label: "PUNKTE" },
    sets: { x: 833, maxWidth: 112, align: "center", label: "SETS" },
    legs: { x: 973, maxWidth: 130, align: "center", label: "LEGS" },
  },
  fonts: { header: 28, team: 38, values: 32, minTeam: 18, minValue: 16 },
  colors: { header: "#d7d7db", text: "#ffffff", row: "rgba(5,5,8,.72)", alternateRow: "rgba(5,5,8,.55)" },
  rowBox: { x: 48, width: 990, height: 104 },
  highlight: { enabled: true, background: "#d7d7db", text: "#111114", accent: "#ffffff", accentWidth: 6 },
};

(() => {
  "use strict";
  const TEAM_CONFIG = {
    a: { enabled: false },
    b: {
      enabled: true, own: "FC Lachendorf B", layout: TABLE_STORY_LAYOUT,
      clubs: ["Bulls Eye C", "DSV Hambühren C", "FC Lachendorf B", "MTV Beedenbostel A", "Team Utd. Südseite C", "TuS Eschede B", "VfL Schickeria A"],
    },
  };
  const config = TEAM_CONFIG.b;
  const $ = id => document.getElementById(id);
  const canvas = $("tableCanvas"), ctx = canvas.getContext("2d");
  const rows = [];
  let background = null, ready = false;
  const numeric = key => key === "place" || key === "games" || key === "points";
  const labels = { place: "Platz", team: "Mannschaft", games: "Spiele", points: "Punkte", sets: "Sets", legs: "Legs" };

  config.clubs.forEach((club, index) => {
    const details = document.createElement("details");
    details.className = "table-edit-row"; details.open = index === 0;
    const summary = document.createElement("summary");
    const title = document.createElement("strong"), info = document.createElement("span");
    summary.append(title, info); details.append(summary);
    const grid = document.createElement("div"); grid.className = "table-edit-grid";
    const fields = {};
    for (const key of ["team", "place", "games", "points", "sets", "legs"]) {
      const label = document.createElement("label"); label.textContent = labels[key];
      if(key === "team") label.className = "table-team-field";
      const input = document.createElement(key === "team" ? "select" : "input");
      input.id = `table-${index}-${key}`; input.setAttribute("aria-label", `Zeile ${index+1}: ${labels[key]}`);
      input.required = true;
      if (key === "team") {
        config.clubs.forEach(name => input.add(new Option(name, name)));
        input.value = club;
      } else if (numeric(key)) {
        input.type = "number"; input.step = "1"; input.min = key === "place" ? "1" : key === "points" ? "-999" : "0";
        input.max = key === "place" ? "7" : "999";
        input.inputMode = key === "points" ? "text" : "numeric";
        input.placeholder = "0";
        if (key === "place") input.value = String(index + 1);
      } else {
        input.type = "text"; input.inputMode = "text"; input.maxLength = 13;
        input.pattern = "[0-9]{1,4}\\s*:\\s*[0-9]{1,4}";
        input.placeholder = "0:0"; input.title = "Verhältnis eintragen, z. B. 12:6";
      }
      fields[key] = input; label.append(input); grid.append(label);
      input.addEventListener("input", () => { clearCustomErrors(); updateSummary(); render(); });
      input.addEventListener("change", () => { clearCustomErrors(); updateSummary(); render(); });
    }
    function updateSummary() {
      title.textContent = `${fields.place.value || "–"} · ${fields.team.value}`;
      info.textContent = `${fields.games.value || "–"} Spiele · ${fields.points.value || "–"} Punkte · ${fields.sets.value || "–"} Sets · ${fields.legs.value || "–"} Legs`;
    }
    details.append(grid); $("tableRows").append(details);
    rows.push({ fields, details }); updateSummary();
  });
  function clearCustomErrors() {
    rows.forEach(row => Object.values(row.fields).forEach(field => field.setCustomValidity("")));
    $("tableStatus").textContent = ready ? "" : $("tableStatus").textContent;
  }
  function text(value, x, y, size, maxWidth, align, color, family, minSize) {
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
    ctx.font = `${size}px ${family}`;
    while(ctx.measureText(value).width > maxWidth && size > minSize) ctx.font = `${--size}px ${family}`;
    ctx.fillText(value, x, y, maxWidth);
  }
  function render() {
    const l = config.layout;
    ctx.clearRect(0, 0, l.width, l.height);
    if(!ready) { ctx.fillStyle = "#1b1b20"; ctx.fillRect(0,0,l.width,l.height); return; }
    ctx.drawImage(background, 0, 0, l.width, l.height);
    const day = $("tableMatchday").value;
    if(day) text(day, l.matchday.x, l.matchday.y, l.matchday.fontSize, l.matchday.maxWidth, "center", l.matchday.color, "TableTop", 18);
    for(const column of Object.values(l.columns)) text(column.label, column.x, l.headerY, l.fonts.header, column.maxWidth, column.align, l.colors.header, "TableTop", 16);
    rows.forEach(({fields}, index) => {
      const y = l.startY + index * l.rowHeight;
      const own = l.highlight.enabled && fields.team.value === config.own;
      ctx.fillStyle = own ? l.highlight.background : index % 2 ? l.colors.alternateRow : l.colors.row;
      ctx.fillRect(l.rowBox.x, y-l.rowBox.height/2, l.rowBox.width, l.rowBox.height);
      if(own) { ctx.fillStyle=l.highlight.accent; ctx.fillRect(l.rowBox.x,y-l.rowBox.height/2,l.highlight.accentWidth,l.rowBox.height); }
      for(const [key,column] of Object.entries(l.columns)) {
        const value = fields[key].value.trim().replace(/\s*:\s*/g, ":") || "–";
        text(value, column.x, y, key === "team" ? l.fonts.team : l.fonts.values, column.maxWidth, column.align,
          own ? l.highlight.text : l.colors.text, key === "team" ? "TableTop" : "TableNumbers", key === "team" ? l.fonts.minTeam : l.fonts.minValue);
      }
    });
  }
  $("tableMatchday").addEventListener("input", () => { clearCustomErrors(); render(); });
  $("tableForm").addEventListener("submit", event => event.preventDefault());
  $("tableDownload").addEventListener("click", async () => {
    if(!ready) return;
    clearCustomErrors();
    for(const key of ["place","team"]) {
      const seen = new Set();
      rows.forEach(({fields}) => {
        const field=fields[key], value=key === "place" ? Number(field.value) : field.value;
        if(seen.has(value)) field.setCustomValidity(key === "team" ? "Jede Mannschaft bitte genau einmal auswählen." : "Jeden Platz bitte genau einmal vergeben.");
        seen.add(value);
      });
    }
    const invalid = [...$("tableForm").querySelectorAll("input,select")].find(input => !input.checkValidity());
    if(invalid) {
      const row=invalid.closest("details"); if(row) row.open=true;
      invalid.focus(); invalid.reportValidity();
      $("tableStatus").textContent="Bitte die markierte Eingabe prüfen.";
      return;
    }
    try {
      render();
      await window.exportCanvasPng(canvas, `tabelle-team-b-spieltag-${$("tableMatchday").value}-story.png`);
    } catch(error) { console.error(error); $("tableStatus").textContent="Export fehlgeschlagen. Bitte erneut versuchen."; }
  });
  async function init() {
    try {
      const image = new Promise((resolve,reject) => {
        const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error("Tabellenhintergrund nicht geladen")); img.src=config.layout.background;
      });
      const fonts = [["TableTop","topshow"],["TableNumbers","tacticsans"]].map(async ([name,file]) => {
        const font=new FontFace(name, `url(fonts/${file}.otf)`); document.fonts.add(await font.load());
      });
      [background] = await Promise.all([image,...fonts]);
      ready=true; $("tableDownload").disabled=false; $("tableStatus").textContent=""; render();
    } catch(error) { console.error(error); $("tableStatus").textContent="Tabellendesign konnte nicht geladen werden. Bitte Seite neu laden."; }
  }
  render(); init();
})();
