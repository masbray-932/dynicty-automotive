import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/image",()=>({default:({alt,src,className}:{alt:string;src:string;className?:string})=><span role="img" aria-label={alt} data-src={src} className={className}/> }));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
import { FloatingWhatsapp } from "@/components/public/floating-whatsapp";
import { SiteHeader } from "@/components/public/site-header";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import type { DealerPresentation } from "@/features/homepage/domain";
import { DEFAULT_STOREFRONT_HEADER, STOREFRONT_MOBILE_NAV, contrastRatio, storefrontHeaderColor } from "@/features/theme/domain";

const dealer: DealerPresentation = { dealerName:"Dealer Premium",logoUrl:null,faviconUrl:null,whatsappNumber:"081234567890",whatsappWidgetEnabled:true,whatsappWidgetMessage:"Halo",phone:null,email:null,address:null,googleMapsUrl:null,instagramUrl:null,facebookUrl:null,primaryColor:"#C8102E",secondaryColor:null };

describe("S5.2N premium public contact treatment",()=>{
  it("derives a restrained header surface without changing the dealer primary token",()=>{
    const header=storefrontHeaderColor(dealer.primaryColor);
    expect(header).not.toBe(dealer.primaryColor);
    expect(contrastRatio(header,"#FFFFFF")).toBeGreaterThanOrEqual(8);
    expect(storefrontHeaderColor("#FFEEEE")).toBe(DEFAULT_STOREFRONT_HEADER);
  });

  it("uses a viewport-safe charcoal mobile menu and contextual WhatsApp action",()=>{
    const html=renderToStaticMarkup(<SiteHeader dealer={dealer}/>);
    expect(html).toContain(`background-color:${STOREFRONT_MOBILE_NAV}`);
    expect(html).toContain("w-[min(18rem,calc(100vw-2rem))]");
    expect(html).toContain("max-h-[calc(100dvh-5.5rem)]");
    expect(html).toContain("bg-[#25D366]/10");
    expect(html).toContain('aria-label="Navigasi seluler"');
  });

  it("keeps ordinary and floating WhatsApp controls recognizable but proportionate",()=>{
    const standard=renderToStaticMarkup(<WhatsAppLink href="https://wa.me/6281234567890">Chat WhatsApp</WhatsAppLink>);
    const floating=renderToStaticMarkup(<FloatingWhatsapp dealer={dealer}/>);
    expect(standard).toContain("bg-[#25D366]");
    expect(standard).toContain("rounded-md");
    expect(floating).toContain("h-12");
    expect(floating).toContain("w-12");
    expect(floating).toContain("shadow-[0_6px_18px");
    expect(floating).toContain('aria-label="Chat dengan Dealer Premium melalui WhatsApp"');
  });
});
