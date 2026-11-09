import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { mergeDealerPresentation } from "@/features/homepage/domain";
import { publicNavigation } from "@/components/public/navigation";
import { buildSellCarWhatsapp, sellCarSchema } from "@/features/sell-car/domain";
import { generatedDemoPng } from "../prisma/demo-media";
import { demoVehicles, demoBrands, demoModels, demoVehicleImages } from "../prisma/demo-inventory";
const m=vi.hoisted(()=>({services:vi.fn(),articles:vi.fn(),categories:vi.fn(),serviceCount:vi.fn(),articleCount:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({db:{showroomService:{findFirst:m.services,findMany:m.services,count:m.serviceCount},article:{findFirst:m.articles,findMany:m.articles,count:m.articleCount},serviceCategory:{findMany:m.categories}}}));
vi.mock("@/services/storage",()=>({getStorageProvider:()=>({publicUrl:(key:string)=>`/uploads/${key}`})}));
vi.mock("@/server/auth/session",()=>({requireAdmin:vi.fn()}));
vi.mock("@/server/log",()=>({logger:{error:vi.fn()}}));
import { publicPage, getPublicEditorialList, getPublicEditorialDetail, getEditorialSitemapEntries } from "@/server/editorial/public";
import { resolveEditorialPublication } from "@/server/editorial/publication";
import { EditorialDetail } from "@/features/editorial/public-content";
import { SellCarInquiry } from "@/features/sell-car/inquiry-form";
const inquiry={name:"QA User",contact:"081234567890",brand:"Toyota",model:"Avanza",year:"2024",transmission:"Manual",mileage:"12000",price:"200000000",notes:"Catatan & pertanyaan"};
beforeEach(()=>{vi.clearAllMocks();m.services.mockResolvedValue([]);m.articles.mockResolvedValue([]);m.categories.mockResolvedValue([]);m.serviceCount.mockResolvedValue(0);m.articleCount.mockResolvedValue(0);});
describe("approved public structure and WhatsApp inquiry",()=>{
 it("defines exactly seven shared approved labels and destinations",()=>{expect(publicNavigation.map(link=>link.label)).toEqual(["Beranda","Tentang Kami","Layanan","Jual Mobil","Beli Mobil","Artikel","Kontak Kami"]);expect(publicNavigation.map(link=>link.href)).toEqual(["/","/about","/services","/sell-car","/cars","/articles","/contact"]);});
 it("renders exactly seven navigation links in desktop, mobile and footer",()=>{
 const dealer=mergeDealerPresentation({dealerName:"QA dealer",whatsappNumber:"12025550123"});const header=renderToStaticMarkup(<SiteHeader dealer={dealer}/>);const footer=renderToStaticMarkup(<SiteFooter dealer={dealer}/>);
 for(const [html,label]of [[header,"Navigasi utama"],[header,"Navigasi seluler"],[footer,"Navigasi footer"]]){const section=html.match(new RegExp('<nav[^>]*aria-label="'+label+'"[^>]*>([\\s\\S]*?)</nav>'))?.[1];expect(section).toBeDefined();expect(section?.match(/<a /g)).toHaveLength(7);}
 });
 it("builds an encoded inquiry only for the configured safe WhatsApp number",()=>{const result=buildSellCarWhatsapp("+1 202 555 0123",inquiry,2026)!;const url=new URL(result);expect(url.origin).toBe("https://wa.me");expect(url.pathname).toBe("/12025550123");expect(url.searchParams.get("text")).toContain("Toyota Avanza");expect(url.searchParams.get("text")).toContain("Catatan & pertanyaan");expect(url.searchParams.get("text")).toContain("bukan persetujuan");expect(buildSellCarWhatsapp(null,inquiry)).toBeNull();expect(buildSellCarWhatsapp("javascript:alert(1)",inquiry)).toBeNull();});
 it.each(["name","contact","brand","model","year","transmission","mileage","price"])("rejects missing %s without accepting silently coerced values",field=>{expect(sellCarSchema(2026).safeParse({...inquiry,[field]:""}).success).toBe(false);});
 it("rejects impossible numeric values and oversized notes",()=>{for(const patch of [{year:2030},{mileage:-1},{price:0},{contact:"<script>"},{notes:"x".repeat(2001)}])expect(sellCarSchema(2026).safeParse({...inquiry,...patch}).success).toBe(false);});
 it("handles missing WhatsApp gracefully and never creates a public POST form",()=>{expect(renderToStaticMarkup(<SellCarInquiry number={null}/>)).toContain("belum tersedia");const html=renderToStaticMarkup(<SellCarInquiry number="12025550123"/>);expect(html).toContain('name="contact"');expect(html).not.toContain('method="post"');expect(html).toContain('<fieldset disabled=""');expect(html).toContain("tidak menyimpan");});
 it("escapes article body and suppresses arbitrary storage data",()=>{const html=renderToStaticMarkup(<EditorialDetail base="/articles" item={{id:"qa",slug:"qa",title:"Title",summary:"Summary",body:'<script>alert("x")</script>',imageUrl:null,imageAlt:"",publishedAt:null}}/>);expect(html).toContain("&lt;script&gt;");expect(html).not.toContain("<script>");expect(html).not.toContain("imageStorageKey");});
});
describe("published CMS ownership and status boundaries (mocked DB)",()=>{
 it("bounds pages and rejects malformed category selection",async()=>{expect(publicPage("99999")).toBe(1);expect(publicPage("9999")).toBe(1000);expect(publicPage(["2","3"])).toBe(2);expect(await getPublicEditorialList("service",1,"../foreign")).toEqual({items:[],count:0,categories:[]});expect(m.services).not.toHaveBeenCalled();});
 it("qualifies category filtering and counts by trusted legacy owner",async()=>{await getPublicEditorialList("service",2,"panduan");expect(m.services).toHaveBeenCalledWith(expect.objectContaining({skip:12,take:12,where:expect.objectContaining({dealerSettingsId:"default",dealerSettings:{dealerId:null},status:"PUBLISHED",category:expect.objectContaining({dealerSettingsId:"default",active:true,slug:"panduan"})})}));expect(m.serviceCount).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({dealerSettingsId:"default",status:"PUBLISHED"})}));});
 it("maps safe media URLs and never returns raw owner or storage keys",async()=>{m.articles.mockResolvedValue([{id:"qa",slug:"qa",title:"Title",body:"Text",excerpt:"Summary",imageStorageKey:"dealers/default/editorial/article/qa.png",imageAlt:"Cover",updatedAt:new Date(),dealerSettingsId:"default"}]);const data=await getPublicEditorialList("article");expect(data.items[0].imageUrl).toBe("/uploads/dealers/default/editorial/article/qa.png");expect(data.items[0]).not.toHaveProperty("imageStorageKey");expect(data.items[0]).not.toHaveProperty("dealerSettingsId");});
 it("blocks missing details and produces publication-filtered sitemap queries",async()=>{m.services.mockResolvedValue(null);expect(await getPublicEditorialDetail("service","missing")).toBeNull();expect(await resolveEditorialPublication("service","missing")).toBe("not-found");expect(await resolveEditorialPublication("article","../private")).toBe("not-found");m.services.mockResolvedValue([]);await getEditorialSitemapEntries();expect(m.articles).toHaveBeenCalledWith(expect.objectContaining({take:1000,where:expect.objectContaining({dealerSettingsId:"default",status:"PUBLISHED",publishedAt:{lte:expect.any(Date)}})}));});
});
describe("original editable demo inventory",()=>{
 it("covers conditions, brands, models, prices, transmissions and hidden inventory",()=>{expect(demoVehicles).toHaveLength(16);expect(demoVehicles.filter(row=>row.status==="AVAILABLE")).toHaveLength(14);expect(demoBrands).toHaveLength(4);expect(demoModels).toHaveLength(8);expect(new Set(demoVehicles.map(row=>row.condition)).size).toBe(2);expect(new Set(demoVehicles.map(row=>row.transmission)).size).toBe(2);expect(demoVehicleImages.every(image=>demoVehicles.some(car=>car.id===image.carId))).toBe(true);});
 it("generates original validated static PNG imagery without external assets",async()=>{const bytes=await generatedDemoPng("QA illustration");expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);expect(bytes.length).toBeLessThan(8*1024*1024);});
});
