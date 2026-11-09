import { z } from "zod";
import { slugify } from "@/features/cars/domain";

const text = (max: number) => z.string().trim().max(max);
const id = text(40).min(1);
const slug = text(120).transform(slugify).pipe(z.string().min(1, "Slug wajib diisi.").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));
const base = { id: text(40).optional(), slug, sortOrder: z.coerce.number().int().min(0).max(999) };
export const categorySchema = z.strictObject({ ...base, name: text(150).min(2), description: text(2000), active: z.boolean() });
const content = {
  id: base.id, title: text(200).min(2), slug, body: text(30000), imageAlt: text(200),
  status: z.enum(["DRAFT", "PUBLISHED"]),
};
export const serviceSchema = z.strictObject({ ...content, categoryId: id, shortDescription: text(1500), homepageVisible: z.boolean(), sortOrder: base.sortOrder })
  .superRefine((data, ctx) => {
    if (data.status === "PUBLISHED" && (!data.body || !data.shortDescription)) ctx.addIssue({ code: "custom", path: ["body"], message: "Isi ringkasan dan deskripsi sebelum publikasi." });
  });
export const articleSchema = z.strictObject({ ...content, excerpt: text(1500) })
  .superRefine((data, ctx) => {
    if (data.status === "PUBLISHED" && (!data.body || !data.excerpt)) ctx.addIssue({ code: "custom", path: ["body"], message: "Isi cuplikan dan artikel sebelum publikasi." });
  });
export type EditorialKind = "category" | "service" | "article";
export type EditorialInput = z.infer<typeof categorySchema> | z.infer<typeof serviceSchema> | z.infer<typeof articleSchema>;
export const editorialFields = {
  category: ["id", "name", "slug", "description", "sortOrder", "active"],
  service: ["id", "title", "slug", "categoryId", "shortDescription", "body", "imageAlt", "status", "homepageVisible", "sortOrder"],
  article: ["id", "title", "slug", "excerpt", "body", "imageAlt", "status"],
} as const;

export function editorialFormInput(kind: EditorialKind, form: FormData) {
  const allowed: readonly string[] = [...editorialFields[kind], ...(kind === "category" ? [] : ["image", "removeImage"])];
  const seen = new Set<string>();
  for (const key of form.keys()) {
    if (key.startsWith("$ACTION_")) continue;
    if (!allowed.includes(key) || seen.has(key)) throw new Error("Kolom tidak diizinkan atau duplikat.");
    seen.add(key);
  }
  return Object.fromEntries(editorialFields[kind].map(key => [key,
    ["active", "homepageVisible"].includes(key) ? form.get(key) === "on" : String(form.get(key) ?? ""),
  ]));
}
