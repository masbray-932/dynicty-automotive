import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/image",()=>({default:({alt,src}: {alt:string;src:string})=><span role="img" aria-label={alt} data-src={src} />}));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
import { BannerCarousel } from "@/features/content/banner-carousel";
import { FaqSection, AdvantagesSection, LeasingSection, AboutSection } from "@/features/content/public-sections";
import type { PublicContentItem } from "@/features/content/domain";
const item:PublicContentItem={id:"one",kind:"MAIN_BANNER",title:"Preview",body:"",link:"/cars",active:true,sortOrder:0,mediaUrl:"/uploads/banner.jpg"};
describe("public content SSR regression",()=>{
  it("omits empty optional sections and empty banner without fictitious defaults",()=>{
    const content={profile:null,showroomUrl:null,items:[]};
    expect(renderToStaticMarkup(<><BannerCarousel slides={[]} /><AboutSection content={content} /><AdvantagesSection content={content} /><LeasingSection content={content} /><FaqSection content={content} /></>)).toBe("");
  });
  it("hides navigation for one slide, shows it for several, and keeps inactive slides inert",()=>{
    const single=renderToStaticMarkup(<BannerCarousel slides={[item]} />);expect(single).not.toContain("Banner sebelumnya");expect(single).not.toContain("Tampilkan banner");
    const multiple=renderToStaticMarkup(<BannerCarousel slides={[item,{...item,id:"two"}]} />);expect(multiple).toContain("Banner sebelumnya");expect(multiple).toContain("inert");expect(multiple).toContain("Jeda pergantian otomatis");
  });
  it("uses public breakpoint classes and exact preview geometry with no text/button CTA overlay",()=>{
    const html=renderToStaticMarkup(<BannerCarousel slides={[item]} previewWidth={1280} />);expect(html).toContain("aspect-[2/1]");expect(html).toContain("xl:aspect-[21/9]");expect(html).toContain("aspect-ratio:21 / 9");expect(html).not.toContain("<h2");expect(html).not.toContain("<button");
  });
  it("escapes dealer FAQ text instead of rendering user HTML",()=>{
    const html=renderToStaticMarkup(<FaqSection content={{profile:null,showroomUrl:null,items:[{...item,kind:"FAQ",link:"",body:"<script>alert(1)</script>"}]}} />);expect(html).toContain("&lt;script&gt;");expect(html).not.toContain("<script>");
  });
});
