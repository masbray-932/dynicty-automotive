import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), transaction: vi.fn(), ownerUpsert: vi.fn(), lock: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), publicUrl: vi.fn(), deleteObject: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ publicUrl: mocks.publicUrl, delete: mocks.deleteObject }) }));
vi.mock("@/db/client", () => ({ db: {
  $transaction: mocks.transaction,
  salesTeamMember: { findFirst: mocks.findFirst, delete: mocks.remove, count: mocks.count },
} }));
import { deleteSalesTeamMember, SalesTeamError, saveSalesTeamMember } from "@/server/sales-team/service";

const tx = { dealerSettings: { upsert: mocks.ownerUpsert }, $queryRaw: mocks.lock, salesTeamMember: { findFirst: mocks.findFirst, count: mocks.count, create: mocks.create, update: mocks.update } };
const base = { fullName: "Ayu Sales", title: "Sales Consultant", whatsappNumber: "0812-3456-7890", biography: "Siap membantu.", active: true, sortOrder: 2 };

beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id: "admin" }); mocks.lock.mockResolvedValue([{ id: "default" }]);
  mocks.transaction.mockImplementation(async (run: (client: typeof tx) => unknown) => run(tx)); mocks.count.mockResolvedValue(0);
});

describe("Sales Team CRUD boundaries", () => {
  it("creates an owner-qualified profile with canonical WhatsApp and no login identity", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await saveSalesTeamMember(base)).toEqual({ cleanupFailed: false });
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ dealerSettingsId: "default", fullName: "Ayu Sales", whatsappNumber: "6281234567890", active: true, sortOrder: 2 }) });
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty("passwordHash");
  });

  it("rejects an edit when the ID is outside the owner boundary", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(saveSalesTeamMember({ ...base, id: "cl12345678901234567890123" })).rejects.toBeInstanceOf(SalesTeamError);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates only the owner-qualified compound key", async () => {
    mocks.findFirst.mockResolvedValue({ id: "cl12345678901234567890123", imageStorageKey: null });
    await saveSalesTeamMember({ ...base, id: "cl12345678901234567890123", active: false });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { dealerSettingsId: "default", id: "cl12345678901234567890123" }, data: expect.objectContaining({ active: false }) }));
  });

  it("deletes only a matching owner-qualified profile", async () => {
    mocks.findFirst.mockResolvedValue({ id: "cl12345678901234567890123", imageStorageKey: null });
    expect(await deleteSalesTeamMember("cl12345678901234567890123")).toEqual({ cleanupFailed: false });
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { dealerSettingsId: "default", dealerSettings: { dealerId: null }, id: "cl12345678901234567890123" } });
    expect(mocks.remove).toHaveBeenCalledWith({ where: { dealerSettingsId: "default", id: "cl12345678901234567890123" } });
  });
});
