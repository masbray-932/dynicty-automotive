import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSafeStorageKey } from "./key";
import type { PutObjectInput, StorageProvider } from "./types";

const uploadRoot = path.join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  publicUrl(key: string) {
    assertSafeStorageKey(key);
    return `/uploads/${key}`;
  }

  async put(input: PutObjectInput) {
    assertSafeStorageKey(input.key);
    const destination = path.join(uploadRoot, input.key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, input.body);
    return { key: input.key, publicUrl: this.publicUrl(input.key) };
  }

  async delete(key: string) {
    assertSafeStorageKey(key);
    await rm(path.join(uploadRoot, key), { force: true });
  }
}
