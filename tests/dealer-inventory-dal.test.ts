import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(), auth: vi.fn(), transaction: vi.fn(),
  car: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  brand: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  carModel: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  carImage: { findMany: vi.fn() },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: { ...mocks, $transaction: mocks.transaction } }));
vi.mock("@/server/dealer/registry", () => ({ resolveDealerDomain: mocks.resolve }));
vi.mock("@/server/auth/session", () => ({ requireAdmin: mocks.auth }));

import { legacyInventoryContext, resolveInventoryReadContext, type InventoryContext } from "@/server/inventory/context";
import { getBrandById, getVehicleById, getVehicleBySlug, listBrands, listCarModels, listVehicleImages, listVehicles } from "@/server/inventory/reads";
import { mutateInventory, type InventoryMutation } from "@/server/inventory/mutations";

const legacy = legacyInventoryContext();
const brandId = "cm123456789012345678901234";
const modelId = "cm123456789012345678901235";
const values = {
  condition: "NEW", brandId, modelId, variant: "Sport", year: 2025, price: "125000000",
  transmission: "Auto", fuelType: "Bensin", color: "Putih", mileage: "",
  description: "Deskripsi mobil test", status: "AVAILABLE", featured: false, dealerId: "dealer-b",
};
const demoValues = { ...values, brandId: "demo-brand-toyota", modelId: "demo-model-avanza" };

async function registered() {
  const context = await resolveInventoryReadContext("a.example");
  if (!context) throw new Error("Expected registered test context.");
  return context;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.resolve.mockResolvedValue({ scope: { kind: "registered-dealer", dealerId: "dealer-a" }, bindingId: "binding-a", bindingVersion: 4 });
  mocks.auth.mockResolvedValue({ id: "legacy-admin" });
  mocks.transaction.mockImplementation(async (run) => run(mocks));
  mocks.car.findFirst.mockResolvedValue(null);
  mocks.car.findMany.mockResolvedValue([]);
  mocks.car.count.mockResolvedValue(0);
  mocks.brand.findFirst.mockResolvedValue(null);
  mocks.brand.findMany.mockResolvedValue([]);
  mocks.carImage.findMany.mockResolvedValue([]);
  mocks.carModel.findMany.mockResolvedValue([]);
  mocks.car.updateMany.mockResolvedValue({ count: 0 });
  mocks.car.deleteMany.mockResolvedValue({ count: 0 });
});

describe("inventory context and public-safe query boundary", () => {
  it.each([undefined, null, {}, { kind: "registered-dealer", dealerId: "dealer-a" }, { ...legacy }])(
    "rejects missing or forged context %# before inventory access", async (context) => {
      await expect(listVehicles(context as InventoryContext)).rejects.toThrow("Trusted inventory context required.");
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );

  it("does not use legacy inventory when the registry cannot resolve a hostname", async () => {
    mocks.resolve.mockResolvedValue(null);
    expect(await resolveInventoryReadContext("unknown.example")).toBeNull();
    expect(mocks.transaction).not.toHaveBeenCalled();
    await listVehicles(legacy);
    expect(mocks.car.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { dealerId: null, status: "AVAILABLE", brand: { dealerId: null }, model: { dealerId: null, brand: { dealerId: null } } },
    }));
  });

  it("scopes pagination and count to the same owner, nested ownership and current binding", async () => {
    const context = await registered();
    expect(await listVehicles(context, 2, 10)).toEqual({ total: 0, rows: [] });
    const where = mocks.car.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      dealerId: "dealer-a", status: "AVAILABLE", brand: { dealerId: "dealer-a" },
      model: { dealerId: "dealer-a", brand: { dealerId: "dealer-a" } },
      dealer: { lifecycle: "ACTIVE", AND: [
        { domains: { some: { id: "binding-a", bindingVersion: 4, verificationState: "VERIFIED", routingState: "ACTIVE" } } },
        { domains: { some: { isCanonical: true, verificationState: "VERIFIED", routingState: "ACTIVE" } } },
      ] },
    });
    expect(mocks.car.count).toHaveBeenCalledWith({ where });
    expect(mocks.car.findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 10 });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead" });
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("does not turn foreign IDs or slugs into global or NULL-owner lookups", async () => {
    const context = await registered();
    expect(await getVehicleById(context, "foreign-car")).toBeNull();
    expect(await getVehicleBySlug(context, "foreign-slug")).toBeNull();
    for (const [{ where }] of mocks.car.findFirst.mock.calls) {
      expect(where).toMatchObject({ dealerId: "dealer-a", status: "AVAILABLE" });
      expect(where.OR).toBeUndefined();
    }
    expect(mocks.car.findFirst.mock.calls[0][0].where.id).toBe("foreign-car");
    expect(mocks.car.findFirst.mock.calls[1][0].where.slug).toBe("foreign-slug");
  });

  it("qualifies taxonomy and image relationships and never exposes raw storage keys", async () => {
    const context = await registered();
    await listBrands(context);
    expect(await getBrandById(context, "foreign-brand")).toBeNull();
    expect(await listCarModels(context, "foreign-brand")).toEqual([]);
    expect(await listVehicleImages(context, "foreign-car")).toEqual([]);
    for (const call of [mocks.brand.findMany, mocks.brand.findFirst, mocks.carModel.findMany]) {
      expect(call).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ dealerId: "dealer-a", cars: { some: expect.objectContaining({ dealerId: "dealer-a", status: "AVAILABLE" }) } }),
      }));
    }
    expect(mocks.carImage.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ dealerId: "dealer-a", carId: "foreign-car", car: expect.objectContaining({ dealerId: "dealer-a", status: "AVAILABLE" }) }),
      select: { id: true, sortOrder: true, isPrimary: true },
    }));
  });

  it("rejects invalid inputs instead of allowing Prisma to omit a predicate", async () => {
    await expect(listVehicles(legacy, 0)).rejects.toThrow(RangeError);
    await expect(listVehicleImages(legacy, undefined as unknown as string)).rejects.toThrow(TypeError);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.carImage.findMany).not.toHaveBeenCalled();
  });
});

describe("dormant mutation boundary", () => {
  it.each([
    { kind: "car.create", values }, { kind: "car.update", id: "foreign-car", values },
    { kind: "car.delete", id: "foreign-car" }, { kind: "image.associate", carId: "foreign-car", assetId: "asset" },
    { kind: "image.remove", carId: "foreign-car", imageId: "foreign-image" },
  ] satisfies InventoryMutation[])("denies $kind from a registered domain context before auth or persistence", async (mutation) => {
    await expect(mutateInventory(await registered(), mutation)).rejects.toThrow("Registered dealer inventory writes are unavailable.");
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires the existing admin session at the point of a legacy write", async () => {
    mocks.auth.mockRejectedValue(new Error("unauthorized"));
    await expect(mutateInventory(legacy, { kind: "brand.create", values: { name: "Brand" } })).rejects.toThrow("unauthorized");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("uses scope rather than client-supplied ownership on car create", async () => {
    mocks.carModel.findFirst.mockResolvedValue({ name: "Model", brand: { name: "Brand" } });
    await mutateInventory(legacy, { kind: "car.create", values: demoValues });
    expect(mocks.car.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ dealerId: null, brandId: demoValues.brandId, modelId: demoValues.modelId }),
    }));
  });

  it("rejects foreign brand/model relationships before creating or updating", async () => {
    mocks.carModel.findFirst.mockResolvedValue(null);
    await expect(mutateInventory(legacy, { kind: "car.create", values: demoValues })).rejects.toThrow("Inventory relation not found.");
    await expect(mutateInventory(legacy, { kind: "car.update", id: "foreign-car", values })).rejects.toThrow("Inventory relation not found.");
    expect(mocks.carModel.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { dealerId: null, id: modelId, brandId, brand: { dealerId: null } },
    }));
    expect(mocks.car.create).not.toHaveBeenCalled();
    expect(mocks.car.updateMany).not.toHaveBeenCalled();
  });

  it("keeps owner predicates in the update/delete statements and disallows a media cascade", async () => {
    mocks.carModel.findFirst.mockResolvedValue({ name: "Model", brand: { name: "Brand" } });
    expect(await mutateInventory(legacy, { kind: "car.update", id: "foreign-car", values })).toEqual({ count: 0 });
    expect(await mutateInventory(legacy, { kind: "car.delete", id: "foreign-car" })).toEqual({ count: 0 });
    expect(mocks.car.updateMany.mock.calls[0][0].where).toMatchObject({ id: "foreign-car", dealerId: null });
    expect(mocks.car.updateMany.mock.calls[0][0].data).not.toHaveProperty("dealerId");
    expect(mocks.car.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "foreign-car", dealerId: null, images: { none: {} } }),
    }));
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });

  it("qualifies taxonomy writes and does not reparent a model on rename", async () => {
    await mutateInventory(legacy, { kind: "brand.delete", id: "foreign-brand" });
    await mutateInventory(legacy, { kind: "model.update", id: modelId, values: { brandId, name: "New name", dealerId: "dealer-b" } });
    expect(mocks.brand.deleteMany).toHaveBeenCalledWith({ where: { id: "foreign-brand", dealerId: null } });
    expect(mocks.carModel.updateMany).toHaveBeenCalledWith({
      where: { id: modelId, dealerId: null, brandId, brand: { dealerId: null } },
      data: { name: "New name" },
    });
  });

  it("blocks legacy media mutation contracts before writes", async () => {
    await expect(mutateInventory(legacy, { kind: "image.remove", carId: "car", imageId: "image" })).rejects.toThrow("asset ownership");
    await expect(mutateInventory(legacy, { kind: "image.associate", carId: "car", assetId: "asset" })).rejects.toThrow("asset ownership");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("propagates a serialization conflict and does not retry or issue an unscoped write", async () => {
    const conflict = Object.assign(new Error("serialization failure"), { code: "P2034" });
    mocks.transaction.mockRejectedValue(conflict);
    await expect(mutateInventory(legacy, { kind: "car.delete", id: "car" })).rejects.toBe(conflict);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.car.deleteMany).not.toHaveBeenCalled();
  });
});
