/** Client-side image utilities for listing photos. */

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

/**
 * Downscale an image to at most 1200px on its longer side and encode
 * as JPEG — phone photos are often 5–10 MB, which would bloat storage
 * and make browsing slow.
 */
export const compressImage = (file: File): Promise<File> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compression didn't help (e.g. already small) — keep original
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    // If decoding fails (unsupported format), fall back to the original
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });

/** Derive the storage object path from a public bucket URL. */
export const storagePathFromPublicUrl = (
  url: string,
  bucket: string
): string | null => url.split(`/${bucket}/`)[1] ?? null;
