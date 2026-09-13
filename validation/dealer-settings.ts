import { z } from "zod";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";
import { validateImageUpload } from "./upload";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const optionalUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}, "Gunakan URL HTTP/HTTPS yang valid.").transform((value) => value || null);
const optionalColor = z.string().trim().refine((value) => !value || /^#[0-9a-fA-F]{6}$/.test(value), "Gunakan format hex seperti #DC2626.").transform((value) => value ? value.toUpperCase() : null);

export const dealerSettingsSchema = z.object({
  dealerName: z.string().trim().min(2, "Nama dealer wajib diisi.").max(100, "Maksimal 100 karakter."),
  phone: optionalText(30).refine((value) => !value || (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7), "Nomor telepon tidak valid."),
  whatsappNumber: optionalText(30).refine((value) => !value || normalizeWhatsappNumber(value) !== null, "Nomor WhatsApp tidak valid."),
  email: z.string().trim().max(254).refine((value) => !value || z.email().safeParse(value).success, "Email tidak valid.").transform((value) => value ? value.toLowerCase() : null),
  address: optionalText(500),
  googleMapsUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  primaryColor: optionalColor,
  secondaryColor: optionalColor,
});

export type DealerSettingsValues = z.infer<typeof dealerSettingsSchema>;
export const MAX_LOGO_SIZE = 4 * 1024 * 1024;

export async function validateLogoUpload(file: unknown) {
  if (file instanceof File && file.size > MAX_LOGO_SIZE) return { success: false as const, message: "Ukuran logo maksimal 4 MB." };
  const result = await validateImageUpload(file);
  return result.success ? { success: true as const, data: result.data } : { success: false as const, message: result.error.issues[0]?.message ?? "Logo tidak valid." };
}
