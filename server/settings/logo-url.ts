import "server-only";

import { getStorageProvider } from "@/services/storage";
import { isDealerLogoKey } from "@/services/storage/key";

export function legacyDealerLogoUrl(key: string | null | undefined) {
  if (!key || !isDealerLogoKey(key)) return null;
  try { return getStorageProvider().publicUrl(key); } catch { return null; }
}
