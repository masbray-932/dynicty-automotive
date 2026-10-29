import { describe, expect, it } from "vitest";
import { bannerFit, bannerRatio, canActivateMain, safeContentLink, visibleItems, type PublicContentItem } from "@/features/content/domain";
import { contentItemSchema, dealerContentSchema } from "@/validation/dealer-content";
import { createContentMediaKey } from "@/services/storage/key";
import { parseCatalogFilters } from "@/features/catalog/domain";
const item:PublicContentItem={id:"a",kind:"MAIN_BANNER",title:"Banner",body:"",link:"/cars",active:true,sortOrder:0,mediaUrl:"/uploads/banner.jpg"};
describe("dealer CMS domain",()=>{
  it("renders landscape and square cover, portrait contain; invalid sizes do not change geometry",()=>{
    expect(bannerFit(1600,800)).toBe("cover");expect(bannerFit(800,800)).toBe("cover");expect(bannerFit(800,1200)).toBe("contain");expect(bannerFit(0,1200)).toBe("cover");expect(bannerFit(NaN,1200)).toBe("cover");
    expect(bannerRatio(390)).toBe("2 / 1");expect(bannerRatio(768)).toBe("2 / 1");expect(bannerRatio(1279)).toBe("2 / 1");expect(bannerRatio(1280)).toBe("21 / 9");
  });
  it("accepts safe local/HTTPS destinations and rejects scheme, credentials and proxy escapes",()=>{
    for(const url of ["","/cars","/cars?condition=NEW","https://example.com/promo"])expect(safeContentLink(url)).toBe(true);
    for(const url of ["javascript:alert(1)","data:text/html,test","http://example.com","//evil.test","/\\evil.test","/%2fevil.test","https://user:secret@evil.test","https://example.com/%0aevil"])expect(safeContentLink(url)).toBe(false);
  });
  it("hides inactive, missing-media and unsafe items; sorts and caps main slides",()=>{
    const list=[{...item,id:"inactive",active:false},{...item,id:"empty",mediaUrl:null},{...item,id:"unsafe",link:"javascript:evil"},...Array.from({length:8},(_,i)=>({...item,id:String(i),sortOrder:8-i}))];
    expect(visibleItems(list,"MAIN_BANNER").map(i=>i.id)).toEqual(["7","6","5","4","3"]);
    expect(canActivateMain(4)).toBe(true);expect(canActivateMain(5)).toBe(false);
  });
  it("requires FAQ/advantage bodies and omits empty content",()=>{
    expect(contentItemSchema.safeParse({...item,kind:"FAQ",body:"",link:""}).success).toBe(false);
    expect(visibleItems([{...item,kind:"FAQ",body:" "}],"FAQ")).toEqual([]);
    expect(contentItemSchema.safeParse({...item,kind:"ADVANTAGE",body:"Factual",link:""}).success).toBe(true);
  });
  it("rejects active incomplete profile; allows truly empty inactive profile",()=>{
    const profile={welcomeTitle:"",welcomeBody:"",welcomeActive:false,aboutSummary:"",aboutStory:"",aboutActive:false,showroomAlt:"",operatingHours:""};
    expect(dealerContentSchema.safeParse(profile).success).toBe(true);
    expect(dealerContentSchema.safeParse({...profile,welcomeActive:true}).success).toBe(false);
    expect(dealerContentSchema.safeParse({...profile,aboutActive:true}).success).toBe(false);
    expect(dealerContentSchema.safeParse({...profile,aboutStory:"x".repeat(12001)}).success).toBe(false);
  });
  it("generates owner-scoped media keys without user filenames or paths",()=>{
    expect(createContentMediaKey("main_banner","image/jpeg","fixed")).toBe("dealers/default/content/main_banner/fixed.jpg");
    expect(()=>createContentMediaKey("../other","image/png","fixed")).toThrow();
    expect(()=>createContentMediaKey("showroom","image/svg+xml","fixed")).toThrow();
    expect(()=>createContentMediaKey("showroom","image/png","../x")).toThrow();
  });
  it("keeps Homepage price search on the catalog server parsing contract",()=>{
    const {filters}=parseCatalogFilters({condition:"USED",brand:"toyota",minPrice:"100000000",maxPrice:"250000000"});
    expect(filters.minPrice).toBe("100000000");expect(filters.maxPrice).toBe("250000000");expect(filters.condition).toBe("USED");
  });
});
