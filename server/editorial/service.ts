import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { logger } from "@/server/log";
import { getStorageProvider } from "@/services/storage";
import { createEditorialMediaKey, isEditorialMediaKey } from "@/services/storage/key";
import { validateImageUpload } from "@/validation/upload";
import { articleSchema, categorySchema, serviceSchema, type EditorialKind } from "@/validation/editorial";

const ownerId = LEGACY_DEALER_SCOPE.dealerId;
const owner = { dealerSettingsId: ownerId, dealerSettings: { dealerId: null } } as const;
export class EditorialError extends Error { constructor(message: string, readonly field?: string) { super(message); } }
const checkedId = (value: string) => { if (!value || value.length > 40) throw new EditorialError("Konten tidak ditemukan."); return value; };

async function lockOwner(tx: Prisma.TransactionClient) {
  await tx.dealerSettings.upsert({ where: { id: ownerId, AND: [{ dealerId: null }] }, create: { id: ownerId }, update: {} });
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "DealerSettings" WHERE "id" = ${ownerId} AND "dealerId" IS NULL FOR UPDATE`;
  if (!rows.length) throw new EditorialError("Pengaturan dealer tidak tersedia.");
}

async function cleanup(key: string | null) {
  if (!key) return false;
  if (!isEditorialMediaKey(key)) { logger.warn("editorial.media_key_rejected"); return true; }
  try {
    // Public objects may have historical shared references. Never delete one
    // while any record still refers to it, including outside this module.
    const counts = await Promise.all([
      db.showroomService.count({ where: { imageStorageKey: key } }), db.article.count({ where: { imageStorageKey: key } }),
      db.dealerContentItem.count({ where: { mediaKey: key } }), db.dealerContent.count({ where: { showroomKey: key } }),
      db.dealerSettings.count({ where: { logoStorageKey: key } }), db.carImage.count({ where: { storageKey: key } }),
    ]);
    if (!counts.some(Boolean)) await getStorageProvider().delete(key);
    return false;
  } catch { logger.warn("editorial.media_cleanup_failed"); return true; }
}

async function upload(kind: "service" | "article", file: unknown) {
  if (file == null || (file instanceof File && !file.size)) return null;
  if (!(file instanceof File)) throw new EditorialError("Unggah file gambar yang valid.", "image");
  const parsed = await validateImageUpload(file);
  if (!parsed.success) throw new EditorialError(parsed.error.issues[0]?.message ?? "Gambar tidak valid.", "image");
  const key = createEditorialMediaKey(kind, file.type);
  try { await getStorageProvider().put({ key, body: new Uint8Array(await file.arrayBuffer()), contentType: file.type }); }
  catch { await cleanup(key); logger.error("editorial.upload_failed"); throw new EditorialError("Gambar belum dapat disimpan.", "image"); }
  return key;
}

export async function saveEditorial(kind: EditorialKind, input: unknown, file?: unknown, removeImage = false) {
  await requireAdmin();
  if (!["category", "service", "article"].includes(kind)) throw new EditorialError("Jenis konten tidak valid.");
  // Parse at the direct service boundary as well as the Server Action.
  const parsed = kind === "category" ? categorySchema.parse(input) : kind === "service" ? serviceSchema.parse(input) : articleSchema.parse(input);
  let uploaded: string | null = null;
  let result: { oldSlug: string | null; slug: string; oldKey: string | null };
  try {
    if (kind !== "category") uploaded = await upload(kind, file);
    result = await db.$transaction(async tx => {
      await lockOwner(tx);
      if (kind === "category") {
        const data = categorySchema.parse(parsed); const { id, ...values } = data;
        const existing = id ? await tx.serviceCategory.findFirst({ where: { ...owner, id } }) : null;
        if (id && !existing) throw new EditorialError("Kategori tidak ditemukan.");
        if (!id && await tx.serviceCategory.count({ where: owner }) >= 100) throw new EditorialError("Maksimal 100 kategori layanan.");
        if (existing) await tx.serviceCategory.update({ where: { ...owner, id: existing.id }, data: values });
        else await tx.serviceCategory.create({ data: { ...values, dealerSettingsId: ownerId } });
        return { oldSlug: existing?.slug ?? null, slug: values.slug, oldKey: null };
      }
      if (kind === "service") {
        const { id, ...values } = serviceSchema.parse(parsed);
        const existing = id ? await tx.showroomService.findFirst({ where: { ...owner, id } }) : null;
        if (id && !existing) throw new EditorialError("Layanan tidak ditemukan.");
        const category = await tx.serviceCategory.findFirst({ where: { ...owner, id: values.categoryId } });
        if (!category) throw new EditorialError("Pilih kategori milik showroom ini.", "categoryId");
        if (values.status === "PUBLISHED" && !category.active) throw new EditorialError("Aktifkan kategori sebelum publikasi layanan.", "categoryId");
        const imageStorageKey = uploaded ?? (removeImage ? null : existing?.imageStorageKey ?? null);
        if (imageStorageKey && !values.imageAlt) throw new EditorialError("Deskripsi gambar wajib diisi.", "imageAlt");
        if (existing) await tx.showroomService.update({ where: { ...owner, id: existing.id }, data: { ...values, imageStorageKey } });
        else await tx.showroomService.create({ data: { ...values, imageStorageKey, dealerSettingsId: ownerId } });
        return { oldSlug: existing?.slug ?? null, slug: values.slug, oldKey: existing?.imageStorageKey !== imageStorageKey ? existing?.imageStorageKey ?? null : null };
      }
      const { id, ...values } = articleSchema.parse(parsed);
      const existing = id ? await tx.article.findFirst({ where: { ...owner, id } }) : null;
      if (id && !existing) throw new EditorialError("Artikel tidak ditemukan.");
      const imageStorageKey = uploaded ?? (removeImage ? null : existing?.imageStorageKey ?? null);
      if (imageStorageKey && !values.imageAlt) throw new EditorialError("Deskripsi cover wajib diisi.", "imageAlt");
      // Timestamp is server-owned; unpublish clears it, republish uses now.
      const publishedAt = values.status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;
      const data = { ...values, imageStorageKey, publishedAt };
      if (existing) await tx.article.update({ where: { ...owner, id: existing.id }, data });
      else await tx.article.create({ data: { ...data, dealerSettingsId: ownerId } });
      return { oldSlug: existing?.slug ?? null, slug: values.slug, oldKey: existing?.imageStorageKey !== imageStorageKey ? existing?.imageStorageKey ?? null : null };
    });
  } catch (error) { await cleanup(uploaded); throw error; }
  return { ...result, cleanupFailed: await cleanup(result.oldKey) };
}

export async function deleteEditorial(kind: EditorialKind, id: string) {
  await requireAdmin();
  if (!["category", "service", "article"].includes(kind)) throw new EditorialError("Jenis konten tidak valid.");
  checkedId(id);
  const result = await db.$transaction(async tx => {
    await lockOwner(tx);
    if (kind === "category") {
      const existing = await tx.serviceCategory.findFirst({ where: { ...owner, id } });
      if (!existing) throw new EditorialError("Kategori tidak ditemukan.");
      if (await tx.showroomService.count({ where: { dealerSettingsId: ownerId, categoryId: id } })) throw new EditorialError("Pindahkan atau hapus layanan di kategori ini terlebih dahulu.");
      await tx.serviceCategory.delete({ where: { ...owner, id } });
      return { slug: existing.slug, oldKey: null };
    }
    if (kind === "service") {
      const existing = await tx.showroomService.findFirst({ where: { ...owner, id } });
      if (!existing) throw new EditorialError("Layanan tidak ditemukan.");
      await tx.showroomService.delete({ where: { ...owner, id } });
      return { slug: existing.slug, oldKey: existing.imageStorageKey };
    }
    const existing = await tx.article.findFirst({ where: { ...owner, id } });
    if (!existing) throw new EditorialError("Artikel tidak ditemukan.");
    await tx.article.delete({ where: { ...owner, id } });
    return { slug: existing.slug, oldKey: existing.imageStorageKey };
  });
  return { ...result, cleanupFailed: await cleanup(result.oldKey) };
}

export function editorialImageUrl(key: string | null) {
  return key && isEditorialMediaKey(key) ? getStorageProvider().publicUrl(key) : null;
}

export async function getAdminEditorial(page = 1) {
  await requireAdmin();
  const skip = (Math.min(1000, Math.max(1, Math.floor(page) || 1)) - 1) * 20;
  const [categories, services, articles, serviceCount, articleCount] = await Promise.all([
    db.serviceCategory.findMany({ where: owner, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 100 }),
    db.showroomService.findMany({ where: owner, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip, take: 20 }),
    db.article.findMany({ where: owner, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], skip, take: 20 }),
    db.showroomService.count({ where: owner }), db.article.count({ where: owner }),
  ]);
  return { categories, services, articles, serviceCount, articleCount };
}

// Future S5.2C readers. No public routes or dealer selection are introduced here.
export async function getPublishedServices(page = 1, categorySlug?: string, homepageOnly = false) {
  const parsedPage = Math.min(1000, Math.max(1, Math.floor(page) || 1));
  return db.showroomService.findMany({
    where: { ...owner, status: "PUBLISHED", ...(homepageOnly ? { homepageVisible: true } : {}), category: { ...owner, active: true, ...(categorySlug ? { slug: categorySlug } : {}) } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip: (parsedPage - 1) * 12, take: 12,
  });
}
export async function getPublishedArticles(page = 1) {
  return db.article.findMany({ where: { ...owner, status: "PUBLISHED", publishedAt: { lte: new Date() } }, orderBy: [{ publishedAt: "desc" }, { id: "asc" }], skip: (Math.min(1000, Math.max(1, Math.floor(page) || 1)) - 1) * 12, take: 12 });
}
export async function getPublishedEditorialBySlug(kind: "service" | "article", slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  return kind === "service"
    ? db.showroomService.findFirst({ where: { ...owner, slug, status: "PUBLISHED", category: { ...owner, active: true } } })
    : db.article.findFirst({ where: { ...owner, slug, status: "PUBLISHED", publishedAt: { lte: new Date() } } });
}
