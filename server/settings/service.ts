import "server-only";
import { db } from "@/db/client";
import { getStorageProvider } from "@/services/storage";
import { createDealerLogoKey } from "@/services/storage/key";
import type { DealerSettingsValues } from "@/validation/dealer-settings";

export const DEALER_SETTINGS_ID = "default";

export async function getAdminDealerSettings() {
  try {
    const settings = await db.dealerSettings.findUnique({ where: { id: DEALER_SETTINGS_ID } });
    if (!settings) return { kind: "success" as const, settings: null, logoUrl: null };
    let logoUrl: string | null = null;
    if (settings.logoStorageKey) { try { logoUrl = getStorageProvider().publicUrl(settings.logoStorageKey); } catch { logoUrl = null; } }
    return { kind: "success" as const, settings, logoUrl };
  } catch { return { kind: "error" as const }; }
}

export function upsertDealerSettings(values: DealerSettingsValues) {
  return db.dealerSettings.upsert({ where: { id: DEALER_SETTINGS_ID }, create: { id: DEALER_SETTINGS_ID, ...values }, update: values });
}

export async function replaceDealerLogo(file: File) {
  const storage = getStorageProvider();
  const key = createDealerLogoKey(file.name);
  await storage.put({ key, body: new Uint8Array(await file.arrayBuffer()), contentType: file.type });
  let oldKey: string | null = null;
  try {
    const updated = await db.$transaction(async (transaction) => {
      const existing = await transaction.dealerSettings.findUnique({ where: { id: DEALER_SETTINGS_ID }, select: { logoStorageKey: true } });
      oldKey = existing?.logoStorageKey ?? null;
      return transaction.dealerSettings.upsert({ where: { id: DEALER_SETTINGS_ID }, create: { id: DEALER_SETTINGS_ID, logoStorageKey: key }, update: { logoStorageKey: key }, select: { logoStorageKey: true } });
    });
    if (oldKey) await storage.delete(oldKey).catch(() => undefined);
    return updated;
  } catch (error) {
    await storage.delete(key).catch(() => undefined);
    throw error;
  }
}

export async function removeDealerLogo() {
  const settings = await db.dealerSettings.findUnique({ where: { id: DEALER_SETTINGS_ID }, select: { logoStorageKey: true } });
  if (!settings?.logoStorageKey) return { cleanupFailed: false };
  await db.dealerSettings.update({ where: { id: DEALER_SETTINGS_ID }, data: { logoStorageKey: null } });
  try { await getStorageProvider().delete(settings.logoStorageKey); return { cleanupFailed: false }; } catch { return { cleanupFailed: true }; }
}
