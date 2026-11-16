import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("server-only",()=>({}));
import { TestimonialsSection } from "@/features/content/public-sections";
import { TestimonialCarousel, testimonialInitial, testimonialMaxIndex, testimonialVisibleCount } from "@/features/content/testimonial-carousel";

const testimonial=(id:string,title:string,body:string,active=true,sortOrder=0)=>({id,kind:"TESTIMONIAL" as const,title,body,link:"",active,sortOrder,mediaUrl:null});

describe("S5.2M.1 testimonial carousel",()=>{
  it("keeps the section hidden when CMS has no published testimonials",()=>{
    expect(TestimonialsSection({content:{profile:null,showroomUrl:null,items:[]}})).toBeNull();
    expect(TestimonialsSection({content:{profile:null,showroomUrl:null,items:[testimonial("draft","Pelanggan Draft","Belum dipublikasikan.",false)]}})).toBeNull();
  });

  it("renders only active CMS attribution and quotes without invented review metadata",()=>{
    const html=renderToStaticMarkup(<TestimonialsSection content={{profile:null,showroomUrl:null,items:[testimonial("one","Ayu Permata","Pelayanannya jelas dan responsif.",true,2),testimonial("hidden","Nama Rahasia","Tidak boleh tampil.",false,1)]}}/>);
    expect(html).toContain("Apa Kata Pelanggan Kami");
    expect(html).toContain("Ayu Permata");
    expect(html).toContain("Pelayanannya jelas dan responsif.");
    expect(html).not.toContain("Nama Rahasia");
    for(const unsupported of ["Google Reviews","5.0","review terverifikasi"])expect(html).not.toContain(unsupported);
  });

  it("provides carousel controls, pagination, semantic slides and responsive card widths",()=>{
    const items=Array.from({length:4},(_,index)=>({id:`review-${index}`,title:`Pelanggan ${index+1}`,body:`Testimoni ${index+1}`}));
    const html=renderToStaticMarkup(<TestimonialCarousel items={items}/>);
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('aria-label="Testimoni sebelumnya"');
    expect(html).toContain('aria-label="Testimoni berikutnya"');
    expect(html).toContain("sm:basis-[calc((100%-1rem)/2)]");
    expect(html).toContain("lg:basis-[calc((100%-2rem)/3)]");
    expect((html.match(/aria-roledescription="slide"/g)??[])).toHaveLength(4);
    expect(html).not.toContain("autoplay");
  });

  it("calculates mobile, tablet and desktop windows without empty pages",()=>{
    expect([390,768,1280].map(testimonialVisibleCount)).toEqual([1,2,3]);
    expect(testimonialMaxIndex(5,1)).toBe(4);
    expect(testimonialMaxIndex(5,2)).toBe(3);
    expect(testimonialMaxIndex(5,3)).toBe(2);
    expect(testimonialMaxIndex(2,3)).toBe(0);
  });

  it("uses a neutral initial avatar fallback without fabricating a photo",()=>{
    expect(testimonialInitial("  ayu permata ")).toBe("A");
    expect(testimonialInitial(" ")).toBe("?");
    const html=renderToStaticMarkup(<TestimonialCarousel items={[{id:"one",title:"Ayu Permata",body:"Testimoni asli."}]}/>);
    expect(html).toContain(">A<");
    expect(html).not.toContain("<img");
  });
});
