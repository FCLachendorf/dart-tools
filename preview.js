(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const root = $("previewTool");
  if (!root) return;
  const canvas = $("previewCanvas"), ctx = canvas.getContext("2d");
  const fields = Object.fromEntries(["Opponent", "CustomOpponent", "Matchday", "Date", "Time", "Venue", "Address", "Compare"].map(name => [name, $("preview" + name)]));
  const metrics = [
    { key:"place", label:"Tabellenplatz", max:99 }, { key:"points", label:"Punkte", max:999 },
    { key:"games", label:"Spiele", max:99 }, { key:"finish", label:"Highfinish ab 101", max:170 },
    { key:"counter", label:"180er", max:999 }
  ];
  const state = { team:"a", location:"home", images:new Map(), ready:false, request:0, stamp:null, edited:false, controller:null };
  const cache = new Map();
  // Shared venues for A/B or C/D teams; addresses supplied by the club.
  const venues = {
    lachendorf: { name:"Zum Oche an der Lachte", address:"Rehrkamp 33, 29331 Lachendorf" },
    hambuehren: { name:"Vereinsheim Hambühren", address:"Am Ring 1, 29313 Hambühren" },
    beedenbostel: { name:"Sportheim Beedenbostel", address:"Ahnsbecker Str. 40, 29355 Beedenbostel" },
    psv: { name:"PSV Vereinsheim", address:"Steinbecksweg 3, 29227 Celle" },
    scheuen: { name:"Sportheim SSV Scheuen", address:"Hermannsburger Weg 10, 29229 Celle" },
    eschede: { name:"Flight Club Eschede", address:"Südstr. 2, 29348 Eschede" },
    vorwerk: { name:"Sportplatz Vereinsheim Vorwerk", address:"Reuterweg 45, 29229 Celle" },
    oldau: { name:"Vereinsheim TuS Oldau-Ovelgönne", address:"Ruthenbruchweg, 29313 Hambühren" },
    hermannsburg: { name:"Vereinsheim Hermannsburg", address:"Lotharstr. 68, 29320 Hermannsburg" },
    schickeria: { name:"Burnout – Celler Kartbahn", address:"Waldweg 100, 29221 Celle" },
  };
  const opponentVenues = {
    "dsv-hambuehren-d":"hambuehren", "dsv-hambuehren-c":"hambuehren",
    "mtv-beedenbostel-b":"beedenbostel", "mtv-beedenbostel-a":"beedenbostel",
    "psv-celle-b":"psv", "scheuener-heidedarter-a":"scheuen",
    "tus-eschede-a":"eschede", "tus-eschede-b":"eschede",
    "vorwerk-fun-force-a":"vorwerk", "bulls-eye-c":"oldau",
    "team-utd-suedseite-c":"hermannsburg", "vfl-schickeria-a":"schickeria",
  };
  function updateVenue() {
    const venue = venues[state.location === "home" ? "lachendorf" : opponentVenues[fields.Opponent.value]];
    fields.Venue.value = venue?.name || "";
    fields.Address.value = venue?.address || "";
    fields.Venue.readOnly = fields.Address.readOnly = Boolean(venue);
  }
  const teams = Object.fromEntries(Object.entries(LEAGUE_CONFIG).map(([key, value]) => [key, { ...value,
    opponents: value.opponents.map(o => ({ ...o, name:o.id === "team-utd-suedseite-c" ? "Team Utd. Südheide C" : o.name }))
  }]));
  function opponent() { return teams[state.team].opponents.find(o => o.id === fields.Opponent.value); }
  function status(text, error = false) { $("previewDataStatus").textContent = text; $("previewDataStatus").dataset.error = String(error); }
  function updateSourceStatus() {
    $("previewSourceStatus").textContent = !fields.Compare.checked ? "" : state.controller
      ? "3K-Daten werden geladen …"
      : state.stamp
        ? `Quelle: 3K · Stand ${state.stamp.toLocaleDateString("de-DE")} ${state.stamp.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}${state.edited ? " · manuell angepasst" : ""}`
        : state.edited ? "Manuelle Angaben" : "";
  }
  function populate() {
    fields.Opponent.replaceChildren(new Option("Gegner auswählen", ""), ...teams[state.team].opponents.map(o => new Option(o.name,o.id)), new Option("Anderer Gegner", "custom"));
  }
  function clearStats() {
    ++state.request; state.controller?.abort(); state.controller = null; state.stamp = null; state.edited = false;
    $("previewRefresh").disabled=false; $("downloadPreviewStory").disabled=false; $("previewComparison").setAttribute("aria-busy","false");
    for (const metric of metrics) for (const side of ["own","opponent"]) $("previewStat-" + metric.key + "-" + side).value = "";
  }
  function update() {
    root.dataset.team = state.team;
    root.querySelectorAll("[data-preview-team]").forEach(b => { const active=b.dataset.previewTeam===state.team; b.classList.toggle("active",active); b.setAttribute("aria-pressed",active); });
    root.querySelectorAll("[data-preview-location]").forEach(b => { const active=b.dataset.previewLocation===state.location; b.classList.toggle("active",active); b.setAttribute("aria-pressed",active); });
    $("previewCustomWrap").hidden = fields.Opponent.value !== "custom";
    fields.CustomOpponent.required = fields.Opponent.value === "custom";
    $("previewComparison").hidden = !fields.Compare.checked;
    for (const metric of metrics) for (const side of ["own","opponent"]) $("previewStat-"+metric.key+"-"+side).disabled = !fields.Compare.checked || !$("previewShow-"+metric.key).checked;
    render();
  }
  async function json(path, signal, refresh) {
    const url=DartPreviewData.base + path, saved=cache.get(url);
    if (!refresh && saved && Date.now()-saved.time<300000) return saved.data;
    const response=await fetch(url,{signal, credentials:"omit"});
    if (!response.ok) throw new Error("3K-Abruf fehlgeschlagen");
    const data=await response.json(); cache.set(url,{time:Date.now(),data}); return data;
  }
  async function loadStats(refresh=false) {
    clearStats(); render();
    if (!fields.Compare.checked) return;
    if (!opponent()) { status("Für automatische Werte bitte einen Ligagegner auswählen. Werte können auch von Hand eingetragen werden."); return; }
    const request=state.request, selected=opponent(), config=DartPreviewData.leagues[state.team];
    const controller=new AbortController(); state.controller=controller;
    const timeout=setTimeout(()=>controller.abort(),15000);
    status("Teamvergleich wird von 3K geladen …");
    $("previewRefresh").disabled=true;
    $("downloadPreviewStory").disabled=true;
    $("previewComparison").setAttribute("aria-busy","true");
    try {
      const [table, participants]=await Promise.all([json(`${config.event}/phase/0/round/0/table`,controller.signal,refresh),json(`${config.event}/participant`,controller.signal,refresh)]);
      if (request!==state.request) return;
      if (!Array.isArray(participants)) throw new Error("Ungültige Teams");
      const own=participants.find(p=>p.id===config.own), other=participants.find(p=>p.displayName===selected.name);
      if (!own?.team?.id || !other?.team?.id) throw new Error("Teamzuordnung fehlt");
      const rows=DartPreviewData.tableRows(table);
      const values=[DartPreviewData.teamStats(rows,own.id),DartPreviewData.teamStats(rows,other.id)];
      const performance=await Promise.allSettled([own,other].map(p=>json(`${config.event}/performance?teamId=${p.team.id}`,controller.signal,refresh).then(DartPreviewData.performances)));
      if (request!==state.request) return;
      performance.forEach((result,index)=> { if(result.status==="fulfilled") Object.assign(values[index],result.value); });
      for (const metric of metrics) ["own","opponent"].forEach((side,index)=> { $("previewStat-"+metric.key+"-"+side).value = values[index][metric.key] ?? ""; });
      state.stamp=new Date();
      const partial=performance.some(p=>p.status!=="fulfilled");
      status(partial ? "Tabelle geladen. Bestleistungen teilweise nicht verfügbar; fehlende Werte bleiben leer." : "3K-Werte geladen. Leere Highfinish-Felder bedeuten: kein erfasster Wert ab 101. Du kannst alle Werte anpassen.",partial);
    } catch (error) {
      if (request===state.request) status("3K ist gerade nicht erreichbar oder die Daten haben sich geändert. Bitte erneut laden oder Werte von Hand eintragen.",true);
    } finally {
      clearTimeout(timeout);
      if (request===state.request) { state.controller=null; $("previewRefresh").disabled=false; $("downloadPreviewStory").disabled=false; $("previewComparison").setAttribute("aria-busy","false"); render(); }
    }
  }
  function text(value,x,y,size,max=920,color="#fff",family="Topshow") {
    ctx.save(); ctx.fillStyle=color; ctx.textAlign="center"; ctx.textBaseline="middle";
    let actual=size;
    do { ctx.font=`${actual}px "Preview${family}", Arial, sans-serif`; if(ctx.measureText(value).width<=max) break; actual-=1; } while(actual>18);
    ctx.fillText(value,x,y,max);ctx.restore();
  }
  function box(x,y,w,h) { ctx.fillStyle="rgba(9,9,13,.87)"; ctx.fillRect(x,y,w,h); }
  function logo(path,x) {
    const image=state.images.get(path);if(!image)return;
    const scale=Math.min(220/image.width,220/image.height);
    ctx.drawImage(image,x-image.width*scale/2,694-image.height*scale/2,image.width*scale,image.height*scale);
  }
  function render() {
    updateSourceStatus();
    ctx.clearRect(0,0,1080,1920);
    if(!state.ready) { ctx.fillStyle="#18181c";ctx.fillRect(0,0,1080,1920);text("Design wird geladen …",540,960,38);return; }
    for(const name of [state.team==="a"?"bg":"bgb","overlay"+state.team,"header"+state.team,"set"+state.team]) ctx.drawImage(state.images.get(name),0,0,1080,1920);
    const own=teams[state.team], other=opponent();
    const otherName=other?.name || fields.CustomOpponent.value.trim() || "Gegner auswählen";
    const home=state.location==="home"?{name:own.clubName,logo:own.logo}:{name:otherName,logo:other?.logo};
    const away=state.location==="home"?{name:otherName,logo:other?.logo}:{name:own.clubName,logo:own.logo};
    logo(home.logo,259);logo(away.logo,810);
    text("VS",535,695,72,160,"#fff","Topshow");
    text(home.name,259,919,34,420);text(away.name,810,919,34,420);
    const matchday=fields.Matchday.value.replace(/\D/g, "").slice(0,2);
    if(matchday) text(matchday,134,254,58,64,state.team==="a"?"#cc2331":"#ededf5","Topshow");
    text(state.location==="home"?"HEIMSPIEL":"AUSWÄRTSSPIEL",540,1022,37,900,"#fff","Topshow");
    box(98,1070,884,166);
    const date=fields.Date.value ? new Date(fields.Date.value+"T12:00:00").toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}) : "DATUM AUSWÄHLEN";
    text(date,540,1120,57,800,"#fff",fields.Date.value ? "TacticSans" : "Topshow");
    text(fields.Time.value ? `ANWURF ${fields.Time.value} UHR` : "ANWURF EINTRAGEN",540,1190,36,800,"#fff","TacticSans");
    text("SPIELORT",540,1258,25,884,"#fff","Topshow");
    text(fields.Venue.value.trim()||"Spielstätte eintragen",540,1293,36,884);
    if(fields.Address.value.trim())text(fields.Address.value.trim(),540,1330,26,884);
    const active=fields.Compare.checked ? metrics.filter(m=>$("previewShow-"+m.key).checked) : [];
    if(active.length) {
      const rowHeight=57, start=1435;
      ctx.drawImage(state.images.get("comp"+state.team),0,0,1080,1920);
      active.forEach((metric,index)=> {
        const y=start+index*rowHeight;box(98,y,884,rowHeight-5);
        const ownValue=$("previewStat-"+metric.key+"-own").value||"-",otherValue=$("previewStat-"+metric.key+"-opponent").value||"-";
        text(state.location==="home"?ownValue:otherValue,259,y+26,34,180,"#fff","TacticSans");
        text(metric.label.toUpperCase(),535,y+26,32,320,"#fff","Topshow");
        text(state.location==="home"?otherValue:ownValue,810,y+26,34,180,"#fff","TacticSans");
      });
    }
    if(!$("previewModal").hidden) { const target=$("previewModalCanvas").getContext("2d");target.clearRect(0,0,1080,1920);target.drawImage(canvas,0,0); }
  }
  function closeModal() { $("previewModal").hidden=true;document.body.classList.remove("result-modal-open");$("openPreviewStory").focus(); }
  function setup() {
    populate();fields.Date.value=toLeagueInputDate(new Date());updateVenue();
    for(const metric of metrics) {
      const row=document.createElement("div");row.className="preview-stat-row";
      const label=document.createElement("label");label.className="result-stat-check";
      const check=document.createElement("input");check.type="checkbox";check.id="previewShow-"+metric.key;check.checked=["place","points","finish"].includes(metric.key);
      label.append(check,document.createTextNode(metric.label));row.append(label);
      for(const side of ["own","opponent"]) { const input=document.createElement("input");input.type="number";input.id="previewStat-"+metric.key+"-"+side;input.min=metric.key==="finish"?101:metric.key==="place"?1:metric.key==="points"?-999:0;input.max=metric.max;input.step=metric.key==="points"?"any":"1";input.placeholder="—";input.setAttribute("aria-label",`${metric.label} ${side==="own"?"eigenes Team":"Gegner"}`);input.addEventListener("input",()=>{state.edited=true;render();});row.append(input); }
      check.addEventListener("change",update);$("previewStatRows").append(row);
    }
    root.querySelectorAll("[data-preview-team]").forEach(button=>button.addEventListener("click",()=>{
      if(state.team===button.dataset.previewTeam)return;state.team=button.dataset.previewTeam;populate();updateVenue();clearStats();status("Bitte Gegner auswählen.");$("previewRefresh").disabled=false;update();
    }));
    root.querySelectorAll("[data-preview-location]").forEach(button=>button.addEventListener("click",()=>{
      const location=button.dataset.previewLocation;if(location===state.location)return;state.location=location;
      updateVenue();update();
    }));
    fields.Opponent.addEventListener("change",()=>{fields.CustomOpponent.value="";updateVenue();update();loadStats();});
    fields.Compare.addEventListener("change",()=>{update();loadStats();});
    for(const name of ["CustomOpponent","Matchday","Date","Time","Venue","Address"]) fields[name].addEventListener("input",render);
    $("previewRefresh").addEventListener("click",()=>loadStats(true));
    $("openPreviewStory").addEventListener("click",()=>{ $("previewModal").hidden=false;document.body.classList.add("result-modal-open");render();$("closePreviewStory").focus(); });
    document.querySelectorAll("[data-preview-close]").forEach(b=>b.addEventListener("click",closeModal));
    $("previewModal").addEventListener("keydown",event=>{
      if(event.key==="Escape")closeModal();
      if(event.key==="Tab") { const first=$("closePreviewStory"),last=$("downloadPreviewStory");if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();} }
    });
    $("downloadPreviewStory").addEventListener("click",async()=>{
      const invalid=[...$("previewForm").querySelectorAll("input,select")].find(el=>!el.disabled&&el.willValidate&&!el.checkValidity());
      if(invalid) { closeModal();invalid.reportValidity();return; }
      if(!state.ready)return;
      render();await window.exportCanvasPng(canvas,`spielankuendigung-${state.team}-${leagueSlugify(opponent()?.name||fields.CustomOpponent.value)}-${fields.Date.value}.png`);
    });
    update();
  }
  async function initImages() {
    try {
      const definitions=[...["bg","bgb","overlaya","overlayb","headera","headerb","seta","setb","compa","compb"].map(name=>[name,`assets/league/preview/story/${name}.png`]),...Object.values(teams).flatMap(t=>[[t.logo,t.logo],...t.opponents.map(o=>[o.logo,o.logo])])];
      await Promise.all([...new Map(definitions)].map(([name,path])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{state.images.set(name,image);resolve();};image.onerror=()=>reject(new Error(path));image.src=path+"?v=20260928-preview-2";})));
      await Promise.all([new FontFace("PreviewTopshow","url(fonts/topshow.otf)").load().then(f=>document.fonts.add(f)),new FontFace("PreviewTacticSans","url(fonts/tacticsans.otf)").load().then(f=>document.fonts.add(f))]);
      state.ready=true;$("openPreviewStory").disabled=false;$("previewAssetStatus").textContent="";render();
    } catch(error) { $("previewAssetStatus").textContent="Das Design konnte nicht vollständig geladen werden. Bitte die Seite neu laden.";console.warn("Ankündigungsdesign",error); }
  }
  setup();initImages();
})();

