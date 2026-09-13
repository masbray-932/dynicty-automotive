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
import { getStorageProvider } from "@/services/storage";

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

async function getOptions() {
  const [brands, transmissionRows] = await Promise.all([
    db.brand.findMany({
      where: { cars: { some: { status: "AVAILABLE" } } },
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
        models: {
          where: { cars: { some: { status: "AVAILABLE" } } },
          orderBy: { name: "asc" },
          select: { name: true, slug: true },
        },
      },
    }),
    db.car.findMany({
      where: { status: "AVAILABLE" },
      distinct: ["transmission"],
      orderBy: { transmission: "asc" },
      select: { transmission: true },
    }),
  ]);
  return { brands, transmissions: transmissionRows.map((row) => row.transmission) };
}

function imageUrl(storageKey: string | undefined) {
  if (!storageKey) return null;
  try {
    return getStorageProvider().publicUrl(storageKey);
  } catch {
    return null;
  }
}

export async function getCatalogData(parsed: ParsedCatalogFilters): Promise<CatalogData> {
  try {
    const options = await getOptions();
    const invalidCombination = validateCatalogCombination(parsed.filters, options.brands, options.transmissions);
    if (invalidCombination) return { cars: [], total: 0, totalPages: 0, outOfRange: false, ...options, invalidCombination, databaseUnavailable: false };

    const where = buildCatalogWhere(parsed.filters);
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
      imageUrl: imageUrl(car.images[0]?.storageKey),
    }));
    return { cars, total, totalPages: pagination.totalPages, outOfRange: false, ...options, invalidCombination: null, databaseUnavailable: false };
  } catch {
    return { cars: [], total: 0, totalPages: 0, outOfRange: false, brands: [], transmissions: [], invalidCombination: null, databaseUnavailable: true };
  }
}
