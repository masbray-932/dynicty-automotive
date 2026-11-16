import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(), getCookie: vi.fn(), headers: vi.fn(), session: vi.fn(), cleanup: vi.fn(),
  settingsRead: vi.fn(), settingsWrite: vi.fn(), contentRead: vi.fn(), items: vi.fn(), advantageCount: vi.fn(), advantageSection: vi.fn(),
  contentWrite: vi.fn(), owner: vi.fn(), lock: vi.fn(), transaction: vi.fn(), refresh: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies, headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
vi.mock("@/server/env", () => ({ getServerEnv: () => ({ SESSION_SECRET: "unit-test-session-key" }) }));
vi.mock("@/db/client", () => ({ db: {
  adminSession: { findUnique: mocks.session, deleteMany: mocks.cleanup },
  dealerSettings: { findUnique: mocks.settingsRead, upsert: mocks.settingsWrite },
  dealerContent: { findUnique: mocks.contentRead },
  dealerContentItem: { findMany: mocks.items, count: mocks.advantageCount, findFirst: mocks.advantageSection },
  $transaction: mocks.transaction,
} }));

import { allowsPermission, type AuthorizationRequest, type PlatformAdministrator } from "@/server/auth/authorization";
import { getCurrentAdmin, requireAdmin, requireLegacyAdminPermission } from "@/server/auth/session";
import { saveDealerContentAction } from "@/server/content/actions";
import { getAdminDealerContent, getPublicDealerContent } from "@/server/content/service";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { getDealerPresentation } from "@/server/homepage/service";
import { removeDealerLogoAction, saveDealerSettingsAction, uploadDealerLogoAction } from "@/server/settings/actions";
import { getAdminDealerSettings, upsertDealerSettings } from "@/server/settings/service";
import { emptyActionState } from "@/types/action-state";

const otherScope = { kind: "registered-dealer", dealerId: "other-dealer" } as const;
const operate = { permission: "dealer:operate", scope: LEGACY_DEALER_SCOPE } as const;
const branding = { permission: "platform:dealer-branding:write", scope: LEGACY_DEALER_SCOPE } as const;
const operations = {
  dealerName: "Dealer Lama", address: "Jalan Lama", phone: null, whatsappNumber: null,
  email: null, googleMapsUrl: null, instagramUrl: null, facebookUrl: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookies.mockResolvedValue({ get: mocks.getCookie });
  mocks.getCookie.mockImplementation((key: string) => key === "dynicty_admin_session" ? { value: "opaque-test-token" } : undefined);
  mocks.headers.mockResolvedValue(new Headers({ "x-dealer-id": otherScope.dealerId, "x-role": "platform-admin" }));
  mocks.session.mockResolvedValue({
    id: "session", expiresAt: new Date(Date.now() + 60_000),
    admin: { id: "legacy-admin", email: "dealer@example.com", role: "platform-admin", scope: otherScope },
  });
  mocks.settingsRead.mockResolvedValue({ ...operations, primaryColor: "#123456" });
  mocks.contentRead.mockResolvedValue(null);
  mocks.items.mockResolvedValue([]);
  mocks.advantageCount.mockResolvedValue(0);
  mocks.advantageSection.mockResolvedValue(null);
  mocks.settingsWrite.mockResolvedValue(operations);
  mocks.transaction.mockImplementation(async (run) => run({
    dealerSettings: { upsert: mocks.owner },
    dealerContent: { findUnique: mocks.contentRead, upsert: mocks.contentWrite },
    $queryRaw: mocks.lock,
  }));
});

describe("authorization contract", () => {
  const platform: PlatformAdministrator = { role: "platform-admin", subjectId: "verified-platform-subject" };
  const dealer = { role: "dealer-admin", subjectId: "legacy-admin", scope: LEGACY_DEALER_SCOPE };
  it("separates platform branding from dealer operations without implying a live platform identity source", () => {
    expect(allowsPermission(platform, branding)).toBe(true);
    expect(allowsPermission(platform, operate)).toBe(false);
    expect(allowsPermission(dealer, operate)).toBe(true);
    expect(allowsPermission(dealer, branding)).toBe(false);
  });

  it.each([
    null, { ...dealer, role: "unknown" }, { ...dealer, subjectId: "" },
    { ...dealer, scope: undefined }, { ...dealer, scope: { ...LEGACY_DEALER_SCOPE, dealerId: "" } },
    { ...dealer, scope: otherScope },
  ])("rejects missing, invalid, or mismatched dealer identity %#", (identity) => {
    expect(allowsPermission(identity, operate)).toBe(false);
  });

  it("rejects absent or invalid request scope and unknown permissions", () => {
    expect(allowsPermission(platform, { permission: branding.permission })).toBe(false);
    expect(allowsPermission(dealer, { ...operate, scope: { kind: "registered-dealer", dealerId: "default" } })).toBe(false);
    expect(allowsPermission(platform, { ...branding, permission: "unknown" })).toBe(false);
  });
});

describe("legacy session and data boundaries", () => {
  it("loads only the authenticated identity and cannot exercise platform or cross-dealer permissions", async () => {
    expect(await getCurrentAdmin()).toEqual({ id: "legacy-admin", email: "dealer@example.com" });
    expect(mocks.getCookie).toHaveBeenCalledWith("dynicty_admin_session");
    expect(mocks.session).toHaveBeenCalledWith({
      where: { tokenHash: createHmac("sha256", "unit-test-session-key").update("opaque-test-token").digest("hex") },
      include: { admin: { select: { id: true, email: true } } },
    });
    await expect(requireAdmin()).resolves.toMatchObject({ id: "legacy-admin" });
    await expect(requireLegacyAdminPermission(branding)).rejects.toThrow("permission denied");
    await expect(requireLegacyAdminPermission({ ...operate, scope: otherScope })).rejects.toThrow("permission denied");
    await expect(requireLegacyAdminPermission({ permission: "dealer:operate" } as AuthorizationRequest)).rejects.toThrow("permission denied");
    expect(mocks.headers).not.toHaveBeenCalled();
  });

  it("denies Settings and CMS access before data reads or writes without a session", async () => {
    mocks.getCookie.mockReturnValue(undefined);
    for (const run of [
      getAdminDealerSettings,
      getAdminDealerContent,
      () => upsertDealerSettings(operations),
      () => saveDealerContentAction(emptyActionState, new FormData()),
    ]) await expect(run()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    for (const call of [mocks.session, mocks.settingsRead, mocks.contentRead, mocks.settingsWrite, mocks.transaction]) {
      expect(call).not.toHaveBeenCalled();
    }
  });

  it("preserves the authenticated settings workflow and rejects branding and scope overrides", async () => {
    expect(await getAdminDealerSettings()).toMatchObject({ kind: "success", settings: { primaryColor: "#123456" } });
    expect(mocks.settingsRead).toHaveBeenCalledWith({ where: { id: "default", AND: [{ dealerId: null }] } });
    await expect(upsertDealerSettings(operations)).resolves.toEqual(operations);
    expect(mocks.settingsWrite).toHaveBeenCalledExactlyOnceWith({
      where: { id: "default", AND: [{ dealerId: null }] }, create: { id: "default", ...operations }, update: operations,
    });
    await expect(upsertDealerSettings({ ...operations, dealerId: otherScope.dealerId })).rejects.toThrow(TypeError);
    const form = new FormData();
    form.set("dealerName", operations.dealerName);
    form.set("address", operations.address);
    form.set("primaryColor", "#FFFFFF");
    expect(await saveDealerSettingsAction(emptyActionState, form)).toMatchObject({ status: "error" });
    expect(await uploadDealerLogoAction(emptyActionState, form)).toMatchObject({ status: "error" });
    expect(await removeDealerLogoAction(emptyActionState, form)).toMatchObject({ status: "error" });
    expect(mocks.settingsWrite).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("ignores a crafted CMS dealer ID and uses the trusted legacy row and lock", async () => {
    const form = new FormData();
    form.set("dealerId", otherScope.dealerId);
    form.set("welcomeTitle", "Selamat datang");
    mocks.lock.mockResolvedValue([{ id: "default" }]);
    expect((await saveDealerContentAction(emptyActionState, form)).errors).toEqual({});
    expect(mocks.owner).toHaveBeenCalledWith({ where: { id: "default", AND: [{ dealerId: null }] }, create: { id: "default" }, update: {} });
    expect(mocks.lock.mock.calls[0][1]).toBe("default");
    expect(mocks.contentWrite).toHaveBeenCalledWith(expect.objectContaining({
      where: { dealerId: "default" }, create: expect.objectContaining({ dealerId: "default" }),
    }));
  });

  it("loads public legacy branding and active CMS content independently of the admin session", async () => {
    expect(await getDealerPresentation()).toMatchObject({ dealerName: operations.dealerName, primaryColor: "#123456" });
    expect(await getPublicDealerContent()).toEqual({ profile: null, showroomUrl: null, advantageConfigured: false, advantageSection: null, items: [] });
    expect(mocks.settingsRead).toHaveBeenCalledWith({ where: { id: "default", AND: [{ dealerId: null }] } });
    expect(mocks.contentRead).toHaveBeenCalledWith({ where: { dealerId: "default", dealer: { dealerId: null } } });
    expect(mocks.items).toHaveBeenCalledWith(expect.objectContaining({ where: { dealerId: "default", dealer: { dealerId: null }, active: true } }));
    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.headers).not.toHaveBeenCalled();
  });
});
