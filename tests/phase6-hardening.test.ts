import { describe, expect, it, beforeEach } from "vitest";
import { isSessionExpired } from "@/features/auth/session";
import { buildVehicleStructuredData, serializeJsonLd } from "@/features/car-detail/seo";
import { isCatalogIndexable, parseCatalogFilters } from "@/features/catalog/domain";
import { securityHeaders } from "@/lib/security-headers";
import { isStagingDeployment } from "@/lib/deployment-environment";
import { absoluteSiteUrl, normalizeSiteUrl, safeInternalRedirect } from "@/lib/site-url";
import { clearLoginFailures, loginLimitState, recordLoginFailure, resetLoginLimiterForTests } from "@/server/auth/login-limiter";
import { resolveClientIdentifier } from "@/server/auth/client-ip";
import { parseServerEnv } from "@/server/env-schema";

describe("Phase 6 URL and indexing safety", () => {
  it("activates preview isolation only for explicit staging deployments", () => {
    expect(isStagingDeployment({ DEPLOYMENT_ENV: "staging" })).toBe(true);
    expect(isStagingDeployment({ DEPLOYMENT_ENV: "production" })).toBe(false);
    expect(isStagingDeployment({})).toBe(false);
  });
  it("normalizes canonical bases and builds absolute URLs", () => {
    expect(normalizeSiteUrl("https://dealer.example///")).toBe("https://dealer.example");
    process.env.NEXT_PUBLIC_SITE_URL = "https://dealer.example/";
    expect(absoluteSiteUrl("/cars/test")).toBe("https://dealer.example/cars/test");
  });

  it("allows only same-site redirect paths", () => {
    expect(safeInternalRedirect("/admin/cars?notice=ok")).toBe("/admin/cars?notice=ok");
    expect(safeInternalRedirect("//evil.example/path")).toBe("/admin");
    expect(safeInternalRedirect("https://evil.example")).toBe("/admin");
  });

  it("indexes only the clean catalog root", () => {
    expect(isCatalogIndexable({})).toBe(true);
    expect(isCatalogIndexable({ condition: "USED" })).toBe(false);
    expect(isCatalogIndexable({ unknown: "malformed" })).toBe(false);
    expect(parseCatalogFilters({ page: "1001" }).filters.page).toBe(1);
  });
});

describe("Phase 6 security controls", () => {
  beforeEach(() => resetLoginLimiterForTests());

  it("temporarily blocks repeated failures and can clear a successful key", () => {
    const key = "hashed-client-key";
    for (let count = 0; count < 5; count += 1) recordLoginFailure(key, 1000);
    expect(loginLimitState(key, 1000).allowed).toBe(false);
    expect(loginLimitState(key, 1000 + 5 * 60 * 1000).allowed).toBe(true);
    clearLoginFailures(key);
    expect(loginLimitState(key, 1000).allowed).toBe(true);
  });

  it("emits required production headers", () => {
    const headers = Object.fromEntries(securityHeaders(true).map(({ key, value }) => [key, value]));
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("requires strong production secrets, HTTPS, and durable storage", () => {
    expect(() => parseServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost/dealer",
      SESSION_SECRET: "replace-with-a-secret-that-is-long-but-still-placeholder-value",
      NEXT_PUBLIC_SITE_URL: "http://dealer.example",
      STORAGE_PROVIDER: "local",
    })).toThrow("Invalid server environment");
  });

  it("accepts a complete R2 production configuration", () => {
    expect(parseServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost/dealer",
      SESSION_SECRET: "6f0f8c85b8dc4f758de4e178ae2672f47de92f48a5094d0e",
      NEXT_PUBLIC_SITE_URL: "https://dealer.example",
      STORAGE_PROVIDER: "r2",
      TRUST_PROXY: "true",
      R2_ACCOUNT_ID: "account",
      R2_ACCESS_KEY_ID: "access",
      R2_SECRET_ACCESS_KEY: "private",
      R2_BUCKET_NAME: "media",
      R2_PUBLIC_URL: "https://media.example",
    }).STORAGE_PROVIDER).toBe("r2");
  });

  it("allows local media only for explicitly isolated staging", () => {
    expect(parseServerEnv({
      NODE_ENV: "production",
      DEPLOYMENT_ENV: "staging",
      DATABASE_URL: "postgresql://localhost/dynicty_automotive_staging",
      SESSION_SECRET: "3211b9f437b543e9a460ed27f7668122890a018c447c4bd2",
      NEXT_PUBLIC_SITE_URL: "https://automotive-preview.dynicty.com",
      STORAGE_PROVIDER: "local",
      ALLOW_STAGING_LOCAL_STORAGE: "true",
      TRUST_PROXY: "true",
    }).DEPLOYMENT_ENV).toBe("staging");
  });

  it("uses proxy IP headers only when the trusted topology is enabled", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.2" });
    expect(resolveClientIdentifier(headers, true)).toBe("203.0.113.7");
    expect(resolveClientIdentifier(headers, false)).toBe("direct-client");
  });
});

describe("Phase 6 session and structured data", () => {
  it("treats equal or past session expiry as expired", () => {
    const now = new Date("2026-09-14T00:00:00Z");
    expect(isSessionExpired(new Date("2026-09-14T00:00:00Z"), now)).toBe(true);
    expect(isSessionExpired(new Date("2026-09-14T00:00:01Z"), now)).toBe(false);
  });

  it("builds factual Vehicle JSON-LD without unsupported claims", () => {
    const data = buildVehicleStructuredData({
      title: "Toyota Avanza G 2024", description: "Unit tersedia.", condition: "USED", brand: "Toyota", model: "Avanza",
      year: 2024, price: "250000000", transmission: "Automatic", fuelType: "Bensin", mileage: 12000,
      images: ["https://media.example/car.webp"], url: "https://dealer.example/cars/avanza",
    });
    const serialized = JSON.stringify(data);
    expect(serialized).toContain("InStock");
    expect(serialized).not.toMatch(/rating|review|warranty|financ/i);
  });

  it("escapes markup in JSON-LD serialization", () => {
    expect(serializeJsonLd({ name: "</script><script>" })).not.toContain("</script>");
  });
});
