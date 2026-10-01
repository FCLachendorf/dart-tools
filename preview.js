(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const root = $("previewTool");
  if (!root) return;
  const canvas = $("previewCanvas"), ctx = canvas.getContext("2d");
  const fields = Object.fromEntries(["Opponent", "CustomOpponent", "Matchday", "Date", "Time", "Venue", "Address", "Compare"].map(name => [name, $("preview" + name)]));
  // Layout in Pixeln: y/start größer = weiter nach unten; fontSize größer = größere Schrift.
  // Saisonvergleich: labelOffsetY und valueOffsetY verschieben Text innerhalb der Zeilen.
  const PREVIEW_LAYOUTS = {
    story: {
      width:1080, height:1920,
      logos:{ y:694, size:220 }, vs:{ y:695, fontSize:72 },
      teamNames:{ y:919, fontSize:42, maxWidth:420 },
      matchday:{ x:134, y:254, fontSize:58, maxWidth:64 },
      location:{ y:1022, fontSize:37 },
      dateBox:{ x:98, y:1070, width:884, height:166 },
      date:{ y:1120, fontSize:57 }, time:{ y:1190, fontSize:36 },
      venueLabelY:1258, venue:{ y:1293, fontSize:36 }, address:{ y:1330, fontSize:26 },
      comparison:{ start:1435, rowHeight:57, boxGap:5, labelOffsetY:29, valueOffsetY:29, labelFontSize:32, valueFontSize:34 },
    },
    post: {
      width:1080, height:1350,
      logos:{ y:504, size:220 }, vs:{ y:505, fontSize:72 },
      teamNames:{ y:704, fontSize:42, maxWidth:420 },
      matchday:{ x:134, y:148, fontSize:58, maxWidth:64 },
      location:{ y:741, fontSize:28 },
      dateBox:{ x:98, y:765, width:884, height:92 },
      date:{ y:790, fontSize:44 }, time:{ y:834, fontSize:28 },
      venueLabelY:null, venue:{ y:879, fontSize:28 }, address:{ y:906, fontSize:24 },
      comparison:{ start:1010, rowHeight:57, boxGap:5, labelOffsetY:29, valueOffsetY:29, labelFontSize:32, valueFontSize:34 },
    },
  };
  function layout() { return PREVIEW_LAYOUTS[state.format]; }
  function asset(name) { return state.images.get(`${state.format}/${name}`); }
  const metrics = [
    { key:"place", label:"Tabellenplatz", max:99 }, { key:"points", label:"Punkte", max:999 },
    { key:"games", label:"Spiele", max:99 }, { key:"finish", label:"Highest Finish", max:170 },
    { key:"counter", label:"180er", max:999 }
  ];
  const state = { team:"a", location:"home", format:"story", images:new Map(), ready:false, request:0, stamp:null, source:null, edited:false, controller:null };
  const cache = new Map();
  // Bot commits do not rebuild GitHub Pages. Read the published repository data directly.
  const DATA_ROOT = "https://raw.githubusercontent.com/FCLachendorf/dart-tools/main/";
  const SNAPSHOT_URLS = [DATA_ROOT + "data/3k-cache.json", "data/3k-cache.json"];
  let configuredLeagues = DartPreviewData.leagues;
  let configuredProxy = DartPreviewData.proxyBase;
  let linkOverrides = null;
  let rosterRequest = 0;
  let snapshotPromise = null;
  let snapshotTime = 0;
  const LOCAL_CACHE_KEY = "fcl-darts-preview-3k-v3";
  const LEAGUE_LINK_KEY = "fcl-darts-preview-league-links-v1";
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
  const knownOpponents = Object.values(teams).flatMap(t=>t.opponents.map(o=>({...o})));
  function opponent() { return teams[state.team].opponents.find(o => o.id === fields.Opponent.value); }
  function readLeagueLinks() {
    if (linkOverrides) return {...linkOverrides};
    try {
      const saved=JSON.parse(localStorage.getItem(LEAGUE_LINK_KEY) || "{}");
      return saved && typeof saved==="object" ? saved : {};
    } catch {
      return {};
    }
  }
  function writeLeagueLinks(links) {
    linkOverrides={...links};
    try { localStorage.setItem(LEAGUE_LINK_KEY,JSON.stringify(links)); return true; } catch { return false; }
  }
  function leagueConfig(team=state.team) {
    const base=configuredLeagues[team];
    const saved=readLeagueLinks()[team];
    const customEvent=DartPreviewData.eventFromUrl(saved);
    return { ownName:DartPreviewData.leagues[team].ownName, ...base, event:customEvent || base.event };
  }
  function syncLeagueSettings(message="", error=false) {
    const links=readLeagueLinks();
    const saved=links[state.team] || "";
    const config=leagueConfig();
    $("previewLeagueTeamLabel").textContent=state.team==="a" ? "A-Team" : "B-Team";
    $("previewLeagueUrl").value=saved;
    $("previewLeagueUrl").placeholder=`3K-Liga-Link einfügen · aktuell Event ${config.event}`;
    $("previewLeagueStatus").textContent=message || (saved
      ? `Eigener Liga-Link aktiv · Event ${config.event}`
      : `Standard-Liga aktiv · Event ${config.event}`);
    $("previewLeagueStatus").dataset.error=String(error);
  }
  async function changeLeague(reset=false) {
    const team=state.team, value=$("previewLeagueUrl").value.trim();
    const event=reset ? configuredLeagues[team].event : DartPreviewData.eventFromUrl(value);
    if (!event) {
      $("previewLeagueStatus").textContent="Bitte einen gültigen HTTPS-Link von 3k-darts.com oder eine Event-ID eintragen.";
      $("previewLeagueStatus").dataset.error="true";
      return;
    }
    const request=++rosterRequest;
    $("previewLeagueStatus").textContent="Liga und eigenes Team werden geprüft …";
    try {
      const config={...leagueConfig(team),event};
      const roster=await fetchRoster(config,true);
      if (request!==rosterRequest || team!==state.team) return;
      const links=readLeagueLinks();
      if(reset) delete links[team]; else links[team]=value;
      const persisted=writeLeagueLinks(links);
      clearStats();
      applyRoster(roster,config);
      syncLeagueSettings((reset ? "Standard-Liga aktiviert." : "Liga geprüft und gespeichert.") +
        (persisted ? "" : " Speicherung blockiert: gilt nur bis zum Neuladen.") +
        (!reset && event!==configuredLeagues[team].event ? " Eigene Links gelten nur hier; die automatische Sicherung folgt der zentralen Liga-Einstellung." : ""));
      status("Bitte Gegner auswählen.");
      update();
    } catch(error) {
      if(request!==rosterRequest || team!==state.team) return;
      $("previewLeagueStatus").textContent="Liga konnte nicht bestätigt werden. Bisherige Einstellung bleibt erhalten. " + error.message;
      $("previewLeagueStatus").dataset.error="true";
    }
  }
  function saveLeagueLink() { return changeLeague(false); }
  function resetLeagueLink() { return changeLeague(true); }

  async function fetchDocument(url, parentSignal, timeout=5000) {
    const controller=new AbortController();
    const abort=()=>controller.abort();
    if(parentSignal?.aborted) controller.abort();
    parentSignal?.addEventListener("abort",abort,{once:true});
    const timer=setTimeout(abort,timeout);
    try {
      const response=await fetch(url,{signal:controller.signal,credentials:"omit",cache:"no-store"});
      if(!response.ok) throw new Error("Datenabruf fehlgeschlagen: HTTP "+response.status);
      return await response.json();
    } finally {
      clearTimeout(timer); parentSignal?.removeEventListener("abort",abort);
    }
  }
  async function snapshots(refresh=false) {
    if(!refresh && snapshotPromise && Date.now()-snapshotTime<60000) return snapshotPromise;
    snapshotTime=Date.now();
    snapshotPromise=Promise.allSettled(SNAPSHOT_URLS.map(url=>fetchDocument(url+"?v="+Date.now())))
      .then(results=>results.filter(r=>r.status==="fulfilled" && r.value?.events).map(r=>r.value));
    return snapshotPromise;
  }
  async function fetchRoster(config, refresh=false) {
    try {
      const participants=await json(config.event+"/participant",null,refresh);
      if(!Array.isArray(participants)) throw new Error("Ungültige Teilnehmerliste");
      DartPreviewData.ownParticipant(participants,config);
      try {
        const minimal=participants.map(p=>({id:p.id,displayName:p.displayName}));
        localStorage.setItem("fcl-roster-"+config.event,JSON.stringify(minimal));
      } catch {}
      return participants;
    } catch(error) {
      const candidates=(await snapshots(refresh)).map(s=>s.events?.[String(config.event)]).filter(Boolean)
        .sort((a,b)=>DartPreviewData.timestamp(b.checkedAt||b.updatedAt)-DartPreviewData.timestamp(a.checkedAt||a.updatedAt));
      for(const event of candidates) {
        const participants=Object.values(event.participants||{}).map(p=>({...p,id:p.participantId}));
        try { DartPreviewData.ownParticipant(participants,config); return participants; } catch {}
      }
      try {
        const saved=JSON.parse(localStorage.getItem("fcl-roster-"+config.event)||"null");
        if(Array.isArray(saved)) { DartPreviewData.ownParticipant(saved,config); return saved; }
      } catch {}
      throw error;
    }
  }
  function applyRoster(participants,config,preserve=false) {
    const selectedName=preserve ? opponent()?.name : null;
    const own=DartPreviewData.ownParticipant(participants,config);
    teams[state.team].opponents=participants.filter(p=>String(p.id)!==String(own.id) && p.displayName && p.id!=null).map(p=>{
      const known=knownOpponents.find(o=>normalizeTeamName(o.name)===normalizeTeamName(p.displayName));
      return {...known,id:known?.id || "3k-"+p.id,name:p.displayName,participantId:p.id};
    });
    populate();
    const previous=teams[state.team].opponents.find(o=>normalizeTeamName(o.name)===normalizeTeamName(selectedName));
    if(previous) fields.Opponent.value=previous.id;
    updateVenue();
  }
  async function refreshRoster() {
    const request=++rosterRequest, team=state.team, config=leagueConfig();
    try {
      const roster=await fetchRoster(config);
      if(request!==rosterRequest || team!==state.team) return;
      // Do not replace a selection while its values are being loaded or edited.
      if(fields.Opponent.value) return;
      applyRoster(roster,config,true);
      update();
    } catch(error) {
      if(request!==rosterRequest || team!==state.team) return;
      syncLeagueSettings("Teilnehmerliste gerade nicht verfügbar. Bekannte Teams oder „Anderer Gegner“ verwenden.",true);
    }
  }
  async function initConfiguration() {
    let config=null;
    for(const url of [DATA_ROOT+"data/3k-leagues.json","data/3k-leagues.json"]) {
      try {
        const candidate=await fetchDocument(url+"?v="+Date.now(),null,3500);
        if(!["a","b"].every(team=>Number.isSafeInteger(candidate?.leagues?.[team]?.event) && candidate.leagues[team].event>0 && candidate.leagues[team].ownName)) throw new Error("Ungültige Liga-Konfiguration");
        config=candidate; break;
      } catch {}
    }
    if(config) {
      configuredLeagues=config.leagues;
      configuredProxy=typeof config.proxyBase==="string" && /^https:\/\//.test(config.proxyBase) ? config.proxyBase : "";
      try { localStorage.setItem("fcl-league-config",JSON.stringify(config)); } catch {}
    } else {
      try {
        const saved=JSON.parse(localStorage.getItem("fcl-league-config")||"null");
        if(["a","b"].every(team=>Number.isSafeInteger(saved?.leagues?.[team]?.event) && saved.leagues[team].event>0 && saved.leagues[team].ownName)) configuredLeagues=saved.leagues;
      } catch {}
    }
    for(const team of ["a","b"]) {
      if(leagueConfig(team).event!==DartPreviewData.leagues[team].event) teams[team].opponents=[];
    }
    setup(); initImages();
    if(!config) syncLeagueSettings("Liga-Konfiguration nicht erreichbar; letzte bekannte Einstellung wird verwendet.",true);
    refreshRoster();
  }
  function status(text, error = false) { $("previewDataStatus").textContent = text; $("previewDataStatus").dataset.error = String(error); }
  function updateSourceStatus() {
    if (!fields.Compare.checked) {
      $("previewSourceStatus").textContent = "";
      return;
    }
    if (state.controller) {
      $("previewSourceStatus").textContent = "3K-Daten werden geladen …";
      return;
    }
    if (state.stamp) {
      const labels = {
        live: "3K live",
        snapshot: "gespeicherter 3K-Stand",
        local: "lokaler letzter Stand",
      };
      const label = labels[state.source] || "3K";
      $("previewSourceStatus").textContent = `Quelle: ${label} · Stand ${state.stamp.toLocaleDateString("de-DE")} ${state.stamp.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}${state.edited ? " · manuell angepasst" : ""}`;
      return;
    }
    $("previewSourceStatus").textContent = state.edited ? "Manuelle Angaben" : "";
  }
  function populate() {
    fields.Opponent.replaceChildren(new Option("Gegner auswählen", ""), ...teams[state.team].opponents.map(o => new Option(o.name,o.id)), new Option("Anderer Gegner", "custom"));
  }
  function clearStats() {
    ++state.request; state.controller?.abort(); state.controller = null; state.stamp = null; state.source = null; state.edited = false;
    $("previewRefresh").disabled=false; $("downloadPreviewStory").disabled=false; $("previewComparison").setAttribute("aria-busy","false");
    for (const metric of metrics) for (const side of ["own","opponent"]) $("previewStat-" + metric.key + "-" + side).value = "";
  }
  function update() {
    root.dataset.team = state.team;
    root.querySelectorAll("[data-preview-format]").forEach(b => {
      const active=b.dataset.previewFormat===state.format;
      b.classList.toggle("active",active); b.setAttribute("aria-pressed",String(active));
    });
    const label=state.format==="post" ? "Post" : "Story";
    const dimensions=`${layout().width} × ${layout().height}`;
    $("previewFormatDescription").textContent=`${label} · ${dimensions}`;
    $("previewFormatLabel").textContent=`${label}-Vorschau`;
    $("previewFormatSize").textContent=`${dimensions} px`;
    $("previewModalFormat").textContent=`Spieltagsankündigung · ${label}`;
    $("downloadPreviewStory").replaceChildren(document.createTextNode(`${label} herunterladen`), Object.assign(document.createElement("span"),{textContent:dimensions}));
    root.querySelectorAll("[data-preview-team]").forEach(b => { const active=b.dataset.previewTeam===state.team; b.classList.toggle("active",active); b.setAttribute("aria-pressed",active); });
    root.querySelectorAll("[data-preview-location]").forEach(b => { const active=b.dataset.previewLocation===state.location; b.classList.toggle("active",active); b.setAttribute("aria-pressed",active); });
    $("previewCustomWrap").hidden = fields.Opponent.value !== "custom";
    fields.CustomOpponent.required = fields.Opponent.value === "custom";
    $("previewComparison").hidden = !fields.Compare.checked;
    for (const metric of metrics) for (const side of ["own","opponent"]) $("previewStat-"+metric.key+"-"+side).disabled = !fields.Compare.checked || !$("previewShow-"+metric.key).checked;
    render();
  }
  async function json(path, signal, refresh) {
    const saved=cache.get(path);
    if (!refresh && saved && Date.now()-saved.time<300000) return saved.data;

    const candidates=[];
    if (configuredProxy) {
      candidates.push(`${configuredProxy}?path=${encodeURIComponent(path)}`);
    }
    candidates.push(DartPreviewData.base + path);

    let lastError=null;
    for (const url of candidates) {
      try {
        const data=await fetchDocument(url,signal,7000);
        cache.set(path,{time:Date.now(),data});
        return data;
      } catch (error) {
        if (signal?.aborted) throw error;
        lastError=error;
      }
    }
    throw lastError || new Error("3K-Abruf fehlgeschlagen");
  }
  function normalizeTeamName(value) { return DartPreviewData.normalizeName(value); }
  function applyStatValues(values) {
    for (const metric of metrics) ["own","opponent"].forEach((side,index)=> {
      $("previewStat-"+metric.key+"-"+side).value = values[index]?.[metric.key] ?? "";
    });
  }
  function compactValues(values) {
    return values.map(value => ({...Object.fromEntries(metrics.map(metric => [metric.key, value?.[metric.key] ?? null])), performanceKnown:Boolean(value.performanceKnown), performanceCheckedAt:value.performanceCheckedAt||null, performanceStale:Boolean(value.performanceStale)}));
  }
  function readLocalCache(team, event, opponentId) {
    const candidates=[];
    for(const key of [LOCAL_CACHE_KEY,"fcl-darts-preview-3k-v2"]) {
      try {
        const all=JSON.parse(localStorage.getItem(key) || "{}");
        const entry=all[`${team}:${event}:${opponentId}`];
        if(!entry || !DartPreviewData.validValues(entry.values) || !DartPreviewData.timestamp(entry.updatedAt)) continue;
        const values=entry.values.map(p=>key===LOCAL_CACHE_KEY ? p : ({
          ...p,performanceKnown:p.counter!=null || p.finish!=null,
          performanceCheckedAt:entry.updatedAt,performanceStale:true,
        }));
        candidates.push({values,stamp:new Date(entry.updatedAt),source:"local"});
      } catch {}
    }
    return DartPreviewData.newest(candidates);
  }
  function saveLocalCache(team, event, opponentId, values, stamp) {
    try {
      const all=JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || "{}");
      all[`${team}:${event}:${opponentId}`] = { updatedAt:stamp.toISOString(), values:compactValues(values) };
      localStorage.setItem(LOCAL_CACHE_KEY,JSON.stringify(all));
    } catch {
      // Private browsing/storage limits must never break the generator.
    }
  }
  async function loadSnapshot(config, selected, refresh=false) {
    const candidates=[];
    for(const snapshot of await snapshots(refresh)) {
      const event=snapshot?.events?.[String(config.event)];
      if(!event?.participants) continue;
      const entries=Object.values(event.participants);
      let own;
      try { own=DartPreviewData.ownParticipant(entries,config); } catch { continue; }
      const others=entries.filter(p=>normalizeTeamName(p.displayName)===normalizeTeamName(selected.name));
      if(others.length!==1) continue;
      const stamp=event.checkedAt || event.updatedAt || snapshot.updatedAt;
      if(!DartPreviewData.timestamp(stamp)) continue;
      const pick=p=>({
        place:p.place ?? null,points:p.points ?? null,games:p.games ?? null,
        finish:p.finish ?? null,counter:p.counter ?? null,
        performanceKnown:Boolean(p.performanceKnown),
        performanceCheckedAt:p.performanceCheckedAt || event.updatedAt,
        performanceStale:Boolean(p.performanceStale),
      });
      candidates.push({values:[pick(own),pick(others[0])],stamp:new Date(stamp),source:"snapshot"});
    }
    return DartPreviewData.newest(candidates);
  }
  function fallbackStatus(prefix, stamp, partial=false) {
    const when=`${stamp.toLocaleDateString("de-DE")} ${stamp.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`;
    return `${prefix} Stand vom ${when} geladen.${partial ? " Bestleistungen sind älter oder unvollständig." : ""}${Date.now()-stamp.getTime()>86400000 ? " Dieser Stand ist älter als 24 Stunden." : ""}`;
  }
  function liveErrorMessage(error) {
    if (error?.name==="AbortError") return "3K antwortet gerade zu langsam und es ist noch kein gespeicherter Stand verfügbar.";
    if (error instanceof TypeError) return "Die Verbindung zu 3K konnte gerade nicht aufgebaut werden und es ist noch kein gespeicherter Stand verfügbar.";
    if (/Teamzuordnung|Teams|Tabelle|Datenformat|gefunden/i.test(String(error?.message || ""))) return "Die 3K-Daten haben sich möglicherweise geändert und es ist noch kein gespeicherter Stand verfügbar.";
    return "3K ist gerade nicht erreichbar und es ist noch kein gespeicherter Stand verfügbar.";
  }
  async function loadStats(refresh=false) {
    clearStats(); render();
    if (!fields.Compare.checked) return;
    if (!opponent()) { status(""); return; }
    const request=state.request, selected=opponent(), config=leagueConfig();
    const local=readLocalCache(state.team,config.event,selected.id);
    const savedPromise=loadSnapshot(config,selected,refresh).catch(()=>null);
    const controller=new AbortController(); state.controller=controller;
    const timeout=setTimeout(()=>controller.abort(),10000);
    status("Teamvergleich wird von 3K geladen …");
    $("previewRefresh").disabled=true;
    $("downloadPreviewStory").disabled=true;
    $("previewComparison").setAttribute("aria-busy","true");
    try {
      const [table, participants]=await Promise.all([json(`${config.event}/phase/0/round/0/table`,controller.signal,refresh),json(`${config.event}/participant`,controller.signal,refresh)]);
      if (request!==state.request) return;
      if (!Array.isArray(participants)) throw new Error("Ungültige Teams");
      const own=DartPreviewData.ownParticipant(participants,config);
      const matching=participants.filter(p=>normalizeTeamName(p.displayName)===normalizeTeamName(selected.name));
      const other=matching.length===1 ? matching[0] : null;
      if (!own?.team?.id || !other?.team?.id) throw new Error("Teamzuordnung fehlt");
      const rows=DartPreviewData.tableRows(table);
      const values=[DartPreviewData.teamStats(rows,own.id),DartPreviewData.teamStats(rows,other.id)];
      const performance=await Promise.allSettled([own,other].map(p=>json(`${config.event}/performance?teamId=${p.team.id}`,controller.signal,refresh).then(DartPreviewData.performances)));
      if (request!==state.request) return;
      const stamp=new Date(cache.get(config.event+"/phase/0/round/0/table")?.time || Date.now());
      performance.forEach((result,index)=> {
        if(result.status==="fulfilled") Object.assign(values[index],result.value,{performanceKnown:true,performanceCheckedAt:new Date(cache.get(config.event+"/performance?teamId="+[own,other][index].team.id)?.time || Date.now()).toISOString(),performanceStale:false});
      });
      const saved=await savedPromise;
      if(request!==state.request) return;
      const merged=DartPreviewData.newest([{values,stamp,source:"live"},local,saved]);
      applyStatValues(merged.values);
      state.stamp=merged.stamp;
      state.source=merged.source;
      saveLocalCache(state.team,config.event,selected.id,merged.values,merged.stamp);
      status(performance.some(p=>p.status!=="fulfilled")
        ? "Tabelle live geladen. Bestleistungen nicht vollständig erreichbar; verfügbare ältere Werte werden beibehalten."
        : "",performance.some(p=>p.status!=="fulfilled"));
      if(merged.partial) {
        const dates=merged.values.map(p=>p.performanceCheckedAt ? new Date(p.performanceCheckedAt).toLocaleString("de-DE") : "nicht verfügbar");
        status("Bestleistungen: eigenes Team "+dates[0]+" · Gegner "+dates[1]+". Tabelle siehe Quellenstand.",true);
      }
    } catch (error) {
      if (request!==state.request) return;
      const fallback=DartPreviewData.newest([local,await savedPromise]);
      if (request!==state.request) return;
      if(fallback) {
        applyStatValues(fallback.values); state.stamp=fallback.stamp; state.source=fallback.source;
        saveLocalCache(state.team,config.event,selected.id,fallback.values,fallback.stamp);
        const detail=fallback.partial ? " Bestleistungen geprüft: "+fallback.values.map(p=>p.performanceCheckedAt ? new Date(p.performanceCheckedAt).toLocaleString("de-DE") : "nicht verfügbar").join(" / ")+ " (eigenes Team / Gegner)." : "";
        status(fallbackStatus("Live-Abruf nicht möglich.",fallback.stamp,fallback.partial)+detail,true);
      } else {
        status(liveErrorMessage(error),true);
      }
    } finally {
      clearTimeout(timeout);
      if (request===state.request) { state.controller=null; $("previewRefresh").disabled=false; $("downloadPreviewStory").disabled=false; $("previewComparison").setAttribute("aria-busy","false"); render(); }
    }
  }
  function text(value,x,y,size,max=920,color="#fff",family="TacticSans") {
    ctx.save(); ctx.fillStyle=color; ctx.textAlign="center"; ctx.textBaseline="middle";
    let actual=size;
    do { ctx.font=`${actual}px "Preview${family}", Arial, sans-serif`; if(ctx.measureText(value).width<=max) break; actual-=1; } while(actual>18);
    ctx.fillText(value,x,y,max);ctx.restore();
  }
  function box(x,y,w,h) { ctx.fillStyle="rgba(9,9,13,.87)"; ctx.fillRect(x,y,w,h); }
  function logo(path,x) {
    const image=state.images.get(path);if(!image)return;
    const config=layout().logos;
    const scale=Math.min(config.size/image.width,config.size/image.height);
    ctx.drawImage(image,x-image.width*scale/2,config.y-image.height*scale/2,image.width*scale,image.height*scale);
  }
  function render() {
    updateSourceStatus();
    const l=layout();
    if(canvas.width!==l.width || canvas.height!==l.height) { canvas.width=l.width; canvas.height=l.height; }
    ctx.clearRect(0,0,l.width,l.height);
    if(!state.ready) { ctx.fillStyle="#18181c";ctx.fillRect(0,0,l.width,l.height);text("Design wird geladen …",540,l.height/2,38);return; }
    for(const name of [state.team==="a"?"bg":"bgb","overlay"+state.team,"header"+state.team,"set"+state.team]) ctx.drawImage(asset(name),0,0,l.width,l.height);
    const own=teams[state.team], other=opponent();
    const otherName=other?.name || fields.CustomOpponent.value.trim() || "Gegner auswählen";
    const home=state.location==="home"?{name:own.clubName,logo:own.logo}:{name:otherName,logo:other?.logo};
    const away=state.location==="home"?{name:otherName,logo:other?.logo}:{name:own.clubName,logo:own.logo};
    logo(home.logo,259);logo(away.logo,810);
    text("VS",535,l.vs.y,l.vs.fontSize,160,"#fff","Topshow");
    text(home.name,259,l.teamNames.y,l.teamNames.fontSize,l.teamNames.maxWidth,"#fff","Topshow");text(away.name,810,l.teamNames.y,l.teamNames.fontSize,l.teamNames.maxWidth,"#fff","Topshow");
    const matchday=fields.Matchday.value.replace(/\D/g, "").slice(0,2);
    if(matchday) text(matchday,l.matchday.x,l.matchday.y,l.matchday.fontSize,l.matchday.maxWidth,state.team==="a"?"#cc2331":"#ededf5","Topshow");
    text(state.location==="home"?"HEIMSPIEL":"AUSWÄRTSSPIEL",540,l.location.y,l.location.fontSize,900,"#fff","Topshow");
    box(l.dateBox.x,l.dateBox.y,l.dateBox.width,l.dateBox.height);
    const date=fields.Date.value ? new Date(fields.Date.value+"T12:00:00").toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}) : "DATUM AUSWÄHLEN";
    text(date,540,l.date.y,l.date.fontSize,800,"#fff",fields.Date.value ? "TacticSans" : "Topshow");
    text(fields.Time.value ? `ANWURF ${fields.Time.value} UHR` : "ANWURF EINTRAGEN",540,l.time.y,l.time.fontSize,800,"#fff","TacticSans");
    if(l.venueLabelY!==null) text("SPIELORT",540,l.venueLabelY,25,884,"#fff","Topshow");
    text(fields.Venue.value.trim()||"Spielstätte eintragen",540,l.venue.y,l.venue.fontSize,884);
    if(fields.Address.value.trim())text(fields.Address.value.trim(),540,l.address.y,l.address.fontSize,884);
    const active=fields.Compare.checked ? metrics.filter(m=>$("previewShow-"+m.key).checked) : [];
    if(active.length) {
      const {rowHeight,start,boxGap,labelOffsetY,valueOffsetY,labelFontSize,valueFontSize}=l.comparison;
      ctx.drawImage(asset("comp"+state.team),0,0,l.width,l.height);
      active.forEach((metric,index)=> {
        const y=start+index*rowHeight;box(98,y,884,rowHeight-boxGap);
        const ownValue=$("previewStat-"+metric.key+"-own").value||"-",otherValue=$("previewStat-"+metric.key+"-opponent").value||"-";
        text(state.location==="home"?ownValue:otherValue,259,y+valueOffsetY,valueFontSize,180,"#fff","TacticSans");
        text(metric.label.toUpperCase(),535,y+labelOffsetY,labelFontSize,320,"#fff","Topshow");
        text(state.location==="home"?otherValue:ownValue,810,y+valueOffsetY,valueFontSize,180,"#fff","TacticSans");
      });
    }
    if(!$("previewModal").hidden) { const modalCanvas=$("previewModalCanvas"); modalCanvas.width=l.width; modalCanvas.height=l.height; const target=modalCanvas.getContext("2d");target.drawImage(canvas,0,0); }
  }
  function closeModal() { $("previewModal").hidden=true;document.body.classList.remove("result-modal-open");$("openPreviewStory").focus(); }
  function setup() {
    populate();fields.Date.value=toLeagueInputDate(new Date());fields.Time.value="19:00";updateVenue();
    for(const metric of metrics) {
      const row=document.createElement("div");row.className="preview-stat-row";
      const label=document.createElement("label");label.className="result-stat-check";
      const check=document.createElement("input");check.type="checkbox";check.id="previewShow-"+metric.key;check.checked=["place","points","finish"].includes(metric.key);
      label.append(check,document.createTextNode(metric.label));row.append(label);
      for(const side of ["own","opponent"]) { const input=document.createElement("input");input.type="number";input.id="previewStat-"+metric.key+"-"+side;input.min=metric.key==="finish"?101:metric.key==="place"?1:metric.key==="points"?-999:0;input.max=metric.max;input.step=metric.key==="points"?"any":"1";input.placeholder="—";input.setAttribute("aria-label",`${metric.label} ${side==="own"?"eigenes Team":"Gegner"}`);input.addEventListener("input",()=>{if(state.controller) {
          ++state.request;state.controller.abort();state.controller=null;
          $("previewRefresh").disabled=false;$("downloadPreviewStory").disabled=false;$("previewComparison").setAttribute("aria-busy","false");
          status("Automatischen Abruf wegen manueller Eingabe beendet.");
        }
        state.edited=true;render();});row.append(input); }
      check.addEventListener("change",update);$("previewStatRows").append(row);
    }
    root.querySelectorAll("[data-preview-format]").forEach(button=>button.addEventListener("click",()=>{
      if(!PREVIEW_LAYOUTS[button.dataset.previewFormat])return;
      state.format=button.dataset.previewFormat;update();
    }));
    root.querySelectorAll("[data-preview-team]").forEach(button=>button.addEventListener("click",()=>{
      if(state.team===button.dataset.previewTeam)return;state.team=button.dataset.previewTeam;populate();updateVenue();clearStats();syncLeagueSettings();status("Bitte Gegner auswählen.");$("previewRefresh").disabled=false;update();refreshRoster();
    }));
    root.querySelectorAll("[data-preview-location]").forEach(button=>button.addEventListener("click",()=>{
      const location=button.dataset.previewLocation;if(location===state.location)return;state.location=location;
      updateVenue();update();
    }));
    fields.Opponent.addEventListener("change",()=>{fields.CustomOpponent.value="";updateVenue();update();loadStats();});
    fields.Compare.addEventListener("change",()=>{update();loadStats();});
    for(const name of ["CustomOpponent","Matchday","Date","Time","Venue","Address"]) fields[name].addEventListener("input",render);
    $("previewRefresh").addEventListener("click",()=>loadStats(true));
    $("previewLeagueSave").addEventListener("click",saveLeagueLink);
    $("previewLeagueReset").addEventListener("click",resetLeagueLink);
    $("previewLeagueUrl").addEventListener("keydown",event=>{ if(event.key==="Enter"){ event.preventDefault();saveLeagueLink(); } });
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
      render();await window.exportCanvasPng(canvas,`spielankuendigung-${state.format}-${state.team}-${leagueSlugify(opponent()?.name||fields.CustomOpponent.value)}-${fields.Date.value}.png`);
    });
    syncLeagueSettings();
    update();
  }
  async function initImages() {
    try {
      const definitions=[...Object.keys(PREVIEW_LAYOUTS).flatMap(format=>["bg","bgb","overlaya","overlayb","headera","headerb","seta","setb","compa","compb"].map(name=>[`${format}/${name}`,`assets/league/preview/${format}/${name}.png`])),...Object.values(teams).map(t=>[t.logo,t.logo]),...knownOpponents.filter(o=>o.logo).map(o=>[o.logo,o.logo])];
      await Promise.all([...new Map(definitions)].map(([name,path])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{state.images.set(name,image);resolve();};image.onerror=()=>reject(new Error(path));image.src=path+"?v=20260929-preview-post-1";})));
      await Promise.all([new FontFace("PreviewTopshow","url(fonts/topshow.otf)").load().then(f=>document.fonts.add(f)),new FontFace("PreviewTacticSans","url(fonts/tacticsans.otf)").load().then(f=>document.fonts.add(f))]);
      state.ready=true;$("openPreviewStory").disabled=false;$("previewAssetStatus").textContent="";render();
    } catch(error) { $("previewAssetStatus").textContent="Das Design konnte nicht vollständig geladen werden. Bitte die Seite neu laden.";console.warn("Ankündigungsdesign",error); }
  }
  initConfiguration();
})();

