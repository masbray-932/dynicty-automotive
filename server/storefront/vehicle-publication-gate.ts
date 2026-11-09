import "server-only";

import { db } from "@/db/client";
import { isValidCarSlug } from "@/features/car-detail/domain";
import { logger } from "@/server/log";
import { legacyStorefrontContext } from "@/server/storefront/context";
import { legacyStorefrontInventory } from "@/server/storefront/inventory";

export type VehiclePublicationGateResult = "available" | "not-found" | "error";

/**
 * A deliberately small pre-render query used only by the public detail-route
 * proxy. Next.js may stream the public layout before a page-level notFound()
 * runs, so this gate is the transport-status boundary for excluded inventory.
 */
export async function resolveLegacyVehiclePublication(slug: string): Promise<VehiclePublicationGateResult> {
  if (!isValidCarSlug(slug)) return "not-found";

  try {
    const scope = legacyStorefrontInventory(legacyStorefrontContext);
    const car = await db.car.findFirst({
      where: { ...scope.car, slug },
      select: { id: true },
    });
    return car ? "available" : "not-found";
  } catch {
    logger.error("public.vehicle_publication_gate_failed");
    return "error";
  }
}
