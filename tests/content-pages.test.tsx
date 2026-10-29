import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const data=vi.hoisted(()=>({dealer:{dealerName:"Dealer Test",logoUrl:null,whatsappNumber:"6281234567890",phone:null,email:null,address:"Alamat showroom test",googleMapsUrl:"https://maps.google.com/test",instagramUrl:null,facebookUrl:null,primaryColor:null,secondaryColor:null},content:{profile:{dealerId:"default",welcomeTitle:"Selamat Datang",welcomeBody:"Informasi dealer test.",welcomeActive:true,aboutSummary:"Ringkasan dealer test.",aboutStory:"Cerita dealer test.",aboutActive:true,showroomKey:null,showroomAlt:"",operatingHours:"Senin 09:00–17:00",operatingHoursActive:true,updatedAt:new Date()},showroomUrl:null,items:[{id:"hero",kind:"MAIN_BANNER",title:"Banner test",body:"",link:"/cars",active:true,sortOrder:0,mediaUrl:"/uploads/banner.jpg"},{id:"promo",kind:"PROMO_BANNER",title:"Promo test",body:"",link:"",active:true,sortOrder:0,mediaUrl:"/uploads/promo.jpg"},{id:"advantage",kind:"ADVANTAGE",title:"Keunggulan test",body:"Fakta test",link:"",active:true,sortOrder:0,mediaUrl:null},{id:"faq",kind:"FAQ",title:"Pertanyaan test",body:"Jawaban test",link:"",active:true,sortOrder:0,mediaUrl:null},{id:"partner",kind:"LEASING_PARTNER",title:"Partner test",body:"",link:"",active:true,sortOrder:0,mediaUrl:"/uploads/partner.jpg"}]}}));
vi.mock("next/server",()=>({connection:vi.fn()}));
vi.mock("next/image",()=>({default:({alt,src}: {alt:string;src:string})=><span role="img" aria-label={alt} data-src={src} />}));
vi.mock("next/link",()=>({default:({children,...props}:{children:React.ReactNode;href:string})=><a {...props}>{children}</a>}));
vi.mock("@/server/content/service",()=>({getPublicDealerContent:async()=>data.content}));
vi.mock("@/server/homepage/service",()=>({getDealerPresentation:async()=>data.dealer,getHomepageData:async()=>({dealer:data.dealer,brands:[],featuredCars:Array.from({length:3},(_,i)=>({id:`featured-${i}`,slug:`car-${i}`,condition:"NEW",brand:"Test",model:"Model",variant:"Variant",year:2026,price:"100000000",transmission:"Automatic",mileage:null,imageUrl:null})),latestCars:Array.from({length:6},(_,i)=>({id:`latest-${i}`,slug:`latest-${i}`,condition:"USED",brand:"Test",model:"Model",variant:"Variant",year:2025,price:"90000000",transmission:"Automatic",mileage:1000,imageUrl:null}))})}));
import HomePage,{generateMetadata as homeMetadata} from "@/app/(public)/page";
import AboutPage,{generateMetadata as aboutMetadata} from "@/app/(public)/about/page";
describe("dealer content page wiring (mocked reads)",()=>{
  it("wires agreed Homepage sections and limits displayed inventory to six",async()=>{
    const html=renderToStaticMarkup(await HomePage());
    for(const text of ["Banner utama","Selamat Datang","Pencarian mobil","Promo dealer","Mobil Tersedia","Tentang Kami","Kenapa Memilih Kami","Partner Leasing","Pertanyaan yang Sering Diajukan","Hubungi Dealer Test"])expect(html).toContain(text);
    expect(html).toContain('name="minPrice"');expect(html).toContain('name="maxPrice"');
    expect(html).toContain('/cars/latest-2');expect(html).not.toContain('/cars/latest-3');expect(html).toContain('href="https://wa.me/6281234567890"');
  });
  it("uses the same profile and factual advantages on /about",async()=>{
    const html=renderToStaticMarkup(await AboutPage());expect(html).toContain("Cerita dealer test.");expect(html).toContain("Keunggulan test");expect(html).toContain("Senin 09:00–17:00");expect(html).toContain('href="/cars"');
    const metadata=await aboutMetadata();expect(metadata.alternates?.canonical).toBe("/about");expect(metadata.description).toBe(data.content.profile.aboutSummary);
    expect((await homeMetadata()).alternates?.canonical).toBe("/");
  });
});
