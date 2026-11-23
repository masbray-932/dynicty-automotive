import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { absoluteSiteUrl } from "@/lib/site-url";
const data=vi.hoisted(()=>({dealer:{dealerName:"Dealer Test",logoUrl:null,whatsappNumber:"6281234567890",phone:null,email:null,address:"Alamat showroom test",googleMapsUrl:"https://maps.google.com/test",instagramUrl:null,facebookUrl:null,primaryColor:null,secondaryColor:null,inventoryMode:"BOTH" as "BOTH"|"USED_ONLY"|"NEW_ONLY"},content:{profile:{dealerId:"default",welcomeTitle:"Selamat Datang",welcomeBody:"Informasi dealer test.",welcomeActive:true,aboutSummary:"Ringkasan dealer test.",aboutStory:"Cerita dealer test.",aboutActive:true,showroomKey:null,showroomAlt:"",operatingHours:"Senin 09:00–17:00",operatingHoursActive:true,updatedAt:new Date()},showroomUrl:null,items:[{id:"hero",kind:"MAIN_BANNER",title:"Banner test",body:"",link:"/cars",active:true,sortOrder:0,mediaUrl:"/uploads/banner.jpg"},{id:"promo",kind:"PROMO_BANNER",title:"Promo test",body:"",link:"",active:true,sortOrder:0,mediaUrl:"/uploads/promo.jpg"},{id:"advantage",kind:"ADVANTAGE",title:"Keunggulan test",body:"Fakta test",link:"",active:true,sortOrder:0,mediaUrl:null},{id:"testimonial",kind:"TESTIMONIAL",title:"Pelanggan test",body:"Testimoni yang diizinkan.",link:"",active:true,sortOrder:0,mediaUrl:null},{id:"faq",kind:"FAQ",title:"Pertanyaan test",body:"Jawaban test",link:"",active:true,sortOrder:0,mediaUrl:null},{id:"partner",kind:"LEASING_PARTNER",title:"Partner test",body:"",link:"",active:true,sortOrder:0,mediaUrl:"/uploads/partner.jpg"}]}}));
vi.mock("server-only",()=>({}));
vi.mock("@/server/dealer/registry",()=>({resolveDealerDomain:vi.fn()}));
vi.mock("next/server",()=>({connection:vi.fn()}));
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock("next/image",()=>({default:({alt,src}: {alt:string;src:string})=><span role="img" aria-label={alt} data-src={src} />}));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
vi.mock("@/server/content/service",()=>({getPublicDealerContent:async()=>data.content}));
vi.mock("@/server/homepage/service",()=>({getDealerPresentation:async()=>data.dealer,getHomepageData:async()=>({dealer:data.dealer,brands:[{name:"Toyota",slug:"toyota",logoUrl:"/uploads/toyota.webp",availableCars:3,models:[]}],cars:Array.from({length:6},(_,i)=>({id:`car-${i}`,slug:`car-${i}`,condition:i<3?"NEW":"USED",brand:"Test",model:"Model",variant:"Variant",year:2026,price:"100000000",transmission:"Automatic",mileage:i<3?null:1000,imageUrl:null})),inventoryPage:1,inventoryTotalPages:3,stockSummary:{availableCount:18,lastUpdatedAt:null}})}));
vi.mock("@/server/editorial/public",()=>({getHomepageServices:async()=>[]}));
vi.mock("@/server/sales-team/service",()=>({getPublicSalesTeam:async()=>[]}));
import HomePage,{generateMetadata as homeMetadata} from "@/app/(public)/page";
import AboutPage,{generateMetadata as aboutMetadata} from "@/app/(public)/about/page";
describe("dealer content page wiring (mocked reads)",()=>{
  it("wires agreed Homepage sections and limits displayed inventory to six",async()=>{
    const html=renderToStaticMarkup(await HomePage({searchParams:Promise.resolve({})}));
    for(const text of ["Banner utama","Selamat Datang","Promo &amp; Kategori Merek","Daftar Stok Mobil","Sekilas Tentang Kami","Mengapa Memilih Dealer Test?","Apa Kata Pelanggan Kami","Pelanggan test","Partner Leasing","Pertanyaan yang Sering Diajukan","Hubungi Dealer Test"])expect(html).toContain(text);
    expect(html).not.toContain("Pencarian mobil");expect(html).not.toContain('name="minPrice"');expect(html).not.toContain('name="maxPrice"');
    expect(html).toContain('href="/cars?brand=toyota"');expect(html).toContain("3 mobil tersedia");expect(html).toContain("Logo Toyota");
    expect(html).toContain('/cars/car-5');expect(html).not.toContain('/cars/car-6');expect(html).toContain('href="https://wa.me/6281234567890"');
  });
  it("keeps homepage inventory CTAs scoped to each dealer mode",async()=>{
    data.dealer.inventoryMode="USED_ONLY";
    const used=renderToStaticMarkup(await HomePage({searchParams:Promise.resolve({})}));
    expect(used).not.toContain('href="/cars?condition=NEW"');expect(used).toContain('href="/cars?condition=USED"');expect(used).toContain('href="/cars"');
    data.dealer.inventoryMode="BOTH";
    const both=renderToStaticMarkup(await HomePage({searchParams:Promise.resolve({})}));
    expect(both).toContain('href="/cars?condition=NEW"');expect(both).toContain('href="/cars?condition=USED"');
  });
  it("uses the same profile and factual advantages on /about",async()=>{
    const html=renderToStaticMarkup(await AboutPage());expect(html).toContain("Cerita dealer test.");expect(html).toContain("Keunggulan test");expect(html).toContain("Senin 09:00–17:00");expect(html).toContain('href="/cars"');
    const metadata=await aboutMetadata();expect(metadata.alternates?.canonical).toBe(absoluteSiteUrl("/about"));expect(metadata.description).toBe(data.content.profile.aboutSummary);
    expect((await homeMetadata()).alternates?.canonical).toBe(absoluteSiteUrl("/"));
  });
});
