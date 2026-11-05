import { z } from "zod";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null).nullable();
const optionalUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}, "Gunakan URL HTTP/HTTPS yang valid.").transform((value) => value || null).nullable();

export const dealerSettingsSchema = z.strictObject({
  dealerName: z.string().trim().min(2, "Nama dealer wajib diisi.").max(100, "Maksimal 100 karakter."),
  phone: optionalText(30).refine((value) => !value || (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7), "Nomor telepon tidak valid."),
  whatsappNumber: optionalText(30).refine((value) => !value || normalizeWhatsappNumber(value) !== null, "Nomor WhatsApp tidak valid."),
  email: z.string().trim().max(254).refine((value) => !value || z.email().safeParse(value).success, "Email tidak valid.").transform((value) => value ? value.toLowerCase() : null).nullable(),
  address: z.string().trim().min(1, "Alamat showroom wajib diisi.").max(500, "Alamat maksimal 500 karakter."),
  googleMapsUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
});

export type DealerSettingsValues = z.infer<typeof dealerSettingsSchema>;
export const dealerSettingsFields = dealerSettingsSchema.keyof().options;

export function isDealerSettingsField(key: PropertyKey): key is keyof DealerSettingsValues {
  return Object.hasOwn(dealerSettingsSchema.shape, key);
}
