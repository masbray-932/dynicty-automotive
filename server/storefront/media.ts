import "server-only";

import { getStorageProvider } from "@/services/storage";
import { isCarImageKeyForCar } from "@/services/storage/key";

// Call only with an image projected under an ownership-qualified legacy car.
// This checks legacy key provenance, not authorization to access media bytes.
export function legacyVehicleImageUrl(carId: string, storageKey: string | undefined) {
  if (!storageKey || !isCarImageKeyForCar(storageKey, carId)) return null;
  try {
    return getStorageProvider().publicUrl(storageKey);
  } catch {
    return null;
  }
}
