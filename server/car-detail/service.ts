import "server-only";

import { cache } from "react";
import { db } from "@/db/client";
import { buildVehicleTitle, isValidCarSlug, orderDetailImages } from "@/features/car-detail/domain";
import type { HomepageCar } from "@/server/homepage/service";
import { getDealerPresentation } from "@/server/homepage/service";
import { getStorageProvider } from "@/services/storage";

export type PublicCarDetail = {
  slug: string;
  title: string;
  condition: "NEW" | "USED";
  brand: { name: string; slug: string };
  model: { name: string; slug: string };
  variant: string;
  year: number;
  price: string;
  transmission: string;
  fuelType: string;
  color: string;
  mileage: number | null;
  description: string;
  updatedAt: Date;
  images: Array<{ id: string; url: string; alt: string; isPrimary: boolean }>;
};

const relatedSelect = {
  id: true, slug: true, condition: true, variant: true, year: true, price: true, transmission: true, mileage: true,
  brand: { select: { name: true } }, model: { select: { name: true } },
  images: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }], take: 1, select: { storageKey: true } },
};

function resolveUrl(key: string) {
  try { return getStorageProvider().publicUrl(key); } catch { return "/images/car-placeholder.svg"; }
}

function toCard(car: {
  id: string; slug: string; condition: "NEW" | "USED"; variant: string; year: number; price: { toString(): string };
  transmission: string; mileage: number | null; brand: { name: string }; model: { name: string }; images: Array<{ storageKey: string }>;
}): HomepageCar {
  return { id: car.id, slug: car.slug, condition: car.condition, brand: car.brand.name, model: car.model.name, variant: car.variant, year: car.year, price: car.price.toString(), transmission: car.transmission, mileage: car.mileage, imageUrl: car.images[0] ? resolveUrl(car.images[0].storageKey) : null };
}

async function relatedCars(current: { id: string; brandId: string; modelId: string }) {
  const base = { status: "AVAILABLE" as const, id: { not: current.id } };
  const [sameModel, sameBrand, others] = await Promise.all([
    db.car.findMany({ where: { ...base, modelId: current.modelId }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 3, select: relatedSelect }),
    db.car.findMany({ where: { ...base, brandId: current.brandId, modelId: { not: current.modelId } }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 3, select: relatedSelect }),
    db.car.findMany({ where: { ...base, brandId: { not: current.brandId } }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 3, select: relatedSelect }),
  ]);
  return [...sameModel, ...sameBrand, ...others].slice(0, 3).map(toCard);
}

export const getCarDetailPageData = cache(async (slug: string) => {
  if (!isValidCarSlug(slug)) return { kind: "not-found" as const };
  try {
    const car = await db.car.findFirst({
      where: { slug, status: "AVAILABLE" },
      select: {
        id: true, slug: true, condition: true, brandId: true, modelId: true, variant: true, year: true, price: true,
        transmission: true, fuelType: true, color: true, mileage: true, description: true, updatedAt: true,
        brand: { select: { name: true, slug: true } }, model: { select: { name: true, slug: true } },
        images: { select: { id: true, storageKey: true, sortOrder: true, isPrimary: true, createdAt: true } },
      },
    });
    if (!car) return { kind: "not-found" as const };
    const title = buildVehicleTitle({ brand: car.brand.name, model: car.model.name, variant: car.variant, year: car.year });
    const ordered = orderDetailImages(car.images.map((image) => ({ ...image, url: resolveUrl(image.storageKey) })));
    const [dealer, related] = await Promise.all([getDealerPresentation(), relatedCars(car)]);
    const detail: PublicCarDetail = {
      slug: car.slug, title, condition: car.condition, brand: car.brand, model: car.model, variant: car.variant, year: car.year,
      price: car.price.toString(), transmission: car.transmission, fuelType: car.fuelType, color: car.color, mileage: car.mileage,
      description: car.description, updatedAt: car.updatedAt,
      images: ordered.map((image, index) => ({ id: image.id, url: image.url, isPrimary: image.isPrimary, alt: `Foto ${title}${index ? ` ${index + 1}` : ""}` })),
    };
    return { kind: "success" as const, car: detail, dealer, related };
  } catch {
    return { kind: "error" as const };
  }
});

export async function getAvailableCarSitemapEntries() {
  try {
    return await db.car.findMany({ where: { status: "AVAILABLE" }, orderBy: { updatedAt: "desc" }, select: { slug: true, updatedAt: true } });
  } catch {
    return [];
  }
}
