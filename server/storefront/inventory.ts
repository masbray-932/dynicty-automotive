import "server-only";

import type { Prisma } from "@prisma/client";
import type { InventoryContext } from "@/server/inventory/context";
import { requireLegacyStorefront } from "./context";

// Keep presentation projections and filter semantics in their existing
// services. This single boundary supplies the mandatory ownership predicates.
export function legacyStorefrontInventory(context: InventoryContext) {
  requireLegacyStorefront(context);
  const owner = { dealerId: null } as const;
  const car = {
    ...owner,
    status: "AVAILABLE",
    brand: owner,
    model: { ...owner, brand: owner },
  } satisfies Prisma.CarWhereInput;
  const brand = { ...owner, cars: { some: car } } satisfies Prisma.BrandWhereInput;
  const model = { ...owner, brand: owner, cars: { some: car } } satisfies Prisma.CarModelWhereInput;
  // Only used under a scoped parent projection. A NULL-owner car can still
  // have mixed-owner legacy relations during the additive schema expansion.
  const image = owner satisfies Prisma.CarImageWhereInput;
  return { car, brand, model, image };
}
