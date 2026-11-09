import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  car: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  brand: { findMany: vi.fn() },
  dealerDomain: { findMany: vi.fn() },
  dealerSettings: { findUnique: vi.fn() },
  transaction: vi.fn(),
  publicUrl: vi.fn((key: string) => `/uploads/${key}`),
  memoStores: [] as Array<Map<string, unknown>>,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: { ...mocks, $transaction: mocks.transaction } }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ publicUrl: mocks.publicUrl }) }));
vi.mock("next/server", async (importOriginal) => ({ ...await importOriginal<object>(), connection: async () => {} }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "a.example", "x-forwarded-host": "attacker.example" }),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<object>(),
  // Keep one shared memo table per function to expose scope checks accidentally
  // placed behind the memoization boundary. This is not a React runtime test.
  cache: (fn: (...args: unknown[]) => unknown) => {
    const entries = new Map<string, unknown>();
    mocks.memoStores.push(entries);
    return (...args: unknown[]) => {
      const key = JSON.stringify(args);
      if (!entries.has(key)) entries.set(key, fn(...args));
      return entries.get(key);
    };
  },
}));

import { generateMetadata } from "@/app/(public)/cars/[slug]/page";
import sitemap from "@/app/sitemap";
import { parseCatalogFilters } from "@/features/catalog/domain";
import { getAvailableCarSitemapEntries, getCarDetailPageData } from "@/server/car-detail/service";
import { getCatalogData } from "@/server/catalog/service";
import { getHomepageData } from "@/server/homepage/service";
import { resolveInventoryReadContext, type InventoryContext } from "@/server/inventory/context";
import { classifyStorefrontContext, getStorefrontSiteUrl, legacyStorefrontContext } from "@/server/storefront/context";

const legacy = legacyStorefrontContext;
const owner = { dealerId: null };
const published = {
  ...owner, status: "AVAILABLE", brand: owner, model: { ...owner, brand: owner },
};
const now = new Date("2026-01-01T00:00:00Z");
const image = {
  id: "front", storageKey: "cars/legacy-car/front.webp", sortOrder: 0, isPrimary: true, createdAt: now,
};
const car = {
  id: "legacy-car", slug: "legacy-car", condition: "USED", status: "AVAILABLE", featured: true,
  brandId: "legacy-brand", modelId: "legacy-model",
  brand: { name: "Toyota", slug: "toyota" }, model: { name: "Avanza", slug: "avanza" },
  variant: "G", year: 2023, price: "175000000", transmission: "Automatic", mileage: 12000,
  color: "Black", fuelType: "Gasoline", description: "Example", updatedAt: now, images: [image],
};
const canonical = {
  id: "domain-a", dealerId: "dealer-a", hostname: "a.example", bindingVersion: 3, isCanonical: true,
  verificationState: "VERIFIED", routingState: "ACTIVE", verifiedAt: now, activatedAt: now,
};
function seedBinding(binding = canonical) {
  mocks.dealerDomain.findMany.mockResolvedValue([{ ...binding, dealer: { id: "dealer-a", lifecycle: "ACTIVE", domains: [binding] } }]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://legacy.example");
  for (const memo of mocks.memoStores) memo.clear();
  mocks.car.findMany.mockReset().mockResolvedValue([]);
  mocks.car.findFirst.mockReset().mockResolvedValue(null);
  mocks.car.count.mockResolvedValue(0);
  mocks.brand.findMany.mockResolvedValue([]);
  mocks.dealerDomain.findMany.mockResolvedValue([]);
  mocks.dealerSettings.findUnique.mockResolvedValue(null);
  mocks.transaction.mockImplementation(async (run) => run(mocks));
});
afterEach(() => vi.unstubAllEnvs());

it("keeps homepage featured/latest cards, taxonomy counts and cover images within legacy scope", async () => {
  mocks.car.findMany.mockResolvedValueOnce([car]).mockResolvedValueOnce([{ ...car, id: "latest", slug: "latest", images: [] }]);
  mocks.brand.findMany.mockResolvedValueOnce([{ ...car.brand, models: [car.model], _count: { cars: 2 } }]);
  const data = await getHomepageData(legacy);
  expect(data.featuredCars[0]).toMatchObject({ slug: "legacy-car", imageUrl: "/uploads/cars/legacy-car/front.webp" });
  expect(data.latestCars[0]).toMatchObject({ slug: "latest" });
  expect(data.brands).toEqual([{ ...car.brand, models: [car.model], availableCars: 2 }]);
  expect(mocks.car.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
    where: { ...published, featured: true }, select: expect.objectContaining({ images: expect.objectContaining({ where: owner, take: 1 }) }),
  }));
  expect(mocks.car.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { ...published, id: { notIn: ["legacy-car"] } } }));
  expect(mocks.brand.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { ...owner, cars: { some: published } },
    select: expect.objectContaining({
      models: expect.objectContaining({ where: { ...owner, brand: owner, cars: { some: published } } }),
      _count: { select: { cars: { where: published } } },
    }),
  }));
});

it("ANDs catalog search, taxonomy filters and pagination with the same ownership predicate for count and rows", async () => {
  mocks.brand.findMany.mockResolvedValueOnce([{ ...car.brand, models: [car.model] }]);
  mocks.car.findMany.mockResolvedValueOnce([{ transmission: "Automatic" }]).mockResolvedValueOnce([car]);
  mocks.car.count.mockResolvedValueOnce(13);
  const parsed = parseCatalogFilters({
    dealerId: "dealer-a", brand: "toyota", model: "avanza", q: "2023",
    transmission: "Automatic", page: "2", sort: "price-asc",
  });
  expect(await getCatalogData(legacy, parsed)).toMatchObject({ total: 13, totalPages: 2, cars: [{ slug: "legacy-car" }], invalidCombination: null });
  expect(mocks.brand.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { ...owner, cars: { some: published } },
    select: expect.objectContaining({ models: expect.objectContaining({ where: { ...owner, brand: owner, cars: { some: published } } }) }),
  }));
  expect(mocks.car.findMany.mock.calls[0][0].where).toEqual(published);
  const where = mocks.car.count.mock.calls[0][0].where;
  expect(where).toMatchObject({ AND: [published, {
    brand: { slug: "toyota" }, model: { slug: "avanza" },
    transmission: { equals: "Automatic", mode: "insensitive" }, OR: expect.arrayContaining([{ year: 2023 }]),
  }] });
  expect(mocks.car.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
    where, skip: 12, take: 12, orderBy: [{ price: "asc" }, { id: "asc" }],
    select: expect.objectContaining({ images: expect.objectContaining({ where: owner }) }),
  }));
});

it("throws a metadata 404 before rendering a slug outside legacy scope", async () => {
  const slug = "owned-by-dealer-a";
  expect(await getCarDetailPageData(legacy, slug)).toEqual({ kind: "not-found" });
  expect(mocks.car.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { ...published, slug } }));
  await expect(generateMetadata({ params: Promise.resolve({ slug }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  expect(mocks.car.findMany).not.toHaveBeenCalled();
  expect(mocks.publicUrl).not.toHaveBeenCalled();
});

it("requires scoped gallery rows and rejects even legacy rows that point to another car or unsafe key", async () => {
  mocks.car.findFirst.mockResolvedValueOnce({ ...car, images: [
    image,
    { ...image, id: "foreign", storageKey: "cars/other-car/front.webp" },
    { ...image, id: "encoded", storageKey: "cars/legacy-car/a%2fb.webp" },
  ] });
  const result = await getCarDetailPageData(legacy, car.slug);
  expect(result).toMatchObject({ kind: "success", car: { images: [{ id: image.id, url: "/uploads/cars/legacy-car/front.webp" }] } });
  expect(mocks.car.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    select: expect.objectContaining({ images: expect.objectContaining({ where: owner }) }),
  }));
  expect(mocks.publicUrl).toHaveBeenCalledExactlyOnceWith(image.storageKey);
  expect(mocks.car.findMany).toHaveBeenCalledTimes(3);
  for (const [query] of mocks.car.findMany.mock.calls) {
    expect(query.where).toMatchObject({ ...published, id: { not: car.id } });
    expect(query.select.images.where).toEqual(owner);
  }
});

it("emits only legacy sitemap rows and configured canonical paths, ignoring request headers", async () => {
  seedBinding();
  mocks.car.findMany.mockResolvedValueOnce([{ slug: car.slug, updatedAt: now }]);
  mocks.car.findFirst.mockResolvedValueOnce(car);
  expect((await sitemap()).map((entry) => entry.url)).toEqual([
    "https://legacy.example", "https://legacy.example/about", "https://legacy.example/cars", "https://legacy.example/cars/legacy-car",
  ]);
  expect(mocks.car.findMany.mock.calls[0][0].where).toEqual(published);
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: car.slug }) });
  expect(metadata.alternates?.canonical).toBe("/cars/legacy-car");
  expect(getStorefrontSiteUrl(legacy)).toBe("https://legacy.example");
  expect(mocks.dealerDomain.findMany).not.toHaveBeenCalled();
});

it.each([undefined, "a.example", { host: "a.example", "x-forwarded-host": "a.example" }, { ...legacy }])(
  "rejects untrusted storefront input %# without querying inventory or issuing a canonical",
  async (input) => {
    const forged = input as InventoryContext;
    expect(classifyStorefrontContext(forged)).toBe("untrusted");
    await expect(getHomepageData(forged)).rejects.toThrow("Storefront context is not enabled");
    await expect(getCatalogData(forged, parseCatalogFilters({}))).rejects.toThrow("Storefront context is not enabled");
    await expect(getAvailableCarSitemapEntries(forged)).rejects.toThrow("Storefront context is not enabled");
    expect(() => getStorefrontSiteUrl(forged)).toThrow("Storefront context is not enabled");
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.car.findMany).not.toHaveBeenCalled();
  },
);

it("does not promote a verified binding into a live storefront, even after the same legacy slug has been memoized", async () => {
  seedBinding();
  const registered = await resolveInventoryReadContext("a.example");
  expect(classifyStorefrontContext(registered)).toBe("verified-registered-disabled");
  if (!registered) throw new Error("Expected a registered inventory context.");
  mocks.car.findFirst.mockResolvedValueOnce(car);
  expect(await getCarDetailPageData(legacy, car.slug)).toMatchObject({ kind: "success" });
  await expect(getCarDetailPageData(registered, car.slug)).rejects.toThrow("Storefront context is not enabled");
  await expect(getAvailableCarSitemapEntries(registered)).rejects.toThrow("Storefront context is not enabled");
  expect(() => getStorefrontSiteUrl(registered)).toThrow("Storefront context is not enabled");
  expect(mocks.car.findFirst).toHaveBeenCalledTimes(1);
});

it.each(["missing", "invalid", "revoked"])("rejects a %s domain binding without legacy fallback", async (kind) => {
  if (kind === "revoked") seedBinding({ ...canonical, verificationState: "REVOKED" });
  const context = await resolveInventoryReadContext(kind === "invalid" ? "https://a.example/path" : "a.example");
  expect(context).toBeNull();
  expect(classifyStorefrontContext(context)).toBe("unknown-host");
  await expect(getCarDetailPageData(context as unknown as InventoryContext, car.slug)).rejects.toThrow("Storefront context is not enabled");
  expect(mocks.car.findFirst).not.toHaveBeenCalled();
  expect(mocks.car.findMany).not.toHaveBeenCalled();
});
