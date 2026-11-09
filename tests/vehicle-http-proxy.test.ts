import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "@/next.config";

const publication = vi.hoisted(() => vi.fn());
vi.mock("@/server/storefront/vehicle-publication-gate", () => ({ resolveLegacyVehiclePublication: publication }));

import { config, proxy } from "@/proxy";

describe("vehicle detail pre-stream proxy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("matches only public vehicle detail routes", () => {
    expect(config.matcher).toBe("/cars/:slug");
    expect(nextConfig.skipProxyUrlNormalize).toBe(true);
  });

  it.each(["GET", "HEAD"])("returns an actual 404 rewrite for excluded %s requests", async method => {
    publication.mockResolvedValueOnce("not-found");
    const result = await proxy(new NextRequest("https://configured.example/cars/excluded?q=ignored", { method }));
    expect(result.status).toBe(404);
    expect(result.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(result.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(result.headers.get("x-middleware-rewrite")).toBe(method === "HEAD" ? null : "https://configured.example/_not-found");
    expect(publication).toHaveBeenCalledExactlyOnceWith("excluded");
  });

  it("returns a bodyless RSC 404 without fabricating a Flight payload", async () => {
    publication.mockResolvedValueOnce("not-found");
    const result = await proxy(new NextRequest("https://configured.example/cars/excluded", { headers: { RSC: "1" } }));
    expect(result.status).toBe(404);
    expect(result.headers.get("x-middleware-rewrite")).toBeNull();
    expect(await result.text()).toBe("");
  });

  it.each(["available", "error"])("preserves page handling for %s without caching the gate", async outcome => {
    publication.mockResolvedValueOnce(outcome);
    const result = await proxy(new NextRequest("https://configured.example/cars/example"));
    expect(result.headers.get("x-middleware-next")).toBe("1");
    expect(result.headers.get("cache-control")).toBeNull();
  });

  it("does not intercept mutation requests", async () => {
    const result = await proxy(new NextRequest("https://configured.example/cars/example", { method: "POST" }));
    expect(result.headers.get("x-middleware-next")).toBe("1");
    expect(publication).not.toHaveBeenCalled();
  });
});
