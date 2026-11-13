import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { ActiveFilters, CatalogFilterForm, CatalogPagination, SortControl } from "@/features/catalog/catalog-controls";
import { buildCatalogUrl, isCatalogIndexable, parseCatalogFilters, type RawCatalogSearchParams } from "@/features/catalog/domain";
import { VehicleCard } from "@/features/homepage/vehicle-card";
import { getCatalogData } from "@/server/catalog/service";
import { legacyStorefrontContext } from "@/server/storefront/context";

type PageProps = { searchParams: Promise<RawCatalogSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const indexable = isCatalogIndexable(raw);
  return {
    title: "Daftar Mobil Baru & Bekas",
    description: "Jelajahi daftar mobil baru dan bekas yang tersedia serta gunakan filter untuk menemukan pilihan yang sesuai.",
    alternates: { canonical: "/cars" },
    openGraph: { type: "website", title: "Daftar Mobil Baru & Bekas", description: "Jelajahi mobil baru dan bekas yang tersedia.", url: "/cars" },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CarsPage({ searchParams }: PageProps) {
  await connection();
  const parsed = parseCatalogFilters(await searchParams);
  const data = await getCatalogData(legacyStorefrontContext, parsed);
  const title = parsed.filters.condition === "NEW" ? "Mobil Baru" : parsed.filters.condition === "USED" ? "Mobil Bekas" : "Daftar Mobil";

  return (
    <PageContainer className="py-12 sm:py-16">
      <header className="mb-8 border-b border-[#E5E5E5] pb-8">
        <p className="public-eyebrow">Katalog kendaraan</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#171717] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#606060]">Temukan mobil yang tersedia berdasarkan kondisi, merek, harga, tahun, transmisi, dan kebutuhan Anda.</p>
      </header>

      {parsed.issues.length ? <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status"><p className="font-bold">Beberapa parameter disesuaikan:</p><ul className="mt-2 list-disc pl-5">{parsed.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div> : null}
      {data.databaseUnavailable ? <div className="mb-6 rounded border border-red-200 bg-red-50 p-5 text-red-900" role="alert"><p className="font-bold">Katalog belum dapat dimuat.</p><p className="mt-1 text-sm">Silakan coba kembali beberapa saat lagi.</p></div> : null}
      {data.invalidCombination ? <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">{data.invalidCombination}</div> : null}

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-[#E5E5E5] bg-[#F6F6F6] p-5 lg:sticky lg:top-24">
          <h2 className="mb-5 text-lg font-bold text-[#171717]">Filter Mobil</h2>
          <CatalogFilterForm brands={data.brands} filters={parsed.filters} transmissions={data.transmissions} />
        </aside>

        <section aria-labelledby="catalog-results" className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-[#E5E5E5] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold text-[#171717]" id="catalog-results">Hasil Pencarian</h2><p aria-live="polite" className="mt-1 text-sm text-[#606060]">{data.total} mobil ditemukan</p></div>
            <SortControl filters={parsed.filters} />
          </div>
          <div className="my-5"><ActiveFilters brands={data.brands} filters={parsed.filters} /></div>

          {data.outOfRange ? (
            <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-[#F6F6F6] px-6 py-12 text-center"><h2 className="text-xl font-bold text-[#171717]">Halaman tidak tersedia</h2><p className="mt-2 text-[#606060]">Katalog hanya memiliki {data.totalPages} halaman untuk filter ini.</p><div className="mt-5 flex justify-center gap-3"><Link className="rounded bg-brand-primary px-5 py-3 font-bold text-brand-on-primary" href={buildCatalogUrl(parsed.filters, { page: data.totalPages }, false)}>Ke halaman terakhir</Link><Link className="rounded border border-[#171717] px-5 py-3 font-bold text-[#171717]" href="/cars">Reset filter</Link></div></div>
          ) : data.cars.length ? (
            <><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.cars.map((car) => <VehicleCard car={car} key={car.id} />)}</div><CatalogPagination filters={parsed.filters} totalPages={data.totalPages} /></>
          ) : (
            <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-[#F6F6F6] px-6 py-12 text-center"><h2 className="text-xl font-bold text-[#171717]">Belum ada mobil yang sesuai dengan filter Anda.</h2><p className="mt-2 text-[#606060]">Coba kurangi filter atau lihat seluruh inventori yang tersedia.</p><Link className="mt-5 inline-flex rounded bg-brand-primary px-5 py-3 font-bold text-brand-on-primary hover:brightness-90" href="/cars">Lihat semua mobil</Link></div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
