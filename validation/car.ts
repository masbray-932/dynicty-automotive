import { z } from "zod";

const currentYear = new Date().getFullYear();

export const carFormSchema = z
  .object({
    condition: z.enum(["NEW", "USED"], "Pilih kondisi kendaraan."),
    brandId: z.string().cuid("Pilih merek yang valid."),
    modelId: z.string().cuid("Pilih model yang valid."),
    variant: z.string().trim().min(1, "Varian wajib diisi.").max(120),
    year: z.coerce.number().int().min(1900).max(currentYear + 1),
    price: z.string().trim().min(1, "Harga wajib diisi."),
    transmission: z.string().trim().min(1, "Transmisi wajib diisi.").max(50),
    fuelType: z.string().trim().min(1, "Jenis bahan bakar wajib diisi.").max(50),
    color: z.string().trim().min(1, "Warna wajib diisi.").max(60),
    mileage: z.string().trim(),
    description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(10000),
    status: z.enum(["DRAFT", "AVAILABLE", "SOLD"], "Pilih status kendaraan."),
    featured: z.boolean(),
  })
  .superRefine((value, context) => {
    try {
      parsePrice(value.price);
    } catch {
      context.addIssue({ code: "custom", path: ["price"], message: "Harga harus berupa Rupiah bulat yang valid." });
    }

    const mileage = parseMileage(value.mileage);
    if (Number.isNaN(mileage)) {
      context.addIssue({ code: "custom", path: ["mileage"], message: "Kilometer harus berupa angka bulat." });
      return;
    }
    if (value.condition === "USED" && (mileage === null || mileage <= 0)) {
      context.addIssue({ code: "custom", path: ["mileage"], message: "Mobil bekas wajib memiliki kilometer lebih dari 0." });
    }
    if (mileage !== null && mileage < 0) {
      context.addIssue({ code: "custom", path: ["mileage"], message: "Kilometer tidak boleh negatif." });
    }
  });

export type CarFormValues = z.infer<typeof carFormSchema>;

export function parsePrice(value: string) {
  const compact = value.replace(/\s/g, "");
  if (!/^\d+$/.test(compact) && !/^\d{1,3}(\.\d{3})+$/.test(compact)) {
    throw new Error("Invalid price.");
  }
  const normalized = compact.replace(/\./g, "");
  if (!/^\d{1,15}$/.test(normalized) || normalized === "0") {
    throw new Error("Invalid price.");
  }
  return normalized.replace(/^0+(?=\d)/, "");
}

export function parseMileage(value: string) {
  if (!value) return null;
  const compact = value.replace(/\s/g, "");
  if (!/^\d+$/.test(compact) && !/^\d{1,3}(\.\d{3})+$/.test(compact)) return Number.NaN;
  const normalized = compact.replace(/\./g, "");
  if (!/^\d{1,9}$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

export function carFormData(input: FormData) {
  return {
    condition: input.get("condition"),
    brandId: input.get("brandId"),
    modelId: input.get("modelId"),
    variant: input.get("variant"),
    year: input.get("year"),
    price: input.get("price"),
    transmission: input.get("transmission"),
    fuelType: input.get("fuelType"),
    color: input.get("color"),
    mileage: input.get("mileage") ?? "",
    description: input.get("description"),
    status: input.get("status"),
    featured: input.get("featured") === "on",
  };
}
