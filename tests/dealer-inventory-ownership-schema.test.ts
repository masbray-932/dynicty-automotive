import { readFileSync } from "node:fs";
import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL(
  "../prisma/migrations/20261106000000_stage_4c2e3_inventory_ownership/migration.sql", import.meta.url,
), "utf8");

function model(name: string) {
  const result = Prisma.dmmf.datamodel.models.find((entry) => entry.name === name);
  if (!result) throw new Error(`Missing Prisma model: ${name}`);
  return result;
}

describe("inventory ownership expansion (schema and SQL inspection; no database)", () => {
  it.each(["Brand", "CarModel", "Car", "CarImage"])("%s has an optional registered owner and a scoped ID key", (name) => {
    expect(model(name).fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "id", isId: true }),
      expect.objectContaining({ name: "dealerId", type: "String", isRequired: false, hasDefaultValue: false }),
      expect.objectContaining({ name: "dealer", type: "Dealer", relationFromFields: ["dealerId"], relationToFields: ["id"] }),
    ]));
    expect(model(name).uniqueFields).toContainEqual(["dealerId", "id"]);
    expect(migration).toContain(`ALTER TABLE "${name}" ADD COLUMN "dealerId" TEXT;`);
    expect(migration).toContain(`"${name}_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;`);
  });

  it.each([
    { child: "CarModel", relation: "ownedBrand", parent: "Brand", from: ["dealerId", "brandId"], to: ["dealerId", "id"], onDelete: "RESTRICT" },
    { child: "Car", relation: "ownedModel", parent: "CarModel", from: ["dealerId", "brandId", "modelId"], to: ["dealerId", "brandId", "id"], onDelete: "RESTRICT" },
    { child: "CarImage", relation: "ownedCar", parent: "Car", from: ["dealerId", "carId"], to: ["dealerId", "id"], onDelete: "CASCADE" },
  ])("declares the $child → $parent owner-qualified FK", ({ child, relation, parent, from, to, onDelete }) => {
    const columns = (names: string[]) => names.map((name) => `"${name}"`).join(", ");
    expect(model(child).fields).toContainEqual(expect.objectContaining({
      name: relation, type: parent, relationFromFields: from, relationToFields: to, isRequired: false,
    }));
    expect(model(parent).uniqueFields).toContainEqual(to);
    expect(migration).toContain(
      `FOREIGN KEY (${columns(from)}) REFERENCES "${parent}"(${columns(to)}) ON DELETE ${onDelete} ON UPDATE RESTRICT;`,
    );
  });

  it("preserves global uniques and legacy relationship keys", () => {
    expect(model("Brand").fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "slug", isUnique: true }),
      expect.objectContaining({ name: "name", isUnique: true }),
    ]));
    expect(model("Car").fields).toContainEqual(expect.objectContaining({ name: "slug", isUnique: true }));
    expect(model("CarModel").uniqueFields).toContainEqual(["brandId", "slug"]);
    expect(model("CarImage").uniqueFields).toContainEqual(["carId", "storageKey"]);
    for (const [child, name, type, field] of [
      ["CarModel", "brand", "Brand", "brandId"],
      ["Car", "brand", "Brand", "brandId"],
      ["Car", "model", "CarModel", "modelId"],
      ["CarImage", "car", "Car", "carId"],
    ]) {
      expect(model(child).fields).toContainEqual(expect.objectContaining({
        name, type, isRequired: true, relationFromFields: [field], relationToFields: ["id"],
      }));
    }
  });

  it("has no data write, destructive DDL, or change to nullable legacy ownership", () => {
    const sql = migration.replace(/^--.*$/gm, "");
    expect(sql).not.toMatch(/\b(?:DROP|TRUNCATE|INSERT|UPDATE\s+"|DELETE\s+FROM|ALTER\s+COLUMN|SET\s+NOT\s+NULL|MATCH\s+FULL)\b/i);
    expect(sql.match(/ADD COLUMN "dealerId" TEXT;/g)).toHaveLength(4);
    const coverIndex = readFileSync(new URL(
      "../prisma/migrations/20260913010000_phase_1_primary_image_constraint/migration.sql", import.meta.url,
    ), "utf8");
    expect(coverIndex).toMatch(/CREATE UNIQUE INDEX "CarImage_one_primary_per_car"\s+ON "CarImage" \("carId"\)\s+WHERE "isPrimary" = true;/);
  });
});
