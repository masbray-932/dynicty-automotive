import { constants } from "node:fs";
import { access, realpath, stat } from "node:fs/promises";
import { parseServerEnv } from "../../server/env-schema.ts";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const [hostname, database, media, ...extra] = process.argv.slice(2);
  check(hostname && database && media && !extra.length, "Expected hostname, dedicated database/role name and media root.");
  const env = parseServerEnv(process.env);
  check(env.NODE_ENV === "production" && env.DEPLOYMENT_ENV === "production", "Expected standalone production environment.");
  check(env.NEXT_PUBLIC_SITE_URL === `https://${hostname}`, "Canonical origin does not match the installation hostname.");
  check(env.STORAGE_PROVIDER === "local" && env.ALLOW_STANDALONE_LOCAL_STORAGE === "true" && env.TRUST_PROXY === "true",
    "Expected explicitly opted-in local storage and trusted private proxy.");
  check(!["ADMIN_EMAIL", "ADMIN_PASSWORD", "STAGING_ADMIN_EMAIL", "STAGING_ADMIN_PASSWORD"].some(key => Object.hasOwn(process.env, key)),
    "Admin bootstrap credentials must not be in the runtime environment.");
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error("Invalid PostgreSQL connection URL."); }
  check(["postgresql:", "postgres:"].includes(url.protocol) && url.hostname && url.username === database &&
    url.password && !/replace|placeholder/i.test(url.password) && url.pathname === `/${database}` && !url.hash &&
    !url.searchParams.has("host") && !url.searchParams.has("socket") &&
    (url.searchParams.get("schema") ?? "public") === "public",
  "Database URL must identify the installation's dedicated PostgreSQL database and runtime login.");
  check(await realpath(media) === media && await realpath("public/uploads") === media && (await stat(media)).isDirectory(),
    "public/uploads must resolve to the installation's dedicated physical media directory.");
  await access(media, constants.R_OK | constants.W_OK | constants.X_OK);
  console.info("Standalone environment and media link validated.");
} catch (error) {
  // URL parse and I/O errors can contain input or paths. Do not print them.
  console.error(`Standalone preflight failed: ${error.code ? "required path or permissions are invalid" : error.message}`);
  process.exitCode = 1;
}
