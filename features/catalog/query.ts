import { Prisma } from "@prisma/client";
import type { CatalogFilters } from "./domain";

export function buildCatalogWhere(filters: CatalogFilters): Prisma.CarWhereInput {
  const keywordYear = filters.q && /^\d{4}$/.test(filters.q) ? Number(filters.q) : null;
  return {
    status: "AVAILABLE",
    ...(filters.condition ? { condition: filters.condition } : {}),
    ...(filters.brand ? { brand: { slug: filters.brand } } : {}),
    ...(filters.model ? { model: { slug: filters.model } } : {}),
    ...(filters.minPrice || filters.maxPrice ? { price: { ...(filters.minPrice ? { gte: new Prisma.Decimal(filters.minPrice) } : {}), ...(filters.maxPrice ? { lte: new Prisma.Decimal(filters.maxPrice) } : {}) } } : {}),
    ...(filters.minYear || filters.maxYear ? { year: { ...(filters.minYear ? { gte: filters.minYear } : {}), ...(filters.maxYear ? { lte: filters.maxYear } : {}) } } : {}),
    ...(filters.transmission ? { transmission: { equals: filters.transmission, mode: "insensitive" } } : {}),
    ...(filters.q ? { OR: [
      { brand: { name: { contains: filters.q, mode: "insensitive" } } },
      { model: { name: { contains: filters.q, mode: "insensitive" } } },
      { variant: { contains: filters.q, mode: "insensitive" } },
      ...(keywordYear ? [{ year: keywordYear }] : []),
    ] } : {}),
  };
}
