import "server-only";

import { cache } from "react";
import { db } from "@/db/client";
import { clampHomepageInventoryPage, dealerFallback, HOMEPAGE_CAR_PAGE_SIZE, inventoryCondition, mergeDealerPresentation, type InventoryMode, type StockSummary } from "@/features/homepage/domain";
import { legacyDealerFaviconUrl, legacyDealerLogoUrl } from "@/server/settings/logo-url";
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
    return mergeDealerPresentation(settings, legacyDealerLogoUrl(settings.logoStorageKey), legacyDealerFaviconUrl(settings.faviconStorageKey));
  } catch {
    logger.error("public.dealer_settings_read_failed");
    return dealerFallback;
  }
});

const publicInventoryWhere = (scope: ReturnType<typeof legacyStorefrontInventory>, mode: InventoryMode) => ({
  ...scope.car,
  ...(inventoryCondition(mode) ? { condition: inventoryCondition(mode) } : {}),
});

async function getHomepageInventory(scope: ReturnType<typeof legacyStorefrontInventory>, mode: InventoryMode, requestedPage: number) {
  const where = publicInventoryWhere(scope, mode);
  const [availableCount, latest, settings] = await Promise.all([
    db.car.count({ where }),
    db.car.findFirst({ where, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], select: { updatedAt: true } }),
    db.dealerSettings.findUnique({ where: { id: scope.car.dealerId === null ? "default" : String(scope.car.dealerId), AND: [{ dealerId: scope.car.dealerId }] }, select: { inventoryUpdatedAt: true } }),
  ]);
  const { page, totalPages } = clampHomepageInventoryPage(requestedPage, availableCount);
  const cars = await db.car.findMany({
    where,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * HOMEPAGE_CAR_PAGE_SIZE,
    take: HOMEPAGE_CAR_PAGE_SIZE,
    select: publicCarSelect(scope),
  });
  const stockSummary: StockSummary = { availableCount, lastUpdatedAt: settings?.inventoryUpdatedAt ?? latest?.updatedAt ?? null };
  return { cars: cars.map(toHomepageCar), page, totalPages, stockSummary };
}

async function getBrands(scope: ReturnType<typeof legacyStorefrontInventory>, mode: InventoryMode) {
  const carWhere = publicInventoryWhere(scope, mode);
  const brands = await db.brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
    where: { ...scope.brand, active: true },
    select: {
      name: true,
      slug: true,
      logoStorageKey: true,
      models: { where: { ...scope.model, cars: { some: carWhere } }, take: 100, orderBy: { name: "asc" }, select: { name: true, slug: true } },
      _count: { select: { cars: { where: carWhere } } },
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

export async function getHomepageData(context: InventoryContext, requestedPage = 1) {
  const scope = legacyStorefrontInventory(context);
  const dealer = await getDealerPresentation();
  const mode = dealer.inventoryMode ?? "BOTH";
  const [inventory, brands] = await Promise.all([
    safely(() => getHomepageInventory(scope, mode, requestedPage), { cars: [] as HomepageCar[], page: 1, totalPages: 1, stockSummary: { availableCount: 0, lastUpdatedAt: null } as StockSummary }),
    safely(() => getBrands(scope, mode), [] as HomepageBrand[]),
  ]);
  return { cars: inventory.cars, inventoryPage: inventory.page, inventoryTotalPages: inventory.totalPages, brands, dealer, stockSummary: inventory.stockSummary };
}
