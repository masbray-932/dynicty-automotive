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
import Image from "next/image";
import { PublicSalesTeam } from "@/features/sales-team/public-sales-team";
import { getPublicSalesTeam } from "@/server/sales-team/service";
import { ScrollReveal } from "@/components/public/scroll-reveal";
import { formatStockUpdateDate } from "@/features/homepage/domain";
export async function generateMetadata(): Promise<Metadata> {
  await connection(); const dealer=await getDealerPresentation();
  const title=`${dealer.dealerName} — Mobil Baru & Bekas`;
  const description=`Jelajahi mobil baru dan bekas yang tersedia dari ${dealer.dealerName}.`;
  return {title:{absolute:title},description,alternates:{canonical:"/"},openGraph:{type:"website",title,description,url:"/",...(dealer.logoUrl?{images:[{url:dealer.logoUrl,alt:`Logo ${dealer.dealerName}`}]}:{})}};
}
export default async function HomePage() {
  await connection();
  const [{featuredCars,latestCars,brands,dealer,stockSummary={availableCount:0,lastUpdatedAt:null}},content,services,salesTeam]=await Promise.all([getHomepageData(legacyStorefrontContext),getPublicDealerContent(),getHomepageServices(),getPublicSalesTeam()]);
  const cars=[...featuredCars,...latestCars].slice(0,6);
  const main=visibleItems(content.items,"MAIN_BANNER"); const promos=visibleItems(content.items,"PROMO_BANNER");
  const profile=content.profile;
  return <>
    <h1 className="sr-only">{dealer.dealerName} — Mobil Baru & Bekas</h1>
    <BannerCarousel slides={main} priority headline={profile?.welcomeActive ? profile.welcomeTitle : undefined} description={profile?.welcomeActive ? profile.welcomeBody : undefined} />
    <section className="relative z-10 -mt-3 py-8 sm:-mt-8" aria-label="Pencarian mobil"><PageContainer><QuickSearch brands={brands} /></PageContainer></section>
    {promos.length||brands.length?<section className="public-section bg-[#F6F6F6]" aria-labelledby="brand-promo-title"><PageContainer><ScrollReveal><p className="public-eyebrow">Jelajahi Koleksi</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" id="brand-promo-title">Promo &amp; Kategori Merek</h2></ScrollReveal><div className={`mt-8 grid items-start gap-7 ${promos.length&&brands.length?"lg:grid-cols-[minmax(16rem,0.34fr)_minmax(0,0.66fr)]":""}`}>{promos.length?<ScrollReveal className="mx-auto w-full max-w-md min-w-0 lg:max-w-none"><div className="overflow-hidden rounded-lg border border-[#E5E5E5] bg-white"><BannerCarousel slides={promos} label="Banner promo" portrait linkSlides /></div></ScrollReveal>:null}{brands.length?<div><h3 className="text-xl font-bold text-[#171717]">Kategori Merek Mobil</h3><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{brands.map((brand,index)=><ScrollReveal className="h-full" delay={index*45} key={brand.slug}><Link href={`/cars?brand=${encodeURIComponent(brand.slug)}`} className="flex h-full min-h-32 flex-col items-center justify-center rounded border border-[#E5E5E5] bg-white p-3 text-center font-semibold text-[#171717] transition hover:-translate-y-0.5 hover:border-[#171717] hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-focus">{brand.logoUrl?<Image alt={`Logo ${brand.name}`} className="h-16 w-full object-contain" height={64} src={brand.logoUrl} unoptimized width={180} />:<span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-[#F1F1F1] text-xl font-black text-[#606060]">{brand.name.slice(0,1).toUpperCase()}</span>}<span className="mt-2 block">{brand.name}</span><span className="mt-0.5 block text-xs font-normal text-[#606060]">{brand.availableCars} mobil tersedia</span></Link></ScrollReveal>)}</div></div>:null}</div></PageContainer></section>:null}
    <section className="public-section"><PageContainer><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="public-eyebrow">Koleksi Terbaru</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Daftar Stok Mobil</h2><p className="mt-3 text-sm text-[#606060]"><strong className="text-[#171717]">{stockSummary.availableCount} mobil tersedia</strong>{formatStockUpdateDate(stockSummary.lastUpdatedAt)?` · Diperbarui ${formatStockUpdateDate(stockSummary.lastUpdatedAt)}`:" · Belum ada riwayat pembaruan stok"}</p></div><Link className="min-h-11 py-2 text-xs font-extrabold uppercase tracking-wider text-[#171717] focus-visible:outline-2 focus-visible:outline-brand-focus" href="/cars">Lihat Semua Mobil →</Link></div><div className="mt-6 flex gap-3"><Link href="/cars?condition=NEW" className="min-h-11 rounded border border-[#171717] px-4 py-3 text-xs font-bold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-brand-focus">Mobil Baru</Link><Link href="/cars?condition=USED" className="min-h-11 rounded border border-[#E5E5E5] px-4 py-3 text-xs font-bold uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-brand-focus">Mobil Bekas</Link></div>{cars.length?<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cars.map(car=><VehicleCard key={car.id} car={car} />)}</div>:<p className="mt-8 rounded border border-dashed border-[#E5E5E5] bg-[#F6F6F6] p-8 text-center text-[#606060]">Belum ada mobil tersedia untuk ditampilkan.</p>}</PageContainer></section>
    {services.length?<section className="public-section bg-[#F6F6F6]"><PageContainer><p className="public-eyebrow">Perawatan &amp; Dukungan</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Layanan Showroom</h2><EditorialCards items={services} base="/services" headingLevel={3} /></PageContainer></section>:null}<AdvantagesSection content={content} dealerName={dealer.dealerName} defaultContent /><TestimonialsSection content={content} /><PublicSalesTeam members={salesTeam} /><LeasingSection content={content} /><AboutSection content={content} /><FaqSection content={content} /><DealerContact dealer={dealer} hours={profile?.operatingHoursActive ? profile.operatingHours : undefined} />
  </>;
}
