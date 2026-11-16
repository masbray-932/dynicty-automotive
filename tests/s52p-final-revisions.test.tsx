import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { FloatingWhatsapp } from "@/components/public/floating-whatsapp";
import { BannerCarousel } from "@/features/content/banner-carousel";
import { mediaUploadSpecs } from "@/features/media/upload-specs";
import { dealerContentSchema } from "@/validation/dealer-content";

const hero = {id:"hero",kind:"MAIN_BANNER" as const,title:"Banner utama",body:"",link:"",active:true,sortOrder:0,mediaUrl:"/uploads/hero.webp"};
const dealer = {dealerName:"Dealer Test",logoUrl:null,whatsappNumber:"628123456789",phone:null,email:null,address:"Alamat",googleMapsUrl:null,instagramUrl:null,facebookUrl:null,primaryColor:null,secondaryColor:null,inventoryMode:"BOTH" as const,whatsappWidgetEnabled:true,whatsappWidgetMessage:"Halo sales"};
const profile = {welcomeTitle:"Selamat datang",welcomeBody:"Deskripsi dealer",welcomeActive:true,welcomeHeadingDesktopPx:null,welcomeHeadingMobilePx:null,welcomeBodyDesktopPx:null,welcomeBodyMobilePx:null,history:"",vision:"",mission:"",achievements:"",aboutSummary:"",aboutStory:"",aboutActive:false,showroomAlt:"",operatingHours:"",operatingHoursActive:false};

describe("S5.2P final customer revisions",()=>{
  it("uses a dedicated horizontal leasing-partner upload specification without weakening formats",()=>{
    const spec=mediaUploadSpecs.leasingPartner;
    expect(spec).toMatchObject({recommendedWidth:600,recommendedHeight:240,aspectRatio:2.5});
    expect(spec.acceptedFormats).toEqual(["image/jpeg","image/png","image/webp"]);
    expect(spec.compositionHint).toMatch(/PNG atau WebP transparan/);
    const html=renderToStaticMarkup(<MediaUploadField spec="leasingPartner"/>);
    expect(html).toContain("600"); expect(html).toContain("240"); expect(html).toContain("horizontal");
  });

  it("renders one accessible dealer-configured floating link with the exact sales label",()=>{
    const html=renderToStaticMarkup(<FloatingWhatsapp dealer={dealer}/>);
    expect(html).toContain("Hubungi Sales Kami");
    expect(html).toContain("https://wa.me/628123456789");
    expect(html).toContain("safe-area-inset-bottom");
    expect((html.match(/<a /g)??[])).toHaveLength(1);
    expect(renderToStaticMarkup(<FloatingWhatsapp dealer={{...dealer,whatsappWidgetEnabled:false}}/>)).toBe("");
  });

  it("accepts bounded optional welcome typography and rejects arbitrary sizes",()=>{
    expect(dealerContentSchema.safeParse(profile).success).toBe(true);
    expect(dealerContentSchema.safeParse({...profile,welcomeHeadingDesktopPx:"64",welcomeHeadingMobilePx:"38",welcomeBodyDesktopPx:"18",welcomeBodyMobilePx:"16"}).success).toBe(true);
    expect(dealerContentSchema.safeParse({...profile,welcomeHeadingDesktopPx:"120"}).success).toBe(false);
    expect(dealerContentSchema.safeParse({...profile,welcomeBodyMobilePx:"10"}).success).toBe(false);
  });

  it("applies custom typography only to welcome copy and preserves mobile image-first markup",()=>{
    const html=renderToStaticMarkup(<BannerCarousel slides={[hero]} headline="Selamat datang" description="Deskripsi dealer" welcomeTypography={{headingDesktopPx:64,headingMobilePx:36,bodyDesktopPx:20,bodyMobilePx:17}}/>);
    expect(html).toContain("font-size:64px"); expect(html).toContain("font-size:36px");
    expect(html).toContain("font-size:20px"); expect(html).toContain("font-size:17px");
    expect(html).toContain("object-contain");
    expect(html).toContain("sm:h-[clamp(20rem,42vw,26.25rem)]");
    expect(html).toContain("sm:hidden");
  });

  it("ships an additive constrained migration for tenant-owned profile settings",()=>{
    const sql=readFileSync("prisma/migrations/20261116000000_s52p_welcome_typography/migration.sql","utf8");
    expect(sql).toContain('ALTER TABLE "DealerContent"');
    expect(sql).toContain('ADD COLUMN "welcomeHeadingDesktopPx" INTEGER');
    expect(sql).toContain("BETWEEN 32 AND 72");
    expect(sql).not.toMatch(/DROP|DELETE|TRUNCATE/i);
  });
});
