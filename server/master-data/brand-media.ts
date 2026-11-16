import "server-only";

import sharp from "sharp";
import { db } from "@/db/client";
import { logger } from "@/server/log";
import { getStorageProvider } from "@/services/storage";
import { createBrandLogoKey, isBrandLogoKey } from "@/services/storage/key";
import { MAX_IMAGE_PIXELS, validateImageUpload } from "@/validation/upload";

export class BrandLogoError extends Error {}

export function brandLogoUrl(key: string | null) {
  return key && isBrandLogoKey(key) ? getStorageProvider().publicUrl(key) : null;
}

export async function uploadBrandLogo(input: unknown) {
  if (input == null || (input instanceof File && !input.size)) return null;
  const parsed = await validateImageUpload(input);
  if (!parsed.success) throw new BrandLogoError(parsed.error.issues[0]?.message ?? "Logo tidak valid.");
  let body: Buffer;
  try {
    body = await sharp(new Uint8Array(await parsed.data.arrayBuffer()), { limitInputPixels: MAX_IMAGE_PIXELS })
      .autoOrient().resize(800, 800, { fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  } catch { throw new BrandLogoError("Logo tidak dapat diproses."); }
  const key = createBrandLogoKey("image/webp");
  try { await getStorageProvider().put({ key, body, contentType: "image/webp" }); }
  catch { logger.error("brand.logo_upload_failed"); throw new BrandLogoError("Logo belum dapat disimpan."); }
  return key;
}

export async function cleanupBrandLogo(key: string | null) {
  if (!key) return false;
  if (!isBrandLogoKey(key)) { logger.warn("brand.logo_cleanup_rejected_key"); return true; }
  try {
    if (!await db.brand.count({ where: { logoStorageKey: key } })) await getStorageProvider().delete(key);
    return false;
  } catch { logger.warn("brand.logo_cleanup_failed"); return true; }
}
