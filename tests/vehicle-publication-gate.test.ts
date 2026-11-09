import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), loggerError: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: { car: { findFirst: mocks.findFirst } } }));
vi.mock("@/server/log", () => ({ logger: { error: mocks.loggerError } }));

import { resolveLegacyVehiclePublication } from "@/server/storefront/vehicle-publication-gate";

describe("vehicle publication gate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows only an AVAILABLE vehicle fully owned by the legacy scope", async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: "legacy-car" });
    await expect(resolveLegacyVehiclePublication("legacy-car")).resolves.toBe("available");
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        dealerId: null,
        status: "AVAILABLE",
        brand: { dealerId: null },
        model: { dealerId: null, brand: { dealerId: null } },
        slug: "legacy-car",
      },
      select: { id: true },
    });
  });

  it("rejects unknown, unavailable, registered, and mixed-ownership records through the scoped predicate", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(resolveLegacyVehiclePublication("excluded-car")).resolves.toBe("not-found");
  });

  it("rejects malformed slugs without querying the database", async () => {
    await expect(resolveLegacyVehiclePublication("../registered-car")).resolves.toBe("not-found");
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("does not disguise a database failure as a missing vehicle", async () => {
    mocks.findFirst.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(resolveLegacyVehiclePublication("legacy-car")).resolves.toBe("error");
    expect(mocks.loggerError).toHaveBeenCalledWith("public.vehicle_publication_gate_failed");
  });
});
