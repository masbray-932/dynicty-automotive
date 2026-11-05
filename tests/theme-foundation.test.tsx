import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";
import PublicLayout from "@/app/(public)/layout";
import RootLayout from "@/app/layout";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  AUTOMOTIVE_THEME_VERSION,
  contrastRatio,
  isThemeColor,
  normalizeThemeColor,
  readableForeground,
  resolveAutomotiveTheme,
  systemThemeCssVariables,
} from "@/features/theme/domain";
import { ThemeScope } from "@/features/theme/theme-scope";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist-sans" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/server/homepage/service", () => ({
  getDealerPresentation: async () => ({
    dealerName: "Dealer Lama",
    primaryColor: " #ffffFF ",
    secondaryColor: "#abcdef",
    logoUrl: null,
    whatsappNumber: null,
  }),
}));
vi.mock("@/server/content/service", () => ({
  getPublicDealerContent: async () => ({ profile: null, items: [] }),
}));

const expectedDefaults = {
  "--color-primary": "#DC2626",
  "--color-primary-dark": "#B91C1C",
  "--color-accent": "#DC2626",
  "--color-background": "#09090B",
  "--color-surface": "#18181B",
  "--color-surface-secondary": "#09090B",
  "--color-text-primary": "#F4F4F5",
  "--color-text-secondary": "#A1A1AA",
  "--color-border": "#3F3F46",
  "--color-sale": "#DC2626",
};

describe("Automotive v2 contract", () => {
  it("defines all ten tokens and keeps the prior Automotive dark roles", () => {
    expect(AUTOMOTIVE_THEME_VERSION).toBe(2);
    expect(resolveAutomotiveTheme().tokens).toEqual(expectedDefaults);
    expect(systemThemeCssVariables()).toEqual({
      "--auto-background": "#09090B",
      "--auto-foreground": "#F4F4F5",
      "--auto-action-primary": "#DC2626",
      "--auto-action-foreground": "#FFFFFF",
      "--auto-focus": "#DC2626",
    });
  });

  it("normalizes valid overrides and does not mutate or retain their input", () => {
    const overrides = Object.freeze({ "--color-primary": "#aBc123", "--color-sale": "#123456" });
    const result = resolveAutomotiveTheme(overrides);
    expect(result.tokens).toEqual({ ...expectedDefaults, "--color-primary": "#ABC123", "--color-sale": "#123456" });
    expect(result.aliases["--auto-action-primary"]).toBe("#ABC123");
    expect(overrides["--color-primary"]).toBe("#aBc123");
    result.tokens["--color-primary"] = "#000000";
    expect(resolveAutomotiveTheme().tokens["--color-primary"]).toBe("#DC2626");
  });

  it("treats null and missing keys as default and leaves accent independent", () => {
    expect(resolveAutomotiveTheme(null)).toEqual(resolveAutomotiveTheme({}));
    expect(resolveAutomotiveTheme({ "--color-primary": "#FFFFFF", "--color-accent": null }).tokens)
      .toEqual({ ...expectedDefaults, "--color-primary": "#FFFFFF" });
  });

  it.each(["red", "#abcd", "#00000G", "#123456\n", " #123456 ", "var(--color-sale)", "url(https://example.com)", "#123456;display:none", 42, undefined])(
    "rejects invalid values: %s",
    (value) => expect(() => resolveAutomotiveTheme({ "--color-primary": value })).toThrow(TypeError),
  );

  it.each(["--color-unknown", "--state-danger", "--font-sans", "constructor", "__proto__"])(
    "rejects noncanonical keys: %s",
    (key) => expect(() => resolveAutomotiveTheme({ [key]: "#123456" })).toThrow(TypeError),
  );

  it("rejects non-record inputs and does not invoke accessors", () => {
    const getter = vi.fn(() => "#123456");
    const accessor = Object.defineProperty({}, "--color-primary", { get: getter });
    for (const input of [[], 1, "{}", new Date(), accessor, Object.create({ "--color-primary": "#123456" })]) {
      expect(() => resolveAutomotiveTheme(input)).toThrow(TypeError);
    }
    expect(getter).not.toHaveBeenCalled();
  });

  it.each([
    { primary: "#FACC15", background: "#FFFFFF", text: "#F4F4F5" },
    { primary: "#18181B", background: "#09090B", text: "#F4F4F5" },
    { primary: "#777777", background: "#F4F4F5", text: "#111827" },
  ])("derives readable action, shell text and focus on $background", ({ primary, background, text }) => {
    const { aliases } = resolveAutomotiveTheme({
      "--color-primary": primary,
      "--color-background": background,
      "--color-text-primary": text,
    });
    expect(aliases["--auto-action-foreground"]).toBe(readableForeground(primary));
    expect(contrastRatio(primary, aliases["--auto-action-foreground"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(background, aliases["--auto-foreground"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(background, aliases["--auto-focus"])).toBeGreaterThanOrEqual(3);
  });

  it("keeps tolerant legacy color normalization on the storefront read path", () => {
    expect(normalizeThemeColor("  #aBc123 ")).toBe("#ABC123");
    expect(normalizeThemeColor("red")).toBeNull();
    expect(isThemeColor("#00000G")).toBe(false);
  });

  it("renders deterministic storefront SSR regardless of override key order", () => {
    const first = renderToStaticMarkup(<ThemeScope overrides={{ "--color-primary": "#FFFFFF", "--color-background": "#18181B" }}><span>Dealer</span></ThemeScope>);
    const second = renderToStaticMarkup(<ThemeScope overrides={{ "--color-background": "#18181B", "--color-primary": "#FFFFFF" }}><span>Dealer</span></ThemeScope>);
    expect(first).toBe(second);
    expect(first).toContain('class="automotive-storefront"');
    expect(first).toContain('data-theme-version="2"');
    expect(first).toContain("--color-primary:#FFFFFF");
    expect(first).toContain("--auto-action-foreground:#000000");
  });

  it("maps only legacy primary into the real public layout and keeps Admin on fixed root colors", async () => {
    const storefront = await PublicLayout({ children: <Button>Public</Button> });
    const html = renderToStaticMarkup(<RootLayout params={Promise.resolve({})}>{storefront}<AdminLayout><Button>Admin</Button></AdminLayout></RootLayout>);
    const bodyStyle = html.match(/<body[^>]*style="([^"]+)"/)?.[1];
    const storefrontStyle = html.match(/<div[^>]*data-theme-scope="dealer"[^>]*style="([^"]+)"/)?.[1];
    expect(bodyStyle).toContain("--auto-action-primary:#DC2626");
    expect(bodyStyle).not.toContain("--color-");
    expect(storefrontStyle).toContain("--color-primary:#FFFFFF");
    expect(storefrontStyle).toContain("--color-accent:#DC2626");
    expect(storefrontStyle).not.toContain("#ABCDEF");
    expect(html).toMatch(/<\/footer><\/div><button[^>]*bg-brand-primary[^>]*>Admin<\/button><\/body>/);
  });

  it("bridges only noncanonical Tailwind keys and binds scoped paint to resolved aliases", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const bridge = css.match(/@theme inline\s*\{([^}]+)\}/)?.[1];
    expect(bridge).toBeDefined();
    for (const key of Object.keys(expectedDefaults)) expect(css).not.toContain(`${key}:`);
    expect(bridge).toContain("--color-brand-primary: var(--auto-action-primary);");
    expect(bridge).toContain("--color-brand-on-primary: var(--auto-action-foreground);");
    expect(bridge).toContain("--color-brand-focus: var(--auto-focus);");
    expect(css).toMatch(/body,\s*\.automotive-storefront\s*\{\s*background: var\(--auto-background\);\s*color: var\(--auto-foreground\);/);
    expect(css).toContain(".automotive-storefront ::selection");
    expect(css).not.toContain(":root");
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
