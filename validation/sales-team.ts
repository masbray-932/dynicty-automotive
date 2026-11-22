import { z } from "zod";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";

export const salesTeamSchema = z.strictObject({
  id: z.string().cuid().optional(),
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  title: z.string().trim().min(2, "Posisi wajib diisi.").max(100),
  whatsappNumber: z.string().trim().max(30).refine(value => !value || normalizeWhatsappNumber(value) !== null, "Nomor WhatsApp tidak valid."),
  biography: z.string().trim().max(1000),
  active: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export function salesTeamFormInput(form: FormData) {
  return {
    id: form.get("id") || undefined,
    fullName: String(form.get("fullName") ?? ""),
    title: String(form.get("title") ?? ""),
    whatsappNumber: String(form.get("whatsappNumber") ?? ""),
    biography: String(form.get("biography") ?? ""),
    active: form.get("active") === "on",
    sortOrder: String(form.get("sortOrder") ?? "0"),
  };
}
