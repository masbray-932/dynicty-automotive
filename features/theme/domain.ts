import type { CSSProperties } from "react";

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

export const AUTOMOTIVE_THEME_VERSION = 2;

// The storefront contract uses Automotive's existing dark palette.
// Unused canonical roles are defined here but do not restyle existing components.
export const AUTOMOTIVE_TOKEN_DEFAULTS = Object.freeze({
  "--color-primary": "#DC2626",
  "--color-primary-dark": "#B91C1C",
  "--color-accent": "#DC2626",
  "--color-background": "#09090B",
  "--color-surface": "#18181B",
  "--color-surface-secondary": "#09090B",
  "--color-text-primary": "#F4F4F5",
  "--color-text-secondary": "#A1A1AA",
  "--color-border": "#3F3F46",
  "--color-sale": "#DC2626", // Reserved; not an inventory status or regular price.
});

export type AutomotiveToken = keyof typeof AUTOMOTIVE_TOKEN_DEFAULTS;
export type ThemeOverrides = Partial<Record<AutomotiveToken, string | null>>;
type CanonicalTokens = Record<AutomotiveToken, string>;

export function isThemeColor(value: string) {
  return normalizeThemeColor(value) !== null;
}

// Keep the existing tolerant parser at the legacy DealerSettings boundary.
export function normalizeThemeColor(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized && HEX_COLOR.test(normalized) ? normalized : null;
}

function relativeLuminance(color: string) {
  const normalized = normalizeThemeColor(color);
  if (!normalized) throw new Error("Invalid theme color.");
  const channels = [1, 3, 5].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(left: string, right: string) {
  const leftLuminance = relativeLuminance(left);
  const rightLuminance = relativeLuminance(right);
  const lighter = Math.max(leftLuminance, rightLuminance);
  const darker = Math.min(leftLuminance, rightLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableForeground(background: string): "#000000" | "#FFFFFF" {
  return contrastRatio(background, "#000000") >= contrastRatio(background, "#FFFFFF") ? "#000000" : "#FFFFFF";
}

export function resolveAutomotiveTheme(overrides: unknown = null) {
  const tokens: CanonicalTokens = { ...AUTOMOTIVE_TOKEN_DEFAULTS };
  let hasCustomAccent = false;

  if (overrides !== null) {
    if (typeof overrides !== "object") throw new TypeError("Expected a theme override object.");
    const prototype = Object.getPrototypeOf(overrides);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError("Expected a plain theme override object.");
    }

    for (const key of Reflect.ownKeys(overrides)) {
      if (typeof key !== "string" || !Object.hasOwn(AUTOMOTIVE_TOKEN_DEFAULTS, key)) {
        throw new TypeError("Unknown Automotive theme token.");
      }
      const descriptor = Object.getOwnPropertyDescriptor(overrides, key);
      if (!descriptor || !("value" in descriptor)) throw new TypeError("Expected a theme token value.");
      const value: unknown = descriptor.value;
      if (value === null) continue;
      if (typeof value !== "string" || value.length !== 7 || !HEX_COLOR.test(value)) {
        throw new TypeError("Expected a six-digit hex theme color.");
      }
      tokens[key as AutomotiveToken] = value.toUpperCase();
      if (key === "--color-accent") hasCustomAccent = true;
    }
  }

  const background = tokens["--color-background"];
  const primary = tokens["--color-primary"];
  const focus = hasCustomAccent ? tokens["--color-accent"] : primary;
  const text = tokens["--color-text-primary"];
  const foreground = contrastRatio(text, background) >= 4.5 ? text : readableForeground(background);
  const aliases = {
    "--auto-background": background,
    "--auto-foreground": foreground,
    "--auto-action-primary": primary,
    "--auto-action-foreground": readableForeground(primary),
    "--auto-focus": contrastRatio(focus, background) >= 3 ? focus : foreground,
  };

  return { tokens, aliases };
}

type ThemeCssVariables = CSSProperties & Record<`--${string}`, string>;

// Only the storefront emits the canonical contract. The root emits fixed
// semantic defaults for shared controls, Admin and pages outside the shell.
export function storefrontThemeCssVariables(overrides?: ThemeOverrides | null): ThemeCssVariables {
  const { tokens, aliases } = resolveAutomotiveTheme(overrides);
  return { ...tokens, ...aliases };
}

export function systemThemeCssVariables(): ThemeCssVariables {
  return resolveAutomotiveTheme().aliases;
}
