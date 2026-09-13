import { describe, expect, it } from "vitest";
import { fallbackPrimaryImageId, modelBelongsToBrand, reorderImageIds, slugify, uniqueSlug } from "@/features/cars/domain";

describe("car domain helpers", () => {
  it("generates a safe meaningful slug and resolves collisions", async () => {
    expect(slugify("Toyota Avanza 1.5 G 2022")).toBe("toyota-avanza-1-5-g-2022");
    const existing = new Set(["toyota-avanza", "toyota-avanza-2"]);
    await expect(uniqueSlug("Toyota Avanza", async (value) => existing.has(value))).resolves.toBe("toyota-avanza-3");
  });

  it("keeps deterministic image ordering", () => {
    expect(reorderImageIds(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(reorderImageIds(["a", "b", "c"], "c", "down")).toEqual(["a", "b", "c"]);
  });

  it("selects a predictable primary fallback", () => {
    expect(fallbackPrimaryImageId(["second", "third"], true)).toBe("second");
    expect(fallbackPrimaryImageId(["second"], false)).toBeNull();
  });

  it("validates the brand/model relationship", () => {
    expect(modelBelongsToBrand({ brandId: "toyota" }, "toyota")).toBe(true);
    expect(modelBelongsToBrand({ brandId: "honda" }, "toyota")).toBe(false);
  });
});
