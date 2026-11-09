import { beforeEach, describe, expect, it, vi } from "vitest";
import { categorySchema, serviceSchema, articleSchema, editorialFormInput } from "@/validation/editorial";
import { assertDemoEnvironment, demoItems, demoArticles } from "../prisma/demo-content";
import { createEditorialMediaKey, isEditorialMediaKey } from "@/services/storage/key";
import { contentItemSchema } from "@/validation/dealer-content";
import { visibleItems } from "@/features/content/domain";
import { imageFile } from "./fixtures/images";
const m = vi.hoisted(() => ({ auth: vi.fn(), lock: vi.fn(), find: vi.fn(), category: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), count: vi.fn(), list: vi.fn(), put: vi.fn(), erase: vi.fn(), refresh: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: m.auth }));
vi.mock("next/cache", () => ({ revalidatePath: m.refresh }));
vi.mock("@/server/log", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/storage", () => ({ getStorageProvider: () => ({ put: m.put, delete: m.erase, publicUrl: (key: string) => `/uploads/${key}` }) }));
vi.mock("@/db/client", () => {
  const entity = { findFirst: m.find, findMany: m.list, create: m.create, update: m.update, delete: m.remove, count: m.count };
  const tx = { $queryRaw: m.lock, dealerSettings: { upsert: vi.fn(), count: m.count }, serviceCategory: { ...entity, findFirst: m.category }, showroomService: entity, article: entity, dealerContentItem: { count: m.count }, dealerContent: { count: m.count }, carImage: { count: m.count } };
  return { db: { ...tx, $transaction: (fn: (tx: unknown) => unknown) => fn(tx) } };
});
import { saveEditorial, deleteEditorial, getAdminEditorial, getPublishedServices, getPublishedArticles, getPublishedEditorialBySlug } from "@/server/editorial/service";
import { saveEditorialAction, deleteEditorialAction } from "@/server/editorial/actions";
const article = { title: "Panduan mobil", slug: "Panduan Mobil", excerpt: "Ringkasan", body: "Isi faktual", imageAlt: "", status: "PUBLISHED" as const };
const service = { ...article, categoryId: "cat", shortDescription: "Ringkasan", homepageVisible: true, sortOrder: 0, excerpt: undefined };
const serviceInput = () => { const { excerpt: _, ...input } = service; void _; return input; };
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "admin" }); m.lock.mockResolvedValue([{ id: "default" }]); m.find.mockResolvedValue(null); m.category.mockResolvedValue({ id: "cat", active: true }); m.count.mockResolvedValue(0); m.list.mockResolvedValue([]); });
describe("editorial validation and demo contract", () => {
  it("normalizes slugs and rejects blank or invalid publication", () => { expect(articleSchema.parse(article).slug).toBe("panduan-mobil"); expect(articleSchema.safeParse({ ...article, body: " " }).success).toBe(false); expect(articleSchema.safeParse({ ...article, status: "DRAFT", body: "", excerpt: "" }).success).toBe(true); });
  it("rejects ownership and storage mass assignment", () => { for (const key of ["dealerSettingsId", "dealerId", "imageStorageKey", "publishedAt"]) expect(articleSchema.safeParse({ ...article, [key]: "foreign" }).success).toBe(false); });
  it("rejects extra and duplicated form fields", () => { const form = new FormData(); form.set("dealerSettingsId", "foreign"); expect(() => editorialFormInput("article", form)).toThrow(); form.delete("dealerSettingsId"); form.append("title", "a"); form.append("title", "b"); expect(() => editorialFormInput("article", form)).toThrow(); });
  it("validates categories and ownership-free service inputs", () => { expect(categorySchema.safeParse({ name: "Demo", slug: "demo", description: "", active: false, sortOrder: -1 }).success).toBe(false); expect(serviceSchema.parse(serviceInput()).categoryId).toBe("cat"); });
  it("uses a bounded trusted editorial namespace", () => { const key = createEditorialMediaKey("article", "image/png", "qa-id"); expect(isEditorialMediaKey(key)).toBe(true); for (const invalid of ["../private.png", key.replace("default", "other"), key.replace("qa-id", "..")]) expect(isEditorialMediaKey(invalid)).toBe(false); expect(() => createEditorialMediaKey("article", "text/html")).toThrow(); });
  it("requires real testimonial attribution and quote without links", () => { const item = { kind: "TESTIMONIAL", title: "Authorized attribution", body: "Authorized quote", link: "", active: true, sortOrder: 0 }; expect(contentItemSchema.safeParse(item).success).toBe(true); expect(contentItemSchema.safeParse({ ...item, body: " " }).success).toBe(false); expect(contentItemSchema.safeParse({ ...item, link: "/cars" }).success).toBe(false); expect(visibleItems([{ ...item, kind: "TESTIMONIAL", id: "qa", active: false, mediaUrl: null }], "TESTIMONIAL")).toEqual([]); });
  it("refuses production, non-demo databases, and nonlocal storage", () => { const env = { DEMO_CONTENT: "true", NODE_ENV: "development", DEPLOYMENT_ENV: "staging", DATABASE_URL: "postgresql://agent@127.0.0.1/dynicty_automotive_demo_qa", STORAGE_PROVIDER: "local" }; expect(assertDemoEnvironment(env)).toBe("dynicty_automotive_demo_qa"); for (const change of [{ NODE_ENV: "production" }, { DEMO_CONTENT: "false" }, { DATABASE_URL: "postgresql://agent@127.0.0.1/customer" }, { STORAGE_PROVIDER: "r2" }]) expect(() => assertDemoEnvironment({ ...env, ...change })).toThrow(); expect(demoItems.some(item => String(item.kind) === "TESTIMONIAL")).toBe(false); expect(demoArticles.every(item => item.body.length > 800)).toBe(true); });
});
describe("authenticated owner-qualified editorial services (mocked DB)", () => {
  it("guards every admin read and mutation before database access", async () => { m.auth.mockRejectedValue(new Error("unauthorized")); for (const call of [() => getAdminEditorial(), () => saveEditorial("article", article), () => deleteEditorial("article", "qa"), () => saveEditorialAction("article", { message: "", errors: {} }, new FormData()), () => deleteEditorialAction("article", { message: "", errors: {} }, new FormData())]) await expect(call()).rejects.toThrow("unauthorized"); expect(m.lock).not.toHaveBeenCalled(); expect(m.list).not.toHaveBeenCalled(); });
  it("rejects crafted direct service inputs before persistence", async () => { await expect(saveEditorial("article", { ...article, dealerSettingsId: "foreign" })).rejects.toThrow(); expect(m.lock).not.toHaveBeenCalled(); });
  it("persists only the trusted legacy owner and server publication time", async () => { await saveEditorial("article", article); expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ dealerSettingsId: "default", publishedAt: expect.any(Date), slug: "panduan-mobil" }) }); });
  it("rejects foreign or missing edit and deletion targets", async () => { await expect(saveEditorial("article", { ...article, id: "foreign" })).rejects.toThrow("tidak ditemukan"); await expect(deleteEditorial("article", "foreign")).rejects.toThrow("tidak ditemukan"); expect(m.find).toHaveBeenCalledWith({ where: { id: "foreign", dealerSettingsId: "default", dealerSettings: { dealerId: null } } }); expect(m.update).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled(); });
  it("rejects a foreign or inactive service category", async () => { m.category.mockResolvedValue(null); await expect(saveEditorial("service", serviceInput())).rejects.toThrow("milik showroom"); m.category.mockResolvedValue({ active: false }); await expect(saveEditorial("service", serviceInput())).rejects.toThrow("Aktifkan"); expect(m.create).not.toHaveBeenCalled(); });
  it("clears publication time on unpublish", async () => { m.find.mockResolvedValue({ id: "qa", slug: "old", publishedAt: new Date(), imageStorageKey: null }); await saveEditorial("article", { ...article, id: "qa", status: "DRAFT" }); expect(m.update).toHaveBeenCalledWith({ where: expect.objectContaining({ dealerSettingsId: "default", id: "qa" }), data: expect.objectContaining({ publishedAt: null }) }); });
  it("prevents deletion of a category with services", async () => { m.count.mockResolvedValue(1); await expect(deleteEditorial("category", "cat")).rejects.toThrow("Pindahkan"); expect(m.remove).not.toHaveBeenCalled(); });
  it("bounds public reads and excludes draft, foreign and inactive categories", async () => { await getPublishedServices(999999, "demo", true); expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ take: 12, skip: 11988, where: expect.objectContaining({ dealerSettingsId: "default", dealerSettings: { dealerId: null }, status: "PUBLISHED", homepageVisible: true, category: expect.objectContaining({ dealerSettingsId: "default", active: true, slug: "demo" }) }) })); await getPublishedArticles(); expect(m.list).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED", publishedAt: { lte: expect.any(Date) } }) })); expect(await getPublishedEditorialBySlug("article", "../private")).toBeNull(); });
  it("rejects invalid file bytes and compensates failed database writes", async () => { await expect(saveEditorial("article", article, new File(["MZ"], "fake.png", { type: "image/png" }))).rejects.toThrow(); expect(m.put).not.toHaveBeenCalled(); m.create.mockRejectedValue(new Error("database unavailable")); await expect(saveEditorial("article", { ...article, imageAlt: "Cover" }, imageFile("png", "image.png"))).rejects.toThrow("database unavailable"); expect(m.erase).toHaveBeenCalledWith(expect.stringMatching(/^dealers\/default\/editorial\/article\//)); });
  it("retains shared media after a row deletion", async () => { m.find.mockResolvedValue({ id: "qa", slug: "qa", imageStorageKey: createEditorialMediaKey("article", "image/png", "shared") }); m.count.mockResolvedValue(1); await deleteEditorial("article", "qa"); expect(m.remove).toHaveBeenCalled(); expect(m.erase).not.toHaveBeenCalled(); });
  it("requires explicit delete confirmation", async () => { const form = new FormData(); form.set("id", "qa"); expect((await deleteEditorialAction("article", { message: "", errors: {} }, form)).status).toBe("error"); expect(m.remove).not.toHaveBeenCalled(); });
});

 describe("editorial action feedback and invalidation",()=>{
 const form=()=>{const data=new FormData();for(const [key,value] of Object.entries({...article,id:"qa"}))data.set(key,value);return data;};
 it("invalidates both old and changed public slugs after a committed update",async()=>{
 m.find.mockResolvedValue({id:"qa",slug:"old-article",imageStorageKey:null,publishedAt:new Date()});
 expect((await saveEditorialAction("article",{message:"",errors:{}},form())).status).toBe("success");
 expect(m.refresh).toHaveBeenCalledWith("/articles/old-article");expect(m.refresh).toHaveBeenCalledWith("/articles/panduan-mobil");
 });
 it("keeps committed data and gives a warning when revalidation fails",async()=>{
 m.find.mockResolvedValue({id:"qa",slug:"old-article",imageStorageKey:null});m.refresh.mockImplementation(()=>{throw Error("cache unavailable");});
 expect((await saveEditorialAction("article",{message:"",errors:{}},form())).status).toBe("warning");expect(m.update).toHaveBeenCalled();expect(m.erase).not.toHaveBeenCalled();
 });
 it("deletes an unreferenced object only after removing its row",async()=>{
 m.find.mockResolvedValue({id:"qa",slug:"qa",imageStorageKey:createEditorialMediaKey("article","image/png","delete")});
 await deleteEditorial("article","qa");expect(m.erase).toHaveBeenCalledTimes(1);expect(m.remove.mock.invocationCallOrder[0]).toBeLessThan(m.erase.mock.invocationCallOrder[0]);
 });
 it("returns safe image feedback when storage fails",async()=>{
 m.put.mockRejectedValue(Error("private credentials and /internal/path"));const data=form();data.set("image",imageFile("png","qa.png"));data.set("imageAlt","QA");
 const result=await saveEditorialAction("article",{message:"",errors:{}},data);expect(result.status).toBe("error");expect(result.errors.image).toEqual(["Gambar belum dapat disimpan."]);expect(result.message).not.toContain("private");expect(m.update).not.toHaveBeenCalled();
 });
 });
