// Shrinks a phone photo before upload: max ~1024px, JPEG, usually 80-180 KB.
// Quality does not matter for this app, so we favour a small file.
const STEPS = [
  [1024, 0.6],
  [1024, 0.48],
  [800, 0.5],
  [800, 0.38],
  [640, 0.4],
];

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo. Please try again.'));
    };
    img.src = url;
  });
}

export async function compressImage(file, targetKB = 180) {
  const bmp = await loadBitmap(file);
  const w0 = bmp.naturalWidth || bmp.width;
  const h0 = bmp.naturalHeight || bmp.height;
  let blob = null;

  for (const [maxSide, quality] of STEPS) {
    const scale = Math.min(1, maxSide / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) throw new Error('Could not process this photo. Please try again.');
    if (blob.size <= targetKB * 1024) break;
  }
  if (bmp.close) bmp.close();
  return new File([blob], 'hotel.jpg', { type: 'image/jpeg' });
}
