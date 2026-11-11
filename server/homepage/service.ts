import "server-only";

import { cache } from "react";
import { db } from "@/db/client";
import { HOMEPAGE_CAR_LIMIT, dealerFallback, mergeDealerPresentation, selectFeaturedHomepageCars } from "@/features/homepage/domain";
import { legacyDealerLogoUrl } from "@/server/settings/logo-url";
import { logger } from "@/server/log";
import { getLegacyPublicDealerScope } from "@/server/dealer/scope";
import type { InventoryContext } from "@/server/inventory/context";
import { legacyStorefrontInventory } from "@/server/storefront/inventory";
import { legacyVehicleImageUrl } from "@/server/storefront/media";
import { brandLogoUrl } from "@/server/master-data/brand-media";

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
  logoUrl: string | null;
  availableCars: number;
  models: Array<{ name: string; slug: string }>;
};

const publicCarSelect = (scope: ReturnType<typeof legacyStorefrontInventory>) => ({
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
    where: scope.image,
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    take: 1,
    select: { storageKey: true },
  },
});

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
    imageUrl: legacyVehicleImageUrl(car.id, car.images[0]?.storageKey),
  };
}

export const getDealerPresentation = cache(async () => {
  try {
    const { dealerId } = getLegacyPublicDealerScope();
    const settings = await db.dealerSettings.findUnique({ where: { id: dealerId, AND: [{ dealerId: null }] } });
    if (!settings) return dealerFallback;
    return mergeDealerPresentation(settings, legacyDealerLogoUrl(settings.logoStorageKey));
  } catch {
    logger.error("public.dealer_settings_read_failed");
    return dealerFallback;
  }
});

async function getFeaturedCars(scope: ReturnType<typeof legacyStorefrontInventory>) {
  const cars = await db.car.findMany({
    where: { ...scope.car, featured: true },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: HOMEPAGE_CAR_LIMIT * 3,
    select: publicCarSelect(scope),
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

async function getLatestCars(scope: ReturnType<typeof legacyStorefrontInventory>, excludedIds: string[]) {
  const cars = await db.car.findMany({
    where: { ...scope.car, ...(excludedIds.length ? { id: { notIn: excludedIds } } : {}) },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: HOMEPAGE_CAR_LIMIT,
    select: publicCarSelect(scope),
  });
  return cars.map(toHomepageCar);
}

async function getBrands(scope: ReturnType<typeof legacyStorefrontInventory>) {
  const brands = await db.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
    where: { ...scope.brand, active: true },
    select: {
      name: true,
      slug: true,
      logoStorageKey: true,
      models: { where: scope.model, take: 100, orderBy: { name: "asc" }, select: { name: true, slug: true } },
      _count: { select: { cars: { where: scope.car } } },
    },
  });
  return brands.map((brand) => ({
    name: brand.name,
    slug: brand.slug,
    logoUrl: brandLogoUrl(brand.logoStorageKey),
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

export async function getHomepageData(context: InventoryContext) {
  const scope = legacyStorefrontInventory(context);
  const [featuredCars, brands, dealer] = await Promise.all([
    safely(() => getFeaturedCars(scope), [] as HomepageCar[]),
    safely(() => getBrands(scope), [] as HomepageBrand[]),
    getDealerPresentation(),
  ]);
  const latestCars = await safely(
    () => getLatestCars(scope, featuredCars.map((car) => car.id)),
    [] as HomepageCar[],
  );
  return { featuredCars, latestCars, brands, dealer };
}
