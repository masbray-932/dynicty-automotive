import "server-only";

import { getSiteUrl } from "@/lib/site-url";
import { legacyInventoryContext, requireInventoryScope, type InventoryContext } from "@/server/inventory/context";

type StorefrontContextKind = "legacy" | "verified-registered-disabled" | "unknown-host" | "untrusted";

// Existing routes select this explicitly; it is never derived from request headers.
export const legacyStorefrontContext = legacyInventoryContext();

export function classifyStorefrontContext(context: unknown): StorefrontContextKind {
  // Null is the registry's unresolved (unknown, invalid, or revoked) result.
  if (context === null) return "unknown-host";
  try {
    const scope = requireInventoryScope(context as InventoryContext);
    return scope.kind === "legacy-single-dealer" ? "legacy" : "verified-registered-disabled";
  } catch {
    return "untrusted";
  }
}

export function requireLegacyStorefront(context: unknown): void {
  if (classifyStorefrontContext(context) !== "legacy") {
    throw new Error("Storefront context is not enabled.");
  }
}

// Registered origins remain unavailable until a trusted ingress and routing
// boundary exist. Legacy metadata continues to use deployment configuration.
export function getStorefrontSiteUrl(context: InventoryContext) {
  requireLegacyStorefront(context);
  return getSiteUrl();
}
