import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { fallbackPrimaryImageId, modelBelongsToBrand, reorderImageIds, uniqueSlug } from "@/features/cars/domain";
import { getStorageProvider } from "@/services/storage";
import { createCarImageKey } from "@/services/storage/key";
import type { CarFormValues } from "@/validation/car";
import { parseMileage, parsePrice } from "@/validation/car";

export class InvalidModelRelationError extends Error {}

export async function assertModelBelongsToBrand(brandId: string, modelId: string) {
  const model = await db.carModel.findUnique({ where: { id: modelId }, select: { brandId: true } });
  if (!modelBelongsToBrand(model, brandId)) throw new InvalidModelRelationError("Model tidak sesuai dengan merek yang dipilih.");
}

async function carData(values: CarFormValues, excludeId?: string) {
  await assertModelBelongsToBrand(values.brandId, values.modelId);
  const [brand, model] = await Promise.all([
    db.brand.findUniqueOrThrow({ where: { id: values.brandId }, select: { name: true } }),
    db.carModel.findUniqueOrThrow({ where: { id: values.modelId }, select: { name: true } }),
  ]);
  const slug = await uniqueSlug(`${brand.name}-${model.name}-${values.variant}-${values.year}`, async (candidate) =>
    Boolean(await db.car.findFirst({ where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } })),
  );

  return {
    condition: values.condition,
    brandId: values.brandId,
    modelId: values.modelId,
    variant: values.variant,
    year: values.year,
    price: new Prisma.Decimal(parsePrice(values.price)),
    transmission: values.transmission,
    fuelType: values.fuelType,
    color: values.color,
    mileage: parseMileage(values.mileage),
    description: values.description,
    status: values.status,
    featured: values.featured,
    slug,
  };
}

export async function createCar(values: CarFormValues) {
  return db.car.create({ data: await carData(values), select: { id: true } });
}

export async function updateCar(id: string, values: CarFormValues) {
  return db.car.update({ where: { id }, data: await carData(values, id), select: { id: true } });
}

export async function deleteCarWithMedia(id: string) {
  const car = await db.car.findUnique({ where: { id }, include: { images: { select: { storageKey: true } } } });
  if (!car) return { deleted: false, failedKeys: [] as string[] };
  await db.car.delete({ where: { id } });

  const storage = getStorageProvider();
  const results = await Promise.allSettled(car.images.map((image) => storage.delete(image.storageKey)));
  const failedKeys = car.images.filter((_, index) => results[index].status === "rejected").map((image) => image.storageKey);
  return { deleted: true, failedKeys };
}

export async function uploadCarImage(carId: string, file: File) {
  const storage = getStorageProvider();
  const key = createCarImageKey(carId, file.name);
  await storage.put({ key, body: new Uint8Array(await file.arrayBuffer()), contentType: file.type });

  try {
    return await db.$transaction(async (transaction) => {
      const [car, aggregate] = await Promise.all([
        transaction.car.findUnique({ where: { id: carId }, select: { id: true } }),
        transaction.carImage.aggregate({ where: { carId }, _max: { sortOrder: true }, _count: true }),
      ]);
      if (!car) throw new Error("Mobil tidak ditemukan.");
      return transaction.carImage.create({
        data: {
          carId,
          storageKey: key,
          sortOrder: (aggregate._max.sortOrder ?? -1) + 1,
          isPrimary: aggregate._count === 0,
        },
      });
    });
  } catch (error) {
    await storage.delete(key).catch(() => undefined);
    throw error;
  }
}

export async function setPrimaryImage(carId: string, imageId: string) {
  await db.$transaction(async (transaction) => {
    const image = await transaction.carImage.findFirst({ where: { id: imageId, carId }, select: { id: true } });
    if (!image) throw new Error("Gambar tidak ditemukan.");
    await transaction.carImage.updateMany({ where: { carId, isPrimary: true }, data: { isPrimary: false } });
    await transaction.carImage.update({ where: { id: imageId }, data: { isPrimary: true } });
  });
}

export async function reorderCarImage(carId: string, imageId: string, direction: "up" | "down") {
  await db.$transaction(async (transaction) => {
    const images = await transaction.carImage.findMany({ where: { carId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const ordered = reorderImageIds(images.map((image) => image.id), imageId, direction);
    for (const [sortOrder, id] of ordered.entries()) {
      await transaction.carImage.update({ where: { id }, data: { sortOrder } });
    }
  });
}

export async function deleteCarImage(carId: string, imageId: string) {
  const result = await db.$transaction(async (transaction) => {
    const image = await transaction.carImage.findFirst({ where: { id: imageId, carId } });
    if (!image) throw new Error("Gambar tidak ditemukan.");
    await transaction.carImage.delete({ where: { id: imageId } });
    const remaining = await transaction.carImage.findMany({ where: { carId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, isPrimary: true } });
    const fallbackId = fallbackPrimaryImageId(remaining.map((item) => item.id), image.isPrimary);
    if (fallbackId) await transaction.carImage.update({ where: { id: fallbackId }, data: { isPrimary: true } });
    for (const [sortOrder, item] of remaining.entries()) {
      await transaction.carImage.update({ where: { id: item.id }, data: { sortOrder } });
    }
    return image.storageKey;
  });

  try {
    await getStorageProvider().delete(result);
    return { storageCleanupFailed: false };
  } catch {
    return { storageCleanupFailed: true };
  }
}
