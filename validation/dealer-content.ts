import { z } from "zod";
import { ADVANTAGE_SECTION_TOKEN, CONTENT_KINDS, isAdvantageCmsToken, safeContentLink } from "@/features/content/domain";
export const dealerContentSchema = z.object({
  welcomeTitle: z.string().trim().max(150), welcomeBody: z.string().trim().max(2000), welcomeActive: z.boolean(),
  history: z.string().trim().max(12000).default(""), vision: z.string().trim().max(4000).default(""),
  mission: z.string().trim().max(4000).default(""), achievements: z.string().trim().max(6000).default(""),
  aboutSummary: z.string().trim().max(1500), aboutStory: z.string().trim().max(12000), aboutActive: z.boolean(),
  showroomAlt: z.string().trim().max(200), operatingHours: z.string().trim().max(1500),
  operatingHoursActive: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.welcomeActive && (!data.welcomeTitle || !data.welcomeBody)) ctx.addIssue({code:"custom", path:["welcomeTitle"], message:"Judul dan isi welcome wajib saat aktif."});
  if (data.aboutActive && (!data.aboutSummary || !data.aboutStory)) ctx.addIssue({code:"custom", path:["aboutStory"], message:"Ringkasan dan cerita dealer wajib saat aktif."});
});
export const contentItemSchema = z.object({
  id: z.string().max(40).optional(), kind: z.enum(CONTENT_KINDS), title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(3000), link: z.string().trim().max(500),
  active: z.boolean(), sortOrder: z.coerce.number().int().min(0).max(999),
}).superRefine((data, ctx) => {
  const advantageSection = data.kind === "ADVANTAGE" && data.link === ADVANTAGE_SECTION_TOKEN;
  if ((data.kind === "FAQ" || data.kind === "TESTIMONIAL" || (data.kind === "ADVANTAGE" && !advantageSection)) && !data.body) ctx.addIssue({code:"custom", path:["body"], message:"Isi wajib diisi."});
  if ((data.kind === "FAQ" || data.kind === "TESTIMONIAL") && data.link) ctx.addIssue({code:"custom", path:["link"], message:"Bagian ini tidak memakai link."});
  if (data.kind === "ADVANTAGE" && data.link && !isAdvantageCmsToken(data.link)) ctx.addIssue({code:"custom", path:["link"], message:"Pilih ikon Keunggulan yang tersedia."});
  if (data.kind !== "ADVANTAGE" && !safeContentLink(data.link)) ctx.addIssue({code:"custom", path:["link"], message:"Gunakan path situs atau URL HTTPS tanpa kredensial."});
});
export type DealerContentValues = z.infer<typeof dealerContentSchema>;
export type ContentItemValues = z.infer<typeof contentItemSchema>;
