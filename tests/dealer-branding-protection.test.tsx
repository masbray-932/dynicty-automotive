import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), find: vi.fn(), upsert: vi.fn(), update: vi.fn(), transaction: vi.fn(),
  publicUrl: vi.fn(), put: vi.fn(), remove: vi.fn(), refresh: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/db/client", () => ({
  db: { dealerSettings: { findUnique: mocks.find, upsert: mocks.upsert, update: mocks.update }, $transaction: mocks.transaction },
}));
vi.mock("@/services/storage", () => ({
  getStorageProvider: () => ({ publicUrl: mocks.publicUrl, put: mocks.put, delete: mocks.remove }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/server/content/service", () => ({
  getPublicDealerContent: async () => ({ profile: null, items: [] }),
}));

import PublicLayout from "@/app/(public)/layout";
import AdminSettingsPage from "@/app/admin/(protected)/settings/page";
import { getDealerPresentation } from "@/server/homepage/service";
import { removeDealerLogoAction, saveDealerSettingsAction, uploadDealerLogoAction } from "@/server/settings/actions";
import * as settingsService from "@/server/settings/service";
import { emptyActionState } from "@/types/action-state";

const operational = {
  dealerName: "Dealer Maju",
  phone: "+62 21 555-0101",
  whatsappNumber: "081234567890",
  whatsappWidgetEnabled: false,
  whatsappWidgetMessage: "Halo dari widget",
  email: "sales@example.com",
  address: "Jalan Utama",
  googleMapsUrl: "https://maps.google.com/test",
  instagramUrl: "https://instagram.com/dealer",
  facebookUrl: "https://facebook.com/dealer",
};
const branding = { primaryColor: "#123456", secondaryColor: "#ABCDEF", logoStorageKey: "dealer/logo/platform.png" };
const logoUrl = "/uploads/dealer/logo/platform.png";
const makeForm = () => {
  const form = new FormData();
  for (const [key, value] of Object.entries(operational)) form.set(key, String(value));
  if (operational.whatsappWidgetEnabled) form.set("whatsappWidgetEnabled", "on");
  return form;
};
const expectNoMutation = () => {
  for (const mutation of [mocks.upsert, mocks.update, mocks.transaction, mocks.put, mocks.remove, mocks.refresh]) {
    expect(mutation).not.toHaveBeenCalled();
  }
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: "admin" });
  mocks.publicUrl.mockReturnValue(logoUrl);
});

describe("dealer branding write protection", () => {
  it("saves exactly the operational fields and leaves existing storefront branding readable", async () => {
    let row = { id: "default", ...operational, dealerName: "Nama lama", ...branding };
    mocks.find.mockImplementation(async () => row);
    mocks.upsert.mockImplementation(async ({ update }) => { row = { ...row, ...update }; return row; });

    const form = makeForm();
    form.set("$ACTION_REF_0", "metadata");
    form.set("$ACTION_0:0", "metadata");
    expect(await saveDealerSettingsAction(emptyActionState, form)).toMatchObject({ status: "success" });
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      where: { id: "default", AND: [{ dealerId: null }] }, create: { id: "default", ...operational }, update: operational,
    });
    expect(row).toMatchObject({ ...operational, ...branding });
    expect(mocks.refresh).toHaveBeenCalledWith("/", "layout");
    expect(await getDealerPresentation()).toMatchObject({
      dealerName: operational.dealerName, logoUrl,
      primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor,
    });
    const html = renderToStaticMarkup(await PublicLayout({ children: <p>Storefront</p> }));
    expect(html).toContain("--color-primary:#123456");
    expect(html).toContain("--color-background:#FFFFFF");
    expect(html).toContain("public-storefront");
    expect(html).toContain(logoUrl);
  });

  it.each(["primaryColor", "secondaryColor", "logoStorageKey", "logo"])("rejects crafted %s fields even when blank", async (key) => {
    const form = makeForm();
    form.set(key, "");
    expect(await saveDealerSettingsAction(emptyActionState, form)).toMatchObject({
      status: "error", message: "Warna dan logo dealer dikelola oleh platform.",
    });
    expectNoMutation();
  });

  it.each(["id", "update[primaryColor]", "theme", "unexpected"])("rejects extra field %s", async (key) => {
    const form = makeForm();
    form.set(key, "#000000");
    expect(await saveDealerSettingsAction(emptyActionState, form)).toMatchObject({ status: "error" });
    expectNoMutation();
  });

  it("rejects duplicate operational form fields", async () => {
    const form = makeForm();
    form.append("dealerName", "Second value");
    expect(await saveDealerSettingsAction(emptyActionState, form)).toMatchObject({ status: "error" });
    expectNoMutation();
  });

  it.each([
    { ...operational, primaryColor: null }, { ...operational, secondaryColor: "#FFFFFF" },
    { ...operational, logoStorageKey: null }, { ...operational, id: "elsewhere" },
    { ...operational, update: { primaryColor: "#FFFFFF" } }, { primaryColor: "#FFFFFF" },
    { dealerName: "Partial" }, { ...operational, address: "" },
    { ...operational, ["__proto__"]: { logoStorageKey: null } },
  ])("rejects direct, invalid or partial service payloads before persistence %#", async (input) => {
    await expect(settingsService.upsertDealerSettings(input)).rejects.toThrow();
    expectNoMutation();
  });

  it("rejects accessor payloads without evaluating them", async () => {
    const getter = vi.fn(() => "Dealer");
    const input = Object.defineProperty({ ...operational }, "dealerName", { get: getter });
    await expect(settingsService.upsertDealerSettings(input)).rejects.toThrow(TypeError);
    expect(getter).not.toHaveBeenCalled();
    expectNoMutation();
  });

  it("blocks old logo Server Actions without DB reads, storage, or revalidation", async () => {
    const form = new FormData();
    form.set("logo", new File(["image"], "logo.png", { type: "image/png" }));
    for (const action of [uploadDealerLogoAction, removeDealerLogoAction]) {
      expect(await action(emptyActionState, form)).toMatchObject({
        status: "error", message: "Logo dealer dikelola oleh platform.",
      });
    }
    expect(mocks.find).not.toHaveBeenCalled();
    expectNoMutation();
    expect(settingsService).not.toHaveProperty("replaceDealerLogo");
    expect(settingsService).not.toHaveProperty("removeDealerLogo");
  });

  it("renders dedicated standalone branding controls alongside operational inputs", async () => {
    mocks.find.mockResolvedValue({ ...operational, ...branding });
    const html = renderToStaticMarkup(await AdminSettingsPage());
    expect(html).toContain("Atur logo dan warna website publik.");
    expect(html).toContain(logoUrl);
    expect(html).toContain("Simpan Pengaturan");
    for (const key of Object.keys(operational)) expect(html).toContain(`name="${key}"`);
    for (const key of ["primaryColor", "secondaryColor", "logo"]) expect(html).toContain(`name="${key}"`);
    expect(html).toContain("Hapus Logo");
    expect(html).not.toContain('name="logoStorageKey"');
  });
});
