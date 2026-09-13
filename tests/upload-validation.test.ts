import { describe, expect, it } from "vitest";
import { validateImageUpload } from "@/validation/upload";

describe("image upload validation", () => {
  it("accepts a JPEG signature with matching MIME type", async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "car.jpg", { type: "image/jpeg" });
    expect((await validateImageUpload(file)).success).toBe(true);
  });

  it("rejects executable content renamed as an image", async () => {
    const file = new File(["#!/bin/sh"], "car.jpg", { type: "image/jpeg" });
    expect((await validateImageUpload(file)).success).toBe(false);
  });

  it("rejects unsupported MIME types", async () => {
    const file = new File(["<svg />"], "car.svg", { type: "image/svg+xml" });
    expect((await validateImageUpload(file)).success).toBe(false);
  });
});
