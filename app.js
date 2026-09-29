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
