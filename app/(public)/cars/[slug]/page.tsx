import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { buildVehicleSeoDescription, createVehicleWhatsappUrl } from "@/features/car-detail/domain";
import { VehicleGallery } from "@/features/car-detail/gallery";
import { buildVehicleStructuredData, serializeJsonLd } from "@/features/car-detail/seo";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { shouldShowMileage } from "@/features/homepage/domain";
import { formatMileage, formatRupiah } from "@/lib/format";
import { absoluteSiteUrl } from "@/lib/site-url";
import { getCarDetailPageData } from "@/server/car-detail/service";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCarDetailPageData(slug);
  if (result.kind !== "success") return { title: "Mobil Tidak Ditemukan", robots: { index: false, follow: false } };
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
  const result = await getCarDetailPageData(slug);
  if (result.kind === "not-found") notFound();
  if (result.kind === "error") return <PageContainer className="py-20"><div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center"><h1 className="text-2xl font-bold text-white">Detail mobil belum dapat dimuat</h1><p className="mt-3 text-zinc-300">Silakan coba kembali beberapa saat lagi.</p><Link className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 font-bold text-white" href="/cars">Kembali ke katalog</Link></div></PageContainer>;

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
      <nav aria-label="Breadcrumb" className="mb-7 text-sm text-zinc-400"><ol className="flex flex-wrap items-center gap-2"><li><Link className="hover:text-white" href="/">Beranda</Link></li><li aria-hidden="true">›</li><li><Link className="hover:text-white" href="/cars">Mobil</Link></li><li aria-hidden="true">›</li><li aria-current="page" className="truncate text-zinc-200">{car.title}</li></ol></nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <VehicleGallery images={car.images.map(({ id, url, alt }) => ({ id, url, alt }))} title={car.title} />
          <section className="mt-8"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">{car.condition === "NEW" ? "BARU" : "BEKAS"}</span><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">TERSEDIA</span></div><h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{car.title}</h1><p className="mt-4 text-3xl font-black text-red-400">{price}</p></section>

          <section className="mt-10 border-t border-white/10 pt-8"><h2 className="text-2xl font-bold text-white">Spesifikasi Mobil</h2><dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">{specifications.map(([label, value]) => <div className="flex justify-between gap-4 bg-zinc-950 p-4" key={label}><dt className="text-zinc-500">{label}</dt><dd className="text-right font-semibold text-zinc-100">{value}</dd></div>)}</dl></section>
          {car.description.trim() ? <section className="mt-10 border-t border-white/10 pt-8"><h2 className="text-2xl font-bold text-white">Deskripsi</h2><p className="mt-5 max-w-3xl whitespace-pre-line leading-8 text-zinc-300">{car.description}</p></section> : null}
        </main>

        <aside className="self-start rounded-2xl border border-white/10 bg-zinc-900 p-6 lg:sticky lg:top-24"><p className="text-sm font-bold uppercase tracking-wider text-red-400">Hubungi dealer</p><h2 className="mt-3 text-2xl font-black text-white">{dealer.dealerName}</h2><p className="mt-3 text-sm leading-6 text-zinc-400">Tanyakan ketersediaan dan informasi kendaraan ini langsung kepada tim penjualan.</p><div className="mt-5 grid gap-2 text-sm text-zinc-300">{dealer.phone ? <a className="hover:text-white" href={`tel:${dealer.phone}`}>{dealer.phone}</a> : null}{dealer.email ? <a className="hover:text-white" href={`mailto:${dealer.email}`}>{dealer.email}</a> : null}{dealer.address ? <address className="not-italic text-zinc-400">{dealer.address}</address> : null}</div>{whatsappUrl ? <a className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500" href={whatsappUrl} rel="noopener noreferrer" target="_blank">Chat WhatsApp tentang mobil ini</a> : dealer.phone ? <a className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-5 font-bold text-white" href={`tel:${dealer.phone}`}>Telepon Dealer</a> : <Link className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 font-bold text-white" href="/#contact">Lihat kontak dealer</Link>}</aside>
      </div>

      {related.length ? <section className="mt-16 border-t border-white/10 pt-12"><div className="flex items-end justify-between gap-5"><div><p className="text-sm font-bold uppercase tracking-wider text-red-400">Rekomendasi</p><h2 className="mt-2 text-3xl font-black text-white">Mobil Terkait</h2></div><Link className="font-semibold text-red-400" href="/cars">Lihat katalog →</Link></div><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <VehicleCard car={item} key={item.id} />)}</div></section> : null}
      {whatsappUrl ? <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 p-3 backdrop-blur lg:hidden"><a className="mx-auto flex min-h-12 max-w-md items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white focus-visible:outline-2 focus-visible:outline-white" href={whatsappUrl} rel="noopener noreferrer" target="_blank">Chat WhatsApp</a></div> : null}
    </PageContainer>
  );
}
