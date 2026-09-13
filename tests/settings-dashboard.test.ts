import { describe, expect, it } from "vitest";
import { dealerSettingsSchema, MAX_LOGO_SIZE, validateLogoUpload } from "@/validation/dealer-settings";
import { mapDashboardCounts, projectRecentVehicles } from "@/features/dashboard/domain";
import { mergeDealerPresentation } from "@/features/homepage/domain";

const valid = { dealerName: "  Dealer Maju  ", phone: "+62 21 555-0101", whatsappNumber: "081234567890", email: " SALES@EXAMPLE.COM ", address: "Jalan Utama\nJakarta", googleMapsUrl: "https://maps.google.com/test", instagramUrl: "https://instagram.com/dealer", facebookUrl: "https://facebook.com/dealer", primaryColor: "#dc2626", secondaryColor: "#18181b" };

describe("DealerSettings validation", () => {
  it("requires and trims the dealer name", () => {
    expect(dealerSettingsSchema.parse(valid).dealerName).toBe("Dealer Maju");
    expect(dealerSettingsSchema.safeParse({ ...valid, dealerName: " " }).success).toBe(false);
  });
  it("validates phone, reuses WhatsApp validation, and canonicalizes email", () => {
    const parsed = dealerSettingsSchema.parse(valid);
    expect(parsed.email).toBe("sales@example.com");
    expect(dealerSettingsSchema.safeParse({ ...valid, phone: "call me", whatsappNumber: "123" }).success).toBe(false);
  });
  it("accepts safe HTTP links and rejects unsafe URL schemes", () => {
    expect(dealerSettingsSchema.safeParse(valid).success).toBe(true);
    expect(dealerSettingsSchema.safeParse({ ...valid, googleMapsUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(dealerSettingsSchema.safeParse({ ...valid, instagramUrl: "not-url" }).success).toBe(false);
    expect(dealerSettingsSchema.safeParse({ ...valid, facebookUrl: "ftp://example.com" }).success).toBe(false);
  });
  it("accepts only six-digit hex colors", () => {
    expect(dealerSettingsSchema.parse(valid).primaryColor).toBe("#DC2626");
    expect(dealerSettingsSchema.safeParse({ ...valid, primaryColor: "red; background:url(x)" }).success).toBe(false);
  });
  it("keeps centralized public fallback behavior", () => {
    expect(mergeDealerPresentation(null).dealerName).toBe("Dynicty Automotive");
  });
  it("validates logo size, MIME type, and binary signature", async () => {
    const png = new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0])], "logo.png", { type: "image/png" });
    expect((await validateLogoUpload(png)).success).toBe(true);
    const executable = new File(["MZ executable"], "logo.png", { type: "image/png" });
    expect((await validateLogoUpload(executable)).success).toBe(false);
    expect(MAX_LOGO_SIZE).toBe(4 * 1024 * 1024);
  });
});

describe("dashboard mapping", () => {
  it("maps status, condition, featured, total, and real zero counts", () => {
    expect(mapDashboardCounts(8, [{ status: "AVAILABLE", _count: { _all: 5 } }, { status: "DRAFT", _count: { _all: 2 } }, { status: "SOLD", _count: { _all: 1 } }], [{ condition: "NEW", _count: { _all: 3 } }, { condition: "USED", _count: { _all: 5 } }], 2)).toEqual({ total: 8, available: 5, draft: 2, sold: 1, newCars: 3, usedCars: 5, featured: 2 });
    expect(mapDashboardCounts(0, [], [], 0)).toEqual({ total: 0, available: 0, draft: 0, sold: 0, newCars: 0, usedCars: 0, featured: 0 });
  });
  it("orders recent inventory deterministically and limits projection", () => {
    const early = new Date("2026-09-12"), late = new Date("2026-09-13");
    expect(projectRecentVehicles([{ id: "b", updatedAt: late }, { id: "a", updatedAt: late }, { id: "old", updatedAt: early }], 2).map((item) => item.id)).toEqual(["a", "b"]);
  });
});
