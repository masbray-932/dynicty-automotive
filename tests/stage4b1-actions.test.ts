import { beforeEach, describe, expect, it, vi } from "vitest";
import { imageFile } from "./fixtures/images";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), put: vi.fn(), remove: vi.fn(), car: vi.fn(), aggregate: vi.fn(), create: vi.fn(), settings: vi.fn(), refresh: vi.fn(), log: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/server/log", () => ({ logger: { error: mocks.log, warn: mocks.log } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.refresh }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ put: mocks.put, delete: mocks.remove }) }));
vi.mock("@/db/client", () => ({ db: { dealerSettings: { upsert: mocks.settings }, $transaction: async (fn: (tx: unknown) => unknown) => fn({ car: { findUnique: mocks.car }, carImage: { aggregate: mocks.aggregate, create: mocks.create } }) } }));
import { uploadCarImage } from "@/server/cars/service";
import { uploadImageAction } from "@/server/cars/actions";
import { saveDealerSettingsAction } from "@/server/settings/actions";
const empty = { message: "", errors: {} };
const id = "cm123456789012345678901234";
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: "admin" }); mocks.remove.mockResolvedValue(undefined); mocks.car.mockResolvedValue({ id }); mocks.aggregate.mockResolvedValue({ _max: { sortOrder: null }, _count: 0 }); mocks.create.mockResolvedValue({ id: "image" }); });

describe("upload persistence and safe failures", () => {
  it("writes a safe MIME-derived key and creates first cover", async () => {
    await uploadCarImage(id, imageFile("png", "../../IMG..jpg"));
    const input = mocks.put.mock.calls[0][0];
    expect(input.key).not.toContain(".."); expect(input.key).toMatch(/\.png$/);
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ storageKey: input.key, isPrimary: true, sortOrder: 0 }) });
  });
  it("cleans new storage on transaction failure", async () => {
    mocks.create.mockRejectedValue(new Error("DB unavailable"));
    await expect(uploadCarImage(id, imageFile())).rejects.toThrow();
    expect(mocks.remove).toHaveBeenCalledWith(mocks.put.mock.calls[0][0].key);
  });
  it("attempts cleanup of partial put without creating a DB reference", async () => {
    mocks.put.mockRejectedValue(Object.assign(new Error("private absolute path /secret"), { code: "EACCES" }));
    const data = new FormData(); data.set("image", imageFile());
    const result = await uploadImageAction(id, empty, data);
    expect(result.status).toBe("error"); expect(result.errors.image[0]).toContain("belum dapat ditulis");
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.remove).toHaveBeenCalled();
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("/secret");
    expect(mocks.log).toHaveBeenCalledWith("car.image_upload_failed", { carId: id, code: "EACCES" });
  });
  it("does not present a committed upload as failure when revalidation fails", async () => {
    mocks.refresh.mockImplementation(() => { throw new Error("refresh failed"); });
    const data = new FormData(); data.set("image", imageFile());
    expect((await uploadImageAction(id, empty, data)).status).toBe("warning");
    expect(mocks.create).toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  });
});

describe("required showroom address workflow", () => {
  it.each(["", "   "])("rejects %j before settings write", async address => {
    const data = new FormData(); data.set("dealerName", "Dealer"); data.set("address", address);
    const result = await saveDealerSettingsAction(empty, data);
    expect(result.status).toBe("error"); expect(result.errors.address).toContain("Alamat showroom wajib diisi.");
    expect(mocks.settings).not.toHaveBeenCalled();
  });
  it("allows valid address without making optional contacts mandatory", async () => {
    const data = new FormData(); data.set("dealerName", "Dealer"); data.set("address", "  Jalan showroom\nJakarta  ");
    const result = await saveDealerSettingsAction(empty, data);
    expect(result.status).toBe("success");
    expect(mocks.settings).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ address: "Jalan showroom\nJakarta", phone: null }) }));
  });
});
