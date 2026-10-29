import type { CSSProperties } from "react";

const HEX_COLOR = /^#[0-9A-F]{6}$/;

export const DEFAULT_THEME = Object.freeze({
  primary: "#DC2626",
  secondary: "#18181B",
  background: "#09090B",
  foreground: "#F4F4F5",
  surface: "#18181B",
  mutedForeground: "#A1A1AA",
  border: "#3F3F46",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#B91C1C",
});

export type DealerThemeInput = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export type DealerTheme = {
  primary: string;
  onPrimary: "#000000" | "#FFFFFF";
  secondary: string;
  onSecondary: "#000000" | "#FFFFFF";
  focus: string;
};

export type ThemeCssVariables = CSSProperties & Record<`--${string}`, string>;

export function isThemeColor(value: string) {
  return HEX_COLOR.test(value.trim().toUpperCase());
}

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

export function resolveDealerTheme(input: DealerThemeInput = {}): DealerTheme {
  const primary = normalizeThemeColor(input.primaryColor) ?? DEFAULT_THEME.primary;
  const secondary = normalizeThemeColor(input.secondaryColor) ?? DEFAULT_THEME.secondary;
  return {
    primary,
    onPrimary: readableForeground(primary),
    secondary,
    onSecondary: readableForeground(secondary),
    focus: contrastRatio(primary, DEFAULT_THEME.background) >= 3 ? primary : DEFAULT_THEME.foreground,
  };
}

export function themeCssVariables(input: DealerThemeInput = {}): ThemeCssVariables {
  const theme = resolveDealerTheme(input);
  return {
    "--theme-primary": theme.primary,
    "--theme-on-primary": theme.onPrimary,
    "--theme-secondary": theme.secondary,
    "--theme-on-secondary": theme.onSecondary,
    "--theme-focus": theme.focus,
    "--theme-background": DEFAULT_THEME.background,
    "--theme-foreground": DEFAULT_THEME.foreground,
    "--theme-surface": DEFAULT_THEME.surface,
    "--theme-muted-foreground": DEFAULT_THEME.mutedForeground,
    "--theme-border": DEFAULT_THEME.border,
    "--state-success": DEFAULT_THEME.success,
    "--state-warning": DEFAULT_THEME.warning,
    "--state-danger": DEFAULT_THEME.danger,
    // Compatibility aliases for Stage 1–2 components while the minimal token migration is completed.
    "--accent": theme.primary,
    "--brand-secondary": theme.secondary,
  };
}
