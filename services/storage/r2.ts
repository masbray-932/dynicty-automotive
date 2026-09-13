import "server-only";

import type { StorageProvider } from "./types";

export class R2StorageProvider implements StorageProvider {
  constructor(private readonly publicBaseUrl: string) {}

  publicUrl(key: string) {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  async put(): Promise<never> {
    throw new Error("R2 adapter is reserved for a later phase.");
  }

  async delete(): Promise<never> {
    throw new Error("R2 adapter is reserved for a later phase.");
  }
}
