import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";

vi.mock("server-only", () => ({}));
vi.mock("@/server/master-data/actions", () => ({ saveBrandAction: vi.fn(), saveModelAction: vi.fn() }));
vi.mock("next/image", () => ({ default: ({ alt, src }: { alt: string; src: string }) => <span role="img" aria-label={alt} data-src={src} /> }));
import { PublicSalesTeam } from "@/features/sales-team/public-sales-team";
import { createBrandLogoKey, createSalesPhotoKey, isBrandLogoKey, isSalesPhotoKey } from "@/services/storage/key";
import { salesTeamSchema } from "@/validation/sales-team";
import { BrandForm } from "@/features/master-data/master-data-forms";

describe("brand identity and sales-team domain", () => {
  it("uses isolated safe namespaces for brand and sales media", () => {
    const brand = createBrandLogoKey("image/png", "brand-safe");
    const sales = createSalesPhotoKey("image/webp", "sales-safe");
    expect(brand).toBe("dealers/default/brands/brand-safe.png");
    expect(sales).toBe("dealers/default/sales/sales-safe.webp");
    expect(isBrandLogoKey(brand)).toBe(true); expect(isBrandLogoKey(sales)).toBe(false);
    expect(isSalesPhotoKey(sales)).toBe(true); expect(isSalesPhotoKey("../photo.webp")).toBe(false);
  });

  it("exposes logo replacement, safe removal, active state, and display order in the existing Brand editor", () => {
    const html = renderToStaticMarkup(<BrandForm brand={{ id: "cl12345678901234567890123", name: "Toyota", active: true, sortOrder: 3, logoUrl: "/uploads/toyota.webp" }} />);
    expect(html).toContain('name="logo"'); expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(html).toContain('name="removeLogo"'); expect(html).toContain('name="active"'); expect(html).toContain('name="sortOrder"'); expect(html).toContain("Logo Toyota");
  });

  it("validates WhatsApp and defaults new profiles to inactive", () => {
    const valid = salesTeamSchema.parse({ fullName: "Ayu Sales", title: "Sales Consultant", whatsappNumber: "0812-3456-7890", biography: "Membantu pelanggan.", active: false, sortOrder: "2" });
    expect(valid.sortOrder).toBe(2); expect(valid.active).toBe(false);
    expect(() => salesTeamSchema.parse({ ...valid, whatsappNumber: "javascript:alert(1)" })).toThrow();
  });

  it("hides an empty public team and omits broken contact buttons", () => {
    expect(PublicSalesTeam({ members: [] })).toBeNull();
    const html = renderToStaticMarkup(<PublicSalesTeam members={[{ id: "one", fullName: "Ayu", title: "Sales", biography: "", imageUrl: null, whatsappUrl: null }]} />);
    expect(html).toContain("Tim Sales Kami"); expect(html).toContain("Foto belum tersedia"); expect(html).not.toContain("wa.me");
  });

  it("renders safe WhatsApp contact and accessible photo alternatives", () => {
    const html = renderToStaticMarkup(<PublicSalesTeam members={[{ id: "one", fullName: "Ayu", title: "Sales Consultant", biography: "Siap membantu.", imageUrl: "/uploads/sales.webp", whatsappUrl: "https://wa.me/6281234567890" }]} />);
    expect(html).toContain('href="https://wa.me/6281234567890"'); expect(html).toContain('rel="noopener noreferrer"'); expect(html).toContain("Foto Ayu, Sales Consultant");
  });

  it("commits an additive migration with ownership and publication indexes", () => {
    const sql = readFileSync("prisma/migrations/20261110000000_s52l_brand_sales_team/migration.sql", "utf8");
    expect(sql).toContain('ALTER TABLE "Brand"'); expect(sql).toContain('DEFAULT true');
    expect(sql).toContain('CREATE TABLE "SalesTeamMember"'); expect(sql).toContain('REFERENCES "DealerSettings"');
    expect(sql).toContain('SalesTeamMember_dealerSettingsId_active_sortOrder_idx');
  });
});
