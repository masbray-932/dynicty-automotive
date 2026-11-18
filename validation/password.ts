import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const passwordRequirements = [
  { id: "length", label: "Minimal 12 karakter", test: (value: string) => value.length >= PASSWORD_MIN_LENGTH },
  { id: "uppercase", label: "Minimal satu huruf besar", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "Minimal satu huruf kecil", test: (value: string) => /[a-z]/.test(value) },
  { id: "digit", label: "Minimal satu angka", test: (value: string) => /[0-9]/.test(value) },
  { id: "special", label: "Minimal satu karakter khusus", test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
] as const;
export function passwordRequirementState(value: string) { return passwordRequirements.map(requirement => ({ id: requirement.id, label: requirement.label, met: requirement.test(value) })); }
export const strongPasswordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, "Kata sandi minimal 12 karakter.")
  .max(PASSWORD_MAX_LENGTH, "Kata sandi maksimal 128 karakter.")
  .regex(/[A-Z]/, "Tambahkan minimal satu huruf besar.")
  .regex(/[a-z]/, "Tambahkan minimal satu huruf kecil.")
  .regex(/[0-9]/, "Tambahkan minimal satu angka.")
  .regex(/[^A-Za-z0-9\s]/, "Tambahkan minimal satu karakter khusus.");
