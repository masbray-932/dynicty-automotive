"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/session";
import { removeDealerLogo, replaceDealerLogo, upsertDealerSettings } from "./service";
import type { ActionState } from "@/types/action-state";
import { dealerSettingsSchema, validateLogoUpload } from "@/validation/dealer-settings";

function refreshSettingsConsumers() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/cars");
  revalidatePath("/cars/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

export async function saveDealerSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = dealerSettingsSchema.safeParse(Object.fromEntries(["dealerName", "phone", "whatsappNumber", "email", "address", "googleMapsUrl", "instagramUrl", "facebookUrl", "primaryColor", "secondaryColor"].map((key) => [key, formData.get(key) ?? ""])));
  if (!parsed.success) return { message: "Periksa kembali pengaturan dealer.", errors: parsed.error.flatten().fieldErrors };
  try { await upsertDealerSettings(parsed.data); refreshSettingsConsumers(); return { message: "Pengaturan dealer berhasil disimpan.", errors: {} }; }
  catch { return { message: "Pengaturan dealer tidak dapat disimpan.", errors: {} }; }
}

export async function uploadDealerLogoAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = await validateLogoUpload(formData.get("logo"));
  if (!parsed.success) return { message: "Logo tidak dapat diunggah.", errors: { logo: [parsed.message] } };
  try { await replaceDealerLogo(parsed.data); refreshSettingsConsumers(); return { message: "Logo dealer berhasil diperbarui.", errors: {} }; }
  catch { return { message: "Logo dealer tidak dapat disimpan.", errors: {} }; }
}

export async function removeDealerLogoAction(state: ActionState, formData: FormData): Promise<ActionState> {
  void state;
  void formData;
  await requireAdmin();
  try { const result = await removeDealerLogo(); refreshSettingsConsumers(); return { message: result.cleanupFailed ? "Logo dihapus, tetapi file lama perlu dibersihkan manual." : "Logo dealer berhasil dihapus.", errors: {} }; }
  catch { return { message: "Logo dealer tidak dapat dihapus.", errors: {} }; }
}
