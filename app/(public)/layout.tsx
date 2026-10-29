import type { ReactNode } from "react";
import { connection } from "next/server";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ThemeScope } from "@/features/theme/theme-scope";
import { getDealerPresentation } from "@/server/homepage/service";

import { getPublicDealerContent } from "@/server/content/service";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  await connection();
  const [dealer, content] = await Promise.all([getDealerPresentation(), getPublicDealerContent()]);
  return (
    <ThemeScope className="flex min-h-screen flex-col" primaryColor={dealer.primaryColor} secondaryColor={dealer.secondaryColor}>
      <SiteHeader dealer={dealer} />
      <main className="flex-1">{children}</main>
      <SiteFooter dealer={dealer} hours={content.profile?.operatingHoursActive ? content.profile.operatingHours : undefined} />
    </ThemeScope>
  );
}
