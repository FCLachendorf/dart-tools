/* 3K portal data helpers for the 2026/27 leagues. */
const DartPreviewData = (() => {
  const leagues = {
    a: { event: 1428, own: 172474, ownName: "FC Lachendorf Darts A" },
    b: { event: 1422, own: 172475, ownName: "FC Lachendorf Darts B" },
  };

  const base = "https://backend-ddv.3k-darts.com/2k-backend-ddv/api/v1/frontend/event/";

  /*
   * Filled after the Vercel function has been deployed.
   * Example: https://dart-tools-proxy.vercel.app/api/3k
   * Until then the browser tries 3K directly and falls back to the stored snapshot.
   */
  const proxyBase = "";

  function eventFromUrl(value) {
    const text = String(value || "").trim();
    if (!text) return null;

    const patterns = [
      /\/event\/(\d+)(?:\/|$|[?#])/i,
      /[?&]event(?:Id)?=(\d+)/i,
      /^\s*(\d+)\s*$/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function tableRows(data) {
    if (!Array.isArray(data?.tableEntries)) throw new Error("Ungültige Tabellendaten");
    return data.tableEntries.flatMap(group => group.tableEntries || []);
  }

  function teamStats(rows, participantId) {
    const row = rows.find(item => item.participantId === participantId);
    if (!row) throw new Error("Team nicht in der Tabelle gefunden");
    return {
      place: String(row.placement ?? "").replace(/\.$/, ""),
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

  return { leagues, base, proxyBase, eventFromUrl, tableRows, teamStats, performances };
})();

if (typeof module !== "undefined") module.exports = DartPreviewData;
