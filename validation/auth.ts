import { z } from "zod";
import { strongPasswordSchema } from "@/validation/password";

export const loginSchema = z.object({
  email: z.email("Masukkan alamat email yang valid.").trim().toLowerCase(),
  password: z.string().min(1, "Kata sandi wajib diisi.").max(128),
});

export const seedAdminSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: strongPasswordSchema,
});
