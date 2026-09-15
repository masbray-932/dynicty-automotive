import { z } from "zod";

export const CATALOG_PAGE_SIZE = 12;
export const catalogSortValues = ["newest", "price-asc", "price-desc", "year-desc", "year-asc"] as const;
export type CatalogSort = (typeof catalogSortValues)[number];

export type RawCatalogSearchParams = Record<string, string | string[] | undefined>;
export type CatalogFilters = {
  condition?: "NEW" | "USED";
  brand?: string;
  model?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: number;
  maxYear?: number;
  transmission?: string;
  sort: CatalogSort;
  page: number;
};

export type ParsedCatalogFilters = { filters: CatalogFilters; issues: string[] };

export function isCatalogIndexable(raw: RawCatalogSearchParams) {
  return !Object.values(raw).some((value) => value !== undefined && value !== "");
}

const firstValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const textSchema = z.string().trim().min(1).max(100);
const priceSchema = z.string().trim().regex(/^\d{1,15}$/);

export function parseCatalogFilters(raw: RawCatalogSearchParams, currentYear = new Date().getFullYear()): ParsedCatalogFilters {
  const issues: string[] = [];
  const filters: CatalogFilters = { sort: "newest", page: 1 };
  const condition = z.enum(["NEW", "USED"]).safeParse(firstValue(raw.condition)?.toUpperCase());
  if (condition.success) filters.condition = condition.data;
  else if (firstValue(raw.condition)) issues.push("Kondisi tidak valid dan diabaikan.");

  for (const key of ["brand", "model"] as const) {
    const value = firstValue(raw[key]);
    if (!value) continue;
    const parsed = slugSchema.safeParse(value);
    if (parsed.success) filters[key] = parsed.data;
    else issues.push(`${key === "brand" ? "Merek" : "Model"} tidak valid dan diabaikan.`);
  }

  const keyword = firstValue(raw.q);
  if (keyword) {
    const parsed = textSchema.safeParse(keyword);
    if (parsed.success) filters.q = parsed.data;
    else issues.push("Kata kunci tidak valid dan diabaikan.");
  }

  for (const key of ["minPrice", "maxPrice"] as const) {
    const value = firstValue(raw[key]);
    if (!value) continue;
    const parsed = priceSchema.safeParse(value);
    if (parsed.success) filters[key] = parsed.data;
    else issues.push(`${key === "minPrice" ? "Harga minimum" : "Harga maksimum"} tidak valid dan diabaikan.`);
  }
  if (filters.minPrice && filters.maxPrice && BigInt(filters.minPrice) > BigInt(filters.maxPrice)) {
    delete filters.minPrice;
    delete filters.maxPrice;
    issues.push("Rentang harga tidak valid dan diabaikan.");
  }

  const yearCeiling = currentYear + 1;
  for (const key of ["minYear", "maxYear"] as const) {
    const value = firstValue(raw[key]);
    if (!value) continue;
    const parsed = z.coerce.number().int().min(1900).max(yearCeiling).safeParse(value);
    if (parsed.success && /^\d{4}$/.test(value)) filters[key] = parsed.data;
    else issues.push(`${key === "minYear" ? "Tahun minimum" : "Tahun maksimum"} tidak valid dan diabaikan.`);
  }
  if (filters.minYear && filters.maxYear && filters.minYear > filters.maxYear) {
    delete filters.minYear;
    delete filters.maxYear;
    issues.push("Rentang tahun tidak valid dan diabaikan.");
  }

  const transmission = firstValue(raw.transmission);
  if (transmission) {
    const parsed = z.string().trim().min(1).max(50).safeParse(transmission);
    if (parsed.success) filters.transmission = parsed.data;
    else issues.push("Transmisi tidak valid dan diabaikan.");
  }

  const sort = z.enum(catalogSortValues).safeParse(firstValue(raw.sort));
  if (sort.success) filters.sort = sort.data;
  else if (firstValue(raw.sort)) issues.push("Urutan tidak valid; urutan terbaru digunakan.");

  const pageValue = firstValue(raw.page);
  if (pageValue) {
    const page = z.coerce.number().int().positive().max(1000).safeParse(pageValue);
    if (page.success && /^\d+$/.test(pageValue)) filters.page = page.data;
    else issues.push("Halaman tidak valid; halaman pertama digunakan.");
  }
  return { filters, issues };
}

export function catalogOrderBy(sort: CatalogSort) {
  const id = { id: "asc" as const };
  const orders = {
    newest: [{ updatedAt: "desc" as const }, id],
    "price-asc": [{ price: "asc" as const }, id],
    "price-desc": [{ price: "desc" as const }, id],
    "year-desc": [{ year: "desc" as const }, id],
    "year-asc": [{ year: "asc" as const }, id],
  };
  return orders[sort];
}

export function paginationState(total: number, page: number, pageSize = CATALOG_PAGE_SIZE) {
  const totalPages = Math.ceil(total / pageSize);
  return { totalPages, skip: (page - 1) * pageSize, outOfRange: totalPages > 0 && page > totalPages };
}

export function validateCatalogCombination(
  filters: CatalogFilters,
  brands: Array<{ slug: string; models: Array<{ slug: string }> }>,
  transmissions: string[],
) {
  if (filters.model && !filters.brand) return "Pilih merek terlebih dahulu untuk menggunakan filter model.";
  if (filters.brand) {
    const brand = brands.find((item) => item.slug === filters.brand);
    if (!brand) return "Merek tidak tersedia pada inventori publik.";
    if (filters.model && !brand.models.some((model) => model.slug === filters.model)) return "Model tidak sesuai dengan merek yang dipilih.";
  }
  if (filters.transmission && !transmissions.some((item) => item.toLowerCase() === filters.transmission!.toLowerCase())) return "Pilihan transmisi tidak tersedia pada inventori publik.";
  return null;
}

type CatalogFilterChange = Partial<Record<keyof CatalogFilters, string | number | null | undefined>>;

export function buildCatalogUrl(filters: CatalogFilters, changes: CatalogFilterChange = {}, resetPage = true) {
  const merged = { ...filters, ...changes };
  if (resetPage && !("page" in changes)) merged.page = 1;
  const params = new URLSearchParams();
  for (const key of ["condition", "brand", "model", "q", "minPrice", "maxPrice", "minYear", "maxYear", "transmission", "sort", "page"] as const) {
    const value = merged[key];
    if (value === undefined || value === null || value === "" || (key === "sort" && value === "newest") || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/cars?${query}` : "/cars";
}

export function pageNumbers(current: number, total: number) {
  if (total <= 1) return total === 1 ? [1] : [];
  const values = new Set([1, total, current - 1, current, current + 1]);
  return [...values].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}
