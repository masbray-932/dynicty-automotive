import type { ReactNode } from "react";
import { AUTOMOTIVE_THEME_VERSION, storefrontThemeCssVariables, type ThemeOverrides } from "./domain";

type ThemeScopeProps = {
  children: ReactNode;
  className?: string;
  overrides?: ThemeOverrides | null;
};

export function ThemeScope({ children, className, overrides }: ThemeScopeProps) {
  return (
    <div
      className={className ? `automotive-storefront ${className}` : "automotive-storefront"}
      data-theme-scope="dealer"
      data-theme-version={AUTOMOTIVE_THEME_VERSION}
      style={storefrontThemeCssVariables(overrides)}
    >
      {children}
    </div>
  );
}
