// FC Lachendorf Darts – Trainingssieger Generator
// ------------------------------------------------
// Positionen und Größen passt du oben in CONFIG.text an.
// x = links/rechts, y = oben/unten, fontSize = Schriftgröße in Pixeln.

const CONFIG = {
  width: 1080,
  height: 1350,

  assets: [
    "t1.png",
    "bgra1.png",
    "rgra1.png",
    "vigne1.png",
    "vigne2.png",
    "logoname.png",
    "title.png",
  ],

  paths: {
    assets: "assets/",
    fonts: "fonts/",
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

  text: {
    firstName: {
      x: 180,
      y: 1150,
      maxWidth: 430,
      fontSize: 46,
      minFontSize: 28,
      color: "#ededf5",
      family: "Topshow",
      align: "left",
      uppercase: true,
    },

    lastName: {
      x: 175,
      y: 1230,
      maxWidth: 700,
      fontSize: 86,
      minFontSize: 48,
      color: "#ededf5",
      family: "Topshow",
      align: "left",
      uppercase: true,
    },

    average: {
      x: 1000,
      y: 1108,
      maxWidth: 135,
      fontSize: 42,
      minFontSize: 26,
      color: "#330808",
      family: "Topshow",
      align: "right",
      uppercase: false,
    },

    date: {
      x: 420,
      y: 1320,
      maxWidth: 250,
      fontSize: 31,
      minFontSize: 22,
      color: "#646468",
      family: "TacticSans",
      align: "middle",
      uppercase: false,
    },
  },
};

const els = {
  canvas: document.getElementById("postCanvas"),
  photoInput: document.getElementById("photoInput"),
  firstName: document.getElementById("firstName"),
  lastName: document.getElementById("lastName"),
  average: document.getElementById("average"),
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
  userPhoto: null,
  userPhotoName: "",
  overlayImages: [],
  drag: {
    active: false,
    startClientX: 0,
    startClientY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  },
};

init();

async function init() {
  els.date.value = toInputDate(new Date());

  bindEvents();

  await loadFonts();
  state.overlayImages = await loadOverlayImages(CONFIG.assets);

  updatePhotoRangeLimits();
  render();
}

function bindEvents() {
  [els.firstName, els.lastName, els.average, els.date].forEach((el) => {
    el.addEventListener("input", render);
  });

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

  els.canvas.addEventListener("pointerdown", startCanvasDrag);
  window.addEventListener("pointermove", moveCanvasDrag);
  window.addEventListener("pointerup", endCanvasDrag);
  window.addEventListener("pointercancel", endCanvasDrag);
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
  for (const image of state.overlayImages) {
    if (!image) continue;
    ctx.drawImage(image, 0, 0, CONFIG.width, CONFIG.height);
  }
}

function drawTextValues() {
  const firstName = sanitizeText(els.firstName.value || "Alexander");
  const lastName = sanitizeText(els.lastName.value || "Mustermann");
  const average = formatAverage(els.average.value);
  const date = formatDateGerman(els.date.value);

  drawFittedText(firstName, CONFIG.text.firstName);
  drawFittedText(lastName, CONFIG.text.lastName);
  drawFittedText(average, CONFIG.text.average);
  drawFittedText(date, CONFIG.text.date);
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

function startCanvasDrag(event) {
  if (!state.userPhoto) return;

  state.drag.active = true;
  state.drag.startClientX = event.clientX;
  state.drag.startClientY = event.clientY;
  state.drag.startOffsetX = Number(els.photoX.value);
  state.drag.startOffsetY = Number(els.photoY.value);

  els.canvas.setPointerCapture?.(event.pointerId);
}

function moveCanvasDrag(event) {
  if (!state.drag.active || !state.userPhoto) return;

  event.preventDefault();

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

function endCanvasDrag() {
  state.drag.active = false;
}

function sanitizeText(text) {
  return String(text).trim().replace(/\s+/g, " ");
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

  const firstName = sanitizeText(els.firstName.value || "spieler");
  const lastName = sanitizeText(els.lastName.value || "");
  const date = els.date.value || toInputDate(new Date());

  const fileName = `trainingssieger-${slugify(`${firstName}-${lastName}`)}-${date}.png`;

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
