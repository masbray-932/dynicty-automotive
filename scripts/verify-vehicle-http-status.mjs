// Read-only integration check against an operator-provided disposable fixture.
// No fixture creation and no database access. Never use customer data for QA.
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { computeCacheBustingSearchParam } = createRequire(import.meta.url)("next/dist/shared/lib/router/utils/cache-busting-search-param.js");
const base = new URL(process.env.VEHICLE_HTTP_BASE_URL || "http://127.0.0.1:3101");
assert(["http:", "https:"].includes(base.protocol) && !base.username && !base.password && base.pathname === "/");
const cases = [
  ["AVAILABLE", process.env.VEHICLE_HTTP_AVAILABLE_SLUG, 200],
  ["unknown", process.env.VEHICLE_HTTP_UNKNOWN_SLUG, 404],
  ["DRAFT", process.env.VEHICLE_HTTP_DRAFT_SLUG, 404],
  ["SOLD", process.env.VEHICLE_HTTP_SOLD_SLUG, 404],
  ["registered", process.env.VEHICLE_HTTP_REGISTERED_SLUG, 404],
  ["mixed-ownership", process.env.VEHICLE_HTTP_MIXED_SLUG, 404],
];
for (const [label, slug] of cases) assert(typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), `Supply a valid fixture slug for ${label}`);
let passed = 0;
for (const [label, slug, expectedStatus] of cases) {
  for (const [mode, headers] of [
    ["HTML", { Accept: "text/html" }],
    ["RSC", { RSC: "1", Accept: "text/x-component" }],
    ["HEAD", {}],
  ]) {
    const url = new URL(`/cars/${slug}`, base);
    if (mode === "RSC") {
      const hash = await computeCacheBustingSearchParam(undefined, undefined, undefined, undefined);
      url.search = hash ? `?_rsc=${hash}` : "?_rsc";
    }
    const response = await fetch(url, { method: mode === "HEAD" ? "HEAD" : "GET", headers, redirect: "manual", signal: AbortSignal.timeout(30000) });
    const body = await response.text();
    assert.equal(response.status, expectedStatus, `${mode} ${label}: wrong transport status`);
    if (expectedStatus === 404) {
      assert.match(response.headers.get("cache-control") || "", /no-store/, `${label}: negative result can be cached`);
      assert.match(response.headers.get("x-robots-tag") || "", /noindex/, `${label}: missing header noindex`);
    }
    if (expectedStatus === 404 && mode === "HTML") assert.match(body, /noindex/, `${label}: missing noindex`);
    if (expectedStatus === 404 && mode !== "HEAD") {
      assert(!body.includes('"@type":"Vehicle"'), `${label}: vehicle JSON-LD leaked`);
      const marker = process.env.VEHICLE_HTTP_PRIVATE_MARKER;
      if (marker) assert(!body.includes(marker), `${label}: private fixture marker leaked`);
    }
    console.log(`PASS ${mode} ${label}: ${response.status}`);
    passed++;
  }
}
console.log(`${passed} real HTTP status/body checks passed.`);
