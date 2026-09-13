import { z } from "zod";

export const brandSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(2, "Nama merek minimal 2 karakter.").max(80),
});

export const carModelSchema = z.object({
  id: z.string().cuid().optional(),
  brandId: z.string().cuid("Pilih merek yang valid."),
  name: z.string().trim().min(1, "Nama model wajib diisi.").max(100),
});
