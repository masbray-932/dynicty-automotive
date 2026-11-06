import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), transaction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: { $transaction: mocks.transaction } }));

import { allowsPermission } from "@/server/auth/authorization";
import { normalizeDealerHostname } from "@/server/dealer/hostname";
import * as registry from "@/server/dealer/registry";
import { getLegacyPublicDealerScope } from "@/server/dealer/scope";

const canonical = {
  id: "canonical-a", dealerId: "dealer-a", hostname: "dealer-a.example",
  verificationState: "VERIFIED", routingState: "ACTIVE", isCanonical: true,
  bindingVersion: 3, verifiedAt: new Date(0), activatedAt: new Date(0),
};
const alias = {
  ...canonical, id: "alias-a", hostname: "www.dealer-a.example", isCanonical: false, bindingVersion: 2,
};
const dealer = { id: "dealer-a", lifecycle: "ACTIVE", domains: [canonical] };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (read) => read({ dealerDomain: { findMany: mocks.findMany } }));
  mocks.findMany.mockResolvedValue([{ ...alias, dealer }]);
});

describe("dealer hostname normalization", () => {
  it.each([
    ["DEALER.EXAMPLE.", "dealer.example"],
    ["BÜCHER.example", "xn--bcher-kva.example"],
    ["xn--bcher-kva.example", "xn--bcher-kva.example"],
    ["dealer。example", "dealer.example"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeDealerHostname(input)).toBe(expected);
    expect(normalizeDealerHostname(expected)).toBe(expected);
  });

  it.each([
    undefined, {}, "", "example", "dealer.example:443", "https://dealer.example", "dealer.example/path",
    "other@dealer.example", "dealer.example,other.example", " dealer.example", "dealer.example\n",
    "dealer.example..", ".dealer.example", "dealer..example", "*.example", "dealer_name.example",
    "-dealer.example", "dealer-.example", "%64ealer.example", "dealer.example／other",
    "127.0.0.1", "0x7f.1", "[::1]", "dealer.123",
    `${"a".repeat(64)}.example`, Array.from({ length: 4 }, () => "a".repeat(63)).join("."),
  ])("rejects invalid bare-host input %j", (input) => {
    expect(normalizeDealerHostname(input)).toBeNull();
  });
});

describe("read-only registered domain resolution", () => {
  it("resolves a verified alias and returns only the routing projection for its owner", async () => {
    expect(await registry.resolveDealerDomain("WWW.DEALER-A.EXAMPLE.")).toEqual({
      scope: { kind: "registered-dealer", dealerId: "dealer-a" },
      hostname: alias.hostname, canonicalHostname: canonical.hostname, bindingId: alias.id, bindingVersion: 2,
    });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead" });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { hostname: alias.hostname }, take: 2,
      select: expect.objectContaining({
        dealer: { select: {
          id: true, lifecycle: true,
          domains: expect.objectContaining({ where: { isCanonical: true }, take: 2 }),
        } },
      }),
    }));
  });

  it("accepts the canonical binding itself", async () => {
    mocks.findMany.mockResolvedValue([{ ...canonical, dealer }]);
    expect(await registry.resolveDealerDomain(canonical.hostname)).toMatchObject({
      hostname: canonical.hostname, canonicalHostname: canonical.hostname, bindingId: canonical.id,
    });
  });

  it("rejects invalid inputs before any database access", async () => {
    expect(await registry.resolveDealerDomain({ hostname: alias.hostname, dealerId: "dealer-a" })).toBeNull();
    expect(await registry.resolveDealerDomain("https://dealer-a.example")).toBeNull();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects unknown and duplicated host records without choosing a fallback", async () => {
    mocks.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ ...alias, dealer }, { ...alias, dealer }]);
    expect(await registry.resolveDealerDomain("missing.example")).toBeNull();
    expect(await registry.resolveDealerDomain(alias.hostname)).toBeNull();
    expect(getLegacyPublicDealerScope()).toEqual({ kind: "legacy-single-dealer", dealerId: "default" });
  });

  it.each(["PENDING", "SUSPENDED", "ARCHIVED"])("rejects dealer lifecycle %s", async (lifecycle) => {
    mocks.findMany.mockResolvedValue([{ ...alias, dealer: { ...dealer, lifecycle } }]);
    expect(await registry.resolveDealerDomain(alias.hostname)).toBeNull();
  });

  it.each([
    { routingState: "PENDING" }, { routingState: "SUSPENDED" }, { routingState: "RETIRED" },
    { verificationState: "REVOKED" }, { verifiedAt: null }, { activatedAt: null }, { bindingVersion: 0 },
    { hostname: "different.example" },
  ])("rejects a stale or unroutable matched binding %#", async (override) => {
    mocks.findMany.mockResolvedValue([{ ...alias, ...override, dealer }]);
    expect(await registry.resolveDealerDomain(alias.hostname)).toBeNull();
  });

  it.each([
    [], [canonical, { ...canonical, id: "duplicate", hostname: "other.example" }],
    [{ ...canonical, dealerId: "dealer-b" }],
    [{ ...canonical, routingState: "SUSPENDED" }],
    [{ ...canonical, verificationState: "PENDING" }],
    [{ ...canonical, isCanonical: false }],
    [{ ...canonical, hostname: "DEALER-A.EXAMPLE" }],
    [{ ...canonical, id: alias.id }],
  ].map((domains) => ({ domains })))("rejects missing, ambiguous or invalid canonical bindings %#", async ({ domains }) => {
    mocks.findMany.mockResolvedValue([{ ...alias, dealer: { ...dealer, domains } }]);
    expect(await registry.resolveDealerDomain(alias.hostname)).toBeNull();
  });

  it("does not grant platform or other-dealer permissions from a successful lookup", async () => {
    const result = await registry.resolveDealerDomain(alias.hostname);
    const dealerB = { role: "dealer-admin", subjectId: "admin-b", scope: { kind: "registered-dealer", dealerId: "dealer-b" } };
    expect(result).not.toBeNull();
    expect(allowsPermission(dealerB, { permission: "dealer:operate", scope: result?.scope })).toBe(false);
    expect(allowsPermission(dealerB, { permission: "platform:dealer-branding:write", scope: result?.scope })).toBe(false);
    expect(Object.keys(registry)).toEqual(["resolveDealerDomain"]);
  });

  it("propagates database errors rather than resolving another dealer", async () => {
    mocks.findMany.mockRejectedValue(new Error("database unavailable"));
    await expect(registry.resolveDealerDomain(alias.hostname)).rejects.toThrow("database unavailable");
  });
});
