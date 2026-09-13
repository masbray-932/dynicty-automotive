import { describe, expect, it } from "vitest";
import {
  buildCatalogUrl,
  catalogOrderBy,
  pageNumbers,
  paginationState,
  parseCatalogFilters,
  validateCatalogCombination,
} from "@/features/catalog/domain";
import { buildCatalogWhere } from "@/features/catalog/query";

describe("catalog filter parsing", () => {
  it("parses supported Homepage and Phase 3 filters", () => {
    const { filters, issues } = parseCatalogFilters({ condition: "used", brand: "toyota", model: "avanza", q: " G ", minPrice: "150000000", maxPrice: "300000000", minYear: "2020", maxYear: "2024", transmission: "Automatic", sort: "price-asc", page: "2" }, 2026);
    expect(issues).toEqual([]);
    expect(filters).toMatchObject({ condition: "USED", brand: "toyota", model: "avanza", q: "G", minPrice: "150000000", maxPrice: "300000000", minYear: 2020, maxYear: 2024, transmission: "Automatic", sort: "price-asc", page: 2 });
  });

  it("ignores malformed values safely", () => {
    const result = parseCatalogFilters({ condition: "broken", brand: "../toyota", minPrice: "1.5", minYear: "1800", sort: "random", page: "-4" }, 2026);
    expect(result.filters).toEqual({ sort: "newest", page: 1 });
    expect(result.issues.length).toBe(6);
  });

  it("rejects reversed price and year ranges", () => {
    const result = parseCatalogFilters({ minPrice: "300", maxPrice: "100", minYear: "2025", maxYear: "2020" }, 2026);
    expect(result.filters.minPrice).toBeUndefined();
    expect(result.filters.maxPrice).toBeUndefined();
    expect(result.filters.minYear).toBeUndefined();
    expect(result.filters.maxYear).toBeUndefined();
  });
});

describe("catalog query rules", () => {
  it("always enforces AVAILABLE and maps all filters", () => {
    const filters = parseCatalogFilters({ condition: "NEW", brand: "honda", model: "brio", q: "2024", minPrice: "100", maxPrice: "200", minYear: "2020", maxYear: "2025", transmission: "CVT" }, 2026).filters;
    const where = buildCatalogWhere(filters);
    expect(where.status).toBe("AVAILABLE");
    expect(where.condition).toBe("NEW");
    expect(where.brand).toEqual({ slug: "honda" });
    expect(where.model).toEqual({ slug: "brio" });
    expect(where.transmission).toEqual({ equals: "CVT", mode: "insensitive" });
    expect(where.OR).toHaveLength(4);
    expect(JSON.stringify(where)).not.toContain("DRAFT");
    expect(JSON.stringify(where)).not.toContain("SOLD");
  });

  it("detects model/brand and transmission inconsistencies", () => {
    const brands = [{ slug: "toyota", models: [{ slug: "avanza" }] }, { slug: "honda", models: [{ slug: "brio" }] }];
    expect(validateCatalogCombination({ sort: "newest", page: 1, model: "avanza" }, brands, ["CVT"])).toContain("merek");
    expect(validateCatalogCombination({ sort: "newest", page: 1, brand: "honda", model: "avanza" }, brands, ["CVT"])).toContain("Model");
    expect(validateCatalogCombination({ sort: "newest", page: 1, transmission: "Manual" }, brands, ["CVT"])).toContain("transmisi");
    expect(validateCatalogCombination({ sort: "newest", page: 1, brand: "toyota", model: "avanza", transmission: "cvt" }, brands, ["CVT"])).toBeNull();
  });

  it("maps every supported sort deterministically", () => {
    expect(catalogOrderBy("newest")).toEqual([{ updatedAt: "desc" }, { id: "asc" }]);
    expect(catalogOrderBy("price-asc")).toEqual([{ price: "asc" }, { id: "asc" }]);
    expect(catalogOrderBy("price-desc")).toEqual([{ price: "desc" }, { id: "asc" }]);
    expect(catalogOrderBy("year-desc")).toEqual([{ year: "desc" }, { id: "asc" }]);
    expect(catalogOrderBy("year-asc")).toEqual([{ year: "asc" }, { id: "asc" }]);
  });
});

describe("catalog pagination and URLs", () => {
  it("calculates server pagination and out-of-range state", () => {
    expect(paginationState(25, 2)).toEqual({ totalPages: 3, skip: 12, outOfRange: false });
    expect(paginationState(25, 4).outOfRange).toBe(true);
    expect(pageNumbers(5, 10)).toEqual([1, 4, 5, 6, 10]);
  });

  it("preserves filters, resets page on changes, and supports removal", () => {
    const filters = parseCatalogFilters({ condition: "USED", brand: "toyota", page: "3" }).filters;
    expect(buildCatalogUrl(filters, { sort: "price-asc" })).toBe("/cars?condition=USED&brand=toyota&sort=price-asc");
    expect(buildCatalogUrl(filters, { page: 2 }, false)).toBe("/cars?condition=USED&brand=toyota&page=2");
    expect(buildCatalogUrl(filters, { condition: null, brand: null })).toBe("/cars");
  });
});
