import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormField } from "@/components/ui/form-field";
import {
  contrastRatio,
  DEFAULT_THEME,
  isThemeColor,
  normalizeThemeColor,
  readableForeground,
  resolveDealerTheme,
  themeCssVariables,
} from "@/features/theme/domain";
import { ThemeScope } from "@/features/theme/theme-scope";
import { dealerSettingsSchema } from "@/validation/dealer-settings";

const compatibleSettings = {
  dealerName: "Dealer Lama",
  phone: "",
  whatsappNumber: "",
  email: "",
  address: "Alamat dealer lama",
  googleMapsUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  primaryColor: "#dc2626",
  secondaryColor: "#18181b",
};

describe("minimal dealer theme foundation", () => {
  it("uses one centralized safe default theme", () => {
    expect(resolveDealerTheme()).toMatchObject({
      primary: DEFAULT_THEME.primary,
      secondary: DEFAULT_THEME.secondary,
    });
    expect(themeCssVariables()["--theme-background"]).toBe(DEFAULT_THEME.background);
  });

  it("normalizes valid colors and rejects invalid values", () => {
    expect(normalizeThemeColor("  #aBc123 ")).toBe("#ABC123");
    expect(normalizeThemeColor("red")).toBeNull();
    expect(normalizeThemeColor("#abcd")).toBeNull();
    expect(isThemeColor("#000000")).toBe(true);
    expect(isThemeColor("#00000G")).toBe(false);
  });

  it("always derives an AA-readable foreground for primary buttons", () => {
    for (const background of ["#FFFFFF", "#000000", "#777777", "#DC2626", "#FACC15"]) {
      const foreground = readableForeground(background);
      expect(contrastRatio(background, foreground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("generates semantic variables without allowing dealer colors to replace state colors", () => {
    const variables = themeCssVariables({ primaryColor: "#ffffff", secondaryColor: "#abcdef" });
    expect(variables["--theme-primary"]).toBe("#FFFFFF");
    expect(variables["--theme-on-primary"]).toBe("#000000");
    expect(variables["--theme-secondary"]).toBe("#ABCDEF");
    expect(variables["--state-success"]).toBe(DEFAULT_THEME.success);
    expect(variables["--state-warning"]).toBe(DEFAULT_THEME.warning);
    expect(variables["--state-danger"]).toBe(DEFAULT_THEME.danger);
  });

  it("keeps existing DealerSettings color values compatible", () => {
    const parsed = dealerSettingsSchema.parse(compatibleSettings);
    expect(parsed.primaryColor).toBe("#DC2626");
    expect(parsed.secondaryColor).toBe("#18181B");
    expect(resolveDealerTheme(parsed)).toMatchObject({ primary: "#DC2626", secondary: "#18181B" });
  });

  it("renders public theme variables on the server", () => {
    const html = renderToStaticMarkup(<ThemeScope primaryColor="#ffffff" secondaryColor="#123456"><span>Dealer</span></ThemeScope>);
    expect(html).toContain('data-theme-scope="dealer"');
    expect(html).toContain("--theme-primary:#FFFFFF");
    expect(html).toContain("--theme-on-primary:#000000");
    expect(html).toContain("--theme-secondary:#123456");
  });
});

describe("shared form accessibility", () => {
  it("connects an invalid control to a stable field error id", () => {
    const html = renderToStaticMarkup(<FormField error="Nama wajib diisi." htmlFor="dealer-name" label="Nama dealer"><input name="dealerName" /></FormField>);
    expect(html).toContain('for="dealer-name"');
    expect(html).toContain('id="dealer-name"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="dealer-name-error"');
    expect(html).toContain('id="dealer-name-error"');
    expect(html).toContain('role="alert"');
  });

  it("does not mark a valid control as invalid", () => {
    const html = renderToStaticMarkup(<FormField htmlFor="phone" label="Telepon"><input aria-describedby="phone-help" /></FormField>);
    expect(html).toContain('aria-describedby="phone-help"');
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("phone-error");
  });
});
