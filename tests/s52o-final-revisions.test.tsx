import { describe,expect,it,vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/image",()=>({default:({alt="",className}:{alt?:string;className?:string})=><span role="img" aria-label={alt} className={className}/> }));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
vi.mock("next/navigation",()=>({usePathname:()=>"/cars"}));
import { SiteHeader } from "@/components/public/site-header";
import { HeaderVehicleSearch } from "@/components/public/header-vehicle-search";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { CatalogFilterForm } from "@/features/catalog/catalog-controls";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { mediaUploadSpecs,MEDIA_MAX_BYTES } from "@/features/media/upload-specs";
import { dealerFallback } from "@/features/homepage/domain";

describe("S5.2O final customer revisions",()=>{
  it("uses one truthful upload registry and renders field-specific guidance",()=>{expect(Object.keys(mediaUploadSpecs)).toEqual(expect.arrayContaining(["dealerLogo","favicon","hero","promo","vehicle","sales","brandLogo","advantageIcon","editorial","showroom"]));expect(Object.values(mediaUploadSpecs).every(spec=>spec.maxFileSizeBytes===MEDIA_MAX_BYTES)).toBe(true);const html=renderToStaticMarkup(<MediaUploadField spec="hero"/>);expect(html).toContain("1920");expect(html).toContain("820");expect(html).toContain("8.00 MiB");expect(html).toContain('type="file"');});
  it("renders a white two-row header with functional used-only search",()=>{const html=renderToStaticMarkup(<SiteHeader dealer={{...dealerFallback,dealerName:"Dealer Uji",inventoryMode:"USED_ONLY"}}/>);expect(html).toContain("bg-white");expect(html).toContain('role="search"');expect(html).toContain('type="hidden" name="condition" value="USED"');expect(html).not.toContain("Mobil baru");expect(html).toContain('aria-current="page"');});
  it("keeps category selection only for multi-condition dealers",()=>{const both=renderToStaticMarkup(<HeaderVehicleSearch inventoryMode="BOTH"/>);const used=renderToStaticMarkup(<HeaderVehicleSearch inventoryMode="USED_ONLY"/>);expect(both).toContain("Semua mobil");expect(both).toContain("Mobil baru");expect(used).not.toContain("Semua mobil");expect(used).not.toContain("Mobil baru");});
  it("hides the redundant catalog condition control in used-only mode",()=>{const html=renderToStaticMarkup(<CatalogFilterForm inventoryMode="USED_ONLY" filters={{condition:"USED",sort:"newest",page:1}} brands={[]} transmissions={[]}/>);expect(html).toContain('type="hidden" name="condition" value="USED"');expect(html).not.toContain("Semua kondisi");});
  it("lets long WhatsApp labels use the available mobile width without clipping",()=>{const html=renderToStaticMarkup(<WhatsAppLink href="https://wa.me/6281234567890">Hubungi via WhatsApp</WhatsAppLink>);expect(html).toContain("Hubungi via WhatsApp");expect(html).toContain("max-w-full");expect(html).toContain("min-w-0");expect(html).toContain("whitespace-normal");expect(html).toContain("break-words");expect(html).not.toContain("overflow-hidden");});
});
