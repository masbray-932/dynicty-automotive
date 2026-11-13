import "server-only";

import sharp from "sharp";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { createWhatsappUrl, normalizeWhatsappNumber } from "@/features/homepage/domain";
import { requireAdmin } from "@/server/auth/session";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { logger } from "@/server/log";
import { getStorageProvider } from "@/services/storage";
import { createSalesPhotoKey, isSalesPhotoKey } from "@/services/storage/key";
import { MAX_IMAGE_PIXELS, validateImageUpload } from "@/validation/upload";
import { salesTeamSchema } from "@/validation/sales-team";

const ownerId = LEGACY_DEALER_SCOPE.dealerId;
const owner = { dealerSettingsId: ownerId, dealerSettings: { dealerId: null } } as const;
export class SalesTeamError extends Error { constructor(message: string, readonly field?: string) { super(message); } }

export function salesPhotoUrl(key: string | null) {
  return key && isSalesPhotoKey(key) ? getStorageProvider().publicUrl(key) : null;
}

async function uploadPhoto(input: unknown) {
  if (input == null || (input instanceof File && !input.size)) return null;
  const parsed = await validateImageUpload(input);
  if (!parsed.success) throw new SalesTeamError(parsed.error.issues[0]?.message ?? "Foto tidak valid.", "image");
  let body: Buffer;
  try {
    body = await sharp(new Uint8Array(await parsed.data.arrayBuffer()), { limitInputPixels: MAX_IMAGE_PIXELS })
      .autoOrient().resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  } catch { throw new SalesTeamError("Foto tidak dapat diproses.", "image"); }
  const key = createSalesPhotoKey("image/webp");
  try { await getStorageProvider().put({ key, body, contentType: "image/webp" }); }
  catch { logger.error("sales_team.photo_upload_failed"); throw new SalesTeamError("Foto belum dapat disimpan.", "image"); }
  return key;
}

async function cleanupPhoto(key: string | null) {
  if (!key) return false;
  if (!isSalesPhotoKey(key)) { logger.warn("sales_team.photo_cleanup_rejected_key"); return true; }
  try {
    if (!await db.salesTeamMember.count({ where: { imageStorageKey: key } })) await getStorageProvider().delete(key);
    return false;
  } catch { logger.warn("sales_team.photo_cleanup_failed"); return true; }
}

async function lockOwner(tx: Prisma.TransactionClient) {
  await tx.dealerSettings.upsert({ where: { id: ownerId, AND: [{ dealerId: null }] }, create: { id: ownerId }, update: {} });
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "DealerSettings" WHERE "id" = ${ownerId} AND "dealerId" IS NULL FOR UPDATE`;
  if (!rows.length) throw new SalesTeamError("Pengaturan dealer tidak tersedia.");
}

export async function saveSalesTeamMember(input: unknown, file?: unknown, removeImage = false) {
  await requireAdmin();
  const parsed = salesTeamSchema.parse(input);
  let uploaded: string | null = null;
  try {
    uploaded = await uploadPhoto(file);
    const result = await db.$transaction(async tx => {
      await lockOwner(tx);
      const existing = parsed.id ? await tx.salesTeamMember.findFirst({ where: { ...owner, id: parsed.id } }) : null;
      if (parsed.id && !existing) throw new SalesTeamError("Anggota tim tidak ditemukan.");
      if (!parsed.id && await tx.salesTeamMember.count({ where: owner }) >= 100) throw new SalesTeamError("Maksimal 100 anggota tim sales.");
      const imageStorageKey = uploaded ?? (removeImage ? null : existing?.imageStorageKey ?? null);
      const data = { fullName: parsed.fullName, title: parsed.title, whatsappNumber: normalizeWhatsappNumber(parsed.whatsappNumber), biography: parsed.biography, active: parsed.active, sortOrder: parsed.sortOrder, imageStorageKey };
      if (existing) await tx.salesTeamMember.update({ where: { dealerSettingsId: ownerId, id: existing.id }, data });
      else await tx.salesTeamMember.create({ data: { ...data, dealerSettingsId: ownerId } });
      return { oldKey: existing?.imageStorageKey !== imageStorageKey ? existing?.imageStorageKey ?? null : null };
    });
    return { cleanupFailed: await cleanupPhoto(result.oldKey) };
  } catch (error) { await cleanupPhoto(uploaded); throw error; }
}

export async function deleteSalesTeamMember(id: string) {
  await requireAdmin();
  if (!/^c[a-z0-9]{20,}$/i.test(id)) throw new SalesTeamError("Anggota tim tidak ditemukan.");
  const existing = await db.salesTeamMember.findFirst({ where: { ...owner, id } });
  if (!existing) throw new SalesTeamError("Anggota tim tidak ditemukan.");
  await db.salesTeamMember.delete({ where: { dealerSettingsId: ownerId, id: existing.id } });
  return { cleanupFailed: await cleanupPhoto(existing.imageStorageKey) };
}

export async function getAdminSalesTeam() {
  await requireAdmin();
  const rows = await db.salesTeamMember.findMany({ where: owner, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 100 });
  return rows.map(row => ({ ...row, imageUrl: salesPhotoUrl(row.imageStorageKey) }));
}

export const getPublicSalesTeam = cache(async () => {
  try {
    const rows = await db.salesTeamMember.findMany({ where: { ...owner, active: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 24 });
    return rows.map(row => ({ id: row.id, fullName: row.fullName, title: row.title, biography: row.biography, imageUrl: salesPhotoUrl(row.imageStorageKey), whatsappUrl: createWhatsappUrl(row.whatsappNumber) }));
  } catch { logger.error("public.sales_team_read_failed"); return []; }
});
