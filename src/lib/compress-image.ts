// Browser-only: resize + re-encode photos so phone pictures (5–15 MB) upload fast and fit server limits.

export async function compressImage(file: File, maxSide = 2000, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error(`${file.name} is not an image`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    throw new Error(`${file.name}: this format can’t be read in this browser (try JPG or PNG)`);
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
  if (!blob) throw new Error(`Could not process ${file.name}`);
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}
