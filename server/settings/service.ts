import "server-only";
import { db } from "@/db/client";
import { legacyDealerLogoUrl } from "./logo-url";
import { dealerSettingsSchema, isDealerSettingsField } from "@/validation/dealer-settings";
import { requireAdmin } from "@/server/auth/session";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";

export async function getAdminDealerSettings() {
  await requireAdmin();
  try {
    const settings = await db.dealerSettings.findUnique({ where: { id: LEGACY_DEALER_SCOPE.dealerId, AND: [{ dealerId: null }] } });
    if (!settings) return { kind: "success" as const, settings: null, logoUrl: null };
    return { kind: "success" as const, settings, logoUrl: legacyDealerLogoUrl(settings.logoStorageKey) };
  } catch { return { kind: "error" as const }; }
}

export async function upsertDealerSettings(input: unknown) {
  await requireAdmin();
  if (input === null || typeof input !== "object" ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(input)) ||
      Reflect.ownKeys(input).some((key) =>
        !isDealerSettingsField(key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(input, key) ?? {}, "value")
      )) {
    throw new TypeError("Invalid operational dealer settings payload.");
  }

  const { dealerName, phone, whatsappNumber, email, address, googleMapsUrl, instagramUrl, facebookUrl } =
    dealerSettingsSchema.parse(input);
  // Keep create and update limited to operational data, even if the schema changes later.
  const data = { dealerName, phone, whatsappNumber, email, address, googleMapsUrl, instagramUrl, facebookUrl };
  return db.dealerSettings.upsert({ where: { id: LEGACY_DEALER_SCOPE.dealerId, AND: [{ dealerId: null }] }, create: { id: LEGACY_DEALER_SCOPE.dealerId, ...data }, update: data });
}
