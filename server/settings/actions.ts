"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { logger } from "@/server/log";
import { upsertDealerSettings } from "./service";
import { actionResult, type ActionState } from "@/types/action-state";
import { dealerSettingsFields, dealerSettingsSchema, isDealerSettingsField } from "@/validation/dealer-settings";

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

// Explicit denial for old clients; the settings service exposes no logo mutators.
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
