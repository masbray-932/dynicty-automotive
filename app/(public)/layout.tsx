import type { ReactNode } from "react";
import { connection } from "next/server";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { normalizeThemeColor } from "@/features/theme/domain";
import { ThemeScope } from "@/features/theme/theme-scope";
import { getDealerPresentation } from "@/server/homepage/service";

import { getPublicDealerContent } from "@/server/content/service";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  await connection();
  const [dealer, content] = await Promise.all([getDealerPresentation(), getPublicDealerContent()]);
  return (
    <ThemeScope className="public-storefront flex min-h-screen flex-col" overrides={{
      "--color-primary": normalizeThemeColor(dealer.primaryColor),
      "--color-accent": normalizeThemeColor(dealer.secondaryColor),
      "--color-background": "#FFFFFF",
      "--color-surface": "#FFFFFF",
      "--color-surface-secondary": "#F6F6F6",
      "--color-text-primary": "#171717",
      "--color-text-secondary": "#606060",
      "--color-border": "#E5E5E5",
    }}>
      <SiteHeader dealer={dealer} />
      <main className="flex-1">{children}</main>
      <SiteFooter dealer={dealer} hours={content.profile?.operatingHoursActive ? content.profile.operatingHours : undefined} />
    </ThemeScope>
  );
}
