import { beforeEach, describe, expect, it, vi } from "vitest";
import { imageFile } from "./fixtures/images";
const mocks=vi.hoisted(()=>({auth:vi.fn(),put:vi.fn(),remove:vi.fn(),refresh:vi.fn(),lock:vi.fn(),find:vi.fn(),count:vi.fn(),create:vi.fn(),update:vi.fn(),deleteItem:vi.fn(),profileFind:vi.fn(),profileUpsert:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/server/auth/session",()=>({requireAdmin:mocks.auth}));
vi.mock("next/cache",()=>({revalidatePath:mocks.refresh}));
vi.mock("@/server/log",()=>({logger:{error:vi.fn(),warn:vi.fn()}}));
vi.mock("@/services/storage",()=>({getStorageProvider:()=>({put:mocks.put,delete:mocks.remove})}));
vi.mock("@/db/client",()=>({db:{$transaction:async (fn:(tx:unknown)=>unknown)=>fn({dealerSettings:{upsert:vi.fn()},$queryRaw:mocks.lock,dealerContentItem:{findFirst:mocks.find,count:mocks.count,create:mocks.create,update:mocks.update,delete:mocks.deleteItem},dealerContent:{findUnique:mocks.profileFind,upsert:mocks.profileUpsert}})}}));
import { saveContentItemAction, saveDealerContentAction, deleteContentItemAction } from "@/server/content/actions";
const empty={message:"",errors:{}};
function form(values:Record<string,string>={}) {const data=new FormData();for(const [key,value] of Object.entries({kind:"MAIN_BANNER",title:"Preview",body:"",link:"/cars",sortOrder:"0",active:"on",...values}))data.set(key,value);return data;}
function png(){return imageFile("png", "../../fake.png");}
beforeEach(()=>{vi.resetAllMocks();mocks.auth.mockResolvedValue({id:"admin"});mocks.count.mockResolvedValue(0);mocks.find.mockResolvedValue(null);mocks.profileFind.mockResolvedValue(null);mocks.put.mockResolvedValue({});mocks.remove.mockResolvedValue(undefined);});
describe("CMS authenticated mutation boundaries (mocked services, not DB integration)",()=>{
  it("authenticates every action before validation or persistence",async()=>{
    mocks.auth.mockRejectedValue(new Error("unauthorized"));
    for(const action of [saveContentItemAction,saveDealerContentAction,deleteContentItemAction])await expect(action(empty,new FormData())).rejects.toThrow("unauthorized");
    expect(mocks.lock).not.toHaveBeenCalled();expect(mocks.put).not.toHaveBeenCalled();
  });
  it("rejects the sixth active main banner under owner lock and compensates upload",async()=>{
    mocks.count.mockResolvedValue(5);const data=form();data.set("image",png());
    const result=await saveContentItemAction(empty,data);
    expect(result.message).toContain("Maksimal 5");expect(mocks.lock).toHaveBeenCalled();expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledWith(expect.stringMatching(/^dealers\/default\/content\/main_banner\//));expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("validates upload signatures before DB writes",async()=>{
    const data=form();data.set("image",new File(["MZ executable"],"banner.png",{type:"image/png"}));
    expect((await saveContentItemAction(empty,data)).message).toContain("Isi file");expect(mocks.put).not.toHaveBeenCalled();expect(mocks.lock).not.toHaveBeenCalled();
  });
  it("never mutates another owner/kind and removes newly uploaded media on missing id",async()=>{
    const data=form({id:"unknown"});data.set("image",png());await saveContentItemAction(empty,data);
    expect(mocks.find).toHaveBeenCalledWith({where:{id:"unknown",dealerId:"default",kind:"MAIN_BANNER"}});expect(mocks.update).not.toHaveBeenCalled();expect(mocks.remove).toHaveBeenCalled();
  });
  it("persists before deleting replaced media and refreshes public consumers",async()=>{
    mocks.find.mockResolvedValue({id:"existing",mediaKey:"old-key"});const data=form({id:"existing"});data.set("image",png());
    expect((await saveContentItemAction(empty,data)).message).toContain("berhasil");
    expect(mocks.update).toHaveBeenCalled();expect(mocks.remove).toHaveBeenCalledWith("old-key");
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);expect(mocks.refresh).toHaveBeenCalledWith("/about");expect(mocks.refresh).toHaveBeenCalledWith("/","page");
  });
  it("does not roll back successful DB references if old media cleanup fails",async()=>{
    mocks.find.mockResolvedValue({id:"existing",mediaKey:"old-key"});mocks.remove.mockRejectedValue(new Error("storage unavailable"));const data=form({id:"existing"});data.set("image",png());
    expect((await saveContentItemAction(empty,data)).message).toContain("manual");expect(mocks.remove).toHaveBeenCalledTimes(1);expect(mocks.refresh).toHaveBeenCalled();
  });
  it("retains committed new media when revalidation fails",async()=>{
    mocks.refresh.mockImplementation(()=>{throw new Error("refresh failed")});const data=form();data.set("image",png());
    expect((await saveContentItemAction(empty,data)).message).toContain("Konten disimpan");expect(mocks.create).toHaveBeenCalled();expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("requires explicit deletion confirmation and deletes DB reference before media",async()=>{
    await deleteContentItemAction(empty,form({id:"existing"}));expect(mocks.deleteItem).not.toHaveBeenCalled();
    mocks.find.mockResolvedValue({id:"existing",mediaKey:"old-key"});await deleteContentItemAction(empty,form({id:"existing",confirm:"on"}));
    expect(mocks.deleteItem.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0]);
  });
  it("cleans new showroom photo if profile transaction fails",async()=>{
    const data=new FormData();data.set("image",png());mocks.profileUpsert.mockRejectedValue(new Error("DB failed"));data.set("showroomAlt","Showroom preview");
    await saveDealerContentAction(empty,data);expect(mocks.remove).toHaveBeenCalled();expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("rejects truncated CMS media with an image-field error before storage",async()=>{
    const data=form();data.set("image",new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])],"truncated.png",{type:"image/png"}));
    const result=await saveContentItemAction(empty,data);
    expect(result.errors.image?.[0]).toContain("rusak");expect(mocks.put).not.toHaveBeenCalled();expect(mocks.lock).not.toHaveBeenCalled();
  });
  it("reports CMS storage permission failure without persisting or exposing paths",async()=>{
    mocks.put.mockRejectedValue(Object.assign(new Error("private /var/secret path"),{code:"EACCES"}));
    const data=form();data.set("image",png());const result=await saveContentItemAction(empty,data);
    expect(result.errors.image?.[0]).toContain("belum dapat ditulis");expect(result.message).not.toContain("/var");expect(mocks.create).not.toHaveBeenCalled();expect(mocks.remove).toHaveBeenCalled();
  });
  it("cleans new CMS media when DB create fails",async()=>{
    mocks.create.mockRejectedValue(new Error("DB unavailable"));const data=form();data.set("image",png());
    const result=await saveContentItemAction(empty,data);
    expect(result.status).toBe("error");expect(mocks.remove).toHaveBeenCalled();expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
