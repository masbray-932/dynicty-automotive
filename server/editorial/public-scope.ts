import "server-only";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
export const editorialOwner = { dealerSettingsId: LEGACY_DEALER_SCOPE.dealerId, dealerSettings: { dealerId: null } } as const;
export function publishedEditorialWhere(kind: "service" | "article") {
  return kind === "service"
    ? { ...editorialOwner, status: "PUBLISHED" as const, category: { ...editorialOwner, active: true } }
    : { ...editorialOwner, status: "PUBLISHED" as const, publishedAt: { lte: new Date() } };
}
