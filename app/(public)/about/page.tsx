import type { Metadata } from "next";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { getDealerPresentation } from "@/server/homepage/service";
import { getPublicDealerContent } from "@/server/content/service";
import { AboutSection, AdvantagesSection, DealerContact } from "@/features/content/public-sections";
export async function generateMetadata():Promise<Metadata> {
  await connection();const [dealer,content]=await Promise.all([getDealerPresentation(),getPublicDealerContent()]);
  const title=`Tentang ${dealer.dealerName}`;
  const description=content.profile?.aboutActive && content.profile.aboutSummary ? content.profile.aboutSummary.slice(0,160) : `Profil dan informasi kontak ${dealer.dealerName}.`;
  return {title:{absolute:title},description,alternates:{canonical:"/about"},openGraph:{title,description,url:"/about",type:"website"}};
}
export default async function AboutPage() {
  await connection();const [dealer,content]=await Promise.all([getDealerPresentation(),getPublicDealerContent()]);
  return <><PageContainer className="pt-12"><h1 className="text-4xl font-bold">Tentang {dealer.dealerName}</h1></PageContainer><AboutSection content={content} full /><AdvantagesSection content={content} /><DealerContact dealer={dealer} hours={content.profile?.operatingHoursActive ? content.profile.operatingHours : undefined} /></>;
}
