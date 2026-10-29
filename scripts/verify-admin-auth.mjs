// Run against an isolated production-mode staging server; never follows redirects.
// Optional AUTH_TEST_COOKIE is a staging-only cookie header, never printed.
// Optional AUTH_TEST_PRIVATE_MARKER must be a unique seeded private-data canary.
// Optional AUTH_TEST_CAR_ID selects an existing staging car for authenticated edit QA.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
// Match the pinned Next version's client request contract instead of bypassing
// its RSC header validation. This is test tooling, not application runtime code.
const { computeCacheBustingSearchParam } = createRequire(import.meta.url)("next/dist/shared/lib/router/utils/cache-busting-search-param.js");

const base = new URL(process.env.AUTH_TEST_BASE_URL || "http://127.0.0.1:3101");
assert(["http:", "https:"].includes(base.protocol));
assert(!base.username && !base.password && base.pathname === "/");
const cookie = process.env.AUTH_TEST_COOKIE;
const marker = process.env.AUTH_TEST_PRIVATE_MARKER;
const carId = encodeURIComponent(process.env.AUTH_TEST_CAR_ID || "auth-probe-missing-car");
const routes = [
  ["/admin", "Total Mobil"],
  ["/admin/brands", "Merek &"],
  ["/admin/cars", "Kelola Mobil"],
  ["/admin/cars/new", "Lengkapi data kendaraan"],
  [`/admin/cars/${carId}/edit`, "Gambar Mobil"],
  ["/admin/settings", "Pengaturan Dealer"],
  ["/admin/content", "Konten Website"],
];
const forbidden = [
  "Total Mobil", "Ringkasan inventori dealer terbaru", "Mobil Terakhir Diperbarui",
  "kendaraan ditemukan", "Lengkapi data kendaraan", "Gambar Mobil",
  "Kelola identitas, kontak, logo", "Isi hanya informasi dealer yang benar",
  "Tambah merek", ...(marker ? [marker] : []),
];
const modes = [
  ["HTML", { Accept: "text/html" }],
  ["RSC", { RSC: "1", Accept: "text/x-component" }],
  ["RSC-prefetch", { RSC: "1", "Next-Router-Prefetch": "1", Accept: "text/x-component" }],
];
let passed = 0;
for (const [path, expected] of routes) {
  for (const [mode, headers] of modes) {
    for (const authenticated of cookie ? [false, true] : [false]) {
      const requestUrl = new URL(path, base);
      if (mode !== "HTML") {
        const hash = await computeCacheBustingSearchParam(headers["Next-Router-Prefetch"], undefined, undefined, undefined);
        requestUrl.search = hash ? `?_rsc=${hash}` : "?_rsc";
      }
      // Read the entire stream, including late React flight chunks after a shell redirect.
      let response;
      let body = "";
      let currentUrl = requestUrl;
      for (let hop = 0; hop < 4; hop++) {
        response = await fetch(currentUrl, {
          headers: { ...headers, ...(authenticated ? { Cookie: cookie } : {}) },
          redirect: "manual", signal: AbortSignal.timeout(30000),
        });
        const decoder = new TextDecoder();
        if (response.body) for await (const chunk of response.body) body += decoder.decode(chunk, { stream: true });
        body += decoder.decode();
        const location = response.headers.get("location");
        const next = location ? new URL(location, base) : null;
        // Next 16 normalizes its RSC cache key before rendering. Follow only that
        // same-resource normalization, retaining all bodies for leakage checks.
        if (mode !== "HTML" && response.status === 307 && next?.origin === base.origin
          && next.pathname === requestUrl.pathname && next.searchParams.has("_rsc")) {
          assert(hop < 3, `${mode} ${path}: RSC normalization loop`);
          currentUrl = next;
          continue;
        }
        break;
      }
      if (mode !== "HTML" && response.status === 200) {
        assert(response.headers.get("content-type")?.includes("text/x-component"), `${mode} ${path}: not an RSC response`);
      }
      // Dynamic routes may return only their public shell on prefetch. A shell
      // proves absence of private data, not authenticated page rendering.
      const prefetchShell = mode === "RSC-prefetch" && response.status === 200
        && body.includes('"f":') && body.includes('"children":null');
      if (authenticated) {
        assert.equal(response.status, 200, `${mode} ${path}: authenticated request failed`);
        assert(!body.includes("NEXT_REDIRECT"), `${mode} ${path}: authenticated redirect`);
        assert(prefetchShell || body.includes(expected), `${mode} ${path}: protected content missing`);
      } else {
        const target = response.headers.get("location") || "";
        const redirected = (response.status >= 300 && response.status < 400 && new URL(target, base).pathname === "/admin/login")
          || (body.includes("NEXT_REDIRECT") && body.includes("/admin/login"));
        assert(redirected || prefetchShell, `${mode} ${path}: login redirect or deferred shell missing`);
        for (const text of forbidden) assert(!body.includes(text), `${mode} ${path}: protected content leaked`);
      }
      passed++;
      console.log(`PASS ${authenticated ? "authenticated" : "anonymous"} ${mode} ${path}`);
    }
  }
}
console.log(`${passed} response-body checks passed. Authenticated runtime: ${cookie ? "VERIFIED" : "NOT VERIFIED (no staging cookie supplied)"}.`);
