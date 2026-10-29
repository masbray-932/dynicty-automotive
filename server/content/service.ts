import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import { getStorageProvider } from "@/services/storage";
import { logger } from "@/server/log";
import type { PublicContentItem } from "@/features/content/domain";
import { requireAdmin } from "@/server/auth/session";
export function contentMediaUrl(key: string | null) {
  if (!key) return null;
  try { return getStorageProvider().publicUrl(key); } catch { logger.warn("content.media_url_failed"); return null; }
}
export const getPublicDealerContent = cache(async () => {
  try {
    const [profile, items] = await Promise.all([
      db.dealerContent.findUnique({where:{dealerId:"default"}}),
      db.dealerContentItem.findMany({where:{dealerId:"default",active:true},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:150}),
    ]);
    return {profile, showroomUrl: contentMediaUrl(profile?.showroomKey ?? null), items:items.map(item => ({id:item.id, kind:item.kind, title:item.title, body:item.body, link:item.link, active:item.active, sortOrder:item.sortOrder, mediaUrl:contentMediaUrl(item.mediaKey)}))};
  } catch { logger.error("public.content_read_failed"); return {profile:null,showroomUrl:null,items:[] as PublicContentItem[]}; }
});
export async function getAdminDealerContent() {
  await requireAdmin();
  const [profile, items] = await Promise.all([
    db.dealerContent.findUnique({where:{dealerId:"default"}}),
    db.dealerContentItem.findMany({where:{dealerId:"default"},orderBy:[{kind:"asc"},{sortOrder:"asc"},{id:"asc"}],take:150}),
  ]);
  return {profile, showroomUrl:contentMediaUrl(profile?.showroomKey ?? null),items:items.map(item=>({...item,mediaUrl:contentMediaUrl(item.mediaKey)}))};
}
