import { describe, expect, it } from "vitest";
import { assertSafeStorageKey, createCarImageKey } from "@/services/storage/key";

describe("storage keys", () => {
  it("creates a stable car-scoped key", () => {
    expect(createCarImageKey("CAR 123", "Front View.JPG", "fixed")).toBe(
      "cars/car-123/fixed-front-view.jpg",
    );
  });

  it("blocks path traversal", () => {
    expect(() => assertSafeStorageKey("../secret.txt")).toThrow("Unsafe storage key");
  });
});
