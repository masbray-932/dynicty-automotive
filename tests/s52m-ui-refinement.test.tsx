import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";

vi.mock("server-only",()=>({}));
vi.mock("next/image",()=>({default:({alt,src,className}:{alt:string;src:string;className?:string})=><span role="img" aria-label={alt} data-src={src} className={className}/> }));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
import { SiteHeader } from "@/components/public/site-header";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { AdvantagesSection } from "@/features/content/public-sections";
import { PublicSalesTeam } from "@/features/sales-team/public-sales-team";

const dealer={dealerName:"Autoeighteen",logoUrl:"/uploads/logo.webp",whatsappNumber:"0812-3456-7890",phone:null,email:null,address:null,googleMapsUrl:null,instagramUrl:null,facebookUrl:null,primaryColor:null,secondaryColor:null};

describe("S5.2M public UI refinements",()=>{
  it("uses the uploaded logo without duplicate visible dealer text and keeps an accessible home label",()=>{
    const html=renderToStaticMarkup(<SiteHeader dealer={dealer}/>);
    expect(html).toContain('aria-label="Autoeighteen — beranda"');
    expect(html).toContain('data-src="/uploads/logo.webp"');
    expect(html).not.toContain(">Autoeighteen</span>");
    expect(html).toContain("Chat via WhatsApp");
    expect(html).toContain('href="https://wa.me/6281234567890"');
    expect(html).toContain("<svg");
  });

  it("falls back to visible dealer text and the contact route when logo and WhatsApp are missing",()=>{
    const html=renderToStaticMarkup(<SiteHeader dealer={{...dealer,logoUrl:null,whatsappNumber:null}}/>);
    expect(html).toContain(">Autoeighteen</span>");
    expect(html).toContain('href="/contact"');
    expect(html).toContain("Kontak Dealer");
  });

  it("shows complete sales portraits in a compact non-cropping image area",()=>{
    const html=renderToStaticMarkup(<PublicSalesTeam members={[{id:"one",fullName:"Ayu",title:"Sales",biography:"Membantu pelanggan.",imageUrl:"/uploads/ayu.png",whatsappUrl:"https://wa.me/6281234567890"}]}/>);
    expect(html).toContain("object-contain p-3");
    expect(html).toContain("h-52");
    expect(html).not.toContain("object-cover");
    expect(html).toContain("Hubungi via WhatsApp");
  });

  it("renders six generic defaults in a two-column CMS-overridable section",()=>{
    const html=renderToStaticMarkup(<AdvantagesSection content={{profile:null,showroomUrl:null,items:[],advantageConfigured:false,advantageSection:null}} dealerName="Autoeighteen" defaultContent/>);
    expect(html).toContain("Mengapa Memilih Autoeighteen?");
    expect(html).toContain("md:grid-cols-2");
    for(const title of ["Pilihan Mobil Berkualitas","Informasi Transparan","Pelayanan Profesional","Proses Pembelian Mudah","Konsultasi Kendaraan","Komitmen Kepuasan Pelanggan"])expect(html).toContain(title);
    expect((html.match(/<article/g)??[])).toHaveLength(6);
  });

  it("honors CMS section title, visibility and configured cards",()=>{
    const item={id:"custom",kind:"ADVANTAGE" as const,title:"Pilihan terkurasi",body:"Konten CMS.",link:"cms:advantage-icon:quality",active:true,sortOrder:1,mediaUrl:null};
    const shown=renderToStaticMarkup(<AdvantagesSection content={{profile:null,showroomUrl:null,items:[item],advantageConfigured:true,advantageSection:{title:"Alasan Memilih Kami",active:true}}}/>);
    expect(shown).toContain("Alasan Memilih Kami");expect(shown).toContain("Pilihan terkurasi");expect(shown).not.toContain("Pilihan Mobil Berkualitas");
    expect(AdvantagesSection({content:{profile:null,showroomUrl:null,items:[item],advantageConfigured:true,advantageSection:{title:"Disembunyikan",active:false}}})).toBeNull();
  });

  it("keeps reveal content visible in SSR and provides reduced-motion CSS",()=>{
    const html=renderToStaticMarkup(<ScrollReveal><p>Konten tetap terlihat</p></ScrollReveal>);
    expect(html).toContain("Konten tetap terlihat");expect(html).not.toContain("scroll-reveal-ready");
    const css=readFileSync("app/globals.css","utf8");expect(css).toContain("prefers-reduced-motion: reduce");expect(css).toContain("transition: none !important");
  });
});
