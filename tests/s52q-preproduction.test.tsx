import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { serviceCtaSchema } from "@/validation/service-cta";
import { ServiceCtaBanner } from "@/features/editorial/service-cta-banner";
import { formatStockUpdateDate } from "@/features/homepage/domain";
import { mediaUploadSpecs } from "@/features/media/upload-specs";

const valid={serviceId:"svc-1",enabled:true,heading:"Konsultasi servis",description:"Hubungi tim kami.",headingDesktopPx:40,descriptionDesktopPx:18,headingMobilePx:16,descriptionMobilePx:16,backgroundColor:"#C8102E",textColor:"#FFFFFF",buttons:[{label:"Chat sales",whatsappNumber:"081234567890",backgroundColor:"#111111",textColor:"#FFFFFF"}]};
describe("S5.2Q service CTA",()=>{
 it("enforces 16px mobile minimum and requires content for an enabled CTA",()=>{expect(serviceCtaSchema.safeParse(valid).success).toBe(true);expect(serviceCtaSchema.safeParse({...valid,headingMobilePx:15}).success).toBe(false);expect(serviceCtaSchema.safeParse({...valid,descriptionMobilePx:15}).success).toBe(false);expect(serviceCtaSchema.safeParse({...valid,buttons:[]}).success).toBe(false);});
 it("publishes an accessible responsive banner without unsafe WhatsApp buttons",()=>{const html=renderToStaticMarkup(<ServiceCtaBanner cta={{...valid,imageUrl:null,buttons:[{id:"one",...valid.buttons[0]},{id:"bad",label:"Broken",whatsappNumber:"javascript:alert(1)",backgroundColor:"#111111",textColor:"#FFFFFF"}]}}/>);expect(html).toContain("service-cta-heading");expect(html).toContain("https://wa.me/6281234567890");expect(html).not.toContain("javascript:");expect(html).toContain("md:grid-cols-[65%_35%]");});
 it("documents the exact 800x600 4:3 upload target",()=>{expect(mediaUploadSpecs.serviceCta).toMatchObject({recommendedWidth:800,recommendedHeight:600,aspectRatio:4/3});});
});
describe("S5.2Q inventory timestamp",()=>{it("displays actual Asia/Jakarta date and time",()=>{const formatted=formatStockUpdateDate(new Date("2026-11-18T00:05:00Z"));expect(formatted).toContain("18 November 2026");expect(formatted).toMatch(/07[.:]05/);});});
