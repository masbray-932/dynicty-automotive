import { readFileSync } from "node:fs";
import { DealerDomainRoutingState, DealerDomainVerificationState, DealerLifecycle, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL(
  "../prisma/migrations/20261105000000_stage_4c2e1_dealer_registry/migration.sql",
  import.meta.url,
), "utf8");

function model(name: string) {
  const result = Prisma.dmmf.datamodel.models.find((item) => item.name === name);
  if (!result) throw new Error(`Missing model: ${name}`);
  return result;
}

describe("additive dealer registry contract (generated client and SQL review; no database)", () => {
  it("generates explicit lifecycle states and defaults new records to inactive", () => {
    expect(Object.values(DealerLifecycle)).toEqual(["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"]);
    expect(Object.values(DealerDomainVerificationState)).toEqual(["PENDING", "VERIFIED", "REVOKED"]);
    expect(Object.values(DealerDomainRoutingState)).toEqual(["PENDING", "ACTIVE", "SUSPENDED", "RETIRED"]);
    expect(model("Dealer").fields).toContainEqual(expect.objectContaining({
      name: "lifecycle", default: DealerLifecycle.PENDING,
    }));
    expect(model("DealerDomain").fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "verificationState", default: DealerDomainVerificationState.PENDING }),
      expect.objectContaining({ name: "routingState", default: DealerDomainRoutingState.PENDING }),
      expect.objectContaining({ name: "isCanonical", default: false }),
      expect.objectContaining({ name: "bindingVersion", default: 1 }),
    ]));
  });

  it("declares domain ownership and reserves a hostname across dealers", () => {
    const domain = model("DealerDomain");
    expect(domain.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "hostname", isUnique: true }),
      expect.objectContaining({
        name: "dealer", type: "Dealer", isRequired: true, relationFromFields: ["dealerId"], relationToFields: ["id"],
      }),
    ]));
    expect(domain.uniqueFields).toContainEqual(["dealerId", "id"]);
    expect(migration).toMatch(/"DealerDomain_dealerId_fkey" FOREIGN KEY \("dealerId"\) REFERENCES "Dealer"\("id"\) ON DELETE RESTRICT ON UPDATE RESTRICT/);
  });

  it("keeps the legacy Settings key and CMS relations independent from the optional mapping", () => {
    expect(model("DealerSettings").fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "id", isId: true, default: "default" }),
      expect.objectContaining({ name: "dealerId", isRequired: false, isUnique: true }),
      expect.objectContaining({ name: "dealer", relationFromFields: ["dealerId"], relationToFields: ["id"], type: "Dealer" }),
    ]));
    for (const name of ["DealerContent", "DealerContentItem"]) {
      expect(model(name).fields).toContainEqual(expect.objectContaining({
        name: "dealer", type: "DealerSettings", relationFromFields: ["dealerId"], relationToFields: ["id"],
      }));
    }
    expect(migration).toMatch(/ALTER TABLE "DealerSettings" ADD COLUMN "dealerId" TEXT;/);
  });

  it("retains SQL-only guards for identity, activation and canonical uniqueness", () => {
    expect(migration).toContain(`CHECK ("id" <> 'default'`);
    expect(migration).toContain(`BEFORE UPDATE OF "id" ON "Dealer"`);
    expect(migration).toContain('"DealerDomain_normalized_hostname_check"');
    expect(migration).toContain('CHECK ("bindingVersion" >= 1)');
    expect(migration).toContain(`CHECK ("verificationState" <> 'VERIFIED' OR "verifiedAt" IS NOT NULL)`);
    expect(migration).toContain(`CHECK ("routingState" <> 'ACTIVE' OR ("verificationState" = 'VERIFIED' AND "activatedAt" IS NOT NULL))`);
    expect(migration).toContain(`CHECK (NOT "isCanonical" OR "routingState" = 'ACTIVE')`);
    expect(migration).toMatch(/CREATE UNIQUE INDEX "DealerDomain_one_canonical_per_dealer"\s+ON "DealerDomain" \("dealerId"\)\s+WHERE "isCanonical" = true;/);
  });
});
