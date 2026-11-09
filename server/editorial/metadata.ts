import "server-only";
import type { Metadata } from "next";
import { getDealerPresentation } from "@/server/homepage/service";
export async function publicMetadata(title: string, description: string, canonical: string, filtered = false): Promise<Metadata> {
  const dealer = await getDealerPresentation();
  return { title: { absolute: `${title} — ${dealer.dealerName}` }, description, alternates: { canonical }, ...(filtered ? { robots: { index: false, follow: true } } : {}), openGraph: { title: `${title} — ${dealer.dealerName}`, description, url: canonical, type: "website" } };
}
