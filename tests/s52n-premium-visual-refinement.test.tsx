import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/image",()=>({default:({alt,src,className}:{alt:string;src:string;className?:string})=><span role="img" aria-label={alt} data-src={src} className={className}/> }));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
vi.mock("next/navigation",()=>({usePathname:()=>"/cars"}));
import { FloatingWhatsapp } from "@/components/public/floating-whatsapp";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import type { DealerPresentation } from "@/features/homepage/domain";
import { AUTO18_STOREFRONT_GRADIENT, DEFAULT_STOREFRONT_HEADER, contrastRatio, storefrontHeaderBackground, storefrontHeaderColor } from "@/features/theme/domain";

const dealer: DealerPresentation = { dealerName:"Dealer Premium",logoUrl:null,faviconUrl:null,whatsappNumber:"081234567890",whatsappWidgetEnabled:true,whatsappWidgetMessage:"Halo",phone:null,email:null,address:null,googleMapsUrl:null,instagramUrl:null,facebookUrl:null,primaryColor:"#C8102E",secondaryColor:null };

describe("S5.2N premium public contact treatment",()=>{
  it("derives a restrained header surface without changing the dealer primary token",()=>{
    const header=storefrontHeaderColor(dealer.primaryColor);
    expect(header).not.toBe(dealer.primaryColor);
    expect(contrastRatio(header,"#FFFFFF")).toBeGreaterThanOrEqual(8);
    expect(storefrontHeaderColor("#FFEEEE")).toBe(DEFAULT_STOREFRONT_HEADER);
  });

  it("uses the approved white two-row header and viewport-safe mobile menu",()=>{
    const html=renderToStaticMarkup(<SiteHeader dealer={dealer}/>);
    expect(storefrontHeaderBackground(dealer.primaryColor)).toBe(AUTO18_STOREFRONT_GRADIENT);
    expect(html).toContain("bg-white");
    expect(html).not.toContain("linear-gradient(110deg");
    expect(html).toContain("w-[min(18rem,calc(100vw-2rem))]");
    expect(html).toContain("max-h-[calc(100dvh-8rem)]");
    expect(html).toContain("linear-gradient(105deg,#20c85a_0%,#0b9f40_55%,#087d32_100%)");
    expect(html).toContain('aria-label="Navigasi seluler"');
  });

  it("keeps ordinary and floating WhatsApp controls recognizable but proportionate",()=>{
    const standard=renderToStaticMarkup(<WhatsAppLink href="https://wa.me/6281234567890">Chat WhatsApp</WhatsAppLink>);
    const floating=renderToStaticMarkup(<FloatingWhatsapp dealer={dealer}/>);
    expect(standard).toContain("linear-gradient(105deg,#20c85a_0%,#0b9f40_55%,#087d32_100%)");
    expect(standard).toContain("rounded-[10px]");
    expect(standard).toContain("flex-[0_0_54px]");
    expect(floating).toContain("min-h-[58px]");
    expect(floating).toContain("w-[58px]");
    expect(floating).toContain("linear-gradient(145deg,#20C85A_0%,#0E9B43_100%)");
    expect(floating).toContain("shadow-[0_5px_18px");
    expect(floating).toContain("Hubungi Sales Kami");
    expect(floating).toContain('aria-label="Hubungi sales Dealer Premium melalui WhatsApp"');
  });
});
