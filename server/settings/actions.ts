"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { logger } from "@/server/log";
import { removeDealerLogo, replaceDealerLogo, upsertDealerSettings } from "./service";
import { actionResult, type ActionState } from "@/types/action-state";
import { reportUploadFailure } from "@/server/upload-feedback";
import { dealerSettingsSchema, validateLogoUpload } from "@/validation/dealer-settings";

function refreshSettingsConsumers() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/cars");
  revalidatePath("/cars/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

export async function saveDealerSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = dealerSettingsSchema.safeParse(Object.fromEntries(["dealerName", "phone", "whatsappNumber", "email", "address", "googleMapsUrl", "instagramUrl", "facebookUrl", "primaryColor", "secondaryColor"].map((key) => [key, formData.get(key) ?? ""])));
  if (!parsed.success) return actionResult("error", "Periksa kembali pengaturan dealer.", parsed.error.flatten().fieldErrors);
  try { await upsertDealerSettings(parsed.data); }
  catch { logger.error("dealer.settings_save_failed"); return actionResult("error", "Pengaturan dealer tidak dapat disimpan."); }
  try { refreshSettingsConsumers(); }
  catch { logger.warn("dealer.settings_revalidation_failed"); return actionResult("warning", "Pengaturan disimpan. Muat ulang halaman untuk melihat perubahan."); }
  return actionResult("success", "Pengaturan dealer berhasil disimpan.");
}

export async function uploadDealerLogoAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = await validateLogoUpload(formData.get("logo"));
  if (!parsed.success) { logger.warn("dealer.logo_rejected"); return actionResult("error", "Logo tidak dapat diunggah.", { logo: [parsed.message] }); }
  try { await replaceDealerLogo(parsed.data); }
  catch (error) { return actionResult("error", reportUploadFailure("dealer.logo_upload_failed", error)); }
  try { refreshSettingsConsumers(); }
  catch { return actionResult("warning", "Logo disimpan. Muat ulang halaman untuk melihat perubahan."); }
  return actionResult("success", "Logo dealer berhasil diperbarui.");
}

export async function removeDealerLogoAction(state: ActionState, formData: FormData): Promise<ActionState> {
  void state;
  void formData;
  await requireAdmin();
  let result;
  try { result = await removeDealerLogo(); }
  catch { logger.error("dealer.logo_remove_failed"); return actionResult("error", "Logo dealer tidak dapat dihapus."); }
  try { refreshSettingsConsumers(); }
  catch { return actionResult("warning", "Logo dihapus. Muat ulang halaman untuk melihat perubahan."); }
  if (result.cleanupFailed) logger.warn("dealer.logo_cleanup_failed");
  return actionResult(result.cleanupFailed ? "warning" : "success", result.cleanupFailed ? "Logo dihapus, tetapi file lama perlu dibersihkan manual." : "Logo dealer berhasil dihapus.");
}
