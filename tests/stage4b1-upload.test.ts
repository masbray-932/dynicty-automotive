import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MAX_IMAGE_SIZE, MAX_IMAGE_PIXELS, validateImageUpload } from "@/validation/upload";
import { assertSafeStorageKey, createCarImageKey, createDealerLogoKey, createContentMediaKey } from "@/services/storage/key";
import { imageBytes, imageFile } from "./fixtures/images";

describe("decoded upload regression", () => {
  it.each(["png", "jpeg", "webp"] as const)("accepts a real %s without changing bytes", async format => {
    const file = imageFile(format);
    const result = await validateImageUpload(file);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(file);
  });
  it.each(["png", "jpeg", "webp"] as const)("rejects truncated %s even with matching magic", async format => {
    const bytes = imageBytes(format);
    expect((await validateImageUpload(new File([bytes.slice(0, 12)], "broken", { type: `image/${format}` }))).success).toBe(false);
  });
  it("rejects valid magic with broken pixel data", async () => {
    const bytes = imageBytes("png");
    bytes.fill(0, 62, 76);
    expect((await validateImageUpload(new File([bytes], "broken.png", { type: "image/png" }))).success).toBe(false);
  });
  it("enforces the exact 8 MiB bound before reading oversized data", async () => {
    const header = imageBytes("jpeg");
    // JPEG permits bytes after EOI; decoder checks the real image, size policy checks all bytes.
    const atLimit = new File([header, new Uint8Array(MAX_IMAGE_SIZE - header.length)], "limit.jpg", { type: "image/jpeg" });
    expect((await validateImageUpload(atLimit)).success).toBe(true);
    expect((await validateImageUpload(new File([atLimit, new Uint8Array(1)], "over.jpg", { type: "image/jpeg" }))).success).toBe(false);
  });
  it("rejects MIME mismatch, empty files and executable bytes", async () => {
    for (const file of [new File([imageBytes("png")], "x.jpg", { type: "image/jpeg" }), new File([], "x.png", { type: "image/png" }), new File(["MZ executable"], "x.jpg", { type: "image/jpeg" })]) {
      expect((await validateImageUpload(file)).success).toBe(false);
    }
  });
  it("bounds decoded pixels", async () => {
    const huge = await sharp({ create: { width: 5001, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
    expect(5001 * 5000).toBeGreaterThan(MAX_IMAGE_PIXELS);
    expect((await validateImageUpload(new File([new Uint8Array(huge)], "huge.png", { type: "image/png" }))).success).toBe(false);
  });
});

describe("generated storage keys", () => {
  it.each(["IMG..jpg", "../../image.png", "a\\..\\b.jpg", "💛 mobil ..png", "", ".", "A very long name".repeat(30)])("normalizes %s safely", filename => {
    for (const key of [createCarImageKey("CAR..001", filename, "fixed", "image/jpeg"), createDealerLogoKey(filename, "fixed", "image/png")]) {
      expect(key).not.toContain(".."); expect(key).not.toContain("\\");
      expect(() => assertSafeStorageKey(key)).not.toThrow();
      expect(key).toMatch(/\.(jpg|png)$/);
    }
  });
  it("rejects unsafe suffix and preserves CMS namespaces", () => {
    expect(() => createCarImageKey("car", "x.jpg", "../escape")).toThrow();
    expect(() => assertSafeStorageKey("../escape")).toThrow();
    expect(createContentMediaKey("main_banner", "image/webp", "fixed")).toBe("dealers/default/content/main_banner/fixed.webp");
  });
});
