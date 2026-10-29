import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { QuickSearch } from "@/features/homepage/quick-search";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { getDealerPresentation, getHomepageData } from "@/server/homepage/service";
import { getPublicDealerContent } from "@/server/content/service";
import { BannerCarousel } from "@/features/content/banner-carousel";
import { visibleItems } from "@/features/content/domain";
import { AboutSection, AdvantagesSection, LeasingSection, FaqSection, DealerContact } from "@/features/content/public-sections";
export async function generateMetadata(): Promise<Metadata> {
  await connection(); const dealer=await getDealerPresentation();
  const title=`${dealer.dealerName} — Mobil Baru & Bekas`;
  const description=`Jelajahi mobil baru dan bekas yang tersedia dari ${dealer.dealerName}.`;
  return {title:{absolute:title},description,alternates:{canonical:"/"},openGraph:{type:"website",title,description,url:"/",...(dealer.logoUrl?{images:[{url:dealer.logoUrl,alt:`Logo ${dealer.dealerName}`}]}:{})}};
}
export default async function HomePage() {
  await connection();
  const [{featuredCars,latestCars,brands,dealer},content]=await Promise.all([getHomepageData(),getPublicDealerContent()]);
  const cars=[...featuredCars,...latestCars].slice(0,6);
  const main=visibleItems(content.items,"MAIN_BANNER"); const promos=visibleItems(content.items,"PROMO_BANNER");
  const profile=content.profile;
  return <>
    <h1 className="sr-only">{dealer.dealerName} — Mobil Baru & Bekas</h1>
    <BannerCarousel slides={main} priority />
    {profile?.welcomeActive && profile.welcomeTitle && profile.welcomeBody?<section className="py-12"><PageContainer><h2 className="text-3xl font-bold">{profile.welcomeTitle}</h2><p className="mt-4 max-w-3xl whitespace-pre-line leading-8 text-zinc-300">{profile.welcomeBody}</p></PageContainer></section>:null}
    <section className="py-8" aria-label="Pencarian mobil"><PageContainer><QuickSearch brands={brands} /></PageContainer></section>
    {promos.length?<section className="py-8" aria-label="Promo dealer"><PageContainer className="grid gap-5">{promos.map(slide=><BannerCarousel key={slide.id} slides={[slide]} label="Banner promo" />)}</PageContainer></section>:null}
    <section className="py-12"><PageContainer><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-3xl font-bold">Mobil Tersedia</h2><Link className="min-h-11 py-2 font-semibold text-red-300 focus-visible:outline-2 focus-visible:outline-white" href="/cars">Lihat Semua Mobil →</Link></div><div className="mt-5 flex gap-4"><Link href="/cars?condition=NEW" className="min-h-11 rounded-lg border border-white/20 px-4 py-3 focus-visible:outline-2 focus-visible:outline-white">Mobil Baru</Link><Link href="/cars?condition=USED" className="min-h-11 rounded-lg border border-white/20 px-4 py-3 focus-visible:outline-2 focus-visible:outline-white">Mobil Bekas</Link></div>{cars.length?<div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cars.map(car=><VehicleCard key={car.id} car={car} />)}</div>:<p className="mt-6 text-zinc-400">Belum ada mobil tersedia untuk ditampilkan.</p>}</PageContainer></section>
    <AboutSection content={content} /><AdvantagesSection content={content} /><LeasingSection content={content} /><FaqSection content={content} /><DealerContact dealer={dealer} hours={profile?.operatingHoursActive ? profile.operatingHours : undefined} />
  </>;
}
