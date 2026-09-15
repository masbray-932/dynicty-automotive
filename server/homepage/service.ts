import "server-only";

import { cache } from "react";
import { db } from "@/db/client";
import { HOMEPAGE_CAR_LIMIT, dealerFallback, mergeDealerPresentation, selectFeaturedHomepageCars } from "@/features/homepage/domain";
import { getStorageProvider } from "@/services/storage";
import { logger } from "@/server/log";

export type HomepageCar = {
  id: string;
  slug: string;
  condition: "NEW" | "USED";
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: string;
  transmission: string;
  mileage: number | null;
  imageUrl: string | null;
};

export type HomepageBrand = {
  name: string;
  slug: string;
  availableCars: number;
  models: Array<{ name: string; slug: string }>;
};

const publicCarSelect = {
  id: true,
  slug: true,
  condition: true,
  variant: true,
  year: true,
  price: true,
  transmission: true,
  mileage: true,
  status: true,
  featured: true,
  updatedAt: true,
  brand: { select: { name: true } },
  model: { select: { name: true } },
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    take: 1,
    select: { storageKey: true },
  },
};

function toHomepageCar(car: {
  id: string;
  slug: string;
  condition: "NEW" | "USED";
  variant: string;
  year: number;
  price: { toString(): string };
  transmission: string;
  mileage: number | null;
  brand: { name: string };
  model: { name: string };
  images: Array<{ storageKey: string }>;
}): HomepageCar {
  let imageUrl: string | null = null;
  if (car.images[0]) {
    try {
      imageUrl = getStorageProvider().publicUrl(car.images[0].storageKey);
    } catch {
      imageUrl = null;
    }
  }
  return {
    id: car.id,
    slug: car.slug,
    condition: car.condition,
    brand: car.brand.name,
    model: car.model.name,
    variant: car.variant,
    year: car.year,
    price: car.price.toString(),
    transmission: car.transmission,
    mileage: car.mileage,
    imageUrl,
  };
}

export const getDealerPresentation = cache(async () => {
  try {
    const settings = await db.dealerSettings.findUnique({ where: { id: "default" } });
    if (!settings) return dealerFallback;
    let logoUrl: string | null = null;
    if (settings.logoStorageKey) {
      try {
        logoUrl = getStorageProvider().publicUrl(settings.logoStorageKey);
      } catch {
        logoUrl = null;
      }
    }
    return mergeDealerPresentation(settings, logoUrl);
  } catch {
    logger.error("public.dealer_settings_read_failed");
    return dealerFallback;
  }
});

async function getFeaturedCars() {
  const cars = await db.car.findMany({
    where: { status: "AVAILABLE", featured: true },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: HOMEPAGE_CAR_LIMIT * 3,
    select: publicCarSelect,
  });
  return selectFeaturedHomepageCars(cars.map((car) => ({
    car,
    id: car.id,
    status: car.status,
    featured: car.featured,
    updatedAt: car.updatedAt,
    hasImage: car.images.length > 0,
  }))).map((candidate) => toHomepageCar(candidate.car));
}

async function getLatestCars(excludedIds: string[]) {
  const cars = await db.car.findMany({
    where: { status: "AVAILABLE", ...(excludedIds.length ? { id: { notIn: excludedIds } } : {}) },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: HOMEPAGE_CAR_LIMIT,
    select: publicCarSelect,
  });
  return cars.map(toHomepageCar);
}

async function getBrands() {
  const brands = await db.brand.findMany({
    orderBy: { name: "asc" },
    take: 12,
    select: {
      name: true,
      slug: true,
      models: { orderBy: { name: "asc" }, select: { name: true, slug: true } },
      _count: { select: { cars: { where: { status: "AVAILABLE" } } } },
    },
  });
  return brands.map((brand) => ({
    name: brand.name,
    slug: brand.slug,
    models: brand.models,
    availableCars: brand._count.cars,
  }));
}

async function safely<T>(operation: () => Promise<T>, fallback: T) {
  try {
    return await operation();
  } catch {
    logger.error("public.homepage_query_failed");
    return fallback;
  }
}

export async function getHomepageData() {
  const [featuredCars, brands, dealer] = await Promise.all([
    safely(getFeaturedCars, [] as HomepageCar[]),
    safely(getBrands, [] as HomepageBrand[]),
    getDealerPresentation(),
  ]);
  const latestCars = await safely(
    () => getLatestCars(featuredCars.map((car) => car.id)),
    [] as HomepageCar[],
  );
  return { featuredCars, latestCars, brands, dealer };
}
