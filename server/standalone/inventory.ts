import "server-only";

import type { Prisma } from "@prisma/client";

export const standaloneOwner = { dealerId: null } as const;
export const standaloneModel = { ...standaloneOwner, brand: standaloneOwner } satisfies Prisma.CarModelWhereInput;
export const standaloneCar = {
  ...standaloneOwner, brand: standaloneOwner, model: standaloneModel,
} satisfies Prisma.CarWhereInput;
export const standaloneCarImage = { ...standaloneOwner, car: standaloneCar } satisfies Prisma.CarImageWhereInput;
