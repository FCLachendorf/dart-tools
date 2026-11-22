/* Shared validation for live standings and saved fallback data. */
const DartTableData = (() => {
  const normalize = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g,"ss").replace(/[^a-z0-9]/g, "");
  function validate(items, ownName) {
    if (!Array.isArray(items) || items.length !== 7) throw new Error("Unvollständige Tabelle");
    const names = new Set(), places = new Set();
    const result = items.map(item => {
      const name = String(item.team || "").trim();
      if (!name || names.has(normalize(name))) throw new Error("Ungültige Mannschaften");
      names.add(normalize(name));
      const row = {team:name};
      for (const key of ["place","games","points"]) {
        if (item[key] === null || item[key] === undefined || String(item[key]).trim() === "") throw new Error("Fehlende Tabellenwerte");
        row[key] = Number(item[key]);
        if (!Number.isInteger(row[key]) || Math.abs(row[key]) > 999 || (key !== "points" && row[key] < (key === "place" ? 1 : 0))) throw new Error("Ungültige Tabellenwerte");
      }
      if (row.place > 7 || places.has(row.place)) throw new Error("Ungültige Platzierung");
      places.add(row.place);
      for (const key of ["sets","legs"]) {
        if (!/^\d{1,4}:\d{1,4}$/.test(String(item[key]))) throw new Error("Sets oder Legs fehlen");
        row[key] = item[key];
      }
      return row;
    });
    if (!names.has(normalize(ownName))) throw new Error("Eigenes Team fehlt");
    return result.sort((a,b) => a.place-b.place);
  }
  function live(data, ownName) {
    const entries = (data?.tableEntries || []).flatMap(group => group.tableEntries || []);
    return validate(entries.map(row => ({team:row.participant?.displayName || row.participantName,
      place:String(row.placement ?? "").replace(/\.$/,""),games:row.matchCount,points:row.points1,
      sets:`${row.sets1}:${row.sets2}`,legs:`${row.legs1}:${row.legs2}`})), ownName);
  }
  function snapshot(data, event, ownName) {
    const saved = data?.events?.[event];
    const stamp = saved?.checkedAt || saved?.updatedAt;
    if (!Number.isFinite(Date.parse(stamp))) throw new Error("Stand fehlt");
    return {rows:validate(Object.values(saved.participants || {}).map(p=>({...p,team:p.displayName})),ownName),stamp};
  }
  return {normalize,validate,live,snapshot};
})();
if (typeof module !== "undefined") module.exports = DartTableData;
