import "server-only";

import { parseServerEnv } from "./env-schema";

let cachedEnvironment: ReturnType<typeof parseServerEnv> | undefined;

export function getServerEnv() {
  cachedEnvironment ??= parseServerEnv(process.env);
  return cachedEnvironment;
}
