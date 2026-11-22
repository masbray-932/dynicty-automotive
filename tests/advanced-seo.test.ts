import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/homepage/service", () => ({
  getDealerPresentation: vi.fn(async () => ({
    dealerName: "Dealer Uji",
    logoUrl: "/uploads/dealer/logo.webp",
    faviconUrl: null,
    whatsappNumber: null,
    phone: "021-123456",
    email: "hello@example.test",
    address: "Jl. Contoh 1",
    instagramUrl: "https://instagram.com/dealeruji",
    facebookUrl: "javascript:alert(1)",
    primaryColor: null,
    secondaryColor: null,
    inventoryMode: "BOTH",
  })),
}));

import { buildVehicleStructuredData } from "@/features/car-detail/seo";
import {
  buildArticleStructuredData,
  buildBreadcrumbStructuredData,
  buildDealerStructuredData,
  buildServiceStructuredData,
  serializeJsonLd,
} from "@/features/seo/structured-data";
import { publicMetadata } from "@/server/editorial/metadata";

afterEach(() => vi.unstubAllEnvs());

describe("tenant-safe public metadata", () => {
  it("emits an absolute configured canonical, complete social cards, and noindexes filtered views", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tenant.example");
    const metadata = await publicMetadata("Artikel", "  Ringkasan   artikel  ", "/articles", {
      filtered: true,
      image: { url: "/uploads/article.webp", alt: "Foto artikel" },
    });

    expect(metadata.alternates?.canonical).toBe("https://tenant.example/articles");
    expect(metadata.openGraph).toMatchObject({
      url: "https://tenant.example/articles",
      siteName: "Dealer Uji",
      locale: "id_ID",
      images: [{ url: "/uploads/article.webp", alt: "Foto artikel" }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
    expect(metadata.description).toBe("Ringkasan artikel");
  });

  it("adds article publication dates without leaking them into website metadata", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tenant.example");
    const publishedAt = new Date("2026-01-02T03:04:05.000Z");
    const updatedAt = new Date("2026-02-03T04:05:06.000Z");
    const metadata = await publicMetadata("Berita", "Deskripsi", "/articles/berita", {
      type: "article", publishedAt, updatedAt,
    });
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: publishedAt.toISOString(),
      modifiedTime: updatedAt.toISOString(),
    });
  });
});

describe("structured data", () => {
  const dealer = {
    dealerName: "Dealer Uji", logoUrl: "/uploads/logo.webp", faviconUrl: null,
    whatsappNumber: null, phone: "021-123456", email: "hello@example.test", address: "Jl. Contoh 1",
    instagramUrl: "https://instagram.com/dealeruji", facebookUrl: "javascript:alert(1)",
    primaryColor: null, secondaryColor: null, inventoryMode: "BOTH" as const,
  };

  it("describes only the scoped dealer and rejects unsafe social URLs", () => {
    const data = buildDealerStructuredData(dealer, "https://tenant.example");
    expect(data).toMatchObject({
      "@type": ["AutoDealer", "LocalBusiness"],
      "@id": "https://tenant.example/#organization",
      url: "https://tenant.example/",
      logo: "https://tenant.example/uploads/logo.webp",
      name: "Dealer Uji",
      sameAs: ["https://instagram.com/dealeruji"],
    });
  });

  it("builds ordered absolute breadcrumbs", () => {
    const data = buildBreadcrumbStructuredData([
      { name: "Beranda", url: "https://tenant.example/" },
      { name: "Mobil", url: "https://tenant.example/cars" },
    ]);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Beranda", item: "https://tenant.example/" },
      { "@type": "ListItem", position: 2, name: "Mobil", item: "https://tenant.example/cars" },
    ]);
  });

  it("enriches vehicle data with condition, absolute media, identity, and scoped seller", () => {
    const data = buildVehicleStructuredData({
      id: "car-1", title: "Toyota Avanza G 2023", description: "Unit tersedia", condition: "USED",
      brand: "Toyota", model: "Avanza", year: 2023, price: "175000000", transmission: "Automatic",
      fuelType: "Gasoline", color: "Black", mileage: 12000, images: ["/uploads/car.webp"],
      url: "https://tenant.example/cars/avanza", dealerName: "Dealer Uji", dealerUrl: "https://tenant.example",
    });
    expect(data).toMatchObject({
      "@type": "Car", sku: "car-1", image: ["https://tenant.example/uploads/car.webp"],
      mileageFromOdometer: { value: 12000, unitCode: "KMT" },
      offers: {
        itemCondition: "https://schema.org/UsedCondition",
        seller: { "@id": "https://tenant.example/#organization", name: "Dealer Uji" },
      },
    });
  });

  it("uses only supported editorial fields for Article and Service", () => {
    const updatedAt = new Date("2026-02-03T04:05:06.000Z");
    const base = { title: "Konten", description: "Ringkasan", url: "https://tenant.example/articles/konten", imageUrl: "/uploads/content.webp", dealerName: "Dealer Uji", dealerUrl: "https://tenant.example", updatedAt };
    expect(buildArticleStructuredData({ ...base, publishedAt: null })).toMatchObject({
      "@type": "Article", image: ["https://tenant.example/uploads/content.webp"],
      dateModified: updatedAt.toISOString(), publisher: { "@id": "https://tenant.example/#organization" },
    });
    expect(buildArticleStructuredData({ ...base, publishedAt: null })).not.toHaveProperty("datePublished");
    expect(buildServiceStructuredData({ ...base, url: "https://tenant.example/services/konten" })).toMatchObject({
      "@type": "Service", image: "https://tenant.example/uploads/content.webp",
      provider: { "@id": "https://tenant.example/#organization" },
    });
  });

  it("escapes executable HTML characters in JSON-LD", () => {
    expect(serializeJsonLd({ value: "</script><script>alert(1)</script>" })).not.toContain("</script>");
    expect(serializeJsonLd({ value: "</script>" })).toContain("\\u003c/script>");
  });
});
