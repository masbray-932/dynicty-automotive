"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireLegacyAdminPermission } from "@/server/auth/session";
import { logger } from "@/server/log";
import { upsertDealerSettings } from "./service";
import { LogoUploadError, removeStandaloneLogo, replaceStandaloneLogo, saveStandaloneColors, standaloneBrandingPermission } from "./branding";
import { dealerBrandingColorsSchema } from "@/validation/dealer-branding";
import { actionResult, type ActionState } from "@/types/action-state";
import { dealerSettingsFields, dealerSettingsSchema, isDealerSettingsField } from "@/validation/dealer-settings";

function refreshSettingsConsumers() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/about");
  for (const path of ["/services", "/articles", "/contact", "/sell-car"]) revalidatePath(path);
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/articles/[slug]", "page");
  revalidatePath("/cars");
  revalidatePath("/cars/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

export async function saveDealerSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const seen = new Set<string>();
  for (const key of formData.keys()) {
    // Next/React may attach action metadata. It is never projected into settings.
    if (key.startsWith("$ACTION_")) continue;
    if (["primaryColor", "secondaryColor", "logoStorageKey", "logo"].includes(key)) {
      return actionResult("error", "Warna dan logo dealer dikelola oleh platform.");
    }
    if (!isDealerSettingsField(key) || seen.has(key)) {
      return actionResult("error", "Pengaturan dealer memuat kolom yang tidak diizinkan atau duplikat.");
    }
    seen.add(key);
  }
  const parsed = dealerSettingsSchema.safeParse(
    Object.fromEntries(dealerSettingsFields.map((key) => [key, formData.get(key) ?? ""])),
  );
  if (!parsed.success) return actionResult("error", "Periksa kembali pengaturan dealer.", parsed.error.flatten().fieldErrors);
  try { await upsertDealerSettings(parsed.data); }
  catch { logger.error("dealer.settings_save_failed"); return actionResult("error", "Pengaturan dealer tidak dapat disimpan."); }
  try { refreshSettingsConsumers(); }
  catch { logger.warn("dealer.settings_revalidation_failed"); return actionResult("warning", "Pengaturan disimpan. Muat ulang halaman untuk melihat perubahan."); }
  return actionResult("success", "Pengaturan dealer berhasil disimpan.");
}

// Old generic logo actions remain denied; standalone uses its dedicated permission.
export async function uploadDealerLogoAction(state: ActionState, formData: FormData): Promise<ActionState> {
  void state;
  void formData;
  await requireAdmin();
  return actionResult("error", "Logo dealer dikelola oleh platform.");
}

export async function removeDealerLogoAction(state: ActionState, formData: FormData): Promise<ActionState> {
  void state;
  void formData;
  await requireAdmin();
  return actionResult("error", "Logo dealer dikelola oleh platform.");
}

function validBrandingFields(form: FormData, fields: readonly string[]) {
  const seen = new Set<string>();
  for (const key of form.keys()) {
    if (key.startsWith("$ACTION_")) continue;
    if (!fields.includes(key) || seen.has(key)) return false;
    seen.add(key);
  }
  return seen.size === fields.length;
}

function finishBranding(message: string, cleanupFailed = false) {
  try { refreshSettingsConsumers(); }
  catch {
    logger.warn("dealer.branding_revalidation_failed");
    return actionResult("warning", cleanupFailed
      ? "Branding disimpan. Muat ulang halaman; file logo lama perlu dibersihkan manual."
      : "Branding disimpan. Muat ulang halaman untuk melihat perubahan.");
  }
  return cleanupFailed ? actionResult("warning", `${message} File logo lama perlu dibersihkan manual.`) : actionResult("success", message);
}

export async function saveStandaloneColorsAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireLegacyAdminPermission(standaloneBrandingPermission);
  if (!validBrandingFields(form, ["primaryColor", "secondaryColor"])) return actionResult("error", "Kolom warna tidak valid.");
  const input = { primaryColor: form.get("primaryColor"), secondaryColor: form.get("secondaryColor") };
  const parsed = dealerBrandingColorsSchema.safeParse(input);
  if (!parsed.success) return actionResult("error", "Periksa kembali warna dealer.", parsed.error.flatten().fieldErrors);
  try { await saveStandaloneColors(input); }
  catch { logger.error("dealer.branding_colors_failed"); return actionResult("error", "Warna dealer tidak dapat disimpan."); }
  return finishBranding("Warna dealer berhasil disimpan.");
}

export async function replaceStandaloneLogoAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireLegacyAdminPermission(standaloneBrandingPermission);
  if (!validBrandingFields(form, ["logo"])) return actionResult("error", "Kolom logo tidak valid.");
  let cleanupFailed: boolean;
  try { ({ cleanupFailed } = await replaceStandaloneLogo(form.get("logo"))); }
  catch (error) {
    const message = error instanceof LogoUploadError ? error.message : "Logo dealer tidak dapat disimpan.";
    return actionResult("error", message, { logo: [message] });
  }
  return finishBranding("Logo dealer berhasil disimpan.", cleanupFailed);
}

export async function removeStandaloneLogoAction(_state: ActionState, form: FormData): Promise<ActionState> {
  await requireLegacyAdminPermission(standaloneBrandingPermission);
  if (!validBrandingFields(form, [])) return actionResult("error", "Kolom logo tidak valid.");
  let cleanupFailed: boolean;
  try { ({ cleanupFailed } = await removeStandaloneLogo()); }
  catch { logger.error("dealer.logo_removal_failed"); return actionResult("error", "Logo dealer tidak dapat dihapus."); }
  return finishBranding("Logo dealer berhasil dihapus.", cleanupFailed);
}
