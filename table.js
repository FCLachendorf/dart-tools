// Alle Positionen beziehen sich auf die exportierten 1080 × 1920 Pixel.
// Größeres Y = weiter unten. Die Eingabereihenfolge bleibt unverändert.
const TABLE_STORY_LAYOUT = {
  width: 1080, height: 1920,
  background: "assets/league/table/story/bgb.png",
  matchday: { x: 134, y: 254, fontSize: 58, maxWidth: 64, color: "#ededf5" },
  headerY: 660, startY: 770, rowHeight: 118,
  columns: {
    place: { x: 82, maxWidth: 54, align: "left", label: "PLATZ" },
    team: { x: 224, maxWidth: 315, align: "left", label: "MANNSCHAFT" },
    games: { x: 590, maxWidth: 82, align: "center", label: "SPIELE" },
    points: { x: 686, maxWidth: 86, align: "center", label: "PUNKTE" },
    sets: { x: 804, maxWidth: 116, align: "center", label: "SETS" },
    legs: { x: 998, maxWidth: 118, align: "right", label: "LEGS" },
  },
  fonts: { header: 34, team: 38, values: 32, minTeam: 18, minValue: 16 },
  colors: { header: "#d7d7db", text: "#ffffff", row: "rgba(5,5,8,.72)", alternateRow: "rgba(5,5,8,.55)" },
  rowBox: { x: 48, width: 984, height: 104 },
  highlight: { enabled: true, background: "#d7d7db", text: "#111114", accent: "#ffffff", accentWidth: 6 },
};

(() => {
  "use strict";
  const TEAM_CONFIG = {
    a: {
      enabled:true, league:"Kreisklasse Süd/Ost", own:"FC Lachendorf A", layout:TABLE_STORY_LAYOUT,
      clubs:["DSV Hambühren D","FC Lachendorf A","MTV Beedenbostel B","PSV Celle B","Scheuener Heidedarter A","TuS Eschede A","Vorwerk Fun Force A"],
    },
    b: {
      enabled: true, league: "Kreisklasse Süd", own: "FC Lachendorf B", layout: TABLE_STORY_LAYOUT,
      clubs: ["Bulls Eye C", "DSV Hambühren C", "FC Lachendorf B", "MTV Beedenbostel A", "Team Utd. Südseite C", "TuS Eschede B", "VfL Schickeria A"],
    },
  };
  let format="story";
  let team="b", config = TEAM_CONFIG.b;
  const drafts=new Map(), completed=new Set(), designs=new Map(), logos=new Map();
  const logoKey=name=>DartTableData.normalize(name.replace(" Darts", "").replace("Südseite", "Südheide"));
  const $ = id => document.getElementById(id);
  const canvas = $("tableCanvas"), ctx = canvas.getContext("2d");
  const rows = [];
  let photo = null, ready = false;
  let request = 0, opened = false;
  const numeric = key => key === "place" || key === "games" || key === "points";
  const labels = { place: "Platz", team: "Mannschaft", games: "Spiele", points: "Punkte", sets: "Sets", legs: "Legs" };

  function buildRows() {
  rows.length=0; $("tableRows").replaceChildren();
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
      input.addEventListener("input", () => { request++; completed.add(team); $("tableRefresh").disabled=false; $("tableSource").textContent="Manuell bearbeitet · Automatische Werte werden erst nach erneutem Aktualisieren übernommen."; clearCustomErrors(); updateSummary(); render(); });
      input.addEventListener("change", () => { request++; completed.add(team); $("tableRefresh").disabled=false; $("tableSource").textContent="Manuell bearbeitet · Automatische Werte werden erst nach erneutem Aktualisieren übernommen."; clearCustomErrors(); updateSummary(); render(); });
    }
    function updateSummary() {
      title.textContent = `${fields.place.value || "–"} · ${fields.team.value}`;
      info.textContent = `${fields.games.value || "–"} Spiele · ${fields.points.value || "–"} Punkte · ${fields.sets.value || "–"} Sets · ${fields.legs.value || "–"} Legs`;
    }
    details.append(grid); $("tableRows").append(details);
    rows.push({ fields, details, updateSummary }); updateSummary();
  });
  }
  buildRows();
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
    const l = format === "post" ? {...config.layout,height:1350,headerY:455,startY:540,rowHeight:100,rowBox:{...config.layout.rowBox,height:88},matchday:{...config.layout.matchday,y:148}} : config.layout;
    canvas.height=l.height;
    ctx.clearRect(0, 0, l.width, l.height);
    if(!ready) { ctx.fillStyle = "#1b1b20"; ctx.fillRect(0,0,l.width,l.height); return; }
    ctx.drawImage(designs.get(`${format}/${team}`).background, 0, 0, l.width, l.height);
    if(photo) {
      const scale=Math.max(l.width/photo.width,l.height/photo.height)*Number($("tablePhotoZoom").value), w=photo.width*scale,h=photo.height*scale;
      ctx.drawImage(photo,(l.width-w)*Number($("tablePhotoX").value)/100,(l.height-h)*Number($("tablePhotoPosition").value)/100,w,h);
    }
    ctx.drawImage(designs.get(`${format}/${team}`).overlay,0,0,l.width,l.height);
    text(config.league,540,l.height-105,32,960,"center",l.colors.header,"TableTop",24);
    const day = $("tableMatchday").value;
    if(day) text(day, l.matchday.x, l.matchday.y, l.matchday.fontSize, l.matchday.maxWidth, "center", team === "a" ? "#cc2331" : l.matchday.color, "TableTop", 18);
    // Give headings their own width so the narrow rank cell cannot shrink every title.
    for(const [key,column] of Object.entries(l.columns)) text(column.label, column.x, l.headerY, l.fonts.header, key === "place" ? 90 : column.maxWidth, column.align, l.colors.header, "TableTop", l.fonts.header);
    rows.forEach(({fields}, index) => {
      const y = l.startY + index * l.rowHeight;
      const own = l.highlight.enabled && [config.own,`FC Lachendorf Darts ${team.toUpperCase()}`].includes(fields.team.value);
      ctx.fillStyle = own ? l.highlight.background : index % 2 ? l.colors.alternateRow : l.colors.row;
      ctx.fillRect(l.rowBox.x, y-l.rowBox.height/2, l.rowBox.width, l.rowBox.height);
      if(own) { ctx.fillStyle=l.highlight.accent; ctx.fillRect(l.rowBox.x,y-l.rowBox.height/2,l.highlight.accentWidth,l.rowBox.height); }
      const logo=logos.get(logoKey(fields.team.value));
      if(logo) {
        const size=64, scale=Math.min(size/logo.width,size/logo.height);
        ctx.drawImage(logo,176-logo.width*scale/2,y-logo.height*scale/2,logo.width*scale,logo.height*scale);
      }
      for(const [key,column] of Object.entries(l.columns)) {
        const value = fields[key].value.trim().replace(/\s*:\s*/g, ":") || "–";
        text(value, column.x, y, key === "team" ? l.fonts.team : l.fonts.values, column.maxWidth, column.align,
          team === "a" ? "#cc2331" : own ? l.highlight.text : l.colors.text, key === "team" ? "TableTop" : "TableNumbers", key === "team" ? l.fonts.minTeam : l.fonts.minValue);
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
      const row=invalid.closest("details"); if(row) row.open=true; $("tableManual").open=true;
      invalid.focus(); invalid.reportValidity();
      $("tableStatus").textContent="Bitte die markierte Eingabe prüfen.";
      return;
    }
    try {
      render();
      await window.exportCanvasPng(canvas, `tabelle-team-${team}-spieltag-${$("tableMatchday").value}-${format}.png`);
    } catch(error) { console.error(error); $("tableStatus").textContent="Export fehlgeschlagen. Bitte erneut versuchen."; }
  });
  document.querySelectorAll("[data-table-team]").forEach(button=>button.addEventListener("click",()=>{
    const next=button.dataset.tableTeam;
    if(next===team) return;
    drafts.set(team,{clubs:Array.from(rows[0].fields.team.options,option=>option.value),rows:rows.map(({fields})=>Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value]))),source:$("tableSource").textContent,day:$("tableMatchday").value});
    request++; team=next; config=TEAM_CONFIG[team]; buildRows();
    const draft=drafts.get(team);
    if(draft) {
      const clubs=draft.clubs;
      rows.forEach(({fields,updateSummary},index)=>{
        fields.team.replaceChildren(); clubs.forEach(name=>fields.team.add(new Option(name,name)));
        Object.entries(draft.rows[index]).forEach(([key,value])=>fields[key].value=value); updateSummary();
      });
      $("tableMatchday").value=draft.day; $("tableSource").textContent=draft.source;
    } else { $("tableMatchday").value=""; $("tableSource").textContent=""; }
    document.querySelectorAll("[data-table-team]").forEach(btn=>{btn.classList.toggle("active",btn.dataset.tableTeam===team);btn.setAttribute("aria-pressed",String(btn.dataset.tableTeam===team));});
    canvas.setAttribute("aria-label",`Live-Vorschau der Team-${team.toUpperCase()}-Tabelle`);
    $("tableTool").dataset.team=team;
    $("tableRefresh").disabled=false; clearCustomErrors(); render();
    if(!completed.has(team)) loadStandings();
  }));
  document.querySelectorAll("[data-table-format]").forEach(button=>button.addEventListener("click",()=>{
    format=button.dataset.tableFormat;
    document.querySelectorAll("[data-table-format]").forEach(btn=>{btn.classList.toggle("active",btn.dataset.tableFormat===format);btn.setAttribute("aria-pressed",String(btn.dataset.tableFormat===format));});
    $("tableDownload").textContent=format==="post"?"Post herunterladen":"Story herunterladen";
    $("tablePreviewTitle").textContent=format==="post"?"Tabellen-Post":"Tabellen-Story";
    $("tablePreviewSize").textContent=format==="post"?"1080 × 1350 px":"1080 × 1920 px";
    render();
  }));
  const DATA_ROOT="https://raw.githubusercontent.com/FCLachendorf/dart-tools/main/";
  async function json(url) {
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),6000);
    try { const response=await fetch(url,{signal:controller.signal,cache:"no-store"}); if(!response.ok) throw new Error("HTTP "+response.status); return await response.json(); }
    finally { clearTimeout(timer); }
  }
  async function loadStandings() {
    const token=++request, selectedTeam=team;
    $("tableRefresh").disabled=true;
    $("tableSource").textContent="3K-Tabelle wird geladen …";
    try {
      let settings;
      try { settings=await json(DATA_ROOT+"data/3k-leagues.json"); } catch { settings=await json("data/3k-leagues.json"); }
      const league=settings?.leagues?.[selectedTeam];
      if(!Number.isInteger(league?.event) || !league.ownName) throw new Error("Liga-Einstellung fehlt");
      let event=league.event;
      try { event=DartPreviewData.eventFromUrl(JSON.parse(localStorage.getItem("fcl-darts-preview-league-links-v1") || "{}")[selectedTeam]) || event; } catch {}
      const key=`fcl-darts-table-v1-${event}`;
      let result;
      try {
        const data=await json(`https://backend-ddv.3k-darts.com/2k-backend-ddv/api/v1/frontend/event/${event}/phase/0/round/0/table`);
        result={rows:DartTableData.live(data,league.ownName),stamp:new Date().toISOString(),source:"3K live"};
      } catch {
        const candidates=await Promise.all([DATA_ROOT+"data/3k-cache.json","data/3k-cache.json"].map(async url=>{
          try { return {...DartTableData.snapshot(await json(url),event,league.ownName),source:"Gespeicherter 3K-Stand"}; } catch { return null; }
        }));
        try {
          const saved=JSON.parse(localStorage.getItem(key));
          if(saved && Number.isFinite(Date.parse(saved.stamp))) candidates.push({rows:DartTableData.validate(saved.rows,league.ownName),stamp:saved.stamp,source:"Letzter auf diesem Gerät geladener Stand"});
        } catch {}
        result=candidates.filter(Boolean).sort((a,b)=>Date.parse(b.stamp)-Date.parse(a.stamp))[0];
        if(!result) throw new Error("Kein vollständiger Stand erreichbar");
      }
      if(token!==request) return;
      // Validate everything before changing any field; never mix standings from different dates.
      const clubs=result.rows.map(row=>row.team);
      rows.forEach(({fields,updateSummary},index)=>{
        fields.team.replaceChildren(); clubs.forEach(name=>fields.team.add(new Option(name,name)));
        for(const [key,value] of Object.entries(result.rows[index])) fields[key].value=String(value);
        updateSummary();
      });
      try { localStorage.setItem(key,JSON.stringify({rows:result.rows,stamp:result.stamp})); } catch {}
      completed.add(team); clearCustomErrors(); render();
      $("tableSource").textContent=`${result.source} · Stand ${new Date(result.stamp).toLocaleString("de-DE")} · ${config.league}`;
    } catch(error) {
      if(token!==request) return;
      $("tableSource").textContent="3K-Tabelle derzeit nicht erreichbar. Vorhandene Werte bleiben erhalten. Bitte erneut aktualisieren oder manuell eintragen.";
      $("tableManual").open=true;
    } finally { if(token===request) $("tableRefresh").disabled=false; }
  }
  $("tableRefresh").addEventListener("click",loadStandings);
  // Load only on first opening; returning to this tab preserves manual corrections.
  const onOpen=()=>{if(!$("tableTool").hidden && !opened) { opened=true; loadStandings(); }};
  new MutationObserver(onOpen).observe($("tableTool"),{attributes:true,attributeFilter:["hidden"]});
  onOpen();
  let photoRequest=0;
  $("tablePhoto").addEventListener("change",()=>{
    const file=$("tablePhoto").files?.[0], token=++photoRequest;
    if(!file) return;
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url); if(token!==photoRequest) return; photo=img; $("tablePhotoLabel").textContent=file.name; $("tablePhotoRemove").hidden=false; $("tablePhotoAdjust").hidden=false; $("tablePhotoZoom").value="1"; $("tablePhotoX").value="50"; $("tablePhotoPosition").value="50"; render(); $("tableStatus").textContent="";};
    img.onerror=()=>{URL.revokeObjectURL(url); if(token===photoRequest) $("tableStatus").textContent="Foto konnte nicht geöffnet werden. Bitte JPG oder PNG verwenden.";};
    img.src=url;
  });
  for(const id of ["tablePhotoPosition","tablePhotoZoom","tablePhotoX"]) $(id).addEventListener("input",render);
  $("tablePhotoRemove").addEventListener("click",()=>{photoRequest++; photo=null; $("tablePhoto").value=""; $("tablePhotoLabel").textContent="Foto auswählen / aufnehmen"; $("tablePhotoRemove").hidden=true; $("tablePhotoAdjust").hidden=true; render();});
  async function init() {
    try {
      const image = path => new Promise((resolve,reject) => {
        const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error("Tabellendesign nicht geladen")); img.src=path;
      });
      const fonts = [["TableTop","topshow"],["TableNumbers","tacticsans"]].map(async ([name,file]) => {
        const font=new FontFace(name, `url(fonts/${file}.otf)`); document.fonts.add(await font.load());
      });
      await Promise.all([...fonts,...["story/a","story/b","post/a","post/b"].map(async id=>{
        const [kind,key]=id.split("/");
        const [background,overlay]=await Promise.all([image(`assets/league/table/${kind}/${key==="a"?"bg":"bgb"}.png`),image(`assets/league/table/${kind}/overlay${key}.png`)]);
        designs.set(id,{background,overlay});
      })]);
      if(typeof LEAGUE_CONFIG !== "undefined") await Promise.all(Object.values(LEAGUE_CONFIG).flatMap(t=>[{name:t.clubName,logo:t.logo},...t.opponents]).map(async club=>{
        try { logos.set(logoKey(club.name),await image(club.logo)); } catch { /* Leave the logo space empty if unavailable. */ }
      }));
      ready=true; $("tableDownload").disabled=false; $("tableStatus").textContent=""; render();
    } catch(error) { console.error(error); $("tableStatus").textContent="Tabellendesign konnte nicht geladen werden. Bitte Seite neu laden."; }
  }
  render(); init();
})();
