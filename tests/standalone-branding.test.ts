import sharp from "sharp";
import { beforeEach, expect, it, vi } from "vitest";
import { imageFile } from "./fixtures/images";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(), upsert: vi.fn(), update: vi.fn(), lock: vi.fn(),
  put: vi.fn(), remove: vi.fn(), url: vi.fn(), refresh: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireLegacyAdminPermission: mocks.permission }));
vi.mock("@/db/client", () => {
  const dealerSettings = { upsert: mocks.upsert, update: mocks.update };
  return { db: { dealerSettings, $transaction: (run: (tx: unknown) => unknown) => run({ dealerSettings, $queryRaw: mocks.lock }) } };
});
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ put: mocks.put, delete: mocks.remove, publicUrl: mocks.url }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));

import { contrastRatio, resolveAutomotiveTheme } from "@/features/theme/domain";
import { allowsPermission } from "@/server/auth/authorization";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { removeStandaloneFaviconAction, removeStandaloneLogoAction, replaceStandaloneFaviconAction, replaceStandaloneLogoAction, saveStandaloneColorsAction } from "@/server/settings/actions";
import { removeStandaloneFavicon, removeStandaloneLogo, replaceStandaloneFavicon, replaceStandaloneLogo, saveStandaloneColors, standaloneBrandingPermission } from "@/server/settings/branding";
import { legacyDealerFaviconUrl, legacyDealerLogoUrl } from "@/server/settings/logo-url";
import { emptyActionState } from "@/types/action-state";

const legacyWhere = { id: "default", AND: [{ dealerId: null }] };
const old = "dealer/logo/existing.png";
const colors = (primaryColor = " #abc123 ", secondaryColor = "") => {
  const form = new FormData();
  form.set("primaryColor", primaryColor);
  form.set("secondaryColor", secondaryColor);
  return form;
};
const logo = (file = imageFile()) => {
  const form = new FormData();
  form.set("logo", file);
  return form;
};
const favicon = (file = imageFile()) => { const form = new FormData(); form.set("favicon", file); return form; };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.lock.mockResolvedValue([{ logoStorageKey: old }]);
  mocks.url.mockImplementation(key => `/uploads/${key}`);
});

it("grants only the standalone branding permission to a legacy dealer admin", () => {
  const legacy = { role: "dealer-admin", subjectId: "admin", scope: LEGACY_DEALER_SCOPE };
  const registered = { kind: "registered-dealer", dealerId: "other" };
  expect(allowsPermission(legacy, standaloneBrandingPermission)).toBe(true);
  expect(allowsPermission({ ...legacy, scope: registered }, standaloneBrandingPermission)).toBe(false);
  expect(allowsPermission(legacy, { ...standaloneBrandingPermission, scope: registered })).toBe(false);
  expect(allowsPermission(legacy, { ...standaloneBrandingPermission, permission: "platform:dealer-branding:write" })).toBe(false);
});

it("requires authentication at direct service boundaries before writes or storage", async () => {
  mocks.permission.mockRejectedValue(new Error("unauthorized"));
  await expect(saveStandaloneColors({ primaryColor: "", secondaryColor: "" })).rejects.toThrow("unauthorized");
  await expect(replaceStandaloneLogo(imageFile())).rejects.toThrow("unauthorized");
  await expect(removeStandaloneLogo()).rejects.toThrow("unauthorized");
  await expect(replaceStandaloneFavicon(imageFile())).rejects.toThrow("unauthorized");
  await expect(removeStandaloneFavicon()).rejects.toThrow("unauthorized");
  expect(mocks.upsert).not.toHaveBeenCalled();
  expect(mocks.lock).not.toHaveBeenCalled();
  expect(mocks.put).not.toHaveBeenCalled();
});

it("normalizes hex and resets blank; invalidates legacy views", async () => {
  expect(await saveStandaloneColorsAction(emptyActionState, colors())).toMatchObject({ status: "success" });
  expect(mocks.upsert).toHaveBeenCalledWith({
    where: legacyWhere, create: { id: "default", primaryColor: "#ABC123", secondaryColor: null },
    update: { primaryColor: "#ABC123", secondaryColor: null },
  });
  expect(mocks.refresh).toHaveBeenCalledWith("/", "layout");
  expect(mocks.refresh).toHaveBeenCalledWith("/admin/settings");
});

it("rejects CSS payloads, untrusted keys and duplicates", async () => {
  expect(await saveStandaloneColorsAction(emptyActionState, colors("#000000;display:none"))).toMatchObject({ status: "error", errors: { primaryColor: expect.any(Array) } });
  const forged = colors();
  forged.set("dealerId", "registered");
  const duplicate = colors();
  duplicate.append("secondaryColor", "#123456");
  for (const form of [forged, duplicate]) expect(await saveStandaloneColorsAction(emptyActionState, form)).toMatchObject({ status: "error" });
  const file = logo();
  file.set("logoStorageKey", "cars/foreign/front.png");
  expect(await replaceStandaloneLogoAction(emptyActionState, file)).toMatchObject({ status: "error" });
  expect(mocks.upsert).not.toHaveBeenCalled();
  expect(mocks.put).not.toHaveBeenCalled();
});

it("re-encodes a logo, scopes the locked update, then deletes the previous logo", async () => {
  expect(await replaceStandaloneLogoAction(emptyActionState, logo(imageFile("png", "foreign.svg")))).toMatchObject({ status: "success" });
  const upload = mocks.put.mock.calls[0][0];
  expect(upload.key).toMatch(/^dealer\/logo\/[a-f0-9-]+-logo\.webp$/);
  expect(upload.contentType).toBe("image/webp");
  expect((await sharp(upload.body).metadata()).format).toBe("webp");
  expect(mocks.update).toHaveBeenCalledWith({ where: legacyWhere, data: { logoStorageKey: upload.key } });
  expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
  expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(old);
});

it("re-encodes and isolates dealer favicons with a unique cache-safe key", async () => {
  mocks.lock.mockResolvedValue([{ faviconStorageKey: "dealer/favicon/old-favicon.webp" }]);
  expect(await replaceStandaloneFaviconAction(emptyActionState, favicon())).toMatchObject({ status: "success" });
  const upload = mocks.put.mock.calls[0][0];
  expect(upload.key).toMatch(/^dealer\/favicon\/[a-f0-9-]+-favicon\.webp$/);
  const metadata = await sharp(upload.body).metadata();
  expect(metadata).toMatchObject({ format: "webp", width: 192, height: 192 });
  expect(mocks.update).toHaveBeenCalledWith({ where: legacyWhere, data: { faviconStorageKey: upload.key } });
  expect(legacyDealerFaviconUrl(upload.key)).toBe(`/uploads/${upload.key}`);
  expect(legacyDealerFaviconUrl("dealer/favicon/../foreign.webp")).toBeNull();
  mocks.lock.mockResolvedValue([{ faviconStorageKey: upload.key }]);
  expect(await removeStandaloneFaviconAction(emptyActionState, new FormData())).toMatchObject({ status: "success" });
});

it("rejects SVG and spoofed raster uploads without reaching storage", async () => {
  for (const type of ["image/svg+xml", "image/png"]) {
    expect(await replaceStandaloneLogoAction(emptyActionState, logo(new File(["<svg></svg>"], "x.png", { type })))).toMatchObject({ status: "error", errors: { logo: expect.any(Array) } });
  }
  expect(mocks.put).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});

it("compensates the new asset if the legacy row cannot be locked", async () => {
  mocks.lock.mockResolvedValue([]);
  expect(await replaceStandaloneLogoAction(emptyActionState, logo())).toMatchObject({ status: "error" });
  expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(mocks.put.mock.calls[0][0].key);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.refresh).not.toHaveBeenCalled();
});

it("clears the scoped logo without deleting or exposing an unsafe stored key", async () => {
  const foreign = "cars/foreign/a.png";
  mocks.lock.mockResolvedValue([{ logoStorageKey: foreign }]);
  expect(await removeStandaloneLogoAction(emptyActionState, new FormData())).toMatchObject({ status: "warning" });
  expect(mocks.update).toHaveBeenCalledWith({ where: legacyWhere, data: { logoStorageKey: null } });
  for (const key of [foreign, "dealer/logo/encoded%2f.png", "dealer/logo/file.svg", "dealer/logo/../file.png"]) {
    expect(legacyDealerLogoUrl(key)).toBeNull();
  }
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(mocks.url).not.toHaveBeenCalled();
  expect(legacyDealerLogoUrl(old)).toBe("/uploads/dealer/logo/existing.png");
});

it("uses the secondary accent for focus with a contrast-safe fallback", () => {
  expect(resolveAutomotiveTheme({ "--color-accent": "#00FF00" }).aliases["--auto-focus"]).toBe("#00FF00");
  const { aliases } = resolveAutomotiveTheme({ "--color-accent": "#09090B" });
  expect(contrastRatio(aliases["--auto-background"], aliases["--auto-focus"])).toBeGreaterThanOrEqual(3);
});
