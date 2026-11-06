import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { slugify } from "@/features/cars/domain";
import { requireAdmin } from "@/server/auth/session";
import { carFormSchema, parseMileage, parsePrice } from "@/validation/car";
import { brandSchema, carModelSchema } from "@/validation/master-data";
import { requireInventoryScope, type InventoryContext } from "./context";

export type InventoryMutation =
  | { kind: "car.create"; values: unknown }
  | { kind: "car.update"; id: string; values: unknown }
  | { kind: "car.delete"; id: string }
  | { kind: "brand.create"; values: unknown }
  | { kind: "brand.update"; id: string; values: unknown }
  | { kind: "brand.delete"; id: string }
  | { kind: "model.create"; values: unknown }
  | { kind: "model.update"; id: string; values: unknown }
  | { kind: "model.delete"; id: string }
  | { kind: "image.associate"; carId: string; assetId: string }
  | { kind: "image.remove"; carId: string; imageId: string };

function identifier(value: string) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new TypeError("Invalid inventory ID.");
  return value;
}

function checkedSlug(value: string) {
  const slug = slugify(value).slice(0, 120).replace(/-+$/, "");
  if (!slug) throw new TypeError("Invalid inventory name.");
  return slug;
}

const legacyOwner = { dealerId: null } as const;
const legacyCar = {
  ...legacyOwner,
  brand: legacyOwner,
  model: { ...legacyOwner, brand: legacyOwner },
} satisfies Prisma.CarWhereInput;

async function vehicleData(tx: Prisma.TransactionClient, input: unknown) {
  const parsed = carFormSchema.parse(input);
  const { brandId, modelId, price, mileage, ...fields } = parsed;
  const model = await tx.carModel.findFirst({
    where: { ...legacyOwner, id: modelId, brandId, brand: legacyOwner },
    select: { name: true, brand: { select: { name: true } } },
  });
  if (!model) throw new Error("Inventory relation not found.");
  return {
    fields: { ...fields, brandId, modelId, price: new Prisma.Decimal(parsePrice(price)), mileage: parseMileage(mileage) },
    label: `${model.brand.name}-${model.name}-${fields.variant}-${fields.year}`,
  };
}

// Dormant internal contract. Registered contexts are public selectors only.
// Legacy writes still authenticate at execution time and can touch NULL rows only.
export async function mutateInventory(context: InventoryContext, mutation: InventoryMutation) {
  if (requireInventoryScope(context).kind !== "legacy-single-dealer") {
    throw new Error("Registered dealer inventory writes are unavailable.");
  }
  await requireAdmin();
  if (mutation.kind === "image.associate" || mutation.kind === "image.remove") {
    // Raw storage keys cannot prove asset ownership, and no cleanup outbox exists.
    throw new Error("Scoped media mutations require an asset ownership and cleanup workflow.");
  }

  // Legacy nullable relationships need application checks in the same
  // transaction. Do not retry serialization failures or global unique conflicts
  // automatically. No storage side effects are performed in this transaction.
  return db.$transaction(async (tx) => {
    switch (mutation.kind) {
      case "car.create": {
        const { fields, label } = await vehicleData(tx, mutation.values);
        return tx.car.create({ data: { ...fields, ...legacyOwner, slug: checkedSlug(label) }, select: { id: true } });
      }
      case "car.update": {
        const id = identifier(mutation.id);
        const { fields } = await vehicleData(tx, mutation.values);
        return tx.car.updateMany({ where: { ...legacyCar, id }, data: fields });
      }
      case "car.delete":
        // A media-bearing car requires the future coordinated cleanup workflow.
        return tx.car.deleteMany({ where: { ...legacyCar, id: identifier(mutation.id), images: { none: {} } } });
      case "brand.create": {
        const { name } = brandSchema.parse(mutation.values);
        return tx.brand.create({ data: { ...legacyOwner, name, slug: checkedSlug(name) }, select: { id: true } });
      }
      case "brand.update": {
        const { name } = brandSchema.parse(mutation.values);
        return tx.brand.updateMany({ where: { ...legacyOwner, id: identifier(mutation.id) }, data: { name } });
      }
      case "brand.delete":
        return tx.brand.deleteMany({ where: { ...legacyOwner, id: identifier(mutation.id) } });
      case "model.create": {
        const { name, brandId } = carModelSchema.parse(mutation.values);
        const brand = await tx.brand.findFirst({ where: { ...legacyOwner, id: brandId }, select: { id: true } });
        if (!brand) throw new Error("Inventory relation not found.");
        return tx.carModel.create({ data: { ...legacyOwner, name, brandId: brand.id, slug: checkedSlug(name) }, select: { id: true } });
      }
      case "model.update": {
        // The existing parent is a predicate, not a writable field.
        const { name, brandId } = carModelSchema.parse(mutation.values);
        return tx.carModel.updateMany({
          where: { ...legacyOwner, id: identifier(mutation.id), brandId, brand: legacyOwner }, data: { name },
        });
      }
      case "model.delete":
        return tx.carModel.deleteMany({ where: { ...legacyOwner, id: identifier(mutation.id), brand: legacyOwner } });
      default:
        throw new TypeError("Unknown inventory mutation.");
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
