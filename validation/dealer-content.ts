import { z } from "zod";
import { CONTENT_KINDS, safeContentLink } from "@/features/content/domain";
export const dealerContentSchema = z.object({
  welcomeTitle: z.string().trim().max(150), welcomeBody: z.string().trim().max(2000), welcomeActive: z.boolean(),
  aboutSummary: z.string().trim().max(1500), aboutStory: z.string().trim().max(12000), aboutActive: z.boolean(),
  showroomAlt: z.string().trim().max(200), operatingHours: z.string().trim().max(1500),
  operatingHoursActive: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.welcomeActive && (!data.welcomeTitle || !data.welcomeBody)) ctx.addIssue({code:"custom", path:["welcomeTitle"], message:"Judul dan isi welcome wajib saat aktif."});
  if (data.aboutActive && (!data.aboutSummary || !data.aboutStory)) ctx.addIssue({code:"custom", path:["aboutStory"], message:"Ringkasan dan cerita dealer wajib saat aktif."});
});
export const contentItemSchema = z.object({
  id: z.string().max(40).optional(), kind: z.enum(CONTENT_KINDS), title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(3000), link: z.string().trim().max(500).refine(safeContentLink,"Gunakan path situs atau URL HTTPS tanpa kredensial."),
  active: z.boolean(), sortOrder: z.coerce.number().int().min(0).max(999),
}).superRefine((data, ctx) => {
  if ((data.kind === "FAQ" || data.kind === "ADVANTAGE") && !data.body) ctx.addIssue({code:"custom", path:["body"], message:"Isi wajib diisi."});
  if ((data.kind === "FAQ" || data.kind === "ADVANTAGE") && data.link) ctx.addIssue({code:"custom", path:["link"], message:"Bagian ini tidak memakai link."});
});
export type DealerContentValues = z.infer<typeof dealerContentSchema>;
export type ContentItemValues = z.infer<typeof contentItemSchema>;
