import { z } from "zod";
import { normalizeThemeColor } from "@/features/theme/domain";

const optionalHex = z.string().trim()
  .refine(value => value === "" || normalizeThemeColor(value) !== null, "Gunakan format #RRGGBB atau kosongkan untuk warna bawaan.")
  .transform(normalizeThemeColor);

export const dealerBrandingColorsSchema = z.strictObject({
  primaryColor: optionalHex,
  secondaryColor: optionalHex,
});
