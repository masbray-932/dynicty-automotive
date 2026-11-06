import "server-only";

import { db } from "@/db/client";
import {
  CATALOG_PAGE_SIZE,
  catalogOrderBy,
  paginationState,
  validateCatalogCombination,
  type ParsedCatalogFilters,
} from "@/features/catalog/domain";
import { buildCatalogWhere } from "@/features/catalog/query";
import type { HomepageCar } from "@/server/homepage/service";
import type { InventoryContext } from "@/server/inventory/context";
import { legacyStorefrontInventory } from "@/server/storefront/inventory";
import { legacyVehicleImageUrl } from "@/server/storefront/media";

export type CatalogBrandOption = {
  name: string;
  slug: string;
  models: Array<{ name: string; slug: string }>;
};

export type CatalogData = {
  cars: HomepageCar[];
  total: number;
  totalPages: number;
  outOfRange: boolean;
  brands: CatalogBrandOption[];
  transmissions: string[];
  invalidCombination: string | null;
  databaseUnavailable: boolean;
};

async function getOptions(scope: ReturnType<typeof legacyStorefrontInventory>) {
  const [brands, transmissionRows] = await Promise.all([
    db.brand.findMany({
      where: scope.brand,
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        models: {
          where: scope.model,
          orderBy: { name: "asc" },
          select: { name: true, slug: true },
        },
      },
    }),
    db.car.findMany({
      where: scope.car,
      distinct: ["transmission"],
      orderBy: { transmission: "asc" },
      select: { transmission: true },
    }),
  ]);
  return { brands, transmissions: transmissionRows.map((row) => row.transmission) };
}

export async function getCatalogData(context: InventoryContext, parsed: ParsedCatalogFilters): Promise<CatalogData> {
  const scope = legacyStorefrontInventory(context);
  try {
    const options = await getOptions(scope);
    const invalidCombination = validateCatalogCombination(parsed.filters, options.brands, options.transmissions);
    if (invalidCombination) return { cars: [], total: 0, totalPages: 0, outOfRange: false, ...options, invalidCombination, databaseUnavailable: false };

    const where = { AND: [scope.car, buildCatalogWhere(parsed.filters)] };
    const total = await db.car.count({ where });
    const pagination = paginationState(total, parsed.filters.page);
    if (pagination.outOfRange) return { cars: [], total, totalPages: pagination.totalPages, outOfRange: true, ...options, invalidCombination: null, databaseUnavailable: false };

    const rows = await db.car.findMany({
      where,
      orderBy: catalogOrderBy(parsed.filters.sort),
      skip: pagination.skip,
      take: CATALOG_PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        condition: true,
        variant: true,
        year: true,
        price: true,
        transmission: true,
        mileage: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
        images: {
          where: scope.image,
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { storageKey: true },
        },
      },
    });
    const cars = rows.map((car) => ({
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
    }));
    return { cars, total, totalPages: pagination.totalPages, outOfRange: false, ...options, invalidCombination: null, databaseUnavailable: false };
  } catch {
    return { cars: [], total: 0, totalPages: 0, outOfRange: false, brands: [], transmissions: [], invalidCombination: null, databaseUnavailable: true };
  }
}
