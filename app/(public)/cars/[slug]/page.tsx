import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { WhatsAppLink } from "@/components/public/whatsapp-link";
import { buildVehicleSeoDescription, createVehicleWhatsappUrl } from "@/features/car-detail/domain";
import { VehicleGallery } from "@/features/car-detail/gallery";
import { buildVehicleStructuredData, serializeJsonLd } from "@/features/car-detail/seo";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { shouldShowMileage } from "@/features/homepage/domain";
import { formatMileage, formatRupiah } from "@/lib/format";
import { absoluteSiteUrl } from "@/lib/site-url";
import { getCarDetailPageData } from "@/server/car-detail/service";
import { legacyStorefrontContext } from "@/server/storefront/context";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCarDetailPageData(legacyStorefrontContext, slug);
  if (result.kind === "not-found") notFound();
  if (result.kind === "error") return { title: "Detail Mobil Tidak Tersedia", robots: { index: false, follow: false } };
  const description = buildVehicleSeoDescription({ title: result.car.title, transmission: result.car.transmission, dealerName: result.dealer.dealerName });
  return {
    title: { absolute: `${result.car.title} | ${result.dealer.dealerName}` },
    description,
    alternates: { canonical: `/cars/${result.car.slug}` },
    openGraph: {
      type: "website", title: `${result.car.title} | ${result.dealer.dealerName}`, description, url: `/cars/${result.car.slug}`,
      images: [{ url: result.car.images[0]?.url ?? "/images/car-placeholder.svg", alt: result.car.images[0]?.alt ?? `Placeholder foto ${result.car.title}` }],
    },
  };
}

export default async function CarDetailPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const result = await getCarDetailPageData(legacyStorefrontContext, slug);
  if (result.kind === "not-found") notFound();
  if (result.kind === "error") return <PageContainer className="py-20"><div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center"><h1 className="text-2xl font-bold text-[#171717]">Detail mobil belum dapat dimuat</h1><p className="mt-3 text-[#606060]">Silakan coba kembali beberapa saat lagi.</p><Link className="mt-6 inline-flex rounded bg-brand-primary px-5 py-3 font-bold text-brand-on-primary" href="/cars">Kembali ke katalog</Link></div></PageContainer>;

  const { car, dealer, related } = result;
  const price = formatRupiah(car.price);
  const publicUrl = absoluteSiteUrl(`/cars/${car.slug}`);
  const whatsappUrl = createVehicleWhatsappUrl(dealer.whatsappNumber, { title: car.title, price, url: publicUrl });
  const specifications = [
    ["Kondisi", car.condition === "NEW" ? "Baru" : "Bekas"], ["Merek", car.brand.name], ["Model", car.model.name], ["Varian", car.variant],
    ["Tahun", String(car.year)], ["Transmisi", car.transmission], ["Bahan bakar", car.fuelType], ["Warna", car.color],
    ...(shouldShowMileage(car.condition, car.mileage) ? [["Jarak tempuh", formatMileage(car.mileage!)]] : []),
  ];
  const structuredData = buildVehicleStructuredData({
    title: car.title,
    description: car.description || buildVehicleSeoDescription({ title: car.title, transmission: car.transmission, dealerName: dealer.dealerName }),
    condition: car.condition,
    brand: car.brand.name,
    model: car.model.name,
    year: car.year,
    price: car.price,
    transmission: car.transmission,
    fuelType: car.fuelType,
    mileage: car.mileage,
    images: car.images.map((image) => image.url),
    url: publicUrl,
  });

  return (
    <PageContainer className={`py-8 sm:py-12 ${whatsappUrl ? "pb-28 lg:pb-16" : ""}`}>
      <script dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} type="application/ld+json" />
      <nav aria-label="Breadcrumb" className="mb-7 text-sm text-[#606060]"><ol className="flex flex-wrap items-center gap-2"><li><Link className="hover:text-[#171717]" href="/">Beranda</Link></li><li aria-hidden="true">›</li><li><Link className="hover:text-[#171717]" href="/cars">Mobil</Link></li><li aria-hidden="true">›</li><li aria-current="page" className="truncate text-[#171717]">{car.title}</li></ol></nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <VehicleGallery images={car.images.map(({ id, url, alt }) => ({ id, url, alt }))} title={car.title} />
          <section className="mt-8"><div className="flex flex-wrap items-center gap-3"><span className="rounded-sm bg-[#C8102E] px-3 py-1 text-[10px] font-extrabold tracking-wider text-white">{car.condition === "NEW" ? "BARU" : "BEKAS"}</span><span className="rounded-sm border border-[#E5E5E5] bg-[#F6F6F6] px-3 py-1 text-[10px] font-extrabold tracking-wider text-[#171717]">TERSEDIA</span></div><h1 className="mt-4 text-3xl font-bold tracking-tight text-[#171717] sm:text-5xl">{car.title}</h1><p className="mt-4 text-3xl font-extrabold tabular-nums text-[#C8102E]">{price}</p></section>

          <section className="mt-10 border-t border-[#E5E5E5] pt-8"><h2 className="text-2xl font-bold text-[#171717]">Spesifikasi Mobil</h2><dl className="mt-5 grid gap-px overflow-hidden rounded-lg border border-[#E5E5E5] bg-[#E5E5E5] sm:grid-cols-2">{specifications.map(([label, value]) => <div className="flex justify-between gap-4 bg-white p-4" key={label}><dt className="text-[#606060]">{label}</dt><dd className="text-right font-semibold text-[#171717]">{value}</dd></div>)}</dl></section>
          {car.description.trim() ? <section className="mt-10 border-t border-[#E5E5E5] pt-8"><h2 className="text-2xl font-bold text-[#171717]">Deskripsi</h2><p className="mt-5 max-w-3xl whitespace-pre-line leading-8 text-[#606060]">{car.description}</p></section> : null}
        </main>

        <aside className="self-start rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] p-6 lg:sticky lg:top-24"><p className="public-eyebrow">Hubungi dealer</p><h2 className="mt-3 text-2xl font-bold text-[#171717]">{dealer.dealerName}</h2><p className="mt-3 text-sm leading-6 text-[#606060]">Tanyakan ketersediaan dan informasi kendaraan ini langsung kepada tim penjualan.</p><div className="mt-5 grid gap-2 text-sm text-[#606060]">{dealer.phone ? <a className="font-semibold text-[#171717]" href={`tel:${dealer.phone}`}>{dealer.phone}</a> : null}{dealer.email ? <a className="font-semibold text-[#171717]" href={`mailto:${dealer.email}`}>{dealer.email}</a> : null}{dealer.address ? <address className="not-italic text-[#606060]">{dealer.address}</address> : null}</div>{whatsappUrl ? <WhatsAppLink className="mt-6 flex min-h-12" href={whatsappUrl}>Chat WhatsApp tentang mobil ini</WhatsAppLink> : dealer.phone ? <a className="mt-6 flex min-h-12 items-center justify-center rounded bg-brand-primary px-5 font-bold text-brand-on-primary" href={`tel:${dealer.phone}`}>Telepon Dealer</a> : <Link className="mt-6 flex min-h-12 items-center justify-center rounded border border-[#171717] px-5 font-bold text-[#171717]" href="/#contact">Lihat kontak dealer</Link>}</aside>
      </div>

      {related.length ? <section className="mt-16 border-t border-[#E5E5E5] pt-12"><div className="flex items-end justify-between gap-5"><div><p className="public-eyebrow">Rekomendasi</p><h2 className="mt-2 text-3xl font-bold text-[#171717]">Mobil Terkait</h2></div><Link className="font-semibold text-[#C8102E]" href="/cars">Lihat katalog →</Link></div><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <VehicleCard car={item} key={item.id} />)}</div></section> : null}
      {whatsappUrl ? <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"><WhatsAppLink className="mx-auto flex min-h-12 max-w-md" href={whatsappUrl}>Chat WhatsApp</WhatsAppLink></div> : null}
    </PageContainer>
  );
}
