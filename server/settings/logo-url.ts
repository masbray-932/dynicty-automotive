import "server-only";

import { getStorageProvider } from "@/services/storage";
import { isDealerFaviconKey, isDealerLogoKey } from "@/services/storage/key";

export function legacyDealerLogoUrl(key: string | null | undefined) {
  if (!key || !isDealerLogoKey(key)) return null;
  try { return getStorageProvider().publicUrl(key); } catch { return null; }
}

export function legacyDealerFaviconUrl(key: string | null | undefined) {
  if (!key || !isDealerFaviconKey(key)) return null;
  try { return getStorageProvider().publicUrl(key); } catch { return null; }
}
