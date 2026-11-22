"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionResult, type ActionState } from "@/types/action-state";
import { serviceCtaSchema } from "@/validation/service-cta";
import { saveServiceCta } from "./service-cta";

export async function saveServiceCtaAction(_state: ActionState, form: FormData): Promise<ActionState> {
  const labels = form.getAll("buttonLabel"); const numbers = form.getAll("buttonWhatsapp");
  const backgrounds = form.getAll("buttonBackgroundColor"); const colors = form.getAll("buttonTextColor");
  const input = { serviceId: form.get("serviceId"), enabled: form.get("enabled") === "on", heading: form.get("heading"), description: form.get("description"), headingDesktopPx: form.get("headingDesktopPx"), descriptionDesktopPx: form.get("descriptionDesktopPx"), headingMobilePx: form.get("headingMobilePx"), descriptionMobilePx: form.get("descriptionMobilePx"), backgroundColor: form.get("backgroundColor"), textColor: form.get("textColor"), buttons: labels.map((label, index) => ({ label, whatsappNumber: numbers[index], backgroundColor: backgrounds[index], textColor: colors[index] })) };
  const parsed = serviceCtaSchema.safeParse(input);
  if (!parsed.success) return actionResult("error", "Periksa kembali pengaturan CTA.", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try { await saveServiceCta(parsed.data, form.get("image"), form.get("removeImage") === "on"); }
  catch (error) { return actionResult("error", error instanceof z.ZodError ? "Periksa kembali pengaturan CTA." : error instanceof Error ? error.message : "CTA belum dapat disimpan."); }
  revalidatePath("/admin/services"); revalidatePath("/services/[slug]", "page");
  return actionResult("success", "CTA layanan berhasil disimpan.");
}
