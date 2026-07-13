// FC Lachendorf Darts – Story Generator v3
// -----------------------------------------
// Format: 1080 × 1920 px.
// An deine Beispielbilder angepasst:
// - Solo: ein Namensblock unten rechts/zentral
// - Duo: zwei getrennte Namensboxen unten
// - Werte für Average und Highest Finish werden in die festen Balken geschrieben.

const CONFIG = {
  width: 1080,
  height: 1920,

  paths: {
    assets: "assets/",
    fonts: "fonts/",
  },

  // Reihenfolge wie von dir beschrieben:
  // Foto -> 6 % dunkler -> t1 -> bgra -> rgra -> vignetten -> Modus-Layer
  sharedAssets: [
    "t1.png",
    "bgra1.png",
    "rgra1.png",
    "vigne1.png",
    "vigne2.png",
  ],

  modeAssets: {
    solo: ["soloname.png", "solotitle.png"],
    duo: ["duoname.png", "duotitle.png"],
  },

  fonts: {
    name: {
      family: "Topshow",
      file: "topshow.otf",
    },
    date: {
      family: "TacticSans",
      file: "tacticsans.otf",
    },
  },

  photo: {
    darkenOpacity: 0.06,
    fallbackColor: "#c83a31",
  },

  // Diese Positionen sind bewusst leicht an deine Beispielbilder angenähert.
  // Du musst sie wahrscheinlich noch 1x feinjustieren, weil deine echten PNG-Layer entscheidend sind.
  text: {
    solo: {
      firstName: {
        x: 235,
        y: 1720,
        maxWidth: 470,
        fontSize: 54,
        minFontSize: 30,
        color: "#ededf5",
        family: "Topshow",
        align: "left",
        uppercase: true,
      },

      lastName: {
        x: 230,
        y: 1790,
        maxWidth: 735,
        fontSize: 86,
        minFontSize: 48,
        color: "#ededf5",
        family: "Topshow",
        align: "left",
        uppercase: true,
      },

      average: {
        x: 515,
        y: 1573,
        maxWidth: 115,
        fontSize: 38,
        minFontSize: 25,
        color: "#330808",
        family: "Topshow",
        align: "left",
        uppercase: false,
      },

      highestFinish: {
        x: 522,
        y: 1643,
        maxWidth: 120,
        fontSize: 38,
        minFontSize: 25,
        color: "#98252f",
        family: "Topshow",
        align: "left",
        uppercase: false,
      },

      date: {
        x: 540,
        y: 1875,
        maxWidth: 500,
        fontSize: 38,
        minFontSize: 24,
        color: "#646468",
        family: "TacticSans",
        align: "center",
        uppercase: false,
      },
    },

    duo: {
      player1FirstName: {
        x: 280,
        y: 1720,
        maxWidth: 270,
        fontSize: 40,
        minFontSize: 24,
        color: "#ededf5",
        family: "Topshow",
        align: "center",
        uppercase: true,
      },

      player1LastName: {
        x: 285,
        y: 1780,
        maxWidth: 430,
        fontSize: 58,
        minFontSize: 33,
        color: "#ededf5",
        family: "Topshow",
        align: "center",
        uppercase: true,
      },

      player2FirstName: {
        x: 780,
        y: 1720,
        maxWidth: 300,
        fontSize: 40,
        minFontSize: 24,
        color: "#ededf5",
        family: "Topshow",
        align: "center",
        uppercase: true,
      },

      player2LastName: {
        x: 785,
        y: 1780,
        maxWidth: 430,
        fontSize: 58,
        minFontSize: 33,
        color: "#ededf5",
        family: "Topshow",
        align: "center",
        uppercase: true,
      },

      average: {
        x: 403,
        y: 1573,
        maxWidth: 110,
        fontSize: 38,
        minFontSize: 25,
        color: "#330808",
        family: "Topshow",
        align: "left",
        uppercase: false,
      },

      highestFinish: {
        x: 410,
        y: 1643,
        maxWidth: 120,
        fontSize: 38,
        minFontSize: 25,
        color: "#ededf5",
        family: "Topshow",
        align: "left",
        uppercase: false,
      },

      date: {
        x: 540,
        y: 1884,
        maxWidth: 680,
        fontSize: 36,
        minFontSize: 24,
        color: "#646468",
        family: "TacticSans",
        align: "center",
        uppercase: false,
      },
    },
  },
};

const els = {
  canvas: document.getElementById("postCanvas"),
  photoInput: document.getElementById("photoInput"),

  soloFields: document.getElementById("soloFields"),
  duoFields: document.getElementById("duoFields"),
  soloModeButton: document.getElementById("soloModeButton"),
  duoModeButton: document.getElementById("duoModeButton"),

  soloFirstName: document.getElementById("soloFirstName"),
  soloLastName: document.getElementById("soloLastName"),

  duoFirstName1: document.getElementById("duoFirstName1"),
  duoLastName1: document.getElementById("duoLastName1"),
  duoFirstName2: document.getElementById("duoFirstName2"),
  duoLastName2: document.getElementById("duoLastName2"),

  average: document.getElementById("average"),
  highestFinish: document.getElementById("highestFinish"),
  date: document.getElementById("date"),

  photoZoom: document.getElementById("photoZoom"),
  photoX: document.getElementById("photoX"),
  photoY: document.getElementById("photoY"),

  downloadButton: document.getElementById("downloadButton"),
  menuButton: document.getElementById("menuButton"),
  nav: document.getElementById("nav"),

  uploadEmpty: document.getElementById("uploadEmpty"),
  uploadSelected: document.getElementById("uploadSelected"),
  uploadThumb: document.getElementById("uploadThumb"),
  uploadFileName: document.getElementById("uploadFileName"),
  removePhotoButton: document.getElementById("removePhotoButton"),
};

const ctx = els.canvas.getContext("2d");

const state = {
  mode: "solo",
  userPhoto: null,
  userPhotoName: "",
  images: {
    shared: [],
    solo: [],
    duo: [],
  },
  drag: {
    active: false,
    startClientX: 0,
    startClientY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  },
  pinch: {
    active: false,
    startDistance: 0,
    startZoom: 1,
  },
  pointers: new Map(),
};

init();

async function init() {
  els.date.value = toInputDate(new Date());

  bindEvents();

  await loadFonts();

  state.images.shared = await loadOverlayImages(CONFIG.sharedAssets);
  state.images.solo = await loadOverlayImages(CONFIG.modeAssets.solo);
  state.images.duo = await loadOverlayImages(CONFIG.modeAssets.duo);

  updateModeUi();
  updatePhotoRangeLimits();
  render();
}

function bindEvents() {
  [
    els.soloFirstName,
    els.soloLastName,
    els.duoFirstName1,
    els.duoLastName1,
    els.duoFirstName2,
    els.duoLastName2,
    els.average,
    els.highestFinish,
    els.date,
  ].forEach((el) => el.addEventListener("input", render));

  els.soloModeButton.addEventListener("click", () => setMode("solo"));
  els.duoModeButton.addEventListener("click", () => setMode("duo"));

  els.photoZoom.addEventListener("input", () => {
    updatePhotoRangeLimits();
    render();
  });

  [els.photoX, els.photoY].forEach((el) => {
    el.addEventListener("input", () => {
      clampPhotoOffsets();
      render();
    });
  });

  els.photoInput.addEventListener("change", handlePhotoUpload);
  els.removePhotoButton.addEventListener("click", removePhoto);
  els.downloadButton.addEventListener("click", downloadImage);

  els.menuButton.addEventListener("click", () => {
    els.nav.classList.toggle("open");
  });

  els.canvas.addEventListener("pointerdown", onPointerDown);
  els.canvas.addEventListener("pointermove", onPointerMove);
  els.canvas.addEventListener("pointerup", onPointerUp);
  els.canvas.addEventListener("pointercancel", onPointerUp);
  els.canvas.addEventListener("pointerleave", onPointerUp);
}

function setMode(mode) {
  state.mode = mode;
  updateModeUi();
  render();
}

function updateModeUi() {
  const isSolo = state.mode === "solo";

  els.soloFields.hidden = !isSolo;
  els.duoFields.hidden = isSolo;

  els.soloModeButton.classList.toggle("active", isSolo);
  els.duoModeButton.classList.toggle("active", !isSolo);
}

async function loadFonts() {
  const fontDefinitions = Object.values(CONFIG.fonts);

  await Promise.all(
    fontDefinitions.map(async (font) => {
      const face = new FontFace(font.family, `url(${CONFIG.paths.fonts}${font.file})`);
      const loadedFace = await face.load();
      document.fonts.add(loadedFace);
    })
  );

  await document.fonts.ready;
}

function loadOverlayImages(fileNames) {
  return Promise.all(
    fileNames.map((fileName) => loadImage(`${CONFIG.paths.assets}${fileName}`))
  );
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      console.warn(`Konnte Bild nicht laden: ${src}`);
      resolve(null);
    };

    image.src = src;
  });
}

function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const image = new Image();

    image.onload = () => {
      state.userPhoto = image;
      state.userPhotoName = file.name;

      els.photoZoom.value = "1";
      els.photoX.value = "0";
      els.photoY.value = "0";

      updateUploadPreview(reader.result, file.name);
      updatePhotoRangeLimits();
      render();
    };

    image.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function updateUploadPreview(src, fileName) {
  els.uploadThumb.src = src;
  els.uploadFileName.textContent = fileName;
  els.uploadEmpty.hidden = true;
  els.uploadSelected.hidden = false;
  els.removePhotoButton.hidden = false;
}

function removePhoto(event) {
  event.preventDefault();
  event.stopPropagation();

  state.userPhoto = null;
  state.userPhotoName = "";

  els.photoInput.value = "";
  els.uploadThumb.removeAttribute("src");
  els.uploadFileName.textContent = "Foto ausgewählt";
  els.uploadEmpty.hidden = false;
  els.uploadSelected.hidden = true;
  els.removePhotoButton.hidden = true;

  els.photoZoom.value = "1";
  els.photoX.value = "0";
  els.photoY.value = "0";

  updatePhotoRangeLimits();
  render();
}

function render() {
  clearCanvas();
  drawPhoto();
  drawOverlayImages();
  drawTextValues();
}

function clearCanvas() {
  ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.fillStyle = CONFIG.photo.fallbackColor;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
}

function drawPhoto() {
  if (!state.userPhoto) {
    drawPlaceholder();
    return;
  }

  clampPhotoOffsets();

  const zoom = Number(els.photoZoom.value);
  const offsetX = Number(els.photoX.value);
  const offsetY = Number(els.photoY.value);

  drawImageCover(ctx, state.userPhoto, CONFIG.width, CONFIG.height, zoom, offsetX, offsetY);

  ctx.save();
  ctx.globalAlpha = CONFIG.photo.darkenOpacity;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.restore();
}

function drawPlaceholder() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.font = "800 44px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Foto hochladen", CONFIG.width / 2, CONFIG.height / 2);

  ctx.restore();
}

function drawImageCover(context, image, canvasWidth, canvasHeight, zoom, offsetX, offsetY) {
  const size = getCoverSize(image, zoom);

  const x = (canvasWidth - size.width) / 2 + offsetX;
  const y = (canvasHeight - size.height) / 2 + offsetY;

  context.drawImage(image, x, y, size.width, size.height);
}

function getCoverSize(image, zoom) {
  if (!image) {
    return { width: CONFIG.width, height: CONFIG.height };
  }

  const imageRatio = image.width / image.height;
  const canvasRatio = CONFIG.width / CONFIG.height;

  let width;
  let height;

  if (imageRatio > canvasRatio) {
    height = CONFIG.height * zoom;
    width = height * imageRatio;
  } else {
    width = CONFIG.width * zoom;
    height = width / imageRatio;
  }

  return { width, height };
}

function getPhotoBounds() {
  if (!state.userPhoto) {
    return { maxX: 0, maxY: 0 };
  }

  const size = getCoverSize(state.userPhoto, Number(els.photoZoom.value));

  return {
    maxX: Math.max(0, Math.round((size.width - CONFIG.width) / 2)),
    maxY: Math.max(0, Math.round((size.height - CONFIG.height) / 2)),
  };
}

function updatePhotoRangeLimits() {
  const { maxX, maxY } = getPhotoBounds();

  els.photoX.min = String(-maxX);
  els.photoX.max = String(maxX);
  els.photoY.min = String(-maxY);
  els.photoY.max = String(maxY);

  els.photoX.disabled = maxX === 0;
  els.photoY.disabled = maxY === 0;

  clampPhotoOffsets();
}

function clampPhotoOffsets() {
  const { maxX, maxY } = getPhotoBounds();

  els.photoX.value = String(clamp(Number(els.photoX.value), -maxX, maxX));
  els.photoY.value = String(clamp(Number(els.photoY.value), -maxY, maxY));
}

function drawOverlayImages() {
  for (const image of state.images.shared) {
    if (!image) continue;
    ctx.drawImage(image, 0, 0, CONFIG.width, CONFIG.height);
  }

  for (const image of state.images[state.mode]) {
    if (!image) continue;
    ctx.drawImage(image, 0, 0, CONFIG.width, CONFIG.height);
  }
}

function drawTextValues() {
  const average = formatAverage(els.average.value);
  const highestFinish = sanitizeNumberText(els.highestFinish.value || "0");
  const date = formatDateGerman(els.date.value);

  if (state.mode === "solo") {
    const firstName = sanitizeText(els.soloFirstName.value || "Alexander");
    const lastName = sanitizeText(els.soloLastName.value || "Mustermann");

    drawFittedText(firstName, CONFIG.text.solo.firstName);
    drawFittedText(lastName, CONFIG.text.solo.lastName);
    drawFittedText(average, CONFIG.text.solo.average);
    drawFittedText(highestFinish, CONFIG.text.solo.highestFinish);
    drawFittedText(date, CONFIG.text.solo.date);
    return;
  }

  const firstName1 = sanitizeText(els.duoFirstName1.value || "Alexander");
  const lastName1 = sanitizeText(els.duoLastName1.value || "Mustermann");
  const firstName2 = sanitizeText(els.duoFirstName2.value || "Steven");
  const lastName2 = sanitizeText(els.duoLastName2.value || "Musterfrau");

  drawFittedText(firstName1, CONFIG.text.duo.player1FirstName);
  drawFittedText(lastName1, CONFIG.text.duo.player1LastName);
  drawFittedText(firstName2, CONFIG.text.duo.player2FirstName);
  drawFittedText(lastName2, CONFIG.text.duo.player2LastName);
  drawFittedText(average, CONFIG.text.duo.average);
  drawFittedText(highestFinish, CONFIG.text.duo.highestFinish);
  drawFittedText(date, CONFIG.text.duo.date);
}

function drawFittedText(text, options) {
  const value = options.uppercase ? text.toUpperCase() : text;

  let fontSize = options.fontSize;

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = options.align;
  ctx.fillStyle = options.color;

  while (fontSize > options.minFontSize) {
    ctx.font = `${fontSize}px "${options.family}"`;
    if (ctx.measureText(value).width <= options.maxWidth) break;
    fontSize -= 2;
  }

  ctx.font = `${fontSize}px "${options.family}"`;
  ctx.fillText(value, options.x, options.y);
  ctx.restore();
}

function onPointerDown(event) {
  if (!state.userPhoto) return;

  els.canvas.setPointerCapture?.(event.pointerId);
  state.pointers.set(event.pointerId, event);

  if (state.pointers.size === 1) {
    state.drag.active = true;
    state.drag.startClientX = event.clientX;
    state.drag.startClientY = event.clientY;
    state.drag.startOffsetX = Number(els.photoX.value);
    state.drag.startOffsetY = Number(els.photoY.value);
  }

  if (state.pointers.size === 2) {
    const [a, b] = [...state.pointers.values()];
    state.pinch.active = true;
    state.pinch.startDistance = getPointerDistance(a, b);
    state.pinch.startZoom = Number(els.photoZoom.value);
    state.drag.active = false;
  }
}

function onPointerMove(event) {
  if (!state.userPhoto || !state.pointers.has(event.pointerId)) return;

  event.preventDefault();
  state.pointers.set(event.pointerId, event);

  if (state.pinch.active && state.pointers.size >= 2) {
    const [a, b] = [...state.pointers.values()];
    const distance = getPointerDistance(a, b);
    const ratio = distance / state.pinch.startDistance;
    const nextZoom = clamp(state.pinch.startZoom * ratio, Number(els.photoZoom.min), Number(els.photoZoom.max));

    els.photoZoom.value = String(nextZoom);
    updatePhotoRangeLimits();
    render();
    return;
  }

  if (state.drag.active && state.pointers.size === 1) {
    const rect = els.canvas.getBoundingClientRect();
    const scaleX = CONFIG.width / rect.width;
    const scaleY = CONFIG.height / rect.height;

    const nextX = state.drag.startOffsetX + (event.clientX - state.drag.startClientX) * scaleX;
    const nextY = state.drag.startOffsetY + (event.clientY - state.drag.startClientY) * scaleY;

    const { maxX, maxY } = getPhotoBounds();

    els.photoX.value = String(Math.round(clamp(nextX, -maxX, maxX)));
    els.photoY.value = String(Math.round(clamp(nextY, -maxY, maxY)));

    render();
  }
}

function onPointerUp(event) {
  state.pointers.delete(event.pointerId);

  if (state.pointers.size < 2) {
    state.pinch.active = false;
  }

  if (state.pointers.size === 1) {
    const remaining = [...state.pointers.values()][0];
    state.drag.active = true;
    state.drag.startClientX = remaining.clientX;
    state.drag.startClientY = remaining.clientY;
    state.drag.startOffsetX = Number(els.photoX.value);
    state.drag.startOffsetY = Number(els.photoY.value);
  } else {
    state.drag.active = false;
  }
}

function getPointerDistance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function sanitizeText(text) {
  return String(text).trim().replace(/\s+/g, " ");
}

function sanitizeNumberText(text) {
  return String(text).trim().replace(/[^\d]/g, "") || "0";
}

function formatAverage(value) {
  const normalized = String(value).replace(",", ".");
  const number = Number(normalized);

  if (Number.isNaN(number)) return "0,0";

  return number.toFixed(1).replace(".", ",");
}

function formatDateGerman(inputValue) {
  if (!inputValue) return "";

  const [year, month, day] = inputValue.split("-");
  if (!year || !month || !day) return inputValue;

  return `${day}.${month}.${year}`;
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function downloadImage() {
  render();

  const date = els.date.value || toInputDate(new Date());
  const namePart =
    state.mode === "solo"
      ? `${els.soloFirstName.value}-${els.soloLastName.value}`
      : `${els.duoFirstName1.value}-${els.duoLastName1.value}-${els.duoFirstName2.value}-${els.duoLastName2.value}`;

  const fileName = `${state.mode}-trainingssieger-${slugify(namePart)}-${date}.png`;

  const link = document.createElement("a");
  link.download = fileName;
  link.href = els.canvas.toDataURL("image/png");
  link.click();
}

function slugify(value) {
  return value
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
