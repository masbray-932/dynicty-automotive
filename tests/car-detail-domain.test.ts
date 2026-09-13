import { describe, expect, it } from "vitest";
import {
  CAR_PLACEHOLDER_IMAGE,
  buildVehicleSeoDescription,
  buildVehicleTitle,
  buildWhatsappMessage,
  createVehicleWhatsappUrl,
  isPublicDetailVisible,
  isValidCarSlug,
  orderDetailImages,
  selectRelatedVehicles,
} from "@/features/car-detail/domain";
import { normalizeWhatsappNumber, shouldShowMileage } from "@/features/homepage/domain";
import { formatMileage, formatRupiah } from "@/lib/format";

describe("public car detail rules", () => {
  it("shows AVAILABLE while hiding DRAFT and SOLD", () => {
    expect(isPublicDetailVisible("AVAILABLE")).toBe(true);
    expect(isPublicDetailVisible("DRAFT")).toBe(false);
    expect(isPublicDetailVisible("SOLD")).toBe(false);
  });

  it("accepts only safe exact public slugs", () => {
    expect(isValidCarSlug("toyota-avanza-g-2022")).toBe(true);
    expect(isValidCarSlug("../draft-id")).toBe(false);
    expect(isValidCarSlug("")).toBe(false);
  });

  it("builds a consistent title, SEO description, and display values", () => {
    const title = buildVehicleTitle({ brand: "Toyota", model: "Avanza", variant: "1.5 G", year: 2022 });
    expect(title).toBe("Toyota Avanza 1.5 G 2022");
    expect(buildVehicleSeoDescription({ title, transmission: "Automatic", dealerName: "Dealer Maju" })).toContain("tersedia di Dealer Maju");
    expect(formatRupiah("225000000")).toContain("225.000.000");
  });

  it("shows mileage only for USED and formats it", () => {
    expect(shouldShowMileage("USED", 28500)).toBe(true);
    expect(formatMileage(28500)).toBe("28.500 km");
    expect(shouldShowMileage("NEW", 0)).toBe(false);
  });
});

describe("detail images", () => {
  it("puts the primary image first then uses stable ordering", () => {
    const later = new Date("2026-09-14");
    const earlier = new Date("2026-09-13");
    const result = orderDetailImages([
      { id: "b", url: "/b", isPrimary: false, sortOrder: 1, createdAt: later },
      { id: "a", url: "/a", isPrimary: false, sortOrder: 1, createdAt: earlier },
      { id: "cover", url: "/cover", isPrimary: true, sortOrder: 9, createdAt: later },
    ]);
    expect(result.map((image) => image.id)).toEqual(["cover", "a", "b"]);
    expect(CAR_PLACEHOLDER_IMAGE).toBe("/images/car-placeholder.svg");
  });
});

describe("contextual WhatsApp", () => {
  it("normalizes common Indonesian number forms", () => {
    expect(normalizeWhatsappNumber("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsappNumber("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsappNumber("81234567890")).toBe("6281234567890");
  });

  it("builds and safely encodes vehicle context", () => {
    const input = { title: "Toyota Avanza 1.5 G 2022", price: "Rp 225.000.000", url: "https://example.com/cars/toyota-avanza" };
    expect(buildWhatsappMessage(input)).toContain(input.title);
    const url = createVehicleWhatsappUrl("081234567890", input)!;
    expect(url.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
    expect(decodeURIComponent(url.replace(/\+/g, " "))).toContain("Apakah unit ini masih tersedia?");
  });

  it("rejects malformed or unusable WhatsApp numbers", () => {
    expect(normalizeWhatsappNumber("call-me-0812")).toBeNull();
    expect(createVehicleWhatsappUrl("123", { title: "Mobil", price: "Rp 1" })).toBeNull();
  });
});

describe("related vehicles", () => {
  it("excludes current, DRAFT and SOLD, then ranks model and brand", () => {
    const now = new Date("2026-09-13");
    const cars = [
      { id: "current", status: "AVAILABLE" as const, brandId: "toyota", modelId: "avanza", updatedAt: now },
      { id: "other", status: "AVAILABLE" as const, brandId: "honda", modelId: "brio", updatedAt: now },
      { id: "brand", status: "AVAILABLE" as const, brandId: "toyota", modelId: "rush", updatedAt: now },
      { id: "model", status: "AVAILABLE" as const, brandId: "toyota", modelId: "avanza", updatedAt: now },
      { id: "draft", status: "DRAFT" as const, brandId: "toyota", modelId: "avanza", updatedAt: now },
      { id: "sold", status: "SOLD" as const, brandId: "toyota", modelId: "avanza", updatedAt: now },
    ];
    expect(selectRelatedVehicles(cars, cars[0], 3).map((car) => car.id)).toEqual(["model", "brand", "other"]);
  });
});
