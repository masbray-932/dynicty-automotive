import "server-only";

import sharp from "sharp";
import { db } from "@/db/client";
import { requireLegacyAdminPermission } from "@/server/auth/session";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { logger } from "@/server/log";
import { getStorageProvider } from "@/services/storage";
import { createDealerLogoKey, isDealerLogoKey } from "@/services/storage/key";
import { reportUploadFailure } from "@/server/upload-feedback";
import { dealerBrandingColorsSchema } from "@/validation/dealer-branding";
import { MAX_IMAGE_PIXELS, validateImageUpload } from "@/validation/upload";
import type { AuthorizationRequest } from "@/server/auth/authorization";

export const standaloneBrandingPermission = {
  permission: "dealer:standalone-branding:write", scope: LEGACY_DEALER_SCOPE,
} satisfies AuthorizationRequest;

const id = LEGACY_DEALER_SCOPE.dealerId;
const legacyWhere = { id, AND: [{ dealerId: null }] };

export async function saveStandaloneColors(input: unknown) {
  await requireLegacyAdminPermission(standaloneBrandingPermission);
  const { primaryColor, secondaryColor } = dealerBrandingColorsSchema.parse(input);
  const data = { primaryColor, secondaryColor };
  await db.dealerSettings.upsert({ where: legacyWhere, create: { id, ...data }, update: data });
}

export class LogoUploadError extends Error {}

async function swapLogoKey(logoStorageKey: string | null) {
  // Serialize with other branding writes and never read or update a registered row.
  return db.$transaction(async tx => {
    if (logoStorageKey !== null) {
      await tx.dealerSettings.upsert({ where: legacyWhere, create: { id }, update: {} });
    }
    const [previous] = await tx.$queryRaw<Array<{ logoStorageKey: string | null }>>`
      SELECT "logoStorageKey" FROM "DealerSettings"
      WHERE "id" = ${id} AND "dealerId" IS NULL FOR UPDATE
    `;
    if (!previous) throw new Error("Legacy dealer settings unavailable.");
    await tx.dealerSettings.update({ where: legacyWhere, data: { logoStorageKey } });
    return previous.logoStorageKey;
  });
}

async function cleanupLogo(key: string | null) {
  if (!key) return false;
  if (!isDealerLogoKey(key)) {
    logger.warn("dealer.logo_cleanup_rejected_key");
    return true;
  }
  try {
    await getStorageProvider().delete(key);
    return false;
  } catch {
    logger.warn("dealer.logo_cleanup_failed");
    return true;
  }
}

export async function replaceStandaloneLogo(input: unknown) {
  await requireLegacyAdminPermission(standaloneBrandingPermission);
  const parsed = await validateImageUpload(input);
  if (!parsed.success) throw new LogoUploadError(parsed.error.issues[0].message);

  let body: Buffer;
  try {
    // Do not publish original bytes or metadata. Only decoded raster pixels
    // are re-encoded, and EXIF orientation is applied before resizing.
    body = await sharp(new Uint8Array(await parsed.data.arrayBuffer()), { limitInputPixels: MAX_IMAGE_PIXELS })
      .autoOrient().resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  } catch {
    throw new LogoUploadError("Logo tidak dapat diproses.");
  }
  const key = createDealerLogoKey("logo.webp", crypto.randomUUID(), "image/webp");
  let previous: string | null;
  try {
    await getStorageProvider().put({ key, body, contentType: "image/webp" });
    previous = await swapLogoKey(key);
  } catch (error) {
    await cleanupLogo(key);
    throw new LogoUploadError(reportUploadFailure("dealer.logo_upload_failed", error));
  }
  return { cleanupFailed: await cleanupLogo(previous) };
}

export async function removeStandaloneLogo() {
  await requireLegacyAdminPermission(standaloneBrandingPermission);
  return { cleanupFailed: await cleanupLogo(await swapLogoKey(null)) };
}
