import { z } from "zod";

export const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Pilih file gambar.")
  .refine((file) => file.size <= MAX_IMAGE_SIZE, "Ukuran gambar maksimal 8 MB.")
  .refine((file) => ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]), "Format harus JPEG, PNG, atau WEBP.");

export async function validateImageUpload(file: unknown) {
  const parsed = imageFileSchema.safeParse(file);
  if (!parsed.success) return parsed;

  const bytes = new Uint8Array(await parsed.data.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const signatureMatches = parsed.data.type === "image/jpeg" ? jpeg : parsed.data.type === "image/png" ? png : webp;

  return signatureMatches
    ? parsed
    : { success: false as const, error: new z.ZodError([{ code: "custom", path: [], message: "Isi file tidak sesuai dengan format gambar." }]) };
}
