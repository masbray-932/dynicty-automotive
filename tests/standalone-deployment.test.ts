import { afterEach, beforeEach, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const renderScript = resolve("deploy/standalone/render.mjs");
const preflightScript = resolve("deploy/standalone/preflight.mjs");
let dir: string;

beforeEach(() => { dir = mkdtempSync(join(realpathSync(tmpdir()), "automotive-deploy-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function render(id: string, hostname: string, port: string, output: string, extra: string[] = []) {
  return spawnSync(process.execPath, [renderScript, "--id", id, "--hostname", hostname, "--port", port, "--output", output,
    "--tls-cert", "/etc/tls/public.pem", "--tls-key", "/etc/tls/private.pem", ...extra], { encoding: "utf8" });
}

it("renders two isolated installations without installing files or materializing secrets", () => {
  const a = join(dir, "a");
  const b = join(dir, "b");
  expect(render("customer-a", "cars.a.example", "3107", a).status).toBe(0);
  expect(render("customer-b", "cars.b.example", "3108", b).status).toBe(0);
  for (const [target, id, db, host, port] of [[a, "customer-a", "auto_customer_a", "cars.a.example", "3107"], [b, "customer-b", "auto_customer_b", "cars.b.example", "3108"]]) {
    const unit = readFileSync(join(target, `automotive-${id}.service`), "utf8");
    const proxy = readFileSync(join(target, `automotive-${id}.conf`), "utf8");
    const env = readFileSync(join(target, "runtime.env.example"), "utf8");
    expect(unit).toContain(`User=auto-${id}\nGroup=auto-${id}`);
    expect(unit).toContain(`EnvironmentFile=/etc/automotive/${id}/runtime.env`);
    expect(unit).toContain(`start -H 127.0.0.1 -p ${port}`);
    expect(proxy).toContain(`alias /var/lib/automotive/${id}/uploads/;`);
    expect(proxy).toContain(`proxy_set_header X-Forwarded-Host ${host};`);
    expect(proxy).toContain("proxy_set_header X-Forwarded-For $remote_addr;");
    expect(proxy).toContain("disable_symlinks on;");
    expect(proxy).toContain("client_max_body_size 12m;");
    expect(env).toContain(`NEXT_PUBLIC_SITE_URL=https://${host}`);
    expect(env).toContain(`postgresql://${db}:REPLACE_URL_ENCODED_PASSWORD`);
    expect(env).toContain("SESSION_SECRET=REPLACE_WITH_INDEPENDENT_RANDOM_SECRET");
    expect(env).not.toMatch(/^ADMIN_(EMAIL|PASSWORD)=/m);
    expect(readFileSync(join(target, "default-reject.conf"), "utf8")).toContain("ssl_reject_handshake on;");
  }
  expect(render("customer-a", "cars.a.example", "3107", a).status).toBe(1);
});

it.each([
  ["bad_id", "cars.a.example", "3107", []],
  ["alpha\n", "cars.a.example", "3107", []],
  ["alpha", "*.a.example", "3107", []],
  ["alpha", "cars.a.example\n", "3107", []],
  ["alpha", "cars.a.example", "80", []],
  ["alpha", "cars.a.example", "3107", ["--release-base", "/srv/path\n"]],
  ["alpha", "cars.a.example", "3107", ["--release-base", "/srv", "--state-base", "/srv/child"]],
  ["alpha", "cars.a.example", "3107", ["--node-bin", "/usr/bin/node;bad"]],
] as const)("rejects unsafe or overlapping template input %#", (id, host, port, flags) => {
  expect(render(id, host, port, join(dir, "rendered"), [...flags]).status).toBe(1);
});

function preflight(env: Record<string, string | undefined> = {}, linkToOther = false) {
  const app = join(dir, "app");
  const media = join(dir, "media");
  const other = join(dir, "other");
  for (const path of [join(app, "public"), media, other]) mkdirSync(path, { recursive: true });
  symlinkSync(linkToOther ? other : media, join(app, "public/uploads"));
  return spawnSync(process.execPath, [preflightScript, "cars.a.example", "auto_alpha", media], {
    cwd: app, encoding: "utf8", env: {
      NODE_ENV: "production", DEPLOYMENT_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://cars.a.example",
      DATABASE_URL: "postgresql://auto_alpha:a-test-value@127.0.0.1:5432/auto_alpha",
      SESSION_SECRET: "1".repeat(64), STORAGE_PROVIDER: "local", ALLOW_STANDALONE_LOCAL_STORAGE: "true",
      TRUST_PROXY: "true", ...env,
    },
  });
}

it("accepts a valid production environment and dedicated media link", () => {
  expect(preflight().status).toBe(0);
});

it.each([
  { NEXT_PUBLIC_SITE_URL: "https://cars.b.example" },
  { DATABASE_URL: "postgresql://auto_bravo:DO-NOT-PRINT@127.0.0.1:5432/auto_bravo" },
  { DATABASE_URL: "postgresql://auto_alpha:DO-NOT-PRINT@127.0.0.1:5432/auto_alpha?host=other" },
  { ADMIN_PASSWORD: "DO-NOT-PRINT" },
  { ALLOW_STANDALONE_LOCAL_STORAGE: "false" },
])("fails startup on unsafe runtime input without printing secrets", env => {
  const result = preflight(env);
  expect(result.status).toBe(1);
  expect(result.stderr).not.toContain("DO-NOT-PRINT");
});

it("refuses a cross-installation uploads symlink", () => {
  expect(preflight({}, true).status).toBe(1);
});
