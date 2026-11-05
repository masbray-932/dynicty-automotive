import "server-only";
import { db } from "@/db/client";
import { getStorageProvider } from "@/services/storage";
import { dealerSettingsSchema, isDealerSettingsField } from "@/validation/dealer-settings";
import { requireAdmin } from "@/server/auth/session";

export const DEALER_SETTINGS_ID = "default";

export async function getAdminDealerSettings() {
  await requireAdmin();
  try {
    const settings = await db.dealerSettings.findUnique({ where: { id: DEALER_SETTINGS_ID } });
    if (!settings) return { kind: "success" as const, settings: null, logoUrl: null };
    let logoUrl: string | null = null;
    if (settings.logoStorageKey) { try { logoUrl = getStorageProvider().publicUrl(settings.logoStorageKey); } catch { logoUrl = null; } }
    return { kind: "success" as const, settings, logoUrl };
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
  return db.dealerSettings.upsert({ where: { id: DEALER_SETTINGS_ID }, create: { id: DEALER_SETTINGS_ID, ...data }, update: data });
}
