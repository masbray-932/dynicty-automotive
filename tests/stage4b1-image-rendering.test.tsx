import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
vi.mock("next/image", () => ({ default: ({ src, alt, unoptimized, sizes }: { src: string; alt: string; unoptimized?: boolean; sizes?: string }) => <span role="img" aria-label={alt} data-src={src} data-direct={String(Boolean(unoptimized))} data-sizes={sizes} /> }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a> }));
import { shouldBypassImageOptimization } from "@/lib/image-delivery";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { VehicleGallery } from "@/features/car-detail/gallery";
import { BannerCarousel } from "@/features/content/banner-carousel";
import { AboutSection, LeasingSection } from "@/features/content/public-sections";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

describe("public persistent media rendering", () => {
  it.each(["/uploads/cars/car/a.jpg", "https://media.example/a.webp", "blob:test"])("bypasses optimizer for %s", url => expect(shouldBypassImageOptimization(url)).toBe(true));
  it("retains optimizer for ordinary static raster assets", () => expect(shouldBypassImageOptimization("/images/hero.jpg")).toBe(false));
  it("covers cards reused on homepage, catalog and related vehicles", () => {
    const html = renderToStaticMarkup(<VehicleCard car={{ id: "car", slug: "car", condition: "USED", brand: "Dealer", model: "Model", variant: "G", year: 2025, price: "100000000", mileage: 1000, transmission: "Auto", imageUrl: "/uploads/cars/car/image.jpg" }} />);
    expect(html).toContain('data-direct="true"'); expect(html).toContain('aria-label="Dealer Model G"'); expect(html).toContain("100vw");
  });
  it("covers both gallery hero and thumbnails", () => {
    const html = renderToStaticMarkup(<VehicleGallery title="Car" images={[{ id: "1", url: "/uploads/1.jpg", alt: "Car front" }, { id: "2", url: "/uploads/2.webp", alt: "Car rear" }]} />);
    expect(html.match(/data-direct="true"/g)).toHaveLength(3);
    expect(html).toContain("Galeri kendaraan"); expect(html).toContain("Foto berikutnya");
  });
  it("covers local main/promo banners", () => {
    const html = renderToStaticMarkup(<BannerCarousel slides={[{ id: "b", kind: "MAIN_BANNER", title: "Banner", body: "", link: "", active: true, sortOrder: 0, mediaUrl: "/uploads/dealers/default/content/main_banner/b.png" }]} />);
    expect(html).toContain('data-direct="true"');
  });
  it("covers showroom and leasing logos", () => {
    const content = { profile: { dealerId: "default", welcomeTitle: "", welcomeBody: "", welcomeActive: false, aboutSummary: "Story", aboutStory: "Story", aboutActive: true, showroomKey: "showroom", showroomAlt: "Showroom", operatingHours: "", operatingHoursActive: false, updatedAt: new Date() }, showroomUrl: "/uploads/showroom.jpg", items: [{ id: "p", kind: "LEASING_PARTNER" as const, title: "Partner", body: "", link: "", active: true, sortOrder: 0, mediaUrl: "/uploads/partner.png" }] };
    const html = renderToStaticMarkup(<><AboutSection content={content} /><LeasingSection content={content} /></>);
    expect(html.match(/data-direct="true"/g)).toHaveLength(2);
  });
  it("covers shared public header/footer dealer logos", () => {
    const dealer = { dealerName: "Dealer", logoUrl: "/uploads/dealer/logo/a.png", primaryColor: null, secondaryColor: null, whatsappNumber: null, phone: null, email: null, address: null, googleMapsUrl: null, instagramUrl: null, facebookUrl: null };
    const html = renderToStaticMarkup(<><SiteHeader dealer={dealer} /><SiteFooter dealer={dealer} /></>);
    expect(html.match(/data-direct="true"/g)).toHaveLength(2);
  });
});
