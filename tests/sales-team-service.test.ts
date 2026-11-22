import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn(), publicUrl: vi.fn((key: string) => `/uploads/${key}`) }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/db/client", () => ({ db: { salesTeamMember: { findMany: mocks.findMany } } }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ publicUrl: mocks.publicUrl }) }));
import { getAdminSalesTeam, getPublicSalesTeam } from "@/server/sales-team/service";

beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id: "admin" }); });

describe("sales-team ownership and publication boundaries", () => {
  it("authenticates before reading owner-qualified Admin rows", async () => {
    mocks.findMany.mockResolvedValue([]);
    expect(await getAdminSalesTeam()).toEqual([]);
    expect(mocks.auth).toHaveBeenCalled();
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { dealerSettingsId: "default", dealerSettings: { dealerId: null } } }));
  });

  it("publishes only active owner-qualified profiles in stable order and normalizes contacts", async () => {
    mocks.findMany.mockResolvedValue([{ id: "one", fullName: "Ayu", title: "Sales", biography: "Bio", imageStorageKey: "dealers/default/sales/photo.webp", whatsappNumber: "081234567890", active: true, sortOrder: 1 }]);
    const rows = await getPublicSalesTeam();
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { dealerSettingsId: "default", dealerSettings: { dealerId: null }, active: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }));
    expect(rows[0]).toMatchObject({ fullName: "Ayu", imageUrl: "/uploads/dealers/default/sales/photo.webp", whatsappUrl: "https://wa.me/6281234567890" });
  });
});
