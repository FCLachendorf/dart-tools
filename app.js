document.getElementById("menuButton").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("open");
});

async function exportCanvasPng(canvas, fileName) {
  const dataUrl = canvas.toDataURL("image/png");
  const file = dataUrlToFile(dataUrl, fileName);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.warn("Native Bildfreigabe fehlgeschlagen, nutze Download-Fallback.", error);
    }
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function dataUrlToFile(dataUrl, fileName) {
  const [meta, data] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] || "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

window.exportCanvasPng = exportCanvasPng;

// Downsample logos in small steps so thin strokes survive large size reductions.
// Cache by source image and output size; the transparent PNGs remain unchanged.
window.drawLogoSmooth = (() => {
  const cache = new WeakMap();
  return function drawLogoSmooth(ctx, image, x, y, width, height) {
    if (!(width > 0 && height > 0)) return;
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!(sourceWidth > 0 && sourceHeight > 0)) return;
    const targetWidth = Math.max(1, Math.ceil(width));
    const targetHeight = Math.max(1, Math.ceil(height));
    const key = targetWidth + "x" + targetHeight;
    let sizes = cache.get(image);
    if (!sizes) { sizes = new Map(); cache.set(image, sizes); }
    let scaled = sizes.get(key);
    if (!scaled) {
      scaled = image;
      let w = sourceWidth, h = sourceHeight;
      while (w > targetWidth || h > targetHeight) {
        const next = document.createElement("canvas");
        next.width = Math.max(targetWidth, Math.floor(w / 2));
        next.height = Math.max(targetHeight, Math.floor(h / 2));
        const target = next.getContext("2d");
        target.imageSmoothingEnabled = true;
        target.imageSmoothingQuality = "high";
        target.drawImage(scaled, 0, 0, next.width, next.height);
        scaled = next; w = next.width; h = next.height;
      }
      if (sizes.size >= 8) sizes.clear();
      sizes.set(key, scaled);
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(scaled, x, y, width, height);
    ctx.restore();
  };
})();
