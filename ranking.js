(() => {
  "use strict";
  const el = (name) => document.getElementById(`ranking${name}`);
  const canvas = el("Canvas");
  const ctx = canvas.getContext("2d");
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const monthFiles = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  // Positionen in Originalpixeln: Y-Werte erhöhen, um Text nach unten zu setzen.
  const layouts = {
    story: { height: 1920, headerY: 0, nameX: 180, firstY: 1704, lastY: 1780, dateY: 1871, statsBottom: 1688, statX: 528 },
    post: { height: 1350, headerY: -60, nameX: 180, firstY: 1134, lastY: 1210, dateY: 1301, statsBottom: 1115, statX: 540 },
  };
  const specs = [
    { id: "Avg", file: "avg", sourceY: { story: 1471, post: 899 }, height: 77 },
    { id: "Fin", file: "fin", sourceY: { story: 1548, post: 976 }, height: 69 },
    { id: "Short", file: "short", sourceY: { story: 1617, post: 1045 }, height: 71 },
  ];
  const freshCrop = () => ({ zoom: 1, x: 0, y: 0 });
  const state = { format: "story", photo: null, photoUrl: null, ready: false, loading: false, sequence: 0, crops: { story: freshCrop(), post: freshCrop() } };
  const images = new Map();
  const pointers = new Map();
  let gesture = null;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  months.forEach((month, index) => el("Month").add(new Option(month, String(index))));
  el("Month").value = String(today.getMonth());
  el("Date").value = localDate;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
      image.src = src;
    });
  }
  async function init() {
    el("Status").textContent = "Designs werden geladen …";
    try {
      const paths = ["story/footer", ...monthFiles.map((month) => `story/header-${month}`)];
      for (const format of ["story", "post"]) {
        paths.push(...["overlay", "name", "avg", "fin-red", "fin-black", "short-red", "short-black"].map((file) => `${format}/${file}`));
      }
      await Promise.all([
        ...paths.map(async (path) => images.set(path, await loadImage(`assets/intern/${path}.png`))),
        ...[["RankingTop", "topshow"], ["RankingNumbers", "tacticsans"]].map(async ([family, file]) => {
          const font = new FontFace(family, `url(fonts/${file}.otf)`);
          document.fonts.add(await font.load());
        }),
      ]);
      state.ready = true;
      el("Status").textContent = state.photo ? "" : "Bitte ein Siegerfoto auswählen.";
    } catch (error) {
      console.error(error);
      el("Status").textContent = "Das Design konnte nicht vollständig geladen werden. Bitte die Seite neu laden.";
    }
    render();
  }
  function syncCrop() {
    const crop = state.crops[state.format];
    let maxX = 0, maxY = 0;
    if (state.photo) {
      const scale = Math.max(1080 / state.photo.width, canvas.height / state.photo.height) * crop.zoom;
      maxX = Math.max(0, (state.photo.width * scale - 1080) / 2);
      maxY = Math.max(0, (state.photo.height * scale - canvas.height) / 2);
    }
    crop.x = clamp(crop.x, -maxX, maxX);
    crop.y = clamp(crop.y, -maxY, maxY);
    for (const [id, value, max] of [["X", crop.x, maxX], ["Y", crop.y, maxY]]) {
      el(id).min = String(-max); el(id).max = String(max); el(id).value = String(value);
    }
    el("Zoom").value = String(crop.zoom);
    for (const id of ["X", "Y", "Zoom", "Reset"]) el(id).disabled = !state.photo || state.loading;
  }
  function text(value, x, y, size, width, family = "RankingTop", align = "left", color = "#fff") {
    ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillStyle = color;
    ctx.font = `${size}px ${family}`;
    while (ctx.measureText(value).width > width && size > 12) ctx.font = `${--size}px ${family}`;
    ctx.fillText(value, x, y);
  }
  function render() {
    const layout = layouts[state.format];
    if (canvas.height !== layout.height) canvas.height = layout.height;
    syncCrop();
    ctx.fillStyle = "#222226"; ctx.fillRect(0, 0, 1080, canvas.height);
    if (state.photo) {
      const crop = state.crops[state.format];
      const scale = Math.max(1080 / state.photo.width, canvas.height / state.photo.height) * crop.zoom;
      const width = state.photo.width * scale, height = state.photo.height * scale;
      ctx.drawImage(state.photo, (1080 - width) / 2 + crop.x, (canvas.height - height) / 2 + crop.y, width, height);
    }
    el("Download").disabled = !state.ready || !state.photo || state.loading;
    if (!state.ready) return;
    const layer = (file) => ctx.drawImage(images.get(`${state.format}/${file}`), 0, 0);
    layer("overlay");
    // Monatsheader bleiben 1080 × 1920, der Post-Canvas schneidet den leeren Rest ab.
    ctx.drawImage(images.get(`story/header-${monthFiles[Number(el("Month").value)]}`), 0, layout.headerY);
    if (state.format === "story") ctx.drawImage(images.get("story/footer"), 0, 0);
    layer("name");
    text(el("First").value.trim().toUpperCase() || "VORNAME", layout.nameX, layout.firstY, 54, 680);
    text(el("Last").value.trim().toUpperCase() || "NACHNAME", layout.nameX - 10, layout.lastY, 94, 690);
    const date = el("Date").value;
    text(date ? date.split("-").reverse().join(".") : "", 540, layout.dateY, 29, 600, "RankingNumbers", "center", "#b7b7bb");
    const active = specs.filter((spec) => el(`Show${spec.id}`).checked);
    let y = layout.statsBottom - active.reduce((sum, spec) => sum + spec.height, 0);
    active.forEach((spec, index) => {
      const color = index % 2 === 0 ? "red" : "black";
      const file = spec.file === "avg" ? "avg" : `${spec.file}-${color}`;
      const asset = images.get(`${state.format}/${file}`);
      const sourceY = spec.sourceY[state.format];
      // Beschriftung samt Icon proportional verkleinern, damit rechts auch
      // mehrstellige Werte Platz haben. Die Zeilen behalten ihre volle Breite.
      ctx.drawImage(asset, layout.statX + 2, sourceY + 20, 1, 1, layout.statX, y, 469, spec.height);
      const labelScale = .82;
      ctx.drawImage(asset, layout.statX, sourceY, 469, spec.height,
        layout.statX, y + spec.height * (1 - labelScale) / 2, 469 * labelScale, spec.height * labelScale);
      const rawValue = el(spec.id).value.trim();
      const number = Number(rawValue.replace(",", "."));
      const displayValue = !rawValue || !Number.isFinite(number) ? "–"
        : spec.id === "Avg" ? number.toFixed(1).replace(".", ",")
        : Number.isInteger(number) ? String(number) : "–";
      text(displayValue, layout.statX + 456, y + spec.height / 2, 31, 104, "RankingNumbers", "right");
      y += spec.height;
    });
    if (!state.photo) text("SIEGERFOTO AUSWÄHLEN", 540, canvas.height * .48, 54, 900, "RankingTop", "center");
  }
  document.querySelectorAll("[data-ranking-format]").forEach((button) => {
    button.addEventListener("click", () => {
      state.format = button.dataset.rankingFormat;
      pointers.clear(); gesture = null;
      document.querySelectorAll("[data-ranking-format]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active));
      });
      el("Dimensions").textContent = `1080 × ${layouts[state.format].height} px`;
      el("Download").textContent = `${state.format === "story" ? "Story" : "Post"} herunterladen`;
      render();
    });
  });
  for (const id of ["Month", "Date", "First", "Last", "Avg", "Fin", "Short"]) el(id).addEventListener("input", render);
  specs.forEach(({ id }) => el(`Show${id}`).addEventListener("change", () => {
    el(`${id}Field`).hidden = !el(`Show${id}`).checked;
    render();
  }));
  for (const [id, key] of [["Zoom", "zoom"], ["X", "x"], ["Y", "y"]]) el(id).addEventListener("input", () => {
    state.crops[state.format][key] = Number(el(id).value); render();
  });
  el("Reset").addEventListener("click", () => { state.crops[state.format] = freshCrop(); render(); });
  el("Photo").addEventListener("change", async () => {
    const file = el("Photo").files[0];
    if (!file) return;
    const sequence = ++state.sequence;
    const url = URL.createObjectURL(file);
    state.loading = true; el("Status").textContent = "Foto wird geladen …"; render();
    try {
      const photo = await loadImage(url);
      if (sequence !== state.sequence) { URL.revokeObjectURL(url); return; }
      if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
      state.photo = photo; state.photoUrl = url;
      state.crops = { story: freshCrop(), post: freshCrop() };
      el("Thumb").src = url; el("FileName").textContent = file.name;
      el("UploadEmpty").hidden = true; el("UploadSelected").hidden = false; el("Remove").hidden = false;
      el("Status").textContent = state.ready ? "" : "Designs werden geladen …";
    } catch (error) {
      URL.revokeObjectURL(url);
      if (sequence === state.sequence) el("Status").textContent = "Dieses Foto konnte nicht geladen werden. Bitte JPG, PNG oder WebP auswählen.";
    } finally {
      if (sequence === state.sequence) { state.loading = false; el("Photo").value = ""; render(); }
    }
  });
  el("Remove").addEventListener("click", () => {
    ++state.sequence; state.loading = false; state.photo = null;
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = null; el("Thumb").removeAttribute("src"); el("Photo").value = "";
    el("UploadEmpty").hidden = false; el("UploadSelected").hidden = true; el("Remove").hidden = true;
    el("Status").textContent = "Bitte ein Siegerfoto auswählen."; render();
  });
  function beginGesture() {
    const points = [...pointers.values()];
    gesture = points.length ? { points, crop: { ...state.crops[state.format] } } : null;
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 1080 / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (!state.photo || state.loading) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, point(event)); beginGesture();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, point(event));
    const now = [...pointers.values()], before = gesture.points, crop = state.crops[state.format];
    const center = (points) => ({ x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length });
    const a = center(before), b = center(now);
    let ratio = 1;
    if (now.length === 2 && before.length === 2) {
      const distance = (points) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      crop.zoom = clamp(gesture.crop.zoom * distance(now) / Math.max(1, distance(before)), 1, 3);
      ratio = crop.zoom / gesture.crop.zoom;
    }
    crop.x = b.x - 540 - (a.x - 540 - gesture.crop.x) * ratio;
    crop.y = b.y - canvas.height / 2 - (a.y - canvas.height / 2 - gesture.crop.y) * ratio;
    render();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(type, (event) => { pointers.delete(event.pointerId); beginGesture(); });
  el("Download").addEventListener("click", async () => {
    if (!state.photo || !state.ready || state.loading) return;
    for (const spec of specs) {
      if (!el(`Show${spec.id}`).checked) continue;
      const input = el(spec.id);
      const value = input.value.trim();
      const average = Number(value.replace(",", "."));
      const valid = value && (spec.id === "Avg" ? /^\d{1,3}([.,]\d)?$/.test(value) && average > 0 && average <= 180 : Number.isInteger(Number(value)) && input.checkValidity());
      if (!valid) { el("Status").textContent = "Bitte für die aktivierten Statistiken gültige Werte eintragen."; input.focus(); return; }
    }
    try {
      render();
      const name = `${el("First").value}-${el("Last").value}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
      await window.exportCanvasPng(canvas, `ranglistenturnier-${monthFiles[Number(el("Month").value)]}-${state.format}-${name || "sieger"}-${el("Date").value || localDate}.png`);
      el("Status").textContent = "";
    } catch (error) {
      console.error(error); el("Status").textContent = "Der Export hat nicht funktioniert. Bitte erneut versuchen.";
    }
  });
  init();
})();
