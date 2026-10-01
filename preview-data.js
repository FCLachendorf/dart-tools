/* 3K portal helpers. Central settings: data/3k-leagues.json. */
const DartPreviewData = (() => {
  // Emergency bootstrap only, used when central and last-known settings cannot be read.
  const leagues = {
    a: { event: 1428, own: 172474, ownName: "FC Lachendorf Darts A" },
    b: { event: 1422, own: 172475, ownName: "FC Lachendorf Darts B" },
  };

  const base = "https://backend-ddv.3k-darts.com/2k-backend-ddv/api/v1/frontend/event/";

  // Optional proxy is configured centrally. Direct 3K + repository snapshot work without one.
  const proxyBase = "";

  function eventFromUrl(value) {
    const text = String(value || "").trim();
    if (/^[1-9]\d*$/.test(text)) return Number.isSafeInteger(Number(text)) ? Number(text) : null;
    let url;
    try { url = new URL(text); } catch { return null; }
    if (url.protocol !== "https:" || !/(^|\.)3k-darts\.com$/i.test(url.hostname) || url.username || url.password) return null;
    const match = (url.pathname + url.search + url.hash).match(/(?:\/event\/|[?&]event(?:Id)?=)([1-9]\d*)(?:[/?&#]|$)/i);
    return match && Number.isSafeInteger(Number(match[1])) ? Number(match[1]) : null;
  }

  function normalizeName(value) {
    return String(value || "").toLowerCase().replace(/ß/g,"ss").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");
  }
  function ownParticipant(participants, config) {
    const matches = participants.filter(p => normalizeName(p?.displayName) === normalizeName(config.ownName));
    if (matches.length !== 1) throw new Error("Eigenes Team nicht eindeutig in dieser Liga gefunden");
    return matches[0];
  }
  function timestamp(value) {
    const result = Date.parse(value);
    return Number.isFinite(result) && result > 0 && result <= Date.now() + 300000 ? result : 0;
  }
  function validValues(values) {
    return Array.isArray(values) && values.length === 2 && values.every(p => p && typeof p === "object" &&
      ["place","points","games","finish","counter"].every(key => p[key] == null ||
        ((typeof p[key] === "number" || typeof p[key] === "string") && String(p[key]).trim() !== "" && Number.isFinite(Number(p[key])))));
  }
  // Merge table and performance independently; a partial live response must not erase known best performances.
  function newest(entries) {
    const usable = entries.filter(e => e && validValues(e.values) && timestamp(e.stamp));
    if (!usable.length) return null;
    const tableEntry = usable.reduce((a,b) => timestamp(a.stamp) >= timestamp(b.stamp) ? a : b);
    const values = tableEntry.values.map((value,index) => {
      const options = usable.map(e => e.values[index]).filter(p => p.performanceKnown && timestamp(p.performanceCheckedAt));
      const performance = options.reduce((a,b) => !a || timestamp(b.performanceCheckedAt) > timestamp(a.performanceCheckedAt) ? b : a, null);
      return {
        ...value,
        finish: performance?.finish ?? null, counter: performance?.counter ?? null,
        performanceKnown: Boolean(performance), performanceCheckedAt: performance?.performanceCheckedAt || null,
        performanceStale: Boolean(performance && (performance.performanceStale || timestamp(performance.performanceCheckedAt) < timestamp(tableEntry.stamp))),
      };
    });
    return { ...tableEntry, stamp:new Date(tableEntry.stamp), values, partial:values.some(p => !p.performanceKnown || p.performanceStale) };
  }

  function tableRows(data) {
    if (!Array.isArray(data?.tableEntries)) throw new Error("Ungültige Tabellendaten");
    return data.tableEntries.flatMap(group => group.tableEntries || []);
  }

  function teamStats(rows, participantId) {
    const row = rows.find(item => String(item.participantId ?? item.participant?.id) === String(participantId));
    if (!row) throw new Error("Team nicht in der Tabelle gefunden");
    const place=String(row.placement ?? "").replace(/\.$/, "");
    if(!place || !Number.isInteger(Number(place)) || Number(place)<1 || row.points1==null || !Number.isFinite(Number(row.points1)) || row.matchCount==null || !Number.isInteger(Number(row.matchCount)) || Number(row.matchCount)<0) throw new Error("Ungültige Tabellenwerte");
    return {
      place,
      points: row.points1 ?? null,
      games: row.matchCount ?? null,
    };
  }

  function performances(data) {
    if (!Array.isArray(data?.performanceCatalog)) throw new Error("Ungültige Bestleistungen");

    const finishes = data.performanceCatalog
      .filter(c => c.performanceTypeCd === "HF")
      .flatMap(c => c.playerPerformances || [])
      .map(p => p.value)
      .filter(v => Number.isFinite(v) && v >= 101 && v <= 170);

    const count = data.performanceCatalog
      .filter(c => c.performanceTypeCd === "HS")
      .flatMap(c => c.playerPerformances || [])
      .filter(p => p.value === 180)
      .reduce((sum, p) => sum + (Number(p.count) || 0), 0);

    return {
      finish: finishes.length ? Math.max(...finishes) : null,
      counter: count,
    };
  }

  return { leagues, base, proxyBase, eventFromUrl, tableRows, teamStats, performances, normalizeName, ownParticipant, timestamp, validValues, newest };
})();

if (typeof module !== "undefined") module.exports = DartPreviewData;
