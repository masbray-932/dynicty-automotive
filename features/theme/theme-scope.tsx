import type { ReactNode } from "react";
import { themeCssVariables, type DealerThemeInput } from "./domain";

export function ThemeScope({ children, className = "", ...colors }: DealerThemeInput & { children: ReactNode; className?: string }) {
  return <div className={className} data-theme-scope="dealer" style={themeCssVariables(colors)}>{children}</div>;
}
