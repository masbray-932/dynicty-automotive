import { z } from "zod";
import { normalizeWhatsappNumber } from "@/features/homepage/domain";

const color = z.string().trim().toUpperCase().regex(/^#[0-9A-F]{6}$/, "Gunakan warna HEX #RRGGBB.");
const whatsapp = z.string().trim().refine(value => normalizeWhatsappNumber(value) !== null, "Nomor WhatsApp tidak valid.");

export const serviceCtaButtonSchema = z.object({
  label: z.string().trim().min(2, "Label tombol wajib diisi.").max(60),
  whatsappNumber: whatsapp,
  backgroundColor: color,
  textColor: color,
});

export const serviceCtaSchema = z.object({
  serviceId: z.string().min(1).max(40),
  enabled: z.boolean(),
  heading: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  headingDesktopPx: z.coerce.number().int().min(16).max(72),
  descriptionDesktopPx: z.coerce.number().int().min(14).max(32),
  headingMobilePx: z.coerce.number().int().min(16, "Ukuran judul mobile minimal 16 px.").max(48),
  descriptionMobilePx: z.coerce.number().int().min(16, "Ukuran deskripsi mobile minimal 16 px.").max(32),
  backgroundColor: color,
  textColor: color,
  buttons: z.array(serviceCtaButtonSchema).max(6, "Maksimal enam tombol konsultasi."),
}).superRefine((value, context) => {
  if (!value.enabled) return;
  if (!value.heading) context.addIssue({ code: "custom", path: ["heading"], message: "Judul wajib diisi saat CTA aktif." });
  if (!value.description) context.addIssue({ code: "custom", path: ["description"], message: "Deskripsi wajib diisi saat CTA aktif." });
  if (!value.buttons.length) context.addIssue({ code: "custom", path: ["buttons"], message: "Tambahkan minimal satu tombol konsultasi." });
});

export type ServiceCtaValues = z.infer<typeof serviceCtaSchema>;
