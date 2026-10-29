import { describe, expect, it } from "vitest";
import { validateImageUpload } from "@/validation/upload";
import { imageFile } from "./fixtures/images";

describe("image upload validation", () => {
  it("accepts a JPEG signature with matching MIME type", async () => {
    const file = imageFile("jpeg", "car.jpg");
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
