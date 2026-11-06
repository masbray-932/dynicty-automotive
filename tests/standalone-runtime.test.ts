import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), carLookup: vi.fn(), carDelete: vi.fn(), imageDelete: vi.fn(),
  images: vi.fn(), model: vi.fn(), put: vi.fn(), remove: vi.fn(),
  lock: vi.fn(), admins: vi.fn(), createAdmin: vi.fn(), updateAdmin: vi.fn(), removeSessions: vi.fn(),
  hash: vi.fn(), verify: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ put: mocks.put, delete: mocks.remove }) }));
vi.mock("@/server/auth/password", () => ({ hashPassword: mocks.hash, verifyPassword: mocks.verify }));
vi.mock("@/db/client", () => {
  const tx = {
    car: { findUnique: mocks.carLookup, delete: mocks.carDelete },
    carModel: { findFirst: mocks.model },
    carImage: { delete: mocks.imageDelete, findMany: mocks.images },
  };
  return { db: { ...tx, $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } };
});
import type { PrismaClient } from "@prisma/client";
import { bootstrapPrimaryAdmin } from "@/prisma/primary-admin";
import { assertModelBelongsToBrand, deleteCarImage, deleteCarWithMedia, uploadCarImage } from "@/server/cars/service";
import { parseServerEnv } from "@/server/env-schema";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.images.mockResolvedValue([]);
  mocks.hash.mockResolvedValue("bcrypt-digest");
});

const prod = {
  NODE_ENV: "production", DEPLOYMENT_ENV: "production", TRUST_PROXY: "true",
  SESSION_SECRET: "9a280b66343658d529c487ea78ac691a28aa17802855495b", NEXT_PUBLIC_SITE_URL: "https://dealer.example",
  DATABASE_URL: "postgresql://app:example@127.0.0.1/customer", STORAGE_PROVIDER: "local",
};
const legacy = { dealerId: null };
const legacyCar = { ...legacy, brand: legacy, model: { ...legacy, brand: legacy } };

it("requires an explicit production local media opt-in; staging opt-in is not interchangeable", () => {
  expect(() => parseServerEnv({ ...prod, ALLOW_STAGING_LOCAL_STORAGE: "true" })).toThrow(/STORAGE_PROVIDER/);
  expect(parseServerEnv({ ...prod, ALLOW_STANDALONE_LOCAL_STORAGE: "true" }).STORAGE_PROVIDER).toBe("local");
  expect(() => parseServerEnv({ ...prod, DEPLOYMENT_ENV: "staging", ALLOW_STANDALONE_LOCAL_STORAGE: "true" })).toThrow(/STORAGE_PROVIDER/);
});

it.each(["http://dealer.example","https://user:pass@dealer.example","https://dealer.example/shop","https://dealer.example?tenant=1","https://dealer.example/#home"])(
  "rejects a non-origin canonical setting: %s",
  (site) => expect(() => parseServerEnv({ ...prod, ALLOW_STANDALONE_LOCAL_STORAGE: "true", NEXT_PUBLIC_SITE_URL: site })).toThrow(/bare HTTPS origin/),
);

it("denies missing/foreign vehicle upload and delete before storage", async () => {
  mocks.carLookup.mockResolvedValue(null);
  await expect(uploadCarImage("owned", new File(["x"], "x.png", { type: "image/png" }))).rejects.toThrow(/tidak ditemukan/);
  expect(mocks.carLookup.mock.calls[0][0].where).toEqual({ ...legacyCar, id: "owned" });
  expect(await deleteCarWithMedia("owned")).toEqual({ deleted: false, failedKeys: [] });
  expect(mocks.carLookup.mock.calls[1][0].where).toEqual({ ...legacyCar, id: "owned", images: { every: legacy } });
  expect(mocks.put).not.toHaveBeenCalled();
  expect(mocks.carDelete).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
});

it("requires a legacy model and its legacy brand in a submitted relation", async () => {
  await expect(assertModelBelongsToBrand("brand", "foreign-model")).rejects.toThrow(/Model tidak sesuai/);
  expect(mocks.model).toHaveBeenCalledWith(expect.objectContaining({ where: { ...legacy, brand: legacy, id: "foreign-model", brandId: "brand" } }));
});

it("scopes image deletion to the image and parent and never deletes a foreign key in storage", async () => {
  mocks.imageDelete.mockResolvedValue({ isPrimary: false, storageKey: "cars/foreign/cover.png" });
  expect(await deleteCarImage("own", "image")).toEqual({ storageCleanupFailed: true });
  expect(mocks.imageDelete).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "image", carId: "own", ...legacy, car: legacyCar } }));
  expect(mocks.remove).not.toHaveBeenCalled();
});

describe("operator primary admin bootstrap", () => {
  const account = { email: "primary@example.test", password: "fixture-password" };
  const client = {
    $transaction: (fn: (tx: unknown) => unknown) => fn({
      $queryRaw: mocks.lock,
      adminUser: { findMany: mocks.admins, create: mocks.createAdmin, update: mocks.updateAdmin },
      adminSession: { deleteMany: mocks.removeSessions },
    }),
  } as unknown as PrismaClient;
  const current = { id: "admin", email: account.email, passwordHash: "old" };
  it("takes the transaction lock before reading or creating", async () => {
    mocks.admins.mockResolvedValue([]);
    expect(await bootstrapPrimaryAdmin(client, account)).toBe("created");
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.admins.mock.invocationCallOrder[0]);
    expect(mocks.createAdmin).toHaveBeenCalledWith({ data: { email: account.email, passwordHash: "bcrypt-digest" } });
  });
  it.each([[{ ...current, email: "different@example.test" }], [current, { ...current, id: "second" }]])(
    "refuses a different email or multiple accounts",
    async (...accounts) => {
      mocks.admins.mockResolvedValue(accounts);
      await expect(bootstrapPrimaryAdmin(client, account)).rejects.toThrow(/bootstrap refused/);
      expect(mocks.createAdmin).not.toHaveBeenCalled();
      expect(mocks.updateAdmin).not.toHaveBeenCalled();
    },
  );
  it("leaves the same password in place, and revokes sessions when rotating it", async () => {
    mocks.admins.mockResolvedValue([current]);
    mocks.verify.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect(await bootstrapPrimaryAdmin(client, account)).toBe("unchanged");
    expect(mocks.removeSessions).not.toHaveBeenCalled();
    expect(await bootstrapPrimaryAdmin(client, account)).toBe("rotated");
    expect(mocks.updateAdmin).toHaveBeenCalledWith({ where: { id: "admin" }, data: { passwordHash: "bcrypt-digest" } });
    expect(mocks.removeSessions).toHaveBeenCalledWith({ where: { adminId: "admin" } });
  });
});
