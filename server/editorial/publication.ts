import "server-only";
import { db } from "@/db/client";
import { logger } from "@/server/log";
import { publishedEditorialWhere } from "./public-scope";
export async function resolveEditorialPublication(kind: "service" | "article", slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return "not-found";
  try {
    const where = { ...publishedEditorialWhere(kind), slug };
    const row = kind === "service" ? await db.showroomService.findFirst({ where, select: { id: true } }) : await db.article.findFirst({ where, select: { id: true } });
    return row ? "available" : "not-found";
  } catch { logger.error("public.editorial_publication_failed"); return "error"; }
}
