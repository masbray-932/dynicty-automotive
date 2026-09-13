import { describe, expect, it } from "vitest";
import {
  createHomepageSearchParams,
  createWhatsappUrl,
  dealerFallback,
  isHomepageCarVisible,
  mergeDealerPresentation,
  selectFeaturedHomepageCars,
  shouldShowMileage,
} from "@/features/homepage/domain";
import { formatMileage, formatRupiah } from "@/lib/format";

describe("Homepage public visibility", () => {
  it("allows AVAILABLE and excludes DRAFT and SOLD", () => {
    expect(isHomepageCarVisible("AVAILABLE")).toBe(true);
    expect(isHomepageCarVisible("DRAFT")).toBe(false);
    expect(isHomepageCarVisible("SOLD")).toBe(false);
  });

  it("selects only featured available cars and prefers imagery", () => {
    const date = new Date("2026-09-13T00:00:00Z");
    const selected = selectFeaturedHomepageCars([
      { id: "draft", status: "DRAFT" as const, featured: true, updatedAt: date, hasImage: true },
      { id: "sold", status: "SOLD" as const, featured: true, updatedAt: date, hasImage: true },
      { id: "plain", status: "AVAILABLE" as const, featured: true, updatedAt: new Date("2026-09-14"), hasImage: false },
      { id: "pictured", status: "AVAILABLE" as const, featured: true, updatedAt: date, hasImage: true },
      { id: "not-featured", status: "AVAILABLE" as const, featured: false, updatedAt: date, hasImage: true },
    ]);
    expect(selected.map((car) => car.id)).toEqual(["pictured", "plain"]);
  });
});

describe("Homepage presentation rules", () => {
  it("shows mileage only for used cars with a positive value", () => {
    expect(shouldShowMileage("USED", 28500)).toBe(true);
    expect(shouldShowMileage("USED", 0)).toBe(false);
    expect(shouldShowMileage("NEW", 28500)).toBe(false);
  });

  it("formats vehicle values for Indonesian visitors", () => {
    expect(formatRupiah("225000000")).toContain("225.000.000");
    expect(formatMileage(28500)).toBe("28.500 km");
  });

  it("uses stable clean Homepage search parameters", () => {
    expect(createHomepageSearchParams({ condition: "used", brand: "toyota", model: "avanza", q: " G  " })).toBe("condition=USED&brand=toyota&model=avanza&q=G");
    expect(createHomepageSearchParams({ condition: "all", q: " " })).toBe("");
  });

  it("centralizes dealer fallbacks and contact URLs", () => {
    expect(mergeDealerPresentation(null)).toEqual(dealerFallback);
    expect(mergeDealerPresentation({ dealerName: "Dealer Maju", phone: "" }).dealerName).toBe("Dealer Maju");
    expect(createWhatsappUrl("0812-3456-7890")).toBe("https://wa.me/6281234567890");
    expect(createWhatsappUrl(null)).toBeNull();
  });
});
