import { z } from "zod";
import sharp from "sharp";

export const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Pilih file gambar.")
  .refine((file) => file.size <= MAX_IMAGE_SIZE, "Ukuran gambar maksimal 8 MB.")
  .refine((file) => ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]), "Format harus JPEG, PNG, atau WEBP.");

export async function validateImageUpload(file: unknown) {
  const parsed = imageFileSchema.safeParse(file);
  if (!parsed.success) return parsed;

  const bytes = new Uint8Array(await parsed.data.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const signatureMatches = parsed.data.type === "image/jpeg" ? jpeg : parsed.data.type === "image/png" ? png : webp;

  const invalid = (message: string) => ({ success: false as const, error: new z.ZodError([{ code: "custom", path: [], message }]) });
  if (!signatureMatches) return invalid("Isi file tidak sesuai dengan format gambar.");
  try {
    const image = sharp(bytes, { failOn: "warning", limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true });
    const metadata = await image.metadata();
    const format = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[parsed.data.type];
    if (metadata.format !== format) return invalid("Isi file tidak sesuai dengan format gambar.");
    if ((metadata.pages ?? 1) > 1) return invalid("Gunakan gambar statis JPEG, PNG, atau WEBP, bukan animasi.");
    // Decode all pixels without re-encoding or changing the uploaded file.
    await image.stats();
    return parsed;
  } catch {
    return invalid("Gambar rusak, terpotong, atau terlalu besar dimensinya. Gunakan gambar valid maksimal 25 megapiksel.");
  }
}
