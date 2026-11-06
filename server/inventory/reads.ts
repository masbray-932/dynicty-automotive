import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { isValidCarSlug } from "@/features/car-detail/domain";
import { requireInventoryScope, type InventoryContext } from "./context";

type Owner = { dealerId: string | null };
const activeBinding = {
  verificationState: "VERIFIED",
  routingState: "ACTIVE",
  verifiedAt: { not: null },
  activatedAt: { not: null },
} satisfies Prisma.DealerDomainWhereInput;

function ownership(context: InventoryContext) {
  const scope = requireInventoryScope(context);
  if (scope.kind === "legacy-single-dealer") return { dealerId: null };
  // Recheck the binding/version and lifecycle at the actual query. The resolver
  // also requires exactly one canonical binding; the DB index preserves that.
  return {
    dealerId: scope.dealerId,
    dealer: {
      lifecycle: "ACTIVE",
      AND: [
        { domains: { some: { ...activeBinding, id: scope.bindingId, bindingVersion: scope.bindingVersion } } },
        { domains: { some: { ...activeBinding, isCanonical: true } } },
      ],
    },
  } satisfies Prisma.BrandWhereInput;
}

function publishedCar(owner: Owner): Prisma.CarWhereInput {
  const { dealerId } = owner;
  return {
    ...owner,
    status: "AVAILABLE",
    brand: { dealerId },
    model: { dealerId, brand: { dealerId } },
  };
}

const carSummary = {
  id: true, slug: true, brandId: true, modelId: true, condition: true, year: true, variant: true, price: true,
} satisfies Prisma.CarSelect;
const brandSummary = { id: true, name: true, slug: true } satisfies Prisma.BrandSelect;
const modelSummary = { ...brandSummary, brandId: true } satisfies Prisma.CarModelSelect;

function identifier(value: string) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new TypeError("Invalid inventory ID.");
  return value;
}

function pageOptions(page: number, size: number) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 ||
      !Number.isSafeInteger(size) || size < 1 || size > 50) throw new RangeError("Invalid inventory pagination.");
  return { skip: (page - 1) * size, take: size };
}

export async function listVehicles(context: InventoryContext, page = 1, size = 12) {
  const where = publishedCar(ownership(context));
  const pagination = pageOptions(page, size);
  return db.$transaction(async (tx) => {
    const total = await tx.car.count({ where });
    const rows = await tx.car.findMany({
      where, ...pagination, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], select: carSummary,
    });
    return { total, rows };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

async function vehicleDetail(context: InventoryContext, selector: { id: string } | { slug: string }) {
  return db.car.findFirst({
    where: { ...publishedCar(ownership(context)), ...selector },
    select: { ...carSummary, description: true, transmission: true, fuelType: true, color: true, mileage: true },
  });
}

export async function getVehicleById(context: InventoryContext, id: string) {
  return vehicleDetail(context, { id: identifier(id) });
}

export async function getVehicleBySlug(context: InventoryContext, slug: string) {
  if (typeof slug !== "string" || !isValidCarSlug(slug)) throw new TypeError("Invalid vehicle slug.");
  return vehicleDetail(context, { slug });
}

function publishedBrand(context: InventoryContext): Prisma.BrandWhereInput {
  const owner = ownership(context);
  return { ...owner, cars: { some: publishedCar({ dealerId: owner.dealerId }) } };
}

export async function listBrands(context: InventoryContext, page = 1, size = 50) {
  return db.brand.findMany({
    where: publishedBrand(context), ...pageOptions(page, size),
    orderBy: [{ name: "asc" }, { id: "asc" }], select: brandSummary,
  });
}

export async function getBrandById(context: InventoryContext, id: string) {
  return db.brand.findFirst({ where: { ...publishedBrand(context), id: identifier(id) }, select: brandSummary });
}

export async function listCarModels(context: InventoryContext, brandId: string, page = 1, size = 50) {
  const owner = ownership(context);
  const { dealerId } = owner;
  return db.carModel.findMany({
    where: {
      ...owner, brandId: identifier(brandId), brand: { dealerId },
      cars: { some: publishedCar({ dealerId }) },
    },
    ...pageOptions(page, size), orderBy: [{ name: "asc" }, { id: "asc" }], select: modelSummary,
  });
}

export async function listVehicleImages(context: InventoryContext, carId: string, page = 1, size = 50) {
  const owner = ownership(context);
  return db.carImage.findMany({
    where: { ...owner, carId: identifier(carId), car: publishedCar({ dealerId: owner.dealerId }) },
    ...pageOptions(page, size), orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    // Never return an object key or imply permission to fetch the media bytes.
    select: { id: true, sortOrder: true, isPrimary: true },
  });
}
