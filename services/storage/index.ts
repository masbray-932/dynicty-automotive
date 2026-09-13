import "server-only";

import { getServerEnv } from "@/server/env";
import { LocalStorageProvider } from "./local";
import { R2StorageProvider } from "./r2";

export function getStorageProvider() {
  const environment = getServerEnv();
  return environment.STORAGE_PROVIDER === "r2"
    ? new R2StorageProvider(environment.R2_PUBLIC_URL ?? "")
    : new LocalStorageProvider();
}
