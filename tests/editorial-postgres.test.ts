import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertDemoEnvironment, seedDemoContent } from "../prisma/demo-content";
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "disposable-test-admin" }) }));
vi.mock("@/server/log", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
const url = process.env.EDITORIAL_TEST_DATABASE_URL;
if (url) assertDemoEnvironment({ DEMO_CONTENT: "true", NODE_ENV: "test", DEPLOYMENT_ENV: "development", DATABASE_URL: url, STORAGE_PROVIDER: "local" });
const database = url ? new PrismaClient({ datasourceUrl: url }) : null;
vi.mock("@/db/client", () => ({ get db() { if (!database) throw new Error("Disposable database required"); return database; } }));
import { saveEditorial, deleteEditorial, getPublishedArticles, getPublishedServices, getPublishedEditorialBySlug } from "@/server/editorial/service";
const env = { DEMO_CONTENT: "true", NODE_ENV: "test", DEPLOYMENT_ENV: "development", DATABASE_URL: url, STORAGE_PROVIDER: "local" };
afterAll(async () => { await database?.$disconnect(); });
describe.skipIf(!database)("editorial PostgreSQL integration — requires empty disposable demo DB; auth stubbed", () => {
  it("seeds idempotently and preserves operator changes", async () => {
    const db = database!; await seedDemoContent(db, env);
    await db.article.update({ where: { id: "demo-article-budget" }, data: { title: "Operator demo edit" } });
    await seedDemoContent(db, env);
    expect(await db.article.count()).toBe(2); expect(await db.showroomService.count()).toBe(2);
    expect((await db.article.findUniqueOrThrow({ where: { id: "demo-article-budget" } })).title).toBe("Operator demo edit");
    expect(await db.dealerContentItem.count({ where: { kind: "TESTIMONIAL" } })).toBe(0);
    expect(await db.adminUser.count()).toBe(0);
  });
  it("executes CRUD and publication with real owner constraints", async () => {
    await saveEditorial("category", { name: "QA category", slug: "qa-category", description: "", active: true, sortOrder: 1 });
    const category = await database!.serviceCategory.findUniqueOrThrow({ where: { dealerSettingsId_slug: { dealerSettingsId: "default", slug: "qa-category" } } });
    const values = { title: "QA service", slug: "qa-service", shortDescription: "QA only", body: "QA body", imageAlt: "", status: "PUBLISHED", categoryId: category.id, homepageVisible: true, sortOrder: 1 };
    await saveEditorial("service", values);
    const service = await database!.showroomService.findUniqueOrThrow({ where: { dealerSettingsId_slug: { dealerSettingsId: "default", slug: "qa-service" } } });
    expect((await getPublishedServices()).some(row => row.id === service.id)).toBe(true);
    await expect(deleteEditorial("category", category.id)).rejects.toThrow("Pindahkan");
    await saveEditorial("service", { ...values, id: service.id, status: "DRAFT" });
    expect(await getPublishedEditorialBySlug("service", "qa-service")).toBeNull();
    await deleteEditorial("service", service.id); await deleteEditorial("category", category.id);
  });
  it("rejects foreign category references at PostgreSQL and service boundaries", async () => {
    await database!.dealerSettings.create({ data: { id: "foreign-qa", dealerName: "Disposable foreign owner" } });
    await database!.serviceCategory.create({ data: { id: "foreign-qa-category", dealerSettingsId: "foreign-qa", name: "Foreign", slug: "foreign" } });
    await expect(database!.showroomService.create({ data: { dealerSettingsId: "default", categoryId: "foreign-qa-category", title: "Denied", slug: "denied" } })).rejects.toThrow();
    await expect(saveEditorial("service", { categoryId: "foreign-qa-category", title: "Denied", slug: "denied", shortDescription: "", body: "", imageAlt: "", status: "DRAFT", homepageVisible: false, sortOrder: 0 })).rejects.toThrow("milik showroom");
  });
  it("enforces real unique and CHECK constraints and hides foreign/draft rows", async () => {
    const db = database!;
    await expect(db.serviceCategory.create({ data: { dealerSettingsId: "default", name: "Duplicate", slug: "panduan-pemilihan" } })).rejects.toThrow();
    await expect(db.serviceCategory.create({ data: { dealerSettingsId: "default", name: "Invalid", slug: "INVALID slug" } })).rejects.toThrow();
    await expect(db.article.create({ data: { dealerSettingsId: "default", title: "Invalid publication", slug: "invalid", status: "PUBLISHED" } })).rejects.toThrow();
    await db.article.create({ data: { dealerSettingsId: "foreign-qa", title: "Foreign", slug: "foreign", status: "PUBLISHED", publishedAt: new Date() } });
    await saveEditorial("article", { title: "Draft QA", slug: "draft-qa", excerpt: "", body: "", imageAlt: "", status: "DRAFT" });
    expect((await getPublishedArticles()).map(row => row.dealerSettingsId)).toEqual(["default", "default"]);
    expect(await getPublishedEditorialBySlug("article", "foreign")).toBeNull(); expect(await getPublishedEditorialBySlug("article", "draft-qa")).toBeNull();
    await expect(seedDemoContent(db, env)).rejects.toThrow("customer");
  });
});
