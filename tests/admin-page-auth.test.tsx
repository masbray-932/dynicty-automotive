import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), dashboard: vi.fn(), settings: vi.fn(), content: vi.fn(),
  brands: vi.fn(), cars: vi.fn(), car: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/server/dashboard/service", () => ({ getDashboardData: mocks.dashboard }));
vi.mock("@/server/settings/service", () => ({ getAdminDealerSettings: mocks.settings }));
vi.mock("@/server/content/service", () => ({ getAdminDealerContent: mocks.content }));
vi.mock("@/db/client", () => ({ db: { brand: { findMany: mocks.brands }, car: { findMany: mocks.cars, findUnique: mocks.car } } }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ publicUrl: (key: string) => `/uploads/${key}` }) }));
vi.mock("@/features/cars/car-form", () => ({ CarForm: () => <span>Car form</span> }));
vi.mock("@/features/cars/image-manager", () => ({ ImageManager: () => <span>Images</span> }));
vi.mock("@/features/settings/dealer-settings-form", () => ({ DealerSettingsForm: () => <span>Settings form</span> }));
vi.mock("@/features/master-data/master-data-forms", () => ({ BrandForm: () => <span>Brand form</span>, ModelForm: () => <span>Model form</span> }));
vi.mock("@/features/content/content-editor", () => ({ ProfileEditor: () => <span>Private CMS editor</span>, ItemEditor: () => <span>Item editor</span> }));

import Dashboard from "@/app/admin/(protected)/page";
import Brands from "@/app/admin/(protected)/brands/page";
import Cars from "@/app/admin/(protected)/cars/page";
import NewCar from "@/app/admin/(protected)/cars/new/page";
import EditCar from "@/app/admin/(protected)/cars/[id]/edit/page";
import Settings from "@/app/admin/(protected)/settings/page";
import Content from "@/app/admin/(protected)/content/page";

const pages = [
  { name: "dashboard", render: () => Dashboard(), text: "Total Mobil" },
  { name: "brands", render: () => Brands(), text: "Merek &amp; Model" },
  { name: "cars", render: () => Cars({ searchParams: Promise.resolve({}) }), text: "Kelola Mobil" },
  { name: "new car", render: () => NewCar(), text: "Tambah Mobil" },
  { name: "edit car", render: () => EditCar({ params: Promise.resolve({ id: "private-car" }), searchParams: Promise.resolve({}) }), text: "PRIVATE-BRAND" },
  { name: "settings", render: () => Settings(), text: "Pengaturan Dealer" },
  { name: "content", render: () => Content(), text: "Private CMS editor" },
];
const reads = () => [mocks.dashboard, mocks.settings, mocks.content, mocks.brands, mocks.cars, mocks.car];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: "admin" });
  mocks.dashboard.mockResolvedValue({ kind: "success", metrics: { total: 90210, available: 1, draft: 1, sold: 1, newCars: 1, usedCars: 1, featured: 1 }, recent: [] });
  mocks.settings.mockResolvedValue({ kind: "success", settings: null, logoUrl: null });
  mocks.content.mockResolvedValue({ profile: null, items: [] });
  mocks.brands.mockResolvedValue([]);
  mocks.cars.mockResolvedValue([]);
  mocks.car.mockResolvedValue({ id: "private-car", brand: { name: "PRIVATE-BRAND" }, model: { name: "PRIVATE-MODEL" }, price: { toFixed: () => "100000000" }, images: [] });
});

describe("protected pages authenticate independently of parent layout", () => {
  it.each(pages)("$name rejects before any private loader or query", async ({ render }) => {
    const redirect = new Error("NEXT_REDIRECT:/admin/login");
    mocks.auth.mockRejectedValue(redirect);
    await expect(render()).rejects.toBe(redirect);
    for (const read of reads()) expect(read).not.toHaveBeenCalled();
  });

  it.each(pages)("$name waits for authentication before starting reads", async ({ render }) => {
    let deny!: (error: Error) => void;
    mocks.auth.mockReturnValue(new Promise((_, reject) => { deny = reject; }));
    const response = render();
    await Promise.resolve();
    for (const read of reads()) expect(read).not.toHaveBeenCalled();
    const rejected = expect(response).rejects.toThrow("denied");
    deny(new Error("denied"));
    await rejected;
  });

  it.each(pages)("$name still renders for an authenticated administrator", async ({ render, text }) => {
    const html = renderToStaticMarkup(await render());
    expect(html).toContain(text);
    expect(mocks.auth).toHaveBeenCalled();
    for (const read of reads().filter(read => read.mock.calls.length)) {
      expect(mocks.auth.mock.invocationCallOrder[0]).toBeLessThan(read.mock.invocationCallOrder[0]);
    }
  });
});
