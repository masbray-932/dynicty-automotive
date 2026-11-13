import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/image",()=>({default:({alt,src,className}: {alt:string;src:string;className?:string})=><span role="img" aria-label={alt} data-src={src} className={className} />}));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
import { FloatingWhatsapp } from "@/components/public/floating-whatsapp";
import { SiteHeader } from "@/components/public/site-header";
import { BannerCarousel } from "@/features/content/banner-carousel";
import { canActivateAdvantage, visibleItems, type PublicContentItem } from "@/features/content/domain";
import { createWhatsappUrl, formatStockUpdateDate, type DealerPresentation } from "@/features/homepage/domain";
import { DEFAULT_STOREFRONT_HEADER, storefrontHeaderColor } from "@/features/theme/domain";

const dealer: DealerPresentation = { dealerName:"Dealer Uji",logoUrl:null,faviconUrl:null,whatsappNumber:"0812 3456 7890",whatsappWidgetEnabled:true,whatsappWidgetMessage:"Halo & info",phone:null,email:null,address:null,googleMapsUrl:null,instagramUrl:null,facebookUrl:null,primaryColor:"#6F1018",secondaryColor:null };
const slide: PublicContentItem = { id:"promo",kind:"PROMO_BANNER",title:"Promo resmi",body:"",link:"/cars",active:true,sortOrder:0,mediaUrl:"/uploads/promo.webp" };

describe("S5.2N approved customer revisions",()=>{
  it("normalizes Indonesian WhatsApp numbers and encodes the optional initial message",()=>{
    expect(createWhatsappUrl("0812 3456 7890","Halo & info")).toBe("https://wa.me/6281234567890?text=Halo%20%26%20info");
    expect(createWhatsappUrl("javascript:alert(1)")).toBeNull();
  });
  it("uses a contrast-safe dealer header color and WhatsApp green CTA",()=>{
    expect(storefrontHeaderColor("#6F1018")).toBe("#6F1018");
    expect(storefrontHeaderColor("#FFEEEE")).toBe(DEFAULT_STOREFRONT_HEADER);
    const html=renderToStaticMarkup(<SiteHeader dealer={dealer}/>);
    expect(html).toContain("background-color:#6F1018");expect(html).toContain("bg-[#25D366]");expect(html).toContain("text-white");
  });
  it("renders the floating widget only with an enabled valid dealer number",()=>{
    const html=renderToStaticMarkup(<FloatingWhatsapp dealer={dealer}/>);
    expect(html).toContain("bottom-[max(5rem");expect(html).toContain("Halo%20%26%20info");
    expect(renderToStaticMarkup(<FloatingWhatsapp dealer={{...dealer,whatsappWidgetEnabled:false}}/>)).toBe("");
    expect(renderToStaticMarkup(<FloatingWhatsapp dealer={{...dealer,whatsappNumber:"invalid"}}/>)).toBe("");
  });
  it("keeps hero copy below the image on mobile and preserves the desktop overlay",()=>{
    const hero={...slide,kind:"MAIN_BANNER" as const};
    const html=renderToStaticMarkup(<BannerCarousel slides={[hero]} headline="Judul dealer" description="Deskripsi dealer"/>);
    expect(html).toContain("hidden bg-gradient-to-t");expect(html).toContain("sm:block");expect(html).toContain("bg-white px-5 py-6");expect(html).toContain("object-contain sm:object-cover");
  });
  it("renders a linked portrait promo slider without stretching artwork",()=>{
    const html=renderToStaticMarkup(<BannerCarousel slides={[slide,{...slide,id:"promo-2"}]} portrait linkSlides/>);
    expect(html).toContain("aspect-[4/5]");expect(html).toContain('href="/cars"');expect(html).toContain("object-contain");expect(html).toContain("Jeda pergantian otomatis");
  });
  it("formats real stock dates in Indonesian Jakarta time and limits advantages to six",()=>{
    expect(formatStockUpdateDate(new Date("2026-11-13T18:00:00Z"))).toContain("14 November 2026");
    expect(canActivateAdvantage(5)).toBe(true);expect(canActivateAdvantage(6)).toBe(false);
    const advantages=Array.from({length:8},(_,i)=>({...slide,id:String(i),kind:"ADVANTAGE" as const,title:`A${i}`,body:"Fakta",link:"",mediaUrl:null}));
    expect(visibleItems(advantages,"ADVANTAGE")).toHaveLength(6);
  });
});
