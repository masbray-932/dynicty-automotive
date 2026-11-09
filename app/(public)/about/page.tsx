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
  return <><PageContainer className="py-12 sm:py-16"><p className="public-eyebrow">Profil Perusahaan</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Tentang {dealer.dealerName}</h1></PageContainer><AboutSection content={content} full />{content.profile?.aboutActive?<PageContainer className="grid gap-10 py-14 md:grid-cols-2">{([['history','Sejarah'],['vision','Visi'],['mission','Misi'],['achievements','Pencapaian']] as const).map(([field,label])=>content.profile?.[field]?.trim()?<section className="rounded-lg border border-[#E5E5E5] bg-white p-7" key={field}><h2 className="text-2xl font-bold">{label}</h2><p className="mt-4 whitespace-pre-line leading-8 text-[#606060]">{content.profile[field]}</p></section>:null)}</PageContainer>:null}<AdvantagesSection content={content} /><DealerContact dealer={dealer} hours={content.profile?.operatingHoursActive ? content.profile.operatingHours : undefined} /></>;
}
