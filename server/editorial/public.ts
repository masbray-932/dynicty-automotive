import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import { logger } from "@/server/log";
import { editorialOwner, publishedEditorialWhere } from "./public-scope";
import { editorialImageUrl, getPublishedServices, getPublishedArticles, getPublishedEditorialBySlug } from "./service";

export const publicPage = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && /^[1-9]\d{0,3}$/.test(raw) ? Math.min(1000, Number(raw)) : 1;
};
function presentation<T extends { id: string; slug: string; title: string; body: string; imageStorageKey: string | null; imageAlt: string; updatedAt: Date }>(row: T) {
  return { id: row.id, slug: row.slug, title: row.title, body: row.body, imageUrl: editorialImageUrl(row.imageStorageKey), imageAlt: row.imageAlt, updatedAt: row.updatedAt };
}
export async function getPublicEditorialList(kind: "service" | "article", page = 1, category?: string) {
  const slug = category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) && category.length <= 100 ? category : undefined;
  if (category && !slug) return { items: [], count: 0, categories: [] };
  const [rows, count, categories] = kind === "service"
    ? await Promise.all([getPublishedServices(page, slug), db.showroomService.count({ where: { ...publishedEditorialWhere("service"), ...(slug ? { category: { ...editorialOwner, active: true, slug } } : {}) } }), db.serviceCategory.findMany({ where: { ...editorialOwner, active: true }, select: { id: true, name: true, slug: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 100 })])
    : await Promise.all([getPublishedArticles(page), db.article.count({ where: publishedEditorialWhere("article") }), Promise.resolve([])]);
  return { items: rows.map(row => ({ ...presentation(row), summary: "excerpt" in row ? row.excerpt : row.shortDescription })), count, categories };
}
// Request-local memoization only: never a shared cross-installation cache.
export const getPublicEditorialDetail = cache(async (kind: "service" | "article", slug: string) => {
  const row = await getPublishedEditorialBySlug(kind, slug);
  return row ? { ...presentation(row), summary: "excerpt" in row ? row.excerpt : row.shortDescription, publishedAt: "publishedAt" in row ? row.publishedAt : null } : null;
});
export async function getHomepageServices() {
  try { return (await getPublishedServices(1, undefined, true)).slice(0, 6).map(row => ({ ...presentation(row), summary: row.shortDescription })); }
  catch { logger.error("public.homepage_services_failed"); return []; }
}
export async function getEditorialSitemapEntries() {
  try {
    const [services, articles] = await Promise.all([
      db.showroomService.findMany({ where: publishedEditorialWhere("service"), select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 1000 }),
      db.article.findMany({ where: publishedEditorialWhere("article"), select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 1000 }),
    ]);
    return [...services.map(row => ({ ...row, path: `/services/${row.slug}` })), ...articles.map(row => ({ ...row, path: `/articles/${row.slug}` }))];
  } catch { logger.error("public.editorial_sitemap_failed"); return []; }
}
