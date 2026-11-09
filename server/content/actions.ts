"use server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/db/client";
import { requireAdmin } from "@/server/auth/session";
import { LEGACY_DEALER_SCOPE } from "@/server/dealer/scope";
import { logger } from "@/server/log";
import { getStorageProvider } from "@/services/storage";
import { validateImageUpload } from "@/validation/upload";
import { contentItemSchema, dealerContentSchema } from "@/validation/dealer-content";
import { canActivateMain, isMediaKind } from "@/features/content/domain";
import { actionResult, type ActionState } from "@/types/action-state";
import { reportUploadFailure } from "@/server/upload-feedback";
import { createContentMediaKey } from "@/services/storage/key";

class ContentError extends Error {
  constructor(message: string, readonly field?: string) { super(message); }
}
function refresh(profileChanged = false) {
  revalidatePath("/admin/content"); revalidatePath("/", profileChanged ? "layout" : "page"); revalidatePath("/about"); revalidatePath("/contact"); revalidatePath("/sitemap.xml");
}
async function cleanup(key: string | null) {
  if (!key) return false;
  try { await getStorageProvider().delete(key); return false; }
  catch { logger.warn("content.media_cleanup_failed"); return true; }
}
async function upload(form: FormData, namespace: string) {
  const file = form.get("image");
  if (!(file instanceof File) || !file.size) return null;
  const parsed = await validateImageUpload(file);
  if (!parsed.success) { logger.warn("content.upload_rejected"); throw new ContentError(parsed.error.issues[0]?.message ?? "Gambar tidak valid.", "image"); }
  const key = createContentMediaKey(namespace, parsed.data.type);
  try { await getStorageProvider().put({key, body:new Uint8Array(await parsed.data.arrayBuffer()),contentType:parsed.data.type}); }
  catch (error) { await cleanup(key); throw new ContentError(reportUploadFailure("content.upload_failed", error), "image"); }
  return key;
}
function failed(error: unknown): ActionState {
  if (!(error instanceof ContentError)) logger.error("content.mutation_failed");
  return actionResult("error", error instanceof ContentError ? error.message : "Konten tidak dapat disimpan. Silakan coba kembali.", error instanceof ContentError && error.field ? { [error.field]: [error.message] } : {});
}
// All CMS writes take the same owner-row lock: active count and writes are atomic,
// including concurrent requests from different administrators.
async function lockOwner(tx: Prisma.TransactionClient, dealerId: typeof LEGACY_DEALER_SCOPE.dealerId) {
  await tx.dealerSettings.upsert({where:{id:dealerId,AND:[{dealerId:null}]},create:{id:dealerId},update:{}});
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "DealerSettings" WHERE "id" = ${dealerId} AND "dealerId" IS NULL FOR UPDATE`;
  if (!rows.length) throw new ContentError("Pengaturan dealer tidak tersedia.");
}
export async function saveDealerContentAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const { dealerId } = LEGACY_DEALER_SCOPE;
  const fields = ["welcomeTitle","welcomeBody","aboutSummary","aboutStory","showroomAlt","operatingHours","history","vision","mission","achievements"];
  const parsed = dealerContentSchema.safeParse({...Object.fromEntries(fields.map(key=>[key,form.get(key) ?? ""])),welcomeActive:form.get("welcomeActive")==="on",aboutActive:form.get("aboutActive")==="on",operatingHoursActive:form.get("operatingHoursActive")==="on"});
  if (!parsed.success) return actionResult("error","Periksa konten dealer.",parsed.error.flatten().fieldErrors);
  let uploaded: string | null = null;
  let committed = false;
  try {
    uploaded = await upload(form,"showroom");
    const oldKey = await db.$transaction(async tx => {
      await lockOwner(tx, dealerId);
      const existing = await tx.dealerContent.findUnique({where:{dealerId}});
      const showroomKey = uploaded ?? (form.get("removeImage")==="on" ? null : existing?.showroomKey ?? null);
      if (showroomKey && !parsed.data.showroomAlt) throw new ContentError("Isi deskripsi foto showroom.");
      const structured=Object.fromEntries((["history","vision","mission","achievements"] as const).map(field=>[field,form.has(field)?parsed.data[field]:existing?.[field]??""]));
      await tx.dealerContent.upsert({where:{dealerId},create:{dealerId,...parsed.data,...structured,showroomKey},update:{...parsed.data,...structured,showroomKey}});
      return existing?.showroomKey !== showroomKey ? existing?.showroomKey ?? null : null;
    });
    committed = true;
    const orphan = await cleanup(oldKey); refresh(true);
    return actionResult(orphan?"warning":"success",orphan ? "Konten disimpan; file lama perlu dibersihkan manual." : "Konten dealer berhasil disimpan.");
  } catch(error) {
    if (committed) { logger.error("content.revalidation_failed"); return actionResult("warning","Konten disimpan. Muat ulang halaman untuk melihat perubahan."); }
    await cleanup(uploaded); return failed(error);
  }
}
export async function saveContentItemAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const { dealerId } = LEGACY_DEALER_SCOPE;
  const parsed = contentItemSchema.safeParse({...Object.fromEntries(["kind","title","body","link","sortOrder"].map(key=>[key,form.get(key) ?? ""])),id:form.get("id") || undefined,active:form.get("active")==="on"});
  if (!parsed.success) return actionResult("error","Periksa data bagian ini.",parsed.error.flatten().fieldErrors);
  let uploaded: string | null = null;
  let committed = false;
  try {
    if (isMediaKind(parsed.data.kind)) uploaded = await upload(form,parsed.data.kind.toLowerCase());
    const oldKey = await db.$transaction(async tx => {
      await lockOwner(tx, dealerId);
      const {id,...values} = parsed.data;
      const existing = id ? await tx.dealerContentItem.findFirst({where:{id,dealerId,kind:values.kind}}) : null;
      if (id && !existing) throw new ContentError("Konten tidak ditemukan.");
      const mediaKey = uploaded ?? existing?.mediaKey ?? null;
      if (isMediaKind(values.kind) && !mediaKey) throw new ContentError("Pilih satu gambar untuk bagian ini.");
      if (values.active && values.kind==="MAIN_BANNER") {
        const count = await tx.dealerContentItem.count({where:{dealerId,kind:"MAIN_BANNER",active:true,...(id ? {NOT:{id}} : {})}});
        if (!canActivateMain(count)) throw new ContentError("Maksimal 5 banner utama aktif. Nonaktifkan satu terlebih dahulu.");
      }
      if (!id && await tx.dealerContentItem.count({where:{dealerId,kind:values.kind}}) >= 30) throw new ContentError("Maksimal 30 item per bagian.");
      if (existing) await tx.dealerContentItem.update({where:{id:existing.id},data:{...values,mediaKey}});
      else await tx.dealerContentItem.create({data:{dealerId,...values,mediaKey}});
      return uploaded ? existing?.mediaKey ?? null : null;
    });
    committed = true;
    const orphan = await cleanup(oldKey); refresh();
    return actionResult(orphan?"warning":"success",orphan ? "Konten disimpan; file lama perlu dibersihkan manual." : "Konten berhasil disimpan.");
  } catch(error) {
    if (committed) { logger.error("content.revalidation_failed"); return actionResult("warning","Konten disimpan. Muat ulang halaman untuk melihat perubahan."); }
    await cleanup(uploaded); return failed(error);
  }
}
export async function deleteContentItemAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const { dealerId } = LEGACY_DEALER_SCOPE;
  if (form.get("confirm") !== "on") return actionResult("error","Centang konfirmasi hapus.");
  const id = form.get("id");
  if (typeof id !== "string" || !id || id.length > 40) return actionResult("error","Konten tidak ditemukan.");
  try {
    const key = await db.$transaction(async tx => {
      await lockOwner(tx, dealerId);
      const item = await tx.dealerContentItem.findFirst({where:{id,dealerId}});
      if (!item) throw new ContentError("Konten tidak ditemukan.");
      await tx.dealerContentItem.delete({where:{id:item.id}}); return item.mediaKey;
    });
    const orphan = await cleanup(key); refresh(); return actionResult(orphan?"warning":"success",orphan ? "Konten dihapus; file perlu dibersihkan manual." : "Konten dihapus.");
  } catch(error) {return failed(error);}
}
