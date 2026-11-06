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
  return db.$transaction(async (tx) => tx.car.create({
    data: { ...await carData(tx, values), ...standaloneOwner }, select: { id: true, slug: true },
  }), serializable);
}

export async function updateCar(id: string, values: CarFormValues) {
  await requireAdmin();
  return db.$transaction(async (tx) => tx.car.update({
    where: carScope(id), data: await carData(tx, values, id), select: { id: true, slug: true },
  }), serializable);
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
    const car = await tx.car.findUnique({ where, select: { images: { where: standaloneOwner, select: { storageKey: true } } } });
    if (!car) return null;
    await tx.car.delete({ where });
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
