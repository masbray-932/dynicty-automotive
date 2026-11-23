import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { fallbackPrimaryImageId, reorderImageIds, uniqueSlug } from "@/features/cars/domain";
import { getStorageProvider } from "@/services/storage";
import { createCarImageKey, isCarImageKeyForCar } from "@/services/storage/key";
import type { CarFormValues } from "@/validation/car";
import { parseMileage, parsePrice } from "@/validation/car";
import { requireAdmin } from "@/server/auth/session";
import { standaloneCar, standaloneCarImage, standaloneModel, standaloneOwner } from "@/server/standalone/inventory";

export class InvalidModelRelationError extends Error {}
const serializable = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };
const carScope = (id: string) => ({ ...standaloneCar, id });
const imageScope = (carId: string) => ({ ...standaloneCarImage, carId });
const dealerSettingsId = "default";

function isPublicInventoryMember(car: { status: string; condition: string }, mode: "BOTH" | "USED_ONLY" | "NEW_ONLY") {
  return car.status === "AVAILABLE" && (mode === "BOTH" || (mode === "USED_ONLY" ? car.condition === "USED" : car.condition === "NEW"));
}

async function inventoryMode(tx: Prisma.TransactionClient) {
  return (await tx.dealerSettings.findUnique({ where: { id: dealerSettingsId, AND: [{ dealerId: null }] }, select: { inventoryMode: true } }))?.inventoryMode ?? "BOTH";
}

async function markInventoryChanged(tx: Prisma.TransactionClient) {
  await tx.dealerSettings.upsert({
    where: { id: dealerSettingsId, AND: [{ dealerId: null }] },
    create: { id: dealerSettingsId, inventoryUpdatedAt: new Date() },
    update: { inventoryUpdatedAt: new Date() },
  });
}

async function findModel(tx: Prisma.TransactionClient, brandId: string, modelId: string) {
  const model = await tx.carModel.findFirst({
    where: { ...standaloneModel, id: modelId, brandId }, select: { name: true, brand: { select: { name: true } } },
  });
  if (!model) throw new InvalidModelRelationError("Model tidak sesuai dengan merek yang dipilih.");
  return model;
}

export async function assertModelBelongsToBrand(brandId: string, modelId: string) {
  await requireAdmin();
  await findModel(db, brandId, modelId);
}

async function carData(tx: Prisma.TransactionClient, values: CarFormValues, excludeId?: string) {
  const model = await findModel(tx, values.brandId, values.modelId);
  const slug = await uniqueSlug(`${model.brand.name}-${model.name}-${values.variant}-${values.year}`, async (candidate) =>
    Boolean(await tx.car.findFirst({ where: { ...standaloneOwner, slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } })),
  );

  return {
    condition: values.condition, brandId: values.brandId, modelId: values.modelId,
    variant: values.variant, year: values.year, price: new Prisma.Decimal(parsePrice(values.price)),
    transmission: values.transmission, fuelType: values.fuelType, color: values.color,
    mileage: parseMileage(values.mileage), description: values.description, status: values.status,
    featured: values.featured, slug,
  };
}

export async function createCar(values: CarFormValues) {
  await requireAdmin();
  return db.$transaction(async (tx) => {
    const data = await carData(tx, values);
    const created = await tx.car.create({ data: { ...data, ...standaloneOwner }, select: { id: true, slug: true } });
    if (isPublicInventoryMember(data, await inventoryMode(tx))) await markInventoryChanged(tx);
    return created;
  }, serializable);
}

export async function updateCar(id: string, values: CarFormValues) {
  await requireAdmin();
  return db.$transaction(async (tx) => {
    const before = await tx.car.findUnique({ where: carScope(id), select: { status: true, condition: true } });
    if (!before) throw new Error("Mobil tidak ditemukan.");
    const data = await carData(tx, values, id);
    const mode = await inventoryMode(tx);
    const updated = await tx.car.update({ where: carScope(id), data, select: { id: true, slug: true } });
    if (isPublicInventoryMember(before, mode) !== isPublicInventoryMember(data, mode)) await markInventoryChanged(tx);
    return updated;
  }, serializable);
}

async function deleteScopedImageObject(carId: string, key: string) {
  if (!isCarImageKeyForCar(key, carId)) throw new Error("Invalid vehicle image namespace.");
  await getStorageProvider().delete(key);
}

export async function deleteCarWithMedia(id: string) {
  await requireAdmin();
  // Do not cascade a foreign-owned row even if imported data is inconsistent.
  const where = { ...carScope(id), images: { every: standaloneOwner } };
  const keys = await db.$transaction(async (tx) => {
    const car = await tx.car.findUnique({ where, select: { status: true, condition: true, images: { where: standaloneOwner, select: { storageKey: true } } } });
    if (!car) return null;
    const wasPublic = isPublicInventoryMember(car, await inventoryMode(tx));
    await tx.car.delete({ where });
    if (wasPublic) await markInventoryChanged(tx);
    return car.images.map((image) => image.storageKey);
  }, serializable);
  if (!keys) return { deleted: false, failedKeys: [] as string[] };
  const results = await Promise.allSettled(keys.map((key) => deleteScopedImageObject(id, key)));
  return { deleted: true, failedKeys: keys.filter((_, index) => results[index].status === "rejected") };
}

export async function uploadCarImage(carId: string, file: File) {
  await requireAdmin();
  if (!await db.car.findUnique({ where: carScope(carId), select: { id: true } })) throw new Error("Mobil tidak ditemukan.");
  const storage = getStorageProvider();
  const key = createCarImageKey(carId, file.name, crypto.randomUUID(), file.type);

  try {
    await storage.put({ key, body: new Uint8Array(await file.arrayBuffer()), contentType: file.type });
    return await db.$transaction(async (tx) => {
      if (!await tx.car.findUnique({ where: carScope(carId), select: { id: true } })) throw new Error("Mobil tidak ditemukan.");
      const aggregate = await tx.carImage.aggregate({ where: imageScope(carId), _max: { sortOrder: true }, _count: true });
      return tx.carImage.create({
        data: { ...standaloneOwner, carId, storageKey: key, sortOrder: (aggregate._max.sortOrder ?? -1) + 1, isPrimary: aggregate._count === 0 },
      });
    }, serializable);
  } catch (error) {
    await storage.delete(key).catch(() => undefined);
    throw error;
  }
}

export async function setPrimaryImage(carId: string, imageId: string) {
  await requireAdmin();
  const where = imageScope(carId);
  await db.$transaction(async (tx) => {
    const image = await tx.carImage.findUnique({ where: { ...where, id: imageId }, select: { id: true } });
    if (!image) throw new Error("Gambar tidak ditemukan.");
    await tx.carImage.updateMany({ where: { ...where, isPrimary: true }, data: { isPrimary: false } });
    await tx.carImage.update({ where: { ...where, id: imageId }, data: { isPrimary: true } });
  }, serializable);
}

export async function arrangeUploadedCarImages(carId: string, uploadedImageIds: string[], primaryImageId?: string) {
  await requireAdmin();
  const uniqueIds = [...new Set(uploadedImageIds)];
  if (uniqueIds.length !== uploadedImageIds.length) throw new Error("Daftar gambar tidak valid.");
  const where = imageScope(carId);
  await db.$transaction(async (tx) => {
    if (!await tx.car.findUnique({ where: carScope(carId), select: { id: true } })) throw new Error("Mobil tidak ditemukan.");
    const images = await tx.carImage.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const available = new Set(images.map(image => image.id));
    if (uniqueIds.some(id => !available.has(id))) throw new Error("Gambar tidak ditemukan.");
    if (primaryImageId && !uniqueIds.includes(primaryImageId)) throw new Error("Gambar utama tidak valid.");
    const uploaded = new Set(uniqueIds);
    const ordered = [...images.map(image => image.id).filter(id => !uploaded.has(id)), ...uniqueIds];
    for (const [sortOrder, id] of ordered.entries()) await tx.carImage.update({ where: { ...where, id }, data: { sortOrder } });
    if (primaryImageId) {
      await tx.carImage.updateMany({ where: { ...where, isPrimary: true }, data: { isPrimary: false } });
      await tx.carImage.update({ where: { ...where, id: primaryImageId }, data: { isPrimary: true } });
    }
  }, serializable);
}

export async function reorderCarImage(carId: string, imageId: string, direction: "up" | "down") {
  await requireAdmin();
  const where = imageScope(carId);
  await db.$transaction(async (tx) => {
    const images = await tx.carImage.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const ordered = reorderImageIds(images.map((image) => image.id), imageId, direction);
    for (const [sortOrder, id] of ordered.entries()) {
      await tx.carImage.update({ where: { ...where, id }, data: { sortOrder } });
    }
  }, serializable);
}

export async function deleteCarImage(carId: string, imageId: string) {
  await requireAdmin();
  const where = imageScope(carId);
  const key = await db.$transaction(async (tx) => {
    const image = await tx.carImage.delete({ where: { ...where, id: imageId }, select: { storageKey: true, isPrimary: true } });
    const remaining = await tx.carImage.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const fallbackId = fallbackPrimaryImageId(remaining.map((item) => item.id), image.isPrimary);
    if (fallbackId) await tx.carImage.update({ where: { ...where, id: fallbackId }, data: { isPrimary: true } });
    for (const [sortOrder, item] of remaining.entries()) {
      await tx.carImage.update({ where: { ...where, id: item.id }, data: { sortOrder } });
    }
    return image.storageKey;
  }, serializable);

  try {
    await deleteScopedImageObject(carId, key);
    return { storageCleanupFailed: false };
  } catch {
    return { storageCleanupFailed: true };
  }
}
