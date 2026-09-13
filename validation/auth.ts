import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Masukkan alamat email yang valid.").trim().toLowerCase(),
  password: z.string().min(1, "Kata sandi wajib diisi.").max(128),
});

export const seedAdminSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[0-9]/, "Password must include a number."),
});
