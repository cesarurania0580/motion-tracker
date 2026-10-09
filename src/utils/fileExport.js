// Keep output URLs alive for explicit user-initiated saving/opening.
export function prepareFile(blob, fileName) {
  return { url: URL.createObjectURL(blob), fileName };
}

export function triggerFileDownload(file) {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.fileName;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); }
}

export function releaseFile(file) {
  if (file) setTimeout(() => URL.revokeObjectURL(file.url), 60000);
}

export function canvasPNG(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png');
  });
}
