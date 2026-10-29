import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), query: vi.fn(), storage: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/db/client", () => ({ db: {
  car: { count: mocks.query, groupBy: mocks.query, findMany: mocks.query, findUnique: mocks.query, create: mocks.query, update: mocks.query, delete: mocks.query },
  brand: { findUniqueOrThrow: mocks.query }, carModel: { findUnique: mocks.query, findUniqueOrThrow: mocks.query },
  dealerSettings: { findUnique: mocks.query, upsert: mocks.query, update: mocks.query },
  dealerContent: { findUnique: mocks.query }, dealerContentItem: { findMany: mocks.query },
  $transaction: mocks.query,
} }));
vi.mock("@/services/storage", () => ({ getStorageProvider: mocks.storage }));
import { getDashboardData } from "@/server/dashboard/service";
import { getAdminDealerSettings, upsertDealerSettings, replaceDealerLogo, removeDealerLogo } from "@/server/settings/service";
import { getAdminDealerContent, getPublicDealerContent } from "@/server/content/service";
import * as cars from "@/server/cars/service";
import { carFormSchema } from "@/validation/car";
import { dealerSettingsSchema } from "@/validation/dealer-settings";

const car = carFormSchema.parse({ condition: "NEW", brandId: "cm123456789012345678901234", modelId: "cm123456789012345678901235", variant: "Test", year: 2026, price: "100000000", transmission: "Automatic", fuelType: "Bensin", color: "Putih", mileage: "", description: "Test vehicle", status: "DRAFT", featured: false });
const settings = dealerSettingsSchema.parse({ dealerName: "Test Dealer", phone: "", whatsappNumber: "", email: "", address: "Alamat staging", googleMapsUrl: "", instagramUrl: "", facebookUrl: "", primaryColor: "", secondaryColor: "" });
const file = new File(["test"], "test.png", { type: "image/png" });
const boundaries = [
  { name: "dashboard", run: () => getDashboardData() },
  { name: "settings read", run: () => getAdminDealerSettings() },
  { name: "CMS read", run: () => getAdminDealerContent() },
  { name: "settings write", run: () => upsertDealerSettings(settings) },
  { name: "logo upload", run: () => replaceDealerLogo(file) },
  { name: "logo remove", run: () => removeDealerLogo() },
  { name: "model relation", run: () => cars.assertModelBelongsToBrand("brand", "model") },
  { name: "car create", run: () => cars.createCar(car) },
  { name: "car update", run: () => cars.updateCar("car", car) },
  { name: "car delete", run: () => cars.deleteCarWithMedia("car") },
  { name: "image upload", run: () => cars.uploadCarImage("car", file) },
  { name: "image primary", run: () => cars.setPrimaryImage("car", "image") },
  { name: "image reorder", run: () => cars.reorderCarImage("car", "image", "up") },
  { name: "image delete", run: () => cars.deleteCarImage("car", "image") },
];

beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: "admin" }); });

describe("sensitive admin service boundaries", () => {
  it.each(boundaries)("$name denies before DB or storage access", async ({ run }) => {
    const redirect = new Error("NEXT_REDIRECT:/admin/login");
    mocks.auth.mockRejectedValue(redirect);
    await expect(run()).rejects.toBe(redirect);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.storage).not.toHaveBeenCalled();
  });

  it("does not swallow auth redirects in settings/dashboard fallback handlers", async () => {
    mocks.auth.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(getAdminDealerSettings()).rejects.toThrow("NEXT_REDIRECT");
    await expect(getDashboardData()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("authenticated settings and CMS reads still return data", async () => {
    mocks.query.mockResolvedValueOnce({ dealerName: "Private Dealer", logoStorageKey: null });
    expect(await getAdminDealerSettings()).toMatchObject({ kind: "success", settings: { dealerName: "Private Dealer" } });
    mocks.query.mockResolvedValueOnce({ welcomeTitle: "Private welcome" }).mockResolvedValueOnce([]);
    expect(await getAdminDealerContent()).toMatchObject({ profile: { welcomeTitle: "Private welcome" }, items: [] });
  });

  it("authenticated dashboard still queries and projects inventory", async () => {
    mocks.query.mockResolvedValueOnce(7).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce(2).mockResolvedValueOnce([]);
    expect(await getDashboardData()).toMatchObject({ kind: "success", metrics: { total: 7, featured: 2 } });
  });

  it("authenticated settings write and missing-car delete still work", async () => {
    mocks.query.mockResolvedValueOnce({ dealerName: "Updated" });
    expect(await upsertDealerSettings(settings)).toEqual({ dealerName: "Updated" });
    mocks.query.mockResolvedValueOnce(null);
    expect(await cars.deleteCarWithMedia("missing")).toEqual({ deleted: false, failedKeys: [] });
  });

  it("public CMS reads remain independent of admin authentication", async () => {
    mocks.auth.mockRejectedValue(new Error("denied"));
    mocks.query.mockResolvedValueOnce(null).mockResolvedValueOnce([]);
    expect(await getPublicDealerContent()).toEqual({ profile: null, showroomUrl: null, items: [] });
    expect(mocks.auth).not.toHaveBeenCalled();
  });
});
