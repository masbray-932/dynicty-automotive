import "server-only";
import { cache } from "react";
import { db } from "@/db/client";
import { getStorageProvider } from "@/services/storage";
import { logger } from "@/server/log";
import type { PublicContentItem } from "@/features/content/domain";
import { requireAdmin } from "@/server/auth/session";
import { getLegacyPublicDealerScope, LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { ADVANTAGE_SECTION_TOKEN } from "@/features/content/domain";
export function contentMediaUrl(key: string | null) {
  if (!key) return null;
  try { return getStorageProvider().publicUrl(key); } catch { logger.warn("content.media_url_failed"); return null; }
}
export const getPublicDealerContent = cache(async () => {
  try {
    const { dealerId } = getLegacyPublicDealerScope();
    const [profile, items, advantageCount, advantageSection] = await Promise.all([
      db.dealerContent.findUnique({where:{dealerId,dealer:{dealerId:null}}}),
      db.dealerContentItem.findMany({where:{dealerId,dealer:{dealerId:null},active:true},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:180}),
      db.dealerContentItem.count({where:{dealerId,dealer:{dealerId:null},kind:"ADVANTAGE",NOT:{link:ADVANTAGE_SECTION_TOKEN}}}),
      db.dealerContentItem.findFirst({where:{dealerId,dealer:{dealerId:null},kind:"ADVANTAGE",link:ADVANTAGE_SECTION_TOKEN},select:{title:true,active:true}}),
    ]);
    return {profile, showroomUrl: contentMediaUrl(profile?.showroomKey ?? null), advantageConfigured:advantageCount>0, advantageSection, items:items.map(item => ({id:item.id, kind:item.kind, title:item.title, body:item.body, link:item.link, active:item.active, sortOrder:item.sortOrder, mediaUrl:contentMediaUrl(item.mediaKey)}))};
  } catch { logger.error("public.content_read_failed"); return {profile:null,showroomUrl:null,advantageConfigured:false,advantageSection:null,items:[] as PublicContentItem[]}; }
});
export async function getAdminDealerContent() {
  await requireAdmin();
  const { dealerId } = LEGACY_DEALER_SCOPE;
  const [profile, items] = await Promise.all([
    db.dealerContent.findUnique({where:{dealerId,dealer:{dealerId:null}}}),
    db.dealerContentItem.findMany({where:{dealerId,dealer:{dealerId:null}},orderBy:[{kind:"asc"},{sortOrder:"asc"},{id:"asc"}],take:180}),
  ]);
  return {profile, showroomUrl:contentMediaUrl(profile?.showroomKey ?? null),items:items.map(item=>({...item,mediaUrl:contentMediaUrl(item.mediaKey)}))};
}
