import type { CSSProperties, ReactNode } from "react";
import { connection } from "next/server";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getDealerPresentation } from "@/server/homepage/service";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  await connection();
  const dealer = await getDealerPresentation();
  return (
    <div className="flex min-h-screen flex-col" style={{ "--accent": dealer.primaryColor ?? "#dc2626", "--brand-secondary": dealer.secondaryColor ?? "#18181b" } as CSSProperties}>
      <SiteHeader dealer={dealer} />
      <main className="flex-1">{children}</main>
      <SiteFooter dealer={dealer} />
    </div>
  );
}
