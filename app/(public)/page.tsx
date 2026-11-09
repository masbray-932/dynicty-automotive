import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { QuickSearch } from "@/features/homepage/quick-search";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { getDealerPresentation, getHomepageData } from "@/server/homepage/service";
import { legacyStorefrontContext } from "@/server/storefront/context";
import { getPublicDealerContent } from "@/server/content/service";
import { BannerCarousel } from "@/features/content/banner-carousel";
import { visibleItems } from "@/features/content/domain";
import { AboutSection, AdvantagesSection, LeasingSection, FaqSection, DealerContact, TestimonialsSection } from "@/features/content/public-sections";
import { getHomepageServices } from "@/server/editorial/public";
import { EditorialCards } from "@/features/editorial/public-content";
export async function generateMetadata(): Promise<Metadata> {
  await connection(); const dealer=await getDealerPresentation();
  const title=`${dealer.dealerName} — Mobil Baru & Bekas`;
  const description=`Jelajahi mobil baru dan bekas yang tersedia dari ${dealer.dealerName}.`;
  return {title:{absolute:title},description,alternates:{canonical:"/"},openGraph:{type:"website",title,description,url:"/",...(dealer.logoUrl?{images:[{url:dealer.logoUrl,alt:`Logo ${dealer.dealerName}`}]}:{})}};
}
export default async function HomePage() {
  await connection();
  const [{featuredCars,latestCars,brands,dealer},content,services]=await Promise.all([getHomepageData(legacyStorefrontContext),getPublicDealerContent(),getHomepageServices()]);
  const cars=[...featuredCars,...latestCars].slice(0,6);
  const main=visibleItems(content.items,"MAIN_BANNER"); const promos=visibleItems(content.items,"PROMO_BANNER");
  const profile=content.profile;
  return <>
    <h1 className="sr-only">{dealer.dealerName} — Mobil Baru & Bekas</h1>
    <BannerCarousel slides={main} priority headline={profile?.welcomeActive ? profile.welcomeTitle : undefined} description={profile?.welcomeActive ? profile.welcomeBody : undefined} />
    <section className="relative z-10 -mt-3 py-8 sm:-mt-8" aria-label="Pencarian mobil"><PageContainer><QuickSearch brands={brands} /></PageContainer></section>
    {promos.length?<section className="public-section pt-8" aria-label="Promo Bulan Ini"><PageContainer className="grid gap-6"><div><p className="public-eyebrow">Penawaran Pilihan</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Promo Bulan Ini</h2></div>{promos.map(slide=><div className="overflow-hidden rounded-lg" key={slide.id}><BannerCarousel slides={[slide]} label="Banner promo" compact /></div>)}</PageContainer></section>:null}
    {brands.length?<section className="public-section bg-[#F6F6F6]"><PageContainer><p className="public-eyebrow">Jelajahi Koleksi</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Kategori Merek Mobil</h2><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{brands.map(brand=><Link key={brand.slug} href={`/cars?brand=${encodeURIComponent(brand.slug)}`} className="min-h-11 rounded border border-[#E5E5E5] bg-white p-5 font-semibold text-[#171717] transition hover:border-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus"><span className="block">{brand.name}</span><span className="mt-1 block text-xs font-normal text-[#606060]">{brand.availableCars} mobil tersedia</span></Link>)}</div></PageContainer></section>:null}
    <section className="public-section"><PageContainer><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="public-eyebrow">Koleksi Terbaru</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Daftar Stok Mobil</h2></div><Link className="min-h-11 py-2 text-xs font-extrabold uppercase tracking-wider text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus" href="/cars">Lihat Semua Mobil →</Link></div><div className="mt-6 flex gap-3"><Link href="/cars?condition=NEW" className="min-h-11 rounded border border-[#171717] px-4 py-3 text-xs font-bold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-brand-focus">Mobil Baru</Link><Link href="/cars?condition=USED" className="min-h-11 rounded border border-[#E5E5E5] px-4 py-3 text-xs font-bold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-brand-focus">Mobil Bekas</Link></div>{cars.length?<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cars.map(car=><VehicleCard key={car.id} car={car} />)}</div>:<p className="mt-8 rounded border border-dashed border-[#E5E5E5] bg-[#F6F6F6] p-8 text-center text-[#606060]">Belum ada mobil tersedia untuk ditampilkan.</p>}</PageContainer></section>
    {services.length?<section className="public-section bg-[#F6F6F6]"><PageContainer><p className="public-eyebrow">Perawatan &amp; Dukungan</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Layanan Showroom</h2><EditorialCards items={services} base="/services" headingLevel={3} /></PageContainer></section>:null}<AdvantagesSection content={content} /><TestimonialsSection content={content} /><LeasingSection content={content} /><AboutSection content={content} /><FaqSection content={content} /><DealerContact dealer={dealer} hours={profile?.operatingHoursActive ? profile.operatingHours : undefined} />
  </>;
}
