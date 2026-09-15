import "server-only";

import type { StorageProvider } from "./types";
import { assertSafeStorageKey } from "./key";

export class R2StorageProvider implements StorageProvider {
  constructor(private readonly publicBaseUrl: string) {}

  publicUrl(key: string) {
    assertSafeStorageKey(key);
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  async put(): Promise<never> {
    throw new Error("R2 adapter is reserved for a later phase.");
  }

  async delete(): Promise<never> {
    throw new Error("R2 adapter is reserved for a later phase.");
  }
}
